import { Field } from "o1js";
import { log } from "@proto-kit/common";

/** INTERNAL IMPORTS  */
import { CreatePlanetPublicOutput } from "../../src/lib/models";
import { planetValidator } from "../../src/proofs/createPlanetProof";
import { CreatePlanetUtils } from '../../src/utils/createPlanet';
import { Consts } from "../../src/lib/consts";
import { Errors } from "../../src/lib/errors";

log.setLevel("ERROR");

describe("create planet proof", () => {

    const coords_in_range = {x: Field(100), y: Field(100)};
    const coords_out_of_range = {x: Field(20000), y: Field(20000)};
    const coords_satisfying_difficulty = {x: Field(150), y: Field(28)};
    const valid_faction = Consts.FACTION_C;
    const invalid_faction = Field(4);

    it("validates in range difficulty sastisfying co-ordinates", async () => {
        expect(planetValidator(
            coords_satisfying_difficulty.x, 
            coords_satisfying_difficulty.y, 
            valid_faction
        )).toEqual(
            new CreatePlanetPublicOutput({
                locationHash: CreatePlanetUtils.calculateLocationHash(
                    coords_satisfying_difficulty.x, 
                    coords_satisfying_difficulty.y
                ),
                faction: valid_faction
            })
        );
    });



    it("throws error when co-ordinates do not satisfy difficulty", async () => {
        expect(() => {
            planetValidator(
                coords_in_range.x, 
                coords_in_range.y, 
                valid_faction
            );
        }).toThrow(Errors.COORDINATE_NOT_SUITABLE);
    });

    it("throws error when co-ordinates do not satisfy faction requirements", async () => {
        expect(() => {
            planetValidator(
                coords_satisfying_difficulty.x, 
                coords_satisfying_difficulty.y, 
                invalid_faction
            );
        }).toThrow(Errors.INVALID_FACTION);
    });
    
    it("throws error when co-ordinates are out of range", async () => { 
        expect(() => {
            planetValidator(
                coords_out_of_range.x, 
                coords_out_of_range.y, 
                valid_faction
            );
        }).toThrow(Errors.COORDINATE_OUT_OF_RANGE);
    });
    
});