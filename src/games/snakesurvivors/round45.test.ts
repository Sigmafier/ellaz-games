import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { SHIPPED_LOCALES } from "@i18n/locales";
import { CAST, scaleFor } from "../survivors/sprites";
import { START_LEN, trimTrail } from "./body";
import { FOR_KIND, MINI_SHEET, kindScale, sheetOf } from "./cast";
import {
  BITE_FROM, DASH, JOINS_STAGE, KINDS, LEVELS, MINI_AT, MINI_HP, RAMP_IN, SHOT, biteCost, crowdAt, isBoss, kindsAt, makeFoe,
  moveFoes, stageGoal, stageProgress, tickMini,
} from "./crowd";
import { KIND_INK } from "./draw";
import { FX_TEXT } from "./fxText";
import { newRun, step } from "./logic";
import { ringRun } from "./testRing";
import type { Foe, Kind, Run, Stage } from "./types";

/**
 * R4.5 (the operator's in-game report, 2026-09-29): "On screen hud should be
 * bigger. More enemies. More bosses and monsters. More difficulty growing.
 * Faster monsters etc". One situation per cell, set up by hand; the whole-run
 * numbers are in `pacing.test.ts`.
 */

const STILL = { dx: 0, dy: 0 };
const fixed = () => 0.5;
const ARENA = { w: 420, h: 560 };

function quiet(run: Run): Run {
  run.spawnIn = 1e12;
  run.floorIn = 1e12;
  run.foes = [];
  run.gems = [];
  run.calmMs = 0;
  run.mini = 3;
  return run;
}

/** A run at `stage`, `p` of the way through it by crushes. */
function at(stage: Stage, p: number, level: "calm" | "normal" | "wild" = "normal"): Run {
  const run = quiet(newRun(level, ARENA, fixed));
  run.stage = stage;
  const from = stage === 1 ? 0 : stageGoal(level, (stage - 1) as Stage).crushed;
  const to = stageGoal(level, stage).crushed;
  run.crushed = Math.round(from + (to - from) * p);
  return run;
}

let nextId = 40_000;
function foe(kind: Kind, x: number, y: number, hp = KINDS[kind].hp): Foe {
  return { id: nextId++, kind, x, y, hp, hurt: 0, stun: 0, spikeCool: 0, dash: 0, dashCool: 4000, windup: 0, slow: 0 };
}

