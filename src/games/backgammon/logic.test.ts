import { describe, it, expect } from "vitest";
import {
  startBoard,
  startGame,
  nextGame,
  roll,
  legalTurns,
  legalFrom,
  legalPlays,
  applyMove,
  pipCount,
  gameResult,
  applyGameResult,
  matchOver,
  BAR,
  OFF,
  type Board,
  type Move,
} from "./logic";

// A board from a sparse map. The rules never count to fifteen - "all men home"
// is "none outside home and none on the bar" - so a constructed position may
// hold two men and still exercise the bearing-off rules honestly.
function bd(
  points: Record<number, number>,
  bar: Partial<Board["bar"]> = {},
  off: Partial<Board["off"]> = {},
): Board {
  const p = Array<number>(26).fill(0);
  for (const [k, v] of Object.entries(points)) p[Number(k)] = v;
  return { points: p, bar: { w: 0, b: 0, ...bar }, off: { w: 0, b: 0, ...off } };
}

/** A move as `from>to/die`, so a failing expectation reads as a play. */
const say = (m: Move) => `${m.from}>${m.to}/${m.die}`;
const sayAll = (t: Move[]) => t.map(say).join(" ");

describe("rule 1 - both dice must be played when any sequence plays both", () => {
  // The 15 distinct non-double opening rolls.
  const OPENING: Array<[number, number]> = [];
  for (let a = 1; a <= 6; a++) for (let b = a + 1; b <= 6; b++) OPENING.push([a, b]);

  it("has fifteen distinct non-double opening rolls", () => {
    expect(OPENING).toHaveLength(15);
  });

  it.each(OPENING)("opening %i-%i: every legal turn plays both dice, for both sides", (a, b) => {
    for (const side of ["w", "b"] as const) {
      const turns = legalTurns(startBoard(), side, [a, b]);
      expect(turns.length).toBeGreaterThan(0);
      for (const t of turns) {
        expect(t, `${side} ${a}-${b}: ${sayAll(t)}`).toHaveLength(2);
        expect([...t.map((m) => m.die)].sort()).toEqual([a, b].sort());
      }
    }
  });

  it("offers a move only when it begins a MAXIMAL sequence", () => {
    // White A on 20 can play 6 then 1 (20>14>13). White B on 10 can play the 6
    // alone (10>4) and then nothing. B's move is legal in isolation and must
    // never be offered, because taking it throws the other die away.
    const board = bd({ 20: 1, 10: 1, 19: -2, 9: -2, 3: -2 });
    const turns = legalTurns(board, "w", [6, 1]);
    expect(turns.map(sayAll)).toEqual(["20>14/6 14>13/1"]);
    expect(legalFrom(board, "w", [6, 1], [])).toEqual([20]);
    expect(legalFrom(board, "w", [6, 1], turns[0].slice(0, 1))).toEqual([14]);
    expect(legalFrom(board, "w", [6, 1], turns[0])).toEqual([]);
  });
});

describe("rule 2 - when only one die can be played, the higher one must be", () => {
  it("plays ONLY the higher die when either alone is legal", () => {
    // White on the bar, both entry points open, and 18 shut - so each entry is
    // legal alone and neither leaves a second move.
    const board = bd({ 18: -2 }, { w: 1 });
    expect(legalTurns(board, "w", [6, 1]).map(sayAll)).toEqual(["25>19/6"]);
  });

  it("plays the lower die when the higher one is not legal alone", () => {
    // Same, with the die-6 entry point shut too.
    const board = bd({ 19: -2, 18: -2 }, { w: 1 });
    expect(legalTurns(board, "w", [6, 1]).map(sayAll)).toEqual(["25>24/1"]);
  });
});

