import { describe, expect, it } from "vitest";
import {
  HIGHEST,
  LEVELS,
  LOWEST,
  MIDDLE_C,
  SONGS,
  SONG_IDS,
  TRAIL,
  blackCentre,
  blacks,
  clampStart,
  freqOf,
  isBlack,
  isDone,
  keyForMidi,
  keysFor,
  midiForKey,
  newFollow,
  press,
  pushTrail,
  shiftStart,
  songById,
  spanFor,
  timeline,
  upcoming,
  wanted,
  whites,
} from "./logic";

describe("pitch", () => {
  it("tunes A4 to 440 and middle C to 261.63", () => {
    expect(freqOf(69)).toBeCloseTo(440, 6);
    expect(freqOf(60)).toBeCloseTo(261.626, 2);
    expect(freqOf(81)).toBeCloseTo(880, 6);
  });

  it("knows which keys are black", () => {
    expect([60, 61, 62, 63, 64, 65, 66, 67, 68, 69, 70, 71].map(isBlack)).toEqual([
      false, true, false, true, false, false, true, false, true, false, true, false,
    ]);
  });
});

describe("the keyboards", () => {
  it("basic is ten white keys, C4 to E5", () => {
    const keys = keysFor("basic", false);
    expect(keys).toEqual([60, 62, 64, 65, 67, 69, 71, 72, 74, 76]);
    expect(blacks(keys)).toEqual([]);
    // a PC does not change the basic keyboard
    expect(keysFor("basic", true)).toEqual(keys);
  });

  it("advanced adds the seven black keys over the same span", () => {
    const keys = keysFor("advanced", true);
    expect(keys.length).toBe(17);
    expect(whites(keys)).toEqual(keysFor("basic", false));
    expect(blacks(keys)).toEqual([61, 63, 66, 68, 70, 73, 75]);
  });

  it("pro is two octaves on a PC and the small span on a phone", () => {
    expect(keysFor("pro", true)).toHaveLength(25);
    expect(whites(keysFor("pro", true))).toHaveLength(15);
    expect(keysFor("pro", false)).toEqual(keysFor("advanced", false));
    expect(spanFor("pro", true)).toBe(24);
    expect(spanFor("advanced", true)).toBe(16);
  });

  it("only pro honours a window start", () => {
    expect(keysFor("advanced", true, 36)[0]).toBe(MIDDLE_C);
    expect(keysFor("pro", true, 36)[0]).toBe(36);
  });

  it("a pro window snaps to a C and stays inside C2..C7", () => {
    expect(clampStart(63, 24)).toBe(60);
    expect(clampStart(-100, 24)).toBe(LOWEST);
    expect(clampStart(1000, 24)).toBe(72);
    const top = keysFor("pro", true, 1000);
    expect(top[top.length - 1]).toBe(HIGHEST);
    expect(clampStart(Number.NaN, 24)).toBe(MIDDLE_C);
  });

  it("shifting stops at either end instead of wrapping", () => {
    let s = MIDDLE_C;
    for (let i = 0; i < 10; i++) s = shiftStart(s, -1, 24);
    expect(s).toBe(LOWEST);
    for (let i = 0; i < 10; i++) s = shiftStart(s, 1, 24);
    expect(s).toBe(72);
    expect(shiftStart(60, 1, 16)).toBe(72);
    // C6 + 16 semitones would end on E7, past C7, so the small window tops out on C5
    expect(shiftStart(72, 1, 16)).toBe(72);
  });

  it("puts each black key on the line between its two white keys", () => {
    const keys = keysFor("advanced", false);
    expect(blackCentre(keys, 61)).toBe(1); // between C and D
    expect(blackCentre(keys, 66)).toBe(4); // between F and G
    expect(blackCentre(keys, 75)).toBe(9); // between D5 and E5
    expect(blackCentre(keys, 60)).toBe(-1);
    expect(blackCentre(keysFor("basic", false), 61)).toBe(-1);
  });
});

