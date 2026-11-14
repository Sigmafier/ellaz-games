// Piano - WHAT a key sounds like, as data.
//
// A piano string is struck by a felt hammer, so it is built from the same
// `struck()` physics every designed voice in this app uses (`@sdk/voice`):
// decaying partials with the high ones dying first, a short hammer transient,
// and the shared room. What makes it a piano rather than the marimba or the
// kalimba `@sdk/note` offers is the partial table - a near-harmonic series a
// little STRETCHED (a real string's overtones run slightly sharp) - and that a
// low note rings longer and darker than a high one.
//
// CACHED, for the reason `@sdk/note` gives: one spec per (key, sustain), so the
// same key is the same object every time it is struck.
//
// PURE: no DOM, no WebAudio. The port plays what this returns.
import { struck, type Partials, type VoiceSpec } from "@sdk/voice";
import { freqOf } from "./logic";

/** Six partials, slightly stretched, falling off roughly as 1/n^1.4. */
export const PIANO_PARTIALS: Partials = [
  [1, 1],
  [2.002, 0.46],
  [3.006, 0.24],
  [4.012, 0.12],
  [5.02, 0.065],
  [6.03, 0.035],
];

/** How long the fundamental rings, at middle C, with the pedal up / down. */
export const RING_MS = { dry: 900, sustain: 2600 } as const;

/**
 * A key's ring time: a low string rings longer than a high one. Scaled by
 * pitch around middle C and clamped so C2 never drones and C7 is not a click.
 */
export function ringMs(midi: number, sustain: boolean): number {
  const base = sustain ? RING_MS.sustain : RING_MS.dry;
  const scale = Math.pow(2, (60 - midi) / 24);
  return Math.round(Math.min(base * 2, Math.max(base * 0.45, base * scale)));
}

/** Darker at the bottom, brighter at the top, the way a real instrument is voiced. */
export function warmthFor(midi: number): number {
  return Math.round(Math.min(9000, Math.max(2600, 2600 + (midi - 36) * 110)));
}

/** Level: the piano plays at about the level of Music Box's struck notes. */
export const PIANO_GAIN = 0.11;

const cache = new Map<string, VoiceSpec>();

export function pianoSpec(midi: number, sustain: boolean): VoiceSpec {
  const key = `${midi}:${sustain ? 1 : 0}`;
  const hit = cache.get(key);
  if (hit) return hit;
  const spec = struck(freqOf(midi), ringMs(midi, sustain), PIANO_PARTIALS, {
    gain: PIANO_GAIN,
    damp: 1.05,
    mallet: 0.035,
    malletHz: 2200,
    space: sustain ? 0.26 : 0.18,
    tail: sustain ? 1.6 : 1.0,
    warmth: warmthFor(midi),
    jitter: 0,
  });
  cache.set(key, spec);
  return spec;
}
