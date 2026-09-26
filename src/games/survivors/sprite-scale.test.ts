// How big an enemy is DRAWN.
//
// WHY THIS FILE EXISTS. On 2026-09-21 `SurvivorsScene.ts` shipped live drawing
// every enemy five times too big, and stayed that way through a full test
// suite, four build gates, a browser probe and a deploy whose own live check
// went green. The line was `setScale(e.elite ? ELITE.r : 1)`: `setScale`
// REPLACES, so the `1` threw away the `scaleFor(manifest)` the sprite was born
// with. Nothing in this repo can drive a Phaser scene, so nothing could fail.
//
// The lesson is the same one the boss bar taught in the same arc: an arithmetic
// that decides what a player SEES must live where a test can reach it. This
// file is the test that reaches it.
import { describe, expect, it } from "vitest";
import { ELITE, KINDS } from "./enemies";
import { enemyScale } from "./sprites";
import type { Enemy, EnemyKind } from "./types";

const of = (kind: EnemyKind, elite = false) => enemyScale({ kind, elite } as Pick<Enemy, "kind" | "elite">);

/** One authored pixel on one arena unit: `1 / (UNIT * manifest.scale)`, UNIT 5, scale 1. */
const TRUE_SIZE = 0.2;

describe("an enemy is drawn at the size its hitbox says", () => {
  it("draws the three original shapes at TRUE SHEET SIZE - the picture before the stages arc", () => {
    // THE REGRESSION CELL. Each of these was 1 on the live site and is 0.2 here,
    // so this cell alone reds on the shipped code. Five times too big, which is
    // twenty-five times the area on screen.
    expect(of("runner")).toBeCloseTo(TRUE_SIZE, 6);
    expect(of("orb")).toBeCloseTo(TRUE_SIZE, 6);
    expect(of("brute")).toBeCloseTo(TRUE_SIZE, 6);
    expect(of("golem")).toBeCloseTo(TRUE_SIZE, 6);
  });

  it("is never drawn bigger than the player's own sprite by more than its radius says", () => {
    // The population, and the sanity floor: nothing may exceed true size by more
    // than the biggest radius ratio in the table (golem 26 over runner 9).
    //
    // A FLOOR RATHER THAN AN EQUALITY, 2026-09-22. This read `toHaveLength(7)`
    // and went red the moment the roster grew to 9 - a correct change failing a
    // cell that was never about the count. What this line is for is that the
    // loop below is not vacuous: a `KINDS` that lost its rows would pass every
    // assertion under it by iterating nothing. That property is "at least the
    // seven this ceiling was derived against", and a roster that grows is not a
    // regression. The ceiling itself still has to hold for every new arrival,
    // which is the assertion inside the loop and the part that does the work.
    const every = (Object.keys(KINDS) as EnemyKind[]).map((k) => of(k));
    expect(every.length).toBeGreaterThanOrEqual(7);
    for (const s of every) {
      expect(s).toBeGreaterThan(0);
      expect(s).toBeLessThanOrEqual(TRUE_SIZE * (26 / 9));
    }
  });

  it("makes a warden a GIANT bat and a shard a SMALL golem - the shared sheets", () => {
    // Three kinds reuse another kind's sheet, and size is the only thing that
    // tells them apart. Before this function they drew identically, while the
    // comment on `FOR_ENEMY` claimed the size said which was which.
    expect(of("warden")).toBeGreaterThan(of("runner") * 2); // 20 vs 9
    expect(of("queen")).toBeGreaterThan(of("brute"));        // 23 vs 17
    expect(of("shard")).toBeLessThan(of("golem"));           // 11 vs 26
    // And the RATIO is the radius ratio, not a number someone liked.
    expect(of("warden") / of("runner")).toBeCloseTo(KINDS.warden.r / KINDS.runner.r, 6);
    expect(of("shard") / of("golem")).toBeCloseTo(KINDS.shard.r / KINDS.golem.r, 6);
  });

  it("draws the two shapes that SHOOT bigger than the shapes they are dressed from", () => {
    // THE CELL THE MERGE OF 2026-09-22 TURNS ON. A spitter wears the slime and a
    // lancer wears the crab, and both were written with a hand-picked
    // `DRESS_SCALE` in the scene (1.2 and 1.35) so a player could tell them from
    // the ordinary shape. That multiplier was deleted rather than carried across,
    // because `enemyScale` had meanwhile been extracted to make the picture
    // follow the hitbox and a second multiplier on top is the drift it ended.
    //
    // So the separation has to come from the radii or it does not exist. It does:
    // spitter r13 over orb r12, lancer r19 over brute r17. Small, deliberately -
    // what really tells a shooter apart is the standing ring and the wind-up, and
    // a tint alone was measured invisible (lime on a green slime, 2026-09-21).
    expect(of("spitter")).toBeGreaterThan(of("orb"));
    expect(of("lancer")).toBeGreaterThan(of("brute"));
    expect(of("spitter") / of("orb")).toBeCloseTo(KINDS.spitter.r / KINDS.orb.r, 6);
    expect(of("lancer") / of("brute")).toBeCloseTo(KINDS.lancer.r / KINDS.brute.r, 6);
  });

  it("scales an elite by exactly the multiplier the simulation collides with", () => {
    for (const kind of ["runner", "orb", "brute", "shard"] as EnemyKind[]) {
      expect(of(kind, true)).toBeCloseTo(of(kind) * ELITE.r, 6);
    }
  });

  it("THE CONTROL: the three sizes are actually different, or every cell above is vacuous", () => {
    // Without this, a function returning one constant passes the ratio cells by
    // dividing equal numbers - which is the exact defect being fixed, one layer
    // up. Measured distinctly.
    //
    // THE FIRST VERSION OF THIS CELL WAS WRONG, and it is worth keeping the
    // reason: it picked runner, warden, shard and golem and demanded four
    // distinct sizes. runner and golem are each their OWN sheet's native kind,
    // so both are exactly true size by design and the cell failed on correct
    // code. A control must assert a property the design actually has - here,
    // four kinds whose radii differ from their sheet's native radius by four
    // different ratios.
    const sizes = new Set([of("runner"), of("warden"), of("shard"), of("queen")].map((n) => n.toFixed(6)));
    expect(sizes.size).toBe(4);
  });
});
