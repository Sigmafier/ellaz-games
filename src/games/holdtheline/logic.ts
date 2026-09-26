// Hold the Line - the whole simulation, with no DOM, no Phaser and no clock of
// its own. The scene hands it a frame's worth of milliseconds and an aim, and
// everything that happens in the lane happens in here, so a campaign can be
// played out a hundred times in node without a canvas.
//
// `step` MUTATES the state it is given rather than returning a fresh one, which
// is the one place this file departs from the shape most of the roster uses. It
// is survivors' reason: at 60 frames a second with a late wave's bodies, their
// shots and the guards' shots, rebuilding the world every frame is thousands of
// short-lived objects a second for a phone to collect. It stays testable because
// the function is still a pure function of `(state, dt, input, rng)` - the same
// seed plays the same campaign, which is what `logic.test.ts` leans on.
//
// The direct module, never the `@shared` barrel: the barrel re-exports React
// components, and `logic-is-pure.test.ts` fails the build for importing it here.

import { mulberry32 } from "@shared/rng";
import type {
  Arena,
  Guard,
  LevelKey,
  RunEvent,
  RunState,
  Walker,
  WalkerKind,
} from "./types";
import { CAMPAIGN_WAVES, RULES, gapFor, pressureFor, waveQueue } from "./waves";
import {
  GUARDS,
  WEAPONS,
  cycleOf,
  damageOf,
  magazineOf,
  pierceOf,
  reloadOf,
} from "./shop";

export type { Arena, RunEvent, RunState, Walker, WalkerKind } from "./types";

/**
 * THE LANE, in logical units. Held constant across every arm of this game.
 *
 * THIS GAME DEPARTS FROM THE SHOWCASE EQUAL-AREA RULE, AND THE DEPARTURE IS THE
 * POINT. `CLAUDE.md` says a showcase arena's two shapes hold the same AREA
 * rather than the same height, and survivors measured that: in an
 * OMNIDIRECTIONAL arena, floor area IS crowd density, because enemies arrive at
 * a rate the clock sets rather than a rate per unit of floor - so more floor is
 * a thinner crowd and a quietly easier game.
 *
 * None of that reasoning transfers to a LANE. Here the difficulty variables are
 * the lane's LENGTH (how many seconds a walker is in your sights before it
 * arrives) and the gun's reach against it. Height holds the sky the air units
 * use and almost nothing else. Holding area constant would trade lane length
 * for sky - trading the thing that sets the difficulty for the thing that does
 * not.
 *
 * So both arms are landscape and the WIDTH is what is held:
 *
 *     phone   900 x 420   2.14:1     same lane
 *     PC      900 x 506   1.78:1     same lane, more sky
 *
 * NEITHER IS MEASURED. `arena.ts` derives the height continuously from the box
 * it is drawn in - bubbleshooter's `columnsFor` pattern, which is newer and
 * better than picking between two constants - and these two are the ends of
 * that range.
 */
export const LANE = 900;

/** The phone lane, and the DEFAULT of `newRun` so every caller that does not care reads this. */
export const ARENA: Arena = { w: LANE, h: 420 };

/** The desktop lane. Same width, more sky. */
export const ARENA_WIDE: Arena = { w: LANE, h: 506 };

/** How much of the left edge the building occupies. Walkers stop at its face. */
export const HOUSE_W = 90;

/** Where the player's gun sits, measured from the left edge and from the ground. */
export const GUN_X = 62;
/**
 * How high the defender stands above the ground.
 *
 * 200 rather than 150, and the reason was visible only in a browser: at 150 the
 * whole game - keep, defender, lane and air lane - lived in the bottom third of
 * the arena and the top 60% was empty sky. Every gate was green over it, because
 * a gate reads a box and empty sky fills a box exactly as well as a game does.
 */
export const GUN_UP = 200;

/** Longest frame the sim will integrate, so a backgrounded tab cannot teleport a wave in. */
export const MAX_FRAME_MS = 50;

