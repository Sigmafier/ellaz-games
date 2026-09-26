// The WORDS a name is made of, in every language that has them.
//
// SPLIT OUT OF `names.ts` ON 2026-09-22, AND THE REASON IS BYTES.
//
// `names.ts` is imported by `wallet.ts` and `profile.ts`, which are shell
// modules - the coin chip is on every screen. So this table rode into the first
// visit with them: sixteen adjectives in four languages, twenty nouns in four,
// downloaded by every child on earth before they had chosen a game. Nothing on
// the home grid renders a name. The only three things that do - the room, the
// boards and the two-player banner - are all in lazy chunks already.
//
// Measured on one tree, Node 24: the non-English half of this table plus the
// shop names, the theme labels and the shell titles was 1,494 B gz of a 57,575 B
// first visit.
//
// SO THIS MODULE IS DELIBERATELY ABSENT FROM `@sdk/index`. Import it by its own
// path, exactly as `@ui/DirectionPad` is imported by its own path and for the
// identical reason: a barrel re-export would put it back in the shell and the
// split would silently buy nothing. `names-split.test.ts` fails if it reappears
// in the barrel.
//
// The IDS live in `names.ts` and the WORDS live here, so `pickName` can draw a
// name without any of this. `names-split.test.ts` also asserts the two id lists
// match these tables exactly, in order - two hand-kept lists of the same thing
// is the shape this repo has been bitten by before.
import type { AppLocale } from "@i18n/locales";
import { DEFAULT_LOCALE } from "@i18n/locales";
import type { Locale } from "@i18n/index";
import { ADJECTIVE_IDS, NOUN_IDS, type PlayerName, isPlayerName } from "./names";

/** Grammatical gender. Drives which adjective form a noun takes. */
export type Gender = "m" | "f";

/**
 * Swedish's genders, and they are NOT the other two languages' genders wearing
 * different letters.
 *
 * Swedish lost the masculine/feminine split centuries ago and has `utrum`
 * (common, the `en` words) against `neutrum` (the `ett` words). Mapping common
 * onto "m" would type-check and would be a lie in the data: nothing about
 * `en groda` is masculine, and the next person to read the column would have no
 * way to tell a real claim from a borrowed one. A separate union costs one type
 * and keeps the table honest.
 */
export type SwedishGender = "c" | "n";

/**
 * The languages whose adjectives inflect for gender. English is not one, which
 * is why it is a bare string below and absent from the gender map.
 *
 * Swedish IS one - `en snabb tiger` against `ett snabbt lejon` - but it inflects
 * on a different axis, so it carries `svGender` rather than joining this union.
 */
export type GenderedLocale = "he" | "es";

export interface Adjective {
  id: string;
  en: string;
  /** Both Hebrew forms. Which one is used depends on the NOUN, not the adjective. */
  he: { m: string; f: string };
  /**
   * Both Spanish forms — and they are allowed to be IDENTICAL. Spanish has a
   * large class of genuinely invariant adjectives (`valiente`, `alegre`,
   * `amable`), so the "the two forms must differ" check that guards the Hebrew
   * column would demand wrong words here. Hebrew has no such class.
   */
  es: { m: string; f: string };
  /**
   * Both Swedish forms. Like Spanish, they are allowed to be IDENTICAL: an
   * adjective already ending in `-t` (`tyst`) and the present participles
   * (`lysande`, `dansande`) do not inflect at all, and the `-e` adjectives
   * (`gyllene`) never have. Demanding a difference here would force wrong words
   * the way it would in Spanish.
   */
  sv: { c: string; n: string };
}

export interface Noun {
  id: string;
  en: string;
  he: string;
  es: string;
  sv: string;
  /** Per language, because the languages disagree — see the file header. */
  gender: Record<GenderedLocale, Gender>;
  /**
   * Swedish's own column, on its own axis. Only `lejon` and `bi` are neuter, so
   * the neuter forms ride on two rows out of twenty - which is exactly why they
   * are easy to get wrong and worth a column rather than a guess.
   */
  svGender: SwedishGender;
  /** The face this name wears — on the World character, and later on a board row. */
  emoji: string;
}

/**
 * Deliberately warm and slightly silly. Nothing here describes how good someone
 * is at anything: a name is not a rank, and "Mighty Tiger" must not read as a
 * prize that "Tiny Frog" missed out on.
 */
