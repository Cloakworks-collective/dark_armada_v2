import { UInt64 } from '@proto-kit/library';
import { Struct, Field, PublicKey } from 'o1js';

export class PlanetaryDefense extends Struct({
  battleships: Field,
  destroyers: Field,
  carriers: Field
}){
  strength(){
    const fleetStrength = this.battleships.add(this.destroyers).add(this.carriers);
    return fleetStrength;
  };
};

export class AttackFleet extends Struct({
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
    defenseStrength: Field,
    incomingAttack: AttackFleet,
    incomingAttackTime: UInt64,
    points: Field,
  }){};


  /** Proof input and outputs */
  
  export class CreatePlanetPublicOutput extends Struct({
    locationHash: Field,
    faction: Field,
  }) {};

  export class DefendPlanetPublicOutput extends Struct({
    defenseHash: Field,
    strength: Field,
  }) {}


  