/**
 * The most bodies allowed in the lane at once.
 *
 * A backstop rather than a difficulty knob: `waves.ts` grows a wave linearly on
 * purpose, and this is what guarantees a phone at wave 40 of overtime is still
 * a game rather than a slideshow. When the lane is full the spawn clock simply
 * waits, so nothing is lost - it arrives later.
 */
export const WALKER_CAP = 44;

export const WALL_START = 260;
export const HOUSE_START = 500;

/** Cash and score are the same event read two ways, so one table decides both. */
export const KIND: Record<
  WalkerKind,
  { hp: number; speed: number; dmg: number; cycle: number; standoff: number; radius: number; cash: number; air?: true }
> = {
  //                                                              the counter each one exists for
  foot: { hp: 24, speed: 34, dmg: 9, cycle: 900, standoff: 0, radius: 11, cash: 12 },
  runner: { hp: 14, speed: 74, dmg: 6, cycle: 700, standoff: 0, radius: 9, cash: 14 },
  // A shooter's whole identity is this standoff: it never reaches the wall, so
  // mines and wire cannot answer it and only reach can.
  //
  // IT SITS BETWEEN THE TWO GROUND GUARDS' RANGES ON PURPOSE - above
  // GUARDS.rifleman.range (380) and below GUARDS.marksman.range (620) - and that
  // is the whole reason the marksman is a purchase rather than a luxury. Both
  // halves are pinned in `shop.test.ts`: the first version of this was 280,
  // which the rifleman could already reach, and the marksman answered a threat
  // that had no need of it.
  shooter: { hp: 30, speed: 40, dmg: 7, cycle: 1500, standoff: 440, radius: 11, cash: 22 },
  vehicle: { hp: 190, speed: 20, dmg: 38, cycle: 1600, standoff: 0, radius: 20, cash: 60 },
  // Flies, so every ground defence is blind to it. `standoff` is 0 because it
  // comes all the way in; what protects it is the y, not the x.
  air: { hp: 40, speed: 58, dmg: 14, cycle: 1200, standoff: 0, radius: 13, cash: 34, air: true },
  heavy: { hp: 1500, speed: 15, dmg: 60, cycle: 1400, standoff: 0, radius: 32, cash: 320 },
};

/** How high above the ground an air unit flies, as a fraction of the sky. */
const AIR_BAND = 0.36;

/** Milliseconds a body spends falling over. A corpse is never a target. */
const KO_MS = 420;

/** Milliseconds a guard is out after a shooter hits it. It never dies for good. */
const GUARD_DOWN_MS = 2600;

/** How wide a mine's blast is, and what it does. */
const MINE_R = 46;
const MINE_DMG = 120;
/** Wire does no damage; it takes a fraction off the speed of whatever crosses it. */
const WIRE_SLOW = 0.45;
const WIRE_MS = 1800;

export function newRun(level: LevelKey, arena: Arena = ARENA, seed = 1): RunState {
  const s: RunState = {
    level,
    arena,
    phase: "shop",
    wave: 1,
    wonAt: 0,
    wall: WALL_START,
    wallMax: WALL_START,
    house: HOUSE_START,
    houseMax: HOUSE_START,
    cash: 120, // enough for one power or two repairs, so wave 1 is a choice
    earned: 0,
    score: 0,
    weapon: "pistol",
    powers: { damage: 0, reload: 0, magazine: 0, pierce: 0 },
    ammo: 0,
    weaponCool: 0,
    reloading: false,
    guards: [],
    mines: [],
    walkers: [],
    shots: [],
    bought: {},
    paidMilestones: [],
    seq: 1,
    t: 0,
    queue: [],
    spawnCool: 0,
    events: [],
  };
  s.ammo = magazineOf(s);
  void seed; // the seed belongs to the rng the caller passes to `step`/`startWave`
  return s;
}

