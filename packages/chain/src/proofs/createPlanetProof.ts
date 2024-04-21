import { 
    Field, 
    Poseidon, 
    Experimental
 } from 'o1js';

import { CreatePlanetPublicOutput } from "../lib/models";
import { CreatePlanetUtils } from '../utils/createPlanet';

export function planetValidator(
  x: Field, 
  y: Field, 
  faction: Field
): CreatePlanetPublicOutput {

    // verify co-ordinates are within the game map
    CreatePlanetUtils.verifyCoordinate(x, y);

    // verify faction is valid
    CreatePlanetUtils.verifyFaction(faction);

    // verify co-ordinates are suitable (check hash difficulty)
    CreatePlanetUtils.verifySuitableCoordinates(x, y);

    const locationHash = CreatePlanetUtils.calculateLocationHash(x, y);

    return new CreatePlanetPublicOutput({
      locationHash,
      faction
    });
  };
 
  /**
   * Create Planet Validator
   * 
   * This program is used to validate the user inputs for creating a planet.
   * publicOutput: CreatePlanetPublicOutput {locationHash, Faction }
   * 
   * privateInputs; [x, y, faction]
   * 
   */
  export const createPlanetValidator = Experimental.ZkProgram({
    key: 'create-planet-validator',
    publicOutput: CreatePlanetPublicOutput,

    methods: {
      verifyUserInputs: {
        privateInputs: [Field, Field, Field],
        method: planetValidator,
      },
    },
  });

  export let CreatePlanetProof_ = Experimental.ZkProgram.Proof(createPlanetValidator);
  export class CratePlanetProof extends CreatePlanetProof_ {}