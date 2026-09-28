// How the snake, the gems and a closing loop are drawn - onto anything with the
// four Graphics calls below, so the sums are testable without Phaser.
//
// The look is the classic Snake's neon (2026-09-26): a glow under a body that
// runs mint to violet from head to tail, and a head whose eyes face where it is
// going. `bodyColor` is borrowed from it so the two games are one family.

import { mulberry32 } from "@shared/rng";
import { bodyColor } from "../snake/draw";
import { WALL } from "../survivors/world";
import { BODY_R, HEAD_R } from "./body";
import type { Arena, Pt, Run } from "./types";

export interface Pen {
  fillStyle(color: number, alpha?: number): unknown;
  fillCircle(x: number, y: number, r: number): unknown;
  fillTriangle(x0: number, y0: number, x1: number, y1: number, x2: number, y2: number): unknown;
  fillPoints(points: Pt[], closePath?: boolean): unknown;
  lineStyle(width: number, color: number, alpha?: number): unknown;
  strokePoints(points: Pt[], closeShape?: boolean): unknown;
}

export const INK = { ground: 0x0b0e22, grid: 0x161b3d, wall: 0x6c5ce7, mint: 0x55efc4, gold: 0xffd166, gem: 0x74b9ff, gemLit: 0xdff1ff, eye: 0xffffff, pupil: 0x0b0e22, red: 0xff7675 };

/** The body's radius at a point, `t` 0 at the head to 1 at the tail. */
export const bodyRadius = (t: number) => BODY_R * (1.15 - 0.45 * Math.min(1, Math.max(0, t)));

/** Where the two eyes sit, facing the heading. */
export function eyesOf(x: number, y: number, heading: number): Pt[] {
  const fx = Math.cos(heading);
  const fy = Math.sin(heading);
  return [-1, 1].map((s) => ({ x: x + fx * 3 - fy * 4.2 * s, y: y + fy * 3 + fx * 4.2 * s }));
}

/**
 * The whole snake. `blink` fades it while the safety window is open, so a player
 * can see why the next shape went through them.
 */
export function drawSnake(g: Pen, run: Run, blink: boolean): void {
  const a = blink ? 0.35 : 1;
  const n = run.path.length;
  // Glow first, all of it, so no segment's glow lands on a segment in front.
  for (let i = n - 1; i >= 0; i -= 3) {
    g.fillStyle(bodyColor(i / n), 0.14 * a);
    g.fillCircle(run.path[i].x, run.path[i].y, bodyRadius(i / n) * 2);
  }
  for (let i = n - 1; i >= 0; i--) {
    g.fillStyle(bodyColor(i / n), a);
    g.fillCircle(run.path[i].x, run.path[i].y, bodyRadius(i / n));
  }
  if (run.taken.spikes) drawSpikes(g, run, a);
  g.fillStyle(INK.mint, 0.22 * a);
  g.fillCircle(run.x, run.y, HEAD_R * 1.9);
  g.fillStyle(INK.mint, a);
  g.fillCircle(run.x, run.y, HEAD_R);
  if (run.taken.fangs) drawFangs(g, run, a);
  for (const e of eyesOf(run.x, run.y, run.heading)) {
    g.fillStyle(INK.eye, a);
    g.fillCircle(e.x, e.y, 2.6);
    g.fillStyle(INK.pupil, a);
    g.fillCircle(e.x + Math.cos(run.heading), e.y + Math.sin(run.heading), 1.3);
  }
}

/** The spiked tail: gold spikes standing out from the body on both sides. */
function drawSpikes(g: Pen, run: Run, a: number): void {
  const len = 3 + 1.5 * run.taken.spikes;
  g.fillStyle(INK.gold, a);
  for (let i = 6; i < run.path.length - 1; i += 5) {
    const p = run.path[i];
    const q = run.path[i + 1];
    const d = Math.hypot(p.x - q.x, p.y - q.y) || 1;
    const nx = -(p.y - q.y) / d;
    const ny = (p.x - q.x) / d;
    const r = bodyRadius(i / run.path.length);
    for (const s of [-1, 1]) {
      const bx = p.x + nx * r * s;
      const by = p.y + ny * r * s;
      g.fillTriangle(bx - (p.x - q.x) * 0.5, by - (p.y - q.y) * 0.5, bx + (p.x - q.x) * 0.5, by + (p.y - q.y) * 0.5, bx + nx * len * s, by + ny * len * s);
    }
  }
}

