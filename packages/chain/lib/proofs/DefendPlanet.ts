import { 
    Field, 
    Poseidon, 
    Experimental
 } from 'o1js';

export const DefendPlanet = Experimental.ZkProgram({
    publicInput: Field,
    publicOutput: Field,
    methods: {
        
    }
});

export class DefendPlanetProof extends Experimental.ZkProgram.Proof(
    DefendPlanet
) {}