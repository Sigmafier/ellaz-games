import type { Category } from "../sdk/types";
import type { Locale } from "../content/types";
import { SITE } from "../content/site";
import { categoryCopy } from "../content/categories";
import { GUIDE_CHROME, guidesIn, type GuideEntry } from "../content/guides";
import { ART_HEIGHT, ART_WIDTH, artHref } from "./artFiles";
import { gameName } from "./gameName";
import { html, type RawHtml } from "./html";
import { renderDocument, utilityRow } from "./layout";
import { guideGraph } from "./schema";
import { GAMES, metaFor } from "../portal/games";
import {
  PAGED_CATEGORIES,
  categoryPath,
  gamePath,
  guidePath,
  guidesIndexPath,
  homePath,
  href,
} from "./routes";

/**
 * The shelf this guide's game sits on, as a link, or nothing.
 *
 * A guide is the thinnest indexable page on this site by inbound links - 2 or
 * 3, against a game page's median of 11 and a category page's 17 (census over
 * 267 emitted documents, 2026-09-22). Half of that is unavoidable: there are
 * three guides, so there are at most two siblings to link from. The other half
 * is that a guide pointed at exactly one page, its game, and nowhere else.
 *
 * This is the outbound half of the fix; `categoryPage` in `sitePages.ts`
 * carries the inbound half. It is the same argument `categoryCrumb` makes in
 * `gamePage.ts`: the category page is where a reader who has finished one
 * article expects to find the rest of that shelf, and the link costs an
 * emitted document nothing.
 *
 * Nothing rather than plain text when the group has no page - unlike a
 * breadcrumb, this line is not carrying a word the reader needs, so an
 * unlinked category name here would be a sentence fragment. `create` holds one
 * game today and emits no page, and a link to a page the build did not write
 * is the internal 404 `assert-pages.mjs` fails on.
 */
function categoryLink(category: string, locale: Locale, base: string): RawHtml {
  const cat = category as Category;
  if (!PAGED_CATEGORIES.includes(cat)) return html``;
  const count = GAMES.filter((m) => m.category === cat).length;
  return html`<p>
    <a href="${href(categoryPath(cat, locale), base)}">${categoryCopy(locale, cat, count).h1}</a>
  </p>`;
}

/**
 * One guide, as a document.
 *
 * ARCHITECTURALLY A CATEGORY PAGE WITH A DIFFERENT SUBJECT: same
 * `renderDocument`, same inline stylesheet, same footer, and no `headAssets`,
 * no `preloads`, no `headerChrome`. It boots nothing, so it never enters the
 * chunk graph at all and a first visit cannot be charged for it.
 *
 * WHAT IS DERIVED HERE rather than authored, and this is the whole reason the
 * renderer is not just the prose:
 *
 *   - the game's NAME, from `gameName` - so a guide cannot call a game
 *     something the roster does not
 *   - the link down into the game, from `gamePath` - so it cannot be a 404
 *   - the sibling guides, from the registry - so a new article joins every
 *     older one's "more guides" list with no edit anywhere
 *
 * A guide has ONE hreflang sibling, itself, and `renderDocument` builds that
 * cluster from the `alternates` below. The one-entry list is the entire
 * single-language design; see `GuideEntry.locale`.
 */