describe("two new monsters, each its own behaviour", () => {
  it("the dasher comes with stage 2 and the shooter with stage 3 - never before", () => {
    expect(JOINS_STAGE).toEqual({ dasher: 2, shooter: 3 });
    const kinds = (stage: Stage) => {
      const r = at(stage, 0.5);
      r.t = 400_000;
      return kindsAt(r);
    };
    expect(kinds(1)).not.toContain("dasher");
    expect(kinds(2)).toContain("dasher");
    expect(kinds(2)).not.toContain("shooter");
    expect(kinds(3)).toEqual(expect.arrayContaining(["dasher", "shooter"]));
  });

  it("the dasher is fast and weak: 1.8 x a runner, and one hit at every stage", () => {
    expect(KINDS.dasher.speed / KINDS.runner.speed).toBeCloseTo(1.8, 1);
    for (const stage of [2, 3] as const) expect(makeFoe(at(stage, 0.9, "wild"), "dasher", 0, 0).hp).toBe(1);
    expect(makeFoe(at(3, 0.9), "runner", 0, 0).hp).toBeGreaterThan(1);
  });

  it("the dasher runs STRAIGHT at where the head was, and does not follow a head that moved", () => {
    const run = at(2, 0.5);
    const d = foe("dasher", run.x + 200, run.y);
    run.foes = [d];
    moveFoes(run, 25, fixed);
    const aim = { ...d.aim! };
    expect(aim.x).toBeCloseTo(run.x, 6);
    run.y += 150; // the head leaves; a pursuer would turn, the dasher does not
    for (let t = 0; t < DASH.aimMs / 2; t += 25) moveFoes(run, 25, fixed);
    expect(d.aim!.x).toBeCloseTo(aim.x, 6);
    expect(d.aim!.y).toBeCloseTo(aim.y, 6);
    expect(Math.abs(d.y - aim.y)).toBeLessThan(1);
  });

  it("the shooter stands at range, glows (the wind-up), then fires a fan of bolts at the head", () => {
    const run = at(3, 0.5);
    const s = foe("shooter", run.x + SHOT.range - 20, run.y);
    s.fire = 0;
    run.foes = [s];
    const x0 = s.x;
    moveFoes(run, 25, fixed);
    expect(s.windup).toBeGreaterThan(0);
    for (let t = 0; t < SHOT.windup; t += 25) moveFoes(run, 25, fixed);
    expect(s.x).toBe(x0); // it stood the whole time
    // A FAN of three, spread apart - one bolt is dodged by any turn.
    expect(SHOT.fan).toBe(3);
    expect(run.bolts).toHaveLength(3);
    const angles = run.bolts.map((b) => Math.atan2(b.vy, b.vx));
    expect(new Set(angles.map((a) => a.toFixed(3))).size).toBe(3);
    expect(Math.max(...angles) - Math.min(...angles)).toBeGreaterThan(0.3);
    // Every bolt flies toward the head's side, not away from it.
    for (const b of run.bolts) expect(b.vx).toBeLessThan(0);
  });

  it("a bolt reaching the head is a bump; one crossing the body is nothing", () => {
    const run = at(3, 0.5);
    const len = run.len;
    run.bolts = [{ x: run.x + 30, y: run.y, vx: -400, vy: 0, life: 1000 }];
    step(run, 50, STILL, fixed);
    expect(run.len).toBe(len - biteCost(run));
    expect(run.events.some((e) => e.k === "hit" && e.kind === "shooter")).toBe(true);

    // Straight through a body point, far behind the head: nothing happens.
    const body = at(3, 0.5);
    const p = body.path[40];
    body.bolts = [{ x: p.x, y: p.y - 15, vx: 0, vy: 300, life: 1000 }];
    const before = body.len;
    for (let i = 0; i < 4; i++) step(body, 25, STILL, fixed);
    expect(body.len).toBe(before);
    expect(body.events.some((e) => e.k === "hit")).toBe(false);
  });

  it("each has its own burst colour, never white", () => {
    for (const k of ["dasher", "shooter", "mini"] as const) expect(KIND_INK[k]).not.toBe(0xffffff);
    expect(KIND_INK.dasher).not.toBe(KIND_INK.shooter);
  });

  it("is drawn from a sheet already in the repo, at a sane size", () => {
    expect(FOR_KIND.dasher).toBe("robot");
    expect(FOR_KIND.shooter).toBe("golem");
    for (const k of ["dasher", "shooter"] as const) {
      expect(CAST[FOR_KIND[k]]).toBeDefined();
      expect(kindScale(k)).toBeGreaterThan(0.05);
      expect(kindScale(k)).toBeLessThan(0.7);
    }
    // A dasher is drawn at a bat's height, not a hero's: 24 units against the robot's true 48.
    expect(kindScale("dasher") / scaleFor(CAST.robot.manifest)).toBeCloseTo(0.5, 6);
  });
});

