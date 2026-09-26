// How the computer plays backgammon. Search and judgement only - it knows no
// rules of its own and asks `logic.ts` for every legal thing it considers.
//
// PURE, and it imports exactly one module: the rules beside it. That direction
// is one-way and load-bearing. `logic.ts` must never import this file, because
// the rules have to be testable without an opinion about what is GOOD, and the
// whole perft-shaped argument for trusting them depends on them being
// separable. Same split chess uses, one directory over.
//
// THIS IS A HEURISTIC AND NOT EQUITY, and that sentence is here rather than in
// a commit message because the difference matters to anyone who reads a number
// this file produces. A real backgammon engine rolls out positions thousands of
// times, or consults a neural net trained on millions of games. This one adds
// up things that are usually true - be ahead on the count, do not leave men
// alone, make points, get off the bar - with weights nobody has tuned against
// anything. It plays a decent social game. It is not a reference, and no
// number it returns should ever be quoted as one.
//
// WHAT IS DELIBERATELY ABSENT
//   - No rollouts, no neural net, no opening book. Each is a research project
//     and none of them is what a child or a parent wants from this page.
//   - No Web Worker. The search is bounded by construction (see LEVELS), so it
//     never needs one, and a worker would be a new chunk in a first visit that
//     has 12 bytes of headroom.

import {
  BAR,
  OFF,
  applyMove,
  legalTurns,
  opponent,
  pipCount,
  type Board,
  type Move,
  type Side,
} from "./logic";

export type Level = "easy" | "normal" | "hard";

/**
 * The weights. Every one of them is a judgement, and the units are PIPS - so
 * "a man on the bar is worth about eight pips of trouble" is the sentence each
 * line is making. Pips are the natural unit because the pip count is the one
 * term here that is not a guess.
 */
const W = {
  /** A man borne off is worth more than the pips it saved: it can never be hit. */
  off: 6,
  /** Per man left alone where the opponent can reach him. Scaled by how easily. */
  blot: 4,
  /** Per point held by two or more, higher in your own home board. */
  point: 2,
  /** Per point of a connected wall in front of the opponent's back men. */
  homePoint: 3,
};

/**
 * How many candidate turns each level looks at, and how deeply.
 *
 * The cap is what bounds the search instead of a clock. A turn from an ordinary
 * position has fewer than 20 complete sequences and doubles can reach a few
 * hundred, so hard's 1-ply reply search over 21 dice combinations is bounded at
 * roughly 12 x 21 x 20 evaluations - tens of thousands of cheap array sums, and
 * measured in single-digit milliseconds. That is why this engine needs no
 * time budget and no worker, unlike the chess one.
 */
const LEVELS: Record<Level, { candidates: number; ply: 0 | 1 }> = {
  easy: { candidates: 0, ply: 0 }, // 0 = do not judge at all, pick at random
  normal: { candidates: 1, ply: 0 },
  hard: { candidates: 12, ply: 1 },
};

/** The 21 distinct dice combinations, with their weight out of 36. */
const COMBOS: { dice: number[]; weight: number }[] = (() => {
  const out: { dice: number[]; weight: number }[] = [];
  for (let a = 1; a <= 6; a++) {
    for (let b = a; b <= 6; b++) {
      out.push({ dice: a === b ? [a, a, a, a] : [a, b], weight: a === b ? 1 : 2 });
    }
  }
  return out;
})();