describe("the computer keyboard", () => {
  it("maps the home row to the white keys and the row above to the black", () => {
    const keys = keysFor("advanced", true);
    expect(["a", "s", "d", "f", "g", "h", "j", "k", "l", ";"].map((k) => midiForKey(k, keys))).toEqual(
      whites(keys),
    );
    expect(["w", "e", "t", "y", "u", "o", "p"].map((k) => midiForKey(k, keys))).toEqual(blacks(keys));
    expect(midiForKey("A", keys)).toBe(60);
  });

  it("plays nothing for a key that is not on this keyboard", () => {
    expect(midiForKey("w", keysFor("basic", false))).toBeUndefined();
    expect(midiForKey("'", keysFor("basic", false))).toBeUndefined();
    expect(midiForKey("q", keysFor("pro", true))).toBeUndefined();
    expect(midiForKey("a", [])).toBeUndefined();
  });

  it("labels follow the window", () => {
    const keys = keysFor("pro", true, 48);
    expect(midiForKey("a", keys)).toBe(48);
    expect(keyForMidi(48, keys)).toBe("A");
    expect(keyForMidi(49, keys)).toBe("W");
    expect(keyForMidi(48 + 20, keys)).toBeUndefined();
  });
});

describe("the songs", () => {
  it("has the two the operator asked for, first", () => {
    expect(SONG_IDS.slice(0, 2)).toEqual(["bus", "thumb"]);
    expect(new Set(SONG_IDS).size).toBe(SONGS.length);
  });

  // The promise every keyboard makes: a song can be played on it.
  it.each(SONGS.map((s) => [s.id, s] as const))("%s fits every keyboard, the basic one included", (_id, song) => {
    for (const level of LEVELS) {
      for (const pc of [false, true]) {
        const keys = keysFor(level, pc);
        const missing = song.notes.map(([m]) => m).filter((m) => !keys.includes(m));
        expect(missing, `${song.id} on ${level}/${pc ? "pc" : "phone"}`).toEqual([]);
      }
    }
    for (const [, beats] of song.notes) expect(beats).toBeGreaterThan(0);
    expect(song.notes.length).toBeGreaterThanOrEqual(10);
  });

  it("the wheels on the bus starts C F F F F A C A F", () => {
    expect(songById("bus").notes.slice(0, 9).map(([m]) => m)).toEqual([60, 65, 65, 65, 65, 69, 72, 69, 65]);
  });

  it("where is thumbkin starts G A B G twice", () => {
    expect(songById("thumb").notes.slice(0, 8).map(([m]) => m)).toEqual([67, 69, 71, 67, 67, 69, 71, 67]);
  });
});

describe("following a song", () => {
  it("moves on only on the right key, and never fails", () => {
    let f = newFollow("bus");
    expect(wanted(f)).toBe(60);
    const miss = press(f, 62);
    expect(miss.outcome).toEqual({ kind: "other", want: 60 });
    expect(miss.follow).toBe(f);
    const hit = press(f, 60);
    expect(hit.outcome).toEqual({ kind: "right", done: false });
    f = hit.follow;
    expect(f.at).toBe(1);
    expect(wanted(f)).toBe(65);
  });

  it("finishes exactly once, on the last note", () => {
    const song = songById("joy");
    let f = newFollow("joy");
    const dones: number[] = [];
    song.notes.forEach(([m], i) => {
      const r = press(f, m);
      if (r.outcome.kind === "right" && r.outcome.done) dones.push(i);
      f = r.follow;
    });
    expect(dones).toEqual([song.notes.length - 1]);
    expect(isDone(f)).toBe(true);
    expect(wanted(f)).toBeUndefined();
    expect(press(f, 60).outcome).toEqual({ kind: "finished" });
  });

  it("shows what comes next", () => {
    const f = { song: "thumb" as const, at: 2 };
    expect(upcoming(f, 3).map(([m]) => m)).toEqual([71, 67, 67]);
    expect(upcoming({ song: "thumb", at: 1000 }, 3)).toEqual([]);
    expect(upcoming(f, -1)).toEqual([]);
  });
});

describe("timing and trail", () => {
  it("lays the demo out end to end", () => {
    const t = timeline(songById("jonathan"), 100);
    expect(t[0]).toEqual({ midi: 67, at: 0, ms: 100 });
    for (let i = 1; i < t.length; i++) expect(t[i].at).toBe(t[i - 1].at + t[i - 1].ms);
  });

  it("keeps only the last notes played", () => {
    let trail: number[] = [];
    for (let i = 0; i < TRAIL + 3; i++) trail = pushTrail(trail, 60 + i);
    expect(trail).toHaveLength(TRAIL);
    expect(trail[trail.length - 1]).toBe(60 + TRAIL + 2);
  });
});
