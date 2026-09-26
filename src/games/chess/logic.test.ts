import { describe, it, expect } from "vitest";
import {
  startPosition,
  fromFen,
  toFen,
  legalMoves,
  applyMove,
  isCheck,
  outcome,
  positionKey,
  moveToSan,
  type Position,
  type Move,
} from "./logic";

// ---------------------------------------------------------------------------
// Test instruments. PERFT lives HERE and not in logic.ts: counting the leaves of
// the legal-move tree is not a rule of chess, it is how we prove the rules are
// right. A game module that carries its own grader can be green about itself.
// ---------------------------------------------------------------------------

function perft(p: Position, depth: number): number {
  if (depth === 0) return 1;
  const moves = legalMoves(p);
  if (depth === 1) return moves.length; // the leaves ARE the legal moves
  let n = 0;
  for (const m of moves) n += perft(applyMove(p, m), depth - 1);
  return n;
}

// "e2" -> 12. Index 0 is a8 and 63 is h1, FEN's own reading order.
function sq(name: string): number {
  return "abcdefgh".indexOf(name[0]) + (8 - Number(name[1])) * 8;
}
function name(i: number): string {
  return "abcdefgh"[i & 7] + String(8 - (i >> 3));
}

// Find one legal move by its coordinates, e.g. "e2e4" or "a7a8q". Throws rather
// than returning undefined: a test that silently plays nothing reads as a pass.
function find(p: Position, uci: string): Move {
  const from = sq(uci.slice(0, 2));
  const to = sq(uci.slice(2, 4));
  const promo = uci[4];
  const m = legalMoves(p).find(
    (x) => x.from === from && x.to === to && (promo ? x.promo === promo : !x.promo),
  );
  if (!m) throw new Error(`${uci} is not legal in ${toFen(p)}`);
  return m;
}
function play(p: Position, ...ucis: string[]): Position {
  return ucis.reduce((pos, u) => applyMove(pos, find(pos, u)), p);
}
function targets(p: Position, from: string): string[] {
  return legalMoves(p)
    .filter((m) => m.from === sq(from))
    .map((m) => name(m.to) + (m.promo ?? ""))
    .sort();
}

const START = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";

// ---------------------------------------------------------------------------
// PERFT — the gate. These numbers are exact; off by one means the generator is
// wrong somewhere, and the named tests below say WHERE.
// ---------------------------------------------------------------------------

describe("perft", () => {
  it("startpos to depth 4", () => {
    const p = startPosition();
    expect(toFen(p)).toBe(START);
    expect(perft(p, 1)).toBe(20);
    expect(perft(p, 2)).toBe(400);
    expect(perft(p, 3)).toBe(8902);
    expect(perft(p, 4)).toBe(197281);
  }, 60000);

  it("Kiwipete to depth 3 — castling, pins and a crowded middlegame", () => {
    const p = fromFen("r3k2r/p1ppqpb1/bn2pnp1/3PN3/1p2P3/2N2Q1p/PPPBBPPP/R3K2R w KQkq - 0 1");
    expect(perft(p, 1)).toBe(48);
    expect(perft(p, 2)).toBe(2039);
    expect(perft(p, 3)).toBe(97862);
  }, 60000);

  it("position 3 to depth 4 — the en-passant discovered-check endgame", () => {
    const p = fromFen("8/2p5/3p4/KP5r/1R3p1k/8/4P1P1/8 w - - 0 1");
    expect(perft(p, 1)).toBe(14);
    expect(perft(p, 2)).toBe(191);
    expect(perft(p, 3)).toBe(2812);
    expect(perft(p, 4)).toBe(43238);
  }, 60000);

  it("position 4 to depth 3 — promotions under check", () => {
    const p = fromFen("r3k2r/Pppp1ppp/1b3nbN/nP6/BBP1P3/q4N2/Pp1P2PP/R2Q1RK1 w kq - 0 1");
    expect(perft(p, 1)).toBe(6);
    expect(perft(p, 2)).toBe(264);
    expect(perft(p, 3)).toBe(9467);
  }, 60000);

  it("position 5 to depth 3 — castling rights lost by capture", () => {
    const p = fromFen("rnbq1k1r/pp1Pbppp/2p5/8/2B5/8/PPP1NnPP/RNBQK2R w KQ - 1 8");
    expect(perft(p, 1)).toBe(44);
    expect(perft(p, 2)).toBe(1486);
    expect(perft(p, 3)).toBe(62379);
  }, 60000);
});

