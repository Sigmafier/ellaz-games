// THE PROPS EACH WORLD'S FLOOR CARRIES - operator ruling 2026-10-02, floor option
// B off three drawn options ("ack B"): the worlds players already know, plus
// things in them that make each one a PLACE.
//
//   NEON CITY  street lamps with a pool of light, parked cars, zebra crossings
//   FROST      snowy pines, snowmen, frozen ponds
//   LAVA       boulders with a glowing seam, lava vents, bone piles
//
// DECORATION, NEVER OBSTACLES. Nothing here collides with anything (the 2026-09-14
// ruling on scenery stands): a prop is something you walk over. So props are drawn
// under the shapes, kept dim enough that none reads as a shape coming at you, and
// never near the spot a run starts, so the first seconds read clearly.
//
// SEEDED, like the floor under them: the same level is the same picture every time
// it is played, and a landmark can be learned. Through `Pen` only, so the scene
// passes its Graphics and `ground-art.test.ts` passes a recorder.

import { mulberry32 } from "@shared/rng";
import type { Pen } from "./groundArt";
import type { WorldId } from "./types";

/** How close to the start (the world's middle) no prop is ever placed. */
export const PROP_CLEAR = 120;
/** One prop per this many square units - about six on a 648x364 screen. */
const PROP_AREA = 40_000;
/** Keep clear of the top band (the skyline, the peaks, the river) and the walls. */
const EDGE = 40;

type Draw = (g: Pen, x: number, y: number, s: number) => void;

function lamp(g: Pen, x: number, y: number) {
  g.fillStyle(0xffd166, 0.12);
  g.fillCircle(x, y - 30, 26);
  g.fillStyle(0x000000, 0.35);
  g.fillEllipse(x, y + 2, 16, 5);
  g.fillStyle(0x2b2f55, 1);
  g.fillRect(x - 2, y - 30, 4, 32);
  g.fillStyle(0x3a3f6e, 1);
  g.fillRect(x - 9, y - 34, 18, 5);
  g.fillStyle(0xffe08a, 1);
  g.fillRect(x - 7, y - 30, 14, 3);
}

function car(g: Pen, x: number, y: number, s: number) {
  const ink = s > 1 ? 0xff4dd2 : 0x3de8ff;
  g.fillStyle(0x000000, 0.35);
  g.fillEllipse(x + 22, y + 22, 50, 10);
  g.fillStyle(ink, 0.85);
  g.fillRect(x, y + 6, 44, 14);
  g.fillRect(x + 9, y, 26, 9);
  g.fillStyle(0x9fd9ff, 0.7);
  g.fillRect(x + 12, y + 2, 9, 6);
  g.fillRect(x + 23, y + 2, 9, 6);
  g.fillStyle(0x111111, 1);
  g.fillCircle(x + 10, y + 20, 5);
  g.fillCircle(x + 34, y + 20, 5);
}

function crossing(g: Pen, x: number, y: number) {
  g.fillStyle(0x15172e, 1);
  g.fillRect(x, y, 120, 44);
  g.fillStyle(0xdfe6e9, 0.4);
  for (let i = 0; i < 6; i++) g.fillRect(x + 8 + i * 19, y + 6, 10, 32);
}

function pine(g: Pen, x: number, y: number, s: number) {
  g.fillStyle(0x000000, 0.25);
  g.fillEllipse(x, y + 3, 30 * s, 8 * s);
  g.fillStyle(0x5b3a1e, 1);
  g.fillRect(x - 3 * s, y - 8 * s, 6 * s, 10 * s);
  for (let i = 0; i < 3; i++) {
    const ty = y - 8 * s - i * 12 * s;
    const hw = (17 - i * 4) * s;
    g.fillStyle(0x1f6b5a, 1);
    g.fillTriangle(x - hw, ty, x, ty - 18 * s, x + hw, ty);
    g.fillStyle(0xffffff, 0.9);
    g.fillTriangle(x - hw * 0.45, ty - 10 * s, x, ty - 18 * s, x + hw * 0.45, ty - 10 * s);
  }
}

