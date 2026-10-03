// SNAKE SURVIVORS' CAREER, AS DATA (snake career S1, 2026-10-03): three worlds of
// three levels and a boss, each world with its own crowd, coin and one twist.
//
// Pure data and two lookups - no DOM, no Phaser, no rng, and no runtime import
// from the game: vite.config.ts pins this file into the `career` chunk so the
// site's Career page can read twelve ids without fetching the whole game.
// `newCareerRun` reads a level's row once and copies the numbers onto the run.
//
// WHAT A LEVEL IS (operator ruling, 2026-10-03):
//
//   ORDINARY LEVEL  crush `target` shapes in loops. Reaching it wins.
//   BOSS LEVEL      crush `target`, then the world's boss walks in, and the level
//                   is won when it falls (`bossHp` loops, before crush power).
//
// The crowd's numbers are a level's own and never the quick run's calm / normal /
// wild picker, which stays the quick run's. They were set against two bots, not
// felt - `career-pacing.test.ts` plays every node and prints the table.
//
// IDS ARE FOREVER. The save records stars against them; `career-worlds.test.ts`
// writes the twelve out by hand so a rename is a red, not a player's lost stars.

import type { CampaignFile } from "../../shared/career/campaign";
import type { SnakeTwist, SnakeWorldId } from "./careerTypes";
import type { Kind } from "./types";

export interface SnakeWorldRow {
  id: SnakeWorldId;
  twist: SnakeTwist;
  /** The crowd: each shape and the share of the level's target it joins at. */
  kinds: readonly (readonly [Kind, number])[];
  /** What one coin is worth here - later worlds pay more, because they cost more. */
  coin: number;
  /** Gold for clearing one of its ordinary levels; a boss clear pays double. */
  bonus: number;
}

export interface SnakeLevelRow {
  id: string;
  world: SnakeWorldId;
  boss: boolean;
  /** Shapes crushed to win - or, on a boss level, to bring the boss. */
  target: number;
  /** The gap between two shapes at the start and at the target, ms. */
  spawnMs: number;
  floorMs: number;
  /** The most shapes on the floor at once. */
  cap: number;
  /** Multipliers on every shape's pace and health (health rounds: 1.5 makes a runner a two-loop shape). */
  pace: number;
  hp: number;
  /** Segments one bump costs. */
  bite: number;
  /** Loops to crush the boss; 0 on an ordinary level. */
  bossHp: number;
}

// The crowds are the quick run's own cast, re-mixed per world: the garden is
// bats, slimes and crabs; the desert adds the fast robot dasher; the cave adds
// the golem that stands and shoots.
export const SNAKE_WORLDS: readonly SnakeWorldRow[] = [
  { id: "garden", twist: "none", coin: 1, bonus: 15, kinds: [["runner", 0], ["orb", 0.2], ["brute", 0.5]] },
  { id: "desert", twist: "sand", coin: 2, bonus: 30, kinds: [["runner", 0], ["orb", 0], ["dasher", 0.15], ["brute", 0.35]] },
  { id: "cave", twist: "dark", coin: 3, bonus: 45, kinds: [["runner", 0], ["orb", 0], ["dasher", 0], ["brute", 0.2], ["shooter", 0.45]] },
];

const row = (
  id: string, world: SnakeWorldId, target: number, spawnMs: number, floorMs: number, cap: number,
  pace: number, hp: number, bite: number, bossHp = 0,
): SnakeLevelRow => ({ id, world, boss: bossHp > 0, target, spawnMs, floorMs, cap, pace, hp, bite, bossHp });

// SET AGAINST THE BOT TABLE, 2026-10-03 (`career-pacing.test.ts`, 30 runs a cell):
// the careful bot clears the garden 29-30 of 30 with nothing bought, the desert
// 25-30 with what the garden's gold buys, the cave 26-30 with what the desert's
// buys - and loses most of the cave with nothing. Health over 1.25 makes a runner a
// two-loop shape (Math.round), and that was the desert's cliff on the first read.
//                   id             world     target spawn floor cap  pace  hp    bite boss
export const SNAKE_LEVELS: readonly SnakeLevelRow[] = [
  row("garden-1",    "garden",  15,  1700, 1100, 10, 0.9,  1,    1),
  row("garden-2",    "garden",  20,  1600, 1000, 11, 0.95, 1,    1),
  row("garden-3",    "garden",  25,  1500,  900, 13, 1.05, 1,    1),
  row("garden-boss", "garden",  25,  1500,  900, 13, 1.05, 1,    1,  3),
  row("desert-1",    "desert",  30,  1300,  860, 13, 0.95, 1.2,  2),
  row("desert-2",    "desert",  35,  1250,  830, 14, 0.95, 1.2,  2),
  row("desert-3",    "desert",  40,  1200,  800, 14, 1.0,  1.2,  2),
  row("desert-boss", "desert",  40,  1250,  840, 13, 0.95, 1.2,  2,  4),
  row("cave-1",      "cave",    45,  1050,  700, 16, 1.05, 1.25, 2),
  row("cave-2",      "cave",    50,  1000,  660, 17, 1.1,  1.25, 2),
  row("cave-3",      "cave",    55,   950,  620, 17, 1.12, 1.25, 2),
  row("cave-boss",   "cave",    50,  1000,  700, 15, 1.0,  1.25, 2,  5),
];

/** The map the kit draws: the same twelve ids, in play order, each world naming its floor. */
export const SNAKE_CAMPAIGN: CampaignFile = {
  id: "snake-career",
  worlds: SNAKE_WORLDS.map((w) => ({
    id: w.id,
    scenery: w.id,
    levels: SNAKE_LEVELS.filter((l) => l.world === w.id).map((l) => (l.boss ? { id: l.id, boss: true } : { id: l.id })),
  })),
};

/** One level's row; an id the career does not have is a thrown error, found at the call and never mid-run. */
export function snakeLevel(id: string): SnakeLevelRow {
  const r = SNAKE_LEVELS.find((l) => l.id === id);
  if (!r) throw new Error(`the Snake Survivors career has no level "${id}"`);
  return r;
}

/** The world a level id belongs to. */
export const snakeWorld = (levelId: string): SnakeWorldRow => {
  const w = snakeLevel(levelId).world;
  return SNAKE_WORLDS.find((x) => x.id === w)!;
};

/** A level's number inside its world (1, 2, 3), or null for its boss. */
export function levelNumber(id: string): number | null {
  const r = snakeLevel(id);
  if (r.boss) return null;
  return SNAKE_LEVELS.filter((l) => l.world === r.world).findIndex((l) => l.id === id) + 1;
}
