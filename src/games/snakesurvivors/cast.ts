// Which of Neon Survival's characters plays each shape here, and how big.
//
// The sheets are Neon Survival's, borrowed read-only: its `sprites.ts` owns the
// URLs, the pixel-exact scale and the clip names, and this file only maps this
// game's four kinds onto them.

import { CAST, scaleFor, type CastKey } from "../survivors/sprites";
import { KINDS } from "./crowd";
import type { Foe, Kind, Stage } from "./types";

export const FOR_KIND: Record<Kind, CastKey> = {
  runner: "bat",
  orb: "slime",
  brute: "crab",
  // The warden IS a giant bat - Neon Survival's own reading of the same sheet.
  warden: "bat",
  // R4.5's shapes, from the two sheets Neon Survival ships that this game had
  // not used: the red ROBOT is the fast dasher, the stone GOLEM the shooter
  // (its attack clip already throws a star). No new art.
  dasher: "robot",
  shooter: "golem",
  // A mini-boss wears its stage's sheet (`MINI_SHEET`); this is stage 1's.
  mini: "slime",
};

/** Each stage's mini-boss is a BIG version of a monster that stage has: a slime, a crab, a golem. */
export const MINI_SHEET: Record<Stage, CastKey> = { 1: "slime", 2: "crab", 3: "golem" };

/** The sheet one shape is drawn from - a mini-boss by its stage, everything else by its kind. */
export const sheetOf = (f: Pick<Foe, "kind" | "form">): CastKey => (f.kind === "mini" ? MINI_SHEET[f.form ?? 1] : FOR_KIND[f.kind]);

/** The sheets this game loads - the five Neon Survival ships. */
export const SHEETS: readonly CastKey[] = ["bat", "slime", "crab", "robot", "golem"];

/**
 * The hit radius each sheet is drawn TRUE for - Neon Survival's runner, orb and
 * brute, which share this game's radii exactly (9 / 12 / 17).
 */
const TRUE_R: Partial<Record<CastKey, number>> = {
  bat: 9,
  slime: 12,
  crab: 17,
  // Neon Survival's golem boss collides at r 26 on this sheet.
  golem: 26,
  // The robot is Neon Survival's HERO (r 11, 48 units tall). Here it is the
  // dasher, r 8, and 16 is chosen so it draws 24 units tall - a bat's height
  // for a bat's size of target, rather than a hero-sized picture on a tiny hitbox.
  robot: 16,
};

/**
 * How big to draw a shape, as a Phaser scale - derived from its HIT RADIUS, so
 * the picture cannot disagree with what the loop and the head actually touch.
 *
 * A pure function, and the scene calls it rather than doing the sum: Neon
 * Survival shipped every enemy five times too big from one `setScale` in its
 * draw loop that no test could reach
 * (`.claude/rules/a-setter-that-replaces-erases-what-the-thing-was-born-with.md`).
 */
export function kindScale(kind: Kind, form?: Stage): number {
  const key = sheetOf({ kind, form });
  return scaleFor(CAST[key].manifest) * (KINDS[kind].r / (TRUE_R[key] ?? KINDS[kind].r));
}
