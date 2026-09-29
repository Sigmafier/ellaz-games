// The snake's body: how the head steers and moves, how the trail behind it is
// kept, and how the game knows the snake has closed a loop.
//
// The body is a list of points one `SPACING` apart, head-first. Its length is
// counted in SEGMENTS (`SEG` units each) because that is the number a player
// sees: "a bump costs one" means one of those.

import { clampToWorld, dist2 } from "../survivors/world";
import { longOf, snapOf, speedOf, turnOf } from "./cards";
import type { Foe, Pt, Run, Steer } from "./types";

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
/** The most THIS run may grow to: `MAX_LEN`, plus what Long Body adds. */
export const maxLenOf = (run: Pick<Run, "taken">) => MAX_LEN + longOf(run);
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
 * How much further than the snap reach the GUIDE shows: from here in, the
 * guide arc runs from the head to the body point the loop will close on, so a
 * player sees the loop about to snap before it does.
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
  // Never below 0: a bump costing more than is left (R4.5's stage-3 bite on
  // wild costs 5) must end the run, not throw on a negative array length.
  const keep = Math.max(0, Math.ceil((run.len * SEG) / SPACING));
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
 * THREE-QUARTER LAP (round four, operator ruling: "the closing loop circle is
 * not good enough"): a body that has curled three quarters of the way round
 * closes the rest with a straight line, however far the head still is from
 * the body - as long as the gap is no wider than a round loop's own missing
 * quarter. For a circle of radius R that quarter's chord is 1.41 R, and the
 * loop (three quarters of the disc plus the triangle) has an "equal circle" of
 * radius 0.95 R, so the gap is 1.48 times that radius; `OPEN_K` 1.6 is that
 * with a little room for a hand-drawn loop that is not quite round.
 *
 * The gap bound is RELATIVE to the loop's own size so a curl that trails off
 * into a long straight run - a hook, not a loop - never closes from across the
 * map. The old near reach (`snapOf`, with Lasso) still closes any loop whose
 * head comes that close, whatever it has turned.
 */
export const THREE_QUARTER = 1.5 * Math.PI;
export const OPEN_K = 1.6;
/**
 * The GUIDE's rule: from half a lap on, the arc and the ring show where the
 * loop will close and which shapes it would catch (`pendingLoop`). Its gap
 * bound is looser for the same reason - a half circle's missing half is its
 * diameter, 2.83 times its equal-area radius.
 */
export const HALF_LAP = Math.PI;
export const GUIDE_K = 3;

/** What one closing rule asks: a near reach, or a turn with a gap relative to the loop's size. */
interface CloseRule {
  reach: number;
  lap: number;
  k: number;
  area: number;
}

/**
 * The body point past the neck whose loop - `head`, the body back to that
 * point, and the straight line home - encloses at least `rule.area`, and whose
 * gap to the head either is within `rule.reach` or, once the body has turned
 * `rule.lap`, is within `rule.k` times the loop's equal-area radius. NEAREST
 * the head first, and never more than one lap back (`LAP_SLACK`). A point whose
 * loop encloses too little is passed over, so brushing your own side on the way
 * round never costs the real loop behind it.
 *
 * The area is kept as a running shoelace sum, so the whole walk is one pass.
 */
function closing(head: Pt, path: readonly Pt[], rule: CloseRule): { i: number; poly: Pt[] } | null {
  if (path.length < 2) return null;
  const r2 = rule.reach * rule.reach;
  const limit = 2 * Math.PI + LAP_SLACK;
  let best = -1;
  let bestD = Infinity;
  let turn = 0;
  let prev = Math.atan2(head.y - path[0].y, head.x - path[0].x);
  // Twice the signed area of head -> path[0] -> ... -> path[i], without the closing edge.
  let cross = head.x * path[0].y - path[0].x * head.y;
  for (let i = 1; i < path.length; i++) {
    const a = path[i - 1];
    const p = path[i];
    cross += a.x * p.y - p.x * a.y;
    const dir = Math.atan2(a.y - p.y, a.x - p.x);
    turn += wrap(prev - dir);
    prev = dir;
    if (Math.abs(turn) > limit) break;
    if (i < NECK_PTS) continue;
    const area = Math.abs(cross + (p.x * head.y - head.x * p.y)) / 2;
    if (area < rule.area) continue;
    const d = dist2(head.x, head.y, p.x, p.y);
    if (d >= bestD) continue;
    const near = d < r2;
    const curled = Math.abs(turn) >= rule.lap && Math.sqrt(d) <= rule.k * Math.sqrt(area / Math.PI);
    if (near || curled) (best = i), (bestD = d);
  }
  return best < 0 ? null : { i: best, poly: [{ x: head.x, y: head.y }, ...path.slice(0, best + 1)] };
}

const closeRule = (run: Run): CloseRule => ({ reach: snapOf(run), lap: THREE_QUARTER, k: OPEN_K, area: MIN_LOOP_AREA });

/**
 * The loop the head has just closed, as a polygon (head first), or null.
 *
 * THE LOOP SNAPS SHUT (round three, 2026-09-28): the head no longer has to
 * touch its body, only come within `snapOf` of it - and since round four, a
 * body curled three quarters of the way round closes too (`THREE_QUARTER`).
 */
export function findLoop(run: Run): Pt[] | null {
  return closing(run, run.path, closeRule(run))?.poly ?? null;
}

/**
 * TWIN HEAD (round four's gold card): the TAIL end closes loops by the same
 * rule, reading the body from the other end. Null without the card. What was
 * built is exactly that - the tail is a second closing end, with its own
 * cooldown (`TAIL_COOL_MS`); it does not steer, bite or collect.
 */
export function findTailLoop(run: Run): Pt[] | null {
  if (!run.taken.twinHead || run.path.length < NECK_PTS + 2) return null;
  const tail = run.path[run.path.length - 1];
  const rest = run.path.slice(0, -1).reverse();
  return closing(tail, rest, closeRule(run))?.poly ?? null;
}

/**
 * The loop the head is WORKING ON: from half a lap round (`HALF_LAP`), or while
 * the head is within `GUIDE_REACH` times the snap reach of its body. Its point
 * is where the guide's ring sits; its polygon is what `insideNow` counts.
 */
export function pendingLoop(run: Run): { at: Pt; poly: Pt[] } | null {
  const c = closing(run, run.path, { reach: snapOf(run) * GUIDE_REACH, lap: HALF_LAP, k: GUIDE_K, area: MIN_LOOP_AREA / 2 });
  return c ? { at: run.path[c.i], poly: c.poly } : null;
}

/**
 * The body point the loop is about to snap shut on - what the guide's ring
 * marks. Null when no loop that would count is being drawn.
 */
export function snapHint(run: Run): Pt | null {
  return pendingLoop(run)?.at ?? null;
}

/**
 * Every shape that would be inside the loop if it snapped NOW (round four:
 * "N inside"). The scene only draws a ring under each; the count is its length.
 */
export function insideNow(run: Run, p = pendingLoop(run)): Foe[] {
  return p ? run.foes.filter((f) => inside(p.poly, f.x, f.y)) : [];
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
