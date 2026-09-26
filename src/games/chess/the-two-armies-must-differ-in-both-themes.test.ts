import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const SRC = readFileSync(new URL("./Chess.tsx", import.meta.url), "utf8");
const TOKENS = readFileSync(new URL("../../ui/tokens.css", import.meta.url), "utf8");

/**
 * THE ONE THING A CHESS BOARD MUST DO IS TELL THE TWO ARMIES APART.
 *
 * This shipped live on 2026-09-21 with `color: piece[0] === "w" ? "#fff" :
 * "var(--text)"`. Correct on the day theme, and on the night one `--text` is
 * `#f5f6ff`, so both armies rendered the same near-white: measured on the live
 * page, **16.75:1 in market and 1.08:1 in night**. Nothing in this repo caught
 * it. `contrast.test.ts` reads a hand-kept list of TOKEN PAIRS, and this
 * collision is between a token and a literal, so it was not on the list - the
 * same hand-kept-mirror shape the rules file collects. Every other gate reads
 * bytes, chunk graphs, layout boxes or emitted documents; none of them reads a
 * colour.
 *
 * So the pin is here, on the SOURCE, and it is the pair that is pinned rather
 * than either colour: a future set may be ivory and walnut, and that is fine,
 * as long as a player can see which is theirs.
 */
const hex = (h: string): [number, number, number] => {
  const v = h.replace("#", "");
  const f = v.length === 3 ? v.split("").map((c) => c + c) : (v.match(/../g) as string[]);
  return f.slice(0, 3).map((x) => parseInt(x, 16)) as [number, number, number];
};
const lum = (c: [number, number, number]) => {
  const v = c.map((x) => x / 255).map((u) => (u <= 0.03928 ? u / 12.92 : ((u + 0.055) / 1.055) ** 2.4));
  return 0.2126 * v[0] + 0.7152 * v[1] + 0.0722 * v[2];
};
const ratio = (a: [number, number, number], b: [number, number, number]) => {
  const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p);
  return (x + 0.05) / (y + 0.05);
};

const armyOf = (name: string) => {
  const m = SRC.match(new RegExp(`const ${name} = "(#[0-9a-fA-F]{3,8})"`));
  expect(m, `${name} is not declared as a literal hex in Chess.tsx`).not.toBeNull();
  return m![1];
};

describe("the two armies", () => {
  it("are told apart by the same amount in every theme, because neither is a theme token", () => {
    // The FALSIFIER, and the whole reason this cell exists: a side whose
    // colour is `var(--…)` changes when the theme does, so its distance from
    // the other side is not one number and cannot be asserted here at all.
    const board = SRC.slice(SRC.indexOf("position.board.map("), SRC.indexOf("position.board.map(") + 1800);
    expect(board, "a piece's colour is a theme token - it will collide with the other army in one theme")
      .not.toMatch(/color:\s*piece\[0\][^\n]*var\(--/);
    expect(ratio(hex(armyOf("LIGHT_ARMY")), hex(armyOf("DARK_ARMY"))))
      .toBeGreaterThanOrEqual(7);
  });

  it("each carry the OTHER army's tone as an outline, so both read on a light board and a dark one", () => {
    // Measured off the rendered squares, 2026-09-21: market 255,247,224 and
    // 234,175,195; night 57,54,70 and 57,54,121. A light piece is 1.00:1
    // against a market square and a dark piece is 1.45:1 against a night one,
    // so on each theme ONE army is invisible by its fill alone. The outline is
    // not decoration - it is that army's only edge on that board.
    const board = SRC.slice(SRC.indexOf("position.board.map("), SRC.indexOf("position.board.map(") + 1800);
    expect(board, "the outline is conditional - one army is shipping without an edge")
      .toMatch(/WebkitTextStroke: `[^`]*\$\{piece\[0\] === "w" \? DARK_ARMY : LIGHT_ARMY\}`/);
    // Outside the fill, or a heavy stroke eats a small glyph - which is what
    // made every piece read grey on the mock's first render.
    expect(board, "paintOrder is not stroke-first, so the outline eats the glyph").toContain('paintOrder: "stroke fill"');
  });

  it("uses a set that renders SOLID, never the hairline outline glyphs", () => {
    // U+2654..2659 is Unicode's "white" set and it is a thin outline that
    // disappears at a phone's cell size. Both armies are drawn from the solid
    // set and coloured; a "white" glyph creeping back in is a regression that
    // looks fine on a desktop and vanishes on the device most players use.
    expect(SRC, "the hairline outline glyph set is back in the board").not.toMatch(/[♔-♙]/);
    expect(SRC.match(/[♚-♟]/g)?.length, "the solid glyph set is not being used").toBeGreaterThanOrEqual(6);
  });

  it("does not claim --text is dark - the token this bug assumed", () => {
    // The POSITIVE CONTROL for the premise. If `--text` were dark in every
    // theme the original code would have been right, and this whole file is
    // noise. It is not: the night theme redefines it near-white.
    expect(TOKENS, "tokens.css no longer defines a night --text - re-read this file's premise")
      .toMatch(/--text:\s*#f5f6ff/);
  });
});
