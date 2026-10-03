// On a narrow portrait phone the 900-unit lane is drawn at about 0.42x, so the
// cast, the aim ring and the shots are DRAWN bigger there (operator, 2026-10-03:
// "Bigger + rotate hint"). Two halves, and both are held here: the picture
// grows, and nothing the simulation collides with does.
import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { NARROW_MAX, drawScale, narrowBoost } from "./sprites";
import { KIND } from "./logic";

const here = (f: string) => readFileSync(new URL(f, import.meta.url), "utf8");

describe("a narrow lane draws the fight bigger", () => {
  it("draws about 1.6x on a 390px portrait phone (lane shown 374px of 900)", () => {
    expect(narrowBoost(374 / 900)).toBeGreaterThan(1.55);
    expect(narrowBoost(374 / 900)).toBeLessThanOrEqual(NARROW_MAX);
  });

  it("never draws more than 1.6x, however small the lane is shown", () => {
    expect(narrowBoost(0.2)).toBe(NARROW_MAX);
    expect(NARROW_MAX).toBe(1.6);
  });

  it("is full size, unboosted, once the lane is shown big enough (a PC or a turned phone)", () => {
    for (const shown of [0.66, 0.8, 1, 1.4]) expect(narrowBoost(shown)).toBe(1);
  });

  it("grows smoothly as the lane shrinks, so a window dragged wider never makes the cast jump", () => {
    let last = Infinity;
    for (let shown = 0.3; shown <= 1; shown += 0.01) {
      const b = narrowBoost(shown);
      expect(b).toBeLessThanOrEqual(last);
      expect(Math.abs(b - narrowBoost(shown + 0.001))).toBeLessThan(0.02);
      last = b;
    }
  });

  it("answers 1 for a size it cannot read, rather than NaN or Infinity", () => {
    for (const bad of [0, -1, NaN, Infinity]) expect(narrowBoost(bad)).toBe(1);
  });
});

describe("only the PICTURE grows", () => {
  it("the rules never read it: logic.ts and the waves know nothing of a drawing boost", () => {
    expect(here("./logic.ts")).not.toMatch(/narrowBoost|NARROW_/);
    expect(here("./waves.ts")).not.toMatch(/narrowBoost|NARROW_/);
  });

  it("the hitbox is unchanged: drawScale is still a function of the radius alone", () => {
    // A runner's drawn scale, divided by the radius it collides with, is a
    // constant of its sheet; no window size enters either side.
    expect(drawScale("runner")).toBeGreaterThan(0);
    expect(KIND.runner.radius).toBeGreaterThan(0);
    expect(here("./sprites.ts")).toMatch(/export function drawScale[\s\S]*?radiusOf\(part\) \/ radiusOf/);
    expect(here("./sprites.ts").match(/export function drawScale[\s\S]*?\n}/)?.[0]).not.toMatch(/narrow/i);
  });

  it("the scene composes the walkers' scale with the boost, and the shots' pixels too", () => {
    const scene = here("./LineScene.ts");
    expect(scene).toMatch(/s\.setScale\(drawScale\(w\.kind\) \* k\)/);
    expect(scene).toMatch(/const px = \(n: number\) => n \* Math\.max\(1, this\.scale\.displayScale\.x\) \* k;/);
    // And the boost is read off the SHOWN size, never off the run.
    expect(scene).toMatch(/narrowBoost\(1 \/ this\.scale\.displayScale\.x\)/);
  });
});

describe("the title asks for a turn on a narrow portrait screen", () => {
  const game = here("./LineGame.tsx");

  it("in every language the game ships", () => {
    const block = game.match(/rotate: \{([\s\S]*?)\},/)?.[1] ?? "";
    for (const l of ["he", "en", "es", "sv"]) expect(block, l).toMatch(new RegExp(`\\b${l}: "[^"]+"`));
    expect(block).toContain('en: "Rotate for a bigger view"');
    expect(block).not.toMatch(/[–—]/);
  });

  it("only on the title, and only while the screen is portrait and narrow - live, so turning the phone takes it away", () => {
    expect(game).toMatch(/const ROTATE_HINT = "\(orientation: portrait\) and \(max-width: 599px\)";/);
    expect(game).toMatch(/hint: face === "title" && askTurn \? say\(ctx, "rotate"\) : undefined/);
    expect(game).toMatch(/mq\.addEventListener\("change", read\)/);
  });
});
