import { Field } from "o1js";
import { log } from "@proto-kit/common";


import { DefendPlanetUtils } from "../../src/utils/defendPlanet";
import { PlanetaryDefense } from "../../src/lib/models";
import { Errors } from "../../src/lib/errors";

log.setLevel("ERROR");

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
const valid_defense_hash = Field(6957730872647656007186404839190081976719051977621935914218134663428688195978n);    

describe("defend planet utils", () => {

    it("should calculate the same defense hash everytime", async () => {
        const defense_hash = DefendPlanetUtils.calculateDefenseHash(valid_defense, salt);
        expect(defense_hash).toEqual(valid_defense_hash);
    });

    it("should verify planetary defense strength", async () => {
        expect(() => {
            DefendPlanetUtils.verifyCrew(valid_defense);
        }).not.toThrow();
    });

    it("should throw an error if crew needed to man defense is too high", async () => {
        expect(() => {
            DefendPlanetUtils.verifyCrew(invalid_defense);
        }).toThrow(Errors.DEFENSE_CREW);
    });

});