// The snake's body: how the head steers and moves, how the trail behind it is
// kept, and how the game knows the snake has closed a loop.
//
// The body is a list of points one `SPACING` apart, head-first. Its length is
// counted in SEGMENTS (`SEG` units each) because that is the number a player
// sees: "a hit costs two" means two of those.

import { clampToWorld, dist2 } from "../survivors/world";
import { speedOf, turnOf } from "./cards";
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
/** Segments a hit to the head costs. */
export const HIT_COST = 2;
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
/** How close the head must come to its body to close the loop. */
export const TOUCH = 10;
/**
 * The smallest loop that crushes, in square units - a circle of radius ~36.
 *
 * DELIBERATELY BIGGER than the snake's tightest turn (radius 29, 2,640 square
 * units), and that gap is the rule rather than a tuning accident. Measured
 * 2026-09-27 with bots on every level and both arena shapes: at 1,200 a bot
 * holding ONE key spun its tightest circle and never died - the crowd that
 * drifted inside was crushed every 350 ms and its gems paid back more tail than
 * the hits cost, 18 of 18 runs reaching the eight-minute cap. At 4,000 that
 * spin crushes nothing, the shapes settle inside it at reach of the head, and
 * the same bot dies in about 25 seconds. A loop has to be steered.
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
 * The loop the head has just closed, as a polygon (head first), or null.
 *
 * The FIRST body point past the neck that the head touches decides it, and a
 * touch that encloses too little is passed over in favour of one further down
 * the body - so brushing your own side on the way round never costs the real
 * loop behind it.
 */
export function findLoop(run: Run): Pt[] | null {
  const t2 = TOUCH * TOUCH;
  for (let i = NECK_PTS; i < run.path.length; i++) {
    const p = run.path[i];
    if (dist2(run.x, run.y, p.x, p.y) >= t2) continue;
    const poly = [{ x: run.x, y: run.y }, ...run.path.slice(0, i + 1)];
    if (areaOf(poly) >= MIN_LOOP_AREA) return poly;
  }
  return null;
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
