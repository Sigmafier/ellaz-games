// Chess — the official rules, whole, as a pure module.
//
// THIS FILE IMPORTS NOTHING. Not the DOM, not Phaser, not React, not a sibling
// in this repo. The rules of chess do not depend on anything we wrote, so the
// module that holds them runs in node and every clause in it is testable
// without a browser. `logic.test.ts` beside it is the gate.
//
// BOARD LAYOUT: 64 entries, index 0 = a8 and index 63 = h1 — FEN's own reading
// order, so parsing and printing a FEN is a straight walk with no flip. From an
// index, `file = i & 7` (0 = a) and `rank = i >> 3` where rank 0 is the EIGHTH
// rank. That is why "forward" for WHITE is a DECREASING rank index, which reads
// backwards once and then never bites again.
//
// The one design decision worth stating: a move is legal iff, after it is made,
// the mover's king is not attacked. There is no pin table and no special case
// for the en-passant-discovers-check position, because there is nothing for a
// special case to get wrong — we make the move and look.

export type Color = "w" | "b";
export type Piece = "p" | "n" | "b" | "r" | "q" | "k";

export interface Position {
  /** 64 squares, index 0 = a8 .. 63 = h1. `"wp"`, `"bk"`, or null. */
  board: (string | null)[];
  turn: Color;
  /** A subset of "KQkq"; "" when nobody may castle. */
  castling: string;
  /** The square a pawn LANDS on when capturing en passant, or null. */
  ep: number | null;
  halfmove: number;
  fullmove: number;
}

export interface Move {
  from: number;
  to: number;
  /** Set on all four promotion moves; absent otherwise. */
  promo?: "n" | "b" | "r" | "q";
  /** The piece this move removes. For en passant it is NOT on `to`. */
  captured?: string | null;
  /** Which side the king travels toward, when this move is a castle. */
  castle?: "K" | "Q";
  /** True when the capture is en passant. */
  ep?: boolean;
  /** True on a two-square pawn push — it is what sets the next ep square. */
  double?: boolean;
}

export type Outcome =
  | { kind: "playing" }
  | { kind: "checkmate"; winner: Color }
  | { kind: "stalemate" }
  | { kind: "draw"; why: "fifty" | "repetition" | "material" };

const FILES = "abcdefgh";
const file = (i: number) => i & 7;
const rank = (i: number) => i >> 3;
const other = (c: Color): Color => (c === "w" ? "b" : "w");

// Step by (df, dr) in FILE/RANK space and return -1 off the edge. Doing it here
// rather than by adding 7/9/15/17 to an index is the whole reason a knight on
// h1 cannot appear on a3 — index arithmetic wraps round the edge in silence.
function step(sq: number, df: number, dr: number): number {
  const f = file(sq) + df;
  const r = rank(sq) + dr;
  if (f < 0 || f > 7 || r < 0 || r > 7) return -1;
  return r * 8 + f;
}

// The first FOUR are orthogonal and the last four diagonal; `attacked()` leans
// on that split to know whether a rook or a bishop can be looking down a ray.
const ORTHO: readonly (readonly [number, number])[] = [[1, 0], [-1, 0], [0, 1], [0, -1]];
const DIAG: readonly (readonly [number, number])[] = [[1, 1], [1, -1], [-1, 1], [-1, -1]];
const EIGHT = [...ORTHO, ...DIAG];
const KNIGHT: readonly (readonly [number, number])[] = [
  [1, 2], [2, 1], [2, -1], [1, -2], [-1, -2], [-2, -1], [-2, 1], [-1, 2],
];

// Rook home squares and the castling right each one carries. A right is lost
// when the rook MOVES and equally when it is CAPTURED where it stands — that
// second clause is the one perft catches and hand-testing never does.
const ROOK_HOMES: readonly (readonly [number, string])[] = [
  [56, "Q"], [63, "K"], [0, "q"], [7, "k"],
];

