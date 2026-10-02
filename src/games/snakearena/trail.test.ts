import { describe, expect, it } from "vitest";
import { mulberry32 } from "@shared/rng";
import { TRAIL_MS, drawTrail, trailAlpha, trailAfter, type Board, type Pen } from "./draw";
import { PC_SHAPE, tick } from "./logic";
import { dealRound } from "./setup";

// The slime trail (forum review: "just visual effect that fades with time"):
// every snake leaves a faint mark in its own colour on each cell its head
// passes, gone in about two seconds. Nothing in the rules reads it.

describe("the slime trail", () => {
  it("fades from faint to nothing in about two seconds", () => {
    expect(TRAIL_MS).toBeGreaterThanOrEqual(1500);
    expect(TRAIL_MS).toBeLessThanOrEqual(2500);
    expect(trailAlpha(0)).toBeGreaterThan(0);
    expect(trailAlpha(0)).toBeLessThan(0.4);
    expect(trailAlpha(TRAIL_MS / 2)).toBeLessThan(trailAlpha(0));
    expect(trailAlpha(TRAIL_MS)).toBe(0);
  });

  it("a step marks each living snake's new head, and old marks drop out", () => {
    const r0 = dealRound(PC_SHAPE, { level: "normal", map: "open", humans: 1 }, mulberry32(1));
    const r1 = tick({ ...r0, safeUntil: 0 }, mulberry32(2)).round;
    const t = trailAfter([], r1, 1000);
    expect(t.length).toBe(r1.snakes.filter((s) => s.alive).length);
    for (const m of t) expect(r1.snakes[m.id].body[0]).toEqual({ x: m.x, y: m.y });
    expect(trailAfter(t, r1, 1000 + TRAIL_MS + 1).length).toBe(t.length);
    expect(trailAfter(t, r1, 1000 + TRAIL_MS + 1).every((m) => m.at === 1000 + TRAIL_MS + 1)).toBe(true);
  });

  it("is drawn in each snake's own colour, and nothing for a mark that has faded", () => {
    const calls: { c: number; a: number }[] = [];
    const pen: Pen = {
      fillStyle(c, a = 1) {
        calls.push({ c, a });
        return pen;
      },
      fillCircle: () => pen,
      fillRect: () => pen,
      fillRoundedRect: () => pen,
      fillTriangle: () => pen,
    };
    const b: Board = { ox: 0, oy: 0, c: 20, cols: 10, rows: 10 };
    drawTrail(pen, b, [{ id: 1, x: 2, y: 2, at: 0 }, { id: 0, x: 3, y: 3, at: -TRAIL_MS }], 0, ["#000011", "#002200"]);
    expect(calls).toEqual([{ c: 0x002200, a: trailAlpha(0) }]);
  });
});
