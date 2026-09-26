import type { Category, GameMeta } from "../sdk/types";
import { gameName } from "./gameName";
import type { FaqItem, GameCopy, Locale } from "../content/types";
import { ORIGIN, SITE } from "../content/site";
import {
  PAGED_CATEGORIES,
  ROUTES,
  canonicalUrl,
  categoryPath,
  gamePath,
  guidePath,
  guidesIndexPath,
  homePath,
  toyboxPagePath,
  toyboxPlayPath,
} from "./routes";
import { artPath } from "./artFiles";
import { ogImagePath } from "./ogCard";
import type { GuideEntry } from "../content/guides";
import { GUIDE_CHROME, guidesIn } from "../content/guides";
import type { ToyboxEntry } from "../content/toybox";
import { toyboxArtPath } from "./toyboxArt";

/**
 * The JSON-LD each page carries.
 *
 * Every value here is DERIVED - from `meta.ts`, from the route table, or from
 * prose the author already wrote for humans. Nothing in this file is a second
 * place to state a fact, which is the only way twenty-one pages of structured
 * data stay true to twenty-one games.
 *
 * On FAQPage: Google restricted FAQ rich results in 2023, so this is not a SERP
 * play. It stays because answer engines parse it cleanly, and because the
 * questions were written as real queries either way.
 */

/**
 * The one node that says WHO published this, and the only one with a stable id.
 *
 * Until 2026-08-11 the publisher was a bare `{name, url}` stub inlined twice per
 * page, with no `@id`, no `logo` and no `sameAs`. That is enough for a human and
 * not enough for a machine: an answer engine deciding whether two pages come
 * from the same publisher, or whether this publisher is the same entity as a
 * GitHub org, has nothing to join on. `@id` is that join, and `sameAs` is what
 * points it at an identity that already exists elsewhere.
 *
 * `logo` is `icon.svg` - the PWA icon, already published and already crawlable.
 * Google's logo guidance asks for a crawlable image of at least 112x112 that
 * reads correctly on a white background, in a format Google Images supports;
 * that list is "BMP, GIF, JPEG, PNG, WebP, SVG, and AVIF", so the SVG qualifies
 * and we do not have to invent a raster nobody else needs.
 *
 * There is deliberately no `aggregateRating` here and there must never be one.
 * We collect nothing about a player, so we have no ratings - and inventing them
 * is both fabrication and a structured-data policy violation.
 */
const ORG_ID = `${ORIGIN}/#org`;

const ORGANIZATION = {
  "@type": "Organization",
  "@id": ORG_ID,
  name: "Ellaz",
  url: `${ORIGIN}/`,
  logo: `${ORIGIN}/icon.svg`,
  description: SITE.en.tagline,
  // No sameAs: the repository it named went private on 2026-09-23 and
  // answers crawlers with a 404. A replacement costs first-visit bytes the
  // payload ceiling does not have (measured 2026-09-26: two profile URLs
  // put the first visit 1 B over), so it waits for a ceiling decision.
};

/**
 * What every `publisher` field carries: a reference, not a second copy.
 *
 * Restating the organisation inline is how two descriptions of one entity drift
 * apart - the same reason this file derives everything else instead of letting
 * an author type it. The full node ships once per graph, next to this reference.
 */
const PUBLISHER = { "@id": ORG_ID };

/** Schema genre terms per category. Derived from `meta.category`, never authored. */
const GENRE: Record<string, string[]> = {
  kids: ["Casual", "Educational"],
  learn: ["Educational", "Casual"],
  think: ["Puzzle", "Strategy"],
  speed: ["Action", "Casual"],
  create: ["Casual", "Creative"],
  classics: ["Puzzle", "Board Game"],
};

/** Derived from the declared age band, so a page cannot claim an age the catalog does not. */
function ageRange(meta: GameMeta): string {
  return meta.ageBand === "kids" ? "3-10" : "5-99";
}

