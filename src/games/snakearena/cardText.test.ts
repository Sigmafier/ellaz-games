import { describe, expect, it } from "vitest";
import { SHIPPED_LOCALES } from "@i18n/locales";
import { cardText } from "./cardText";
import { WORDS } from "./words";

/**
 * Snake Arena's round-over cards in the title's style (operator, 2026-10-01):
 * a big neon heading, one gold line under it, the ranking, PLAY AGAIN - and on
 * the out card, Watch. What the two words say, per phase, pure.
 */

const en = WORDS.en;

describe("the out card", () => {
  it("YOU'RE OUT, then where you came and the longest you reached, on one gold line", () => {
    expect(cardText(en, { phase: "out", place: 5, count: 5, peak: 4, winner: null })).toEqual({
      head: "You're out",
      line: "5th of 5 · Longest you reached: 4",
    });
  });
});

describe("the final card", () => {
  it("a win is the heading, and the length is the line", () => {
    expect(cardText(en, { phase: "over", place: 1, count: 5, peak: 17, winner: 0 })).toEqual({
      head: "You win!",
      line: "Longest you reached: 17",
    });
  });

  it("otherwise where you came is the heading, and who won is the line", () => {
    expect(cardText(en, { phase: "over", place: 3, count: 5, peak: 9, winner: 2 })).toEqual({
      head: "3rd of 5",
      line: "Moss wins · Longest you reached: 9",
    });
  });

  it("nobody left standing says so", () => {
    expect(cardText(en, { phase: "over", place: 2, count: 4, peak: 6, winner: null }).line).toBe(
      "Nobody was left standing · Longest you reached: 6",
    );
  });
});

describe("every shipped language has the new words, with no long dashes", () => {
  const DASHES = new RegExp("[\\u2013\\u2014\\u2015]");
  it("outHead and of", () => {
    for (const loc of SHIPPED_LOCALES) {
      const w = WORDS[loc];
      expect(w.outHead.length, loc).toBeGreaterThan(0);
      expect(w.of(2, 5), loc).toContain("5");
      for (const s of [w.outHead, w.of(2, 5)]) expect(DASHES.test(s), `${loc}: ${s}`).toBe(false);
    }
  });

  it("the title card's choices: level, colour, map, players - every word present, no long dashes", () => {
    for (const loc of SHIPPED_LOCALES) {
      const w = WORDS[loc];
      const all = [w.level, ...w.levels, w.colour, ...w.colours, w.map, ...w.maps, w.players, w.playerCount(1), w.playerCount(2), w.keys2, w.lengthOf("P1")];
      for (const s of all) {
        expect(s.trim().length, `${loc}: empty word`).toBeGreaterThan(0);
        expect(DASHES.test(s), `${loc}: ${s}`).toBe(false);
      }
      expect(new Set(w.colours).size, `${loc}: two swatches share a name`).toBe(6);
    }
  });
});