export function squareIndex(name: string): number {
  return FILES.indexOf(name[0]) + (8 - Number(name[1])) * 8;
}
export function squareName(i: number): string {
  return FILES[file(i)] + String(8 - rank(i));
}

export function startPosition(): Position {
  return fromFen("rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1");
}

export function fromFen(fen: string): Position {
  const [rows, turn, castling, ep, half, full] = fen.trim().split(/\s+/);
  const board: (string | null)[] = new Array(64).fill(null);
  let i = 0;
  for (const ch of rows) {
    if (ch === "/") continue;
    if (ch >= "1" && ch <= "8") {
      i += Number(ch);
      continue;
    }
    const lower = ch.toLowerCase();
    board[i++] = (ch === lower ? "b" : "w") + lower;
  }
  return {
    board,
    turn: turn === "b" ? "b" : "w",
    castling: !castling || castling === "-" ? "" : castling,
    ep: ep && ep !== "-" ? squareIndex(ep) : null,
    halfmove: half ? Number(half) : 0,
    fullmove: full ? Number(full) : 1,
  };
}

export function toFen(p: Position): string {
  let rows = "";
  for (let r = 0; r < 8; r++) {
    let empty = 0;
    let row = "";
    for (let f = 0; f < 8; f++) {
      const pc = p.board[r * 8 + f];
      if (!pc) {
        empty++;
        continue;
      }
      if (empty) {
        row += empty;
        empty = 0;
      }
      row += pc[0] === "w" ? pc[1].toUpperCase() : pc[1];
    }
    if (empty) row += empty;
    rows += (r ? "/" : "") + row;
  }
  return [
    rows,
    p.turn,
    p.castling || "-",
    p.ep === null ? "-" : squareName(p.ep),
    p.halfmove,
    p.fullmove,
  ].join(" ");
}

/**
 * The first four fields of the FEN — board, turn, castling rights, en passant.
 * The two clocks are dropped on purpose: two positions that differ only in how
 * long since the last capture ARE the same position for repetition, and the
 * rights are kept because a king that walked away and came back has NOT
 * repeated anything.
 */
export function positionKey(p: Position): string {
  return toFen(p).split(" ").slice(0, 4).join(" ");
}

function kingSquare(b: (string | null)[], c: Color): number {
  const k = c + "k";
  for (let i = 0; i < 64; i++) if (b[i] === k) return i;
  return -1;
}

/** Is `sq` attacked by any piece of colour `by`? Walked outward FROM the square
 *  rather than by generating every enemy move, because this runs once per
 *  candidate move and the ray walk is a few dozen steps. */
function attacked(b: (string | null)[], sq: number, by: Color): boolean {
  // Pawns. A WHITE pawn attacking `sq` stands one rank BELOW it (dr +1 here,
  // since rank 0 is the eighth rank), diagonally either side.
  const pawnDr = by === "w" ? 1 : -1;
  const pawn = by + "p";
  for (const df of [-1, 1]) {
    const s = step(sq, df, pawnDr);
    if (s >= 0 && b[s] === pawn) return true;
  }
  const knight = by + "n";
  for (const [df, dr] of KNIGHT) {
    const s = step(sq, df, dr);
    if (s >= 0 && b[s] === knight) return true;
  }
  const king = by + "k";
  for (const [df, dr] of EIGHT) {
    const s = step(sq, df, dr);
    if (s >= 0 && b[s] === king) return true;
  }
  for (let d = 0; d < 8; d++) {
    const [df, dr] = EIGHT[d];
    const slider = d < 4 ? "r" : "b"; // EIGHT is ORTHO first, then DIAG
    let s = step(sq, df, dr);
    while (s >= 0) {
      const pc = b[s];
      if (pc) {
        if (pc[0] === by && (pc[1] === slider || pc[1] === "q")) return true;
        break; // the first piece on the ray blocks everything behind it
      }
      s = step(s, df, dr);
    }
  }
  return false;
}

