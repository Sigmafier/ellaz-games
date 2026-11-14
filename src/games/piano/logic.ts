// Piano - pure logic for the keyboard and the songs that teach it.
//
// TWO WAYS TO PLAY, ONE KEYBOARD.
//
//   free play   every key just sounds; nothing is wrong, nothing is kept
//   songs       a song waits on its next note; the right key moves it on,
//               any other key still sounds and the song simply waits
//
// The level is the KEYBOARD, not a difficulty of the songs:
//
//   basic       ten white keys, C4 to E5, coloured, with their names
//   advanced    the same seventeen semitones with the black keys added
//   pro         two octaves on a PC (one and a third on a phone) that slide up
//               and down the range by an octave, with a sustain switch
//
// In songs mode the level also decides how much help a key gives: in basic the
// next key glows, in advanced only a dot marks it, and in pro nothing on the
// keyboard does - the strip above the keys says which note comes next, and the
// player finds it.
//
// NOT `music` and NOT `echo`. Music Box is a grid that loops; Echo plays a
// pattern and ends the run on a miss. Here a song never ends on a miss: a wrong
// key sounds like a key, and the song is still waiting on the same note. That is
// the "no fail-punishment" rule for kids games, and the reason `press` has no
// state for "failed".
//
// Every song here is a traditional tune - nursery and folk melodies sung for
// generations, plus Beethoven's "Ode to Joy" theme. The note data is ours.
//
// PURE: no DOM, no React, no audio. Pitches are MIDI numbers (C4 = 60).
// Imports are direct module paths, never the `@shared` barrel.

/* ------------------------------------------------------------------ pitch */

/** Equal temperament, A4 = 440 Hz. */
export function freqOf(midi: number): number {
  return 440 * Math.pow(2, (midi - 69) / 12);
}

/** 0 = C ... 11 = B. */
export function pitchClass(midi: number): number {
  return ((midi % 12) + 12) % 12;
}

/** Scientific octave: C4 is 60. */
export function octaveOf(midi: number): number {
  return Math.floor(midi / 12) - 1;
}

const BLACK = new Set([1, 3, 6, 8, 10]);

export function isBlack(midi: number): boolean {
  return BLACK.has(pitchClass(midi));
}

/* --------------------------------------------------------------- the level */

export type Level = "basic" | "advanced" | "pro";
// Written one rung per line, ending on a line of its own: the boards test
// reads ladders up to the first `\n]`, and a one-line array here would run it
// on into SONGS below.
export const LEVELS: readonly Level[] = [
  "basic",
  "advanced",
  "pro",
];

export type Mode = "free" | "songs";
export const MODES: readonly Mode[] = ["free", "songs"];

export function isMode(v: unknown): v is Mode {
  return v === "free" || v === "songs";
}

/** Middle C. Every keyboard here starts on a C. */
export const MIDDLE_C = 60;

/**
 * Basic and advanced span C4..E5: sixteen semitones, ten white keys. Ten,
 * because ten white keys across a 390px phone are 35px each - a key a small
 * finger hits - and because every song in `SONGS` fits inside it.
 */
export const SMALL_SPAN = 16;

/** A pro keyboard on a PC: two full octaves, C to C - fifteen white keys. */
export const WIDE_SPAN = 24;

/** The lowest and highest notes a pro window may reach: C2 to C7. */
export const LOWEST = 36;
export const HIGHEST = 96;

/** How many semitones a pro keyboard shows, on this kind of screen. */
export function spanFor(level: Level, pc: boolean): number {
  return level === "pro" && pc ? WIDE_SPAN : SMALL_SPAN;
}

/** Whether the keyboard has black keys at this level. */
export function hasBlacks(level: Level): boolean {
  return level !== "basic";
}

/** Only pro slides along the range. */
export function canShift(level: Level): boolean {
  return level === "pro";
}

/**
 * The keys on screen, lowest first. `start` is the C the window begins on; it
 * is only honoured in pro, every other level is pinned to middle C.
 */
export function keysFor(level: Level, pc: boolean, start: number = MIDDLE_C): number[] {
  const first = canShift(level) ? clampStart(start, spanFor(level, pc)) : MIDDLE_C;
  const span = spanFor(level, pc);
  const out: number[] = [];
  for (let m = first; m <= first + span; m++) {
    if (!hasBlacks(level) && isBlack(m)) continue;
    out.push(m);
  }
  return out;
}

/** A window start, snapped DOWN to a C and kept inside LOWEST..HIGHEST. */
export function clampStart(start: number, span: number): number {
  const c = Number.isFinite(start) ? start - pitchClass(Math.round(start)) : MIDDLE_C;
  const max = HIGHEST - span;
  const maxC = max - pitchClass(max);
  return Math.min(maxC, Math.max(LOWEST, Math.round(c)));
}

/** Slide a pro window by whole octaves. Returns the same start at either end. */
export function shiftStart(start: number, octaves: number, span: number): number {
  return clampStart(start + 12 * Math.trunc(octaves), span);
}

