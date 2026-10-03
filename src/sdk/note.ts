// A struck NOTE at a pitch the game chose, played through `ctx.audio.voice()`.
//
// `tone()` is one bare oscillator with a fade, which is right for a beep and
// wrong for a tune: Music Box played every square through it and a player
// wrote "the music feels too empty". The struck voices in `voice.ts` are the
// app's designed instruments (decaying partials, a mallet, a shared room), so
// this module turns "this timbre at this pitch" into one of those specs.
//
// PURE: no WebAudio, no DOM. The port plays what this returns.
//
// NOT IN THE SHELL. `audio.ts` is in every child's first visit and imports
// nothing from here; only a game that plays notes does, so this table lands in
// that game's own chunk. Putting it behind a port method instead measured
// +221 B gz on the first visit (2026-10-03), against 11 B of headroom.
//
// CACHED, and the cache is not an optimisation. A spec is the identity a
// replay is built on - a tune that minted a fresh object per note would still
// SOUND the same, but `voiceEngine`'s per-voice trim is keyed by content and
// a cache here is what keeps "the same note" one object, one measurement, one
// level, forever.
//
// NO JITTER. The named SFX wobble in pitch so the 200th tap is not a byte copy
// of the first; a tune must be the opposite - a toy that plays a melody
// slightly differently each time reads as broken.
//
// NO TRIM. Nothing warms these specs, so `playVoice` plays them at
// trim 1 and the LEVEL below is the absolute level. That is deliberate: a
// warmed note would play its first strike unmatched and every later one
// matched, which in a looping tune is an audible step on beat one. The levels
// were set by the Music Box listening lab against today's oscillator, matched
// on RMS - see `src/lab/musicSound/`.

import type { AudioPort } from "./types";
import { struck, type StruckOptions, type VoiceSpec } from "./voice";

/**
 * What a note is made of: a tuned wooden bar (marimba), a metal tine (kalimba,
 * electric piano) or thin glass - the struck modes `voice.ts` already ships.
 */
export type Timbre = "bar" | "tine" | "glass";

export interface NoteOptions {
  /** Pitch in Hz. The game owns its scale; this module owns the instrument. */
  freq: number;
  timbre: Timbre;
  /** ABSOLUTE AudioContext time to start at (see `AudioPort.time()`). Omitted = now. */
  at?: number;
  /** Multiplier on the timbre's own level. Default 1. */
  gain?: number;
}

export const TIMBRES: readonly Timbre[] = ["bar", "tine", "glass"];

export interface TimbreShape extends StruckOptions {
  /** The fundamental's life in ms; upper partials die proportionally sooner. */
  ms: number;
}

/**
 * How each timbre is struck. Longer than a beat on purpose: a note that rings
 * into the next one is what makes a sparse tune sound like an instrument in a
 * room rather than a row of clicks with silence between them.
 */
//
// LEVELS, measured 2026-10-03 in the lab on an offline render (2 loops, 3
// tunes): at the first-guess gains of 0.20 / 0.19 / 0.15 the struck notes ran
// 4.4 / 7.9 / 6.4 dB RMS LOUDER than today's sine / triangle / square for the
// same voice button, and RMS-matching needed x0.60 / x0.40 / x0.48 (each the
// same within 0.02 across sparse, busy and surprise). The gains below are those
// products, so the candidate plays at today's loudness rather than winning or
// losing an ear test on volume.
export const TIMBRE_SHAPE: Readonly<Record<Timbre, Readonly<TimbreShape>>> = {
  // Marimba: a soft mallet, round, the quickest decay of the three.
  bar: { ms: 520, gain: 0.12, damp: 0.85, mallet: 0.05, malletHz: 2400, space: 0.22, tail: 1.0, warmth: 7000 },
  // Kalimba / electric piano: nearly harmonic, the longest ring.
  tine: { ms: 720, gain: 0.076, damp: 0.9, mallet: 0.025, malletHz: 1800, space: 0.24, tail: 1.1, warmth: 6000 },
  // Thin glass: bright and inharmonic, its top dies first, the most room.
  glass: { ms: 560, gain: 0.072, damp: 0.95, space: 0.28, tail: 1.2, warmth: 9000 },
};

export function isTimbre(value: unknown): value is Timbre {
  return typeof value === "string" && (TIMBRES as readonly string[]).includes(value);
}

const cache = new Map<string, VoiceSpec>();

/** The spec for `timbre` at `freq` Hz. Same arguments, same object. */
export function noteSpec(timbre: Timbre, freq: number): VoiceSpec {
  if (!isTimbre(timbre)) throw new Error(`note: no timbre ${String(timbre)}`);
  if (!Number.isFinite(freq) || freq <= 0) throw new Error(`note: no pitch ${freq}`);
  const key = `${timbre}:${freq}`;
  const hit = cache.get(key);
  if (hit) return hit;
  const { ms, ...shape } = TIMBRE_SHAPE[timbre];
  const spec = struck(freq, ms, timbre, { ...shape, jitter: 0 });
  cache.set(key, spec);
  return spec;
}

/**
 * Play one note through the game's audio port: the production path for a game
 * that owns its scale - `playNote(ctx.audio, { freq, timbre })`. Mute, the
 * clock and the context are the port's; the instrument is this module's.
 */
export function playNote(audio: Pick<AudioPort, "voice">, n: NoteOptions): void {
  audio.voice(noteSpec(n.timbre, n.freq), { at: n.at, gain: n.gain });
}
