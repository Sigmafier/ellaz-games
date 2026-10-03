// HOW THE FOUR NEW MONSTERS LOOK (monsters.ts), beyond the sheet each one wears.
//
// Each wears its own ink as a standing tint (the scene's DRESSED set), so a
// splitter is never read as the orb whose slime it borrows. On top of that, the
// two that WARN draw their warning, because the warning is the whole fairness of
// the thing:
//
//   CHARGER winding up  a dashed line along the exact line it will dash - locked
//                       at the start of the wind-up, so the line cannot lie
//   CHARGER dashing     a short streak behind it
//   BOMBER fuse lit     a spark over its back that blinks faster as the fuse runs out
//   SPLITTER            a dashed teal ring and a seam down its middle - its slime is
//                       the orb's and the spitter's too, and only this says "it splits"
//
// Through `Pen` only; the scene calls `drawMonsters` once a frame.

import type { Pen } from "./groundArt";
import type { Enemy, EnemyKind } from "./types";
import { BOMBER, CHARGER, MONSTER_KINDS } from "./monsters";
import { radiusOf } from "./enemies";

/**
 * Each new kind's ink - its standing tint, its death sparks, and (the bomber) its
 * shots. Checked against the inks already on the board: teal is the only blue-green
 * among them, orange sits between the runner's pink and the orb's amber, and the
 * bomber's warm yellow is the colour of its fuse.
 */
export const MONSTER_INK: Record<(typeof MONSTER_KINDS)[number], number> = {
  splitter: 0x2fe0c0,
  blob: 0x8ff7e6,
  charger: 0xff7b2a,
  bomber: 0xffe066,
};

const isKind = (k: EnemyKind, want: EnemyKind) => k === want;

/** Every telegraph the new monsters give, for the shapes on the board. */
export function drawMonsters(g: Pen, enemies: readonly Enemy[], now: number): void {
  for (const e of enemies) {
    if (isKind(e.kind, "charger")) drawCharger(g, e);
    else if (isKind(e.kind, "splitter")) drawSeam(g, e);
    else if (isKind(e.kind, "bomber") && (e.fuse ?? 0) > 0) drawFuse(g, e, now);
  }
}

function drawCharger(g: Pen, e: Enemy): void {
  const dx = e.dx ?? 0;
  const dy = e.dy ?? 0;
  if ((e.wind ?? 0) > 0) {
    const reach = CHARGER.speed * (CHARGER.dash / 1000);
    const warm = 1 - (e.wind ?? 0) / CHARGER.wind;
    g.lineStyle(3, MONSTER_INK.charger, 0.35 + 0.5 * warm);
    for (let t = 0; t < 1; t += 0.2) {
      const a = t * reach;
      const b = Math.min(reach, a + reach * 0.12);
      g.lineBetween(e.x + dx * a, e.y + dy * a, e.x + dx * b, e.y + dy * b);
    }
  } else if ((e.dash ?? 0) > 0) {
    g.lineStyle(5, MONSTER_INK.charger, 0.45);
    g.lineBetween(e.x, e.y, e.x - dx * 26, e.y - dy * 26);
  }
}

function drawSeam(g: Pen, e: Enemy): void {
  const r = radiusOf(e) + 4;
  g.lineStyle(2, MONSTER_INK.splitter, 0.9);
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2;
    const b = a + Math.PI / 10;
    g.lineBetween(e.x + Math.cos(a) * r, e.y + Math.sin(a) * r, e.x + Math.cos(b) * r, e.y + Math.sin(b) * r);
  }
  g.lineStyle(2, 0xffffff, 0.8);
  g.lineBetween(e.x, e.y - r * 0.7, e.x + 2, e.y);
  g.lineBetween(e.x + 2, e.y, e.x - 1, e.y + r * 0.5);
}

function drawFuse(g: Pen, e: Enemy, now: number): void {
  const left = (e.fuse ?? 0) / BOMBER.fuse;
  // Blinks faster as it burns down: 200 ms a beat at the start, 50 at the end.
  const beat = 50 + 150 * left;
  const lit = Math.floor(now / beat) % 2 === 0;
  g.lineStyle(2, 0xb2bec3, 1);
  g.lineBetween(e.x + 4, e.y - 12, e.x + 8, e.y - 20);
  g.fillStyle(lit ? 0xffffff : MONSTER_INK.bomber, 1);
  g.fillCircle(e.x + 9, e.y - 21, lit ? 4 : 3);
  g.fillStyle(MONSTER_INK.bomber, 0.25);
  g.fillCircle(e.x + 9, e.y - 21, 8);
}
