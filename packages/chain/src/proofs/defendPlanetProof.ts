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
    DefendPlanetUtils.verifyStrength(defense);

    const defenseHash = DefendPlanetUtils.calculateDefenseHash(defense, salt);
    const strength = defense.strength();

    return new DefendPlanetPublicOutput({
      defenseHash,
      strength
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