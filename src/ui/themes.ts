import type { IconName } from "./icons";
/**
 * The theme list, and the single place any part of the build may learn it.
 *
 * THIS FILE IMPORTS NOTHING, AND THAT IS A CONSTRAINT RATHER THAN A HABIT.
 * `vite.config.ts` imports it to generate the no-flash boot script and to fill
 * the PWA manifest, and Vite's own `resolve.alias` map does NOT apply to the
 * config file's imports. An `@ui/...` import here would break the build with
 * an error that points at the config rather than at this line.
 *
 * It also holds no React and touches no DOM, so the port (`theme.ts`), the
 * React glue (`useTheme.ts`) and the build can all read the same list.
 *
 * The one import below is a RELATIVE path to a leaf module with no imports of
 * its own, which is the exact shape the constraint above permits: the problem
 * was never "an import", it was an ALIAS the config cannot resolve. It buys the
 * theme labels the same promotion guarantee every other authored string has.
 */
import type { ShippedLocale } from "../i18n/locales";

// The ids, the default and the storage key live in `themeIds.ts`, the one
// part of the theme layer a first visit carries. See that file for why.
import { DEFAULT_THEME, THEME_STORAGE_KEY, type ThemeId } from "./themeIds";
export * from "./themeIds";

export interface Theme {
  readonly id: ThemeId;
  /**
   * Shown on the toggle. A locale RECORD rather than a `{ he, en }` literal,
   * so promoting a language reds here instead of leaving the theme name in
   * English on a screen that is not.
   */
  readonly label: Record<ShippedLocale, string>;
  /**
   * One icon, so the control reads without reading - and a NAME from the app's
   * own set rather than a character, because a text glyph is drawn by whatever
   * font the machine has and cannot match the icons beside it. See the header
   * of `ui/icons.tsx`, which says exactly this and which this field used to
   * contradict.
   */
  readonly icon: IconName;
  /**
   * `<meta name="theme-color">` and the PWA manifest's `theme_color`: the
   * colour the phone paints its own chrome. This used to be the literal
   * `#6c5ce7` written in three places that could each drift; now they all
   * derive from here and `theme-sync.test.ts` asserts it.
   */
  readonly browserChrome: string;
  /** The manifest's `background_color` - the splash behind an installed app. */
  readonly background: string;
  /**
   * True when the theme's values live in their own sheet,
   * `src/ui/themes/<id>.css`, fetched only by a player who picks it. Day and
   * Night live in tokens.css and ship to everyone; the four themes the style
   * round picked (2026-09-27) do not, because the first visit has no bytes for
   * them.
   */
  readonly sheet: boolean;
}

export const THEMES: readonly Theme[] = [
  {
    id: "market",
    label: { he: "יום", en: "Day", es: "Día", sv: "Dag" },
    icon: "sun",
    browserChrome: "#ff4d8d",
    background: "#fff6e9",
    sheet: false,
  },
  {
    id: "night",
    label: { he: "לילה", en: "Night", es: "Noche", sv: "Natt" },
    icon: "moon",
    browserChrome: "#6c5ce7",
    background: "#0f1226",
    sheet: false,
  },
  // The four the style round picked, operator 2026-09-27: "i want 1-2-3-5".
  {
    id: "paper",
    label: { he: "נייר", en: "Paper", es: "Papel", sv: "Papper" },
    icon: "layers",
    browserChrome: "#c8433a",
    background: "#f1e4c8",
    sheet: true,
  },
  {
    id: "crayon",
    label: { he: "צבעים", en: "Crayon", es: "Crayón", sv: "Krita" },
    icon: "draw",
    browserChrome: "#d0423c",
    background: "#fdfdf6",
    sheet: true,
  },
  {
    id: "flat",
    label: { he: "שטוח", en: "Flat", es: "Plano", sv: "Platt" },
    icon: "star",
    browserChrome: "#3d348b",
    background: "#ffcf56",
    sheet: true,
  },
  {
    id: "arcade",
    label: { he: "ארקייד", en: "Arcade", es: "Arcade", sv: "Arkad" },
    icon: "bolt",
    browserChrome: "#ff2a6d",
    background: "#0d0221",
    sheet: true,
  },
];

