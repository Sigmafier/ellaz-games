import { describe, expect, it } from "vitest";
import { TIMBRES, TIMBRE_SHAPE, isTimbre, noteSpec, playNote, type Timbre } from "./note";
import { MODES, jitterRatio, voiceDurationMs } from "./voice";
import { audioPort } from "./audio";
import type { VoiceOptions } from "./types";
import type { VoiceSpec } from "./voice";

/**
 * `note()` is how a game with its own scale plays a designed instrument. A
 * spec that fails to synthesise is SILENT and throws nothing, so the shape of
 * every spec is asserted as data here, in node, the way voice.test.ts does it.
 */
describe("a struck note", () => {
  it("knows exactly three timbres, and each is a struck mode the shell already ships", () => {
    expect([...TIMBRES]).toEqual(["bar", "tine", "glass"]);
    for (const t of TIMBRES) expect(Object.keys(MODES)).toContain(t);
    expect(isTimbre("bar")).toBe(true);
    expect(isTimbre("sine")).toBe(false);
    expect(isTimbre(undefined)).toBe(false);
  });

  it("is the SAME object for the same timbre and pitch, and a new one for a new pitch", () => {
    const a = noteSpec("bar", 261.63);
    expect(noteSpec("bar", 261.63)).toBe(a);
    expect(noteSpec("bar", 293.66)).not.toBe(a);
    expect(noteSpec("tine", 261.63)).not.toBe(a);
  });

  it("plays the pitch it was asked for, with no per-play wobble", () => {
    for (const t of TIMBRES) {
      const spec = noteSpec(t, 440);
      expect(spec.freq).toBe(440);
      // A tune must replay identically; the SFX jitter must not leak in.
      expect(jitterRatio(spec, () => 0)).toBe(1);
      expect(jitterRatio(spec, () => 0.999)).toBe(1);
    }
  });

  it("carries its timbre's partials and only those, plus at most one mallet", () => {
    for (const t of TIMBRES) {
      const spec = noteSpec(t, 330);
      const tonal = spec.layers.filter((l) => l.wave !== "noise");
      expect(tonal.map((l) => l.ratio)).toEqual(MODES[t].map(([r]) => r));
      const noise = spec.layers.filter((l) => l.wave === "noise");
      expect(noise.length).toBe(TIMBRE_SHAPE[t].mallet ? 1 : 0);
    }
  });

  it("is audible: every layer has a real gain and the note rings past one beat", () => {
    for (const t of TIMBRES) {
      const spec = noteSpec(t, 523.25);
      for (const l of spec.layers) {
        expect(l.gain).toBeGreaterThan(0);
        expect(Number.isFinite(l.gain)).toBe(true);
      }
      // 320ms is Music Box's beat. A note shorter than it is the empty sound
      // a player complained about.
      expect(voiceDurationMs(spec)).toBeGreaterThan(320);
      expect(spec.space).toBeGreaterThan(0);
    }
  });

  it("refuses a timbre or pitch it cannot play rather than minting a silent spec", () => {
    expect(() => noteSpec("sine" as Timbre, 440)).toThrow(/timbre/);
    expect(() => noteSpec("bar", 0)).toThrow(/pitch/);
    expect(() => noteSpec("bar", Number.NaN)).toThrow(/pitch/);
  });

  it("reaches the port as the cached spec, with its time and level untouched", () => {
    const calls: [VoiceSpec, VoiceOptions | undefined][] = [];
    const port = { voice: (spec: VoiceSpec, opts?: VoiceOptions) => void calls.push([spec, opts]) };
    playNote(port, { freq: 392, timbre: "tine", at: 2.5, gain: 0.8 });
    playNote(port, { freq: 392, timbre: "tine" });
    expect(calls.length).toBe(2);
    expect(calls[0][0]).toBe(noteSpec("tine", 392));
    expect(calls[1][0]).toBe(calls[0][0]);
    expect(calls[0][1]).toEqual({ at: 2.5, gain: 0.8 });
    expect(calls[1][1]).toEqual({ at: undefined, gain: undefined });
  });

  it("plays through a port that is a no-op, never a throw, where there is no audio at all", () => {
    expect(() => playNote(audioPort, { freq: 440, timbre: "bar" })).not.toThrow();
    expect(() => audioPort.play("tap")).not.toThrow();
  });
});