export function guidePage(opts: { guide: GuideEntry; base: string; indexable: boolean }): string {
  const { guide, base, indexable } = opts;
  const locale = guide.locale;
  const c = guide.copy;
  const site = SITE[locale];
  const chrome = GUIDE_CHROME[locale];
  const meta = metaFor(guide.game);
  if (!meta) {
    // A guide whose game left the roster would link to a 404 and preview with
    // no picture. `guides.test.ts` catches it at test time; this catches a
    // build where the roster was cut (`assert-slope.mjs` builds such an arm).
    throw new Error(
      `guide "${guide.slug}" is about "${guide.game}", which is not on the roster. ` +
        `A guide cannot outlive its game - delete the guide, or put the game back.`,
    );
  }
  const siblings = guidesIn(locale).filter((g) => g.slug !== guide.slug);

  /**
   * THE GAME'S OWN PICTURE, borrowed rather than drawn.
   *
   * A guide is 700 to 1,400 words of prose and it was shipping without a
   * single image: 3,231px of unbroken text on the Hebrew minesweeper guide,
   * measured in a browser 2026-09-22. Every other document kind here carries
   * a picture directly under the lede, and the reason is not decoration -
   * Google chooses the thumbnail beside a text result from images embedded
   * ON the page, so a page with none can never have one (see gamePage.ts,
   * where this same block is emitted for the same reason).
   *
   * Same file the game page names, so it costs this page no new bytes on the
   * wire beyond the tag: a reader arriving from the guide and clicking
   * through has it cached. width/height are the SVG's declared box, so the
   * space is reserved from the attributes and nothing shifts.
   */
  /**
   * THE CONVERSION, as the button the rest of the site uses.
   *
   * This was gameCards([meta]) - the 9.5rem tile a category page draws 25
   * of - and a grid of ONE tile, stranded in a 44rem column, is the weakest
   * moment on a page whose entire job is to turn somebody asking a question
   * into somebody playing. The .play button is the idiom every game page
   * and every print pack already uses for exactly this step.
   *
   * c.playLabel is why this is not a cosmetic change. It is a REQUIRED
   * field on GuideCopy, authored in all three guides ("Play Minesweeper",
   * "Jouer au labyrinthe"), and nothing rendered it - printPage.ts was the
   * only reader of a field of that name. An armed lever with no caller.
   */
  const body = html`
    ${utilityRow(
      html`<nav class="bc">
        <a href="${href(homePath(locale), base)}">${site.home}</a> ›
        <a href="${href(guidesIndexPath(locale), base)}">${chrome.guides}</a> › ${c.h1}
      </nav>`,
    )}
    <h1>${c.h1}</h1>
    <p class="lede">${c.lede}</p>

    <img
      class="art"
      src="${artHref(base, meta.id)}"
      alt="${site.artAlt.replace("{title}", gameName(meta.id, locale))}"
      width="${ART_WIDTH}"
      height="${ART_HEIGHT}"
      decoding="async"
    />
    <ul class="facts">
      ${site.facts.map((f) => html`<li>${f}</li>`)}
    </ul>

    ${c.body.map((p) => html`<p>${p}</p>`)}

    ${c.sections.map(
      (s) => html`<h2>${s.title}</h2>
        ${s.body.map((p) => html`<p>${p}</p>`)}`,
    )}

    <h2>${chrome.admission}</h2>
    <p>${c.admission}</p>

    <h2>${site.headings.faq}</h2>
    ${c.faq.map(
      (f) => html`<h3>${f.q}</h3>
        <p>${f.a}</p>`,
    )}

    <h2>${chrome.play}</h2>
    <div class="cta">
      <a class="play" href="${href(gamePath(meta.id, locale), base)}">${c.playLabel}</a>
      <span class="note">${site.playNote}</span>
    </div>
    ${categoryLink(meta.category, locale, base)}

    <h2>${chrome.sources}</h2>
    <ul>
      ${c.sources.map(
        (s) =>
          html`<li><a href="${s.url}" rel="noopener">${s.label}</a></li>`,
      )}
    </ul>

    ${siblings.length
      ? html`<h2>${chrome.more}</h2>
          <ul>
            ${siblings.map(
              (g) =>
                html`<li>
                  <a href="${href(guidePath(g.slug, g.locale), base)}">${g.copy.h1}</a>
                </li>`,
            )}
          </ul>`
      : html``}
    <p><a href="${href(guidesIndexPath(locale), base)}">${chrome.indexH1}</a></p>
  `;

  return renderDocument({
    locale,
    title: c.metaTitle,
    description: c.metaDescription,
    path: guidePath(guide.slug, locale),
    // ONE ENTRY, ITSELF. A guide exists in the language its query was typed in
    // and in no other, so its hreflang cluster is a single self-alternate -
    // the same shape a print pack declares, and the reason the route carries
    // `locales: [locale]` for the gate to read.
    alternates: [{ locale, path: guidePath(guide.slug, locale) }],
    schema: guideGraph(guide, locale),
    body,
    base,
    indexable,
  });
}
