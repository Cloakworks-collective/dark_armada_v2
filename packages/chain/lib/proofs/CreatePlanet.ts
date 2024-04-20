import { 
    Field, 
    Poseidon, 
    Experimental
 } from 'o1js';

 import {  CreatePlanetPublicOutput } from "../models";

 export function verifyLocation(
    faction: Field,
    x: Field,
    y: Field
  ): CreatePlanetPublicOutput {
    
    const locationHash = Poseidon.hash([x, y]);
  
    return new CreatePlanetPublicOutput({
      locationHash,
      faction
    });
  }
  
  /**
   * Create Planet Program
   * 
   * public input: faction 
   * private inputs: x, y co-oridnates of the planet
   * public output: locationHash, faction
   */
  export const createPlanetProgram = Experimental.ZkProgram({
    publicInput: Field,
    publicOutput: CreatePlanetPublicOutput,
    methods: {
      canClaim: {
        privateInputs: [Field, Field],
        method: verifyLocation,
      },
    },
  });

  export class CratePlanetProof extends Experimental.ZkProgram.Proof(createPlanetProgram) {}