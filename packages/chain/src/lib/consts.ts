import { Field } from 'o1js';
import { UInt64 } from '@proto-kit/library';

/** INTERNAL IMPORTS */
export namespace Consts {
  // empty values
 export const EMPTY_FIELD = Field(0);
 export const EMPTY_UINT64 = UInt64.from(0); 

  // filled values
  export const FILLED = Field(1);

  // game constants
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

  // crew values
  export const BATTLESHIP_CREW = Field(100);
  export const DESTROYER_CREW = Field(50);
  export const CARRIER_CREW = Field(150);

  // max strength values
  export const MAX_DEFENSE_CREW = Field(100000); //100_000
  export const MAX_ATTACK_STRENGTH = Field(1000);

  // forfeit const
  // @note: 24 hours in milliseconds
  export const FORFEIT_CLAIM_DURATION = UInt64.from(86400000); 

  // factions const
  export const FACTION_A = Field(1);
  export const FACTION_B = Field(2);
  export const FACTION_C = Field(3);
}