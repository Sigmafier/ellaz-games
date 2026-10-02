// Snake Arena's computer snakes - pure, like logic.ts, so node plays whole
// rounds of them (`bots.test.ts` measures the ladder that way).
//
// A bot is meant to be FAIR and READABLE: you can watch one and say what it is
// doing. Each step it looks at its three moves (never back onto its neck) and
// takes the best by three plain rules, in order:
//
//   1. never a move that is out on the spot - a wall or a body - if any is not;
//   2. never into a pocket smaller than itself, found by a flood fill from the
//      cell it would move to, and never beside another snake's head if it can
//      help it (a head-on puts both out);
//   3. then the move closest to the nearest apple it can actually reach
//      (one breadth-first search from every apple at once), going straight on
//      a tie so it does not wiggle.
//
// And now and then it slips: with a small chance per step (`MISTAKE`) it takes
// one of its three moves at random instead. That is the whole of its
// difficulty - it never sees further ahead, never cuts anyone off on purpose,
// and never knows where the next apple will land.
//
// The chance of a slip is the LEVEL's (`setup.ts`), measured, not felt -
// `bots.test.ts` plays each level and pins the shares that come out.
import { DIRS, OPPOSITE, inside, step, type Dir, type Point, type Round, type Snake } from "./logic";

/** Everything a bot reads about the board, built ONCE per step and shared by every bot. */
export interface View {
  cols: number;
  rows: number;
  /** 1 where a body will still be after the step (every segment but each tail). */
  blocked: Uint8Array;
  /**
   * How many steps until a body leaves each cell, 0 for a free one. Segment `i`
   * of a snake `len` long moves off in `len - i` steps if nobody eats - which is
   * what lets a bot see that a pocket of its OWN body opens up behind its tail.
   */
  frees: Uint16Array;
  /** Bit `id` set where snake `id`'s head could be after the step. */
  reach: Uint8Array;
  /** Steps from each cell to the nearest apple it can reach, -1 for none. */
  dist: Int16Array;
  /** Per snake id, steps from its head to each cell (FAR where it cannot get). Empty for an out snake. */
  near: Int16Array[];
  /** Scratch for the flood fills: a cell is seen when it holds the current `stamp`, `depth` steps from the start. */
  seen: Uint32Array;
  depth: Uint16Array;
  stamp: number;
  queue: Int16Array;
}

const at = (v: View, p: Point) => p.y * v.cols + p.x;
/** Further than anything on a board: "cannot get there". */
const FAR = 9999;

export function viewOf(r: Round): View {
  const { cols, rows } = r.shape;
  const blocked = new Uint8Array(cols * rows);
  const reach = new Uint8Array(cols * rows);
  const n = cols * rows;
  const frees = new Uint16Array(n);
  const v: View = { cols, rows, blocked, frees, reach, dist: new Int16Array(n).fill(-1), near: [], seen: new Uint32Array(n), depth: new Uint16Array(n), stamp: 0, queue: new Int16Array(n) };
  const apples = new Set(r.apples.map((p) => at(v, p)));
  // A rock is a wall that never moves off its cell: blocked, and free "never".
  for (const p of r.rocks) {
    blocked[at(v, p)] = 1;
    frees[at(v, p)] = 0xffff;
  }
  for (const s of r.snakes) {
    if (!s.alive) continue;
    const len = s.body.length;
    for (let i = 0; i < len; i++) frees[at(v, s.body[i])] = len - i;
    // The tail moves on unless this snake eats. So a snake with an apple
    // beside its head may keep its tail, and that tail is counted as a wall:
    // following it measured as a careful player's death (a head into a tail
    // that stayed, 3.9 s into a round).
    let mayEat = false;
    for (const d of DIRS) {
      const n = step(s.body[0], d);
      if (d === OPPOSITE[s.dir] || !inside(r.shape, n)) continue;
      reach[at(v, n)] |= 1 << s.id;
      if (apples.has(at(v, n))) mayEat = true;
    }
    for (let i = 0; i < (mayEat ? len : len - 1); i++) blocked[at(v, s.body[i])] = 1;
  }
  fillDistances(v, r.apples);
  v.near = r.snakes.map((s) => (s.alive ? headDistances(v, at(v, s.body[0])) : new Int16Array(0)));
  return v;
}

/** One breadth-first search from every apple at once, through cells no body blocks. */
function fillDistances(v: View, apples: Point[]) {
  const { queue, dist, blocked, cols, rows } = v;
  let head = 0;
  let tail = 0;
  for (const a of apples) {
    const c = at(v, a);
    if (blocked[c] || dist[c] >= 0) continue;
    dist[c] = 0;
    queue[tail++] = c;
  }
  const visit = (n: number, d: number) => {
    if (blocked[n] || dist[n] >= 0) return;
    dist[n] = d;
    queue[tail++] = n;
  };
  while (head < tail) {
    const c = queue[head++];
    const d = dist[c] + 1;
    const x = c % cols;
    if (x > 0) visit(c - 1, d);
    if (x < cols - 1) visit(c + 1, d);
    if (c >= cols) visit(c - cols, d);
    if (c < cols * (rows - 1)) visit(c + cols, d);
  }
}

