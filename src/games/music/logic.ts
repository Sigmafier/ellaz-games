// Music Box - pure logic for the tap-a-square, hear-a-tune toy.
//
// WHAT THIS IS, AND WHAT IT IS NOT. There is already a game in this catalogue
// that makes musical notes - `echo`, the repeat-after-me one - and this is
// deliberately its opposite in every mechanic that matters:
//
//   echo                              music
//   ----                              -----
//   the app plays, you copy           you play, and nothing is ever wrong
//   a pattern to get RIGHT            a tune to MAKE
//   the notes are the question        the notes are the answer
//   the run ends when you miss        there is no run and no ending
//   it tests memory                   it tests nothing
//
// It is the first game in the `create` section, which has been declared in
// `CATEGORY_ORDER` and empty since the catalogue was written.
//
// NO RECORD AND NO COINS, like `coloring` (since 2026-10-03). Ranking a child's
// drawing is the opposite of this platform's premise, and a tune is a drawing.
// It used to count the notes in the biggest tune built and pay a coin every six
// notes; the operator ruled both out, because a count of notes is busy over
// good and a coin per note pays for busy. The screen shows how many notes the
// tune has right now, and that number is never kept.
//
// EVERY TAP SOUNDS GOOD. The scale is `PENTATONIC` from `@shared/notes`, which
// has no semitone and no tritone in it - so any handful of these notes, in any
// order, is consonant. That is why chords are allowed and why nothing here
// needs a rule about which note may follow which. The scale does the work a
// grown-up would otherwise have to.
//
// NOTHING HERE KNOWS WHAT A SOUND IS. This file deals in row indices and
// frequencies; which oscillator plays them, how loudly and how fast is the
// renderer's business, and `voice` is an ID rather than a waveform for exactly
// that reason.
//
// NOTHING HERE CAN ONLY BE LEFT BY A TIMER, which is what makes the whole state
// safe to write to disk: whether the tune is PLAYING, and where the playhead
// is, live in the renderer and never reach `TuneState`. See
// session-snapshot-convention.md for the memory bug that rule was written from.
//
// PURE: no DOM, no React, no Phaser. The `rng` parameter goes LAST and defaults
// to `Math.random`. Imports are DIRECT module paths rather than the `@shared`
// barrel, which re-exports React components.
import { PENTATONIC } from "@shared/notes";
import { randInt } from "@shared/rng";

/* ------------------------------------------------------------------- notes */

/** One row per note the shared scale offers. The grid IS the scale. */
export const ROWS = PENTATONIC.length;

/**
 * The note a row plays. Row 0 is the TOP row and the HIGHEST note.
 *
 * Upside down is the one way this could be wrong and still work: every square
 * would make a sound, every test about counting notes would pass, and the only
 * symptom would be that the picture disagrees with the music. So it is pinned.
 */
export function pitchFor(row: number): number {
  if (!Number.isInteger(row) || row < 0 || row >= ROWS) {
    throw new Error(`music: no note for row ${row}`);
  }
  return PENTATONIC[ROWS - 1 - row];
}

/* ------------------------------------------------------------------ voices */

/**
 * What the tune is played WITH, as an id.
 *
 * Three, because three is what fits across the bottom of a phone as buttons big
 * enough for a four-year-old. The renderer maps each to a waveform and a
 * loudness; nothing here knows or cares what a waveform is.
 */
export type Voice = "round" | "soft" | "bright";

export const VOICES: readonly Voice[] = ["round", "soft", "bright"];

export function isVoice(value: unknown): value is Voice {
  return typeof value === "string" && (VOICES as readonly string[]).includes(value);
}

/* ------------------------------------------------------------------ length */

export type Length = "short" | "medium" | "long";

export const LENGTHS: readonly Length[] = ["short", "medium", "long"];

