// Snake Arena's look, kept out of the Phaser scene so node can test it and the
// scene stays render-and-input only. TYPE-ONLY imports: a value import from
// the scene would pull Phaser into anything importing this.
//
// The approved mock, 2026-09-28: the classic's dark board with a dot at each
// cell, rounded-square segments that glow in their snake's colour and fade a
// little toward the tail, two dark eyes on each head, and red apples with a halo.
import { APPLE, SNAKE_COLORS, hex } from "./ink";
import type { Dir, Point, Round } from "./logic";

/** The half of Phaser's Graphics this file draws with. */
export interface Pen {
  fillStyle(color: number, alpha?: number): Pen;
  fillCircle(x: number, y: number, r: number): Pen;
  fillRect(x: number, y: number, w: number, h: number): Pen;
  fillRoundedRect(x: number, y: number, w: number, h: number, r: number): Pen;
  fillTriangle(x0: number, y0: number, x1: number, y1: number, x2: number, y2: number): Pen;
}

/** Where the grid sits in the canvas: origin and cell size, in canvas px. */
export type Board = { ox: number; oy: number; c: number; cols: number; rows: number };

/** Logical px per cell. The canvas is `cols x rows` of these and Phaser scales it to its box. */
export const CELL = 20;

const BG = 0x0b0e22;
const DOT = 0x262c5c;

export const centre = (b: Board, p: Point) => ({ x: b.ox + (p.x + 0.5) * b.c, y: b.oy + (p.y + 0.5) * b.c });

/** The arena floor: the classic's deep panel and a dot at each cell's centre. The rim is the host's border. */
export function drawBoard(g: Pen, b: Board) {
  g.fillStyle(BG, 1).fillRect(b.ox, b.oy, b.cols * b.c, b.rows * b.c);
  g.fillStyle(DOT, 1);
  const r = Math.max(1, b.c * 0.06);
  for (let x = 0; x < b.cols; x++) for (let y = 0; y < b.rows; y++) g.fillCircle(b.ox + (x + 0.5) * b.c, b.oy + (y + 0.5) * b.c, r);
}

/** Every apple, breathing: `pulse` is 0..1 and swells the halo a little. */
export function drawApples(g: Pen, b: Board, apples: readonly Point[], pulse: number) {
  const r = b.c * 0.32;
  for (const a of apples) {
    const { x, y } = centre(b, a);
    g.fillStyle(hex(APPLE.glow), 0.18 + 0.1 * pulse).fillCircle(x, y, r * (1.9 + 0.2 * pulse));
    g.fillStyle(hex(APPLE.fill), 1).fillCircle(x, y, r);
    g.fillStyle(0xffffff, 0.5).fillCircle(x - r * 0.35, y - r * 0.3, r * 0.26);
  }
}

/**
 * How opaque segment `i` is: the head full, fading to 60% down a long tail -
 * halved again while `safe`, the visible half of the 3-second safe start
 * (`SAFE_TICKS`, logic.ts): a snake nobody can put out yet is drawn see-through,
 * so the rule is something a player can look at, not just trust.
 */
export const segmentAlpha = (i: number, safe = false) => (safe ? 0.5 : 1) * Math.max(0.6, 1 - i * 0.04);

/**
 * One snake: a soft glow under each segment, then the segment - a rounded
 * square, the head a little bigger - then the eyes, looking the way it goes.
 * `dim` (0..1) fades a whole snake back, for the board under a card. `safe`
 * fades it a fixed amount more, for the round's own safe start.
 */
export function drawSnake(g: Pen, b: Board, id: number, body: readonly Point[], dir: Dir, dim = 0, safe = false, colors: readonly string[] = SNAKE_COLORS) {
  const color = hex(colors[id % colors.length]);
  const k = 1 - 0.6 * dim;
  for (let i = body.length - 1; i >= 0; i--) {
    const x = b.ox + body[i].x * b.c;
    const y = b.oy + body[i].y * b.c;
    const pad = i === 0 ? b.c * 0.05 : b.c * 0.1;
    g.fillStyle(color, (i === 0 ? 0.35 : 0.14) * k * (safe ? 0.5 : 1)).fillRoundedRect(x - b.c * 0.1, y - b.c * 0.1, b.c * 1.2, b.c * 1.2, b.c * 0.4);
    g.fillStyle(color, segmentAlpha(i, safe) * k).fillRoundedRect(x + pad, y + pad, b.c - 2 * pad, b.c - 2 * pad, b.c * 0.3);
  }
  if (body.length) drawEyes(g, b, body[0], dir, k * (safe ? 0.5 : 1));
}

const LOOK: Record<Dir, { fx: number; fy: number }> = {
  up: { fx: 0, fy: -1 },
  down: { fx: 0, fy: 1 },
  left: { fx: -1, fy: 0 },
  right: { fx: 1, fy: 0 },
};

/** Two dark eyes on the head: forward along the heading, apart across it. */
function drawEyes(g: Pen, b: Board, head: Point, dir: Dir, k: number) {
  const { x, y } = centre(b, head);
  const { fx, fy } = LOOK[dir];
  for (const side of [-1, 1]) {
    g.fillStyle(BG, k).fillCircle(x + fx * b.c * 0.14 - fy * side * b.c * 0.16, y + fy * b.c * 0.14 + fx * side * b.c * 0.16, b.c * 0.1);
  }
}

/**
 * The player's snake waiting for its first direction: four arrows round the
 * head, breathing, in its own colour - the classic's hint, not a button.
 */
