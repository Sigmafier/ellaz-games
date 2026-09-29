import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const SRC = readFileSync(new URL("./Memory.tsx", import.meta.url), "utf8");

/**
 * EVERY LEVEL'S ROW OF CARDS FITS THE NARROWEST PHONE'S BOARD.
 *
 * A card is square and has a minimum height, so it has a minimum WIDTH too, and
 * a grid of `1fr` columns cannot shrink a column below its content. When
 * `cols x CARD_MIN + gaps` is wider than the board, the grid spills out of its
 * box - and in Hebrew it spills to the LEFT, off the panel. Reported from a
 * 350px iPhone in Hebrew on hard: "Tiles are hidden in hard mode (on the left)".
 * It was 5 x 64 + 48 = 368px of cards on a 322px board.
 *
 * The phone board is `min(92vw, 56vh, 460px)` (the `boardVars` call in the
 * source); the width term is the one that binds on a portrait phone, and 320px
 * is the narrowest phone this site lays out for.
 */
const num = (name: string): number => {
  const m = SRC.match(new RegExp(`const ${name} = (\\d+);`));
  expect(m, `${name} is not declared as a number literal in Memory.tsx`).not.toBeNull();
  return Number(m![1]);
};
const colsOfEveryLevel = (): number[] => {
  const block = SRC.match(/const LEVELS = \[([\s\S]*?)\] as const;/);
  expect(block, "the LEVELS table is not declared the way this test reads it").not.toBeNull();
  return [...block![1].matchAll(/cols: (\d+)/g)].map((m) => Number(m[1]));
};
const vw = (): number => {
  const m = SRC.match(/boardVars\(\{ vw: (\d+),/);
  expect(m, "the board's phone width is not declared the way this test reads it").not.toBeNull();
  return Number(m![1]);
};
const NARROWEST = 320;
const widest = (cols: number[], card: number, gap: number) => Math.max(...cols.map((c) => c * card + (c - 1) * gap));

describe("memory's cards on a phone", () => {
  it("reads three levels, and the widest is hard's five columns (population guard)", () => {
    expect(colsOfEveryLevel()).toEqual([4, 4, 5]);
  });

  it("every level's row fits the board of a 320px phone", () => {
    const board = (vw() / 100) * NARROWEST;
    expect(widest(colsOfEveryLevel(), num("CARD_MIN"), num("GAP"))).toBeLessThanOrEqual(board);
  });

  it("the floor is still a finger's worth", () => {
    expect(num("CARD_MIN")).toBeGreaterThanOrEqual(44);
  });

  it("the check fires on the floor as it shipped (negative control)", () => {
    const board = (vw() / 100) * NARROWEST;
    expect(widest(colsOfEveryLevel(), 64, num("GAP"))).toBeGreaterThan(board);
    // and at the reporter's own 350px phone, which is the case that was seen
    expect(widest(colsOfEveryLevel(), 64, num("GAP"))).toBeGreaterThan((vw() / 100) * 350);
  });
});
