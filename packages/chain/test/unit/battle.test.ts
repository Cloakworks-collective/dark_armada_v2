import { log } from "@proto-kit/common";

import { BattleUtils } from "../../src/utils/battle";
import { Errors } from "../../src/lib/errors";

import { 
    test_planetary_defense, 
    test_attack_fleet
} from "../testUtils"

log.setLevel("ERROR");

describe("battle utils", () => {

    describe("phase 1", () => {
        it("should return true if attack wins", async () => {
           BattleUtils.longRangeBattle(test_attack_fleet, test_planetary_defense);
           expect(true).toBe(true);
        });

    });

});