/** Is `c` (the side to move, unless told otherwise) in check right now? */
export function isCheck(p: Position, c: Color = p.turn): boolean {
  const k = kingSquare(p.board, c);
  return k >= 0 && attacked(p.board, k, other(c));
}

function addPawn(out: Move[], from: number, to: number, captured: string | null, last: boolean) {
  if (!last) {
    out.push({ from, to, captured });
    return;
  }
  // All four are separate moves. Underpromotion is a real choice a player makes,
  // and skipping it costs exactly 3 moves per promotion square. Measured
  // 2026-09-21 by building the queen-only arm and re-running the whole perft
  // suite: position 4 went 264 -> 228 at depth 2 and 9467 -> 8087 at depth 3,
  // position 5 went 44 -> 41 at depth 1 — while startpos and position 3 were
  // UNCHANGED to depth 4, so a perft suite of startpos alone cannot see this.
  for (const promo of ["q", "r", "b", "n"] as const) out.push({ from, to, captured, promo });
}

function pawnMoves(p: Position, i: number, out: Move[]) {
  const b = p.board;
  const us = p.turn;
  const dr = us === "w" ? -1 : 1; // forward, in rank-index terms
  const home = us === "w" ? 6 : 1;
  const last = us === "w" ? 0 : 7;
  const one = step(i, 0, dr);
  if (one >= 0 && !b[one]) {
    addPawn(out, i, one, null, rank(one) === last);
    if (rank(i) === home) {
      const two = step(i, 0, dr * 2);
      // The square in between must be empty too — `one` above proved it is.
      if (two >= 0 && !b[two]) out.push({ from: i, to: two, captured: null, double: true });
    }
  }
  for (const df of [-1, 1]) {
    const s = step(i, df, dr);
    if (s < 0) continue;
    const tgt = b[s];
    if (tgt) {
      if (tgt[0] !== us) addPawn(out, i, s, tgt, rank(s) === last);
    } else if (s === p.ep) {
      // The captured pawn is NOT on `to`; `captured` records what leaves the
      // board, and the two make/unmake sites below know where it stood.
      out.push({ from: i, to: s, captured: other(us) + "p", ep: true });
    }
  }
}

function castleMoves(p: Position, out: Move[]) {
  const b = p.board;
  const us = p.turn;
  const them = other(us);
  const home = us === "w" ? 60 : 4; // e1 / e8
  if (b[home] !== us + "k") return;
  // Castling OUT of check is refused. Checked once here rather than per side.
  if (attacked(b, home, them)) return;
  const [kSide, qSide] = us === "w" ? ["K", "Q"] : ["k", "q"];
  // The right itself stands in for "the rook is still home and has not moved" —
  // applyMove clears it the moment that rook moves or is captured.
  if (
    p.castling.includes(kSide) &&
    !b[home + 1] &&
    !b[home + 2] &&
    !attacked(b, home + 1, them) && // THROUGH an attacked square
    !attacked(b, home + 2, them) // and INTO one
  ) {
    out.push({ from: home, to: home + 2, captured: null, castle: "K" });
  }
  if (
    p.castling.includes(qSide) &&
    !b[home - 1] &&
    !b[home - 2] &&
    !b[home - 3] && // b1/b8 must be empty even though the king never stands there
    !attacked(b, home - 1, them) &&
    !attacked(b, home - 2, them)
  ) {
    out.push({ from: home, to: home - 2, captured: null, castle: "Q" });
  }
}

