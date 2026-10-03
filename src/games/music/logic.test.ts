import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { SESSION_KEY, createSessionPort } from "@sdk/session";
import type { SaveStore } from "@sdk/types";
import { PENTATONIC } from "@shared/notes";
import { mulberry32, seedFrom } from "@shared/rng";
import {
  LENGTHS,
  ROWS,
  STEPS,
  VOICES,
  cellIndex,
  clearTune,
  columnRows,
  isMusicSnapshot,
  isVoice,
  newTune,
  noteCount,
  pitchFor,
  resize,
  setVoice,
  surprise,
  toggleCell,
  resumeTune,
  LEGACY_SNAPSHOT_VERSION,
  SNAPSHOT_VERSION,
  type TuneState,
} from "./logic";

const seeded = (label: string) => mulberry32(seedFrom(label));

/** Turn a picture of a tune into a state, so a failure is readable in the diff. */
function tuneFrom(rows: string[], voice: TuneState["voice"] = "round"): TuneState {
  const steps = rows[0].length;
  const level = LENGTHS.find((l) => STEPS[l] === steps)!;
  const state = newTune(level, voice);
  return {
    ...state,
    cells: state.cells.map((_, i) => rows[Math.floor(i / steps)][i % steps] === "x"),
  };
}

describe("a blank tune", () => {
  it("opens with nothing in it, at every length", () => {
    for (const level of LENGTHS) {
      const tune = newTune(level);
      expect(tune.steps).toBe(STEPS[level]);
      expect(tune.cells).toHaveLength(ROWS * STEPS[level]);
      expect(tune.cells.every((c) => c === false)).toBe(true);
      expect(noteCount(tune)).toBe(0);
    }
  });

  it("has one row per note the scale offers", () => {
    // The grid IS the scale. A row with no pitch behind it would be a square a
    // child can turn on that makes no sound.
    expect(ROWS).toBe(PENTATONIC.length);
  });

  it("starts on a voice this game actually has", () => {
    expect(VOICES).toContain(newTune("medium").voice);
  });
});

describe("turning notes on and off", () => {
  it("reports which square changed, and which way", () => {
    const blank = newTune("medium");
    const at = cellIndex(2, 3, blank.steps);
    const on = toggleCell(blank, at);
    expect(on.outcome).toEqual({ kind: "on", row: 2, col: 3 });
    expect(noteCount(on.state)).toBe(1);

    const off = toggleCell(on.state, at);
    expect(off.outcome).toEqual({ kind: "off", row: 2, col: 3 });
    expect(noteCount(off.state)).toBe(0);
  });

  it("leaves everything else alone", () => {
    const tune = tuneFrom(["x.....", "......", "......", "......", "......", "......"]);
    const next = toggleCell(tune, cellIndex(5, 5, tune.steps)).state;
    expect(next.cells[cellIndex(0, 0, tune.steps)]).toBe(true);
    expect(noteCount(next)).toBe(2);
  });

  it("says nothing about a square that is not there", () => {
    const tune = newTune("short");
    for (const bad of [-1, tune.cells.length, 2.5, Number.NaN]) {
      const { state, outcome } = toggleCell(tune, bad);
      expect(outcome).toEqual({ kind: "ignored" });
      expect(state).toBe(tune);
    }
  });

  it("lets a whole column ring at once", () => {
    // Chords are allowed on purpose: the scale has no semitone and no tritone,
    // so ANY handful of these notes together is consonant. A one-note-per-column
    // rule would be protecting a child from something that cannot happen.
    const tune = tuneFrom(["x...", "x...", "....", "x...", "....", "...."]);
    expect(columnRows(tune, 0)).toEqual([0, 1, 3]);
    expect(columnRows(tune, 1)).toEqual([]);
  });

  it("reads a column from the top down, so a chord always plays in the same order", () => {
    const tune = tuneFrom(["....", ".x..", ".x..", "....", ".x..", "...."]);
    expect(columnRows(tune, 1)).toEqual([1, 2, 4]);
  });

  it("has nothing to play in a column that is not there", () => {
    const tune = newTune("short");
    expect(columnRows(tune, -1)).toEqual([]);
    expect(columnRows(tune, tune.steps)).toEqual([]);
  });
});

describe("which note a row is", () => {
  it("runs high at the top and low at the bottom", () => {
    // The one thing this game teaches without a word: higher up is higher up.
    // Getting it upside down would be invisible in every other test here.
    const pitches = Array.from({ length: ROWS }, (_, r) => pitchFor(r));
    expect(pitches[0]).toBe(Math.max(...PENTATONIC));
    expect(pitches[ROWS - 1]).toBe(Math.min(...PENTATONIC));
    for (let r = 1; r < ROWS; r++) expect(pitches[r]).toBeLessThan(pitches[r - 1]);
  });

  it("uses the shared scale rather than a private copy of it", () => {
    expect(new Set(Array.from({ length: ROWS }, (_, r) => pitchFor(r)))).toEqual(
      new Set(PENTATONIC),
    );
  });

  it("refuses a row that has no note behind it", () => {
    // Loudly, rather than returning undefined: a silent square is a bug a child
    // would report as "this one is broken", weeks later.
    expect(() => pitchFor(ROWS)).toThrow(/no note/);
    expect(() => pitchFor(-1)).toThrow(/no note/);
  });
});

