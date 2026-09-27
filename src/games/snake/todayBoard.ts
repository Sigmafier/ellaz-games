// Today's board: a few short walls, the same for everyone on a given day.
//
// BUILT, never scattered and hoped over - the same law as every puzzle board
// here. A piece is only accepted if the board it leaves behind still has:
//
//   1. the start zone open (the snake's row and its head's column, and the
//      cells beside the first three steps whichever way the first press
//      goes), so nobody dies before they have touched anything;
//   2. every open cell reachable from every other - no sealed room an apple
//      could land in;
//   3. no dead end - no open cell walled in on three sides, the one shape a
//      snake cannot leave once it has entered.
//
// Pure and seeded: the caller passes `ctx.daily.rng()`, so a date is a board.
// `today-board.test.ts` checks all three on a whole year of days.

import { newGame, type SnakeState } from "./logic";

/**
 * A fresh board of either kind, and where its apples come from.
 *
 * Today's board takes ONE generator for the whole run - walls first, then
 * every apple - so the same day is the same board AND the same apples on every
 * device. The classic board keeps Math.random, exactly as before.
 */
export function dealBoard(
  mode: "classic" | "today",
  dailyRng: () => () => number,
  cols: number,
  rows: number,
): { state: SnakeState; foodRng: () => number } {
  if (mode !== "today") return { state: newGame(cols, rows), foodRng: Math.random };
  const rng = dailyRng();
  return { state: newGame(cols, rows, rng, buildWalls(cols, rows, rng)), foodRng: rng };
}

/** Cells that must stay open, as `y * cols + x`. Exported for the test. */
export function SPAWN_CLEAR(cols: number, rows: number): number[] {
  const cx = Math.floor(cols / 2);
  const cy = Math.floor(rows / 2);
  const out = new Set<number>();
  const add = (x: number, y: number) => {
    if (x >= 0 && y >= 0 && x < cols && y < rows) out.add(y * cols + x);
  };
  // The whole row the snake starts on: a player who does not turn at once
  // still gets the full width before anything is in the way.
  for (let x = 0; x < cols; x++) add(x, cy);
  // And the rows either side, around the head, so the first turn is free.
  for (const y of [cy - 1, cy + 1]) for (let x = cx - 3; x <= cx + 3; x++) add(x, y);
  // Since 2026-09-27 the snake waits for the player's first direction, and a
  // backwards press turns it round (`launch` in flow.ts). So the same promise
  // holds all four ways: the whole line ahead to the edge, and a free first
  // turn beside each of its first 3 cells. Right and left run along the row
  // (left from the tail, which becomes the head); up and down along the
  // head's column.
  const starts: [number, number, number, number][] = [
    [cx, cy, 1, 0],
    [cx - 2, cy, -1, 0],
    [cx, cy, 0, -1],
    [cx, cy, 0, 1],
  ];
  for (const [hx, hy, dx, dy] of starts) {
    for (let k = 1; hx + dx * k >= 0 && hy + dy * k >= 0 && hx + dx * k < cols && hy + dy * k < rows; k++) {
      add(hx + dx * k, hy + dy * k);
      if (k <= 3) for (const side of [-1, 1]) add(hx + dx * k + dy * side, hy + dy * k + dx * side);
    }
  }
  return [...out];
}

/** The pieces a wall is made of, as offsets from its first cell. */
const PIECES: readonly (readonly [number, number])[][] = [
  [[0, 0], [1, 0]],
  [[0, 0], [1, 0], [2, 0]],
  [[0, 0], [0, 1]],
  [[0, 0], [0, 1], [0, 2]],
  [[0, 0], [1, 0], [0, 1]],
  [[0, 0], [1, 0], [1, 1]],
];

const TARGET_MIN = 8;
const TARGET_MAX = 24;
const TRIES = 400;