describe("rule 3 - doubles are four moves of that number", () => {
  it("rolls four dice on a double and two otherwise", () => {
    expect(roll(() => 0)).toEqual([1, 1, 1, 1]);
    const scripted = [0, 0.99];
    expect(roll(() => scripted.shift() ?? 0)).toEqual([1, 6]);
  });

  it("returns four-move turns from the opening position", () => {
    for (const d of [1, 2, 3, 4, 5, 6]) {
      const turns = legalTurns(startBoard(), "w", [d, d, d, d]);
      expect(turns.length).toBeGreaterThan(0);
      for (const t of turns) expect(t, `${d}-${d}: ${sayAll(t)}`).toHaveLength(4);
    }
  });
});

describe("rule 4 - a man on the bar re-enters before anything else", () => {
  it("makes every non-entry move illegal", () => {
    // White has men to move on 13, and one on the bar. Both entries are open.
    const board = bd({ 13: 2 }, { w: 1 });
    const turns = legalTurns(board, "w", [6, 1]);
    expect(turns.length).toBeGreaterThan(0);
    for (const t of turns) expect(t[0].from, sayAll(t)).toBe(BAR.w);
  });

  it("refuses entry onto a point held by two enemy men", () => {
    const shut = bd({ 19: -2, 24: -2 }, { w: 1 });
    expect(legalTurns(shut, "w", [6, 1])).toEqual([]);
    const half = bd({ 19: -2 }, { w: 1 });
    for (const t of legalTurns(half, "w", [6, 1])) {
      for (const m of t) expect(m.to, sayAll(t)).not.toBe(19);
    }
  });

  it("sends a lone blot to the bar when entry lands on it", () => {
    const board = bd({ 24: -1 }, { w: 1 });
    const turns = legalTurns(board, "w", [1, 1, 1, 1]);
    expect(turns[0][0]).toMatchObject({ from: BAR.w, to: 24, die: 1, hit: true });
    const after = applyMove(board, "w", turns[0][0]);
    expect(after.points[24]).toBe(1);
    expect(after.bar.b).toBe(1);
    expect(after.bar.w).toBe(0);
    expect(board.points[24]).toBe(-1); // the input is untouched
  });

  it("black enters on the die, white on 25 minus the die", () => {
    expect(legalTurns(bd({}, { w: 1 }), "w", [4]).map(sayAll)).toEqual(["25>21/4"]);
    expect(legalTurns(bd({}, { b: 1 }), "b", [4]).map(sayAll)).toEqual(["0>4/4"]);
  });
});

describe("bearing off", () => {
  it("bears off on an exact roll", () => {
    const board = bd({ 3: 1, 2: 1 });
    expect(legalTurns(board, "w", [3]).map(sayAll)).toContain("3>0/3");
    const after = applyMove(board, "w", { from: 3, to: OFF.w, die: 3 });
    expect(after.off.w).toBe(1);
    expect(after.points[3]).toBe(0);
  });

  it("lets a HIGHER die bear off from a lower point with nothing behind it", () => {
    const board = bd({ 2: 1 });
    expect(legalTurns(board, "w", [5]).map(sayAll)).toEqual(["2>0/5"]);
  });

  it("REFUSES the same play while a man sits on a higher point", () => {
    // One variable changed: a white man added on 6.
    const board = bd({ 2: 1, 6: 1 });
    const turns = legalTurns(board, "w", [5]);
    expect(turns.map(sayAll)).toEqual(["6>1/5"]);
    for (const t of turns) for (const m of t) expect(m.to).not.toBe(OFF.w);
  });

  it("refuses to bear off while a man is on the bar", () => {
    const board = bd({ 3: 1 }, { w: 1 });
    const turns = legalTurns(board, "w", [3]);
    expect(turns.map(sayAll)).toEqual(["25>22/3"]);
  });

  it("refuses to bear off while a man is outside the home board", () => {
    expect(legalTurns(bd({ 3: 1, 9: 1 }), "w", [3]).map(sayAll)).toEqual(["9>6/3"]);
  });

  it("lets a lower die move inside the home board", () => {
    expect(legalFrom(bd({ 6: 1, 2: 1 }), "w", [1], [])).toEqual([2, 6]);
  });

  it("bears black off from its own end of the board", () => {
    expect(legalTurns(bd({ 23: -1 }), "b", [5]).map(sayAll)).toEqual(["23>25/5"]);
    expect(legalTurns(bd({ 23: -1, 19: -1 }), "b", [5]).map(sayAll)).toEqual(["19>24/5"]);
  });
});

