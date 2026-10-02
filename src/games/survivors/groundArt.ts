// HOW EACH CAREER WORLD LOOKS IN THE ARENA (P3, drawn to the approved p0 pictures:
// scratchpad career-p0 views city, frost, lava).
//
//   NEON CITY  a dark floor with a glowing neon grid, a skyline along the top wall
//              and a pink-cyan glow at the others; patches of darkness drift over
//              it, and a shape inside one is two yellow eyes.
//   FROST      an ice-blue floor with sheen streaks, cracks and snow drifts, ice
//              peaks along the top, pale walls; snow falls over everything.
//   LAVA       dark basalt split by glowing cracks, a lava river along the top;
//              embers rise, and pools open with a dashed warning ring first.
//
// NO PHASER AT RUNTIME. Everything draws through `Pen`, the handful of Graphics
// calls it uses, so the scene passes its own Graphics and a test passes a recorder
// - `ground-art.test.ts` reads back what each world drew. SurvivorsScene.ts is
// past 1,600 lines and only CALLS these; nothing here is in it.
//
// DETERMINISTIC. The floor is seeded by the level, so a level looks the same every
// time it is played and a landmark can be learned; weather is a function of the
// clock, never of Math.random.

import { mulberry32 } from "@shared/rng";
import type { EnemyKind, Gem, Pool, RunState, WorldId } from "./types";
import { drawProps } from "./groundProps";
import { POOL } from "./twists";
import { WALL } from "./world";

/** The Graphics calls this file makes - Phaser's Graphics satisfies it, and so does a test's recorder. */
export interface Pen {
  fillStyle(color: number, alpha?: number): unknown;
  lineStyle(width: number, color: number, alpha?: number): unknown;
  fillRect(x: number, y: number, w: number, h: number): unknown;
  fillCircle(x: number, y: number, r: number): unknown;
  fillEllipse(x: number, y: number, w: number, h: number): unknown;
  fillTriangle(x0: number, y0: number, x1: number, y1: number, x2: number, y2: number): unknown;
  lineBetween(x0: number, y0: number, x1: number, y1: number): unknown;
  strokeCircle(x: number, y: number, r: number): unknown;
  fillGradientStyle(tl: number, tr: number, bl: number, br: number, alpha?: number): unknown;
}

/** Each world's floor inks, from the p0 mock's own palette (p0.html, `const P`). */
export const WORLD_INK = {
  city: { ground: 0x0b0d1f, ground2: 0x0e1030, grid: 0x1c2046, neonA: 0x3de8ff, neonB: 0xff4dd2, wall: 0x1a1d38, stripe: 0xffb020, edge: 0xffd166 },
  frost: { ground: 0x1d5a8c, ground2: 0x16446e, grid: 0x3f82b8, neonA: 0xd6f0ff, neonB: 0xe8f6ff, wall: 0xdff3ff, stripe: 0x74b9ff, edge: 0xffffff },
  lava: { ground: 0x1c1412, ground2: 0x140d0c, grid: 0x2a1c19, neonA: 0xff5a00, neonB: 0xff8a1c, wall: 0x2a1210, stripe: 0xff7b00, edge: 0xffb347 },
} as const satisfies Record<WorldId, Record<string, number>>;

/**
 * Each world's tint on its shapes (MULTIPLY): the city keeps the cast's own neon,
 * frost turns it icy, lava turns it ember. The two shooters keep their own ink in
 * every world - a spitter must never read as the orb it is dressed as.
 */
export const WORLD_TINT: Record<WorldId, number | null> = { city: null, frost: 0xa8e4ff, lava: 0xffb07a };

export const tintFor = (world: WorldId, kind: EnemyKind): number | null =>
  kind === "spitter" || kind === "lancer" ? null : WORLD_TINT[world];

const PITCH = 42;
/** How tall the top-wall scenery band is: the skyline, the peaks, the lava river. */
export const TOP_BAND = 64;

function grid(g: Pen, w: number, h: number, ink: number, alpha: number) {
  g.lineStyle(1, ink, alpha);
  for (let x = PITCH; x < w; x += PITCH) g.lineBetween(x, 0, x, h);
  for (let y = PITCH; y < h; y += PITCH) g.lineBetween(0, y, w, y);
}

