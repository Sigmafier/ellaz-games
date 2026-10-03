// HOW THE FOUR WEAPONS OF THE SIX-SLOT RUN LOOK (2026-10-02, drawn to the
// operator's picked pictures, "ack B"): the flask's bottle, the bouncer's ball,
// the halo's ring and the zap's lightning - each a SHAPE and a MOTION of its
// own, never an existing weapon at another size (the rule the scene's bolt loop
// states for the first three weapons).
//
// Through `Pen` (groundArt.ts) only, so the scene passes its Graphics and a test
// passes a recorder. SurvivorsScene.ts only CALLS these.

import type { Pen } from "./groundArt";
import type { Bolt } from "./types";

/** A lightning strike on the board: where, how big, and how long it has shown. */
export interface Strike {
  x: number;
  y: number;
  big: boolean;
  age: number;
}

/** How long one strike stays on screen. */
export const STRIKE_MS = 260;

/** The flask: a round bottle with a neck, tumbling end over end as it flies. */
export function drawFlask(g: Pen, b: Pick<Bolt, "x" | "y" | "age">, ink: number): void {
  const a = b.age / 70;
  const nx = Math.cos(a) * 7;
  const ny = Math.sin(a) * 7;
  g.lineStyle(3, 0xfff4e6, 1);
  g.lineBetween(b.x, b.y, b.x + nx, b.y + ny);
  g.fillStyle(ink, 1);
  g.fillCircle(b.x, b.y, 5);
  g.fillStyle(0xffffff, 0.7);
  g.fillCircle(b.x - 1.5, b.y - 1.5, 1.5);
}

/** The bouncer: a ball with a shine and a short fading trail; the pinball is bigger and glows. */
export function drawBall(g: Pen, b: Pick<Bolt, "x" | "y" | "vx" | "vy">, ink: number, big: boolean): void {
  const r = big ? 9 : 6;
  const sp = Math.hypot(b.vx, b.vy) || 1;
  for (let i = 3; i >= 1; i--) {
    g.fillStyle(ink, 0.12 * i);
    g.fillCircle(b.x - (b.vx / sp) * i * r, b.y - (b.vy / sp) * i * r, r * 0.8);
  }
  if (big) {
    g.fillStyle(ink, 0.3);
    g.fillCircle(b.x, b.y, r + 6);
  }
  g.fillStyle(ink, 1);
  g.fillCircle(b.x, b.y, r);
  g.fillStyle(0xffffff, 0.85);
  g.fillCircle(b.x - r * 0.35, b.y - r * 0.35, r * 0.3);
}

/** How long the ring flares after a pulse - the beat a player learns to read. */
export const HALO_FLASH_MS = 180;

/**
 * The halo where it cuts: a faint disc, a ring that breathes, and a FLARE on each
 * pulse (`flash`, 0..1) - it hurts on a beat, so the beat must be seen. The
 * barrier carries a second, inner ring.
 */
export function drawHalo(g: Pen, x: number, y: number, reach: number, ink: number, evolved: boolean, now: number, flash = 0): void {
  const pulse = Math.max(flash, 0.35 + 0.25 * Math.sin(now / 160));
  g.fillStyle(ink, evolved ? 0.1 : 0.07);
  g.fillCircle(x, y, reach);
  g.lineStyle(evolved ? 10 : 7, ink, 0.12 + 0.1 * pulse);
  g.strokeCircle(x, y, reach);
  g.lineStyle(evolved ? 3 : 2, ink, 0.75 + 0.25 * pulse);
  g.strokeCircle(x, y, reach);
  if (evolved) {
    g.lineStyle(1.5, 0xffffff, 0.5);
    g.strokeCircle(x, y, reach - 6);
  }
}

/** Each strike: a jagged bolt falling onto its shape and a flash where it lands. */
export function drawStrikes(g: Pen, strikes: readonly Strike[], ink: number): void {
  for (const s of strikes) {
    const fade = Math.max(0, 1 - s.age / STRIKE_MS);
    const top = s.y - (s.big ? 240 : 180);
    const steps = 6;
    let px = s.x;
    let py = top;
    for (let i = 1; i <= steps; i++) {
      const t = i / steps;
      const nx = s.x + (i < steps ? Math.sin(i * 7.3 + s.x) * (s.big ? 11 : 8) : 0);
      const ny = top + (s.y - top) * t;
      g.lineStyle(s.big ? 10 : 7, ink, 0.25 * fade);
      g.lineBetween(px, py, nx, ny);
      g.lineStyle(s.big ? 3.5 : 2.5, 0xffffff, fade);
      g.lineBetween(px, py, nx, ny);
      px = nx;
      py = ny;
    }
    g.fillStyle(ink, 0.35 * fade);
    g.fillCircle(s.x, s.y, s.big ? 34 : 16);
  }
}

/** Strikes age and leave; returns the ones still showing. */
export const ageStrikes = (strikes: readonly Strike[], dt: number): Strike[] =>
  strikes.map((s) => ({ ...s, age: s.age + dt })).filter((s) => s.age < STRIKE_MS);
