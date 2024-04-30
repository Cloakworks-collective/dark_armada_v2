import { Field, PrivateKey, PublicKey } from "o1js";
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
export const valid_coords3 = {x: Field(307), y: Field(343)};
export const valid_faction3 = Consts.FACTION_A;

export const valid_defense_hash = Field(3334729777580927688747490806230569009184039221907836141353265208667850978072n); 

/** MOCK DATA FOR TESTING PLANETARY DEFENSE */
export const valid_defense = new PlanetaryDefense({
    battleships: Field(40), 
    destroyers: Field(20), 
    carriers: Field(10),
    odps: Field(100)
});
export const invalid_defense = new PlanetaryDefense({
    battleships: Field(500),
    destroyers: Field(300),
    carriers: Field(250),
    odps: Field(100)
});
export const salt = Field(69);


/** MOCK DATA FOR TESTING PLANET CREATION
* @note: the attackerHomePlanet is the locationHash of the planet being attacked,
* even of the fleet is valid, the attackerHomePlanetstill needs to be a valid locationHash
*/

export const invalid_locationhash = Field(999999921345);

export const valid_alice_attack_fleet = new AttackFleet({
    attackingFaction: valid_faction,
    battleships: Field(40),
    destroyers: Field(20),
    carriers: Field(10),
    troopTransports: Field(50)
});

export const valid_bob_attack_fleet = new AttackFleet({
  attackingFaction: valid_faction2,
  battleships: Field(20),
  destroyers: Field(50),
  carriers: Field(10),
  troopTransports: Field(50)
});

export const valid_charlie_attack_fleet = new AttackFleet({
  attackingFaction: valid_faction3,
  battleships: Field(10),
  destroyers: Field(50),
  carriers: Field(10),
  troopTransports: Field(50)
});

export const invalid_attack_fleet = new AttackFleet({
    attackingFaction: valid_faction,
    battleships: Field(50000),
    destroyers: Field(30000),
    carriers: Field(25000),
    troopTransports: Field(10000)
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