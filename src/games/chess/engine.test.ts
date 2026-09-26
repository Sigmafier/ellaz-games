import { loadavg } from "node:os";
import { describe, expect, it } from "vitest";
import { chooseMove, evaluate, think, type Level } from "./engine";
import {
  applyMove,
  fromFen,
  legalMoves,
  moveToSan,
  outcome,
  positionKey,
  startPosition,
  type Move,
  type Position,
} from "./logic";

const LEVELS: Level[] = ["easy", "normal", "hard"];

/** Deterministic rng, so "random" is testable rather than hopeful. */
function seq(...xs: number[]): () => number {
  let i = 0;
  return () => xs[i++ % xs.length];
}

/** Material only, from white's side, in centipawns. A yardstick the engine does not share. */
function material(p: Position): number {
  const V: Record<string, number> = { p: 100, n: 300, b: 300, r: 500, q: 900, k: 0 };
  let s = 0;
  for (const pc of p.board) if (pc) s += pc[0] === "w" ? V[pc[1]] : -V[pc[1]];
  return s;
}

/** Play a whole game between two levels and hand back the final position. */
function playOut(white: Level, black: Level, plies: number, rng: () => number, budgetMs: number) {
  let p = startPosition();
  const history: string[] = [positionKey(p)];
  for (let i = 0; i < plies; i++) {
    if (outcome(p, history).kind !== "playing") break;
    const m = chooseMove(p, p.turn === "w" ? white : black, { rng, history, budgetMs });
    if (!m) break;
    p = applyMove(p, m);
    history.push(positionKey(p));
  }
  return { position: p, history };
}

