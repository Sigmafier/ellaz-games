import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { newGame, step, turn, type Dir, type Point, type SnakeState } from "./logic";
import { FOOD_PER_LEVEL, WALL_CAP, addStageWalls, piecesFor, stageOf } from "./stageWalls";
import { allConnected, hasDeadEnd } from "./todayBoard";
import { drawWallFlash, type Pen } from "./draw";

/**
 * "I manage to reach stage 4. What is the difference between stage 0 and
 *  stage 4? I didn't feel or saw any."   - Phaser forum, 2026-09-27
 *
 * Each stage of the classic board now drops a little more wall. Placement is
 * pure and seeded; every drop is checked against the five things that would
 * make it unfair, on hundreds of real runs played by a bot to stage 8 and past.
 */

const COLS = 17;
const ROWS = 17;
const N = COLS * ROWS;
const DELTA: Record<Dir, [number, number]> = { up: [0, -1], down: [0, 1], left: [-1, 0], right: [1, 0] };

function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const idx = (p: Point) => p.y * COLS + p.x;
const inside = (x: number, y: number) => x >= 0 && y >= 0 && x < COLS && y < ROWS;

describe("what a stage is (and what the band calls it)", () => {
  it("is 1-based: the first apple-less screen is stage 1, never stage 0", () => {
    expect(stageOf(0)).toBe(1);
    expect(stageOf(FOOD_PER_LEVEL - 1)).toBe(1);
    expect(stageOf(FOOD_PER_LEVEL)).toBe(2);
    expect(stageOf(4 * FOOD_PER_LEVEL)).toBe(5);
  });

  it("the scene publishes that same stage, so the band shows it", () => {
    const SCENE = readFileSync(new URL("./SnakeScene.ts", import.meta.url), "utf8");
    expect(SCENE).toContain("return stageOf(this.state.score);");
  });
});

describe("the wall schedule", () => {
  it("stage 1 has none, 2 adds two blocks, 3 a bar of three, then one piece a stage", () => {
    expect(piecesFor(1)).toEqual([]);
    expect(piecesFor(2)).toEqual([1, 1]);
    expect(piecesFor(3)).toEqual([3]);
    for (let s = 4; s <= 20; s++) {
      expect(piecesFor(s).length, `stage ${s}`).toBe(1);
      expect(piecesFor(s)[0]).toBeGreaterThanOrEqual(1);
      expect(piecesFor(s)[0]).toBeLessThanOrEqual(3);
    }
  });

  it("stage 2 is two separate blocks, stage 3 one straight bar of three", () => {
    for (let seed = 1; seed <= 50; seed++) {
      const rng = mulberry32(seed);
      const s1 = { ...newGame(COLS, ROWS, rng), score: FOOD_PER_LEVEL };
      const two = addStageWalls(s1, rng);
      expect(two.added.length).toBe(2);
      const [a, b] = two.added;
      const apart = Math.max(Math.abs((a % COLS) - (b % COLS)), Math.abs(Math.floor(a / COLS) - Math.floor(b / COLS)));
      expect(apart, `seed ${seed}: the two blocks touch`).toBeGreaterThan(1);
      const three = addStageWalls({ ...two.state, score: 2 * FOOD_PER_LEVEL }, rng);
      expect(three.added.length).toBe(3);
      const xs = new Set(three.added.map((i) => i % COLS));
      const ys = new Set(three.added.map((i) => Math.floor(i / COLS)));
      expect(xs.size === 1 || ys.size === 1, `seed ${seed}: not a straight bar`).toBe(true);
    }
  });

  it("the classic board starts empty, as it always has", () => {
    expect(newGame(COLS, ROWS, () => 0.5).walls).toEqual([]);
  });
});

/**
 * A plain bot: shortest path to the apple through moves that leave room,
 * else the move with the most room. Typed arrays, because it runs hundreds of
 * thousands of floods and a Set-based one cost a minute and a half.
 */
const STEPS: [number, number][] = Object.values(DELTA);
const blocked = new Uint8Array(N);
const dist = new Int32Array(N);
const queue = new Int32Array(N);

