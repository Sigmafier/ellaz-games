import { describe, expect, it } from "vitest";
import { mulberry32 } from "@shared/rng";
import { steerBots } from "./bots";
import { drawSnake, segmentAlpha, type Board, type Pen } from "./draw";
import { lifetimes } from "./ladder";
import { LEVELS, type MapId } from "./setup";
import {
  PC_SHAPE,
  PHONE_SHAPE,
  SAFE_TICKS,
  STEP_MS,
  isSafe,
  makeRound,
  newRound,
  tick,
  turn,
  type Dir,
  type Point,
  type Round,
} from "./logic";

// The gentler round, operator ruling 2026-09-28: "challenging but not too hard".
// Three rules, each one a test before it was code.

const small = { cols: 10, rows: 8 };
function line(x: number, y: number, len: number, dir: Dir): Point[] {
  const back = { left: [1, 0], right: [-1, 0], up: [0, 1], down: [0, -1] }[dir];
  return Array.from({ length: len }, (_, i) => ({ x: x + back[0] * i, y: y + back[1] * i }));
}
const safely = (r: Round): Round => ({ ...r, safeUntil: SAFE_TICKS });
const dist = (a: Point, b: Point) => Math.abs(a.x - b.x) + Math.abs(a.y - b.y);

describe("the safe start: for the first 3 seconds nobody can go out", () => {
  it("lasts three seconds of steps, and a new round starts inside it", () => {
    expect(SAFE_TICKS * STEP_MS).toBeGreaterThanOrEqual(3000);
    expect((SAFE_TICKS - 1) * STEP_MS).toBeLessThan(3000);
    const r = newRound(PC_SHAPE, 4, mulberry32(1));
    expect(isSafe(r)).toBe(true);
  });

  it("a snake heading into a wall WAITS there instead of going out", () => {
    const r = safely(makeRound({ shape: small, snakes: [{ body: line(9, 3, 3, "right"), dir: "right" }, { body: line(3, 7, 3, "right"), dir: "right" }], apples: [], target: 0 }));
    const { round: n, events } = tick(r, mulberry32(1));
    expect(events.out).toEqual([]);
    expect(n.snakes[0].alive).toBe(true);
    expect(n.snakes[0].body).toEqual(line(9, 3, 3, "right"));
    expect(n.snakes[1].body[0]).toEqual({ x: 4, y: 7 });
  });

  it("two heads meeting both wait, and neither is out", () => {
    const r = safely(makeRound({ shape: small, snakes: [{ body: line(3, 4, 3, "right"), dir: "right" }, { body: line(5, 4, 3, "left"), dir: "left" }], apples: [], target: 0 }));
    const n = tick(r, mulberry32(1)).round;
    expect(n.snakes.every((s) => s.alive)).toBe(true);
    expect(n.snakes[0].body[0]).toEqual({ x: 3, y: 4 });
    expect(n.snakes[1].body[0]).toEqual({ x: 5, y: 4 });
  });

  it("a snake that waits keeps its tail, so one following that tail waits too", () => {
    // A (id 0) is blocked by the wall and waits; B (id 1) meant to step into
    // the cell A's tail was going to leave. It must wait as well, not die.
    const r = safely(makeRound({
      shape: small,
      snakes: [
        { body: [{ x: 9, y: 2 }, { x: 9, y: 3 }, { x: 9, y: 4 }], dir: "up" }, // turned right below: into the wall
        { body: [{ x: 8, y: 4 }, { x: 7, y: 4 }, { x: 6, y: 4 }], dir: "right" }, // into (9,4), A's tail
      ],
      apples: [],
      target: 0,
    }));
    const n = tick(turn(r, 0, "right"), mulberry32(1)).round;
    expect(n.snakes.every((s) => s.alive)).toBe(true);
    expect(n.snakes[1].body[0]).toEqual({ x: 8, y: 4 });
  });

  it("the same wall puts a snake out once the three seconds are over", () => {
    const r = { ...makeRound({ shape: small, snakes: [{ body: line(9, 3, 3, "right"), dir: "right" }, { body: line(3, 7, 3, "right"), dir: "right" }], apples: [], target: 0 }), tick: SAFE_TICKS, safeUntil: SAFE_TICKS };
    expect(isSafe(r)).toBe(false);
    expect(tick(r, mulberry32(1)).round.snakes[0].alive).toBe(false);
  });
});

