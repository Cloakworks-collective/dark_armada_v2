import { Field } from "o1js";
import { log } from "@proto-kit/common";

/** INTERNAL IMPORTS  */
import { DefendPlanetPublicOutput } from "../../src/lib/models";
import { defenseValidator } from "../../src/proofs/defendPlanetProof";
import { DefendPlanetUtils } from '../../src/utils/defendPlanet';
import { PlanetaryDefense } from "../../src/lib/models";
import { Errors } from "../../src/lib/errors";
import { valid_defense, invalid_defense, salt } from "../testUtils";

log.setLevel("ERROR");

describe("defend planet proof", () => {

    it("validates crew requirements for valid planetary defense", async () => {
        expect(defenseValidator(
            valid_defense,
            salt
        )).toEqual(
            new DefendPlanetPublicOutput({
                defenseHash: DefendPlanetUtils.calculateDefenseHash(valid_defense, salt),
                crewNeeded: valid_defense.totalCost()
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