/** Flood from `start` over open cells; returns the count, fills `dist`. */
function flood(start: number): number {
  dist.fill(-1);
  dist[start] = 0;
  let head = 0;
  let tail = 0;
  queue[tail++] = start;
  while (head < tail) {
    const i = queue[head++];
    const x = i % COLS;
    const y = (i - x) / COLS;
    for (const [dx, dy] of STEPS) {
      const nx = x + dx;
      const ny = y + dy;
      if (!inside(nx, ny)) continue;
      const j = ny * COLS + nx;
      if (blocked[j] || dist[j] >= 0) continue;
      dist[j] = dist[i] + 1;
      queue[tail++] = j;
    }
  }
  return tail;
}

function bot(s: SnakeState): Dir {
  blocked.fill(0);
  for (const w of s.walls) blocked[w] = 1;
  for (const p of s.body.slice(0, -1)) blocked[idx(p)] = 1;
  const head = s.body[0];
  const options: { d: Dir; room: number; toFood: number }[] = [];
  for (const d of Object.keys(DELTA) as Dir[]) {
    const nx = head.x + DELTA[d][0];
    const ny = head.y + DELTA[d][1];
    if (!inside(nx, ny) || blocked[ny * COLS + nx]) continue;
    const room = flood(ny * COLS + nx);
    const f = dist[idx(s.food)];
    options.push({ d, room, toFood: f < 0 ? Infinity : f });
  }
  if (!options.length) return s.dir;
  const safe = options.filter((o) => o.room > s.body.length + 2);
  const pool = safe.length ? safe : options;
  pool.sort((a, b) => a.toFood - b.toFood || b.room - a.room);
  return pool[0].d;
}

type Drop = { before: SnakeState; after: SnakeState; added: number[] };

function problems({ before, after, added }: Drop): string[] {
  const out: string[] = [];
  const walls = new Set(after.walls);
  for (const w of before.walls) if (!walls.has(w)) out.push(`wall ${w} was removed`);
  if (after.walls.length > WALL_CAP) out.push(`${after.walls.length} walls, over the cap ${WALL_CAP}`);
  if (new Set(after.walls).size !== after.walls.length) out.push("a wall listed twice");
  for (const p of after.body) if (walls.has(idx(p))) out.push(`wall on the body at ${idx(p)}`);
  if (walls.has(idx(after.food))) out.push("wall on the food");
  const h = after.body[0];
  for (let dy = -1; dy <= 1; dy++)
    for (let dx = -1; dx <= 1; dx++)
      if (inside(h.x + dx, h.y + dy) && walls.has((h.y + dy) * COLS + h.x + dx) && added.includes((h.y + dy) * COLS + h.x + dx))
        out.push(`new wall next to the head at ${(h.y + dy) * COLS + h.x + dx}`);
  for (const d of new Set([after.dir, after.pendingDir])) {
    for (let k = 1; k <= 3; k++) {
      const x = h.x + DELTA[d][0] * k;
      const y = h.y + DELTA[d][1] * k;
      if (inside(x, y) && added.includes(y * COLS + x)) out.push(`new wall ${k} ahead of the head (${d})`);
    }
  }
  if (!allConnected(walls, N, COLS, ROWS)) out.push("the open board is split in two");
  if (hasDeadEnd(walls, N, COLS, ROWS)) out.push("a dead-end pocket");
  return out;
}

function play(seed: number): { stage: number; drops: Drop[] } {
  const rng = mulberry32(seed);
  let s = newGame(COLS, ROWS, rng);
  const drops: Drop[] = [];
  for (let t = 0; t < 20_000 && s.alive && stageOf(s.score) < 10; t++) {
    const was = stageOf(s.score);
    s = step(turn(s, bot(s)), rng);
    if (s.alive && stageOf(s.score) > was) {
      const got = addStageWalls(s, rng);
      drops.push({ before: s, after: got.state, added: got.added });
      s = got.state;
    }
  }
  return { stage: stageOf(s.score), drops };
}

