import { useEffect } from "react";

/**
 * A THUMB THAT MISSES THE CANVAS MUST NOT SCROLL THE PAGE WHILE A RUN IS LIVE.
 *
 * Reported twice from Neon Survival on 2026-10-02 and measured the next day on
 * live ellaz.fun at 390x844: a game page is a ~9000px document (the game, then
 * its article), and any drag that started off the canvas - the freeze button,
 * the strip under the arena, the HUD's edge - moved it 133-145px in Neon, Snake
 * Survivors, Snake Arena and Hold the Line. In Neon's career shop, which is a
 * fixed box on <body>, the same drag slid the arena out from under it, and the
 * next tap on that arena started a run nobody could see.
 *
 * `html { overflow: hidden }` is the whole cure, measured on the live page:
 * shop drag 125 -> 0, run drags 145 / 133 / 133 -> 0, every shop button still
 * pressable. `touch-action` alone stopped two of the three run drags and none
 * of the shop's.
 *
 * HELD, NEVER SET. Several things can want the page still at once - a live run
 * and a career screen hand over to each other in one render - so this counts
 * holders per root and only the LAST release puts back the overflow the page
 * had before the first hold. A plain "set hidden / set auto" pair would leave
 * the page unscrollable or scrollable depending on which effect cleaned up
 * first, and the article must stay reachable on the title, pause and game over.
 *
 * THE SCROLLBAR'S WIDTH IS KEPT. On a desktop with a classic scrollbar, hiding
 * the overflow removes the bar and the page grows ~15px wider, which re-sizes
 * every board sized against the viewport - the "a key never resizes the game"
 * law, broken by a lock. So when the window HAS a gutter, the lock reserves it
 * (`scrollbar-gutter: stable`) for as long as it is held. A phone's overlay
 * scrollbar has no gutter, and then nothing but the overflow is touched.
 */

/** The part of `document.documentElement` this needs - so the test needs no DOM. */
export interface ScrollRoot {
  style: { overflow: string; scrollbarGutter: string };
}

const held = new WeakMap<ScrollRoot, { count: number; overflow: string; gutter: string }>();

/**
 * Take one hold on the page's scroll. Returns the release, which is safe to call
 * twice (a second call does nothing - it can never release someone else's hold).
 *
 * `gutter` is the width of the window's classic scrollbar in px; 0 on a phone.
 */
export function holdPageScroll(
  root: ScrollRoot = document.documentElement,
  gutter: number = typeof window === "undefined" ? 0 : window.innerWidth - document.documentElement.clientWidth,
): () => void {
  let h = held.get(root);
  if (!h) {
    h = { count: 0, overflow: root.style.overflow, gutter: root.style.scrollbarGutter };
    held.set(root, h);
    root.style.overflow = "hidden";
    if (gutter > 0) root.style.scrollbarGutter = "stable";
  }
  h.count += 1;
  let released = false;
  return () => {
    if (released) return;
    released = true;
    const cur = held.get(root);
    if (!cur) return;
    cur.count -= 1;
    if (cur.count > 0) return;
    root.style.overflow = cur.overflow;
    root.style.scrollbarGutter = cur.gutter;
    held.delete(root);
  };
}

/** How many holders the page has right now. For the tests and the repro. */
export function pageScrollHolds(root: ScrollRoot = document.documentElement): number {
  return held.get(root)?.count ?? 0;
}

/** Hold the page's scroll for exactly as long as `on` is true and the caller is mounted. */
export function usePageScrollLock(on: boolean): void {
  useEffect(() => (on ? holdPageScroll() : undefined), [on]);
}
