// The career's words: every shipped language, every key, real words, no emoji and
// no em or en dash (customer-facing copy), and the placeholders where English has them.
import { describe, expect, it } from "vitest";
import { SHIPPED_LOCALES } from "@i18n/locales";
import { SNAKE_CAREER_WORDS, levelName, snakeCareerWords } from "./careerWords";
import { SNAKE_SHOP } from "./careerRules";

function leaves(o: unknown, at = ""): [string, string][] {
  if (typeof o === "string") return [[at, o]];
  return Object.entries(o as Record<string, unknown>).flatMap(([k, v]) => leaves(v, at ? `${at}.${k}` : k));
}
const EMOJI = new RegExp("[\\u{1F000}-\\u{1FAFF}\\u{2600}-\\u{27BF}\\u{200D}\\u{FE0F}]", "u");
const DASHES = new RegExp("[\\u2013\\u2014\\u2015]");

describe("the snake's career speaks every shipped language", () => {
  it("an arm for every shipped locale and nothing else", () => {
    expect(Object.keys(SNAKE_CAREER_WORDS).sort()).toEqual([...SHIPPED_LOCALES].sort());
  });

  it("every key in every arm, real words, no emoji, no long dash", () => {
    const en = leaves(SNAKE_CAREER_WORDS.en).map(([k]) => k);
    expect(en.length).toBeGreaterThanOrEqual(40);
    for (const loc of SHIPPED_LOCALES) {
      const arm = leaves(SNAKE_CAREER_WORDS[loc]);
      expect(arm.map(([k]) => k), loc).toEqual(en);
      for (const [k, v] of arm) {
        expect(v.trim().length, `${loc}.${k}`).toBeGreaterThan(0);
        expect(EMOJI.test(v), `${loc}.${k} carries an emoji`).toBe(false);
        expect(DASHES.test(v), `${loc}.${k} carries a long dash`).toBe(false);
      }
    }
  });

  it("keeps every placeholder English has", () => {
    for (const loc of SHIPPED_LOCALES) {
      const w = SNAKE_CAREER_WORDS[loc];
      for (const [k, need] of [["level", ["{w}", "{n}"]], ["bossLevel", ["{w}"]], ["clear", ["{l}"]], ["hearts", ["{n}", "{m}", "{s}"]], ["heartsOne", ["{n}", "{m}"]], ["keepHalf", ["{n}", "{m}"]], ["piece", ["{t}", "{s}"]]] as const) {
        for (const p of need) expect(w[k], `${loc}.${k}`).toContain(p);
      }
    }
  });

  it("every shop row has its words", () => {
    for (const r of SNAKE_SHOP.rows) expect(Object.keys(SNAKE_CAREER_WORDS.en.item)).toContain(r.id);
  });

  it("names a level and a boss level", () => {
    expect(levelName(snakeCareerWords("en"), "garden", 2)).toBe("Garden 2");
    expect(levelName(snakeCareerWords("en"), "cave", null)).toBe("Cave boss");
  });

  it("THE CONTROL: the dash check can fire", () => {
    expect(DASHES.test(String.fromCharCode(0x2014))).toBe(true);
  });
});
