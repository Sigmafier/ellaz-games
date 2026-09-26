// Bubble Shooter — PURE rules. No DOM, no React, no canvas, no engine.
//
// Modules are imported by DIRECT path, never through the `@shared` barrel: the
// barrel re-exports `Prompt` and `winMoment`, which pull React and the portal
// in, and `src/games/logic-is-pure.test.ts` fails the build on it.
//
// ─────────────────────────────────────────────────────────────────────────────
// THE TRAJECTORY IS COMPUTED HERE, NOT IN THE RENDERER — AND THAT IS THE WHOLE
// REASON THIS GAME NEEDS NO ENGINE.
//
// The obvious shape for a shooter is a physics loop: advance the ball every
// frame, test collisions every frame, decide where it landed when it stops. It
// works, and it drags in everything an engine exists to provide — a fixed
// timestep, a broadphase, a frame budget — plus the display-rate trap in
// `.claude/rules/fixed-timestep-must-match-display.md`, where a 60 Hz step on a
// 120 Hz screen freezes every second frame.
//
// `aim()` instead solves the shot ONCE, at the moment of firing, and returns a
// POLYLINE: launcher → wall bounce → wall bounce → the exact centre of the cell
// the bubble ends in. The renderer then does nothing but interpolate along that
// line by wall-clock elapsed time. So:
//
//   · the outcome cannot depend on frame rate, frame drops, or a backgrounded
//     tab, because no frame ever decides anything;
//   · the same polyline drawn dashed and dimmed IS the aiming guide, so what a
//     player is shown and where the bubble goes are one computation rather than
//     two that can disagree;
//   · every collision case is unit-testable in node, with no canvas at all.
//
// The march below is a fine-grained sweep rather than closed-form reflection
// because the field is not a plain box: a bubble can meet a wall and a bubble
// in the same step, and the first thing it meets is the thing that matters.
// ─────────────────────────────────────────────────────────────────────────────
import { mulberry32, seedFrom } from "@shared/rng";

/** The three rungs every game in this catalogue offers. */
export type Difficulty = "easy" | "medium" | "hard";
export const DIFFICULTIES: readonly Difficulty[] = ["easy", "medium", "hard"] as const;

export interface LevelSpec {
  /** How many bubble colours are in play. The single biggest difficulty lever. */
  colors: number;
  /** Rows dealt at the top of a fresh board. */
  startRows: number;
  /** Shots between one ceiling advance and the next. */
  shotsPerPush: number;
}

export const LEVELS: Record<Difficulty, LevelSpec> = {
  easy: { colors: 4, startRows: 4, shotsPerPush: 12 },
  medium: { colors: 5, startRows: 5, shotsPerPush: 9 },
  hard: { colors: 6, startRows: 6, shotsPerPush: 6 },
};

/* ─────────────────────────────────────────────────────────────────────────────
   GEOMETRY, in BUBBLE UNITS: one bubble is exactly 1.0 across.
   The renderer multiplies by a pixel scale and never does trigonometry of its
   own, so a board at 320px and the same board at 700px are the same game.
   ───────────────────────────────────────────────────────────────────────────*/

/**
 * Bubbles in a WIDE row ON A PHONE, and the default everywhere. An offset row
 * holds one fewer.
 *
 * THE WIDTH IS A PROPERTY OF THE RUN, NEVER A MODULE CONSTANT (operator ruling
 * 2026-09-22: "it should be much wider, full screen exp, all the width"). A
 * media query can change how big a box is DRAWN and cannot change how many
 * bubbles of floor the game has, so the column count is chosen once at mount,
 * written onto the state, and handed to every geometry call. `COLS` is what a
 * phone run gets, byte for byte, and what a state with no `cols` falls back to.
 *
 * Only the WIDTH moves. `FIELD_ROWS`, `DEATH_ROW` and `ROW_H` are the same on
 * every screen, so the vertical game - how deep the board is, how far a push
 * advances, where the run ends - is untouched by the shape.
 */
export const COLS = 10;
/** Vertical distance between rows in a hex packing: √3/2, not 1. */
export const ROW_H = Math.sqrt(3) / 2;
/** Rows the grid can address at all, 0 .. FIELD_ROWS-1. */
export const FIELD_ROWS = 13;
/** A bubble that comes to rest on this row (or below) ends the run. */
export const DEATH_ROW = 12;
/** Clear space under the last playable row, where the launcher sits. */
const LAUNCH_GAP = 1.55;

/** Field width in bubble units, for a run of `cols` columns. */
export function fieldW(cols: number): number {
  return cols;
}
/** Field height in bubble units, launcher included. The SAME on every screen. */
export const FIELD_H = 1 + DEATH_ROW * ROW_H + LAUNCH_GAP;
/** Where the launcher sits. Everything is fired from exactly here. */
export function launcher(cols: number): Point {
  return { x: fieldW(cols) / 2, y: FIELD_H - 0.8 };
}
/** The line a bubble must not settle on or past, in units. */
export const DEATH_Y = 0.5 + DEATH_ROW * ROW_H;

