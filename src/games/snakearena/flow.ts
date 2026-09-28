// How a round starts, stops and ends - every input's meaning, as pure functions
// the Phaser scene only calls. The classic's flow (snake/flow.ts), copied in
// shape rather than imported, because importing it would load Snake's chunk.
import { STEP_MS, type Dir, type Round } from "./logic";

/**
 * Where the round is.
 *
 * - `ready`: the start card is up.
 * - `aim`: the card has gone and EVERY snake waits - the round clock too -
 *   until the player's first direction, as in the classic now.
 * - `playing`: the round runs.
 * - `out`: the player's snake has burst. The round stands still under the out
 *   card until they choose: watch it to the end, or play again.
 * - `watch`: the rest of the round, three times as fast, no player.
 * - `over`: the bell, or the last snake standing - the final card.
 */
export type Phase = "ready" | "aim" | "playing" | "out" | "watch" | "over";

export type InputKind = "direction" | "confirm";
export type Press = { kind: "direction"; dir: Dir } | { kind: "confirm" };
export type Move = "none" | "aim" | "go" | "turn" | "again";

/** How long after a card appears every restart input is ignored, ms - the classic's grace, for its reason: a finger already on its way. */
export const RESTART_GRACE_MS = 700;

/** How much faster Watch runs the rest of the round. */
export const WATCH_SPEED = 3;

/**
 * The whole table: in this phase, this press means this. A direction never
 * restarts anything - it is steering, and steering after the end means nothing.
 * The out card answers only its own two buttons, so a key cannot choose for
 * the player between watching and starting over.
 */
export function decide(phase: Phase, input: InputKind, msSinceEnd: number): Move {
  switch (phase) {
    case "ready":
      return input === "direction" ? "go" : "aim";
    case "aim":
      return input === "direction" ? "go" : "none";
    case "playing":
      return input === "direction" ? "turn" : "none";
    case "over":
      return input === "confirm" && msSinceEnd >= RESTART_GRACE_MS ? "again" : "none";
    default:
      return "none";
  }
}

/** Where the round goes after a step: the player going out, or the round ending. */
export function afterStep(phase: Phase, r: Round): Phase {
  if (r.over && (phase === "playing" || phase === "watch")) return "over";
  if (phase === "playing" && !r.snakes[0].alive) return "out";
  return phase;
}

/** Ms per step: the round's own rate, three times as fast while watching. */
export function stepMsFor(phase: Phase): number {
  return phase === "watch" ? STEP_MS / WATCH_SPEED : STEP_MS;
}

/** Does the round's clock run in this phase? */
export const running = (phase: Phase) => phase === "playing" || phase === "watch";

const KEYS: Record<string, Dir> = {
  ArrowUp: "up", ArrowDown: "down", ArrowLeft: "left", ArrowRight: "right",
  w: "up", s: "down", a: "left", d: "right",
  W: "up", S: "down", A: "left", D: "right",
};

/** A key, as a press - or null for a key that means nothing here. Only Space and Enter confirm. */
export function keyPress(key: string): Press | null {
  const dir = KEYS[key];
  if (dir) return { kind: "direction", dir };
  if (key === " " || key === "Enter") return { kind: "confirm" };
  return null;
}
