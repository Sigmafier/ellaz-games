// Backgammon — the rules, and nothing else.
//
// PURE: no DOM, no React, no Phaser, no storage, no clock, and NO IMPORTS AT
// ALL. Everything here is a function from a position to a position, with the
// only randomness injected as an `rng` argument, so the whole of "what may I
// play and what is it worth" is unit-testable in node.
//
// WHY THE TURN IS GENERATED WHOLE, NOT A MOVE AT A TIME
// Three of the four rules every implementation gets wrong cannot be decided
// from a single move:
//
//   - both dice must be played if ANY complete sequence plays both, so a move
//     that is legal in isolation is illegal when taking it throws the other
//     die away;
//   - when only one die can be played it must be the HIGHER one, which is a
//     statement about the set of one-move sequences, not about a move;
//   - a man on the bar makes every other move illegal, which is a property of
//     the position at each step of the sequence rather than of the turn.
//
// So `legalTurns` enumerates every COMPLETE sequence, keeps the longest ones,
// and the UI asks `legalFrom` which points may still be tapped. A renderer
// that walked one move at a time would need to re-derive all of this and would
// get it wrong; there is deliberately no `legalMoves(board, side, die)` export.
//
// GEOMETRY. Points are 1..24 in `points`, positive = that many WHITE men,
// negative = that many BLACK men. White moves 24 -> 1, black moves 1 -> 24. The
// two ends of the track are numbered rather than special-cased:
//
//        white:  bar = 25   ...  points 24 .. 1  ...  off = 0
//        black:  bar = 0    ...  points 1 .. 24  ...  off = 25
//
// which makes every move the same arithmetic — `to = from - sign * die` — for
// an entry from the bar, an ordinary move and a bear-off alike. Indices 0 and
// 25 of `points` exist so the array can be indexed without a bounds branch;
// they are never read or written, because every access is guarded by the side.
//
// WHAT IS DELIBERATELY ABSENT
//   - No bot, no evaluation, no equity. A rules core must not have an opinion
//     about which legal play is good.
//   - No board mutation anywhere. `applyMove` returns a new board; the same
//     discipline the rest of this repo's logic modules keep.
//   - No `direction` or `points` parameter on anything a game reports. A caller
//     says what happened (a double was passed, fifteen men are off) and this
//     module alone decides what it is worth — the same shape as `economy.ts`
//     and `score.ts`.

/** White moves 24 -> 1. Black moves 1 -> 24. */
export type Side = "w" | "b";

export interface Board {
  /** Index 1..24. `+n` = n white men, `-n` = n black men. 0 and 25 are unused. */
  points: number[];
  bar: { w: number; b: number };
  off: { w: number; b: number };
}

/**
 * One man, one die. `from`/`to` are track numbers in the scheme above, so a
 * bar entry is `from === BAR[side]` and a bear-off is `to === OFF[side]`.
 * `hit` is set when the move sends a lone enemy man to the bar.
 */
export interface Move {
  from: number;
  to: number;
  die: number;
  hit?: boolean;
}

/**
 * THERE IS NO DOUBLING CUBE, and with it goes the Crawford rule, which exists
 * only to shut a cube. Removed 2026-09-22 on the operator's instruction,
 * looking at the live game: "remove the double thing". A game is worth 1, 2 or
 * 3 points and nothing multiplies it.
 *
 * Removed rather than hidden. A cube behind a flag nothing sets is a lever with
 * no caller: every reader of this module would still have to reason about
 * ownership, the Crawford flag and a stake that can double, and the renderer
 * would still carry the branches. The rules this file keeps are the rules the
 * game has.
 */
export interface Match {
  target: number;
  score: { w: number; b: number };
}

export interface Game {
  board: Board;
  turn: Side;
  /** The dice still to play this turn. Empty means "not rolled yet". */
  dice: number[];
  match: Match;
  /** Set when the game has finished. */
  over?: { winner: Side; points: number };
}

/** 1 normal, 2 gammon, 3 backgammon. */
export interface GameResult {
  winner: Side;
  points: 1 | 2 | 3;
}