/** A board as one string, so two orders of the same play compare equal. */
function key(b: Board): string {
  return `${b.points.join(",")}|${b.bar.w},${b.bar.b}|${b.off.w},${b.off.b}`;
}

describe("legalPlays", () => {
  it("offers exactly the destinations legalFrom promised a source has", () => {
    // The two are one answer read two ways, so a source with no plays would
    // mean `legalFrom` had offered a point a tap cannot use.
    const b = startBoard();
    for (const dice of [[6, 5], [3, 1], [2, 2, 2, 2], [6, 6, 6, 6]]) {
      for (const from of legalFrom(b, "w", dice, [])) {
        expect(legalPlays(b, "w", dice, [], from).length, `${dice} from ${from}`).toBeGreaterThan(0);
      }
    }
  });

  it("returns whole moves, and following them to the end IS a legal turn", () => {
    // The guarantee a renderer actually needs: tap a source, tap a
    // destination, repeat, and what you end up having played is a turn
    // `legalTurns` would have offered whole. Compared on the resulting BOARD,
    // because `legalTurns` collapses two orders of the same two moves into one
    // play - which is why the first draft of this cell, comparing first moves
    // against `legalTurns`, failed on a module that was right.
    const b = startBoard();
    for (const dice of [[6, 5], [3, 1], [5, 5, 5, 5]]) {
      const whole = new Set(
        legalTurns(b, "w", dice).map((t) => key(t.reduce((acc, m) => applyMove(acc, "w", m), b))),
      );
      for (const start of legalFrom(b, "w", dice, [])) {
        for (const first of legalPlays(b, "w", dice, [], start)) {
          // Greedily finish the turn, always taking the first offer.
          const played: Move[] = [first];
          for (;;) {
            const froms = legalFrom(b, "w", dice, played);
            if (froms.length === 0) break;
            played.push(legalPlays(b, "w", dice, played, froms[0])[0]);
          }
          const end = key(played.reduce((acc, m) => applyMove(acc, "w", m), b));
          expect(whole, `${dice} via ${first.from}/${first.to}`).toContain(end);
        }
      }
    }
  });

  it("offers nothing from a point the side has no man on", () => {
    expect(legalPlays(startBoard(), "w", [6, 5], [], 5)).toEqual([]);
  });

  it("narrows as the turn is played, so a second tap cannot waste a die", () => {
    // After the first half of the lover's leap, every source still offered
    // must still lead somewhere - and the man that just landed on 18 is one of
    // them. (The first draft asserted 18 was the ONLY one, which is false: 6-5
    // has several two-move plays. My fixture, not the module.)
    const b = startBoard();
    const first = legalPlays(b, "w", [6, 5], [], 24).find((m) => m.to === 18)!;
    expect(first, "24/18 must be on offer").toBeDefined();
    const after = legalFrom(b, "w", [6, 5], [first]);
    expect(after).toContain(18);
    for (const from of after) {
      expect(legalPlays(b, "w", [6, 5], [first], from).length, `from ${from}`).toBeGreaterThan(0);
    }
    // And a point with no man on it is offered by neither.
    expect(after).not.toContain(3);
    expect(legalPlays(b, "w", [6, 5], [first], 3)).toEqual([]);
  });
});

