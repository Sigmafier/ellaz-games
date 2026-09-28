import { describe, expect, it } from "vitest";
import { mulberry32 } from "@shared/rng";
import { PC_SHAPE, START_LEN, newRound } from "./logic";
import { TIER, boardOf, grantFor, milestoneCrossed, statusOf } from "./result";

describe("what a round pays - a reason and a tier, never an amount", () => {
  it("a win is the star, tiered by how many bots it beat", () => {
    expect(grantFor({ won: true, newBest: true, peak: 20, bots: 5 })).toEqual({ reason: "level_complete", tier: "hard", level: "bots-5" });
    expect(TIER).toEqual({ 3: "easy", 4: "medium", 5: "hard" });
  });

  it("a new longest that did not win is the consolation star - one star a round, never two", () => {
    expect(grantFor({ won: false, newBest: true, peak: 12, bots: 3 })).toEqual({ reason: "personal_best", tier: "easy", level: "bots-3" });
  });

  it("a snake that never ate sets no record worth a star", () => {
    expect(grantFor({ won: false, newBest: true, peak: START_LEN, bots: 4 })).toBeNull();
    expect(grantFor({ won: false, newBest: false, peak: 30, bots: 4 })).toBeNull();
  });

  it("a coin every five apples", () => {
    expect(milestoneCrossed(4, 5)).toBe(true);
    expect(milestoneCrossed(5, 6)).toBe(false);
    expect(milestoneCrossed(9, 10)).toBe(true);
  });

  it("a record per bot count", () => {
    expect(boardOf(4)).toBe("bots-4");
  });
});

describe("what the chrome is told", () => {
  it("the player's length, place and everyone's row, best first", () => {
    const r = newRound(PC_SHAPE, 4, mulberry32(1));
    const s = statusOf(r, "playing", false, 4, false);
    expect(s.len).toBe(START_LEN);
    expect(s.count).toBe(5);
    expect(s.rows.map((x) => x.id).sort()).toEqual([0, 1, 2, 3, 4]);
    expect(s.seconds).toBe(90);
  });

  it("an out player reads 0 long, as the mock shows it, and keeps the longest it got", () => {
    const r = newRound(PC_SHAPE, 3, mulberry32(1));
    const out = { ...r, snakes: r.snakes.map((x) => (x.id === 0 ? { ...x, alive: false, body: [], peak: 14 } : x)) };
    const s = statusOf(out, "out", false, 3, false);
    expect(s.len).toBe(0);
    expect(s.peak).toBe(14);
    expect(s.rows[0]).toEqual({ id: 0, len: 14, alive: false });
  });
});
