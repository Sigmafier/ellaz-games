import { describe, expect, it } from "vitest";
import { HINT_MS, endOf, hintVisible, nextEnd, snakeScreen, type EndCard } from "./screens";

/**
 * Snake Survivors' ONE screen (operator, 2026-10-01, approved off the
 * "one-screen start, all four" mock): the title holds the difficulty and one
 * big PLAY, the game-over card is its own card in the title's style, and the
 * controls line shows inside the arena for the first 3 s of a run.
 *
 * Pure functions, so the rules are tested without Phaser.
 */

const end = (over: Partial<EndCard> = {}): EndCard => ({
  won: false,
  stats: [
    { id: "crushed", value: 12 },
    { id: "best", value: 40 },
    { id: "level", value: 3 },
  ],
  newBest: false,
  ...over,
});

describe("which screen is up", () => {
  it("before any run: the title", () => {
    expect(snakeScreen("ready", false, null)).toBe("title");
  });

  it("while a run is live, or the level-up cards are up: no cover at all", () => {
    expect(snakeScreen("playing", false, null)).toBe("run");
    expect(snakeScreen("playing", false, end())).toBe("run");
    expect(snakeScreen("over", true, end())).toBe("run");
  });

  it("after a run ends: the game-over card, never the title", () => {
    expect(snakeScreen("over", false, end())).toBe("over");
    expect(snakeScreen("won", false, end({ won: true }))).toBe("over");
  });

  it("a difficulty tap on the game-over card restarts the scene to ready - and the card STAYS", () => {
    // The scene answers setLevel with a restart, which publishes phase "ready".
    // Read off the phase alone, that flips the card to the title under the
    // player's finger.
    expect(snakeScreen("ready", false, end())).toBe("over");
  });
});

describe("the game-over card is latched off the run that ended", () => {
  it("a run ending snapshots what it ended on", () => {
    const now = end({ newBest: true });
    expect(nextEnd(null, "over", now)).toBe(now);
  });

  it("a restart to ready keeps the card it had - the numbers of the run that ended, not of the fresh one", () => {
    const was = end({ newBest: true });
    const fresh = end({ stats: [{ id: "crushed", value: 0 }, { id: "best", value: 40 }, { id: "level", value: 1 }] });
    expect(nextEnd(was, "ready", fresh)).toBe(was);
  });

  it("a run starting clears it", () => {
    expect(nextEnd(end(), "playing", end())).toBeNull();
  });

  it("before the first run there is nothing to keep", () => {
    expect(nextEnd(null, "ready", end())).toBeNull();
  });
});

describe("what the game-over card shows", () => {
  it("crushed, best and level by name, and NEW BEST only when it was earned", () => {
    const e = endOf({ phase: "over", crushed: 137, lv: 4, newBest: true }, 90);
    expect(e.won).toBe(false);
    expect(e.newBest).toBe(true);
    // best is the larger of the stored record and this run - the record this run set.
    expect(e.stats).toEqual([
      { id: "crushed", value: 137 },
      { id: "best", value: 137 },
      { id: "level", value: 4 },
    ]);
  });

  it("a win says so, and a run under the record keeps the record", () => {
    const e = endOf({ phase: "won", crushed: 12, lv: 2, newBest: false }, 482);
    expect(e.won).toBe(true);
    expect(e.newBest).toBe(false);
    expect(e.stats.find((s) => s.id === "best")?.value).toBe(482);
  });
});

describe("the controls line inside the arena", () => {
  it("shows for the first 3 s of a run and then is gone", () => {
    expect(HINT_MS).toBe(3000);
    expect(hintVisible(0)).toBe(true);
    expect(hintVisible(2999)).toBe(true);
    expect(hintVisible(3000)).toBe(false);
    expect(hintVisible(60000)).toBe(false);
  });

  it("is not drawn when no run has started", () => {
    expect(hintVisible(null)).toBe(false);
    expect(hintVisible(-1)).toBe(false);
  });
});
