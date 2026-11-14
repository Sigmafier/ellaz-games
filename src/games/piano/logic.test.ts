import {
  LEVELS,
  RANGE,
  SONGS,
  SONG_IDS,
  TRAIL,
  blackCentre,
  blacks,
  centreOf,
  clampOffset,
  firstVisibleC,
  freqOf,
  isBlack,
  isDone,
  keyForMidi,
  keysFor,
  layoutFor,
  midiForKey,
  newFollow,
  offsetForC,
  offsetToShow,
  playableSong,
  press,
  pushTrail,
  scrolls,
  songById,
  songsFor,
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
  it("basic is ten white keys, C4 to E5, and never scrolls", () => {
    const keys = keysFor("basic");
    expect(keys).toEqual([60, 62, 64, 65, 67, 69, 71, 72, 74, 76]);
    expect(blacks(keys)).toEqual([]);
    expect(scrolls("basic")).toBe(false);
  });

  it("plus is three octaves with the black keys, pro is five", () => {
    expect(keysFor("advanced")).toHaveLength(37);
    expect(whites(keysFor("advanced"))).toHaveLength(22);
    expect(keysFor("pro")).toHaveLength(61);
    expect(whites(keysFor("pro"))).toHaveLength(36);
    expect(keysFor("pro")[0]).toBe(36);
    expect(keysFor("pro")[60]).toBe(96);
    expect(scrolls("advanced") && scrolls("pro")).toBe(true);
  });

  it("runs from RANGE's low note to its high one", () => {
    for (const level of LEVELS) {
      const keys = keysFor(level);
      expect([keys[0], keys[keys.length - 1]]).toEqual([...RANGE[level]]);
    }
  });

  it("each keyboard holds the one below it", () => {
    for (const [lo, hi] of [["basic", "advanced"], ["advanced", "pro"]] as const) {
      const big = keysFor(hi);
      expect(keysFor(lo).filter((m) => !big.includes(m))).toEqual([]);
    }
  });

  it("puts each black key on the line between its two white keys", () => {
    const keys = keysFor("advanced"); // from C3
    expect(blackCentre(keys, 49)).toBe(1); // C#3, between C3 and D3
    expect(blackCentre(keys, 54)).toBe(4); // F#3
    expect(blackCentre(keys, 48)).toBe(-1);
    expect(blackCentre(keysFor("basic"), 61)).toBe(-1);
    expect(centreOf(keys, 48)).toBe(0.5);
    expect(centreOf(keys, 49)).toBe(1);
    expect(centreOf(keys, 10)).toBe(-1);
  });
});

describe("the visible part of a long keyboard", () => {
  it("shares the view when every key fits, and scrolls when it would not", () => {
    expect(layoutFor(10, 355, 34)).toEqual({ keyPx: 35.5, contentPx: 355, scroll: false });
    const phone = layoutFor(36, 355, 34);
    expect(phone.scroll).toBe(true);
    expect(phone.keyPx).toBe(34);
    expect(phone.contentPx).toBe(36 * 34);
    // a PC full screen holds all five octaves at once
    expect(layoutFor(36, 1500, 30).scroll).toBe(false);
    // a phone turned to landscape shows more than twice as many keys as upright
    const upright = 355 / layoutFor(36, 355, 34).keyPx;
    const landscape = 820 / layoutFor(36, 820, 34).keyPx;
    expect(landscape / upright).toBeGreaterThan(2);
    expect(layoutFor(0, 300, 30).contentPx).toBe(0);
  });

  it("never scrolls past either end", () => {
    expect(clampOffset(-50, 1000, 300)).toBe(0);
    expect(clampOffset(5000, 1000, 300)).toBe(700);
    expect(clampOffset(200, 1000, 300)).toBe(200);
    expect(clampOffset(200, 200, 300)).toBe(0);
    expect(clampOffset(Number.NaN, 1000, 300)).toBe(0);
  });

  it("leaves a visible key alone and centres one that is off screen", () => {
    expect(offsetToShow(5, 30, 0, 1080, 300)).toBe(0); // x 150, in view
    expect(offsetToShow(20, 30, 0, 1080, 300)).toBe(450); // x 600 -> centred
    expect(offsetToShow(35.5, 30, 0, 1080, 300)).toBe(780); // the last key: clamped
    expect(offsetToShow(-1, 30, 99, 1080, 300)).toBe(99);
  });

  it("finds the first C on screen, and puts a C at the left edge", () => {
    const keys = keysFor("pro");
    expect(firstVisibleC(keys, 0, 30)).toBe(36);
    expect(firstVisibleC(keys, 30, 30)).toBe(48); // C2 scrolled off
    const at = offsetForC(keys, 60, 30, 1080, 300);
    expect(at).toBe(14 * 30);
    expect(firstVisibleC(keys, at, 30)).toBe(60);
  });
});

