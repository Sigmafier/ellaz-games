// How the crowd MOVES, one tick at a time: the safe start's wandering, the
// chase, the dasher's straight runs, the shooter's stand-and-fire, the
// warden's lunge, and shapes easing apart.
//
// Split out of `crowd.ts`, which re-exports every name here unchanged, so an
// importer reads them from `./crowd` exactly as before.

import { isLeftBehind, spawnPoint } from "../survivors/world";
import { frostOf, speedOf } from "./cards";
import { BOSS_LUNGE_MULT, DASH, KINDS, LEVELS, SHOT, crowdAt, isBoss } from "./tuning";
import type { Foe, Run } from "./types";

/**
 * The warden's lunge: how long, how much faster, how often, from how near - and
 * the WIND-UP before it, when it stands still and glows (round three). A lunge
 * at 130 units/s outruns the snake's 105, and with no warning it landed on a
 * head that was busy closing a loop: at length 60 by the boss, the reviewer
 * "died because I bit my own tail". Nothing bites a tail here; that was this.
 */
export const LUNGE = { ms: 600, boost: 2.6, every: 4000, from: 200, windup: 550 };

/**
 * THE SAFE START (operator ruling R2.4): for this long at the start of a run the
 * shapes wander slowly instead of chasing the head. A first-time player learns
 * the loop on a crowd that is not biting - the reviewer who asked for it circled
 * the bats, was bitten on the way round and never got a loop closed at all.
 */
export const SAFE_START_MS = 20_000;

/**
 * THE BREATHER between stages (round four, operator ruling: "a short
 * breather (e.g. 3 s calm)"): the same wandering `SAFE_START_MS` gives a fresh
 * run, granted again the moment a boss falls and the next stage opens. Set as
 * an absolute clock (`run.t + this`), the same way `calmMs` always has been,
 * so it stacks with nothing and simply holds the crowd off for this long.
 */
export const STAGE_BREATHER_MS = 3000;

/** How fast a wandering shape moves, as a fraction of its chasing speed. */
export const CALM_PACE = 0.35;
/**
 * How fast a wandering shape turns, radians/s. A shape moving at a steady speed
 * and turning at a steady rate walks a CIRCLE of radius speed / turn - so a
 * wanderer mills about where it is (a runner on a circle ~54 units across)
 * instead of drifting off, with no state kept for it at all.
 */
const WANDER_TURN = 0.8;

/** Is the crowd still wandering? */
export const isCalm = (run: Pick<Run, "t" | "calmMs">) => run.t < run.calmMs;

/**
 * Which way a wandering shape faces: its own start angle (from its id), turned
 * at `WANDER_TURN`, clockwise or not by the id's parity. A pure function of the
 * shape and the clock, so wandering spends no random draws and a seeded run
 * replays exactly.
 */
export function wanderHeading(f: Pick<Foe, "id">, t: number): number {
  const spin = f.id % 2 === 0 ? 1 : -1;
  return f.id * 2.399963 + spin * WANDER_TURN * (t / 1000);
}

/**
 * Every shape walks at the head - or, in the safe start, wanders. A stunned one stands; one left a whole view
 * behind is walked back in from the edge, or the cap fills with shapes that
 * never arrive (Neon Survival measured exactly that on its big map).
 */
export function moveFoes(run: Run, dt: number, rng: () => number): void {
  const pace = LEVELS[run.level].pace * crowdAt(run).pace;
  for (const f of run.foes) {
    f.hurt = Math.max(0, f.hurt - dt);
    f.spikeCool = Math.max(0, f.spikeCool - dt);
    f.slow = Math.max(0, f.slow - dt);
    if (f.stun > 0) {
      f.stun = Math.max(0, f.stun - dt);
      continue;
    }
    if (isLeftBehind(run, f.x, f.y)) {
      const at = spawnPoint(rng, run);
      f.x = at.x;
      f.y = at.y;
      continue;
    }
    if (isCalm(run)) {
      wander(f, run.t, (KINDS[f.kind].speed * pace * CALM_PACE * dt) / 1000);
      continue;
    }
    const cold = f.slow > 0 ? frostOf(run) : 1;
    if (f.kind === "dasher") {
      dashAt(run, f, (KINDS.dasher.speed * pace * cold * dt) / 1000, dt);
      continue;
    }
    if (f.kind === "shooter" && shoot(run, f, dt)) continue;
    const dx = run.x - f.x;
    const dy = run.y - f.y;
    const d = Math.hypot(dx, dy) || 1;
    if (isBoss(f.kind) && lunge(run, f, d, dt)) continue;
    const v = (KINDS[f.kind].speed * pace * cold * (f.dash > 0 ? LUNGE.boost : 1) * dt) / 1000;
    f.x += (dx / d) * Math.min(v, d);
    f.y += (dy / d) * Math.min(v, d);
  }
  separate(run);
}