/**
 * The ground line. Everything that walks stands on it, and the road runs below.
 *
 * A FRACTION of the arena rather than a fixed 18 units: at 18 the road was a
 * sliver at the very bottom of the picture and the walkers stood on its edge
 * rather than on it. Proportional, the road is a real surface at any height the
 * window asks for.
 */
export function groundY(arena: Arena): number {
  return arena.h - Math.round(arena.h * 0.14);
}

/** Where an air unit flies in this arena. Derived, so a taller sky moves it. */
export function airY(arena: Arena): number {
  return groundY(arena) - arena.h * AIR_BAND;
}

/** Where the wall's face is. A walker with standoff 0 stops here. */
export function wallX(): number {
  return HOUSE_W;
}

export function gunY(arena: Arena): number {
  return groundY(arena) - GUN_UP;
}

/** True while the campaign is still running. False in overtime. */
export function inCampaign(s: RunState): boolean {
  return s.wave <= CAMPAIGN_WAVES;
}

/**
 * The house has fallen.
 *
 * A PREDICATE rather than `s.phase === "over"` at the call sites, and the reason
 * is the type checker: `step` early-returns unless the phase is `"wave"`, so
 * inside it TypeScript has narrowed `s.phase` to `"wave"` and reads a later
 * comparison against `"over"` as dead code - which it is not, because `strike`
 * can end the run mid-frame and TS cannot see a mutation through a call. The
 * function boundary is what keeps the check honest instead of casting the
 * narrowing away and losing it everywhere else.
 */
export function isOver(s: RunState): boolean {
  return s.phase === "over";
}

/**
 * Send the next wave.
 *
 * Seeded and explicit rather than automatic, because the player presses the
 * button - `waveQueue` is the only randomness in a wave's composition, so the
 * same seed sends the same campaign.
 */
export function startWave(s: RunState, rng: () => number = Math.random): RunState {
  if (s.phase !== "shop") return s;
  s.phase = "wave";
  s.t = 0;
  s.queue = waveQueue(s.wave, s.level, rng);
  s.spawnCool = 0;
  s.walkers.length = 0;
  s.shots.length = 0;
  // A wave starts with a full magazine and every guard on its feet. Walking
  // into a wave mid-reload because the last one ended mid-reload is a
  // punishment the player did not earn.
  s.ammo = magazineOf(s);
  s.weaponCool = 0;
  s.reloading = false;
  for (const g of s.guards) {
    g.cool = 0;
    g.down = 0;
  }
  return s;
}

function spawn(s: RunState, kind: WalkerKind): void {
  const k = KIND[kind];
  const p = pressureFor(s.wave) * RULES[s.level].hp;
  const hp = Math.round(k.hp * p);
  s.walkers.push({
    id: s.seq++,
    kind,
    // Just outside the lane, so nothing pops into view at the edge.
    x: s.arena.w + k.radius + 6,
    y: k.air ? airY(s.arena) : groundY(s.arena),
    hp,
    maxHp: hp,
    speed: k.speed * RULES[s.level].speed,
    dmg: k.dmg,
    cycle: k.cycle,
    cool: k.cycle,
    standoff: k.standoff,
    radius: k.radius,
    ko: 0,
  });
}

function say(s: RunState, e: RunEvent): void {
  s.events.push(e);
}

/** Cash and score for a body, level multiplier included. */
function payFor(s: RunState, kind: WalkerKind): number {
  return Math.round(KIND[kind].cash * RULES[s.level].pay);
}

function kill(s: RunState, w: Walker): void {
  const cash = payFor(s, w.kind);
  s.cash += cash;
  s.earned += cash;
  // The score is the cash EARNED, not the cash held, so spending never costs a
  // player their place on the board. A score derived from cash in hand would
  // make the shop a scoring decision, which is the opposite of the design.
  s.score += cash;
  w.ko = KO_MS;
  w.hp = 0;
  say(s, { t: "kill", x: w.x, y: w.y, kind: w.kind, cash });
}

