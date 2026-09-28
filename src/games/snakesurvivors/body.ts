// The snake's body: how the head steers and moves, how the trail behind it is
// kept, and how the game knows the snake has closed a loop.
//
// The body is a list of points one `SPACING` apart, head-first. Its length is
// counted in SEGMENTS (`SEG` units each) because that is the number a player
// sees: "a bump costs one" means one of those.

import { clampToWorld, dist2 } from "../survivors/world";
import { snapOf, speedOf, turnOf } from "./cards";
import type { Pt, Run, Steer } from "./types";

/** Units between two body points. Small enough that a curve reads round. */
export const SPACING = 4;
/** Units in one segment - the unit the LENGTH on screen counts. */
export const SEG = 12;
/**
 * 28 segments, 336 units: room for a loop of radius ~50. It was 16 until the
 * first bot run (2026-09-27), and at 16 the body could only close a loop at its
 * tightest possible turn - every bot died in 15 seconds having crushed nothing.
 */
export const START_LEN = 28;
/** Below this many segments the run is over. */
export const MIN_LEN = 3;
/**
 * Segments a bump to the head costs. It was 2 until round three (2026-09-28):
 * "in real game I lost my length and lives very fast" - and length is also the
 * reach of a loop, so every bump took away the move that answers it.
 */
export const HIT_COST = 1;
/** The most segments a snake can grow to, so a long run stays drawable. */
export const MAX_LEN = 60;
export const HEAD_R = 9;
export const BODY_R = 6;

/**
 * The body points right behind the head that can never close a loop. Sixty
 * units: the tightest turn the snake can make (speed / turn rate = 29 units of
 * radius) brings its body back no closer than that, so anything nearer is the
 * neck bending, not a loop.
 *
 * `MIN_LOOP_AREA` alone already refuses these: a loop closed within 60 units of
 * body has a 64-unit perimeter and encloses at most 64^2 / 4pi = 326 square
 * units, far under the floor. So this is a cheap early skip, not a second guard -
 * measured 2026-09-27, deleting it turned no test red, and that is why.
 */
export const NECK_PTS = 15;
/**
 * How much further than the snap reach the GUIDE shows: from here in, a dashed
 * line runs from the head to the body point the loop will close on, so a player
 * sees the loop about to snap before it does.
 */
export const GUIDE_REACH = 2;
/**
 * The smallest loop that crushes, in square units - a circle of radius ~36.
 *
 * KEPT at 4,000 when round three widened the snap reach (2026-09-28). The reach
 * alone would have broken it: measured, the one-key spin at the STARTING
 * length snapping shut from 42 units wound into polygons of up to 5,238 square
 * units, and at full length and full Lasso 11,360. `LAP_SLACK` caps a loop at
 * one lap, and the same spins then top out at 2,908 and 3,366 - under this
 * floor with room. The starting 28 segments already close about 6,000 once the
 * neck is left out, so this floor never stood between a new snake and a crush;
 * the touch did (see `SNAP` in cards.ts).
 */
export const MIN_LOOP_AREA = 4000;

const wrap = (a: number) => Math.atan2(Math.sin(a), Math.cos(a));

/** Turn toward the steer, move, keep the trail. */
export function advance(run: Run, dt: number, steer: Steer): void {
  if (steer.dx !== 0 || steer.dy !== 0) {
    const want = Math.atan2(steer.dy, steer.dx);
    const most = (turnOf(run) * dt) / 1000;
    const d = wrap(want - run.heading);
    run.heading = wrap(run.heading + Math.max(-most, Math.min(most, d)));
  }
  const reach = (speedOf(run) * dt) / 1000;
  const next = clampToWorld(run, run.x + Math.cos(run.heading) * reach, run.y + Math.sin(run.heading) * reach, HEAD_R);
  run.x = next.x;
  run.y = next.y;
  layTrail(run);
  trimTrail(run);
}

/** Lay a body point every `SPACING` units along the way the head came. */
function layTrail(run: Run): void {
  let anchor = run.path[0] ?? { x: run.x, y: run.y };
  for (;;) {
    const d = Math.hypot(run.x - anchor.x, run.y - anchor.y);
    if (d < SPACING) return;
    const p = { x: anchor.x + ((run.x - anchor.x) / d) * SPACING, y: anchor.y + ((run.y - anchor.y) / d) * SPACING };
    run.path.unshift(p);
    anchor = p;
  }
}

