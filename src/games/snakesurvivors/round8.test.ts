// ROUND EIGHT (operator rulings, 2026-10-02, on a forum player's report):
//
//   "after a while enemies seem to do no damage"  -> a hit costs HALF A HEART from a fifth into stage 2
//   "max length 60 is too short for double loops" -> the cap is 100
//   "the guide shows even when nothing is inside" -> it shows only with a catch
//
// Normal and Wild only. Calm is pinned by law (`calm-is-untouched.test.ts`),
// and every cell here that touches calm asserts it reads what it read before.
import { describe, expect, it } from "vitest";
import { mulberry32 } from "@shared/rng";
import { CALM_MAX_LEN, MAX_LEN, MIN_LEN, START_LEN, maxLenOf } from "./body";
import { CAPS, LONG_STEP } from "./cards";
import { HEARTS, biteCost, hitCost, makeFoe } from "./crowd";
import { heartBlock } from "./hud";
import { hitsLeft, newRun, step } from "./logic";
import { guideShown } from "./body";
import type { LevelKey, Run, Stage } from "./types";

const fixed = mulberry32(8);
const STILL = { dx: 0, dy: 0 };
const at = (level: LevelKey, peak: number, stage: Stage = 1, crushed = 0): Run => {
  const run = newRun(level, { w: 420, h: 560 }, fixed);
  run.peak = peak;
  run.len = peak;
  run.stage = stage;
  run.crushed = crushed;
  return run;
};
/** Well into stage 2: past `BITE_FROM`, so the half-heart rule is on. */
const DEEP = 2000;

describe("a hit costs half a heart from a fifth into stage 2, on normal and wild", () => {
  it("is ceil(half a heart) at peaks 60 / 100 deep in stage 2 - a heart being the peak's life over the 8 hearts", () => {
    expect(HEARTS).toBe(8);
    // life = peak - MIN_LEN + 1: 58 / 98, half a heart 3.63 / 6.13 segments.
    for (const level of ["normal", "wild"] as const) {
      expect(hitCost(at(level, 60, 2, DEEP)), level).toBe(Math.max(4, biteCost(at(level, 60, 2, DEEP))));
      expect(hitCost(at(level, 100, 2, DEEP)), level).toBe(Math.max(7, biteCost(at(level, 100, 2, DEEP))));
    }
    expect(hitCost(at("normal", 100, 2, DEEP))).toBe(7);
  });

  it("stage 1 and the opening fifth of stage 2 cost exactly what a bump cost before (earlier starts killed 27 of 60 runs in stage 1, or walled stage 2's opening)", () => {
    for (const level of ["normal", "wild"] as const) {
      for (const peak of [START_LEN, 60, 100]) {
        for (const stage of [1, 2] as Stage[]) {
          const run = at(level, peak, stage);
          expect(hitCost(run), `${level} s${stage} peak ${peak}`).toBe(biteCost(run));
          expect(hitCost(run), `${level} s${stage} peak ${peak}`).toBe(1);
        }
      }
    }
  });

  it("reads the peak floored at the starting length, like the hearts do", () => {
    expect(hitCost(at("normal", 10, 2, DEEP))).toBe(hitCost(at("normal", START_LEN, 2, DEEP)));
  });

  it("is never below what a bump cost before", () => {
    for (const level of ["normal", "wild"] as const) {
      for (const stage of [1, 2, 3] as Stage[]) {
        for (const peak of [START_LEN, 45, 60, 100, 120]) {
          const run = at(level, peak, stage);
          run.crushed = 2000; // far into each stage, so the stage's own bite is on
          expect(hitCost(run), `${level} s${stage} peak ${peak}`).toBeGreaterThanOrEqual(biteCost(run));
        }
      }
    }
    // Wild stage 3 at the starting peak: today's 6 beats half a heart's 2.
    const late = at("wild", START_LEN, 3);
    expect(hitCost(late)).toBe(biteCost(late));
    expect(hitCost(late)).toBe(6);
  });

  it("CALM is exactly today's cost at every peak and stage", () => {
    for (const stage of [1, 2, 3] as Stage[]) {
      for (const peak of [START_LEN, 60, 100]) {
        const run = at("calm", peak, stage);
        run.crushed = 2000;
        expect(hitCost(run), `calm s${stage} peak ${peak}`).toBe(biteCost(run));
      }
    }
  });

  it("a bump in play takes exactly that cost off the tail", () => {
    for (const [level, cost] of [["normal", 4], ["calm", biteCost(at("calm", 60, 2, DEEP))]] as const) {
      const run = at(level, 60, 2, DEEP);
      run.calmMs = 0;
      run.foes = [makeFoe(run, "runner", run.x + 4, run.y)];
      step(run, 16, STILL, fixed);
      expect(run.events.some((e) => e.k === "hit"), level).toBe(true);
      expect(run.len, level).toBe(60 - cost);
    }
  });

  it("the run remembers its longest tail, and growing past it raises the cost", () => {
    const run = newRun("normal", { w: 420, h: 560 }, fixed);
    expect(run.peak).toBe(START_LEN);
    run.len = 59.9;
    run.gems = [{ x: run.x, y: run.y, v: 3 }];
    step(run, 16, STILL, fixed);
    expect(run.peak).toBe(60);
    run.stage = 2;
    run.crushed = DEEP;
    expect(hitCost(run)).toBe(4);
  });

  it("the hearts and the red last-bump warning count bumps at the SAME cost", () => {
    // Peak 100 deep in stage 2, 7 a bump: 9 life left (len 11) is two bumps; 7 life (len 9) is the last.
    const cost = hitCost(at("normal", 100, 2, DEEP));
    expect(cost).toBe(7);
    expect(hitsLeft(11, cost)).toBe(2);
    expect(heartBlock(11, 100, cost).danger).toBe(false);
    expect(hitsLeft(9, cost)).toBe(1);
    expect(heartBlock(9, 100, cost).danger).toBe(true);
    // ...and today's cost of 1 would have called len 9 seven bumps from the end.
    expect(hitsLeft(9, 1)).toBe(7);
    expect(MIN_LEN).toBe(3);
  });
});

