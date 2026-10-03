// The career's rules INSIDE `step` - every one called only behind
// `if (run.career)`, so a quick run never reaches this file.
//
// Its own module rather than more lines in `logic.ts` (already near 500), and
// importing only the layers under logic - types, crowd, the twists - so logic can
// call in without a cycle. `careerRun.ts`, which BUILDS a career run, sits above
// logic, the arrangement Neon Survival's career has.

import { dist2, spawnPoint } from "../survivors/world";
import { LIGHT, inSand, sandPatches, SAND } from "./careerTwists";
import { makeFoe } from "./crowd";
import type { SnakeCareer } from "./careerTypes";
import type { Foe, Run } from "./types";

/** The most coins that may lie on the floor at once; past it a new drop joins the nearest. */
const CAP_COINS = 30;
/** How close a coin must come to the head to be picked up - a gem's reach. */
const COIN_R = 16;
/** A coin lands a little to the side of the shape that dropped it, so the gem beside it does not hide it. */
const COIN_OFFSET = 11;
/** The boss's pile, in coins of the world's value. */
export const BOSS_PILE = 10;
/** How fast a coin is pulled in, units/s - a gem's. */
const PULL_SPEED = 240;
/**
 * The MAGNET stat's reach when the run has no Magnet card: each 1% over the plain
 * snake pulls from 1.6 units further, so the shop's three rows (+75%) pull from
 * 120 - about the Magnet card's second level. With the card, the card's reach is
 * multiplied instead.
 */
const MAGNET_REACH = 160;

const career = (run: Run): SnakeCareer => run.career!;

/** Real time moves on; the desert's sand drifts with it and decides how fast the head moves next. */
export function careerTick(run: Run, dt: number): void {
  const c = career(run);
  c.age += dt;
  if (c.twist !== "sand") return;
  c.sand = sandPatches(c.seed, run.world, c.age);
  c.slow = inSand(c.sand, run.x, run.y) ? SAND.slow : 1;
}

/** The cave's light radius for a world's twist, and none anywhere else. */
export const lightFor = (twist: SnakeCareer["twist"]): number => (twist === "dark" ? LIGHT : 0);

/**
 * CRUSH POWER: a shape that SURVIVED its loop owes the snake `crush - 1` of an
 * extra hit, kept in one purse across the level, and every whole one is paid on
 * the spot. Deterministic rather than a roll, so it takes no rng: at 1.5 every
 * second survivor takes a second hit. A shape the loop already killed owes
 * nothing - power only ever matters against the tough ones and the boss.
 */
export function careerBonusHit(run: Run, f: Foe): boolean {
  const c = career(run);
  if (f.hp <= 0 || c.crush <= 1) return false;
  c.crushAcc += c.crush - 1;
  if (c.crushAcc < 1) return false;
  c.crushAcc -= 1;
  return true;
}

/** The shop's shield: one bump a level for free. True when it took this one. */
export function careerShield(run: Run): boolean {
  const c = career(run);
  if (c.shield <= 0) return false;
  c.shield -= 1;
  return true;
}

/** How far gems and gold are pulled from: the card's reach times the MAGNET stat, or the stat's own reach without the card. */
export function careerPull(run: Run, card: number): number {
  const m = career(run).magnet;
  return card > 0 ? card * m : Math.max(0, (m - 1) * MAGNET_REACH);
}

function drop(run: Run, x: number, y: number, value: number): void {
  const c = career(run);
  if (c.coins.length >= CAP_COINS) {
    let best = c.coins[0];
    for (const k of c.coins) if (dist2(k.x, k.y, x, y) < dist2(best.x, best.y, x, y)) best = k;
    best.value += value;
    return;
  }
  c.coins.push({ id: run.nextId++, x: x + COIN_OFFSET, y: y - COIN_OFFSET, value });
}

/**
 * What a kill drops, on top of its gems. The boss drops a pile; every other shape
 * adds LUCK points, and each hundred drops one coin of the world's value -
 * deterministic, so a lucky snake is lucky every time.
 */
export function careerLoot(run: Run, f: Foe): void {
  const c = career(run);
  if (f.kind === "warden") return drop(run, f.x, f.y, BOSS_PILE * c.coin);
  c.luckAcc += c.luck;
  while (c.luckAcc >= 100) {
    c.luckAcc -= 100;
    drop(run, f.x, f.y, c.coin);
  }
}

/** Coins drift in and are picked up exactly like gems - the same reach, the same pull. */
export function careerCoins(run: Run, pull: number, dt: number): void {
  const c = career(run);
  const sec = dt / 1000;
  for (const k of c.coins) {
    const d = Math.hypot(run.x - k.x, run.y - k.y) || 1;
    if (!pull || d >= pull) continue;
    const v = Math.min(d, PULL_SPEED * sec);
    k.x += ((run.x - k.x) / d) * v;
    k.y += ((run.y - k.y) / d) * v;
  }
  c.coins = c.coins.filter((k) => {
    if (dist2(run.x, run.y, k.x, k.y) > COIN_R * COIN_R) return true;
    c.gold += k.value;
    run.events.push({ k: "gold", v: k.value, x: k.x, y: k.y });
    return false;
  });
}

/** The level is won: the gold still on the floor is swept into the purse - nothing is left to chase it. */
function win(run: Run): void {
  const c = career(run);
  for (const k of c.coins) c.gold += k.value;
  c.coins = [];
  run.phase = "won";
  run.events.push({ k: "won" });
}

/** The boss fell - a career's boss level is won, never a next stage. */
export const careerBossDown = (run: Run): void => win(run);

/**
 * The crush target, read at the end of every step. An ORDINARY level reaching it
 * is won - a tie with the last bump goes to the win, as the quick run's last
 * warden does. A BOSS level reaching it brings the world's boss, once, at the
 * level's own health; the level is then won only when it falls.
 */
export function careerEnd(run: Run, rng: () => number): void {
  const c = career(run);
  if (run.phase === "won" || run.phase === "dead" || run.crushed < c.target) return;
  if (!c.boss) return win(run);
  if (c.bossUp) return;
  c.bossUp = true;
  run.phase = "boss";
  const at = spawnPoint(rng, run);
  const boss = makeFoe(run, "warden", at.x, at.y);
  boss.hp = c.bossHp;
  run.foes.push(boss);
  run.events.push({ k: "boss" });
}