/**
 * A bubble must stay big enough for a finger, so the width is capped by the
 * box rather than by taste.
 *
 * 34, and it is MEASURED rather than picked: the smallest bubble this game has
 * ever shipped is on the narrowest phone we support, where the board is
 * `min(94vw, ...)` - 338px across ten columns on a 360px screen, so 33.8px.
 * That is the bubble a five-year-old was judged on, so it is the floor. A
 * bigger number would be a new opinion about touch targets dressed up as a
 * constraint, and this file is not where that belongs.
 */
const MIN_BUBBLE_PX = 34;
/**
 * The widest field, whatever the screen: 4:3, which is 17 columns against
 * `FIELD_H`.
 *
 * MEASURED FROM THE GENRE, not chosen. The operator pointed at
 * bubbleshooter.com, and its play box is 1020x765 at 1920x1080 and 846x635 at
 * 1536x639 - the same 1.33 both times, at ~53% of the screen. So the shape this
 * game is expected to have is landscape 4:3, not the 2.55:1 strip that "all the
 * width" read as on its own. 17 x FIELD_H is 1.31, the nearest whole column.
 *
 * At this cap our board is BIGGER than the one that set it - 1072x816 against
 * their 1020x765 at the same window - so matching the shape costs nothing and
 * the bubbles come out 63px.
 *
 * The cap is also what keeps the rest honest: `pickColor` draws from the
 * colours on the board and `shotsFor` scales the push cadence, so the game
 * stays fair at any width, but a row nobody can read at a glance is a different
 * game and the aim arc (`MAX_ANGLE`) cannot reach the far corners of one.
 */
export const MAX_COLS = 17;

/**
 * How many columns a box of this size should hold.
 *
 * `.ellaz-board` sizes a PC board as `min(room, height x ratio)`. Choosing the
 * ratio to BE the box's ratio makes those two terms equal, so the board fills
 * the box across AND down instead of leaving one axis short - which is the
 * whole of the operator's ask. Pure, so `field-width.test.ts` can drive it.
 */
export function colsForBox(boxW: number, boxH: number): number {
  // FINITE, not merely positive: `Infinity > 0` is true, and Infinity/Infinity is
  // NaN, which survives Math.min and Math.max and would deal rows of length NaN.
  // Found by /deep-test (2026-09-23) with a hostile-number sweep; no caller can
  // produce it today, since the box is window dimensions less parsed CSS lengths.
  if (!Number.isFinite(boxW) || !Number.isFinite(boxH) || boxW <= 0 || boxH <= 0) return COLS;
  // A board is `min(room, height x ratio)`. When the HEIGHT term binds, the
  // bubble is `boxH / FIELD_H` WHATEVER the column count is - so widening a
  // height-bound board makes it wider and its bubbles no smaller, and a finger
  // floor gating the widening there would refuse a free win. (It did: measured
  // at 1536x639, ten columns and thirty-one both draw a 29.7px bubble.)
  //
  // The floor belongs on the other arm, where the ROOM binds and the bubble
  // really is `room / cols`. `byFinger` is that, and it is the only guard the
  // size needs.
  const wanted = Math.round((boxW / boxH) * FIELD_H);
  const byFinger = Math.floor(boxW / MIN_BUBBLE_PX);
  return Math.max(COLS, Math.min(MAX_COLS, wanted, byFinger));
}

/**
 * Which side of the board this game's own controls should sit on, and how wide
 * the field can then be. Both arms MEASURED rather than assumed, because which
 * one wins is a property of the WINDOW and not of the game.
 *
 * Under the board the controls cost their own height and give back the two side
 * columns' width. That is a clear win when the board is ROOM-bound - the width
 * is what it was short of. It is a clear LOSS when the board is HEIGHT-bound,
 * because then the width is derived from the height and the controls have just
 * taken some: measured on the operator's own 1536x639, under gives 793px of
 * board with 23px bubbles and beside gives 1009px with 30px bubbles, so beside
 * wins on both axes and only the controls' position is worse.
 *
 * So the rule is not "a wide field means controls underneath", and it is not
 * "take the wider board" either - width alone picks `under` at 1536x639, where
 * it buys 21% more width and pays 21% smaller bubbles. It is: take the arm with
 * the bigger BOARD, area and all, which is how much game there is to look at.
 *
 * Re-derived at the 4:3 cap (2026-09-23), both arms, every window this repo
 * sizes against:
 *
 *     window        beside                   under                    picked
 *     1920x1080     17 cols 1072x816 bub 63  17 cols  976x743 bub 57  beside
 *     1680x1050     14 cols  832x769 bub 59  17 cols  937x713 bub 55  under
 *     1536x695      17 cols  578x440 bub 34  17 cols  470x358 bub 28  beside
 *     1536x639      17 cols  504x384 bub 30  17 cols  397x302 bub 23  beside
 *     1440x900      14 cols  698x645 bub 50  17 cols  740x563 bub 44  beside
 *     1280x800      15 cols  618x533 bub 41  17 cols  608x463 bub 36  beside
 *
 * BESIDE wins almost everywhere once the field is capped, and that is the cap
 * doing its job rather than a contradiction: a 4:3 board stops being room-bound
 * long before it runs out of middle column, so the height the controls would
 * take under it is height the board was going to use. Under still wins at
 * 1680x1050, which is why this stays a function.
 *
 * Both arms are recomputed whenever the cap moves. A table like this one is a
 * measurement with a date on it, and the first version of it was already false
 * the moment MAX_COLS changed.
 */