describe("every wall drop, on hundreds of played runs", () => {
  const RUNS = 300;
  const runs = Array.from({ length: RUNS }, (_, i) => play(1000 + i));
  const drops = runs.flatMap((r) => r.drops);

  it("reaches deep: most runs get to stage 8 and past", () => {
    const deep = runs.filter((r) => r.stage >= 8).length;
    // Population, printed, so a green run says how much it looked at.
    console.log(`population: ${RUNS} runs, ${drops.length} drops, ${deep} reached stage 8+`);
    expect(drops.length).toBeGreaterThan(RUNS * 5);
    expect(deep / RUNS).toBeGreaterThanOrEqual(0.9);
  });

  it("never breaks a rule, after any drop", () => {
    const bad = drops.flatMap((d, i) => problems(d).map((p) => `drop ${i} (stage ${stageOf(d.after.score)}): ${p}`));
    expect(bad.slice(0, 10)).toEqual([]);
  });

  it("places what the stage asked for, until the cap", () => {
    let short = 0;
    for (const d of drops) {
      const want = piecesFor(stageOf(d.after.score)).reduce((a, b) => a + b, 0);
      const room = WALL_CAP - d.before.walls.length;
      if (d.added.length < Math.min(want, room)) short++;
    }
    const capped = runs.filter((r) => r.drops.some((d) => d.after.walls.length === WALL_CAP)).length;
    console.log(`placement: ${short} of ${drops.length} drops placed less than asked; ${capped} runs reached the cap`);
    expect(short, `${short} of ${drops.length} drops placed less than asked`).toBeLessThanOrEqual(Math.ceil(drops.length * 0.01));
    const full = runs.filter((r) => r.stage >= 10).map((r) => r.drops[r.drops.length - 1].after.walls.length);
    for (const n of full) expect(n).toBeLessThanOrEqual(WALL_CAP);
  });

  it("the new walls kill like any other wall", () => {
    const s = drops[0].after;
    const w = s.walls[0];
    const target = { x: w % COLS, y: Math.floor(w / COLS) };
    // Put the head right beside it, facing it.
    const beside = target.x > 0 ? { x: target.x - 1, y: target.y } : { x: target.x + 1, y: target.y };
    const dir: Dir = target.x > 0 ? "right" : "left";
    const probe: SnakeState = { ...s, body: [beside], dir, pendingDir: dir, food: { x: -9, y: -9 } };
    expect(step(probe).alive).toBe(false);
  });
});

describe("the scene", () => {
  const SCENE = readFileSync(new URL("./SnakeScene.ts", import.meta.url), "utf8");

  it("drops walls on the classic board only - today's board keeps its own", () => {
    expect(SCENE).toMatch(/if \(this\.mode === "classic" && stageOf\(this\.state\.score\) > stageOf\(prevScore\)\)/);
    expect(SCENE).toContain("addStageWalls(this.state, Math.random)");
  });

  it("flashes the new walls, and keeps the speed exactly as it was", () => {
    expect(SCENE).toContain("drawWallFlash(");
    expect(SCENE).toContain("Math.max(STEP_FLOOR, this.baseStepMs - (this.level() - 1) * STEP_DECAY_MS)");
    expect(SCENE).toMatch(/const SPEEDS: Record<SpeedKey, number> = \{ slow: 170, normal: 130, fast: 90 \};/);
    expect(SCENE).toMatch(/const STEP_DECAY_MS = 8;/);
    expect(SCENE).toMatch(/const STEP_FLOOR = 60;/);
  });
});

describe("the flash", () => {
  const board = { ox: 0, oy: 0, c: 20, cols: COLS, rows: ROWS };
  const pen = () => {
    const calls: string[] = [];
    const g = new Proxy({} as Pen, {
      get: (_t, k) => (...a: unknown[]) => (calls.push(`${String(k)}(${a.join(",")})`), g),
    });
    return { g, calls };
  };

  it("draws on every new wall while it runs, and nothing once it is over", () => {
    const on = pen();
    drawWallFlash(on.g, board, [5, 40], 0.2);
    expect(on.calls.length).toBeGreaterThan(0);
    const off = pen();
    drawWallFlash(off.g, board, [5, 40], 1);
    expect(off.calls).toEqual([]);
    const none = pen();
    drawWallFlash(none.g, board, [], 0.2);
    expect(none.calls).toEqual([]);
  });

  it("is drawn in the wall's own violet, never white", () => {
    const on = pen();
    drawWallFlash(on.g, board, [5], 0.3);
    const colours = on.calls.filter((c) => c.startsWith("fillStyle") || c.startsWith("lineStyle"));
    expect(colours.length).toBeGreaterThan(0);
    expect(colours.join(" ")).not.toMatch(/16777215/); // 0xffffff
  });
});
