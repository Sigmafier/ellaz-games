// Snake Survivors' ONE screen, as rules (operator, 2026-10-01, approved off the
// "one-screen start, all four" mock): which cover is up, what the game-over card
// carries, and how long the controls line stays in the arena. Pure, so it is
// tested without Phaser; SnakeSurvivorsGame.tsx only reads these.

import { runStats, type RunStat } from "./hud";

/** The scene's phase. Type-only, so this file never pulls the scene in. */
type Phase = "ready" | "playing" | "over" | "won";

/** What the game-over card shows: the run that ENDED, kept until the next one starts. */
export type EndCard = { won: boolean; stats: RunStat[]; newBest: boolean };

export type SnakeScreen = "title" | "over" | "run";

/**
 * The title before any run, the game-over card once one has ended, and no
 * cover while a run (or its level-up cards) is live.
 *
 * The card is read off the LATCH, never off the phase alone: a difficulty tap
 * on the game-over card makes the scene restart, which publishes "ready", and
 * reading that as "title" would swap the card for the title under the finger.
 */
export function snakeScreen(phase: Phase, choosing: boolean, end: EndCard | null): SnakeScreen {
  if (phase === "playing" || choosing) return "run";
  return end ? "over" : "title";
}

/** The latch: set when a run ends, kept through a restart to ready, cleared when a run starts. */
export function nextEnd(prev: EndCard | null, phase: Phase, now: EndCard): EndCard | null {
  if (phase === "playing") return null;
  if (phase === "over" || phase === "won") return now;
  return prev;
}

/** The card for a run in this state; `best` is the stored record before it. */
export function endOf(s: { phase: Phase; crushed: number; lv: number; newBest: boolean }, best: number): EndCard {
  return { won: s.phase === "won", stats: runStats(s.crushed, best, s.lv), newBest: s.newBest };
}

/** How long the controls line stays in the arena once a run starts, ms. */
export const HINT_MS = 3000;
/** Its fade out, ms - drawn by CSS, after `HINT_MS`. */
export const HINT_FADE_MS = 600;

/** Is the controls line up, this long after the run started? null: no run has started. */
export function hintVisible(msSinceStart: number | null): boolean {
  return msSinceStart !== null && msSinceStart >= 0 && msSinceStart < HINT_MS;
}
