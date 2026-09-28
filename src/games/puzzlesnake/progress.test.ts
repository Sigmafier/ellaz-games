import { describe, expect, it } from "vitest";
import { LEVEL_IDS } from "./levels";
import { isOpen, readStars, recordSolve, startingLevel } from "./progress";

describe("readStars keeps only what it can trust", () => {
  it("reads a good record", () => {
    expect(readStars({ "1-1": 3, "1-2": 1 })).toEqual({ "1-1": 3, "1-2": 1 });
  });

  it("drops junk without throwing", () => {
    for (const junk of [null, undefined, 7, "3", [], [3, 2]]) expect(readStars(junk)).toEqual({});
    expect(readStars({ "1-1": 4, "1-2": 0, "1-3": 2.5, "1-4": "3", "9-9": 3, "1-5": 2 })).toEqual({ "1-5": 2 });
  });
});

describe("which levels are open", () => {
  it("the first always; every other once the one before is solved", () => {
    expect(isOpen("1-1", {})).toBe(true);
    expect(isOpen("1-2", {})).toBe(false);
    expect(isOpen("1-2", { "1-1": 1 })).toBe(true);
    expect(isOpen("1-3", { "1-1": 3 })).toBe(false);
    // one line through both worlds
    expect(isOpen("2-1", { "1-6": 1 })).toBe(true);
    expect(isOpen("2-1", {})).toBe(false);
    expect(isOpen("nope", {})).toBe(false);
  });

  it("starts a player on the first open level they have not solved", () => {
    expect(startingLevel({})).toBe("1-1");
    expect(startingLevel({ "1-1": 2, "1-2": 3 })).toBe("1-3");
    const all = Object.fromEntries(LEVEL_IDS.map((id) => [id, 1 as const]));
    expect(startingLevel(all)).toBe("2-6");
  });
});

describe("recording a solve", () => {
  it("keeps the best, and says whether it was a first solve or an improvement", () => {
    const a = recordSolve({}, "1-1", 2);
    expect(a).toEqual({ stars: { "1-1": 2 }, first: true, improved: false });
    const b = recordSolve(a.stars, "1-1", 1);
    expect(b).toEqual({ stars: { "1-1": 2 }, first: false, improved: false });
    const c = recordSolve(b.stars, "1-1", 3);
    expect(c).toEqual({ stars: { "1-1": 3 }, first: false, improved: true });
    const d = recordSolve(c.stars, "1-1", 3);
    expect(d.improved).toBe(false);
  });
});
