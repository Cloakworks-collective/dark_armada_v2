import { 
    Field, 
    Poseidon, 
    Experimental
 } from 'o1js';


// export const ComputeBattleProgram = Experimental.ZkProgram({
//     publicInput: Field,
//     publicOutput: CreatePlanetPublicOutput,
//     methods: {
//        locationWIthinBounds: {
//           privateInputs: [Field, Field],
//           method: locationWIthinBounds,
//        }
//     }
// });

// export class ComputeBattleProof extends Experimental.ZkProgram.Proof(
//     ComputeBattleProgram
// ) {}