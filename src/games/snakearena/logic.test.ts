import { describe, expect, it } from "vitest";
import { mulberry32 } from "@shared/rng";
import {
  PC_SHAPE,
  PHONE_SHAPE,
  ROUND_TICKS,
  START_LEN,
  STEP_MS,
  appleTarget,
  launch,
  makeRound,
  newRound,
  placeOf,
  secondsLeft,
  standing,
  tick,
  turn,
  type Point,
  type Round,
} from "./logic";

const key = (p: Point) => `${p.x},${p.y}`;
const small = { cols: 10, rows: 8 };

/** A row of cells, head first, running AWAY from `dir`. */
function line(x: number, y: number, len: number, dir: "left" | "right" | "up" | "down"): Point[] {
  const back = { left: [1, 0], right: [-1, 0], up: [0, 1], down: [0, -1] }[dir];
  return Array.from({ length: len }, (_, i) => ({ x: x + back[0] * i, y: y + back[1] * i }));
}

describe("a new round", () => {
  for (const shape of [PC_SHAPE, PHONE_SHAPE]) {
    for (const bots of [3, 4, 5]) {
      it(`${shape.cols}x${shape.rows} with ${bots} bots: every snake on the board, apart, and the apples on free cells`, () => {
        const r = newRound(shape, bots, mulberry32(bots * 7));
        expect(r.snakes).toHaveLength(bots + 1);
        const seen = new Set<string>();
        for (const s of r.snakes) {
          expect(s.body).toHaveLength(START_LEN);
          expect(s.alive).toBe(true);
          for (const p of s.body) {
            expect(p.x >= 0 && p.x < shape.cols && p.y >= 0 && p.y < shape.rows).toBe(true);
            expect(seen.has(key(p)), `two snakes share ${key(p)}`).toBe(false);
            seen.add(key(p));
          }
        }
        expect(r.apples).toHaveLength(appleTarget(bots + 1));
        for (const a of r.apples) expect(seen.has(key(a))).toBe(false);
        expect(r.ticks).toBe(ROUND_TICKS);
        expect(r.over).toBe(false);
      });
    }
  }

  it("no snake starts facing into a wall or another snake one step ahead", () => {
    for (const shape of [PC_SHAPE, PHONE_SHAPE]) {
      const r = newRound(shape, 5, mulberry32(1));
      const next = tick(r, mulberry32(2)).round;
      expect(next.snakes.every((s) => s.alive)).toBe(true);
    }
  });

  it("is the same round for the same seed", () => {
    expect(newRound(PC_SHAPE, 4, mulberry32(9))).toEqual(newRound(PC_SHAPE, 4, mulberry32(9)));
  });

  it("lasts ninety seconds of steps, and the clock opens on 1:30, never 1:31", () => {
    expect(Math.abs(ROUND_TICKS * STEP_MS - 90_000)).toBeLessThan(STEP_MS);
    expect(secondsLeft(newRound(PC_SHAPE, 3, mulberry32(1)))).toBe(90);
  });
});

describe("steering", () => {
  const r = makeRound({ shape: small, snakes: [{ body: line(5, 4, 3, "right"), dir: "right" }], apples: [] });

  it("a turn is buffered for the next step", () => {
    expect(turn(r, 0, "up").snakes[0].pending).toBe("up");
  });

  it("a reversal onto the neck is ignored", () => {
    expect(turn(r, 0, "left").snakes[0].pending).toBe("right");
  });

  it("the first move may go backwards: the snake turns round", () => {
    const l = launch(r, 0, "left");
    expect(l.snakes[0].body[0]).toEqual({ x: 3, y: 4 });
    expect(l.snakes[0].dir).toBe("left");
    expect(tick(l).round.snakes[0].body[0]).toEqual({ x: 2, y: 4 });
  });
});

