// Two players the pacing test plays whole runs with. Test support, not game
// code: nothing the game ships imports this file.

import { mulberry32 } from "@shared/rng";
import { WEAPONS } from "./cards";
import { ARENA, newRun, pickCard, step } from "./logic";
import { makeFoe } from "./crowd";
import type { Arena, LevelKey, Run, Steer } from "./types";

/** Never steers: glides straight until the wall stops it. */
export const idle = (): Steer => ({ dx: 0, dy: 0 });

export interface Outcome {
  end: "won" | "dead" | "timeout";
  ms: number;
  crushed: number;
}

/**
 * Play one whole run with a bot, taking the first card every time -
 * `rules.loops: false` forces `run.loopCool` open forever, the same trick
 * `levelBy` below uses, so no loop can EVER register: a boss can only die
 * through `crush()`, and `crush()` is only ever reached from a closed loop -
 * so a bot run this way is a structural proof, not a probability, that no
 * loop means no boss down, whatever the crowd or the clock does.
 * `rules.weapons: false` never takes fangs, spikes or spit either.
 */
export function play(
  level: LevelKey, seed: number, bot: (run: Run) => Steer, arena: Arena = ARENA, capMs = 8 * 60_000,
  rules: { loops: boolean; weapons: boolean } = { loops: true, weapons: true },
): Outcome {
  const rng = mulberry32(seed);
  const run = newRun(level, arena, rng);
  while (run.t < capMs) {
    if (!rules.loops) run.loopCool = 1e12;
    step(run, 25, bot(run), rng);
    if (run.choosing) {
      const pick = rules.weapons ? run.choosing[0] : run.choosing.find((c) => !WEAPONS.includes(c));
      if (pick) pickCard(run, pick);
      else run.choosing = null;
    }
    if (run.phase === "won" || run.phase === "dead") return { end: run.phase, ms: run.t, crushed: run.crushed };
  }
  return { end: "timeout", ms: run.t, crushed: run.crushed };
}

/**
 * Keeps circling, on a loop sized to the body it has - the simplest player who
 * understands the game: the crowd chasing the head falls in behind it, inside.
 */
export function circle(run: Run): Steer {
  const units = run.path.length * 4;
  const r = Math.max(32, (units * 0.8) / (2 * Math.PI));
  const turn = (105 / r) * 0.025;
  const a = run.heading + turn;
  return { dx: Math.cos(a), dy: Math.sin(a) };
}

/** Holds one direction key forever: the tightest circle the snake can turn. */
export const hold = (run: Run): Steer => ({ dx: Math.cos(run.heading + 1.2), dy: Math.sin(run.heading + 1.2) });

/**
 * Drives at the nearest gem and never tries to loop - the player the reviewer
 * was: "I am no longer long enough to surround anything". With no gem out it
 * sweeps a wide, slow curve so it does not sit still for the crowd.
 */
export function toGems(run: Run): Steer {
  let best: { x: number; y: number } | null = null;
  let d2 = Infinity;
  for (const g of run.gems) {
    const d = (g.x - run.x) ** 2 + (g.y - run.y) ** 2;
    if (d < d2) (d2 = d), (best = g);
  }
  if (!best) return { dx: Math.cos(run.heading + 0.15), dy: Math.sin(run.heading + 0.15) };
  return { dx: best.x - run.x, dy: best.y - run.y };
}

export interface Levelled {
  /** The level on the bar at `ms`, or when the run ended if it ended first. */
  lv: number;
  /** ms of play when level 2 arrived, or Infinity if it never did. */
  lv2At: number;
  crushed: number;
  end: "won" | "dead" | "timeout";
}

/**
 * Play `ms` of one run and report the level reached.
 *
 * `loops: false` makes every loop the bot happens to close crush nothing (the
 * loop cooldown is held) - a bot chasing gems closes the odd loop by accident,
 * and a person who never loops does not. `weapons: false` never takes fangs or
 * spikes or spit, which kill without a loop. Both off is floor gems and nothing else.
 */
