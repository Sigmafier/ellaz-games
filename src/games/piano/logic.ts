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
//   basic       ten white keys, C4 to E5, coloured, with their names; fixed
//   plus        three octaves, C3 to C6, with the black keys; scrolls
//   pro         five octaves, C2 to C7; scrolls, sustain, key letters
//
// (The middle level's id is "advanced" and stays so: it is a persisted id.)
// A keyboard longer than the screen scrolls under a map of the whole range,
// like every online piano - see `RANGE`.
//
// In songs mode the level also decides how much help a key gives: in basic the
// next key glows, in plus only a dot marks it, and in pro nothing on the
// keyboard does - the strip above the keys says which note comes next, and the
// player finds it. And it decides WHICH songs: the classics need black keys
// and more than ten keys of range, so they start at plus (`Song.min`).
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

/** Middle C. */
export const MIDDLE_C = 60;

/**
 * The whole keyboard each level owns, lowest and highest note.
 *
 *   basic  C4..E5   ten white keys, fixed: every key on screen, wide, coloured
 *   plus   C3..C6   three octaves, 37 keys, scrolled
 *   pro    C2..C7   five octaves, 61 keys, scrolled
 *
 * Plus and Pro are LONGER than a screen, the way every online piano is: keys
 * keep a size a finger can hit (`layoutFor`), a wider screen - a PC, a phone
 * turned to landscape, the full-screen piano - simply shows more of them, and
 * the rest is one drag away on the map above the keys (operator 2026-11-14:
 * "lots of keys and can drag left or right for more keys"). Basic is the one
 * that never scrolls: ten keys a four-year-old never loses.
 */
export const RANGE: Readonly<Record<Level, readonly [lo: number, hi: number]>> = {
  basic: [60, 76],
  advanced: [48, 84],
  pro: [36, 96],
};

/** Whether the keyboard has black keys at this level. */
export function hasBlacks(level: Level): boolean {
  return level !== "basic";
}

/** Whether the keyboard is longer than the screen and moves under a map. */
export function scrolls(level: Level): boolean {
  return level !== "basic";
}

/** Every key the level owns, lowest first. */
export function keysFor(level: Level): number[] {
  const [lo, hi] = RANGE[level];
  const out: number[] = [];
  for (let m = lo; m <= hi; m++) {
    if (!hasBlacks(level) && isBlack(m)) continue;
    out.push(m);
  }
  return out;
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
  return whites(keys).filter((w) => w < midi).length;
}

/** A key's centre, in white-key widths from the left edge; -1 if not on it. */
export function centreOf(keys: readonly number[], midi: number): number {
  if (!keys.includes(midi)) return -1;
  if (isBlack(midi)) return blackCentre(keys, midi);
  return whites(keys).indexOf(midi) + 0.5;
}

/* ------------------------------------------------------- the visible part */

/**
 * How wide a white key is, and whether the keyboard has to scroll.
 *
 * A key never gets narrower than `minPx`: below that a finger hits two. When
 * every white key fits at that size or wider, they share the view and nothing
 * scrolls; otherwise each is `minPx` and the row is longer than the view.
 */
export function layoutFor(whiteCount: number, viewPx: number, minPx: number): { keyPx: number; contentPx: number; scroll: boolean } {
  if (whiteCount <= 0 || !(viewPx > 0)) return { keyPx: minPx, contentPx: 0, scroll: false };
  const fit = viewPx / whiteCount;
  const keyPx = Math.max(minPx, fit);
  return { keyPx, contentPx: keyPx * whiteCount, scroll: fit < minPx };
}

/** An offset kept inside the row: never past either end. */
export function clampOffset(offset: number, contentPx: number, viewPx: number): number {
  const max = Math.max(0, contentPx - viewPx);
  if (!Number.isFinite(offset)) return 0;
  return Math.min(max, Math.max(0, offset));
}

