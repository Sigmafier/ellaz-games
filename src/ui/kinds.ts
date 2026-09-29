/**
 * THE BUTTON KIT - every button kind this app draws, and the settings each one
 * reads (games-doctrine G8, operator ruling 2026-09-28: "we always generalize
 * buttons and make them modular so we can change them easily as we wish").
 *
 * A kind is drawn in ONE place, and every look it has - fill, ink, edge,
 * shape, shadow, type, tilt, how it moves when pressed - is read from its
 * settings with Day's value as the fallback:
 *
 *     background: ${K("lid-fill", "rgba(255,255,255,.12)")}
 *               = background: var(--lid-fill,rgba(255,255,255,.12))
 *
 * So a theme, or a whole new style, is a LIST OF SETTINGS and nothing else:
 *
 *     :root[data-theme="wood"] body { --lid-fill: #8a5a33; --lid-radius: 4px; }
 *
 * Set them on `body` (or `:root[data-theme=x] body`): the game colour `--g`
 * lives on <body>, so a setting that reads it resolves there. A sheet may also
 * vary a setting by POSITION (`.ellaz-key:nth-child(3n) { --key-bg: ... }`) -
 * that is still a setting. What a sheet may not do is give a button a look
 * directly; `button-kit.test.ts` counts every rule that does, and the count
 * only goes down.
 *
 * A kind that exists in the code and not here is a button no style can reach;
 * a setting here that nothing reads is a lever with no caller. The kit test
 * holds both directions. This module imports nothing: the page chunk
 * (GameTable) and the document emitter (src/build/layout.ts) both read it.
 */
/** The tools a style may set apart one by one, by the `data-<role>` each carries. */
export const TOOL_ROLES = ["pause", "restart", "sound", "fav", "share", "fullscreen", "report"] as const;
const ROLE_LOOKS = ["fill", "ink", "tilt", "shadow", "shadow-down"] as const;
type ToolRoleSetting = `tool-${(typeof ROLE_LOOKS)[number]}-${(typeof TOOL_ROLES)[number]}`;

function roleSettings(): ToolRoleSetting[] {
  return ROLE_LOOKS.flatMap((l) => TOOL_ROLES.map((r) => `tool-${l}-${r}` as const));
}

