import { Field } from "o1js";
import { log } from "@proto-kit/common";

/** INTERNAL IMPORTS  */
import { DefendPlanetPublicOutput } from "../../src/lib/models";
import { defenseValidator } from "../../src/proofs/defendPlanetProof";
import { DefendPlanetUtils } from '../../src/utils/defendPlanet';
import { PlanetaryDefense } from "../../src/lib/models";
import { Consts } from "../../src/lib/consts";
import { Errors } from "../../src/lib/errors";

log.setLevel("ERROR");

describe("defend planet proof", () => {

    const valid_defense = new PlanetaryDefense({
        battleships: Field(400), 
        destroyers: Field(300), 
        carriers: Field(225) 
    });

    const invalid_defense = new PlanetaryDefense({
        battleships: Field(500),
        destroyers: Field(300),
        carriers: Field(250)
    });

    const salt = Field(69);

    it("validates crew requirements for valid planetary defense", async () => {
        expect(defenseValidator(
            valid_defense,
            salt
        )).toEqual(
            new DefendPlanetPublicOutput({
                defenseHash: DefendPlanetUtils.calculateDefenseHash(valid_defense, salt),
                crewNeeded: valid_defense.totalCrewNeeded()
            })
        );
    });

    it("throws error when co-ordinates do not satisfy difficulty", async () => {
        expect(() => {
            defenseValidator(
                invalid_defense,
                salt
            );
        }).toThrow(Errors.DEFENSE_CREW);
    });
    
});