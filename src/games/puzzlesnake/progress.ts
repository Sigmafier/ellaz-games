// Puzzle Snake - what a player has earned, and which levels are open. Pure.
//
// Stored under ONE forever key, `stars`, as `{ "1-1": 3, "1-2": 2, ... }`: the
// best star count ever earned per level id. Level ids are forever too (see
// `levels.ts`), so a record written today still means the same level in a year.
//
// It is read from storage that anyone can hand-edit, so `readStars` keeps only
// what it can trust - a known id with a whole number from 1 to 3 - and throws
// nothing: a corrupt save reads as "fewer stars", never as a crash on the way
// into a game.
//
// KEPT ACROSS THE 2026-09-28 REDRAW, deliberately. Ten of the twelve levels
// got a new drawing that day, same id, same slot in the ladder - and nothing
// here clears a star for it. Three reasons: (1) the id is the thing the store
// is keyed on, and `CLAUDE.md`'s own law is that a persisted id never gets
// reused for a different meaning - clearing on a redraw would be quietly
// treating the id as if it HAD changed; (2) there is no backend, so a cleared
// star is gone for good, on a game whose whole pitch to a stuck seven-year-old
// is "you cannot lose"; (3) a par moving under a level a player already solved
// is not special - it happens to some level almost every time the roster is
// retuned, and this store was never a promise that a given board stays the
// board that earned the star, only that solving IT once is remembered.
import { LEVEL_IDS } from "./levels";

export type StarCount = 1 | 2 | 3;
export type StarMap = Readonly<Record<string, StarCount>>;

/** The storage key. Persisted forever - never rename it. */
export const STARS_KEY = "stars";

export function readStars(raw: unknown): StarMap {
  const out: Record<string, StarCount> = {};
  if (typeof raw !== "object" || raw === null || Array.isArray(raw)) return out;
  for (const id of LEVEL_IDS) {
    const v = (raw as Record<string, unknown>)[id];
    if (v === 1 || v === 2 || v === 3) out[id] = v;
  }
  return out;
}

/**
 * The first level is always open; every other opens once the level before it
 * has been solved (any star count). One line through both worlds, so 2-1 opens
 * on solving 1-6.
 */
export function isOpen(id: string, stars: StarMap): boolean {
  const i = LEVEL_IDS.indexOf(id);
  if (i < 0) return false;
  return i === 0 || stars[LEVEL_IDS[i - 1]] !== undefined;
}

/** Where a player lands with no better idea: the first open level not yet solved, else the last. */
export function startingLevel(stars: StarMap): string {
  return LEVEL_IDS.find((id) => isOpen(id, stars) && stars[id] === undefined) ?? LEVEL_IDS[LEVEL_IDS.length - 1];
}

/**
 * Record a solve. Keeps the BEST count, and says whether this solve improved
 * on an earlier one - which is what decides the reward reason (see the game).
 */
export function recordSolve(
  stars: StarMap,
  id: string,
  earned: StarCount,
): { stars: StarMap; first: boolean; improved: boolean } {
  const before = stars[id];
  if (before === undefined) return { stars: { ...stars, [id]: earned }, first: true, improved: false };
  if (earned > before) return { stars: { ...stars, [id]: earned }, first: false, improved: true };
  return { stars, first: false, improved: false };
}
