// Puzzle Snake - the pure rules. No DOM, no clock, no randomness: a level is a
// drawing, and the only thing that ever changes the board is a press.
//
// What this is, next to its siblings. `snake` steers a moving thing on a timer
// and ends when it hits something; `maze` walks a mouse to crumbs. Here nothing
// moves until a press, a wall or your own body simply refuses the step, and the
// body is the puzzle: each apple makes it one longer, so the order you eat them
// in decides whether the last corridor still has room for you. You can never
// lose - undo and restart are always there, and "stuck" is a board with no legal
// press, said in words.
//
// Growth is IMMEDIATE: the step that eats keeps the tail where it was. So the
// head may enter the cell the tail is leaving on an ordinary step, and may not
// on a step that grows. From a parsed level that second case cannot arise (an
// apple is never under the body), but it is the rule, so it is enforced and
// tested with an apple planted by hand.
//
// WORLD 2's TILES (2026-09-28, after a player called the old Maze "boring and
// samey"). Each is one rule, and each is decided here and nowhere else:
//
//   K  a KEY. The head picks it up by entering it; it does not grow the snake.
//   L  a LOCK. A wall until ANY key is held, then floor for good. One key opens
//      every lock - the simplest rule that still makes the key a detour you
//      have to plan, and one a child can say back in five words.
//   > < ^ v  ONE-WAY. May only be ENTERED moving the way it points. Leaving it
//      is free, and the body lies on it like on any floor.
//   @  a PORTAL, always a pair. The head entering one comes out of the other's
//      cell, one step on in the same direction. Portal cells are never
//      occupied, so the body - which is just the cells the head stood on -
//      follows through cell by cell.

export type Dir = "up" | "down" | "left" | "right";

/** The order `legalDirs` reports in, and the order the solver tries. */
export const DIRS: readonly Dir[] = ["up", "down", "left", "right"];

/** A level as the rules see it. Cells are `y * width + x`. */
export interface Level {
  width: number;
  height: number;
  /** `walls[cell]` is true for a wall. */
  walls: readonly boolean[];
  /** Every apple, in reading order. Index into this is the apple's id. */
  apples: readonly number[];
  exit: number;
  /** The snake at the start, head first. */
  body: readonly number[];
  /** Every key, in reading order. Index into this is the key's id. */
  keys: readonly number[];
  /** `locks[cell]` is true for a lock. */
  locks: readonly boolean[];
  /** `arrows[cell]` is the only direction that cell may be entered in, or null. */
  arrows: readonly (Dir | null)[];
  /** No portal, or exactly one pair. */
  portals: readonly number[];
}

export interface PuzzleState {
  level: Level;
  /** Head first. */
  body: readonly number[];
  /** `eaten[i]` is true once `level.apples[i]` has been eaten. */
  eaten: readonly boolean[];
  /** `got[i]` is true once `level.keys[i]` has been picked up. */
  got: readonly boolean[];
  moves: number;
  solved: boolean;
  /** Every earlier state, oldest first. Undo is unlimited. */
  history: readonly Snapshot[];
}

/**
 * One earlier state, and the PRESS that left it. The press is kept because a
 * portal makes the head's cells a poor witness to it: the head can move from
 * one side of the board to the other on a single "right".
 */
type Snapshot = Pick<PuzzleState, "body" | "eaten" | "got" | "moves" | "solved"> & { press: Dir };

/**
 * What a press did. `moved`, `ate`, `key` and `solved` change the board; the
 * rest are refusals, which hand back the same state.
 */
export type Outcome = "moved" | "ate" | "key" | "solved" | "wall" | "body" | "shut" | "locked" | "oneway";

/** The outcomes that change the board. */
export function changes(o: Outcome): boolean {
  return o === "moved" || o === "ate" || o === "key" || o === "solved";
}

const ARROWS: Record<string, Dir> = { "^": "up", v: "down", "<": "left", ">": "right" };
const CHARS = new Set(["#", ".", "A", "E", "H", "o", "K", "L", "@", ...Object.keys(ARROWS)]);

