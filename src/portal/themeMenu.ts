import type { AppLocale } from "@i18n/locales";

/**
 * The Theme choice inside a screen's "..." menu - the room, the boards and
 * every game page (operator ruling 2026-09-27).
 *
 * The menu itself is emitted markup that opens with no script; this only
 * fills its `.themegrid` the first time it opens, from the lazy `themes-*`
 * chunk, and closes it on a tap outside. A tap ON a theme does not close it:
 * the player is comparing looks, and the page behind the open menu is the
 * comparison.
 *
 * Pinned to the `page` chunk in vite.config.ts beside keyGuard.ts: it is
 * imported only by PageApp, and a new src/portal/ module would otherwise land
 * in the first-visit shell.
 */
export function wireThemeMenu(locale: AppLocale, doc: Document = document): void {
  const more = doc.querySelector<HTMLDetailsElement>(".top .more");
  const slot = more?.querySelector<HTMLElement>(".themegrid");
  if (!more || !slot) return;
  more.addEventListener("toggle", () => {
    if (more.open) void import("@ui/themePicker").then((m) => m.mountThemePicker(slot, locale));
  });
  doc.addEventListener("click", (e) => {
    const t = e.target as Element | null;
    if (more.open && !t?.closest?.(".more")) more.open = false;
  });
}
