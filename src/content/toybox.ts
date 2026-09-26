/**
 * The Toybox games that have a page of their own on this site, at
 * `/games/<slug>/`.
 *
 * WHY THIS EXISTS. The Toybox (`/toybox/`) is a second application - games on
 * the studio's engine, built from `studio/` and copied into `dist/toybox/` by
 * the deploy AFTER this build runs - and every page of it is `noindex`. So a
 * game that lives there has no document a search engine will keep, and the
 * only links to it were a footer line and a home-screen strip pointing at a
 * page that asks not to be indexed. An entry here is the one indexable page
 * about that game, in this site's own document shell, with a PLAY button that
 * leaves for the Toybox.
 *
 * NOT A GUIDE, though the shape is borrowed from one. A guide answers a
 * question and links down to a ROSTER game - `guides.test.ts` asserts its
 * `game` is on the roster, and `guidePage` throws when it is not. A Toybox game
 * is not on the roster and never will be (it keeps no coins and no stars of
 * this site's, and its code lives in another workspace), so it is its own page
 * kind rather than a guide with its one structural rule switched off.
 *
 * ONE LOCALE PER ENTRY, declared on it, exactly like a guide. The Toybox exists
 * in English and in no other language, so a Hebrew twin of this page would be
 * prose about a game the reader then cannot read a word of - and a page nobody
 * translated is the duplicate `a-locale-page-without-a-translated-body-is-a-duplicate.md`
 * forbids.
 *
 * BUILD-TIME ONLY, like everything under `src/content/`. The app must never
 * import it (`no-app-imports.test.ts`).
 */

import type { FaqItem, Locale } from "./types";
import { toyboxBrawl } from "./toybox/brawl";

/** A heading and the paragraphs under it. */
export interface ToyboxSection {
  title: string;
  body: string[];
}

/** One row of the keyboard list: the keys, and what they do. */
export interface ToyboxKeyRow {
  keys: string;
  does: string;
  /**
   * The `KeyboardEvent.code` values this row NAMES, so a test can hold the
   * sentence to the Toybox's own key map (`studio/toybox/cells/shared/input.ts`).
   * A control written on this page that the game does not bind is a player
   * pressing a key that does nothing - and nothing else here could notice.
   */
  codes: string[];
}

export interface ToyboxCopy {
  /** <= 60 chars. Becomes <title> and og:title. */
  metaTitle: string;
  /** 50-160 chars. Becomes the meta description. */
  metaDescription: string;
  h1: string;
  /** The answer first: the paragraph under the H1, and the og:description. */
  lede: string;
  /** The chips under the picture. Short, and each one true. */
  facts: string[];
  /** What the picture shows, for a screen reader and for an image crawler alike. */
  artAlt: string;
  /** The words on the PLAY button. */
  playLabel: string;
  /** The line beside it: where the button goes. */
  playNote: string;
  body: string[];
  sections: ToyboxSection[];
  /** Above the keyboard list. */
  keyboardTitle: string;
  keyboard: ToyboxKeyRow[];
  /** The touch half, in prose - the touch layout is still being decided (see the admission). */
  touch: ToyboxSection;
  /** Above the admission. */
  admissionTitle: string;
  /** The one honest statement of what is not finished. Required, like a guide's. */
  admission: string;
  faq: FaqItem[];
  /** The label on the link to the whole Toybox shelf. */
  shelfLabel: string;
}

export interface ToyboxEntry {
  /** The registry key and the route's `id`. Also what the share card is named after. */
  id: string;
  /** The URL segment under `/games/`. Must collide with no game id and no category id. */
  slug: string;
  /** The one language this page is written in - the Toybox's only language. */
  locale: Locale;
  /** The game's own name, as the Toybox shelf and the home strip show it. */
  name: string;
  /** Its directory under `studio/games/`, which is also its directory under `/toybox/games/`. */
  dir: string;
  /** The campaign the PLAY button opens, as `?campaign=<id>`. */
  campaign: string;
  copy: ToyboxCopy;
}

/** Every Toybox game with a page here, keyed by id. */
export const TOYBOX: Record<string, ToyboxEntry> = {
  [toyboxBrawl.id]: toyboxBrawl,
};

/** In declaration order. */
export const TOYBOX_LIST: ToyboxEntry[] = Object.values(TOYBOX);

export function toyboxFor(id: string): ToyboxEntry | undefined {
  return TOYBOX[id];
}
