// Which shape of lane this run is played on.
//
// OUTSIDE `logic.ts` on purpose, and for the reason survivors' `phoneArena.ts`
// gives: picking a SHAPE for a run is the renderer's question, asked once at
// mount before the run exists. It is not a rule the simulation applies, and
// keeping it here is what lets `logic.ts` name `ARENA` only twice.

import { ARENA, LANE, type Arena } from "./logic";

/**
 * The tallest and shortest sky this game will draw, as width-over-height.
 *
 * A lane much wider than 2.6:1 is a letterbox slot nobody can see an air unit
 * in; much squarer than 1.5:1 and the sky is taller than the lane is long,
 * which is a different game's shape. Both are clamps rather than targets - the
 * ratio a real window asks for is almost always between them.
 */
const WIDEST = 2.6;
const TALLEST = 1.5;

/**
 * The lane, fitted to the box it will be drawn in.
 *
 * THIS GAME HOLDS THE LANE'S LENGTH, NOT ITS AREA, and that is a deliberate
 * departure from the showcase rule survivors set. `CLAUDE.md` says a showcase
 * arena's two shapes hold the same AREA, and survivors measured why: in an
 * omnidirectional arena the floor IS the crowd density, because enemies arrive
 * at a rate the clock sets rather than a rate per unit of floor - so more floor
 * is a thinner crowd and a quietly easier game.
 *
 * A LANE is not that. Here the difficulty variables are how long a walker is in
 * your sights before it arrives, and how far the gun reaches against that. The
 * height holds the sky the air units fly in and almost nothing else. Holding
 * the area constant across two shapes would trade lane length for sky - trading
 * the thing that sets the difficulty for the thing that does not - so the WIDTH
 * is what is held and the height follows the window.
 *
 * DERIVED CONTINUOUSLY rather than picked from two constants. Bubble Shooter's
 * `columnsFor` is the newer and better pattern: it reads the box's own ratio and
 * caps it, so every window gets an honest shape instead of one of two. Two
 * constants are two answers, and a window that is neither gets the wrong one.
 *
 * A box that cannot be measured returns `ARENA` unchanged, so a zero or a NaN
 * from a layout that has not happened yet can never reach the simulation - the
 * same guard `phoneArena` carries, for the same reason.
 */
export function laneArena(boxW: number, boxH: number): Arena {
  if (!(boxW > 0 && boxH > 0)) return ARENA;
  const ratio = Math.min(WIDEST, Math.max(TALLEST, boxW / boxH));
  return { w: LANE, h: Math.round(LANE / ratio) };
}