export function pcPlan(roomBeside: number, roomUnder: number, boxBeside: number, boxUnder: number): {
  cols: number;
  under: boolean;
} {
  const arm = (room: number, box: number) => {
    const cols = colsForBox(room, box);
    const w = Math.min(room, (box * cols) / FIELD_H);
    // The height follows the width through the field's own ratio, so this is
    // the board as it will really be drawn rather than the box it sits in.
    return { cols, area: w * ((w * FIELD_H) / cols) };
  };
  const beside = arm(roomBeside, boxBeside);
  const under = arm(roomUnder, boxUnder);
  return under.area > beside.area ? { cols: under.cols, under: true } : { cols: beside.cols, under: false };
}

/**
 * The width a SAVED board was played at, or null when the save's value is not one.
 *
 * ABSENT READS AS `COLS`, and that is not leniency. Every save written before the
 * width existed (before 2026-09-23 07:09Z) has no `cols` - and it IS a phone-width
 * board, which its own row lengths prove. The first version of the validator read
 * a missing `cols` as corruption, so every one of those saves was discarded on the
 * next visit, on a PHONE too, where nothing about the game had changed. Reproduced
 * on the live site with a restore control; `logic.test.ts` pins both halves.
 *
 * A PC run still discards an old save, correctly and elsewhere: the resume guard
 * compares widths, and a 10-wide board is not the 17-wide field that PC now deals.
 */
export function savedCols(cols: unknown): number | null {
  if (cols === undefined) return COLS;
  return typeof cols === "number" && Number.isInteger(cols) && cols >= COLS && cols <= MAX_COLS ? cols : null;
}

/**
 * Shots between one ceiling advance and the next, for a field this wide.
 *
 * SCALED, and that is the line between widening the field and making the game
 * easier. A push deals ONE ROW, so a 33-wide field is handed 3.3x the bubbles a
 * phone is - and if the cadence stayed at the phone's number the board would
 * fill 3.3x faster. Scaling it keeps bubbles-added-per-shot identical on every
 * screen, so the shape changes and the difficulty does not
 * (`.claude/rules/game-controls-and-platform-chrome-never-share-a-bar.md` -
 * "a difficulty change smuggled in as a layout one").
 */
export function shotsFor(level: Difficulty, cols: number): number {
  return Math.max(1, Math.round((LEVELS[level].shotsPerPush * cols) / COLS));
}

/**
 * How far off vertical a shot may be aimed, in radians (~78°).
 *
 * Not 90°: a horizontal shot never rises, so it bounces between the two walls
 * until the step guard stops it — a shot that visibly does nothing. The clamp
 * is the difference between "you cannot aim there" and "that aim is broken".
 */
export const MAX_ANGLE = 1.36;

/** Centre-to-centre distance below which a flying bubble has hit a resting one. */
const HIT_DIST = 0.92;