function walls(g: Pen, w: number, h: number, ink: { wall: number; stripe: number; edge: number }) {
  g.fillStyle(ink.wall, 1);
  g.fillRect(0, 0, w, WALL);
  g.fillRect(0, h - WALL, w, WALL);
  g.fillRect(0, 0, WALL, h);
  g.fillRect(w - WALL, 0, WALL, h);
  g.fillStyle(ink.stripe, 0.9);
  for (let x = 0; x < w; x += 16) {
    g.fillRect(x, 0, 8, WALL);
    g.fillRect(x, h - WALL, 8, WALL);
  }
  for (let y = 0; y < h; y += 16) {
    g.fillRect(0, y, WALL, 8);
    g.fillRect(w - WALL, y, WALL, 8);
  }
  g.lineStyle(2, ink.edge, 0.9);
  g.lineBetween(WALL, WALL, w - WALL, WALL);
  g.lineBetween(WALL, h - WALL, w - WALL, h - WALL);
  g.lineBetween(WALL, WALL, WALL, h - WALL);
  g.lineBetween(w - WALL, WALL, w - WALL, h - WALL);
}

/** A soft glow hugging every wall: stacked translucent bands, brightest at the wall. */
function wallGlow(g: Pen, w: number, h: number, a: number, b: number) {
  for (let i = 0; i < 5; i++) {
    const d = WALL + i * 10;
    g.fillStyle(i % 2 ? a : b, 0.09 - i * 0.015);
    g.fillRect(d, h - d - 10, w - 2 * d, 10);
    g.fillRect(d, d, 10, h - 2 * d);
    g.fillRect(w - d - 10, d, 10, h - 2 * d);
  }
}

function cityFloor(g: Pen, w: number, h: number, r: () => number) {
  const k = WORLD_INK.city;
  g.fillGradientStyle(k.ground2, k.ground2, k.ground, k.ground, 1);
  g.fillRect(0, 0, w, h);
  grid(g, w, h, k.grid, 1);
  // Every fourth line glows: a wide faint stroke under a thin bright one.
  for (let x = PITCH, i = 0; x < w; x += PITCH, i++) {
    if (i % 4 !== 1) continue;
    const ink = i % 8 === 1 ? k.neonA : k.neonB;
    g.lineStyle(6, ink, 0.1);
    g.lineBetween(x, 0, x, h);
    g.lineStyle(2, ink, 0.5);
    g.lineBetween(x, 0, x, h);
  }
  for (let y = PITCH, i = 0; y < h; y += PITCH, i++) {
    if (i % 3 !== 2) continue;
    const ink = i % 6 === 2 ? k.neonB : k.neonA;
    g.lineStyle(6, ink, 0.09);
    g.lineBetween(0, y, w, y);
    g.lineStyle(2, ink, 0.45);
    g.lineBetween(0, y, w, y);
  }
  for (let i = 0; i < (w * h) / 5200; i++) {
    const x = r() * w;
    const y = TOP_BAND + r() * (h - TOP_BAND);
    const q = r();
    if (q < 0.3) {
      g.fillStyle(0x6a5cff, 0.45);
      g.fillTriangle(x, y - 7, x + 4, y, x, y + 7);
      g.fillTriangle(x, y - 7, x - 4, y, x, y + 7);
    } else if (q < 0.6) {
      g.fillStyle(0x262b52, 1);
      g.fillRect(x, y, 10, 7);
      g.fillRect(x + 6, y - 4, 8, 6);
    }
  }
  // The skyline along the top wall, lit windows in it, a pink glow behind.
  g.fillStyle(0x0a0620, 1);
  g.fillRect(0, 0, w, TOP_BAND);
  g.fillStyle(k.neonB, 0.22);
  g.fillRect(0, TOP_BAND - 34, w, 34);
  for (let x = -4, i = 0; x < w; x += 37, i++) {
    const bh = 20 + ((i * 37) % 32);
    g.fillStyle(0x070516, 1);
    g.fillRect(x, TOP_BAND - bh, 34, bh);
    for (let wy = TOP_BAND - bh + 6; wy < TOP_BAND - 5; wy += 9) {
      for (let wx = x + 5; wx < x + 28; wx += 9) {
        if ((wx * 7 + wy * 3 + i) % 5 >= 2) continue;
        g.fillStyle((i + wy) % 3 ? 0xffd166 : k.neonA, 0.85);
        g.fillRect(wx, wy, 4, 4);
      }
    }
  }
  wallGlow(g, w, h, k.neonA, k.neonB);
}

