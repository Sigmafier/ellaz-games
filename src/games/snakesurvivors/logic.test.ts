import { describe, expect, it } from "vitest";
import { mulberry32 } from "@shared/rng";
import { ringRun } from "./testRing";
import { HIT_COST, MIN_LEN, START_LEN } from "./body";
import { KINDS, LEVELS } from "./crowd";
import { CAPS, WEAPONS, offerCards } from "./cards";
import { hitsLeft, newRun, pickCard, step } from "./logic";
import type { Foe, Kind, Run } from "./types";

/**
 * The run: what a loop does, what a hit costs, and how it ends.
 *
 * Each cell sets up the one situation it is about by hand - a body laid round a
 * circle, a shape placed at the head - rather than playing a run until it
 * happens, so a failure names the rule that broke and not the luck of a seed.
 */

const STILL = { dx: 0, dy: 0 };
const fixed = () => 0.5;

let nextId = 1000;
function foe(kind: Kind, x: number, y: number): Foe {
  return { id: nextId++, kind, x, y, hp: KINDS[kind].hp, hurt: 0, stun: 0, spikeCool: 0, dash: 0, dashCool: 0 };
}

/** A run with the spawn clock held off, so only the shapes a cell places exist. */
function quiet(run: Run): Run {
  run.spawnIn = 1e9;
  run.foes = [];
  run.gems = [];
  return run;
}

describe("a new run", () => {
  it("starts in the middle of the world at the starting length", () => {
    const run = newRun("normal", { w: 420, h: 560 }, fixed);
    expect(run.len).toBe(START_LEN);
    expect(run.x).toBe(run.world.w / 2);
    expect(run.y).toBe(run.world.h / 2);
    expect(run.phase).toBe("stage");
    expect(run.crushed).toBe(0);
  });

  it("plays the same run from the same seed and the same hands", () => {
    const play = () => {
      const rng = mulberry32(42);
      const run = newRun("normal", { w: 420, h: 560 }, rng);
      for (let i = 0; i < 1500; i++) {
        step(run, 16, { dx: Math.cos(i / 40), dy: Math.sin(i / 40) }, rng);
        if (run.choosing) pickCard(run, run.choosing[0]);
      }
      return JSON.stringify({ ...run, events: [] });
    };
    expect(play()).toBe(play());
  });
});

describe("closing a loop", () => {
  it("crushes every shape inside it and none outside", () => {
    const run = quiet(ringRun(600, 800, 60));
    run.foes = [foe("runner", 590, 790), foe("orb", 615, 805), foe("runner", 800, 800)];
    step(run, 16, STILL, fixed);
    expect(run.foes).toHaveLength(1);
    expect(run.foes[0].x).toBeGreaterThan(780);
    expect(run.crushed).toBe(2);
    const crush = run.events.find((e) => e.k === "crush");
    expect(crush).toMatchObject({ k: "crush", n: 2 });
    expect(run.gems.length).toBe(KINDS.runner.gems + KINDS.orb.gems);
  });

  it("does not crush the same shapes twice on the frame after", () => {
    const run = quiet(ringRun(600, 800, 60));
    run.foes = [foe("brute", 600, 800)];
    step(run, 16, STILL, fixed);
    expect(run.foes[0].hp).toBe(KINDS.brute.hp - 1);
    step(run, 16, STILL, fixed);
    expect(run.foes[0].hp).toBe(KINDS.brute.hp - 1);
  });

  it("takes a brute two loops", () => {
    expect(KINDS.brute.hp).toBe(2);
    const run = quiet(ringRun(600, 800, 60));
    run.foes = [foe("brute", 600, 800)];
    step(run, 16, STILL, fixed);
    expect(run.foes.length).toBe(1);
    expect(run.crushed).toBe(0);
  });
});

