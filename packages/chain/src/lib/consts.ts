import { Field, UInt64 } from 'o1js';

/** INTERNAL IMPORTS */
import { AttackFleet } from '../lib/models';

export namespace Consts {
  // empty values
  export const EMPTY_FIELD = Field(0);
  export const EMPTY_ATTACK_FLEET = new AttackFleet({
    attackerHomePlanet: Field(0),
    battleships: Field(0),
    destroyers: Field(0),
    carriers: Field(0),
  })

  // filled values
  export const FILLED = Field(1);

  // game constants
  export const MAX_NUM_PLANETS = 1000;
  // @note: initiates 10000 x 10000 grid
  export const MAX_GAME_MAP_LENGTH = Field(10000); 
  // @note: normal poseidon hash is 77 characters long - Field(10**76),
  // so we use 10**72, or four 0s infront
  export const BIRTHING_DIFFICULTY_CUTOFF = Field(10**72)
  export const CHAIN_HASH_TIMES = 10;
  export const WIN_POINTS = Field(2);
  export const LOSE_POINTS = Field(1);
  export const FORFEIT_POINTS = Field(2);

  // fleet values
  export const BATTLESHIP_STRENGTH = Field(4);
  export const DESTROYER_STRENGTH = Field(2);
  export const CARRIER_STRENGTH = Field(6);
  export const MAX_DEFENSE_STRENGTH = Field(1000);
  export const MAX_ATTACK_STRENGTH = Field(1000);

  // forfeit const
  // @note: 24 hours in milliseconds
  export const FORFEIT_CLAIM_DURATION = UInt64.from(86400000); 

  // factions const
  export const FACTION_A = Field(1);
  export const FACTION_B = Field(2);
  export const FACTION_C = Field(3);
}