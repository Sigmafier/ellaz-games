import { describe, expect, it } from "vitest";
import * as engineModule from "./engine";
import { chooseTurn, evaluate, type Level } from "./engine";
import { applyMove, legalTurns, pipCount, startBoard, type Board, type Move } from "./logic";

/** A board built by hand, so a cell says what it is about. */
function board(points: Record<number, number>, bar = { w: 0, b: 0 }, off = { w: 0, b: 0 }): Board {
  const p: number[] = new Array(26).fill(0);
  for (const [k, v] of Object.entries(points)) p[Number(k)] = v;
  return { points: p, bar: { ...bar }, off: { ...off } };
}

/** Deterministic rng, so "random" is testable rather than hopeful. */
function seq(...xs: number[]): () => number {
  let i = 0;
  return () => xs[i++ % xs.length];
}

function play(b: Board, side: "w" | "b", turn: Move[]): Board {
  let out = b;
  for (const m of turn) out = applyMove(out, side, m);
  return out;
}

const asText = (t: Move[]): string => t.map((m) => `${m.from}/${m.to}`).join(" ");
const LEVELS: Level[] = ["easy", "normal", "hard"];

/**
 * How this board looks for white once black has answered as well as black can,
 * averaged over every roll by its real probability.
 *
 * This IS the same objective the engine optimises, and that is deliberate. The
 * claim being pinned is the DIRECTION of the reply search - whether it assumes
 * the opponent helps or hinders - and a yardstick with a different objective
 * cannot pin it: the first version of this helper took the single WORST reply
 * instead of the average, and reported a correct engine as wrong, because a
 * play that is better on average is often worse in the worst case (measured
 * 2026-09-21: hard -20 vs normal -19 on double-1s from the opening, with both
 * plays perfectly reasonable).
 */
function bestReplyAverage(b: Board): number {
  let total = 0;
  let weight = 0;
  for (let a = 1; a <= 6; a++) {
    for (let c = a; c <= 6; c++) {
      const dice = a === c ? [a, a, a, a] : [a, c];
      const w = a === c ? 1 : 2;
      let best = evaluate(b, "w");
      for (const r of legalTurns(b, "b", dice)) {
        const v = evaluate(play(b, "b", r), "w");
        if (v < best) best = v;
      }
      total += best * w;
      weight += w;
    }
  }
  return total / weight;
}

