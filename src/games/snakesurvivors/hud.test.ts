import { describe, expect, it } from "vitest";
import { START_LEN, MIN_LEN } from "./body";
import { bossRow, heartBlock, HEART_CAP, HEART_COLS, resultLine, runStats } from "./hud";

/**
 * The C3 HUD's numbers (operator, 2026-10-01: "Life: hearts top left, bigger
 * hearts. Length: top right."). Pure, so every state the block can be in is
 * driven here rather than hoped for in a browser.
 */

describe("the heart block", () => {
  it("is two rows of four, full, at the start of a run and while the tail is at its longest", () => {
    expect(HEART_CAP).toBe(8);
    expect(HEART_COLS).toBe(4);
    for (const len of [START_LEN, 40, 60, 80]) {
      const b = heartBlock(len, len, 1);
      expect(b.max, `len ${len}`).toBe(8);
      expect(b.now, `len ${len}`).toBe(8);
      expect(b.cells, `len ${len}`).toEqual([1, 1, 1, 1, 1, 1, 1, 1]);
      expect(b.danger, `len ${len}`).toBe(false);
    }
  });

  // The operator, 2026-10-02: "i dont see any hearts go down when i crash".
  // A run starts able to take 26 hits; the old block showed only the last 8.
  it("EVERY crash drains the hearts - from the first one, at every bump cost, on any tail", () => {
    for (const peak of [START_LEN, 45, 60, 100]) {
      for (const bite of [1, 2, 3, 4, 6]) {
        let len = peak;
        let before = heartBlock(len, peak, bite).fill;
        expect(before, `peak ${peak}`).toBe(8);
        while (len - bite >= MIN_LEN) {
          len -= bite;
          const after = heartBlock(len, peak, bite).fill;
          expect(after, `peak ${peak} bite ${bite} len ${len}`).toBeLessThan(before);
          before = after;
        }
      }
    }
  });

  it("the first crash on a fresh tail already shows: a part heart where a full one was", () => {
    const b = heartBlock(START_LEN - 2, START_LEN, 2);
    expect(b.now).toBe(7);
    expect(b.cells[7]).toBeGreaterThan(0);
    expect(b.cells[7]).toBeLessThan(1);
  });

  it("drains from the end: full hearts, then one part heart, then outlines", () => {
    const b = heartBlock(MIN_LEN + 12, START_LEN, 1); // 13 of 26 life = 4 hearts
    expect(b.now).toBe(4);
    expect(b.cells).toEqual([1, 1, 1, 1, 0, 0, 0, 0]);
    const c = heartBlock(MIN_LEN + 13, START_LEN, 1); // 14 of 26 = 4.31
    expect(c.cells.slice(0, 4)).toEqual([1, 1, 1, 1]);
    expect(c.cells[4]).toBeCloseTo(8 * 14 / 26 - 4, 6);
    expect(c.cells.slice(5)).toEqual([0, 0, 0]);
  });

  it("growing refills them: the hearts are a share of the run's LONGEST tail", () => {
    expect(heartBlock(40, 40, 1).fill).toBe(8);
    expect(heartBlock(40, 60, 1).fill).toBeCloseTo((8 * 38) / 58, 6);
  });

  it("turns red only when the next bump ends the run, whatever it costs", () => {
    expect(heartBlock(MIN_LEN, START_LEN, 1).danger).toBe(true);
    expect(heartBlock(MIN_LEN + 1, START_LEN, 1).danger).toBe(false);
    expect(heartBlock(MIN_LEN + 3, START_LEN, 4).danger).toBe(true);
    expect(heartBlock(MIN_LEN + 4, START_LEN, 4).danger).toBe(false);
  });

  it("a living tail always shows some heart", () => {
    const b = heartBlock(MIN_LEN, 100, 1);
    expect(b.fill).toBeGreaterThan(0);
    expect(b.cells[0]).toBeGreaterThan(0);
  });

  it("handles a cap under eight", () => {
    const b = heartBlock(START_LEN, START_LEN, 1, 5);
    expect(b.max).toBe(5);
    expect(b.cells).toEqual([1, 1, 1, 1, 1]);
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
