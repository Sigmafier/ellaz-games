// THE THREE TWISTS, as rules (P3, 2026-09-29). Each world's floor changes how the
// run PLAYS, not only how it looks - the p0 pictures drew them and these are what
// they do. The drawing is `groundArt.ts`; nothing here knows a colour.
//
//   NEON CITY  the lights go out. Patches of darkness drift across the floor and
//              the guns cannot see into them - a shape standing in the dark is
//              not a target until it walks out (or the blades find it). One of
//              them, the SHADE, follows the robot: keep moving or be blinded.
//   FROST      the floor is ice. The robot takes a moment to get going and keeps
//              sliding when you let go, so a dodge has to start early.
//   LAVA       hot pools open near the robot. Each WARNS first - a ring on the
//              floor, harmless - then burns: standing in a live pool costs a heart,
//              through the same `takeHit` a shape uses (the dash and the shield
//              still save you).
//
// Pure and deterministic: darkness is a function of the level's seed and how long
// it has been played; ice is a function of the stick; a pool's place takes one draw
// of the rng `step` was handed, and only in the lava world - a quick run, which has
// no career, never reaches any of this and never loses a draw to it.

import { mulberry32 } from "@shared/rng";
import type { DarkPatch, Pool, RunState } from "./types";
import { clampToWorld, dist2 } from "./world";

/** Darkness: one chance of a patch per `cell` of floor, each about `r` across, drifting. */
export const DARK = { cell: 330, chance: 0.55, r: 72, spread: 22, drift: 55, clear: 150 } as const;

/**
 * THE SHADE: one patch that FOLLOWS the robot, at `chase` units a second against
 * the robot's 148. Measured on the first bot table: with only drifting patches and
 * a guaranteed-light start, a robot that never moved won Neon City 5 runs in 5 -
 * the do-nothing player was the best one. The shade is what makes standing still
 * cost something: it starts `start` units away, reaches a statue in about seven
 * seconds and blinds its gun, and a player who keeps moving never meets it.
 */
export const SHADE = { r: 86, chase: 44, start: 320 } as const;

/** The shade's next position: toward the robot, never faster than `chase`. */
export function chaseShade(from: { x: number; y: number }, to: { x: number; y: number }, dt: number): { x: number; y: number } {
  const d = Math.hypot(to.x - from.x, to.y - from.y);
  const step = (SHADE.chase * dt) / 1000;
  if (d <= step || d === 0) return { x: to.x, y: to.y };
  return { x: from.x + ((to.x - from.x) / d) * step, y: from.y + ((to.y - from.y) / d) * step };
}

/**
 * Ice: how fast the robot's speed follows the stick while it is held (`grip`) and
 * dies away once it is let go (`drag`), per second. Measured on the frost bot: 3 and
 * 1.8 is a slide a player notices on the first turn without the robot feeling lost.
 */
export const ICE = { grip: 3, drag: 1.8 } as const;

/** Lava pools: radius, warning, burn, most at once, and how far from the robot one opens. */
export const POOL = { r: 34, warn: 1400, live: 5200, cap: 4, near: [50, 170] } as const;

/** A level's layout seed from its id, so the same level lays out the same way every time. */
export function seedOf(id: string): number {
  let h = 2166136261;
  for (let i = 0; i < id.length; i++) h = Math.imul(h ^ id.charCodeAt(i), 16777619);
  return h >>> 0;
}

