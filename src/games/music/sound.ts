// Music Box - WHAT a square sounds like, as data. The game and the lab both
// read it, so the two cannot drift apart.
//
// A player wrote: "I don't think this game sounds very good (with any
// settings)... the music feels too empty". Every square used to be one bare
// oscillator (`TODAY` below, the game's old VOICE_SPEC byte for byte) and a
// beat that nothing rang into. The operator compared four arms BY EAR in the
// listening lab (`src/lab/musicSound/`) and picked arm C on 2026-10-03: each
// square a STRUCK note - `playNote(ctx.audio, noteFor(row, voice))` from
// `@sdk/note` - over a quiet bass on beat 1 of each loop (`bassFor("downbeat",
// col)`). MusicGame.tsx plays exactly that. `TODAY` and `toneFor` stay as the
// lab's control arm: the sound the game made before, kept so the lab can still
// play it beside the new one.
//
// PURE: no DOM, no WebAudio. Ids in, `ToneOptions` / `NoteOptions` out.
import type { NoteOptions, Timbre } from "@sdk/note";
import type { ToneOptions } from "@sdk/types";
import { PENTATONIC } from "@shared/notes";
import { pitchFor, type Voice } from "./logic";

/**
 * How long one beat lasts - the game's beat and the lab's, one number.
 *
 * Slow enough that a four-year-old can hear each note as its own thing, and
 * fast enough that eight of them read as a tune rather than as a list. Fixed
 * rather than a control: a tempo slider is a fourth thing on a screen that is
 * already a grid, a play button and three voices.
 */
export const STEP_MS = 320;

/** How long the old oscillator rang: slightly under a beat. The lab's control arm only. */
export const NOTE_MS = 260;

/** The OLD sound, byte for byte: MusicGame.tsx's VOICE_SPEC until 2026-10-03. The lab's control arm. */
export const TODAY: Readonly<Record<Voice, { type: OscillatorType; gain: number }>> = {
  round: { type: "sine", gain: 0.2 },
  soft: { type: "triangle", gain: 0.18 },
  bright: { type: "square", gain: 0.1 },
};

/** The old sound: the oscillator a square used to play. The lab's control arm. */
export function toneFor(row: number, voice: Voice, at?: number): ToneOptions {
  const spec = TODAY[voice];
  return { freq: pitchFor(row), ms: NOTE_MS, type: spec.type, gain: spec.gain, at };
}

/**
 * The candidate: which struck instrument each voice button plays.
 *
 * Mapped on what the three glyphs already promise - round is the marimba's
 * round wooden note, soft the kalimba tine, bright the glass.
 */
export const TIMBRE_FOR: Readonly<Record<Voice, Timbre>> = {
  round: "bar",
  soft: "tine",
  bright: "glass",
};

/** The candidate: the struck note a square plays. Same pitch as today. */
export function noteFor(row: number, voice: Voice, at?: number): NoteOptions {
  return { freq: pitchFor(row), timbre: TIMBRE_FOR[voice], at };
}

/**
 * The bass: the tune's home note an octave below its lowest square (C3 under
 * a C4-C5 grid). A pedal on the tonic, because every note of a pentatonic
 * scale is consonant over it - so the bass can never make a child's tune sound
 * wrong, whatever they drew.
 */
export const BASS_FREQ = PENTATONIC[0] / 2;

/**
 * Quiet: under the tune, never on top of it. Multiplies the tine's own level,
 * so the bass's fundamental peaks at 0.8 of a soft-voice square's - and at
 * 130 Hz the ear hears that as a good deal quieter than the same level at C5.
 */
export const BASS_GAIN = 0.8;

/** A tine: it carries harmonics a phone speaker can reproduce at 130 Hz. */
export const BASS_TIMBRE: Timbre = "tine";

/** Where the bass sounds: only the loop's first beat, or every second beat. */
export type BassPattern = "none" | "downbeat" | "every-second";

export const BASS_PATTERNS: readonly BassPattern[] = ["none", "downbeat", "every-second"];

/** Does the bass sound on this beat? */
export function bassOn(pattern: BassPattern, col: number): boolean {
  if (!Number.isInteger(col) || col < 0) return false;
  if (pattern === "downbeat") return col === 0;
  if (pattern === "every-second") return col % 2 === 0;
  return false;
}

/** The bass note for a beat, or null when the pattern rests there. */
export function bassFor(pattern: BassPattern, col: number, at?: number): NoteOptions | null {
  if (!bassOn(pattern, col)) return null;
  return { freq: BASS_FREQ, timbre: BASS_TIMBRE, gain: BASS_GAIN, at };
}
