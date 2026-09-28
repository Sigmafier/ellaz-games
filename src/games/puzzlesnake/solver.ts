// Puzzle Snake - the solver and the greedy bot. Pure, node-only in practice
// (the game never imports this file; the tests and the level designer do).
//
// The solver is a breadth-first search over (head, body, apples eaten, keys
// picked up). It asks
// `judge` from `logic.ts` what every press does, so it cannot disagree with the
// game about a rule - there is one copy of the rules, and this reads it.
//
// The greedy bot is the control that makes a level a PUZZLE rather than a walk:
// it always heads for the nearest apple it can reach, then the exit. A level it
// finishes can be finished without thinking ahead; `solver.test.ts` requires it
// to fail most of World 2.
import { DIRS, changes, holdsKey, judge, landing, newGame, step, type Dir, type Level, type PuzzleState } from "./logic";

export interface Solution {
  /** The fewest presses that solve the level. */
  par: number;
  /** One optimal line. */
  path: Dir[];
  /** How many distinct positions the search visited - its cost. */
  explored: number;
}

/** A position as the search stores it: the body, and bitmasks of apples eaten and keys held. */
interface Node {
  body: number[];
  mask: number;
  keys: number;
}

function stateOf(level: Level, n: Node): PuzzleState {
  return {
    ...newGame(level),
    body: n.body,
    eaten: level.apples.map((_, i) => (n.mask & (1 << i)) !== 0),
    got: level.keys.map((_, i) => (n.keys & (1 << i)) !== 0),
  };
}

/**
 * The key: the masks, the head and the body as a chain of 2-bit links. Unique
 * because a mask fixes the length (start + apples eaten), and each link is the
 * PRESS that carried the head from one body cell to the next - which, through
 * a portal, is not the direction between the two cells. Reading the body back
 * from the head is `landing` run in reverse, so two different bodies never
 * share a key. Refuses a key past 2^53 rather than let two collide.
 */
function keyOf(level: Level, n: Node): number {
  let k = (n.keys * 2 ** level.apples.length + n.mask) * level.width * level.height + n.body[0];
  for (let i = 1; i < n.body.length; i++) {
    const d = DIRS.findIndex((dir) => landing(level, n.body[i], dir) === n.body[i - 1]);
    if (d < 0) throw new Error(`body cells ${n.body[i]} and ${n.body[i - 1]} are not one press apart`);
    k = k * 4 + d;
  }
  if (k > Number.MAX_SAFE_INTEGER) throw new Error("position key passed 2^53");
  return k;
}

/**
 * Breadth-first: the first solved node found is an optimal one. Null if none.
 *
 * `first`, when given, allows only that apple (an index into `level.apples`)
 * to be the first one eaten - which is how a level's comment can say "this
 * apple loses the level if you eat it first" and have a test hold it to that.
 *
 * `tailBlocks`, when true, switches OFF the rule that the head may enter the
 * square the tail is leaving - a counterfactual, never a rule the game plays
 * by. A level that has no solution under it is a level whose idea is "your
 * tail is a door", and `solver.test.ts` holds 1-4 to exactly that.
 */
export function solve(level: Level, opts: { maxNodes?: number; first?: number; tailBlocks?: boolean } = {}): Solution | null {
  const { maxNodes = 2_000_000, first, tailBlocks = false } = opts;
  if (level.apples.length > 16) throw new Error("the solver's mask holds 16 apples");
  if (level.apples.length + level.keys.length > 16) throw new Error("the solver's masks hold 16 apples and keys");
  const start: Node = { body: [...level.body], mask: 0, keys: 0 };
  const parent = new Map<number, { from: number; dir: Dir } | null>([[keyOf(level, start), null]]);
  let frontier: Node[] = [start];
  for (let depth = 0; frontier.length > 0; depth++) {
    const next: Node[] = [];
    for (const n of frontier) {
      const from = keyOf(level, n);
      const s = stateOf(level, n);
      for (const dir of DIRS) {
        const o = judge(s, dir);
        if (!changes(o)) continue;
        const to = landing(level, n.body[0], dir);
        if (tailBlocks && to === n.body[n.body.length - 1]) continue;
        if (o === "solved") return { par: depth + 1, path: [...lineTo(parent, from), dir], explored: parent.size };
        const grows = o === "ate";
        if (grows && first !== undefined && n.mask === 0 && level.apples.indexOf(to) !== first) continue;
        const child: Node = {
          body: grows ? [to, ...n.body] : [to, ...n.body.slice(0, -1)],
          mask: grows ? n.mask | (1 << level.apples.indexOf(to)) : n.mask,
          keys: o === "key" ? n.keys | (1 << level.keys.indexOf(to)) : n.keys,
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
 * Always walk the shortest route to the nearest apple still on the board (or
 * key, until one is held), then to the exit. The route is found around the body as it stands (only the tail
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

/**
 * Where the head could go from `c` on `d`, by the terrain alone - walls, locks
 * without a key, arrows pointing the other way, portals - or -1. The body and
 * the door are the callers' business.
 */
function terrainStep(s: PuzzleState, c: number, d: Dir): number {
  const { level } = s;
  const n = landing(level, c, d);
  if (n < 0 || level.walls[n]) return -1;
  if (level.locks[n] && !holdsKey(s)) return -1;
  const arrow = level.arrows[n];
  return arrow && arrow !== d ? -1 : n;
}

function reach(s: PuzzleState): number {
  const blocked = new Set(s.body);
  const seen = new Set<number>([s.body[0]]);
  const todo = [s.body[0]];
  while (todo.length > 0) {
    const c = todo.pop()!;
    for (const d of DIRS) {
      const n = terrainStep(s, c, d);
      if (n < 0 || blocked.has(n) || seen.has(n)) continue;
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
  // A key is a goal too until one is held: the bot walks to the nearest
  // thing worth walking to, and on a locked board a key is that thing.
  const keys = holdsKey(s) ? [] : level.keys;
  const goals = new Set(open ? [level.exit] : [...level.apples.filter((_, i) => !s.eaten[i]), ...keys]);
  const blocked = new Set(s.body.slice(0, -1));
  const seen = new Map<number, Dir>();
  let frontier: number[] = [];
  for (const dir of DIRS) {
    if (!changes(judge(s, dir))) continue;
    const c = landing(level, s.body[0], dir);
    if (goals.has(c)) return dir;
    seen.set(c, dir);
    frontier.push(c);
  }
  while (frontier.length > 0) {
    const next: number[] = [];
    for (const c of frontier) {
      for (const d of DIRS) {
        const n = terrainStep(s, c, d);
        if (n < 0 || blocked.has(n) || seen.has(n)) continue;
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
