import { Field, Provable, Bool} from 'o1js';
import { UInt64 } from '@proto-kit/library';

/** INTERNAL IMPORTS */

import { AttackFleet, PlanetaryDefense } from '../lib/models';
import { Consts } from '../lib/consts';
import { Errors } from '../lib/errors';
import { BattleCalculationOutput, LongRangeBattleOutput } from '../lib/models';

export class BattleUtils {
    
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

    static longRangeBattle(
        attack: AttackFleet, 
        defense: PlanetaryDefense
    ): LongRangeBattleOutput {
        const aBattleShipSalvo = attack.battleships.mul(Consts.BATTLESHIP_SALVO);
        const aDestroyerSalvo = attack.destroyers.mul(Consts.DESTROYER_SALVO);
        const attackerMissiles = (aBattleShipSalvo.add(aDestroyerSalvo)).
            mul(Consts.NUMBER_OF_MISSILE_SALVOS);

        console.log("Attackers launched missiles: ", attackerMissiles.toString());   

        const dBattleShipSalvo = defense.battleships.mul(Consts.BATTLESHIP_SALVO);
        const dDestroyerSalvo = defense.destroyers.mul(Consts.DESTROYER_SALVO);
        const defenderMissiles = (dBattleShipSalvo.add(dDestroyerSalvo)).
            mul(Consts.NUMBER_OF_MISSILE_SALVOS);

        console.log("Defenders launched missiles: ", defenderMissiles.toString());

        const aBattleShipIntercept = attack.battleships.mul(Consts.BATTLESHIP_INTERCEPTOR_CAP);
        const aDestroyerIntercept = attack.destroyers.mul(Consts.DESTROYER_INTERCEPTOR_CAP);
        const aCarrierIntercept = attack.carriers.mul(Consts.CARRIER_INTERCEPTOR_CAP);
        const attackerInterceptors = (aBattleShipIntercept.add(aDestroyerIntercept).add(aCarrierIntercept)).
            mul(Consts.NUMBER_OF_INTERCEPTOR_SALVOS);

        console.log("Attackers launched interceptor");    

        const dBattleShipIntercept = defense.battleships.mul(Consts.BATTLESHIP_INTERCEPTOR_CAP);
        const dDestroyerIntercept = defense.destroyers.mul(Consts.DESTROYER_INTERCEPTOR_CAP);
        const dCarrierIntercept = defense.carriers.mul(Consts.CARRIER_INTERCEPTOR_CAP);
        const defenderInterceptors = (dBattleShipIntercept.add(dDestroyerIntercept).add(dCarrierIntercept)).
            mul(Consts.NUMBER_OF_INTERCEPTOR_SALVOS);

        console.log("Defenders launched interceptor");
            
        const attackMissilesGotThru = attackerMissiles.sub(defenderInterceptors);
        const defenseMissilesGotThru = defenderMissiles.sub(attackerInterceptors);

        console.log("Attackers missiles got through: ", attackMissilesGotThru.toString());
        console.log("Defenders missiles got through: ", defenseMissilesGotThru.toString());

        const attackCost = UInt64.from(attack.attackCost());
        const defenseCost = UInt64.from(defense.totalCost());

        const missilesForABattleShips = UInt64.from((Consts.BATTLESHIP_COST).mul(attack.battleships).mul(defenseMissilesGotThru)).div(attackCost);
        const missilesForADestroyers = UInt64.from((Consts.DESTROYER_COST).mul(attack.destroyers).mul(defenseMissilesGotThru)).div(attackCost);
        const missilesForACarriers = UInt64.from((Consts.CARRIER_COST).mul(attack.carriers).mul(defenseMissilesGotThru)).div(attackCost);

        console.log("Missiles targeting attack battleships", missilesForABattleShips.toString());
        console.log("Missiles targeting attack destroyers", missilesForADestroyers.toString());
        console.log("Missiles targeting attack carriers", missilesForACarriers.toString());

        const missilesForDBattleShips = UInt64.from((Consts.BATTLESHIP_COST).mul(defense.battleships).mul(attackMissilesGotThru)).div(defenseCost);
        const missilesForDDestroyers = UInt64.from((Consts.DESTROYER_COST).mul(defense.destroyers).mul(attackMissilesGotThru)).div(defenseCost);
        const missilesForDCarriers = UInt64.from((Consts.CARRIER_COST).mul(defense.carriers).mul(attackMissilesGotThru)).div(defenseCost);

        console.log("Missiles targeting defense battleships", missilesForDBattleShips.toString());
        console.log("Missiles targeting defense destroyers", missilesForDDestroyers.toString());
        console.log("Missiles targeting defense carriers", missilesForDCarriers.toString());

        const aBattleshipsDestroyed = missilesForABattleShips.div(UInt64.from(Consts.BATTLESHIP_PDC_CAP)).value;
        const aDestroyersDestroyed = missilesForADestroyers.div(UInt64.from(Consts.BATTLESHIP_PDC_CAP)).value;
        const aCarriersDestroyed = missilesForACarriers.div(UInt64.from(Consts.BATTLESHIP_PDC_CAP)).value;

        console.log("Attack battleships destroyed", aBattleshipsDestroyed.toString());
        console.log("Attack destroyers destroyed", aDestroyersDestroyed.toString());
        console.log("Attack carriers destroyed", aCarriersDestroyed.toString());

        const dBattleshipsDestroyed = missilesForDBattleShips.div(UInt64.from(Consts.BATTLESHIP_PDC_CAP)).value;
        const dDestroyersDestroyed = missilesForDDestroyers.div(UInt64.from(Consts.BATTLESHIP_PDC_CAP)).value;
        const dCarriersDestroyed = missilesForDCarriers.div(UInt64.from(Consts.BATTLESHIP_PDC_CAP)).value;

        console.log("Defense battleships destroyed", dBattleshipsDestroyed.toString());
        console.log("Defense destroyers destroyed", dDestroyersDestroyed.toString());
        console.log("Defense carriers destroyed", dCarriersDestroyed.toString());

        return new LongRangeBattleOutput({
            aMissiles: attackerMissiles,
            dMissiles: defenderMissiles,
            aIntercepted: attackerInterceptors,
            dIntercepted: defenderInterceptors,
            aBattleshipsLost: aBattleshipsDestroyed,
            aDestroyersLost:  aDestroyersDestroyed,
            aCarriersLost: aCarriersDestroyed,
            dBattleshipsLost: dBattleshipsDestroyed,
            dDestroyersLost: dDestroyersDestroyed,
            dCarriersLost: dCarriersDestroyed
        });
    }

    // static computeBattleResult(
    //     attack: AttackFleet, 
    //     defense: PlanetaryDefense
    // ): BattleCalculationOutput {
    //     // STEP 1: Phase 1 - Long Range Attacks

    //     // STEP 2: Phase 2 - Battle of the Beheamoths (Battleships and their escorts engage)

    //     // STEP 3: Phase 3 - Battleships and Destroyers try to take out the Carriers

    //     // STEP 4: Phase 4 - Carriers try to take out the ODPs (Orbital Defense Platforms) and Troop Transports

    //     // STEP 5: Phase 5 - Troop Transport Dropships try to Land on the Planet, while the ODPs try to take them out

    //     return new BattleCalculationOutput({
    //         phaseOne: new LongRangeBattle({
    //             attackerMissilesLaunched: Field(0),
    //             defenderMissilesLaunched: Field(0),
    //             attackerMissilesIntercepted: Field(0),
    //             defenderMissilesIntercepted: Field(0)
    //         });
    //     });

    // }

}