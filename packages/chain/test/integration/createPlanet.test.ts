import { TestingAppChain } from "@proto-kit/sdk";
import { Field, PrivateKey } from "o1js";
import { log } from "@proto-kit/common";
import { BalancesKey, TokenId, UInt64 } from "@proto-kit/library";

import { CreatePlanetUtils } from "../../src/utils/createPlanet";
import { Consts } from "../../src/lib/consts";
import { Errors } from "../../src/lib/errors";

log.setLevel("ERROR");

describe("create planet utils", () => {

    const coords_in_range = {x: Field(100), y: Field(100)};
    const coords_out_of_range = {x: Field(20000), y: Field(20000)};
    
    const coords_satisfying_difficulty = {x: Field(150), y: Field(28)};
    

    const locationHash = CreatePlanetUtils.calculateLocationHash(
        coords_in_range.x, 
        coords_in_range.y
    );

    // for (let i = 0; i < 200; i++) {
    //     for (let j = 0; j < 200; j++) {
    //         const hash = CreatePlanetUtils.calculateLocationHash(Field(i), Field(j));
    //         if (hash.lessThan(Consts.BIRTHING_DIFFICULTY_CUTOFF).toString() === "true") {
    //             console.log("x: ", i, "y: ", j, "hash: ", hash.toString());
    //         }
    //     }
    // }



    it("should calculate the same location hash everytime", async () => {
        expect(locationHash).toEqual(
            CreatePlanetUtils.calculateLocationHash(
                coords_in_range.x, 
                coords_in_range.y
            )
        );
    });

    it("should verify if coordinates are out of range", async () => {
        expect(() => {
            CreatePlanetUtils.verifyCoordinate(coords_out_of_range.x, coords_out_of_range.y);
        }).toThrow(Errors.COORDINATE_OUT_OF_RANGE);
    });

    it("should not throw error if coordinates are in range", async () => {
        expect(() => {
        CreatePlanetUtils.verifyCoordinate(coords_in_range.x, coords_in_range.y);
        }).not.toThrow();
    });

    it("should verify if faction is invalid", async () => {
        expect(() => {
            CreatePlanetUtils.verifyFaction(Field(4));
        }).toThrow(Errors.INVALID_FACTION);
    });

    it("should not throw error if faction is valid", async () => {
        expect(() => {
            CreatePlanetUtils.verifyFaction(Consts.FACTION_A);
        }).not.toThrow();
    });

    it("should verify if coordinates are suitable", async () => {
        expect(() => {
            CreatePlanetUtils.verifySuitableCoordinates(
                coords_in_range.x, 
                coords_in_range.y);
        }).toThrow(Errors.COORDINATE_NOT_SUITABLE);
    });

    it("should verify if coordinates are suitable", async () => {
        expect(() => {
            CreatePlanetUtils.verifySuitableCoordinates(
                coords_satisfying_difficulty.x, 
                coords_satisfying_difficulty.y);
        }).not.toThrow();
    });

});
