import { Field, Bool, Poseidon, PrivateKey } from "o1js";
import { dummyBase64Proof } from "o1js/dist/node/lib/proof_system";
import { Pickles } from "o1js/dist/node/snarky";
import { Consts } from "../src/lib/consts";


/** INTERNAL IMPORTS  */
import { CreatePlanetPublicOutput, DefendPlanetPublicOutput, PlanetaryDefense } from "../src/lib/models";
import { CreatePlanetProof } from "../src/proofs/createPlanetProof";
import { DefendPlanetProof } from "../src/proofs/defendPlanetProof";

// generate different test players
export const alicePrivateKey = PrivateKey.random();
export const alice = alicePrivateKey.toPublicKey();

export const bobPrivateKey = PrivateKey.random();
export const bob = bobPrivateKey.toPublicKey();

export const charliePrivateKey = PrivateKey.random();
export const charlie = charliePrivateKey.toPublicKey();

// data for creating a planet tests
export const valid_coords = {x: Field(150), y: Field(28)};
export const valid_faction = Consts.FACTION_C;

// data for defending a planet tests
export const valid_defense = new PlanetaryDefense({
    battleships: Field(400), 
    destroyers: Field(300), 
    carriers: Field(225) 
});
export const invalid_defense = new PlanetaryDefense({
    battleships: Field(500),
    destroyers: Field(300),
    carriers: Field(250)
});
export const salt = Field(69);

 export async function createPlanetMockProof(
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

export async function defendPlanetMockProof(
    publicOutput: DefendPlanetPublicOutput
  ): Promise<DefendPlanetProof> {
    const [, proof] = Pickles.proofOfBase64(await dummyBase64Proof(), 2);

    return new DefendPlanetProof({
      proof: proof,
      maxProofsVerified: 2,
      publicInput: undefined,
      publicOutput: publicOutput,
    });
}