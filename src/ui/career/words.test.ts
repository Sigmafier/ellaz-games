import { describe, expect, it } from "vitest";
import { SHIPPED_LOCALES } from "@i18n/locales";
import { CAREER_WORDS, careerWords } from "./words";

/** every leaf string of a words record, with its path */
function leaves(o: unknown, at = ""): [string, string][] {
  if (typeof o === "string") return [[at, o]];
  return Object.entries(o as Record<string, unknown>).flatMap(([k, v]) => leaves(v, at ? `${at}.${k}` : k));
}

// Pictographs and the joiners that glue them, built from escapes so no emoji is ever in this source
const EMOJI = new RegExp("[\\u{1F000}-\\u{1FAFF}\\u{2600}-\\u{27BF}\\u{200D}\\u{FE0F}]", "u");

describe("the career screens speak every authored language", () => {
  it("has an arm for every shipped locale and nothing else", () => {
    expect(Object.keys(CAREER_WORDS).sort()).toEqual([...SHIPPED_LOCALES].sort());
  });

  it("fills every key in every arm with real words, the same keys as English", () => {
    const en = leaves(CAREER_WORDS.en).map(([k]) => k);
    // population guard: 16 flat keys + 3 slots + 3 tiers + 5 stats = 27 today; an empty walk would pass every check below
    expect(en.length).toBeGreaterThanOrEqual(20);
    for (const loc of SHIPPED_LOCALES) {
      const arm = leaves(CAREER_WORDS[loc]);
      expect(arm.map(([k]) => k), loc).toEqual(en);
      for (const [k, v] of arm) {
        expect(v.trim().length, `${loc}.${k} is empty`).toBeGreaterThan(0);
        expect(EMOJI.test(v), `${loc}.${k} carries an emoji`).toBe(false);
      }
    }
  });

  it("keeps the {n} slot wherever English has one", () => {
    for (const loc of SHIPPED_LOCALES) {
      expect(CAREER_WORDS[loc].level, loc).toContain("{n}");
      expect(CAREER_WORDS[loc].stars, loc).toContain("{n}");
    }
  });

  it("reads English for a language with no authored text", () => {
    expect(careerWords("de")).toBe(CAREER_WORDS.en);
    expect(careerWords("he")).toBe(CAREER_WORDS.he);
  });

  it("the emoji check can fire", () => {
    expect(EMOJI.test(String.fromCodePoint(0x1f3ae))).toBe(true);
  });
});