describe("a mini-boss in every stage", () => {
  it("comes once the stage is halfway to its warden, and only once", () => {
    for (const stage of [1, 2, 3] as const) {
      const before = at(stage, MINI_AT - 0.06);
      before.mini = stage - 1;
      tickMini(before, fixed);
      expect(before.foes.some((f) => f.kind === "mini"), `stage ${stage} early`).toBe(false);

      const run = at(stage, MINI_AT + 0.02);
      run.mini = stage - 1;
      tickMini(run, fixed);
      tickMini(run, fixed);
      const minis = run.foes.filter((f) => f.kind === "mini");
      expect(minis, `stage ${stage}`).toHaveLength(1);
      expect(minis[0].hp).toBe(MINI_HP[stage]);
      expect(minis[0].form).toBe(stage);
      expect(run.events).toContainEqual(expect.objectContaining({ k: "mini", stage }));
    }
  });

  it("a new snake at its starting length is not already halfway to the first warden", () => {
    const run = newRun("normal", ARENA, fixed);
    expect(run.len).toBe(START_LEN);
    expect(stageProgress(run)).toBe(0);
  });

  it("is bigger than any monster of its stage, wears that stage's sheet, and each stage's is tougher", () => {
    expect(KINDS.mini.r).toBeGreaterThan(Math.max(KINDS.runner.r, KINDS.orb.r, KINDS.brute.r, KINDS.dasher.r, KINDS.shooter.r));
    expect(MINI_SHEET).toEqual({ 1: "slime", 2: "crab", 3: "golem" });
    for (const s of [1, 2, 3] as const) expect(sheetOf({ kind: "mini", form: s })).toBe(MINI_SHEET[s]);
    expect(MINI_HP[2]).toBeGreaterThan(MINI_HP[1]);
    expect(MINI_HP[3]).toBeGreaterThan(MINI_HP[2]);
  });

  it("is a boss: no bite, spike or spit hurts it - only a loop", () => {
    expect(isBoss("mini")).toBe(true);
    const run = at(2, 0.1);
    run.taken.fangs = 3;
    run.taken.spit = 3;
    const m = foe("mini", run.x + 4, run.y, 4);
    m.stun = 1e9;
    run.foes = [m];
    for (let i = 0; i < 40; i++) step(run, 25, STILL, fixed);
    expect(m.hp).toBe(4);
    expect(run.foes).toContain(m);
  });

  it("a loop hurts it, and killing it does NOT open the next stage - the warden still does", () => {
    const run = quiet(ringRun(600, 800, 70));
    run.stage = 2;
    const m = foe("mini", 600, 800, 1);
    m.stun = 1e9;
    run.foes = [m];
    step(run, 16, STILL, fixed);
    expect(run.foes).not.toContain(m);
    expect(run.stage).toBe(2);
    expect(run.phase).toBe("stage");
  });

  it("telegraphs its attack: it winds up, standing and glowing, before it lunges", () => {
    const run = at(2, 0.1);
    const m = foe("mini", run.x + 120, run.y, 4);
    m.dashCool = 0;
    run.foes = [m];
    moveFoes(run, 25, fixed);
    expect(m.windup).toBeGreaterThan(0);
    const x = m.x;
    moveFoes(run, 25, fixed);
    expect(m.x).toBe(x);
  });

  it("says so, in every language", () => {
    for (const loc of SHIPPED_LOCALES) {
      expect(FX_TEXT[loc].mini.length, loc).toBeGreaterThan(0);
      expect(/[–—―]/.test(FX_TEXT[loc].mini), loc).toBe(false);
    }
  });
});

