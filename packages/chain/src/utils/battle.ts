import { Field, Provable, Bool} from 'o1js';
import { UInt64 } from '@proto-kit/library';

/** INTERNAL IMPORTS */

import { Consts } from '../lib/consts';
import { Errors } from '../lib/errors';
import {
    AttackFleet, 
    PlanetaryDefense,
    AttackingFleet,
    DefendingFleet,
    RemainingFleet,
    LongRangeFleetPerformance,
    LongRangeBattleOutput,
    BattlePlan, 
} from '../lib/models';


export class BattleUtils {


    /** SIMPLE BATTLE CALCULATION */
    
    static computeSimpleWinner(
        attack: AttackFleet, 
        defense: PlanetaryDefense
    ): Bool {
    const attackeBattleships = attack.battleships.mul(
        Consts.BATTLESHIP_STRENGTH
        );
        const attackeDestroyers = attack.destroyers.mul(
        Consts.DESTROYER_STRENGTH
        );
        const attackeCarriers = attack.carriers.mul(Consts.CARRIER_STRENGTH);

        const defenderBattleships = defense.battleships.mul(
        Consts.BATTLESHIP_STRENGTH
        );
        const defenderDestroyers = defense.destroyers.mul(Consts.DESTROYER_STRENGTH);
        const defenderCarriers = defense.carriers.mul(Consts.CARRIER_STRENGTH);

        //  battleships > destroyers
        const battleshipsBeatsDestroyers =
        attackeBattleships.sub(defenderDestroyers);

        // destroyers > carriers
        const destroyersBeatsCarriers = attackeDestroyers.sub(defenderCarriers);

        // carriers > battleships
        const carriersBeatsBattleships = attackeCarriers.sub(defenderBattleships);

        const battleResult = battleshipsBeatsDestroyers
        .add(destroyersBeatsCarriers)
        .add(carriersBeatsBattleships);

        const defended = Provable.if(
        battleResult.greaterThanOrEqual(Field(1)),
            Bool(true),
            Bool(false)
        );

        return defended;
    }

    /** COMPLEX BATTLE CALCULATION */

    static convertAttackFleetToFleetInterface(attackFleet: AttackFleet): AttackingFleet {
        return {
          battleships: UInt64.from(attackFleet.battleships),
          destroyers: UInt64.from(attackFleet.destroyers),
          carriers: UInt64.from(attackFleet.carriers),
          troopTransports: UInt64.from(attackFleet.troopTransports),
        };
    }

    static convertDefenseToFleetInterface(defense: PlanetaryDefense): DefendingFleet {
        return {
          battleships: UInt64.from(defense.battleships),
          destroyers: UInt64.from(defense.destroyers),
          carriers: UInt64.from(defense.carriers),
          odps: UInt64.from(defense.odps),
        };
    }

    /** PHASE I */

    static calculateMissilesLaunched(fleet: AttackingFleet | DefendingFleet): UInt64 {
        return  fleet.battleships.mul(Consts.DESTROYER_MISSILE_CAP).add(
            fleet.destroyers.mul(Consts.DESTROYER_MISSILE_CAP)
        ).mul(Consts.NUMBER_OF_MISSILE_SALVOS)
    }

    static calculateInterceptors(fleet: AttackingFleet | DefendingFleet): UInt64 {
        return fleet.battleships.mul(Consts.BATTLESHIP_INTERCEPTOR_CAP).add(
            fleet.destroyers.mul(Consts.DESTROYER_INTERCEPTOR_CAP)
        ).add(
            fleet.carriers.mul(Consts.CARRIER_INTERCEPTOR_CAP)
        ).mul(Consts.NUMBER_OF_INTERCEPTOR_SALVOS)
    }

    static calculateMissilesGotThrough(missiles: UInt64, interceptors: UInt64): UInt64 {
        const num = Provable.if(missiles.greaterThanOrEqual(interceptors), missiles.sub(interceptors).value, Field(0));
        return UInt64.from(num);
    }

