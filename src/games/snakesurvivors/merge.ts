// GEM MERGE: the blue card that replaced Double Gems (operator ruling,
// 2026-10-01). Its id is still `doubleGems` - card ids live in saves and
// snapshots, and a persisted id is forever - only its name and its rule changed.
//
// A forum reviewer: "way too many gems. It's not interesting." Double Gems made
// every gem worth twice as much and left just as many on the floor. Gem Merge
// leaves the VALUE alone and cuts the COUNT: gems lying near each other slide
// together and fuse into one bigger gem worth exactly the sum of them.
//
// Pure - no DOM, no Phaser, no rng. The scene draws what this returns.

import type { Gem, Pt } from "./types";

export const MERGE = {
  /** How near two gems must lie, in units, before they pull together. */
  reach: 48,
  /** How fast a gem slides toward its partner, units/s: a short visible pull, never a jump. */
  pull: 50,
  /** How near two sliding gems must come to fuse into one. */
  fuse: 5,
} as const;

/**
 * How much further than an ordinary gem a FUSED one is picked up from, as a
 * multiplier on the pickup radius. A 1 to 3 gem reads exactly 1, so a run
 * without the card is untouched; a big pile reaches up to twice as far and
 * never further. Neon Survival's merge measured why this matters: a pile left
 * where the snake does not pass is value a player who moves never collects.
 */
export const gemReach = (v: number) => Math.min(2, 1 + Math.max(0, v - 3) * 0.08);

/** A gem the merge may move: a dropped one, outside the head's reach. Floor gems never merge - their count is a cap. */
const free = (g: Gem, head: Pt, guard: number) => !g.floor && Math.hypot(g.x - head.x, g.y - head.y) > guard;

/** For each free gem, the index of the nearest other free gem within `MERGE.reach`, or -1. */
function partners(gems: readonly Gem[], head: Pt, guard: number): number[] {
  const ok = gems.map((g) => free(g, head, guard));
  return gems.map((g, i) => {
    if (!ok[i]) return -1;
    let best = -1;
    let bestD = MERGE.reach * MERGE.reach;
    for (let j = 0; j < gems.length; j++) {
      if (j === i || !ok[j]) continue;
      const d = (gems[j].x - g.x) ** 2 + (gems[j].y - g.y) ** 2;
      if (d <= bestD) (bestD = d), (best = j);
    }
    return best;
  });
}

/** The pairs being pulled together right now, gem to partner - what the scene draws as the pull. */
export function pullPairs(gems: readonly Gem[], head: Pt, guard: number): [Gem, Gem][] {
  return partners(gems, head, guard).flatMap((j, i) => (j < 0 ? [] : [[gems[i], gems[j]] as [Gem, Gem]]));
}

/**
 * One tick of the merge. `head` and `guard`: a gem within `guard` of the head
 * is the magnet's or the pickup's, and is left exactly where it is - moving it
 * could carry it out of a pull that was about to collect it. Returns new gem
 * objects; the array handed in is not changed.
 *
 * Every gem slides toward its nearest free neighbour (all moves read the
 * positions BEFORE any of them, so the order of the array cannot matter), at
 * most half the gap so two gems meet in the middle rather than crossing; then
 * any two within `MERGE.fuse` become one, placed at their value-weighted middle
 * and worth both. Values are whole numbers and only ever added, so the total is
 * conserved exactly.
 */
export function mergeGems(gems: readonly Gem[], head: Pt, guard: number, dt: number): Gem[] {
  const to = partners(gems, head, guard);
  const step = (MERGE.pull * dt) / 1000;
  const moved: Gem[] = gems.map((g, i) => {
    const j = to[i];
    if (j < 0) return { ...g };
    const dx = gems[j].x - g.x;
    const dy = gems[j].y - g.y;
    const d = Math.hypot(dx, dy);
    if (d === 0) return { ...g };
    const k = Math.min(step, d / 2) / d;
    return { ...g, x: g.x + dx * k, y: g.y + dy * k };
  });
  const gone = new Set<number>();
  for (let i = 0; i < moved.length; i++) {
    if (gone.has(i) || to[i] < 0) continue;
    const a = moved[i];
    for (let j = i + 1; j < moved.length; j++) {
      if (gone.has(j) || to[j] < 0) continue;
      const b = moved[j];
      if (Math.hypot(a.x - b.x, a.y - b.y) > MERGE.fuse) continue;
      const v = a.v + b.v;
      a.x = (a.x * a.v + b.x * b.v) / v;
      a.y = (a.y * a.v + b.y * b.v) / v;
      a.v = v;
      gone.add(j);
    }
  }
  return moved.filter((_, i) => !gone.has(i));
}