/** Steps from one head to every cell, through cells no body blocks. */
function headDistances(v: View, from: number): Int16Array {
  const { queue, blocked, cols, rows } = v;
  const d = new Int16Array(cols * rows).fill(FAR);
  d[from] = 0;
  queue[0] = from;
  let head = 0;
  let tail = 1;
  const visit = (n: number, k: number) => {
    if (blocked[n] || d[n] !== FAR) return;
    d[n] = k;
    queue[tail++] = n;
  };
  while (head < tail) {
    const c = queue[head++];
    const k = d[c] + 1;
    const x = c % cols;
    if (x > 0) visit(c - 1, k);
    if (x < cols - 1) visit(c + 1, k);
    if (c >= cols) visit(c - cols, k);
    if (c < cols * (rows - 1)) visit(c + cols, k);
  }
  return d;
}

/** How soon any OTHER snake's head could be on cell `c`. */
function rival(v: View, c: number, id: number): number {
  let best = FAR;
  for (let j = 0; j < v.near.length; j++) if (j !== id && v.near[j].length && v.near[j][c] < best) best = v.near[j][c];
  return best;
}

/**
 * How many cells the head can still reach from `from`, counting up to `cap`.
 * TIME-AWARE: a body cell counts as open once the head could arrive there no
 * sooner than that body has moved off it. Without that, a bot saw its own coil
 * as a wall forever, and the flood that was meant to keep it out of pockets
 * walked it into them: 90 of 116 deaths in 29 measured rounds were a head with
 * all three moves blocked, most of them inside its own body.
 */
function space(v: View, from: number, cap: number, id: number, contested = true): number {
  const { seen, depth, queue, frees, cols, rows } = v;
  const mark = ++v.stamp;
  seen[from] = mark;
  depth[from] = 1;
  queue[0] = from;
  let head = 0;
  let tail = 1;
  let arrive = 0;
  const visit = (n: number) => {
    // A cell another head can reach as soon as this one is not ours to count:
    // TERRITORY, not room. Room counted a gap another snake was about to fill,
    // and 50 of 62 of a careful player's outs were three blocked moves.
    if (tail >= cap || seen[n] === mark || frees[n] > arrive || (contested && arrive >= rival(v, n, id))) return;
    seen[n] = mark;
    depth[n] = arrive;
    queue[tail++] = n;
  };
  while (head < tail && tail < cap) {
    const c = queue[head++];
    arrive = depth[c] + 1;
    const x = c % cols;
    if (x > 0) visit(c - 1);
    if (x < cols - 1) visit(c + 1);
    if (c >= cols) visit(c - cols);
    if (c < cols * (rows - 1)) visit(c + cols);
  }
  return tail;
}

/** A move that is out on the spot: off the board, or into a body. */
export function deadly(r: Round, v: View, s: Snake, d: Dir): boolean {
  const n = step(s.body[0], d);
  return !inside(r.shape, n) || v.blocked[at(v, n)] === 1;
}

/** The three moves a snake has - never straight back onto its neck. */
export const movesOf = (s: Snake): Dir[] => DIRS.filter((d) => d !== OPPOSITE[s.dir]);

const TRAPPED = -1000;
const ROOM = 10;
const HEAD_RISK = -300;
/** An apple nobody can reach from here costs this much - less than any trap. */
const NO_APPLE = 99;

/** How good a move is, by the three rules at the top of this file. Higher is better. */
export function scoreMove(r: Round, v: View, s: Snake, d: Dir): number {
  if (deadly(r, v, s, d)) return -Infinity;
  const c = at(v, step(s.body[0], d));
  const len = s.body.length;
  let score = 0;
  const need = len * 2 + ROOM;
  const room = space(v, c, need, s.id);
  // Short of territory is bad; short of ROOM - cells nobody at all can stop it
  // reaching - is worse. When every move is short of territory, this is what
  // still tells the open move from the coil: 15 of 21 of a careful player's
  // outs on the busiest board were into its own body before it was here.
  if (room < need) score += TRAPPED / 2 + room + (space(v, c, need, s.id, false) < need ? TRAPPED : 0);
  if (v.reach[c] & ~(1 << s.id)) score += HEAD_RISK;
  score -= v.dist[c] >= 0 ? v.dist[c] : NO_APPLE;
  if (d === s.dir) score += 0.5;
  return score;
}

/** The move snake `id` takes this step. `mistake` is its chance of a random one instead. */
export function decide(r: Round, id: number, mistake: number, rng: () => number, v: View = viewOf(r)): Dir {
  const s = r.snakes[id];
  const moves = movesOf(s);
  if (mistake > 0 && rng() < mistake) {
    // A slip, not a suicide: a random move that is not out on the spot. It
    // forgets the pockets, the heads and the apples - never the wall in front.
    const safe = moves.filter((d) => !deadly(r, v, s, d));
    const from = safe.length ? safe : moves;
    return from[Math.floor(rng() * from.length)];
  }
  let best = moves[0];
  let bestScore = -Infinity;
  for (const d of moves) {
    const sc = scoreMove(r, v, s, d);
    if (sc > bestScore) {
      best = d;
      bestScore = sc;
    }
  }
  return best;
}

/** Every alive bot (every snake but the people, `0 .. humans-1`) chooses its move for the next step. */
export function steerBots(r: Round, mistake: number, rng: () => number = Math.random): Round {
  const v = viewOf(r);
  const snakes = r.snakes.map((s) => (s.id < r.humans || !s.alive ? s : { ...s, pending: decide(r, s.id, mistake, rng, v) }));
  return { ...r, snakes };
}
