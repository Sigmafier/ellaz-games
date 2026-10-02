// Snake Arena - the pure rules of one round. The Phaser scene only draws the
// state this produces; the bots (bots.ts) only choose a direction for it.
// Deterministic given a RNG, which only ever places apples.
//
// Operator rulings, 2026-09-28, not re-decided here: a 90-second round against
// 3 to 5 computer snakes; everyone grows by eating apples; a head hitting a
// wall or any body (its own included) is out; a head-on collision puts BOTH
// out; a snake that is out bursts into apples along its body; the longest
// snake alive when the clock runs out wins, and the last one alive wins at once.
// (Since the forum review, 2026-10-01, the bot count is the LEVEL's - 2, 3 or
// 5 - and a round may have rocks and a second person in it: `setup.ts`.)
//
// And the gentler round, ruled the same day after the first build measured a
// careful player's median life at 18-37 s: a 3-second safe start, a roomier
// phone board, and no apple dealt beside anyone's head. Measured after, 30
// seeded rounds a cell (`gentle.test.ts`, 2026-09-28): median 77-90 s on both
// boards at every bot count, at most 1 of 30 rounds under 11 s.

export interface Point {
  x: number;
  y: number;
}
export type Dir = "up" | "down" | "left" | "right";
export type Shape = { cols: number; rows: number };
export type OutCause = "wall" | "body" | "self" | "head";

/**
 * The two boards. The SHAPE is picked once at mount, off the same
 * `min-width: 900px` the board CSS sizes against, and handed in here: a media
 * query can change how big the board is DRAWN, never how many cells it has.
 * 600 cells on a PC. The phone board was 17x24 (408) and measured cramped: a
 * careful player's median life there was 18-20 s against 29-37 s on the PC.
 * 23x32 (736 cells) keeps the same portrait shape (0.72 against 0.71) in the
 * same frame, so the only change on screen is a smaller cell - and it is what
 * closed the gap: re-measured with the gentler rules below, a first pass at
 * 21x30 (630 cells) still read 56.3 s median at 5 bots, under the 60 s bar;
 * 23x32 reads 77-90 s at every bot count, 0 of 30 rounds under 11 s
 * (`gentle.test.ts`, 30 seeded rounds a cell, 2026-09-28).
 */
export const PC_SHAPE: Shape = { cols: 30, rows: 20 };
export const PHONE_SHAPE: Shape = { cols: 23, rows: 32 };

/**
 * One step, ms. 140, one notch from the classic's Normal (130) toward its Slow
 * (170), for one reason: the classic asks you to read ONE snake and here there
 * are up to six moving at once, and a head-on is settled in a single step. 10 ms
 * a step is the smallest change that gives the extra read without the snake
 * feeling like a different animal. No stages and no speed-up: every round is
 * the same speed from the first step to the last.
 */
export const STEP_MS = 140;
export const ROUND_MS = 90_000;
/**
 * 642 steps of 140 ms, 89.88 s. Rounded DOWN, because the clock shows whole
 * seconds rounded up: 643 steps is 90.02 s and opened the round on "1:31".
 */
export const ROUND_TICKS = Math.floor(ROUND_MS / STEP_MS);
export const START_LEN = 3;

/**
 * The safe start: the first 22 steps, 3.08 s. While it lasts a move that would
 * put a snake out is not taken - the snake WAITS where it is, and is drawn
 * see-through so a player can tell. Nothing overlaps, so nothing is left
 * tangled when it ends; it simply stops protecting anyone.
 */
export const SAFE_TICKS = Math.ceil(3000 / STEP_MS);

/** The safe start and the round's length in steps, for a round stepping every `stepMs` - so 3 s and 90 s stay 3 s and 90 s on Easy's slower step. */
export const safeTicksFor = (stepMs: number) => Math.ceil(3000 / stepMs);
export const roundTicksFor = (stepMs: number) => Math.floor(ROUND_MS / stepMs);

