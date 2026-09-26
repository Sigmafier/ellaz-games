import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

/**
 * `label-content-name-mismatch`: AN ACCESSIBLE NAME MUST CONTAIN THE WORDS THE
 * EYE CAN READ.
 *
 * A voice-control user says what they see. If a card's visible text is "My world
 * / Play to earn coins / Enter" and its `aria-label` says only "My world", none
 * of the three phrases they can say will activate it - and a screen reader loses
 * the coin count too, because an `aria-label` REPLACES the contents rather than
 * adding to them.
 *
 * Measured on the built home screen, 2026-09-07, with a probe faithful to axe
 * (name lowercased, visible text stripped of emoji and punctuation, `aria-hidden`
 * subtrees skipped): four failures before, one after. The survivor is
 * Tic-Tac-Toe, whose name contains the visible words in order and differs only
 * because axe strips the hyphens.
 *
 * WHY A SOURCE SCAN AND NOT A RENDER. The rendered check is the real one and it
 * lives in `scripts/repro/`; this is the cheap ratchet that reds in `npm test`
 * when somebody reaches for `aria-label` on these three components again. It
 * pins the DECISION, not the behaviour, and says so.
 */
const HOME = readFileSync(resolve(new URL(".", import.meta.url).pathname, "Home.tsx"), "utf8");

/**
 * The body of one `function <name>(` declaration, brace-balanced.
 *
 * The FIRST `{` after the name is not the body - every one of these components
 * destructures its props and annotates them, so the signature is
 * `function GameCard({ entry, ... }: { entry: CatalogEntry; ... }) {` and two
 * object braces come first. Walking the PARENS to depth zero finds the real one;
 * the first version of this took `indexOf("{")` and read 17 characters, which is
 * why every assertion below is preceded by a length check.
 */
function bodyOf(name: string): string {
  const at = HOME.indexOf(`function ${name}(`);
  expect(at, `${name} is gone from Home.tsx - this test is measuring nothing`).toBeGreaterThan(-1);
  let parens = 0;
  let i = HOME.indexOf("(", at);
  for (; i < HOME.length; i++) {
    if (HOME[i] === "(") parens++;
    else if (HOME[i] === ")" && --parens === 0) break;
  }
  const open = HOME.indexOf("{", i);
  let depth = 0;
  for (let i = open; i < HOME.length; i++) {
    if (HOME[i] === "{") depth++;
    else if (HOME[i] === "}" && --depth === 0) return HOME.slice(open, i + 1);
  }
  throw new Error(`unbalanced braces reading ${name}`);
}

describe("an accessible name contains the visible text", () => {
  // Both cards render several visible phrases - a title, a stat line, a pill -
  // and no single-phrase label can contain all of them. Named from contents,
  // the name is the visible text by construction and cannot drift from it.
  it.each(["WorldHero", "DailyCard"])("%s is named from its own contents", (fn) => {
    const body = bodyOf(fn);
    expect(body.length, `${fn} read as empty`).toBeGreaterThan(200);
    expect(
      body.includes("aria-label={"),
      `${fn} sets an aria-label again. It REPLACES the card's own text, so the ` +
        `coin count / the Play pill stop being announced and the visible words ` +
        `stop working for voice control. Put extra state in visible text instead.`,
    ).toBe(false);
  });

  // Named from its own contents since the stars badge left it (2026-09-23):
  // the beta pill, then the title, both visible. The FAVOURITE star beside the
  // link is a separate control and carries the only aria-label in the card.
  it("a game card is named from its contents, with the beta word first", () => {
    const body = bodyOf("GameCard");
    expect(body.length, "GameCard read as empty").toBeGreaterThan(200);
    expect(
      body.includes("aria-label={"),
      "GameCard sets an aria-label again. It REPLACES the visible 'Beta' and title",
    ).toBe(false);
    const pill = body.indexOf("<BetaPill");
    const title = body.indexOf("{textFor(meta.title, locale)}");
    expect(pill, "GameCard no longer draws the beta pill").toBeGreaterThan(-1);
    expect(title, "GameCard no longer draws its title").toBeGreaterThan(pill);
    // and the badge draws from the one function, so the word cannot drift
    expect(bodyOf("BetaPill").includes("betaWord(locale)")).toBe(true);
  });

  it("the favourite star is a named toggle", () => {
    const body = bodyOf("FavoriteStar");
    expect(body.includes("aria-label={label}")).toBe(true);
    expect(body.includes("aria-pressed={on}")).toBe(true);
  });
});
