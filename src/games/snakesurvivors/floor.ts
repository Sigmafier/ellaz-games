// Floor gems: a few gems lying about the floor, so a player who has not closed a
// loop yet still grows and levels (operator ruling R2.4).
//
// The reviewer who asked for this circled the bats, was bitten, lost two
// segments and was "no longer long enough to surround anything, so how can I
// win?" Crushed shapes were the only source of gems, so a player who could not
// loop could not grow, and a player who could not grow could not loop. These
// break that circle - and are deliberately a TRICKLE, because the game is the
// loop: pacing.test.ts plays a bot that only eats floor gems beside one that
// loops, and pins the gap between them.

import { cameraOf, clampToWorld, inView } from "../survivors/world";
import type { Run } from "./types";

export const FLOOR_GEMS = {
  /** ms into a run before the first one is laid. */
  firstMs: 800,
  /** ms between two, once the first is down. */
  everyMs: 3000,
  /** The most that lie on the floor at once. */
  cap: 4,
  /** Never laid nearer the head than this, so a player has to steer to one. */
  near: 70,
  /** Kept this far inside the view's edge, so a gem is laid where it can be seen. */
  inset: 24,
  /**
   * A floor gem this far outside the view is picked up off the floor again.
   * Not `isLeftBehind`'s whole view: on a world three views wide a gem is
   * almost never a whole view behind, so a player crossing the map would leave
   * the cap full of gems they cannot see and never be laid another.
   */
  forget: 120,
} as const;

export const floorGemCount = (run: Pick<Run, "gems">) => run.gems.filter((g) => g.floor).length;

/**
 * Run the floor-gem clock: clear the floor gems left well out of sight, then
 * lay what is due, up to the cap. A due gem with the floor full is not banked -
 * the clock simply waits another beat.
 */
export function tickFloorGems(run: Run, dt: number, rng: () => number): void {
  run.gems = run.gems.filter((g) => !g.floor || inView(run, g.x, g.y, FLOOR_GEMS.forget));
  run.floorIn -= dt;
  while (run.floorIn <= 0) {
    run.floorIn += FLOOR_GEMS.everyMs;
    if (floorGemCount(run) >= FLOOR_GEMS.cap) continue;
    const at = floorPoint(run, rng);
    if (at) run.gems.push({ x: at.x, y: at.y, v: 1, floor: true });
  }
}

/**
 * A point inside the view, clear of the head, inside the walls - or null when
 * four tries all landed on the head (the gem simply waits a beat). Two rng draws
 * per try, so the same seed lays the same gems.
 */
function floorPoint(run: Run, rng: () => number): { x: number; y: number } | null {
  const c = cameraOf(run);
  const { inset, near } = FLOOR_GEMS;
  for (let attempt = 0; attempt < 4; attempt++) {
    const p = clampToWorld(run, c.x + inset + rng() * (run.arena.w - 2 * inset), c.y + inset + rng() * (run.arena.h - 2 * inset), inset);
    if (Math.hypot(p.x - run.x, p.y - run.y) >= near) return p;
  }
  return null;
}