/** One side's standing, in pips-of-goodness. Never called directly - see `evaluate`. */
function standing(board: Board, side: Side): number {
  const sign = side === "w" ? 1 : -1;
  const foe = opponent(side);
  let score = -pipCount(board, side);
  score += board.off[side] * W.off;
  // NO SEPARATE BAR PENALTY. There was one, worth 8 pips, and a planted
  // mutation removing it left all 13 tests green - because `pipCount` already
  // charges a man on the bar 25 pips, the maximum distance on the board, so
  // the extra term was decoration that read as judgement. Measured 2026-09-21.

  for (let p = 1; p <= 24; p++) {
    const men = board.points[p] * sign;
    if (men === 1) {
      // A blot matters in proportion to how easily it is reached. A man the
      // opponent needs a 3 for is in far more danger than one needing a 12.
      const gap = Math.abs(p - (foe === "w" ? BAR.w : BAR.b));
      const reach = Math.max(1, Math.min(12, gap));
      score -= W.blot * (1 + (12 - reach) / 12);
    } else if (men >= 2) {
      // Home board is points 1..6 for white, 19..24 for black.
      const home = side === "w" ? p <= 6 : p >= 19;
      score += home ? W.homePoint : W.point;
    }
  }
  return score;
}

/**
 * How good this board is for `side`, in pips. Positive is winning.
 *
 * ZERO-SUM BY CONSTRUCTION: it is one side's standing minus the other's, so
 * `evaluate(b, "w") === -evaluate(b, "b")` is a property of the shape rather
 * than of the weights, and it cannot drift when a weight is edited. A test
 * pins it anyway, because that is the kind of claim that stops being true
 * quietly.
 */
export function evaluate(board: Board, side: Side): number {
  return standing(board, side) - standing(board, opponent(side));
}

function after(board: Board, side: Side, turn: Move[]): Board {
  let out = board;
  for (const m of turn) out = applyMove(out, side, m);
  return out;
}

/**
 * The opponent's best answer to this board, averaged over every roll they
 * could make. This is the whole of "hard": it is not thinking further ahead
 * than normal so much as asking what the dice are likely to do to it, which is
 * the question a backgammon position actually turns on.
 */
function replyValue(board: Board, side: Side): number {
  const foe = opponent(side);
  let total = 0;
  let weight = 0;
  for (const { dice, weight: w } of COMBOS) {
    const replies = legalTurns(board, foe, dice);
    let best = evaluate(board, side); // they may have nothing to play
    for (const r of replies) {
      const v = evaluate(after(board, foe, r), side);
      if (v < best) best = v; // the opponent picks the worst outcome for us
    }
    total += best * w;
    weight += w;
  }
  return weight === 0 ? evaluate(board, side) : total / weight;
}

/**
 * Pick a turn. Returns `[]` when the dice are dead, which is a legal outcome in
 * backgammon and not an error - a blocked player forfeits the roll.
 *
 * `rng` is last and defaults to `Math.random`, this repo's law for anything
 * with a random component, so every level is reproducible in a test.
 */
export function chooseTurn(
  board: Board,
  side: Side,
  dice: number[],
  level: Level,
  rng: () => number = Math.random,
): Move[] {
  const turns = legalTurns(board, side, dice);
  if (turns.length === 0) return [];
  if (turns.length === 1) return turns[0];

  const cfg = LEVELS[level];
  if (cfg.candidates === 0) {
    // Easy does not judge at all. It is not a weakened strong player - it is a
    // player who has not looked, which is what a beginner is playing against
    // when they beat it, and it will still find a forced good move because the
    // rules already removed the bad ones.
    return turns[Math.min(turns.length - 1, Math.floor(rng() * turns.length))];
  }

  // Rank every legal turn by the board it leaves. Ties break on the EARLIER
  // turn so a level that claims to be deterministic is deterministic.
  const ranked = turns
    .map((turn) => ({ turn, board: after(board, side, turn) }))
    .map((c, i) => ({ ...c, i, score: evaluate(c.board, side) }))
    .sort((a, b) => b.score - a.score || a.i - b.i);

  if (cfg.ply === 0) return ranked[0].turn;

  let best = ranked[0];
  let bestValue = -Infinity;
  for (const c of ranked.slice(0, cfg.candidates)) {
    const v = replyValue(c.board, side);
    if (v > bestValue) {
      bestValue = v;
      best = c;
    }
  }
  return best.turn;
}

/** Re-exported so a renderer needs one import for "what does the computer do". */
export { OFF, BAR };