export interface Snake {
  id: number;
  /** Head first. Empty once the snake is out - it has burst into apples. */
  body: Point[];
  /** The way the body lies: the neck is behind the head, opposite this. */
  dir: Dir;
  /** Buffered input, applied on the next step. */
  pending: Dir;
  alive: boolean;
  /** The longest this snake has been. A snake never shrinks while alive, so for an out one it is its length when it went out. */
  peak: number;
  /** The tick its length last grew - the tie-break at the bell. */
  grewAt: number;
  eaten: number;
  /** The tick it went out, -1 while alive. */
  outAt: number;
  cause?: OutCause;
}

export interface Round {
  shape: Shape;
  snakes: Snake[];
  apples: Point[];
  /** The Rocks map's obstacles (`rocks.ts`): a wall in the middle of the board. Empty on Open. */
  rocks: Point[];
  /** Snakes `0 .. humans-1` are people (1, or 2 on a PC); the rest are bots. */
  humans: number;
  /** Ms per step: `STEP_MS`, or Easy's slower step (`setup.ts`). */
  stepMs: number;
  /** Apples are topped back up to this many after every step. */
  target: number;
  tick: number;
  ticks: number;
  /** Steps before this one are the safe start (`SAFE_TICKS` for a dealt round, 0 for a hand-built one). */
  safeUntil: number;
  over: boolean;
  winner: number | null;
}

/** Is the round still inside its safe start? */
export const isSafe = (r: Round) => r.tick < r.safeUntil;

export type TickEvents = { ate: number[]; out: { id: number; cause: OutCause }[] };

const DELTAS: Record<Dir, Point> = {
  up: { x: 0, y: -1 },
  down: { x: 0, y: 1 },
  left: { x: -1, y: 0 },
  right: { x: 1, y: 0 },
};
export const OPPOSITE: Record<Dir, Dir> = { up: "down", down: "up", left: "right", right: "left" };
export const DIRS: readonly Dir[] = ["up", "right", "down", "left"];

export const step = (p: Point, d: Dir): Point => ({ x: p.x + DELTAS[d].x, y: p.y + DELTAS[d].y });
export const inside = (s: Shape, p: Point) => p.x >= 0 && p.y >= 0 && p.x < s.cols && p.y < s.rows;
const cellOf = (s: Shape, p: Point) => p.y * s.cols + p.x;

/** Two apples a snake beyond one each: enough that nobody starves, few enough to fight over. */
export function appleTarget(snakes: number): number {
  return snakes + 2;
}

/** Where snake `i` of `n` starts: round a ring, the player (0) on the left, all heading clockwise. */
export function spawn(shape: Shape, i: number, n: number): { body: Point[]; dir: Dir } {
  const a = Math.PI + (i * 2 * Math.PI) / n;
  const head = {
    x: Math.round((shape.cols - 1) / 2 + shape.cols * 0.3 * Math.cos(a)),
    y: Math.round((shape.rows - 1) / 2 + shape.rows * 0.3 * Math.sin(a)),
  };
  // The tangent, clockwise on screen (y grows downward), snapped to an axis.
  const tx = -Math.sin(a);
  const ty = Math.cos(a);
  const dir: Dir = Math.abs(tx) > Math.abs(ty) ? (tx > 0 ? "right" : "left") : ty > 0 ? "down" : "up";
  const back = OPPOSITE[dir];
  const body = [head];
  while (body.length < START_LEN) body.push(step(body[body.length - 1], back));
  return { body, dir };
}

function snakeOf(id: number, body: Point[], dir: Dir): Snake {
  return { id, body, dir, pending: dir, alive: true, peak: body.length, grewAt: 0, eaten: 0, outAt: -1 };
}

