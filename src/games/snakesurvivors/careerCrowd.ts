// A CAREER level's crowd numbers - what `tuning.ts`, `crowd.ts` and `cards.ts`
// read in place of the quick run's own, behind `if (run.career)`.
//
// A LEAF: it imports types only, so the three files that call in can do so
// without the graph at the top of `types.ts` growing a cycle. Every function
// takes the level's `SnakeCareer` block and reads nothing else, so a quick run -
// which has no block - can never reach one.
//
// THE CROWD CLIMBS WITH THE LEVEL, not with the clock: the gap between two shapes
// closes from the level's `spawnMs` to its `floorMs` as the crushed count nears the
// target, and each world's later shapes join at their share of it. A player who
// is nearly done meets the level's hardest crowd, whatever the clock says.

import type { SnakeCareer } from "./careerTypes";
import type { Kind } from "./types";

/** How far through its target the level is, 0 to 1. */
export const careerShare = (c: Pick<SnakeCareer, "target">, crushed: number): number =>
  Math.max(0, Math.min(1, crushed / Math.max(1, c.target)));

/**
 * What `crowdAt` hands back on a career level: the crowd's multipliers over the
 * quick-run row the level is built on (`newCareerRun` builds on normal). `cap` is
 * the level's own cap as a share of that row's, so `tickSpawns`' rounding lands on
 * it exactly; `spawn` is unused (`careerSpawnEvery` owns the gap).
 */
export function careerCrowd(c: SnakeCareer, levelCap: number): { cap: number; spawn: number; hp: number; pace: number } {
  return { cap: c.cap / levelCap, spawn: 1, hp: c.hp, pace: c.pace };
}

/** The shapes the clock may send right now: the world's own, each from its share of the target. */
export function careerKinds(c: SnakeCareer, crushed: number): Kind[] {
  const share = careerShare(c, crushed);
  const open = c.kinds.filter(([, at]) => share >= at).map(([k]) => k);
  return open.length > 0 ? open : ["runner"];
}

/** ms between two shapes: closing from `spawnMs` to `floorMs` over the target, eased off while a boss is up. */
export function careerSpawnEvery(c: SnakeCareer, crushed: number): number {
  const gap = c.spawnMs + (c.floorMs - c.spawnMs) * careerShare(c, crushed);
  return c.bossUp ? gap * 1.6 : gap;
}

/** Segments one bump costs on this level. */
export const careerHitCost = (c: Pick<SnakeCareer, "bite">): number => c.bite;
