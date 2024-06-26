import { Field, Poseidon } from 'o1js';

/** INTERNAL IMPORTS */

import { Consts } from '../lib/consts';
import { Errors } from '../lib/errors';

export class CreatePlanetUtils {
    
  static calculateLocationHash(x: Field, y: Field): Field {
    let currentHash = Poseidon.hash([x, y]);
    for (let i = 1; i < Consts.CHAIN_HASH_TIMES; i++) {
      currentHash = Poseidon.hash([currentHash, currentHash]);
    }
    return currentHash;
  }

  static verifyCoordinate(x: Field, y: Field) {
    x.assertLessThanOrEqual(
      Consts.MAX_GAME_MAP_LENGTH,
      Errors.COORDINATE_OUT_OF_RANGE
    );
    y.assertLessThanOrEqual(
      Consts.MAX_GAME_MAP_LENGTH,
      Errors.COORDINATE_OUT_OF_RANGE
    );
  }

  static verifyFaction(faction: Field) {
    faction.assertLessThanOrEqual(Field(3), Errors.INVALID_FACTION);
  }

  static verifySuitableCoordinates(x: Field, y: Field) {
    const locationHash = this.calculateLocationHash(x, y);
    locationHash.assertLessThanOrEqual(
      Consts.BIRTHING_DIFFICULTY_CUTOFF,
      Errors.COORDINATE_NOT_SUITABLE
    );
  }
}