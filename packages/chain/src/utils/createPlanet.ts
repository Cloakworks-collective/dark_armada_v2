import { Field, Poseidon, MerkleMapWitness } from 'o1js';

import { Consts } from '../consts';
import { Errors } from '../errors';

export class CreatePlanetUtils {
    
  static calculateLocationHash(x: Field, y: Field): Field {
    let locationHash = Poseidon.hash([x, y]);
    for (let i = 0; i < Consts.CHAIN_HASH_TIMES; i++) {
      locationHash = Poseidon.hash([locationHash, Field(i)]);
    }
    return locationHash;
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

  static verifyMaxPlanets(numPlanets: Field) {
    numPlanets.assertLessThanOrEqual(
      Consts.MAX_NUM_PLANETS,
      Errors.MAX_NUM_PLANETS
    );
  }

  static verifySuitableCoordinates(x: Field, y: Field) {
    const locationHash = this.calculateLocationHash(x, y);
    locationHash.assertLessThanOrEqual(
      Consts.BIRTHING_DIFFICULTY_CUTOFF,
      Errors.COORDINATE_NOT_SUITABLE
    );
  }

  static verifyLocationHasNoPlanet(
    x: Field,
    y: Field,
    locationNullifierRoot: Field,
    locationNullifierWitness: MerkleMapWitness
  ) {
    const locationHash = this.calculateLocationHash(x, y);
    const [derivedLocRoot, derivedLocKey] =
      locationNullifierWitness.computeRootAndKey(Consts.EMPTY_FIELD);
    derivedLocRoot.assertEquals(
      locationNullifierRoot,
      Errors.PLANET_ALREADY_EXISTS_AT_THIS_LOCATION
    );
    derivedLocKey.assertEquals(
      locationHash,
      Errors.PLANET_ALREADY_EXISTS_AT_THIS_LOCATION
    );
  }

  static verifyPlayerHasNoPlanet(
    playerId: Field,
    playerNullifierRoot: Field,
    playerNullifierWitness: MerkleMapWitness
  ) {
    const [derivedPlayerRoot, derivedPlayerKey] =
      playerNullifierWitness.computeRootAndKey(Consts.EMPTY_FIELD);
    derivedPlayerRoot.assertEquals(
      playerNullifierRoot,
      Errors.PLAYER_HAS_PLANET
    );
    derivedPlayerKey.assertEquals(playerId, Errors.PLAYER_HAS_PLANET);
  }
}