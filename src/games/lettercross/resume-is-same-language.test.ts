/**
 * A SAVED BOARD IS ONLY RESUMED IN THE LANGUAGE IT WAS DEALT IN.
 *
 * `plays-in-hebrew.test.ts` proves both packs play. Nothing there notices the
 * game handing a Hebrew board to the English dictionary: a mutation run on
 * 2026-10-24 replaced `restored.state.lang === lang.id` with `true` and the
 * whole suite stayed green. The board that guard refuses is a game that
 * rejects every word already standing on it, with nothing on screen to say why.
 *
 * Lifted from the source, the way `rounds-are-wired.test.ts` reads its wires,
 * because the alternative is mounting the game to prove one condition - and then
 * RUN over every case, because matching the words let `|| true` through. The
 * first half pins what the condition stands on: the snapshot can tell the two
 * apart.
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

  /**
   * RUN the decision, do not read its words. A pattern that only finds
   * `restored.state.lang === lang.id` in the text stays green when someone adds
   * `|| true` after it - the 2026-10-24 deep-test planted exactly that and this
   * file passed. The expression is plain JavaScript, so it is evaluated over
   * every case it has to tell apart.
   */
  const decide = (restored: unknown, level: string, lang: { id: string }) =>
    new Function("restored", "level", "lang", `return (${m![1]});`)(restored, level, lang);
  const save = (level: string, lang: string) => ({ level, state: { lang } });

  it("resumes a save from the same language and level", () => {
    const s = save("medium", HE.id);
    expect(decide(s, "medium", HE)).toBe(s);
  });

  it("refuses a save from the other language", () => {
    expect(decide(save("medium", HE.id), "medium", EN)).toBeUndefined();
    expect(decide(save("medium", EN.id), "medium", HE)).toBeUndefined();
  });

  it("refuses a save from another level", () => {
    expect(decide(save("easy", HE.id), "medium", HE)).toBeUndefined();
  });

  it("starts fresh when there is no save", () => {
    expect(decide(undefined, "medium", HE)).toBeFalsy();
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