/**
 * The same distance while the bubble is SQUEEZING through a gap.
 *
 * WHY THIS NUMBER EXISTS AT ALL. A resting bubble is 1.0 wide and so is a
 * flying one, so the hole left by one missing bubble is a ZERO-CLEARANCE fit:
 * geometrically a bubble can pass through it, and only if its centre crosses
 * within a hair of dead centre. Measured on the shipped build before this
 * changed (`scripts/repro/bubbleshooter-squeeze-window.mts`, controls passing):
 * the widest angle window that got past a one-cell gap was **19.04 mrad, 0.70%
 * of the aim arc, about 2.5 px of finger travel on a 360 px drag**. So the move
 * was legal and nobody could do it on purpose, which is what a player reported
 * (issue #29).
 *
 * NOT A SMALLER `HIT_DIST`. Lowering that would loosen every collision on the
 * board at once and let bubbles tunnel into walls they should stick to. This
 * one applies ONLY inside a corridor - an empty cell with another empty cell
 * one bubble-width ahead along the flight - so a bubble with somewhere to go
 * squashes through, and a bubble with a wall in front of it still sticks.
 *
 * THE VALUE WAS SWEPT, NOT PICKED. Same probe, same board, one value per run
 * (2026-09-05, this tree):
 *
 *     0.92  19.04 mrad   2.5 px    <- identical to the shipped build, which is
 *     0.85  36.04 mrad   4.8 px       also the proof the corridor changed
 *     0.80  48.21 mrad   6.4 px       nothing else: at reach == HIT_DIST the
 *     0.75  60.38 mrad   8.0 px       old numbers come back exactly
 *     0.68  77.45 mrad  10.3 px
 *     0.66  82.35 mrad  10.9 px
 *     0.64  87.18 mrad  11.5 px    <- here
 *     0.60  96.90 mrad  12.8 px
 *
 * The criterion is NOT "feels about right". The aim nudge buttons step
 * `KEY_STEP * 2` = 80 mrad, and the renderer's own comment says those buttons
 * plus Shoot are "a complete way to play the game" - so a window NARROWER than
 * one step is a move only a dragging finger can make, and the button path
 * silently stops being complete. 87.18 mrad is 1.09 steps: whatever angle a gap
 * sits at, at least one reachable angle lands inside it. That is a property, and
 * `a-gap-must-be-threadable-on-purpose.test.ts` holds it.
 *
 * The DRAWN squash is 30% and the reach implies more; the picture is the idea
 * and this number is the rule, which is the ordinary arcade bargain. Said out
 * loud here rather than left for someone to discover.
 */
export const SQUEEZE_DIST = 0.64;
/** March resolution. Small enough that a bubble cannot tunnel a 1.0-wide target. */
const STEP = 0.02;

export interface Cell {
  row: number;
  col: number;
}
export interface Point {
  x: number;
  y: number;
}

/** Is this row shifted half a bubble to the right? */
export function isOffset(row: number, shift: 0 | 1): boolean {
  return (row + shift) % 2 === 1;
}

/** How many bubbles this row can hold. Offset rows hold one fewer. */
export function rowWidth(row: number, shift: 0 | 1, cols: number): number {
  return isOffset(row, shift) ? cols - 1 : cols;
}

/** The centre of a cell, in bubble units. */
export function cellCenter(row: number, col: number, shift: 0 | 1): Point {
  return { x: col + 0.5 + (isOffset(row, shift) ? 0.5 : 0), y: 0.5 + row * ROW_H };
}

/**
 * The six cells touching this one.
 *
 * The parity term is the whole function, and getting it backwards is the
 * silent bug this game can have: matches and floaters are both flood fills over
 * this list, so a wrong diagonal makes groups fail to pop and hanging clusters
 * fail to fall, with no error anywhere and a board that merely feels unfair.
 * `logic.test.ts` pins it by SYMMETRY — if a is a neighbour of b, b must be a
 * neighbour of a — which is a property no hand-written table satisfies by luck.
 */
export function neighbors(row: number, col: number, shift: 0 | 1, cols: number): Cell[] {
  const d = isOffset(row, shift) ? 0 : -1;
  const out: Cell[] = [];
  const push = (r: number, c: number) => {
    if (r < 0 || r >= FIELD_ROWS) return;
    if (c < 0 || c >= rowWidth(r, shift, cols)) return;
    out.push({ row: r, col: c });
  };
  push(row, col - 1);
  push(row, col + 1);
  push(row - 1, col + d);
  push(row - 1, col + d + 1);
  push(row + 1, col + d);
  push(row + 1, col + d + 1);
  return out;
}

/* ─────────────────────────────────────────────────────────────────────────── */

export interface ShooterState {
  level: Difficulty;
  /** Bubbles in a wide row FOR THIS RUN. `COLS` on a phone, wider on a PC.
   *  Written once at mount and carried in the save, so a resumed board is the
   *  shape it was played at rather than the shape this screen would pick. */
  cols: number;
  /** rows[r][c] — a colour index, or null for an empty cell. */
  rows: (number | null)[][];
  /** Parity of row 0. Flips on every ceiling advance, which is what keeps the
   *  rows already on the board sitting exactly where they were. */
  shift: 0 | 1;
  /** The colour loaded in the launcher. */
  current: number;
  /** The colour on deck, shown beside the launcher. */
  next: number;
  /** Shots remaining before the ceiling advances. */
  shotsLeft: number;
  score: number;
  /** Boards cleared this run. A cleared board deals a fresh one. */
  boards: number;
  dead: boolean;
}

export const POP_POINTS = 10;
/**
 * A bubble knocked loose is worth double a bubble popped.
 *
 * The rule is the game's whole strategy in one number: three of a colour is
 * always available and always worth 30, so without it there is no reason ever
 * to aim anywhere in particular. Cutting the support out from under a cluster
 * is the shot worth looking for, and the score has to say so.
 */
export const DROP_POINTS = 20;

/** Colours currently resting on the board, ascending. */
export function boardColors(state: ShooterState): number[] {
  const seen = new Set<number>();
  for (const row of state.rows) for (const c of row) if (c !== null) seen.add(c);
  return [...seen].sort((a, b) => a - b);
}

