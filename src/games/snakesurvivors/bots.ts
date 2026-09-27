// Two players the pacing test plays whole runs with. Test support, not game
// code: nothing the game ships imports this file.

import { mulberry32 } from "@shared/rng";
import { WEAPONS } from "./cards";
import { ARENA, newRun, pickCard, step } from "./logic";
import type { Arena, LevelKey, Run, Steer } from "./types";

/** Never steers: glides straight until the wall stops it. */
export const idle = (): Steer => ({ dx: 0, dy: 0 });

export interface Outcome {
  end: "won" | "dead" | "timeout";
  ms: number;
  crushed: number;
}

/** Play one whole run with a bot, taking the first card every time. */
export function play(level: LevelKey, seed: number, bot: (run: Run) => Steer, arena: Arena = ARENA, capMs = 8 * 60_000): Outcome {
  const rng = mulberry32(seed);
  const run = newRun(level, arena, rng);
  while (run.t < capMs) {
    step(run, 25, bot(run), rng);
    if (run.choosing) pickCard(run, run.choosing[0]);
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
 * spikes, which kill without a loop. Both off is floor gems and nothing else.
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
    if (run.choosing) pickCard(run, rules.weapons ? run.choosing[0] : (run.choosing.find((c) => !WEAPONS.includes(c)) ?? run.choosing[0]));
    if (run.lv >= 2 && lv2At === Infinity) lv2At = run.t;
    if (run.phase === "won" || run.phase === "dead") return { lv: run.lv, lv2At, crushed: run.crushed, end: run.phase };
  }
  return { lv: run.lv, lv2At, crushed: run.crushed, end: "timeout" };
}
