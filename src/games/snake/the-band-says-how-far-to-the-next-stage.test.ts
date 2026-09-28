import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { FOOD_PER_LEVEL, stageOf, stageProgress } from "./stageWalls";
import { toGoLine } from "./SnakeCards";

/**
 * "It would be nice to know how much I need to the next level."
 *                                   - a player, NePo, 2026-09-28
 *
 * The band's STAGE cell now says "· N apples to go" beside the stage, with a
 * thin bar under it. N is derived in ONE place, `stageProgress`, from the same
 * `stageOf` and `FOOD_PER_LEVEL` the walls and the speed-up count - so the
 * band can never promise a stage the board does not deliver.
 */

const GAME = readFileSync(new URL("./SnakeGame.tsx", import.meta.url), "utf8");
const CARDS = readFileSync(new URL("./SnakeCards.tsx", import.meta.url), "utf8");
const code = (s: string) => s.replace(/\/\*[\s\S]*?\*\//g, "").replace(/\/\/[^\n]*/g, "");

describe("stageProgress", () => {
  it("counts the apples left in the stage, and how far through it the run is", () => {
    expect(FOOD_PER_LEVEL).toBe(5);
    expect(stageProgress(0)).toEqual({ stage: 1, toGo: 5, done: 0 });
    expect(stageProgress(4)).toEqual({ stage: 1, toGo: 1, done: 0.8 });
    expect(stageProgress(5)).toEqual({ stage: 2, toGo: 5, done: 0 });
    expect(stageProgress(12)).toEqual({ stage: 3, toGo: 3, done: 0.4 });
  });

  it("agrees with stageOf: exactly toGo more apples is the next stage, one fewer is not", () => {
    for (let score = 0; score < 200; score++) {
      const p = stageProgress(score);
      expect(p.stage).toBe(stageOf(score));
      expect(p.toGo).toBeGreaterThanOrEqual(1);
      expect(p.toGo).toBeLessThanOrEqual(FOOD_PER_LEVEL);
      expect(stageOf(score + p.toGo), `score ${score}`).toBe(p.stage + 1);
      expect(stageOf(score + p.toGo - 1), `score ${score}`).toBe(p.stage);
    }
  });
});

describe("the words", () => {
  it("say one apple in the singular and the rest in the plural", () => {
    const w = { toGoOne: "1 apple to go", toGoMany: "{n} apples to go" };
    expect(toGoLine(1, w)).toBe("1 apple to go");
    expect(toGoLine(2, w)).toBe("2 apples to go");
    expect(toGoLine(5, w)).toBe("5 apples to go");
  });

  it("exist in every language arm Snake speaks, with a {n} in the plural", () => {
    for (const locale of ["he", "en", "es", "sv"]) {
      const arm = GAME.slice(GAME.indexOf(`      ${locale}: {`));
      const body = arm.slice(0, arm.indexOf("      },"));
      expect(body, locale).toMatch(/toGoOne: "[^"]+"/);
      expect(body, locale).toMatch(/toGoMany: "[^"]*\{n\}[^"]*"/);
    }
  });
});

describe("the band", () => {
  it("draws the progress only on the classic board, where STAGE is what the cell says", () => {
    const g = code(GAME);
    // Today's board shows its DAY in that cell, not a stage, so it gets no count.
    expect(g).toMatch(/status\.mode === "today"\s*\?\s*\{ label: T\.today, value: day \}/);
    expect(g).toMatch(/progress=\{status\.mode === "today" \? undefined :/);
  });

  it("stays the same height whatever the digits say: fixed, and nothing in it wraps", () => {
    const c = code(CARDS);
    const band = c.slice(c.indexOf("export function Band("), c.indexOf("export type StartWords"));
    expect(band).toContain("height: BAND_H,");
    expect(band).toContain('whiteSpace: "nowrap"');
    expect(c).toContain("export const BAND_H = 44;");
  });
});
