/**
 * The guides: articles that answer a question, at `/<locale>/guides/<slug>/`.
 *
 * WHY THIS EXISTS, in one paragraph, because it is the whole design.
 * Search Console's export for 2026-09-21 shows 434 impressions a month against
 * 4 clicks. Nearly every query in it is INFORMATIONAL - "שולה מוקשים" is
 * somebody asking how minesweeper works, "labyrinthe en ligne" is somebody
 * asking what an online maze is - and every URL this site owns is
 * TRANSACTIONAL: a page that says "play minesweeper". A guide is the missing
 * half. It answers the question, and then links down to the game.
 *
 * THREE RULES THIS FILE'S SHAPE ENFORCES, rather than asking anybody to
 * remember them.
 *
 * 1. ONE LOCALE PER GUIDE, declared on the entry. A guide exists in the
 *    language its query was typed in and in no other. `GameContent.copy` is
 *    `Record<PageLocale, GameCopy>` because a GAME exists in four languages;
 *    a guide answers a search that happened in one, and eleven articles times
 *    four locales would be 33 pages written for zero measured demand - which
 *    is exactly what `a-locale-page-without-a-translated-body-is-a-duplicate.md`
 *    forbids and what Google's own documentation calls a duplicate.
 *
 * 2. EVERY FIELD IS REQUIRED. A guide missing its lede, its admission or its
 *    FAQ does not compile. There is no half-written guide.
 *
 * 3. A GUIDE NAMES ITS GAME. `game` is a roster id, and `guides.test.ts`
 *    asserts the roster has it - so a guide cannot outlive the game it is
 *    about, and the renderer reads the difficulty tiers, the name and the card
 *    art from `meta.ts` rather than from anything an author typed.
 *
 * BUILD-TIME ONLY, like everything under `src/content/`.
 * `no-app-imports.test.ts` forbids the app from importing this module or
 * anything beside it: one stray import puts every word of every guide into the
 * shell a child downloads before choosing a game.
 */

import type { FaqItem, Locale, PageLocale, Provenance } from "./types";
import { minesweeperNoGuessing } from "./guides/minesweeper-no-guessing";
import { labyrintheEnLigne } from "./guides/labyrinthe-en-ligne";
import { memoryGameForKids } from "./guides/memory-game-for-kids";
import { findTheDifferences } from "./guides/find-the-differences";
import { demineurEnLigne } from "./guides/demineur-en-ligne";

/** A heading and the paragraphs under it. */
export interface GuideSection {
  title: string;
  body: string[];
}

/** A source worth citing by name, with the URL a reader can check it at. */
export interface GuideSource {
  /** How the source is cited in the prose - author, title, year. */
  label: string;
  /** Where a reader goes to check it. Absolute, always. */
  url: string;
}

/** One guide's prose, in the one language it is written in. */
export interface GuideCopy {
  /** <= 60 chars. Becomes <title> and og:title. */
  metaTitle: string;
  /** 50-160 chars. Becomes the meta description. */
  metaDescription: string;
  h1: string;
  /**
   * Two or three words for the share card and the index tile.
   *
   * It cannot be derived from `h1`, which is a sentence, and it must not be
   * the GAME's name: `ogCardText` draws it, and a card reading the same words
   * as the game's card is a second picture of a page it does not describe -
   * which `checkCardsAreDistinct()` refuses, correctly.
   */
  cardTitle: string;
  /**
   * The answer, first, in one or two sentences.
   *
   * This is the paragraph under the H1, the og:description, and the thing an
   * answer engine lifts, so it has to survive being read completely alone.
   */
  lede: string;
  /** The article's opening. `voice.ts` measures the length spread over THESE. */
  body: string[];
  sections: GuideSection[];
  /**
   * The one honest admission of a limit.
   *
   * A required field rather than a convention, because it is the Experience in
   * E-E-A-T and it is the first thing that gets cut when a page is running
   * long. Nothing reads more human than a stated limit.
   */
  admission: string;
  /** Phrased the way the query was typed, taken from the export rather than invented. */
  faq: FaqItem[];
  /** The label on the link down into the game. */
  playLabel: string;
  /** Outside sources, cited by name. The GEO lever, and the E-E-A-T one. */
  sources: GuideSource[];
}

export interface GuideEntry {
  /** The URL segment. Unique across every guide, in every language. */
  slug: string;
  /** The one language this guide is written in. */
  locale: Locale;
  /** A roster id. The guide links down to this game and borrows its picture. */
  game: string;
  copy: GuideCopy;
  /** Every statistic the prose quotes, and the script that derives it. */
  provenance: Provenance[];
}

/**
 * The words around a guide that are not the article: the index page, the
 * section headings, the link back.
 *
 * `Record<PageLocale, ...>` for the same reason `SITE` is: a language promoted
 * without these is a red build rather than an index page that quietly reads
 * English. Written for all four even though only two have guides today,
 * because these are CHROME rather than article prose - and a locale with no
 * guides emits no index page at all, so nothing here reaches a reader until
 * somebody writes an article in that language.
 */
