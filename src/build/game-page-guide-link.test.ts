import { describe, it, expect } from "vitest";
import { gamePage } from "./gamePage";
import { CONTENT } from "../content/index";
import { GUIDES } from "../content/guides";
import { GAMES } from "../portal/games";
import { SITE } from "../content/site";
import { escapeHtml } from "./html";

/**
 * The two OPTIONAL per-page fields added for the Hebrew minesweeper page on
 * 2026-10-24: `guideLink` (an in-body link to one of the game's guides) and
 * `howToPlayHeading` (that page's own how-to heading). Both are absent from
 * every other page, so the cells below pin what they DO and that leaving them
 * out changes nothing.
 */
const meta = GAMES.find((g) => g.id === "minesweeper")!;
const he = CONTENT.minesweeper.copy.he;
const render = (copy = he) =>
  gamePage({ meta, copy, locale: "he", base: "/", all: GAMES, indexable: true });

describe("guideLink", () => {
  it("ends the named paragraph with a link whose text is the guide's own h1", () => {
    const page = render();
    const guide = GUIDES["minesweeper-no-guessing"];
    expect(page).toContain(
      `${escapeHtml(he.guideLink!.lead)} <a href="/he/guides/minesweeper-no-guessing/">${escapeHtml(guide.copy.h1)}</a>.</p>`,
    );
  });

  it("throws on a slug that is not a guide for this game in this language", () => {
    expect(() => render({ ...he, guideLink: { ...he.guideLink!, slug: "demineur-en-ligne" } })).toThrow(
      /not a he guide for this game/,
    );
    expect(() => render({ ...he, guideLink: { ...he.guideLink!, slug: "no-such-guide" } })).toThrow();
  });

  it("throws on a paragraph outside the body", () => {
    expect(() => render({ ...he, guideLink: { ...he.guideLink!, paragraph: he.body.length } })).toThrow(
      /outside the body/,
    );
  });

  it("adds no guide anchor to the article when the field is absent", () => {
    const { guideLink: _drop, ...plain } = he;
    const page = render(plain);
    const article = page.slice(page.indexOf(escapeHtml(he.body[0])), page.indexOf(escapeHtml(he.body.at(-1)!)));
    expect(article).not.toContain("/he/guides/minesweeper-no-guessing/");
  });
});

describe("howToPlayHeading", () => {
  it("replaces the site heading in the page AND the HowTo name, together", () => {
    const page = render();
    const own = escapeHtml(he.howToPlayHeading!);
    expect(page).toContain(`<h2>${own}</h2>`);
    expect(page).not.toContain(`<h2>${escapeHtml(SITE.he.headings.howToPlay)}</h2>`);
    expect(page).toContain(`"name":${JSON.stringify(he.howToPlayHeading)}`);
  });

  it("falls back to the site heading when the field is absent", () => {
    const { howToPlayHeading: _drop, ...plain } = he;
    const page = render(plain);
    expect(page).toContain(`<h2>${escapeHtml(SITE.he.headings.howToPlay)}</h2>`);
  });
});
