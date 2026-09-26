import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

/**
 * The dice are thrown ONTO THE BOARD, and the board is the shape of a board.
 *
 * Written 2026-09-22, when the operator asked for three things at once: more of
 * the screen's height, no doubling cube, and a throw that feels like a throw.
 * All three are geometry or a constant, and nothing else in this repo reads a
 * colour, a ratio or a keyframe - so these are the cells that would go red if
 * any of the three were quietly undone.
 *
 * It reads the SOURCE rather than rendering, for the reason `snapshot.test.ts`
 * does: this is a Preact component with a Phaser-free renderer and no test here
 * can drive a board. The browser half is
 * `scripts/repro/repro-backgammon-board.mjs`, which is what actually proves the
 * dice appear - a source scan can only prove the code says so.
 */
const SRC = readFileSync(new URL("./Backgammon.tsx", import.meta.url), "utf8");

const num = (name: string): number => {
  const m = SRC.match(new RegExp(`const ${name} = ([0-9.]+);`));
  if (!m) throw new Error(`${name} is not declared in Backgammon.tsx`);
  return Number(m[1]);
};

describe("the board's shape", () => {
  it("is horizontal, and wide enough for the two halves and the bar", () => {
    // Horizontal was the operator's ruling on 2026-09-21. 1.2 is a real
    // board's proportions and the number that buys the height they asked for
    // the next day; anything at or under 1 is a portrait board again.
    const ratio = num("RATIO");
    expect(ratio).toBeGreaterThan(1.1);
    expect(ratio).toBeLessThan(1.35);
  });

  it("leaves a bare strip down the middle for the dice to land in", () => {
    // Two quadrants plus the strip is the whole height. A QUAD of 50 is the
    // board this replaced - points meeting in the middle, nowhere to throw.
    const quad = num("QUAD");
    expect(quad).toBeGreaterThan(35);
    expect(quad).toBeLessThan(47);
    expect(100 - 2 * quad).toBeGreaterThanOrEqual(6);
  });

  it("sizes a checker so five of them fit inside one quadrant", () => {
    // The stack is drawn from the quadrant's outer edge inwards, so five
    // checkers at the declared height must not reach past QUAD. This is the
    // arithmetic that a ratio change silently breaks.
    const m = SRC.match(/const CHECKER = "min\(([0-9.]+)cqw, ([0-9.]+)cqh\)";/);
    expect(m, "CHECKER is not a min() of cqw and cqh").toBeTruthy();
    expect(5 * Number(m![2])).toBeLessThanOrEqual(num("QUAD"));
  });
});

describe("the dice", () => {
  it("are drawn in the board's middle strip, not in the card under it", () => {
    // `diceFor` is called by `side`, which is the board. A dice block back in
    // the footer is the layout this change undid.
    expect(SRC).toContain("{diceFor(thrower)}");
    const footer = SRC.slice(SRC.indexOf("footer={"));
    expect(footer).not.toContain("diceFor(");
  });

  it("are drawn as faces, and every face from one to six exists", () => {
    const pips = SRC.slice(SRC.indexOf("const PIPS"), SRC.indexOf("};", SRC.indexOf("const PIPS")));
    for (let n = 1; n <= 6; n++) {
      const row = pips.match(new RegExp(`\\n  ${n}: \\[([0-9, ]*)\\]`));
      expect(row, `no face for ${n}`).toBeTruthy();
      const cells = row![1].split(",").filter((s) => s.trim() !== "");
      // A face of N shows N pips, and every pip is one of the nine cells.
      expect(cells.length, `face ${n} has the wrong number of pips`).toBe(n);
      for (const c of cells) expect(Number(c)).toBeLessThan(9);
    }
  });

  it("show only the dice still to play, so a spent one leaves the board", () => {
    expect(SRC).toContain("game.dice.filter((_, i) => i >= played.length)");
  });

  it("tumble for long enough to read and short enough to play through", () => {
    const total = num("TUMBLE_TICKS") * num("TUMBLE_MS");
    expect(total).toBeGreaterThan(200);
    expect(total).toBeLessThan(600);
  });

  it("do not tumble for a player who asked for less motion", () => {
    expect(SRC).toContain("prefersReducedMotion()");
  });
});

describe("there is no doubling cube", () => {
  // The operator, looking at the live game: "remove the double thing". The
  // rules half is pinned in `logic.test.ts`; this is the surface half, and it
  // is a set of words rather than a behaviour because that is all a cube ever
  // was on this screen.
  it("is not offered, answered or drawn anywhere in the renderer", () => {
    for (const word of ["mayDouble", "applyDouble", "shouldDouble", "shouldTake", "game.cube", "setOffer"]) {
      expect(SRC, `${word} is back in the renderer`).not.toContain(word);
    }
  });
});