describe("one tick moves everyone at once", () => {
  it("each alive snake advances one cell and drops its tail", () => {
    const r = makeRound({
      shape: small,
      snakes: [
        { body: line(3, 1, 3, "right"), dir: "right" },
        { body: line(6, 6, 3, "left"), dir: "left" },
      ],
      apples: [],
    });
    const n = tick(r, mulberry32(1)).round;
    expect(n.snakes[0].body).toEqual(line(4, 1, 3, "right"));
    expect(n.snakes[1].body).toEqual(line(5, 6, 3, "left"));
    expect(n.tick).toBe(1);
  });

  it("an apple grows the snake that reaches it, and a new apple keeps the count", () => {
    const r = makeRound({
      shape: small,
      snakes: [{ body: line(3, 1, 3, "right"), dir: "right" }],
      apples: [{ x: 4, y: 1 }],
      target: 1,
    });
    const { round: n, events } = tick(r, mulberry32(3));
    expect(n.snakes[0].body).toHaveLength(4);
    expect(n.snakes[0].body[3]).toEqual({ x: 1, y: 1 });
    expect(n.snakes[0].eaten).toBe(1);
    expect(n.snakes[0].peak).toBe(4);
    expect(events.ate).toEqual([0]);
    expect(n.apples).toHaveLength(1);
    expect(n.apples[0]).not.toEqual({ x: 4, y: 1 });
  });

  it("a head may enter the cell a tail leaves on the same step", () => {
    // A chases its own tail round a 2x2 square: legal in the classic too.
    const r = makeRound({
      shape: small,
      snakes: [{ body: [{ x: 2, y: 2 }, { x: 3, y: 2 }, { x: 3, y: 3 }, { x: 2, y: 3 }], dir: "left" }],
      apples: [],
    });
    const n = tick(turn(r, 0, "down"), mulberry32(1)).round;
    expect(n.snakes[0].alive).toBe(true);
  });

  it("but not the tail of a snake that is growing this step", () => {
    const r = makeRound({
      shape: small,
      snakes: [
        { body: line(4, 2, 3, "right"), dir: "right" }, // tail at (2,2)
        { body: [{ x: 2, y: 1 }, { x: 1, y: 1 }], dir: "right" }, // wants (2,2)? no - pointed down below
      ],
      apples: [{ x: 5, y: 2 }],
    });
    const n = tick(turn(r, 1, "down"), mulberry32(1)).round;
    expect(n.snakes[0].alive).toBe(true);
    expect(n.snakes[1].alive).toBe(false);
    expect(n.snakes[1].cause).toBe("body");
  });
});

describe("who is out", () => {
  it("a head off the board is out, and the snake bursts into apples along its body", () => {
    const body = line(9, 3, 4, "right");
    const r = makeRound({
      shape: small,
      snakes: [{ body, dir: "right" }, { body: line(2, 7, 3, "right"), dir: "right" }],
      apples: [],
      target: 0,
    });
    const { round: n, events } = tick(r, mulberry32(1));
    expect(n.snakes[0].alive).toBe(false);
    expect(n.snakes[0].cause).toBe("wall");
    expect(n.snakes[0].body).toEqual([]);
    expect(n.snakes[0].peak).toBe(4);
    expect(events.out).toEqual([{ id: 0, cause: "wall" }]);
    expect(n.apples.map(key).sort()).toEqual(body.map(key).sort());
  });

  it("a head into another snake's body is out, and the other snake is not", () => {
    const r = makeRound({
      shape: small,
      snakes: [
        { body: line(4, 3, 3, "down"), dir: "down" }, // head (4,3) moves to (4,4)
        { body: line(6, 4, 5, "right"), dir: "right" }, // after moving: (7,4)..(3,4)
      ],
      apples: [],
      target: 0,
    });
    const n = tick(r, mulberry32(1)).round;
    expect(n.snakes[0].alive).toBe(false);
    expect(n.snakes[0].cause).toBe("body");
    expect(n.snakes[1].alive).toBe(true);
  });

  it("a head into its own body is out", () => {
    const r = makeRound({
      shape: small,
      snakes: [{ body: [{ x: 3, y: 3 }, { x: 4, y: 3 }, { x: 4, y: 4 }, { x: 3, y: 4 }, { x: 2, y: 4 }], dir: "left" }],
      apples: [],
      target: 0,
    });
    const n = tick(turn(r, 0, "down"), mulberry32(1)).round;
    expect(n.snakes[0].alive).toBe(false);
    expect(n.snakes[0].cause).toBe("self");
  });

  it("two heads into the same cell put BOTH out", () => {
    const r = makeRound({
      shape: small,
      snakes: [
        { body: line(3, 4, 3, "right"), dir: "right" },
        { body: line(5, 4, 3, "left"), dir: "left" },
      ],
      apples: [],
      target: 0,
    });
    const n = tick(r, mulberry32(1)).round;
    expect(n.snakes.map((s) => [s.alive, s.cause])).toEqual([
      [false, "head"],
      [false, "head"],
    ]);
  });

  it("two heads passing through each other put both out as well", () => {
    const r = makeRound({
      shape: small,
      snakes: [
        { body: line(4, 4, 3, "right"), dir: "right" },
        { body: line(5, 4, 3, "left"), dir: "left" },
      ],
      apples: [],
      target: 0,
    });
    const n = tick(r, mulberry32(1)).round;
    expect(n.snakes.map((s) => [s.alive, s.cause])).toEqual([
      [false, "head"],
      [false, "head"],
    ]);
  });

  it("two heads onto one apple: both out, and nobody eats it", () => {
    const r = makeRound({
      shape: small,
      snakes: [
        { body: line(3, 4, 3, "right"), dir: "right" },
        { body: line(5, 4, 3, "left"), dir: "left" },
        { body: line(8, 0, 3, "right"), dir: "down" },
      ],
      apples: [{ x: 4, y: 4 }],
      target: 1,
    });
    const n = tick(r, mulberry32(1)).round;
    expect(n.snakes[0].alive).toBe(false);
    expect(n.snakes[1].alive).toBe(false);
    expect(n.snakes[0].eaten + n.snakes[1].eaten).toBe(0);
    expect(n.apples.map(key)).toContain("4,4");
  });

  it("burst apples can push the count over the target, and nothing respawns until it is under", () => {
    const r = makeRound({
      shape: small,
      snakes: [
        { body: line(9, 3, 5, "right"), dir: "right" },
        { body: line(2, 7, 3, "right"), dir: "right" },
        { body: line(2, 0, 3, "right"), dir: "right" },
      ],
      apples: [{ x: 0, y: 5 }],
      target: 2,
    });
    const n = tick(r, mulberry32(1)).round;
    expect(n.apples).toHaveLength(6);
  });
});

