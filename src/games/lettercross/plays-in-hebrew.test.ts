/**
 * Lettercross - the game plays in Hebrew, which is a different question from
 * every other test in this directory.
 *
 * The rest of the suite drove an English pack because there was only one. Those
 * tests all still pass with the Hebrew half completely broken: every function
 * here takes the pack as a trailing parameter defaulting to English, which is
 * what made the change safe to land and is exactly why a green run says nothing
 * about the language the operator asked for.
 *
 * So this file drives HEBREW, and its controls are mostly ENGLISH - a property
 * that holds in both languages is not evidence about either.
 */
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { mulberry32 } from "@shared/rng";
import { EN, HE, packFor, isLangId } from "./lang";
import { HE_WRITTEN, WORDS_HE } from "./wordsHe";
import { PUZZLE_WORDS_HE } from "./puzzleWords";
import { newGame, apply, validate, bagFor, bestLevel, boardAt, rackFor } from "./logic";
import { makeShared } from "./sharedLetter";
import { makeFill } from "./fillGaps";
import { makeAnagram, isAnswer } from "./anagram";
import { dealTiles, scoreMini, emptyMini, BW, BONUS_TILES, type MiniCell } from "./bonusBoard";

const rng = (seed: string) => mulberry32([...seed].reduce((h, c) => (h * 31 + c.charCodeAt(0)) | 0, 7));

describe("the Hebrew word lists", () => {
  it("carries no nikud and nothing but Hebrew letters", () => {
    // Nikud is the failure that renders perfectly and cannot be typed from a
    // tray: a pointed word is a word no tile can spell. Latin and the
    // apostrophe are the other two - `ג'ירפה` is an ordinary Hebrew word and
    // there is no tile for the mark in the middle of it.
    const bad = HE_WRITTEN.filter((w) => !/^[א-ת]+$/.test(w));
    expect(bad, "entries that are not plain unpointed Hebrew").toEqual([]);
    expect(HE_WRITTEN.length, "the list did not load - every assertion here is vacuous")
      .toBeGreaterThan(1000);

    // The control: the matcher must REJECT the things it exists to reject, or
    // the empty result above is a broken regex rather than a clean list.
    for (const decoy of ["שָׁלוֹם", "ג'ירפה", "cat", "שלום!"])
      expect(/^[א-ת]+$/.test(decoy), `${decoy} passed the letter check`).toBe(false);
  });

  it("is written the way a person writes it, and folded only when asked", () => {
    // Rule 2 of the file: the source keeps final letters so a Hebrew reader can
    // proofread it, and `lang.fold` is what turns a written word into the form
    // the tiles and the dictionary agree on.
    const withFinals = HE_WRITTEN.filter((w) => /[ךםןףץ]$/.test(w));
    expect(withFinals.length, "no entry ends in a final letter - the list was stored pre-folded")
      .toBeGreaterThan(50);
    for (const w of withFinals.slice(0, 40)) expect(HE.has(HE.fold(w))).toBe(true);
  });

  it("keys EVERY written entry under the same fold the pack judges with", () => {
    // `wordsHe.ts` repeats the five-letter fold to stay a leaf, and says this
    // file holds the copy to `lang.ts`'s. So: every entry, not a sample. A
    // drifted copy keys some words where `lang.has` never looks, and those
    // words are refused on the board with nothing on screen to say why.
    for (const w of HE_WRITTEN) expect(HE.has(HE.fold(w)), `${w} is not found under its own fold`).toBe(true);
    // Control: a word that is not in the list stays out under the same fold.
    expect(HE.has(HE.fold("גוגל"))).toBe(false);
  });

  it("folds and writes as inverses, and only ever finalises the LAST letter", () => {
    expect(HE.fold("שלום")).toBe("שלומ");
    expect(HE.write("שלומ")).toBe("שלום");
    // ONLY THE LAST LETTER. `מים` is mem-yod-FINAL-mem, so it folds to `מימ`
    // with a mem at each end - and writing that back must finalise the one at
    // the end and leave the one at the front alone. A `.map` over the string
    // would produce `םים`, which is why `write` walks to the end instead.
    expect(HE.fold("מים")).toBe("מימ");
    expect(HE.write("מימ")).toBe("מים");
    expect(HE.write("מימ")[0]).toBe("מ");
    for (const w of HE_WRITTEN) expect(HE.write(HE.fold(w)), `${w} did not round-trip`).toBe(w);
  });

  it("keeps every word it may SHOW inside the list that JUDGES", () => {
    // Rule 2 of `puzzleWords.ts`, in the second language. It found `כתר` on the
    // first run - a word the bonus screens would have shown and the board would
    // then have refused, which is the English side's `knife` exactly.
    const missing = PUZZLE_WORDS_HE.filter((w) => !HE.has(w));
    expect(missing, "the pool can show a word the dictionary will not score").toEqual([]);
    expect(PUZZLE_WORDS_HE.length).toBeGreaterThan(300);
    // The control: a word that is NOT in the pool must be able to fail this.
    expect(HE.has("קססצץ")).toBe(false);
  });

  it("supplies enough words at the lengths each bonus screen needs", () => {
    // A screen with no candidates does not throw - it returns `undefined` and
    // the round shell shows a dead prize. So the supply is asserted rather than
    // assumed, per length, the way each generator filters.
    const n = (lo: number, hi: number) => PUZZLE_WORDS_HE.filter((w) => w.length >= lo && w.length <= hi).length;
    expect(n(4, 6), "the anagram screen has too little to draw from").toBeGreaterThan(60);
    expect(n(5, 99), "the fill-the-gaps screen has too little to draw from").toBeGreaterThan(30);
  });
});

