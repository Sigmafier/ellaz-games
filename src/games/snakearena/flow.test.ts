import { describe, expect, it } from "vitest";
import { mulberry32 } from "@shared/rng";
import { RESTART_GRACE_MS, afterStep, decide, keyPress, running, stepMsFor, type Phase } from "./flow";
import { PC_SHAPE, STEP_MS, newRound, tick } from "./logic";

describe("what a press means", () => {
  it("the player's snake waits for its first DIRECTION - a tap only takes the card away", () => {
    expect(decide("ready", "confirm", Infinity)).toBe("aim");
    expect(decide("aim", "confirm", Infinity)).toBe("none");
    expect(decide("aim", "direction", Infinity)).toBe("go");
    expect(decide("ready", "direction", Infinity)).toBe("go");
  });

  it("while playing, a direction steers and a tap does nothing", () => {
    expect(decide("playing", "direction", Infinity)).toBe("turn");
    expect(decide("playing", "confirm", Infinity)).toBe("none");
  });

  it("the out card and Watch answer no key - only their own buttons", () => {
    for (const phase of ["out", "watch"] as Phase[]) {
      expect(decide(phase, "confirm", Infinity)).toBe("none");
      expect(decide(phase, "direction", Infinity)).toBe("none");
    }
  });

  it("the final card: Space or Enter plays again, after the grace, and an arrow never does", () => {
    expect(decide("over", "confirm", RESTART_GRACE_MS - 1)).toBe("none");
    expect(decide("over", "confirm", RESTART_GRACE_MS)).toBe("again");
    expect(decide("over", "direction", 60_000)).toBe("none");
  });

  it("keys", () => {
    expect(keyPress("ArrowLeft")).toEqual({ kind: "direction", dir: "left" });
    expect(keyPress("w")).toEqual({ kind: "direction", dir: "up" });
    expect(keyPress(" ")).toEqual({ kind: "confirm" });
    expect(keyPress("Shift")).toBeNull();
  });
});

describe("where a step leaves the round", () => {
  it("the player going out stops on the out card; watching runs three times as fast", () => {
    const r = newRound(PC_SHAPE, 3, mulberry32(1));
    const dead = { ...r, snakes: r.snakes.map((s) => (s.id === 0 ? { ...s, alive: false, body: [] } : s)) };
    expect(afterStep("playing", dead)).toBe("out");
    expect(afterStep("playing", r)).toBe("playing");
    expect(stepMsFor("watch")).toBeCloseTo(STEP_MS / 3);
    expect(stepMsFor("playing")).toBe(STEP_MS);
  });

  it("the bell ends a round that is playing or being watched", () => {
    let r = { ...newRound(PC_SHAPE, 3, mulberry32(2)), ticks: 1 };
    r = tick(r, mulberry32(3)).round;
    expect(r.over).toBe(true);
    expect(afterStep("playing", r)).toBe("over");
    expect(afterStep("watch", r)).toBe("over");
  });

  it("the clock runs only while playing or watching", () => {
    expect((["ready", "aim", "playing", "out", "watch", "over"] as Phase[]).filter(running)).toEqual(["playing", "watch"]);
  });
});