/**
 * The offset that brings a key into view - unchanged if it already is, with a
 * key and a half of margin, otherwise the key centred. Songs and the listen
 * demo call this before every note, so the next key is never off the edge.
 */
export function offsetToShow(
  centreKeys: number,
  keyPx: number,
  offset: number,
  contentPx: number,
  viewPx: number,
): number {
  if (centreKeys < 0) return clampOffset(offset, contentPx, viewPx);
  const x = centreKeys * keyPx;
  const margin = 1.5 * keyPx;
  if (x - margin >= offset && x + margin <= offset + viewPx) return clampOffset(offset, contentPx, viewPx);
  return clampOffset(x - viewPx / 2, contentPx, viewPx);
}

/** The offset that puts a given C at the left edge of the view. */
export function offsetForC(keys: readonly number[], c: number, keyPx: number, contentPx: number, viewPx: number): number {
  const i = whites(keys).indexOf(c);
  return clampOffset(i < 0 ? 0 : i * keyPx, contentPx, viewPx);
}

/**
 * The first C whose key starts inside the view (the computer keyboard's A key
 * plays it), or the keyboard's first key when no C is visible.
 */
export function firstVisibleC(keys: readonly number[], offset: number, keyPx: number): number {
  const ws = whites(keys);
  for (let i = 0; i < ws.length; i++) {
    if (pitchClass(ws[i]) === 0 && i * keyPx >= offset - keyPx * 0.25) return ws[i];
  }
  return keys[0];
}

/* ------------------------------------------------------- the computer keys */

/**
 * The home row of a computer keyboard, the way online pianos lay it out:
 * white keys on A S D F G H J K L ; ' and the black keys on the row above,
 * W E . T Y U . O P - each one a semitone above the key to its lower left.
 * The value is semitones above `base`, the first C on screen.
 */
export const KEY_OFFSETS: Readonly<Record<string, number>> = {
  a: 0, w: 1, s: 2, e: 3, d: 4, f: 5, t: 6, g: 7, y: 8, h: 9, u: 10, j: 11,
  k: 12, o: 13, l: 14, p: 15, ";": 16, "'": 17,
};

/** The note a computer key plays from `base`, or undefined if it is not on this keyboard. */
export function midiForKey(key: string, keys: readonly number[], base: number = keys[0]): number | undefined {
  const off = KEY_OFFSETS[key.toLowerCase()];
  if (off === undefined || keys.length === 0) return undefined;
  const m = base + off;
  return keys.includes(m) ? m : undefined;
}

/** The letter printed on a key, so a PC player can see the mapping. */
export function keyForMidi(midi: number, keys: readonly number[], base: number = keys[0]): string | undefined {
  if (keys.length === 0 || !keys.includes(midi)) return undefined;
  const off = midi - base;
  for (const [k, o] of Object.entries(KEY_OFFSETS)) if (o === off) return k.toUpperCase();
  return undefined;
}

/* ------------------------------------------------------------------ songs */

export type SongId =
  | "bus" | "thumb" | "twinkle" | "jonathan" | "joy" | "lullaby" | "jingle"
  | "nacht" | "elise" | "green" | "mountain" | "canon" | "turkish"
  | "largo" | "gymno" | "morning";

/** One note of a song: a pitch and how many beats it lasts. */
export type SongNote = readonly [midi: number, beats: number];

export interface Song {
  id: SongId;
  /**
   * The first keyboard the song can be played on. Basic has only the white
   * keys C4..E5, so a song with a black key, or a note outside that, starts at
   * Plus. Every keyboard from `min` up holds every note (`logic.test.ts`).
   */
  min: Level;
  notes: readonly SongNote[];
}

const B3 = 59, C4 = 60, D4 = 62, E4 = 64, F4 = 65, G4 = 67, A4 = 69, B4 = 71, C5 = 72, D5 = 74, E5 = 76;
const Ds4 = 63, Cs4 = 61, Fs4 = 66, Gs4 = 68, Cs5 = 73, Ds5 = 75, F5 = 77, Fs5 = 78, G5 = 79, A5 = 81, B5 = 83, C6 = 84, Gs5 = 80;