/** Where each side's men wait when they are hit. */
export const BAR: Record<Side, number> = { w: 25, b: 0 };
/** Where each side's men go when they are borne off. */
export const OFF: Record<Side, number> = { w: 0, b: 25 };

const SIGN: Record<Side, 1 | -1> = { w: 1, b: -1 };

export function opponent(side: Side): Side {
  return side === "w" ? "b" : "w";
}

/** How far a man on `point` still has to travel. White: the point. Black: its mirror. */
export function pipOf(side: Side, point: number): number {
  return side === "w" ? point : 25 - point;
}

export function startBoard(): Board {
  const points = Array<number>(26).fill(0);
  points[24] = 2;
  points[13] = 5;
  points[8] = 3;
  points[6] = 5;
  points[1] = -2;
  points[12] = -5;
  points[17] = -3;
  points[19] = -5;
  return { points, bar: { w: 0, b: 0 }, off: { w: 0, b: 0 } };
}

export function startGame(target = 5, opener: Side = "w"): Game {
  return {
    board: startBoard(),
    turn: opener,
    dice: [],
    match: { target, score: { w: 0, b: 0 } },
  };
}

/**
 * The next game of the same match. The board is fresh; the SCORE carries over,
 * because it is a fact about the match rather than about a game.
 */
export function nextGame(g: Game, opener: Side): Game {
  return {
    board: startBoard(),
    turn: opener,
    dice: [],
    match: { ...g.match, score: { ...g.match.score } },
  };
}

/**
 * Two dice, or FOUR of the same number on a double. The four are returned as
 * four entries rather than a flag, so every consumer counts remaining dice the
 * same way and nothing has to remember that doubles are special.
 */
export function roll(rng: () => number = Math.random): number[] {
  const a = 1 + Math.floor(rng() * 6);
  const b = 1 + Math.floor(rng() * 6);
  return a === b ? [a, a, a, a] : [a, b];
}

/** Distance to bear every man off, men on the bar counting the full 25. */
export function pipCount(board: Board, side: Side): number {
  let pips = board.bar[side] * 25;
  for (let p = 1; p <= 24; p++) {
    const men = board.points[p] * SIGN[side];
    if (men > 0) pips += men * pipOf(side, p);
  }
  return pips;
}

/** No man on the bar and none outside the six-point home board. */
function allHome(board: Board, side: Side): boolean {
  if (board.bar[side] > 0) return false;
  for (let p = 1; p <= 24; p++) {
    if (board.points[p] * SIGN[side] > 0 && pipOf(side, p) > 6) return false;
  }
  return true;
}

/**
 * Apply one move. PURE — the board handed in is never touched.
 *
 * It does NOT re-check legality: legality lives in `movesWith`, which is the
 * only thing that constructs a `Move`, and a second copy of the rules here
 * would be a second copy to keep in sync. Hand it a move you did not generate
 * and you get a board that the rules cannot explain.
 */
export function applyMove(board: Board, side: Side, m: Move): Board {
  const sign = SIGN[side];
  const next: Board = {
    points: board.points.slice(),
    bar: { ...board.bar },
    off: { ...board.off },
  };
  if (m.from === BAR[side]) next.bar[side] -= 1;
  else next.points[m.from] -= sign;

  if (m.to === OFF[side]) {
    next.off[side] += 1;
    return next;
  }
  // A lone enemy man on the landing point goes to the bar. Two or more is a
  // made point and `movesWith` would never have offered the move.
  if (next.points[m.to] === -sign) {
    next.points[m.to] = 0;
    next.bar[opponent(side)] += 1;
  }
  next.points[m.to] += sign;
  return next;
}

/**
 * Every single move this side could make with ONE die, from this position.
 * Internal: a caller given this would have to re-derive both-dice and
 * higher-die itself, which is the mistake this module exists to prevent.
 */
