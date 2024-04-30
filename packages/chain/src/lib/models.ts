import { Struct, Field, PublicKey, Bool } from 'o1js';
import { Consts } from './consts';

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
    attackingFaction: Field,
    battleships: Field,
    destroyers: Field,
    carriers: Field,
    troopTransports: Field,
  }){
    attackCost(){
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

  