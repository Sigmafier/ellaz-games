// What a stage IS on the classic board: a little more wall.
//
// "I manage to reach stage 4. What is the difference between stage 0 and
//  stage 4? I didn't feel or saw any."   - Phaser forum, 2026-09-27
//
// The only difference was 8ms a tick per stage, which nobody can see. Now each
// stage drops walls, flashed as they land (`drawWallFlash`), and the speed is
// untouched. Today's board keeps its own fixed walls and gets none of these.
//
// BUILT, never scattered and hoped over, with the same checks as today's
// board: a piece lands only where the board it leaves behind is still one
// connected region with no dead end, and never on or just in front of the
// snake. Pure and seeded - `stage-walls.test.ts` plays hundreds of runs to
// stage 8 and past and checks every drop.

import type { Dir, SnakeState } from "./logic";
import { allConnected, hasDeadEnd, touchesWall } from "./todayBoard";

/** Apples per stage. The band's "stage" and the tick speed-up both count these. */
export const FOOD_PER_LEVEL = 5;

/** The stage for a score, 1-based: a run begins on stage 1, never stage 0. */
export function stageOf(score: number): number {
  return 1 + Math.floor(score / FOOD_PER_LEVEL);
}

/**
 * Where a score sits inside its stage, for the band: the stage, the apples
 * still to eat before the next one (1 to FOOD_PER_LEVEL, never 0 - the step
 * that eats the last one IS the next stage), and how far through it the run
 * is, 0 to just under 1. "It would be nice to know how much I need to the
 * next level" - a player, 2026-09-28.
 */
export function stageProgress(score: number): { stage: number; toGo: number; done: number } {
  const into = score % FOOD_PER_LEVEL;
  return { stage: stageOf(score), toGo: FOOD_PER_LEVEL - into, done: into / FOOD_PER_LEVEL };
}

/**
 * The most wall the classic board ever carries: 18 cells, 6% of the 289.
 *
 * Today's board, hand-tuned to play fair on an EMPTY start, runs 8-24. The
 * classic board reaches its cap at stage 9 - 40 apples, a snake 43 long - so
 * it carries less wall than the busiest daily board while the snake fills a
 * sixth of the floor: 289 - 18 - 43 leaves 79% of it open. Much more and the
 * no-touch rule starts refusing pieces; the property test measures that
 * placement still succeeds right up to the cap.
 */
export const WALL_CAP = 18;

/**
 * Piece sizes dropped on ENTERING a stage: 2 blocks at stage 2, a bar of 3 at
 * stage 3, then one piece a stage, a bar of 2 and a bar of 3 in turn, until
 * `WALL_CAP` trims the last one short.
 */
export function piecesFor(stage: number): number[] {
  if (stage < 2) return [];
  if (stage === 2) return [1, 1];
  if (stage === 3) return [3];
  return [stage % 2 === 0 ? 2 : 3];
}

const DELTA: Record<Dir, [number, number]> = { up: [0, -1], down: [0, 1], left: [-1, 0], right: [1, 0] };
const TRIES = 300;

/** Cells no new wall may take: the body, the apple, round the head, and 3 ahead. */
function keepOut(s: SnakeState): Set<number> {
  const { cols, rows } = s;
  const out = new Set<number>();
  const add = (x: number, y: number) => {
    if (x >= 0 && y >= 0 && x < cols && y < rows) out.add(y * cols + x);
  };
  for (const p of s.body) add(p.x, p.y);
  add(s.food.x, s.food.y);
  const h = s.body[0];
  for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) add(h.x + dx, h.y + dy);
  // Both the way it is going and the way it has been told to go next.
  for (const d of new Set([s.dir, s.pendingDir])) {
    for (let k = 1; k <= 3; k++) add(h.x + DELTA[d][0] * k, h.y + DELTA[d][1] * k);
  }
  return out;
}

/**
 * The walls for the stage `state.score` is on, added to what is already
 * there. Call it once, on the step that ENTERS the stage. Returns the new
 * state and the cells it added, which the scene flashes.
 */
export function addStageWalls(state: SnakeState, rng: () => number): { state: SnakeState; added: number[] } {
  const { cols, rows } = state;
  const n = cols * rows;
  const walls = new Set(state.walls);
  const banned = keepOut(state);
  const added: number[] = [];
  for (const want of piecesFor(stageOf(state.score))) {
    const size = Math.min(want, WALL_CAP - walls.size);
    if (size <= 0) break;
    for (let t = 0; t < TRIES; t++) {
      const across = rng() < 0.5;
      const ox = Math.floor(rng() * cols);
      const oy = Math.floor(rng() * rows);
      const cells: number[] = [];
      for (let k = 0; k < size; k++) {
        const x = ox + (across ? k : 0);
        const y = oy + (across ? 0 : k);
        const i = y * cols + x;
        if (x >= cols || y >= rows || banned.has(i) || walls.has(i) || touchesWall(i, walls, cols, rows)) break;
        cells.push(i);
      }
      if (cells.length !== size) continue;
      const next = new Set([...walls, ...cells]);
      if (!allConnected(next, n, cols, rows) || hasDeadEnd(next, n, cols, rows)) continue;
      for (const i of cells) (walls.add(i), added.push(i));
      break;
    }
  }
  if (!added.length) return { state, added };
  return { state: { ...state, walls: [...walls].sort((a, b) => a - b) }, added };
}