// ---------------------------------------------------------------------------
// FEN
// ---------------------------------------------------------------------------

describe("fen", () => {
  it("round-trips every perft position byte for byte", () => {
    for (const fen of [
      START,
      "r3k2r/p1ppqpb1/bn2pnp1/3PN3/1p2P3/2N2Q1p/PPPBBPPP/R3K2R w KQkq - 0 1",
      "8/2p5/3p4/KP5r/1R3p1k/8/4P1P1/8 w - - 0 1",
      "r3k2r/Pppp1ppp/1b3nbN/nP6/BBP1P3/q4N2/Pp1P2PP/R2Q1RK1 w kq - 0 1",
      "rnbq1k1r/pp1Pbppp/2p5/8/2B5/8/PPP1NnPP/RNBQK2R w KQ - 1 8",
    ]) {
      expect(toFen(fromFen(fen))).toBe(fen);
    }
  });

  it("names the en passant square, and clears it on the next move", () => {
    const p = play(startPosition(), "e2e4");
    expect(toFen(p)).toBe("rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq e3 0 1");
    expect(toFen(play(p, "b8c6"))).toBe(
      "r1bqkbnr/pppppppp/2n5/8/4P3/8/PPPP1PPP/RNBQKBNR w KQkq - 1 2",
    );
  });

  it("counts the halfmove clock: reset by a pawn move or a capture", () => {
    const p = play(startPosition(), "g1f3", "g8f6", "f3g1");
    expect(p.halfmove).toBe(3);
    expect(play(p, "e7e5").halfmove).toBe(0); // pawn move
    const cap = play(fromFen("4k3/8/8/3q4/8/8/8/3QK3 w - - 9 40"), "d1d5");
    expect(cap.halfmove).toBe(0); // capture
  });

  it("positionKey drops the two clocks, so a repeat is recognisable", () => {
    const a = fromFen("4k3/8/8/8/8/8/8/4K3 w - - 0 1");
    const b = fromFen("4k3/8/8/8/8/8/8/4K3 w - - 77 99");
    expect(positionKey(a)).toBe(positionKey(b));
    expect(positionKey(a)).not.toContain("77");
  });
});

// ---------------------------------------------------------------------------
// CASTLING — every clause of the rule, each with a positive control on the SAME
// board, so a test that passes because nothing can castle at all is impossible.
// ---------------------------------------------------------------------------

