import type { AppLocale } from "../i18n/locales";
import { textFor } from "../i18n/strings";
import { themePort } from "./theme";
import { THEMES, type Theme, type ThemeId } from "./themes";

/**
 * THE THEME CHOICE - six pictures in the "..." menu, on every screen
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

/** A picture of each theme, drawn in its own colours - never words alone. */
interface Swatch {
  readonly page: string;
  readonly bar: string;
  readonly card: string;
  readonly ink: string;
  readonly edge: string;
  readonly radius: string;
}

const SWATCH: Record<ThemeId, Swatch> = {
  market: { page: "#fff6e9", bar: "#ff4d8d", card: "#fffdf8", ink: "#241c17", edge: "0 2px 0 rgba(36,28,23,.2)", radius: "999px" },
  night: { page: "#0f1226", bar: "#6c5ce7", card: "#262b52", ink: "#f5f6ff", edge: "0 2px 6px rgba(0,0,0,.4)", radius: "999px" },
  paper: { page: "#f1e4c8", bar: "#e4574a", card: "#fffaf0", ink: "#3b2f24", edge: "2px 2px 0 rgba(59,47,36,.3)", radius: "5px" },
  crayon: {
    page: "repeating-linear-gradient(#fdfdf6 0 7px,#c9dcf2 7px 8px)",
    bar: "#fdfdf6",
    card: "#ffffff",
    ink: "#2b2b2b",
    edge: "0 0 0 2px #2b2b2b",
    radius: "14px 4px 12px 5px/5px 12px 4px 14px",
  },
  flat: { page: "#ffcf56", bar: "#3d348b", card: "#ffffff", ink: "#1d1b3a", edge: "2px 2px 0 #d9a93c,4px 4px 0 #d9a93c", radius: "8px" },
  arcade: { page: "#0d0221", bar: "#1b0f3b", card: "#2e1e66", ink: "#e0e6ff", edge: "0 0 0 2px #ff2a6d", radius: "0" },
};

const HEADING = { he: "ערכת נושא", en: "Theme", es: "Tema", sv: "Tema" };

function sheetHref(id: ThemeId): string {
  return `${import.meta.env.BASE_URL}assets/theme-${id}${__THEME_SHEET_SUFFIX__}`;
}

/** Resolve once the theme's sheet is in the page (at once for Day and Night). */
export function loadSheet(theme: Theme): Promise<void> {
  if (!theme.sheet) return Promise.resolve();
  const href = sheetHref(theme.id);
  // The boot script may already have written it, parser-inserted and loaded.
  if (document.querySelector(`link[href="${href}"]`)) return Promise.resolve();
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
    `display:block;width:64px;height:44px;border-radius:8px;overflow:hidden;position:relative;` +
    `background:${s.page};box-shadow:inset 0 0 0 1px rgba(0,0,0,.15)`;
  const bar = document.createElement("span");
  bar.style.cssText = `position:absolute;inset:0 0 auto;height:11px;background:${s.bar}`;
  const card = document.createElement("span");
  card.style.cssText =
    `position:absolute;left:10px;right:10px;top:18px;height:17px;background:${s.card};` +
    `border-radius:${s.radius};box-shadow:${s.edge}`;
  const dot = document.createElement("span");
  dot.style.cssText = `position:absolute;left:8px;top:6px;width:18px;height:5px;border-radius:3px;background:${s.ink};opacity:.75`;
  card.appendChild(dot);
  box.append(bar, card);
  return box;
}

/**
 * Draw the six choices into `host`. Safe to call again; it draws once.
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
  const grid = document.createElement("div");
  grid.style.cssText = "display:grid;grid-template-columns:repeat(3,1fr);gap:4px;padding:0 2px 6px";
  const buttons = new Map<ThemeId, HTMLButtonElement>();
  const mark = (current: ThemeId) => {
    for (const [id, b] of buttons) {
      b.setAttribute("aria-pressed", String(id === current));
      b.style.outline = id === current ? "3px solid currentColor" : "none";
    }
  };
  for (const theme of THEMES) {
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
    b.addEventListener("click", () => {
      b.setAttribute("aria-busy", "true");
      loadSheet(theme)
        .then(() => themePort.set(theme.id))
        .catch(() => {
          /* the sheet is missing: stay on the theme the player already has */
        })
        .finally(() => b.removeAttribute("aria-busy"));
    });
    buttons.set(theme.id, b);
    grid.appendChild(b);
  }
  mark(themePort.current);
  themePort.onChange(mark);
  host.append(title, grid);
}
