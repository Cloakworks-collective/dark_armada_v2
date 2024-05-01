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
    
    describe("resolve attack runtime method", () => {

        let aliceLocationHash: Field;
        let bobLocationHash: Field;

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

            // Alice attacks Bob's planet
            appChain.setSigner(alicePrivateKey);

            const tx2 = await appChain.transaction(alice, () => {
                game.launchAttack(
                    aliceLocationHash,
                    bobLocationHash,
                    valid_alice_attack_fleet
                );
            });

            await tx2.sign();
            await tx2.send();
            await appChain.produceBlock();

        });

        it("validates that the defending planet exists", async () => {

            //Bob tries compute the result of an attack on a planet that does not exist
            const validBattleProof = await computeBattleMockProof(computeBattle(
                valid_alice_attack_fleet,
                valid_defense,
                salt
            ),valid_alice_attack_fleet);

            appChain.setSigner(bobPrivateKey);
            const tx = await appChain.transaction(bob, () => {
                game.resolveAttack(
                    invalid_locationhash,
                    validBattleProof
                );
            });

            await tx.sign();
            await tx.send();
            const block = await appChain.produceBlock();

            expect(block?.transactions[0].status.toBoolean()).toBe(false);
            expect(block?.transactions[0].statusMessage).toBe(Errors.NO_DEFENDING_PLANET_FOUND);
        });


        it("validates that the caller owns the defending planet", async () => {

            // Charlie tries to resolve an attack on Bob's planet
            const validBattleProof = await computeBattleMockProof(computeBattle(
                valid_alice_attack_fleet,
                valid_defense,
                salt
            ),valid_alice_attack_fleet);

            appChain.setSigner(charliePrivateKey);
            const tx = await appChain.transaction(charlie, () => {
                game.resolveAttack(
                    bobLocationHash,
                    validBattleProof
                );
            });

            await tx.sign();
            await tx.send();
            const block = await appChain.produceBlock();

            expect(block?.transactions[0].status.toBoolean()).toBe(false);
            expect(block?.transactions[0].statusMessage).toBe(Errors.PLAYER_HAS_NO_ACCESS);
        });

        it("validates that the defense has not been tampered with in the computation", async () => {
            // Bob tries to resolve an attack on his planet with an invalid defense proof

            const invalidBattleProof = await computeBattleMockProof(computeBattle(
                valid_alice_attack_fleet,
                invalid_defense,
                salt
            ),valid_alice_attack_fleet);

            appChain.setSigner(bobPrivateKey);
            const tx = await appChain.transaction(bob, () => {
                game.resolveAttack(
                    bobLocationHash,
                    invalidBattleProof
                );
            });

            await tx.sign();
            await tx.send();
            const block = await appChain.produceBlock();

            expect(block?.transactions[0].status.toBoolean()).toBe(false);
            expect(block?.transactions[0].statusMessage).toBe(Errors.DEFENSE_DOES_NOT_MATCH);
        });

        it("validates that the attack has not been tampered with in the computation", async () => {
            
            // Bob tries to resolve an attack on his planet with an invalid attack 

            const invalidBattleProof = await computeBattleMockProof(computeBattle(
                invalid_attack_fleet,
                valid_defense,
                salt
            ),invalid_attack_fleet);

            appChain.setSigner(bobPrivateKey);
            const tx = await appChain.transaction(bob, () => {
                game.resolveAttack(
                    bobLocationHash,
                    invalidBattleProof
                );
            });

            await tx.sign();
            await tx.send();
            const block = await appChain.produceBlock();

            expect(block?.transactions[0].status.toBoolean()).toBe(false);
            expect(block?.transactions[0].statusMessage).toBe(Errors.ATTACK_DOES_NOT_MATCH);
        });

        it("updates the states based on the battle result", async () => {
            // Bob resolves the attack on his planet with a valid proof
            // Case where attak wins
            const validBattleProof = await computeBattleMockProof(computeBattle(
                valid_alice_attack_fleet,
                valid_defense,
                salt
            ),valid_alice_attack_fleet);

            appChain.setSigner(bobPrivateKey);
            const tx = await appChain.transaction(bob, () => {
                game.resolveAttack(
                    bobLocationHash,
                    validBattleProof
                );
            });

            await tx.sign();
            await tx.send();
            const block = await appChain.produceBlock();


            expect(block?.transactions[0].status.toBoolean()).toBe(true);

            const storedABobDetails = await appChain.query.runtime.GameRuntime.planetDetails.get(bobLocationHash);
            const storedAAliceDetails = await appChain.query.runtime.GameRuntime.planetDetails.get(aliceLocationHash);

            // check that the defense hash is stored correctly after the attack is resolved (Alice wins)
            expect(storedAAliceDetails?.points).toMatchObject(Consts.INITIAL_POINTS.add(Field(1)));
            expect(storedABobDetails?.points).toMatchObject(Consts.INITIAL_POINTS.sub(Field(1)));

            // check that the attack is removed after the attack is resolved
            expect(storedABobDetails?.incomingAttack).toMatchObject(EMPTY_ATTACK_FLEET);
            expect(storedABobDetails?.incomingAttackTime).toEqual(Consts.EMPTY_FIELD);

        });

    });

});