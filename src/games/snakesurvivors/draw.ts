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
import { gemReach } from "./merge";
import type { Arena, Kind, Pt, Run } from "./types";

export interface Pen {
  fillStyle(color: number, alpha?: number): unknown;
  fillCircle(x: number, y: number, r: number): unknown;
  fillTriangle(x0: number, y0: number, x1: number, y1: number, x2: number, y2: number): unknown;
  fillPoints(points: Pt[], closePath?: boolean): unknown;
  lineStyle(width: number, color: number, alpha?: number): unknown;
  strokePoints(points: Pt[], closeShape?: boolean): unknown;
}

export const INK = { ground: 0x0b0e22, grid: 0x161b3d, wall: 0x6c5ce7, mint: 0x55efc4, gold: 0xffd166, gem: 0x74b9ff, gemLit: 0xdff1ff, eye: 0xffffff, pupil: 0x0b0e22, red: 0xff7675, ice: 0xa8e6ff, zap: 0x8fd3ff };

/**
 * Each shape's own colour - the bat's violet, the slime's green, the crab's
 * red - for the burst a crush throws off it (round four). An effect is drawn in
 * the thing's own colour, never white on the glass.
 */
export const KIND_INK: Record<Kind, number> = {
  runner: 0x9b7bff,
  orb: 0x7bd88f,
  brute: 0xff6b5b,
  warden: 0xff7675,
  // R4.5: the robot's red, the golem's stone, and the mini-boss's gold.
  dasher: 0xe8493f,
  shooter: 0xa9b0c8,
  mini: 0xffd166,
};

/**
 * The mini-boss's health bar, drawn over its head: `frac` of it lit gold on a
 * dark rail. Pure geometry through the Pen, so it is testable without Phaser.
 */
export function drawHpBar(g: Pen, x: number, y: number, w: number, frac: number): void {
  const f = Math.max(0, Math.min(1, frac));
  const h = 5;
  const rail = [{ x: x - w / 2, y }, { x: x + w / 2, y }, { x: x + w / 2, y: y + h }, { x: x - w / 2, y: y + h }];
  g.fillStyle(0x0b0e22, 0.85);
  g.fillPoints(rail, true);
  if (f > 0) {
    g.fillStyle(INK.gold, 1);
    g.fillPoints([{ x: x - w / 2, y }, { x: x - w / 2 + w * f, y }, { x: x - w / 2 + w * f, y: y + h }, { x: x - w / 2, y: y + h }], true);
  }
  g.lineStyle(1.5, INK.gold, 0.9);
  g.strokePoints(rail, true);
}

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
  if (run.taken.frost) drawFrost(g, run, a);
  if (run.taken.twinHead) drawTailHead(g, run, a);
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

/**
 * A gem: a small glowing diamond in its value's colour. A FUSED gem (Gem Merge,
 * worth 4 or more) is drawn as the yellow one with the diamond itself grown
 * well past its halo's growth, and a second, pulsing halo - one big prize where
 * a handful of small ones lay. A 1 to 3 gem draws exactly as it always did.
 */
