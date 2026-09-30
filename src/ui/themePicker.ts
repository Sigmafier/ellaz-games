import type { AppLocale } from "../i18n/locales";
import { textFor } from "../i18n/strings";
import { themePort } from "./theme";
import { MODE_STORAGE_KEY, STYLES, THEMES, styleOf, themeById, wearOf, type Theme, type ThemeId } from "./themes";

/**
 * THE THEME CHOICE - a picture per theme in the "..." menu, on every screen
 * (operator ruling 2026-09-27: "the '...' menu, every page").
 *
 * LAZY, and plain DOM rather than React: the emitted screens (games, the room,
 * the boards) have no React header to render it into, and Home does. One
 * module that draws into a host element serves both, and lives in its own
 * `themes-*` chunk, so neither a first visit nor a game page pays for it until
 * somebody opens the menu.
 *
 * A theme with its own sheet (Paper, Crayon, Flat, Arcade) is only SET once
 * that sheet has loaded, so no frame shows the new colours on the old shapes
 * or the reverse. A sheet that fails to load leaves the theme where it was.
 */

/**
 * A picture of each theme, drawn in its own colours - never words alone. The
 * page, the bar across its top, and one key in the corner, which is where a
 * theme shows its hand: a square of crooked card, a hatched box, a red button
 * on a long shadow, an arcade button. The approved setting mock, 2026-09-27.
 */
interface Swatch {
  readonly page: string;
  readonly bar: string;
  readonly key: string;
}

const SWATCH: Record<ThemeId, Swatch> = {
  market: { page: "#fff6e9", bar: "#5b0f7a", key: "background:#fff;border-radius:6px;box-shadow:0 2px 0 #e8dccb" },
  night: { page: "#0f1226", bar: "#171b3a", key: "background:#6c5ce7;border-radius:6px" },
  paper: {
    page: "#f1e4c8",
    bar: "#c8433a",
    key: "background:#ffd166;border-radius:2px;rotate:-6deg;box-shadow:2px 2px 0 rgba(0,0,0,.25)",
  },
  crayon: {
    page: "repeating-linear-gradient(#fdfdf6 0 8px,#c9dcf2 8px 9px)",
    bar: "transparent",
    key:
      "border:2px solid #2b2b2b;border-radius:255px 15px 225px 15px/15px 225px 15px 255px;" +
      "background:repeating-linear-gradient(45deg,rgba(242,95,92,.55) 0 3px,#fff 3px 6px)",
  },
  flat: { page: "#ffcf56", bar: "#3d348b", key: "background:#f25f5c;border-radius:50%;box-shadow:2px 2px 0 #b8403d,4px 4px 0 #b8403d" },
  arcade: {
    page: "#0d0221",
    bar: "linear-gradient(#1b0f3b 0 8px,#ff2a6d 8px)",
    key: "background:#ff2a6d;border-radius:50%;box-shadow:0 3px 0 #06010f,inset -3px -3px 0 rgba(0,0,0,.3)",
  },
  // Day's page and bar - Wood changes only the table - so the picture is the
  // table top itself, with a tile from the rack on it.
  wood: {
    page: "repeating-linear-gradient(91deg,#c58e57 0 9px,#bd8650 9px 10px,#cc9862 10px 19px,#c28b54 19px 20px)",
    bar: "#5b0f7a",
    key: "background:#f3dcb0;border-radius:4px;box-shadow:0 3px 0 #8a5a30",
  },
};

const HEADING = { he: "ערכת נושא", en: "Theme", es: "Tema", sv: "Tema" };
const LIGHT = { he: "בהיר", en: "Light", es: "Claro", sv: "Ljust" };
const DARK = { he: "כהה", en: "Dark", es: "Oscuro", sv: "Mörkt" };

/** The player's Light/Dark choice. A saved "night" is Day's dark side, so it reads as dark too. */
function readDark(): boolean {
  try {
    return localStorage.getItem(MODE_STORAGE_KEY) === "dark" || themePort.current === "night";
  } catch {
    return themePort.current === "night";
  }
}

function sheetHref(id: ThemeId): string {
  return `${import.meta.env.BASE_URL}assets/theme-${id}${__THEME_SHEET_SUFFIX__}`;
}