function breadcrumb(locale: Locale, meta: GameMeta) {
  const site = SITE[locale];
  // The GROUP is the middle step whenever it has a page of its own, because
  // the visible breadcrumb says so and Google requires the markup to match
  // what a reader sees. Skipped for a group with no page: a `ListItem` whose
  // `item` is a URL this build never wrote is a broken node in the graph, and
  // an item with no `item` at all is worse than one step fewer.
  const items: unknown[] = [
    { "@type": "ListItem", position: 1, name: site.home, item: canonicalUrl(homePath(locale)) },
  ];
  if (PAGED_CATEGORIES.includes(meta.category))
    items.push({
      "@type": "ListItem",
      position: 2,
      name: site.categories[meta.category] ?? "",
      item: canonicalUrl(categoryPath(meta.category, locale)),
    });
  items.push({
    "@type": "ListItem",
    position: items.length + 1,
    name: gameName(meta.id, locale),
    item: canonicalUrl(gamePath(meta.id, locale)),
  });
  return { "@type": "BreadcrumbList", itemListElement: items };
}

export function gameGraph(meta: GameMeta, copy: GameCopy, locale: Locale) {
  const url = canonicalUrl(gamePath(meta.id, locale));
  // The two pictures of this game, both absolute and both crawlable.
  //
  // Until 2026-08-22 this node had no `image` at all - measured live, zero
  // across all 33 games in all four languages - so every image-bearing feature
  // was closed to us by omission rather than by choice.
  //
  // The art SVG FIRST, because it is the image actually embedded in the page,
  // and structured data claiming a picture the page does not show is a
  // different statement from the one we mean. The share card second: it is
  // 1200x630 RASTER, which is what any feature stating a pixel requirement can
  // measure without rendering a vector.
  //
  // The share card's URL is LOOKED UP in the route table rather than rebuilt
  // from `kind`, `id` and `locale`. Rebuilding it is the proxy trap that put
  // `kids` in 16 category pages' sitemap rows: a derived filename is correct
  // until the deriving fields stop discriminating, and then it is confidently
  // wrong. `ogImageFile` owns that name; this asks it.
  const ogRoute = ROUTES.find((r) => r.kind === "game" && r.id === meta.id && r.locale === locale);
  const image = [
    `${ORIGIN}${artPath(meta.id)}`,
    ...(ogRoute ? [`${ORIGIN}${ogImagePath(ogRoute)}`] : []),
  ];
  const graph: unknown[] = [
    {
      // CO-TYPED, and that is a correctness fix rather than a flourish. Measured
      // 2026-08-22 against Google's current rich-results gallery: `VideoGame` is
      // not a Search feature on its own, and Google's Software App page asks for
      // exactly this pairing to make a game eligible at all. We carried the half
      // that produces nothing for as long as this file has existed.
      //
      // It still produces nothing TODAY, and the reason is worth stating rather
      // than leaving as a mystery for the next reader: Software App requires
      // `name`, `offers.price`, and either `aggregateRating` or `review`. We
      // have the first two. We will never have the third, because we collect
      // nothing about a player - see the note on ORGANIZATION above. So the one
      // image-bearing rich result a game can qualify for is closed to us by a
      // decision we would make again, and the picture beside a result has to
      // come from the page itself. It now does.
      "@type": ["VideoGame", "SoftwareApplication"],
      "@id": `${url}#game`,
      name: gameName(meta.id, locale),
      url,
      image,
      description: copy.lede,
      inLanguage: locale,
      gamePlatform: ["Web Browser", "Mobile", "Tablet", "Desktop"],
      playMode: "SinglePlayer",
      applicationCategory: "GameApplication",
      operatingSystem: "Any",
      isAccessibleForFree: true,
      isFamilyFriendly: true,
      typicalAgeRange: ageRange(meta),
      genre: GENRE[meta.category] ?? ["Casual"],
      offers: {
        "@type": "Offer",
        price: "0",
        priceCurrency: "ILS",
        availability: "https://schema.org/InStock",
      },
      publisher: PUBLISHER,
    },
    breadcrumb(locale, meta),
    {
      "@type": "HowTo",
      name: SITE[locale].headings.howToPlay,
      inLanguage: locale,
      step: copy.howToPlay.map((s, i) => ({
        "@type": "HowToStep",
        position: i + 1,
        name: s.title,
        text: s.body,
      })),
    },
    {
      "@type": "FAQPage",
      inLanguage: locale,
      mainEntity: copy.faq.map((f) => ({
        "@type": "Question",
        name: f.q,
        acceptedAnswer: { "@type": "Answer", text: f.a },
      })),
    },
    // Last, so the game stays the first node in the graph - but present, because
    // a `publisher: {"@id": ...}` pointing at a node no parser can find in the
    // same document is a dangling reference, which is worse than the inline stub
    // it replaced.
    ORGANIZATION,
  ];
  return { "@context": "https://schema.org", "@graph": graph };
}

