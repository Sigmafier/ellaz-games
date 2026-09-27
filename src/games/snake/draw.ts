// Pure pieces of snake's look, kept out of the Phaser scene so node can test
// them and the scene stays under its size budget. TYPE-ONLY imports: a value
// import from the scene would pull Phaser into anything importing this.
import type { SnakeStatus } from "./SnakeScene";
import type { Dir, Point } from "./logic";

export type OverCard = { score: number; best: number; newBest: boolean; today: boolean };

/**
 * What the game-over card says, or null while there is no card to draw.
 *
 * The best is floored at the score: the stored record is read at mount and a
 * run is only reported at death, so a best that trails the score it sits
 * beside is one missed update away - and a card reading "23, best 12" is the
 * one thing it must never print.
 */
export function overCard(s: SnakeStatus): OverCard | null {
  if (s.phase !== "over") return null;
  return { score: s.score, best: Math.max(s.best, s.score), newBest: s.newBest, today: s.mode === "today" };
}

/**
 * "27 Sep" for a `YYYY-MM-DD` day key, in the player's language, or "" for a
 * key that is not one. Formatted at UTC midnight: the key already IS the local
 * day (`ctx.daily` decided it), and formatting it in the device zone would move
 * it back a day everywhere west of Greenwich.
 */
export function dayLabel(key: string, locale: string): string {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(key)) return "";
  try {
    return new Intl.DateTimeFormat(locale, { day: "numeric", month: "short", timeZone: "UTC" }).format(new Date(`${key}T00:00:00Z`));
  } catch {
    return key;
  }
}

const HEAD = 0x55efc4;
const TAIL = 0x6c5ce7;

/** Body colour at `t` along the snake, 0 = head, 1 = tail. Clamped. */
export function bodyColor(t: number): number {
  const k = Number.isFinite(t) ? Math.min(1, Math.max(0, t)) : 0;
  const mix = (shift: number) => {
    const a = (HEAD >> shift) & 0xff;
    const b = (TAIL >> shift) & 0xff;
    return Math.round(a + (b - a) * k) << shift;
  };
  return mix(16) | mix(8) | mix(0);
}

/** The half of Phaser's Graphics this file draws with. */
export interface Pen {
  fillStyle(color: number, alpha?: number): Pen;
  fillCircle(x: number, y: number, r: number): Pen;
  fillRect(x: number, y: number, w: number, h: number): Pen;
  fillRoundedRect(x: number, y: number, w: number, h: number, r: number): Pen;
  fillEllipse(x: number, y: number, w: number, h: number): Pen;
  lineStyle(width: number, color: number, alpha?: number): Pen;
  strokeRoundedRect(x: number, y: number, w: number, h: number, r: number): Pen;
}

export type Board = { ox: number; oy: number; c: number; cols: number; rows: number };

/** The arena: a deep panel, a violet rim, and a dot at each cell's centre. */
export function drawBoard(g: Pen, b: Board) {
  const w = b.cols * b.c;
  const h = b.rows * b.c;
  g.fillStyle(0x0b0e22, 1).fillRoundedRect(b.ox - 6, b.oy - 6, w + 12, h + 12, 12);
  g.lineStyle(3, 0x6c5ce7, 1).strokeRoundedRect(b.ox - 6, b.oy - 6, w + 12, h + 12, 12);
  g.fillStyle(0x262c5c, 1);
  for (let x = 0; x < b.cols; x++) {
    for (let y = 0; y < b.rows; y++) {
      g.fillCircle(b.ox + (x + 0.5) * b.c, b.oy + (y + 0.5) * b.c, Math.max(1, b.c * 0.06));
    }
  }
}

/** Today's walls: a violet block with a dark core, lit from the rim like the board. */
export function drawWalls(g: Pen, b: Board, walls: readonly number[]) {
  const c = b.c;
  for (const w of walls) {
    const x = b.ox + (w % b.cols) * c;
    const y = b.oy + Math.floor(w / b.cols) * c;
    g.fillStyle(0x6c5ce7, 0.22).fillRoundedRect(x, y, c, c, c * 0.2);
    g.fillStyle(0x6c5ce7, 1).fillRoundedRect(x + c * 0.12, y + c * 0.12, c * 0.76, c * 0.76, c * 0.16);
    g.fillStyle(0x2a2f63, 1).fillRoundedRect(x + c * 0.3, y + c * 0.3, c * 0.4, c * 0.4, c * 0.08);
  }
}

