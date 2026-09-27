import { describe, expect, it } from "vitest";
import { mulberry32 } from "@shared/rng";
import { MIN_LOOP_AREA, SEG, SPACING, START_LEN } from "./body";
import { newRun } from "./logic";
import {
  GUIDE_R, gemTarget, guideRing, hasSeenTutorial, leaveTutorial, markTutorialSeen, newTutorial, skipTutorial,
  tickTutorial, tutorialPick,
  type Tutorial,
} from "./tutorial";
import type { Steer } from "./types";

/**
 * The guided first run (operator ruling R2.5), as a pure state machine:
 *
 *   loop  "Loop your tail around the bat"   one slow bat, a dotted ring round it;
 *                                           ends only when a LOOP crushes it
 *   eat   "Eat the gems it drops"           ends when every gem is collected
 *   pick  "Pick a power"                    exactly enough XP for one level; ends on a pick
 *   done                                    the real run starts from a fresh state
 *
 * A reviewer who had never seen the game circled the bats, lost two segments to
 * a bite and then could not loop anything. So nothing in here can fail: a hit
 * costs nothing, the run cannot die and the boss can never arrive.
 */

const ARENA = { w: 420, h: 560 };
const STILL: Steer = { dx: 0, dy: 0 };

function fresh(seed = 1): { tut: Tutorial; rng: () => number } {
  const rng = mulberry32(seed);
  return { tut: newTutorial(ARENA, rng), rng };
}

/** Lay the body round the guide ring, head about to touch its own tail - one frame from a loop. */
function wrapTheBat(tut: Tutorial): void {
  const ring = guideRing(tut)!;
  const run = tut.run;
  const sweep = 2 * Math.PI + 0.3;
  const n = Math.ceil((sweep * ring.r) / SPACING);
  run.x = ring.x + ring.r;
  run.y = ring.y;
  run.heading = Math.PI / 2;
  run.path = Array.from({ length: n }, (_, k) => {
    const a = -((k + 1) * SPACING) / ring.r;
    return { x: ring.x + ring.r * Math.cos(a), y: ring.y + ring.r * Math.sin(a) };
  });
  run.len = Math.max(run.len, Math.ceil((n * SPACING) / SEG) + 2);
  run.loopCool = 0;
}

/** Walk the head onto every gem until none is left (or give up). */
function eatAll(tut: Tutorial, rng: () => number): void {
  for (let i = 0; i < 20 && tut.step === "eat"; i++) {
    const g = tut.run.gems[0];
    if (!g) break;
    tut.run.x = g.x;
    tut.run.y = g.y;
    tickTutorial(tut, 16, STILL, rng);
  }
}

/** Steer straight at the bat, which is what a first-time player does. */
const ram = (tut: Tutorial): Steer => {
  const bat = tut.run.foes[0];
  return bat ? { dx: bat.x - tut.run.x, dy: bat.y - tut.run.y } : STILL;
};