export function homeGraph(
  locale: Locale,
  games: ReadonlyArray<GameMeta>,
  copy: { title: string; description: string },
) {
  const url = canonicalUrl(homePath(locale));
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebSite",
        "@id": `${ORIGIN}/#website`,
        name: "Ellaz",
        url: `${ORIGIN}/`,
        description: copy.description,
        inLanguage: locale,
        publisher: PUBLISHER,
      },
      {
        "@type": "ItemList",
        name: copy.title,
        numberOfItems: games.length,
        itemListElement: games.map((meta, i) => ({
          "@type": "ListItem",
          position: i + 1,
          name: gameName(meta.id, locale),
          url: canonicalUrl(gamePath(meta.id, locale)),
        })),
      },
      {
        "@type": "CollectionPage",
        "@id": `${url}#page`,
        url,
        name: copy.title,
        inLanguage: locale,
      },
      ORGANIZATION,
    ],
  };
}

/**
 * A category page: a CollectionPage whose ItemList is the games in the group,
 * plus the FAQ, plus a two-step breadcrumb.
 *
 * Every value comes from the roster or from the copy record - nothing here
 * restates a fact a page could get wrong. `numberOfItems` in particular is
 * `games.length` rather than a number an author typed, which is the same rule
 * that took the roster count off the home page's meta description after it
 * spent a day contradicting the ItemList on its own document.
 */
export function categoryGraph(
  category: Category,
  locale: Locale,
  games: ReadonlyArray<GameMeta>,
  copy: { metaTitle: string; metaDescription: string; h1: string; faq: FaqItem[] },
) {
  const site = SITE[locale];
  const url = canonicalUrl(categoryPath(category, locale));
  const graph: unknown[] = [
    {
      "@type": "CollectionPage",
      "@id": `${url}#page`,
      url,
      name: copy.metaTitle,
      description: copy.metaDescription,
      inLanguage: locale,
      isPartOf: { "@id": `${ORIGIN}/#website` },
      publisher: PUBLISHER,
    },
    {
      "@type": "ItemList",
      name: copy.h1,
      numberOfItems: games.length,
      itemListElement: games.map((meta, i) => ({
        "@type": "ListItem",
        position: i + 1,
        name: gameName(meta.id, locale),
        url: canonicalUrl(gamePath(meta.id, locale)),
      })),
    },
    {
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: site.home, item: canonicalUrl(homePath(locale)) },
        { "@type": "ListItem", position: 2, name: copy.h1, item: url },
      ],
    },
  ];
  if (copy.faq.length)
    graph.push({
      "@type": "FAQPage",
      mainEntity: copy.faq.map((f) => ({
        "@type": "Question",
        name: f.q,
        acceptedAnswer: { "@type": "Answer", text: f.a },
      })),
    });
  graph.push(ORGANIZATION);
  return { "@context": "https://schema.org", "@graph": graph };
}

export function worldGraph(locale: Locale, copy: { title: string; description: string }) {
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebPage",
        name: copy.title,
        description: copy.description,
        inLanguage: locale,
        isPartOf: { "@id": `${ORIGIN}/#website` },
        publisher: PUBLISHER,
      },
      // `isPartOf` above stays a deliberate cross-document reference - the
      // `WebSite` node lives on the two home pages and there is no reason to
      // restate it here. The organisation is different: it is what an answer
      // engine attributes a quote to, so every page carries it in full.
      ORGANIZATION,
    ],
  };
}

