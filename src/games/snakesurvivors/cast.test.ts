import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { CAST, scaleFor } from "../survivors/sprites";
import { FOR_KIND, kindScale } from "./cast";

/**
 * How big each shape is drawn. The sum is here and not in the scene because a
 * Phaser scene cannot run in this suite, and the one time a size lived only in
 * a scene it shipped five times too big.
 */
describe("the cast", () => {
  it("draws the three crowd shapes at their sheet's true size", () => {
    for (const k of ["runner", "orb", "brute"] as const) {
      expect(kindScale(k)).toBeCloseTo(scaleFor(CAST[FOR_KIND[k]].manifest), 6);
    }
  });

  it("draws the warden as a bat 24/9 the size of a runner", () => {
    expect(kindScale("warden") / kindScale("runner")).toBeCloseTo(24 / 9, 6);
  });

  it("every size is a small fraction - never the raw sheet (scale 1)", () => {
    for (const k of ["runner", "orb", "brute", "warden"] as const) {
      expect(kindScale(k)).toBeGreaterThan(0.05);
      expect(kindScale(k)).toBeLessThan(0.7);
    }
  });

  it("the scene sizes shapes through kindScale and never sets a bare number", () => {
    const scene = readFileSync(new URL("./SnakeSurvivorsScene.ts", import.meta.url), "utf8");
    expect(scene).toContain("setScale(kindScale(");
    expect(scene).not.toMatch(/setScale\(\s*[\d.]+\s*\)/);
  });
});
