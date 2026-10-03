// The arms of the Music Box listening A/B, and the one function that turns a
// beat of a tune into sound for any of them - live or offline.
//
// Every arm plays through the PRODUCTION code, never a lookalike: the app's
// own `audioPort.tone` and `audioPort.voice` methods, run against whichever
// context this lab hands them (live, or an OfflineAudioContext for measuring
// and WAVs). So the loudness numbers and the WAVs describe what a child hears.
import { audioPort } from "@sdk/audio";
import { playNote, type NoteOptions } from "@sdk/note";
import type { AudioPort } from "@sdk/types";
import { columnRows, type TuneState, type Voice } from "../../games/music/logic";
import { STEP_MS, TODAY, bassFor, noteFor, toneFor, type BassPattern } from "../../games/music/sound";

export type ArmId = "today" | "struck" | "bass1" | "bass2";

export interface Arm {
  id: ArmId;
  /** Shown only after Reveal. */
  name: string;
  struck: boolean;
  bass: BassPattern;
}

export const ARMS: readonly Arm[] = [
  { id: "today", name: "A - today: one bare oscillator per note", struck: false, bass: "none" },
  { id: "struck", name: "B - struck: marimba / kalimba / glass, with a room", struck: true, bass: "none" },
  { id: "bass1", name: "C - struck + a quiet bass on beat 1", struck: true, bass: "downbeat" },
  { id: "bass2", name: "C2 - struck + a quiet bass on every second beat", struck: true, bass: "every-second" },
];

export const STEP_S = STEP_MS / 1000;

/**
 * The app's real port, pointed at `ctx`. Its methods read exactly two things
 * off `this` - whether it is muted, and its context - so running them against
 * this pair runs the shipped bodies, not a copy that could drift from them.
 */
function portOn(ctx: BaseAudioContext): AudioPort {
  const self = { _muted: false, ensureCtx: () => ctx };
  return {
    tone: (opts) => audioPort.tone.call(self as unknown as AudioPort, opts),
    voice: (spec, opts) => audioPort.voice.call(self as unknown as AudioPort, spec, opts),
  } as AudioPort;
}

function strike(port: AudioPort, n: NoteOptions, gain: number): void {
  playNote(port, { ...n, gain: (n.gain ?? 1) * gain });
}

/**
 * Schedule beat `col` of `tune` at absolute time `when`, in `voice`, through
 * `arm`, scaled by `gain` (the loudness match - every path is linear in it).
 */
export function scheduleBeat(
  ctx: BaseAudioContext,
  arm: Arm,
  tune: TuneState,
  col: number,
  voice: Voice,
  when: number,
  gain: number,
): void {
  const port = portOn(ctx);
  for (const row of columnRows(tune, col)) {
    if (arm.struck) {
      strike(port, noteFor(row, voice, when), gain);
    } else {
      port.tone({ ...toneFor(row, voice, when), gain: TODAY[voice].gain * gain });
    }
  }
  const bass = bassFor(arm.bass, col, when);
  if (bass) strike(port, bass, gain);
}

export const SAMPLE_RATE = 44100;
/** Long enough for the longest reverb tail after the last beat. */
export const TAIL_S = 1.6;

/** Render `loops` loops of a tune offline. */
export async function renderArm(
  arm: Arm,
  tune: TuneState,
  voice: Voice,
  gain: number,
  loops: number,
): Promise<AudioBuffer> {
  const beats = tune.steps * loops;
  const seconds = beats * STEP_S + TAIL_S;
  const off = new OfflineAudioContext(2, Math.ceil(SAMPLE_RATE * seconds), SAMPLE_RATE);
  for (let i = 0; i < beats; i++) {
    scheduleBeat(off, arm, tune, i % tune.steps, voice, 0.05 + i * STEP_S, gain);
  }
  return off.startRendering();
}

export interface Level {
  /** RMS over the loops themselves (not the silent tail), both channels, linear. */
  rms: number;
  /** Absolute sample peak anywhere in the render, linear. */
  peak: number;
}

export function measure(buf: AudioBuffer, windowS: number): Level {
  const end = Math.min(buf.length, Math.ceil(windowS * buf.sampleRate));
  let sum = 0;
  let n = 0;
  let peak = 0;
  for (let ch = 0; ch < buf.numberOfChannels; ch++) {
    const d = buf.getChannelData(ch);
    for (let i = 0; i < d.length; i++) {
      const v = d[i];
      const a = Math.abs(v);
      if (a > peak) peak = a;
      if (i < end) {
        sum += v * v;
        n++;
      }
    }
  }
  return { rms: Math.sqrt(sum / Math.max(1, n)), peak };
}

export const dB = (x: number): number => (x > 0 ? 20 * Math.log10(x) : -Infinity);

/** 16-bit PCM WAV, interleaved. */
export function wav(buf: AudioBuffer): Uint8Array {
  const ch = buf.numberOfChannels;
  const len = buf.length;
  const bytes = 44 + len * ch * 2;
  const out = new DataView(new ArrayBuffer(bytes));
  const str = (o: number, s: string) => {
    for (let i = 0; i < s.length; i++) out.setUint8(o + i, s.charCodeAt(i));
  };
  str(0, "RIFF");
  out.setUint32(4, bytes - 8, true);
  str(8, "WAVE");
  str(12, "fmt ");
  out.setUint32(16, 16, true);
  out.setUint16(20, 1, true);
  out.setUint16(22, ch, true);
  out.setUint32(24, buf.sampleRate, true);
  out.setUint32(28, buf.sampleRate * ch * 2, true);
  out.setUint16(32, ch * 2, true);
  out.setUint16(34, 16, true);
  str(36, "data");
  out.setUint32(40, len * ch * 2, true);
  const data = Array.from({ length: ch }, (_, c) => buf.getChannelData(c));
  let o = 44;
  for (let i = 0; i < len; i++) {
    for (let c = 0; c < ch; c++) {
      const s = Math.max(-1, Math.min(1, data[c][i]));
      out.setInt16(o, s < 0 ? s * 0x8000 : s * 0x7fff, true);
      o += 2;
    }
  }
  return new Uint8Array(out.buffer);
}
