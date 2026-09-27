// Which of Neon Survival's characters plays each shape here, and how big.
//
// The sheets are Neon Survival's, borrowed read-only: its `sprites.ts` owns the
// URLs, the pixel-exact scale and the clip names, and this file only maps this
// game's four kinds onto them.

import { CAST, scaleFor, type CastKey } from "../survivors/sprites";
import { KINDS } from "./crowd";
import type { Kind } from "./types";

export const FOR_KIND: Record<Kind, CastKey> = {
  runner: "bat",
  orb: "slime",
  brute: "crab",
  // The warden IS a giant bat - Neon Survival's own reading of the same sheet.
  warden: "bat",
};

/** The sheets this game loads - only the three it draws. */
export const SHEETS: readonly CastKey[] = ["bat", "slime", "crab"];

/**
 * The hit radius each sheet is drawn TRUE for - Neon Survival's runner, orb and
 * brute, which share this game's radii exactly (9 / 12 / 17).
 */
const TRUE_R: Partial<Record<CastKey, number>> = { bat: 9, slime: 12, crab: 17 };

/**
 * How big to draw a shape, as a Phaser scale - derived from its HIT RADIUS, so
 * the picture cannot disagree with what the loop and the head actually touch.
 *
 * A pure function, and the scene calls it rather than doing the sum: Neon
 * Survival shipped every enemy five times too big from one `setScale` in its
 * draw loop that no test could reach
 * (`.claude/rules/a-setter-that-replaces-erases-what-the-thing-was-born-with.md`).
 */
export function kindScale(kind: Kind): number {
  const key = FOR_KIND[kind];
  return scaleFor(CAST[key].manifest) * (KINDS[kind].r / (TRUE_R[key] ?? KINDS[kind].r));
}