describe("think", () => {
  it("returns a move the rules actually allow, at every level", () => {
    // The one thing an engine must never do: play a move the rules refuse.
    for (const level of LEVELS) {
      const p = startPosition();
      const legal = legalMoves(p).map((m) => `${m.from}-${m.to}`);
      const got = chooseMove(p, level, { rng: seq(0.7, 0.1, 0.42) })!;
      expect(legal, level).toContain(`${got.from}-${got.to}`);
    }
  });

  it("returns null on a finished board rather than inventing a move", () => {
    // Fool's mate. There is no move, and the honest answer is nothing - not a
    // thrown exception on a board the player can still see.
    const mated = fromFen("rnb1kbnr/pppp1ppp/8/4p3/6Pq/5P2/PPPPP2P/RNBQKBNR w KQkq - 1 3");
    expect(outcome(mated).kind).toBe("checkmate");
    for (const level of LEVELS) expect(think(mated, level), level).toBeNull();
  });

  it("finds mate in one", () => {
    // Back rank: the black king is walled in by his own pawns and Ra8 ends it.
    const p = fromFen("6k1/5ppp/8/8/8/8/8/R6K w - - 0 1");
    for (const level of ["normal", "hard"] as Level[]) {
      const m = chooseMove(p, level)!;
      expect(moveToSan(p, m), level).toBe("Ra8#");
    }
  });

  it("sees a mate in two, which depth 1 cannot", () => {
    // What separates a level that searches from one that looks. White is a
    // whole queen down, so nothing but the mate makes this position good - and
    // the score has to come back as a mate score, not as material.
    const p = fromFen("6k1/5ppp/8/8/8/7q/5PPP/R5K1 w - - 0 1");
    const t = think(p, "hard")!;
    expect(moveToSan(p, t.move)).toBe("Ra8+");
    expect(t.score).toBeGreaterThan(50_000);
  });

  it("prefers the SHORTER mate, so a won game actually ends", () => {
    // The distance in the mate score, which nothing else here can see: a
    // mutation returning a flat `-MATE` instead of `-(MATE - ply)` left all 18
    // other cells green (measured 2026-09-21). With it, every mate scores the
    // same, so the engine finds a forced mate and then shuffles around inside
    // it forever - it never gets shorter, so nothing ever looks better.
    //
    // Pinned on the SCORE as well as the move, because the move alone is
    // satisfied by a tie breaking the right way.
    const one = fromFen("6k1/5ppp/8/8/8/8/8/R6K w - - 0 1"); // Ra8 is mate now
    const two = fromFen("4k3/8/8/8/8/8/1R6/R7 w - - 0 1"); // the ladder, two moves
    const a = think(one, "hard")!;
    const b = think(two, "hard")!;
    expect(moveToSan(one, a.move)).toBe("Ra8#");
    expect(moveToSan(two, b.move)).toBe("Rb7");
    expect(a.score, "a mate in one must beat a mate in two").toBeGreaterThan(b.score);
    expect(a.score, "a mate score must carry its distance").toBeLessThan(100_000);
  });

  it("takes a piece that is hanging", () => {
    // A knight on d5 with nothing defending it, and a pawn that can eat it.
    const p = fromFen("4k3/8/8/3n4/4P3/8/8/4K3 w - - 0 1");
    for (const level of ["normal", "hard"] as Level[]) {
      expect(moveToSan(p, chooseMove(p, level)!), level).toBe("exd5");
    }
  });

  it("does not give the queen away for a pawn", () => {
    // Qxd5 wins a pawn and loses a queen to exd5. An engine that plays this is
    // not weak, it is broken - and it is the single most common way a first
    // search goes wrong, because at even depths the recapture is one ply past
    // the horizon. (The search alone is enough to see THIS one; the cell that
    // pins quiescence itself is the next one.)
    const p = fromFen("4k3/8/4p3/3p4/8/8/8/3QK3 w - - 0 1");
    for (const level of ["normal", "hard"] as Level[]) {
      expect(moveToSan(p, chooseMove(p, level)!), level).not.toBe("Qxd5");
    }
  });

  it("does not grab a pawn whose recapture is past the search horizon", () => {
    // THE QUIESCENCE CELL, and the reason it looks contrived is that the
    // failure it pins is contrived: it needs a capture whose refutation falls
    // on an EVEN ply, where a fixed-depth search stops and counts the material
    // it is about to give back.
    //
    // A pawn on d5 defended TWICE, by c6 and e6, against a pawn on e4 and a
    // knight on c3. The sequence is four deep:
    //
    //   1. exd5   cxd5     white is level
    //   2. Nxd5            white is a pawn up  <- a fixed depth stops HERE
    //             exd5     white is a knight down
    //
    // The leaf a fixed-depth search lands on is the good one, so an engine
    // with no quiescence plays exd5 and hands over a knight. This cell is the
    // only one in the file that can see that, and its first draft could not:
    // it used a pawn on g7 to "defend" h7, which a black pawn does not.
    const p = fromFen("4k3/8/2p1p3/3p4/4P3/2N5/8/4K3 w - - 0 1");
    expect(moveToSan(p, chooseMove(p, "normal")!)).not.toBe("exd5");
  });

  it("steers into a repetition when it is losing, and away when it is winning", () => {
    // The root repetition sense, both directions in one cell. White's rook can
    // step back to a square this game has already held twice, which makes the
    // move a draw by threefold whatever the pieces say.
    const p = fromFen("3q3k/8/8/8/8/8/8/R6K w - - 0 1"); // white is a queen down
    const repeat = legalMoves(p).find((m) => moveToSan(p, m) === "Rb1")!;
    const key = positionKey(applyMove(p, repeat));
    const history = [key, key];

    // Losing: the draw is the best available result, so it must be taken.
    expect(moveToSan(p, chooseMove(p, "hard", { history })!)).toBe("Rb1");

    // The same move, the same history, from a position where white is a rook
    // UP - now a draw throws the game away and the engine must play on.
    const winning = fromFen("7k/8/8/8/8/8/8/R5RK w - - 0 1");
    const rep2 = legalMoves(winning).find((m) => moveToSan(winning, m) === "Rab1")!;
    const k2 = positionKey(applyMove(winning, rep2));
    expect(moveToSan(winning, chooseMove(winning, "hard", { history: [k2, k2] })!)).not.toBe("Rab1");
  });

  it("is deterministic at normal and hard, and varies at easy", () => {
    const p = startPosition();
    const twice = (level: Level) => {
      const a = chooseMove(p, level)!;
      const b = chooseMove(p, level)!;
      return `${a.from}-${a.to}` === `${b.from}-${b.to}`;
    };
    expect(twice("normal")).toBe(true);
    expect(twice("hard")).toBe(true);
    const picks = new Set(
      [0.02, 0.2, 0.4, 0.6, 0.8, 0.98].map((r) => {
        const m = chooseMove(p, "easy", { rng: seq(r) })!;
        return `${m.from}-${m.to}`;
      }),
    );
    expect(picks.size, "easy always played the same move").toBeGreaterThan(1);
  });

  it("reports what the search cost, so a bad move has an explanation", () => {
    const t = think(startPosition(), "normal")!;
    expect(t.depth).toBeGreaterThanOrEqual(2);
    expect(t.nodes).toBeGreaterThan(100);
    expect(t.ms).toBeGreaterThanOrEqual(0);
  });
});