/** A round from explicit pieces - how the tests and the bot ladder set a scene. */
export function makeRound(o: {
  shape: Shape;
  snakes: { body: Point[]; dir: Dir }[];
  apples: Point[];
  target?: number;
  ticks?: number;
  rocks?: Point[];
  humans?: number;
  stepMs?: number;
}): Round {
  const stepMs = o.stepMs ?? STEP_MS;
  return {
    shape: o.shape,
    snakes: o.snakes.map((s, i) => snakeOf(i, s.body, s.dir)),
    apples: o.apples,
    rocks: o.rocks ?? [],
    humans: o.humans ?? 1,
    stepMs,
    target: o.target ?? appleTarget(o.snakes.length),
    tick: 0,
    ticks: o.ticks ?? roundTicksFor(stepMs),
    safeUntil: 0,
    over: false,
    winner: null,
  };
}

/** The rest of a deal: rocks, people and the step (`setup.ts` fills them in from the title card's choices). */
export type Deal = { rocks?: Point[]; humans?: number; stepMs?: number };

/** A fresh round: the people (snakes 0..), `bots` computer snakes, and the apples. */
export function newRound(shape: Shape, bots: number, rng: () => number = Math.random, deal: Deal = {}): Round {
  const n = bots + (deal.humans ?? 1);
  const base = makeRound({ shape, snakes: Array.from({ length: n }, (_, i) => spawn(shape, i, n)), apples: [], ...deal });
  const r = { ...base, safeUntil: safeTicksFor(base.stepMs) };
  return { ...r, apples: topUp(r, r.apples, rng, true) };
}

/** Queue a direction for snake `id`. Ignored if it reverses onto the neck. */
export function turn(r: Round, id: number, dir: Dir): Round {
  const s = r.snakes[id];
  if (!s?.alive || dir === OPPOSITE[s.dir]) return r;
  return withSnake(r, { ...s, pending: dir });
}

/**
 * The player's FIRST move, as in the classic: any of the four goes, and a
 * backwards press turns the snake round (its tail becomes its head) rather
 * than being refused - nothing has moved yet, so there is no neck to fold onto.
 */
export function launch(r: Round, id: number, dir: Dir): Round {
  const s = r.snakes[id];
  if (!s?.alive) return r;
  if (dir === OPPOSITE[s.dir]) return withSnake(r, { ...s, body: [...s.body].reverse(), dir, pending: dir });
  return withSnake(r, { ...s, pending: dir });
}

const withSnake = (r: Round, s: Snake): Round => ({ ...r, snakes: r.snakes.map((o) => (o.id === s.id ? s : o)) });

type Move = { s: Snake; head: Point; grows: boolean; body: Point[] };

/**
 * Everyone's move, as if nobody died: the new head, whether it eats, and the
 * body after. A snake in `held` does not move at all this step.
 */
function planMoves(r: Round, held: ReadonlySet<number>): Move[] {
  const apples = new Set(r.apples.map((a) => cellOf(r.shape, a)));
  return r.snakes
    .filter((s) => s.alive)
    .map((s) => {
      if (held.has(s.id)) return { s, head: s.body[0], grows: false, body: s.body };
      const head = step(s.body[0], s.pending);
      const grows = inside(r.shape, head) && apples.has(cellOf(r.shape, head));
      const body = [head, ...(grows ? s.body : s.body.slice(0, -1))];
      return { s, head, grows, body };
    });
}

/**
 * Who is out after everyone moves at once. Judged against the bodies AFTER the
 * move, so a head may take the cell a tail is leaving on the same step, never
 * the tail of a snake that is growing - and the answer does not depend on the
 * order the snakes are listed in.
 */
