import { 
    Field, 
    Experimental
 } from 'o1js';

/** UNTERNAL IMPORTS  */
import { BattlePublicOutput } from "../lib/models";
import { BattleUtils } from '../utils/battle';

export function computeBattle(
  x: Field, 
  y: Field, 
  faction: Field
): BattlePublicOutput {



    return new BattlePublicOutput({
      locationHash,
      faction
    });
  };
 
  /**
   * Battle Validator
   * 
   * This program is used to validate the user inputs for creating a planet.
   * publicOutput: CreatePlanetPublicOutput {locationHash, Faction }
   * 
   * privateInputs; [x, y, faction]
   * 
   */
  export const battleValidator = Experimental.ZkProgram({
    key: 'battle-validator',
    publicOutput: BattlePublicOutput,

    methods: {
      verifyUserInputs: {
        privateInputs: [Field, Field, Field],
        method: computeBattle,
      },
    },
  });

  export let BattleProof_ = Experimental.ZkProgram.Proof(battleValidator);
  export class BattleProof extends BattleProof_ {}