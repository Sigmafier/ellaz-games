// NEON SURVIVAL'S CAREER, AS DATA (P3, 2026-09-29): three worlds of three levels
// and a boss, each world with its own floor, crowd and one twist.
//
// Pure data and two lookups - no DOM, no Phaser, no rng. The simulation reads a
// level's row once, in `newCareerRun`, and copies the numbers onto the run, so a
// retune here is one diff and nothing downstream keeps a second copy.
//
// WHAT A LEVEL IS, and why (operator plan §5 P3, "pick sensible, MEASURED rules"):
//
//   ORDINARY LEVEL  survive `timeMs` of swarm. 60-90 s, longer each world: long
//                   enough for three to six level-up cards, short enough that a
//                   map of twelve is an evening and not a week.
//   BOSS LEVEL      `timeMs` of swarm to power up on, then the world's boss walks
//                   in and the level is won when it falls - the same boss the quick
//                   run already has (warden, queen, golem), at the level's own
//                   health (`bossHp`, a multiplier over the quick run's).
//
// DIFFICULTY CLIMBS ON TWO AXES and neither is the calm/normal/wild picker, which
// stays the quick run's. `base` picks which RULES row a world's shooters, xp curve
// and boss guns read (city calm, frost normal, lava wild), and each LEVEL carries
// its own spawn curve and shape toughness on top. The numbers were set against two
// bots, not felt - `career-pacing.test.ts` plays every node and prints the table.
//
// IDS ARE FOREVER. The save records stars against them; `worlds.test.ts` writes
// the twelve out by hand so a rename is a red, not a player's lost progress.

import type { CampaignFile } from "../../shared/career/campaign";
import type { EnemyKind, LevelKey, TwistId, WorldId } from "./types";

export interface WorldRow {
  id: WorldId;
  /** Which quick-run RULES row this world's shooters, xp and boss guns read. */
  base: LevelKey;
  twist: TwistId;
  /** The boss level's boss. */
  boss: EnemyKind;
  /** The crowd: each kind and the swarm time (ms) it joins at. */
  mix: readonly (readonly [EnemyKind, number])[];
  /** What one coin is worth here - later worlds pay more, because they cost more. */
  coin: number;
  /** Gold for clearing one of its ordinary levels; a boss clear pays double. */
  bonus: number;
  /** Milliseconds between HORDE RINGS (monsters.ts); 0 in a world that has none. */
  horde: number;
}

export interface LevelRow {
  id: string;
  world: WorldId;
  boss: boolean;
  /** Ordinary: survive this long. Boss: the swarm before the boss walks in. */
  timeMs: number;
  /** This level's own spawn curve - the gap between shapes, its floor, and how fast it closes. */
  spawnMs: number;
  floorMs: number;
  tighten: number;
  /** Multipliers on every swarm shape's health and pace. */
  hp: number;
  pace: number;
  /** Chance each spawn is an elite (tougher, worth ten, a chance at gear). */
  elite: number;
  /** Boss health as a multiple of the quick run's same boss at this world's base. 0 on an ordinary level. */
  bossHp: number;
  /** Lava only: how often a new pool opens. 0 elsewhere. */
  poolEvery: number;
}

// The crowds. Each is the quick run's own cast, re-mixed per world: the city is
// slimes and bats, frost adds the fast shards and the first thing that shoots,
// lava is everything at once. A shooter over the base row's cap is sent as the
// shape it is dressed as (`BASE_OF`), so orb and brute sit in every mix that has
// a spitter or a lancer - or a capped wave would send a shape the world never has.
export const WORLDS: readonly WorldRow[] = [
  {
    id: "city", base: "calm", twist: "lights", boss: "warden", coin: 1, bonus: 15, horde: 0,
    mix: [["runner", 0], ["orb", 12_000], ["brute", 30_000]],
  },
  {
    id: "frost", base: "normal", twist: "ice", boss: "queen", coin: 2, bonus: 30, horde: 0,
    // The splitter and the charger (2026-10-03) join after the world's own crowd has arrived.
    mix: [["runner", 0], ["shard", 0], ["orb", 15_000], ["splitter", 20_000], ["spitter", 25_000], ["charger", 35_000]],
  },
  {
    id: "lava", base: "wild", twist: "pools", boss: "golem", coin: 3, bonus: 45, horde: 15_000,
    // The bomber (2026-10-03) joins with the spitter; the horde ring rides its own clock.
    mix: [["runner", 0], ["shard", 0], ["brute", 8_000], ["orb", 15_000], ["bomber", 20_000], ["spitter", 25_000], ["lancer", 40_000]],
  },
];