/** Every move the pieces can make, ignoring whether it leaves the king en prise. */
function pseudoMoves(p: Position): Move[] {
  const out: Move[] = [];
  const b = p.board;
  const us = p.turn;
  for (let i = 0; i < 64; i++) {
    const pc = b[i];
    if (!pc || pc[0] !== us) continue;
    const kind = pc[1];
    if (kind === "p") {
      pawnMoves(p, i, out);
      continue;
    }
    if (kind === "n" || kind === "k") {
      for (const [df, dr] of kind === "n" ? KNIGHT : EIGHT) {
        const s = step(i, df, dr);
        if (s < 0) continue;
        const tgt = b[s];
        if (tgt && tgt[0] === us) continue;
        out.push({ from: i, to: s, captured: tgt });
      }
      continue;
    }
    for (const [df, dr] of kind === "r" ? ORTHO : kind === "b" ? DIAG : EIGHT) {
      let s = step(i, df, dr);
      while (s >= 0) {
        const tgt = b[s];
        if (tgt && tgt[0] === us) break;
        out.push({ from: i, to: s, captured: tgt });
        if (tgt) break;
        s = step(s, df, dr);
      }
    }
  }
  castleMoves(p, out);
  return out;
}

/** Where the pawn a capture removes actually STANDS. For en passant that is a
 *  rank behind the landing square; for everything else it is the square itself. */
function captureSquare(m: Move, us: Color): number {
  return m.ep ? (us === "w" ? m.to + 8 : m.to - 8) : m.to;
}

/**
 * FULLY legal moves: the mover's king is not attacked afterwards.
 *
 * Each candidate is played on ONE scratch board and taken back, rather than
 * building a fresh Position per candidate. That is an allocation decision, not
 * a correctness one — the answer is identical and `applyMove` below stays pure.
 */
export function legalMoves(p: Position, forcingOnly = false): Move[] {
  const us = p.turn;
  const them = other(us);
  const b = p.board.slice();
  const home = kingSquare(b, us); // only a king move can change this
  const out: Move[] = [];
  for (const m of pseudoMoves(p)) {
    // FORCING ONLY: captures, en passant and promotions, for a search that has
    // run out of depth and still needs to know whether the material on the
    // board is about to change. The filter sits HERE, before the king-safety
    // check, because that check is this function's whole cost - filtering the
    // returned list instead pays for every quiet move and then throws it away.
    // `legalMoves(p, true)` is pinned equal to the filtered full list by a
    // test, so this can never quietly become a different move generator.
    if (forcingOnly && !m.captured && !m.promo) continue;
    const moved = b[m.from] as string;
    const capSq = captureSquare(m, us);
    const capPc = b[capSq];
    b[m.from] = null;
    b[capSq] = null; // for en passant this clears a DIFFERENT square than `to`
    b[m.to] = m.promo ? us + m.promo : moved;
    let rookFrom = -1;
    let rookTo = -1;
    if (m.castle) {
      rookFrom = m.castle === "K" ? m.to + 1 : m.to - 2;
      rookTo = m.castle === "K" ? m.to - 1 : m.to + 1;
      b[rookTo] = b[rookFrom];
      b[rookFrom] = null;
    }
    const king = moved[1] === "k" ? m.to : home;
    if (king < 0 || !attacked(b, king, them)) out.push(m);
    if (rookFrom >= 0) {
      b[rookFrom] = b[rookTo];
      b[rookTo] = null;
    }
    b[m.to] = null; // clear FIRST — on a normal capture `capSq === to`
    b[capSq] = capPc;
    b[m.from] = moved;
  }
  return out;
}

