import { 
    Field, 
    Experimental
 } from 'o1js';

/** INTERNAL IMPORTS  */

import { 
    AttackFleet, 
    BattlePublicOutput, 
    PlanetaryDefense 
} from "../lib/models";

import { BattleUtils } from '../utils/battle';
import { DefendPlanetUtils } from '../utils/defendPlanet';

export function computeBattle(
    attackingFleet: AttackFleet,
    defense: PlanetaryDefense,
    salt: Field,
): BattlePublicOutput {

    const didDefenseWin = BattleUtils.computeSimpleWinner(
        attackingFleet, 
        defense
    );

    const defenseHash = DefendPlanetUtils.calculateDefenseHash(
        defense, 
        salt
    );

    return new BattlePublicOutput({
        didDefenseWin, 
        defenseHash,
        attackingFleet
    });
  };
 
  /**
   * Battle Validator
   * 
   * This program is use compute winner in a battle.
   * publicOutput: BattlePublicOutput {DidDefenseWin, defense hash, attacking fleet}
   * 
   * publicInputs: AttackFleet
   * privateInputs; [defense, salt]
   * 
   * @note: the program returns the winner, and the defense hash
   * and the attacking fleet. The defense hash and the attacking fleet
   * output are then used in the runtime module to verify that those
   * values were not tampered with.
   * 
   */
  export const battleValidator = Experimental.ZkProgram({
    key: 'battle-validator',
    publicInput: AttackFleet,
    publicOutput: BattlePublicOutput,

    methods: {
      verifyUserInputs: {
        privateInputs: [PlanetaryDefense, Field],
        method: computeBattle,
      },
    },
  });

  export let BattleProof_ = Experimental.ZkProgram.Proof(battleValidator);
  export class BattleProof extends BattleProof_ {}