function frostFloor(g: Pen, w: number, h: number, r: () => number) {
  const k = WORLD_INK.frost;
  g.fillGradientStyle(k.ground, k.ground, k.ground2, k.ground2, 1);
  g.fillRect(0, 0, w, h);
  grid(g, w, h, k.grid, 0.55);
  // Sheen: long diagonal streaks of light across the ice.
  for (let i = 0; i < w / 180; i++) {
    const x = r() * w;
    g.fillStyle(0xffffff, 0.05);
    g.fillTriangle(x, TOP_BAND, x + 70, TOP_BAND, x - 260, h);
    g.fillTriangle(x + 70, TOP_BAND, x - 190, h, x - 260, h);
  }
  g.lineStyle(1.4, k.neonA, 0.45);
  for (let i = 0; i < (w * h) / 9000; i++) {
    const x = r() * w;
    const y = TOP_BAND + r() * (h - TOP_BAND);
    const x1 = x + 8 + r() * 8;
    const y1 = y - 4 + r() * 8;
    g.lineBetween(x, y, x1, y1);
    g.lineBetween(x1, y1, x1 + 6 + r() * 6, y1 - 6 + r() * 12);
  }
  for (let i = 0; i < (w * h) / 7000; i++) {
    g.fillStyle(k.neonB, 0.2);
    g.fillEllipse(r() * w, TOP_BAND + r() * (h - TOP_BAND), 14 + r() * 16, 6 + r() * 6);
  }
  // Ice peaks along the top wall.
  g.fillStyle(0xa9dcff, 1);
  g.fillRect(0, 0, w, TOP_BAND);
  for (let x = -20, i = 0; x < w + 70; x += 56, i++) {
    const ph = 26 + (i % 3) * 12;
    g.fillStyle(i % 2 ? 0x6fa8dc : 0x8ec3ee, 1);
    g.fillTriangle(x - 35, TOP_BAND, x, TOP_BAND - ph, x + 35, TOP_BAND);
    g.fillStyle(0xffffff, 1);
    g.fillTriangle(x - 9, TOP_BAND - ph + 12, x, TOP_BAND - ph, x + 9, TOP_BAND - ph + 12);
  }
  wallGlow(g, w, h, 0xffffff, 0xbfe6ff);
}

function lavaFloor(g: Pen, w: number, h: number, r: () => number) {
  const k = WORLD_INK.lava;
  g.fillGradientStyle(k.ground, k.ground, k.ground2, k.ground2, 1);
  g.fillRect(0, 0, w, h);
  grid(g, w, h, k.grid, 0.8);
  for (let i = 0; i < (w * h) / 6000; i++) {
    g.fillStyle(0x2b1d1a, 1);
    g.fillRect(r() * w, TOP_BAND + r() * (h - TOP_BAND), 9 + r() * 6, 6 + r() * 4);
  }
  // Basalt split by glowing cracks: a wide dim stroke under a thin bright one.
  for (let i = 0; i < (w * h) / 11000; i++) {
    let x = r() * w;
    let y = TOP_BAND + r() * (h - TOP_BAND);
    let a = r() * Math.PI * 2;
    const n = 3 + Math.floor(r() * 4);
    for (let j = 0; j < n; j++) {
      a += (r() - 0.5) * 1.4;
      const nx = x + Math.cos(a) * 22;
      const ny = y + Math.sin(a) * 22;
      g.lineStyle(5, k.neonA, 0.3);
      g.lineBetween(x, y, nx, ny);
      g.lineStyle(2, k.neonB, 0.9);
      g.lineBetween(x, y, nx, ny);
      x = nx;
      y = ny;
    }
  }
  // The lava river beyond the top wall.
  g.fillStyle(0x2a0906, 1);
  g.fillRect(0, 0, w, TOP_BAND);
  g.fillStyle(k.neonA, 0.85);
  g.fillRect(0, TOP_BAND * 0.35, w, TOP_BAND * 0.45);
  g.fillStyle(0xffd166, 0.6);
  g.fillRect(0, TOP_BAND * 0.47, w, TOP_BAND * 0.16);
  for (let x = 10, i = 0; x < w; x += 90, i++) {
    g.fillStyle(0x150605, 1);
    g.fillTriangle(x, TOP_BAND, x + 14, TOP_BAND - 22 - (i % 3) * 8, x + 44, TOP_BAND);
  }
  wallGlow(g, w, h, k.neonA, 0xffd166);
}