/**
 * A guide: an `Article`, its breadcrumb, and its FAQ.
 *
 * `Article` rather than `WebPage`, and that is the one decision worth stating.
 * A guide is a piece of writing ABOUT something, with a publisher, a headline
 * and a body - which is the shape an answer engine reads when it decides
 * whether a page is worth quoting. A `CollectionPage` would describe the index
 * above it and say nothing about this.
 *
 * There is no `author` node and there must not be one. We would have to invent
 * a person, and a fabricated byline is worse than none: the publisher IS the
 * author here and `ORGANIZATION` already says so.
 *
 * NO `datePublished`. The guides are not dated on purpose - a dateless guide
 * reads evergreen and a stale date reads abandoned - so claiming one in the
 * markup while the page shows none would be structured data disagreeing with
 * the page, which is the one thing this file exists to prevent.
 */
export function guideGraph(guide: GuideEntry, locale: Locale) {
  const c = guide.copy;
  const url = canonicalUrl(guidePath(guide.slug, locale));
  const site = SITE[locale];
  const chrome = GUIDE_CHROME[locale];
  const gameUrl = canonicalUrl(gamePath(guide.game, locale));
  const ogRoute = ROUTES.find(
    (r) => r.kind === "guide" && r.id === guide.slug && r.locale === locale,
  );
  const graph: unknown[] = [
    {
      "@type": "Article",
      "@id": `${url}#article`,
      url,
      headline: c.h1,
      description: c.metaDescription,
      inLanguage: locale,
      // The share card. Looked up in the route table rather than rebuilt from
      // kind, id and locale - a derived filename is correct right up until the
      // deriving fields stop discriminating.
      ...(ogRoute ? { image: [`${ORIGIN}${ogImagePath(ogRoute)}`] } : {}),
      isPartOf: { "@id": `${ORIGIN}/#website` },
      publisher: PUBLISHER,
      // What this article is ABOUT, as the game's own node on its own page.
      // It is what makes the guide and the game page one subject to a reader
      // that joins on `@id`, and it is the machine half of the link down.
      about: { "@id": `${gameUrl}#game` },
      mentions: { "@id": `${gameUrl}#game` },
      // The sources, as the article's own citations. `citation` is the field
      // an answer engine reads to decide whether a claim has anything behind
      // it, and it is half the reason the `sources` field is required.
      citation: c.sources.map((src) => ({
        "@type": "CreativeWork",
        name: src.label,
        url: src.url,
      })),
    },
    {
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: site.home, item: canonicalUrl(homePath(locale)) },
        {
          "@type": "ListItem",
          position: 2,
          name: chrome.guides,
          item: canonicalUrl(guidesIndexPath(locale)),
        },
        { "@type": "ListItem", position: 3, name: c.h1, item: url },
      ],
    },
  ];
  if (c.faq.length)
    graph.push({
      "@type": "FAQPage",
      inLanguage: locale,
      mainEntity: c.faq.map((f) => ({
        "@type": "Question",
        name: f.q,
        acceptedAnswer: { "@type": "Answer", text: f.a },
      })),
    });
  graph.push(ORGANIZATION);
  return { "@context": "https://schema.org", "@graph": graph };
}

/**
 * The guides index: a `CollectionPage` whose `ItemList` is the guides in this
 * language, plus a two-step breadcrumb.
 *
 * `guidesIn` rather than a list built here, for the same reason `categoryGraph`
 * takes the games it is handed: the count in the copy, the ItemList in the
 * markup and the tiles on the page must come from one answer to "which guides
 * are in this language".
 */