describe("castling", () => {
  it("is offered on both sides when nothing is in the way", () => {
    const p = fromFen("4k3/8/8/8/8/8/8/R3K2R w KQ - 0 1");
    expect(targets(p, "e1")).toContain("g1");
    expect(targets(p, "e1")).toContain("c1");
  });

  it("moves the rook to the far side of the king", () => {
    const p = fromFen("4k3/8/8/8/8/8/8/R3K2R w KQ - 0 1");
    expect(toFen(play(p, "e1g1"))).toBe("4k3/8/8/8/8/8/8/R4RK1 b - - 1 1");
    expect(toFen(play(p, "e1c1"))).toBe("4k3/8/8/8/8/8/8/2KR3R b - - 1 1");
  });

  it("is refused THROUGH an attacked square — queenside still legal", () => {
    // Black rook on f8 rakes the f-file, so f1 is attacked but c1 and d1 are not.
    const p = fromFen("5r2/4k3/8/8/8/8/8/R3K2R w KQ - 0 1");
    expect(targets(p, "e1")).not.toContain("g1");
    expect(targets(p, "e1")).toContain("c1");
  });

  it("is refused INTO an attacked square — queenside still legal", () => {
    const p = fromFen("6r1/4k3/8/8/8/8/8/R3K2R w KQ - 0 1");
    expect(targets(p, "e1")).not.toContain("g1");
    expect(targets(p, "e1")).toContain("c1");
  });

  it("is refused OUT of check — both sides", () => {
    const p = fromFen("4rk2/8/8/8/8/8/8/R3K2R w KQ - 0 1");
    expect(isCheck(p)).toBe(true);
    expect(targets(p, "e1")).not.toContain("g1");
    expect(targets(p, "e1")).not.toContain("c1");
  });

  it("is refused across an occupied square, even an empty-looking b1", () => {
    expect(targets(fromFen("4k3/8/8/8/8/8/8/RN2K2R w KQ - 0 1"), "e1")).not.toContain("c1");
    expect(targets(fromFen("4k3/8/8/8/8/8/8/R3KB1R w KQ - 0 1"), "e1")).not.toContain("g1");
  });

  it("loses the right on that side when the rook moves", () => {
    const p = play(fromFen("4k3/8/8/8/8/8/8/R3K2R w KQ - 0 1"), "h1g1");
    expect(p.castling).toBe("Q");
    const back = play(p, "e8d8", "g1h1", "d8e8");
    expect(back.castling).toBe("Q"); // the right does NOT come back
    expect(targets(back, "e1")).not.toContain("g1");
    expect(targets(back, "e1")).toContain("c1");
  });

  it("loses both rights when the king moves", () => {
    expect(play(fromFen("4k3/8/8/8/8/8/8/R3K2R w KQ - 0 1"), "e1e2").castling).toBe("");
  });

  it("loses the right when the rook is CAPTURED on its home square", () => {
    // Black bishop takes on h1; white must lose "K" without ever moving a rook.
    const p = play(fromFen("4k3/8/8/8/8/8/6b1/R3K2R b KQ - 0 1"), "g2h1");
    expect(p.castling).toBe("Q");
  });
});

// ---------------------------------------------------------------------------
// EN PASSANT — including the one almost every implementation gets wrong.
// ---------------------------------------------------------------------------

describe("en passant", () => {
  it("is offered only on the move right after the double push", () => {
    const p = play(startPosition(), "e2e4", "a7a6", "e4e5", "d7d5");
    expect(p.ep).toBe(sq("d6"));
    expect(targets(p, "e5")).toContain("d6");
    const later = play(p, "a2a3", "a6a5");
    expect(later.ep).toBe(null);
    expect(targets(later, "e5")).not.toContain("d6");
  });

  it("removes the captured pawn from the square BESIDE the landing square", () => {
    const p = play(startPosition(), "e2e4", "a7a6", "e4e5", "d7d5", "e5d6");
    expect(toFen(p)).toBe("rnbqkbnr/1pp1pppp/p2P4/8/8/8/PPPP1PPP/RNBQKBNR b KQkq - 0 3");
  });

  it("is REFUSED when taking would expose the king along the rank", () => {
    // 8/8/8/8/k1p4R/8/3P4/4K3 — black king a4, black pawn c4, white rook h4.
    // After d2d4 the c4 pawn is offered d3 en passant, but taking vacates c4 AND
    // removes the d4 pawn, leaving the rook on h4 staring at the king on a4.
    const after = play(fromFen("8/8/8/8/k1p4R/8/3P4/4K3 w - - 0 1"), "d2d4");
    expect(after.ep).toBe(sq("d3"));
    expect(targets(after, "c4")).not.toContain("d3"); // the whole point
    expect(targets(after, "c4")).toContain("c3"); // but pushing is fine
  });

  it("allows the same capture once the rank is blocked", () => {
    // Positive control for the test above: one white pawn on f4 breaks the line,
    // so the identical en-passant capture becomes legal.
    const after = play(fromFen("8/8/8/8/k1p2P1R/8/3P4/4K3 w - - 0 1"), "d2d4");
    expect(targets(after, "c4")).toContain("d3");
  });

  it("is refused when the capturing pawn is pinned to its own file", () => {
    // Black king c8, white rook c1, black pawn c4 between them. Taking on d3
    // leaves the c-file and uncovers the king; pushing to c3 stays on it.
    const after = play(fromFen("2k5/8/8/8/2p5/8/3P4/2R1K3 w - - 0 1"), "d2d4");
    expect(after.ep).toBe(sq("d3"));
    expect(targets(after, "c4")).not.toContain("d3");
    expect(targets(after, "c4")).toContain("c3");
  });
});

