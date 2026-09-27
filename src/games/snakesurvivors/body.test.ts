import { describe, expect, it } from "vitest";
import { advance, areaOf, findLoop, inside, NECK_PTS, SPACING } from "./body";
import { newRun } from "./logic";
import { ringRun } from "./testRing";

/**
 * The snake's body: how it moves, and how it knows it has closed a loop.
 *
 * Everything the game is FOR happens in `findLoop`, so it is pinned from both
 * sides: a real circle is a loop, and the three shapes that must NOT be one -
 * a straight snake, a tight curl near the neck, and a loop too small to hold
 * anything - are not.
 */

describe("moving", () => {
  it("glides at its speed and lays a trail at a fixed spacing", () => {
    const run = newRun("normal", { w: 420, h: 560 }, () => 0.5);
    const x0 = run.x;
    for (let i = 0; i < 60; i++) advance(run, 16, { dx: 1, dy: 0 });
    expect(run.x - x0).toBeGreaterThan(80);
    for (let i = 1; i < 10; i++) {
      const d = Math.hypot(run.path[i].x - run.path[i - 1].x, run.path[i].y - run.path[i - 1].y);
      expect(d).toBeCloseTo(SPACING, 5);
    }
  });

  it("turns at a limited rate: asking for a U-turn does not flip it in one frame", () => {
    const run = newRun("normal", { w: 420, h: 560 }, () => 0.5);
    run.heading = 0;
    advance(run, 100, { dx: -1, dy: 0 });
    expect(Math.abs(run.heading)).toBeLessThan(0.5);
    expect(Math.abs(run.heading)).toBeGreaterThan(0.2);
  });

  it("keeps its heading when nobody steers", () => {
    const run = newRun("normal", { w: 420, h: 560 }, () => 0.5);
    run.heading = 1;
    advance(run, 200, { dx: 0, dy: 0 });
    expect(run.heading).toBe(1);
  });

  it("keeps a body exactly as long as its length says", () => {
    const run = newRun("normal", { w: 420, h: 560 }, () => 0.5);
    for (let i = 0; i < 400; i++) advance(run, 16, { dx: Math.cos(i / 30), dy: Math.sin(i / 30) });
    const units = run.path.length * SPACING;
    expect(units).toBeGreaterThanOrEqual(run.len * 12 - SPACING);
    expect(units).toBeLessThanOrEqual(run.len * 12 + SPACING);
  });

  it("never leaves the world", () => {
    const run = newRun("normal", { w: 420, h: 560 }, () => 0.5);
    for (let i = 0; i < 2000; i++) advance(run, 16, { dx: -1, dy: -1 });
    expect(run.x).toBeGreaterThan(0);
    expect(run.y).toBeGreaterThan(0);
  });
});

describe("closing a loop", () => {
  it("finds the loop when the head reaches its own body", () => {
    const run = ringRun(600, 800, 50);
    const loop = findLoop(run);
    expect(loop).not.toBeNull();
    expect(areaOf(loop!)).toBeGreaterThan(Math.PI * 50 * 50 * 0.8);
  });

  it("finds no loop on a straight snake", () => {
    const run = newRun("normal", { w: 420, h: 560 }, () => 0.5);
    for (let i = 0; i < 200; i++) advance(run, 16, { dx: 1, dy: 0 });
    expect(findLoop(run)).toBeNull();
  });

  it("ignores the neck: the first points behind the head can never close a loop", () => {
    const run = ringRun(600, 800, 50);
    // Pull every body point beyond the neck far away; only the neck is left close.
    run.path = run.path.map((p, i) => (i < NECK_PTS ? p : { x: p.x + 500, y: p.y }));
    run.path[2] = { x: run.x + 1, y: run.y };
    expect(findLoop(run)).toBeNull();
  });

  it("refuses a loop too small to hold anything", () => {
    const run = ringRun(600, 800, 12, 2 * Math.PI + 1);
    expect(findLoop(run)).toBeNull();
  });
});

describe("inside a loop", () => {
  const square = [
    { x: 0, y: 0 },
    { x: 100, y: 0 },
    { x: 100, y: 100 },
    { x: 0, y: 100 },
  ];
  const ell = [
    { x: 0, y: 0 },
    { x: 100, y: 0 },
    { x: 100, y: 40 },
    { x: 40, y: 40 },
    { x: 40, y: 100 },
    { x: 0, y: 100 },
  ];

  it("counts a point in the middle and not one outside", () => {
    expect(inside(square, 50, 50)).toBe(true);
    expect(inside(square, 150, 50)).toBe(false);
    expect(inside(square, -1, 50)).toBe(false);
  });

  it("gets a concave loop right: the notch of an L is outside", () => {
    expect(inside(ell, 20, 80)).toBe(true);
    expect(inside(ell, 80, 20)).toBe(true);
    expect(inside(ell, 80, 80)).toBe(false);
  });
});