describe("the shockwave", () => {
  it("throws back the shapes just outside a loop that crushed something", () => {
    const run = quiet(ringRun(600, 800, 60));
    run.taken.shockwave = 1;
    run.foes = [foe("runner", 600, 800), foe("orb", 600, 900)];
    step(run, 16, STILL, fixed);
    const orb = run.foes.find((f) => f.kind === "orb")!;
    expect(orb.stun).toBeGreaterThan(0);
    expect(orb.y).toBeGreaterThan(900);
  });

  // Found by the pacing bots, 2026-09-27: it fired on EVERY closing, so a snake
  // circling with the card held the whole crowd off for ever - 38 shapes pinned
  // 100-170 units out, seven minutes without a crush or a hit.
  it("does nothing when the loop caught nothing", () => {
    const run = quiet(ringRun(600, 800, 60));
    run.taken.shockwave = 1;
    run.foes = [foe("orb", 600, 900)];
    step(run, 16, STILL, fixed);
    expect(run.foes[0].stun).toBe(0);
  });
});

describe("hits left, the HUD's hearts", () => {
  it("counts the hits the tail can still take, the last one included", () => {
    // 28 -> 26 -> ... -> 4 is twelve hits; the thirteenth leaves 2 and ends it.
    expect(hitsLeft(START_LEN)).toBe(13);
    expect(hitsLeft(MIN_LEN)).toBe(1);
    expect(hitsLeft(MIN_LEN + 1)).toBe(1);
    expect(hitsLeft(MIN_LEN + 2)).toBe(2);
  });

  it("agrees with the rules: that many hits end a run, one fewer does not", () => {
    for (const len of [4, 9, 16, 28]) {
      const run = quiet(newRun("normal", { w: 420, h: 560 }, fixed));
      run.len = len;
      for (let k = 0; k < hitsLeft(len); k++) {
        expect(run.phase, `len ${len}, hit ${k}`).not.toBe("dead");
        run.blink = 0;
        run.foes = [foe("runner", run.x, run.y)];
        step(run, 16, STILL, fixed);
      }
      expect(run.phase, `len ${len}`).toBe("dead");
    }
  });
});

describe("a hit", () => {
  it("costs two segments, then a blink of safety", () => {
    const run = quiet(newRun("normal", { w: 420, h: 560 }, fixed));
    run.foes = [foe("runner", run.x, run.y)];
    step(run, 16, STILL, fixed);
    expect(HIT_COST).toBe(2);
    expect(run.len).toBe(START_LEN - HIT_COST);
    expect(run.blink).toBeGreaterThan(0);
    expect(run.events.some((e) => e.k === "hit")).toBe(true);
    run.foes = [foe("runner", run.x, run.y)];
    step(run, 16, STILL, fixed);
    expect(run.len).toBe(START_LEN - HIT_COST);
  });

  it("ends the run when the snake drops below the minimum", () => {
    const run = quiet(newRun("normal", { w: 420, h: 560 }, fixed));
    run.len = MIN_LEN + 1;
    run.foes = [foe("brute", run.x, run.y)];
    step(run, 16, STILL, fixed);
    expect(run.phase).toBe("dead");
    expect(run.events.some((e) => e.k === "dead")).toBe(true);
    const t = run.t;
    step(run, 16, STILL, fixed);
    expect(run.t).toBe(t);
  });
});

describe("gems and levels", () => {
  it("a gem at the head grows the snake and fills the bar", () => {
    const run = quiet(newRun("normal", { w: 420, h: 560 }, fixed));
    run.gems = [{ x: run.x, y: run.y, v: 1 }];
    const len = run.len;
    step(run, 16, STILL, fixed);
    expect(run.gems.length).toBe(0);
    expect(run.xp).toBe(1);
    expect(run.len).toBeGreaterThan(len);
  });

  it("a full bar offers three different cards and holds the clock until one is picked", () => {
    const run = quiet(newRun("normal", { w: 420, h: 560 }, fixed));
    run.xp = run.need - 1;
    run.gems = [{ x: run.x, y: run.y, v: 1 }];
    step(run, 16, STILL, fixed);
    expect(run.choosing).not.toBeNull();
    expect(new Set(run.choosing).size).toBe(3);
    const t = run.t;
    step(run, 16, STILL, fixed);
    expect(run.t).toBe(t);
    pickCard(run, run.choosing![0]);
    expect(run.choosing).toBeNull();
    expect(run.lv).toBe(2);
  });

  it("never offers a card that is already at its cap", () => {
    const run = quiet(newRun("normal", { w: 420, h: 560 }, fixed));
    for (const id of Object.keys(CAPS) as (keyof typeof CAPS)[]) if (id !== "magnet") run.taken[id] = CAPS[id];
    for (let i = 0; i < 20; i++) expect(offerCards(run, Math.random)).toEqual(["magnet"]);
  });
});