describe("step 1, the loop", () => {
  it("opens with exactly one bat, a ring round it, and no clock sending more", () => {
    const { tut, rng } = fresh();
    expect(tut.step).toBe("loop");
    expect(tut.run.foes.map((f) => f.kind)).toEqual(["runner"]);
    for (let t = 0; t < 30_000; t += 25) tickTutorial(tut, 25, { dx: 0, dy: 1 }, rng);
    expect(tut.run.foes.length).toBe(1);
    expect(tut.run.gems.length).toBe(0);
    const ring = guideRing(tut)!;
    expect(ring.r).toBe(GUIDE_R);
    expect(Math.hypot(ring.x - tut.run.foes[0].x, ring.y - tut.run.foes[0].y)).toBeLessThan(1);
  });

  it("draws a ring the snake can actually close: big enough to crush, short enough for the body", () => {
    expect(Math.PI * GUIDE_R * GUIDE_R).toBeGreaterThanOrEqual(MIN_LOOP_AREA * 1.5);
    expect(2 * Math.PI * GUIDE_R).toBeLessThan(START_LEN * SEG * 0.95);
  });

  it("starts the bat in view, ahead of the head", () => {
    const { tut } = fresh();
    const bat = tut.run.foes[0];
    expect(bat.x - tut.run.x).toBeGreaterThan(GUIDE_R);
    expect(Math.abs(bat.x - tut.run.x)).toBeLessThan(ARENA.w / 2);
  });

  it("the bat does not chase - it stays by its ring however long the player waits", () => {
    const { tut, rng } = fresh();
    const home = { ...guideRing(tut)! };
    const bat = tut.run.foes[0];
    // Reversing away from the bat, so a chaser would follow and this one must not.
    for (let t = 0; t < 1200; t += 25) {
      tickTutorial(tut, 25, { dx: -1, dy: 0 }, rng);
      const ring = guideRing(tut)!;
      expect(Math.hypot(bat.x - ring.x, bat.y - ring.y)).toBeLessThan(12);
    }
    // Still the ring it started at: the head never went far enough to move it.
    expect(Math.hypot(bat.x - home.x, bat.y - home.y)).toBeLessThan(12);
  });

  it("does NOT end without a crush - running into the bat is not a loop", () => {
    const { tut, rng } = fresh();
    for (let t = 0; t < 20_000; t += 25) tickTutorial(tut, 25, ram(tut), rng);
    expect(tut.step).toBe("loop");
    expect(tut.run.foes.length).toBe(1);
  });

  it("ends when a loop crushes the bat, and the bat leaves gems to eat", () => {
    const { tut, rng } = fresh();
    wrapTheBat(tut);
    tickTutorial(tut, 16, STILL, rng);
    expect(tut.step).toBe("eat");
    expect(tut.run.foes.length).toBe(0);
    expect(tut.run.gems.length).toBeGreaterThanOrEqual(1);
    expect(guideRing(tut)).toBeNull();
  });

  it("moves the ring back in front of a player who drove away from it", () => {
    const { tut, rng } = fresh();
    for (let t = 0; t < 12_000; t += 25) tickTutorial(tut, 25, { dx: -1, dy: 0.2 }, rng);
    const ring = guideRing(tut)!;
    expect(Math.abs(ring.x - tut.run.x)).toBeLessThan(ARENA.w / 2);
    expect(Math.abs(ring.y - tut.run.y)).toBeLessThan(ARENA.h / 2);
  });
});

describe("step 2, the gems", () => {
  it("points at the gems while any is left, and does not end until every one is eaten", () => {
    const { tut, rng } = fresh();
    wrapTheBat(tut);
    tickTutorial(tut, 16, STILL, rng);
    const target = gemTarget(tut)!;
    expect(tut.run.gems.some((g) => g.x === target.x && g.y === target.y)).toBe(true);
    // Move away from the gems: the step holds.
    tut.run.x += 200;
    for (let i = 0; i < 20; i++) tickTutorial(tut, 16, { dx: 1, dy: 0 }, rng);
    expect(tut.step).toBe("eat");
  });

  it("ends when they are collected, and opens the card screen with exactly one level's XP", () => {
    const { tut, rng } = fresh();
    wrapTheBat(tut);
    tickTutorial(tut, 16, STILL, rng);
    eatAll(tut, rng);
    expect(tut.step).toBe("pick");
    expect(gemTarget(tut)).toBeNull();
    expect(tut.run.lv).toBe(2);
    expect(tut.run.xp).toBe(0);
    expect(tut.run.choosing?.length).toBe(3);
  });
});

describe("step 3, the power", () => {
  function atPick() {
    const f = fresh();
    wrapTheBat(f.tut);
    tickTutorial(f.tut, 16, STILL, f.rng);
    eatAll(f.tut, f.rng);
    return f;
  }

  it("ignores a card that is not on offer", () => {
    const { tut } = atPick();
    const off = (["fangs", "spikes", "magnet", "swift", "regrow", "shockwave"] as const).find((c) => !tut.run.choosing!.includes(c))!;
    tutorialPick(tut, off);
    expect(tut.step).toBe("pick");
  });

  it("ends on a pick", () => {
    const { tut } = atPick();
    tutorialPick(tut, tut.run.choosing![0]);
    expect(tut.step).toBe("done");
    expect(tut.skipped).toBe(false);
  });

  it("does not move the practice run while the cards are up", () => {
    const { tut, rng } = atPick();
    const x = tut.run.x;
    for (let i = 0; i < 40; i++) tickTutorial(tut, 25, { dx: 1, dy: 0 }, rng);
    expect(tut.run.x).toBe(x);
  });
});

