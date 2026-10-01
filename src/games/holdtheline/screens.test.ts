import { describe, expect, it } from "vitest";
import { lineCard, lineEnd, nextLineEnd } from "./screens";

/**
 * Hold the Line's cover (operator, 2026-10-01): a TITLE before wave 1, the
 * between-waves shop, and "The keep fell" in the same title style - all one
 * shared card. Pure, so the rules are tested without Phaser.
 */

describe("which card is up", () => {
  it("before wave 1: the title", () => {
    expect(lineCard("shop", 1, null)).toBe("title");
    expect(lineCard(undefined, 1, null)).toBe("title");
  });

  it("between waves: the shop", () => {
    expect(lineCard("shop", 4, null)).toBe("shop");
  });

  it("while a wave runs: nothing", () => {
    expect(lineCard("wave", 4, null)).toBeNull();
    expect(lineCard("wave", 1, lineEnd(340, 6, 912))).toBeNull();
  });

  it("the keep fell: the game-over card", () => {
    expect(lineCard("over", 6, null)).toBe("over");
  });

  it("a difficulty tap on it starts a fresh run at wave 1 - and the card stays", () => {
    expect(lineCard("shop", 1, lineEnd(340, 6, 912))).toBe("over");
  });
});

describe("the game-over card is latched off the run that fell", () => {
  it("score, the wave it fell on, and the record", () => {
    expect(lineEnd(340, 6, 912)).toEqual({ score: 340, wave: 6, best: 912 });
  });

  it("set when the keep falls, kept through a fresh wave-1 run, cleared when a wave starts", () => {
    const e = lineEnd(340, 6, 912);
    expect(nextLineEnd(null, "over", e)).toBe(e);
    expect(nextLineEnd(e, "shop", lineEnd(0, 1, 912))).toBe(e);
    expect(nextLineEnd(e, "wave", lineEnd(0, 1, 912))).toBeNull();
    expect(nextLineEnd(null, "shop", e)).toBeNull();
  });
});
