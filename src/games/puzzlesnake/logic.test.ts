import { describe, expect, it } from "vitest";
import {
  STAR_MARGIN_FLOOR,
  exitOpen,
  isSolved,
  isStuck,
  legalDirs,
  newGame,
  parseLevel,
  starMargin,
  starsFor,
  step,
  undo,
  type Dir,
} from "./logic";

/*
 * The rules, written before the rules. Every board here is tiny and drawn by
 * hand so a reader can check each assertion against the picture above it.
 *
 *   # wall   . floor   A apple   E exit   H head   o body (a chain from H)
 */

const TINY = [
  "######",
  "#Ho.A#",
  "#....#",
  "#...E#",
  "######",
];

function play(rows: string[], dirs: Dir[]) {
  let s = newGame(parseLevel(rows));
  for (const d of dirs) s = step(s, d).state;
  return s;
}

describe("parseLevel", () => {
  it("reads the walls, the apples, the exit and the snake head-first", () => {
    const lv = parseLevel(TINY);
    expect(lv.width).toBe(6);
    expect(lv.height).toBe(5);
    expect(lv.body).toEqual([1 * 6 + 1, 1 * 6 + 2]);
    expect(lv.apples).toEqual([1 * 6 + 4]);
    expect(lv.exit).toBe(3 * 6 + 4);
    expect(lv.walls[0]).toBe(true);
    expect(lv.walls[1 * 6 + 3]).toBe(false);
  });

  it("follows a bent body in order, whatever order the rows put it in", () => {
    const lv = parseLevel(["#####", "#oo.#", "#.oH#", "#.AE#", "#####"]);
    // head (3,2) -> (2,2) -> (2,1) -> (1,1)
    expect(lv.body).toEqual([2 * 5 + 3, 2 * 5 + 2, 1 * 5 + 2, 1 * 5 + 1]);
  });

  it("refuses a board it cannot read, rather than guessing", () => {
    expect(() => parseLevel(["####", "#.A#", "#.E#", "####"])).toThrow(/head/);
    expect(() => parseLevel(["####", "#HA#", "#..#", "####"])).toThrow(/exit/);
    expect(() => parseLevel(["####", "#HE#", "#..#", "####"])).toThrow(/apple/);
    expect(() => parseLevel(["#####", "#H.E#", "#A#", "#####"])).toThrow(/ragged/);
    expect(() => parseLevel(["#####", "#HxE#", "#A..#", "#####"])).toThrow(/unknown/);
    // a body cell the chain from the head never reaches
    expect(() => parseLevel(["######", "#H.oA#", "#...E#", "######"])).toThrow(/body/);
    // a fork: two body cells both touch the head
    expect(() => parseLevel(["#####", "#oHo#", "#.AE#", "#####"])).toThrow(/body/);
  });
});

describe("step", () => {
  it("moves one cell and nothing moves without a press", () => {
    const s0 = newGame(parseLevel(TINY));
    const { state: s1, outcome } = step(s0, "down");
    expect(outcome).toBe("moved");
    expect(s1.body).toEqual([2 * 6 + 1, 1 * 6 + 1]);
    expect(s1.moves).toBe(1);
  });

  it("refuses a wall, and a refusal is not a move", () => {
    const s0 = newGame(parseLevel(TINY));
    const { state, outcome } = step(s0, "up");
    expect(outcome).toBe("wall");
    expect(state).toBe(s0);
    expect(state.moves).toBe(0);
  });

  it("refuses the snake's own body (turning back into the neck included)", () => {
    const s0 = newGame(parseLevel(TINY));
    expect(step(s0, "right").outcome).toBe("body");
  });

  // A coil cannot be drawn in ASCII (a head beside two body cells is a fork),
  // so these two build the coil by hand on a straight parsed snake.
  const COIL_ROWS = ["######", "#H...#", "#o..A#", "#...E#", "######"];
  const at = (x: number, y: number) => y * 6 + x;
  // head (1,1), (2,1), (2,2), tail (1,2): the tail sits directly under the head.
  const coil = () => ({ ...newGame(parseLevel(COIL_ROWS)), body: [at(1, 1), at(2, 1), at(2, 2), at(1, 2)] });

  it("lets the head into the cell the tail is leaving on the same step", () => {
    const { outcome, state } = step(coil(), "down");
    expect(outcome).toBe("moved");
    expect(state.body).toEqual([at(1, 2), at(1, 1), at(2, 1), at(2, 2)]);
  });

  it("but NOT on a step that grows, because then the tail stays put", () => {
    // Unreachable from a parsed level - an apple is never under the body - so
    // the apple is planted under the tail by hand. The rule is enforced anyway,
    // because it is the rule and not an accident of today's levels.
    const s = coil();
    const planted = { ...s, level: { ...s.level, apples: [...s.level.apples, at(1, 2)] }, eaten: [...s.eaten, false] };
    expect(step(planted, "down").outcome).toBe("body");
  });

  it("eats an apple, grows by one, and counts it", () => {
    let s = newGame(parseLevel(TINY));
    s = step(s, "down").state;
    s = step(s, "right").state;
    s = step(s, "right").state;
    const r = step(s, "right"); // (4,2)? no: head goes (1,2)->(2,2)->(3,2)->(4,2)
    expect(r.outcome).toBe("moved");
    const r2 = step(r.state, "up"); // (4,1) is the apple
    expect(r2.outcome).toBe("ate");
    expect(r2.state.body).toHaveLength(3);
    expect(r2.state.eaten).toEqual([true]);
  });
});

