import { describe, expect, it } from "vitest";
import { mulberry32 } from "@shared/rng";
import { circle } from "./bots";
import { KINDS, MINI_HP, bossHpOf, bossProgress, spawnEvery, stageGoal, tickMini } from "./crowd";
import { ARENA, ARENA_WIDE, newRun, pickCard, step } from "./logic";
import type { Foe, Kind, Run, Stage } from "./types";

/**
 * NePo, forum post #13: the slime mini-boss and the bat warden were on the
 * floor at the same time. The mini comes halfway to the warden, and the warden
 * came the moment its trigger was met, live mini or not - with the circling
 * bot, 68 of 72 whole runs (every level, both arenas, twelve seeds) had a step
 * with both alive. Now the warden waits until no mini-boss is alive, and the
 * boss meter stays full while it waits: the trigger IS met, and the gold bar
 * over the mini's head says what is left to do.
 */

const STILL = { dx: 0, dy: 0 };
const fixed = () => 0.5;

function quiet(run: Run): Run {
  run.spawnIn = 1e12;
  run.floorIn = 1e12;
  run.foes = [];
  run.gems = [];
  run.calmMs = 0;
  return run;
}

let nextId = 50_000;
function foe(kind: Kind, x: number, y: number, hp = KINDS[kind].hp): Foe {
  return { id: nextId++, kind, x, y, hp, hurt: 0, stun: 0, spikeCool: 0, dash: 0, dashCool: 4000, windup: 0, slow: 0 };
}

/** A run at `stage` whose warden trigger is met, with this stage's mini already sent. */
function due(stage: Stage): Run {
  const run = quiet(newRun("normal", ARENA, fixed));
  run.stage = stage;
  run.crushed = stageGoal("normal", stage).crushed;
  run.mini = stage;
  return run;
}

describe("the warden waits for the mini-boss", () => {
  it("does not come while this stage's mini-boss is alive, and the meter stays full", () => {
    for (const stage of [1, 2, 3] as const) {
      const run = due(stage);
      const m = foe("mini", run.x + 300, run.y + 300, MINI_HP[stage]);
      m.stun = 1e9;
      run.foes = [m];
      for (let i = 0; i < 40; i++) step(run, 25, STILL, fixed);
      expect(run.foes.some((f) => f.kind === "warden"), `stage ${stage}`).toBe(false);
      expect(run.phase, `stage ${stage}`).toBe("stage");
      expect(bossProgress({ ...run, level: run.level }), `stage ${stage} meter`).toBe(1);
    }
  });

  it("comes on the next step once the mini-boss is gone", () => {
    for (const stage of [1, 2, 3] as const) {
      const run = due(stage);
      const m = foe("mini", run.x + 300, run.y + 300, MINI_HP[stage]);
      m.stun = 1e9;
      run.foes = [m];
      step(run, 25, STILL, fixed);
      run.foes = run.foes.filter((f) => f !== m);
      step(run, 25, STILL, fixed);
      const wardens = run.foes.filter((f) => f.kind === "warden");
      expect(wardens, `stage ${stage}`).toHaveLength(1);
      expect(wardens[0].hp).toBe(bossHpOf(run.level, stage));
      expect(run.phase).toBe("boss");
      expect(run.events).toContainEqual({ k: "boss" });
    }
  });

  it("with no mini-boss on the floor it comes exactly as before", () => {
    const run = due(1);
    step(run, 25, STILL, fixed);
    expect(run.phase).toBe("boss");
    expect(run.foes.filter((f) => f.kind === "warden")).toHaveLength(1);
  });

  it("the reverse: no mini-boss ever comes while a warden is alive", () => {
    for (const stage of [1, 2, 3] as const) {
      const run = due(stage);
      step(run, 25, STILL, fixed);
      expect(run.phase).toBe("boss");
      // Even with this stage's mini owed, the boss fight sends none.
      run.mini = stage - 1;
      for (let i = 0; i < 40; i++) {
        tickMini(run, fixed);
        step(run, 25, STILL, fixed);
      }
      expect(run.foes.some((f) => f.kind === "mini"), `stage ${stage}`).toBe(false);
    }
  });

  /**
   * The warden's arrival is what eases the spawn clock to the boss-fight rate
   * (x1.6 the gap). Before the wait, the trigger and the arrival were the same
   * step; with the wait, the crowd kept coming at the full stage rate while the
   * player fought the mini, and the one careful run of 360 that died under 45 s
   * into stage 2 opened it five segments shorter. So the wait keeps what the
   * arrival used to do.
   */
  it("while the warden waits for the mini, shapes come at the boss-fight rate - and only then", () => {
    for (const stage of [1, 2, 3] as const) {
      const run = due(stage);
      const m = foe("mini", run.x + 300, run.y + 300, MINI_HP[stage]);
      run.foes = [m];
      const waiting = spawnEvery(run);
      run.phase = "boss";
      const fight = spawnEvery(run);
      run.phase = "stage";
      run.foes = [];
      const free = spawnEvery(run);
      expect(waiting, `stage ${stage}`).toBe(fight);
      expect(waiting / free, `stage ${stage}`).toBeCloseTo(1.6, 9);
      // No boss due: a live mini changes nothing about the clock.
      run.crushed = stageGoal("normal", stage).crushed - 3;
      const early = spawnEvery(run);
      run.foes = [m];
      expect(spawnEvery(run), `stage ${stage} not due`).toBe(early);
    }
  });

  it("over whole runs, a mini-boss and a warden are never on the floor together", () => {
    let steps = 0;
    let wardens = 0;
    let minis = 0;
    for (const arena of [ARENA, ARENA_WIDE]) {
      for (const seed of [1, 2, 3]) {
        const rng = mulberry32(seed);
        const run = newRun("normal", arena, rng);
        let sawW = false;
        let sawM = false;
        while (run.t < 14 * 60_000 && run.phase !== "won" && run.phase !== "dead") {
          step(run, 25, circle(run), rng);
          if (run.choosing) pickCard(run, run.choosing[0]);
          const m = run.foes.some((f) => f.kind === "mini");
          const w = run.foes.some((f) => f.kind === "warden");
          expect(m && w, `seed ${seed} ${arena.w} at ${run.t} ms`).toBe(false);
          sawW ||= w;
          sawM ||= m;
          steps++;
        }
        wardens += sawW ? 1 : 0;
        minis += sawM ? 1 : 0;
      }
    }
    // The population: both kinds really came in every one of the six runs, so
    // "never together" is a reading, not an empty set.
    expect(wardens).toBe(6);
    expect(minis).toBe(6);
    // At least three minutes a run on average. It was four until the
    // 2026-10-01 hardening (operator: harder on normal) ended more runs early:
    // 55,968 steps measured after it, 9.3 minutes of play across the six.
    expect(steps).toBeGreaterThan(6 * 3 * 60 * 40);
  }, 300_000);
});
