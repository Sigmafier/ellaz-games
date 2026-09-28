import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

/*
 * A level that is not open yet is a button that answers with a wiggle, and
 * Undo and Restart are always pressable. `disabled` is reserved in this repo
 * for the genuinely impossible (CLAUDE.md, What a child touches), and "you have
 * not solved the one before it" is not impossible - it is later.
 *
 * Read from SOURCE with comments stripped first, or the paragraph explaining
 * the rule is read as a breach of it (a-diagnostic-that-truncates-what-it-compares.md).
 */
const DIR = __dirname;
const code = (f: string) =>
  readFileSync(join(DIR, f), "utf8")
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/\/\/.*$/gm, "")
    .replace(/\{\/\*[\s\S]*?\*\/\}/g, "");
const renderers = readdirSync(DIR).filter((f) => f.endsWith(".tsx"));

describe("nothing in Puzzle Snake is disabled", () => {
  it("reads the renderers", () => {
    expect(renderers).toEqual(expect.arrayContaining(["Board.tsx", "Controls.tsx", "Picker.tsx", "PuzzleSnakeGame.tsx"]));
  });

  for (const f of renderers) {
    it(`${f} never disables a control`, () => {
      expect(code(f)).not.toMatch(/\bdisabled\s*[=:]/);
      expect(code(f)).not.toMatch(/aria-disabled/);
    });
  }

  it("a level tile always hands its tap to the game, open or not", () => {
    const src = code("Picker.tsx");
    expect(src).toContain("onClick={(e) => props.onPick(l.id, e.currentTarget)}");
    // ...and the game answers a locked one with a wiggle, not with silence.
    const game = code("PuzzleSnakeGame.tsx");
    const open = game.slice(game.indexOf("const open = useCallback("), game.indexOf("return { restart, open }"));
    expect(open).toMatch(/if \(!isOpen\(id, stars\)\) \{\s*if \(el\) shake\(el/);
  });

  it("the stuck board offers Undo and Restart as real buttons", () => {
    const board = code("Board.tsx");
    const strip = board.slice(board.indexOf("function StuckStrip"), board.indexOf("const cardBtn"));
    expect(strip.match(/<button type="button" onClick=\{on(Undo|StartOver)\}/g)).toHaveLength(2);
  });
});
