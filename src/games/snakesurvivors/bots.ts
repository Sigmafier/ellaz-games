// Two players the pacing test plays whole runs with. Test support, not game
// code: nothing the game ships imports this file.

import { mulberry32 } from "@shared/rng";
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