    static calculateMissilesTargeting(fleet: AttackFleet | PlanetaryDefense, missiles: UInt64, ships: UInt64, cost: Field): UInt64 {
        const totalCost = UInt64.from(fleet.totalCost());
        const shipCost = ships.mul(UInt64.from(cost));
        return ((shipCost).mul(missiles)).div(totalCost);
    }

    static  calculateShipsDestroyed(ships: UInt64, missiles: UInt64, PdcCapacity: UInt64): UInt64 {
        const max = missiles.div(PdcCapacity)
        const num = Provable.if(ships.greaterThanOrEqual(max), max.value, ships.value);
        return UInt64.from(num);
    }

    static calculateLongRangeBattle(attackStruct: AttackFleet, defenseStruct: PlanetaryDefense): LongRangeBattleOutput {

        const attack = BattleUtils.convertAttackFleetToFleetInterface(attackStruct);
        const defense = BattleUtils.convertDefenseToFleetInterface(defenseStruct);

        // calculate missiles and interceptors launched by both sides
        const attackerMissiles = BattleUtils.calculateMissilesLaunched(attack);
        const defenderMissiles = BattleUtils.calculateMissilesLaunched(defense);
        const attackerInterceptors = BattleUtils.calculateInterceptors(attack);
        const defenderInterceptors = BattleUtils.calculateInterceptors(defense);

        // calculate missiles that got through
        const attackerMissilesGotThrough = BattleUtils.calculateMissilesGotThrough(attackerMissiles, defenderInterceptors);
        const defenderMissilesGotThrough = BattleUtils.calculateMissilesGotThrough(defenderMissiles, attackerInterceptors);

        // calculate missiles targeting each ship type
        const aBattleshipMissiles = BattleUtils.calculateMissilesTargeting(attackStruct, defenderMissilesGotThrough, attack.battleships, Consts.BATTLESHIP_COST);
        const aDestroyerMissiles = BattleUtils.calculateMissilesTargeting(attackStruct, defenderMissilesGotThrough, attack.destroyers, Consts.DESTROYER_COST);
        const aCarrierMissiles = BattleUtils.calculateMissilesTargeting(attackStruct, defenderMissilesGotThrough, attack.carriers, Consts.CARRIER_COST);

        const dBattleshipMissiles = BattleUtils.calculateMissilesTargeting(defenseStruct, attackerMissilesGotThrough, defense.battleships, Consts.BATTLESHIP_COST);
        const dDestroyerMissiles = BattleUtils.calculateMissilesTargeting(defenseStruct, attackerMissilesGotThrough, defense.destroyers, Consts.DESTROYER_COST);
        const dCarrierMissiles = BattleUtils.calculateMissilesTargeting(defenseStruct, attackerMissilesGotThrough, defense.carriers, Consts.CARRIER_COST);

        // calculate ships destroyed
        const aBattleshipsDestroyed = BattleUtils.calculateShipsDestroyed(UInt64.from(attack.battleships), aBattleshipMissiles, Consts.BATTLESHIP_PDC_CAP);
        const aDestroyersDestroyed = BattleUtils.calculateShipsDestroyed(UInt64.from(attack.destroyers), aDestroyerMissiles, Consts.DESTROYER_PDC_CAP);
        const aCarriersDestroyed = BattleUtils.calculateShipsDestroyed(UInt64.from(attack.carriers), aCarrierMissiles, Consts.CARRIER_PDC_CAP);

        const dBattleshipsDestroyed = BattleUtils.calculateShipsDestroyed(UInt64.from(defense.battleships), dBattleshipMissiles, Consts.BATTLESHIP_PDC_CAP);
        const dDestroyersDestroyed = BattleUtils.calculateShipsDestroyed(UInt64.from(defense.destroyers), dDestroyerMissiles, Consts.DESTROYER_PDC_CAP);
        const dCarriersDestroyed = BattleUtils.calculateShipsDestroyed(UInt64.from(defense.carriers), dCarrierMissiles, Consts.CARRIER_PDC_CAP);

        return {
            attacker: {
                missilesLaunched: attackerMissiles,
                missilesIntercepted: attackerInterceptors,
                battleshipsLost: aBattleshipsDestroyed,
                destroyersLost: aDestroyersDestroyed,
                carriersLost: aCarriersDestroyed
            },
            defender: {
                missilesLaunched: defenderMissiles,
                missilesIntercepted: defenderInterceptors,
                battleshipsLost: dBattleshipsDestroyed,
                destroyersLost: dDestroyersDestroyed,
                carriersLost: dCarriersDestroyed
            }
        };

    }

