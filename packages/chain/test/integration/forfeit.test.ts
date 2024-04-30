import { Field, Bool, Poseidon, PrivateKey } from "o1js";

import { AppChain, TestingAppChain } from "@proto-kit/sdk";
import { log } from "@proto-kit/common";
import { UInt64 } from "@proto-kit/library";

/** INTERNAL IMPORTS  */
import { GameRuntime, EMPTY_ATTACK_FLEET } from "../../src/runtimeModules/game";
import { Planet, PlanetaryDefense } from "../../src/lib/models";
import { Consts } from "../../src/lib/consts";
import { Errors } from "../../src/lib/errors";
import { planetValidator } from "../../src/proofs/createPlanetProof";
import { defenseValidator} from "../../src/proofs/defendPlanetProof";
import { computeBattle } from "../../src/proofs/battleProof";
import {
    alicePrivateKey,
    alice,
    bobPrivateKey,
    bob,
    charliePrivateKey,
    charlie,
    valid_coords,
    valid_faction,
    valid_defense,
    invalid_defense,
    salt,
    valid_alice_attack_fleet,
    valid_bob_attack_fleet,
    valid_charlie_attack_fleet,
    invalid_attack_fleet,
    invalid_locationhash,
    createPlanetMockProof, 
    defendPlanetMockProof, 
    computeBattleMockProof,
    valid_coords2,
    valid_faction2,
    valid_coords3,
    valid_faction3
} from "../testUtils";
import { CreatePlanetUtils } from "../../src/utils/createPlanet";

log.setLevel("ERROR");

