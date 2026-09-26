// How the computer plays chess. Search and judgement only - it knows no rules
// of its own and asks `logic.ts` for every legal thing it considers.
//
// PURE, and it imports exactly one module: the rules beside it. That direction
// is one-way and load-bearing. `logic.ts` must never import this file, because
// the rules have to be testable without an opinion about what is GOOD - the
// whole perft argument for trusting them depends on them being separable.
//
// WHAT IS DELIBERATELY ABSENT
//   - No opening book. A book is a table of somebody else's games, it is bytes
//     in a first visit that has 12 of them spare, and the openings it would
//     play are exactly the ones a beginner learns nothing from.
//   - No transposition table. It is the obvious next speedup and it is also a
//     Map that grows for the whole sitting. The budget below makes it
//     unnecessary at the depths a phone reaches.
//   - No Web Worker. A worker is a new chunk - a dynamic import, a named
//     `manualChunks` branch, a matching `globIgnores` entry - and the precache
//     glob sweeps `**/*.js`. The wall-clock budget does the same job.
//   - No endgame tablebase, no network, ever.

import {
  applyMove,
  isCheck,
  legalMoves,
  positionKey,
  type Color,
  type Move,
  type Position,
} from "./logic";

export type Level = "easy" | "normal" | "hard";

/**
 * Centipawns. The classical values, with the bishop a shade above the knight so
 * the engine keeps the pair without any code that knows what "the pair" is.
 */
const VALUE: Record<string, number> = { p: 100, n: 320, b: 330, r: 500, q: 900, k: 0 };

/** A mate score, kept far below Infinity so `MATE - ply` stays comparable. */
const MATE = 100_000;

/**
 * Where each piece likes to stand, in centipawns, written from WHITE's side.
 *
 * Index 0 is a8 and index 63 is h1 - the board's own layout, so a white table
 * needs no transform and a black one is the same table read at `i ^ 56`, which
 * flips the rank and leaves the file alone.
 *
 * These are the widely published "simplified evaluation" tables. They are not
 * tuned, and nothing here pretends they are: they exist so the engine develops
 * its pieces and puts pawns in the middle instead of shuffling a rook.
 */
// prettier-ignore
const PST: Record<string, number[]> = {
  p: [
      0,  0,  0,  0,  0,  0,  0,  0,
     50, 50, 50, 50, 50, 50, 50, 50,
     10, 10, 20, 30, 30, 20, 10, 10,
      5,  5, 10, 25, 25, 10,  5,  5,
      0,  0,  0, 20, 20,  0,  0,  0,
      5, -5,-10,  0,  0,-10, -5,  5,
      5, 10, 10,-20,-20, 10, 10,  5,
      0,  0,  0,  0,  0,  0,  0,  0,
  ],
  n: [
    -50,-40,-30,-30,-30,-30,-40,-50,
    -40,-20,  0,  0,  0,  0,-20,-40,
    -30,  0, 10, 15, 15, 10,  0,-30,
    -30,  5, 15, 20, 20, 15,  5,-30,
    -30,  0, 15, 20, 20, 15,  0,-30,
    -30,  5, 10, 15, 15, 10,  5,-30,
    -40,-20,  0,  5,  5,  0,-20,-40,
    -50,-40,-30,-30,-30,-30,-40,-50,
  ],
  b: [
    -20,-10,-10,-10,-10,-10,-10,-20,
    -10,  0,  0,  0,  0,  0,  0,-10,
    -10,  0,  5, 10, 10,  5,  0,-10,
    -10,  5,  5, 10, 10,  5,  5,-10,
    -10,  0, 10, 10, 10, 10,  0,-10,
    -10, 10, 10, 10, 10, 10, 10,-10,
    -10,  5,  0,  0,  0,  0,  5,-10,
    -20,-10,-10,-10,-10,-10,-10,-20,
  ],
  r: [
      0,  0,  0,  0,  0,  0,  0,  0,
      5, 10, 10, 10, 10, 10, 10,  5,
     -5,  0,  0,  0,  0,  0,  0, -5,
     -5,  0,  0,  0,  0,  0,  0, -5,
     -5,  0,  0,  0,  0,  0,  0, -5,
     -5,  0,  0,  0,  0,  0,  0, -5,
     -5,  0,  0,  0,  0,  0,  0, -5,
      0,  0,  0,  5,  5,  0,  0,  0,
  ],
  q: [
    -20,-10,-10, -5, -5,-10,-10,-20,
    -10,  0,  0,  0,  0,  0,  0,-10,
    -10,  0,  5,  5,  5,  5,  0,-10,
     -5,  0,  5,  5,  5,  5,  0, -5,
      0,  0,  5,  5,  5,  5,  0, -5,
    -10,  5,  5,  5,  5,  5,  0,-10,
    -10,  0,  5,  0,  0,  0,  0,-10,
    -20,-10,-10, -5, -5,-10,-10,-20,
  ],
  // The king has two: one for a board with queens on it, where he belongs
  // behind pawns, and one for an endgame, where the same square is a mistake
  // and he has to walk to the middle. `evaluate` blends them by material.
  k: [
    -30,-40,-40,-50,-50,-40,-40,-30,
    -30,-40,-40,-50,-50,-40,-40,-30,
    -30,-40,-40,-50,-50,-40,-40,-30,
    -30,-40,-40,-50,-50,-40,-40,-30,
    -20,-30,-30,-40,-40,-30,-30,-20,
    -10,-20,-20,-20,-20,-20,-20,-10,
     20, 20,  0,  0,  0, 20, 20, 20,
     20, 30, 10,  0,  0, 10, 30, 20,
  ],
  K: [
    -50,-40,-30,-20,-20,-30,-40,-50,
    -30,-20,-10,  0,  0,-10,-20,-30,
    -30,-10, 20, 30, 30, 20,-10,-30,
    -30,-10, 30, 40, 40, 30,-10,-30,
    -30,-10, 30, 40, 40, 30,-10,-30,
    -30,-10, 20, 30, 30, 20,-10,-30,
    -30,-30,  0,  0,  0,  0,-30,-30,
    -50,-30,-30,-30,-30,-30,-30,-50,
  ],
};