describe("changing the length", () => {
  it("keeps every note that still fits", () => {
    // A child's tune is the thing they made. Wiping it to change the length
    // would be the same mistake as ranking their drawing.
    const short = tuneFrom(["x...", "..x.", "....", "....", "....", "...x"]);
    const long = resize(short, "long");
    expect(long.steps).toBe(STEPS.long);
    expect(long.cells[cellIndex(0, 0, long.steps)]).toBe(true);
    expect(long.cells[cellIndex(1, 2, long.steps)]).toBe(true);
    expect(long.cells[cellIndex(5, 3, long.steps)]).toBe(true);
    expect(noteCount(long)).toBe(3);
  });

  it("drops the notes past the new end, and nothing else", () => {
    const long = tuneFrom([
      "x......x",
      "........",
      "........",
      "........",
      "........",
      "........",
    ]);
    const short = resize(long, "short");
    expect(short.steps).toBe(STEPS.short);
    expect(noteCount(short)).toBe(1);
    expect(short.cells[cellIndex(0, 0, short.steps)]).toBe(true);
  });

  it("survives a round trip when nothing was cut", () => {
    const short = tuneFrom(["x.x.", "....", ".x..", "....", "....", "...x"]);
    expect(resize(resize(short, "long"), "short")).toEqual(short);
  });

  it("keeps the chosen voice", () => {
    expect(resize(newTune("short", "bright"), "long").voice).toBe("bright");
  });

  it("changes nothing when the length is already that", () => {
    const tune = tuneFrom(["x...", "....", "....", "....", "....", "...."]);
    expect(resize(tune, tune.level)).toEqual(tune);
  });
});

describe("the voice", () => {
  it("only accepts one this game has", () => {
    for (const v of VOICES) expect(isVoice(v)).toBe(true);
    for (const bad of ["loud", "", null, 3, undefined]) expect(isVoice(bad)).toBe(false);
  });

  it("changes the voice and not the notes", () => {
    const tune = tuneFrom(["x.x.", "....", "....", "....", "....", "...."]);
    const next = setVoice(tune, "soft");
    expect(next.voice).toBe("soft");
    expect(next.cells).toEqual(tune.cells);
  });

  it("ignores a voice it has never heard of", () => {
    const tune = newTune("short", "round");
    expect(setVoice(tune, "wobble" as never)).toBe(tune);
  });
});

describe("starting from something rather than nothing", () => {
  it("puts exactly one note in every column", () => {
    // The blank-page problem, answered. A child who taps this gets a tune that
    // already sounds like something and can then be changed.
    for (const level of LENGTHS) {
      const tune = surprise(newTune(level), seeded(`s-${level}`));
      expect(noteCount(tune)).toBe(STEPS[level]);
      for (let col = 0; col < tune.steps; col++) expect(columnRows(tune, col)).toHaveLength(1);
    }
  });

  it("replaces what was there rather than adding to it", () => {
    const busy = tuneFrom(["xxxx", "xxxx", "xxxx", "xxxx", "xxxx", "xxxx"]);
    expect(noteCount(surprise(busy, seeded("replace")))).toBe(busy.steps);
  });

  it("replays the same tune from the same seed, and a different one otherwise", () => {
    const a = surprise(newTune("long"), seeded("one"));
    expect(surprise(newTune("long"), seeded("one")).cells).toEqual(a.cells);
    expect(surprise(newTune("long"), seeded("two")).cells).not.toEqual(a.cells);
  });

  it("keeps the length and the voice", () => {
    const tune = surprise(newTune("medium", "bright"), seeded("keep"));
    expect(tune.steps).toBe(STEPS.medium);
    expect(tune.voice).toBe("bright");
  });
});

describe("clearing", () => {
  it("empties the grid and keeps the length and the voice", () => {
    const tune = surprise(newTune("long", "soft"), seeded("clear"));
    const blank = clearTune(tune);
    expect(noteCount(blank)).toBe(0);
    expect(blank.steps).toBe(tune.steps);
    expect(blank.voice).toBe("soft");
  });
});

describe("no record and no coins, like coloring", () => {
  it("has nothing left to report a score or a milestone with", async () => {
    // The pure module IS the toy's rules; if a scoring helper comes back it
    // comes back here, and this names the ruling it would be undoing.
    const logic: Record<string, unknown> = await import("./logic");
    for (const gone of ["scoreReport", "milestoneStep", "MILESTONE_EVERY"]) {
      expect(logic[gone], `${gone} is back`).toBeUndefined();
    }
  });
});

describe("the renderer pays nothing and ranks nothing", () => {
  const game = readFileSync(new URL("./MusicGame.tsx", import.meta.url), "utf8");

  it("never calls winMoment, the score port or the rewards port", () => {
    expect(game).not.toMatch(/winMoment|ctx\.score|ctx\.rewards/);
  });

  it("shows the notes in the tune with no record beside them", () => {
    expect(game).toMatch(/stats=\{\[\{ icon: "layers", label: T\.notes, value: notes, compact: true \}\]\}/);
  });
});

