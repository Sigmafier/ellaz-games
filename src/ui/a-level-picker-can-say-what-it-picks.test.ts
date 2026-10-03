// A game whose levels are not a difficulty can name its picker (Music Box's are
// a tune's LENGTH). Every other game must read exactly as before: the label is
// optional, and absent it falls back to the dictionary's "Difficulty" in BOTH
// arms of the chrome - the bar and the table's disc.
import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";

const src = (f: string) => readFileSync(new URL(f, import.meta.url), "utf8");

describe("the level picker's name", () => {
  it("falls back to Difficulty in the bar's aria name and its visible label", () => {
    const chrome = src("./GameChrome.tsx");
    expect(chrome).toContain("aria-label={`${levelLabel ?? t(\"difficulty\")}: ${current.label[ctx.locale]}`}");
    // The VISIBLE label, matched as a line of its own: the aria name above
    // contains the same text inside a template, so a loose substring match was
    // satisfied by the aria line alone and could not see the label regress
    // (a planted bare t("difficulty") here survived it, 2026-10-03).
    expect(chrome).toMatch(/^\s*\{levelLabel \?\? t\("difficulty"\)\}$/m);
    // Both uses of the word go through the label - none reads the dictionary bare.
    expect(chrome.match(/levelLabel \?\? t\("difficulty"\)/g)).toHaveLength(2);
    expect(chrome.match(/t\("difficulty"\)/g)).toHaveLength(2);
  });

  it("falls back to Difficulty on the table's disc, and the bar hands the label down", () => {
    expect(src("./GameTable.tsx")).toContain("aria-label={`${levelLabel ?? t(\"difficulty\")}: ${current.label[locale]}`}");
    expect(src("./GameChrome.tsx")).toMatch(/levelLabel=\{levelLabel\}/);
  });
});