export interface GuideChrome {
  /** The index page's <title>. */
  indexTitle: string;
  indexDescription: string;
  indexH1: string;
  indexLede: string;
  /** The breadcrumb word, and the footer link. */
  guides: string;
  /** Above the link down into the game. */
  play: string;
  /** Above the honest admission. */
  admission: string;
  /** Above the cited sources. */
  sources: string;
  /** Above the sibling guides. */
  more: string;
}

export const GUIDE_CHROME: Record<PageLocale, GuideChrome> = {
  he: {
    indexTitle: "מדריכים למשחקים - Ellaz",
    indexDescription:
      "מדריכים קצרים למשחקים שלנו: איך משחקים, מה כדאי לדעת, ומה המספרים אומרים. בלי פרסומות ובלי הרשמה.",
    indexH1: "מדריכים",
    indexLede:
      "כל מדריך עונה על שאלה אחת, ומביא איתו מספר אחד שחישבנו בעצמנו. בסוף כל אחד מהם יש קישור למשחק.",
    guides: "מדריכים",
    play: "לשחק",
    admission: "מה לא עובד כאן",
    sources: "מקורות",
    more: "מדריכים נוספים",
  },
  en: {
    indexTitle: "Game guides - Ellaz",
    indexDescription:
      "Short guides to our games: how they work, what is worth knowing, and what the numbers say. No ads, no account.",
    indexH1: "Guides",
    indexLede:
      "Each guide answers one question and brings one number we worked out ourselves. Every one ends with a link to the game.",
    guides: "Guides",
    play: "Play it",
    admission: "What does not work here",
    sources: "Sources",
    more: "More guides",
  },
  es: {
    indexTitle: "Guias de juegos - Ellaz",
    indexDescription:
      "Guias breves de nuestros juegos: como funcionan, que conviene saber y que dicen los numeros. Sin anuncios ni registro.",
    indexH1: "Guias",
    indexLede:
      "Cada guia responde una pregunta y trae un numero que calculamos nosotros. Todas terminan con un enlace al juego.",
    guides: "Guias",
    play: "Jugar",
    admission: "Lo que no funciona aqui",
    sources: "Fuentes",
    more: "Mas guias",
  },
  fr: {
    indexTitle: "Guides de jeux - Ellaz",
    indexDescription:
      "Des guides courts sur nos jeux : comment ils marchent, ce qu'il faut savoir, ce que disent les chiffres. Sans publicite ni inscription.",
    indexH1: "Guides",
    indexLede:
      "Chaque guide repond a une question et apporte un chiffre que nous avons calcule nous-memes. Tous se terminent par un lien vers le jeu.",
    guides: "Guides",
    play: "Jouer",
    admission: "Ce qui ne marche pas ici",
    sources: "Sources",
    more: "Autres guides",
  },
  sv: {
    indexTitle: "Spelguider - Ellaz",
    indexDescription:
      "Korta guider till våra spel: hur de fungerar, vad som är värt att veta, och vad siffrorna säger. Inga annonser, inget konto.",
    indexH1: "Guider",
    indexLede:
      "Varje guide svarar på en fråga och kommer med en siffra vi räknat fram själva. Alla slutar med en länk till spelet.",
    guides: "Guider",
    play: "Spela",
    admission: "Vad som inte fungerar här",
    sources: "Källor",
    more: "Fler guider",
  },
};

/**
 * Every guide, keyed by slug.
 *
 * The slug is the key AND a field on the entry, and `guides.test.ts` asserts
 * they agree - a registry whose key can disagree with its own row is the shape
 * that emits a page at one URL and links to it at another.
 */
export const GUIDES: Record<string, GuideEntry> = {
  [minesweeperNoGuessing.slug]: minesweeperNoGuessing,
  [labyrintheEnLigne.slug]: labyrintheEnLigne,
  [memoryGameForKids.slug]: memoryGameForKids,
  [findTheDifferences.slug]: findTheDifferences,
  [demineurEnLigne.slug]: demineurEnLigne,
};

/** In declaration order, which is the order the index page lists them. */
export const GUIDE_LIST: GuideEntry[] = Object.values(GUIDES);

export function guideFor(slug: string): GuideEntry | undefined {
  return GUIDES[slug];
}

/** Every guide written in one language, in declaration order. */
export function guidesIn(locale: Locale): GuideEntry[] {
  return GUIDE_LIST.filter((g) => g.locale === locale);
}

/**
 * The languages that have at least one guide, and therefore an index page.
 *
 * DERIVED, never listed. A guide written in a new language gets its index
 * page, its sitemap row and its hreflang cluster with no edit anywhere - and
 * the last guide in a language leaving takes the index page with it rather
 * than leaving a document listing nothing.
 */
export const GUIDE_LOCALES: Locale[] = (Object.keys(GUIDE_CHROME) as Locale[]).filter(
  (l) => guidesIn(l).length > 0,
);

/** The guides about one game, in one language. Used by the game page's link out. */
export function guidesForGame(gameId: string, locale: Locale): GuideEntry[] {
  return GUIDE_LIST.filter((g) => g.game === gameId && g.locale === locale);
}