describe("the Hebrew pack", () => {
  it("deals Hebrew tiles, and the same number of them as English", () => {
    // Both bags total the same on purpose: the rack sizes, the prize boxes and
    // how far a word can run are all tuned against that number, and nothing
    // else in the file would notice it moving.
    expect(bagFor(HE).length).toBe(bagFor(EN).length);
    const s = newGame("medium", rng("he-deal"), HE);
    expect(s.lang).toBe("he");
    expect(s.rack.length).toBe(rackFor("medium"));
    for (const t of s.rack) expect(t === "?" || /^[א-ת]$/.test(t), `${t} is not a Hebrew tile`).toBe(true);
    // The control: the English pack still deals Latin, so the assertion above
    // is about the pack rather than about a regex that matches everything.
    for (const t of newGame("medium", rng("en-deal"), EN).rack)
      expect(t === "?" || /^[a-z]$/.test(t)).toBe(true);
  });

  it("gives every tile a value, so no letter silently scores zero", () => {
    for (const ch of HE.letters) expect(HE.value[ch], `${ch} has no value`).toBeGreaterThan(0);
    for (const ch of Object.keys(HE.counts)) expect(HE.letters).toContain(ch);
  });

  it("carries no final-form tiles, which is the decision the grid forces", () => {
    // A square belongs to as many as two words at once, so no single form is
    // right for both. The tile carries the base letter and the dictionary is
    // keyed on it - see `lang.ts`.
    for (const ch of HE.letters) expect(/[ךםןףץ]/.test(ch), `${ch} is a final form on a tile`).toBe(false);
    expect(HE.letters.length).toBe(22);
  });

  it("hands out a predicate rather than a dictionary a screen could read", () => {
    // The structural half of NOTICE.md's rule. A `ReadonlySet` here would let
    // any round pull any word out; a predicate cannot be read from.
    expect(typeof HE.has).toBe("function");
    expect((HE as unknown as Record<string, unknown>).words).toBeUndefined();
    expect((EN as unknown as Record<string, unknown>).words).toBeUndefined();
  });

  it("gives Hebrew its own score boards and leaves English's alone", () => {
    // Different letter values, a different bag and a far smaller dictionary.
    // One leaderboard over both would rank the languages, not the players - and
    // English must keep the bare level, or every record set before the game
    // spoke two languages is orphaned.
    expect(bestLevel("easy", EN)).toBe("easy");
    expect(bestLevel("easy")).toBe("easy");
    expect(bestLevel("easy", HE)).toBe("he-easy");
    expect(bestLevel("hard", HE)).not.toBe(bestLevel("hard", EN));
  });

  it("gives Hebrew to Hebrew and English to everybody else", () => {
    expect(packFor("he").id).toBe("he");
    for (const loc of ["en", "es", "fr", "ru", "ar", ""]) expect(packFor(loc).id).toBe("en");
    expect(isLangId("he")).toBe(true);
    expect(isLangId("de")).toBe(false);
  });
});