export function whites(keys: readonly number[]): number[] {
  return keys.filter((m) => !isBlack(m));
}

export function blacks(keys: readonly number[]): number[] {
  return keys.filter((m) => isBlack(m));
}

/**
 * Where a black key sits, in WHITE-KEY WIDTHS from the keyboard's left edge:
 * centred on the line between the two white keys either side of it. Returns
 * -1 for a key that is not a black key on this keyboard.
 */
export function blackCentre(keys: readonly number[], midi: number): number {
  if (!isBlack(midi) || !keys.includes(midi)) return -1;
  const below = whites(keys).filter((w) => w < midi).length;
  return below;
}

/* ------------------------------------------------------- the computer keys */

/**
 * The home row of a computer keyboard, the way online pianos lay it out:
 * white keys on A S D F G H J K L ; ' and the black keys on the row above,
 * W E . T Y U . O P - each one a semitone above the key to its lower left.
 * The value is semitones above the window's first C.
 */
export const KEY_OFFSETS: Readonly<Record<string, number>> = {
  a: 0, w: 1, s: 2, e: 3, d: 4, f: 5, t: 6, g: 7, y: 8, h: 9, u: 10, j: 11,
  k: 12, o: 13, l: 14, p: 15, ";": 16, "'": 17,
};

/** The note a computer key plays on this keyboard, or undefined. */
export function midiForKey(key: string, keys: readonly number[]): number | undefined {
  const off = KEY_OFFSETS[key.toLowerCase()];
  if (off === undefined || keys.length === 0) return undefined;
  const m = keys[0] + off;
  return keys.includes(m) ? m : undefined;
}

/** The letter printed on a key, so a PC player can see the mapping. */
export function keyForMidi(midi: number, keys: readonly number[]): string | undefined {
  if (keys.length === 0) return undefined;
  const off = midi - keys[0];
  for (const [k, o] of Object.entries(KEY_OFFSETS)) if (o === off) return k.toUpperCase();
  return undefined;
}

/* ------------------------------------------------------------------ songs */

export type SongId = "bus" | "thumb" | "twinkle" | "jonathan" | "joy";

/** One note of a song: a pitch and how many beats it lasts. */
export type SongNote = readonly [midi: number, beats: number];

export interface Song {
  id: SongId;
  notes: readonly SongNote[];
}

const C4 = 60, D4 = 62, E4 = 64, F4 = 65, G4 = 67, A4 = 69, B4 = 71, C5 = 72, D5 = 74, E5 = 76;

/**
 * The five songs, in the order the picker shows them - the two the operator
 * asked for first.
 *
 * - bus: the Wheels on the Bus tune ("גלגלי האוטובוס"), in F, C4..C5.
 * - thumb: the Frère Jacques tune - in Hebrew "איפה האצבע" - in G, so its
 *   last phrase can drop to D4 and still sit inside ten white keys.
 * - twinkle: the old French "Ah ! vous dirai-je, maman", in C.
 * - jonathan: the German folk tune Hebrew sings as "יונתן הקטן", in C.
 * - joy: the "Ode to Joy" theme, first half, in C.
 *
 * Every note is a WHITE key between C4 and E5, so every song plays on every
 * keyboard here, the ten-key basic one included. `logic.test.ts` holds that.
 */
export const SONGS: readonly Song[] = [
  {
    id: "bus",
    notes: [
      [C4, 0.5], [F4, 1], [F4, 0.5], [F4, 0.5], [F4, 1], [A4, 1], [C5, 1], [A4, 1], [F4, 2],
      [G4, 1], [E4, 1], [C4, 2],
      [C5, 1], [A4, 1], [F4, 2],
      [C4, 0.5], [F4, 1], [F4, 0.5], [F4, 0.5], [F4, 1], [A4, 1], [C5, 1], [A4, 1], [F4, 2],
      [G4, 1], [C4, 1], [C4, 1], [F4, 3],
    ],
  },
  {
    id: "thumb",
    notes: [
      [G4, 1], [A4, 1], [B4, 1], [G4, 1],
      [G4, 1], [A4, 1], [B4, 1], [G4, 1],
      [B4, 1], [C5, 1], [D5, 2],
      [B4, 1], [C5, 1], [D5, 2],
      [D5, 0.5], [E5, 0.5], [D5, 0.5], [C5, 0.5], [B4, 1], [G4, 1],
      [D5, 0.5], [E5, 0.5], [D5, 0.5], [C5, 0.5], [B4, 1], [G4, 1],
      [G4, 1], [D4, 1], [G4, 2],
      [G4, 1], [D4, 1], [G4, 2],
    ],
  },
  {
    id: "twinkle",
    notes: [
      [C4, 1], [C4, 1], [G4, 1], [G4, 1], [A4, 1], [A4, 1], [G4, 2],
      [F4, 1], [F4, 1], [E4, 1], [E4, 1], [D4, 1], [D4, 1], [C4, 2],
      [G4, 1], [G4, 1], [F4, 1], [F4, 1], [E4, 1], [E4, 1], [D4, 2],
      [G4, 1], [G4, 1], [F4, 1], [F4, 1], [E4, 1], [E4, 1], [D4, 2],
      [C4, 1], [C4, 1], [G4, 1], [G4, 1], [A4, 1], [A4, 1], [G4, 2],
      [F4, 1], [F4, 1], [E4, 1], [E4, 1], [D4, 1], [D4, 1], [C4, 2],
    ],
  },
  {
    id: "jonathan",
    notes: [
      [G4, 1], [E4, 1], [E4, 2],
      [F4, 1], [D4, 1], [D4, 2],
      [C4, 1], [D4, 1], [E4, 1], [F4, 1],
      [G4, 1], [G4, 1], [G4, 2],
      [G4, 1], [E4, 1], [E4, 2],
      [F4, 1], [D4, 1], [D4, 2],
      [C4, 1], [E4, 1], [G4, 1], [G4, 1],
      [C4, 4],
    ],
  },
  {
    id: "joy",
    notes: [
      [E4, 1], [E4, 1], [F4, 1], [G4, 1], [G4, 1], [F4, 1], [E4, 1], [D4, 1],
      [C4, 1], [C4, 1], [D4, 1], [E4, 1], [E4, 1.5], [D4, 0.5], [D4, 2],
      [E4, 1], [E4, 1], [F4, 1], [G4, 1], [G4, 1], [F4, 1], [E4, 1], [D4, 1],
      [C4, 1], [C4, 1], [D4, 1], [E4, 1], [D4, 1.5], [C4, 0.5], [C4, 2],
    ],
  },
];

