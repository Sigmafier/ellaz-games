import { describe, expect, it } from "vitest";
import { mulberry32 } from "@shared/rng";
import { COLOUR_IDS, colourFromSaved, paletteFor } from "./colours";
import { SNAKE_COLORS } from "./ink";
import { PC_SHAPE, PHONE_SHAPE, STEP_MS, secondsLeft } from "./logic";
import { LEVEL, LEVELS, botsFor, dealRound, levelFromSaved, mapFromSaved } from "./setup";

// The four choices on the title card (forum review, operator "fix everything
// he suggested", 2026-10-01): a level, a map, a colour, and on a PC a second
// player. Each one is a value the round is DEALT from, so each is pinned here.

describe("the level ladder: Easy, Normal, Hard", () => {
  it("Easy is two bots and a slower step; Normal three; Hard five", () => {
    expect(LEVELS).toEqual(["easy", "normal", "hard"]);
    expect(LEVEL.easy.bots).toBe(2);
    expect(LEVEL.normal.bots).toBe(3);
    expect(LEVEL.hard.bots).toBe(5);
    expect(LEVEL.easy.stepMs).toBeGreaterThan(STEP_MS);
    expect(LEVEL.normal.stepMs).toBe(STEP_MS);
    expect(LEVEL.hard.stepMs).toBe(STEP_MS);
  });

  it("an old save of a bot count still opens - 3 and 4 on Normal, 5 on Hard - and nothing crashes", () => {
    expect(levelFromSaved("3")).toBe("normal");
    expect(levelFromSaved("4")).toBe("normal");
    expect(levelFromSaved("5")).toBe("hard");
    for (const l of LEVELS) expect(levelFromSaved(l)).toBe(l);
    for (const junk of [null, undefined, 4, "", "6", {}, "EASY"]) expect(levelFromSaved(junk)).toBe("normal");
  });

  it("a second player takes a bot's place, so the board holds as many snakes as one player's round", () => {
    for (const l of LEVELS) expect(botsFor(l, 2) + 2).toBe(botsFor(l, 1) + 1);
    expect(botsFor("easy", 2)).toBeGreaterThanOrEqual(1);
  });

  it("the round's clock and safe start follow the level's step, so 90 seconds is 90 seconds", () => {
    const r = dealRound(PC_SHAPE, { level: "easy", map: "open", humans: 1 }, mulberry32(1));
    expect(r.stepMs).toBe(LEVEL.easy.stepMs);
    expect(r.ticks * r.stepMs).toBeLessThanOrEqual(90_000);
    expect((r.ticks + 1) * r.stepMs).toBeGreaterThan(90_000);
    expect(r.safeUntil * r.stepMs).toBeGreaterThanOrEqual(3000);
    expect(r.snakes.length).toBe(3);
    expect(secondsLeft(r), "the clock opens on 1:30, never 1:31").toBe(90);
  });
});

describe("the map", () => {
  it("Open or Rocks, remembered, and an unknown save is Open", () => {
    expect(mapFromSaved("rocks")).toBe("rocks");
    expect(mapFromSaved("open")).toBe("open");
    expect(mapFromSaved("lava")).toBe("open");
    expect(mapFromSaved(null)).toBe("open");
  });

  it("an Open round deals exactly what it dealt before the map existed", () => {
    for (const shape of [PC_SHAPE, PHONE_SHAPE]) {
      const r = dealRound(shape, { level: "normal", map: "open", humans: 1 }, mulberry32(7));
      expect(r.rocks).toEqual([]);
    }
  });
});

describe("your colour", () => {
  it("six swatches, saved by NAME (a persisted id is forever), unknown saves are mint", () => {
    expect(COLOUR_IDS.length).toBe(SNAKE_COLORS.length);
    expect(colourFromSaved("pink")).toBe("pink");
    expect(colourFromSaved("#55efc4")).toBe("mint");
    expect(colourFromSaved(undefined)).toBe("mint");
  });

  it("mint, one player: exactly today's colours", () => {
    expect(paletteFor("mint", 1, 6)).toEqual([...SNAKE_COLORS]);
  });

  it("you wear the colour you picked and the bots take the others - nobody shares one", () => {
    for (const id of COLOUR_IDS) {
      const p = paletteFor(id, 1, 6);
      expect(p[0]).toBe(SNAKE_COLORS[COLOUR_IDS.indexOf(id)]);
      expect(new Set(p).size).toBe(6);
    }
  });

  it("two players: P2 never wears P1's colour, and every snake is still its own colour", () => {
    for (const id of COLOUR_IDS) {
      const p = paletteFor(id, 2, 6);
      expect(p[1]).not.toBe(p[0]);
      expect(new Set(p).size).toBe(6);
    }
  });
});
