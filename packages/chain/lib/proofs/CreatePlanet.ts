import { 
    Field, 
    Poseidon, 
    Experimental
 } from 'o1js';

export const CratePlanet = Experimental.ZkProgram({
    publicInput: Field,
    publicOutput: Field,
    methods: {
        
    }
});

export class CreatePlanetProof extends Experimental.ZkProgram.Proof(
    CratePlanet
) {}