describe("a Hebrew row reads right to left", () => {
  /** Lay `word` across a row, `first` being the column its FIRST letter goes in. */
  const across = (word: string, row: number, first: number, step: number) =>
    [...word].map((ch, k) => ({ index: boardAt(row, first + k * step), letter: ch, wild: false }));

  it("accepts a word whose first letter is on the RIGHT", () => {
    const s = newGame("medium", rng("rtl"), HE);
    // חתול - ח in the rightmost of the four squares, ל in the leftmost.
    const play = across("חתול", 4, 5, -1);
    const v = validate(s.board, play, HE);
    expect(v.ok, `refused: ${JSON.stringify(v)}`).toBe(true);
    if (v.ok) expect(v.words.map((w) => w.word)).toContain("חתול");
  });

  it("refuses the same word laid left to right", () => {
    // The whole point. Laid the English way the row spells לותח, which is not a
    // word - and the board looks completely correct to whoever built it, which
    // is why this is a test rather than a comment.
    const s = newGame("medium", rng("rtl"), HE);
    const v = validate(s.board, across("חתול", 4, 2, +1), HE);
    expect(v.ok).toBe(false);
    if (!v.ok) expect(v.reason).toBe("word");
  });

  it("leaves English rows reading left to right", () => {
    // The control that makes the two above about the LANGUAGE rather than about
    // a reversal somebody left switched on.
    const s = newGame("medium", rng("ltr"), EN);
    expect(validate(s.board, across("cat", 4, 2, +1), EN).ok).toBe(true);
    expect(validate(s.board, across("cat", 4, 5, -1), EN).ok).toBe(false);
  });

  it("reads a column downwards in both languages", () => {
    const down = (word: string, col: number, top: number) =>
      [...word].map((ch, k) => ({ index: boardAt(top + k, col), letter: ch, wild: false }));
    expect(validate(newGame("medium", rng("d1"), HE).board, down("חתול", 3, 2), HE).ok).toBe(true);
    expect(validate(newGame("medium", rng("d2"), HE).board, down("לותח", 3, 2), HE).ok).toBe(false);
  });

  it("scores a played Hebrew word and banks it", () => {
    // End to end through `apply`, because `validate` returning ok is not a turn.
    const s = newGame("medium", rng("score"), HE);
    const next = apply(s, across("חתול", 4, 5, -1), HE);
    expect(next.score, "the turn scored nothing - it was refused, not played").toBeGreaterThan(0);
    expect(next.played).toBe(1);
    expect(next.score).toBe([..."חתול"].reduce((n, c) => n + HE.value[c], 0));
  });
});

describe("the bonus screens ask Hebrew questions", () => {
  it("makes a shared-letter puzzle on every seed, in both sizes", () => {
    for (const count of [2, 3] as const) {
      for (let i = 0; i < 40; i++) {
        const p = makeShared(count, rng(`he-shared-${count}-${i}`), HE);
        expect(p, `no ${count}-word Hebrew puzzle on seed ${i}`).toBeDefined();
        if (!p) continue;
        expect(p.words.length).toBe(count);
        expect(p.answer).toMatch(/^[א-ת]$/);
        expect(p.choices).toContain(p.answer);
        // Everything it SHOWS came out of the authored pool.
        for (const w of p.words) expect(PUZZLE_WORDS_HE).toContain(w);
      }
    }
  });

  it("makes a fill-the-gaps puzzle on every seed", () => {
    for (let i = 0; i < 30; i++) {
      const p = makeFill(rng(`he-fill-${i}`), HE);
      expect(p, `no Hebrew fill puzzle on seed ${i}`).toBeDefined();
      if (!p) continue;
      expect(PUZZLE_WORDS_HE).toContain(p.word);
      expect(p.gaps.length).toBe(2);
      for (const i2 of p.gaps) expect(p.choices).toContain(p.word[i2]);
    }
  });

  it("makes an anagram whose letters are not already the answer", () => {
    for (let i = 0; i < 30; i++) {
      const p = makeAnagram(rng(`he-ana-${i}`), HE);
      expect(p, `no Hebrew anagram on seed ${i}`).toBeDefined();
      if (!p) continue;
      expect(PUZZLE_WORDS_HE).toContain(p.word);
      expect(p.letters.join("")).not.toBe(p.word);
      expect(isAnswer(p.letters, p.word, HE), "the puzzle's own word is not accepted").toBe(true);
      expect(isAnswer(p.letters, p.word, EN), "the ENGLISH pack accepted a Hebrew word").toBe(false);
    }
  });

  it("deals the crossword screen Hebrew tiles with enough vowel carriers", () => {
    // Hebrew has no vowel letters, so the floor is over the four matres
    // lectionis - the thing a handful of consonants actually needs to be
    // spellable. See `lang.ts`.
    for (let i = 0; i < 30; i++) {
      const tiles = dealTiles(rng(`he-deal-${i}`), BONUS_TILES, HE);
      expect(tiles.length).toBe(BONUS_TILES);
      for (const t of tiles) expect(/^[א-ת]$/.test(t), `${t} is not a Hebrew tile`).toBe(true);
      expect(tiles.filter((t) => HE.vowels.includes(t)).length).toBeGreaterThanOrEqual(5);
    }
  });

  it("scores the crossword strip right to left too", () => {
    // Same reversal as the board, and it has its own code path in
    // `bonusBoard.ts` - so a fix to one says nothing about the other.
    const put = (word: string, row: number, rightCol: number) => {
      const b: MiniCell[] = [...emptyMini()];
      [...word].forEach((ch, k) => { b[row * BW + (rightCol - k)] = ch; });
      return b;
    };
    const good = scoreMini(put("חתול", 1, 5), HE);
    expect(good.bad, `refused: ${JSON.stringify(good.bad)}`).toEqual([]);
    expect(good.total).toBeGreaterThan(0);

    // The mirror image is not a word, and must be reported as one that is not.
    const backwards: MiniCell[] = [...emptyMini()];
    [..."חתול"].forEach((ch, k) => { backwards[1 * BW + (2 + k)] = ch; });
    const bad = scoreMini(backwards, HE);
    expect(bad.bad.length).toBe(1);
    expect(bad.total).toBe(0);
  });
});