/**
 * The colour to load next.
 *
 * ALWAYS drawn from what is actually on the board. Drawing from the level's
 * full palette instead is the classic unfairness in this genre: the last two
 * greens are gone, the launcher keeps handing you green, and every shot makes
 * the board worse with no move that could have been better. Falling back to the
 * palette only when the board is empty keeps that impossible.
 */
export function pickColor(state: ShooterState, rng: () => number): number {
  const live = boardColors(state);
  const pool = live.length > 0 ? live : Array.from({ length: LEVELS[state.level].colors }, (_, i) => i);
  return pool[Math.floor(rng() * pool.length)] ?? 0;
}

function emptyRows(shift: 0 | 1, cols: number): (number | null)[][] {
  return Array.from({ length: FIELD_ROWS }, (_, r) =>
    Array.from({ length: rowWidth(r, shift, cols) }, () => null as number | null),
  );
}

/** Deal the opening rows of a board at `level`, leaving everything below empty. */
function dealRows(level: Difficulty, shift: 0 | 1, rng: () => number, cols: number): (number | null)[][] {
  const spec = LEVELS[level];
  const rows = emptyRows(shift, cols);
  for (let r = 0; r < spec.startRows; r++) {
    for (let c = 0; c < rows[r].length; c++) {
      rows[r][c] = Math.floor(rng() * spec.colors);
    }
  }
  return rows;
}

export function newGame(
  level: Difficulty,
  rng: () => number = Math.random,
  cols: number = COLS,
): ShooterState {
  const shift: 0 | 1 = 0;
  const state: ShooterState = {
    level,
    cols,
    rows: dealRows(level, shift, rng, cols),
    shift,
    current: 0,
    next: 0,
    shotsLeft: shotsFor(level, cols),
    score: 0,
    boards: 0,
    dead: false,
  };
  state.current = pickColor(state, rng);
  state.next = pickColor(state, rng);
  return state;
}

/** A board for a seed — used by the tests and by anything wanting a replay. */
export function seededGame(level: Difficulty, seed: string, cols: number = COLS): ShooterState {
  return newGame(level, mulberry32(seedFrom(seed)), cols);
}

/* ─────────────────────────────────────────────────────────────────────────────
   THE SHOT
   ───────────────────────────────────────────────────────────────────────────*/

export interface Shot {
  /** Launcher → each wall bounce → the centre of the cell it lands in. */
  path: Point[];
  /** Where it comes to rest. `null` only if the field has no room at all. */
  cell: Cell | null;
  /** True when the bubble reached the ceiling without meeting anything. */
  ceiling: boolean;
  /**
   * The middle of each gap this shot squeezed through, in flight order.
   *
   * One point per contiguous squeeze rather than one per march step, so a
   * renderer can squash the bubble AROUND each of them without walking 50
   * near-identical coordinates. Empty on the overwhelming majority of shots.
   */
  squeezes: Point[];
}

/** Is anything resting at this cell? */
export function at(state: ShooterState, row: number, col: number): number | null {
  if (row < 0 || row >= FIELD_ROWS) return null;
  const line = state.rows[row];
  if (!line || col < 0 || col >= line.length) return null;
  return line[col];
}

/**
 * The empty cell a bubble stopping at `pos` belongs in.
 *
 * Nearest-centre, restricted to cells that are either on the ceiling row or
 * touching something already resting. Without that restriction a bubble grazing
 * a cluster can snap into a cell hanging in mid-air, which then reads as a bug
 * in the floater check rather than in the snap.
 */
function snapCell(state: ShooterState, pos: Point): Cell | null {
  let best: Cell | null = null;
  let bestD = Infinity;
  const r0 = Math.max(0, Math.floor((pos.y - 0.5) / ROW_H) - 1);
  const r1 = Math.min(FIELD_ROWS - 1, r0 + 3);
  for (let r = r0; r <= r1; r++) {
    for (let c = 0; c < rowWidth(r, state.shift, state.cols); c++) {
      if (at(state, r, c) !== null) continue;
      const anchored =
        r === 0 ||
        neighbors(r, c, state.shift, state.cols).some((n) => at(state, n.row, n.col) !== null);
      if (!anchored) continue;
      const p = cellCenter(r, c, state.shift);
      const d = (p.x - pos.x) ** 2 + (p.y - pos.y) ** 2;
      if (d < bestD) {
        bestD = d;
        best = { row: r, col: c };
      }
    }
  }
  return best;
}

/** The cell a point falls in, or null when it is off the field. */
function cellAtPoint(state: ShooterState, x: number, y: number): Cell | null {
  const row = Math.round((y - 0.5) / ROW_H);
  if (row < 0 || row >= FIELD_ROWS) return null;
  const col = Math.round(x - 0.5 - (isOffset(row, state.shift) ? 0.5 : 0));
  if (col < 0 || col >= rowWidth(row, state.shift, state.cols)) return null;
  return { row, col };
}

