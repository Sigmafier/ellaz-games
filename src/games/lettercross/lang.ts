/**
 * Lettercross - WHICH LANGUAGE THIS GAME IS BEING PLAYED IN. PURE: no DOM, no
 * React, no timers.
 *
 * Until 2026-08-27 this game was English and nothing else. The chrome spoke
 * three languages, the tiles spoke one, and a Hebrew-speaking child opened a
 * board headed "סיבוב בונוס" and was handed the letters C, A and T. The
 * operator, asked what they wanted: "i want to play it in hebrew".
 *
 * A language is not a translation here. It is the TILES, the VALUES, the
 * DICTIONARY, the pool of words a puzzle may show, and which way a row reads -
 * five things that have to agree with each other and cannot be derived from
 * the interface language alone. So they live together in one record, and
 * everything that used to reach for a module-level `WORDS` or `LETTER_VALUE`
 * takes one of these instead.
 *
 * IT IS A PARAMETER AND NEVER A GLOBAL. `logic.ts` is pure and is driven by
 * seeded tests in both languages in the same process; a module-level "current
 * language" would make the second test in a file depend on the first.
 *
 * THE PACK IS PART OF THE SAVED POSITION. A board holds letters, and a letter
 * only means something against the pack it was dealt from - so a snapshot that
 * did not carry its language would restore a Hebrew board into an English
 * dictionary and refuse every word already standing on it. `Lettercross.tsx`
 * discards a snapshot whose `lang` is not the one being opened, exactly as it
 * already discards one whose level does not match
 * (.claude/rules/session-snapshot-convention.md).
 *
 * WHY ONLY TWO. This file answers neither `APP_LOCALES` nor `PAGE_LOCALES`
 * (both in `src/i18n/locales.ts`, and both have grown since this was written).
 * It answers "which languages has somebody WRITTEN A WORD LIST FOR", which is
 * its own shorter list and is two. A Spanish
 * or French player gets the English pack, which is the honest fallback: they
 * get a game that works rather than a board of letters with no dictionary
 * behind them. See `packFor`.
 */
import { WORDS } from "./words";
import { WORDS_HE } from "./wordsHe";
import { PUZZLE_WORDS, PUZZLE_WORDS_HE } from "./puzzleWords";

export type LangId = "en" | "he";

export type Lang = {
  readonly id: LangId;
  /** Every letter a tile may carry, in the order a letter picker offers them. */
  readonly letters: readonly string[];
  /** What each letter is worth. A wild scores 0 whatever it spells. */
  readonly value: Readonly<Record<string, number>>;
  /** How many of each letter are in the bag. */
  readonly counts: Readonly<Record<string, number>>;
  /**
   * The letters that carry a vowel sound, which is what a deal needs enough of
   * before anything can be spelled from it. In Hebrew that is the four matres
   * lectionis rather than a vowel class - see the pack below.
   */
  readonly vowels: readonly string[];
  /**
   * DOES A ROW READ RIGHT TO LEFT. A column reads top to bottom in both
   * languages; only the horizontal axis moves. This is a property of the
   * LANGUAGE and not of the layout, which is why it is here and not in CSS -
   * the grid itself stays `dir="ltr"` so the index space and the swipe
   * directions do not mirror (.claude/rules/rtl-spatial-grid-dir-ltr.md).
   */
  readonly rtl: boolean;
  /**
   * The form the dictionary is keyed on. English lowercases; Hebrew folds the
   * five final forms back onto their base letters, because a tile carries the
   * base form and `ם` at the end of a word is the same letter as `מ` in the
   * middle of one.
   */
  readonly fold: (w: string) => string;
  /**
   * The form a word is WRITTEN in, for a screen that shows a whole word. The
   * inverse of `fold` as far as it goes: Hebrew puts the final form back on the
   * last letter, so a reveal reads `שלום` rather than `שלומ`.
   */
  readonly write: (w: string) => string;
  /**
   * JUDGES, AND CANNOT BE READ FROM. A predicate, not the set - you can ask it
   * about a word you already hold and there is no way to get a word OUT of it.
   *
   * That is the whole of NOTICE.md's safety property, expressed in the type
   * rather than in a rule somebody has to remember. The English dictionary is
   * ENABLE1 behind a blocklist and a blocklist is not provably complete, so a
   * screen that could enumerate it would eventually put something unpleasant in
   * front of a five-year-old. While every round imported `./words` directly, a
   * grep for that import WAS the guarantee and `rounds-are-wired.test.ts`
   * asserted the list. Routing them all through one pack nearly ended that
   * quietly: every round would have held a Set it could pull any member out of,
   * with the import gate still green because the import had moved one file away.
   *
   * So the pack hands over the question and keeps the answers. A round that
   * wants a word to SHOW takes it from `pool`, which is the affirmative
   * allowlist and is the only enumerable list in here.
   */
  readonly has: (w: string) => boolean;
  /** SHOWN. The affirmative allowlist a bonus screen draws its puzzle from. */
  readonly pool: readonly string[];
};