// ---------------------------------------------------------------------------
// PROMOTION
// ---------------------------------------------------------------------------

describe("promotion", () => {
  it("generates all four pieces as separate moves", () => {
    const p = fromFen("8/4P3/8/8/8/8/8/4K2k w - - 0 1");
    expect(targets(p, "e7")).toEqual(["e8b", "e8n", "e8q", "e8r"]);
  });

  it("puts the chosen piece on the board", () => {
    const p = fromFen("8/4P3/8/8/8/8/8/4K2k w - - 0 1");
    expect(toFen(play(p, "e7e8n"))).toBe("4N3/8/8/8/8/8/8/4K2k b - - 0 1");
    expect(toFen(play(p, "e7e8q"))).toBe("4Q3/8/8/8/8/8/8/4K2k b - - 0 1");
  });

  it("promotes on a capture too — four more moves", () => {
    const p = fromFen("3r4/4P3/8/8/8/8/8/4K2k w - - 0 1");
    expect(targets(p, "e7")).toEqual([
      "d8b", "d8n", "d8q", "d8r",
      "e8b", "e8n", "e8q", "e8r",
    ]);
    expect(toFen(play(p, "e7d8r"))).toBe("3R4/8/8/8/8/8/8/4K2k b - - 0 1");
  });

  it("promotes for black on the first rank", () => {
    const p = fromFen("4k2K/8/8/8/8/8/4p3/8 b - - 0 1");
    expect(toFen(play(p, "e2e1q"))).toBe("4k2K/8/8/8/8/8/8/4q3 w - - 0 2");
  });
});

// ---------------------------------------------------------------------------
// OUTCOMES
// ---------------------------------------------------------------------------