export const KIT = {
  /** the mat under a table board */
  mat: ["mat-fill", "mat-edge", "mat-radius", "mat-radius-pc"],
  /** the level disc on the table, and the dots that say which level */
  disc: [
    "disc-size", "disc-size-pc", "disc-radius", "disc-tilt", "disc-fill", "disc-ink", "disc-shadow", "disc-font", "disc-text-pc",
    "disc-dot", "disc-dot-on", "disc-dot-size", "disc-dot-radius", "disc-dots-text",
  ],
  /** a number card on the table (score, best, time) */
  card: [
    "card-min", "card-min-pc", "card-radius", "card-fill", "card-ink", "card-label", "card-shadow", "card-tilt", "card-tilt-alt",
    "card-label-font", "card-value-font", "card-note-font",
  ],
  /** an action token on the table (restart, pause) */
  token: [
    "token-size", "token-size-pc", "token-radius", "token-fill", "token-ink", "token-shadow", "token-tilt", "token-tilt-alt",
    "token-icon", "token-icon-pc",
  ],
  /** the tray holding a game's own controls, and what its keys wear */
  tray: [
    "tray-fill", "tray-edge", "tray-radius", "tray-radius-pc", "tray-ink",
    "tray-key-fill", "tray-key-ink", "tray-key-radius", "tray-key-shadow",
  ],
  /**
   * a LID: an app button in the page's bar - home, language, the "..." menu -
   * and the coins beside them. `lid-tilt-<role>` turns one of them.
   */
  lid: [
    "lid-fill", "lid-fill-hover", "lid-fill-down", "lid-ink", "lid-edge", "lid-radius", "lid-shadow", "lid-shadow-down",
    "lid-press", "lid-squash", "lid-clip", "lid-motion",
    "lid-tilt-home", "lid-tilt-lang", "lid-tilt-more", "lid-tilt-wallet",
  ],
  /** the coins, a lid with its own ink, type and (on a PC) a word before it */
  wallet: ["wallet-ink", "wallet-font", "wallet-size", "wallet-label", "wallet-label-ink"],
  /**
   * a TOOL: a round utility button - pause, restart, sound, favourite, share,
   * full screen, tell us - in the bar (a phone moves pause and restart up) or
   * in the row under it. `tool-*-bar` is the bar's own; each ROLE can be set
   * apart with `tool-<look>-<role>` (below, from TOOL_ROLES).
   */
  tool: [
    "tool-fill", "tool-fill-bar", "tool-fill-hover", "tool-ink", "tool-ink-bar", "tool-edge", "tool-radius",
    "tool-shadow", "tool-shadow-bar", "tool-shadow-down", "tool-shadow-restart-row",
    "tool-press", "tool-squash", "tool-clip", "tool-motion",
    ...roleSettings(),
  ],
  /**
   * a CORNER: on a Game table page the bar gives way to the app's buttons -
   * home and the game's name in one top corner, the coins, language, sound and
   * the "..." menu in the other - small, on the page's own ground, off the mat
   * (K4, the table round's tab A). `corner-ground` is what shows behind them
   * where the bar used to be; `corner-title-ink` is the game's name.
   */
  corner: [
    "corner-ground", "corner-fill", "corner-fill-hover", "corner-ink", "corner-title-ink",
    "corner-edge", "corner-radius", "corner-shadow",
  ],
  /** the "..." menu and the language list that open under the bar */
  sheet: ["sheet-fill", "sheet-ink", "sheet-edge", "sheet-radius", "sheet-shadow"],
  /**
   * a KEY: one button of a game's own keypad or keyboard, drawn by @ui/Key
   * (`act` for erase / delete, `go` for check). The first four were
   * named before the kit and are kept (`--key-bg`, not `--key-fill`): games,
   * theme sheets and theme-sheets.test.ts already read them.
   */
  key: [
    "key-bg", "key-ink", "key-radius", "key-shadow",
    "key-bg-hover", "key-ink-down", "key-shadow-down", "key-press", "key-squash",
    "key-edge", "key-font", "key-weight", "key-size", "key-size-act", "key-clip", "key-tilt", "key-motion",
    "key-go-fill", "key-go-ink",
    // a look run through the keys in a cycle of 4, 3 or 2 (first key is -a)
    "key-bg-4a", "key-bg-4b", "key-bg-4c", "key-bg-4d", "key-tilt-4a", "key-tilt-4b", "key-tilt-4c", "key-tilt-4d",
    "key-bg-3a", "key-bg-3b", "key-bg-3c", "key-tilt-2a", "key-tilt-2b",
  ],
} as const;

export type Kind = keyof typeof KIT;
export type Setting = (typeof KIT)[Kind][number] | ToolRoleSetting;

/**
 * The kit's WIRING: private properties a drawer passes from one of its rules to
 * another (a role's fill to the rule that paints it, a key's Day size from the
 * game). Never set by a style - a sheet setting one would reach inside a kind -
 * and never a token. Listed so the token check knows them by name.
 */
export const KIT_WIRING = [
  "--lr-tilt", "--tf", "--ts", "--tr-fill", "--tr-ink", "--tr-tilt", "--tr-shadow", "--tr-down",
  "--k-size", "--k-fill", "--k-shadow", "--k-weight", "--kc-bg4", "--kc-bg3", "--kc-tilt4", "--kc-tilt2",
] as const;

/** Every setting, in kit order. */
export const SETTINGS: readonly Setting[] = Object.values(KIT).flat();

/** Read a kind's setting, with Day's value when a style leaves it unset. */
export const K = (name: Setting, day: string): string => `var(--${name},${day})`;
