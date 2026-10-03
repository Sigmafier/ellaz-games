// Building a CAREER run, and reading one back when it ends.
//
// A career level is a quick run on its world's base rules (`newRun`) with a
// `career` block laid on top: the level's own clock and spawn curve, the world's
// crowd and twist, and the stats the player brought in. Everything after this
// point is `step` - the same function the quick run plays - reading that block
// behind `if (s.career)`.

import { ARENA, bossHpFor, newRun } from "./logic";
import type { Arena, CareerResult, CareerStats, RunState, WeaponId } from "./types";
import { SHADE, darkPatches, seedOf } from "./twists";
import { levelRow, worldRow } from "./worlds";
import { hardBase, hardLevel, hardMix, hardShooters } from "./hardTier";

/**
 * The robot with nothing worn and nothing bought: three hearts, every multiplier
 * at one, and the base luck. `careerRules.ts` holds a test that a fresh save
 * reduces to exactly this, so the two cannot drift.
 */
export const PLAIN_STATS: CareerStats = { hearts: 3, speed: 1, damage: 1, magnet: 1, luck: 15, shield: 0 };

/**
 * A fresh run of one career level, on `arena`, starting with `start`, carrying
 * `stats` - on the HARD tier when `hard` (hardTier.ts). A normal run's state
 * gains no field at all, so it is the run it always was.
 */
export function newCareerRun(levelId: string, stats: CareerStats, arena: Arena = ARENA, start: WeaponId = "bolt", hard = false): RunState {
  const L = hard ? hardLevel(levelRow(levelId)) : levelRow(levelId);
  const W = worldRow(levelId);
  const base = hard ? hardBase(W) : W.base;
  const s = newRun(base, arena, start);
  const hearts = Math.max(1, Math.round(stats.hearts));
  s.hp = hearts;
  s.maxHp = hearts;
  s.up.shield = Math.max(0, Math.min(1, Math.round(stats.shield)));
  s.spawnIn = L.spawnMs;
  const seed = seedOf(L.id);
  s.career = {
    level: L.id,
    world: W.id,
    twist: W.twist,
    timeMs: L.timeMs,
    boss: L.boss ? W.boss : null,
    bossHp: L.boss ? Math.round(bossHpFor(W.boss, base) * L.bossHp) : 0,
    mix: hard ? hardMix(W) : W.mix,
    spawnMs: L.spawnMs,
    floorMs: L.floorMs,
    tighten: L.tighten,
    hp: L.hp,
    pace: L.pace,
    elite: L.elite,
    speed: stats.speed,
    damage: stats.damage,
    magnet: stats.magnet,
    luck: stats.luck,
    coin: W.coin,
    gold: 0,
    luckAcc: 0,
    coins: [],
    elites: 0,
    age: 0,
    vx: 0,
    vy: 0,
    pools: [],
    poolIn: L.poolEvery > 0 ? L.poolEvery : Infinity,
    poolEvery: L.poolEvery,
    hordeIn: W.horde > 0 ? W.horde : Infinity,
    hordeEvery: W.horde,
    dark: W.twist === "lights" ? darkPatches(seed, s.world, 0) : [],
    shadeX: s.x + SHADE.start,
    shadeY: s.y,
    seed,
    ...(hard ? { hard: true as const, shooters: hardShooters(W) } : {}),
  };
  return s;
}

/** What a finished (or abandoned) career level reports to be banked. */
export function careerResult(s: RunState): CareerResult {
  const c = s.career!;
  return { level: c.level, won: s.phase === "won", hp: Math.max(0, s.hp), maxHp: s.maxHp, gold: c.gold, elites: c.elites, ...(c.hard ? { hard: true as const } : {}) };
}
