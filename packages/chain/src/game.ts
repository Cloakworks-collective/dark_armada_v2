import { 
    runtimeModule,
    state, 
    runtimeMethod, 
    RuntimeModule 
} from "@proto-kit/module";
import { State, StateMap, assert } from "@proto-kit/protocol";
import { Field, Bool, PublicKey } from "o1js";
// import { Planet } from "../lib/models.ts";

@runtimeModule()
export class GameRuntime extends RuntimeModule<unknown> {

    // // key is the locationHash, value shows if the planet is occupied
    // @state() public planetLedger  = StateMap.from<Field, Bool>(
    //     Field, 
    //     Bool
    // );

    // // key is the locationHash, value is the planet details
    // @state() public planetDetails = StateMap.from<Field, Planet>(
    //     Field,
    //     Planet
    // );

    // // key is the owner's public key, value is the planet locationHash
    // @state() public ownershipLedger = StateMap.from<PublicKey, Field>(
    //     PublicKey,
    //     Field
    // );

}