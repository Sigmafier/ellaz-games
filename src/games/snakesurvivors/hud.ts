// What Snake Survivors' HUD SHOWS, as numbers and states - no pixels. The
// layout is "C3 Big hearts, length right", approved by the operator off a mock
// on 2026-10-01 ("Life: hearts top left, bigger hearts. Length: top right."):
//
//   top-left   a framed block of big hearts, 4 to a row, that drain with every
//              crash (part hearts, outlines when empty), red at the last bump
//   top-right  the length, big, with the snake glyph and no word
//   top-centre the goal (round eight): crushed as the score, the run clock
//              m:ss, and "BOSS n/3" under them - between the two corners
//   bottom     the boss meter: icon, bar, "25/50" and "0/10" as icons + numbers
//   side       the weapons, only once owned
//
// Crushed, best and level are NOT drawn in play; they live on the pause card
// and the game-over card (`runStats` below feeds both). `SnakeHud.tsx` draws it.

import { textFor, type AppLocale } from "@i18n/index";
import { MIN_LEN, START_LEN } from "./body";
import { HEARTS, bossProgress, stageGoal } from "./crowd";
import { FX_TEXT } from "./fxText";
import { hitsLeft } from "./logic";
import type { LevelKey, Stage } from "./types";

/**
 * The hearts the block draws: two rows of four. They stand for the WHOLE tail
 * at its longest this run, so a crash always drains some of them (operator,
 * 2026-10-02: "i dont see any hearts go down when i crash", then "Hearts
 * drain"). Before, a heart was one hit the tail could still take, capped at 8 -
 * and a run starts with 26 hits, so the first ~18 crashes changed nothing.
 */
export const HEART_CAP = HEARTS;
/** Hearts per row: 8 is two rows of four. */
export const HEART_COLS = 4;

export type HeartBlock = {
  /** Hearts still completely full. */
  now: number;
  /** Hearts drawn, full, part or outline. */
  max: number;
  /** Hearts' worth of life left, 0..max - what a crash drains. */
  fill: number;
  /** One entry per heart, in reading order: how full it is, 0..1. */
  cells: number[];
  /** One more bump ends the run: the block turns red. */
  danger: boolean;
};

/**
 * The heart block for a tail of `len` that has been as long as `peak`, at
 * `bite` segments a bump. Life is the segments above the shortest tail that
 * still lives (`MIN_LEN`); the hearts are that share of the longest tail this
 * run, so growing refills them and every crash drains some. `bite` only says
 * whether the next bump is the last one.
 */
export function heartBlock(len: number, peak: number, bite: number, cap = HEART_CAP): HeartBlock {
  const life = Math.max(0, Math.floor(len) - MIN_LEN + 1);
  const most = Math.max(1, life, Math.floor(Math.max(peak, START_LEN)) - MIN_LEN + 1);
  const fill = (cap * life) / most;
  return {
    now: Math.floor(fill + 1e-9),
    max: cap,
    fill,
    cells: Array.from({ length: cap }, (_, i) => clamp01(fill - i)),
    danger: life > 0 && hitsLeft(len, bite) <= 1,
  };
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

/**
 * THE GOAL ROW (round eight, the forum player: "there is no score or time so
 * the goal is unclear"): the crushed count is the score, the clock is PLAYING
 * time - `run.t`, which never counts while paused or while a card is up - and
 * `boss` says which of the three wardens is next.
 */
export type GoalRow = { score: number; clock: string; boss: string };

/** ms of play as m:ss. */
export function clockText(ms: number): string {
  const s = Math.floor(Math.max(0, ms) / 1000);
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
}

/** The goal row, its "BOSS n/3" said in the run's language (`FX_TEXT`). */
export function goalRow(crushed: number, ms: number, stage: Stage, locale: AppLocale): GoalRow {
  return { score: crushed, clock: clockText(ms), boss: textFor(FX_TEXT, locale).boss(stage) };
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