describe("the length cap", () => {
  it("is 100 on normal and wild and 60 on calm, and Long Body still adds on top", () => {
    expect(MAX_LEN).toBe(100);
    expect(CALM_MAX_LEN).toBe(60);
    for (const level of ["normal", "wild"] as const) {
      const run = newRun(level, { w: 420, h: 560 }, fixed);
      expect(maxLenOf(run), level).toBe(100);
      run.taken.longBody = CAPS.longBody;
      expect(maxLenOf(run), level).toBe(100 + LONG_STEP * CAPS.longBody);
    }
    const calm = newRun("calm", { w: 420, h: 560 }, fixed);
    expect(maxLenOf(calm)).toBe(60);
    calm.taken.longBody = 1;
    expect(maxLenOf(calm)).toBe(60 + LONG_STEP);
  });

  it("a gem grows a normal snake past 60, and stops a calm one at 60", () => {
    for (const [level, want] of [["normal", 61], ["calm", 60]] as const) {
      const run = newRun(level, { w: 420, h: 560 }, fixed);
      run.len = 60;
      run.gems = [{ x: run.x, y: run.y, v: 3 }];
      step(run, 16, STILL, fixed);
      expect(run.len, level).toBe(want);
    }
  });
});

describe("the snap guide shows only when the loop would catch something", () => {
  it("empty -> hidden, caught -> shown, the guided first run -> always shown", () => {
    expect(guideShown(0, false)).toBe(false);
    expect(guideShown(1, false)).toBe(true);
    expect(guideShown(5, false)).toBe(true);
    expect(guideShown(0, true)).toBe(true);
    expect(guideShown(3, true)).toBe(true);
  });
});
