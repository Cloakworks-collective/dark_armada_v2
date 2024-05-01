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

    describe("defend planet runtime method", () => {

        it("allows planet defense with valid ownership and defense proof", async () => {

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
            const validLocationHash = validCreatePlanetProof.publicOutput.locationHash;

            tx = await appChain.transaction(alice, () => {
                game.defendPlanet(
                    validLocationHash,
                    validDefenseProof
                );
            });

            await tx.sign();
            await tx.send();
            await appChain.produceBlock();

            const storedPlanetDetails = await appChain.query.runtime.GameRuntime.planetDetails.get(validLocationHash);

            // check that the defense hash is stored correctly
            expect(storedPlanetDetails?.defenseHash).toMatchObject(validDefenseProof.publicOutput.defenseHash);
            expect(storedPlanetDetails?.defenseManpower).toMatchObject(valid_defense.totalCost());
        });

        it("validates that the planet exists", async () => {

            const validDefenseProof = await defendPlanetMockProof(defenseValidator(
                valid_defense,
                salt
            ));

            // random location where no planet exists
            const invalid_location_hash = CreatePlanetUtils.calculateLocationHash(Field(100), Field(100));

            // Bob tries to defend a planet that does not exist
            appChain.setSigner(bobPrivateKey);
            const tx = await appChain.transaction(bob, () => {
                game.defendPlanet(
                    invalid_location_hash,
                    validDefenseProof
                );
            });

            await tx.sign();
            await tx.send();
            const block = await appChain.produceBlock();

            expect(block?.transactions[0].status.toBoolean()).toBe(false);
            expect(block?.transactions[0].statusMessage).toBe(Errors.PLANET_DOES_NOT_EXIST_HERE);
        });


        it ("validates that the player has access to the planet", async () => {
            const validDefenseProof = await defendPlanetMockProof(defenseValidator(
                valid_defense,
                salt
            ));
            const validLocationHash = CreatePlanetUtils.calculateLocationHash(valid_coords.x, valid_coords.y);

            // Bob tries to defend Alice's planet - which he does not own
            appChain.setSigner(bobPrivateKey);
            const tx = await appChain.transaction(bob, () => {
                game.defendPlanet(
                    validLocationHash,
                    validDefenseProof
                );
            });

            await tx.sign();
            await tx.send();
            const block = await appChain.produceBlock();

            expect(block?.transactions[0].status.toBoolean()).toBe(false);
            expect(block?.transactions[0].statusMessage).toBe(Errors.PLAYER_HAS_NO_ACCESS);
        })

    });

});