export const ADJECTIVES: readonly Adjective[] = [
  { id: "swift", en: "Swift", he: { m: "זריז", f: "זריזה" }, es: { m: "rápido", f: "rápida" }, sv: { c: "snabb", n: "snabbt" } },
  { id: "brave", en: "Brave", he: { m: "אמיץ", f: "אמיצה" }, es: { m: "valiente", f: "valiente" }, sv: { c: "modig", n: "modigt" } },
  { id: "happy", en: "Happy", he: { m: "שמח", f: "שמחה" }, es: { m: "contento", f: "contenta" }, sv: { c: "glad", n: "glatt" } },
  { id: "clever", en: "Clever", he: { m: "חכם", f: "חכמה" }, es: { m: "listo", f: "lista" }, sv: { c: "klok", n: "klokt" } },
  { id: "gentle", en: "Gentle", he: { m: "עדין", f: "עדינה" }, es: { m: "gentil", f: "gentil" }, sv: { c: "mjuk", n: "mjukt" } },
  { id: "glowing", en: "Glowing", he: { m: "זוהר", f: "זוהרת" }, es: { m: "radiante", f: "radiante" }, sv: { c: "lysande", n: "lysande" } },
  { id: "tiny", en: "Tiny", he: { m: "קטן", f: "קטנה" }, es: { m: "pequeñito", f: "pequeñita" }, sv: { c: "pytteliten", n: "pyttelitet" } },
  { id: "mighty", en: "Mighty", he: { m: "חזק", f: "חזקה" }, es: { m: "fuerte", f: "fuerte" }, sv: { c: "mäktig", n: "mäktigt" } },
  { id: "curious", en: "Curious", he: { m: "סקרן", f: "סקרנית" }, es: { m: "curioso", f: "curiosa" }, sv: { c: "nyfiken", n: "nyfiket" } },
  { id: "cheerful", en: "Cheerful", he: { m: "עליז", f: "עליזה" }, es: { m: "alegre", f: "alegre" }, sv: { c: "munter", n: "muntert" } },
  { id: "golden", en: "Golden", he: { m: "זהוב", f: "זהובה" }, es: { m: "dorado", f: "dorada" }, sv: { c: "gyllene", n: "gyllene" } },
  { id: "quiet", en: "Quiet", he: { m: "שקט", f: "שקטה" }, es: { m: "tranquilo", f: "tranquila" }, sv: { c: "tyst", n: "tyst" } },
  { id: "funny", en: "Funny", he: { m: "מצחיק", f: "מצחיקה" }, es: { m: "gracioso", f: "graciosa" }, sv: { c: "rolig", n: "roligt" } },
  { id: "kind", en: "Kind", he: { m: "נחמד", f: "נחמדה" }, es: { m: "amable", f: "amable" }, sv: { c: "snäll", n: "snällt" } },
  { id: "sparkly", en: "Sparkly", he: { m: "נוצץ", f: "נוצצת" }, es: { m: "brillante", f: "brillante" }, sv: { c: "glittrig", n: "glittrigt" } },
  { id: "dancing", en: "Dancing", he: { m: "רוקד", f: "רוקדת" }, es: { m: "bailarín", f: "bailarina" }, sv: { c: "dansande", n: "dansande" } },
];

/** Animals only, and only ones a small child recognises on sight. */
export const NOUNS: readonly Noun[] = [
  // The four rows whose two genders DISAGREE are turtle, butterfly, squirrel
  // and whale — a fifth of the pool. That is the measured reason this column is
  // a map and not a single value.
  { id: "tiger", en: "Tiger", he: "נמר", es: "tigre", gender: { he: "m", es: "m" }, sv: "tiger", svGender: "c", emoji: "🐯" },
  { id: "lion", en: "Lion", he: "אריה", es: "león", gender: { he: "m", es: "m" }, sv: "lejon", svGender: "n", emoji: "🦁" },
  { id: "fox", en: "Fox", he: "שועל", es: "zorro", gender: { he: "m", es: "m" }, sv: "räv", svGender: "c", emoji: "🦊" },
  { id: "bear", en: "Bear", he: "דוב", es: "oso", gender: { he: "m", es: "m" }, sv: "björn", svGender: "c", emoji: "🐻" },
  { id: "rabbit", en: "Rabbit", he: "ארנב", es: "conejo", gender: { he: "m", es: "m" }, sv: "kanin", svGender: "c", emoji: "🐰" },
  { id: "turtle", en: "Turtle", he: "צב", es: "tortuga", gender: { he: "m", es: "f" }, sv: "sköldpadda", svGender: "c", emoji: "🐢" },
  { id: "dolphin", en: "Dolphin", he: "דולפין", es: "delfín", gender: { he: "m", es: "m" }, sv: "delfin", svGender: "c", emoji: "🐬" },
  { id: "owl", en: "Owl", he: "ינשוף", es: "búho", gender: { he: "m", es: "m" }, sv: "uggla", svGender: "c", emoji: "🦉" },
  { id: "butterfly", en: "Butterfly", he: "פרפר", es: "mariposa", gender: { he: "m", es: "f" }, sv: "fjäril", svGender: "c", emoji: "🦋" },
  { id: "hedgehog", en: "Hedgehog", he: "קיפוד", es: "erizo", gender: { he: "m", es: "m" }, sv: "igelkott", svGender: "c", emoji: "🦔" },
  { id: "penguin", en: "Penguin", he: "פינגווין", es: "pingüino", gender: { he: "m", es: "m" }, sv: "pingvin", svGender: "c", emoji: "🐧" },
  { id: "squirrel", en: "Squirrel", he: "סנאי", es: "ardilla", gender: { he: "m", es: "f" }, sv: "ekorre", svGender: "c", emoji: "🐿️" },
  { id: "whale", en: "Whale", he: "לווייתן", es: "ballena", gender: { he: "m", es: "f" }, sv: "val", svGender: "c", emoji: "🐳" },
  { id: "monkey", en: "Monkey", he: "קוף", es: "mono", gender: { he: "m", es: "m" }, sv: "apa", svGender: "c", emoji: "🐵" },
  { id: "bee", en: "Bee", he: "דבורה", es: "abeja", gender: { he: "f", es: "f" }, sv: "bi", svGender: "n", emoji: "🐝" },
  { id: "lizard", en: "Lizard", he: "לטאה", es: "lagartija", gender: { he: "f", es: "f" }, sv: "ödla", svGender: "c", emoji: "🦎" },
  { id: "giraffe", en: "Giraffe", he: "ג'ירפה", es: "jirafa", gender: { he: "f", es: "f" }, sv: "giraff", svGender: "c", emoji: "🦒" },
  { id: "panda", en: "Panda", he: "פנדה", es: "panda", gender: { he: "f", es: "m" }, sv: "panda", svGender: "c", emoji: "🐼" },
  { id: "zebra", en: "Zebra", he: "זברה", es: "cebra", gender: { he: "f", es: "f" }, sv: "zebra", svGender: "c", emoji: "🦓" },
  { id: "frog", en: "Frog", he: "צפרדע", es: "rana", gender: { he: "f", es: "f" }, sv: "groda", svGender: "c", emoji: "🐸" },
];