/**
 * A dasher runs STRAIGHT at the point it last aimed at - where the head was -
 * and re-aims every `DASH.aimMs`, or at once when it gets there. A pursuer
 * that keeps re-aiming falls into a circling snake's loop; this one cuts
 * across it.
 */
function dashAt(run: Run, f: Foe, v: number, dt: number): void {
  if (!f.aim || f.aim.ms <= 0) f.aim = { x: run.x, y: run.y, ms: DASH.aimMs };
  f.aim.ms -= dt;
  const dx = f.aim.x - f.x;
  const dy = f.aim.y - f.y;
  const d = Math.hypot(dx, dy);
  if (d < 2) {
    f.aim.ms = 0;
    return;
  }
  f.x += (dx / d) * Math.min(v, d);
  f.y += (dy / d) * Math.min(v, d);
}

/**
 * A shooter within `SHOT.range` STANDS and runs its clock: wind up, fire, wait.
 * Returns true while it stands (so it does not also walk). The aim LEADS the
 * head by the bolt's flight time along its heading - a snake that holds its
 * course is hit, one that turns hard dodges.
 */
function shoot(run: Run, f: Foe, dt: number): boolean {
  const d = Math.hypot(run.x - f.x, run.y - f.y);
  if (d > SHOT.range && f.windup === 0) return false;
  f.fire = Math.max(0, (f.fire ?? SHOT.every / 2) - dt);
  if (f.windup > 0) {
    f.windup = Math.max(0, f.windup - dt);
    if (f.windup === 0) {
      const ahead = (d / SHOT.speed) * speedOf(run) * SHOT.lead;
      const tx = run.x + Math.cos(run.heading) * ahead;
      const ty = run.y + Math.sin(run.heading) * ahead;
      const a0 = Math.atan2(ty - f.y, tx - f.x);
      for (let i = 0; i < SHOT.fan; i++) {
        const a = a0 + (i - (SHOT.fan - 1) / 2) * SHOT.spread;
        run.bolts.push({ x: f.x, y: f.y, vx: Math.cos(a) * SHOT.speed, vy: Math.sin(a) * SHOT.speed, life: SHOT.life });
      }
      run.events.push({ k: "bolt", x: f.x, y: f.y });
      // A level's pace is also its shooters' trigger finger: wild fires 1.3x as often.
      f.fire = SHOT.every / LEVELS[run.level].pace;
    }
    return true;
  }
  if (f.fire === 0) f.windup = SHOT.windup;
  return true;
}

/** One step of wandering: `v` units along the shape's own turning heading. */
function wander(f: Foe, t: number, v: number): void {
  const a = wanderHeading(f, t);
  f.x += Math.cos(a) * v;
  f.y += Math.sin(a) * v;
}

/**
 * Run the warden's lunge clock. Returns true while it is WINDING UP - standing
 * still, so the scene can draw the warning and a player can step aside.
 *
 * The RECHARGE shortens per stage (`BOSS_LUNGE_MULT`, "boss 3 may lunge more
 * often") - the fuse before the very FIRST lunge stays `LUNGE.every` on every
 * stage (set at creation, in `makeFoe`), so a fresh boss always gives the same
 * first breath before it starts to press.
 */
function lunge(run: Run, f: Foe, d: number, dt: number): boolean {
  f.dash = Math.max(0, f.dash - dt);
  f.dashCool = Math.max(0, f.dashCool - dt);
  if (f.windup > 0) {
    f.windup = Math.max(0, f.windup - dt);
    if (f.windup > 0) return true;
    f.dash = LUNGE.ms;
    run.events.push({ k: "lunge" });
    return false;
  }
  if (f.dashCool === 0 && f.dash === 0 && d < LUNGE.from) {
    f.windup = LUNGE.windup;
    f.dashCool = LUNGE.every * BOSS_LUNGE_MULT[run.stage];
    run.events.push({ k: "windup", x: f.x, y: f.y });
    return true;
  }
  return false;
}

/** Shapes do not stack on one another: overlapping pairs are eased apart. */
function separate(run: Run): void {
  const fs = run.foes;
  for (let i = 0; i < fs.length; i++) {
    for (let j = i + 1; j < fs.length; j++) {
      const a = fs[i];
      const b = fs[j];
      const min = (KINDS[a.kind].r + KINDS[b.kind].r) * 0.9;
      const dx = b.x - a.x;
      const dy = b.y - a.y;
      const d2 = dx * dx + dy * dy;
      if (d2 >= min * min || d2 === 0) continue;
      const d = Math.sqrt(d2);
      const push = (min - d) / 2;
      a.x -= (dx / d) * push;
      a.y -= (dy / d) * push;
      b.x += (dx / d) * push;
      b.y += (dy / d) * push;
    }
  }
}