describe("the picker says what it picks", () => {
  const game = readFileSync(new URL("./MusicGame.tsx", import.meta.url), "utf8");

  it("is named Length, in every language the game ships, never Difficulty", () => {
    const row = game.match(/const LENGTH_LABEL: Record<Locale, string> = \{([^}]*)\}/)?.[1] ?? "";
    expect(row).toContain('en: "Length"');
    for (const l of ["he", "en", "es", "sv"]) expect(row, l).toMatch(new RegExp(`\\b${l}: "[^"]+"`));
    expect(game).toMatch(/levelLabel=\{LENGTH_LABEL\[ctx\.locale\]\}/);
  });

  it("spells the middle length out: Medium, not Med", () => {
    expect(game).toMatch(/\{ id: "medium", label: \{ he: "[^"]+", en: "Medium",/);
  });
});

describe("the save", () => {
  const tune = tuneFrom(["x.x.", "....", ".x..", "....", "....", "...x"]);

  it("is version 2, so ctx.session discards what a paying build wrote", () => {
    expect(SNAPSHOT_VERSION).toBe(2);
  });

  it("takes a tune of the right size, and nothing else", () => {
    expect(isMusicSnapshot({ state: tune })).toBe(true);
    expect(isMusicSnapshot({ state: newTune("long", "bright") })).toBe(true);
  });

  it("still reads the tune out of an old-shaped record without throwing - the extra latches are ignored", () => {
    // What version 1 wrote. The version check refuses it first in practice;
    // this is the shape check alone, which must never throw on it.
    expect(isMusicSnapshot({ state: tune, paidStep: 3, bestFired: true })).toBe(true);
  });

  it("refuses anything it cannot draw, without throwing", () => {
    for (const bad of [
      null,
      undefined,
      42,
      "tune",
      {},
      { state: null },
      { state: { ...tune, level: "huge" } },
      { state: { ...tune, level: "toString" } },
      { state: { ...tune, steps: 8 } },
      { state: { ...tune, cells: tune.cells.slice(1) } },
      { state: { ...tune, cells: tune.cells.map(() => 1) } },
      { state: { ...tune, voice: "kazoo" } },
    ]) {
      expect(() => isMusicSnapshot(bad)).not.toThrow();
      expect(isMusicSnapshot(bad), JSON.stringify(bad)).toBe(false);
    }
  });
});

describe("a tune saved before the update comes back (operator: keep old tunes)", () => {
  /** A real save store, the shape `ctx.storage` hands the session port. */
  const store = (seed: Record<string, unknown>): SaveStore => {
    const raw: Record<string, unknown> = { ...seed };
    return {
      get: <T,>(key: string, fallback: T): T => (key in raw ? raw[key] : fallback) as T,
      set: <T,>(key: string, value: T): void => {
        raw[key] = value;
      },
      remove: (key: string): void => {
        delete raw[key];
      },
    } as SaveStore;
  };
  const NOW = 1_790_000_000_000;
  const tune = tuneFrom(["x.x.x.", "......", ".x..x.", "......", "...x..", "x....x"], "soft");
  const port = (envelope: unknown) => createSessionPort(store({ [SESSION_KEY]: envelope }), { now: () => NOW });
  const load = (envelope: unknown) => resumeTune((spec) => port(envelope).load(spec));

  it("restores the same grid from what a paying build really wrote (version 1, with its latches)", () => {
    // The envelope `session.ts` writes, around the snapshot MusicGame v1 wrote.
    const v1 = { v: LEGACY_SNAPSHOT_VERSION, at: NOW - 60_000, s: { state: tune, paidStep: 3, bestFired: true } };
    const back = load(v1);
    expect(back?.state.cells).toEqual(tune.cells);
    expect(back?.state.level).toBe("medium");
    expect(back?.state.voice).toBe("soft");
  });

  it("drops the old score latches on the way in", () => {
    const back = load({ v: 1, at: NOW, s: { state: tune, paidStep: 3, bestFired: true } });
    expect(Object.keys(back ?? {})).toEqual(["state"]);
  });

  it("reads its own version-2 save", () => {
    expect(load({ v: SNAPSHOT_VERSION, at: NOW, s: { state: tune } })?.state.cells).toEqual(tune.cells);
  });

  it("still refuses a version it never wrote, and a v1 save whose grid is broken", () => {
    expect(load({ v: 3, at: NOW, s: { state: tune } })).toBeUndefined();
    expect(load({ v: 1, at: NOW, s: { state: { ...tune, cells: tune.cells.slice(2) }, paidStep: 0, bestFired: false } })).toBeUndefined();
  });

  it("the game reads through resumeTune, so the fallback is really on the load path", () => {
    const game = readFileSync(new URL("./MusicGame.tsx", import.meta.url), "utf8");
    expect(game).toContain("resumeTune((spec) => ctx.session.load(spec))");
  });
});