describe("gameResult - one, two or three points", () => {
  const gammonBoard = bd({ 10: -5 }, {}, { w: 15, b: 0 });

  it("scores an ordinary finish as ONE", () => {
    // The positive control for the two below: the same shape, loser off > 0.
    expect(gameResult(bd({ 10: -5 }, {}, { w: 15, b: 3 }))).toEqual({ winner: "w", points: 1 });
  });

  it("scores a gammon as TWO when the loser bore off none", () => {
    expect(gameResult(gammonBoard)).toEqual({ winner: "w", points: 2 });
  });

  it("scores a backgammon as THREE when the loser is also on the bar", () => {
    expect(gameResult(bd({ 10: -4 }, { b: 1 }, { w: 15 }))).toEqual({ winner: "w", points: 3 });
  });

  it("scores a backgammon as THREE when the loser is in the winner's home", () => {
    expect(gameResult(bd({ 10: -3, 4: -2 }, {}, { w: 15 }))).toEqual({ winner: "w", points: 3 });
    // and the mirror: white stranded in BLACK's home, 19-24.
    expect(gameResult(bd({ 10: 3, 20: 2 }, {}, { b: 15 }))).toEqual({ winner: "b", points: 3 });
  });

  it("is null while nobody has borne fifteen off", () => {
    expect(gameResult(startBoard())).toBeNull();
    expect(gameResult(bd({ 10: -5 }, {}, { w: 14 }))).toBeNull();
  });
});

describe("the board and the pips", () => {
  it("opens at 167 a side", () => {
    expect(pipCount(startBoard(), "w")).toBe(167);
    expect(pipCount(startBoard(), "b")).toBe(167);
  });

  it("counts a man on the bar as twenty-five", () => {
    expect(pipCount(bd({}, { w: 1 }), "w")).toBe(25);
    expect(pipCount(bd({}, { b: 1 }), "b")).toBe(25);
  });
});

describe("there is no cube", () => {
  // The operator removed doubling on 2026-09-22, looking at the live game:
  // "remove the double thing". These cells are the POSITIVE form of that -
  // they assert what a game is worth and what a match carries, so putting a
  // cube back is a red test rather than a quiet multiplication.
  it("scores a played-out game at exactly its own points", () => {
    const g = startGame(5);
    expect(applyGameResult(g, { winner: "b", points: 2 }).over).toEqual({ winner: "b", points: 2 });
    expect(applyGameResult(g, { winner: "w", points: 3 }).match.score).toEqual({ w: 3, b: 0 });
    expect(applyGameResult(g, { winner: "w", points: 1 }).match.score).toEqual({ w: 1, b: 0 });
  });

  it("carries nothing but the target and the score from game to game", () => {
    const after = nextGame(applyGameResult(startGame(5), { winner: "w", points: 2 }), "b");
    expect(Object.keys(after.match).sort()).toEqual(["score", "target"]);
    expect(after.match.score).toEqual({ w: 2, b: 0 });
    expect(after.over).toBeUndefined();
  });

  it("puts no stake on the game itself", () => {
    // A `cube`, a `stake` or a `crawford` key reappearing on Game or Match is
    // the whole defect this describes - the renderer would draw it again.
    expect(Object.keys(startGame(5)).sort()).toEqual(["board", "dice", "match", "turn"]);
  });
});

describe("the match", () => {
  it("is over when a side reaches the target", () => {
    const g = startGame(5);
    expect(matchOver(g)).toBeNull();
    expect(matchOver({ ...g, match: { ...g.match, score: { w: 5, b: 3 } } })).toBe("w");
    expect(matchOver({ ...g, match: { ...g.match, score: { w: 1, b: 6 } } })).toBe("b");
  });

});

describe("applyMove is pure", () => {
  it("never mutates the board handed to it", () => {
    const before = startBoard();
    const snapshot = JSON.stringify(before);
    const after = applyMove(before, "w", { from: 24, to: 23, die: 1 });
    expect(JSON.stringify(before)).toBe(snapshot);
    expect(after.points[24]).toBe(1);
    expect(after.points[23]).toBe(1);
  });
});