/** Read a level from its drawing. Throws on anything it cannot read exactly. */
export function parseLevel(rows: readonly string[]): Level {
  const height = rows.length;
  const width = rows[0]?.length ?? 0;
  if (height < 3 || width < 3) throw new Error("level too small");
  const walls: boolean[] = [];
  const apples: number[] = [];
  const keys: number[] = [];
  const locks: boolean[] = [];
  const arrows: (Dir | null)[] = [];
  const portals: number[] = [];
  const bodyCells = new Set<number>();
  let head = -1;
  let exit = -1;
  rows.forEach((row, y) => {
    if (row.length !== width) throw new Error(`ragged row ${y}`);
    [...row].forEach((c, x) => {
      if (!CHARS.has(c)) throw new Error(`unknown cell "${c}" at ${x},${y}`);
      const i = y * width + x;
      walls.push(c === "#");
      if (c === "A") apples.push(i);
      if (c === "E") exit = i;
      if (c === "H") head = i;
      if (c === "o") bodyCells.add(i);
      if (c === "K") keys.push(i);
      locks.push(c === "L");
      arrows.push(ARROWS[c] ?? null);
      if (c === "@") portals.push(i);
    });
  });
  if (head < 0) throw new Error("no head (H)");
  if (exit < 0) throw new Error("no exit (E)");
  if (apples.length === 0) throw new Error("no apple (A)");
  if (portals.length !== 0 && portals.length !== 2) throw new Error(`portals come in one pair (@), found ${portals.length}`);
  if (locks.some(Boolean) && keys.length === 0) throw new Error("a lock (L) with no key (K) to open it");
  return { width, height, walls, apples, exit, body: traceBody(head, bodyCells, width), keys, locks, arrows, portals };
}

/** Follow the body from the head. A fork or a stray body cell is an error. */
function traceBody(head: number, cells: Set<number>, width: number): number[] {
  const body = [head];
  const left = new Set(cells);
  let at = head;
  while (left.size > 0) {
    const next = neighbours(at, width).filter((n) => left.has(n));
    if (next.length !== 1) throw new Error(`body is not one chain from the head (at cell ${at})`);
    at = next[0];
    left.delete(at);
    body.push(at);
  }
  return body;
}

function neighbours(i: number, width: number): number[] {
  return [i - width, i + width, i - 1, i + 1].filter((n) => n >= 0 && Math.abs((n % width) - (i % width)) <= 1);
}

/** The cell one step from `i`, or -1 off the board. */
export function stepCell(level: Level, i: number, dir: Dir): number {
  const x = i % level.width;
  const y = Math.floor(i / level.width);
  const nx = x + (dir === "left" ? -1 : dir === "right" ? 1 : 0);
  const ny = y + (dir === "up" ? -1 : dir === "down" ? 1 : 0);
  if (nx < 0 || ny < 0 || nx >= level.width || ny >= level.height) return -1;
  return ny * level.width + nx;
}

/**
 * Where a press from `from` puts the head, walls and all ignored: the next
 * cell, or - when that is a portal - one step on from its twin. -1 off the
 * board, and -1 for a portal that would come out into a portal.
 */
export function landing(level: Level, from: number, dir: Dir): number {
  const to = stepCell(level, from, dir);
  if (to < 0 || level.portals.length === 0) return to;
  const at = level.portals.indexOf(to);
  if (at < 0) return to;
  const out = stepCell(level, level.portals[1 - at], dir);
  return out >= 0 && level.portals.includes(out) ? -1 : out;
}

export function newGame(level: Level): PuzzleState {
  return {
    level,
    body: level.body,
    eaten: level.apples.map(() => false),
    got: level.keys.map(() => false),
    moves: 0,
    solved: false,
    history: [],
  };
}

/** A key is held: every lock is floor. */
export function holdsKey(s: Pick<PuzzleState, "got">): boolean {
  return s.got.some(Boolean);
}

export function exitOpen(s: Pick<PuzzleState, "eaten">): boolean {
  return s.eaten.every(Boolean);
}

export function isSolved(s: PuzzleState): boolean {
  return s.solved;
}

/**
 * What a press into `dir` would do, without doing it. The whole rule set is
 * here, and `step` only applies what this says.
 */