/**
 * How good this position is for `side`, in centipawns. Positive is winning.
 *
 * ZERO-SUM BY CONSTRUCTION: one walk of the board, each piece added for its
 * owner and subtracted for the other, so `evaluate(p, "w") === -evaluate(p, "b")`
 * is a property of the shape and not of the numbers. A test pins it anyway.
 */
export function evaluate(p: Position, side: Color): number {
  let score = 0;
  // Non-pawn material left ON BOTH SIDES decides which king table applies. Two
  // rooks' worth (1000) is the usual line between "middlegame" and "endgame",
  // and it is a blend rather than a switch so the king's value does not jump
  // by 70 centipawns the instant a queen comes off.
  let heavy = 0;
  for (let i = 0; i < 64; i++) {
    const pc = p.board[i];
    if (pc && pc[1] !== "p" && pc[1] !== "k") heavy += VALUE[pc[1]];
  }
  const endgame = Math.max(0, Math.min(1, (2000 - heavy) / 2000));

  for (let i = 0; i < 64; i++) {
    const pc = p.board[i];
    if (!pc) continue;
    const white = pc[0] === "w";
    const sq = white ? i : i ^ 56; // flip the rank, keep the file
    const kind = pc[1];
    let v = VALUE[kind];
    if (kind === "k") v += PST.k[sq] * (1 - endgame) + PST.K[sq] * endgame;
    else v += PST[kind][sq];
    score += white ? v : -v;
  }
  return side === "w" ? score : -score;
}

/**
 * Order moves so alpha-beta has something to cut against.
 *
 * Captures first, most-valuable-victim least-valuable-attacker, then
 * promotions. Nothing clever, and it is worth roughly a whole ply: an unordered
 * search at depth 4 visits an order of magnitude more nodes than this one.
 */
function order(p: Position, moves: Move[]): Move[] {
  const key = (m: Move): number => {
    let k = 0;
    if (m.captured) k += 10 * VALUE[m.captured[1]] - VALUE[(p.board[m.from] as string)[1]];
    if (m.ep) k += 10 * VALUE.p - VALUE.p;
    if (m.promo) k += VALUE[m.promo];
    return k;
  };
  return moves
    .map((m, i) => ({ m, i, k: key(m) }))
    // Ties break on the ORIGINAL index, so a level that claims to be
    // deterministic is deterministic and a sort is not asked to be stable.
    .sort((a, b) => b.k - a.k || a.i - b.i)
    .map((x) => x.m);
}

interface Ctx {
  nodes: number;
  deadline: number;
  now: () => number;
  /** Set once the clock runs out; every score above it is untrustworthy. */
  out: boolean;
}

/**
 * Captures only, until the position is quiet.
 *
 * Without this the engine happily plays a move whose whole point is that the
 * recapture happens one ply past the horizon - it takes a defended pawn with a
 * queen and reports itself a pawn up. Quiescence is the difference between an
 * engine that plays badly and one that plays nonsense.
 */