/** Cut the body to the length the run says it has. */
export function trimTrail(run: Run): void {
  const keep = Math.ceil((run.len * SEG) / SPACING);
  if (run.path.length > keep) run.path.length = keep;
}

/**
 * How far past one full turn the body may wind between the head and the point a
 * loop closes on, in radians. A loop is ONE lap. Without this bound the wider
 * snap reach turned the tightest spin back into a weapon - a snake holding one
 * key wound 1.5 laps into a polygon over the 4,000 floor (5,238 at the starting
 * length, measured 2026-09-28) and crushed whatever drifted in. With it, the
 * same spin tops out at 2,908 (3,366 at full length and full Lasso). A real
 * loop - a head arriving along or across its own body - turns 2 pi give or take
 * a right angle, well inside the slack.
 */
export const LAP_SLACK = 2.2;

/**
 * The body point past the neck within `reach` of the head whose loop - head,
 * the body back to that point, and the straight line home - encloses enough to
 * count, NEAREST the head first, and never more than one lap back
 * (`LAP_SLACK`). A point whose loop encloses too little is passed over, so
 * brushing your own side on the way round never costs the real loop behind it.
 */
function closing(run: Run, reach: number): { i: number; poly: Pt[] } | null {
  const r2 = reach * reach;
  const limit = 2 * Math.PI + LAP_SLACK;
  const path = run.path;
  let best: { i: number; poly: Pt[] } | null = null;
  let bestD = r2;
  let turn = 0;
  let prev = Math.atan2(run.y - (path[0]?.y ?? run.y), run.x - (path[0]?.x ?? run.x));
  for (let i = 1; i < path.length; i++) {
    const dir = Math.atan2(path[i - 1].y - path[i].y, path[i - 1].x - path[i].x);
    turn += wrap(prev - dir);
    prev = dir;
    if (Math.abs(turn) > limit) break;
    if (i < NECK_PTS) continue;
    const p = path[i];
    const d = dist2(run.x, run.y, p.x, p.y);
    if (d >= bestD) continue;
    const poly = [{ x: run.x, y: run.y }, ...path.slice(0, i + 1)];
    if (areaOf(poly) >= MIN_LOOP_AREA) (best = { i, poly }), (bestD = d);
  }
  return best;
}

/**
 * The loop the head has just closed, as a polygon (head first), or null.
 *
 * THE LOOP SNAPS SHUT (round three, 2026-09-28): the head no longer has to
 * touch its body, only come within `snapOf` of it, and the polygon is closed
 * with a straight line from the head to that point.
 */
export function findLoop(run: Run): Pt[] | null {
  return closing(run, snapOf(run))?.poly ?? null;
}

/**
 * The body point the loop is about to snap shut on, while the head is within
 * `GUIDE_REACH` times the reach of it - what the dashed guide line points at.
 * Null when no loop that would count is near.
 */
export function snapHint(run: Run): Pt | null {
  const c = closing(run, snapOf(run) * GUIDE_REACH);
  return c ? run.path[c.i] : null;
}

/** The area a polygon encloses (shoelace), whichever way round it runs. */
export function areaOf(poly: readonly Pt[]): number {
  let a = 0;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) a += (poly[j].x + poly[i].x) * (poly[j].y - poly[i].y);
  return Math.abs(a) / 2;
}

/** Is a point inside the polygon? Even-odd ray cast, so a concave loop is right. */
export function inside(poly: readonly Pt[], x: number, y: number): boolean {
  let hit = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const a = poly[i];
    const b = poly[j];
    if (a.y > y !== b.y > y && x < ((b.x - a.x) * (y - a.y)) / (b.y - a.y) + a.x) hit = !hit;
  }
  return hit;
}

/** The middle of a loop, for the burst and the shockwave. */
export function centreOf(poly: readonly Pt[]): Pt {
  let x = 0;
  let y = 0;
  for (const p of poly) (x += p.x), (y += p.y);
  return { x: x / poly.length, y: y / poly.length };
}