describe("the clock and the winner", () => {
  const two = (lenA: number, lenB: number): Round =>
    makeRound({
      shape: { cols: 20, rows: 10 },
      snakes: [
        { body: line(10, 2, lenA, "right"), dir: "right" },
        { body: line(10, 7, lenB, "right"), dir: "right" },
      ],
      apples: [],
      target: 0,
      ticks: 3,
    });

  it("ends when the steps run out, and the longest snake alive wins", () => {
    let r = two(3, 5);
    for (let i = 0; i < 3; i++) r = tick(r, mulberry32(i)).round;
    expect(r.over).toBe(true);
    expect(r.winner).toBe(1);
    expect(standing(r)).toEqual([1, 0]);
  });

  it("a tie on length goes to the snake that reached it first", () => {
    let r = two(4, 4);
    r = { ...r, snakes: r.snakes.map((s, i) => ({ ...s, grewAt: i === 0 ? 2 : 1 })) };
    for (let i = 0; i < 3; i++) r = tick(r, mulberry32(i)).round;
    expect(r.winner).toBe(1);
  });

  it("the last snake alive wins at once", () => {
    const r = makeRound({
      shape: small,
      snakes: [
        { body: line(9, 3, 3, "right"), dir: "right" },
        { body: line(4, 6, 3, "right"), dir: "right" },
      ],
      apples: [],
      target: 0,
    });
    const n = tick(r, mulberry32(1)).round;
    expect(n.over).toBe(true);
    expect(n.winner).toBe(1);
  });

  it("if the last two go out together, nobody wins", () => {
    const r = makeRound({
      shape: small,
      snakes: [
        { body: line(3, 4, 3, "right"), dir: "right" },
        { body: line(5, 4, 3, "left"), dir: "left" },
      ],
      apples: [],
      target: 0,
    });
    const n = tick(r, mulberry32(1)).round;
    expect(n.over).toBe(true);
    expect(n.winner).toBeNull();
  });

  it("a finished round does not move", () => {
    let r = two(3, 5);
    for (let i = 0; i < 3; i++) r = tick(r, mulberry32(i)).round;
    expect(tick(r, mulberry32(9)).round).toBe(r);
  });
});

describe("the ranking", () => {
  it("orders by length reached, an out snake keeping the length it had", () => {
    const r = makeRound({
      shape: { cols: 20, rows: 12 },
      snakes: [
        { body: line(10, 1, 3, "right"), dir: "right" },
        { body: line(10, 4, 6, "right"), dir: "right" },
        { body: line(10, 7, 4, "right"), dir: "right" },
      ],
      apples: [],
      target: 0,
    });
    const out = { ...r, snakes: r.snakes.map((s, i) => (i === 1 ? { ...s, alive: false, body: [], outAt: 0, cause: "wall" as const } : s)) };
    expect(standing(out)).toEqual([1, 2, 0]);
    expect(placeOf(out, 0)).toBe(3);
  });

  it("an out snake and an alive one of the same length: the one still alive is ahead", () => {
    const r = makeRound({
      shape: { cols: 20, rows: 12 },
      snakes: [
        { body: line(10, 1, 4, "right"), dir: "right" },
        { body: line(10, 4, 4, "right"), dir: "right" },
      ],
      apples: [],
      target: 0,
    });
    const out = { ...r, snakes: r.snakes.map((s, i) => (i === 0 ? { ...s, alive: false, body: [], outAt: 0 } : s)) };
    expect(standing(out)).toEqual([1, 0]);
  });

  it("the winner is first even when an out snake grew longer", () => {
    const r = makeRound({
      shape: { cols: 20, rows: 12 },
      snakes: [
        { body: line(10, 1, 3, "right"), dir: "right" },
        { body: line(10, 4, 9, "right"), dir: "right" },
      ],
      apples: [],
      target: 0,
    });
    const done: Round = {
      ...r,
      over: true,
      winner: 0,
      snakes: r.snakes.map((s, i) => (i === 1 ? { ...s, alive: false, body: [], outAt: 0 } : s)),
    };
    expect(standing(done)).toEqual([0, 1]);
  });
});
