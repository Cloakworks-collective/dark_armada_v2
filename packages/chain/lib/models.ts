import { Struct, Field, CircuitString } from 'o1js';

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

export class Fleet extends Struct({
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
    name: CircuitString,
    facttion: Field,
    defenseHash: Field,
    incomingAttack: Fleet,
    incomingAttackTime: Field,
    points: Field,
    locationHash: Field,
    owner: Field,
  }){};


  /** Proof outputs */

  export class CreatePlanetPublicOutput extends Struct({
    locationHash: Field,
    faction: Field,
  }) {}; 

  
  