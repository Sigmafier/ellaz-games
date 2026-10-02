import { describe, expect, it } from "vitest";
import { mulberry32 } from "@shared/rng";
import { PC_SHAPE, START_LEN, newRound } from "./logic";
import { TIER, boardOf, grantFor, milestoneCrossed, statusOf } from "./result";

describe("what a round pays - a reason and a tier, never an amount", () => {
  it("a win is the star, tiered by the level", () => {
    expect(grantFor({ won: true, newBest: true, peak: 20, level: "hard", map: "open" })).toEqual({ reason: "level_complete", tier: "hard", level: "bots-5" });
    expect(TIER).toEqual({ easy: "easy", normal: "medium", hard: "hard" });
  });

  it("a new longest that did not win is the consolation star - one star a round, never two", () => {
    expect(grantFor({ won: false, newBest: true, peak: 12, level: "easy", map: "open" })).toEqual({ reason: "personal_best", tier: "easy", level: "bots-2" });
  });

  it("a snake that never ate sets no record worth a star", () => {
    expect(grantFor({ won: false, newBest: true, peak: START_LEN, level: "normal", map: "open" })).toBeNull();
    expect(grantFor({ won: false, newBest: false, peak: 30, level: "normal", map: "rocks" })).toBeNull();
  });

  it("a coin every five apples", () => {
    expect(milestoneCrossed(4, 5)).toBe(true);
    expect(milestoneCrossed(5, 6)).toBe(false);
    expect(milestoneCrossed(9, 10)).toBe(true);
  });

  it("a record per level and map - and a Normal or Hard record set before levels existed is still the one to beat", () => {
    expect(boardOf("normal")).toBe("bots-3");
    expect(boardOf("hard")).toBe("bots-5");
    expect(boardOf("easy")).toBe("bots-2");
    expect(boardOf("hard", "rocks")).toBe("bots-5-rocks");
  });
});

describe("what the chrome is told", () => {
  it("the player's length, place and everyone's row, best first", () => {
    const r = newRound(PC_SHAPE, 4, mulberry32(1));
    const s = statusOf(r, "playing", false, { level: "normal", map: "open", humans: 1 }, false, []);
    expect(s.len).toBe(START_LEN);
    expect(s.count).toBe(5);
    expect(s.rows.map((x) => x.id).sort()).toEqual([0, 1, 2, 3, 4]);
    expect(s.seconds).toBe(90);
  });

  it("an out player reads 0 long, as the mock shows it, and keeps the longest it got", () => {
    const r = newRound(PC_SHAPE, 3, mulberry32(1));
    const out = { ...r, snakes: r.snakes.map((x) => (x.id === 0 ? { ...x, alive: false, body: [], peak: 14 } : x)) };
    const s = statusOf(out, "out", false, { level: "normal", map: "open", humans: 1 }, false, []);
    expect(s.len).toBe(0);
    expect(s.peak).toBe(14);
    expect(s.rows[0]).toEqual({ id: 0, len: 14, alive: false });
  });
});