function movesWith(board: Board, side: Side, die: number): Move[] {
  const sign = SIGN[side];
  const out: Move[] = [];
  const open = (to: number) => board.points[to] * sign >= -1;
  const hits = (to: number) => board.points[to] === -sign;

  // Rule 4: while a man waits on the bar, entering is the ONLY legal move.
  // White enters on 25 minus the die, black on the die — both of which fall
  // out of the same arithmetic as every other move.
  if (board.bar[side] > 0) {
    const to = BAR[side] - sign * die;
    if (open(to)) out.push({ from: BAR[side], to, die, hit: hits(to) });
    return out;
  }

  const home = allHome(board, side);
  // The furthest man from home, used for the "higher die from a lower point"
  // rule below. Only meaningful once everything is home.
  let furthest = 0;
  if (home) {
    for (let p = 1; p <= 24; p++) {
      if (board.points[p] * sign > 0) furthest = Math.max(furthest, pipOf(side, p));
    }
  }

  for (let from = 1; from <= 24; from++) {
    if (board.points[from] * sign <= 0) continue;
    const to = from - sign * die;
    if (to >= 1 && to <= 24) {
      if (open(to)) out.push({ from, to, die, hit: hits(to) });
      continue;
    }
    // Past the end of the track: a bear-off, and only once every man is home.
    if (!home) continue;
    const pip = pipOf(side, from);
    // An exact roll always bears off. A HIGHER die bears off only when nothing
    // sits further back — `pip === furthest` is exactly that, since this point
    // holds a man and so cannot be beyond the furthest one.
    if (die === pip || (die > pip && pip === furthest)) {
      out.push({ from, to: OFF[side], die });
    }
  }
  return out;
}

interface Line {
  moves: Move[];
  board: Board;
}

/**
 * Every complete sequence playable from here, in every die order. A sequence
 * is "complete" when no further die can be played, so a short line in the
 * result is a genuine dead end rather than a caller stopping early.
 */
function explore(board: Board, side: Side, dice: number[]): Line[] {
  const out: Line[] = [];
  const tried = new Set<number>();
  for (let i = 0; i < dice.length; i++) {
    const die = dice[i];
    // Doubles hand us four identical dice; spending the first is the same as
    // spending the third, so only one occurrence of each value is explored.
    if (tried.has(die)) continue;
    tried.add(die);
    const rest = dice.slice(0, i).concat(dice.slice(i + 1));
    for (const m of movesWith(board, side, die)) {
      const after = applyMove(board, side, m);
      const tails = explore(after, side, rest);
      if (tails.length === 0) out.push({ moves: [m], board: after });
      else for (const t of tails) out.push({ moves: [m, ...t.moves], board: t.board });
    }
  }
  return out;
}

/**
 * The sequences a player is actually ALLOWED to choose between: the longest
 * ones, plus the higher-die rule when only one die can be played.
 */
function maximalLines(board: Board, side: Side, dice: number[]): Line[] {
  const all = explore(board, side, dice);
  if (all.length === 0) return [];

  // Rule 1. Keeping only the longest is what makes a move that is legal on its
  // own illegal when it wastes the other die.
  let longest = 0;
  for (const l of all) longest = Math.max(longest, l.moves.length);
  let lines = all.filter((l) => l.moves.length === longest);

  // Rule 2. Only ever bites on a non-double where exactly one die can be
  // played; on a double both dice are the same number, so there is nothing to
  // choose. If the higher die is not playable alone, the lower one stands.
  if (longest === 1 && dice.length === 2 && dice[0] !== dice[1]) {
    const higher = Math.max(dice[0], dice[1]);
    const withHigher = lines.filter((l) => l.moves[0].die === higher);
    if (withHigher.length > 0) lines = withHigher;
  }
  return lines;
}

function boardKey(b: Board): string {
  return `${b.points.join(",")}|${b.bar.w},${b.bar.b}|${b.off.w},${b.off.b}`;
}

function samePlay(a: Move, b: Move): boolean {
  return a.from === b.from && a.to === b.to && a.die === b.die;
}

/**
 * EVERY complete legal turn, as whole sequences — never a move at a time.
 * Returns `[]` when the side is completely blocked, which is a legal turn of
 * no moves and not an error.
 *
 * Sequences reaching the same POSITION are collapsed to one, because two
 * orders of the same two moves are one play to a player even though they are
 * two paths to the engine.
 */
