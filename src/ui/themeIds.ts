/**
 * THE THEME IDS - split out of `themes.ts` on 2026-09-27 so a first visit
 * carries the six ids and nothing else. `themes.ts` re-exports all of this, so
 * the build and the tests read one list; only the port (`theme.ts`) imports
 * this file directly. If the port imported `themes.ts`, the six theme records
 * (labels, icons, colours) would ride in the shell: a module shared between
 * the shell and the lazy picker lands in the shell WHOLE.
 *
 * Imports nothing, for the reason given at the top of `themes.ts`.
 */
/**
 * Every theme's id, and the ONLY part of this file the app's first visit needs.
 *
 * The records below (labels, icons, colours) are read by the build and by the
 * lazy theme picker; the shell only has to recognise an id. Keeping the list
 * apart is what lets the four new themes cost a first visit nothing but these
 * words - `isThemeId` reads this array, not `THEMES`, so the records tree-shake
 * out of the shell.
 */
export const THEME_IDS = ["market", "night", "paper", "crayon", "flat", "arcade"] as const;

export type ThemeId = (typeof THEME_IDS)[number];

/**
 * The theme a visitor gets before they have ever chosen one.
 *
 * It must match the theme declared at BARE `:root` in tokens.css - that block
 * is what paints a page whose boot script has not run, and there are 46 such
 * documents. `theme-sync.test.ts` asserts the two agree, because a mismatch
 * would show as a flash of the wrong theme on every cold load and nowhere
 * else.
 */
export const DEFAULT_THEME: ThemeId = "market";

/** Where the player's choice lives. Same namespace as every other Ellaz key. */
export const THEME_STORAGE_KEY = "ellaz:theme";

export function isThemeId(value: unknown): value is ThemeId {
  return (THEME_IDS as readonly unknown[]).includes(value);
}

