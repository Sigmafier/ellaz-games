import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { APPLE, FONT, INK, SNAKE_COLORS } from "./ink";

// The copy in ink.ts must stay the Snake family's colours exactly.
describe("Snake Arena wears Snake's colours", () => {
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

  it("the player is Snake's mint, every snake has its own colour, and none is an apple", () => {
    expect(SNAKE_COLORS[0]).toBe(INK.mint);
    expect(new Set(SNAKE_COLORS).size).toBe(SNAKE_COLORS.length);
    expect(SNAKE_COLORS).not.toContain(APPLE.fill);
    expect(SNAKE_COLORS).not.toContain(APPLE.glow);
  });
});
