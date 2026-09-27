import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { dailyRng, shiftDateKey } from "@sdk/daily";
import { newGame, placeFood, step, turn, type Dir, type SnakeState } from "./logic";
import { SPAWN_CLEAR, buildWalls, dealBoard } from "./todayBoard";
import { launch } from "./flow";

/**
 * Today's board: the same walls for everyone on a given day.
 *
 * The board is BUILT, never scattered and hoped over (CLAUDE.md, puzzle
 * boards): every wall piece is accepted only if the board it leaves behind
 * still holds three properties, so no day can hand a player a board that is
 * unfair before the first apple. A year of days is checked, not a sample.
 */

const COLS = 17;
const ROWS = 17;
const START = "2026-09-27";
const DAYS = Array.from({ length: 366 }, (_, i) => shiftDateKey(START, i));

const idx = (x: number, y: number) => y * COLS + x;

function neighbours(i: number): number[] {
  const x = i % COLS;
  const y = Math.floor(i / COLS);
  const out: number[] = [];
  if (x > 0) out.push(i - 1);
  if (x < COLS - 1) out.push(i + 1);
  if (y > 0) out.push(i - COLS);
  if (y < ROWS - 1) out.push(i + COLS);
  return out;
}

describe("today's walls", () => {
  it("are the same for everyone on a day, and differ between days", () => {
    const a = buildWalls(COLS, ROWS, dailyRng(START, "snake"));
    const b = buildWalls(COLS, ROWS, dailyRng(START, "snake"));
    expect(a).toEqual(b);
    const distinct = new Set(DAYS.slice(0, 30).map((d) => buildWalls(COLS, ROWS, dailyRng(d, "snake")).join(",")));
    expect(distinct.size, "thirty days, thirty boards").toBe(30);
  });

  it("never block the start: the snake's row and its neighbours stay open", () => {
    for (const d of DAYS) {
      const walls = new Set(buildWalls(COLS, ROWS, dailyRng(d, "snake")));
      for (const i of SPAWN_CLEAR(COLS, ROWS)) expect(walls.has(i), `${d}: wall in the start zone at ${i}`).toBe(false);
    }
  });

  it("never block the first press, whichever way it goes - all four, every day", () => {
    // Since 2026-09-27 the snake waits for the player's first direction and a
    // backwards press turns it round, so the start zone written for a snake
    // that always set off right has to hold in all four directions: the whole
    // line to the edge, and a free first turn on each of the first 3 cells.
    const DELTA: Record<Dir, [number, number]> = { up: [0, -1], down: [0, 1], left: [-1, 0], right: [1, 0] };
    for (const d of DAYS) {
      const { state } = dealBoard("today", () => dailyRng(d, "snake"), COLS, ROWS);
      const walls = new Set(state.walls);
      for (const dir of Object.keys(DELTA) as Dir[]) {
        let s: SnakeState = { ...launch(state, dir), food: { x: -9, y: -9 } };
        const [dx, dy] = DELTA[dir];
        const h = s.body[0];
        const room = dx > 0 ? COLS - 1 - h.x : dx < 0 ? h.x : dy > 0 ? ROWS - 1 - h.y : h.y;
        for (let k = 0; k < room; k++) s = step(s);
        expect(s.alive, `${d} ${dir}: a wall on the line ahead`).toBe(true);
        expect(step(s).alive, `${d} ${dir}: only the edge ends the line`).toBe(false);
        for (let k = 1; k <= 3; k++) {
          for (const side of [-1, 1]) {
            const x = h.x + dx * k + dy * side;
            const y = h.y + dy * k + dx * side;
            expect(walls.has(idx(x, y)), `${d} ${dir}: first turn blocked ${k} ahead`).toBe(false);
          }
        }
      }
    }
  });

  it("leave every open cell reachable from every other - no sealed room", () => {
    for (const d of DAYS) {
      const walls = new Set(buildWalls(COLS, ROWS, dailyRng(d, "snake")));
      const open = Array.from({ length: COLS * ROWS }, (_, i) => i).filter((i) => !walls.has(i));
      const seen = new Set([open[0]]);
      const queue = [open[0]];
      while (queue.length) for (const n of neighbours(queue.pop()!)) if (!walls.has(n) && !seen.has(n)) (seen.add(n), queue.push(n));
      expect(seen.size, `${d}: ${open.length - seen.size} cells sealed off`).toBe(open.length);
    }
  });

  it("leave no dead end - no open cell boxed in on three sides", () => {
    for (const d of DAYS) {
      const walls = new Set(buildWalls(COLS, ROWS, dailyRng(d, "snake")));
      for (let i = 0; i < COLS * ROWS; i++) {
        if (walls.has(i)) continue;
        const blocked = 4 - neighbours(i).filter((n) => !walls.has(n)).length;
        expect(blocked, `${d}: cell ${i} is a dead end`).toBeLessThan(3);
      }
    }
  });

  it("are a board, not a scatter: a handful of pieces every day", () => {
    for (const d of DAYS) {
      const n = buildWalls(COLS, ROWS, dailyRng(d, "snake")).length;
      expect(n, d).toBeGreaterThanOrEqual(8);
      expect(n, d).toBeLessThanOrEqual(24);
    }
  });
});