function hurt(s: RunState, w: Walker, dmg: number): void {
  if (w.ko > 0) return;
  w.hp -= dmg;
  say(s, { t: "hit", x: w.x, y: w.y });
  if (w.hp <= 0) kill(s, w);
}

/** Damage the building: the wall first, then the house itself. */
function strike(s: RunState, dmg: number): void {
  if (s.wall > 0) {
    const took = Math.min(s.wall, dmg);
    s.wall -= took;
    dmg -= took;
    say(s, { t: "wallHit", dmg: took });
  }
  if (dmg > 0) {
    s.house = Math.max(0, s.house - dmg);
    say(s, { t: "houseHit", dmg });
    if (s.house === 0) {
      s.phase = "over";
      say(s, { t: "over" });
    }
  }
}

/** Where a walker stops: the wall's face plus whatever standoff it keeps. */
function stopX(w: Walker): number {
  return wallX() + w.standoff + w.radius;
}

/** The nearest live walker a guard of this kind will shoot, or null. */
function targetFor(s: RunState, g: Guard): Walker | null {
  const spec = GUARDS[g.kind];
  let best: Walker | null = null;
  for (const w of s.walkers) {
    if (w.ko > 0) continue;
    const isAir = KIND[w.kind].air === true;
    if (spec.only === "air" && !isAir) continue;
    if (spec.only === "ground" && isAir) continue;
    if (w.x - wallX() > spec.range) continue;
    // A rocketeer prefers the thing it exists for, so a player who bought one
    // for the vehicles does not watch it spend its long cycle on a runner.
    if (g.kind === "rocketeer" && best && w.kind !== "vehicle" && best.kind === "vehicle") continue;
    if (!best || w.x < best.x || (g.kind === "rocketeer" && w.kind === "vehicle" && best.kind !== "vehicle")) best = w;
  }
  return best;
}

function fireAt(s: RunState, fromX: number, fromY: number, at: Walker, dmg: number, speed: number, hostile: boolean): void {
  const dx = at.x - fromX;
  const dy = at.y - fromY;
  const d = Math.hypot(dx, dy) || 1;
  s.shots.push({
    id: s.seq++,
    x: fromX,
    y: fromY,
    vx: (dx / d) * speed,
    vy: (dy / d) * speed,
    dmg,
    pierce: 0,
    hostile,
    hit: [],
  });
}

/** Rounds leave the muzzle at this speed, in units per second. */
const SHOT_SPEED = 900;
const ENEMY_SHOT_SPEED = 420;

/**
 * Pull the trigger.
 *
 * SEPARATE FROM `step` AND CALLED FROM THE EVENT HANDLER, never from inside a
 * `setState` updater - React may run an updater twice, and a doubled shot is a
 * doubled magazine drain. The same law that governs `winMoment`.
 *
 * Refuses silently while reloading or out of phase, so a caller never has to
 * ask first.
 */
export function fire(s: RunState, aimX: number, aimY: number, rng: () => number = Math.random): RunState {
  if (s.phase !== "wave" || s.weaponCool > 0 || s.ammo <= 0) return s;
  const spec = WEAPONS[s.weapon];
  const x = GUN_X;
  const y = gunY(s.arena);
  const base = Math.atan2(aimY - y, aimX - x);
  for (let i = 0; i < spec.shots; i++) {
    const a = base + (spec.spread === 0 ? 0 : (rng() - 0.5) * 2 * spec.spread);
    s.shots.push({
      id: s.seq++,
      x,
      y,
      vx: Math.cos(a) * SHOT_SPEED,
      vy: Math.sin(a) * SHOT_SPEED,
      dmg: damageOf(s),
      pierce: pierceOf(s),
      hostile: false,
      hit: [],
    });
  }
  s.ammo -= 1;
  s.weaponCool = cycleOf(s);
  if (s.ammo === 0) {
    s.reloading = true;
    s.weaponCool = reloadOf(s);
  }
  say(s, { t: "fire" });
  return s;
}

