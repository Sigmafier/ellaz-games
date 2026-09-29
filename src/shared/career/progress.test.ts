import { describe, expect, it } from "vitest";
import { currentNode, isUnlocked, linearStates, nodeStates, recordClear, starsOf, totalStars } from "./progress";
import { freshSave } from "./save";
import type { CareerSave } from "./save";
import { TEST_CAMPAIGN } from "./testData";

const C = TEST_CAMPAIGN;
const clearAll = (ids: string[], save: CareerSave = freshSave()): CareerSave =>
  ids.reduce((s, id) => recordClear(C, s, id, 3), save);

describe("levels unlock strictly in order", () => {
  it("opens only the first level of the first world on a fresh save", () => {
    const s = freshSave();
    expect(isUnlocked(C, s, "city-1")).toBe(true);
    for (const id of ["city-2", "city-boss", "frost-1", "lava-boss"]) expect(isUnlocked(C, s, id)).toBe(false);
    expect(currentNode(C, s)?.id).toBe("city-1");
  });

  it("opens the next level when the one before it is cleared, and nothing further", () => {
    const s = clearAll(["city-1"]);
    expect(isUnlocked(C, s, "city-2")).toBe(true);
    expect(isUnlocked(C, s, "city-3")).toBe(false);
    expect(currentNode(C, s)?.id).toBe("city-2");
  });

  it("opens the next WORLD only once the boss of the world before it falls", () => {
    const three = clearAll(["city-1", "city-2", "city-3"]);
    expect(isUnlocked(C, three, "city-boss")).toBe(true);
    expect(isUnlocked(C, three, "frost-1")).toBe(false);
    const boss = recordClear(C, three, "city-boss", 1);
    expect(isUnlocked(C, boss, "frost-1")).toBe(true);
    expect(currentNode(C, boss)?.id).toBe("frost-1");
  });

  it("will not record a clear on a level that is still locked", () => {
    const s = freshSave();
    expect(recordClear(C, s, "frost-2", 3)).toBe(s);
    expect(starsOf(s, "frost-2")).toBe(0);
  });

  it("has no current node once everything is cleared", () => {
    const all = clearAll(C.worlds.flatMap((w) => w.levels.map((l) => l.id)));
    expect(currentNode(C, all)).toBeNull();
    expect(totalStars(all)).toBe(36);
  });

  it("refuses to answer about a level the campaign does not have", () => {
    expect(() => isUnlocked(C, freshSave(), "moon-1")).toThrow(/moon-1/);
  });
});

describe("stars are 0 to 3 per level, and only ever rise", () => {
  it("clamps a clear to between one and three whole stars", () => {
    expect(starsOf(recordClear(C, freshSave(), "city-1", 0), "city-1")).toBe(1);
    expect(starsOf(recordClear(C, freshSave(), "city-1", 7), "city-1")).toBe(3);
    expect(starsOf(recordClear(C, freshSave(), "city-1", 2.6), "city-1")).toBe(2);
    expect(starsOf(recordClear(C, freshSave(), "city-1", Number.NaN), "city-1")).toBe(1);
  });

  it("keeps the best, so a worse replay costs nothing", () => {
    const three = recordClear(C, freshSave(), "city-1", 3);
    expect(starsOf(recordClear(C, three, "city-1", 1), "city-1")).toBe(3);
    const one = recordClear(C, freshSave(), "city-1", 1);
    expect(starsOf(recordClear(C, one, "city-1", 2), "city-1")).toBe(2);
  });

  it("never mutates the save it was handed", () => {
    const s = freshSave();
    const before = JSON.stringify(s);
    recordClear(C, s, "city-1", 3);
    expect(JSON.stringify(s)).toBe(before);
  });
});

describe("the map's states: exactly one level is NOW", () => {
  it("draws done, now and locked from the save, with the stars beside them", () => {
    const s = clearAll(["city-1", "city-2"]);
    const states = nodeStates(C, s);
    expect(states.slice(0, 4).map((x) => x.state)).toEqual(["done", "done", "now", "locked"]);
    expect(states.slice(0, 3).map((x) => x.stars)).toEqual([3, 3, 0]);
    expect(states.filter((x) => x.state === "now")).toHaveLength(1);
  });

  it("has no NOW once the campaign is finished, and every level reads done", () => {
    const all = clearAll(C.worlds.flatMap((w) => w.levels.map((l) => l.id)));
    expect(nodeStates(C, all).every((x) => x.state === "done")).toBe(true);
  });
});

describe("a plain list of levels, for the board map", () => {
  it("unlocks in list order with the same rule as the trail", () => {
    const ids = ["p1", "p2", "p3", "p4"];
    const s = { ...freshSave(), stars: { p1: 2, p2: 1 } };
    expect(linearStates(ids, s).map((v) => [v.id, v.state, v.stars])).toEqual([
      ["p1", "done", 2], ["p2", "done", 1], ["p3", "now", 0], ["p4", "locked", 0],
    ]);
  });

  it("a star on a level whose predecessor was never cleared does not open the gap", () => {
    const s = { ...freshSave(), stars: { p3: 3 } };
    expect(linearStates(["p1", "p2", "p3"], s).map((v) => v.state)).toEqual(["now", "locked", "locked"]);
  });
});