export function judge(s: PuzzleState, dir: Dir): Outcome {
  if (s.solved) return "solved";
  const { level } = s;
  const to = landing(level, s.body[0], dir);
  if (to < 0 || level.walls[to]) return "wall";
  if (level.locks[to] && !holdsKey(s)) return "locked";
  const arrow = level.arrows[to];
  if (arrow && arrow !== dir) return "oneway";
  const open = exitOpen(s);
  if (to === level.exit && !open) return "shut";
  const apple = level.apples.findIndex((a, i) => a === to && !s.eaten[i]);
  const grows = apple >= 0;
  // The cells still occupied after this step: the whole body when it grows,
  // everything but the tail when it does not.
  // The NECK is always refused, even when it is also the tail: a two-long
  // snake would otherwise turn round by swapping its head and tail, which
  // reads as a teleport rather than a move.
  const kept = grows ? s.body.length : Math.max(2, s.body.length - 1);
  for (let k = 0; k < kept; k++) if (s.body[k] === to) return "body";
  if (to === level.exit) return "solved";
  if (grows) return "ate";
  return level.keys.some((k, i) => k === to && !s.got[i]) ? "key" : "moved";
}

/** Press once. A refusal hands back the SAME state object. */
export function step(s: PuzzleState, dir: Dir): { state: PuzzleState; outcome: Outcome } {
  const outcome = judge(s, dir);
  if (!changes(outcome)) return { state: s, outcome };
  if (s.solved) return { state: s, outcome };
  const to = landing(s.level, s.body[0], dir);
  const grows = outcome === "ate";
  const body = grows ? [to, ...s.body] : [to, ...s.body.slice(0, -1)];
  const eaten = grows ? s.eaten.map((e, i) => e || s.level.apples[i] === to) : s.eaten;
  const got = outcome === "key" ? s.got.map((g, i) => g || s.level.keys[i] === to) : s.got;
  const snap: Snapshot = { body: s.body, eaten: s.eaten, got: s.got, moves: s.moves, solved: s.solved, press: dir };
  return {
    state: { ...s, body, eaten, got, moves: s.moves + 1, solved: outcome === "solved", history: [...s.history, snap] },
    outcome,
  };
}

/** Take back one press. With nothing to take back, the SAME state. */
export function undo(s: PuzzleState): PuzzleState {
  const prev = s.history[s.history.length - 1];
  if (!prev) return s;
  const { press: _press, ...back } = prev;
  return { ...s, ...back, history: s.history.slice(0, -1) };
}

/**
 * Which way the head is looking: the way it last moved, or - before the first
 * press - away from the neck. Never read off the neck after a move, because a
 * portal can put the neck on the far side of the board.
 */
export function facing(s: PuzzleState): Dir {
  const last = s.history[s.history.length - 1];
  if (last) return last.press;
  const d = s.body[0] - s.body[1];
  const w = s.level.width;
  return d === -w ? "up" : d === w ? "down" : d === -1 ? "left" : "right";
}

/** The presses that would change the board, in `DIRS` order. */
export function legalDirs(s: PuzzleState): Dir[] {
  if (s.solved) return [];
  return DIRS.filter((d) => changes(judge(s, d)));
}

/** No press moves the snake. Never true of a solved board. */
export function isStuck(s: PuzzleState): boolean {
  return !s.solved && legalDirs(s).length === 0;
}

/* ------------------------------------------------------------------ stars */

/**
 * The 2-star margin, in moves over par: 20% of par, and never less than 2.
 *
 * Why 2 is the floor: every solution of a level ends on the same exit cell
 * from the same start, and on a grid every step flips the colour of the square
 * the head is on - so any two solutions of one level differ by an EVEN number
 * of moves. par + 1 is impossible and par + 2 is the smallest mistake there is,
 * one detour. A floor of 1 would make the second star mean the same thing as
 * the third.
 *
 * Why it grows: a 30-move level has room for more than one detour that is still
 * a plan rather than a wander. 20% is one detour on every level up to par 10
 * (the whole of World 1), and two on the longest World 2 levels.
 */
export const STAR_MARGIN_FLOOR = 2;

export function starMargin(par: number): number {
  return Math.max(STAR_MARGIN_FLOOR, Math.ceil(par * 0.2));
}

/**
 * 3 at par or fewer, 2 within `starMargin(par)`, 1 for any solve. "Or fewer"
 * is defensive: par IS the solver's optimum, so nobody can beat it, and a
 * level edit that made it beatable reds `solver.test.ts` long before a player
 * sees it.
 */
export function starsFor(moves: number, par: number): 1 | 2 | 3 {
  if (moves <= par) return 3;
  if (moves <= par + starMargin(par)) return 2;
  return 1;
}