    /** PHASE 2 */

    static calculateRemainingFleets(
        startingAttack: AttackingFleet, 
        startingDefense: DefendingFleet, 
        battleResults: LongRangeBattleOutput
    ): RemainingFleet
    {
        const remainingAttackingFleet: AttackingFleet = {
            battleships: startingAttack.battleships.sub(battleResults.attacker.battleshipsLost),
            destroyers: startingAttack.destroyers.sub(battleResults.attacker.destroyersLost),
            carriers: startingAttack.carriers.sub(battleResults.attacker.carriersLost),
            troopTransports: startingAttack.troopTransports
        };

        const remainingDefendingFleet: DefendingFleet = {
            battleships: startingDefense.battleships.sub(battleResults.defender.battleshipsLost),
            destroyers: startingDefense.destroyers.sub(battleResults.defender.destroyersLost),
            carriers: startingDefense.carriers.sub(battleResults.defender.carriersLost),
            odps: startingDefense.odps
        };
    
        return {
            attacker: remainingAttackingFleet,
            defender: remainingDefendingFleet
        };
    }

    /**
     * 
     * @note: Lets say the side with more battleships sends 1:1 battleships , and both sides sends 25% of the destroyers . 
     * The rest of the battleships for the side with more battle ships goes for the carrier.
     *  
     * 
     */

    static calculateBattlePlans(
        attack: AttackingFleet, 
        defense: DefendingFleet
    ): BattlePlan {
        
        const min = Provable.if(
            attack.battleships.greaterThanOrEqual(defense.battleships), 
            defense.battleships.value,
            attack.battleships.value
        );
        const minimumBattleships = UInt64.from(min);

        const attackingDestroyers = attack.destroyers.div(UInt64.from(2));
        const attackingFighters = (attack.carriers.mul(Consts.CARRIER_FIGHTERS)).div(UInt64.from(2));
        const attackingDrones = (attack.carriers.mul(Consts.CARRIER_DRONE)).div(UInt64.from(2));

        const defendingDestroyers = defense.destroyers.div(UInt64.from(2));
        const defendingFighters = (defense.carriers.mul(Consts.CARRIER_FIGHTERS)).div(UInt64.from(2));
        const defendingDrones = (defense.carriers.mul(Consts.CARRIER_DRONE)).div(UInt64.from(2));
        
        const attackingBattleshipsLeft = Provable.if(
            attack.battleships.greaterThanOrEqual(minimumBattleships),
            attack.battleships.sub(minimumBattleships).value,
            Field(0)
        );

        const defendingBattleshipsLeft = Provable.if(
            defense.battleships.greaterThanOrEqual(minimumBattleships),
            defense.battleships.sub(minimumBattleships).value,
            Field(0)
        );

        return {
            attackingFleet: {
                battleships: minimumBattleships,
                destroyers: attackingDestroyers,
                fighters: attackingFighters,
                drones: attackingDrones,
                battleshipsLeft: UInt64.from(attackingBattleshipsLeft)
            },
            defendingFleet: {
                battleships: minimumBattleships,
                destroyers: defendingDestroyers,
                fighters: defendingFighters,
                drones: defendingDrones,
                battleshipsLeft: UInt64.from(defendingBattleshipsLeft)
            }
        };
    }

}