/** Both words, or `undefined` if either id is not in this build's pool. */
export function resolveName(name: PlayerName | undefined): { adj: Adjective; noun: Noun } | undefined {
  if (!isPlayerName(name)) return undefined;
  const adj = ADJECTIVES.find((a) => a.id === name.adj);
  const noun = NOUNS.find((n) => n.id === name.noun);
  return adj && noun ? { adj, noun } : undefined;
}

/**
 * How each language BUILDS a name out of the two word ids.
 *
 * Not a translation table - a rule per language, because word ORDER and
 * AGREEMENT differ and neither is derivable from the other. Hebrew is
 * `<noun> <adjective>` with the adjective agreeing in the noun's gender;
 * English is `<Adjective> <Noun>` with no agreement at all.
 *
 * A record rather than a branch, so promoting a language reds HERE and asks
 * the question out loud instead of quietly rendering the English rule. Spanish
 * turned out to share Hebrew's SHAPE — noun first, adjective agreeing — and
 * still not its DATA, because the two languages assign gender differently (see
 * the file header). Russian needs three genders and German declines, so
 * neither reuses this row; each will bring its own rule and its own column.
 */
const RENDER: Record<Locale, (adj: Adjective, noun: Noun) => string> = {
  he: (adj, noun) => `${noun.he} ${adj.he[noun.gender.he]}`,
  en: (adj, noun) => `${adj.en} ${noun.en}`,
  es: (adj, noun) => `${noun.es} ${adj.es[noun.gender.es]}`,
  // Swedish puts the adjective FIRST, like English, and still agrees it with
  // the noun, like Hebrew and Spanish - so it shares neither language's row and
  // is the reason this is a record of rules rather than two shapes with a flag.
  sv: (adj, noun) => `${adj.sv[noun.svGender]} ${noun.sv}`,
};

/**
 * The name as a child reads it, or `undefined` when it cannot be resolved.
 *
 * Returning `undefined` rather than a placeholder string keeps the decision at
 * the call site, where "this player has no name yet" and "this build doesn't
 * know that word" can both be answered the same honest way: offer them a name.
 */
export function renderName(name: PlayerName | undefined, locale: AppLocale): string | undefined {
  const resolved = resolveName(name);
  if (!resolved) return undefined;
  const { adj, noun } = resolved;
  // Takes an APP locale and narrows here, for the same reason `textFor()` does:
  // the interface speaks twelve languages and this pool is written in four, so
  // every caller would otherwise have to narrow at the call site and one of them
  // would forget. A Turkish player sees the English name rather than a blank
  // where their name should be - the same answer x-default gives a crawler.
  const render = RENDER[locale as Locale] ?? RENDER[DEFAULT_LOCALE];
  return render(adj, noun);
}

/** The noun's emoji — the character's face. `undefined` if the name doesn't resolve. */
export function nameEmoji(name: PlayerName | undefined): string | undefined {
  return resolveName(name)?.noun.emoji;
}

/** The id lists `names.ts` draws from, proven equal to these tables by the test. */
export const ADJECTIVE_ID_SOURCE: readonly string[] = ADJECTIVES.map((a) => a.id);
export const NOUN_ID_SOURCE: readonly string[] = NOUNS.map((n) => n.id);
void ADJECTIVE_IDS;
void NOUN_IDS;
void isPlayerName;