/* ------------------------------------------------------------------ English */

/**
 * Frequency-shaped, and 14 of the 26 differ from the famous board's -
 * `logic.test.ts` pins that count so a later "tidy-up" cannot quietly restore
 * them. Moved here from `logic.ts` unchanged, byte for byte.
 */
const EN_VALUE: Readonly<Record<string, number>> = {
  a: 1, b: 4, c: 2, d: 2, e: 1, f: 4, g: 3, h: 2, i: 1, j: 9, k: 6, l: 2, m: 4,
  n: 1, o: 1, p: 2, q: 12, r: 1, s: 1, t: 1, u: 2, v: 5, w: 4, x: 9, y: 4, z: 12,
};

const EN_COUNTS: Readonly<Record<string, number>> = {
  e: 10, a: 7, i: 7, o: 7, n: 5, r: 5, t: 5, s: 5, l: 5, u: 4, d: 4, c: 3, h: 3,
  m: 2, g: 2, p: 2, b: 2, y: 2, f: 2, w: 2, v: 1, k: 1, j: 1, x: 1, q: 1, z: 1,
};

export const EN: Lang = {
  id: "en",
  letters: "abcdefghijklmnopqrstuvwxyz".split(""),
  value: EN_VALUE,
  counts: EN_COUNTS,
  vowels: ["a", "e", "i", "o", "u"],
  rtl: false,
  fold: (w) => w.toLowerCase(),
  write: (w) => w,
  has: (w) => WORDS.has(w),
  pool: PUZZLE_WORDS,
};

/* ------------------------------------------------------------------- Hebrew */

/**
 * TWENTY-TWO TILES AND NO FINAL FORMS, which is the one rule of Hebrew this
 * game does not model and the decision most worth reading before changing.
 *
 * Five Hebrew letters are written differently at the end of a word - כ/ך, מ/ם,
 * נ/ן, פ/ף, צ/ץ. In a single-word game that is free: `wordguess` stores its
 * words the way a person spells them and finalises at draw time. A CROSSWORD
 * grid cannot, because a square belongs to as many as two words at once: the ם
 * ending `שלום` across can sit in the middle of a word running down, and there
 * is no form that is right for both. Any rule that picks one is wrong on the
 * other, silently, in a picture that still looks like Hebrew.
 *
 * So the TILE carries the base letter, the BOARD shows the base letter, and the
 * dictionary is keyed on the folded form. `שלומ` on the board is how a set of
 * magnetic letters spells it, and it is a shape a Hebrew reader parses without
 * being taught. What it buys is that a five-year-old never has to know which of
 * two tiles a letter needs, and that the bag does not carry five near-duplicates
 * nobody can place.
 *
 * A screen that shows a WHOLE WORD is not on a grid and has no such conflict,
 * so it uses `write` and reads properly: the anagram reveal says `שלום`.
 */
const HE_LETTERS = "אבגדהוזחטיכלמנסעפצקרשת".split("");

/** The five finals, folded onto the tile that carries them. */
const HE_FINALS: Readonly<Record<string, string>> = { "ך": "כ", "ם": "מ", "ן": "נ", "ף": "פ", "ץ": "צ" };
const HE_FINAL_OF: Readonly<Record<string, string>> = { "כ": "ך", "מ": "ם", "נ": "ן", "פ": "ף", "צ": "ץ" };

