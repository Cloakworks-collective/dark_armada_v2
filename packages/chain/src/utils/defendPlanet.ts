import { Field, Poseidon } from 'o1js';

/** INTERNAL IMPORTS */

import { PlanetaryDefense } from '../lib/models';
import { Consts } from '../lib/consts';
import { Errors } from '../lib/errors';

export class DefendPlanetUtils {
    
    static calculateDefenseHash(defense: PlanetaryDefense, salt: Field): Field {
        return Poseidon.hash(PlanetaryDefense.toFields(defense).concat([salt]));
    }

    static verifyCrew(defense: PlanetaryDefense){
        const totalCrew = defense.totalCrewNeeded();
        totalCrew.assertLessThanOrEqual(
            Consts.MAX_DEFENSE_CREW, 
            Errors.DEFENSE_CREW
        );
    }


}