describe("apples never land on top of a snake's start", () => {
  for (const shape of [PC_SHAPE, PHONE_SHAPE]) {
    it(`${shape.cols}x${shape.rows}: none within 2 cells of a head, or in the 4 cells ahead of one, at the deal`, () => {
      for (let seed = 1; seed <= 40; seed++) {
        const r = newRound(shape, 5, mulberry32(seed));
        for (const s of r.snakes) {
          const h = s.body[0];
          const ahead = [1, 2, 3, 4].map((k) => ({ x: h.x + (s.dir === "right" ? k : s.dir === "left" ? -k : 0), y: h.y + (s.dir === "down" ? k : s.dir === "up" ? -k : 0) }));
          for (const a of r.apples) {
            expect(dist(a, h), `seed ${seed}: apple ${a.x},${a.y} by head ${h.x},${h.y}`).toBeGreaterThan(2);
            expect(ahead.some((p) => p.x === a.x && p.y === a.y)).toBe(false);
          }
        }
      }
    });
  }

  it("and an apple that appears mid-round never appears within 2 cells of a head", () => {
    let checked = 0;
    for (let seed = 1; seed <= 20; seed++) {
      const rng = mulberry32(seed);
      let r = newRound(PC_SHAPE, 3, rng);
      for (let t = 0; t < 300 && !r.over; t++) {
        const before = new Set(r.apples.map((a) => `${a.x},${a.y}`));
        const bodiesBefore = new Set(r.snakes.flatMap((s) => s.body.map((p) => `${p.x},${p.y}`)));
        r = tick(steerBots(r, 0, rng), rng).round;
        for (const a of r.apples) {
          const k = `${a.x},${a.y}`;
          if (before.has(k) || bodiesBefore.has(k)) continue; // kept, or a burst
          for (const s of r.snakes) if (s.alive) expect(dist(a, s.body[0])).toBeGreaterThan(2);
          checked++;
        }
      }
    }
    expect(checked).toBeGreaterThan(50);
  });
});

describe("the phone board is roomier than the first build's 17x24", () => {
  it("more cells, still portrait, the PC board unchanged", () => {
    expect(PHONE_SHAPE.cols * PHONE_SHAPE.rows).toBeGreaterThan(17 * 24);
    expect(PHONE_SHAPE.rows).toBeGreaterThan(PHONE_SHAPE.cols);
    expect(PC_SHAPE).toEqual({ cols: 30, rows: 20 });
  });
});

/**
 * The target the operator set, 2026-09-28: a careful player's median life over
 * 60 s and at most 1 of 30 rounds under 11 s, both boards, every bot count.
 * The first build measured 18-37 s with 2-9 of 30 under 11 s; the gentler rules
 * above are what closes that gap, and this is where the next change that moves
 * them is caught, the same way `bots.test.ts` pins the ladder.
 *
 * Since 2026-10-01 per LEVEL and per MAP. Measured: Open 77-90 s median at
 * every level, Easy 89.9 s on both boards (it lasts to the bell); Rocks 64-90 s,
 * its lowest Hard on the PC board (64.5 s), with 1 of 30 under 11 s at most.
 */
describe("a careful player's life, 30 seeded rounds a cell", () => {
  for (const map of ["open", "rocks"] as MapId[]) {
    for (const [name, shape] of [
      ["PC", PC_SHAPE],
      ["phone", PHONE_SHAPE],
    ] as const) {
      for (const level of LEVELS) {
        it(`${map}, ${name} (${shape.cols}x${shape.rows}), ${level}: median over 60 s, at most 1 of 30 under 11 s`, () => {
          const l = lifetimes(shape, level, "careful", 30, 1, map);
          expect(l.median, `median ${l.median.toFixed(1)}s, causes ${JSON.stringify(l.causes)}`).toBeGreaterThan(60);
          expect(l.under11, `${l.under11} of 30 under 11s`).toBeLessThanOrEqual(1);
          // Easy is the gentle one: a careful player there lasts to the bell in most rounds.
          if (level === "easy") expect(l.median).toBeGreaterThan(85);
        });
      }
    }
  }
});

describe("the safe start is visible: every snake is drawn translucent while it lasts", () => {
  it("segmentAlpha is lower while safe, at the head and down the tail", () => {
    expect(segmentAlpha(0, true)).toBeLessThan(segmentAlpha(0, false));
    expect(segmentAlpha(3, true)).toBeLessThan(segmentAlpha(3, false));
  });

  it("drawSnake fills every segment, glow and eye at a lower alpha while safe than while not", () => {
    // A no-op pen: every draw call just returns itself, so `drawSnake` can run
    // to completion. The only thing this test reads is the alpha `fillStyle`
    // was called with, in order - so the same call, safe vs not, is the same
    // index in each log.
    const penFor = (sink: number[]): Pen => {
      const pen: Pen = {
        fillStyle(_c, a = 1) {
          sink.push(a);
          return pen;
        },
        fillCircle: () => pen,
        fillRect: () => pen,
        fillRoundedRect: () => pen,
        fillTriangle: () => pen,
      };
      return pen;
    };
    const b: Board = { ox: 0, oy: 0, c: 20, cols: 10, rows: 10 };
    const body = [
      { x: 5, y: 5 },
      { x: 4, y: 5 },
      { x: 3, y: 5 },
    ];
    const safe: number[] = [];
    const normal: number[] = [];
    drawSnake(penFor(safe), b, 0, body, "right", 0, true);
    drawSnake(penFor(normal), b, 0, body, "right", 0, false);
    expect(safe.length).toBe(normal.length);
    // 2 fillStyle calls (glow, segment) per body cell, plus 2 for the eyes.
    expect(safe.length).toBe(body.length * 2 + 2);
    for (let i = 0; i < safe.length; i++) expect(safe[i], `call ${i}`).toBeLessThan(normal[i]);
  });
});
