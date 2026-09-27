// How the snake, the gems and a closing loop are drawn - onto anything with the
// four Graphics calls below, so the sums are testable without Phaser.
//
// The look is the classic Snake's neon (2026-09-26): a glow under a body that
// runs mint to violet from head to tail, and a head whose eyes face where it is
// going. `bodyColor` is borrowed from it so the two games are one family.

import { bodyColor } from "../snake/draw";
import { BODY_R, HEAD_R } from "./body";
import type { Pt, Run } from "./types";

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

/** A gem: a small glowing diamond. */
export function drawGem(g: Pen, x: number, y: number, pulse: number): void {
  const s = 3.2 + 0.5 * Math.sin(pulse);
  g.fillStyle(INK.gem, 0.25);
  g.fillCircle(x, y, s * 2.2);
  g.fillStyle(INK.gem, 1);
  g.fillPoints([{ x, y: y - s }, { x: x + s, y }, { x, y: y + s }, { x: x - s, y }], true);
  g.fillStyle(INK.gemLit, 1);
  g.fillCircle(x - s * 0.3, y - s * 0.3, s * 0.35);
}

/** A loop that just closed: filled mint, outlined white, fading over `life`. */
export function drawLoop(g: Pen, poly: Pt[], age: number, life: number): void {
  const k = Math.max(0, 1 - age / life);
  g.fillStyle(INK.mint, 0.3 * k);
  g.fillPoints(poly, true);
  g.lineStyle(3, 0xffffff, 0.9 * k);
  g.strokePoints(poly, true);
}