describe("a board with walls", () => {
  const walls = buildWalls(COLS, ROWS, dailyRng(START, "snake"));

  it("never puts an apple on a wall", () => {
    const rng = dailyRng(START, "snake:food-probe");
    const s = newGame(COLS, ROWS, rng, walls);
    const blocked = new Set(walls);
    for (let k = 0; k < 2000; k++) {
      const f = placeFood(s, rng);
      expect(blocked.has(idx(f.x, f.y))).toBe(false);
    }
  });

  it("kills the snake that runs into one", () => {
    // A single wall right in front of the head, and nothing else.
    const plain = newGame(COLS, ROWS, () => 0.99);
    const head = plain.body[0];
    const s: SnakeState = newGame(COLS, ROWS, () => 0.99, [idx(head.x, head.y - 1)]);
    const dead = step(turn(s, "up"));
    expect(dead.alive).toBe(false);
    // Control: the same move with no wall lives.
    expect(step(turn(plain, "up")).alive).toBe(true);
  });

  it("is the same game as before when there are no walls", () => {
    const a = newGame(COLS, ROWS, () => 0.3);
    const b = newGame(COLS, ROWS, () => 0.3, []);
    expect(b).toEqual(a);
    expect(a.walls).toEqual([]);
  });
});

describe("dealing today's board", () => {
  it("gives every device the same walls AND the same apples", async () => {
    const { dealBoard } = await import("./todayBoard");
    const run = () => {
      const { state, foodRng } = dealBoard("today", () => dailyRng(START, "snake"), COLS, ROWS);
      const apples = [state.food];
      for (let k = 0; k < 20; k++) apples.push(placeFood(state, foodRng));
      return { walls: state.walls, apples };
    };
    expect(run()).toEqual(run());
    expect(run().walls.length).toBeGreaterThan(0);
  });

  it("leaves the classic board exactly as it was: no walls", async () => {
    const { dealBoard } = await import("./todayBoard");
    const { state, foodRng } = dealBoard("classic", () => dailyRng(START, "snake"), COLS, ROWS);
    expect(state.walls).toEqual([]);
    expect(foodRng).toBe(Math.random);
  });
});

describe("the scene plays today's board as dealt", () => {
  // Source-read: the scene boots Phaser and cannot run in this suite.
  const SCENE = readFileSync(new URL("./SnakeScene.ts", import.meta.url), "utf8");

  it("draws every apple from the day's generator, not Math.random", () => {
    // Without it the walls would match between two phones and the apples would
    // not, and "today's best" would be two different games.
    expect(SCENE).toContain("step(this.state, this.foodRng)");
  });

  it("keeps today's record apart from the all-time one", () => {
    expect(SCENE).toContain("report({ value: this.state.score, unit: \"points\", board: this.recordBoard() })");
    expect(SCENE).toContain("this.ctx.score?.best(this.recordBoard())");
    expect(SCENE).toMatch(/this\.mode === "today" \? `today-\$\{this\.today\(\)\}` : undefined/);
  });
});