describe("evaluate", () => {
  it("is zero-sum: what is good for white is bad for black", () => {
    const p = fromFen("r1bqkbnr/pppp1ppp/2n5/4p3/2B1P3/5N2/PPPP1PPP/RNBQK2R w KQkq - 4 4");
    expect(evaluate(p, "w")).toBe(-evaluate(p, "b"));
  });

  it("prefers having the extra piece", () => {
    const even = fromFen("4k3/8/8/8/8/8/8/4K3 w - - 0 1");
    const up = fromFen("4k3/8/8/8/8/8/8/3QK3 w - - 0 1");
    expect(evaluate(up, "w")).toBeGreaterThan(evaluate(even, "w") + 800);
  });

  it("walks the king to the middle in an endgame and hides him when queens are on", () => {
    // The blend, pinned in both directions with one piece moved. With a full
    // board the king belongs at home; with nothing but kings he belongs out.
    const homeFull = fromFen("rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1");
    const outFull = fromFen("rnbqkbnr/pppppppp/8/8/4K3/8/PPPPPPPP/RNBQ1BNR w kq - 0 1");
    expect(evaluate(homeFull, "w")).toBeGreaterThan(evaluate(outFull, "w"));

    const homeBare = fromFen("4k3/8/8/8/8/8/8/4K3 w - - 0 1");
    const outBare = fromFen("4k3/8/8/4K3/8/8/8/8 w - - 0 1");
    expect(evaluate(outBare, "w")).toBeGreaterThan(evaluate(homeBare, "w"));
  });
});

describe("the levels are a ladder, measured rather than asserted", () => {
  it("normal beats easy on material from both colours", () => {
    // A LEVEL'S NAME IS A CLAIM, and this is the measurement behind it. The
    // same opening, played out twice with the levels on opposite sides, so a
    // result cannot come from white's first move.
    //
    // The budget is cut to 40ms here: this is the levels' RELATIVE order, and
    // hard's real 300ms is measured by the timing probe below instead.
    const asWhite = playOut("normal", "easy", 40, seq(0.9, 0.1, 0.5, 0.3, 0.7), 40);
    const asBlack = playOut("easy", "normal", 40, seq(0.9, 0.1, 0.5, 0.3, 0.7), 40);
    const a = material(asWhite.position);
    const b = -material(asBlack.position);
    expect(a + b, `normal scored ${a} as white and ${b} as black`).toBeGreaterThan(0);
  });

  it("hard looks deeper than normal from the same position", () => {
    const p = fromFen("r1bqkb1r/pppp1ppp/2n2n2/4p3/2B1P3/5N2/PPPP1PPP/RNBQK2R w KQkq - 4 4");
    expect(think(p, "hard")!.depth).toBeGreaterThan(think(p, "normal")!.depth);
  });
});

