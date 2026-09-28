// Puzzle Snake - the solver and the greedy bot. Pure, node-only in practice
// (the game never imports this file; the tests and the level designer do).
//
// The solver is a breadth-first search over (head, body, apples eaten). It asks
// `judge` from `logic.ts` what every press does, so it cannot disagree with the
// game about a rule - there is one copy of the rules, and this reads it.
//
// The greedy bot is the control that makes a level a PUZZLE rather than a walk:
// it always heads for the nearest apple it can reach, then the exit. A level it
// finishes can be finished without thinking ahead; `solver.test.ts` requires it
// to fail most of World 2.
import { DIRS, judge, newGame, stepCell, step, type Dir, type Level, type PuzzleState } from "./logic";

export interface Solution {
  /** The fewest presses that solve the level. */
  par: number;
  /** One optimal line. */
  path: Dir[];
  /** How many distinct positions the search visited - its cost. */
  explored: number;
}

/** A position as the search stores it: the body and a bitmask of apples eaten. */
interface Node {
  body: number[];
  mask: number;
}

function stateOf(level: Level, n: Node): PuzzleState {
  return { ...newGame(level), body: n.body, eaten: level.apples.map((_, i) => (n.mask & (1 << i)) !== 0) };
}

/**
 * The key: the mask, the head and the body as a chain of 2-bit turns. Unique
 * because a mask fixes the length (start + apples eaten). Fits a double exactly
 * up to 2^53: 6 apples, 100 cells and a 16-long body is 45 bits.
 */
function keyOf(level: Level, n: Node): number {
  let k = n.mask * level.width * level.height + n.body[0];
  for (let i = 1; i < n.body.length; i++) {
    const d = n.body[i] - n.body[i - 1];
    k = k * 4 + (d === -level.width ? 0 : d === level.width ? 1 : d === -1 ? 2 : 3);
  }
  return k;
}

/**
 * Breadth-first: the first solved node found is an optimal one. Null if none.
 *
 * `first`, when given, allows only that apple (an index into `level.apples`)
 * to be the first one eaten - which is how a level's comment can say "this
 * apple loses the level if you eat it first" and have a test hold it to that.
 */
export function solve(level: Level, opts: { maxNodes?: number; first?: number } = {}): Solution | null {
  const { maxNodes = 2_000_000, first } = opts;
  if (level.apples.length > 16) throw new Error("the solver's mask holds 16 apples");
  const start: Node = { body: [...level.body], mask: 0 };
  const parent = new Map<number, { from: number; dir: Dir } | null>([[keyOf(level, start), null]]);
  let frontier: Node[] = [start];
  for (let depth = 0; frontier.length > 0; depth++) {
    const next: Node[] = [];
    for (const n of frontier) {
      const from = keyOf(level, n);
      const s = stateOf(level, n);
      for (const dir of DIRS) {
        const o = judge(s, dir);
        if (o === "wall" || o === "body" || o === "shut") continue;
        const to = stepCell(level, n.body[0], dir);
        if (o === "solved") return { par: depth + 1, path: [...lineTo(parent, from), dir], explored: parent.size };
        const grows = o === "ate";
        if (grows && first !== undefined && n.mask === 0 && level.apples.indexOf(to) !== first) continue;
        const child: Node = {
          body: grows ? [to, ...n.body] : [to, ...n.body.slice(0, -1)],
          mask: grows ? n.mask | (1 << level.apples.indexOf(to)) : n.mask,
        };
        const k = keyOf(level, child);
        if (parent.has(k)) continue;
        parent.set(k, { from, dir });
        next.push(child);
      }
      if (parent.size > maxNodes) throw new Error(`search passed ${maxNodes} positions`);
    }
    frontier = next;
  }
  return null;
}

function lineTo(parent: Map<number, { from: number; dir: Dir } | null>, key: number): Dir[] {
  const out: Dir[] = [];
  for (let at = parent.get(key); at; at = parent.get(at.from)) out.push(at.dir);
  return out.reverse();
}

/* ------------------------------------------------------------ the greedy bot */

export type GreedyResult =
  | { finished: true; moves: number }
  | { finished: false; moves: number; why: "stuck" | "looped" };

/**
 * Always walk the shortest route to the nearest apple still on the board, then
 * to the exit. The route is found around the body as it stands (only the tail
 * cell counts as free), and the first step of it is taken. When the body cuts
 * every route off, it does not give up: it takes the legal press that leaves
 * the head the most room, and tries again next press - so it fails only by
 * boxing itself in ("stuck") or by wandering past a generous cap ("looped").
 * It never plans past the apple it is walking to, which is exactly the
 * thinking a puzzle asks for.
 */
export function greedy(level: Level): GreedyResult {
  let s = newGame(level);
  const cap = level.width * level.height * 4;
  while (s.moves < cap) {
    if (s.solved) return { finished: true, moves: s.moves };
    const dir = firstStep(s) ?? roomiest(s);
    if (dir === null) return { finished: false, moves: s.moves, why: "stuck" };
    s = step(s, dir).state;
  }
  return { finished: false, moves: s.moves, why: "looped" };
}

/** The legal press after which the head can reach the most cells. */
function roomiest(s: PuzzleState): Dir | null {
  let best: Dir | null = null;
  let most = -1;
  for (const dir of DIRS) {
    const r = step(s, dir);
    if (r.state === s) continue;
    const room = reach(r.state);
    if (room > most) [best, most] = [dir, room];
  }
  return best;
}

function reach(s: PuzzleState): number {
  const { level } = s;
  const blocked = new Set(s.body);
  const seen = new Set<number>([s.body[0]]);
  const todo = [s.body[0]];
  while (todo.length > 0) {
    const c = todo.pop()!;
    for (const d of DIRS) {
      const n = stepCell(level, c, d);
      if (n < 0 || level.walls[n] || blocked.has(n) || seen.has(n)) continue;
      seen.add(n);
      todo.push(n);
    }
  }
  return seen.size;
}

/** The first press on a shortest route to the nearest goal, or null. */
function firstStep(s: PuzzleState): Dir | null {
  const { level } = s;
  const open = s.eaten.every(Boolean);
  const goals = new Set(open ? [level.exit] : level.apples.filter((_, i) => !s.eaten[i]));
  const blocked = new Set(s.body.slice(0, -1));
  const seen = new Map<number, Dir>();
  let frontier: number[] = [];
  for (const dir of DIRS) {
    const o = judge(s, dir);
    if (o !== "moved" && o !== "ate" && o !== "solved") continue;
    const c = stepCell(level, s.body[0], dir);
    if (goals.has(c)) return dir;
    seen.set(c, dir);
    frontier.push(c);
  }
  while (frontier.length > 0) {
    const next: number[] = [];
    for (const c of frontier) {
      for (const d of DIRS) {
        const n = stepCell(level, c, d);
        if (n < 0 || level.walls[n] || blocked.has(n) || seen.has(n)) continue;
        if (n === level.exit && !open) continue;
        const first = seen.get(c)!;
        if (goals.has(n)) return first;
        seen.set(n, first);
        next.push(n);
      }
    }
    frontier = next;
  }
  return null;
}
