import { describe, expect, it } from "vitest";
import { circle, hold, idle, play } from "./bots";
import { ARENA, ARENA_WIDE } from "./logic";

/**
 * Whole runs, played by bots, on both arena shapes.
 *
 * These pin properties of the RULES, measured 2026-09-27 - not predictions of
 * how a person plays. Each is the answer to a defect the bots actually found:
 *
 *                       phone 420x560          PC 648x364
 *   idle   (no steer)   dies ~25 s, 0 crushed  dies ~28 s, 0 crushed
 *   hold   (one key)    dies ~25 s, 0 crushed  dies ~23 s, 0 crushed
 *   circle, calm        wins 3 of 6            wins 2 of 6
 *   circle, normal      wins 1 of 6            wins 3 of 6
 *
 * NOT pinned, and handed to the operator's play instead: on WILD the circling
 * bot grows to the 60-segment cap and circles a loop so wide the crowd - the
 * warden included - settles inside it without ever reaching the head, so five
 * of six runs hit the eight-minute cap. Whether a person does that, and whether
 * it matters, is a question a bot this crude cannot answer.
 */

const SEEDS = [1, 2, 3, 4, 5, 6];

describe("a run that never closes a loop", () => {
  it("dies, on every level and both shapes - standing still is not a strategy", () => {
    for (const arena of [ARENA, ARENA_WIDE]) {
      for (const level of ["calm", "normal", "wild"] as const) {
        const o = play(level, 1, idle, arena);
        expect(o.end, `${level} ${arena.w}`).toBe("dead");
        expect(o.ms).toBeLessThan(60_000);
      }
    }
  });

  it("dies when it only spins in place - the tightest turn crushes nothing", () => {
    for (const arena of [ARENA, ARENA_WIDE]) {
      for (const level of ["calm", "normal", "wild"] as const) {
        const o = play(level, 2, hold, arena);
        expect(o.end, `${level} ${arena.w}`).toBe("dead");
        expect(o.crushed).toBe(0);
      }
    }
  });
});

describe("a run that keeps closing loops", () => {
  it("can clear calm, warden and all, on both shapes", () => {
    for (const arena of [ARENA, ARENA_WIDE]) {
      const wins = SEEDS.map((s) => play("calm", s, circle, arena)).filter((o) => o.end === "won");
      expect(wins.length, `calm ${arena.w}`).toBeGreaterThanOrEqual(2);
      for (const w of wins) expect(w.crushed).toBeGreaterThan(100);
    }
  });

  it("can clear normal on both shapes", () => {
    for (const arena of [ARENA, ARENA_WIDE]) {
      const wins = SEEDS.map((s) => play("normal", s, circle, arena)).filter((o) => o.end === "won");
      expect(wins.length, `normal ${arena.w}`).toBeGreaterThanOrEqual(1);
    }
  });
});