export function legalTurns(board: Board, side: Side, dice: number[]): Move[][] {
  const seen = new Set<string>();
  const out: Move[][] = [];
  for (const line of maximalLines(board, side, dice)) {
    const key = boardKey(line.board);
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(line.moves);
  }
  return out;
}

/**
 * Which points a tap may pick up from next, given the moves already made this
 * turn. Derived from the MAXIMAL sequences, so a point whose only move would
 * waste a die is never offered — the both-dice rule expressed as a UI, rather
 * than as an error message after the fact.
 */
export function legalFrom(board: Board, side: Side, dice: number[], played: Move[]): number[] {
  const froms = new Set<number>();
  for (const line of maximalLines(board, side, dice)) {
    if (line.moves.length <= played.length) continue;
    let follows = true;
    for (let i = 0; i < played.length; i++) {
      if (!samePlay(line.moves[i], played[i])) {
        follows = false;
        break;
      }
    }
    if (follows) froms.add(line.moves[played.length].from);
  }
  return [...froms].sort((a, b) => a - b);
}

/**
 * The moves a tap on `from` may actually make next, as whole `Move`s.
 *
 * The pair of `legalFrom`, and it exists so a RENDERER never has to work out a
 * destination for itself. A board that decides where a checker may land is a
 * second copy of the both-dice rule, the bar rule and the bear-off rule, and
 * the day it disagrees with this file is the day a player is told a legal move
 * is illegal - with both copies looking correct.
 *
 * Derived from the same MAXIMAL sequences as `legalFrom`, so a destination
 * whose only continuation would waste a die is never offered. One entry per
 * destination: two dice can reach the same point (an exact bear-off and an
 * overshooting one), and to a player that is one place to tap.
 */
export function legalPlays(
  board: Board,
  side: Side,
  dice: number[],
  played: Move[],
  from: number,
): Move[] {
  const byTo = new Map<number, Move>();
  for (const line of maximalLines(board, side, dice)) {
    if (line.moves.length <= played.length) continue;
    let follows = true;
    for (let i = 0; i < played.length; i++) {
      if (!samePlay(line.moves[i], played[i])) {
        follows = false;
        break;
      }
    }
    if (!follows) continue;
    const next = line.moves[played.length];
    if (next.from === from && !byTo.has(next.to)) byTo.set(next.to, next);
  }
  return [...byTo.values()].sort((a, b) => a.to - b.to);
}

/**
 * Who won and by how much, or null while the game is still on.
 *
 *   1  normal
 *   2  gammon        — the loser bore off none
 *   3  backgammon    — and still has a man on the bar or in the winner's home
 *
 * This is what the GAME is worth; `applyGameResult` alone turns it into match
 * points.
 */
export function gameResult(board: Board): GameResult | null {
  const winner: Side | null = board.off.w === 15 ? "w" : board.off.b === 15 ? "b" : null;
  if (!winner) return null;
  const loser = opponent(winner);
  if (board.off[loser] > 0) return { winner, points: 1 };
  if (board.bar[loser] > 0) return { winner, points: 3 };
  for (let p = 1; p <= 24; p++) {
    // `pipOf(winner, p) <= 6` is "p is in the WINNER's home board" — 1..6 for
    // white, 19..24 for black — without naming either range twice.
    if (board.points[p] * SIGN[loser] > 0 && pipOf(winner, p) <= 6) return { winner, points: 3 };
  }
  return { winner, points: 2 };
}

export function matchOver(g: Game): Side | null {
  if (g.match.score.w >= g.match.target) return "w";
  if (g.match.score.b >= g.match.target) return "b";
  return null;
}

/** Close the game out: award the points to the winner. */
function finishGame(g: Game, winner: Side, points: number): Game {
  const score = { ...g.match.score };
  score[winner] += points;
  return {
    ...g,
    dice: [],
    over: { winner, points },
    match: { target: g.match.target, score },
  };
}

/** Score a game that was played out: 1, 2 or 3 points. */
export function applyGameResult(g: Game, result: GameResult): Game {
  return finishGame(g, result.winner, result.points);
}