/** Play a move. PURE: `p` is never touched and a new Position comes back. */
export function applyMove(p: Position, m: Move): Position {
  const b = p.board.slice();
  const us = p.turn;
  const moved = b[m.from] as string;
  const capSq = captureSquare(m, us);
  const captured = b[capSq];
  b[m.from] = null;
  b[capSq] = null;
  b[m.to] = m.promo ? us + m.promo : moved;
  if (m.castle) {
    const rookFrom = m.castle === "K" ? m.to + 1 : m.to - 2;
    const rookTo = m.castle === "K" ? m.to - 1 : m.to + 1;
    b[rookTo] = b[rookFrom];
    b[rookFrom] = null;
  }
  let castling = p.castling;
  const drop = (rights: string) => {
    castling = castling
      .split("")
      .filter((c) => !rights.includes(c))
      .join("");
  };
  if (moved[1] === "k") drop(us === "w" ? "KQ" : "kq");
  // `m.to` matters as much as `m.from`: a rook captured on h1 has not moved and
  // still costs white the kingside right.
  for (const [sq, right] of ROOK_HOMES) if (m.from === sq || m.to === sq) drop(right);
  return {
    board: b,
    turn: other(us),
    castling,
    // The square the pawn skipped over — exactly halfway between from and to.
    ep: m.double ? (m.from + m.to) / 2 : null,
    halfmove: moved[1] === "p" || captured ? 0 : p.halfmove + 1,
    fullmove: us === "b" ? p.fullmove + 1 : p.fullmove,
  };
}

/** Light or dark? Used only to tell same-colour bishops apart. */
function squareColor(i: number): number {
  return (file(i) + rank(i)) & 1;
}

/**
 * The four positions in which checkmate is IMPOSSIBLE for either side: K v K,
 * K+B v K, K+N v K, and K+B v K+B with both bishops on one colour. Two knights
 * against a lone king is deliberately NOT here — mate cannot be forced, but it
 * can be reached, so the game is still on.
 */
function insufficientMaterial(b: (string | null)[]): boolean {
  const w: number[] = [];
  const bl: number[] = [];
  for (let i = 0; i < 64; i++) {
    const pc = b[i];
    if (!pc || pc[1] === "k") continue;
    if (pc[1] === "p" || pc[1] === "r" || pc[1] === "q") return false;
    (pc[0] === "w" ? w : bl).push(i);
  }
  if (w.length + bl.length <= 1) return true; // bare kings, or one minor piece
  if (w.length === 1 && bl.length === 1 && b[w[0]]![1] === "b" && b[bl[0]]![1] === "b") {
    return squareColor(w[0]) === squareColor(bl[0]);
  }
  return false;
}

/**
 * Where the game stands.
 *
 * `history` is a list of `positionKey()` values — a position does not know its
 * own past, so the caller keeps the list. Whether the CURRENT position is
 * already the last entry or not is tolerated either way, because both calling
 * habits are reasonable and getting it wrong would move a draw by one move.
 */
export function outcome(p: Position, history: string[] = []): Outcome {
  const moves = legalMoves(p);
  // Mate and stalemate outrank every clock: a position with no legal move is
  // over whatever the fifty-move counter says.
  if (moves.length === 0) {
    return isCheck(p) ? { kind: "checkmate", winner: other(p.turn) } : { kind: "stalemate" };
  }
  if (insufficientMaterial(p.board)) return { kind: "draw", why: "material" };
  if (p.halfmove >= 100) return { kind: "draw", why: "fifty" };
  const key = positionKey(p);
  const seen = history.filter((k) => k === key).length;
  const total = history.length && history[history.length - 1] === key ? seen : seen + 1;
  if (total >= 3) return { kind: "draw", why: "repetition" };
  return { kind: "playing" };
}

