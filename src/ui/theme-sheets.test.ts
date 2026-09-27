import { describe, expect, it } from "vitest";
import { existsSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { THEMES, themeBootScript } from "./themes";
import { contrastRatio } from "./ink";
import { blockFor, keysIn } from "./theme-tokens.test";
// A test may reach into src/build (no-app-imports.test.ts exempts `.test.ts`).
import { SHEET_THEMES, themeSheetFiles, themeSheetHref } from "../build/themeSheets";

/**
 * THE FOUR PICKED-ONLY THEMES (Paper, Crayon, Flat, Arcade - the style round,
 * operator pick 2026-09-27). Each lives in its own sheet rather than in
 * tokens.css, so everything tokens.css gets checked for by theme-tokens,
 * theme-sync and contrast has to be checked here too, against the sheet - or
 * the four new themes are the four the suite never reads.
 */

const root = (p: string) => fileURLToPath(new URL(p, import.meta.url));
const TOKENS = readFileSync(root("./tokens.css"), "utf8");
const sheetOf = (id: string) => readFileSync(root(`./themes/${id}.css`), "utf8");
const MARKET = keysIn(blockFor(TOKENS, '[data-theme="market"]'));
const NEUTRAL = keysIn(blockFor(TOKENS, ":root {"));

const strip = (css: string) => css.replace(/\/\*[\s\S]*?\*\//g, "");

/** The token block of a sheet, values resolved one `var()` deep. */
function tokens(css: string, id: string): Record<string, string> {
  const block = blockFor(css, `[data-theme="${id}"]`);
  const out: Record<string, string> = {};
  for (const m of block.matchAll(/(--[a-z0-9-]+)\s*:\s*([^;]+);/g)) out[m[1]] = m[2].trim();
  for (const [k, v] of Object.entries(out)) {
    const ref = /^var\((--[a-z0-9-]+)\)$/.exec(v);
    if (ref && out[ref[1]]) out[k] = out[ref[1]];
  }
  return out;
}

/** Every selector in a sheet that is NOT scoped to its own theme. */
function unscoped(css: string, id: string): string[] {
  const body = strip(css).replace(/@import[^;]+;/g, "");
  const bad: string[] = [];
  for (const m of body.matchAll(/([^{}]+)\{[^{}]*\}/g)) {
    for (const sel of m[1].split(",").map((s) => s.trim())) {
      if (sel && !sel.startsWith(`:root[data-theme="${id}"]`)) bad.push(sel);
    }
  }
  return bad;
}

/** The label pairs contrast.test.ts holds Day and Night to, at their floors. */
function contrastFailures(t: Record<string, string>): string[] {
  const pairs: [string, string, number][] = [
    ["--text", "--surface", 4.5],
    ["--text-dim", "--surface", 4.5],
    ["--text", "--bg", 4.5],
    ["--on-brand", "--brand-strong", 4.5],
    ["--on-brand", "--brand", 3],
    ["--text-dim", "--surface-2", 4.5],
    ...["brand", "brand-2", "teal", "yellow", "red", "green", "pink", "orange"].map(
      (a) => [`--${a}-ink`, "--surface", 4.5] as [string, string, number],
    ),
  ];
  return pairs
    .map(([fg, bg, floor]) => [fg, bg, floor, contrastRatio(t[fg], t[bg])] as const)
    .filter(([, , floor, r]) => !(r >= floor))
    .map(([fg, bg, floor, r]) => `${fg} on ${bg}: ${r.toFixed(2)} < ${floor}`);
}

describe("the theme list and the sheets agree", () => {
  it("names the four the style round picked, and only those, as sheet themes", () => {
    expect(SHEET_THEMES).toEqual(["paper", "crayon", "flat", "arcade"]);
  });

  it("has a sheet for every sheet theme and a tokens.css block for every other", () => {
    for (const t of THEMES) {
      if (t.sheet) expect(existsSync(root(`./themes/${t.id}.css`)), t.id).toBe(true);
      else expect(TOKENS).toContain(`[data-theme="${t.id}"]`);
    }
  });
});

describe.each(SHEET_THEMES)("the %s sheet", (id) => {
  const css = sheetOf(id);
  const t = tokens(css, id);
  const theme = THEMES.find((x) => x.id === id)!;

  it("declares every colour key Day declares", () => {
    const missing = MARKET.filter((k) => !(k in t));
    expect(missing).toEqual([]);
  });

  it("adds nothing but neutral keys it re-shapes (radius, font)", () => {
    const extra = Object.keys(t).filter((k) => !MARKET.includes(k));
    expect(extra.filter((k) => !NEUTRAL.includes(k))).toEqual([]);
  });

  it("scopes every rule to its own theme, so two loaded sheets never mix", () => {
    expect(unscoped(css, id)).toEqual([]);
  });

  it("paints the browser chrome and the splash from its own tokens", () => {
    expect(t["--brand"].toLowerCase()).toBe(theme.browserChrome);
    expect(t["--bg"].toLowerCase()).toBe(theme.background);
  });

  it("clears every label contrast floor Day and Night are held to", () => {
    expect(contrastFailures(t)).toEqual([]);
  });

  it("imports only its own self-hosted fonts", () => {
    for (const m of strip(css).matchAll(/@import\s+"([^"]+)"/g)) {
      expect(m[1]).toMatch(/^\.\/fonts\/[a-z0-9-]+\.css$/);
      expect(existsSync(root(`./themes/${m[1].slice(2)}`)), m[1]).toBe(true);
    }
  });
});

describe("the served files", () => {
  const { hash, files } = themeSheetFiles();
  const names = files.map((f) => f.fileName);

  it("serves one sheet per sheet theme, under one shared hash", () => {
    for (const id of SHEET_THEMES) expect(names).toContain(`assets/theme-${id}-${hash}.css`);
    expect(hash).toMatch(/^[0-9a-f]{8}$/);
  });

  it("carries no @import - a resource behind one is found late and blocks", () => {
    for (const f of files) if (f.fileName.endsWith(".css")) expect(String(f.source)).not.toMatch(/@import/);
  });

  it("serves every font a sheet names, under the name it uses", () => {
    for (const f of files.filter((x) => x.fileName.endsWith(".css"))) {
      for (const m of String(f.source).matchAll(/url\(\.\/([^)]+)\)/g)) {
        expect(names, `${f.fileName} names ${m[1]}`).toContain(`assets/${m[1]}`);
      }
    }
  });

  it("builds the same URL the boot script and the picker build", () => {
    const h = themeSheetHref("/ellaz/");
    expect(`${h.prefix}paper${h.suffix}`).toBe(`/ellaz/assets/theme-paper-${hash}.css`);
  });
});

