import { describe, expect, it } from "vitest";
import { legalDirs, newGame, parseLevel, step, type Level } from "./logic";
import { LEVELS, LEVEL_IDS, introduces, levelById, nextLevelId, placeInWorld, tricksIn, type Trick } from "./levels";
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
      expect(outcomes.slice(0, -1).every((o) => o === "moved" || o === "ate" || o === "key")).toBe(true);
      expect(outcomes.at(-1)).toBe("solved");
      expect(s.moves).toBe(l.par);
    });
  }
});

describe("difficulty rises", () => {
  it("par never falls inside World 1", () => {
    for (let i = 1; i < W1.length; i++) {
      expect(W1[i].par, `${W1[i].id} is easier than ${W1[i - 1].id}`).toBeGreaterThanOrEqual(W1[i - 1].par);
    }
  });

  it("World 2 is SHORT: every redrawn level is 10 to 24 presses, rising, and 2-2 is the long one", () => {
    const redrawn = W2.filter((l) => l.id !== "2-2");
    for (const l of redrawn) expect(l.par, l.id).toBeGreaterThanOrEqual(10);
    for (const l of redrawn) expect(l.par, l.id).toBeLessThanOrEqual(24);
    for (let i = 1; i < redrawn.length; i++) expect(redrawn[i].par, redrawn[i].id).toBeGreaterThanOrEqual(redrawn[i - 1].par);
    expect(levelById("2-2")!.par).toBe(28);
  });

  it("the greedy bot can play: it finishes the first level, at par", () => {
    // The positive control. A bot that failed everything would make the next
    // assertion meaningless.
    const r = greedy(parseLevel(LEVELS[0].rows));
    expect(r).toEqual({ finished: true, moves: LEVELS[0].par });
  });

  it("the greedy bot cannot finish at least 4 of the 6 World 2 levels", () => {
    const fails = W2.filter((l) => !greedy(parseLevel(l.rows)).finished).map((l) => l.id);
    expect(fails.length, `greedy failed only ${fails.join(", ")}`).toBeGreaterThanOrEqual(4);
  });

  it("and exactly: it cannot finish any level from 1-3 on", () => {
    // The page quotes "cannot finish any of the 6 Tricks levels"; this is the line that says so.
    const report = LEVELS.map((l) => [l.id, greedy(parseLevel(l.rows))] as const);
    expect(report.filter(([, r]) => !r.finished).map(([id, r]) => `${id}:${r.finished ? "" : r.why}`)).toEqual([
      "1-3:stuck",
      "1-4:stuck",
      "1-5:stuck",
      "1-6:stuck",
      "2-1:looped",
      "2-2:stuck",
      "2-3:stuck",
      "2-4:looped",
      "2-5:stuck",
      "2-6:looped",
    ]);
  });

  it("the whole game at its best is 210 presses: 84 in the Garden, 126 in Tricks", () => {
    const sum = (ls: typeof LEVELS) => ls.reduce((n, l) => n + l.par, 0);
    expect([sum(W1), sum(W2), sum(LEVELS)]).toEqual([84, 126, 210]);
  });
});

/*
 * World 1 has no special tiles; each level from 1-2 to 1-5 teaches one thing
 * about the snake itself, and each is held to a measurement that says so.
 */