/**
 * A world's whole floor, once per level: ground, grid, scenery, the top band, the
 * props (groundProps.ts) and the walls. The career draws it per world; since
 * 2026-10-02 the quick run draws it too, one world per stage (`quickWorld`).
 */
export function drawWorldGround(g: Pen, world: WorldId, w: number, h: number, seed: number): void {
  const r = mulberry32(seed);
  if (world === "city") cityFloor(g, w, h, r);
  else if (world === "frost") frostFloor(g, w, h, r);
  else lavaFloor(g, w, h, r);
  drawProps(g, world, w, h, seed, TOP_BAND);
  walls(g, w, h, WORLD_INK[world]);
}

/**
 * THE QUICK RUN'S THREE STAGES ARE THE THREE WORLDS (operator ruling 2026-10-02,
 * floor option B): stage 1 is Neon City, 2 is Frost, 3 is Lava. Only the PICTURE
 * changes - none of a world's twists (the dark, the ice, the pools) and none of its
 * tints come with it, so a quick run, calm above all, plays exactly as before.
 */
export const QUICK_WORLDS: readonly WorldId[] = ["city", "frost", "lava"];
export const quickWorld = (stage: number): WorldId => QUICK_WORLDS[Math.min(QUICK_WORLDS.length, Math.max(1, Math.round(stage))) - 1]!;

/** The pools, UNDER the shapes: a dashed warning ring filling up, then the molten pool, then fading. */
export function drawPools(g: Pen, pools: readonly Pool[], now: number): void {
  for (const p of pools) {
    if (p.warn > 0) {
      const f = 1 - p.warn / POOL.warn;
      g.fillStyle(0xff5a00, 0.14 + 0.1 * f);
      g.fillEllipse(p.x, p.y, p.r * 2.5, p.r * 1.6);
      // A dashed ring: twelve arcs' worth of short strokes round the ellipse.
      g.lineStyle(3, 0xffb347, 0.9);
      for (let i = 0; i < 12; i++) {
        const a0 = (i / 12) * Math.PI * 2 + now / 900;
        const a1 = a0 + 0.3;
        g.lineBetween(p.x + Math.cos(a0) * p.r * 1.25, p.y + Math.sin(a0) * p.r * 0.8, p.x + Math.cos(a1) * p.r * 1.25, p.y + Math.sin(a1) * p.r * 0.8);
      }
      g.fillStyle(0xff7b00, 0.9);
      g.fillEllipse(p.x, p.y, p.r * 0.9 * f, p.r * 0.6 * f);
      continue;
    }
    const fade = Math.min(1, p.live / 600);
    g.fillStyle(0xff5a00, 0.35 * fade);
    g.fillEllipse(p.x, p.y, p.r * 2.9, p.r * 2);
    g.fillStyle(0x3a0a05, fade);
    g.fillEllipse(p.x, p.y, p.r * 2.5 + 6, p.r * 1.6 + 6);
    g.fillStyle(0xff7b00, fade);
    g.fillEllipse(p.x, p.y, p.r * 2.5, p.r * 1.6);
    g.fillStyle(0xffd166, 0.9 * fade);
    g.fillEllipse(p.x - 3, p.y + 1, p.r * 1.3, p.r * 0.7);
    const bub = Math.sin(now / 180 + p.id) * 0.5 + 0.5;
    g.fillStyle(0xfff6c2, fade);
    g.fillCircle(p.x - p.r * 0.35, p.y - 2, 2 + 2 * bub);
    g.fillCircle(p.x + p.r * 0.4, p.y + 4, 1.5 + 1.5 * (1 - bub));
  }
}