/**
 * The songs, in the order the list shows them: the children's songs first,
 * the two the operator asked for at the top, then the classics.
 *
 * EVERY ONE IS PUBLIC DOMAIN, and that is a rule rather than a preference: a
 * song here is its melody written out note by note on a public site, which for
 * a song still in copyright needs the publisher's licence. Asked for "No
 * Surprises" and "Don't Stop Me Now" on 2026-11-14, these were added instead.
 *
 * - bus: the Wheels on the Bus tune ("גלגלי האוטובוס"), in F, C4..C5.
 * - thumb: the Frère Jacques tune - in Hebrew "איפה האצבע" - in G.
 * - twinkle: the old French "Ah ! vous dirai-je, maman", in C.
 * - jonathan: the German folk tune Hebrew sings as "יונתן הקטן", in C.
 * - joy: the "Ode to Joy" theme (Beethoven, 1824), first half, in C.
 * - lullaby: Brahms' Wiegenlied (1868), first verse, in C.
 * - jingle: Jingle Bells (Pierpont, 1857), the chorus, in C.
 * - nacht: Eine kleine Nachtmusik (Mozart, 1787), the opening, in G.
 * - elise: Für Elise (Beethoven, 1810), the A theme, in A minor.
 * - green: Greensleeves (16th-century English), the verse, in A minor.
 * - mountain: In the Hall of the Mountain King (Grieg, 1875), in B minor.
 * - canon: Pachelbel's Canon (c. 1680-1706), the upper line, in D.
 * - turkish: Rondo alla Turca (Mozart, 1783), the first four bars, in A minor.
 * - largo: "Going Home", the Largo of the New World Symphony (Dvořák, 1893),
 *   in C - white keys only, so it plays on every keyboard.
 * - gymno: Gymnopédie No. 1 (Satie, 1888), the opening phrase twice, in D.
 * - morning: Morning Mood from Peer Gynt (Grieg, 1875), the opening, in E.
 *
 * Asked for the Interstellar and Forrest Gump themes the same day: both are
 * film scores still in copyright, so Satie, Dvořák and Grieg came instead -
 * the slow, open, film-like sound those two were asked for.
 */
