import { 
    Field, 
    Experimental
 } from 'o1js';

/** UNTERNAL IMPORTS  */
import { DefendPlanetPublicOutput, PlanetaryDefense } from "../lib/models";
import { DefendPlanetUtils } from '../utils/defendPlanet';

export function defenseValidator(
  defense: PlanetaryDefense,
  salt: Field
): DefendPlanetPublicOutput {

    // verify defense has valid strength
    DefendPlanetUtils.verifyCost(defense);

    const defenseHash = DefendPlanetUtils.calculateDefenseHash(defense, salt);
    const crewNeeded = defense.totalCost();

    return new DefendPlanetPublicOutput({
        defenseHash, 
        crewNeeded
    });
  };
 
  /**
   * Defend Planet Validator
   * 
   * This program is used to validate the user inputs for creating a planet.
   * publicOutput: DefendPlanetPublicOutput {defenseHash, strength }
   * 
   * privateInputs: [PlanetaryDefense, salt]
   * 
   * @note: a salt is used to make the hash more secure
   * if there is no salt, the hash could be brute forced
   */
  export const defendPlanetValidator = Experimental.ZkProgram({
    key: 'defend-planet-validator',
    publicOutput: DefendPlanetPublicOutput,

    methods: {
      verifyUserInputs: {
        privateInputs: [PlanetaryDefense, Field],
        method: defenseValidator,
      },
    },
  });

  export let DefendPlanetProof_ = Experimental.ZkProgram.Proof(defendPlanetValidator);
  export class DefendPlanetProof extends DefendPlanetProof_ {}