export function drawAim(g: Pen, b: Board, head: Point, pulse: number, color: string = SNAKE_COLORS[0]) {
  const { x, y } = centre(b, head);
  const reach = b.c * (0.8 + 0.35 * pulse);
  const w = b.c * 0.55;
  g.fillStyle(hex(color), 0.7 + 0.3 * pulse);
  for (const { fx, fy } of Object.values(LOOK)) {
    const tipX = x + fx * (reach + w);
    const tipY = y + fy * (reach + w);
    const bx = x + fx * reach;
    const by = y + fy * reach;
    g.fillTriangle(tipX, tipY, bx - fy * w, by + fx * w, bx + fy * w, by - fx * w);
  }
}

/**
 * The Rocks map's obstacles: a slate block per cell, a lighter top edge so it
 * reads as raised, never the colour of a snake or an apple.
 */
export function drawRocks(g: Pen, b: Board, rocks: readonly Point[]) {
  for (const p of rocks) {
    const x = b.ox + p.x * b.c;
    const y = b.oy + p.y * b.c;
    g.fillStyle(ROCK, 1).fillRoundedRect(x + b.c * 0.06, y + b.c * 0.06, b.c * 0.88, b.c * 0.88, b.c * 0.2);
    g.fillStyle(ROCK_TOP, 1).fillRoundedRect(x + b.c * 0.16, y + b.c * 0.12, b.c * 0.68, b.c * 0.22, b.c * 0.1);
  }
}

const ROCK = 0x5d6383;
const ROCK_TOP = 0x8a90b0;

/** One cell of slime: which snake left it, where, and the scene time it was left. */
export type TrailMark = { id: number; x: number; y: number; at: number };

/** How long a mark of slime takes to fade out, ms (forum review: "fades with time"). */
export const TRAIL_MS = 2000;

/** A mark's opacity `age` ms after it was left: faint, falling to nothing at `TRAIL_MS`. */
export const trailAlpha = (age: number) => Math.max(0, 0.28 * (1 - age / TRAIL_MS));

/**
 * The trail after a step at scene time `now`: every living snake marks the cell
 * its head is on, and marks that have faded are dropped - so the list holds at
 * most two seconds of heads, about 15 a snake at Normal's step.
 */
export function trailAfter(trail: readonly TrailMark[], r: Round, now: number): TrailMark[] {
  const kept = trail.filter((m) => now - m.at < TRAIL_MS);
  for (const s of r.snakes) if (s.alive) kept.push({ id: s.id, x: s.body[0].x, y: s.body[0].y, at: now });
  return kept;
}

/** The slime, under everything that moves: a soft dot per mark in its snake's colour. */
export function drawTrail(g: Pen, b: Board, trail: readonly TrailMark[], now: number, colors: readonly string[]) {
  for (const m of trail) {
    const a = trailAlpha(now - m.at);
    if (a <= 0) continue;
    const { x, y } = centre(b, m);
    g.fillStyle(hex(colors[m.id % colors.length]), a).fillCircle(x, y, b.c * 0.3);
  }
}

/**
 * The whole board for one frame: floor, slime, rocks, apples, snakes. `dim`
 * fades the snakes back while a card covers them; `safe` fades every snake for
 * the round's own safe start.
 */
export function drawRound(g: Pen, b: Board, r: Round, pulse: number, dim = 0, safe = false, colors: readonly string[] = SNAKE_COLORS, trail: readonly TrailMark[] = [], now = 0) {
  drawBoard(g, b);
  drawTrail(g, b, trail, now, colors);
  drawRocks(g, b, r.rocks);
  drawApples(g, b, r.apples, pulse);
  for (const s of r.snakes) if (s.alive) drawSnake(g, b, s.id, s.body, s.dir, dim, safe, colors);
}

/** Where a snake's name sits: centred over its head, just above the cell. */
export function labelAt(b: Board, head: Point): { x: number; y: number } {
  return { x: b.ox + (head.x + 0.5) * b.c, y: b.oy + head.y * b.c - b.c * 0.15 };
}

export type Spark = { x: number; y: number; vx: number; vy: number; life: number; color: number };

/**
 * A ring of sparks from every segment of a snake that has just gone out - in
 * that snake's OWN colour, never white (white on this glass reads as a camera
 * flash, not as the snake coming apart).
 */
export function burstSparks(b: Board, id: number, body: readonly Point[], colors: readonly string[] = SNAKE_COLORS): Spark[] {
  const color = hex(colors[id % colors.length]);
  const out: Spark[] = [];
  body.forEach((p, i) => {
    const { x, y } = centre(b, p);
    const a = (i * 2.4) % (Math.PI * 2);
    for (const turn of [0, Math.PI]) {
      out.push({ x, y, vx: Math.cos(a + turn) * b.c * 3, vy: Math.sin(a + turn) * b.c * 3, life: 1, color });
    }
  });
  return out;
}

/** Advance sparks by `dt` ms; spent ones are dropped. */
export function tickSparks(sparks: Spark[], dt: number): Spark[] {
  const k = dt / 1000;
  return sparks
    .map((s) => ({ ...s, x: s.x + s.vx * k, y: s.y + s.vy * k, life: s.life - k * 2 }))
    .filter((s) => s.life > 0);
}

export function drawSparks(g: Pen, sparks: readonly Spark[], c: number) {
  for (const s of sparks) {
    g.fillStyle(s.color, 0.3 * s.life).fillCircle(s.x, s.y, c * 0.22 * s.life);
    g.fillStyle(s.color, s.life).fillCircle(s.x, s.y, c * 0.08 * s.life + 1);
  }
}