describe("the two weapons", () => {
  it("are two, and they are different kinds of hit", () => {
    expect(WEAPONS).toEqual(["fangs", "spikes"]);
  });

  it("fangs turn a head-on touch into a bite: the runner dies and the snake is unhurt", () => {
    const run = quiet(newRun("normal", { w: 420, h: 560 }, fixed));
    run.taken.fangs = 1;
    run.foes = [foe("runner", run.x, run.y)];
    step(run, 16, STILL, fixed);
    expect(run.foes.length).toBe(0);
    // Not hurt - and the gem the runner drops lands in the mouth, so it grows.
    expect(run.len).toBeGreaterThanOrEqual(START_LEN);
    expect(run.blink).toBe(0);
    expect(run.events.some((e) => e.k === "bite")).toBe(true);
  });

  it("spikes hurt a shape touching the body; without them it is untouched", () => {
    const setup = (spikes: number) => {
      const run = quiet(newRun("normal", { w: 420, h: 560 }, fixed));
      run.taken.spikes = spikes;
      for (let i = 0; i < 90; i++) step(run, 16, { dx: 1, dy: 0 }, fixed);
      const mid = run.path[Math.floor(run.path.length / 2)];
      run.foes = [foe("runner", mid.x, mid.y + 4)];
      step(run, 16, { dx: 1, dy: 0 }, fixed);
      return run;
    };
    expect(setup(1).foes.length).toBe(0);
    expect(setup(0).foes.length).toBe(1);
  });
});

describe("the boss", () => {
  it("arrives when the stage clock runs out", () => {
    const run = quiet(newRun("calm", { w: 420, h: 560 }, fixed));
    run.t = LEVELS.calm.stageMs - 8;
    step(run, 16, STILL, fixed);
    expect(run.phase).toBe("boss");
    expect(run.foes.some((f) => f.kind === "warden")).toBe(true);
  });

  it("takes exactly three loops, one hit each, and then the run is won", () => {
    const run = quiet(ringRun(600, 800, 70));
    run.phase = "boss";
    run.foes = [foe("warden", 600, 800)];
    for (let loop = 1; loop <= 3; loop++) {
      const fresh = ringRun(600, 800, 70);
      Object.assign(run, { x: fresh.x, y: fresh.y, heading: fresh.heading, path: fresh.path, loopCool: 0 });
      run.foes[0].x = 600;
      run.foes[0].y = 800;
      run.foes[0].stun = 5000;
      step(run, 16, STILL, fixed);
      if (loop < 3) expect(run.foes[0].hp).toBe(3 - loop);
    }
    expect(run.phase).toBe("won");
    expect(run.events.some((e) => e.k === "won")).toBe(true);
  });
});

describe("the levels", () => {
  it("send more shapes on wild than on calm, and never change the snake", () => {
    const count = (level: "calm" | "wild") => {
      const rng = mulberry32(7);
      const run = newRun(level, { w: 420, h: 560 }, rng);
      let seen = 0;
      const ids = new Set<number>();
      // 15 s: before either level reaches its cap, so this reads the CLOCK.
      // Over a minute both hit their caps and the cell measured the caps instead.
      for (let i = 0; i < 15 * 40; i++) {
        run.blink = 1e9; // immortal: this counts what the clock SENDS, not how long a bot lives
        step(run, 25, { dx: Math.cos(i / 25), dy: Math.sin(i / 25) }, rng);
        if (run.choosing) pickCard(run, run.choosing[0]);
        for (const f of run.foes) if (!ids.has(f.id)) (ids.add(f.id), seen++);
        if (run.phase === "dead") break;
      }
      return { seen, len: newRun(level, { w: 420, h: 560 }, fixed).len };
    };
    const calm = count("calm");
    const wild = count("wild");
    expect(wild.seen).toBeGreaterThan(calm.seen);
    expect(wild.len).toBe(calm.len);
  });
});