export const SONGS: readonly Song[] = [
  {
    id: "bus",
    min: "basic",
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
    min: "basic",
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
    min: "basic",
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
    min: "basic",
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
    min: "basic",
    notes: [
      [E4, 1], [E4, 1], [F4, 1], [G4, 1], [G4, 1], [F4, 1], [E4, 1], [D4, 1],
      [C4, 1], [C4, 1], [D4, 1], [E4, 1], [E4, 1.5], [D4, 0.5], [D4, 2],
      [E4, 1], [E4, 1], [F4, 1], [G4, 1], [G4, 1], [F4, 1], [E4, 1], [D4, 1],
      [C4, 1], [C4, 1], [D4, 1], [E4, 1], [D4, 1.5], [C4, 0.5], [C4, 2],
    ],
  },
  {
    id: "lullaby",
    min: "basic",
    notes: [
      [E4, 0.5], [E4, 0.5], [G4, 2],
      [E4, 0.5], [E4, 0.5], [G4, 2],
      [E4, 0.5], [G4, 0.5], [C5, 1], [B4, 1.5], [A4, 0.5], [A4, 1], [G4, 1],
      [D4, 0.5], [E4, 0.5], [F4, 1], [D4, 1], [D4, 0.5], [E4, 0.5], [F4, 2],
      [D4, 0.5], [F4, 0.5], [B4, 0.5], [A4, 0.5], [G4, 1], [B4, 1], [C5, 3],
    ],
  },
  {
    id: "jingle",
    min: "basic",
    notes: [
      [E4, 1], [E4, 1], [E4, 2],
      [E4, 1], [E4, 1], [E4, 2],
      [E4, 1], [G4, 1], [C4, 1.5], [D4, 0.5], [E4, 4],
      [F4, 1], [F4, 1], [F4, 1.5], [F4, 0.5],
      [F4, 1], [E4, 1], [E4, 1], [E4, 0.5], [E4, 0.5],
      [E4, 1], [D4, 1], [D4, 1], [E4, 1], [D4, 2], [G4, 2],
      [E4, 1], [E4, 1], [E4, 2],
      [E4, 1], [E4, 1], [E4, 2],
      [E4, 1], [G4, 1], [C4, 1.5], [D4, 0.5], [E4, 4],
      [F4, 1], [F4, 1], [F4, 1.5], [F4, 0.5],
      [F4, 1], [E4, 1], [E4, 1], [E4, 0.5], [E4, 0.5],
      [G4, 1], [G4, 1], [F4, 1], [D4, 1], [C4, 4],
    ],
  },
  {
    id: "nacht",
    min: "advanced",
    notes: [
      [G4, 1], [D4, 0.5], [G4, 1], [D4, 0.5], [G4, 0.5], [D4, 0.5], [G4, 0.5], [B4, 0.5], [D5, 2],
      [C5, 1], [A4, 0.5], [C5, 1], [A4, 0.5], [C5, 0.5], [A4, 0.5], [Fs4, 0.5], [A4, 0.5], [D4, 2],
    ],
  },
  {
    id: "elise",
    min: "advanced",
    notes: [
      [E5, 0.5], [Ds5, 0.5], [E5, 0.5], [Ds5, 0.5], [E5, 0.5], [B4, 0.5], [D5, 0.5], [C5, 0.5], [A4, 1.5],
      [C4, 0.5], [E4, 0.5], [A4, 0.5], [B4, 1.5],
      [E4, 0.5], [Gs4, 0.5], [B4, 0.5], [C5, 1.5],
      [E4, 0.5], [E5, 0.5], [Ds5, 0.5], [E5, 0.5], [Ds5, 0.5], [E5, 0.5], [B4, 0.5], [D5, 0.5], [C5, 0.5], [A4, 1.5],
      [C4, 0.5], [E4, 0.5], [A4, 0.5], [B4, 1.5],
      [E4, 0.5], [C5, 0.5], [B4, 0.5], [A4, 2],
    ],
  },
  {
    id: "green",
    min: "advanced",
    notes: [
      [A4, 1],
      [C5, 2], [D5, 1], [E5, 1.5], [F5, 0.5], [E5, 1], [D5, 2], [B4, 1], [G4, 1.5], [A4, 0.5], [B4, 1],
      [C5, 2], [A4, 1], [A4, 1.5], [Gs4, 0.5], [A4, 1], [B4, 2], [Gs4, 1], [E4, 2], [A4, 1],
      [C5, 2], [D5, 1], [E5, 1.5], [F5, 0.5], [E5, 1], [D5, 2], [B4, 1], [G4, 1.5], [A4, 0.5], [B4, 1],
      [C5, 1.5], [B4, 0.5], [A4, 1], [Gs4, 1.5], [Fs4, 0.5], [Gs4, 1], [A4, 3],
    ],
  },
  {
    id: "mountain",
    min: "advanced",
    notes: [
      [B3, 0.5], [Cs4, 0.5], [D4, 0.5], [E4, 0.5], [Fs4, 0.5], [D4, 0.5], [Fs4, 1],
      [F4, 0.5], [Cs4, 0.5], [F4, 1],
      [E4, 0.5], [C4, 0.5], [E4, 1],
      [B3, 0.5], [Cs4, 0.5], [D4, 0.5], [E4, 0.5], [Fs4, 0.5], [D4, 0.5], [Fs4, 0.5], [B4, 0.5],
      [A4, 0.5], [Fs4, 0.5], [D4, 0.5], [Fs4, 0.5], [A4, 2],
    ],
  },
  {
    id: "canon",
    min: "advanced",
    notes: [
      [Fs5, 2], [E5, 2], [D5, 2], [Cs5, 2], [B4, 2], [A4, 2], [B4, 2], [Cs5, 2],
      [D5, 2], [Cs5, 2], [B4, 2], [A4, 2], [G4, 2], [Fs4, 2], [G4, 2], [E4, 2],
      [D4, 1], [Fs4, 1], [A4, 1], [G4, 1], [Fs4, 1], [D4, 1], [Fs4, 1], [E4, 1],
      [D4, 1], [B3, 1], [D4, 1], [A4, 1], [G4, 1], [B4, 1], [A4, 1], [G4, 1],
    ],
  },
  {
    id: "largo",
    min: "basic",
    notes: [
      [E4, 1.5], [G4, 0.5], [G4, 2], [E4, 1.5], [D4, 0.5], [C4, 2],
      [D4, 1], [E4, 1], [G4, 1], [E4, 1], [D4, 4],
      [E4, 1.5], [G4, 0.5], [G4, 2], [E4, 1.5], [D4, 0.5], [C4, 2],
      [D4, 1], [E4, 1], [D4, 1.5], [C4, 0.5], [C4, 4],
    ],
  },
  {
    id: "gymno",
    min: "advanced",
    notes: [
      [Fs5, 1], [A5, 1], [G5, 1], [Fs5, 1], [Cs5, 1], [B4, 1], [Cs5, 1], [D5, 1], [A4, 1], [Fs4, 3],
      [Fs5, 1], [A5, 1], [G5, 1], [Fs5, 1], [Cs5, 1], [B4, 1], [Cs5, 1], [D5, 1], [A4, 1], [Fs4, 3],
    ],
  },
  {
    id: "morning",
    min: "advanced",
    notes: [
      [Gs4, 0.5], [E4, 0.5], [Ds4, 0.5], [Cs4, 0.5], [Ds4, 0.5], [E4, 0.5],
      [Gs4, 0.5], [E4, 0.5], [Ds4, 0.5], [Cs4, 0.5], [Ds4, 0.5], [E4, 0.5],
      [Ds4, 0.5], [E4, 0.5], [Fs4, 0.5], [E4, 0.5], [Fs4, 0.5], [Gs4, 1.5],
    ],
  },
  {
    id: "turkish",
    min: "advanced",
    notes: [
      [B4, 0.25], [A4, 0.25], [Gs4, 0.25], [A4, 0.25], [C5, 1],
      [D5, 0.25], [C5, 0.25], [B4, 0.25], [C5, 0.25], [E5, 1],
      [F5, 0.25], [E5, 0.25], [Ds5, 0.25], [E5, 0.25], [B5, 0.25], [A5, 0.25], [Gs5, 0.25], [A5, 0.25],
      [B5, 0.25], [A5, 0.25], [Gs5, 0.25], [A5, 0.25], [C6, 2],
    ],
  },
];

export const SONG_IDS: readonly SongId[] = SONGS.map((s) => s.id);

export function isSongId(v: unknown): v is SongId {
  return typeof v === "string" && (SONG_IDS as readonly string[]).includes(v);
}

const LEVEL_RANK: Readonly<Record<Level, number>> = { basic: 0, advanced: 1, pro: 2 };

/** The songs this keyboard can play, in list order. */
export function songsFor(level: Level): Song[] {
  return SONGS.filter((sg) => LEVEL_RANK[sg.min] <= LEVEL_RANK[level]);
}

/** A song this keyboard can play: `id` if it can, otherwise the list's first. */
export function playableSong(id: SongId, level: Level): SongId {
  const list = songsFor(level);
  return list.some((sg) => sg.id === id) ? id : list[0].id;
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
