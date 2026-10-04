// A CAREER WIN WITH LESS THAN ONE FULL HEART LEFT. The result card reads its
// stars off the settlement (`out.stars` in SnakeCareerLayer), and the save
// records them through `recordClear`, which never stores fewer than one. Before
// 2026-10-03 the settlement said 0 for that win while the save said 1, so the
// card showed "0 stars" over a level the map then showed with a star. A win
// shows - and saves - at least one; three still needs every heart.
import { describe, expect, it } from "vitest";
import { mulberry32 } from "@shared/rng";
import { starsOf } from "../../shared/career/progress";
import { freshSave, readSave, type CareerStore } from "../../shared/career/save";
import { CAREER_KEY, bankRun, levelStars, settle } from "./careerRules";
import type { SnakeCareerResult } from "./careerTypes";

const memStore = (): CareerStore => {
  const data = new Map<string, unknown>();
  return { get: (k) => data.get(k), set: (k, v) => void data.set(k, v) };
};

const result = (over: Partial<SnakeCareerResult>): SnakeCareerResult =>
  ({ level: "garden-1", won: true, hearts: 8, of: 8, gold: 10, ...over });

describe("a win shows the stars it saves", () => {
  it("a win with no full heart left is ONE star on the card, and one in the save", () => {
    const out = settle(freshSave(), result({ hearts: 0 }), mulberry32(1));
    expect(out.won).toBe(true);
    expect(out.stars).toBe(1);
    expect(starsOf(out.save, "garden-1")).toBe(1);
  });

  it("the same, paid through bankRun and read back off the device", () => {
    const store = memStore();
    const out = bankRun(store, "run-0h", result({ hearts: 0 }), mulberry32(1));
    expect(out?.stars).toBe(1);
    expect(starsOf(readSave(store, CAREER_KEY), "garden-1")).toBe(out?.stars);
  });

  it("every win's card number IS the save's number, from 0 hearts to all 8", () => {
    for (let h = 0; h <= 8; h++) {
      const out = settle(freshSave(), result({ hearts: h }), mulberry32(1));
      expect(out.stars, `${h} hearts`).toBe(starsOf(out.save, "garden-1"));
    }
  });

  it("the rule stays strict otherwise: 1 / 2 / 3 at 1, 4 and all 8 hearts, and a loss is 0", () => {
    expect([1, 4, 7, 8].map((h) => levelStars(result({ hearts: h })))).toEqual([1, 2, 2, 3]);
    expect(levelStars(result({ won: false, hearts: 0 }))).toBe(0);
    expect(settle(freshSave(), result({ won: false, hearts: 0 }), mulberry32(1)).stars).toBe(0);
  });
});