describe("the exit", () => {
  it("is shut, and refuses the head, until the last apple is eaten", () => {
    let s = newGame(parseLevel(TINY));
    expect(exitOpen(s)).toBe(false);
    s = play(TINY, ["down", "down", "right", "right"]);
    // head at (3,3), exit at (4,3) - shut, so it is a wall.
    const r = step(s, "right");
    expect(r.outcome).toBe("shut");
    expect(r.state).toBe(s);
  });

  it("opens on the last apple and solves the level when the head reaches it", () => {
    const s = play(TINY, ["down", "right", "right", "up", "right"]);
    expect(exitOpen(s)).toBe(true);
    const a = step(s, "down");
    expect(a.outcome).toBe("moved");
    const b = step(a.state, "down");
    expect(b.outcome).toBe("solved");
    expect(isSolved(b.state)).toBe(true);
    expect(b.state.moves).toBe(7);
  });

  it("ignores every press once solved", () => {
    const s = play(TINY, ["down", "right", "right", "up", "right", "down", "down"]);
    expect(isSolved(s)).toBe(true);
    const r = step(s, "left");
    expect(r.outcome).toBe("solved");
    expect(r.state).toBe(s);
  });
});

describe("undo", () => {
  it("takes back exactly one move, apples included, and is unlimited", () => {
    const s0 = newGame(parseLevel(TINY));
    const s5 = play(TINY, ["down", "right", "right", "up", "right"]);
    expect(s5.eaten).toEqual([true]);
    const s4 = undo(s5);
    expect(s4.eaten).toEqual([false]);
    expect(s4.moves).toBe(4);
    let s = s5;
    for (let i = 0; i < 5; i++) s = undo(s);
    expect(s.body).toEqual(s0.body);
    expect(s.moves).toBe(0);
    expect(undo(s)).toBe(s); // nothing left to take back
  });

  it("takes back a solve", () => {
    const s = play(TINY, ["down", "right", "right", "up", "right", "down", "down"]);
    expect(isSolved(undo(s))).toBe(false);
  });
});

describe("stuck", () => {
  it("says stuck only when no press can move the snake", () => {
    // A 3-long snake in a dead end: head (1,1), body (2,1), (3,1), walls round.
    const rows = ["######", "#Hoo.#", "####A#", "#E...#", "######"];
    const s = newGame(parseLevel(rows));
    expect(legalDirs(s)).toEqual([]);
    expect(isStuck(s)).toBe(true);
  });

  it("is never stuck while one direction is open, and never once solved", () => {
    const s = newGame(parseLevel(TINY));
    expect(legalDirs(s)).toEqual(["down"]);
    expect(isStuck(s)).toBe(false);
    const done = play(TINY, ["down", "right", "right", "up", "right", "down", "down"]);
    expect(isStuck(done)).toBe(false);
  });
});

describe("stars", () => {
  it("3 at par or fewer, 2 within the margin, 1 for any solve", () => {
    expect(starsFor(9, 9)).toBe(3);
    expect(starsFor(7, 9)).toBe(3);
    expect(starsFor(9 + starMargin(9), 9)).toBe(2);
    expect(starsFor(9 + starMargin(9) + 1, 9)).toBe(1);
    expect(starsFor(200, 9)).toBe(1);
  });

  it("the margin is at least one detour, and grows with the level", () => {
    expect(STAR_MARGIN_FLOOR).toBe(2);
    expect(starMargin(4)).toBe(2);
    expect(starMargin(9)).toBe(2);
    expect(starMargin(30)).toBe(6);
    for (let par = 1; par < 60; par++) expect(starMargin(par)).toBeGreaterThanOrEqual(2);
  });
});