/**
 * Is there room to keep going one bubble-width ahead?
 *
 * Half of the corridor test. On its own it is true across most of an empty
 * field, which is exactly why it is not the whole test - see `aim()`, where it
 * is paired with "and the bubble in my way is one of the two forming this gap".
 * The first version of this shipped without that pairing and reported a squeeze
 * on a bubble flying up an empty board.
 *
 * The ceiling is deliberately not room - a bubble that reaches row 0 has
 * arrived, and squeezing there would put it off the top of the board. Measured
 * to be unreachable in practice (the ceiling check in `aim()` fires first); it
 * stays as a statement of intent, not as protection. See `aim()`.
 */
function roomAhead(state: ShooterState, x: number, y: number, dx: number, dy: number): boolean {
  const ay = y + dy;
  if (ay <= 0.5) return false;
  const ahead = cellAtPoint(state, x + dx, ay);
  return ahead !== null && at(state, ahead.row, ahead.col) === null;
}

/**
 * Solve a shot at `angle` (0 = straight up, positive = clockwise/right).
 *
 * Pure and total: it always terminates, and it returns the same answer for the
 * same board and angle every time. The renderer calls it twice with the same
 * arguments — once to draw the aiming guide, once to fire — and relies on both
 * answers being identical.
 */
export function aim(state: ShooterState, angle: number): Shot {
  const a = Math.max(-MAX_ANGLE, Math.min(MAX_ANGLE, angle));
  let dx = Math.sin(a);
  let dy = -Math.cos(a);
  const launch = launcher(state.cols);
  let x = launch.x;
  let y = launch.y;
  const path: Point[] = [{ x, y }];

  const minX = 0.5;
  const maxX = fieldW(state.cols) - 0.5;
  // Bounded twice over: by the number of wall bounces and by total distance.
  // A shot clamped just inside horizontal still rises, so the distance guard is
  // what makes this total rather than merely usually-terminating.
  let bounces = 0;
  const maxSteps = Math.ceil((FIELD_H + fieldW(state.cols)) * 12 / STEP);

  // Where the bubble squashed through a gap. Collected as RUNS and reduced to
  // one midpoint each, so a renderer gets one place to squash rather than fifty.
  const squeezes: Point[] = [];
  let runFrom: Point | null = null;
  let runTo: Point | null = null;
  const closeRun = () => {
    if (runFrom && runTo) {
      squeezes.push({ x: (runFrom.x + runTo.x) / 2, y: (runFrom.y + runTo.y) / 2 });
    }
    runFrom = null;
    runTo = null;
  };
  const done = (cell: Cell | null, ceiling: boolean): Shot => {
    closeRun();
    return { path: finish(path, cell, state), cell, ceiling, squeezes };
  };

  for (let i = 0; i < maxSteps; i++) {
    x += dx * STEP;
    y += dy * STEP;

    if (x < minX || x > maxX) {
      x = x < minX ? 2 * minX - x : 2 * maxX - x;
      dx = -dx;
      path.push({ x, y });
      if (++bounces > 10) break;
    }

    // The ceiling. Row 0 is the only place a bubble can rest unsupported.
    if (y <= 0.5) {
      return done(snapCell(state, { x, y: 0.5 }), true);
    }

    // Am I inside an empty cell with somewhere to go?
    //
    // WHICH HALF OF THIS ACTUALLY DECIDES ANYTHING, measured over 120 real
    // boards x 601 angles = 47,621,280 march steps, with a positive control
    // (1,824,400 steps where the reach genuinely decided the answer, so the
    // probe was looking in the right place):
    //
    //   roomAhead                                    LOAD-BEARING - forcing it
    //                                                true reds two test cells
    //   at(here) === null                            0 steps could differ
    //   the `ay <= 0.5` ceiling guard inside it      0 steps could differ
    //
    // The last two are kept because they are what "inside a gap" MEANS, not
    // because they protect anything - the hex packing already guarantees both.
    // Said out loud so nobody later cites them as the thing keeping this safe
    // (`an-armed-lever-with-no-caller-reads-as-yes.md`).
    const here = cellAtPoint(state, x, y);
    const inGap =
      here !== null &&
      at(state, here.row, here.col) === null &&
      roomAhead(state, x, y, dx, dy);

    // Anything resting nearby. Only the three rows around this height can be
    // within a bubble's width, so the sweep stays O(1) per step.
    const nearRow = Math.round((y - 0.5) / ROW_H);
    let squeezing = false;
    for (let r = Math.max(0, nearRow - 1); r <= Math.min(FIELD_ROWS - 1, nearRow + 1); r++) {
      const w = rowWidth(r, state.shift, state.cols);
      const c0 = Math.max(0, Math.floor(x) - 2);
      const c1 = Math.min(w - 1, Math.ceil(x) + 1);
      for (let c = c0; c <= c1; c++) {
        if (at(state, r, c) === null) continue;
        const p = cellCenter(r, c, state.shift);
        const d2 = (p.x - x) ** 2 + (p.y - y) ** 2;
        if (d2 >= HIT_DIST * HIT_DIST) continue;

        // Close enough to touch. Not in a gap with room ahead means a wall,
        // and a wall stops the shot at full reach.
        //
        // This deliberately does NOT also check that the bubble is one of the
        // six forming the gap. That check was written, and then measured to be
        // inert: over 120 real boards x 601 angles, 72,480 bubbles came within
        // HIT_DIST of a flight standing inside an empty cell and ZERO of them
        // failed to touch that cell. The packing makes it impossible - the
        // second ring of cells starts at sqrt(3) away, and no point inside a
        // cell is far enough from its own centre to bring one inside 0.92. A
        // guard that cannot fire reads as protection and is not
        // (`an-armed-lever-with-no-caller-reads-as-yes.md`), so it is gone and
        // the geometry that made it redundant is written down instead.
        if (!inGap) {
          return done(snapCell(state, { x, y }), false);
        }
        if (d2 < SQUEEZE_DIST * SQUEEZE_DIST) {
          return done(snapCell(state, { x, y }), false);
        }
        // Inside HIT_DIST, outside SQUEEZE_DIST, and it flanks this gap: the
        // bubble squashes past it. Recorded so the renderer can show that.
        squeezing = true;
      }
    }

    if (squeezing) {
      if (!runFrom) runFrom = { x, y };
      runTo = { x, y };
    } else {
      closeRun();
    }
  }

  // Unreachable on any real board: the ceiling is a full-width backstop, so a
  // rising bubble always meets it. Answered rather than thrown, because a shot
  // that quietly does nothing is a better failure than a crashed game.
  closeRun();
  return { path, cell: null, ceiling: false, squeezes };
}