describe("the computer keyboard", () => {
  it("maps the home row to white keys and the row above to black, from the first C on screen", () => {
    const keys = keysFor("pro");
    expect(["a", "s", "d", "f", "g", "h", "j", "k", "l", ";"].map((k) => midiForKey(k, keys, 60))).toEqual([
      60, 62, 64, 65, 67, 69, 71, 72, 74, 76,
    ]);
    expect(["w", "e", "t", "y", "u", "o", "p"].map((k) => midiForKey(k, keys, 60))).toEqual([61, 63, 66, 68, 70, 73, 75]);
    expect(midiForKey("A", keys, 48)).toBe(48);
    expect(keyForMidi(61, keys, 60)).toBe("W");
    expect(keyForMidi(90, keys, 60)).toBeUndefined();
  });

  it("plays nothing for a key that is not on this keyboard", () => {
    expect(midiForKey("w", keysFor("basic"), 60)).toBeUndefined();
    expect(midiForKey("'", keysFor("basic"), 60)).toBeUndefined();
    expect(midiForKey("q", keysFor("pro"), 60)).toBeUndefined();
    expect(midiForKey("a", [], 60)).toBeUndefined();
    // from C6, ' would be F7 - past the top of the keyboard
    expect(midiForKey("'", keysFor("pro"), 84)).toBeUndefined();
  });
});

describe("the songs", () => {
  it("has the two the operator asked for, first", () => {
    expect(SONG_IDS.slice(0, 2)).toEqual(["bus", "thumb"]);
    expect(new Set(SONG_IDS).size).toBe(SONGS.length);
  });

  const rank = (l: string) => LEVELS.indexOf(l as never);

  // The promise every keyboard makes: a song it lists can be played on it.
  it.each(SONGS.map((s) => [s.id, s] as const))("%s fits every keyboard from its own up", (_id, song) => {
    for (const level of LEVELS) {
      if (rank(level) < rank(song.min)) continue;
      const keys = keysFor(level);
      const missing = song.notes.map(([m]) => m).filter((m) => !keys.includes(m));
      expect(missing, `${song.id} on ${level}`).toEqual([]);
    }
    for (const [, beats] of song.notes) expect(beats).toBeGreaterThan(0);
    expect(song.notes.length).toBeGreaterThanOrEqual(10);
  });

  it("starts a song at the lowest keyboard it fits, never higher", () => {
    for (const song of SONGS) {
      const below = LEVELS[rank(song.min) - 1];
      if (!below) continue;
      const keys = keysFor(below);
      expect(song.notes.some(([m]) => !keys.includes(m)), `${song.id} would fit ${below}`).toBe(true);
    }
  });

  it("lists more songs on each keyboard up, and swaps one a keyboard cannot play", () => {
    expect(songsFor("basic").length).toBeLessThan(songsFor("advanced").length);
    expect(songsFor("advanced").length).toBeLessThanOrEqual(songsFor("pro").length);
    expect(songsFor("basic").every((s) => s.min === "basic")).toBe(true);
    expect(playableSong("elise", "basic")).toBe("bus");
    expect(playableSong("elise", "pro")).toBe("elise");
  });

  it("the wheels on the bus starts C F F F F A C A F", () => {
    expect(songById("bus").notes.slice(0, 9).map(([m]) => m)).toEqual([60, 65, 65, 65, 65, 69, 72, 69, 65]);
  });

  it("where is thumbkin starts G A B G twice", () => {
    expect(songById("thumb").notes.slice(0, 8).map(([m]) => m)).toEqual([67, 69, 71, 67, 67, 69, 71, 67]);
  });

  it("für elise starts E D# E D# E B D C A", () => {
    expect(songById("elise").notes.slice(0, 9).map(([m]) => m)).toEqual([76, 75, 76, 75, 76, 71, 74, 72, 69]);
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
