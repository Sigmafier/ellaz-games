// The Rocks map: a few small clusters of rock on the board (forum review, "a
// hard map with a few obstacles, not too many"). Pure and seeded, like the
// rest of the rules; `rocks.test.ts` checks every promise below over hundreds
// of seeds on both boards.
//
// What a layout must be, in order:
//   - few: 6 to 10 rock cells, in clusters of 2 or 3;
//   - fair at the start: no rock within `ROCK_CLEAR` cells of any snake, and
//     none in the lane straight ahead of a start heading, so nobody is dealt a
//     rock to steer round before they have moved;
//   - one board: never a pocket sealed off. Clusters keep two clear cells
//     between them and off the edge, so they cannot wall anything in - and the
//     layout is flood-filled anyway, and re-rolled if that ever failed.
import { inside, step, type Dir, type Point, type Shape } from "./logic";

/** No rock within this many steps (Manhattan) of any start segment. */
export const ROCK_CLEAR = 3;
const MIN = 6;
const MAX = 10;
/** Clear cells kept between two clusters, and between a cluster and the edge. */
const GAP = 2;

/** The cluster shapes, as offsets: two dominoes, two bars, four corners. */
const SHAPES: readonly (readonly [number, number])[][] = [
  [[0, 0], [1, 0]],
  [[0, 0], [0, 1]],
  [[0, 0], [1, 0], [2, 0]],
  [[0, 0], [0, 1], [0, 2]],
  [[0, 0], [1, 0], [0, 1]],
  [[0, 0], [1, 0], [1, 1]],
  [[0, 0], [0, 1], [1, 1]],
  [[1, 0], [0, 1], [1, 1]],
];

type Start = { body: Point[]; dir: Dir };

/** 1 on every cell no rock may take: the edge band, near any start, or in a start's lane (three wide). */
function forbidden(shape: Shape, starts: Start[]): Uint8Array {
  const { cols, rows } = shape;
  const no = new Uint8Array(cols * rows);
  for (let y = 0; y < rows; y++)
    for (let x = 0; x < cols; x++) if (x < GAP || y < GAP || x >= cols - GAP || y >= rows - GAP) no[y * cols + x] = 1;
  for (const s of starts) {
    for (const p of s.body)
      for (let dy = -ROCK_CLEAR; dy <= ROCK_CLEAR; dy++)
        for (let dx = -ROCK_CLEAR; dx <= ROCK_CLEAR; dx++) {
          const q = { x: p.x + dx, y: p.y + dy };
          if (Math.abs(dx) + Math.abs(dy) <= ROCK_CLEAR && inside(shape, q)) no[q.y * cols + q.x] = 1;
        }
    const side = s.dir === "up" || s.dir === "down" ? { x: 1, y: 0 } : { x: 0, y: 1 };
    for (let p = step(s.body[0], s.dir); inside(shape, p); p = step(p, s.dir))
      for (const k of [-1, 0, 1]) {
        const q = { x: p.x + side.x * k, y: p.y + side.y * k };
        if (inside(shape, q)) no[q.y * cols + q.x] = 1;
      }
  }
  return no;
}

/** Can every free cell reach every other? */
export function oneBoard(shape: Shape, rocks: Point[]): boolean {
  const { cols, rows } = shape;
  const rock = new Uint8Array(cols * rows);
  for (const p of rocks) rock[p.y * cols + p.x] = 1;
  const start = rock.indexOf(0);
  const seen = new Uint8Array(cols * rows);
  const queue = [start];
  seen[start] = 1;
  let count = 1;
  while (queue.length) {
    const c = queue.pop()!;
    const x = c % cols;
    for (const n of [x > 0 ? c - 1 : -1, x < cols - 1 ? c + 1 : -1, c - cols, c + cols]) {
      if (n < 0 || n >= cols * rows || rock[n] || seen[n]) continue;
      seen[n] = 1;
      count++;
      queue.push(n);
    }
  }
  return count === cols * rows - rocks.length;
}

/** One try at a layout: clusters dropped at random until the dealt total is reached. */
function tryLayout(shape: Shape, no: Uint8Array, rng: () => number): Point[] {
  const { cols, rows } = shape;
  const target = MIN + Math.floor(rng() * (MAX - MIN + 1));
  const rocks: Point[] = [];
  for (let attempt = 0; attempt < 200 && rocks.length < target; attempt++) {
    const cells = SHAPES[Math.floor(rng() * SHAPES.length)];
    const ax = Math.floor(rng() * cols);
    const ay = Math.floor(rng() * rows);
    if (rocks.length + cells.length > MAX) continue;
    const pts = cells.map(([dx, dy]) => ({ x: ax + dx, y: ay + dy }));
    const fits = pts.every((p) => inside(shape, p) && !no[p.y * cols + p.x]);
    const apart = rocks.every((r) => pts.every((p) => Math.max(Math.abs(r.x - p.x), Math.abs(r.y - p.y)) > GAP));
    if (fits && apart) rocks.push(...pts);
  }
  return rocks;
}

/** The Rocks map for a round whose snakes start at `starts`. */
export function placeRocks(shape: Shape, starts: Start[], rng: () => number): Point[] {
  const no = forbidden(shape, starts);
  for (let i = 0; i < 50; i++) {
    const rocks = tryLayout(shape, no, rng);
    if (rocks.length >= MIN && oneBoard(shape, rocks)) return rocks;
  }
  // Fifty failed rolls means the board has no room for a fair layout: an Open
  // round is a fair round, a forced one would not be.
  return [];
}
