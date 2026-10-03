// The career's types: its worlds and twists, what a level brings in, what it
// carries while it runs, and what it reports when it ends. No runtime code.
//
// `types.ts` holds `Run.career?: SnakeCareer` and imports this file for the
// type only; this file imports `Kind` back the same way. A type-only
// cycle erases at build time, so the module graph at the top of `types.ts` is
// unchanged.

import type { Kind } from "./types";

/** The career's three worlds (snake career, 2026-10-03). Written into level ids, so never renamed. */
export type SnakeWorldId = "garden" | "desert" | "cave";

/** Each world's twist: none in the garden, drifting sand in the desert, the dark in the cave. */
export type SnakeTwist = "none" | "sand" | "dark";

/**
 * What the snake brings INTO a level: its base, plus what it wears, plus what the
 * shop sold - already reduced to the numbers the simulation reads by
 * `careerRules.simStats`. The simulation never sees a save.
 */
export interface SnakeCareerStats {
  /** Segments at the start. The tail is the health, so this is how many bumps it can take. */
  length: number;
  /** Multipliers on the snake's speed and turn, a loop's crush power, and the gem and gold pull. 1 is unchanged. */
  speed: number;
  crush: number;
  magnet: number;
  /** Gold luck: every shape crushed adds this many points, and each 100 drops a coin. */
  luck: number;
  /** Bumps the run may take for free (the shop's shield row). */
  shield: number;
}

/** A patch of drifting sand in the desert. The head in it moves slower. */
export interface SandPatch {
  x: number;
  y: number;
  r: number;
  /** Which way it drifts, radians - drawn as the patch's arrow. */
  dir: number;
}

/** A gold coin lying on the floor. */
export interface Coin {
  id: number;
  x: number;
  y: number;
  value: number;
}

/** One career level in progress: its rules, its gold, and its twist's state. */
export interface SnakeCareer {
  /** The level id, forever - `garden-1` ... `cave-boss`. */
  level: string;
  world: SnakeWorldId;
  twist: SnakeTwist;
  /** Shapes crushed to win an ordinary level, or to call a boss level's boss. */
  target: number;
  /** A boss level: reaching `target` brings the boss, and the level is won when it falls. */
  boss: boolean;
  /** Loops it takes to crush the boss, before crush power. */
  bossHp: number;
  /** The boss has walked in. */
  bossUp: boolean;
  /** The level's crowd: the gap between two shapes from the start to the target, the most on the floor, their pace and toughness. */
  spawnMs: number;
  floorMs: number;
  cap: number;
  pace: number;
  hp: number;
  /** Segments one bump costs. */
  bite: number;
  /** The world's shapes, each with the share of the target it joins at. */
  kinds: readonly (readonly [Kind, number])[];
  /** The stats it was started with (`SnakeCareerStats`), as the rules read them. */
  speed: number;
  crush: number;
  magnet: number;
  luck: number;
  /** Free bumps left. */
  shield: number;
  /** Crush power owed toward the next extra hit. */
  crushAcc: number;
  /** Gold picked up this level. Banked only when the level ends. */
  gold: number;
  luckAcc: number;
  /** What one coin is worth in this world. */
  coin: number;
  coins: Coin[];
  /** Real ms played, which drifts the sand. */
  age: number;
  /** The level's layout seed, from its id. */
  seed: number;
  /** The sand this frame (empty outside the desert). */
  sand: SandPatch[];
  /** What the sand does to the snake's speed right now: 1 out of it, `SAND.slow` in it. */
  slow: number;
  /** The light around the head in the cave, in units; 0 everywhere else. */
  light: number;
}

/** What a finished career level reports, to be banked into the save once. */
export interface SnakeCareerResult {
  level: string;
  won: boolean;
  /** Full hearts left at the end (0 on a loss) and how many there are - the stars are read off these. */
  hearts: number;
  of: number;
  /** Gold picked up during the level. */
  gold: number;
}
