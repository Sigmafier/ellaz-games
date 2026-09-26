import { SITE } from "../content/site";
import type { ToyboxEntry } from "../content/toybox";
import { ART_HEIGHT, ART_WIDTH } from "./artFiles";
import { html } from "./html";
import { betaBadge, renderDocument, utilityRow } from "./layout";
import { homePath, href, toyboxPagePath, toyboxPlayPath } from "./routes";
import { toyboxGraph } from "./schema";
import { toyboxArtHref } from "./toyboxArt";

/**
 * One Toybox game, as a document: the only indexable page about it anywhere.
 *
 * A DOCUMENT, like a guide or a category page: same `renderDocument`, same
 * inline stylesheet, same footer, no `headAssets`. It boots nothing, so it
 * never enters the chunk graph and a first visit cannot be charged for it -
 * and it is emitted under `games/`, which the service worker's precache
 * already ignores.
 *
 * THE PLAY BUTTON LEAVES THIS SITE'S ROUTE TABLE. It goes to the Toybox page
 * that actually runs the game, which the deploy copies in after this build, so
 * nothing here can check it exists; `assert-pages.mjs` exempts `/toybox/` by
 * name and `assert-live.mjs` fetches it on the real site. It carries the base,
 * so it is `/ellaz/toybox/...` on the Pages mirror, and `?campaign=`, so it
 * opens the campaign rather than a bare versus match.
 *
 * THE PLAY BUTTON SITS HIGH, straight under the picture, and not at the foot of
 * the article the way a guide's does. A guide exists to answer a question and
 * then send the reader on; this page exists to send the reader on, and the
 * prose under the button is for whoever wants to know more first - and for the
 * crawler, which needs the words to rank the page at all.
 *
 * ONE hreflang entry, itself: the Toybox is English only, so this page has no
 * twin in any other language (see `src/content/toybox.ts`).
 */
export function toyboxPage(opts: { entry: ToyboxEntry; base: string; indexable: boolean }): string {
  const { entry, base, indexable } = opts;
  const locale = entry.locale;
  const c = entry.copy;
  const site = SITE[locale];
  const path = toyboxPagePath(entry.slug, locale);

  const play = html`<div class="cta">
    <a class="play" href="${href(toyboxPlayPath(entry.dir, entry.campaign), base)}">${c.playLabel}</a>
    <span class="note">${c.playNote}</span>
  </div>`;

  const body = html`
    ${utilityRow(
      html`<nav class="bc">
        <a href="${href(homePath(locale), base)}">${site.home}</a> › ${entry.name}
      </nav>`,
      { badge: betaBadge(site) },
    )}
    <h1>${c.h1}</h1>
    <p class="lede">${c.lede}</p>

    <img
      class="art"
      src="${toyboxArtHref(base, entry.id)}"
      alt="${c.artAlt}"
      width="${ART_WIDTH}"
      height="${ART_HEIGHT}"
      decoding="async"
    />
    <ul class="facts">
      ${c.facts.map((f) => html`<li>${f}</li>`)}
    </ul>

    ${play}

    ${c.body.map((p) => html`<p>${p}</p>`)}

    ${c.sections.map(
      (s) => html`<h2>${s.title}</h2>
        ${s.body.map((p) => html`<p>${p}</p>`)}`,
    )}

    <h2>${c.keyboardTitle}</h2>
    <ul class="steps">
      ${c.keyboard.map((k) => html`<li><strong>${k.keys}</strong>: ${k.does}</li>`)}
    </ul>

    <h2>${c.touch.title}</h2>
    ${c.touch.body.map((p) => html`<p>${p}</p>`)}

    <h2>${c.admissionTitle}</h2>
    <p>${c.admission}</p>

    <h2>${site.headings.faq}</h2>
    ${c.faq.map(
      (f) => html`<h3>${f.q}</h3>
        <p>${f.a}</p>`,
    )}

    ${play}
    <p><a href="${href("/toybox/", base)}">${c.shelfLabel}</a></p>
  `;

  return renderDocument({
    locale,
    title: c.metaTitle,
    description: c.metaDescription,
    path,
    alternates: [{ locale, path }],
    schema: toyboxGraph(entry),
    body,
    base,
    indexable,
  });
}