/** Resolve once the theme's sheet is in the page (at once for Day and Night). */
export function loadSheet(theme: Theme): Promise<void> {
  if (!theme.sheet) return Promise.resolve();
  const href = sheetHref(theme.id);
  // The boot script may already have written it, parser-inserted and loaded.
  if (document.querySelector(`link[rel="stylesheet"][href="${href}"]`)) return Promise.resolve();
  return new Promise((resolve, reject) => {
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = href;
    link.onload = () => resolve();
    link.onerror = () => {
      link.remove();
      reject(new Error(`theme sheet ${theme.id} did not load`));
    };
    document.head.appendChild(link);
  });
}

function picture(s: Swatch): HTMLElement {
  const box = document.createElement("span");
  box.setAttribute("aria-hidden", "true");
  box.style.cssText =
    `display:block;width:64px;height:42px;border-radius:8px;overflow:hidden;position:relative;` +
    `background:${s.page};box-shadow:inset 0 0 0 1px rgba(0,0,0,.15)`;
  const bar = document.createElement("span");
  bar.style.cssText = `position:absolute;inset:0 0 auto;height:10px;background:${s.bar}`;
  const key = document.createElement("span");
  key.style.cssText = `position:absolute;right:7px;bottom:7px;width:18px;height:18px;box-sizing:border-box;${s.key}`;
  box.append(bar, key);
  return box;
}

/**
 * Fetch the sheets a pick would need, quietly, once the menu is open - so the
 * pick itself is a repaint and not a download. Measured on the live site
 * 2026-09-28: a pick took up to 508 ms while its sheet arrived, and one stalled
 * request left three taps doing nothing at all. Low priority, and only ever for
 * a player who has opened the menu; nobody else fetches a byte of this.
 */
function warmSheets(): void {
  const go = () => {
    for (const theme of THEMES) {
      if (!theme.sheet) continue;
      const href = sheetHref(theme.id);
      if (document.querySelector(`link[href="${href}"]`)) continue; // loaded, or already hinted
      const hint = document.createElement("link");
      hint.rel = "prefetch";
      hint.as = "style";
      hint.href = href;
      document.head.appendChild(hint);
    }
  };
  if ("requestIdleCallback" in window) requestIdleCallback(go, { timeout: 1500 });
  else setTimeout(go, 300);
}

/**
 * Put the theme on. Where the browser can, the whole page cross-fades from the
 * old look to the new one instead of snapping; where it cannot, or where the
 * player has asked for less motion, it changes at once. The theme is set either
 * way - the fade is how it looks, never whether it happens.
 */
function wear(id: ThemeId, dark: boolean): void {
  const set = () => {
    const root = document.documentElement;
    if (dark) root.setAttribute("data-mode", "dark");
    else root.removeAttribute("data-mode");
    try {
      if (dark) localStorage.setItem(MODE_STORAGE_KEY, "dark");
      else localStorage.removeItem(MODE_STORAGE_KEY);
    } catch {
      /* the choice holds for this visit; the next one starts light */
    }
    themePort.set(id);
    // A mode change on the same style keeps the id, so the port does not repaint
    // the phone's own chrome; Wood's dark side changes its brand, so do it here.
    const meta = document.querySelector('meta[name="theme-color"]');
    const chrome = getComputedStyle(root).getPropertyValue("--brand").trim();
    if (meta && chrome) meta.setAttribute("content", chrome);
  };
  const doc = document as Document & { startViewTransition?: (cb: () => void) => unknown };
  if (doc.startViewTransition && !matchMedia("(prefers-reduced-motion: reduce)").matches) {
    try {
      doc.startViewTransition(set);
      return;
    } catch {
      /* fall through and set it plainly */
    }
  }
  set();
}

/**
 * Draw the choices into `host`. Safe to call again; it draws once.
 * `close`, when given, makes the host its own card under the button and closes
 * it on a tap anywhere outside the button and the card (Home). A screen's
 * emitted `.moresheet` is already a card, and its menu closes itself.
 */