describe("chooseTurn", () => {
  it("returns a turn the rules actually allow, at every level", () => {
    // The one thing an engine must never do: play a move the rules refuse.
    for (const level of LEVELS) {
      const b = startBoard();
      const legal = legalTurns(b, "w", [6, 5]);
      const picked = chooseTurn(b, "w", [6, 5], level, seq(0.7, 0.1, 0.42));
      expect(legal.map(asText), level).toContain(asText(picked));
    }
  });

  it("returns an empty turn when the dice are dead, rather than inventing one", () => {
    // Black holds every entry point; white is on the bar with nothing to do.
    const shut = board({ 19: -2, 20: -2, 21: -2, 22: -2, 23: -2, 24: -2, 6: 5 }, { w: 1, b: 0 });
    for (const level of LEVELS) {
      expect(chooseTurn(shut, "w", [1, 2], level), level).toEqual([]);
    }
  });

  it("hard takes a free hit", () => {
    // A lone black blot on 20 and a white man on 24 with a 4 to play. Hitting
    // is plainly best, and a strong engine must find it.
    const b = board({ 24: 2, 20: -1, 13: 5, 8: 3, 6: 5 });
    const after = play(b, "w", chooseTurn(b, "w", [4, 1], "hard"));
    expect(after.bar.b, "hard should have sent the blot to the bar").toBe(1);
  });

  it("hard prefers the safe play when both plays use the same dice", () => {
    // Three white men on 13 and a 5 to play. 13/8 joins the man on 8 and makes
    // the point, and leaves 13 with two - nobody is alone. The alternative,
    // 8/3, strands a man on 3. Both use the one die, so length cannot decide
    // it; only the shape can. (The first version of this fixture had TWO men
    // on 13, where BOTH plays leave exactly one blot and the assertion was
    // unsatisfiable by any engine.)
    const b = board({ 13: 3, 8: 1, 6: 5, 1: -2, 19: -5 });
    const after = play(b, "w", chooseTurn(b, "w", [5], "hard"));
    expect(after.points.filter((n) => n === 1).length).toBe(0);
  });

  it("scores the play that leaves fewer men alone strictly higher", () => {
    // The blot term, pinned on the SCORE rather than on the choice.
    //
    // The first version of this cell asserted which move the engine PICKED,
    // and it passed with the blot term deleted - because with that term gone
    // the two plays score identically and the tie broke, by order, on the one
    // the test wanted. A cell that a mutation cannot fail is not a cell.
    // (Measured 2026-09-21: mutation "blot penalty removed", 15/15 green.)
    //
    // Three white men on 13 and one on 7, one pip spent either way:
    //   13/12  keeps the 13 point, leaves TWO men alone (7 and 12)
    //   7/6    keeps the 13 point, leaves ONE man alone (6)
    // Same pips, same points made. Only the blots differ.
    const b = board({ 13: 3, 7: 1, 1: -2, 19: -5 });
    const twoAlone = play(b, "w", [{ from: 13, to: 12, die: 1, hit: false }]);
    const oneAlone = play(b, "w", [{ from: 7, to: 6, die: 1, hit: false }]);
    expect(twoAlone.points.filter((n) => n === 1).length).toBe(2);
    expect(oneAlone.points.filter((n) => n === 1).length).toBe(1);
    expect(pipCount(twoAlone, "w")).toBe(pipCount(oneAlone, "w"));
    expect(evaluate(oneAlone, "w")).toBeGreaterThan(evaluate(twoAlone, "w"));
  });

  it("hard's reply search is pointed at the opponent's BEST answer, not their worst", () => {
    // The direction of the one-ply search, which nothing else here can see: a
    // mutation flipping `<` to `>` inside it - so the engine assumed the
    // opponent would help - left all 13 tests green (measured 2026-09-21).
    //
    // The property, stated so it cannot be satisfied vacuously: wherever hard
    // and normal disagree, hard's board must survive the opponent's best reply
    // at least as well as normal's. A run that finds no disagreement at all
    // proves nothing, so the population is asserted first.
    const cases: { board: Board; dice: number[] }[] = [];
    for (let a = 1; a <= 6; a++) {
      for (let c = a; c <= 6; c++) {
        cases.push({ board: startBoard(), dice: a === c ? [a, a, a, a] : [a, c] });
        cases.push({ board: board({ 13: 3, 8: 3, 6: 4, 24: 2, 20: -1, 1: -2, 19: -5 }), dice: [a, c] });
      }
    }
    let disagreements = 0;
    for (const { board: b, dice } of cases) {
      const n = chooseTurn(b, "w", dice, "normal");
      const h = chooseTurn(b, "w", dice, "hard");
      if (asText(n) === asText(h)) continue;
      disagreements++;
      expect(
        bestReplyAverage(play(b, "w", h)),
        `dice ${dice.join(",")}: hard chose ${asText(h)}, normal chose ${asText(n)}`,
      ).toBeGreaterThanOrEqual(bestReplyAverage(play(b, "w", n)));
    }
    expect(disagreements, "found no position where hard and normal disagree").toBeGreaterThan(0);
  });

  it("easy is genuinely weaker than hard over a run of the same positions", () => {
    // The measurement this level's NAME claims, rather than a vibe: play the
    // same twenty positions with each and compare where they end up.
    let easyBetter = 0;
    let hardBetter = 0;
    for (let i = 0; i < 20; i++) {
      const dice = [1 + (i % 6), 1 + ((i * 3) % 6)];
      const b = startBoard();
      const e = evaluate(play(b, "w", chooseTurn(b, "w", dice, "easy", seq(0.1 * (i % 9)))), "w");
      const h = evaluate(play(b, "w", chooseTurn(b, "w", dice, "hard")), "w");
      if (h > e) hardBetter++;
      else if (e > h) easyBetter++;
    }
    expect(hardBetter).toBeGreaterThan(easyBetter);
  });

  it("is deterministic at hard, and varies at easy", () => {
    const b = startBoard();
    expect(asText(chooseTurn(b, "w", [3, 1], "hard"))).toBe(asText(chooseTurn(b, "w", [3, 1], "hard")));
    const picks = new Set(
      [0.05, 0.25, 0.45, 0.65, 0.85, 0.95].map((r) => asText(chooseTurn(b, "w", [3, 1], "easy", seq(r)))),
    );
    expect(picks.size).toBeGreaterThan(1);
  });
});

describe("evaluate", () => {
  it("prefers being ahead on the pip count", () => {
    const behind = board({ 24: 2, 13: 5, 8: 3, 6: 5, 1: -2, 12: -5, 17: -3, 19: -5 });
    const ahead = board({ 6: 2, 13: 5, 8: 3, 5: 5, 1: -2, 12: -5, 17: -3, 19: -5 });
    expect(pipCount(ahead, "w")).toBeLessThan(pipCount(behind, "w"));
    expect(evaluate(ahead, "w")).toBeGreaterThan(evaluate(behind, "w"));
  });

  it("is zero-sum: what is good for white is bad for black", () => {
    const b = board({ 24: 2, 13: 5, 8: 3, 6: 5, 1: -2, 12: -5, 17: -3, 19: -5 });
    expect(evaluate(b, "w")).toBeCloseTo(-evaluate(b, "b"), 6);
  });

  it("counts a man borne off as better than the same man still on the board", () => {
    const onBoard = board({ 1: 1, 2: 1 }, { w: 0, b: 0 }, { w: 13, b: 0 });
    const borneOff = board({ 2: 1 }, { w: 0, b: 0 }, { w: 14, b: 0 });
    expect(evaluate(borneOff, "w")).toBeGreaterThan(evaluate(onBoard, "w"));
  });

  it("punishes a man on the bar", () => {
    const clean = board({ 6: 5, 8: 3, 13: 5, 24: 2 });
    const barred = board({ 6: 5, 8: 3, 13: 5, 24: 1 }, { w: 1, b: 0 });
    expect(evaluate(barred, "w")).toBeLessThan(evaluate(clean, "w"));
  });
});

describe("the engine has no opinion about a cube", () => {
  // Doubling was removed 2026-09-22. This asserts the engine's SURFACE rather
  // than deleting the cells quietly: an engine re-growing a cube decision is a
  // red test, and `evaluate` staying exported is what the removed functions
  // were built on, so it is named here too.
  it("exports a turn chooser and a position score, and nothing that offers a stake", () => {
    expect(Object.keys(engineModule).sort()).toEqual(["BAR", "OFF", "chooseTurn", "evaluate"]);
  });
});
