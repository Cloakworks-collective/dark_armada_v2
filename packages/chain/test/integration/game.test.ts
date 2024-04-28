import { Field, Bool, Poseidon, PrivateKey } from "o1js";

import { AppChain, TestingAppChain } from "@proto-kit/sdk";
import { log } from "@proto-kit/common";
import { UInt64 } from "@proto-kit/library";

/** INTERNAL IMPORTS  */
import { GameRuntime, EMPTY_ATTACK_FLEET } from "../../src/runtimeModules/game";
import { PlanetaryDefense } from "../../src/lib/models";
import { Consts } from "../../src/lib/consts";
import { Errors } from "../../src/lib/errors";
import { CreatePlanetProof, planetValidator } from "../../src/proofs/createPlanetProof";
import { defenseValidator} from "../../src/proofs/defendPlanetProof";
import {
    alicePrivateKey,
    alice,
    bobPrivateKey,
    bob,
    valid_coords,
    valid_faction,
    valid_defense,
    invalid_defense,
    salt,
    createPlanetMockProof, 
    defendPlanetMockProof 
} from "../testUtils";
import { CreatePlanetUtils } from "../../src/utils/createPlanet";
import exp from "constants";

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
                get(validProof.publicOutput.locationHash);

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
            // expect(storedPlanetDetails?.incomingAttackTime).toBe(Consts.EMPTY_UINT64);
            expect(storedPlanetDetails?.points).toMatchObject(Consts.EMPTY_FIELD);

            // check the nullifiers
            const playerNullifier = await appChain.query.runtime.GameRuntime.playerNullifier.get(alice);
            const locationNullifier = await appChain.query.runtime.GameRuntime.locationNullifier.get(validProof.publicOutput.locationHash);

            expect(playerNullifier).toMatchObject(Bool(true));
            expect(locationNullifier).toMatchObject(Bool(true));

        });
    
        it("validates that the user does not have a homeworld already", async () => {
            const validProof = await createPlanetMockProof(planetValidator(
                valid_coords.x,
                valid_coords.y,
                valid_faction
            ));

            // Alice tries to create a planet AGAIN! 
            appChain.setSigner(alicePrivateKey);
            const tx = await appChain.transaction(alice, () => {
                game.createPlanet(validProof);
            });

            await tx.sign();
            await tx.send();
        
            const block = await appChain.produceBlock();

            expect(block?.transactions[0].status.toBoolean()).toBe(false);
            expect(block?.transactions[0].statusMessage).toBe(Errors.PLAYER_HAS_PLANET);

        });
    
        it("validates that the coordinates were not used by another planet", async () => {
            const validProof = await createPlanetMockProof(planetValidator(
                valid_coords.x,
                valid_coords.y,
                valid_faction
            ));

            // Bob tries to create a planet where Alice has Homeworld! 
            appChain.setSigner(bobPrivateKey);
            const tx = await appChain.transaction(bob, () => {
                game.createPlanet(validProof);
            });

            await tx.sign();
            await tx.send();
        
            const block = await appChain.produceBlock();

            expect(block?.transactions[0].status.toBoolean()).toBe(false);
            expect(block?.transactions[0].statusMessage).toBe(Errors.PLANET_ALREADY_EXISTS_AT_THIS_LOCATION);
        });
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
            expect(storedPlanetDetails?.defenseManpower).toMatchObject(valid_defense.totalCrewNeeded());
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