/** The move as a move list shows it: "e4", "Nbd2", "exd8=N", "O-O", "Qh4#". */
export function moveToSan(p: Position, m: Move): string {
  const pc = p.board[m.from] as string;
  let san: string;
  if (m.castle) {
    san = m.castle === "K" ? "O-O" : "O-O-O";
  } else if (pc[1] === "p") {
    // A pawn names its file only when it captures — including en passant.
    san =
      (m.captured ? FILES[file(m.from)] + "x" : "") +
      squareName(m.to) +
      (m.promo ? "=" + m.promo.toUpperCase() : "");
  } else {
    // Disambiguation is the half that bites: file if it is enough, else rank,
    // else the whole square. "Enough" is judged against the LEGAL rivals, so a
    // pinned twin does not force a letter nobody needs.
    const rivals = legalMoves(p).filter(
      (o) => o.to === m.to && o.from !== m.from && p.board[o.from] === pc,
    );
    let dis = "";
    if (rivals.length) {
      const sameFile = rivals.some((o) => file(o.from) === file(m.from));
      const sameRank = rivals.some((o) => rank(o.from) === rank(m.from));
      dis = !sameFile
        ? FILES[file(m.from)]
        : !sameRank
          ? String(8 - rank(m.from))
          : squareName(m.from);
    }
    san = pc[1].toUpperCase() + dis + (m.captured ? "x" : "") + squareName(m.to);
  }
  const next = applyMove(p, m);
  if (isCheck(next)) san += legalMoves(next).length ? "+" : "#";
  return san;
}

/**
 * What each piece is worth, in the pawns every chess book counts in. The king
 * is 0 because it is never taken - the game ends first.
 */
export const PIECE_VALUE: Readonly<Record<Piece, number>> = { p: 1, n: 3, b: 3, r: 5, q: 9, k: 0 };

/** Smallest first, and a knight before a bishop at the same value - the order
 *  every chess site lays a row of taken pieces out in. */
const TAKE_ORDER: readonly Piece[] = ["p", "n", "b", "r", "q"];

export interface Captures {
  /** The pieces WHITE has taken - so these are black pieces - smallest first. */
  w: Piece[];
  /** The pieces BLACK has taken - white pieces - smallest first. */
  b: Piece[];
  /** Who is ahead on the board, and by how many pawns; null when level. */
  lead: { side: Color; by: number } | null;
}

function countOf(board: (string | null)[], color: Color): Record<string, number> {
  const n: Record<string, number> = {};
  for (const pc of board) if (pc && pc[0] === color) n[pc[1]] = (n[pc[1]] ?? 0) + 1;
  return n;
}

function material(board: (string | null)[], color: Color): number {
  let sum = 0;
  for (const pc of board) if (pc && pc[0] === color) sum += PIECE_VALUE[pc[1] as Piece];
  return sum;
}

/**
 * Who ate whom, read off the game itself: the list of positions, start first,
 * one per ply - which is exactly what the game keeps and saves.
 *
 * Each step is one move by `prev.turn`, and the only way a piece of the OTHER
 * colour can leave the board is by being taken on that move. So the taken piece
 * is whatever the opponent has fewer of afterwards. That is exact for en
 * passant (the pawn is not on the landing square) and for a capture that
 * promotes (the mover's pieces change, the victim's do not), and it needs no
 * move list - a game restored from its saved positions has no Move objects.
 *
 * Taking a move back or starting again shortens the list, so the rows follow
 * with nothing to clear.
 *
 * The LEAD is measured on the board, not summed from the rows: a pawn that
 * promoted is a queen now, and a row of what was taken cannot know that.
 */
export function captures(positions: readonly Position[]): Captures {
  const taken: Record<Color, Piece[]> = { w: [], b: [] };
  for (let i = 1; i < positions.length; i++) {
    const prev = positions[i - 1];
    const mover = prev.turn;
    const before = countOf(prev.board, other(mover));
    const after = countOf(positions[i].board, other(mover));
    for (const kind of TAKE_ORDER) {
      for (let k = after[kind] ?? 0; k < (before[kind] ?? 0); k++) taken[mover].push(kind);
    }
  }
  const order = (p: Piece) => TAKE_ORDER.indexOf(p);
  taken.w.sort((a, b) => order(a) - order(b));
  taken.b.sort((a, b) => order(a) - order(b));
  const last = positions[positions.length - 1];
  const diff = last ? material(last.board, "w") - material(last.board, "b") : 0;
  return {
    w: taken.w,
    b: taken.b,
    lead: diff === 0 ? null : { side: diff > 0 ? "w" : "b", by: Math.abs(diff) },
  };
}
