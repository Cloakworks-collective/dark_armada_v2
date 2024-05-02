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
    Phase2Result,
    Phase3Result,
    Phase4Result
} from '../lib/models';


export class BattleTwoUtils {

    static convertAttackFleetToFleetInterface(attackFleet: AttackFleet): AttackingFleet {
        return {
          battleships: UInt64.from(attackFleet.battleships),
          destroyers: UInt64.from(attackFleet.destroyers),
          carriers: UInt64.from(attackFleet.carriers),
          fighters: UInt64.from(attackFleet.carriers).mul(Consts.CARRIER_FIGHTERS),
          drones: UInt64.from(attackFleet.carriers).mul(Consts.CARRIER_DRONE),
          troopTransports: UInt64.from(attackFleet.troopTransports),
          dropShips: UInt64.from(attackFleet.troopTransports).mul(Consts.TROOP_TRANSPORT_DROPSHIPS)
        };
    }

    static convertDefenseToFleetInterface(defense: PlanetaryDefense): DefendingFleet {
        return {
          battleships: UInt64.from(defense.battleships),
          destroyers: UInt64.from(defense.destroyers),
          carriers: UInt64.from(defense.carriers),
          fighters: UInt64.from(defense.carriers).mul(Consts.CARRIER_FIGHTERS),
          drones: UInt64.from(defense.carriers).mul(Consts.CARRIER_DRONE),
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

        const attack = BattleTwoUtils.convertAttackFleetToFleetInterface(attackStruct);
        const defense = BattleTwoUtils.convertDefenseToFleetInterface(defenseStruct);

        // calculate missiles and interceptors launched by both sides
        const attackerMissiles = BattleTwoUtils.calculateMissilesLaunched(attack);
        const defenderMissiles = BattleTwoUtils.calculateMissilesLaunched(defense);
        const attackerInterceptors = BattleTwoUtils.calculateInterceptors(attack);
        const defenderInterceptors = BattleTwoUtils.calculateInterceptors(defense);

        // calculate missiles that got through
        const attackerMissilesGotThrough = BattleTwoUtils.calculateMissilesGotThrough(attackerMissiles, defenderInterceptors);
        const defenderMissilesGotThrough = BattleTwoUtils.calculateMissilesGotThrough(defenderMissiles, attackerInterceptors);

        // calculate missiles targeting each ship type
        const aBattleshipMissiles = BattleTwoUtils.calculateMissilesTargeting(attackStruct, defenderMissilesGotThrough, attack.battleships, Consts.BATTLESHIP_COST);
        const aDestroyerMissiles = BattleTwoUtils.calculateMissilesTargeting(attackStruct, defenderMissilesGotThrough, attack.destroyers, Consts.DESTROYER_COST);
        const aCarrierMissiles = BattleTwoUtils.calculateMissilesTargeting(attackStruct, defenderMissilesGotThrough, attack.carriers, Consts.CARRIER_COST);

        const dBattleshipMissiles = BattleTwoUtils.calculateMissilesTargeting(defenseStruct, attackerMissilesGotThrough, defense.battleships, Consts.BATTLESHIP_COST);
        const dDestroyerMissiles = BattleTwoUtils.calculateMissilesTargeting(defenseStruct, attackerMissilesGotThrough, defense.destroyers, Consts.DESTROYER_COST);
        const dCarrierMissiles = BattleTwoUtils.calculateMissilesTargeting(defenseStruct, attackerMissilesGotThrough, defense.carriers, Consts.CARRIER_COST);

        // calculate ships destroyed
        const aBattleshipsDestroyed = BattleTwoUtils.calculateShipsDestroyed(UInt64.from(attack.battleships), aBattleshipMissiles, Consts.BATTLESHIP_PDC_CAP);
        const aDestroyersDestroyed = BattleTwoUtils.calculateShipsDestroyed(UInt64.from(attack.destroyers), aDestroyerMissiles, Consts.DESTROYER_PDC_CAP);
        const aCarriersDestroyed = BattleTwoUtils.calculateShipsDestroyed(UInt64.from(attack.carriers), aCarrierMissiles, Consts.CARRIER_PDC_CAP);

        const dBattleshipsDestroyed = BattleTwoUtils.calculateShipsDestroyed(UInt64.from(defense.battleships), dBattleshipMissiles, Consts.BATTLESHIP_PDC_CAP);
        const dDestroyersDestroyed = BattleTwoUtils.calculateShipsDestroyed(UInt64.from(defense.destroyers), dDestroyerMissiles, Consts.DESTROYER_PDC_CAP);
        const dCarriersDestroyed = BattleTwoUtils.calculateShipsDestroyed(UInt64.from(defense.carriers), dCarrierMissiles, Consts.CARRIER_PDC_CAP);

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

    static calculateFleetAfterPhaseI(
        startingAttack: AttackingFleet, 
        startingDefense: DefendingFleet, 
        battleResults: LongRangeBattleOutput
    ): RemainingFleet
    {
        const remainingAttackingFleet: AttackingFleet = {
            battleships: startingAttack.battleships.sub(battleResults.attacker.battleshipsLost),
            destroyers: startingAttack.destroyers.sub(battleResults.attacker.destroyersLost),
            carriers: startingAttack.carriers.sub(battleResults.attacker.carriersLost),
            fighters: startingAttack.fighters,
            drones: startingAttack.drones,
            troopTransports: startingAttack.troopTransports,
            dropShips: startingAttack.dropShips
        };

        const remainingDefendingFleet: DefendingFleet = {
            battleships: startingDefense.battleships.sub(battleResults.defender.battleshipsLost),
            destroyers: startingDefense.destroyers.sub(battleResults.defender.destroyersLost),
            carriers: startingDefense.carriers.sub(battleResults.defender.carriersLost),
            fighters: startingDefense.fighters,
            drones: startingDefense.drones,
            odps: startingDefense.odps
        };
    
        return {
            attacker: remainingAttackingFleet,
            defender: remainingDefendingFleet
        };
    }


    /** PHASE 2 - CAPITAL SHIP ENCOUNTER*/

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
                engagingFleet: {
                     battleships: minimumBattleships,
                     destroyers: attackingDestroyers,
                     carriers: UInt64.from(0),
                     fighters: attackingFighters,
                     drones: attackingDrones,
                     troopTransports: UInt64.from(0),
                     dropShips: UInt64.from(0)
                },
                extraBattleShips: UInt64.from(attackingBattleshipsLeft)
              },
              defendingFleet: {
                engagingFleet: {
                     battleships: minimumBattleships,
                     destroyers: defendingDestroyers,
                     carriers: UInt64.from(0),
                     fighters: defendingFighters,
                     drones: defendingDrones,
                     odps: UInt64.from(0)
                },
                extraBattleShips: UInt64.from(defendingBattleshipsLeft)
              }
         };
    }

    static totalAttackStrength(attack: AttackingFleet): UInt64 {
        return attack.battleships.mul(Consts.BATTLESHIP_ATTACK).add(
            attack.destroyers.mul(Consts.DESTROYER_ATTACK)
        ).add(
            attack.carriers.mul(Consts.CARRIER_ATTACK)
        ).add(
            attack.fighters.mul(Consts.FIGHTER_ATTACK)
        ).add(
            attack.drones.mul(Consts.DRONE_ATTACK)
        ).add(
            attack.troopTransports.mul(Consts.TROOP_TRANSPORT_ATTACK)
        ).add(
            attack.dropShips.mul(Consts.DROPSHIP_ATTACK)
        );
    }

    static totalDefenseStrength(defense: DefendingFleet): UInt64 {  
        return defense.battleships.mul(Consts.BATTLESHIP_HEALTH).add(
            defense.destroyers.mul(Consts.DESTROYER_HEALTH)
        ).add(
            defense.carriers.mul(Consts.CARRIER_HEALTH)
        ).add(
            defense.fighters.mul(Consts.FIGHTER_HEALTH)
        ).add(
            defense.drones.mul(Consts.DRONE_HEALTH)
        ).add(
            defense.odps.mul(Consts.ODP_ATTACK)
        );
    }

    static totalAttackHealth(attack: AttackingFleet): UInt64 {
        return attack.battleships.mul(Consts.BATTLESHIP_HEALTH).add(
            attack.destroyers.mul(Consts.DESTROYER_HEALTH)
        ).add(
            attack.carriers.mul(Consts.CARRIER_HEALTH)
        ).add(
            attack.fighters.mul(Consts.FIGHTER_HEALTH)
        ).add(
            attack.drones.mul(Consts.DRONE_HEALTH)
        ).add(
            attack.troopTransports.mul(Consts.TROOP_TRANSPORT_ATTACK)
        ).add(
            attack.dropShips.mul(Consts.DROPSHIP_ATTACK)
        );
    }

    static totalDefenseHealth(defense: DefendingFleet): UInt64 {
        return defense.battleships.mul(Consts.BATTLESHIP_HEALTH).add(
            defense.destroyers.mul(Consts.DESTROYER_HEALTH)
        ).add(
            defense.carriers.mul(Consts.CARRIER_HEALTH)
        ).add(
            defense.fighters.mul(Consts.FIGHTER_HEALTH)
        ).add(
            defense.drones.mul(Consts.DRONE_HEALTH)
        ).add(
            defense.odps.mul(Consts.ODP_ATTACK)
        );
    }

    static calculateCapitalShipClash(
        attack: AttackingFleet,
        defense: DefendingFleet
    ): Phase2Result {
        const attackStrength = BattleTwoUtils.totalAttackStrength(attack);
        const defenseStrength = BattleTwoUtils.totalDefenseStrength(defense);

        const attackHealth = BattleTwoUtils.totalAttackHealth(attack);
        const defenseHealth = BattleTwoUtils.totalDefenseHealth(defense);

        // calculate attack's damage potential on defense
        const attackDamagePotential = (attackStrength.mul(UInt64.from(1000))).div(defenseHealth);

        // calculate defense's damage potential on attack
        const defenseDamagePotential = (defenseStrength.mul(UInt64.from(1000))).div(attackHealth);

        const attackWins = Provable.if(
            attackDamagePotential.greaterThanOrEqual(defenseDamagePotential),
            Bool(true),
            Bool(false)
        );

        const attackLoss = UInt64.from(
            Provable.if(
                attackWins,
                Field(20),
                Field(50)
            )
        );

        const defenseLoss = UInt64.from(
            Provable.if(
                attackWins,
                Field(50),
                Field(20)
            )
        );


        const aBattleShipLosses = attack.battleships.mul(attackLoss).div(UInt64.from(100));
        const aDestroyerLosses = attack.destroyers.mul(attackLoss).div(UInt64.from(100));
        const aFighterLosses = attack.fighters.mul(attackLoss).div(UInt64.from(100));
        const aDroneLosses = attack.drones.mul(attackLoss).div(UInt64.from(100));

        const dBattleShipLosses = defense.battleships.mul(defenseLoss).div(UInt64.from(100));
        const dDestroyerLosses = defense.destroyers.mul(defenseLoss).div(UInt64.from(100));
        const dFighterLosses = defense.fighters.mul(defenseLoss).div(UInt64.from(100));
        const dDroneLosses = defense.drones.mul(defenseLoss).div(UInt64.from(100));


        return {
            attacker: {
                battleships: aBattleShipLosses,
                destroyers: aDestroyerLosses,
                fighters: aFighterLosses,
                drones: aDroneLosses
            },
            defender: {
                battleships: dBattleShipLosses,
                destroyers: dDestroyerLosses,
                fighters: dFighterLosses,
                drones: dDroneLosses
            },
            didAttackerWin: attackWins
        };
    }

    static calculateFleetAfterPhase2(
        attack: AttackingFleet,
        defense: DefendingFleet,
        result: Phase2Result
    ) :RemainingFleet {
        const remainingAttackingFleet: AttackingFleet = {
            battleships: attack.battleships.sub(result.attacker.battleships),
            destroyers: attack.destroyers.sub(result.attacker.destroyers),
            carriers: attack.carriers,
            fighters: attack.fighters.sub(result.attacker.fighters),
            drones: attack.drones.sub(result.attacker.drones),
            troopTransports: attack.troopTransports,
            dropShips: attack.dropShips
        };

        const remainingDefendingFleet: DefendingFleet = {
            battleships: defense.battleships.sub(result.defender.battleships),
            destroyers: defense.destroyers.sub(result.defender.destroyers),
            carriers: defense.carriers,
            fighters: defense.fighters.sub(result.defender.fighters),
            drones: defense.drones.sub(result.defender.drones),
            odps: defense.odps
        };

        return {
            attacker: remainingAttackingFleet,
            defender: remainingDefendingFleet
        };

    }

    /** PHASE 3  - FLEET ENGAGEMENTS */

    static fleetsForPhase3(
        attack: AttackingFleet,
        defense: DefendingFleet,
        Phase2BattlePlan: BattlePlan
    ): RemainingFleet {
        const remainingAttackingFleet: AttackingFleet = {
            battleships: attack.battleships.sub(Phase2BattlePlan.attackingFleet.engagingFleet.battleships),
            destroyers: attack.destroyers.sub(Phase2BattlePlan.attackingFleet.engagingFleet.destroyers),
            carriers: attack.carriers,
            fighters: attack.fighters.sub(Phase2BattlePlan.attackingFleet.engagingFleet.fighters),
            drones: attack.drones.sub(Phase2BattlePlan.attackingFleet.engagingFleet.drones),
            troopTransports: attack.troopTransports,
            dropShips: attack.dropShips
        };

        const remainingDefendingFleet: DefendingFleet = {
            battleships: defense.battleships.sub(Phase2BattlePlan.defendingFleet.engagingFleet.battleships),
            destroyers: defense.destroyers.sub(Phase2BattlePlan.defendingFleet.engagingFleet.destroyers),
            carriers: defense.carriers,
            fighters: defense.fighters.sub(Phase2BattlePlan.defendingFleet.engagingFleet.fighters),
            drones: defense.drones.sub(Phase2BattlePlan.defendingFleet.engagingFleet.drones),
            odps: defense.odps
        };

        return {
            attacker: remainingAttackingFleet,
            defender: remainingDefendingFleet
        };
    }

    static calculatePhase3Result(
        attack: AttackingFleet,
        defense: DefendingFleet,
    ): Phase3Result {

        const attackStrength = BattleTwoUtils.totalAttackStrength(attack);
        const defenseStrength = BattleTwoUtils.totalDefenseStrength(defense);

        const attackHealth = BattleTwoUtils.totalAttackHealth(attack);
        const defenseHealth = BattleTwoUtils.totalDefenseHealth(defense);

        // calculate attack's damage potential on defense
        const attackDamagePotential = (attackStrength.mul(UInt64.from(1000))).div(defenseHealth);

        // calculate defense's damage potential on attack
        const defenseDamagePotential = (defenseStrength.mul(UInt64.from(1000))).div(attackHealth);

        const attackWins = Provable.if(
            attackDamagePotential.greaterThanOrEqual(defenseDamagePotential),
            Bool(true),
            Bool(false)
        );

        const attackLoss = UInt64.from(
            Provable.if(
                attackWins,
                Field(20),
                Field(50)
            )
        );

        const defenseLoss = UInt64.from(
            Provable.if(
                attackWins,
                Field(50),
                Field(20)
            )
        );

        const aBattleShipLosses = attack.battleships.mul(attackLoss).div(UInt64.from(100));
        const aDestroyerLosses = attack.destroyers.mul(attackLoss).div(UInt64.from(100));
        const aCarrierLosses = attack.carriers.mul(attackLoss).div(UInt64.from(100));
        const aFighterLosses = attack.fighters.mul(attackLoss).div(UInt64.from(100));
        const aDroneLosses = attack.drones.mul(attackLoss).div(UInt64.from(100));
        const aTroopTransportLosses = attack.troopTransports.mul(attackLoss).div(UInt64.from(100));

        const dBattleShipLosses = defense.battleships.mul(defenseLoss).div(UInt64.from(100));
        const dDestroyerLosses = defense.destroyers.mul(defenseLoss).div(UInt64.from(100));
        const dCarrierLosses = defense.carriers.mul(defenseLoss).div(UInt64.from(100));
        const dFighterLosses = defense.fighters.mul(defenseLoss).div(UInt64.from(100));
        const dDroneLosses = defense.drones.mul(defenseLoss).div(UInt64.from(100));
        const dOdpsLosses = defense.odps.mul(defenseLoss).div(UInt64.from(100));

        return {
            attacker: {
                battleships: aBattleShipLosses,
                destroyers: aDestroyerLosses,
                carriers: aCarrierLosses,
                fighters: aFighterLosses,
                drones: aDroneLosses,
                troopTransports: aTroopTransportLosses
            },
            defender: {
                battleships: dBattleShipLosses,
                destroyers: dDestroyerLosses,
                carriers: dCarrierLosses,
                fighters: dFighterLosses,
                drones: dDroneLosses,
                odps: dOdpsLosses
            },
            didAttackerWin: attackWins
        };

    }

    static calculateFleetAfterPhase3(
        attack: AttackingFleet,
        defense: DefendingFleet,
        result: Phase3Result
    ) :RemainingFleet {
        const remainingAttackingFleet: AttackingFleet = {
            battleships: attack.battleships.sub(result.attacker.battleships),
            destroyers: attack.destroyers.sub(result.attacker.destroyers),
            carriers: attack.carriers.sub(result.attacker.carriers),
            fighters: attack.fighters.sub(result.attacker.fighters),
            drones: attack.drones.sub(result.attacker.drones),
            troopTransports: attack.troopTransports.sub(result.attacker.troopTransports),
            dropShips: attack.dropShips
        };

        const remainingDefendingFleet: DefendingFleet = {
            battleships: defense.battleships.sub(result.defender.battleships),
            destroyers: defense.destroyers.sub(result.defender.destroyers),
            carriers: defense.carriers.sub(result.defender.carriers),
            fighters: defense.fighters.sub(result.defender.fighters),
            drones: defense.drones.sub(result.defender.drones),
            odps: defense.odps.sub(result.defender.odps)
        };

        return {
            attacker: remainingAttackingFleet,
            defender: remainingDefendingFleet
        };

    }

    /** PHASE 4 - PLANETARY DROP */

    static fleetsForPhase4(
        attack: AttackingFleet,
        defense: DefendingFleet,
    ):RemainingFleet {
        const remainingAttackingFleet: AttackingFleet = {
            battleships: UInt64.from(0),
            destroyers: UInt64.from(0),
            carriers: UInt64.from(0),
            fighters: attack.fighters,
            drones: attack.drones,
            troopTransports: attack.troopTransports,
            dropShips: attack.dropShips
        };

        const remainingDefendingFleet: DefendingFleet = {
            battleships: UInt64.from(0),
            destroyers: UInt64.from(0),
            carriers: UInt64.from(0),
            fighters: defense.fighters,
            drones: defense.drones,
            odps: defense.odps
        };

        return {
            attacker: remainingAttackingFleet,
            defender: remainingDefendingFleet
        };
    }

    static calculatePhase4Result(
        attack: AttackingFleet,
        defense: DefendingFleet,
    ): Phase4Result {
        const attackStrength = BattleTwoUtils.totalAttackStrength(attack);
        const defenseStrength = BattleTwoUtils.totalDefenseStrength(defense);

        const attackHealth = BattleTwoUtils.totalAttackHealth(attack);
        const defenseHealth = BattleTwoUtils.totalDefenseHealth(defense);

        // calculate attack's damage potential on defense
        const attackDamagePotential = (attackStrength.mul(UInt64.from(1000))).div(defenseHealth);

        // calculate defense's damage potential on attack
        const defenseDamagePotential = (defenseStrength.mul(UInt64.from(1000))).div(attackHealth);

        const attackWins = Provable.if(
            attackDamagePotential.greaterThanOrEqual(defenseDamagePotential),
            Bool(true),
            Bool(false)
        );

        const attackLoss = UInt64.from(
            Provable.if(
                attackWins,
                Field(20),
                Field(50)
            )
        );

        const defenseLoss = UInt64.from(
            Provable.if(
                attackWins,
                Field(50),
                Field(20)
            )
        );

        const aFighterLosses = attack.fighters.mul(attackLoss).div(UInt64.from(100));
        const aDroneLosses = attack.drones.mul(attackLoss).div(UInt64.from(100));
        const aDropshipLosses = attack.dropShips.mul(attackLoss).div(UInt64.from(100));

        const dFighterLosses = defense.fighters.mul(defenseLoss).div(UInt64.from(100));
        const dDroneLosses = defense.drones.mul(defenseLoss).div(UInt64.from(100));
        const dOdpsLosses = defense.odps.mul(defenseLoss).div(UInt64.from(100));

        const aDropShipsLanded = attack.dropShips.sub(aDropshipLosses);
        const aTroopsLanded = aDropShipsLanded.mul(Consts.TROOP_TRANSPORT_DROPSHIPS);

        return {
            attacker: {
                fighters: aFighterLosses,
                drones: aDroneLosses,
                dropships: aDropshipLosses,
                dropshipsLanded: aDropShipsLanded,
                troopsLanded: aTroopsLanded
            },
            defender: {
                fighters: dFighterLosses,
                drones: dDroneLosses,
                odps: dOdpsLosses
            },
            didAttackerWin: attackWins
        };

    }


}