function quiesce(p: Position, alpha: number, beta: number, c: Ctx, depth: number): number {
  c.nodes++;
  const side = p.turn;
  const stand = evaluate(p, side);
  if (stand >= beta) return beta;
  if (stand > alpha) alpha = stand;
  // A hard floor, because a long forcing sequence can keep finding captures.
  if (depth <= 0) return alpha;
  if ((c.nodes & 1023) === 0 && c.now() > c.deadline) {
    c.out = true;
    return alpha;
  }

  for (const m of order(p, legalMoves(p, true))) {
    const v = -quiesce(applyMove(p, m), -beta, -alpha, c, depth - 1);
    if (v >= beta) return beta;
    if (v > alpha) alpha = v;
  }
  return alpha;
}

/** Negamax with alpha-beta. `ply` is the distance from the root, for mate scores. */
function search(p: Position, depth: number, alpha: number, beta: number, c: Ctx, ply: number): number {
  if ((c.nodes & 1023) === 0 && c.now() > c.deadline) {
    c.out = true;
    return alpha;
  }
  c.nodes++;

  const moves = legalMoves(p);
  if (moves.length === 0) {
    // MATE - ply, not MATE: a mate in one must score higher than a mate in
    // three, or the engine finds a forced mate and then wanders around inside
    // it forever because every continuation looks equally winning.
    return isCheck(p) ? -(MATE - ply) : 0;
  }
  // The fifty-move and insufficient-material draws are the rules' business and
  // the halfmove clock is the one the search can see cheaply.
  if (p.halfmove >= 100) return 0;
  if (depth <= 0) return quiesce(p, alpha, beta, c, 8);

  // One ply back for a side in check. It is the cheapest extension there is and
  // it is the one that stops the search reporting a "safe" position whose next
  // move is forced and losing.
  //
  // NO TEST PINS THIS, and that is stated rather than hidden: a mutation
  // setting it to 0 leaves all 19 cells green (2026-09-21). It is not dead
  // code - measured over 26 positions the same day, 8 of them play a DIFFERENT
  // move with it off - but "a different move" is not "a wrong move", and
  // nothing here can call one better without a strength measurement this file
  // does not have. Judgement, deliberately kept, honestly unproven.
  const extend = isCheck(p) ? 1 : 0;

  for (const m of order(p, moves)) {
    const v = -search(applyMove(p, m), depth - 1 + extend, -beta, -alpha, c, ply + 1);
    if (v >= beta) return beta;
    if (v > alpha) alpha = v;
  }
  return alpha;
}

export interface Thought<T = Move> {
  move: T;
  /** The deepest ply COMPLETED. A level that ran out of clock reports the last whole one. */
  depth: number;
  nodes: number;
  ms: number;
  /** Centipawns, from the mover's side. Positive is winning. */
  score: number;
}

export interface ThinkOptions {
  /** Every position seen this game, as `positionKey()` values. Drives the repetition sense below. */
  history?: string[];
  /** Hard wall clock for `hard`. The other levels are bounded by their depth. */
  budgetMs?: number;
  rng?: () => number;
  now?: () => number;
}

/**
 * How far each level looks, and how wrong it is allowed to be.
 *
 * `slack` is the whole of "easy". It does not play a random move - a random
 * move hangs a queen on move three and the game is over before a child has
 * done anything - it plays any move within that many centipawns of the best
 * one it can see at depth 1. So it takes free pieces, misses tactics, and
 * leaves things hanging, which is what playing a person who is learning
 * actually feels like.
 */
const LEVELS: Record<Level, { depth: number; slack: number; budget: number }> = {
  easy: { depth: 1, slack: 150, budget: 60 },
  normal: { depth: 2, slack: 0, budget: 250 },
  hard: { depth: 64, slack: 0, budget: 300 },
};

// WHY NORMAL IS DEPTH 2 AND NOT 3, measured 2026-09-21.
//
// Hard reaches depth 3, and sometimes 4, inside its budget on a real midgame
// position - this generator costs about 37us a call and the whole search is
// bounded by it. So a normal of 3 made the two levels play the SAME MOVE from
// most positions, and a ladder whose top two rungs are the same rung is a
// label, not a difficulty.
//
// Depth 2 is not weak. Quiescence runs at every leaf, so normal still never
// hangs a piece and still punishes every piece that is hung at it; what it
// loses is the two-move idea, which is exactly the thing "hard" should own.
//
// HARD'S BUDGET IS 300ms AND `opponent.ts`'s BEAT IS 420ms. That is not a
// coincidence and it is worth keeping: the search finishes inside the pause
// every level already takes, so hard never feels slower than easy - it just
// plays better.