/**
 * How many beats long a tune is.
 *
 * THE LEVER IS LENGTH, and there is nothing else to turn: this game has no
 * difficulty because it has no way to be wrong. Eight is the ceiling because
 * eight columns across a 390px phone leaves squares a small finger can hit;
 * sixteen would be a nicer phrase and a worse toy.
 */
export const STEPS: Record<Length, number> = { short: 4, medium: 6, long: 8 };

/* ------------------------------------------------------------------- state */

export interface TuneState {
  level: Length;
  /** Columns. Always `STEPS[level]`; carried so nothing has to look it up. */
  steps: number;
  /** Row-major, `ROWS * steps` long. */
  cells: boolean[];
  voice: Voice;
}

export type ToggleOutcome =
  | { kind: "ignored" }
  | { kind: "on"; row: number; col: number }
  | { kind: "off"; row: number; col: number };

export function cellIndex(row: number, col: number, steps: number): number {
  return row * steps + col;
}

export function newTune(level: Length = "medium", voice: Voice = "round"): TuneState {
  return {
    level,
    steps: STEPS[level],
    cells: Array(ROWS * STEPS[level]).fill(false),
    voice,
  };
}

export function noteCount(state: TuneState): number {
  return state.cells.reduce((n, on) => (on ? n + 1 : n), 0);
}

/** Turn one square on, or off again. Nothing else in the tune moves. */
export function toggleCell(
  state: TuneState,
  index: number,
): { state: TuneState; outcome: ToggleOutcome } {
  if (!Number.isInteger(index) || index < 0 || index >= state.cells.length) {
    return { state, outcome: { kind: "ignored" } };
  }
  const cells = [...state.cells];
  cells[index] = !cells[index];
  return {
    state: { ...state, cells },
    outcome: {
      kind: cells[index] ? "on" : "off",
      row: Math.floor(index / state.steps),
      col: index % state.steps,
    },
  };
}

/**
 * Which rows ring on this beat, TOP FIRST.
 *
 * The order is fixed rather than incidental so a chord always arrives at the
 * speakers the same way round - two runs of the same tune that differ in the
 * order their notes are scheduled do not sound identical, and a toy that plays
 * slightly differently each time reads as broken.
 */
export function columnRows(state: TuneState, col: number): number[] {
  if (!Number.isInteger(col) || col < 0 || col >= state.steps) return [];
  const out: number[] = [];
  for (let row = 0; row < ROWS; row++) {
    if (state.cells[cellIndex(row, col, state.steps)]) out.push(row);
  }
  return out;
}

/**
 * Make the tune longer or shorter, KEEPING every note that still fits.
 *
 * Every other game in this catalogue treats a level change as a fresh start,
 * and that is right for a puzzle. It is wrong here: the tune is the thing a
 * child made, and throwing it away to add two beats is the same mistake as
 * ranking their drawing. Notes past the new end are dropped, which is the only
 * honest thing to do with them.
 */
export function resize(state: TuneState, level: Length): TuneState {
  const steps = STEPS[level];
  if (steps === state.steps) return { ...state, level };
  const cells = Array(ROWS * steps).fill(false);
  const keep = Math.min(steps, state.steps);
  for (let row = 0; row < ROWS; row++) {
    for (let col = 0; col < keep; col++) {
      cells[cellIndex(row, col, steps)] = state.cells[cellIndex(row, col, state.steps)];
    }
  }
  return { ...state, level, steps, cells };
}

export function clearTune(state: TuneState): TuneState {
  return { ...state, cells: Array(state.cells.length).fill(false) };
}

export function setVoice(state: TuneState, voice: Voice): TuneState {
  if (!isVoice(voice) || voice === state.voice) return state;
  return { ...state, voice };
}

/**
 * Scatter a tune to start from: exactly one note in every column.
 *
 * The blank-page problem, and it is a real one for somebody who is four - an
 * empty grid is not an invitation, it is a shrug. One note per column is a
 * MELODY rather than a texture, which is the shape a child can then hear
 * themselves changing. It REPLACES rather than adds, so tapping it twice is
 * two fresh tunes and never a slowly filling grid.
 */