/**
 * Letter values, shaped from Hebrew letter frequency the same way the English
 * ones were - common letters cheap, rare letters dear - and NOT taken from the
 * Israeli board game, which is a commercial product with its own distribution.
 * Nothing here was copied from one; the ordering falls out of frequency in
 * ordinary written Hebrew, where י ו ה א ר ל מ ת lead and ז ט צ ג trail.
 *
 * ONE DELIBERATE FLATTENING: Hebrew's rare letters are nowhere near as rare as
 * q and z, so the top value is 8 rather than 12. A 12-point ז on a board this
 * small would decide a run by which tile you happened to draw.
 */
const HE_VALUE: Readonly<Record<string, number>> = {
  "א": 1, "ב": 2, "ג": 6, "ד": 3, "ה": 1, "ו": 1, "ז": 8, "ח": 4, "ט": 7, "י": 1,
  "כ": 3, "ל": 1, "מ": 1, "נ": 2, "ס": 5, "ע": 3, "פ": 4, "צ": 6, "ק": 4, "ר": 1,
  "ש": 2, "ת": 2,
};

/**
 * The bag. Same total as the English one so a level's rack size, the prize
 * boxes and the length of a run all behave the way they already did -
 * `logic.test.ts` pins that the two bags are the same size for exactly that
 * reason.
 */
const HE_COUNTS: Readonly<Record<string, number>> = {
  "י": 10, "ו": 9, "ה": 8, "א": 7, "ר": 6, "ל": 6, "מ": 6, "ת": 5, "ב": 4, "ש": 4,
  "נ": 4, "כ": 3, "ד": 3, "ע": 3, "ח": 2, "ק": 2, "פ": 2, "ס": 2, "ג": 1, "ז": 1,
  "ט": 1, "צ": 1,
};

/**
 * WHAT COUNTS AS A VOWEL HERE, since Hebrew has no vowel letters.
 *
 * Written Hebrew carries its vowels in pointing this game does not use, so the
 * thing a deal actually needs enough of is the four matres lectionis - א ה ו י -
 * which stand in for vowels in ordinary unpointed spelling and are what makes a
 * handful of consonants spellable. The floor exists for the same reason the
 * English one does: sixteen independent draws hand out too few of them often
 * enough to turn the biggest prize in the game into a minute of being told no.
 */
const HE_VOWELS = ["א", "ה", "ו", "י"];

const heFold = (w: string) => [...w].map((c) => HE_FINALS[c] ?? c).join("");

/**
 * Put the final form back on the last letter. Only the LAST one: `מים` is
 * `מים` and never `םים`, so this walks to the end rather than mapping.
 */
const heWrite = (w: string) => {
  if (!w) return w;
  const last = w[w.length - 1];
  return HE_FINAL_OF[last] ? `${w.slice(0, -1)}${HE_FINAL_OF[last]}` : w;
};

export const HE: Lang = {
  id: "he",
  letters: HE_LETTERS,
  value: HE_VALUE,
  counts: HE_COUNTS,
  vowels: HE_VOWELS,
  rtl: true,
  fold: heFold,
  write: heWrite,
  has: (w) => WORDS_HE.has(w),
  pool: PUZZLE_WORDS_HE,
};

/* -------------------------------------------------------------------- Which */

export const LANGS: Readonly<Record<LangId, Lang>> = { en: EN, he: HE };

/**
 * A TABLE, not a comparison. `src/games/locale-is-not-a-branch.test.ts` refuses
 * `locale === "he"` anywhere in a game, because a two-way ternary is silently
 * wrong for the third language. This is a lookup of the languages somebody has
 * written a word list for; adding one is a row here and a pack above.
 */
const PACK_FOR_LOCALE: Readonly<Record<string, Lang>> = { he: HE };

/**
 * The pack for an interface locale. Hebrew gets Hebrew; EVERY OTHER LOCALE GETS
 * ENGLISH, and that is a fallback rather than a claim - the interface
 * languages are not that many word lists, and a player whose language nobody has
 * written one for is better served by a game that plays than by a board of
 * letters with no dictionary behind it. Adding a third is adding a pack, not
 * touching this function.
 */
export const packFor = (locale: string): Lang =>
  Object.prototype.hasOwnProperty.call(PACK_FOR_LOCALE, locale) ? PACK_FOR_LOCALE[locale] : EN;


/** Is this a language somebody has written a word list for? */
export const isLangId = (v: unknown): v is LangId => v === "en" || v === "he";
