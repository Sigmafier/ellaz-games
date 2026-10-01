import { describe, expect, it } from "vitest";
import { START_LEN, MIN_LEN } from "./body";
import { bossRow, heartBlock, HEART_CAP, HEART_COLS, resultLine, runStats } from "./hud";

/**
 * The C3 HUD's numbers (operator, 2026-10-01: "Life: hearts top left, bigger
 * hearts. Length: top right."). Pure, so every state the block can be in is
 * driven here rather than hoped for in a browser.
 */

describe("the heart block", () => {
  it("is two rows of four, full, at the start of a run", () => {
    const b = heartBlock(START_LEN, START_LEN, 1);
    expect(HEART_CAP).toBe(8);
    expect(HEART_COLS).toBe(4);
    expect(b.max).toBe(8);
    expect(b.cells).toEqual([true, true, true, true, true, true, true, true]);
    expect(b.danger).toBe(false);
  });

  it("stays full while the tail can take more hits than it draws - Regrow and Long Body grow it far past 8", () => {
    for (const len of [START_LEN, 40, 60, 80]) {
      const b = heartBlock(len, len, 1);
      expect(b.now, `len ${len}`).toBe(8);
      expect(b.cells.every(Boolean), `len ${len}`).toBe(true);
    }
  });

  it("a lost heart stays drawn, as an outline, in its place", () => {
    // MIN_LEN + 2 is three hits left.
    const b = heartBlock(MIN_LEN + 2, START_LEN, 1);
    expect(b.max).toBe(8);
    expect(b.now).toBe(3);
    expect(b.cells).toEqual([true, true, true, false, false, false, false, false]);
    expect(b.danger).toBe(false);
  });

  it("turns red at the last heart, and only then", () => {
    expect(heartBlock(MIN_LEN, START_LEN, 1).danger).toBe(true);
    expect(heartBlock(MIN_LEN, START_LEN, 1).now).toBe(1);
    expect(heartBlock(MIN_LEN + 1, START_LEN, 1).danger).toBe(false);
  });

  it("counts by the bite: two segments a bump halves the hearts", () => {
    expect(heartBlock(MIN_LEN + 3, START_LEN, 2).now).toBe(2);
    expect(heartBlock(MIN_LEN + 3, START_LEN, 1).now).toBe(4);
  });

  it("handles a cap under eight (a short block still lays out four to a row)", () => {
    const b = heartBlock(MIN_LEN + 1, START_LEN, 1, 5);
    expect(b.max).toBe(5);
    expect(b.cells).toEqual([true, true, false, false, false]);
  });
});

describe("the boss row", () => {
  it("counts toward stage 1's warden as length and crushed, icons supplied by the view", () => {
    const r = bossRow("normal", { len: 25, crushed: 0, stage: 1 }, null);
    expect(r).toMatchObject({ kind: "meter", len: "25/50", crushed: "0/10" });
    if (r?.kind !== "meter") throw new Error("meter");
    expect(r.fraction).toBeCloseTo(0.5, 5);
  });

  it("stage 3 has no length trigger, so it reads crushed alone", () => {
    const r = bossRow("normal", { len: 30, crushed: 4, stage: 3 }, null);
    expect(r?.kind).toBe("meter");
    if (r?.kind !== "meter") throw new Error("meter");
    expect(r.len).toBeNull();
    expect(r.crushed).toMatch(/^4\/\d+$/);
  });

  it("while a warden is up it is the warden's health, with no numbers", () => {
    expect(bossRow("normal", null, { now: 2, max: 4 })).toEqual({ kind: "warden", fraction: 0.5 });
  });

  it("is absent when there is neither a meter nor a warden", () => {
    expect(bossRow("normal", null, null)).toBeNull();
  });
});

describe("crushed, best and level leave play for the pause and game-over cards", () => {
  it("are three numbers, in one order, with best never under this run's score", () => {
    expect(runStats(12, 40, 3)).toEqual([
      { id: "crushed", value: 12 },
      { id: "best", value: 40 },
      { id: "level", value: 3 },
    ]);
    expect(runStats(55, 40, 3)[1]).toEqual({ id: "best", value: 55 });
  });

  it("the game-over line names all three", () => {
    const words = { headline: "Out of tail", crushed: "Crushed", best: "Best", level: "Level", newBest: "New best!" };
    expect(resultLine(words, runStats(12, 40, 3), false)).toBe("Out of tail · Crushed 12 · Best 40 · Level 3");
    expect(resultLine(words, runStats(55, 40, 4), true)).toBe("Out of tail · Crushed 55 · Best 55 · Level 4 · New best!");
  });
});
