/**
 * EVERY LAB ADDRESS, dispatched inside the `lab-*` chunk.
 *
 * `App.tsx` holds one `lazy()` for all of them and hands the hash here, so a
 * new lab costs the first-visit shell nothing (a fifth `lazy()` there cost
 * +45 B gz of shell on 2026-09-27). What each address is for, as each one's
 * author wrote it when it lived in App.tsx:
 */
import type { AppLocale } from "@i18n/locales";
import { Lab } from "./Lab";
import { Buttons } from "./design/Buttons";
import { Compare } from "./design/Compare";
import { Screen } from "./design/Screen";
import { Layout } from "./layout/Layout";

/**
 * The sound lab, at `#/lab`.
 *
 * A FRAGMENT, not a path: a fragment never reaches the server, so this needs no
 * emitted document, joins no sitemap, and no crawler can find it. `#/lab` was
 * the old Juice Lab's address and has been an unrecognised hash since that lab
 * was deleted; giving it a destination again costs nothing and means an old
 * bookmark lands somewhere useful.
 *
 * Lazy, and carved into its own `lab-*` chunk by `manualChunks` with a matching
 * `globIgnores` entry - the documented three changes. It is NOT guarded by
 * `import.meta.env.DEV` the way the old lab was, because the whole point is
 * that it is reachable from a phone; `npm run build:check` is what proves it
 * still costs a first visit nothing.
 */
/* `#/lab` itself, and the fallback below. */

/**
 * The Design Bench's compare screen, at `#/lab/design`.
 *
 * Its own address rather than a tab inside the sound lab, for one reason that
 * is a measurement and not a preference: the lab's column is capped at 720px
 * and two phone-width arms side by side need 796. A tab would have to fight
 * that cap or shrink the arms, and an arm measured at the wrong width is worse
 * than no arm at all.
 *
 * Same chunk, so it costs a first visit exactly what the lab costs it: nothing.
 */
const DESIGN_HASH = "#/lab/design";

/**
 * THE BENCH, at `#/lab/buttons` - a real game page where every part of it is a
 * thing you can point at.
 *
 * It kept that address rather than taking a new one, because it is the address
 * that is bookmarked and it is still the same subject. What changed is how you
 * reach a number: it was two tabs of sliders named after CSS custom properties
 * and it is now the screen itself, chosen out of three proposals on
 * 2026-08-22. Same `lab-*` chunk, so it costs a first visit nothing.
 */
const BUTTONS_HASH = "#/lab/buttons";

/**
 * The per-game footers, at `#/lab/footers`.
 *
 * The half of the old buttons bench the inspector does NOT cover: what each of
 * the 33 games draws in its own footer, which no shared rule governs, and the
 * wall that scans all of them at once. It asks a different question - "what did
 * 33 authors do" rather than "what should this one number be" - so it gets its
 * own address instead of being a tab nobody opens.
 */
const FOOTERS_HASH = "#/lab/footers";

/**
 * THE LAYOUT LAB, at `#/lab/layout` (and `#/lab/layout/<game>` for one game).
 *
 * Every game on four real screen sizes, the bars and the board measured by one
 * reader (`src/lab/layout/harvest.ts`) that `npm run assert:layout` also runs,
 * so the page and the gate cannot disagree. Same `lab-*` chunk: a first visit
 * pays nothing for it.
 */
const LAYOUT_HASH = "#/lab/layout";

/** An address under `#/lab/` that names no lab lands on the sound lab, never on a blank page. */
export function LabRoute({ hash, locale }: { hash: string; locale: AppLocale }) {
  if (hash === LAYOUT_HASH || hash.startsWith(`${LAYOUT_HASH}/`)) return <Layout />;
  if (hash === FOOTERS_HASH) return <Buttons />;
  if (hash === BUTTONS_HASH) return <Screen />;
  if (hash === DESIGN_HASH) return <Compare />;
  return <Lab locale={locale} />;
}
