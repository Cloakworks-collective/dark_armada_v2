import { Field, Provable, Bool} from 'o1js';
import { UInt64 } from '@proto-kit/library';

/** INTERNAL IMPORTS */

import { AttackFleet, PlanetaryDefense } from '../lib/models';
import { Consts } from '../lib/consts';
import { Errors } from '../lib/errors';


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

    static calculateMissilesLaunched(fleet: AttackFleet | PlanetaryDefense): UInt64 {
        return  UInt64.from(fleet.battleships).mul(Consts.DESTROYER_MISSILE_CAP).add(
            UInt64.from(fleet.destroyers).mul(Consts.DESTROYER_MISSILE_CAP)
        ).mul(Consts.NUMBER_OF_MISSILE_SALVOS)
    }

    static calculateInterceptors(fleet: AttackFleet | PlanetaryDefense): UInt64 {
        return UInt64.from(fleet.battleships).mul(Consts.BATTLESHIP_INTERCEPTOR_CAP).add(
            UInt64.from(fleet.destroyers).mul(Consts.DESTROYER_INTERCEPTOR_CAP)
        ).add(
            UInt64.from(fleet.carriers).mul(Consts.CARRIER_INTERCEPTOR_CAP)
        ).mul(Consts.NUMBER_OF_INTERCEPTOR_SALVOS)
    }

    static calculateMissilesGotThrough(missiles: UInt64, interceptors: UInt64): UInt64 {
        const num = Provable.if(missiles.greaterThanOrEqual(interceptors), missiles.sub(interceptors).value, Field(0));
        return UInt64.from(num);
    }

    static  calculateShipsDestroyed(ships: UInt64, missiles: UInt64, PdcCapacity: UInt64): UInt64 {
        const max = missiles.div(PdcCapacity)
        const num = Provable.if(ships.greaterThanOrEqual(max), max.value, ships.value);
        return UInt64.from(num);
    }

    // static calculateMissilesTargeting(fleet: AttackFleet | PlanetaryDefense, cost: Field): UInt64 {

    //     UInt64.from((Consts.BATTLESHIP_COST).mul(defense.battleships).mul(attackMissilesGotThru)).div(defenseCost);
    // }
}