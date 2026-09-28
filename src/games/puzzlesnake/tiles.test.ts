import { describe, expect, it } from "vitest";
import { facing, judge, legalDirs, newGame, parseLevel, step, undo, type Dir } from "./logic";
import { pressesOf } from "./session";

/*
 * World 2's three new tiles, written before the rules. Each board is tiny and
 * drawn by hand so every assertion can be checked against the picture.
 *
 *   K key     - the head picks it up by entering it. It does NOT grow the snake.
 *   L lock    - a wall until a key is held. ONE key opens EVERY lock, for good.
 *   > < ^ v   - one-way: may only be ENTERED moving the way the arrow points.
 *               Leaving it, in any direction, is free.
 *   @ portal  - exactly two. The head entering one comes out of the OTHER'S
 *               cell, one step on in the same direction. Portal cells are never
 *               occupied; the body follows the head's cells, so it goes through
 *               cell by cell.
 */

function play(rows: string[], dirs: Dir[]) {
  let s = newGame(parseLevel(rows));
  for (const d of dirs) s = step(s, d).state;
  return s;
}

describe("parsing the new tiles", () => {
  it("reads keys, locks, arrows and a portal pair", () => {
    const lv = parseLevel(["########", "#oHK.LA#", "#>^<v..#", "#@....@#", "#E.....#", "########"]);
    const w = 8;
    expect(lv.keys).toEqual([1 * w + 3]);
    expect(lv.locks[1 * w + 5]).toBe(true);
    expect(lv.locks[1 * w + 4]).toBe(false);
    expect([1, 2, 3, 4].map((x) => lv.arrows[2 * w + x])).toEqual(["right", "up", "left", "down"]);
    expect(lv.arrows[2 * w + 5]).toBeNull();
    expect(lv.portals).toEqual([3 * w + 1, 3 * w + 6]);
    expect(lv.walls[1 * w + 5]).toBe(false); // a lock is not a wall; the rules decide
  });

  it("refuses a lone portal, three portals, and a lock with no key anywhere", () => {
    expect(() => parseLevel(["######", "#oH@A#", "#...E#", "######"])).toThrow(/portal/);
    expect(() => parseLevel(["######", "#oH@A#", "#@.@E#", "######"])).toThrow(/portal/);
    expect(() => parseLevel(["######", "#oHLA#", "#...E#", "######"])).toThrow(/key/);
  });
});

describe("key and lock", () => {
  // body (1,1), head (2,1), key (3,1), floor (4,1), lock (5,1), apple (6,1).
  const KL = ["########", "#oHK.LA#", "#.######", "#E.....#", "########"];
  const at = (x: number, y: number) => y * 8 + x;

  it("the head picks a key up by entering it, and the snake does not grow", () => {
    const r = step(newGame(parseLevel(KL)), "right");
    expect(r.outcome).toBe("key");
    expect(r.state.got).toEqual([true]);
    expect(r.state.body).toEqual([at(3, 1), at(2, 1)]);
    expect(r.state.moves).toBe(1);
  });

  it("a lock refuses the head without a key, and a refusal is not a move", () => {
    const s0 = newGame(parseLevel(KL));
    const noKey = { ...s0, body: [at(4, 1), at(3, 1)] };
    const r = step(noKey, "right");
    expect(r.outcome).toBe("locked");
    expect(r.state).toBe(noKey);
  });

  it("with the key held the lock is floor, and stays open", () => {
    const s = play(KL, ["right", "right"]);
    const r = step(s, "right");
    expect(r.outcome).toBe("moved");
    expect(r.state.body[0]).toBe(at(5, 1));
    expect(step(r.state, "right").outcome).toBe("ate");
  });

  it("one key opens every lock on the board", () => {
    const TWO = ["#######", "#oHK.L#", "#.##..#", "#.L.AE#", "#######"];
    const s = play(TWO, ["right"]);
    expect(s.got).toEqual([true]);
    const w = 7;
    expect(judge({ ...s, body: [4 + w, 3 + w] }, "right")).toBe("moved");
    expect(judge({ ...s, body: [1 + 3 * w, 1 + 2 * w] }, "right")).toBe("moved");
  });

  it("undo puts the key back", () => {
    const s = play(KL, ["right", "right"]);
    const u = undo(undo(s));
    expect(u.got).toEqual([false]);
    expect(u.moves).toBe(0);
    expect(undo(s).got).toEqual([true]);
  });
});