describe("each Garden level teaches its one idea", () => {
  it("1-1 and 1-6 are unchanged, byte for byte (1-6 is one of the two a player named)", () => {
    expect(levelById("1-1")!.rows).toEqual(["#######", "#.....#", "#.oH.A#", "#.....#", "#.....#", "#....E#", "#######"]);
    expect(levelById("1-6")!.rows).toEqual(["#######", "#..#..#", "#AooH.#", "##A#A##", "#E....#", "#..#..#", "#######"]);
    expect([levelById("1-1")!.par, levelById("1-6")!.par]).toEqual([5, 21]);
  });

  it("1-2, THE ORDER: the near apple first is 17 presses, the far one first is 11, and the greedy bot takes the 17", () => {
    const lv = parseLevel(levelById("1-2")!.rows);
    expect([solve(lv, { first: 0 })?.par, solve(lv, { first: 1 })?.par]).toEqual([17, 11]);
    expect(greedy(lv)).toEqual({ finished: true, moves: 17 });
  });

  it("1-3, DON'T BOX YOURSELF IN: two of three apples lose if eaten first, and greedy boxes itself in", () => {
    const lv = parseLevel(levelById("1-3")!.rows);
    expect(LOSES_FIRST["1-3"].filter(Boolean)).toHaveLength(2);
    expect(greedy(lv)).toMatchObject({ finished: false, why: "stuck" });
  });

  it("1-4, YOUR TAIL IS A DOOR: forbid the head the square the tail is leaving and there is no solution", () => {
    expect(solve(parseLevel(levelById("1-4")!.rows), { tailBlocks: true })).toBeNull();
    // The control: the counterfactual is not simply broken. Levels that do not
    // need the rule still solve under it, at their par.
    expect(solve(parseLevel(levelById("1-1")!.rows), { tailBlocks: true })?.par).toBe(5);
    expect(solve(parseLevel(levelById("1-2")!.rows), { tailBlocks: true })?.par).toBe(11);
  });

  it("1-5, TURN ROUND IN A TIGHT CORRIDOR: the only first press is the turn, and two apples are traps", () => {
    const lv = parseLevel(levelById("1-5")!.rows);
    expect(legalDirs(newGame(lv))).toEqual(["left"]);
    expect(LOSES_FIRST["1-5"].filter(Boolean)).toHaveLength(2);
  });
});

/*
 * World 2's promise: each level has one new idea and NEEDS it. Proven two
 * ways per level. First, the solver's own optimal line steps on every trick
 * the level uses. Second, the counterfactual: redraw the level with the tile
 * swapped out and solve again. Walled over, every trick leaves its level
 * unsolvable; floored, a lock or an arrow changes the par - so the tile is
 * doing the work, not decorating the board.
 */
const swap = (rows: readonly string[], tiles: string, to: string) => rows.map((r) => [...r].map((c) => (tiles.includes(c) ? to : c)).join(""));
const parOf = (rows: string[]) => solve(parseLevel(rows))?.par ?? null;
const ARROWS = "<>^v";

const COUNTERFACTUAL: Record<string, [tiles: string, to: "#" | ".", par: number | null][]> = {
  "2-1": [["L", "#", null], ["L", ".", 8]],
  "2-3": [[ARROWS, "#", null], [ARROWS, ".", 12]],
  "2-4": [["L", "#", null], ["L", ".", 14], [ARROWS, "#", null], [ARROWS, ".", 14]],
  "2-5": [["@", "#", null]],
  "2-6": [["L", "#", null], ["L", ".", 20], [ARROWS, "#", null], ["@", "#", null]],
};

/** The tricks the head actually touches on a line: a key or lock entered, an arrow entered, a portal passed. */
function tricksUsed(lv: Level, path: readonly string[]): Trick[] {
  let s = newGame(lv);
  const used = new Set<Trick>();
  for (const d of path) {
    const from = s.body[0];
    s = step(s, d as never).state;
    const to = s.body[0];
    if (lv.keys.includes(to) || lv.locks[to]) used.add("key");
    if (lv.arrows[to]) used.add("oneway");
    const dx = Math.abs((to % lv.width) - (from % lv.width));
    const dy = Math.abs(Math.floor(to / lv.width) - Math.floor(from / lv.width));
    if (dx + dy !== 1) used.add("portal");
  }
  return (["key", "oneway", "portal"] as const).filter((t) => used.has(t));
}

