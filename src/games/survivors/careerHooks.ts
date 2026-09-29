// The career's rules INSIDE `step` - every one of them called only behind
// `if (s.career)`, so a quick run never reaches this file.
//
// Its own module rather than more lines in `logic.ts` (already past 800), and
// importing only the leaf layers - types, world, twists - so `logic.ts` and
// `enemies.ts` can both call in without the graph at the top of `types.ts`
// growing a cycle. `careerRun.ts`, which builds a career run, sits ABOVE logic.

import type { Enemy, EnemyKind, RunState } from "./types";
import { SHADE, chaseShade, darkPatches, inDark } from "./twists";
import { dist2 } from "./world";

/** The most coins that may lie on the floor at once; past it a new drop joins the nearest. */
const CAP_COINS = 40;
const COIN_R = 16;
const COIN_OFFSET = 11;
/** An elite's pile and a boss's pile, in coins of the world's value. */
export const LOOT = { elite: 5, boss: 10 } as const;

const career = (s: RunState) => s.career!;

/** The kinds this level's swarm may send right now: its world's mix, as far as the clock has unlocked it. */
export function careerKinds(s: RunState): EnemyKind[] {
  const open = career(s).mix.filter(([, at]) => s.t >= at).map(([k]) => k);
  return open.length > 0 ? open : ["runner"];
}

/**
 * The clock, inside `if (s.boss === null)` after `t` has moved. A boss level's
 * boss walks in when the swarm time reaches the level's clock; `t` is pinned
 * there for the fight, exactly as the quick run pins it at a stage boundary.
 */
export function careerClock(s: RunState, arrive: (kind: EnemyKind, hp: number) => void): void {
  const c = career(s);
  if (c.boss && s.t >= c.timeMs) {
    s.t = c.timeMs;
    arrive(c.boss, c.bossHp);
  }
}

/** Real time moves on (even through a boss fight), and the darkness drifts with it. */
export function careerTime(s: RunState, dt: number): void {
  const c = career(s);
  c.age += dt;
  if (c.twist !== "lights") return;
  const shade = chaseShade({ x: c.shadeX, y: c.shadeY }, s, dt);
  c.shadeX = shade.x;
  c.shadeY = shade.y;
  c.dark = [...darkPatches(c.seed, s.world, c.age), { x: shade.x, y: shade.y, r: SHADE.r }];
}

/** Is this shape hidden from the guns? */
export const hidden = (s: RunState, e: Pick<Enemy, "x" | "y">): boolean => inDark(s, e.x, e.y);

function drop(s: RunState, x: number, y: number, value: number): void {
  const c = career(s);
  if (c.coins.length >= CAP_COINS) {
    let best = c.coins[0];
    for (const k of c.coins) if (dist2(k.x, k.y, x, y) < dist2(best.x, best.y, x, y)) best = k;
    best.value += value;
    return;
  }
  // A little to the side of the kill, so the coin is not hidden under the gem it drops beside.
  c.coins.push({ id: s.nextId++, x: x + COIN_OFFSET, y: y - COIN_OFFSET, value });
}

/**
 * What a kill drops, on top of its gem. A boss drops a pile, an elite a smaller
 * pile (and is counted - each is a chance at gear when the level is banked), and
 * every other kill adds LUCK points: each hundred drops one coin. Deterministic
 * rather than a roll, so it takes no rng and a lucky robot is lucky every time.
 */
export function careerLoot(s: RunState, e: Enemy): void {
  const c = career(s);
  if (e.id === s.boss) return drop(s, e.x, e.y, LOOT.boss * c.coin);
  if (e.elite) {
    c.elites += 1;
    return drop(s, e.x, e.y, LOOT.elite * c.coin);
  }
  c.luckAcc += c.luck;
  while (c.luckAcc >= 100) {
    c.luckAcc -= 100;
    drop(s, e.x, e.y, c.coin);
  }
}

/** Coins drift in and are picked up exactly like gems - the same reach, the same pull. */
export function careerCoins(s: RunState, pull: number, sec: number): void {
  const c = career(s);
  for (const g of c.coins) {
    const d = Math.hypot(s.x - g.x, s.y - g.y) || 1;
    if (d >= pull) continue;
    const v = Math.max(90, 260 - d) * sec * 1.8;
    g.x += ((s.x - g.x) / d) * v;
    g.y += ((s.y - g.y) / d) * v;
  }
  c.coins = c.coins.filter((g) => {
    if (dist2(s.x, s.y, g.x, g.y) > COIN_R * COIN_R) return true;
    c.gold += g.value;
    return false;
  });
}

/**
 * How a career level ends, in place of the quick run's three-stage rule.
 *
 *   boss down            WON - the boss level's whole ask. A tie (the boss and the
 *                        last heart on one frame) goes to the win, as the quick
 *                        run's last stage does.
 *   out of hearts        OVER.
 *   the clock, no boss   WON - an ordinary level is survived, not fought.
 *
 * A win sweeps the gold still on the floor into the purse: the level is over and
 * nothing is left to chase it. A loss leaves it lying - it was never picked up.
 */
export function careerEnd(s: RunState): void {
  const c = career(s);
  const bossDown = s.boss !== null && !s.enemies.some((e) => e.id === s.boss);
  const won = bossDown || (s.hp > 0 && c.boss === null && s.t >= c.timeMs);
  if (won) {
    for (const g of c.coins) c.gold += g.value;
    c.coins = [];
    s.phase = "won";
    s.events.push({ type: "won" });
  } else if (s.hp <= 0) {
    s.phase = "over";
    s.events.push({ type: "over" });
  }
}