/** Close the polyline on the centre of the landing cell. */
function finish(path: Point[], cell: Cell | null, state: ShooterState): Point[] {
  if (!cell) return path;
  return [...path, cellCenter(cell.row, cell.col, state.shift)];
}

/* ─────────────────────────────────────────────────────────────────────────────
   RESOLVING WHAT LANDED
   ───────────────────────────────────────────────────────────────────────────*/

/** Same-coloured cells connected to `from`, `from` included. */
export function matchGroup(state: ShooterState, from: Cell): Cell[] {
  const color = at(state, from.row, from.col);
  if (color === null) return [];
  const key = (c: Cell) => `${c.row},${c.col}`;
  const seen = new Set<string>([key(from)]);
  const out: Cell[] = [from];
  const queue: Cell[] = [from];
  while (queue.length) {
    const cur = queue.pop()!;
    for (const n of neighbors(cur.row, cur.col, state.shift, state.cols)) {
      if (seen.has(key(n))) continue;
      if (at(state, n.row, n.col) !== color) continue;
      seen.add(key(n));
      out.push(n);
      queue.push(n);
    }
  }
  return out;
}

/**
 * Everything no longer hanging from the ceiling.
 *
 * A flood fill from every filled cell in row 0; whatever it does not reach is
 * falling. Computed over the WHOLE board rather than around the popped group,
 * because a pop can strand a cluster that never touched it.
 */
export function floaters(state: ShooterState): Cell[] {
  const w0 = rowWidth(0, state.shift, state.cols);
  const seen = new Set<string>();
  const queue: Cell[] = [];
  for (let c = 0; c < w0; c++) {
    if (at(state, 0, c) !== null) {
      seen.add(`0,${c}`);
      queue.push({ row: 0, col: c });
    }
  }
  while (queue.length) {
    const cur = queue.pop()!;
    for (const n of neighbors(cur.row, cur.col, state.shift, state.cols)) {
      const k = `${n.row},${n.col}`;
      if (seen.has(k)) continue;
      if (at(state, n.row, n.col) === null) continue;
      seen.add(k);
      queue.push(n);
    }
  }
  const out: Cell[] = [];
  for (let r = 0; r < FIELD_ROWS; r++) {
    for (let c = 0; c < rowWidth(r, state.shift, state.cols); c++) {
      if (at(state, r, c) !== null && !seen.has(`${r},${c}`)) out.push({ row: r, col: c });
    }
  }
  return out;
}

/** Is the board empty? */
export function isCleared(state: ShooterState): boolean {
  return state.rows.every((row) => row.every((c) => c === null));
}

/** Has anything settled on or past the death line? */
export function isDead(state: ShooterState): boolean {
  for (let r = DEATH_ROW; r < FIELD_ROWS; r++) {
    if (state.rows[r]?.some((c) => c !== null)) return true;
  }
  return false;
}