/** The fangs: two gold teeth in front of the head, longer per level. */
function drawFangs(g: Pen, run: Run, a: number): void {
  const fx = Math.cos(run.heading);
  const fy = Math.sin(run.heading);
  const reach = HEAD_R + 2 + 1.5 * run.taken.fangs;
  g.fillStyle(INK.gold, a);
  for (const s of [-1, 1]) {
    const bx = run.x + fx * (HEAD_R - 2) - fy * 3.5 * s;
    const by = run.y + fy * (HEAD_R - 2) + fx * 3.5 * s;
    g.fillTriangle(bx - fy * 1.8, by + fx * 1.8, bx + fy * 1.8, by - fx * 1.8, run.x + fx * reach - fy * 2.5 * s, run.y + fy * reach + fx * 2.5 * s);
  }
}

/**
 * How a gem of each value looks (NePo's colours): blue +1, red +2, yellow +3.
 * `size` is the diamond's half-width and `glow` the halo's radius as a multiple
 * of it - both grow with the value, so a richer gem reads richer at a glance.
 */
export const GEM_LOOK: Record<number, { ink: number; size: number; glow: number }> = {
  1: { ink: INK.gem, size: 3.2, glow: 2.2 },
  2: { ink: INK.red, size: 3.8, glow: 2.7 },
  3: { ink: INK.gold, size: 4.4, glow: 3.2 },
};

/** A gem: a small glowing diamond in its value's colour. */
export function drawGem(g: Pen, x: number, y: number, pulse: number, v = 1): void {
  const look = GEM_LOOK[Math.max(1, Math.min(3, Math.round(v)))];
  const s = look.size + 0.5 * Math.sin(pulse);
  g.fillStyle(look.ink, 0.25);
  g.fillCircle(x, y, s * look.glow);
  g.fillStyle(look.ink, 1);
  g.fillPoints([{ x, y: y - s }, { x: x + s, y }, { x, y: y + s }, { x: x - s, y }], true);
  g.fillStyle(INK.gemLit, 1);
  g.fillCircle(x - s * 0.3, y - s * 0.3, s * 0.35);
}

/** The dashes of a straight line from `a` to `b`, `dash` long with `gap` between. */
export function dashes(a: Pt, b: Pt, dash = 6, gap = 5): [Pt, Pt][] {
  const d = Math.hypot(b.x - a.x, b.y - a.y);
  if (d === 0) return [];
  const ux = (b.x - a.x) / d;
  const uy = (b.y - a.y) / d;
  const out: [Pt, Pt][] = [];
  for (let t = 0; t < d; t += dash + gap) {
    const e = Math.min(d, t + dash);
    out.push([{ x: a.x + ux * t, y: a.y + uy * t }, { x: a.x + ux * e, y: a.y + uy * e }]);
  }
  return out;
}

const ring = (c: Pt, r: number, n = 18): Pt[] =>
  Array.from({ length: n }, (_, i) => ({ x: c.x + Math.cos((i / n) * 2 * Math.PI) * r, y: c.y + Math.sin((i / n) * 2 * Math.PI) * r }));

/**
 * THE SNAP GUIDE (round three): a dashed mint line from the head to the body
 * point the loop is about to snap shut on, and a small ring on that point - the
 * mock the operator ACKed. Drawn while `snapHint` finds one.
 */
export function drawSnapGuide(g: Pen, head: Pt, at: Pt, pulse: number): void {
  g.lineStyle(3, INK.mint, 0.85);
  for (const [a, b] of dashes(head, at)) g.strokePoints([a, b], false);
  g.lineStyle(2.5, INK.mint, 0.9);
  g.strokePoints(ring(at, 8 + 1.5 * Math.sin(pulse)), true);
}

/** A Spit shot: a small gold drop with a faint trail. */
export function drawShot(g: Pen, s: { x: number; y: number; vx: number; vy: number }): void {
  const d = Math.hypot(s.vx, s.vy) || 1;
  g.fillStyle(INK.gold, 0.35);
  g.fillCircle(s.x - (s.vx / d) * 6, s.y - (s.vy / d) * 6, 3);
  g.fillStyle(INK.gold, 1);
  g.fillCircle(s.x, s.y, 3.6);
}

/** The Shield, while it is ready: a thin blue ring round the head. */
export function drawShieldRing(g: Pen, head: Pt, pulse: number): void {
  g.lineStyle(2, INK.gem, 0.55 + 0.25 * Math.sin(pulse));
  g.strokePoints(ring(head, 15, 22), true);
}

/**
 * The warden WINDING UP: a red dashed line from it to the head and a ring
 * closing in on it as the lunge comes - the warning that was missing when the
 * reviewer was bitten at length 60 and read it as biting his own tail.
 */