/** Start a reload before the magazine is empty. Free to ask for, ignored if pointless. */
export function reload(s: RunState): RunState {
  if (s.phase !== "wave" || s.reloading) return s;
  if (s.ammo >= magazineOf(s)) return s;
  s.reloading = true;
  s.weaponCool = reloadOf(s);
  return s;
}

function tickGun(s: RunState, dt: number): void {
  if (s.weaponCool <= 0) return;
  s.weaponCool -= dt;
  if (s.weaponCool <= 0) {
    s.weaponCool = 0;
    if (s.reloading) {
      s.reloading = false;
      s.ammo = magazineOf(s);
    }
  }
}

function tickGuards(s: RunState, dt: number): void {
  for (const g of s.guards) {
    if (g.down > 0) {
      g.down -= dt;
      if (g.down < 0) g.down = 0;
      continue;
    }
    g.cool -= dt;
    if (g.cool > 0) continue;
    const at = targetFor(s, g);
    if (!at) {
      g.cool = 0; // ready, waiting - a guard does not bank cooldown it never spent
      continue;
    }
    const spec = GUARDS[g.kind];
    // Guards stand on the roof, spread across the house's width.
    const gx = 18 + (g.slot % 3) * 28;
    const gy = groundY(s.arena) - GUN_UP - 26 - Math.floor(g.slot / 3) * 22;
    fireAt(s, gx, gy, at, spec.dmg, SHOT_SPEED * 0.8, false);
    g.cool = spec.cycle;
  }
}

function tickShots(s: RunState, dt: number): void {
  const secs = dt / 1000;
  for (let i = s.shots.length - 1; i >= 0; i--) {
    const b = s.shots[i];
    b.x += b.vx * secs;
    b.y += b.vy * secs;
    if (b.x < -40 || b.x > s.arena.w + 40 || b.y < -40 || b.y > s.arena.h + 40) {
      s.shots.splice(i, 1);
      continue;
    }
    if (b.hostile) {
      // An enemy round hits a guard first, then the wall behind it. It cannot
      // hurt another walker - `hostile` is what keeps friendly fire out.
      if (b.x <= wallX() + 30) {
        const up = s.guards.filter((g) => g.down === 0);
        if (up.length > 0) {
          up[Math.floor(up.length / 2)].down = GUARD_DOWN_MS;
        } else {
          strike(s, b.dmg);
        }
        s.shots.splice(i, 1);
      }
      continue;
    }
    let spent = false;
    for (const w of s.walkers) {
      if (w.ko > 0 || b.hit.includes(w.id)) continue;
      if (Math.hypot(w.x - b.x, w.y - b.y) > w.radius) continue;
      hurt(s, w, b.dmg);
      b.hit.push(w.id);
      if (b.pierce > 0) {
        b.pierce -= 1;
      } else {
        spent = true;
      }
      break;
    }
    if (spent) s.shots.splice(i, 1);
  }
}

function tickMines(s: RunState, w: Walker): void {
  if (KIND[w.kind].air === true) return; // the whole point of an air unit
  for (let i = s.mines.length - 1; i >= 0; i--) {
    const m = s.mines[i];
    if (Math.abs(w.x - m.x) > MINE_R) continue;
    if (m.kind === "mine") {
      // A mine catches everything standing in its blast, not only whoever
      // tripped it - which is what makes planting one where a clump will arrive
      // a real decision rather than a flat damage purchase.
      for (const other of s.walkers) {
        if (other.ko > 0 || KIND[other.kind].air === true) continue;
        if (Math.abs(other.x - m.x) <= MINE_R) hurt(s, other, MINE_DMG);
      }
      say(s, { t: "mine", x: m.x });
      s.mines.splice(i, 1);
    } else {
      // Wire is not consumed and does no damage. It buys time.
      w.speed = KIND[w.kind].speed * RULES[s.level].speed * (1 - WIRE_SLOW);
      w.cool = Math.max(w.cool, Math.min(WIRE_MS, w.cycle));
    }
    return;
  }
}

