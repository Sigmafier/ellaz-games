import { describe, expect, it } from "vitest";
import { mulberry32 } from "@shared/rng";
import { inView } from "../survivors/world";
import { KINDS, CALM_PACE, SAFE_START_MS, moveFoes } from "./crowd";
import { FLOOR_GEMS, floorGemCount, tickFloorGems } from "./floor";
import { newRun, step } from "./logic";
import type { Foe, Run } from "./types";

/**
 * The two answers to "I lost my length and could not surround anything, so how
 * can I win?" (a Phaser-forum reviewer, 2026-09-27; operator ruling R2.4):
 *
 *  - FLOOR GEMS: a few gems lie on the floor, a new one every so often up to a
 *    cap, so a player who has not closed a loop yet still grows and levels.
 *  - A SAFE START: for the first `SAFE_START_MS` the shapes drift slowly and do
 *    not chase, so the first loop is learnt on a crowd that is not biting.
 *
 * How much floor gems are worth against crushing is pinned in pacing.test.ts,
 * with a bot that never loops beside one that does.
 */

const STILL = { dx: 0, dy: 0 };

let nextId = 5000;
function foe(x: number, y: number): Foe {
  return { id: nextId++, kind: "runner", x, y, hp: 1, hurt: 0, stun: 0, spikeCool: 0, dash: 0, dashCool: 0, windup: 0, slow: 0 };
}

/** A run with the shape clock held off. */
function noShapes(run: Run): Run {
  run.spawnIn = 1e12;
  run.foes = [];
  return run;
}

describe("floor gems", () => {
  it("appear on a run where nothing has been crushed", () => {
    const rng = mulberry32(3);
    const run = noShapes(newRun("normal", { w: 420, h: 560 }, rng));
    for (let t = 0; t < 12_000; t += 25) step(run, 25, { dx: Math.cos(t / 900), dy: Math.sin(t / 900) }, rng);
    expect(run.crushed).toBe(0);
    expect(floorGemCount(run)).toBeGreaterThanOrEqual(2);
  });

  it("never lie on the floor more than the cap at once, however long nobody picks one up", () => {
    const rng = mulberry32(4);
    const run = noShapes(newRun("normal", { w: 420, h: 560 }, rng));
    let most = 0;
    for (let t = 0; t < 180_000; t += 25) {
      // Parked in one place: every gem it lays stays in view and stays uncollected.
      run.x = run.world.w / 2;
      run.y = run.world.h / 2;
      tickFloorGems(run, 25, rng);
      most = Math.max(most, floorGemCount(run));
    }
    expect(FLOOR_GEMS.cap).toBeGreaterThan(0);
    expect(most).toBe(FLOOR_GEMS.cap);
  });

  it("land in the view, clear of the head, so a player sees them and has to go and get them", () => {
    const rng = mulberry32(5);
    const run = noShapes(newRun("normal", { w: 420, h: 560 }, rng));
    for (let t = 0; t < 60_000; t += 25) tickFloorGems(run, 25, rng);
    const floor = run.gems.filter((g) => g.floor);
    expect(floor.length).toBe(FLOOR_GEMS.cap);
    for (const g of floor) {
      expect(Math.abs(g.x - run.x)).toBeLessThanOrEqual(run.arena.w / 2);
      expect(Math.abs(g.y - run.y)).toBeLessThanOrEqual(run.arena.h / 2);
      expect(Math.hypot(g.x - run.x, g.y - run.y)).toBeGreaterThanOrEqual(FLOOR_GEMS.near);
    }
  });

  it("left well out of sight are cleared, so the cap refills where the player is", () => {
    const rng = mulberry32(6);
    const run = noShapes(newRun("normal", { w: 420, h: 560 }, rng));
    // Lay a full floor in the top-left corner of the world...
    run.x = 80;
    run.y = 80;
    for (let t = 0; t < 60_000; t += 25) tickFloorGems(run, 25, rng);
    expect(floorGemCount(run)).toBe(FLOOR_GEMS.cap);
    // ...then cross to the far corner: the old ones go and new ones land in view.
    run.x = run.world.w - 80;
    run.y = run.world.h - 80;
    for (let t = 0; t < 60_000; t += 25) tickFloorGems(run, 25, rng);
    expect(floorGemCount(run)).toBe(FLOOR_GEMS.cap);
    for (const g of run.gems) expect(inView(run, g.x, g.y), `${g.x},${g.y}`).toBe(true);
  });

  it("are worth what a crushed shape's gem is worth - one", () => {
    const rng = mulberry32(7);
    const run = noShapes(newRun("normal", { w: 420, h: 560 }, rng));
    for (let t = 0; t < 30_000; t += 25) tickFloorGems(run, 25, rng);
    for (const g of run.gems) expect(g.v).toBe(1);
  });
});

describe("the safe start", () => {
  it("is twenty seconds", () => {
    expect(SAFE_START_MS).toBe(20_000);
  });

  /** A still head and one runner 150 units away, moved `ms` by the crowd alone. */
  function drift(t0: number, ms: number) {
    const rng = mulberry32(8);
    const run = noShapes(newRun("normal", { w: 420, h: 560 }, rng));
    run.t = t0;
    const f = foe(run.x + 150, run.y);
    run.foes = [f];
    let fastest = 0;
    let nearest = Infinity;
    for (let t = 0; t < ms; t += 16) {
      const x = f.x;
      const y = f.y;
      moveFoes(run, 16, rng);
      fastest = Math.max(fastest, Math.hypot(f.x - x, f.y - y) / 0.016);
      nearest = Math.min(nearest, Math.hypot(f.x - run.x, f.y - run.y));
    }
    return { fastest, nearest };
  }

  it("shapes do not chase the head in the first twenty seconds", () => {
    // Chasing at 62 units/s a runner covers 150 units in 2.4 s. Wandering, it
    // is still well clear after five.
    const d = drift(0, 5000);
    expect(d.nearest).toBeGreaterThan(80);
  });

  it("and they move slowly while they wander", () => {
    const d = drift(0, 5000);
    expect(CALM_PACE).toBeLessThan(0.5);
    expect(d.fastest).toBeLessThanOrEqual(KINDS.runner.speed * CALM_PACE + 0.01);
  });

  it("after the safe start they chase again, at full speed", () => {
    const d = drift(SAFE_START_MS, 5000);
    expect(d.nearest).toBeLessThan(5);
    expect(d.fastest).toBeGreaterThan(KINDS.runner.speed * 0.9);
  });

  it("the clock still sends shapes during the safe start - there is a crowd to learn the loop on", () => {
    const rng = mulberry32(9);
    const run = newRun("normal", { w: 420, h: 560 }, rng);
    for (let t = 0; t < SAFE_START_MS - 1000; t += 25) {
      run.blink = 1e9;
      step(run, 25, STILL, rng);
    }
    expect(run.foes.length).toBeGreaterThanOrEqual(5);
  });
});
