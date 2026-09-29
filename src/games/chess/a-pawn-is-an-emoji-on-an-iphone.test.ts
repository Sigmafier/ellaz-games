import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const SRC = readFileSync(new URL("./Chess.tsx", import.meta.url), "utf8");

/**
 * A GLYPH THAT IS ALSO AN EMOJI IS DRAWN AS A PICTURE, AND A PICTURE HAS NO INK.
 *
 * Reported from an iPhone, 2026-09-21, Hebrew, opening position: "all the
 * soldiers are black" - soldiers being what Hebrew calls pawns. U+265F BLACK
 * CHESS PAWN is the one character in the solid set that Unicode also lists as
 * an emoji, so Safari on iOS takes it from the colour-emoji font. That picture
 * is a black pawn whatever `color` and `-webkit-text-stroke` say, so white's
 * eight pawns drew black beside a correctly ivory king and queen. No gate here
 * renders on iOS, and the desktop fonts this repo is checked on pick the text
 * glyph.
 *
 * U+FE0E (VARIATION SELECTOR-15) asks for the text presentation. This reads the
 * glyph table out of the source and requires it after every emoji-capable
 * glyph - so a pawn that loses it, or a future set that adds another emoji
 * character, reds here. Every non-ASCII character in this file is written as a
 * \u escape, because a pasted selector is invisible and gets lost.
 */
const VS15 = "\uFE0E";
const VS16 = "\uFE0F";
const SET = { k: "\u265A", q: "\u265B", r: "\u265C", b: "\u265D", n: "\u265E", p: "\u265F" };

const table = (): Record<string, string> => {
  const m = SRC.match(/const GLYPH: Record<string, string> = (\{[^}]*\});/);
  expect(m, "the GLYPH table is not declared the way this test reads it").not.toBeNull();
  // A plain object literal of string literals: JSON once the keys are quoted,
  // and JSON reads a "\uFE0E" escape the same way the TypeScript does.
  return JSON.parse(m![1].replace(/(\w+):/g, '"$1":'));
};

const EMOJI = /\p{Emoji}/u;
const bare = (glyph: string) => [...glyph].filter((c) => c !== VS15 && c !== VS16);
const unsafe = (glyphs: Record<string, string>) =>
  Object.entries(glyphs)
    .filter(([, g]) => bare(g).some((c) => EMOJI.test(c) && !/[0-9#*]/.test(c)))
    .filter(([, g]) => !g.endsWith(VS15))
    .map(([k]) => k);

describe("the chess glyphs", () => {
  it("reads all six pieces out of the source, and they are the solid set", () => {
    // Population guard: an empty table would pass the next cell by having nothing in it.
    const t = table();
    expect(Object.keys(t).sort()).toEqual(["b", "k", "n", "p", "q", "r"]);
    for (const [k, g] of Object.entries(t)) expect(bare(g).join("")).toBe(SET[k as keyof typeof SET]);
  });

  it("the pawn is the emoji-capable one - the premise of this file", () => {
    // If Unicode ever stopped listing U+265F as an emoji, this file is noise.
    expect(EMOJI.test(SET.p)).toBe(true);
    expect([SET.k, SET.q, SET.r, SET.b, SET.n].some((c) => EMOJI.test(c))).toBe(false);
  });

  it("every emoji-capable glyph asks for its TEXT presentation, so it takes the army's ink", () => {
    expect(unsafe(table()), "a glyph that is also an emoji draws as a black picture on an iPhone").toEqual([]);
  });

  it("the check fires on the glyph table as it shipped (negative control)", () => {
    expect(unsafe(SET)).toEqual(["p"]);
    // and the EMOJI selector is not a fix - it asks for the picture outright
    expect(unsafe({ ...SET, p: SET.p + VS16 })).toEqual(["p"]);
    // positive control: the fixed spelling passes
    expect(unsafe({ ...SET, p: SET.p + VS15 })).toEqual([]);
  });
});
