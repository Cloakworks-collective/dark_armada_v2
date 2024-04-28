import { Struct, Field, PublicKey, Bool } from 'o1js';
import { Consts } from './consts';

export class PlanetaryDefense extends Struct({
  battleships: Field,
  destroyers: Field,
  carriers: Field
}){
  totalCrewNeeded(){
    const battleshipCrew = this.battleships.mul(Consts.BATTLESHIP_CREW);
    const destroyerCrew = this.destroyers.mul(Consts.DESTROYER_CREW);
    const carrierCrew = this.carriers.mul(Consts.CARRIER_CREW);
    return battleshipCrew.add(destroyerCrew).add(carrierCrew);
  };
};

export class AttackFleet extends Struct({
    attackingFaction: Field,
    battleships: Field,
    destroyers: Field,
    carriers: Field
  }){
    strength(){
      const fleetStrength = this.battleships.add(this.destroyers).add(this.carriers);
      return fleetStrength;
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


  