function judge(r: Round, moves: Move[]): Map<number, OutCause> {
  const out = new Map<number, OutCause>();
  const rocks = new Set(r.rocks.map((p) => cellOf(r.shape, p)));
  const heads = new Map<number, number[]>();
  const bodies = new Map<number, { id: number; i: number }>();
  for (const m of moves) {
    if (!inside(r.shape, m.head)) continue;
    const c = cellOf(r.shape, m.head);
    heads.set(c, [...(heads.get(c) ?? []), m.s.id]);
    m.body.forEach((p, i) => i > 0 && bodies.set(cellOf(r.shape, p), { id: m.s.id, i }));
  }
  for (const m of moves) {
    // A rock is a wall in the middle of the board, and puts a head out the same way.
    if (!inside(r.shape, m.head) || rocks.has(cellOf(r.shape, m.head))) {
      out.set(m.s.id, "wall");
      continue;
    }
    const c = cellOf(r.shape, m.head);
    if (heads.get(c)!.length > 1) {
      out.set(m.s.id, "head");
      continue;
    }
    const hit = bodies.get(c);
    if (!hit) continue;
    if (hit.id === m.s.id) out.set(m.s.id, "self");
    // Passing THROUGH each other: this head landed on the other's old head.
    else if (hit.i === 1 && passedThrough(moves, hit.id, m.s.body[0])) out.set(m.s.id, "head");
    else out.set(m.s.id, "body");
  }
  return out;
}

/**
 * Everyone's moves and who is out. Inside the safe start nobody is: every snake
 * that would go out waits instead, and that is judged again - a snake that
 * waits keeps its tail, which can stop the one behind it - until nobody new
 * has to wait.
 */
function resolve(r: Round): { moves: Move[]; out: Map<number, OutCause>; held: Set<number> } {
  const held = new Set<number>();
  for (;;) {
    const moves = planMoves(r, held);
    const out = judge(r, moves);
    if (!isSafe(r) || out.size === 0) return { moves, out, held };
    for (const id of out.keys()) held.add(id);
  }
}

function passedThrough(moves: Move[], other: number, myOldHead: Point): boolean {
  const o = moves.find((m) => m.s.id === other);
  return Boolean(o && o.head.x === myOldHead.x && o.head.y === myOldHead.y);
}

/** Advance one step for every snake at once. A finished round is returned unchanged. */
export function tick(r: Round, rng: () => number = Math.random): { round: Round; events: TickEvents } {
  const events: TickEvents = { ate: [], out: [] };
  if (r.over) return { round: r, events };
  const { moves, out, held } = resolve(r);
  const byId = new Map(moves.map((m) => [m.s.id, m]));
  const eatenCells = new Set<number>();
  const snakes = r.snakes.map((s): Snake => {
    const m = byId.get(s.id);
    if (!m) return s;
    const cause = out.get(s.id);
    if (cause) {
      events.out.push({ id: s.id, cause });
      return { ...s, body: [], alive: false, outAt: r.tick, cause };
    }
    const len = m.body.length;
    if (m.grows) {
      events.ate.push(s.id);
      eatenCells.add(cellOf(r.shape, m.head));
    }
    return {
      ...s,
      body: m.body,
      dir: held.has(s.id) ? s.dir : s.pending,
      peak: Math.max(s.peak, len),
      grewAt: m.grows ? r.tick + 1 : s.grewAt,
      eaten: s.eaten + (m.grows ? 1 : 0),
    };
  });
  const next: Round = { ...r, snakes, tick: r.tick + 1 };
  const apples = burst(next, r.apples.filter((a) => !eatenCells.has(cellOf(r.shape, a))), out, r);
  return { round: finish({ ...next, apples: topUp(next, apples, rng) }), events };
}

/** An out snake leaves an apple on every free cell of its body, as it lay before the step. */
function burst(next: Round, apples: Point[], out: Map<number, OutCause>, before: Round): Point[] {
  if (out.size === 0) return apples;
  const taken = occupied(next, apples);
  const more: Point[] = [];
  for (const id of out.keys()) {
    for (const p of before.snakes[id].body) {
      const c = cellOf(next.shape, p);
      if (taken[c]) continue;
      taken[c] = 1;
      more.push(p);
    }
  }
  return apples.concat(more);
}

