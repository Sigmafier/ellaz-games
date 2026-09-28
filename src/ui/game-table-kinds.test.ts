import { describe, expect, it } from "vitest";
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";

/**
 * EVERY BUTTON IS DRAWN FROM ITS KIND, AND A STYLE IS ONLY SETTINGS
 * (games-doctrine G8, operator ruling 2026-09-28: "we always generalize buttons
 * and make them modular so we can change them easily as we wish").
 *
 * The Game table's look is read only from its kinds' settings - `K("disc-size",
 * "64px")` in GameTable.tsx, which is `var(--disc-size,64px)` - so a theme or a
 * new style changes the table by setting `--disc-size` and nothing else. Three
 * things hold that, and each fails on its own:
 *
 *   1. No LITERAL look in the table's rules: a size, shape, tilt, fill, ink,
 *      edge, shadow or type written as a value is a value no style can reach.
 *   2. The settings are exactly this list, both ways: a setting the code reads
 *      that is not here is undocumented, one here the code never reads is dead.
 *   3. A theme sheet that sets a kind setting names a real one - `--disc-sise`
 *      would otherwise do nothing, silently, forever.
 */
const UI = new URL(".", import.meta.url).pathname;
const SRC = readFileSync(join(UI, "GameTable.tsx"), "utf8");

/** The kinds and their settings. A new setting is added HERE and in GameTable.tsx together. */
export const KIND_SETTINGS = [
  // the mat under the board
  "mat-fill", "mat-edge", "mat-radius", "mat-radius-pc",
  // the level disc, and the dots that say which level
  "disc-size", "disc-size-pc", "disc-radius", "disc-tilt", "disc-fill", "disc-ink", "disc-shadow", "disc-font", "disc-text-pc",
  "disc-dot", "disc-dot-on", "disc-dot-size", "disc-dot-radius", "disc-dots-text",
  // a number card
  "card-min", "card-min-pc", "card-radius", "card-fill", "card-ink", "card-label", "card-shadow", "card-tilt", "card-tilt-alt",
  "card-label-font", "card-value-font", "card-note-font",
  // an action token (restart, pause)
  "token-size", "token-size-pc", "token-radius", "token-fill", "token-ink", "token-shadow", "token-tilt", "token-tilt-alt",
  "token-icon", "token-icon-pc",
  // the tray, and the keys in it
  "tray-fill", "tray-edge", "tray-radius", "tray-radius-pc", "tray-key-fill", "tray-key-ink", "tray-key-radius", "tray-key-shadow",
];
const KIND_PREFIX = /^--(mat|disc|card|token|tray)-/;

/** The table's CSS, as written in the source - the template between `const CSS = \`` and the closing tick. */
function tableCss(src: string): string {
  const start = src.indexOf("const CSS = `");
  const end = src.indexOf("}`;", start);
  if (start < 0 || end < 0) throw new Error("GameTable.tsx: no `const CSS = `...`;` block - the test cannot read the table");
  return src.slice(start, end + 1);
}

/** Look declarations whose value is a literal rather than a kind setting. */
const LOOK = /(?:^|[;{\s])((?:min-)?width|height|border-radius|transform|background|color|box-shadow|font|font-size)\s*:\s*([^;}]*)/g;
const LAYOUT_KEYWORDS = /^(none|auto|100%|auto!important)$/;

/**
 * The source with every `${...}` folded to one word: `@K` for a kind setting,
 * `@V` for anything else. A setting's own `${` would otherwise be read as the
 * `{` that opens a rule - and the first version of this test did exactly that,
 * found by its planted control, passing the real file without reading it.
 */
export function foldInterpolations(src: string): string {
  let out = "";
  for (let i = 0; i < src.length; i++) {
    if (src[i] !== "$" || src[i + 1] !== "{") { out += src[i]; continue; }
    let depth = 0, j = i + 1;
    for (; j < src.length; j++) {
      if (src[j] === "{") depth++;
      else if (src[j] === "}" && --depth === 0) break;
    }
    if (j >= src.length) throw new Error(`unclosed \${ at ${i}`);
    out += src.slice(i + 2, i + 4) === "K(" ? "@K" : "@V";
    i = j;
  }
  return out;
}

function literalLooks(raw: string): string[] {
  const css = foldInterpolations(raw);
  const out: string[] = [];
  for (const rule of css.split("}")) {
    const [sel, body] = rule.split("{").slice(-2);
    if (body === undefined) continue;
    for (const m of body.matchAll(LOOK)) {
      const value = m[2].trim();
      if (/^(rotate\()?@K\)?(!important)?$/.test(value) || LAYOUT_KEYWORDS.test(value)) continue;
      out.push(`${sel.trim().slice(-40)} { ${m[1]}: ${value} }`);
    }
  }
  return out;
}

const readSettings = (src: string) => new Set([...src.matchAll(/K\("([a-z0-9-]+)"/g)].map((m) => m[1]));

describe("the Game table draws every piece from its kind's settings", () => {
  const css = tableCss(SRC);

  it("reads the real table, rule by rule", () => {
    expect(css.length).toBeGreaterThan(2000);
    const folded = foldInterpolations(css);
    expect(folded.match(/@K/g)?.length ?? 0).toBeGreaterThan(50);
    expect(folded).not.toContain("${");
    expect(css).toContain(".gt-disc");
    expect(readSettings(SRC).size).toBeGreaterThan(30);
  });

  it("has no literal size, shape, tilt, colour, shadow or type in its rules", () => {
    expect(literalLooks(css)).toEqual([]);
  });

  it("reads exactly the documented settings, both ways", () => {
    const used = [...readSettings(SRC)].sort();
    expect(used).toEqual([...KIND_SETTINGS].sort());
  });

  it("a theme sheet sets only settings that exist", () => {
    const dir = join(UI, "themes");
    const sheets = readdirSync(dir).filter((f) => f.endsWith(".css"));
    expect(sheets.length).toBeGreaterThanOrEqual(4);
    const wrong: string[] = [];
    for (const f of sheets)
      for (const m of readFileSync(join(dir, f), "utf8").matchAll(/(--[a-z0-9-]+)\s*:/g))
        if (KIND_PREFIX.test(m[1]) && !KIND_SETTINGS.includes(m[1].slice(2))) wrong.push(`${f}: ${m[1]}`);
    expect(wrong).toEqual([]);
  });
});

describe("the check itself, on planted rules", () => {
  const K = (n: string, d: string) => "${K(\"" + n + "\", \"" + d + "\")}";

  it("refuses a literal look", () => {
    expect(literalLooks(`.gt-card{border-radius:12px;color:${K("card-ink", "var(--text)")}}`)).toEqual([".gt-card { border-radius: 12px }"]);
    expect(literalLooks(`.gt-tok{transform:rotate(-4deg)}`)).toHaveLength(1);
    expect(literalLooks(`.gt-disc{background:var(--surface)}`)).toHaveLength(1);
  });

  it("passes a setting, a layout keyword, and spacing", () => {
    expect(literalLooks(`.gt-card{border-radius:${K("card-radius", "10px")};padding:7px 8px;gap:4px}`)).toEqual([]);
    expect(literalLooks(`.x>.ellaz-game-footer{background:none;box-shadow:none;width:auto!important}`)).toEqual([]);
  });

  it("does not read a custom property as a look", () => {
    expect(literalLooks(`.f{--key-bg:${K("tray-key-fill", "var(--surface)")};--b-color:red}`)).toEqual([]);
  });
});