describe("difficulty that keeps growing, with no wall at a stage's opening", () => {
  const same = (a: number, b: number) => Math.abs(a - b) < 1e-9;

  it("the crowd a stage opens with is the crowd the last one ended with", () => {
    for (const level of ["calm", "normal", "wild"] as const) {
      for (const stage of [2, 3] as const) {
        const end = crowdAt(at((stage - 1) as Stage, 1, level));
        const start = crowdAt(at(stage, 0, level));
        // `at(stage, 1)` is past its RAMP_IN, so it reads that stage's own numbers.
        expect(same(start.cap, end.cap), `${level} ${stage} cap`).toBe(true);
        expect(same(start.spawn, end.spawn), `${level} ${stage} spawn`).toBe(true);
        expect(same(start.hp, end.hp), `${level} ${stage} hp`).toBe(true);
      }
    }
  });

  it("then climbs to the new stage's numbers over its first RAMP_IN", () => {
    const mid = crowdAt(at(2, RAMP_IN / 2));
    const lo = crowdAt(at(2, 0));
    const hi = crowdAt(at(2, RAMP_IN));
    expect(mid.cap).toBeGreaterThan(lo.cap);
    expect(mid.cap).toBeLessThan(hi.cap);
    expect(mid.spawn).toBeLessThan(lo.spawn);
    expect(hi.hp).toBeGreaterThan(lo.hp);
  });

  it("monsters get faster all the way through - within a stage and across stages - with no step", () => {
    let last = 0;
    for (const stage of [1, 2, 3] as const) {
      for (const p of [0, 0.25, 0.5, 0.75, 1]) {
        const pace = crowdAt(at(stage, p)).pace;
        expect(pace, `stage ${stage} at ${p}`).toBeGreaterThanOrEqual(last);
        last = pace;
      }
    }
    expect(crowdAt(at(3, 1)).pace).toBeGreaterThan(1.4);
    expect(same(crowdAt(at(2, 0)).pace, crowdAt(at(1, 1)).pace)).toBe(true);
  });

  it("a bump costs more as the run goes on: wild adds one partway into stage 2 and more in stage 3", () => {
    expect(biteCost(at(1, 0.9, "wild"))).toBe(1);
    expect(biteCost(at(2, BITE_FROM - 0.1, "wild"))).toBe(1);
    expect(biteCost(at(2, BITE_FROM + 0.1, "wild"))).toBe(1 + LEVELS.wild.bite);
    expect(biteCost(at(3, 0.1, "wild"))).toBe(1 + LEVELS.wild.bite + LEVELS.wild.bite3);
    expect(biteCost(at(3, 0.1, "normal"))).toBe(1 + LEVELS.normal.bite3);
    expect(biteCost(at(3, 0.9, "calm"))).toBe(1);
  });

  it("a bump costing more than is left ends the run - it does not throw", () => {
    const run = at(3, 0.5, "wild");
    run.len = 3;
    run.bolts = [{ x: run.x + 30, y: run.y, vx: -400, vy: 0, life: 1000 }];
    expect(() => step(run, 50, STILL, fixed)).not.toThrow();
    expect(run.phase).toBe("dead");
    run.len = -2;
    expect(() => trimTrail(run)).not.toThrow();
  });
});

describe("the HUD reads at a glance", () => {
  const strip = (t: string) => t.replace(/\/\*[\s\S]*?\*\//g, "").replace(/\/\/[^\n]*/g, "");
  const GAME = strip(readFileSync(new URL("./SnakeSurvivorsGame.tsx", import.meta.url), "utf8"));
  const SCENE = strip(readFileSync(new URL("./SnakeSurvivorsScene.ts", import.meta.url), "utf8"));

  // C3 (2026-10-01) replaced the 1.5x shared HUD with the game's own, bigger
  // still: the hearts at 1.75em and the length at 2.6em of a base that is 16px
  // on a phone's arena and 18px on a PC's (snake-hud.test.ts renders it).
  const HUD = strip(readFileSync(new URL("./SnakeHud.tsx", import.meta.url), "utf8"));

  it("draws its own HUD, sized off the arena: big hearts, and the length bigger still", () => {
    expect(HUD).toContain('fontSize: "clamp(14px, 4.47cqw, 18px)"');
    expect(HUD).toContain('fontSize: "1.75em"');
    expect(HUD).toContain('fontSize: "2.6em"');
    expect(GAME).toContain("len={status.len}");
  });

  it("the level is a thin unlabelled line, and the scene sizes every shape through kindScale with its form", () => {
    expect(SCENE).toContain("h.fillRect(0, vh - XP_LINE, w, XP_LINE)");
    expect(SCENE).not.toMatch(/`LV \$\{/);
    expect(SCENE).not.toContain("lvText");
    expect(SCENE).toContain("setScale(kindScale(f.kind, f.form))");
    expect(SCENE).toContain("this.fx.mini");
  });
});