export function themeById(id: ThemeId): Theme {
  const found = THEMES.find((t) => t.id === id);
  // Unreachable through `isThemeId`, but a theme list that lost an entry
  // should not hand back `undefined` to something painting browser chrome.
  return found ?? THEMES[0];
}

/**
 * The no-flash boot script, GENERATED from the list above rather than written
 * out beside it.
 *
 * `data-theme` is deliberately never baked into the emitted HTML: it would be
 * wrong for whichever half of visitors chose the other theme, and these pages
 * are cached. So the attribute is set by this script, inline and synchronous,
 * before the first paint.
 *
 * It writes NOTHING when the stored value is the default, missing, or junk -
 * absent attribute means bare `:root`, which is already the default. That also
 * makes a corrupt localStorage a non-event rather than a blank screen.
 */
export function themeBootScript(sheet?: ThemeSheetHref): string {
  // The default is left out of the list rather than tested for separately:
  // "not in the list" already covers it, and every byte here is first visit.
  const ids = THEMES.map((t) => t.id).filter((id) => id !== DEFAULT_THEME);
  const set = `document.documentElement.setAttribute("data-theme",t)`;
  // Only a theme with a sheet asks for one, and the test is written as the
  // SHORT side - the few ids without a sheet - because every byte here is in
  // every first visit.
  const bare = THEMES.filter((t) => !t.sheet && t.id !== DEFAULT_THEME).map((t) => `t!=${JSON.stringify(t.id)}`);
  // `document.write`, not appendChild: a PARSER-inserted stylesheet blocks the
  // first paint, which is the point - a Paper player must never see a frame of
  // Day. A script-inserted one does not block, and the page would flash.
  // `rel=stylesheet` UNQUOTED, on purpose: the page emitter inlines every
  // `rel="stylesheet"` tag it finds in a document (src/build/assets.ts), and
  // this string is text inside a script, not a link it could inline.
  const link = sheet
    ? `;${bare.join("&&")}&&document.write('<link rel=stylesheet href=${sheet.prefix}'+t+'${sheet.suffix}>')`
    : "";
  return (
    `(function(){try{var t=localStorage.getItem(${JSON.stringify(THEME_STORAGE_KEY)});` +
    `if(${JSON.stringify(ids)}.indexOf(t)>-1){${set}${link}}` +
    `}catch(e){}})()`
  );
}

/**
 * Where a theme's own sheet is served: `prefix + id + suffix`. Built by
 * `src/build/themeSheets.ts` from the sheets' content hash, so a changed sheet
 * is a new URL and a cached old one is never read against new markup.
 */
export interface ThemeSheetHref {
  readonly prefix: string;
  readonly suffix: string;
}

/**
 * Does this document still need the boot script injected?
 *
 * Two kinds of document reach `transformIndexHtml`, and only ONE of them is
 * missing the script:
 *
 * - `index.html`, the application shell. It has no boot script of its own, so
 *   the Vite plugin is the only thing that gives it one.
 * - An emitted page. `renderDocument` already inlines the script as the first
 *   thing in its head - it has to, because those files are written straight to
 *   disk in `generateBundle` and never pass through a transform at all.
 *
 * In production the two never meet. In DEV they do: emitted pages are served
 * through `server.transformIndexHtml` (they must be - see
 * `.claude/rules/dev-pages-must-go-through-vites-html-pipeline.md`), so without
 * this predicate every dev page would carry the script twice. Running twice is
 * harmless today, because the script only reads storage and sets an attribute.
 * The reason to fix it anyway is that "harmless today" is a property of the
 * script's current body, not of the arrangement - and dev quietly serving
 * something production does not is exactly the divergence this repo keeps
 * getting bitten by.
 *
 * Matched on the storage key rather than the whole script: the key is the one
 * part no rewrite of the boot logic can drop, and it appears nowhere else in a
 * document.
 */
export function needsThemeBoot(html: string): boolean {
  return !html.includes(THEME_STORAGE_KEY);
}
