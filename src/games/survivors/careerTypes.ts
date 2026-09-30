// The career's types: its worlds and twists, what a level brings in, what it
// carries while it runs, and what it reports when it ends. No runtime code.
//
// Split out of `types.ts`, which re-exports every name here unchanged; the
// layering diagram at the top of that file shows where this sits.

import type { EnemyKind, Gem } from "./entities";

/** The career's three worlds (P3, 2026-09-29). Written into level ids, so never renamed. */
export type WorldId = "city" | "frost" | "lava";

/** Each world's one twist: the lights go out, the floor is ice, lava pools open. */
export type TwistId = "lights" | "ice" | "pools";

/** A lava pool: it WARNS (a ring, no harm), then it is LIVE (it burns), then it is gone. */
export interface Pool {
  id: number;
  x: number;
  y: number;
  r: number;
  /** Milliseconds of warning left. Harmless while above 0. */
  warn: number;
  /** Milliseconds of burning left once the warning is over. */
  live: number;
}

/** A patch of darkness in Neon City, where the guns cannot see. */
export interface DarkPatch {
  x: number;
  y: number;
  r: number;
}

/**
 * What the player brings INTO a career level: base stats plus gear plus what the
 * shop sold, already reduced to the numbers the simulation reads. Worked out by
 * `careerRules.ts` from the save; the simulation never sees a save.
 */
export interface CareerStats {
  /** Hearts at the start, whole. */
  hearts: number;
  /** Multipliers on the robot's speed, every weapon's damage and the gem/gold reach. 1 is unchanged. */
  speed: number;
  damage: number;
  magnet: number;
  /** Gold luck: every kill adds this many points, and each 100 drops a coin. */
  luck: number;
  /** Shield levels the run starts with (the shop's shield row). */
  shield: number;
}

/** One career level in progress: its rules, what it has dropped, and its twist's state. */
export interface CareerState {
  /** The level id, forever - `city-1` ... `lava-boss`. */
  level: string;
  world: WorldId;
  twist: TwistId;
  /** An ordinary level is WON at this much swarm time; a boss level's boss walks in at it. */
  timeMs: number;
  /** The boss level's boss, or null for an ordinary level. */
  boss: EnemyKind | null;
  /** The boss's health, already multiplied - the bar's denominator reads this. */
  bossHp: number;
  /** The world's swarm: each kind and the swarm time it joins at. */
  mix: readonly (readonly [EnemyKind, number])[];
  spawnMs: number;
  floorMs: number;
  tighten: number;
  /** Multipliers on every swarm shape's health and pace. */
  hp: number;
  pace: number;
  /** Chance a spawn is an elite. */
  elite: number;
  speed: number;
  damage: number;
  magnet: number;
  luck: number;
  /** What one coin is worth in this world. */
  coin: number;
  /** Gold picked up this level. Banked only when the level ends. */
  gold: number;
  /** Luck points toward the next coin. */
  luckAcc: number;
  /** Gold lying on the floor. */
  coins: Gem[];
  /** Elites killed this level - each is a chance at gear when it is banked. */
  elites: number;
  /** Real milliseconds played, which unlike `t` keeps running through a boss fight. Drives the drifting dark and the pools. */
  age: number;
  /** Ice momentum. */
  vx: number;
  vy: number;
  pools: Pool[];
  poolIn: number;
  poolEvery: number;
  /** The darkness this frame, recomputed from `age` - read by the guns. */
  dark: DarkPatch[];
  /** Neon City's SHADE: the one patch of dark that follows the robot, slower than it walks. */
  shadeX: number;
  shadeY: number;
  /** The level's own layout seed, from its id, so a level looks the same every time. */
  seed: number;
}

/** What a finished career level reports, to be banked into the save once. */
export interface CareerResult {
  level: string;
  won: boolean;
  /** Hearts left (0 on a loss) and the bar they were out of - the stars are read off these. */
  hp: number;
  maxHp: number;
  /** Gold picked up during the level. */
  gold: number;
  /** Elites killed - each is a small chance at gear. */
  elites: number;
}
