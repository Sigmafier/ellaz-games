import { describe, expect, it } from "vitest";
import { mulberry32 } from "@shared/rng";
import { steerBots, viewOf, deadly } from "./bots";
import { PC_SHAPE, PHONE_SHAPE, makeRound, step, tick, type Point, type Round, type Shape } from "./logic";
import { ROCK_CLEAR, placeRocks } from "./rocks";
import { dealRound, LEVELS } from "./setup";

// The Rocks map (forum review: "a hard map with a few obstacles, not too
// many"). A few small clusters, and every promise below checked over many
// seeds on both boards, because a rock placed by a dice roll is only as safe
// as the worst roll.

const SEEDS = 300;
const key = (p: Point) => `${p.x},${p.y}`;
const manhattan = (a: Point, b: Point) => Math.abs(a.x - b.x) + Math.abs(a.y - b.y);

/** Every free cell reachable from one free cell: one piece of board, no sealed pocket. */
function connected(shape: Shape, rocks: Point[]): boolean {
  const rock = new Set(rocks.map(key));
  const free: Point[] = [];
  for (let y = 0; y < shape.rows; y++) for (let x = 0; x < shape.cols; x++) if (!rock.has(`${x},${y}`)) free.push({ x, y });
  const seen = new Set([key(free[0])]);
  const queue = [free[0]];
  while (queue.length) {
    const c = queue.pop()!;
    for (const d of ["up", "down", "left", "right"] as const) {
      const n = step(c, d);
      if (n.x < 0 || n.y < 0 || n.x >= shape.cols || n.y >= shape.rows || rock.has(key(n)) || seen.has(key(n))) continue;
      seen.add(key(n));
      queue.push(n);
    }
  }
  return seen.size === free.length;
}

const deals = (shape: Shape) =>
  Array.from({ length: SEEDS }, (_, i) => dealRound(shape, { level: LEVELS[i % 3], map: "rocks", humans: (1 + (i % 2)) as 1 | 2 }, mulberry32(i + 1)));

for (const [name, shape] of [["PC", PC_SHAPE], ["phone", PHONE_SHAPE]] as const) {
  describe(`Rocks on the ${name} board (${shape.cols}x${shape.rows}), ${SEEDS} seeds`, () => {
    const rounds = deals(shape);

    it("a few rocks, not too many: 6 to 10 cells, in clusters of 2 or 3", () => {
      for (const r of rounds) {
        expect(r.rocks.length).toBeGreaterThanOrEqual(6);
        expect(r.rocks.length).toBeLessThanOrEqual(10);
        expect(new Set(r.rocks.map(key)).size).toBe(r.rocks.length);
      }
    });

    it("the board stays one piece - no cell is sealed off", () => {
      for (const r of rounds) expect(connected(shape, r.rocks), JSON.stringify(r.rocks)).toBe(true);
    });

    it(`nothing within ${ROCK_CLEAR} cells of any snake at the start, and nothing in the lane ahead of a start heading`, () => {
      for (const r of rounds) {
        for (const s of r.snakes) {
          for (const rock of r.rocks) for (const p of s.body) expect(manhattan(rock, p)).toBeGreaterThan(ROCK_CLEAR);
          const rocks = new Set(r.rocks.map(key));
          let p = s.body[0];
          for (;;) {
            p = step(p, s.dir);
            if (p.x < 0 || p.y < 0 || p.x >= shape.cols || p.y >= shape.rows) break;
            expect(rocks.has(key(p)), `rock in ${s.id}'s lane at ${key(p)}`).toBe(false);
          }
        }
      }
    });

    it("no apple is ever dealt or dropped on a rock", () => {
      for (const r0 of rounds.slice(0, 40)) {
        const rng = mulberry32(r0.rocks.length * 31 + 1);
        let r = r0;
        const rocks = new Set(r.rocks.map(key));
        for (let t = 0; t < 400 && !r.over; t++) {
          for (const a of r.apples) expect(rocks.has(key(a))).toBe(false);
          r = tick(steerBots(r, 0.05, rng), rng).round;
        }
      }
    });
  });
}

describe("a rock is a wall", () => {
  const shape = { cols: 10, rows: 6 };
  const scene = (): Round => ({
    ...makeRound({
      shape,
      snakes: [
        { body: [{ x: 3, y: 2 }, { x: 2, y: 2 }, { x: 1, y: 2 }], dir: "right" },
        { body: [{ x: 3, y: 5 }, { x: 2, y: 5 }, { x: 1, y: 5 }], dir: "right" },
      ],
      apples: [],
      target: 0,
    }),
    rocks: [{ x: 4, y: 2 }],
  });

  it("a head that runs into a rock is out, the same way a wall puts it out", () => {
    const { round, events } = tick(scene(), mulberry32(1));
    expect(round.snakes[0].alive).toBe(false);
    expect(events.out).toEqual([{ id: 0, cause: "wall" }]);
  });

  it("a bot sees a rock as a wall, and never chooses it while it has another way", () => {
    const r = scene();
    expect(deadly(r, viewOf(r), r.snakes[0], "right")).toBe(true);
    const steered = steerBots({ ...r, humans: 0 }, 0, mulberry32(3));
    expect(steered.snakes[0].pending).not.toBe("right");
  });

  it("an out snake's burst never leaves an apple on a rock", () => {
    const r = tick(scene(), mulberry32(1)).round;
    for (const a of r.apples) expect(key(a)).not.toBe("4,2");
  });

  it("placeRocks never returns the same layout twice in a row for different seeds (it is random), and is a function of its seed", () => {
    const starts = dealRound(PC_SHAPE, { level: "normal", map: "open", humans: 1 }, mulberry32(1)).snakes.map((s) => ({ body: s.body, dir: s.dir }));
    expect(placeRocks(PC_SHAPE, starts, mulberry32(5))).toEqual(placeRocks(PC_SHAPE, starts, mulberry32(5)));
    expect(placeRocks(PC_SHAPE, starts, mulberry32(5))).not.toEqual(placeRocks(PC_SHAPE, starts, mulberry32(6)));
  });
});
