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
/** `who`: the person steering - 0, or 1 for P2's keys in a two-player round. */
export type Press = { kind: "direction"; dir: Dir; who: number } | { kind: "confirm" };
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

/**
 * Where the round goes after a step: the player going out, or the round ending.
 * Two players never get the out card: whoever goes out first watches the other
 * play on, and the round itself ends once both are out (`logic.ts`).
 */
export function afterStep(phase: Phase, r: Round): Phase {
  if (r.over && (phase === "playing" || phase === "watch")) return "over";
  if (phase === "playing" && r.humans === 1 && !r.snakes[0].alive) return "out";
  return phase;
}

/** Ms per step: the round's own rate (`stepMs`, the level's), three times as fast while watching. */
export function stepMsFor(phase: Phase, stepMs = STEP_MS): number {
  return phase === "watch" ? stepMs / WATCH_SPEED : stepMs;
}

/** Does the round's clock run in this phase? */
export const running = (phase: Phase) => phase === "playing" || phase === "watch";

const ARROWS: Record<string, Dir> = { ArrowUp: "up", ArrowDown: "down", ArrowLeft: "left", ArrowRight: "right" };
const WASD: Record<string, Dir> = { w: "up", s: "down", a: "left", d: "right", W: "up", S: "down", A: "left", D: "right" };

/**
 * A key, as a press - or null for a key that means nothing here. Only Space
 * and Enter confirm. With one player both sets steer the one snake; with two
 * (`two`), the arrows are P1's and WASD is P2's.
 */
export function keyPress(key: string, two = false): Press | null {
  if (ARROWS[key]) return { kind: "direction", dir: ARROWS[key], who: 0 };
  if (WASD[key]) return { kind: "direction", dir: WASD[key], who: two ? 1 : 0 };
  if (key === " " || key === "Enter") return { kind: "confirm" };
  return null;
}