describe("each World 2 level needs its trick", () => {
  it("the tricks come in the planned order, one new one at a time", () => {
    expect(W2.map((l) => [l.id, tricksIn(l).join("+")])).toEqual([
      ["2-1", "key"],
      ["2-2", ""],
      ["2-3", "oneway"],
      ["2-4", "key+oneway"],
      ["2-5", "portal"],
      ["2-6", "key+oneway+portal"],
    ]);
    expect(LEVEL_IDS.map((id) => [id, introduces(id).join("+")]).filter(([, t]) => t)).toEqual([
      ["2-1", "key"],
      ["2-3", "oneway"],
      ["2-5", "portal"],
    ]);
    for (const l of W1) expect(tricksIn(l), l.id).toEqual([]);
  });

  it("2-2 is the player's level, byte for byte", () => {
    expect(levelById("2-2")!.rows).toEqual([
      "#########", "#...#E.A#", "#.o.#.AA#", "##o###.##", "#.o.....#", "##o###.##", "#.H.#.A.#", "#...#...#", "#########",
    ]);
  });

  for (const l of W2.filter((d) => d.id !== "2-2")) {
    it(`${l.id}: the optimal line steps on every trick the level has`, () => {
      const lv = parseLevel(l.rows);
      expect(tricksUsed(lv, solve(lv)!.path)).toEqual(tricksIn(l));
    });

    it(`${l.id}: take the trick away and the level changes`, () => {
      const rows = COUNTERFACTUAL[l.id];
      // Every trick in the level is walled over at least once.
      const walled = new Set(rows.filter(([, to]) => to === "#").map(([t]) => (t === ARROWS ? "oneway" : t === "@" ? "portal" : "key")));
      expect([...walled].sort()).toEqual([...tricksIn(l)].sort());
      for (const [tiles, to, par] of rows) {
        expect(parOf(swap(l.rows, tiles, to)), `${l.id}: ${tiles} -> ${to}`).toBe(par);
        if (par !== null) expect(par).not.toBe(l.par);
      }
    });
  }
});

/*
 * The comments in levels.ts say which apples lose a level if eaten first, and
 * the game's page quotes the total. Both are held here: `true` means eating
 * that apple (in reading order) FIRST leaves the level unsolvable.
 */
const LOSES_FIRST: Record<string, boolean[]> = {
  "1-1": [false],
  "1-2": [false, false],
  "1-3": [true, false, true],
  "1-4": [false, true],
  "1-5": [true, false, true],
  "1-6": [false, true, true],
  "2-1": [false, false],
  "2-2": [true, true, true, false],
  "2-3": [true, false, true],
  "2-4": [true, false],
  "2-5": [false, true, true],
  "2-6": [false, true],
};

describe("which apples lose the level if you eat them first", () => {
  for (const l of LEVELS) {
    it(`${l.id}`, () => {
      const lv = parseLevel(l.rows);
      expect(lv.apples.map((_, i) => solve(lv, { first: i }) === null)).toEqual(LOSES_FIRST[l.id]);
    });
  }

  it("five of the six World 2 levels have at least one trap apple; 2-1 has none", () => {
    expect(W2.filter((l) => LOSES_FIRST[l.id].some(Boolean)).map((l) => l.id)).toEqual(["2-2", "2-3", "2-4", "2-5", "2-6"]);
  });

  it("World 2's snake starts 3 long, except the kept 2-2 at 5", () => {
    expect(W2.map((l) => parseLevel(l.rows).body.length)).toEqual([3, 5, 3, 3, 3, 3]);
  });

  it("World 2 has 9 trap apples of 16", () => {
    const traps = W2.flatMap((l) => LOSES_FIRST[l.id]).filter(Boolean).length;
    const apples = W2.reduce((n, l) => n + parseLevel(l.rows).apples.length, 0);
    expect([traps, apples]).toEqual([9, 16]);
  });

  it("1-2's order is the whole cost: 11 presses one way round, 17 the other", () => {
    const lv = parseLevel(LEVELS[1].rows);
    expect([solve(lv, { first: 1 })?.par, solve(lv, { first: 0 })?.par]).toEqual([11, 17]);
  });
});
