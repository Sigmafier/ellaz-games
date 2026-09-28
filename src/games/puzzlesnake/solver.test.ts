import { describe, expect, it } from "vitest";
import { newGame, parseLevel, step } from "./logic";
import { LEVELS, LEVEL_IDS, nextLevelId, placeInWorld } from "./levels";
import { greedy, solve } from "./solver";

/*
 * Every level is solvable, its recorded par IS the solver's optimum, and the
 * two worlds are really a ladder. The solver is the source of truth for par, so
 * a redrawn level whose optimum moved reds here by name.
 */

const W1 = LEVELS.filter((l) => l.world === 1);
const W2 = LEVELS.filter((l) => l.world === 2);

describe("the solver itself", () => {
  it("finds the obvious optimum on a board small enough to check by eye", () => {
    // Right twice to the apple, down three to the door.
    const lv = parseLevel(["#######", "#.....#", "#.oH.A#", "#.....#", "#.....#", "#....E#", "#######"]);
    expect(solve(lv)?.par).toBe(5);
    expect(solve(lv)?.path).toEqual(["right", "right", "down", "down", "down"]);
  });

  it("says unsolvable when it is", () => {
    // The apple is behind a wall the snake can never reach.
    const lv = parseLevel(["#######", "#Ho...#", "#######", "#A...E#", "#######"]);
    expect(solve(lv)).toBeNull();
  });
});

describe("the levels", () => {
  it("are twelve, six a world, with ids that never change shape", () => {
    expect(LEVELS).toHaveLength(12);
    expect(W1).toHaveLength(6);
    expect(W2).toHaveLength(6);
    expect(LEVEL_IDS).toEqual(["1-1", "1-2", "1-3", "1-4", "1-5", "1-6", "2-1", "2-2", "2-3", "2-4", "2-5", "2-6"]);
    expect(nextLevelId("1-6")).toBe("2-1");
    expect(nextLevelId("2-6")).toBeUndefined();
    expect(placeInWorld("1-3")).toEqual({ n: 3, of: 6 });
    expect(placeInWorld("2-6")).toEqual({ n: 6, of: 6 });
  });

  it("keep one board size per world, so the box never changes between levels", () => {
    for (const l of LEVELS) {
      const lv = parseLevel(l.rows);
      const side = l.world === 1 ? 7 : 9;
      expect([lv.width, lv.height], l.id).toEqual([side, side]);
    }
  });

  for (const l of LEVELS) {
    it(`${l.id}: solvable, par ${l.par} is the optimum, and the line replays through the real rules`, () => {
      const lv = parseLevel(l.rows);
      const t = performance.now();
      const sol = solve(lv);
      const ms = performance.now() - t;
      expect(sol, `${l.id} has no solution`).not.toBeNull();
      expect(sol!.par, `${l.id}: recorded par ${l.par}, solver says ${sol!.par}`).toBe(l.par);
      // Well under a second in node, so a test run can afford all twelve.
      expect(ms, `${l.id} took ${ms.toFixed(0)} ms`).toBeLessThan(1000);

      let s = newGame(lv);
      const outcomes: string[] = [];
      for (const d of sol!.path) {
        const r = step(s, d);
        outcomes.push(r.outcome);
        s = r.state;
      }
      expect(outcomes.slice(0, -1).every((o) => o === "moved" || o === "ate")).toBe(true);
      expect(outcomes.at(-1)).toBe("solved");
      expect(s.moves).toBe(l.par);
    });
  }
});

describe("difficulty rises", () => {
  it("par never falls inside a world", () => {
    for (const world of [W1, W2]) {
      for (let i = 1; i < world.length; i++) {
        expect(world[i].par, `${world[i].id} is easier than ${world[i - 1].id}`).toBeGreaterThanOrEqual(world[i - 1].par);
      }
    }
  });

  it("World 2 starts above the top of World 1, with a longer snake", () => {
    expect(Math.min(...W2.map((l) => l.par))).toBeGreaterThan(Math.max(...W1.map((l) => l.par)));
    const len = (rows: readonly string[]) => parseLevel(rows).body.length;
    expect(Math.min(...W2.map((l) => len(l.rows)))).toBeGreaterThan(Math.max(...W1.map((l) => len(l.rows))));
  });

  it("the greedy bot can play: it finishes the first level, at par", () => {
    // The positive control. A bot that failed everything would make the next
    // assertion meaningless.
    const r = greedy(parseLevel(LEVELS[0].rows));
    expect(r).toEqual({ finished: true, moves: LEVELS[0].par });
  });

  it("the greedy bot cannot finish at least 4 of the 6 Maze levels", () => {
    const fails = W2.filter((l) => !greedy(parseLevel(l.rows)).finished).map((l) => l.id);
    expect(fails.length, `greedy failed only ${fails.join(", ")}`).toBeGreaterThanOrEqual(4);
  });

  it("and exactly: it is stuck on every Maze level, and on 1-4 and 1-6 of the Garden", () => {
    // The page quotes "stuck on all 6 Maze levels"; this is the line that says so.
    const report = LEVELS.map((l) => [l.id, greedy(parseLevel(l.rows))] as const);
    expect(report.filter(([, r]) => !r.finished).map(([id, r]) => `${id}:${r.finished ? "" : r.why}`)).toEqual([
      "1-4:stuck",
      "1-6:stuck",
      "2-1:stuck",
      "2-2:stuck",
      "2-3:stuck",
      "2-4:stuck",
      "2-5:stuck",
      "2-6:stuck",
    ]);
  });

  it("the whole game at its best is 277 presses: 88 in the Garden, 189 in the Maze", () => {
    const sum = (ls: typeof LEVELS) => ls.reduce((n, l) => n + l.par, 0);
    expect([sum(W1), sum(W2), sum(LEVELS)]).toEqual([88, 189, 277]);
  });
});

/*
 * The comments in levels.ts say which apples lose a level if eaten first, and
 * the game's page quotes the total. Both are held here: `true` means eating
 * that apple (in reading order) FIRST leaves the level unsolvable.
 */
const LOSES_FIRST: Record<string, boolean[]> = {
  "1-1": [false],
  "1-2": [false, false],
  "1-3": [false, true, true],
  "1-4": [true, false, false],
  "1-5": [false, false, false],
  "1-6": [false, true, true],
  "2-1": [true, true, false, false],
  "2-2": [true, true, true, false],
  "2-3": [true, false, false, false],
  "2-4": [false, false, false, true],
  "2-5": [false, true, true, true],
  "2-6": [true, false, false, true],
};

describe("which apples lose the level if you eat them first", () => {
  for (const l of LEVELS) {
    it(`${l.id}`, () => {
      const lv = parseLevel(l.rows);
      expect(lv.apples.map((_, i) => solve(lv, { first: i }) === null)).toEqual(LOSES_FIRST[l.id]);
    });
  }

  it("half the Maze's apples are traps: 12 of 24", () => {
    const traps = W2.flatMap((l) => LOSES_FIRST[l.id]).filter(Boolean).length;
    const apples = W2.reduce((n, l) => n + parseLevel(l.rows).apples.length, 0);
    expect([traps, apples]).toEqual([12, 24]);
  });

  it("1-2's order is the whole cost: 11 presses one way round, 19 the other", () => {
    const lv = parseLevel(LEVELS[1].rows);
    expect([solve(lv, { first: 0 })?.par, solve(lv, { first: 1 })?.par]).toEqual([11, 19]);
  });
});