export function levelBy(
  level: LevelKey, seed: number, bot: (run: Run) => Steer, ms: number,
  rules: { loops: boolean; weapons: boolean }, arena: Arena = ARENA,
): Levelled {
  const rng = mulberry32(seed);
  const run = newRun(level, arena, rng);
  let lv2At = Infinity;
  while (run.t < ms) {
    if (!rules.loops) run.loopCool = 1e12;
    step(run, 25, bot(run), rng);
    if (run.choosing) {
      // With three weapons among nine cards an offer can be ALL weapons; a bot
      // that never takes one then passes the level up rather than take one.
      const pick = rules.weapons ? run.choosing[0] : run.choosing.find((c) => !WEAPONS.includes(c));
      if (pick) pickCard(run, pick);
      else run.choosing = null;
    }
    if (run.lv >= 2 && lv2At === Infinity) lv2At = run.t;
    if (run.phase === "won" || run.phase === "dead") return { lv: run.lv, lv2At, crushed: run.crushed, end: run.phase };
  }
  return { lv: run.lv, lv2At, crushed: run.crushed, end: "timeout" };
}

/**
 * A person trying to lasso ONE bat that chases them, at a fixed length - the
 * question the reviewer NePo asked (2026-09-28): "I didn't manage to crush a bat
 * at 46 or any lower size". Two hands:
 *
 *   orbit    circles the BAT itself, re-aiming as it moves - the bat follows
 *            the head in and the circle collapses toward the tightest spin
 *   circle   circles the SPOT the bat stood on, on a circle sized to the body,
 *            drifting `gap` units a lap - negative is a hand that TIGHTENS as it
 *            goes round, which is what a chased player does, and it is the one
 *            that reproduced the reviewer: 54-60 segments under the old touch
 *
 * Success is a crush within 15 s, before the run ends. The bat is alone, the
 * floor gems and the clock are off, and it chases from the first frame.
 */
export function lassoTrial(len: number, seed: number, bot: "orbit" | "circle", gap = 0, arena: Arena = ARENA): boolean {
  const rng = mulberry32(seed);
  const run = newRun("normal", arena, rng);
  run.spawnIn = 1e12;
  run.floorIn = 1e12;
  run.calmMs = 0;
  run.len = len;
  run.path = Array.from({ length: Math.ceil((len * 12) / 4) }, (_, i) => ({ x: run.x - (i + 1) * 4, y: run.y }));
  const a = (rng() - 0.5) * 1.6 - 0.9;
  const bat = makeFoe(run, "runner", run.x + Math.cos(a) * 140, run.y + Math.sin(a) * 140);
  run.foes.push(bat);
  const spot = { x: bat.x, y: bat.y };
  const R0 = Math.max(30, ((run.path.length * 4 - 60) * 0.9) / (2 * Math.PI));
  let lapped = 0;
  let last = NaN;
  let onCircle = false;
  while (run.t < 15_000) {
    const c = bot === "orbit" ? bat : spot;
    const dx = run.x - c.x;
    const dy = run.y - c.y;
    const d = Math.hypot(dx, dy) || 1;
    const bearing = Math.atan2(dy, dx);
    if (onCircle && !Number.isNaN(last)) lapped += Math.abs(Math.atan2(Math.sin(bearing - last), Math.cos(bearing - last)));
    last = bearing;
    if (Math.abs(d - R0) < 8) onCircle = true;
    const R = bot === "orbit" ? R0 : R0 + gap * (lapped / (2 * Math.PI));
    const k = Math.max(-1, Math.min(1, ((d - R) / R) * 2));
    const ang = Math.atan2(dx / d - (dy / d) * k, -dy / d - (dx / d) * k);
    step(run, 25, { dx: Math.cos(ang), dy: Math.sin(ang) }, rng);
    run.choosing = null;
    if (run.crushed > 0) return true;
    if (run.phase === "dead") return false;
  }
  return false;
}

/** The shortest length (even, from 12) at which `lassoTrial` succeeds on at least half of `seeds`. */
export function shortestLasso(bot: "orbit" | "circle", gap = 0, seeds = 10): number {
  for (let len = 12; len <= 60; len += 2) {
    let ok = 0;
    for (let s = 1; s <= seeds; s++) if (lassoTrial(len, s, bot, gap)) ok++;
    if (ok * 2 >= seeds) return len;
  }
  return Infinity;
}