describe("game runtime", () => {

    let appChain = TestingAppChain.fromRuntime({
        GameRuntime,
    });
    let game: GameRuntime;
    
    appChain.configurePartial({
        Runtime: {
            GameRuntime: {},
            Balances: {},
        },
    });

    beforeAll(async () => {
        await appChain.start();
        game = appChain.runtime.resolve("GameRuntime");
    });

    describe("create planet runtime method", () => {
        it ("creates a planet by verifying valid proof", async () => {
            const validProof = await createPlanetMockProof(planetValidator(
                valid_coords.x,
                valid_coords.y,
                valid_faction
            ));

            appChain.setSigner(alicePrivateKey);
            const tx = await appChain.transaction(alice, () => {
                game.createPlanet(validProof);
            });

            await tx.sign();
            await tx.send();
        
            const block = await appChain.produceBlock();

            const numberOfPlanets = await appChain.query.runtime.GameRuntime.numberOfPlanets.get();
            const storedPlanetDetails = await appChain.query.runtime.
                GameRuntime.planetDetails.
                get(validProof.publicOutput.locationHash)

            expect(block?.transactions[0].status.toBoolean()).toBe(true);

            // check that the number of planets has increased by one
            expect(numberOfPlanets).toMatchObject(Field(1));

            // check that the planet details are stored correctly
            expect(storedPlanetDetails?.faction).toMatchObject(valid_faction);
            expect(storedPlanetDetails?.owner).toMatchObject(alice);
            expect(storedPlanetDetails?.locationHash).toMatchObject(validProof.publicOutput.locationHash);
            expect(storedPlanetDetails?.defenseHash).toMatchObject(Consts.EMPTY_FIELD);
            expect(storedPlanetDetails?.defenseManpower).toMatchObject(Consts.EMPTY_FIELD);
            expect(storedPlanetDetails?.incomingAttack).toMatchObject(EMPTY_ATTACK_FLEET);
            expect(storedPlanetDetails?.incomingAttackTime).toEqual(Consts.EMPTY_FIELD);
            expect(storedPlanetDetails?.points).toMatchObject(Consts.INITIAL_POINTS);

            // check the nullifiers
            const playerNullifier = await appChain.query.runtime.GameRuntime.playerNullifier.get(alice);
            const locationNullifier = await appChain.query.runtime.GameRuntime.locationNullifier.get(validProof.publicOutput.locationHash);

            expect(playerNullifier).toMatchObject(Bool(true));
            expect(locationNullifier).toMatchObject(Bool(true));

        });
    });

    describe("forfeit planet runtime method", () => {
            
            let aliceLocationHash: Field;
            let bobLocationHash: Field;
            let charlieLocationHash: Field;
    
            beforeAll(async () => {
                let tx: any
    
                // Bob creates a planet
                const validCreatePlanetProofBob = await createPlanetMockProof(planetValidator(
                    valid_coords2.x,
                    valid_coords2.y,
                    valid_faction2
                ));

                appChain.setSigner(bobPrivateKey);
                tx = await appChain.transaction(bob, () => {
                    game.createPlanet(validCreatePlanetProofBob);
                });

                await tx.sign();
                await tx.send();
                await appChain.produceBlock();

                // Bob defends his planet
                const validDefenseProofBob = await defendPlanetMockProof(defenseValidator(
                    valid_defense,
                    salt
                ));
                bobLocationHash = validCreatePlanetProofBob.publicOutput.locationHash;

                tx = await appChain.transaction(bob, () => {
                    game.defendPlanet(
                        bobLocationHash,
                        validDefenseProofBob
                    );
                });

                await tx.sign();
                await tx.send();
                await appChain.produceBlock();

                // Charlie creates a planet 
                const validCreatePlanetProofCharlie = await createPlanetMockProof(planetValidator(
                    valid_coords3.x,
                    valid_coords3.y,
                    valid_faction3
                ));

                appChain.setSigner(charliePrivateKey);
                tx = await appChain.transaction(charlie, () => {
                    game.createPlanet(validCreatePlanetProofCharlie);
                });

                await tx.sign();
                await tx.send();
                await appChain.produceBlock();

                // charlie defends his planet
                const validDefenseProofCharlie = await defendPlanetMockProof(defenseValidator(
                    valid_defense,
                    salt
                ));
                charlieLocationHash = validCreatePlanetProofCharlie.publicOutput.locationHash;

                tx = await appChain.transaction(charlie, () => {
                    game.defendPlanet(
                        charlieLocationHash,
                        validDefenseProofCharlie
                    );
                });

                await tx.sign();
                await tx.send();
                await appChain.produceBlock();

                // Bob attacks Charlie's planet
                appChain.setSigner(bobPrivateKey);

                const tx2 = await appChain.transaction(bob, () => {
                    game.launchAttack(
                        bobLocationHash,
                        charlieLocationHash,
                        valid_bob_attack_fleet
                    );
                });

                await tx2.sign();
                await tx2.send();

                await appChain.produceBlock();
    
            });
    
            it("validates that the planet exists", async () => {

                //Bob tries to forfeit a planet that does not exist
                appChain.setSigner(bobPrivateKey);
                const tx = await appChain.transaction(bob, () => {
                    game.forfeitPlanet(
                        invalid_locationhash
                    );
                });

                await tx.sign();
                await tx.send();
                const block = await appChain.produceBlock();

                expect(block?.transactions[0].status.toBoolean()).toBe(false);
                expect(block?.transactions[0].statusMessage).toBe(Errors.NO_DEFENDING_PLANET_FOUND);
            });

            it("validates that the planet is under attack", async () => {

                // Bob tries to forfeit his planet, which is not under attack
                appChain.setSigner(bobPrivateKey);
                const tx = await appChain.transaction(bob, () => {
                    game.forfeitPlanet(
                        bobLocationHash
                    );
                });

                await tx.sign();
                await tx.send();
                const block = await appChain.produceBlock();

                expect(block?.transactions[0].status.toBoolean()).toBe(false);
                expect(block?.transactions[0].statusMessage).toBe(Errors.PLANET_NOT_UNDER_ATTACK);
            });

            it("validates that the attacker is calling", async () => {
                // Alice tries to call forfeit on Charlie's planet, which is under attack by Bob
                appChain.setSigner(alicePrivateKey);

                const tx = await appChain.transaction(alice, () => {
                    game.forfeitPlanet(
                        charlieLocationHash
                    );
                });

                await tx.sign();
                await tx.send();

                const block = await appChain.produceBlock();

                expect(block?.transactions[0].status.toBoolean()).toBe(false);
                expect(block?.transactions[0].statusMessage).toBe(Errors.NOT_ATTACKER);
            });

            it("validates at the forfeight time has passed", async () => {

                // Bob tries to forfeit Charlie's planet before the forfeit time has passed
                appChain.setSigner(bobPrivateKey);
                const tx = await appChain.transaction(bob, () => {
                    game.forfeitPlanet(
                        charlieLocationHash
                    );
                });

                await tx.sign();
                await tx.send();
                const block = await appChain.produceBlock();

                expect(block?.transactions[0].status.toBoolean()).toBe(false);
                expect(block?.transactions[0].statusMessage).toBe(Errors.FORFEIT_CLAIM_DURATION);
            });
            
            it("forfeits the planet and updates the states", async () => {
                
                // Bob forfeits Charlie's planet after the forfeit time has passed

                appChain.setSigner(bobPrivateKey);

                // wait for the forfeit time to pass
                for (let i = 0; i < 10; i++) {
                    await appChain.produceBlock();
                }

                const tx = await appChain.transaction(bob, () => {
                    game.forfeitPlanet(
                        charlieLocationHash
                    );
                });

                await tx.sign();
                await tx.send();
                const block = await appChain.produceBlock();

                expect(block?.transactions[0].status.toBoolean()).toBe(true);

                const storedABobDetails = await appChain.query.runtime.GameRuntime.planetDetails.get(bobLocationHash);
                const storedCharlieDetails = await appChain.query.runtime.GameRuntime.planetDetails.get(charlieLocationHash);

                // check that defending planet is penalized
                expect(storedABobDetails?.points).toMatchObject(Consts.INITIAL_POINTS.add(Consts.WIN_POINTS));
                expect(storedCharlieDetails?.points).toMatchObject(Consts.INITIAL_POINTS.sub(Consts.FORFEIT_POINTS));

                // check that the incoming attack is removed after the planet is forfeited
                expect(storedCharlieDetails?.incomingAttack).toMatchObject(EMPTY_ATTACK_FLEET);
                expect(storedCharlieDetails?.incomingAttackTime).toEqual(Consts.EMPTY_FIELD);
            });
    });
    
});