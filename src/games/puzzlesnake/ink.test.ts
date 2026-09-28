import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { FONT, INK } from "./ink";

// The copy in ink.ts must stay the Snake family's colours exactly.
describe("Puzzle Snake wears Snake's colours", () => {
  const src = readFileSync(join(__dirname, "..", "snake", "SnakeCards.tsx"), "utf8");

  it("INK is byte-for-byte snake's INK", () => {
    const m = /export const INK = (\{[^}]*\});/.exec(src);
    expect(m, "snake's INK moved - re-pin this test").not.toBeNull();
    const theirs = JSON.parse(m![1].replace(/(\w+):/g, '"$1":'));
    expect(INK).toEqual(theirs);
  });

  it("and the same font list", () => {
    expect(src).toContain(`export const FONT = "${FONT}";`);
  });
});
