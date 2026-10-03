// How a CAREER level looks on the arena: each world's floor colour, the desert's
// drifting sand, the gold lying about, and the cave's dark with a light round the
// head and the shapes glowing in it. Drawn through the same `Pen` the rest of the
// arena uses, so the sums test without Phaser; the scene only calls these.
//
// Built to the approved S0 mock (2026-10-03): the desert's sand is a tan patch
// with ripples and an arrow the way it drifts; the cave is black but for the light.

import type { Pen } from "./draw";
import { KIND_INK, type GroundInk } from "./draw";
import type { Coin, SandPatch, SnakeWorldId } from "./careerTypes";
import { KINDS } from "./crowd";
import type { Foe, Run } from "./types";

/** Each world's floor: the garden's green, the desert's brown, the cave's near-black. */
export const WORLD_GROUND: Record<SnakeWorldId, GroundInk> = {
  garden: { ground: 0x0e2318, grid: 0x173826, dots: 0x2b5a3a },
  desert: { ground: 0x3a2a1e, grid: 0x4a3626, dots: 0x5e4630 },
  cave: { ground: 0x100c1c, grid: 0x1a1530, dots: 0x2a2142 },
};

const SAND_EDGE = 0xe3b35f;
const SAND_FILL = 0xf0c27a;
const SAND_RIPPLE = 0xc98a3f;

/** One patch of sand: a soft edge, a lighter middle, three ripples and the arrow it drifts along. */
export function drawSand(g: Pen, p: SandPatch): void {
  g.fillStyle(SAND_EDGE, 0.5);
  g.fillCircle(p.x, p.y, p.r);
  g.fillStyle(SAND_FILL, 0.5);
  g.fillCircle(p.x, p.y, p.r * 0.74);
  g.lineStyle(2.4, SAND_RIPPLE, 0.8);
  for (let j = -1; j <= 1; j++) {
    const y = p.y + j * p.r * 0.28;
    const pts = Array.from({ length: 9 }, (_, i) => ({ x: p.x - p.r * 0.55 + (i * p.r * 1.1) / 8, y: y + Math.sin(i * 1.4) * 3 }));
    g.strokePoints(pts, false);
  }
  const ax = p.x + Math.cos(p.dir) * (p.r + 12);
  const ay = p.y + Math.sin(p.dir) * (p.r + 12);
  const along = (d: number, side: number) => ({ x: ax + Math.cos(p.dir) * d - Math.sin(p.dir) * side, y: ay + Math.sin(p.dir) * d + Math.cos(p.dir) * side });
  g.lineStyle(3, 0xffe1a8, 0.85);
  g.strokePoints([along(-11, 0), along(9, 0)], false);
  g.strokePoints([along(3, -6), along(9, 0), along(3, 6)], false);
}

/** A gold coin on the floor: a ring, a face and a glint. */
export function drawCoin(g: Pen, k: Coin, pulse: number): void {
  const r = 6 + 0.6 * Math.sin(pulse + k.id);
  g.fillStyle(0xffd166, 0.25);
  g.fillCircle(k.x, k.y, r * 2);
  g.fillStyle(0xb7791f, 1);
  g.fillCircle(k.x, k.y, r);
  g.fillStyle(0xffd166, 1);
  g.fillCircle(k.x, k.y, r * 0.78);
  g.fillStyle(0xfff3c4, 1);
  g.fillCircle(k.x - r * 0.3, k.y - r * 0.3, r * 0.26);
}

/** The two calls the dark needs on top of a `Pen`'s. */
export interface DarkPen extends Pen {
  strokeCircle(x: number, y: number, r: number): unknown;
}

const DARK = 0x05030c;

/**
 * THE CAVE'S DARK: everything past `light` from the head under a near-black veil,
 * soft at its edge, and every shape still glowing in its own colour so it can be
 * seen. A thick stroked ring is the veil - one draw, no mask.
 */
export function drawDark(g: DarkPen, head: { x: number; y: number }, light: number, reach: number, foes: readonly Foe[], radiusOf: (f: Foe) => number): void {
  const wide = reach * 2;
  g.lineStyle(wide, DARK, 0.9);
  g.strokeCircle(head.x, head.y, light + wide / 2);
  for (let i = 0; i < 5; i++) {
    const r = light * (0.6 + 0.08 * i);
    g.lineStyle(light * 0.08, DARK, 0.12 + 0.15 * i);
    g.strokeCircle(head.x, head.y, r + light * 0.04);
  }
  for (const f of foes) {
    const r = radiusOf(f);
    g.fillStyle(KIND_INK[f.kind], 0.22);
    g.fillCircle(f.x, f.y, r * 2.4);
    g.fillStyle(KIND_INK[f.kind], 0.3);
    g.fillCircle(f.x, f.y, r * 1.5);
  }
}

/** Graphics the scene hands over: one under everything, the one the gems are on, and one over the floor. */
export interface CareerLayers {
  low: Pen & { clear(): unknown };
  coins: Pen;
  dark: DarkPen & { clear(): unknown };
}

/** Every career layer for this frame - nothing at all on a quick run. */
export function drawCareerLayers(l: CareerLayers, run: Run, pulse: number): void {
  l.low.clear();
  l.dark.clear();
  const c = run.career;
  if (!c) return;
  for (const p of c.sand) drawSand(l.low, p);
  for (const k of c.coins) drawCoin(l.coins, k, pulse);
  if (c.light > 0) drawDark(l.dark, run, c.light, Math.hypot(run.arena.w, run.arena.h), run.foes, (f) => KINDS[f.kind].r);
}
