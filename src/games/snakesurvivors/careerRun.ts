// Building a CAREER level, and reading one back when it ends.
//
// A career level is a quick run on the NORMAL row (`newRun` - its card odds and
// its 100-segment cap) with a `career` block laid on top: the level's crush
// target and crowd, the world's twist, and the stats the save brought in.
// Everything after this point is `step` - the same function the quick run plays -
// reading that block behind `if (run.career)`.

import { MIN_LEN, SEG, SPACING, START_LEN } from "./body";
import { hitCost } from "./crowd";
import { heartBlock, HEART_CAP } from "./hud";
import { lightFor } from "./careerHooks";
import { sandPatches, seedOf } from "./careerTwists";
import { snakeLevel, snakeWorld } from "./careerWorlds";
import { ARENA, newRun } from "./logic";
import type { SnakeCareerResult, SnakeCareerStats } from "./careerTypes";
import type { Arena, Run } from "./types";

/**
 * The snake with nothing worn and nothing bought: the quick run's 28 segments,
 * every multiplier at one, and the base luck. `career-rules.test.ts` holds that a
 * fresh save reduces to exactly this, so the two cannot drift.
 */
export const PLAIN_STATS: SnakeCareerStats = { length: START_LEN, speed: 1, crush: 1, magnet: 1, luck: 15, shield: 0 };

/**
 * The safe start of a career level: the crowd wanders for this long before it
 * chases. Shorter than the quick run's 20 s - a level is a minute or two, and the
 * player who reached the map has already been through the guided run.
 */
export const CAREER_SAFE_MS = 6000;

/** The body laid straight back from the head, `len` segments long. */
function layBody(run: Run, len: number): void {
  run.len = len;
  run.peak = len;
  run.path = Array.from({ length: Math.ceil((len * SEG) / SPACING) }, (_, i) => ({ x: run.x - (i + 1) * SPACING, y: run.y }));
}

/** A fresh run of one career level, on `arena`, carrying `stats`. */
export function newCareerRun(levelId: string, stats: SnakeCareerStats, arena: Arena = ARENA, rng: () => number = Math.random): Run {
  const L = snakeLevel(levelId);
  const W = snakeWorld(levelId);
  const run = newRun("normal", arena, rng);
  layBody(run, Math.max(MIN_LEN + 1, Math.round(stats.length)));
  run.calmMs = CAREER_SAFE_MS;
  const seed = seedOf(L.id);
  run.career = {
    level: L.id,
    world: W.id,
    twist: W.twist,
    target: L.target,
    boss: L.boss,
    bossHp: L.bossHp,
    bossUp: false,
    spawnMs: L.spawnMs,
    floorMs: L.floorMs,
    cap: L.cap,
    pace: L.pace,
    hp: L.hp,
    bite: L.bite,
    kinds: W.kinds,
    speed: stats.speed,
    crush: stats.crush,
    magnet: stats.magnet,
    luck: stats.luck,
    shield: Math.max(0, Math.round(stats.shield)),
    crushAcc: 0,
    gold: 0,
    luckAcc: 0,
    coin: W.coin,
    coins: [],
    age: 0,
    seed,
    sand: W.twist === "sand" ? sandPatches(seed, run.world, 0) : [],
    slow: 1,
    light: lightFor(W.twist),
  };
  return run;
}

/** What a finished (or abandoned) career level reports to be banked: full hearts left, of how many, and the gold. */
export function careerResult(run: Run): SnakeCareerResult {
  const c = run.career!;
  const won = run.phase === "won";
  const hearts = won ? heartBlock(run.len, run.peak, hitCost(run)).now : 0;
  return { level: c.level, won, hearts, of: HEART_CAP, gold: c.gold };
}
