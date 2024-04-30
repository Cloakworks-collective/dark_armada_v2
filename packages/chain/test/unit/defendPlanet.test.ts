import { log } from "@proto-kit/common";


import { DefendPlanetUtils } from "../../src/utils/defendPlanet";
import { Errors } from "../../src/lib/errors";

import { 
    valid_defense, 
    invalid_defense, 
    valid_defense_hash, 
    salt 
} from "../testUtils"

log.setLevel("ERROR");

describe("defend planet utils", () => {

    it("should calculate the same defense hash everytime", async () => {
        const defense_hash = DefendPlanetUtils.calculateDefenseHash(valid_defense, salt);
        expect(defense_hash).toMatchObject(valid_defense_hash);
    });

    it("should verify planetary defense strength", async () => {
        expect(() => {
            DefendPlanetUtils.verifyCrew(valid_defense);
        }).not.toThrow();
    });

    it("should throw an error if crew needed to man defense is too high", async () => {
        expect(() => {
            DefendPlanetUtils.verifyCrew(invalid_defense);
        }).toThrow(Errors.PLANETARY_DEFENSE_COST);
    });

});