import { describe, expect, it } from "vitest";
import { DIAMONDS_KEY } from "@sdk/diamonds";
import { DIAMOND_RECORD, tallyRecords } from "./backupTally";

describe("the backup card's tally", () => {
  it("names the SAME key the diamond balance is stored under", () => {
    expect(DIAMOND_RECORD).toBe(DIAMONDS_KEY);
  });

  it("the diamond balance is not counted as a record, and is shown as its own number", () => {
    const t = tallyRecords({ "ellaz:snake:score:normal": 40, "ellaz:sudoku:score:easy": 90, [DIAMOND_RECORD]: 3 });
    expect(t).toEqual({ records: 2, diamonds: 3 });
  });

  it("no diamonds reads as 0", () => {
    expect(tallyRecords({ "ellaz:snake:score:normal": 40 })).toEqual({ records: 1, diamonds: 0 });
  });
});
