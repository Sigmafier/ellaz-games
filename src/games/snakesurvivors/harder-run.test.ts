import { describe, expect, it } from "vitest";
import { mulberry32 } from "@shared/rng";
import { BITE_FROM, LEVELS, biteCost, bossHpOf, spawnEvery, stageGoal } from "./crowd";
import { BLINK_MS, newRun, step } from "./logic";
import type { LevelKey, Run, Stage } from "./types";

// HARDER, ON NORMAL AND WILD (operator, 2026-10-01, off an approved mock). A
// forum reviewer: "too easy ... finished at length 60 with all lives; you need
// to feel like you barely made it." These are the mock's own numbers, read off
// the rules a run actually plays by - not off the tables - so a table edit that
// the rules never read cannot pass here. Calm is pinned separately, by
// `calm-is-untouched.test.ts`.

/** A run at `stage`, `p` of the way through it, with its spawn clock fully ramped. */
function at(level: LevelKey, stage: Stage, p: number): Run {
  const run = newRun(level, { w: 420, h: 560 }, mulberry32(1));
  run.stage = stage;
  run.t = LEVELS[level].rampMs;
  const from = stage === 1 ? 0 : stageGoal(level, (stage - 1) as Stage).crushed;
  run.crushed = Math.round(from + (stageGoal(level, stage).crushed - from) * p);
  return run;
}

/** The fastest gap between two shapes in a stage: the clock fully ramped, the stage's crowd climbed in. */
const fastest = (level: LevelKey, stage: Stage) => Math.round(spawnEvery(at(level, stage, 0.4)));
/** What a bump costs once the stage is under way (stage 2's extra bite starts at `BITE_FROM`). */
const bump = (level: LevelKey, stage: Stage) => biteCost(at(level, stage, Math.min(0.4, BITE_FROM + 0.1)));

describe("the harder run, on normal", () => {
  it("the fastest gap between shapes, stage 2 / 3: 468 / 291 ms became 395 / 229", () => {
    expect([fastest("normal", 2), fastest("normal", 3)]).toEqual([395, 229]);
  });

  it("a bump costs 1 / 2 / 4 segments by stage (was 1 / 1 / 3)", () => {
    expect([1, 2, 3].map((s) => bump("normal", s as Stage))).toEqual([1, 2, 4]);
  });

  it("the warden takes 4 / 6 / 9 loops by stage (was 3 / 5 / 7)", () => {
    expect([1, 2, 3].map((s) => bossHpOf("normal", s as Stage))).toEqual([4, 6, 9]);
  });

  it("the safe time after a bump stays 1.4 s on every level (operator ruling, 2026-10-02: \"Keep 1.4s safe time\")", () => {
    for (const level of ["calm", "normal", "wild"] as const) {
      const run = newRun(level, { w: 420, h: 560 }, mulberry32(3));
      run.calmMs = 0;
      run.spawnIn = 1e12;
      run.floorIn = 1e12;
      run.foes = [{ id: 9_999, kind: "runner", x: run.x + 4, y: run.y, hp: 1, hurt: 0, stun: 0, spikeCool: 0, dash: 0, dashCool: 0, windup: 0, slow: 0 }];
      step(run, 16, { dx: 0, dy: 0 }, mulberry32(3));
      expect(run.events.some((e) => e.k === "hit"), level).toBe(true);
      expect(run.blink, level).toBe(1400);
    }
    expect(BLINK_MS).toBe(1400);
  });
});

describe("wild stays harder than normal on every one of those numbers", () => {
  it("shapes come at least as fast, bumps cost at least as much, wardens are at least as tough", () => {
    for (const s of [1, 2, 3] as Stage[]) {
      if (s > 1) expect(fastest("wild", s), `gap, stage ${s}`).toBeLessThan(fastest("normal", s));
      expect(bump("wild", s), `bump, stage ${s}`).toBeGreaterThanOrEqual(bump("normal", s));
      expect(bossHpOf("wild", s), `warden, stage ${s}`).toBeGreaterThanOrEqual(bossHpOf("normal", s));
    }
    expect(bump("wild", 3)).toBeGreaterThan(bump("normal", 3));
  });

  it("wild's own step: gaps 342 / 213 -> 289 / 167 ms, bumps 1 / 2 / 5 -> 1 / 3 / 6", () => {
    expect([fastest("wild", 2), fastest("wild", 3)]).toEqual([289, 167]);
    expect([1, 2, 3].map((s) => bump("wild", s as Stage))).toEqual([1, 3, 6]);
  });
});

describe("THE CONTROL: calm reads none of it", () => {
  it("calm keeps 3 / 5 / 7 and a 1-segment bump", () => {
    expect([1, 2, 3].map((s) => bossHpOf("calm", s as Stage))).toEqual([3, 5, 7]);
    expect([1, 2, 3].map((s) => bump("calm", s as Stage))).toEqual([1, 1, 1]);
  });
});
