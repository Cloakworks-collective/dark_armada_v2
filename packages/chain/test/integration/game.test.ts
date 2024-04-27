import { Field, Bool, Poseidon, PrivateKey } from "o1js";
import { dummyBase64Proof } from "o1js/dist/node/lib/proof_system";
import { Pickles } from "o1js/dist/node/snarky";

import { TestingAppChain } from "@proto-kit/sdk";
import { log } from "@proto-kit/common";
import { UInt64 } from "@proto-kit/library";

/** INTERNAL IMPORTS  */
import { GameRuntime } from "../../src/runtimeModules/game";
import {  Planet, CreatePlanetPublicOutput } from "../../src/lib/models";
import { Consts } from "../../src/lib/consts";
import { Errors } from "../../src/lib/errors";
import { CreatePlanetProof, planetValidator } from "../../src/proofs/createPlanetProof";

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

    const alicePrivateKey = PrivateKey.random();
    const alice = alicePrivateKey.toPublicKey();

    const bobPrivateKey = PrivateKey.random();
    const bob = bobPrivateKey.toPublicKey();

    const charliePrivateKey = PrivateKey.random();
    const charlie = charliePrivateKey.toPublicKey();

    const valid_coords = {x: Field(150), y: Field(28)};
    const valid_faction = Consts.FACTION_C;

    async function mockProof(
        publicOutput: CreatePlanetPublicOutput
      ): Promise<CreatePlanetProof> {
        const [, proof] = Pickles.proofOfBase64(await dummyBase64Proof(), 2);
    
        return new CreatePlanetProof({
          proof: proof,
          maxProofsVerified: 2,
          publicInput: undefined,
          publicOutput: publicOutput,
        });
    }

    beforeAll(async () => {
        await appChain.start();
        game = appChain.runtime.resolve("GameRuntime");
    });

    describe("create planet runtime method", () => {

        it ("creates a planet by verifying valid proof", async () => {
            const validProof = await mockProof(planetValidator(
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
            expect(storedPlanetDetails?.defenseStrength).toMatchObject(Consts.EMPTY_FIELD);
            expect(storedPlanetDetails?.incomingAttack).toMatchObject(Consts.EMPTY_ATTACK_FLEET);
            // expect(storedPlanetDetails?.incomingAttackTime).toBe(Consts.EMPTY_UINT64);
            expect(storedPlanetDetails?.points).toMatchObject(Consts.EMPTY_FIELD);

            // check the nullifiers
            const playerNullifier = await appChain.query.runtime.GameRuntime.playerNullifier.get(alice);
            const locationNullifier = await appChain.query.runtime.GameRuntime.locationNullifier.get(validProof.publicOutput.locationHash);

            expect(playerNullifier).toMatchObject(Bool(true));
            expect(locationNullifier).toMatchObject(Bool(true));

        });
    
        it("validates that the user does not have a homeworld already", async () => {
            const validProof = await mockProof(planetValidator(
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
            const validProof = await mockProof(planetValidator(
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

    

});