export function guideIndexGraph(locale: Locale) {
  const chrome = GUIDE_CHROME[locale];
  const site = SITE[locale];
  const url = canonicalUrl(guidesIndexPath(locale));
  const guides = guidesIn(locale);
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "CollectionPage",
        "@id": `${url}#page`,
        url,
        name: chrome.indexTitle,
        description: chrome.indexDescription,
        inLanguage: locale,
        isPartOf: { "@id": `${ORIGIN}/#website` },
        publisher: PUBLISHER,
      },
      {
        "@type": "ItemList",
        name: chrome.indexH1,
        numberOfItems: guides.length,
        itemListElement: guides.map((g, i) => ({
          "@type": "ListItem",
          position: i + 1,
          name: g.copy.h1,
          url: canonicalUrl(guidePath(g.slug, g.locale)),
        })),
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          {
            "@type": "ListItem",
            position: 1,
            name: site.home,
            item: canonicalUrl(homePath(locale)),
          },
          { "@type": "ListItem", position: 2, name: chrome.indexH1, item: url },
        ],
      },
      ORGANIZATION,
    ],
  };
}

/**
 * A Toybox game's page: the game node, its breadcrumb, and its FAQ.
 *
 * THE SAME CO-TYPED NODE `gameGraph` emits - `VideoGame` alone is not a Search
 * feature, and `assert-pages.mjs` refuses one without `SoftwareApplication`
 * beside it - and the same two pictures in the same order: the image the page
 * embeds first, the 1200x630 share card second.
 *
 * WHAT IS DIFFERENT, and why:
 *
 *   - `typicalAgeRange` is "13-", read as thirteen and up. The Brawl is not a
 *     children's game and must not be described as one; `gameGraph` derives
 *     the range from a roster game's `ageBand`, which a Toybox game has none of.
 *   - no `isFamilyFriendly`. A roster game states it; this is a fighting game
 *     with cartoon toys in it, and saying nothing is more honest than either
 *     answer.
 *   - `url` is THIS page, and the place it is played is a `PlayAction` target -
 *     the Toybox page is noindex, so it is not the URL this node should earn.
 *   - `playMode` SinglePlayer and `offers` at 0, like every game here.
 */
export function toyboxGraph(entry: ToyboxEntry) {
  const c = entry.copy;
  const locale = entry.locale;
  const site = SITE[locale];
  const url = canonicalUrl(toyboxPagePath(entry.slug, locale));
  const ogRoute = ROUTES.find(
    (r) => r.kind === "toybox" && r.id === entry.id && r.locale === locale,
  );
  const graph: unknown[] = [
    {
      "@type": ["VideoGame", "SoftwareApplication"],
      "@id": `${url}#game`,
      name: entry.name,
      url,
      image: [
        `${ORIGIN}${toyboxArtPath(entry.id)}`,
        ...(ogRoute ? [`${ORIGIN}${ogImagePath(ogRoute)}`] : []),
      ],
      description: c.lede,
      inLanguage: locale,
      gamePlatform: ["Web Browser", "Mobile", "Tablet", "Desktop"],
      playMode: "SinglePlayer",
      applicationCategory: "GameApplication",
      operatingSystem: "Any",
      isAccessibleForFree: true,
      typicalAgeRange: "13-",
      genre: ["Action", "Beat 'em up"],
      offers: {
        "@type": "Offer",
        price: "0",
        priceCurrency: "ILS",
        availability: "https://schema.org/InStock",
      },
      potentialAction: {
        "@type": "PlayAction",
        target: `${ORIGIN}${toyboxPlayPath(entry.dir, entry.campaign)}`,
      },
      publisher: PUBLISHER,
    },
    {
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: site.home, item: canonicalUrl(homePath(locale)) },
        { "@type": "ListItem", position: 2, name: entry.name, item: url },
      ],
    },
  ];
  if (c.faq.length)
    graph.push({
      "@type": "FAQPage",
      inLanguage: locale,
      mainEntity: c.faq.map((f) => ({
        "@type": "Question",
        name: f.q,
        acceptedAnswer: { "@type": "Answer", text: f.a },
      })),
    });
  graph.push(ORGANIZATION);
  return { "@context": "https://schema.org", "@graph": graph };
}
