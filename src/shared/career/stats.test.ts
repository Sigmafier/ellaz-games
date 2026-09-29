import { describe, expect, it } from "vitest";
import { careerStats, computeStats, STAT_IDS } from "./stats";
import type { StatBlock } from "./stats";
import { bankItems } from "./gear";
import { freshSave } from "./save";
import { TEST_GEAR, TEST_SHOP } from "./testData";

const BASE: StatBlock = { health: 100, speed: 8, damage: 10, magnet: 1, luck: 5 };

describe("stats: base plus what is worn plus what was bought", () => {
  it("names five stats", () => {
    expect(STAT_IDS).toEqual(["health", "speed", "damage", "magnet", "luck"]);
  });

  it("returns the base untouched when nothing modifies it", () => {
    expect(computeStats(BASE, [])).toEqual(BASE);
  });

  it("adds, then multiplies, then applies percentages, in that order", () => {
    const out = computeStats(BASE, [
      { stat: "damage", kind: "add", amount: 10 },
      { stat: "damage", kind: "mul", amount: 1.5 },
      { stat: "damage", kind: "pct", amount: 10 },
      { stat: "damage", kind: "pct", amount: 10 },
    ]);
    // (10 + 10) x 1.5 x (1 + 20%) = 36
    expect(out.damage).toBeCloseTo(36, 9);
    expect(out.health).toBe(100);
  });

  it("never mutates the base block", () => {
    const b = { ...BASE };
    computeStats(b, [{ stat: "health", kind: "add", amount: 50 }]);
    expect(b).toEqual(BASE);
  });

  it("folds a whole save: gear worn and rows bought", () => {
    const s = { ...bankItems(TEST_GEAR, freshSave(), ["armor:epic", "weapon:common"]), shop: { heart: 1, power: 2, shield: 1 } };
    const out = careerStats(BASE, TEST_GEAR, TEST_SHOP, s);
    expect(out.health).toBe(100 + 45 + 20);
    expect(out.damage).toBeCloseTo((10 + 4) * 1.2, 9);
    expect(out.speed).toBe(8);
    expect(out.luck).toBe(5);
  });
});