describe("skip", () => {
  it("ends the tutorial from any step", () => {
    const a = fresh().tut;
    skipTutorial(a);
    expect(a.step).toBe("done");
    expect(a.skipped).toBe(true);

    const b = fresh();
    wrapTheBat(b.tut);
    tickTutorial(b.tut, 16, STILL, b.rng);
    skipTutorial(b.tut);
    expect(b.tut.step).toBe("done");

    const c = fresh();
    wrapTheBat(c.tut);
    tickTutorial(c.tut, 16, STILL, c.rng);
    eatAll(c.tut, c.rng);
    skipTutorial(c.tut);
    expect(c.tut.step).toBe("done");
  });

  it("a finished tutorial ignores everything after", () => {
    const { tut, rng } = fresh();
    skipTutorial(tut);
    const run = JSON.stringify(tut.run);
    tickTutorial(tut, 1000, { dx: 1, dy: 0 }, rng);
    expect(JSON.stringify(tut.run)).toBe(run);
  });
});

describe("nothing in the tutorial can fail", () => {
  it("ramming the bat for a whole minute costs no length, shows no hit, and never ends the run", () => {
    const { tut, rng } = fresh();
    let shortest = Infinity;
    for (let t = 0; t < 60_000; t += 25) {
      tickTutorial(tut, 25, ram(tut), rng);
      shortest = Math.min(shortest, tut.run.len);
      expect(tut.run.events.some((e) => e.k === "hit" || e.k === "dead")).toBe(false);
      expect(tut.run.phase).toBe("stage");
    }
    expect(shortest).toBe(START_LEN);
  });

  it("the boss never comes, however long it takes", () => {
    const { tut, rng } = fresh();
    for (let t = 0; t < 400_000; t += 50) tickTutorial(tut, 50, { dx: 0, dy: 1 }, rng);
    expect(tut.run.phase).toBe("stage");
    expect(tut.run.foes.every((f) => f.kind !== "warden")).toBe(true);
  });
});

describe("leaving the tutorial", () => {
  it("starts the real run from a fresh state - nothing the practice earned carries over", () => {
    const { tut, rng } = fresh();
    wrapTheBat(tut);
    tickTutorial(tut, 16, STILL, rng);
    eatAll(tut, rng);
    tutorialPick(tut, tut.run.choosing![0]);

    const run = leaveTutorial(tut, "normal", ARENA, mulberry32(77));
    expect(run).not.toBe(tut.run);
    expect(JSON.stringify(run)).toBe(JSON.stringify(newRun("normal", ARENA, mulberry32(77))));
    expect(run.crushed).toBe(0);
    expect(run.lv).toBe(1);
    expect(Object.values(run.taken).every((n) => n === 0)).toBe(true);
  });

  it("is done afterwards, even if it was left from the middle", () => {
    const { tut } = fresh();
    leaveTutorial(tut, "calm", ARENA, mulberry32(1));
    expect(tut.step).toBe("done");
  });
});

describe("the remembered flag", () => {
  function memory() {
    const m = new Map<string, unknown>();
    return {
      get<T>(k: string, fb: T): T {
        return (m.has(k) ? m.get(k) : fb) as T;
      },
      set<T>(k: string, v: T): void {
        m.set(k, v);
      },
    };
  }

  it("is unseen on a first visit and seen once marked", () => {
    const store = memory();
    expect(hasSeenTutorial(store)).toBe(false);
    markTutorialSeen(store);
    expect(hasSeenTutorial(store)).toBe(true);
  });

  it("a store that throws neither crashes the game nor hides the tutorial", () => {
    const broken = {
      get<T>(): T {
        throw new Error("SecurityError");
      },
      set(): void {
        throw new Error("QuotaExceededError");
      },
    };
    expect(() => markTutorialSeen(broken)).not.toThrow();
    expect(hasSeenTutorial(broken)).toBe(false);
  });
});