/** Where the darkness is, `age` ms into a level on this floor. Empty for a floor with no lights twist. */
export function darkPatches(seed: number, world: { w: number; h: number }, age: number): DarkPatch[] {
  const out: DarkPatch[] = [];
  const cols = Math.ceil(world.w / DARK.cell);
  const rows = Math.ceil(world.h / DARK.cell);
  for (let j = 0; j < rows; j++) {
    for (let i = 0; i < cols; i++) {
      const r = mulberry32((seed ^ Math.imul(j * cols + i + 1, 2654435761)) >>> 0);
      if (r() > DARK.chance) continue;
      const cx = (i + 0.2 + r() * 0.6) * DARK.cell;
      const cy = (j + 0.2 + r() * 0.6) * DARK.cell;
      const ph = r() * Math.PI * 2;
      const size = DARK.r + r() * DARK.spread;
      // The robot starts in the middle of the world, and a first second spent
      // unable to shoot the first runner would read as the gun being broken - so no
      // patch, at its widest and drifted its furthest, reaches within `clear` of it.
      if (Math.hypot(cx - world.w / 2, cy - world.h / 2) < DARK.clear + size + DARK.drift) continue;
      out.push({
        x: cx + Math.sin(age / 2400 + ph) * DARK.drift,
        y: cy + Math.cos(age / 3000 + ph * 1.3) * DARK.drift * 0.75,
        r: size * (0.9 + 0.1 * Math.sin(age / 1700 + ph)),
      });
    }
  }
  return out;
}

/** Is this point in the dark right now? Always false on a run with no darkness. */
export function inDark(s: Pick<RunState, "career">, x: number, y: number): boolean {
  const dark = s.career?.dark;
  if (!dark || dark.length === 0) return false;
  return dark.some((d) => dist2(d.x, d.y, x, y) < d.r * d.r);
}

/**
 * One frame of steering ON ICE: the velocity eases toward what the stick asks for
 * rather than being it, and a wall stops the slide along its own axis.
 */
export function slide(s: RunState, input: { dx: number; dy: number }, speed: number, sec: number, r: number): void {
  const c = s.career!;
  const len = Math.hypot(input.dx, input.dy);
  const held = len > 0.02;
  const tx = held ? (input.dx / len) * speed : 0;
  const ty = held ? (input.dy / len) * speed : 0;
  const k = 1 - Math.exp(-(held ? ICE.grip : ICE.drag) * sec);
  c.vx += (tx - c.vx) * k;
  c.vy += (ty - c.vy) * k;
  const wantX = s.x + c.vx * sec;
  const wantY = s.y + c.vy * sec;
  const p = clampToWorld(s, wantX, wantY, r);
  if (p.x !== wantX) c.vx = 0;
  if (p.y !== wantY) c.vy = 0;
  s.x = p.x;
  s.y = p.y;
}

/** Is this pool burning, and is the robot in it? Only the middle of the robot counts - an edge is a near miss. */
export const poolBurns = (p: Pool, x: number, y: number, r: number): boolean =>
  p.warn <= 0 && p.live > 0 && dist2(p.x, p.y, x, y) < (p.r + r * 0.5) ** 2;

/**
 * One frame of the lava pools: open a new one on the clock (warning first), age
 * them, drop the cold ones, and burn the robot if it stands in a live one.
 */
export function tickPools(s: RunState, dt: number, rng: () => number, r: number, hurt: (x: number, y: number) => void): void {
  const c = s.career!;
  // Age what is there first, so a pool opened this frame starts with its whole warning.
  for (const p of c.pools) {
    if (p.warn > 0) p.warn = Math.max(0, p.warn - dt);
    else p.live -= dt;
  }
  c.pools = c.pools.filter((p) => p.warn > 0 || p.live > 0);
  c.poolIn -= dt;
  if (c.poolIn <= 0) {
    c.poolIn += c.poolEvery;
    if (c.pools.length < POOL.cap) {
      const a = rng() * Math.PI * 2;
      const d = POOL.near[0] + rng() * (POOL.near[1] - POOL.near[0]);
      const p = clampToWorld(s, s.x + Math.cos(a) * d, s.y + Math.sin(a) * d, POOL.r + 4);
      c.pools.push({ id: s.nextId++, x: p.x, y: p.y, r: POOL.r, warn: POOL.warn, live: POOL.live });
    }
  }
  const burning = c.pools.find((p) => poolBurns(p, s.x, s.y, r));
  if (burning) hurt(burning.x, burning.y);
}
