// The career's bot harness: one career level played whole by the circling bot,
// careful (takes the first card every time) or careless (never takes a card).
// Test support, not game code: nothing the game ships imports this file.

import { mulberry32 } from "@shared/rng";
import { freshSave, type CareerSave } from "../../shared/career/save";
import { circle } from "./bots";
import { starsFor, simStats } from "./careerRules";
import { careerResult, newCareerRun } from "./careerRun";
import { isBoss } from "./crowd";
import { pickCard, step } from "./logic";
import type { Arena } from "./types";

export type Arm = "careful" | "careless";

export interface CareerRow {
  end: "won" | "dead" | "timeout";
  ms: number;
  stars: number;
  hearts: number;
  gold: number;
  cards: number;
  /** Fewest shapes on the floor at any step once the safe start is over - a crowd that ran dry reads 0 for long. */
  dryMs: number;
}

/** The longest a level may take the careful bot before it counts as a stall. */
export const MAX_LEVEL_MS = 5 * 60_000;

export function playCareer(id: string, seed: number, save: CareerSave, arena: Arena, arm: Arm, capMs = MAX_LEVEL_MS): CareerRow {
  const rng = mulberry32(seed);
  const run = newCareerRun(id, simStats(save), arena, rng);
  let cards = 0;
  let dryMs = 0;
  while (run.t < capMs) {
    step(run, 25, circle(run), rng);
    if (run.choosing) {
      cards += 1;
      if (arm === "careful") pickCard(run, run.choosing[0]);
      else run.choosing = null;
    }
    if (run.t > run.calmMs + 3000 && !run.foes.some((f) => !isBoss(f.kind))) dryMs += 25;
    if (run.phase === "won" || run.phase === "dead") break;
  }
  const r = careerResult(run);
  const end = run.phase === "won" ? "won" : run.phase === "dead" ? "dead" : "timeout";
  return { end, ms: run.t, stars: starsFor(r.hearts, r.of), hearts: r.hearts, gold: r.gold, cards, dryMs };
}

/** A save with these shop rows bought and these pieces worn. */
export function kitSave(shop: Record<string, number>, worn: string[]): CareerSave {
  const s = freshSave();
  s.shop = { ...shop };
  s.gear = { owned: [...worn], equipped: Object.fromEntries(worn.map((k) => [k.split(":")[0], k])) };
  return s;
}