export function buildWalls(cols: number, rows: number, rng: () => number): number[] {
  const n = cols * rows;
  const clear = new Set(SPAWN_CLEAR(cols, rows));
  const walls = new Set<number>();
  // 5-7 pieces, chosen by the day, placed until the count is reached or the
  // tries run out. A rejected piece costs a try and nothing else.
  const want = 5 + Math.floor(rng() * 3);
  let placed = 0;
  for (let t = 0; t < TRIES && placed < want; t++) {
    const shape = PIECES[Math.floor(rng() * PIECES.length)];
    const ox = Math.floor(rng() * cols);
    const oy = Math.floor(rng() * rows);
    const cells: number[] = [];
    let fits = true;
    for (const [dx, dy] of shape) {
      const x = ox + dx;
      const y = oy + dy;
      if (x < 0 || y < 0 || x >= cols || y >= rows) { fits = false; break; }
      const i = y * cols + x;
      if (clear.has(i) || walls.has(i) || touchesWall(i, walls, cols, rows)) { fits = false; break; }
      cells.push(i);
    }
    if (!fits || walls.size + cells.length > TARGET_MAX) continue;
    const next = new Set([...walls, ...cells]);
    // Measured 2026-09-27: with pieces that never touch and no dead end
    // allowed, a sealed room cannot form, so removing `allConnected` changes
    // no board in a year of days. It stays as the direct check of the property
    // anyway - the day a longer piece is added, that stops being true.
    if (!allConnected(next, n, cols, rows) || hasDeadEnd(next, n, cols, rows)) continue;
    for (const i of cells) walls.add(i);
    placed++;
  }
  // A day whose tries all failed would be a near-empty board. Top it up from
  // the pieces that fit, so every day is a board and not a scatter.
  for (let t = 0; walls.size < TARGET_MIN && t < TRIES; t++) {
    const i = Math.floor(rng() * n);
    if (clear.has(i) || walls.has(i) || touchesWall(i, walls, cols, rows)) continue;
    const next = new Set([...walls, i]);
    if (allConnected(next, n, cols, rows) && !hasDeadEnd(next, n, cols, rows)) walls.add(i);
  }
  return [...walls].sort((a, b) => a - b);
}

function neighbours(i: number, cols: number, rows: number): number[] {
  const x = i % cols;
  const y = Math.floor(i / cols);
  const out: number[] = [];
  if (x > 0) out.push(i - 1);
  if (x < cols - 1) out.push(i + 1);
  if (y > 0) out.push(i - cols);
  if (y < rows - 1) out.push(i + cols);
  return out;
}

/** A new piece may not touch another piece, diagonals included, so pieces stay pieces. */
export function touchesWall(i: number, walls: Set<number>, cols: number, rows: number): boolean {
  const x = i % cols;
  const y = Math.floor(i / cols);
  for (let dy = -1; dy <= 1; dy++)
    for (let dx = -1; dx <= 1; dx++) {
      const nx = x + dx;
      const ny = y + dy;
      if ((dx || dy) && nx >= 0 && ny >= 0 && nx < cols && ny < rows && walls.has(ny * cols + nx)) return true;
    }
  return false;
}

export function allConnected(walls: Set<number>, n: number, cols: number, rows: number): boolean {
  let start = -1;
  let open = 0;
  for (let i = 0; i < n; i++) if (!walls.has(i)) (open++, start < 0 && (start = i));
  const seen = new Set([start]);
  const queue = [start];
  while (queue.length) {
    for (const nb of neighbours(queue.pop()!, cols, rows)) {
      if (!walls.has(nb) && !seen.has(nb)) {
        seen.add(nb);
        queue.push(nb);
      }
    }
  }
  return seen.size === open;
}

export function hasDeadEnd(walls: Set<number>, n: number, cols: number, rows: number): boolean {
  for (let i = 0; i < n; i++) {
    if (walls.has(i)) continue;
    const open = neighbours(i, cols, rows).filter((nb) => !walls.has(nb)).length;
    if (4 - open >= 3) return true;
  }
  return false;
}