describe("the boot script with sheets", () => {
  const script = themeBootScript({ prefix: "/assets/theme-", suffix: "-abcd1234.css" });
  const run = (stored: string | null) => {
    const attrs: Record<string, string> = {};
    const written: string[] = [];
    new Function("localStorage", "document", script)(
      { getItem: () => stored },
      {
        documentElement: { setAttribute: (k: string, v: string) => (attrs[k] = v) },
        write: (s: string) => written.push(s),
      },
    );
    return { theme: attrs["data-theme"], written };
  };

  it("writes the sheet link for a sheet theme, before paint, parser-inserted", () => {
    const r = run("paper");
    expect(r.theme).toBe("paper");
    expect(r.written).toEqual(["<link rel=stylesheet href=/assets/theme-paper-abcd1234.css>"]);
  });

  it("writes no link for Night, whose values are already in the page", () => {
    expect(run("night")).toEqual({ theme: "night", written: [] });
  });

  it("writes nothing at all for Day, junk or an empty store", () => {
    for (const s of ["market", "nope", "", null]) expect(run(s)).toEqual({ theme: undefined, written: [] });
  });
});

describe("the checks above can fail", () => {
  it("finds an unscoped rule", () => {
    expect(unscoped(':root[data-theme="paper"]{--a:1}\n.gc-cell{color:red}', "paper")).toEqual([".gc-cell"]);
  });

  it("finds a rule scoped to ANOTHER theme", () => {
    expect(unscoped(':root[data-theme="crayon"] .x{color:red}', "paper")).toHaveLength(1);
  });

  it("finds a label below the floor", () => {
    const t = tokens(sheetOf("paper"), "paper");
    expect(contrastFailures({ ...t, "--text-dim": "#b0a090" })).not.toEqual([]);
  });

  it("finds a missing colour key", () => {
    const t = tokens(sheetOf("flat").replace(/--teal-ink:[^;]+;/, ""), "flat");
    expect(MARKET.filter((k) => !(k in t))).toEqual(["--teal-ink"]);
  });
});