const centre = (b: Board, p: Point) => ({ x: b.ox + (p.x + 0.5) * b.c, y: b.oy + (p.y + 0.5) * b.c });

/**
 * The snake: a soft glow under a mint-to-violet body that tapers to the tail,
 * each segment bridged to the next so it reads as one creature and not a row
 * of tiles. `flash` (0..1) washes it red on death.
 */
export function drawSnake(g: Pen, b: Board, body: Point[], dir: Dir, flash = 0) {
  const n = Math.max(1, body.length - 1);
  const radius = (i: number) => b.c * (0.44 - 0.12 * (i / n));
  // Glow first, all of it, so no segment's glow paints over its neighbour.
  for (let i = body.length - 1; i >= 0; i--) {
    const { x, y } = centre(b, body[i]);
    g.fillStyle(flash > 0 ? 0xff7675 : bodyColor(i / n), 0.18).fillCircle(x, y, radius(i) * 1.7);
  }
  for (let i = body.length - 1; i >= 0; i--) {
    const { x, y } = centre(b, body[i]);
    const r = radius(i);
    const color = flash > 0 && i % 2 === 0 ? 0xff7675 : bodyColor(i / n);
    g.fillStyle(color, 1).fillCircle(x, y, r);
    const next = body[i - 1];
    if (next && Math.abs(next.x - body[i].x) + Math.abs(next.y - body[i].y) === 1) {
      const to = centre(b, next);
      g.fillRect(Math.min(x, to.x) - r, Math.min(y, to.y) - r, Math.abs(to.x - x) + 2 * r, Math.abs(to.y - y) + 2 * r);
    }
  }
  drawEyes(g, b, body[0], dir);
}

const LOOK: Record<Dir, { fx: number; fy: number }> = {
  up: { fx: 0, fy: -1 },
  down: { fx: 0, fy: 1 },
  left: { fx: -1, fy: 0 },
  right: { fx: 1, fy: 0 },
};

/** Two eyes on the head, looking the way the snake is going. */
function drawEyes(g: Pen, b: Board, head: Point, dir: Dir) {
  const { x, y } = centre(b, head);
  const { fx, fy } = LOOK[dir];
  const c = b.c;
  for (const side of [-1, 1]) {
    // Forward along the heading, apart across it.
    const ex = x + fx * c * 0.14 + -fy * side * c * 0.17;
    const ey = y + fy * c * 0.14 + fx * side * c * 0.17;
    g.fillStyle(0xffffff, 1).fillCircle(ex, ey, c * 0.12);
    g.fillStyle(0x0b0e22, 1).fillCircle(ex + fx * c * 0.05, ey + fy * c * 0.05, c * 0.06);
  }
}

/** The apple, breathing: `pulse` is 0..1 and swells it a little. */
export function drawApple(g: Pen, b: Board, at: Point, pulse: number) {
  const { x, y } = centre(b, at);
  const r = b.c * (0.34 + 0.04 * pulse);
  g.fillStyle(0xff7675, 0.22).fillCircle(x, y, r * 1.8);
  g.fillStyle(0xff5e62, 1).fillCircle(x, y + r * 0.08, r);
  g.fillStyle(0xffffff, 0.55).fillCircle(x - r * 0.35, y - r * 0.25, r * 0.26);
  g.fillStyle(0x55efc4, 1).fillEllipse(x + r * 0.35, y - r * 1.0, r * 0.8, r * 0.38);
}

export type Spark = { x: number; y: number; vx: number; vy: number; life: number };

/** A ring of sparks from a point, for the moment an apple is eaten. */
export function burst(x: number, y: number, speed: number, count = 10): Spark[] {
  return Array.from({ length: count }, (_, i) => {
    const a = (i / count) * Math.PI * 2;
    return { x, y, vx: Math.cos(a) * speed, vy: Math.sin(a) * speed, life: 1 };
  });
}

/** Advance sparks by `dt` ms; spent ones are dropped. */
export function tickSparks(sparks: Spark[], dt: number): Spark[] {
  const k = dt / 1000;
  return sparks
    .map((s) => ({ ...s, x: s.x + s.vx * k, y: s.y + s.vy * k, life: s.life - k * 2.2 }))
    .filter((s) => s.life > 0);
}

export function drawSparks(g: Pen, sparks: Spark[], c: number) {
  for (const s of sparks) {
    g.fillStyle(0xffd166, 0.25 * s.life).fillCircle(s.x, s.y, c * 0.2 * s.life);
    g.fillStyle(0xffd166, s.life).fillCircle(s.x, s.y, c * 0.08 * s.life + 1);
  }
}
