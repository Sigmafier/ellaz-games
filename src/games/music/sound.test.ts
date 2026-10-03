import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { noteSpec } from "@sdk/note";
import { MODES } from "@sdk/voice";
import type { NoteOptions } from "@sdk/note";
import { ROWS, VOICES, pitchFor, type Voice } from "./logic";
import {
  BASS_FREQ,
  BASS_PATTERNS,
  NOTE_MS,
  STEP_MS,
  TIMBRE_FOR,
  TODAY,
  bassFor,
  bassOn,
  noteFor,
  toneFor,
} from "./sound";

const GAME = readFileSync(new URL("./MusicGame.tsx", import.meta.url), "utf8");

describe("Music Box's candidate sound: six rows by three voices", () => {
  const all: { row: number; voice: Voice; opts: NoteOptions }[] = [];
  for (let row = 0; row < ROWS; row++) {
    for (const voice of VOICES) all.push({ row, voice, opts: noteFor(row, voice) });
  }

  it("is eighteen notes, and eighteen distinct specs", () => {
    expect(all.length).toBe(18);
    const specs = new Set(all.map(({ opts }) => noteSpec(opts.timbre, opts.freq)));
    expect(specs.size).toBe(18);
  });

  it("caches every one: asking twice returns the same object", () => {
    for (const { opts } of all) {
      expect(noteSpec(opts.timbre, opts.freq)).toBe(noteSpec(opts.timbre, opts.freq));
    }
  });

  it("plays the SAME pitch today's oscillator plays, top row highest", () => {
    for (const { row, voice, opts } of all) {
      expect(opts.freq).toBe(pitchFor(row));
      expect(opts.freq).toBe(toneFor(row, voice).freq);
    }
    expect(noteFor(0, "round").freq).toBeGreaterThan(noteFor(ROWS - 1, "round").freq);
  });

  it("gives each voice its own instrument: round = bar, soft = tine, bright = glass", () => {
    expect(TIMBRE_FOR).toEqual({ round: "bar", soft: "tine", bright: "glass" });
    for (const { voice, opts } of all) {
      const spec = noteSpec(opts.timbre, opts.freq);
      const ratios = spec.layers.filter((l) => l.wave !== "noise").map((l) => l.ratio);
      expect(ratios).toEqual(MODES[TIMBRE_FOR[voice]].map(([r]) => r));
    }
  });

  it("passes a schedule time through untouched", () => {
    expect(noteFor(2, "soft", 1.25).at).toBe(1.25);
    expect(noteFor(2, "soft").at).toBeUndefined();
  });
});

describe("the game plays the arm the operator picked: struck + a bass on beat 1", () => {
  it("rings every square through playNote(noteFor(...)), never the old oscillator", () => {
    expect(GAME).toMatch(/playNote\(ctx\.audio, noteFor\(row, voice\)\)/);
    expect(GAME).not.toMatch(/ctx\.audio\.tone\(/);
    expect(GAME).not.toMatch(/VOICE_SPEC/);
  });

  it("puts the quiet bass on the loop's first beat only", () => {
    expect(GAME).toMatch(/const BASS = "downbeat"/);
    expect(GAME).toMatch(/bassFor\(BASS, col\)/);
  });

  it("takes its beat length from this module rather than keeping a copy", () => {
    expect(GAME).toMatch(/import \{[^}]*\bSTEP_MS\b[^}]*\} from "\.\/sound"/);
    expect(GAME).not.toMatch(/const STEP_MS =/);
    expect(GAME).not.toMatch(/const NOTE_MS =/);
  });
});

describe("the old sound stays the lab's control arm", () => {
  it("is the oscillator the game used to build", () => {
    expect(toneFor(0, "bright")).toEqual({ freq: pitchFor(0), ms: NOTE_MS, type: "square", gain: 0.1, at: undefined });
    expect(TODAY).toEqual({
      round: { type: "sine", gain: 0.2 },
      soft: { type: "triangle", gain: 0.18 },
      bright: { type: "square", gain: 0.1 },
    });
    expect(STEP_MS).toBe(320);
    expect(NOTE_MS).toBe(260);
  });
});

describe("the bass", () => {
  it("is the tonic an octave under the lowest square", () => {
    expect(BASS_FREQ).toBeCloseTo(pitchFor(ROWS - 1) / 2, 6);
  });

  it("sounds where its pattern says and nowhere else", () => {
    const beats = (p: (typeof BASS_PATTERNS)[number]) =>
      Array.from({ length: 8 }, (_, c) => c).filter((c) => bassOn(p, c));
    expect(beats("none")).toEqual([]);
    expect(beats("downbeat")).toEqual([0]);
    expect(beats("every-second")).toEqual([0, 2, 4, 6]);
    expect(bassOn("downbeat", -1)).toBe(false);
    expect(bassOn("every-second", 1.5)).toBe(false);
  });

  it("is quieter than a square and plays through a cached spec", () => {
    const b = bassFor("downbeat", 0)!;
    expect(b.gain).toBeGreaterThan(0);
    expect(b.gain).toBeLessThan(1);
    expect(noteSpec(b.timbre, b.freq)).toBe(noteSpec(b.timbre, b.freq));
    expect(bassFor("downbeat", 1)).toBeNull();
  });
});
