import { describe, it, expect } from "vitest";
import { existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { GUIDE_CHROME, GUIDE_LIST, GUIDE_LOCALES, GUIDES, guidesIn, type GuideEntry } from "./guides";
import { analyseProse, violations } from "./voice";
import { FULL_CATALOG } from "../testing/fullCatalog";
import { PAGE_LOCALES } from "../i18n/locales";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..", "..");

/**
 * Every authored string on a guide, in reading order.
 *
 * Section TITLES are deliberately out. A heading is short by definition, so
 * counting one as a paragraph would flatten the length spread that is the
 * whole point of the measurement - the same reason `proseOf` in `voice.ts`
 * reads a game page's `Titled.body` and not its `Titled.title`.
 */
export function guideProse(g: GuideEntry): string[] {
  const c = g.copy;
  return [
    c.lede,
    ...c.body,
    ...c.sections.flatMap((s) => s.body),
    c.admission,
    ...c.faq.flatMap((f) => [f.q, f.a]),
  ];
}

/**
 * The paragraphs the SPREAD is measured over: the article's own body plus
 * every section's paragraphs. Not the lede, which is written to a length on
 * purpose, and not the FAQ, whose answers are short by design.
 */
export function guideBody(g: GuideEntry): string[] {
  return [...g.copy.body, ...g.copy.sections.flatMap((s) => s.body)];
}

describe("the guide registry", () => {
  it("scanned something", () => {
    // Zero guides satisfies every assertion below forever.
    expect(GUIDE_LIST.length).toBeGreaterThan(0);
  });

  it("the key and the slug agree", () => {
    const wrong = Object.entries(GUIDES).filter(([key, g]) => key !== g.slug);
    expect(
      wrong.map(([key, g]) => `${key} holds a guide whose slug is ${g.slug}`),
      "a registry whose key can disagree with its own row emits a page at one URL and links to it at another",
    ).toEqual([]);
  });

  it("every guide names a game the roster has", () => {
    const known = new Set(FULL_CATALOG.map((e) => e.meta.id));
    const orphans = GUIDE_LIST.filter((g) => !known.has(g.game)).map((g) => `${g.slug} -> ${g.game}`);
    expect(orphans, `guides about a game that is not on the roster: ${orphans.join(", ")}`).toEqual(
      [],
    );
  });

  it("every guide is written in a language that has pages", () => {
    const bad = GUIDE_LIST.filter((g) => !PAGE_LOCALES.includes(g.locale)).map(
      (g) => `${g.slug} is ${g.locale}`,
    );
    expect(bad).toEqual([]);
  });

  it("GUIDE_LOCALES is derived from the guides, not listed", () => {
    // The index page exists for a language iff that language has a guide. A
    // hand-kept list here is a second copy of the registry, and the failure
    // would be an index page listing nothing or a guide with no index above it.
    for (const l of PAGE_LOCALES) {
      expect(GUIDE_LOCALES.includes(l), `${l}: ${guidesIn(l).length} guides`).toBe(
        guidesIn(l).length > 0,
      );
    }
    expect(GUIDE_LOCALES.length).toBeGreaterThan(0);
  });

  it("every language has its chrome, guides or no guides", () => {
    // `Record<PageLocale, GuideChrome>` already refuses a missing language at
    // compile time. This catches the other half: an entry that exists and is
    // empty, which type-checks and renders a page with blank headings.
    for (const l of PAGE_LOCALES) {
      const c = GUIDE_CHROME[l];
      for (const [field, value] of Object.entries(c)) {
        expect(value.trim().length, `GUIDE_CHROME.${l}.${field} is empty`).toBeGreaterThan(1);
      }
    }
  });
});

describe("every statistic names a script that exists", () => {
  it.each(GUIDE_LIST.map((g) => [g.slug, g] as const))("%s", (_slug, g) => {
    expect(g.provenance.length, "a guide with no derived number is a guide with nothing only it has")
      .toBeGreaterThan(0);
    for (const p of g.provenance) {
      expect(existsSync(join(ROOT, p.source)), `${p.source} does not exist (claim: ${p.claim})`).toBe(
        true,
      );
    }
  });
});

describe("the voice gate, on every guide", () => {
  it.each(GUIDE_LIST.map((g) => [g.slug, g] as const))("%s reads like a person", (slug, g) => {
    const report = analyseProse(guideBody(g), guideProse(g), g.locale);
    const failures = violations(report);
    expect(
      failures,
      `${slug} (${g.locale}) fails the voice gate:\n  ${failures.join("\n  ")}\n\n` +
        `measured: ${JSON.stringify(report, null, 2)}`,
    ).toEqual([]);
  });
});

describe("the meta fields fit where they are shown", () => {
  it.each(GUIDE_LIST.map((g) => [g.slug, g] as const))("%s", (_slug, g) => {
    const c = g.copy;
    expect(c.metaTitle.length, `metaTitle: ${c.metaTitle}`).toBeLessThanOrEqual(60);
    expect(c.metaDescription.length, `metaDescription: ${c.metaDescription}`).toBeGreaterThanOrEqual(
      50,
    );
    expect(c.metaDescription.length, `metaDescription: ${c.metaDescription}`).toBeLessThanOrEqual(
      160,
    );
    // The card draws this at one size and cannot wrap it. Measured rather than
    // hoped: the longest title that fits the 1200x630 bar is about 30 chars.
    expect(c.cardTitle.length, `cardTitle: ${c.cardTitle}`).toBeLessThanOrEqual(30);
    expect(c.faq.length, "a guide with no FAQ answers no query the way it was typed")
      .toBeGreaterThanOrEqual(3);
    expect(c.sources.length, "the citation is half the GEO lever").toBeGreaterThan(0);
    for (const s of c.sources) {
      expect(s.url.startsWith("https://"), `${s.label}: ${s.url}`).toBe(true);
    }
  });
});

describe("the guide gate can actually fail - positive controls", () => {
  const real = GUIDE_LIST[0];

  /** A guide built out of `real`, with one thing changed. */
  const planted = (patch: Partial<GuideEntry["copy"]>): GuideEntry => ({
    ...real,
    copy: { ...real.copy, ...patch },
  });

  it("evenly-sized paragraphs are refused", () => {
    // The tell the spread measurement exists for: 57, 53, 50, 56, 54 words.
    // It is a real draft's real measurement, from the audit that started this
    // whole lane, rather than a shape invented to fail.
    const even = [60, 58, 62, 59, 61].map((n) => Array(n).fill("מילה").join(" "));
    const g = planted({ body: even, sections: [] });
    const failures = violations(analyseProse(guideBody(g), guideProse(g), g.locale));
    expect(failures.join(" ")).toMatch(/spread/);
  });

  it("a guide with no derived number is refused", () => {
    const g = planted({
      body: real.copy.body.map((p) => p.replace(/[\d.,]+/g, "")),
      sections: real.copy.sections.map((s) => ({
        ...s,
        body: s.body.map((p) => p.replace(/[\d.,]+/g, "")),
      })),
      lede: real.copy.lede.replace(/[\d.,]+/g, ""),
      faq: real.copy.faq.map((f) => ({ q: f.q, a: f.a.replace(/[\d.,]+/g, "") })),
      admission: real.copy.admission.replace(/[\d.,]+/g, ""),
    });
    const failures = violations(analyseProse(guideBody(g), guideProse(g), g.locale));
    expect(failures.join(" ")).toMatch(/digit-bearing/);
  });

  it("a thin guide is refused", () => {
    const g = planted({ sections: [], body: real.copy.body.slice(0, 1), faq: [] });
    const failures = violations(analyseProse(guideBody(g), guideProse(g), g.locale));
    expect(failures.join(" ")).toMatch(/words, want/);
  });

  it("an em dash is refused", () => {
    const g = planted({ admission: `${real.copy.admission} — and one more thing.` });
    const failures = violations(analyseProse(guideBody(g), guideProse(g), g.locale));
    expect(failures.join(" ")).toMatch(/dash/);
  });

  it("the real guides pass the same three checks - negative control", () => {
    // Without this, every assertion above is satisfied by a `violations` that
    // returns a complaint for absolutely everything.
    for (const g of GUIDE_LIST) {
      expect(violations(analyseProse(guideBody(g), guideProse(g), g.locale)), g.slug).toEqual([]);
    }
  });
});
