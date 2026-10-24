/**
 * A SAVED BOARD IS ONLY RESUMED IN THE LANGUAGE IT WAS DEALT IN.
 *
 * `plays-in-hebrew.test.ts` proves both packs play. Nothing there notices the
 * game handing a Hebrew board to the English dictionary: a mutation run on
 * 2026-10-24 replaced `restored.state.lang === lang.id` with `true` and the
 * whole suite stayed green. The board that guard refuses is a game that
 * rejects every word already standing on it, with nothing on screen to say why.
 *
 * Read from the source, the same way `rounds-are-wired.test.ts` does, because
 * the alternative is mounting the game to prove one condition. The first half
 * pins what the condition stands on: the snapshot can tell the two apart.
 */
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { mulberry32 } from "@shared/rng";
import { EN, HE } from "./lang";
import { newGame } from "./logic";

const GAME = readFileSync(new URL("./Lettercross.tsx", import.meta.url), "utf8");

describe("a snapshot knows which language it was dealt in", () => {
  it("records the pack's id on the state the session saves", () => {
    expect(newGame("easy", mulberry32(1), HE).lang).toBe(HE.id);
    expect(newGame("easy", mulberry32(1), EN).lang).toBe(EN.id);
    // The control: the guard is only worth anything if the two ids differ.
    expect(HE.id).not.toBe(EN.id);
  });
});

describe("the game resumes a snapshot only in that language", () => {
  const m = /const resume = ([\s\S]*?);/.exec(GAME);

  it("has a resume decision to read", () => {
    expect(m, "no `const resume = ...;` in Lettercross.tsx - the decision moved; follow it").not.toBeNull();
  });

  it("requires the saved language to be the one being opened", () => {
    expect(m![1].replace(/\s+/g, " ")).toMatch(/restored\.state\.lang === lang\.id/);
  });

  it("requires the saved level too", () => {
    expect(m![1].replace(/\s+/g, " ")).toMatch(/restored\.level === level/);
  });

  it("reads the board and every latch from the checked snapshot, never the raw one", () => {
    // `restored` may only be read inside the decision itself. A later line
    // reading `restored?.state` would walk around the guard and keep this
    // file green.
    const reads = [...GAME.matchAll(/\brestored\b/g)].length;
    const inDecision = [...m![1].matchAll(/\brestored\b/g)].length;
    const declared = /const restored = /.test(GAME) ? 1 : 0;
    expect(reads).toBe(inDecision + declared);
    expect(GAME).toMatch(/resume\?\.state \?\? newGame\(/);
  });
});
