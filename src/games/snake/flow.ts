// How a run starts and how it ends - every input's meaning, as pure functions
// the Phaser scene only calls. Answers a Phaser-forum review of 2026-09-27:
//
//   "When you start a game it goes straight into a wall unless you react fast."
//   "When you lose ... you were clicking a button so instead the score you see
//    start to play window."
//
// Node drives all of it (`flow.test.ts`); the scene cannot run in the suite.

import type { Dir, SnakeState } from "./logic";

/**
 * Where the run is. `aim` is new: the start card has gone and the snake sits
 * still, drawn with four arrows round its head, until the first DIRECTION says
 * which way to go. So nobody meets a wall they did not choose to head for.
 */
export type Phase = "ready" | "aim" | "playing" | "over";

/**
 * Two kinds of input, and the difference is the whole fix. A DIRECTION is an
 * arrow, WASD, the pad, the stick or a swipe. A CONFIRM is Space, Enter, a tap
 * on the board, or a card's button. The platform bar's restart is neither: it
 * is deliberate, and the scene takes it without asking here.
 */
export type InputKind = "direction" | "confirm";
export type Press = { kind: "direction"; dir: Dir } | { kind: "confirm" };

/** What the scene does with a press. */
export type Move = "none" | "aim" | "go" | "turn" | "again";

/**
 * How long after a death every restart input is ignored, ms.
 *
 * 700, because the death flash runs 600 (`DEATH_FLASH_MS` in the scene) and
 * the card must be on screen, flash finished, before a tap can take it away:
 * a finger already on its way when the snake died lands 200-300ms later, well
 * inside this. Longer than a second reads as a game that did not hear you, so
 * the test pins it at or under 1000.
 */
export const RESTART_GRACE_MS = 700;

/**
 * May this input start a new run from the game-over screen?
 *
 * A direction NEVER may - not in the grace and not after it. The reviewer was
 * taking a corner as the snake died, and the arrow they were already pressing
 * restarted the run, so the card with their score never appeared. A direction
 * is steering, and steering a dead snake means nothing.
 */
export function restartAllowed(msSinceDeath: number, input: InputKind): boolean {
  if (input === "direction") return false;
  return msSinceDeath >= RESTART_GRACE_MS;
}

/**
 * The whole table: in this phase, this press means this. `msSinceDeath` only
 * matters on the game-over screen; pass Infinity anywhere else.
 */
export function decide(phase: Phase, input: InputKind, msSinceDeath: number): Move {
  switch (phase) {
    case "ready":
      // Start takes the card away and waits; an arrow goes at once, that way.
      return input === "direction" ? "go" : "aim";
    case "aim":
      return input === "direction" ? "go" : "none";
    case "playing":
      return input === "direction" ? "turn" : "none";
    case "over":
      return restartAllowed(msSinceDeath, input) ? "again" : "none";
  }
}

const OPPOSITE: Record<Dir, Dir> = { up: "down", down: "up", left: "right", right: "left" };

/**
 * The first move of a run. Any of the four directions goes; a BACKWARDS press
 * turns the snake round (its tail becomes its head) rather than being ignored
 * the way `turn` ignores a reversal mid-run - there is no neck to fold onto
 * when nothing has moved yet, only a player who wants to go left.
 *
 * A sideways press sets only `pendingDir`: `dir` stays the way the body
 * actually lies, so a second press back across the neck is still refused.
 */
export function launch(state: SnakeState, dir: Dir): SnakeState {
  if (dir === OPPOSITE[state.dir]) {
    return { ...state, body: [...state.body].reverse(), dir, pendingDir: dir };
  }
  return { ...state, pendingDir: dir };
}

const KEYS: Record<string, Dir> = {
  ArrowUp: "up", ArrowDown: "down", ArrowLeft: "left", ArrowRight: "right",
  w: "up", s: "down", a: "left", d: "right",
  W: "up", S: "down", A: "left", D: "right",
};

/**
 * A key, as a press - or null for a key that means nothing here. Only Space
 * and Enter confirm; Shift, Tab and stray letters used to start the run.
 */
export function keyPress(key: string): Press | null {
  const dir = KEYS[key];
  if (dir) return { kind: "direction", dir };
  if (key === " " || key === "Enter") return { kind: "confirm" };
  return null;
}
