import { 
    runtimeModule,
    state, 
    runtimeMethod, 
    RuntimeModule 
} from "@proto-kit/module";
import { State, StateMap, assert } from "@proto-kit/protocol";
import { Field, Bool, PublicKey, Poseidon, Provable } from "o1js";

/** INTERNAL IMPORTS  */
import { Planet, AttackFleet} from "../lib/models";
import { Consts } from "../lib/consts";
import { Errors } from "../lib/errors";

import { CreatePlanetProof } from "../proofs/createPlanetProof";
import { DefendPlanetProof } from "../proofs/defendPlanetProof";
import { BattleProof } from "../proofs/battleProof";
import { UInt64 } from "@proto-kit/library";
import { log } from "console";

export const EMPTY_ATTACK_FLEET = new AttackFleet({
    attackerHash: Consts.EMPTY_FIELD,
    battleships: Consts.EMPTY_FIELD,
    destroyers: Consts.EMPTY_FIELD,
    carriers: Consts.EMPTY_FIELD,
    troopTransports: Consts.EMPTY_FIELD
  })


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

        // STEP 1: verify that user does not have a homeworld already
        const sender = this.transaction.sender.value;
        const hasHomeworld = this.playerNullifier.get(sender).orElse(Bool(false));
        assert(
            hasHomeworld.not(),
            Errors.PLAYER_HAS_PLANET
        );

        // STEP 2: verify that the location has not been used before
        const locationHash = publicOutput.locationHash;
        const locationUsed = this.locationNullifier.get(locationHash).orElse(Bool(false));
        assert(
            locationUsed.not(),
            Errors.PLANET_ALREADY_EXISTS_AT_THIS_LOCATION
        );

        // STEP 3: verify the proof (and that the location is valid)
        creationProof.verify();

        // STEP 4: update the states
        const numPlanets = this.numberOfPlanets.get().orElse(Consts.EMPTY_FIELD);
        this.numberOfPlanets.set(numPlanets.add(Field(1)));
        this.planetDetails.set(locationHash, new Planet({
            owner: sender,
            locationHash: locationHash,
            faction: publicOutput.faction,
            defenseHash: Consts.EMPTY_FIELD,
            defenseManpower: Consts.EMPTY_FIELD,
            incomingAttack: EMPTY_ATTACK_FLEET,
            incomingAttackTime: Consts.EMPTY_FIELD,
            points: Consts.INITIAL_POINTS
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

        // STEP 1: verify that the planet exists 
        assert(
            this.planetDetails.get(planetId).isSome,
            Errors.PLANET_DOES_NOT_EXIST_HERE
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
        details.defenseHash = publicOutput.defenseHash;
        details.defenseManpower = publicOutput.crewNeeded;

        this.planetDetails.set(planetId, details);
    }

    @runtimeMethod()
    public launchAttack(
        attackerHomeworld: Field,
        defendingPlanet: Field,
        attackFleet: AttackFleet
    ) {
        // STEP 1: verify that the defending planet exists
        assert(
            this.planetDetails.get(defendingPlanet).isSome,
            Errors.NO_DEFENDING_PLANET_FOUND
        );
        const defenderDetails = new Planet(this.planetDetails.get(defendingPlanet).value);

        // STEP 2: verify that attacking homeworld exists
        assert(
            this.planetDetails.get(attackerHomeworld).isSome,
            Errors.NO_ATTACKER_HOMEWORLD
        );
        const attackerDetails = new Planet(this.planetDetails.get(attackerHomeworld).value);

        // STEP 3: verify that the attacker owns the attacking homeworld
        const attacker = this.transaction.sender.value;
        assert(
            attackerDetails.owner.equals(attacker),
            Errors.PLAYER_HAS_NO_ACCESS
        );

        // STEP 4: verify that the player is not attacking their own planet
        assert(
            defenderDetails.owner.equals(attacker).not(),
            Errors.CANNOT_ATTACK_OWN_PLANET
        );

        // STEP 5: verify that the attacking homeworld has a defense set
          assert(
            attackerDetails.defenseManpower.greaterThan(Consts.EMPTY_FIELD),
            Errors.ATTACKER_HAS_NO_DEFENSE
        );

        // STEP 6: verify that the defending planet has defense
        assert(
            defenderDetails.defenseManpower.greaterThan(Consts.EMPTY_FIELD),
            Errors.DEFENDER_HAS_NO_DEFENSE
        );

        // STEP 7: verify the defending planet is not under attack already
        assert(
            defenderDetails.incomingAttackTime.equals(Consts.EMPTY_FIELD),
            Errors.PLANET_UNDER_ATTACK
        );

        // STEP 8: verify the attack fleet attack cost
        const cost_to_attack = attackFleet.totalCost();
        assert(
            Consts.MAX_ATTACK_COST.greaterThanOrEqual(cost_to_attack),
            Errors.ATTACK_FLEET_COST
        )

        // STEP 9: update the state - set attack
        const attackTime = this.network.block.height.value;

        attackFleet.attackerHash = attackerHomeworld;

        defenderDetails.incomingAttack = attackFleet
        defenderDetails.incomingAttackTime = attackTime;

        this.planetDetails.set(defendingPlanet, defenderDetails);
    }

    @runtimeMethod()
    public resolveAttack(
        defenderLocationHash: Field,
        battleProof: BattleProof
    ) {

        // STEP 1: verify that the defending planet exists
        assert(
            this.planetDetails.get(defenderLocationHash).isSome,
            Errors.NO_DEFENDING_PLANET_FOUND
        );

        // STEP 2: verify the owner of the defending planet is the sender
        const sender = this.transaction.sender.value;
        const defenderDetails = this.planetDetails.get(defenderLocationHash).value;
        assert(
            defenderDetails.owner.equals(sender),
            Errors.PLAYER_HAS_NO_ACCESS
        );

        // STEP 3: verify the proof (battle computation is valid)
        battleProof.verify();

        // STEP 4: verify that the defense hash was not tampered with
        const publicOutput = battleProof.publicOutput;
        const defenseHash = publicOutput.defenseHash;
        assert(
            defenderDetails.defenseHash.equals(defenseHash),
            Errors.DEFENSE_DOES_NOT_MATCH
        );


        // STEP 5: verify that the attacking fleet was not tampered with
        const attackInProof = publicOutput.attackingFleet;
        const attackInProofHash = Poseidon.hash(AttackFleet.toFields(attackInProof));

        const storedAttack = defenderDetails.incomingAttack;
        const storedAttackHash = Poseidon.hash(AttackFleet.toFields(storedAttack));

        assert(
            attackInProofHash.equals(storedAttackHash),
            Errors.ATTACK_DOES_NOT_MATCH
        );


        // STEP 6: update the states based on the battle result
        const didDefenseWin = publicOutput.didDefenseWin;
        const defenderpoints = defenderDetails.points;

        const attackerLocationHash = attackInProof.attackerHash;
        const attackerDetails = this.planetDetails.get(attackerLocationHash).value;
        const attackerPoints = attackerDetails.points;

        const updatedAttackerPoints = Provable.if(
            didDefenseWin,
            attackerPoints.sub(Consts.WIN_POINTS),
            attackerPoints.add(Consts.LOSE_POINTS)
          );

        const updatedDefenderPoints = Provable.if(
            didDefenseWin,
            defenderpoints.add(Consts.WIN_POINTS),
            defenderpoints.sub(Consts.LOSE_POINTS)
        );

        // update the points
        attackerDetails.points = updatedAttackerPoints;
        defenderDetails.points = updatedDefenderPoints;

        // reset the incoming attack
        defenderDetails.incomingAttack = EMPTY_ATTACK_FLEET;
        defenderDetails.incomingAttackTime = Consts.EMPTY_FIELD;

        this.planetDetails.set(defenderLocationHash, defenderDetails);
        this.planetDetails.set(attackerLocationHash, attackerDetails);
    }

    @runtimeMethod()
    public forfeitPlanet(locationHash: Field) {

        // STEP 1: verify that the planet exists
        assert(
            this.planetDetails.get(locationHash).isSome,
            Errors.NO_DEFENDING_PLANET_FOUND
        );

        // STEP 2: verify that the planet is under attack
        const defenderDetails = this.planetDetails.get(locationHash).value;
        assert(
            defenderDetails.incomingAttackTime.equals(Consts.EMPTY_FIELD).not(),
            Errors.PLANET_NOT_UNDER_ATTACK
        );

        // STEP 3: verify that the sender is the attacker
        const sender = this.transaction.sender.value;
        const attackerLocationHash = defenderDetails.incomingAttack.attackerHash;
        const attackerDetails = this.planetDetails.get(attackerLocationHash).value;

        assert(
            attackerDetails.owner.equals(sender),
            Errors.NOT_ATTACKER
        );

        // STEP 4: verify that the forfeit claim duration has passed
        const attackTime = defenderDetails.incomingAttackTime;
        const currentTime = this.network.block.height.value;

        const timeDiff = currentTime.sub(attackTime);
        assert(
            timeDiff.greaterThanOrEqual(Consts.TEST_FORFEIT_BLOCKS_DURATION),
            Errors.FORFEIT_CLAIM_DURATION
        );

        // STEP 5: update the states based on the forfeit

        // update the points
        const updatedAttackerPoints = attackerDetails.points.add(Consts.WIN_POINTS);
        const updatedDefenderPoints = defenderDetails.points.sub(Consts.FORFEIT_POINTS);

        attackerDetails.points = updatedAttackerPoints;
        defenderDetails.points = updatedDefenderPoints;

        // reset the incoming attack
        defenderDetails.incomingAttack = EMPTY_ATTACK_FLEET;
        defenderDetails.incomingAttackTime = Consts.EMPTY_FIELD;

        this.planetDetails.set(locationHash, defenderDetails);
        this.planetDetails.set(attackerLocationHash, attackerDetails);
    }

}