describe("outcome", () => {
  it("is playing at the start", () => {
    expect(outcome(startPosition())).toEqual({ kind: "playing" });
  });

  it("sees checkmate — fool's mate, and names the winner", () => {
    const p = play(startPosition(), "f2f3", "e7e5", "g2g4", "d8h4");
    expect(isCheck(p)).toBe(true);
    expect(legalMoves(p).length).toBe(0);
    expect(outcome(p)).toEqual({ kind: "checkmate", winner: "b" });
  });

  it("sees stalemate — in check is what tells the two apart", () => {
    const p = fromFen("7k/5Q2/6K1/8/8/8/8/8 b - - 0 1");
    expect(isCheck(p)).toBe(false);
    expect(legalMoves(p).length).toBe(0);
    expect(outcome(p)).toEqual({ kind: "stalemate" });
  });

  it("declares the fifty-move draw at a hundred half-moves", () => {
    expect(outcome(fromFen("4k3/8/8/8/8/8/8/R3K3 w - - 99 60"))).toEqual({ kind: "playing" });
    expect(outcome(fromFen("4k3/8/8/8/8/8/8/R3K3 w - - 100 60"))).toEqual({
      kind: "draw",
      why: "fifty",
    });
  });

  it("does not call a mate a fifty-move draw", () => {
    // Mate outranks the clock: this is checkmate on the hundredth half-move.
    const p = fromFen("7k/7Q/6K1/8/8/8/8/8 b - - 100 60");
    expect(outcome(p)).toEqual({ kind: "checkmate", winner: "w" });
  });

  it("declares threefold repetition from the caller's history", () => {
    let p = startPosition();
    const history = [positionKey(p)];
    // The knights shuffle out and back, twice. The start position then occurs a
    // third time — nothing else about it has changed, so the keys match.
    for (const u of ["g1f3", "g8f6", "f3g1", "f6g8", "g1f3", "g8f6", "f3g1", "f6g8"]) {
      p = play(p, u);
      history.push(positionKey(p));
      if (history.length < 9) {
        expect(outcome(p, history).kind).not.toBe("draw");
      }
    }
    expect(outcome(p, history)).toEqual({ kind: "draw", why: "repetition" });
  });

  it("does not see repetition when the castling rights differ", () => {
    // The board can repeat while the POSITION does not: a king that has moved
    // and come back is not the same position, and the key must say so.
    const p = fromFen("4k3/8/8/8/8/8/8/R3K2R w KQ - 0 1");
    const back = play(p, "e1e2", "e8e7", "e2e1", "e7e8");
    expect(back.board).toEqual(p.board);
    expect(positionKey(back)).not.toBe(positionKey(p));
  });
});

// ---------------------------------------------------------------------------
// INSUFFICIENT MATERIAL — each case, plus the control that must NOT be a draw.
// ---------------------------------------------------------------------------

describe("insufficient material", () => {
  const draw = { kind: "draw", why: "material" };

  it("king against king", () => {
    expect(outcome(fromFen("4k3/8/8/8/8/8/8/4K3 w - - 0 1"))).toEqual(draw);
  });

  it("king and bishop against king, either colour", () => {
    expect(outcome(fromFen("4k3/8/8/8/8/8/8/2B1K3 w - - 0 1"))).toEqual(draw);
    expect(outcome(fromFen("2b1k3/8/8/8/8/8/8/4K3 w - - 0 1"))).toEqual(draw);
  });

  it("king and knight against king", () => {
    expect(outcome(fromFen("4k3/8/8/8/8/8/8/2N1K3 w - - 0 1"))).toEqual(draw);
  });

  it("bishop against bishop on the SAME colour squares", () => {
    // c1 and f8 are both dark squares.
    expect(outcome(fromFen("5b2/4k3/8/8/8/8/8/2B1K3 w - - 0 1"))).toEqual(draw);
  });

  it("bishop against bishop on OPPOSITE colours is still playing", () => {
    // c1 dark, c8 light. Mate needs help, but it is not forced-draw material.
    expect(outcome(fromFen("2b1k3/8/8/8/8/8/8/2B1K3 w - - 0 1"))).toEqual({ kind: "playing" });
  });

  it("two knights against a lone king is NOT a draw", () => {
    // The positive control: mate is possible here, so the rule must not fire.
    expect(outcome(fromFen("4k3/8/8/8/8/8/8/1NN1K3 w - - 0 1"))).toEqual({ kind: "playing" });
  });

  it("a single pawn, rook or queen is never insufficient", () => {
    expect(outcome(fromFen("4k3/8/8/8/8/8/4P3/4K3 w - - 0 1"))).toEqual({ kind: "playing" });
    expect(outcome(fromFen("4k3/8/8/8/8/8/8/R3K3 w - - 0 1"))).toEqual({ kind: "playing" });
    expect(outcome(fromFen("4k3/8/8/8/8/8/8/3QK3 w - - 0 1"))).toEqual({ kind: "playing" });
  });
});

// ---------------------------------------------------------------------------
// SAN — the move list a UI shows. Disambiguation is the part that bites.
// ---------------------------------------------------------------------------