export function mountThemePicker(host: HTMLElement, locale: AppLocale, close?: () => void): void {
  if (host.dataset.drawn) return;
  host.dataset.drawn = "1";
  if (close) {
    const menu = host.parentElement!;
    document.addEventListener("click", (e) => {
      if (!host.hidden && !menu.contains(e.target as Node)) close();
    });
    host.style.cssText =
      "position:absolute;inset-inline-end:0;top:calc(var(--hpill) + 6px);z-index:30;width:240px;" +
      "padding:6px;border-radius:14px;background:var(--surface);color:var(--text);box-shadow:var(--shadow-2)";
  }
  host.setAttribute("role", "group");
  const title = document.createElement("b");
  title.textContent = textFor(HEADING, locale);
  title.style.cssText = "display:block;padding:6px 8px 4px;font-size:13px;opacity:.8";
  host.setAttribute("aria-label", title.textContent);
  let dark = readDark();
  const styleNow = () => styleOf(themePort.current, dark).style;
  /** Wear a (style, dark) pick once its sheet is in; `busy` is the control that asked. */
  const pick = (style: ThemeId, wantDark: boolean, busy: HTMLElement) => {
    const { id } = wearOf(style, wantDark);
    busy.setAttribute("aria-busy", "true");
    busy.style.opacity = "0.55";
    loadSheet(themeById(id))
      .then(() => {
        dark = wantDark;
        wear(id, wantDark);
        mark();
      })
      .catch(() => {
        /* the sheet is missing: stay on the theme the player already has */
      })
      .finally(() => {
        busy.removeAttribute("aria-busy");
        busy.style.opacity = "";
      });
  };

  // THE SWITCH, beside the style pictures: one row, two halves, 44px tall.
  const modeRow = document.createElement("div");
  modeRow.setAttribute("role", "group");
  modeRow.style.cssText = "display:grid;grid-template-columns:1fr 1fr;gap:4px;padding:0 2px 6px";
  const modeButtons = ([false, true] as const).map((isDark) => {
    const b = document.createElement("button");
    b.type = "button";
    b.dataset.pickMode = isDark ? "dark" : "light";
    b.textContent = textFor(isDark ? DARK : LIGHT, locale);
    b.style.cssText =
      "min-height:var(--tap,44px);border:0;border-radius:10px;cursor:pointer;font:700 14px/1 inherit;" +
      "background:color-mix(in srgb,currentColor 8%,transparent);color:inherit;outline-offset:-2px";
    b.addEventListener("click", () => {
      if (isDark !== dark) pick(styleNow(), isDark, b);
    });
    modeRow.append(b);
    return b;
  });

  const grid = document.createElement("div");
  grid.style.cssText = "display:grid;grid-template-columns:repeat(3,1fr);gap:4px;padding:0 2px 6px";
  const buttons = new Map<ThemeId, HTMLButtonElement>();
  function mark(): void {
    const style = styleNow();
    for (const [id, b] of buttons) {
      b.setAttribute("aria-pressed", String(id === style));
      b.style.outline = id === style ? "3px solid var(--brand-ink, currentColor)" : "none";
    }
    // Arcade is dark already: the switch would do nothing, so it is not shown.
    modeRow.hidden = style === "arcade";
    modeRow.style.display = modeRow.hidden ? "none" : "grid";
    for (const b of modeButtons) {
      const on = (b.dataset.pickMode === "dark") === dark;
      b.setAttribute("aria-pressed", String(on));
      b.style.outline = on ? "3px solid var(--brand-ink, currentColor)" : "none";
    }
  }
  for (const style of STYLES) {
    const theme = themeById(style);
    const b = document.createElement("button");
    b.type = "button";
    b.dataset.pickTheme = theme.id;
    b.style.cssText =
      "display:flex;flex-direction:column;align-items:center;gap:4px;min-height:var(--tap,48px);" +
      "padding:6px 2px;border:0;border-radius:10px;background:transparent;color:inherit;" +
      "font:600 13px/1.1 inherit;cursor:pointer;outline-offset:-2px";
    const name = document.createElement("span");
    name.textContent = textFor(theme.label, locale);
    b.append(picture(SWATCH[theme.id]), name);
    b.addEventListener("click", () => pick(style, dark, b));
    buttons.set(theme.id, b);
    grid.appendChild(b);
  }
  mark();
  themePort.onChange(() => mark());
  host.append(title, modeRow, grid);
  warmSheets();
}
