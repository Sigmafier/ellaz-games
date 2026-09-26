import type { Locale } from "../content/types";
import { SITE } from "../content/site";
import { GUIDE_CHROME, GUIDE_LOCALES, guidesIn } from "../content/guides";
import { gameName } from "./gameName";
import { html } from "./html";
import { renderDocument, utilityRow } from "./layout";
import { guideIndexGraph } from "./schema";
import { metaFor } from "../portal/games";
import { guidePath, guidesIndexPath, homePath, href } from "./routes";

/**
 * `/he/guides/` - every guide written in one language.
 *
 * A LISTING, not an article, which is why it is a different page kind from the
 * guides it lists: no prose floor applies to it, it draws its own share card,
 * and it is the only guide-shaped page with real hreflang siblings. The
 * indexes ARE each other's translations; the articles under them are not.
 *
 * It lists each guide by its own `h1` plus the game it is about, because a
 * reader scanning a list of headlines wants to know which game each one
 * concerns and the headline does not always say. The game's name is read from
 * the roster rather than typed, so it cannot be a name we do not ship.
 */
export function guideIndexPage(opts: {
  locale: Locale;
  base: string;
  indexable: boolean;
}): string {
  const { locale, base, indexable } = opts;
  const site = SITE[locale];
  const chrome = GUIDE_CHROME[locale];
  const guides = guidesIn(locale);

  /**
   * CARDS, because this is a listing and every other listing here is cards.
   *
   * It shipped as a bare <ul> whose .cat span was styled by NOTHING: the
   * only rule naming that class is .grid .cat, so outside a grid the game's
   * name rendered as full-size body text run on after the headline, and the
   * whole page was two bullet lines on an empty screen (browser, 2026-09-22).
   * A category page listing 25 games and this page listing 3 guides are the
   * same kind of page and now look it.
   *
   * .grid wide rather than a new block: the tiles carry a HEADLINE rather
   * than a game's name, so they need ~17rem to sit on two lines instead of
   * 9.5rem, and that is the only thing that differs. The emoji is the game's
   * own, so the tile is recognisable before the words are read.
   */
  const body = html`
    ${utilityRow(
      html`<nav class="bc">
        <a href="${href(homePath(locale), base)}">${site.home}</a> › ${chrome.indexH1}
      </nav>`,
    )}
    <h1>${chrome.indexH1}</h1>
    <p class="lede">${chrome.indexLede}</p>

    <ul class="grid wide">
      ${guides.map(
        (g) => html`<li>
          <a href="${href(guidePath(g.slug, g.locale), base)}">
            <span class="em" aria-hidden="true">${metaFor(g.game)?.emoji ?? ""}</span>
            <span>${g.copy.h1}<span class="cat">${gameName(g.game, g.locale)}</span></span>
          </a>
        </li>`,
      )}
    </ul>

    <p><a href="${href(homePath(locale), base)}">${site.chrome.back}</a></p>
  `;

  return renderDocument({
    locale,
    title: chrome.indexTitle,
    description: chrome.indexDescription,
    path: guidesIndexPath(locale),
    // The languages that HAVE guides, derived. A language with none emits no
    // index page at all, so it cannot appear here as a sibling that 404s.
    alternates: GUIDE_LOCALES.map((l) => ({ locale: l, path: guidesIndexPath(l) })),
    schema: guideIndexGraph(locale),
    body,
    base,
    indexable,
  });
}
