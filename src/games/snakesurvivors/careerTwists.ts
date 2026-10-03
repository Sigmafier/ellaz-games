// THE CAREER'S TWISTS, as rules (operator ruling 2026-10-03, off the S0 mock):
//
//   GARDEN  none - the world you learn the career in.
//   DESERT  drifting SAND: patches of it slide slowly across the floor, and the
//           head in one moves at `SAND.slow`. A loop drawn through sand is slower
//           to close, and a crowd closes on a slow snake.
//   CAVE    the DARK: the floor is black but for a light round the head, and the
//           shapes glow so they can still be seen. The light is drawn by the
//           scene (`careerScene.ts`); the rules hold only its radius, so a test
//           can say it exists in the cave and nowhere else.
//
// Pure and deterministic: the sand is a function of the level's seed and how long
// it has been played, so it takes no rng and a quick run - which has no career -
// never loses a draw to it.

import { mulberry32 } from "@shared/rng";
import type { SandPatch } from "./careerTypes";

/**
 * Sand: one chance of a patch per `cell` of floor, `r` to `r + spread` across,
 * drifting `drift` units out and back along its own heading over `period` ms. No
 * patch, at its widest and drifted furthest, reaches within `clear` of where the
 * snake starts - a level does not open in sand. `clear` was 110 and put every
 * patch outside the opening view (the first Hall shot, 2026-10-03, showed none);
 * at 30 the nearest sits about 150 out, on screen from the first frame.
 */
export const SAND = { cell: 260, chance: 0.6, r: 46, spread: 30, drift: 70, period: 16_000, clear: 30, slow: 0.62 } as const;

/** The cave's light round the head, in arena units. */
export const LIGHT = 150;

/** A level's layout seed from its id, so the same level lays out the same way every time. */
export function seedOf(id: string): number {
  let h = 2166136261;
  for (let i = 0; i < id.length; i++) h = Math.imul(h ^ id.charCodeAt(i), 16777619);
  return h >>> 0;
}

/** Where the sand is, `age` ms into a level on a world this big. */
export function sandPatches(seed: number, world: { w: number; h: number }, age: number): SandPatch[] {
  const out: SandPatch[] = [];
  const cols = Math.ceil(world.w / SAND.cell);
  const rows = Math.ceil(world.h / SAND.cell);
  const swing = Math.sin((2 * Math.PI * age) / SAND.period);
  for (let j = 0; j < rows; j++) {
    for (let i = 0; i < cols; i++) {
      const r = mulberry32((seed ^ Math.imul(j * cols + i + 1, 2654435761)) >>> 0);
      if (r() > SAND.chance) continue;
      const cx = (i + 0.2 + r() * 0.6) * SAND.cell;
      const cy = (j + 0.2 + r() * 0.6) * SAND.cell;
      const dir = r() * Math.PI * 2;
      const size = SAND.r + r() * SAND.spread;
      if (Math.hypot(cx - world.w / 2, cy - world.h / 2) < SAND.clear + size + SAND.drift) continue;
      out.push({ x: cx + Math.cos(dir) * SAND.drift * swing, y: cy + Math.sin(dir) * SAND.drift * swing, r: size, dir });
    }
  }
  return out;
}

/** Is this point in any patch? */
export const inSand = (patches: readonly SandPatch[], x: number, y: number): boolean =>
  patches.some((p) => (p.x - x) ** 2 + (p.y - y) ** 2 < p.r * p.r);
