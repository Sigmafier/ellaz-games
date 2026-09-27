// A test fixture, not game code: a run whose body is laid round a circle so a
// test can close a loop by hand. Imported only by the tests.
import { SPACING } from "./body";
import { newRun } from "./logic";
import type { Run } from "./types";

/** A run whose body is laid round a circle, head at angle 0, so the head is
 *  about to touch its own tail end. `sweep` is how far round the body goes. */
export function ringRun(cx: number, cy: number, R: number, sweep = 2 * Math.PI + 0.3): Run {
  const run = newRun("normal", { w: 420, h: 560 }, () => 0.5);
  const n = Math.ceil((sweep * R) / SPACING);
  run.x = cx + R;
  run.y = cy;
  run.heading = Math.PI / 2; // moving "down" the circle, clockwise in screen space
  run.path = Array.from({ length: n }, (_, k) => {
    const a = -((k + 1) * SPACING) / R;
    return { x: cx + R * Math.cos(a), y: cy + R * Math.sin(a) };
  });
  run.len = Math.ceil((n * SPACING) / 12) + 2;
  return run;
}