describe("one-way tiles", () => {
  // head (2,1) faces a '>' at (3,1); a '<' waits at (3,3).
  const OW = ["#######", "#oH>..#", "#.....#", "#.A<.E#", "#######"];

  it("may be entered moving the way the arrow points", () => {
    expect(step(newGame(parseLevel(OW)), "right").outcome).toBe("moved");
  });

  it("refuses the head entering any other way, and a refusal is not a move", () => {
    const s = play(OW, ["right", "down"]); // on (3,2), right above the '<'
    const r = step(s, "down");
    expect(r.outcome).toBe("oneway");
    expect(r.state).toBe(s);
  });

  it("leaving an arrow tile is free in every direction", () => {
    const s = play(OW, ["right"]); // head on the '>'
    expect(legalDirs(s)).toEqual(["down", "right"]);
  });

  it("the '<' is entered moving left, and the apple beyond it eaten", () => {
    const s = play(OW, ["right", "down", "right", "down"]); // (4,3)
    const a = step(s, "left");
    expect(a.outcome).toBe("moved");
    expect(step(a.state, "left").outcome).toBe("ate");
  });
});

describe("portals", () => {
  // head (2,1) faces a portal at (3,1); its twin is at (4,3). Apple (6,3).
  const PT = ["########", "#oH@...#", "#......#", "#...@.A#", "#E.....#", "########"];
  const at = (x: number, y: number) => y * 8 + x;

  it("the head entering one comes out of the other's cell, one step on the same way", () => {
    const r = step(newGame(parseLevel(PT)), "right");
    expect(r.outcome).toBe("moved");
    expect(r.state.body).toEqual([at(5, 3), at(2, 1)]);
    expect(r.state.moves).toBe(1);
  });

  it("the body follows through, cell by cell", () => {
    const s = play(PT, ["right", "right", "down"]);
    // ate at (6,3) and grew to 3: the tail left (2,1) only on the third press.
    expect(s.body).toEqual([at(6, 4), at(6, 3), at(5, 3)]);
    const two = play(PT, ["right", "right"]);
    expect(two.body).toEqual([at(6, 3), at(5, 3), at(2, 1)]);
  });

  it("works both ways", () => {
    // From (3,2) pressing up enters the (3,1) portal and comes out above (4,3).
    const s0 = newGame(parseLevel(PT));
    const r = step({ ...s0, body: [at(3, 2), at(2, 2)] }, "up");
    expect(r.outcome).toBe("moved");
    expect(r.state.body).toEqual([at(4, 2), at(3, 2)]);
  });

  it("a portal whose far side is a wall is a wall", () => {
    const s0 = newGame(parseLevel(PT));
    // head at (4,4) pressing up enters (4,3) and would come out above (3,1): the wall row.
    expect(judge({ ...s0, body: [at(4, 4), at(3, 4)] }, "up")).toBe("wall");
  });

  it("undo walks back through the portal, and the saved presses are the presses", () => {
    const s = play(PT, ["right", "right", "down"]);
    expect(pressesOf(s)).toEqual(["right", "right", "down"]);
    const u = undo(undo(undo(s)));
    expect(u.body).toEqual(newGame(parseLevel(PT)).body);
    expect(u.eaten).toEqual([false]);
  });

  it("the head looks the way it last moved, not at a neck on the far side of a portal", () => {
    const s = play(PT, ["right"]);
    expect(facing(s)).toBe("right");
    expect(facing(newGame(parseLevel(PT)))).toBe("right");
    expect(facing(play(PT, ["right", "down"]))).toBe("down");
  });
});

describe("the words for the new tiles", () => {
  it("every language names World 2 Tricks-style and explains each tile in one short line", async () => {
    const { WORDS, hintFor } = await import("./words");
    for (const [locale, T] of Object.entries(WORDS)) {
      for (const t of ["key", "oneway", "portal"] as const) {
        const line = hintFor(T, t);
        expect(line, `${locale} ${t}`).toBeTruthy();
        // One line on a 390px phone's bottom wall row: short, and no em dash.
        expect(line.length, `${locale} ${t}: ${line}`).toBeLessThanOrEqual(60);
        expect(line, `${locale} ${t}`).not.toMatch(/[–—―]/);
      }
      expect(T.tricks, locale).toBeTruthy();
      expect(T.tricksBlurb, locale).toBeTruthy();
    }
    expect(WORDS.en.tricks).toBe("Tricks");
    expect(WORDS.en.tricksBlurb).toBe("Each level has one new tile.");
  });
});
