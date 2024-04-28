import { Field, Bool, Poseidon, PrivateKey } from "o1js";
import { dummyBase64Proof } from "o1js/dist/node/lib/proof_system";
import { Pickles } from "o1js/dist/node/snarky";
import { Consts } from "../src/lib/consts";


/** INTERNAL IMPORTS  */
import { AttackFleet, CreatePlanetPublicOutput, DefendPlanetPublicOutput, PlanetaryDefense } from "../src/lib/models";
import { CreatePlanetProof } from "../src/proofs/createPlanetProof";
import { DefendPlanetProof } from "../src/proofs/defendPlanetProof";

/** MOCK PLAYERS */
export const alicePrivateKey = PrivateKey.random();
export const alice = alicePrivateKey.toPublicKey();

export const bobPrivateKey = PrivateKey.random();
export const bob = bobPrivateKey.toPublicKey();

export const charliePrivateKey = PrivateKey.random();
export const charlie = charliePrivateKey.toPublicKey();

/** MOCK DATA FOR TESTING PLANET CREATION */
export const valid_coords = {x: Field(150), y: Field(28)};
export const valid_faction = Consts.FACTION_C;
export const valid_coords2 = {x: Field(213), y: Field(270)};
export const valid_faction2 = Consts.FACTION_B;

/** MOCK DATA FOR TESTING PLANETARY DEFENSE */
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


/** MOCK DATA FOR TESTING PLANET CREATION
* @note: the attackerHomePlanet is the locationHash of the planet being attacked,
* even of the fleet is valid, the attackerHomePlanetstill needs to be a valid locationHash
*/

export const invalid_locationhash = Field(999999921345);

export const valid_attack_fleet = new AttackFleet({
    attackingFaction: Field(2),
    battleships: Field(500),
    destroyers: Field(300),
    carriers: Field(250)
});

export const invalid_attack_fleet_valid_faction = new AttackFleet({
    attackingFaction: Field(150),
    battleships: Field(50000),
    destroyers: Field(3000),
    carriers: Field(2500)
});

export const valid_attack_fleet_invalid_faction = new AttackFleet({
  attackingFaction: Field(150),
  battleships: Field(5),
  destroyers: Field(5),
  carriers: Field(5)
});

/** MOCK PROOFS */
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