function tickWalkers(s: RunState, dt: number): void {
  const secs = dt / 1000;
  for (let i = s.walkers.length - 1; i >= 0; i--) {
    const w = s.walkers[i];
    if (w.ko > 0) {
      w.ko -= dt;
      if (w.ko <= 0) s.walkers.splice(i, 1);
      continue;
    }
    const stop = stopX(w);
    if (w.x > stop) {
      w.x = Math.max(stop, w.x - w.speed * secs);
      tickMines(s, w);
      continue;
    }
    // In position. Strike on its own clock.
    w.cool -= dt;
    if (w.cool > 0) continue;
    w.cool = w.cycle;
    if (w.standoff > 0) {
      fireAt(s, w.x, w.y, { ...w, x: wallX(), y: groundY(s.arena) - GUN_UP }, w.dmg, ENEMY_SHOT_SPEED, true);
    } else {
      strike(s, w.dmg);
    }
  }
}

function tickSpawns(s: RunState, dt: number): void {
  if (s.queue.length === 0) return;
  s.spawnCool -= dt;
  if (s.spawnCool > 0) return;
  if (s.walkers.length >= WALKER_CAP) return; // the lane is full; it arrives later
  const next = s.queue.shift();
  if (next) spawn(s, next);
  s.spawnCool = gapFor(s.wave) * RULES[s.level].gap;
}

/**
 * The wave is over when nothing is left to arrive and nothing is left standing.
 *
 * Both halves matter. Emptying the queue is not clearing the wave, and an
 * emptied lane with a queue still in it is a lull.
 */
function waveDone(s: RunState): boolean {
  return s.queue.length === 0 && s.walkers.every((w) => w.ko > 0);
}

/**
 * The bonus for clearing a wave, on top of what the bodies paid.
 *
 * It is what makes surviving a wave you barely survived worth something, and it
 * is the only income a player who let everything reach the wall still gets.
 */
export function clearBonus(s: RunState): number {
  return Math.round((40 + s.wave * 14) * RULES[s.level].pay);
}

export function step(
  s: RunState,
  dtMs: number,
  rng: () => number = Math.random,
): RunState {
  s.events.length = 0;
  if (s.phase !== "wave") return s;
  const dt = Math.min(MAX_FRAME_MS, Math.max(0, dtMs));
  if (dt === 0) return s;
  s.t += dt;

  tickGun(s, dt);
  tickSpawns(s, dt);
  tickWalkers(s, dt);
  tickGuards(s, dt);
  tickShots(s, dt);

  if (isOver(s)) return s; // the house fell mid-frame; nothing after it counts

  if (waveDone(s)) {
    const bonus = clearBonus(s);
    s.cash += bonus;
    s.earned += bonus;
    s.score += bonus;
    s.walkers.length = 0;
    s.shots.length = 0;
    say(s, { t: "waveClear", wave: s.wave, cash: bonus });
    // The campaign is WON here and the run does not stop - the lane keeps
    // sending them for a score. `wonAt` is a latch rather than a phase for
    // exactly that reason, and it is what a snapshot has to carry.
    if (s.wave === CAMPAIGN_WAVES && s.wonAt === 0) {
      s.wonAt = s.wave;
      say(s, { t: "won" });
    }
    s.wave += 1;
    s.phase = "shop";
  }
  void rng; // the sim is deterministic once a wave is queued; `fire` takes the spread
  return s;
}

/** A generator for a reproducible campaign. `logic.test.ts` and the bots use it. */
export function runRng(seed: number): () => number {
  return mulberry32(seed);
}