describe("the Hebrew game page tells the truth about the Hebrew pack", () => {
  // The /he/ page deals the Hebrew pack, so the numbers on it are the Hebrew
  // list's. They are written by hand in the page copy, and a number that leaves
  // the repo needs a gate - adding a word to `wordsHe.ts` reds this until the
  // page says the new count. Read as TEXT: the content tree is build-time only.
  const SRC = readFileSync(new URL("../../content/games/lettercross.ts", import.meta.url), "utf8");
  const he = SRC.slice(SRC.indexOf("    he: {"), SRC.indexOf("    es: {"));
  const en = SRC.slice(0, SRC.indexOf("    he: {"));

  it("states the dictionary's real size, twice, and never the English one", () => {
    expect(he.length, "could not find the he arm - the slice is broken, not the page").toBeGreaterThan(2000);
    const n = WORDS_HE.size.toLocaleString("en-US");
    expect(he.split(n).length - 1, `the Hebrew page should say ${n} words in the body and the FAQ`).toBe(2);
    expect(he, "the Hebrew page still quotes the English dictionary").not.toMatch(/28,515/);
    // Control: the English page keeps its own figure.
    expect(en).toMatch(/28,515 words/);
  });

  it("states the top letter value the Hebrew pack really has", () => {
    const top = Math.max(...Object.values(HE.value));
    expect(he).toContain(`אות נדירה שווה ${top} נקודות`);
    expect(Math.max(...Object.values(EN.value)), "control: English tops out higher").toBe(12);
  });
});

describe("the round screens judge in their own pack", () => {
  // Every pure function here takes the pack as a trailing parameter that
  // DEFAULTS TO ENGLISH, which is what made the change safe to land - and is
  // why a call that forgets it type-checks and passes every English test.
  // FillGapsRound shipped exactly that in the 2026-08-27 work: `isWord(built)`,
  // so a right Hebrew answer was checked against the English dictionary and
  // refused. A judging call inside a screen must name `lang`.
  const read = (f: string) => readFileSync(new URL(`./${f}`, import.meta.url), "utf8");
  const SCREENS = ["FillGapsRound.tsx", "AnagramRound.tsx", "SharedLetterRound.tsx", "BonusRound.tsx", "Lettercross.tsx"];
  const JUDGES = /\b(isWord|isAnswer|solvers|answersFor|scoreMini|validate|apply|dealTiles|newGame|makeFill|makeShared|makeAnagram)\(([^()]*(\([^()]*\))?[^()]*)\)/g;

  it("passes the pack to every judging call", () => {
    let seen = 0;
    for (const f of SCREENS) {
      for (const m of read(f).matchAll(JUDGES)) {
        if (/^\s*(import|export|function)/.test(m.input!.slice(m.input!.lastIndexOf("\n", m.index!) + 1, m.index!))) continue;
        seen++;
        expect(m[2], `${f}: ${m[0]} does not name the pack`).toMatch(/\blang\b/);
      }
    }
    // Population: the screens really do call these, or the loop proves nothing.
    expect(seen, "found almost no judging calls - the matcher is blind").toBeGreaterThan(8);
    // Control: the matcher sees the defect it exists for.
    const bad = [..."if (isWord(built)) {".matchAll(JUDGES)];
    expect(bad.length).toBe(1);
    expect(bad[0][2]).not.toMatch(/\blang\b/);
  });
});