/**
 * Advance the ceiling one row.
 *
 * `shift` flips as the row goes on, and that is not decoration: a row is offset
 * by its own index plus the shift, so flipping keeps every row already placed at
 * exactly the offset — and the width — it had a moment ago. Without it the whole
 * board would re-stagger under the player and half the rows would change length.
 */
export function pushRow(state: ShooterState, rng: () => number): ShooterState {
  const shift: 0 | 1 = state.shift === 0 ? 1 : 0;
  const spec = LEVELS[state.level];
  const live = boardColors(state);
  const pool = live.length > 0 ? live : Array.from({ length: spec.colors }, (_, i) => i);
  const fresh: (number | null)[] = Array.from({ length: rowWidth(0, shift, state.cols) }, () =>
    pool[Math.floor(rng() * pool.length)] ?? 0,
  );
  const rows = [fresh, ...state.rows.slice(0, FIELD_ROWS - 1)];
  // The row pushed off the bottom of the addressable grid still counts: if it
  // held anything, the board has already reached past the death line.
  const spilled = state.rows[FIELD_ROWS - 1]?.some((c) => c !== null) ?? false;
  const next = { ...state, rows, shift };
  return { ...next, dead: spilled || isDead(next) };
}

export interface ShotOutcome {
  /** Where the bubble came to rest. */
  cell: Cell;
  /** The group that popped — empty when fewer than three met. */
  popped: Cell[];
  /** Bubbles cut loose by that pop. */
  dropped: Cell[];
  gained: number;
  /** The board was emptied and a fresh one has been dealt. */
  cleared: boolean;
  /** The ceiling advanced on this shot. */
  pushed: boolean;
  dead: boolean;
}

/** A shot that could not land — the field is full. Nothing changes. */
export interface NoShot {
  cell: null;
}

/** Three of a colour is the pop threshold, everywhere, at every level. */
export const MATCH_MIN = 3;

/**
 * Fire, and resolve everything that follows, in one pure step.
 *
 * The ORDER below is the game: place, match, drop, score, then advance the
 * ceiling. Checking death before the pop would end a run on a bubble that the
 * very same shot removes.
 */
export function fire(
  state: ShooterState,
  angle: number,
  rng: () => number = Math.random,
): { state: ShooterState; shot: Shot; outcome: ShotOutcome | NoShot } {
  const shot = aim(state, angle);
  if (!shot.cell || state.dead) return { state, shot, outcome: { cell: null } };

  const rows = state.rows.map((r) => r.slice());
  rows[shot.cell.row][shot.cell.col] = state.current;
  let next: ShooterState = { ...state, rows };

  const group = matchGroup(next, shot.cell);
  let popped: Cell[] = [];
  let dropped: Cell[] = [];
  if (group.length >= MATCH_MIN) {
    popped = group;
    for (const c of popped) next.rows[c.row][c.col] = null;
    dropped = floaters(next);
    for (const c of dropped) next.rows[c.row][c.col] = null;
  }

  const gained = popped.length * POP_POINTS + dropped.length * DROP_POINTS;
  next = { ...next, score: next.score + gained };

  const cleared = isCleared(next);
  if (cleared) {
    // A finished board is a win, not an ending. The run keeps its score and its
    // record; only the field is new, and the ceiling clock starts over.
    next = {
      ...next,
      rows: dealRows(next.level, next.shift, rng, next.cols),
      boards: next.boards + 1,
      shotsLeft: shotsFor(next.level, next.cols),
    };
  }

  let pushed = false;
  if (!cleared) {
    const left = next.shotsLeft - 1;
    if (left <= 0) {
      next = pushRow(next, rng);
      next = { ...next, shotsLeft: shotsFor(next.level, next.cols) };
      pushed = true;
    } else {
      next = { ...next, shotsLeft: left };
    }
  }

  const dead = next.dead || isDead(next);
  next = { ...next, dead };

  // Reload. `pickColor` reads the board AFTER everything above, so the colour
  // handed over is one the player can still use.
  next = { ...next, current: next.next, next: pickColor(next, rng) };

  return { state: next, shot, outcome: { cell: shot.cell, popped, dropped, gained, cleared, pushed, dead } };
}

/**
 * What this game's record measures. The renderer never invents a unit.
 *
 * THE BOARD IS SCOPED BY WIDTH, and the phone's width keeps the bare level as
 * its key. A 33-wide field deals 3.3x the bubbles per row, so its score is not
 * the same achievement as a 10-wide one and ranking them together would let a
 * PC run stand as the record on a phone - exactly what
 * `score-contract-convention.md` scopes a board for. Leaving `COLS` on the bare
 * key is not tidiness either: it is every existing player's record, stored
 * under `easy`/`medium`/`hard` since the game shipped, and a new key would
 * orphan all of them.
 */
export function scoreReport(state: ShooterState): { value: number; unit: "points"; board: string } {
  const board = state.cols === COLS ? state.level : `${state.level}-w${state.cols}`;
  return { value: state.score, unit: "points", board };
}