export function surprise(state: TuneState, rng: () => number = Math.random): TuneState {
  const cells = Array(state.cells.length).fill(false);
  for (let col = 0; col < state.steps; col++) {
    cells[cellIndex(randInt(0, ROWS - 1, rng), col, state.steps)] = true;
  }
  return { ...state, cells };
}

/* --------------------------------------------------------------- the save */

/**
 * The snapshot's version. 2 since the toy stopped paying (2026-10-03): version 1
 * also carried the two latches - `paidStep`, `bestFired` - that kept a coin and
 * a celebration from being paid twice across a resume, and with nothing paid
 * there is nothing to latch. Every save from now on is written as version 2.
 *
 * AND VERSION 1 IS STILL READ (operator ruling 2026-10-03, "keep old tunes"). A
 * tune is a thing a child made, and `ctx.session` discards any other version
 * unread - so a plain bump would have handed every returning child an empty
 * grid on the day of the update. `resumeTune` asks for version 2 and, failing
 * that, for version 1, and keeps only the tune out of what it finds: the old
 * latches are dropped on read, because nothing they guarded exists any more.
 *
 * THERE IS NO REPORTING SECTION ANY MORE, and that is the ruling, not a gap:
 * no `scoreReport`, no `unit:`, no milestone. Like `coloring`, this game keeps
 * no record and pays no coin, because both judged a thing a child made - the
 * record said busy beats pretty, and the coin every six notes paid for busy.
 * `score-unit-declared.test.ts` names this game beside coloring, so giving it a
 * record back is a test somebody has to delete on purpose.
 */
export const SNAPSHOT_VERSION = 2;
/** What a paying build wrote: `{ state, paidStep, bestFired }`. Read, never written. */
export const LEGACY_SNAPSHOT_VERSION = 1;

/** What a resume restores: the tune, and nothing else. */
export interface MusicSnapshot {
  state: TuneState;
}

/**
 * Whether `value` is a tune THIS build can draw. Must not throw - it is handed
 * whatever was on the disk.
 */
export function isMusicSnapshot(value: unknown): value is MusicSnapshot {
  const s = value as Partial<MusicSnapshot> | null;
  if (typeof s !== "object" || s === null) return false;
  const t = s.state as Partial<TuneState> | null | undefined;
  if (typeof t !== "object" || t === null) return false;
  if (typeof t.level !== "string" || !Object.prototype.hasOwnProperty.call(STEPS, t.level)) return false;
  // The grid must match the dimensions the LENGTH declares, not merely the
  // ones the snapshot claims: the CSS grid is built from the level, so a
  // tune of some other width renders as a grid whose cells and columns
  // disagree - a plausible picture with no error anywhere.
  const steps = STEPS[t.level as Length];
  if (t.steps !== steps) return false;
  if (!Array.isArray(t.cells) || t.cells.length !== ROWS * steps) return false;
  if (!t.cells.every((c) => typeof c === "boolean")) return false;
  return isVoice(t.voice);
}

/** The one call `resumeTune` needs from `ctx.session`, so this file stays DOM-free. */
export type SnapshotLoader = (spec: { version: number; validate: (value: unknown) => value is MusicSnapshot }) => MusicSnapshot | undefined;

/**
 * The tune a returning child left, from a version-2 save or, failing that, a
 * version-1 one. Returns the TUNE ALONE - a fresh `{ state }` - so a legacy
 * save's `paidStep` and `bestFired` never travel past this line.
 */
export function resumeTune(load: SnapshotLoader): MusicSnapshot | undefined {
  const found =
    load({ version: SNAPSHOT_VERSION, validate: isMusicSnapshot }) ??
    load({ version: LEGACY_SNAPSHOT_VERSION, validate: isMusicSnapshot });
  return found ? { state: found.state } : undefined;
}