export const SONG_IDS: readonly SongId[] = SONGS.map((s) => s.id);

export function isSongId(v: unknown): v is SongId {
  return typeof v === "string" && (SONG_IDS as readonly string[]).includes(v);
}

export function songById(id: SongId): Song {
  const s = SONGS.find((x) => x.id === id);
  if (!s) throw new Error(`piano: no song ${id}`);
  return s;
}

/* ------------------------------------------------------- following a song */

/** Where the player is in a song: the index of the note it is waiting on. */
export interface Follow {
  song: SongId;
  at: number;
}

export function newFollow(song: SongId): Follow {
  return { song, at: 0 };
}

export function isDone(f: Follow): boolean {
  return f.at >= songById(f.song).notes.length;
}

/** The note the song is waiting on, or undefined once it is finished. */
export function wanted(f: Follow): number | undefined {
  const n = songById(f.song).notes[f.at];
  return n ? n[0] : undefined;
}

export type PressOutcome =
  /** The right key: the song moved on. `done` when that was its last note. */
  | { kind: "right"; done: boolean }
  /** Another key. It still sounds; the song is still waiting on `want`. */
  | { kind: "other"; want: number }
  /** The song is over; a key is just a key until it starts again. */
  | { kind: "finished" };

/**
 * A key was pressed while a song was showing. There is no "wrong": a key that
 * is not the next note leaves the song exactly where it was.
 */
export function press(f: Follow, midi: number): { follow: Follow; outcome: PressOutcome } {
  const want = wanted(f);
  if (want === undefined) return { follow: f, outcome: { kind: "finished" } };
  if (midi !== want) return { follow: f, outcome: { kind: "other", want } };
  const next = { ...f, at: f.at + 1 };
  return { follow: next, outcome: { kind: "right", done: isDone(next) } };
}

/** The next `n` notes from where the player is, for the strip above the keys. */
export function upcoming(f: Follow, n: number): SongNote[] {
  return songById(f.song).notes.slice(f.at, f.at + Math.max(0, n));
}

/** How much a key tells you about the next note. */
export type Hint = "glow" | "dot" | "none";
export const HINT: Readonly<Record<Level, Hint>> = { basic: "glow", advanced: "dot", pro: "none" };

/** What finishing a song pays, by level: the economy decides the amount. */
export const TIER: Readonly<Record<Level, "easy" | "medium" | "hard">> = {
  basic: "easy",
  advanced: "medium",
  pro: "hard",
};

/* ------------------------------------------------------------- the timing */

/** One beat of the "listen" demo. A walking tempo a child can follow: 100 bpm. */
export const BEAT_MS = 600;

/** When each note of a song starts in the demo, and how long it lasts, in ms. */
export function timeline(song: Song, beatMs: number = BEAT_MS): { midi: number; at: number; ms: number }[] {
  let t = 0;
  return song.notes.map(([midi, beats]) => {
    const row = { midi, at: t, ms: beats * beatMs };
    t += beats * beatMs;
    return row;
  });
}

/* ---------------------------------------------------------- free-play trail */

/** How many of the last notes played the strip shows in free play. */
export const TRAIL = 8;

/** Append a played note to the trail, keeping the last `TRAIL`. */
export function pushTrail(trail: readonly number[], midi: number): number[] {
  return [...trail, midi].slice(-TRAIL);
}
