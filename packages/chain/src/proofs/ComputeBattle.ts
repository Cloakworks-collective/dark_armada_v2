import { 
    Field, 
    Poseidon, 
    Experimental
 } from 'o1js';

import {  CreatePlanetPublicOutput } from "../models";


export function locationWIthinBounds(
    x: Field,
    y: Field
): CreatePlanetPublicOutput {
    
    return new CreatePlanetPublicOutput({
        locationHash: Poseidon(x, y),
        faction: Field.from(0)
    });
}

export const ComputeBattleProgram = Experimental.ZkProgram({
    publicInput: Field,
    publicOutput: CreatePlanetPublicOutput,
    methods: {
       locationWIthinBounds: {
          privateInputs: [Field, Field],
          method: locationWIthinBounds,
       }
    }
});

export class ComputeBattleProof extends Experimental.ZkProgram.Proof(
    ComputeBattleProgram
) {}