/** The darkness OVER the shapes, and a pair of eyes for every shape hidden in it. */
export function drawDark(g: Pen, s: Pick<RunState, "career" | "enemies" | "boss">, hidden: (x: number, y: number) => boolean, now: number): void {
  const dark = s.career?.dark ?? [];
  for (const d of dark) {
    // Nested discs, each adding a little: near-black in the middle, gone at the rim.
    for (let i = 0; i < 7; i++) {
      g.fillStyle(0x000000, 0.14);
      g.fillCircle(d.x, d.y, d.r * (1 - i * 0.08));
    }
  }
  if (dark.length === 0) return;
  const blink = Math.floor(now / 1700) % 7 === 0;
  for (const e of s.enemies) {
    // The boss is never hidden (enemies.ts `nearestEnemy`), so it gets no eyes either.
    if (e.id === s.boss || !hidden(e.x, e.y)) continue;
    g.fillStyle(0xffe14d, 0.35);
    g.fillEllipse(e.x - 6, e.y - 4, 12, 9);
    g.fillEllipse(e.x + 6, e.y - 4, 12, 9);
    g.fillStyle(0xffe14d, 1);
    g.fillEllipse(e.x - 6, e.y - 4, 7, blink ? 1 : 5);
    g.fillEllipse(e.x + 6, e.y - 4, 7, blink ? 1 : 5);
  }
}

/** Gold on the floor: a coin, bigger for a pile, with a dark rim and a glint. */
export function drawCoins(g: Pen, coins: readonly Gem[], now: number): void {
  for (const c of coins) {
    const r = Math.min(10, 5 + Math.sqrt(c.value) * 1.2);
    const bob = Math.sin(now / 240 + c.id) * 1.2;
    g.fillStyle(0x3a2400, 1);
    g.fillCircle(c.x, c.y + bob, r + 1.5);
    g.fillStyle(0xffc21a, 1);
    g.fillCircle(c.x, c.y + bob, r);
    g.fillStyle(0xfff1b8, 0.95);
    g.fillCircle(c.x - r * 0.3, c.y + bob - r * 0.3, r * 0.3);
  }
}

/**
 * The weather, in SCREEN space over the whole view: snow falls in frost, embers rise
 * in lava, nothing in the city (its neon is its air). A function of the clock and
 * each flake's index, so it moves the same way every time and costs no state.
 */
export function drawWeather(g: Pen, world: WorldId, vw: number, vh: number, now: number): void {
  if (world === "city") return;
  const n = Math.round((vw * vh) / 3600);
  for (let i = 0; i < n; i++) {
    const hx = ((i * 2654435761) >>> 0) / 4294967296;
    const hy = ((i * 1597334677 + 97) >>> 0) / 4294967296;
    const sp = 0.6 + (((i * 40503) >>> 0) % 100) / 100;
    if (world === "frost") {
      const y = (hy * (vh + 20) + (now / 1000) * 26 * sp) % (vh + 20) - 10;
      const x = (hx * vw + Math.sin(now / 1300 + i) * 14 + vw) % vw;
      g.fillStyle(0xffffff, 0.45 + 0.4 * (sp - 0.6));
      g.fillCircle(x, y, 1 + sp * 1.4);
    } else {
      const y = vh + 10 - ((hy * (vh + 20) + (now / 1000) * 34 * sp) % (vh + 20));
      const x = (hx * vw + Math.sin(now / 900 + i) * 10 + vw) % vw;
      g.fillStyle(i % 2 ? 0xffd166 : 0xff7b00, 0.55 + 0.35 * (sp - 0.6));
      g.fillCircle(x, y, 0.8 + sp);
    }
  }
}
