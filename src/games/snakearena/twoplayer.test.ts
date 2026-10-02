import { describe, expect, it } from "vitest";
import { mulberry32 } from "@shared/rng";
import { steerBots } from "./bots";
import { cardText } from "./cardText";
import { afterStep, keyPress } from "./flow";
import { PC_SHAPE, makeRound, tick, type Round } from "./logic";
import { bestHuman, grantFor, reportDue, statusOf } from "./result";
import { dealRound } from "./setup";
import { WORDS, nameOf } from "./words";

// Two players on one computer (forum review, PC only): P1 on the arrows, P2 on
// WASD, both in the same round against the bots.

const two = (): Round => dealRound(PC_SHAPE, { level: "normal", map: "open", humans: 2 }, mulberry32(4));
const out = (r: Round, ...ids: number[]): Round => ({
  ...r,
  snakes: r.snakes.map((s) => (ids.includes(s.id) ? { ...s, alive: false, body: [], outAt: r.tick } : s)),
});

describe("the keys split between the two players", () => {
  it("with two players, the arrows steer P1 and WASD steers P2", () => {
    expect(keyPress("ArrowUp", true)).toEqual({ kind: "direction", dir: "up", who: 0 });
    expect(keyPress("ArrowLeft", true)).toEqual({ kind: "direction", dir: "left", who: 0 });
    expect(keyPress("w", true)).toEqual({ kind: "direction", dir: "up", who: 1 });
    expect(keyPress("D", true)).toEqual({ kind: "direction", dir: "right", who: 1 });
    expect(keyPress(" ", true)).toEqual({ kind: "confirm" });
  });

  it("with one player, both sets still steer the one snake, as before", () => {
    expect(keyPress("ArrowUp")).toEqual({ kind: "direction", dir: "up", who: 0 });
    expect(keyPress("s")).toEqual({ kind: "direction", dir: "down", who: 0 });
  });
});

describe("a two-player round", () => {
  it("has two humans the bots never steer", () => {
    const r = two();
    expect(r.humans).toBe(2);
    const s = steerBots({ ...r, apples: [{ x: 0, y: 0 }] }, 0, mulberry32(1));
    expect(s.snakes[0]).toEqual(r.snakes[0]);
    expect(s.snakes[1]).toEqual(r.snakes[1]);
  });

  it("keeps running while one human is out - the other plays on and the first watches", () => {
    const r = { ...out(two(), 0), safeUntil: 0 };
    const n = tick(r, mulberry32(2)).round;
    expect(n.over).toBe(false);
    expect(afterStep("playing", n)).toBe("playing");
    expect(reportDue(n)).toBe(false);
  });

  it("ends the moment both humans are out, bots still running or not", () => {
    const r = { ...out(two(), 0, 1), safeUntil: 0 };
    const n = tick(r, mulberry32(2)).round;
    expect(n.over).toBe(true);
    expect(afterStep("playing", n)).toBe("over");
    expect(reportDue(n)).toBe(true);
  });

  it("one player's round still stops on the out card when the player is out", () => {
    const r = dealRound(PC_SHAPE, { level: "normal", map: "open", humans: 1 }, mulberry32(4));
    const n = out(r, 0);
    expect(afterStep("playing", n)).toBe("out");
    expect(reportDue(n)).toBe(true);
  });
});

describe("pays once, for the better human", () => {
  const shape = { cols: 12, rows: 8 };
  const r = (): Round => {
    const base = makeRound({
      shape,
      snakes: [
        { body: [{ x: 3, y: 1 }, { x: 2, y: 1 }, { x: 1, y: 1 }], dir: "right" },
        { body: [{ x: 6, y: 4 }, { x: 5, y: 4 }, { x: 4, y: 4 }, { x: 3, y: 4 }, { x: 2, y: 4 }], dir: "right" },
        { body: [{ x: 3, y: 6 }, { x: 2, y: 6 }, { x: 1, y: 6 }], dir: "right" },
      ],
      apples: [],
      target: 0,
      humans: 2,
    });
    return { ...base, snakes: base.snakes.map((s) => ({ ...s, peak: s.body.length })) };
  };

  it("the better human is whoever stands higher in the ranking", () => {
    expect(bestHuman(r())).toBe(1);
  });

  it("a win by EITHER human is the star, and one grant covers the round", () => {
    const g = grantFor({ won: true, newBest: true, peak: 9, level: "hard", map: "rocks" });
    expect(g).toEqual({ reason: "level_complete", tier: "hard", level: "bots-5-rocks" });
  });

  it("the chrome is told both lengths and both places", () => {
    const s = statusOf(r(), "playing", false, { level: "normal", map: "open", humans: 2 }, false, ["#1", "#2", "#3"]);
    expect(s.humans).toBe(2);
    expect(s.len).toBe(3);
    expect(s.len2).toBe(5);
    // P1 ties the bot at 3 long and is ahead on the lower id, so 2nd.
    expect(s.places).toEqual([2, 1]);
  });

  it("the final card names who won and where each of you finished", () => {
    const w = WORDS.en;
    expect(nameOf(w, 0, 2)).toBe("P1");
    expect(nameOf(w, 1, 2)).toBe("P2");
    expect(nameOf(w, 2, 2)).toBe("Bolt");
    expect(nameOf(w, 1, 1)).toBe("Bolt");
    expect(cardText(w, { phase: "over", place: 1, count: 3, peak: 5, winner: 1, humans: 2, places: [3, 1] })).toEqual({
      head: "P2 wins",
      line: "P1 3rd · P2 1st",
    });
  });
});