export function drawGem(g: Pen, x: number, y: number, pulse: number, v = 1): void {
  const look = GEM_LOOK[Math.max(1, Math.min(3, Math.round(v)))];
  const reach = gemReach(v);
  const s = look.size * (1 + (reach - 1) * 2.5) + 0.5 * Math.sin(pulse);
  const halo = v > 3 ? look.size * look.glow * reach : s * look.glow;
  if (v > 3) {
    g.fillStyle(look.ink, 0.1 + 0.06 * Math.sin(pulse * 0.7));
    g.fillCircle(x, y, halo * 1.3);
  }
  g.fillStyle(look.ink, v > 3 ? 0.2 : 0.25);
  g.fillCircle(x, y, halo);
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
 * The guide ARC (round four): the path from the head to the point the loop will
 * snap shut on - a circular arc that leaves the head along its heading and
 * lands on the point, so it reads as "keep turning this way". `n` points, head
 * first. A point dead ahead (or behind) gets a straight line.
 *
 * BOUNDED (NePo, forum post #13: "the loop guide is sometimes huge"): the
 * tangent circle's radius is d^2 / (2 * side), so a point almost straight
 * BEHIND the head asked for a circle 718 units across at (-60,-5) and 3578 at
 * (-60,-1), well inside the 84-unit snap reach. Every point of the guide now
 * stays within d of the head AND of the snap point. For a point beside or
 * ahead of the head the tangent arc already does - its sweep is at most a half
 * turn, so its furthest point from the head IS the snap point - and is kept
 * exactly. For a point behind, the guide is instead the half circle on the
 * head-to-point chord, bulging to the side the heading turns: the same circle
 * the tangent arc becomes at exactly 90 degrees, so nothing jumps as a point
 * crosses from beside to behind.
 */
export function guideArc(head: Pt, heading: number, at: Pt, n = 16): Pt[] {
  const fx = Math.cos(heading);
  const fy = Math.sin(heading);
  const dx = at.x - head.x;
  const dy = at.y - head.y;
  const d2 = dx * dx + dy * dy;
  // The signed distance of the target off the heading line: the arc's bend.
  const side = -fy * dx + fx * dy;
  if (d2 === 0) return [{ x: head.x, y: head.y }];
  if (Math.abs(side) < 1e-6) return Array.from({ length: n }, (_, i) => ({ x: head.x + (dx * i) / (n - 1), y: head.y + (dy * i) / (n - 1) }));
  if (fx * dx + fy * dy < 0) {
    // Behind the head: the half circle on the chord, centred on its midpoint,
    // walked a half turn the way the heading turns (`side`'s sign).
    const mx = head.x + dx / 2;
    const my = head.y + dy / 2;
    const h0 = Math.atan2(head.y - my, head.x - mx);
    const half = side > 0 ? Math.PI : -Math.PI;
    const hr = Math.sqrt(d2) / 2;
    return Array.from({ length: n }, (_, i) => {
      const a = h0 + (half * i) / (n - 1);
      return { x: mx + Math.cos(a) * hr, y: my + Math.sin(a) * hr };
    });
  }
  // A circle tangent to the heading at the head and through `at`: radius d^2 / (2 * side).
  const r = d2 / (2 * side);
  const cx = head.x - fy * r;
  const cy = head.y + fx * r;
  const a0 = Math.atan2(head.y - cy, head.x - cx);
  let a1 = Math.atan2(at.y - cy, at.x - cx);
  // Walk the way the heading turns: counter-clockwise in screen space when r > 0.
  const dir = r > 0 ? 1 : -1;
  let sweep = a1 - a0;
  while (dir * sweep <= 0) sweep += dir * 2 * Math.PI;
  if (Math.abs(sweep) > 2 * Math.PI) sweep -= dir * 2 * Math.PI;
  a1 = a0 + sweep;
  const R = Math.abs(r);
  return Array.from({ length: n }, (_, i) => {
    const a = a0 + (sweep * i) / (n - 1);
    return { x: cx + Math.cos(a) * R, y: cy + Math.sin(a) * R };
  });
}

/**
 * THE GUIDE (round four, replacing round three's thin dashed line and small
 * ring): a thick glowing arc from the head to the snap point, and a big
 * pulsing ring on the point. Drawn while `pendingLoop` finds a loop.
 */
export function drawSnapGuide(g: Pen, head: Pt, heading: number, at: Pt, pulse: number): void {
  const arc = guideArc(head, heading, at);
  g.lineStyle(12, INK.mint, 0.16);
  g.strokePoints(arc, false);
  g.lineStyle(5, INK.mint, 0.85);
  for (let i = 0; i + 1 < arc.length; i += 2) g.strokePoints([arc[i], arc[i + 1]], false);
  const k = 0.5 + 0.5 * Math.sin(pulse);
  g.lineStyle(10, INK.mint, 0.18);
  g.strokePoints(ring(at, 18 + 4 * k, 24), true);
  g.lineStyle(3.5, INK.mint, 0.95);
  g.strokePoints(ring(at, 14 + 3 * k, 24), true);
}

/** Round four's "N inside": a mint glow ring under a shape the loop would catch now. */
export function drawInsideMark(g: Pen, x: number, y: number, r: number, pulse: number, ink: number = INK.mint): void {
  const k = 0.5 + 0.5 * Math.sin(pulse);
  g.fillStyle(ink, 0.16 + 0.08 * k);
  g.fillCircle(x, y, r + 9);
  g.lineStyle(2.5, ink, 0.9);
  g.strokePoints(ring({ x, y }, r + 7 + 1.5 * k, 20), true);
}

/** A shooter's bolt: an orange-red ember with a hot core and a trail - a thing to dodge. */
export function drawBolt(g: Pen, s: { x: number; y: number; vx: number; vy: number }): void {
  const d = Math.hypot(s.vx, s.vy) || 1;
  g.fillStyle(0xff7a3d, 0.3);
  g.fillCircle(s.x - (s.vx / d) * 9, s.y - (s.vy / d) * 9, 5);
  g.fillStyle(0xff7a3d, 0.45);
  g.fillCircle(s.x, s.y, 9);
  g.fillStyle(0xffd166, 1);
  g.fillCircle(s.x, s.y, 5);
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

/** The two colours a channel-wise blend runs between, `k` 0 = a, 1 = b. */
export function mixInk(a: number, b: number, k: number): number {
  const t = Math.max(0, Math.min(1, k));
  const ch = (sh: number) => Math.round(((a >> sh) & 255) + (((b >> sh) & 255) - ((a >> sh) & 255)) * t);
  return (ch(16) << 16) | (ch(8) << 8) | ch(0);
}

/**
 * A loop that just CRUSHED (round four: "a crush HITS"): it fills WHITE for
 * `flashMs`, then fades to mint and out over `life`; the rim stays white.
 */
export function drawLoop(g: Pen, poly: Pt[], age: number, life: number, flashMs = 0): void {
  const k = Math.max(0, 1 - age / life);
  const hot = flashMs > 0 ? Math.max(0, 1 - age / flashMs) : 0;
  g.fillStyle(mixInk(INK.mint, 0xffffff, hot), (0.3 + 0.45 * hot) * k);
  g.fillPoints(poly, true);
  g.lineStyle(3 + 3 * hot, 0xffffff, 0.9 * k);
  g.strokePoints(poly, true);
}

/** The shockwave: a white ring, then mint, travelling out past the loop and fading. */
export function drawShockRing(g: Pen, c: Pt, r: number, k: number): void {
  g.lineStyle(10 * (1 - k) + 2, 0xffffff, 0.35 * (1 - k));
  g.strokePoints(ring(c, r, 40), true);
  g.lineStyle(3, mixInk(0xffffff, INK.mint, k), 0.9 * (1 - k));
  g.strokePoints(ring(c, r, 40), true);
}

/** Black Hole: three rings turning inward, violet, shrinking as the vortex closes. */
export function drawVortex(g: Pen, c: Pt, t: number, left: number, total: number): void {
  const k = Math.max(0, Math.min(1, left / total));
  g.fillStyle(0x1a1040, 0.55 * k);
  g.fillCircle(c.x, c.y, 26 * k + 8);
  for (let i = 0; i < 3; i++) {
    const r = (18 + i * 16) * (0.6 + 0.4 * k);
    const spin = t / (260 + i * 90) + i * 2.1;
    const arc = Array.from({ length: 10 }, (_, j) => {
      const a = spin + (j / 9) * Math.PI * 1.3;
      return { x: c.x + Math.cos(a) * r, y: c.y + Math.sin(a) * r };
    });
    g.lineStyle(3 - i * 0.6, i === 0 ? 0xd6c8ff : 0x9b7bff, 0.85 * k);
    g.strokePoints(arc, false);
  }
}

/** Chain Crush's zap: a jagged blue bolt, re-jagged by `seed` each frame so it crackles. */
export function zapPoints(a: Pt, b: Pt, seed: number, n = 7): Pt[] {
  const rnd = mulberry32(seed >>> 0);
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const d = Math.hypot(dx, dy) || 1;
  return Array.from({ length: n }, (_, i) => {
    const t = i / (n - 1);
    const off = i === 0 || i === n - 1 ? 0 : (rnd() - 0.5) * Math.min(26, d * 0.25);
    return { x: a.x + dx * t - (dy / d) * off, y: a.y + dy * t + (dx / d) * off };
  });
}

export function drawZap(g: Pen, a: Pt, b: Pt, seed: number, k: number): void {
  const pts = zapPoints(a, b, seed);
  g.lineStyle(7, INK.zap, 0.25 * k);
  g.strokePoints(pts, false);
  g.lineStyle(2.5, 0xffffff, 0.95 * k);
  g.strokePoints(pts, false);
}

/** Nova: a gold ring racing out across the view, and a pale fill behind it. */
export function drawNova(g: Pen, c: Pt, r: number, k: number): void {
  g.fillStyle(INK.gold, 0.12 * (1 - k));
  g.fillCircle(c.x, c.y, r);
  g.lineStyle(14 * (1 - k) + 3, INK.gold, 0.8 * (1 - k));
  g.strokePoints(ring(c, r, 48), true);
}

/**
 * Twin Head: the tail end wears a second, smaller head - violet, the tail's
 * own colour - with eyes facing away from the body.
 */
export function drawTailHead(g: Pen, run: Run, a: number): void {
  const n = run.path.length;
  if (n < 2) return;
  const t = run.path[n - 1];
  const q = run.path[n - 2];
  const heading = Math.atan2(t.y - q.y, t.x - q.x);
  g.fillStyle(INK.wall, 0.25 * a);
  g.fillCircle(t.x, t.y, HEAD_R * 1.6);
  g.fillStyle(bodyColor(1), a);
  g.fillCircle(t.x, t.y, HEAD_R * 0.85);
  for (const e of eyesOf(t.x, t.y, heading)) {
    g.fillStyle(INK.eye, a);
    g.fillCircle(e.x, e.y, 2.2);
    g.fillStyle(INK.pupil, a);
    g.fillCircle(e.x + Math.cos(heading), e.y + Math.sin(heading), 1.1);
  }
}

/** Frost Trail: icy flecks along the back half of the body. */
function drawFrost(g: Pen, run: Run, a: number): void {
  const n = run.path.length;
  g.fillStyle(INK.ice, 0.75 * a);
  for (let i = Math.floor(n / 3); i < n; i += 4) {
    const p = run.path[i];
    g.fillCircle(p.x, p.y, bodyRadius(i / n) * 0.55);
  }
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
