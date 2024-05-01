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

    describe("attack planet runtime method", () => {
        let aliceLocationHash: Field;
        let bobLocationHash: Field;
        let charlieLocationHash: Field;

        beforeAll(async () => {
            let tx: any

            // Alice creates a planet
            const validCreatePlanetProof = await createPlanetMockProof(planetValidator(
                valid_coords.x,
                valid_coords.y,
                valid_faction
            ));

            appChain.setSigner(alicePrivateKey);
            tx = await appChain.transaction(alice, () => {
                game.createPlanet(validCreatePlanetProof);
            });

            await tx.sign();
            await tx.send();
            await appChain.produceBlock();

            // Alice defends her planet
            const validDefenseProof = await defendPlanetMockProof(defenseValidator(
                valid_defense,
                salt
            ));
            aliceLocationHash = validCreatePlanetProof.publicOutput.locationHash;

            tx = await appChain.transaction(alice, () => {
                game.defendPlanet(
                    aliceLocationHash,
                    validDefenseProof
                );
            });

            await tx.sign();
            await tx.send();
            await appChain.produceBlock();

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

            // Charlie creates a planet - but never defends it
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

            charlieLocationHash = validCreatePlanetProofCharlie.publicOutput.locationHash;
        });

        it("validates that the defending planet exists", async () => {
            //Bob tries to attack a planet that does not exist
            appChain.setSigner(bobPrivateKey);
            const tx = await appChain.transaction(bob, () => {
                game.launchAttack(
                    bobLocationHash,
                    invalid_locationhash,
                    valid_bob_attack_fleet
                    
                );
            });

            await tx.sign();
            await tx.send();
            const block = await appChain.produceBlock();

            expect(block?.transactions[0].status.toBoolean()).toBe(false);
            expect(block?.transactions[0].statusMessage).toBe(Errors.NO_DEFENDING_PLANET_FOUND);
        });

        it("validates that the attacking homeworld exists", async () => {
            //Bob tries to attack alice's planet but gives wrong location hash for his homeworld
            appChain.setSigner(bobPrivateKey);
            const tx = await appChain.transaction(bob, () => {
                game.launchAttack(
                    invalid_locationhash,
                    aliceLocationHash,
                    valid_bob_attack_fleet
                );
            });

            await tx.sign();
            await tx.send();
            const block = await appChain.produceBlock();

            expect(block?.transactions[0].status.toBoolean()).toBe(false);
            expect(block?.transactions[0].statusMessage).toBe(Errors.NO_ATTACKER_HOMEWORLD);
        });

        it("validates that the attacker owns the attacking homeworld", async () => {
            // Bob tries to attack Alice's planet, but sets charlie's location hash as his homeworld

            appChain.setSigner(bobPrivateKey);
            const tx = await appChain.transaction(bob, () => {
                game.launchAttack(
                    charlieLocationHash,
                    aliceLocationHash,
                    valid_charlie_attack_fleet
                );
            });

            await tx.sign();
            await tx.send();
            const block = await appChain.produceBlock();

            expect(block?.transactions[0].status.toBoolean()).toBe(false);
            expect(block?.transactions[0].statusMessage).toBe(Errors.PLAYER_HAS_NO_ACCESS);
        });

        it("validates that the player is not attacking their own planet", async () => {
            // Bob tries to attack his own planet
            appChain.setSigner(bobPrivateKey);
            const tx = await appChain.transaction(bob, () => {
                game.launchAttack(
                    bobLocationHash,
                    bobLocationHash,
                    valid_bob_attack_fleet
                );
            });

            await tx.sign();
            await tx.send();
            const block = await appChain.produceBlock();

            expect(block?.transactions[0].status.toBoolean()).toBe(false);
            expect(block?.transactions[0].statusMessage).toBe(Errors.CANNOT_ATTACK_OWN_PLANET);
        });

        it("validates attacking homeworld has a defense set", async () => {
            // Charlie tries to attack Alice's planet - but he never defended his own planet
            appChain.setSigner(charliePrivateKey);
            const tx = await appChain.transaction(charlie, () => {
                game.launchAttack(
                    charlieLocationHash,
                    aliceLocationHash,
                    valid_charlie_attack_fleet
                );
            });

            await tx.sign();
            await tx.send();
            const block = await appChain.produceBlock();

            expect(block?.transactions[0].status.toBoolean()).toBe(false);
            expect(block?.transactions[0].statusMessage).toBe(Errors.ATTACKER_HAS_NO_DEFENSE);
        });

        it("validates defending homeworld has a defense set", async () => {
            // Bob tries to attack Charlie's planet - but Charlie never defended his planet
            appChain.setSigner(bobPrivateKey);
            const tx = await appChain.transaction(bob, () => {
                game.launchAttack(
                    bobLocationHash,
                    charlieLocationHash,
                    valid_bob_attack_fleet
                );
            });

            await tx.sign();
            await tx.send();
            const block = await appChain.produceBlock();

            expect(block?.transactions[0].status.toBoolean()).toBe(false);
            expect(block?.transactions[0].statusMessage).toBe(Errors.DEFENDER_HAS_NO_DEFENSE);
        });

        it("validates defending homeworld is not under attack already", async () => {
            // charlie defends his planet
            const validDefenseProofCharlie = await defendPlanetMockProof(defenseValidator(
                valid_defense,
                salt
            ));

            appChain.setSigner(charliePrivateKey);
            const tx = await appChain.transaction(charlie, () => {
                game.defendPlanet(
                    charlieLocationHash,
                    validDefenseProofCharlie
                );
            });

            await tx.sign();
            await tx.send();
            await appChain.produceBlock();

            // Alice attacks Charlie's planet
            appChain.setSigner(alicePrivateKey);
            const tx2 = await appChain.transaction(alice, () => {
                game.launchAttack(
                    aliceLocationHash,
                    charlieLocationHash,
                    valid_alice_attack_fleet
                );
            });

            await tx2.sign();
            await tx2.send();
            const block = await appChain.produceBlock();

            expect(block?.transactions[0].status.toBoolean()).toBe(true);

            // Bob tries to attack Charlie's planet - but it is already under attack from Alice
            appChain.setSigner(bobPrivateKey);
            const tx3 = await appChain.transaction(bob, () => {
                game.launchAttack(
                    bobLocationHash,
                    charlieLocationHash,
                    valid_bob_attack_fleet
                );
            });

            await tx3.sign();
            await tx3.send();
            const block2 = await appChain.produceBlock();

            expect(block2?.transactions[0].status.toBoolean()).toBe(false);
            expect(block2?.transactions[0].statusMessage).toBe(Errors.PLANET_UNDER_ATTACK);
        });

        it("validates the strength of the attacking fleet", async () => {
            // Alice tries to attack Bob's planet with a fleet strength greater than the max allowed
            appChain.setSigner(alicePrivateKey);

            const tx = await appChain.transaction(alice, () => {
                game.launchAttack(
                    aliceLocationHash,
                    bobLocationHash,
                    invalid_attack_fleet
                );
            });

            await tx.sign();
            await tx.send();
            const block = await appChain.produceBlock();

            expect(block?.transactions[0].status.toBoolean()).toBe(false);
            expect(block?.transactions[0].statusMessage).toBe(Errors.ATTACK_FLEET_COST);
        });

        it("stores an incoming valid attack", async () => {
            // Bob attacks Alice's planet
            appChain.setSigner(bobPrivateKey);
            const tx = await appChain.transaction(bob, () => {
                game.launchAttack(
                    bobLocationHash,
                    aliceLocationHash,
                    valid_bob_attack_fleet
                );
            });

            await tx.sign();
            await tx.send();
            const block = await appChain.produceBlock();

            expect(block?.transactions[0].status.toBoolean()).toBe(true);

            const storedPlanetDetails = await appChain.query.runtime.GameRuntime.planetDetails.get(aliceLocationHash);
            const networkState = await appChain.query.network.unproven;
            const currentBlockHeight = networkState!.block.height


            // check that the incoming attack is stored correctly
            expect(storedPlanetDetails?.incomingAttack).toMatchObject(valid_bob_attack_fleet);

            // check that the incoming attack time is stored correctly
            expect(storedPlanetDetails?.incomingAttackTime).toMatchObject(currentBlockHeight.value);

            // check that the attacker location hash is stored correctly
            expect(storedPlanetDetails?.incomingAttack.attackerHash).toMatchObject(bobLocationHash);
        });

    });

});