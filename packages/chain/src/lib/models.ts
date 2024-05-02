import { Struct, Field, PublicKey, Bool } from 'o1js';
import { Consts } from './consts';
import { UInt64 } from '@proto-kit/library';


export class PlanetaryDefense extends Struct({
  battleships: Field,
  destroyers: Field,
  carriers: Field,
  odps: Field
}){
  totalCost(){
    const battleshipCost = this.battleships.mul(Consts.BATTLESHIP_COST);
    const destroyerCost = this.destroyers.mul(Consts.DESTROYER_COST);
    const carrierCost = this.carriers.mul(Consts.CARRIER_COST);
    const odpsCost = this.odps.mul(Consts.ODP_COST);
    const totalCost = battleshipCost.add(destroyerCost).add(carrierCost).add(odpsCost);
    return totalCost;
  };
};

export class AttackFleet extends Struct({
    attackerHash: Field,
    battleships: Field,
    destroyers: Field,
    carriers: Field,
    troopTransports: Field,
  }){
    totalCost(){
      const battleshipCost = this.battleships.mul(Consts.BATTLESHIP_COST);
      const destroyerCost = this.destroyers.mul(Consts.DESTROYER_COST);
      const carrierCost = this.carriers.mul(Consts.CARRIER_COST);
      const troopTransportCost = this.troopTransports.mul(Consts.TROOP_TRANSPORT);
      const totalCost = battleshipCost.add(destroyerCost).add(carrierCost).add(troopTransportCost);
      return totalCost;
    };
  };  

export class Planet extends Struct({
    owner: PublicKey,
    locationHash: Field,
    faction: Field,
    defenseHash: Field,
    defenseManpower: Field,
    incomingAttack: AttackFleet,
    incomingAttackTime: Field,
    points: Field,
  }){};


  /** Proof input and outputs */
  
  export class CreatePlanetPublicOutput extends Struct({
    locationHash: Field,
    faction: Field,
  }) {};

  export class DefendPlanetPublicOutput extends Struct({
    defenseHash: Field,
    crewNeeded: Field,
  }) {}

  export class BattlePublicOutput extends Struct({
    didDefenseWin: Bool,
    defenseHash: Field,
    attackingFleet: AttackFleet,
  }) {};

  /** Commonly used Interfaces */
  export interface Coordinates {
    x: Field;
    y: Field;
  }

/** COMPLEX BATTLE OBJECTS */

export interface AttackingFleet {
  battleships: UInt64,
  destroyers: UInt64,
  carriers: UInt64,
  fighters: UInt64,
  drones: UInt64,
  troopTransports: UInt64,
  dropShips: UInt64,
}

export interface DefendingFleet {
  battleships: UInt64,
  destroyers: UInt64,
  carriers: UInt64,
  fighters: UInt64,
  drones: UInt64,
  odps: UInt64,
}

export interface RemainingFleet {
  attacker: AttackingFleet,
  defender: DefendingFleet
}

// PHASE 1: LONG RANGE BATTLE

export interface LongRangeFleetPerformance {
  missilesLaunched: UInt64,
  missilesIntercepted: UInt64,
  battleshipsLost: UInt64,
  destroyersLost: UInt64,
  carriersLost: UInt64
}

export interface LongRangeBattleOutput {
  attacker: LongRangeFleetPerformance,
  defender: LongRangeFleetPerformance,
}

// PHASE 2: CAPITAL SHIP CLASH

export interface ShipDeployment {
  engagingFleet: AttackingFleet | DefendingFleet,
  extraBattleShips: UInt64
}

export interface BattlePlan {
  attackingFleet: ShipDeployment;
  defendingFleet: ShipDeployment;
}

export interface Phase2FleetLoss {
  battleships: UInt64,
  destroyers: UInt64,
  fighters: UInt64,
  drones: UInt64
}

export interface Phase2Result {
  attacker: Phase2FleetLoss,
  defender: Phase2FleetLoss,
  didAttackerWin: Bool
}

// PHASE 3: CARRIER BATTLE

export interface Phase3AttackFleetLoss {
  battleships: UInt64,
  destroyers: UInt64,
  carriers: UInt64,
  fighters: UInt64,
  drones: UInt64
  troopTransports: UInt64,
}

export interface Phase3DefenseFleetLoss {
  battleships: UInt64,
  destroyers: UInt64,
  carriers: UInt64,
  fighters: UInt64,
  drones: UInt64
  odps: UInt64,
}

export interface Phase3Result {
  attacker: Phase3AttackFleetLoss,
  defender: Phase3DefenseFleetLoss,
  didAttackerWin: Bool
}





  