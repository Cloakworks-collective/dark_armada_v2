import { 
    runtimeModule,
    state, 
    runtimeMethod, 
    RuntimeModule 
} from "@proto-kit/module";
import { State, StateMap, assert } from "@proto-kit/protocol";
import { Field, Bool, PublicKey } from "o1js";

/** INTERNAL IMPORTS  */
import { Planet } from "../lib/models";
import { Consts } from "../lib/consts";
import { Errors } from "../lib/errors";

import { CreatePlanetProof } from "../proofs/createPlanetProof";
import { DefendPlanetProof } from "../proofs/defendPlanetProof";

@runtimeModule()
export class GameRuntime extends RuntimeModule<unknown> {

    /** RUNTIME STATES  */

    @state() public numberOfPlanets = State.from<Field>(Field);

    // key: locationHash(planetId), value: Planet Struct
    @state() public planetDetails = StateMap.from<Field, Planet>(
        Field,
        Planet
    );

    // key: playerPublicKey, value: Bool
    @state() public playerNullifier = StateMap.from<PublicKey, Bool>(
        PublicKey,
        Bool
    );

    // key: locationHash, value: Bool
    @state() public locationNullifier  = StateMap.from<Field, Bool>(
        Field, 
        Bool
    );

    /** RUNTIME METHODS */

    @runtimeMethod()
    public createPlanet(creationProof: CreatePlanetProof) {

        const publicOutput = creationProof.publicOutput;

        // STEP 1: verify that the max number of planets has not been reached
        const numPlanets = this.numberOfPlanets.get().orElse(Field(0));
        assert(
            numPlanets.lessThan(Consts.MAX_NUM_PLANETS),
            Errors.MAX_NUM_PLANETS
        );

        // STEP 2: verify that user does not have a homeworld already
        const sender = this.transaction.sender.value;
        const hasHomeworld = this.playerNullifier.get(sender).orElse(Bool(false));
        assert(
            hasHomeworld.not(),
            Errors.PLAYER_HAS_PLANET
        );

        // STEP 3: verify that the location has not been used before
        const locationHash = publicOutput.locationHash;
        const locationUsed = this.locationNullifier.get(locationHash).orElse(Bool(false));
        assert(
            locationUsed.not(),
            Errors.PLANET_ALREADY_EXISTS_AT_THIS_LOCATION
        );

        // STEP 4: verify the proof (and that the location is valid)
        creationProof.verify();

        // STEP 4: update the states
        this.numberOfPlanets.set(numPlanets.add(Field(1)));
        this.planetDetails.set(locationHash, new Planet({
            owner: sender,
            locationHash: locationHash,
            faction: publicOutput.faction,
            defenseHash: Consts.EMPTY_FIELD,
            defenseStrength: Consts.EMPTY_FIELD,
            incomingAttack: Consts.EMPTY_FLEET,
            incomingAttackTime: Consts.EMPTY_FIELD,
            points: Consts.EMPTY_FIELD
        }));

        this.playerNullifier.set(sender, Bool(true));
        this.locationNullifier.set(locationHash, Bool(true));
    }

    @runtimeMethod()
    public defendPlanet(
        locationHash: Field, 
        defenseProof: DefendPlanetProof
    ) {

        const publicOutput = defenseProof.publicOutput;
        const sender = this.transaction.sender.value;
        const planetId = locationHash;

        // STEP 1: verify that the plent exists 
        assert(
            this.planetDetails.get(planetId).isSome,
            Errors.INVALID_KEY
        );

        // STET 2: verify that the player has access to the planet
        const details = this.planetDetails.get(planetId).value
        assert(
            details.owner.equals(sender),
            Errors.PLAYER_HAS_NO_ACCESS
        );


        // STEP 3: verify that the planet is not under attack 
        const incomingAttackTime = details.incomingAttackTime;
        assert(
            incomingAttackTime.equals(Consts.EMPTY_FIELD),
            Errors.PLANET_UNDER_ATTACK
        );

        // STEP 4: verify the proof (defense is valid)
        defenseProof.verify();

        // STEP 5: update the state - set defense
        const defenseHash = publicOutput.defenseHash;
        const defenseStrength = publicOutput.strength;

        details.defenseHash = defenseHash;
        details.defenseStrength = defenseStrength;

        this.planetDetails.set(planetId, details);
    }

    @runtimeMethod()
    public launchAttack() {
        // STEP 1: verify that the defending planet exists

        // STEP 2: verify that the player has access to his homeworld

        // STEP 3: verify that the defending planet has defense

        // STEP 4: verify the defending planet is not under attack

        // STEP 5: verify the attack fleet strength

        // STEP 6: update the state - set attack
    }


}