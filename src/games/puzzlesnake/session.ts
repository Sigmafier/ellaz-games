// Puzzle Snake - leaving a level mid-way and coming back to it. Pure.
//
// The snapshot is the LEVEL ID and the PRESSES made since it started - nothing
// else. Replaying them through `step` rebuilds the board and the whole undo
// history exactly, so there is no second description of a board that could
// disagree with the rules. A snapshot that does not replay cleanly (a refused
// press, an unknown direction, a level id this build does not have) is refused
// by the validator, which the session port reads as "never played".
//
// ONE reward latch is stored, `paid`, and the session rule is why. The only
// reward is paid on SOLVING, and a solved board is never written (`live:
// !solved` in the game) and never accepted here - but undo works on a solved
// board too, so without the latch "solve, undo one press, leave, come back,
// solve" would pay the same attempt twice. Nothing about the board is
// timer-driven: the bump on a refused press is cosmetic and never reaches the
// state.
import type { SessionSpec } from "@sdk/index";
import { DIRS, newGame, parseLevel, step, type Dir, type PuzzleState } from "./logic";
import { levelById } from "./levels";

export interface PuzzleSession {
  level: string;
  presses: Dir[];
  /** This attempt has already been rewarded. Absent reads as false. */
  paid?: boolean;
}

/** Longer than any sensible attempt, short enough that a replay is instant. */
export const MAX_PRESSES = 600;

/** Rebuild the board a snapshot describes, or undefined if it does not replay. */
export function replay(snap: PuzzleSession): PuzzleState | undefined {
  const def = levelById(snap.level);
  if (!def) return undefined;
  let s = newGame(parseLevel(def.rows));
  for (const d of snap.presses) {
    const r = step(s, d);
    if (r.state === s || r.state.solved) return undefined;
    s = r.state;
  }
  return s;
}

/** The presses that got a board to where it is, oldest first. */
export function pressesOf(s: PuzzleState): Dir[] {
  const all = [...s.history.map((h) => h.body), s.body];
  const out: Dir[] = [];
  for (let i = 1; i < all.length; i++) {
    const from = all[i - 1][0];
    const to = all[i][0];
    const d = to - from;
    out.push(d === -s.level.width ? "up" : d === s.level.width ? "down" : d === -1 ? "left" : "right");
  }
  return out;
}

export const SESSION: SessionSpec<PuzzleSession> = {
  version: 1,
  validate: (value): value is PuzzleSession => {
    const v = value as Partial<PuzzleSession> | null;
    if (typeof v !== "object" || v === null) return false;
    if (typeof v.level !== "string" || !Array.isArray(v.presses)) return false;
    if (v.presses.length > MAX_PRESSES) return false;
    if (v.paid !== undefined && typeof v.paid !== "boolean") return false;
    if (!v.presses.every((d) => (DIRS as readonly unknown[]).includes(d))) return false;
    return replay(v as PuzzleSession) !== undefined;
  },
};
