// What Snake Survivors' HUD SHOWS, as numbers and states - no pixels. The
// layout is "C3 Big hearts, length right", approved by the operator off a mock
// on 2026-10-01 ("Life: hearts top left, bigger hearts. Length: top right."):
//
//   top-left   a framed block of big hearts, 4 to a row, lost ones as outlines,
//              the whole block red at the last heart
//   top-right  the length, big, with the snake glyph and no word
//   bottom     the boss meter: icon, bar, "25/50" and "0/10" as icons + numbers
//   side       the weapons, only once owned
//
// Crushed, best and level are NOT drawn in play; they live on the pause card
// and the game-over card (`runStats` below feeds both). `SnakeHud.tsx` draws it.

import { START_LEN } from "./body";
import { bossProgress, stageGoal } from "./crowd";
import { hitsLeft } from "./logic";
import type { LevelKey, Stage } from "./types";

/**
 * The most hearts the block draws. The tail IS the health - a heart is one hit
 * it can still take (`hitsLeft`) - and that is 26 at the start of a run and
 * more once gems, Regrow or Long Body grow it (MAX_LEN 60 plus Long Body's
 * steps). Shield adds no heart: it blocks a bump, it does not lengthen the
 * tail. So above this the block stays full and the exact length, drawn big in
 * the other corner, is the number that keeps counting.
 */
export const HEART_CAP = 8;
/** Hearts per row: 8 is two rows of four. */
export const HEART_COLS = 4;

export type HeartBlock = {
  /** Hearts still full. */
  now: number;
  /** Hearts drawn, full or outline. */
  max: number;
  /** One entry per heart drawn, true for a full one, in reading order. */
  cells: boolean[];
  /** The last heart: the block turns red. */
  danger: boolean;
};

/**
 * The heart block for a tail of `len` that has been as long as `peak`, at
 * `bite` segments a bump. The outline count is set by the run's longest tail,
 * so a hit leaves an outline where a heart was rather than shrinking the block.
 */
export function heartBlock(len: number, peak: number, bite: number, cap = HEART_CAP): HeartBlock {
  const max = Math.max(1, Math.min(cap, hitsLeft(Math.max(peak, START_LEN), bite)));
  const now = Math.max(0, Math.min(max, hitsLeft(len, bite)));
  return { now, max, cells: Array.from({ length: max }, (_, i) => i < now), danger: now <= 1 };
}

export type BossRow =
  /** Counting toward the next warden: the bar and its two triggers. */
  | { kind: "meter"; fraction: number; len: string | null; crushed: string }
  /** A warden is up: the bar is its health, and there are no numbers. */
  | { kind: "warden"; fraction: number };

/**
 * The bottom row. `meter` is the scene's count toward THIS stage's warden; it is
 * null while a warden is up, and then `boss` is the warden's health. Stage 3
 * has no length trigger, so its row reads crushed alone (`len: null`).
 */
export function bossRow(
  level: LevelKey,
  meter: { len: number; crushed: number; stage: Stage } | null,
  boss: { now: number; max: number } | null,
): BossRow | null {
  if (boss && boss.max > 0) return { kind: "warden", fraction: clamp01(boss.now / boss.max) };
  if (!meter) return null;
  const at = stageGoal(level, meter.stage);
  return {
    kind: "meter",
    fraction: bossProgress({ ...meter, level }),
    len: at.len != null ? `${meter.len}/${at.len}` : null,
    crushed: `${meter.crushed}/${at.crushed}`,
  };
}

/** The three numbers that left the play screen, in the order both cards show them. */
export type RunStat = { id: "crushed" | "best" | "level"; value: number };

export function runStats(crushed: number, best: number, lv: number): RunStat[] {
  return [
    { id: "crushed", value: crushed },
    { id: "best", value: Math.max(best, crushed) },
    { id: "level", value: lv },
  ];
}

/**
 * The game-over card's line: what happened, then the three numbers by name -
 * "Out of tail · Crushed 12 · Best 40 · Level 3 · New best!".
 */
export function resultLine(
  words: { headline: string; crushed: string; best: string; level: string; newBest: string },
  stats: RunStat[],
  newBest: boolean,
): string {
  const parts = [words.headline, ...stats.map((s) => `${words[s.id]} ${s.value}`)];
  if (newBest) parts.push(words.newBest);
  return parts.join(" · ");
}

const clamp01 = (n: number) => Math.max(0, Math.min(1, n));
