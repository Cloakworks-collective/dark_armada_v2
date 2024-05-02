import { Field } from 'o1js';
import { UInt64 } from '@proto-kit/library';

/** INTERNAL IMPORTS */
export namespace Consts {
  // empty values
 export const EMPTY_FIELD = Field(0);
 export const EMPTY_UINT64 = UInt64.from(0); 

  // filled values
  export const FILLED = Field(1);
  export const INITIAL_POINTS = Field(1000);

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

  // forfeit const
  // @note: assuming each block is 10 seconds
  // 24 hours - 8640 blocks (10 seconds per block)
  export const FORFEIT_BLOCKS_DURATION = 8640 

  // used for testing purposes
  export const TEST_FORFEIT_BLOCKS_DURATION = 5; 

  // factions const
  export const FACTION_A = Field(1);
  export const FACTION_B = Field(2);
  export const FACTION_C = Field(3);

  /** UNIT CONSTANTS */

  // fleet values
  export const BATTLESHIP_STRENGTH = Field(4);
  export const DESTROYER_STRENGTH = Field(2);
  export const CARRIER_STRENGTH = Field(6);

  // unit costs
  export const DESTROYER_COST = Field(10000);
  export const BATTLESHIP_COST = Field(50000);
  export const CARRIER_COST = Field(500000);
  export const ODP_COST = Field(20000);
  export const TROOP_TRANSPORT = Field(40000);

  // max strength values
  export const MAX_DEFENSE_COST = Field(10000000); //10_000_000
  export const MAX_ATTACK_COST = Field(10000000); //10_000_000

  /** COMPLEX BATTLE CONSTS */

  // fleet missile launches - how many missiles can be launched in a single salvo
  export const BATTLESHIP_MISSILE_CAP = UInt64.from(40);
  export const DESTROYER_MISSILE_CAP = UInt64.from(30);

  // Number of missile salvos fleet can launch
  export const NUMBER_OF_MISSILE_SALVOS = UInt64.from(5);

  // Interceptor capacity - how many interceptors can be launched in a single salvo
  export const BATTLESHIP_INTERCEPTOR_CAP = UInt64.from(20);
  export const DESTROYER_INTERCEPTOR_CAP = UInt64.from(16);
  export const CARRIER_INTERCEPTOR_CAP = UInt64.from(60);

  // Number of interceptor salvos fleet can launch
  export const NUMBER_OF_INTERCEPTOR_SALVOS = UInt64.from(5);

  // PDC (Point Defense Cannon) saturation capacity 
  export const BATTLESHIP_PDC_CAP = UInt64.from(300);
  export const DESTROYER_PDC_CAP = UInt64.from(200);
  export const CARRIER_PDC_CAP = UInt64.from(500);

  // Carrier/Troop Transport/Dropship capacity
  // how many fighters, drones, dropships and troops can be carried
  export const CARRIER_FIGHTERS = UInt64.from(50);
  export const CARRIER_DRONE = UInt64.from(200);
  export const TROOP_TRANSPORT_DROPSHIPS = UInt64.from(500);
  export const DROPSHIP_TROOPS = UInt64.from(500);


  // units attack strength
  export const BATTLESHIP_ATTACK = UInt64.from(500);
  export const DESTROYER_ATTACK = UInt64.from(300);
  export const CARRIER_ATTACK = UInt64.from(100);
  export const FIGHTER_ATTACK = UInt64.from(10);
  export const DRONE_ATTACK = UInt64.from(5);
  export const TROOP_TRANSPORT_ATTACK = UInt64.from(0);
  export const DROPSHIP_ATTACK = UInt64.from(10);
  export const ODP_ATTACK = UInt64.from(50);

  // units health 
  export const BATTLESHIP_HEALTH = UInt64.from(800);
  export const DESTROYER_HEALTH = UInt64.from(200);
  export const CARRIER_HEALTH = UInt64.from(400);
  export const FIGHTER_HEALTH = UInt64.from(10);
  export const DRONE_HEALTH = UInt64.from(5);
  export const TROOP_TRANSPORT_HEALTH = UInt64.from(100);
  export const DROPSHIP_HEALTH = UInt64.from(80);
  export const ODP_HEALTH = UInt64.from(50);
}