/**
 * Pick a move, and say what it cost to find it.
 *
 * Returns `null` when there is no legal move - checkmate or stalemate is the
 * rules' answer, not an error, and a caller that asks anyway gets a clear
 * nothing rather than a thrown exception on a board the player can still see.
 *
 * `rng` defaults to `Math.random` and is LAST in its options object, this
 * repo's law, so every level is reproducible in a test.
 */
export function think(p: Position, level: Level, opts: ThinkOptions = {}): Thought | null {
  const { history = [], rng = Math.random, now = () => Date.now() } = opts;
  const cfg = LEVELS[level];
  const started = now();
  const c: Ctx = {
    nodes: 0,
    now,
    deadline: started + (opts.budgetMs ?? cfg.budget),
    out: false,
  };

  const moves = legalMoves(p);
  if (moves.length === 0) return null;

  // REPETITION, at the root and nowhere else.
  //
  // A position this game has already seen twice is a draw if it happens again,
  // so it is worth 0 whatever the pieces say. Scoring it here rather than in
  // the search is the cheap 90%: it stops the engine shuffling a rook back and
  // forth while a rook up, and it lets a losing engine steer INTO the draw,
  // which is the correct play and the one a beginner learns from.
  const repeats = new Map<Move, number>();
  for (const m of moves) {
    const key = positionKey(applyMove(p, m));
    repeats.set(m, history.filter((k) => k === key).length);
  }

  let ordered = order(p, moves);
  let best: { move: Move; score: number } = { move: ordered[0], score: -Infinity };
  let scored: { move: Move; score: number }[] = [];
  let reached = 0;

  // ITERATIVE DEEPENING. Each pass is cheap relative to the next, so the cost
  // of the discarded ones is small - and it is what makes a wall clock usable
  // at all: whenever the budget runs out there is always a COMPLETE shallower
  // answer to fall back on, rather than half of a deep one.
  for (let depth = 1; depth <= cfg.depth; depth++) {
    const pass: { move: Move; score: number }[] = [];
    let alpha = -Infinity;
    for (const m of ordered) {
      const after = applyMove(p, m);
      // Twice already means a third is the draw itself.
      const score = (repeats.get(m) ?? 0) >= 2 ? 0 : -search(after, depth - 1, -Infinity, -alpha, c, 1);
      pass.push({ move: m, score });
      if (score > alpha) alpha = score;
      if (c.out) break;
    }
    if (c.out) {
      // A pass cut short by the clock is not an opinion - half its moves were
      // never looked at, and the best of a prefix is not the best of the list.
      // So it is thrown away and the last WHOLE pass stands.
      //
      // Unless there is no whole pass. Then the prefix is all there is, and a
      // move that was actually searched beats `ordered[0]`, which is only the
      // best-looking capture. The last entry goes too: the clock may have run
      // out INSIDE its search, so its score is a number from a truncated tree.
      const seen = pass.slice(0, -1);
      if (reached === 0 && seen.length) best = seen.reduce((a, b) => (b.score > a.score ? b : a));
      break;
    }
    scored = pass;
    reached = depth;
    best = pass.reduce((a, b) => (b.score > a.score ? b : a));

    // Feed this pass's ranking into the next one. This is what makes iterative
    // deepening pay for itself rather than merely cost: alpha-beta cuts in
    // proportion to how early the best move is tried, and a shallow pass is a
    // far better guess at that than "captures first". Measured 2026-09-21 on
    // the position after 1.e4 e5 2.Nf3 Nc6 3.Bc4 Nf6, 300ms budget:
    // depth 2 without it, depth 4 with it. A mutation removing it also leaves
    // the suite green - its only claim is DEPTH, and a depth figure belongs to
    // the machine that measured it, so no cell asserts one.
    ordered = pass
      .map((s, i) => ({ ...s, i }))
      .sort((a, b) => b.score - a.score || a.i - b.i)
      .map((s) => s.move);
    // Nothing deeper can improve on a forced mate, and searching for one anyway
    // is how an engine spends its whole budget after the game is decided.
    if (best.score >= MATE - 100) break;
  }

  // The slack is applied to the LAST COMPLETE pass, so easy is a player who
  // looked once and chose loosely - not a player who was interrupted.
  let move = best.move;
  if (cfg.slack > 0 && scored.length) {
    const pool = scored.filter((s) => s.score >= best.score - cfg.slack);
    move = pool[Math.min(pool.length - 1, Math.floor(rng() * pool.length))].move;
  }

  return {
    move,
    depth: reached,
    nodes: c.nodes,
    ms: now() - started,
    score: scored.find((s) => s.move === move)?.score ?? best.score,
  };
}

/** The move alone, for a caller that does not want to know what it cost. */
export function chooseMove(p: Position, level: Level, opts: ThinkOptions = {}): Move | null {
  return think(p, level, opts)?.move ?? null;
}
