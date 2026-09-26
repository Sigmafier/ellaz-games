import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { ADJECTIVE_IDS, NOUN_IDS, NAME_COMBINATIONS, pickName, rerollName } from "./names";
import { ADJECTIVES, NOUNS, renderName } from "./nameWords";
import { SHIPPED_LOCALES } from "@i18n/locales";

const HERE = dirname(fileURLToPath(import.meta.url));

/**
 * The name pool is split across two modules for BYTES, and both halves of that
 * split are things a type cannot hold.
 *
 * `names.ts` is shell - the wallet and the profile read it on every screen.
 * `nameWords.ts` is lazy, because nothing on the home grid renders a name.
 * Measured on one tree, Node 24, the day it was split: first visit
 * 57,575 -> 56,302 B gz, shell 40,622 -> 39,335.
 *
 * Two ways that silently reverts, and neither one fails to compile:
 *   1. somebody re-exports the words from `@sdk/index`, which the shell reaches,
 *      and four languages of animal names are back on every first visit;
 *   2. the two id lists drift from the tables they mirror, and `decode()` starts
 *      handing existing players a different name than the one they had.
 */

describe("the name pool's two halves", () => {
  it("keeps the id lists exactly equal to the word tables, in order", () => {
    // ORDER is load-bearing, not cosmetic: `decode()` maps an index onto a
    // name, so re-sorting either list renames every player who already has one.
    expect(ADJECTIVE_IDS).toEqual(ADJECTIVES.map((a) => a.id));
    expect(NOUN_IDS).toEqual(NOUNS.map((n) => n.id));
  });

  it("counts the pool off the ids, and gets the same answer as the tables", () => {
    expect(NAME_COMBINATIONS).toBe(ADJECTIVES.length * NOUNS.length);
    // The positive control. Every assertion above is satisfied by two empty
    // lists mirroring two empty tables, which is what a broken import produces.
    expect(NAME_COMBINATIONS).toBeGreaterThan(300);
  });

  it("never re-exports the WORDS from the SDK barrel", () => {
    // The barrel is reachable from the shell, so a re-export here undoes the
    // whole split - silently, with every test green and only the payload gate
    // to notice. Source-scanned because an import in this test file cannot
    // observe what a DIFFERENT module's bundler graph pulls in.
    const barrel = readFileSync(join(HERE, "index.ts"), "utf8");
    // Only the export statements, so the explanatory comment naming these very
    // symbols does not read as the violation it is warning about.
    const exports = barrel
      .split("\n")
      .filter((l) => !l.trim().startsWith("//"))
      .join("\n");
    for (const banned of ["ADJECTIVES", "NOUNS", "renderName", "nameEmoji", "resolveName"]) {
      expect(exports, `@sdk/index must not re-export ${banned}`).not.toContain(banned);
    }
    // ...and the control: the barrel really does still export the shell half,
    // so a barrel that simply lost the whole block cannot pass the check above.
    expect(exports).toContain("pickName");
    expect(exports).toContain("NAME_COMBINATIONS");
  });

  it("keeps the shell half free of the words, and of i18n entirely", () => {
    const names = readFileSync(join(HERE, "names.ts"), "utf8");
    expect(names, "names.ts must not import the word tables").not.toContain("./nameWords");
    // It answers no language question at all any more, which is what lets it
    // sit in the shell without dragging a dictionary in behind it.
    expect(names, "names.ts must not import i18n").not.toMatch(/^import .*@i18n/m);
  });

  it("still renders a real name in every shipped language", () => {
    // The end-to-end control: the split is only worth anything if the lazy half
    // still works when it arrives.
    const name = { adj: ADJECTIVE_IDS[0], noun: NOUN_IDS[0] };
    for (const locale of SHIPPED_LOCALES) {
      const rendered = renderName(name, locale);
      expect(rendered, `renderName in ${locale}`).toBeTruthy();
      expect(rendered).not.toContain("undefined");
    }
  });

  it("picks and rerolls without the tables loaded at all", () => {
    // `pickName` and `rerollName` are the shell's whole reason for importing
    // this module, so they must work off the ids alone.
    const a = pickName(() => 0);
    expect(ADJECTIVE_IDS).toContain(a.adj);
    expect(NOUN_IDS).toContain(a.noun);
    const b = rerollName(a, () => 0);
    expect(b).not.toEqual(a);
  });
});