/** 1 on every cell a body, a rock or an apple holds - so no apple is ever dealt or dropped on a rock. */
function occupied(r: Round, apples: Point[]): Uint8Array {
  const taken = new Uint8Array(r.shape.cols * r.shape.rows);
  for (const p of r.rocks) taken[cellOf(r.shape, p)] = 1;
  for (const sn of r.snakes) for (const p of sn.body) taken[cellOf(r.shape, p)] = 1;
  for (const a of apples) taken[cellOf(r.shape, a)] = 1;
  return taken;
}

/**
 * Cells no NEW apple may land on: within 2 of any head, and - at the deal - the
 * 4 cells straight ahead of each one. An apple dealt under a snake's nose is
 * either a free point or, with two snakes near it, a head-on nobody chose.
 */
function keepClear(r: Round, taken: Uint8Array, atDeal: boolean) {
  for (const s of r.snakes) {
    if (!s.alive) continue;
    const h = s.body[0];
    for (let dy = -2; dy <= 2; dy++)
      for (let dx = -2; dx <= 2; dx++) {
        const p = { x: h.x + dx, y: h.y + dy };
        if (Math.abs(dx) + Math.abs(dy) <= 2 && inside(r.shape, p)) taken[cellOf(r.shape, p)] = 1;
      }
    let p = h;
    for (let k = 0; atDeal && k < 4; k++) {
      p = step(p, s.dir);
      if (inside(r.shape, p)) taken[cellOf(r.shape, p)] = 1;
    }
  }
}

/** New apples on random free cells until there are `target` of them, or no free cell is left. */
function topUp(r: Round, apples: Point[], rng: () => number, atDeal = false): Point[] {
  if (apples.length >= r.target) return apples;
  const { cols } = r.shape;
  const taken = occupied(r, apples);
  keepClear(r, taken, atDeal);
  let free = 0;
  for (let c = 0; c < taken.length; c++) free += 1 - taken[c];
  const out = apples.slice();
  while (out.length < r.target && free > 0) {
    // The k-th free cell, k uniform: one draw per apple, whatever the board.
    let k = Math.floor(rng() * free);
    let c = 0;
    for (; c < taken.length; c++) if (!taken[c] && k-- === 0) break;
    taken[c] = 1;
    free--;
    out.push({ x: c % cols, y: Math.floor(c / cols) });
  }
  return out;
}

/**
 * The bell, or the last snake standing - or, with two people playing, the
 * moment neither of them is left: the bots finishing the round between
 * themselves is nothing anyone at the keyboard is playing.
 */
function finish(r: Round): Round {
  const alive = r.snakes.filter((s) => s.alive);
  const peopleGone = r.humans > 1 && !alive.some((s) => s.id < r.humans);
  if (alive.length > 1 && r.tick < r.ticks && !peopleGone) return r;
  if (alive.length === 0) return { ...r, over: true, winner: null };
  const best = alive.slice().sort((a, b) => b.body.length - a.body.length || a.grewAt - b.grewAt || a.id - b.id)[0];
  return { ...r, over: true, winner: best.id };
}

/**
 * Every snake's id, best first. The winner leads once there is one; everyone
 * else is ordered by the longest they got, so a snake that went out long keeps
 * its place over one still crawling about short. On a tie the one still alive
 * is ahead, then the one that went out later, then the lower id.
 */
export function standing(r: Round): number[] {
  const order = r.snakes.slice().sort(
    (a, b) =>
      b.peak - a.peak ||
      Number(b.alive) - Number(a.alive) ||
      b.outAt - a.outAt ||
      a.grewAt - b.grewAt ||
      a.id - b.id,
  );
  const ids = order.map((s) => s.id);
  if (r.winner === null) return ids;
  return [r.winner, ...ids.filter((id) => id !== r.winner)];
}

/** 1-based place of snake `id` in `standing`. */
export function placeOf(r: Round, id: number): number {
  return standing(r).indexOf(id) + 1;
}

/** Whole seconds left on the clock, rounded up so the bell rings at 0:00. */
export function secondsLeft(r: Round): number {
  return Math.max(0, Math.ceil(((r.ticks - r.tick) * r.stepMs) / 1000));
}
