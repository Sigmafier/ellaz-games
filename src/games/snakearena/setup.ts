// What the title card's choices DEAL: the level, the map and how many people
// play (forum review, approved off the mock 2026-10-01). Pure, so node deals
// the same round the scene does, and `bots.test.ts` measures the level ladder
// on exactly these numbers.
import { STEP_MS, newRound, spawn, type Round, type Shape } from "./logic";
import { placeRocks } from "./rocks";

export type Level = "easy" | "normal" | "hard";
export const LEVELS: readonly Level[] = ["easy", "normal", "hard"];

export type LevelRule = {
  /** Computer snakes against one player. A second player takes one of their places. */
  bots: number;
  /** Ms per step. */
  stepMs: number;
  /** A bot's chance, per step, of a random (never deadly) move - `bots.ts`. */
  mistake: number;
};

/**
 * The ladder, measured (`bots.test.ts` carries the table and pins it).
 *
 * Normal and Hard are the old 3- and 5-bot rounds unchanged - same bots, same
 * step, same slip rate - so their measured shares carry straight over. Easy is
 * the reviewer's ask, "2 opponents, slower": two bots, and a step of 185 ms
 * against 140, a third slower again. The classic's own Slow is 170; this sits
 * one notch past it, because here a player reads three moving snakes, not one.
 * At 185 ms a step comes about 5 times a second instead of 7, and the round is
 * still 90 seconds - it simply has fewer steps in it.
 */
export const LEVEL: Record<Level, LevelRule> = {
  easy: { bots: 2, stepMs: 185, mistake: 0.12 },
  normal: { bots: 3, stepMs: STEP_MS, mistake: 0.08 },
  hard: { bots: 5, stepMs: STEP_MS, mistake: 0.05 },
};

/**
 * The saved level, read back. The level used to BE the bot count ("3", "4",
 * "5"), and a persisted value is forever: 3 and 4 open on Normal, 5 on Hard.
 * Anything else - junk, a level removed one day - is Normal, never a crash.
 */
export function levelFromSaved(v: unknown): Level {
  if (v === "3" || v === "4") return "normal";
  if (v === "5") return "hard";
  return typeof v === "string" && (LEVELS as readonly string[]).includes(v) ? (v as Level) : "normal";
}

export type MapId = "open" | "rocks";
export const MAPS: readonly MapId[] = ["open", "rocks"];
export const mapFromSaved = (v: unknown): MapId => (v === "rocks" ? "rocks" : "open");

export type Setup = { level: Level; map: MapId; humans: 1 | 2 };

/** Bots in the round: the level's count, less one for a second player, never fewer than one. */
export const botsFor = (level: Level, humans: number) => Math.max(1, LEVEL[level].bots - (humans - 1));

/**
 * A fresh round from the card's choices. An Open round draws from the RNG in
 * exactly the order it did before the map existed, so a seeded Normal or Hard
 * round is the same round it always was.
 */
export function dealRound(shape: Shape, s: Setup, rng: () => number = Math.random): Round {
  const bots = botsFor(s.level, s.humans);
  const n = bots + s.humans;
  const rocks = s.map === "rocks" ? placeRocks(shape, Array.from({ length: n }, (_, i) => spawn(shape, i, n)), rng) : [];
  return newRound(shape, bots, rng, { rocks, humans: s.humans, stepMs: LEVEL[s.level].stepMs });
}