const row = (
  id: string, world: WorldId, timeMs: number, spawnMs: number, floorMs: number, tighten: number,
  hp: number, pace: number, elite: number, bossHp = 0, poolEvery = 0,
): LevelRow => ({ id, world, boss: bossHp > 0, timeMs, spawnMs, floorMs, tighten, hp, pace, elite, bossHp, poolEvery });

// SHAPE HEALTH MOVES LAST, and gently. A 1.3x multiplier looked mild and turned
// every one-hit runner into a two-hit one against a 1.21x frost kit - the first
// bot table read 0 to 1 upgrade cards a frost level and 0/5 on its boss. So the
// crowd gets harder through its RATE and PACE first, and `hp` stays under the
// damage the kit a player plausibly carries into that world (career-pacing.test.ts).
//                   id           world    time    spawn floor tight  hp    pace  elite  bossHp pools
export const LEVELS: readonly LevelRow[] = [
  row("city-1",    "city",  60_000,  610, 315, 4.5, 1.0,  1.2,  0.02),
  row("city-2",    "city",  70_000,  590, 300, 4.6, 1.0,  1.25, 0.03),
  row("city-3",    "city",  80_000,  540, 270, 4.8, 1.0,  1.3,  0.04),
  row("city-boss", "city",  45_000,  600, 300, 4.5, 1.0,  1.25, 0.04, 1.0),
  row("frost-1",   "frost", 70_000,  760, 360, 3.8, 1.0,  1.0,  0.04),
  row("frost-2",   "frost", 75_000,  700, 330, 4.0, 1.1,  1.03, 0.05),
  row("frost-3",   "frost", 85_000,  660, 300, 4.2, 1.2,  1.06, 0.06),
  row("frost-boss","frost", 50_000,  700, 340, 4.0, 1.1,  1.03, 0.05, 0.5),
  row("lava-1",    "lava",  75_000,  700, 300, 4.0, 1.2,  1.0,  0.06, 0, 3600),
  row("lava-2",    "lava",  82_000,  640, 270, 4.2, 1.3,  1.02, 0.07, 0, 3200),
  row("lava-3",    "lava",  90_000,  590, 240, 4.4, 1.45, 1.04, 0.08, 0, 2800),
  row("lava-boss", "lava",  55_000,  680, 290, 4.0, 1.3,  1.02, 0.07, 0.45, 3400),
];

/** The map the kit draws: the same twelve ids, in play order, each world naming its floor. */
export const NEON_CAMPAIGN: CampaignFile = {
  id: "neon-career",
  worlds: WORLDS.map((w) => ({
    id: w.id,
    scenery: w.id,
    levels: LEVELS.filter((l) => l.world === w.id).map((l) => (l.boss ? { id: l.id, boss: true } : { id: l.id })),
  })),
};

/** One level's row; an id the career does not have is a thrown error, found at the call and never mid-run. */
export function levelRow(id: string): LevelRow {
  const r = LEVELS.find((l) => l.id === id);
  if (!r) throw new Error(`the Neon career has no level "${id}"`);
  return r;
}

/** The world a level id belongs to. */
export const worldRow = (levelId: string): WorldRow => {
  const w = levelRow(levelId).world;
  return WORLDS.find((x) => x.id === w)!;
};