describe("the clock", () => {
  /**
   * P3 from the plan: hard must answer inside a phone's patience.
   *
   * The positions are the ones THIS ENGINE ACTUALLY REACHES - twenty snapshots
   * of a game it played against itself - rather than a borrowed corpus, so the
   * number describes the thing the player will experience.
   *
   * Measured on this machine 2026-09-21, and a figure measured here is not a
   * figure measured in CI: the threshold has room for that rather than being
   * tuned to the reading.
   */
  it("stops when its OWN CLOCK says to, with no wall clock involved", () => {
    // THE ASSERTION THAT ACTUALLY GUARDS THE BUDGET, and the reason it uses a
    // fake clock is that a real one measures the machine.
    //
    // `now` advances a fixed amount per call, so the deadline arrives after a
    // known number of CHECKS, and a check happens every 1024 nodes. The node
    // count that comes back is therefore a property of the code and nothing
    // else - identical on an idle laptop and on a box at load 22. Delete the
    // deadline check and this does not get slower, it never returns.
    const p = fromFen("r1bqkb1r/pppp1ppp/2n2n2/4p3/2B1P3/5N2/PPPP1PPP/RNBQK2R w KQkq - 4 4");
    let tick = 0;
    const now = () => (tick += 10);
    const t = think(p, "hard", { now, budgetMs: 100 })!;
    // 100ms of budget at 10 per call is ~10 checks, and a check every 1024
    // nodes puts the stop around 10k nodes. The bound is loose on purpose -
    // what it refuses is a search that ignores the clock entirely.
    //
    // WHAT IT DISCRIMINATES, measured 2026-09-21 by planting all three arms:
    //   the check gone from `search`    passes  - `quiesce` still stops it
    //   the check gone from `quiesce`   passes  - `search` still stops it
    //   gone from BOTH                  NEVER RETURNS, which is the failure
    // So the claim this pins is "at least one working deadline check", not
    // "both of them". The two are genuine redundancy rather than the
    // unreachable kind `opponent.ts` had to cut: either one alone terminates
    // the search, and each covers a phase the other cannot reach.
    expect(t.nodes, `stopped after ${t.nodes} nodes`).toBeLessThan(60_000);
    expect(t.nodes).toBeGreaterThan(1_000);
    expect(t.depth).toBeGreaterThanOrEqual(1);
  });

  /**
   * P3 from the plan, and it is a MEASUREMENT with a loose guard rather than a
   * tight assertion, because a tight one measures the box.
   *
   * Measured on this machine 2026-09-21, same tree, same engine, twice:
   *
   *   idle-ish (load ~3)   n=20  median 320ms  p95 349ms  max 406ms   <- P3 MET
   *   loaded   (load ~22)  n=20  median 339ms  p95 453ms  max 471ms
   *
   * The MEDIAN barely moves and the TAIL doubles, which is the signature of
   * the process being descheduled between two deadline checks rather than of
   * the engine searching longer - it cannot search longer, its own clock stops
   * it. So the number that belongs in the build log is 349ms on a quiet box,
   * and the number this gate refuses is a real blowup: a budget that stopped
   * working, a search that forgot to bound itself, an engine ten times slower.
   *
   * An ambient control was tried first and does not work here: sampled at the
   * fast end (the only honest way to read one) `legalMoves` timed 7-9ms at
   * load 22 and 7-9ms idle, so it is blind to exactly the contention that
   * moves the tail. Recorded so nobody builds it again.
   */
  it("answers fast enough to feel like an opponent, not a wait", { timeout: 60_000 }, () => {
    const positions: Position[] = [];
    let p = startPosition();
    const history = [positionKey(p)];
    for (let i = 0; i < 24 && positions.length < 20; i++) {
      if (outcome(p, history).kind !== "playing") break;
      if (i >= 4) positions.push(p);
      const m = chooseMove(p, "normal", { history, budgetMs: 40 });
      if (!m) break;
      p = applyMove(p, m);
      history.push(positionKey(p));
    }
    expect(positions.length, "the sample never filled").toBeGreaterThanOrEqual(16);

    const times = positions.map((pos) => think(pos, "hard")!.ms).sort((a, b) => a - b);
    const p95 = times[Math.min(times.length - 1, Math.ceil(times.length * 0.95) - 1)];
    const median = times[Math.floor(times.length / 2)];
    // Printed with the POPULATION and the load, because a percentile with
    // neither is not a measurement.
    console.log(
      `hard: n=${times.length} median=${median}ms p95=${p95}ms max=${times[times.length - 1]}ms` +
        ` | load ${loadAverage()}`,
    );
    // The engine's own budget is 300ms. Three times that is a bound no amount
    // of contention on this machine has reached and no correct engine can
    // cross - measured 453ms at load 22, which is 1.5x.
    expect(p95, "the search is not respecting its budget at all").toBeLessThanOrEqual(900);
  });

  it("honours a budget it is given, whatever its level says", () => {
    const p = fromFen("r1bqkb1r/pppp1ppp/2n2n2/4p3/2B1P3/5N2/PPPP1PPP/RNBQK2R w KQkq - 4 4");
    const t = think(p, "hard", { budgetMs: 30 })!;
    // The budget is a deadline checked between nodes, not a hard interrupt, so
    // an overrun of one node batch is expected. What must NOT happen is the
    // full 300ms.
    expect(t.ms).toBeLessThan(200);
    expect(t.depth).toBeGreaterThanOrEqual(1);
  });

  it("still answers with a legal move when the clock is already gone", () => {
    // The floor under every budget. A clock that has expired before the first
    // node means no pass completed, so the honest report is depth 0 - and the
    // move still has to be one the rules allow, because the player is looking
    // at a board and an engine that returns nothing here has hung the game.
    const p = fromFen("r1bqkb1r/pppp1ppp/2n2n2/4p3/2B1P3/5N2/PPPP1PPP/RNBQK2R w KQkq - 4 4");
    let clock = 0;
    const now = () => {
      clock += clock > 0 ? 1000 : 1;
      return clock;
    };
    const t = think(p, "hard", { now, budgetMs: 5 })!;
    expect(t.depth).toBe(0);
    const legal = legalMoves(p).map((m: Move) => `${m.from}-${m.to}`);
    expect(legal).toContain(`${t.move.from}-${t.move.to}`);
  });
});

/** The box's one-minute load, so a timing line says what it was competing with. */
const loadAverage = () => loadavg()[0].toFixed(1);