describe("moveToSan", () => {
  it("writes pawn moves, piece moves and captures", () => {
    let p = startPosition();
    expect(moveToSan(p, find(p, "e2e4"))).toBe("e4");
    p = play(p, "e2e4");
    expect(moveToSan(p, find(p, "d7d5"))).toBe("d5");
    p = play(p, "d7d5");
    expect(moveToSan(p, find(p, "e4d5"))).toBe("exd5");
    expect(moveToSan(p, find(p, "g1f3"))).toBe("Nf3");
  });

  it("writes both castles", () => {
    const p = fromFen("4k3/8/8/8/8/8/8/R3K2R w KQ - 0 1");
    expect(moveToSan(p, find(p, "e1g1"))).toBe("O-O");
    expect(moveToSan(p, find(p, "e1c1"))).toBe("O-O-O");
  });

  it("disambiguates by file, then by rank, then by both", () => {
    // Two knights, different files and ranks -> the file letter is enough.
    const files = fromFen("4k3/8/8/8/8/5N2/8/1N2K3 w - - 0 1");
    expect(moveToSan(files, find(files, "b1d2"))).toBe("Nbd2");
    // Two rooks on the SAME file -> the file says nothing, so use the rank.
    const ranks = fromFen("4k3/8/8/8/R7/8/R7/4K3 w - - 0 1");
    expect(moveToSan(ranks, find(ranks, "a2a3"))).toBe("R2a3");
    // Three queens reach e1 from a5, e5 and a1. a5 shares its file with a1 and
    // its rank with e5, so neither half alone can name it: the whole square.
    // The black king is on c8 rather than e8 because the e5 queen would already
    // be checking an e8 king with white to move — an illegal position, and the
    // stray "+" on the answer is what said so.
    const both = fromFen("2k5/8/8/Q3Q3/8/8/8/Q6K w - - 0 1");
    expect(moveToSan(both, find(both, "a5e1"))).toBe("Qa5e1");
  });

  it("marks check with + and mate with #", () => {
    const check = fromFen("4k3/8/8/8/8/8/8/3QK3 w - - 0 1");
    expect(moveToSan(check, find(check, "d1d7"))).toBe("Qd7+");
    const mate = play(startPosition(), "f2f3", "e7e5", "g2g4");
    expect(moveToSan(mate, find(mate, "d8h4"))).toBe("Qh4#");
  });

  it("writes promotion and promotion-with-capture", () => {
    const p = fromFen("3r4/4P3/8/8/8/8/8/4K2k w - - 0 1");
    expect(moveToSan(p, find(p, "e7e8q"))).toBe("e8=Q");
    expect(moveToSan(p, find(p, "e7d8n"))).toBe("exd8=N");
  });
});

// ---------------------------------------------------------------------------
// PURITY — applyMove must never touch the position it was handed.
// ---------------------------------------------------------------------------

describe("applyMove is pure", () => {
  it("leaves the source position byte for byte unchanged", () => {
    const p = startPosition();
    const before = toFen(p);
    const board = p.board;
    const next = applyMove(p, find(p, "e2e4"));
    expect(toFen(p)).toBe(before);
    expect(p.board).toBe(board); // the same array object, not a rebuilt one
    expect(next.board).not.toBe(board);
  });

  it("leaves the position unchanged after a capture, a castle and an en passant", () => {
    for (const [fen, uci] of [
      ["4k3/8/8/8/8/8/8/R3K2R w KQ - 0 1", "e1g1"],
      ["4k3/8/8/8/8/8/6b1/R3K2R b KQ - 0 1", "g2h1"],
      ["rnbqkbnr/1pp1pppp/p7/3pP3/8/8/PPPP1PPP/RNBQKBNR w KQkq d6 0 3", "e5d6"],
    ] as const) {
      const p = fromFen(fen);
      applyMove(p, find(p, uci));
      expect(toFen(p)).toBe(fen);
    }
  });
});