export function drawWindup(g: Pen, from: Pt, to: Pt, left: number, total: number): void {
  const k = 1 - Math.max(0, Math.min(1, left / total));
  g.lineStyle(3, INK.red, 0.45 + 0.45 * k);
  for (const [a, b] of dashes(from, to, 8, 6)) g.strokePoints([a, b], false);
  g.lineStyle(3, INK.red, 0.9);
  g.strokePoints(ring(from, 44 - 16 * k, 24), true);
}

/** A loop that just closed: filled mint, outlined white, fading over `life`. */
export function drawLoop(g: Pen, poly: Pt[], age: number, life: number): void {
  const k = Math.max(0, 1 - age / life);
  g.fillStyle(INK.mint, 0.3 * k);
  g.fillPoints(poly, true);
  g.lineStyle(3, 0xffffff, 0.9 * k);
  g.strokePoints(poly, true);
}

/** Dots on the tutorial's ring, and how fast they march round it (radians/s). */
const RING_DOTS = 22;
const RING_SPIN = 0.9;

/**
 * Tutorial step 1: a dotted ring round the bat - the path to drive. The dots
 * march clockwise, the way a loop is easiest to close from the start, so the
 * ring reads as a route and not as a target.
 */
export function drawGuideRing(g: Pen, ring: { x: number; y: number; r: number }, ms: number): void {
  const turn = (ms / 1000) * RING_SPIN;
  for (let i = 0; i < RING_DOTS; i++) {
    const a = turn + (i / RING_DOTS) * 2 * Math.PI;
    const lead = i % 2 === 0;
    g.fillStyle(lead ? INK.mint : 0xffffff, lead ? 1 : 0.7);
    g.fillCircle(ring.x + Math.cos(a) * ring.r, ring.y + Math.sin(a) * ring.r, lead ? 3.2 : 2.2);
  }
}

/** Where tutorial step 2's arrowhead sits: just past the head, on the line to the gem. */
export function arrowPoints(head: Pt, to: Pt): { tip: Pt; left: Pt; right: Pt } | null {
  const dx = to.x - head.x;
  const dy = to.y - head.y;
  const d = Math.hypot(dx, dy);
  if (d < HEAD_R * 3) return null; // on top of it already: nothing to point at
  const ux = dx / d;
  const uy = dy / d;
  const base = HEAD_R + 12;
  const tip = { x: head.x + ux * (base + 12), y: head.y + uy * (base + 12) };
  return {
    tip,
    left: { x: head.x + ux * base - uy * 7, y: head.y + uy * base + ux * 7 },
    right: { x: head.x + ux * base + uy * 7, y: head.y + uy * base - ux * 7 },
  };
}

/** Tutorial step 2: an arrow from the head toward the gem, and a pulsing ring on the gem. */
export function drawGemArrow(g: Pen, head: Pt, to: Pt, ms: number): void {
  const pulse = 0.5 + 0.5 * Math.sin(ms / 160);
  const arrow = arrowPoints(head, to);
  if (arrow) {
    g.fillStyle(INK.gold, 0.75 + 0.25 * pulse);
    g.fillTriangle(arrow.tip.x, arrow.tip.y, arrow.left.x, arrow.left.y, arrow.right.x, arrow.right.y);
  }
  const r = 10 + 4 * pulse;
  const rim = Array.from({ length: 16 }, (_, i) => ({ x: to.x + Math.cos((i / 16) * 2 * Math.PI) * r, y: to.y + Math.sin((i / 16) * 2 * Math.PI) * r }));
  g.lineStyle(2, INK.gold, 0.85);
  g.strokePoints(rim, true);
}

/** The two calls the floor needs on top of a `Pen`'s. */
export interface GroundPen extends Pen {
  fillRect(x: number, y: number, w: number, h: number): unknown;
  lineBetween(x1: number, y1: number, x2: number, y2: number): unknown;
}

/** The floor: a faint grid, scattered dots, and striped walls at the world's edge. */
export function drawGround(g: GroundPen, world: Arena): void {
  const { w, h } = world;
  g.fillStyle(INK.ground, 1);
  g.fillRect(0, 0, w, h);
  g.lineStyle(1, INK.grid, 1);
  for (let x = 40; x < w; x += 40) g.lineBetween(x, 0, x, h);
  for (let y = 40; y < h; y += 40) g.lineBetween(0, y, w, y);
  const rnd = mulberry32(20260927);
  g.fillStyle(0x2a3170, 1);
  for (let i = 0; i < (w * h) / 6000; i++) g.fillCircle(rnd() * w, rnd() * h, 1.3);
  g.fillStyle(INK.wall, 0.55);
  for (const [x, y, rw, rh] of [[0, 0, w, WALL], [0, h - WALL, w, WALL], [0, 0, WALL, h], [w - WALL, 0, WALL, h]]) g.fillRect(x, y, rw, rh);
}