function snowman(g: Pen, x: number, y: number) {
  g.fillStyle(0x000000, 0.2);
  g.fillEllipse(x, y + 2, 26, 7);
  g.fillStyle(0xffffff, 1);
  g.fillCircle(x, y - 8, 11);
  g.fillCircle(x, y - 24, 8);
  g.fillStyle(0x241c17, 1);
  g.fillCircle(x - 3, y - 26, 1.6);
  g.fillCircle(x + 3, y - 26, 1.6);
  g.fillStyle(0xff7b00, 1);
  g.fillTriangle(x, y - 24, x + 9, y - 23, x, y - 22);
  g.fillStyle(0xc2185b, 1);
  g.fillRect(x - 8, y - 18, 16, 3);
}

function pond(g: Pen, x: number, y: number) {
  g.fillStyle(0x0f3d63, 0.75);
  g.fillEllipse(x, y, 90, 34);
  g.fillStyle(0xd6f0ff, 0.35);
  g.fillEllipse(x - 14, y - 5, 40, 8);
  g.lineStyle(2, 0xffffff, 0.5);
  g.lineBetween(x - 10, y + 4, x + 22, y - 2);
}

function boulder(g: Pen, x: number, y: number, s: number) {
  g.fillStyle(0x000000, 0.35);
  g.fillEllipse(x, y + 8 * s, 40 * s, 10 * s);
  g.fillStyle(0x3a2622, 1);
  g.fillEllipse(x, y, 36 * s, 24 * s);
  g.fillStyle(0x553a33, 1);
  g.fillEllipse(x - 5 * s, y - 5 * s, 18 * s, 9 * s);
  g.lineStyle(2, 0xff8a1c, 0.8);
  g.lineBetween(x - 4 * s, y + 2 * s, x + 8 * s, y - 4 * s);
}

function vent(g: Pen, x: number, y: number) {
  g.fillStyle(0xff5a00, 0.18);
  g.fillCircle(x, y, 22);
  g.fillStyle(0x150605, 1);
  g.fillEllipse(x, y, 30, 14);
  g.fillStyle(0xff8a1c, 1);
  g.fillEllipse(x, y, 18, 7);
  g.fillStyle(0xffd166, 1);
  g.fillEllipse(x, y, 8, 3);
}

function bones(g: Pen, x: number, y: number) {
  g.lineStyle(4, 0xe8dcc8, 1);
  g.lineBetween(x - 10, y - 6, x + 10, y + 6);
  g.lineBetween(x - 10, y + 6, x + 10, y - 6);
  g.fillStyle(0xe8dcc8, 1);
  g.fillCircle(x + 14, y - 8, 7);
  g.fillStyle(0x241c17, 1);
  g.fillCircle(x + 12, y - 9, 1.6);
  g.fillCircle(x + 16, y - 9, 1.6);
}

/** Each world's props and how often each turns up (weights, not counts). */
export const PROPS: Record<WorldId, readonly (readonly [Draw, number])[]> = {
  city: [[lamp, 5], [car, 3], [crossing, 1]],
  frost: [[pine, 5], [snowman, 2], [pond, 1]],
  lava: [[boulder, 4], [vent, 3], [bones, 2]],
};

/**
 * Lay a world's props over its floor. `topBand` is how tall the scenery band along
 * the top wall is, so nothing stands in the skyline or the river.
 */
export function drawProps(g: Pen, world: WorldId, w: number, h: number, seed: number, topBand: number): void {
  const r = mulberry32(seed ^ 0x9e3779b9);
  const kinds = PROPS[world];
  const total = kinds.reduce((a, [, wgt]) => a + wgt, 0);
  const n = Math.round((w * h) / PROP_AREA);
  for (let i = 0; i < n; i++) {
    const x = EDGE + r() * (w - EDGE * 2 - 120);
    const y = topBand + EDGE + r() * (h - topBand - EDGE * 2);
    const pick = r() * total;
    const s = 0.85 + r() * 0.5;
    if (Math.hypot(x - w / 2, y - h / 2) < PROP_CLEAR) continue;
    let acc = 0;
    for (const [draw, wgt] of kinds) {
      acc += wgt;
      if (pick < acc) {
        draw(g, x, y, s);
        break;
      }
    }
  }
}
