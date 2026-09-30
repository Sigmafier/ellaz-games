import { describe, expect, it } from "vitest";
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { DARK_ARM, MODE_STORAGE_KEY, STYLES as PICKER_STYLES, THEMES, THEME_STORAGE_KEY as THEME_KEY, styleOf, themeBootScript, wearOf } from "./themes";
import { KEY_CSS } from "./Key";
import { SETTINGS } from "./kinds";
import { isValuesOnly, rulesOf } from "./button-kit.test";
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

/**
 * THE KEYS A GAME READS. A sheet may give a board and its keys their colours;
 * these are the names, and `a game reads every key` below holds each one to a
 * line of game code that reads it - a key nothing reads is a lever with no
 * caller, and a sheet setting it would look like it themed something.
 */
const GAME_KEYS = [
  "--board-bg",
  "--board-frame",
  "--board-radius",
  "--board-line",
  "--board-rule",
  "--board-ink",
  "--board-you",
  "--board-bad",
  "--board-sel",
  "--board-same",
  "--key-radius",
  "--key-bg",
  "--key-ink",
  "--key-shadow",
];

/** Every source file under src/games that is not a test. */
function gameSources(dir = root("../games")): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((e) =>
    e.isDirectory()
      ? gameSources(join(dir, e.name))
      : /\.tsx?$/.test(e.name) && !/\.test\.tsx?$/.test(e.name)
        ? [readFileSync(join(dir, e.name), "utf8")]
        : [],
  );
}

/** A colour as the eye gets it: `rgba()` laid over the page, a hex as it is. */
function solid(value: string, under: string): string {
  const m = /^rgba\(\s*(\d+),\s*(\d+),\s*(\d+),\s*([\d.]+)\s*\)$/.exec(value);
  if (!m) return value;
  const a = Number(m[4]);
  const u = [1, 3, 5].map((i) => parseInt(under.slice(i, i + 2), 16));
  return "#" + [1, 2, 3].map((i, k) => Math.round(Number(m[i]) * a + u[k] * (1 - a)).toString(16).padStart(2, "0")).join("");
}

/** What a board's numbers are read against, at the floor for body text. */
function boardFailures(t: Record<string, string>): string[] {
  const bg = solid(t["--board-bg"], t["--bg"]);
  return (["--board-ink", "--board-you", "--board-bad"] as const)
    .map((k) => [k, contrastRatio(t[k], bg)] as const)
    .filter(([, r]) => !(r >= 4.5))
    .map(([k, r]) => `${k} on the board: ${r.toFixed(2)} < 4.5`);
}

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
    // A label on a brand fill wears these, not --text: see the foot of a sheet.
    ["--ink-on-brand", "--brand", 4.5],
    ["--ink-on-fill", "--brand-fill", 4.5],
    ...["brand", "brand-2", "teal", "yellow", "red", "green", "pink", "orange"].map(
      (a) => [`--${a}-ink`, "--surface", 4.5] as [string, string, number],
    ),
  ];
  return pairs
    .map(([fg, bg, floor]) => [fg, bg, floor, contrastRatio(t[fg], t[bg])] as const)
    .filter(([, , floor, r]) => !(r >= floor))
    .map(([fg, bg, floor, r]) => `${fg} on ${bg}: ${r.toFixed(2)} < ${floor}`);
}

/**
 * A PALETTE sheet is a whole theme: its own colour tokens, held to everything
 * tokens.css is held to below. A STYLE sheet (Wood, K3 2026-09-29) keeps Day's
 * palette - which lives at bare `:root`, so a theme that declares no colour
 * inherits it - and sets kit settings only. Told apart by the token block, and
 * `a style sheet is values only` below holds the second kind to its shape.
 */
const isPalette = (id: string) => new RegExp(`:root\\[data-theme="${id}"\\]\\s*\\{`).test(strip(sheetOf(id)));
const PALETTES = SHEET_THEMES.filter(isPalette);
const STYLES = SHEET_THEMES.filter((id) => !isPalette(id));

describe("the theme list and the sheets agree", () => {
  it("names the four the style round picked as palettes, and Wood as a style over Day", () => {
    expect(PALETTES).toEqual(["paper", "crayon", "flat", "arcade"]);
    expect(STYLES).toEqual(["wood"]);
  });

  it("has a sheet for every sheet theme and a tokens.css block for every other", () => {
    for (const t of THEMES) {
      if (t.sheet) expect(existsSync(root(`./themes/${t.id}.css`)), t.id).toBe(true);
      else expect(TOKENS).toContain(`[data-theme="${t.id}"]`);
    }
  });
});

describe.each(PALETTES)("the %s sheet", (id) => {
  const css = sheetOf(id);
  const t = tokens(css, id);
  const theme = THEMES.find((x) => x.id === id)!;

  it("declares every colour key Day declares", () => {
    const missing = MARKET.filter((k) => !(k in t));
    expect(missing).toEqual([]);
  });

  it("adds only neutral keys, keys a game reads, and keys it uses itself", () => {
    const extra = Object.keys(t).filter((k) => !MARKET.includes(k) && !NEUTRAL.includes(k) && !GAME_KEYS.includes(k));
    // What is left is the sheet's own shorthand - a line width, a corner shape.
    // It must be USED in this sheet, or it is a name with nothing behind it.
    const body = strip(css);
    expect(extra.filter((k) => !body.includes(`var(${k})`))).toEqual([]);
  });

  it("hands a label on a brand fill the ink that was measured for it", () => {
    const body = strip(css);
    expect(body).toContain('[style*="background: var(--brand)"] { color: var(--ink-on-brand) !important; }');
    expect(body).toContain('[style*="background: var(--brand-fill)"] { color: var(--ink-on-fill) !important; }');
  });

  it("gives the board numbers a reader can read", () => {
    expect(boardFailures(t)).toEqual([]);
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

describe.each(STYLES)("the %s style", (id) => {
  const css = sheetOf(id);
  const rules = rulesOf(css);
  const theme = THEMES.find((x) => x.id === id)!;
  const day = tokens(TOKENS, "market");

  const light = `:root[data-theme="${id}"]`, dark = `${light}[data-mode="dark"]`;

  it("is kit settings on the theme's body and nothing else - no selector, and a token only in its dark arm", () => {
    expect(rules.length).toBeGreaterThan(0);
    const allowed = [`${light} body`, dark, `${dark} body`];
    expect(rules.filter((r) => !allowed.includes(r.sel) || !isValuesOnly(r)).map((r) => r.sel)).toEqual([]);
    const set = rules
      .filter((r) => r.sel.endsWith(" body"))
      .flatMap((r) => [...r.body.matchAll(/(--[a-z0-9-]+)\s*:/g)].map((m) => m[1].slice(2)));
    expect(set.length).toBeGreaterThan(10);
    expect(set.filter((n) => !SETTINGS.includes(n as never))).toEqual([]);
  });

  it("goes dark on Night's palette, value for value", () => {
    const own = tokens(css.replace(/[\s\S]*?(?=:root\[data-theme="[a-z]+"\]\[data-mode="dark"\] \{)/, ""), id);
    expect(own).toEqual(tokens(TOKENS, "night"));
  });

  it("wears Day's palette, so paints Day's browser chrome and splash", () => {
    expect(day["--brand"].toLowerCase()).toBe(theme.browserChrome);
    expect(day["--bg"].toLowerCase()).toBe(theme.background);
  });
});

/**
 * THE DARK ARMS (the Light/Dark switch, operator 2026-09-30). Each palette's dark
 * block is laid over its light block and held to every floor the light one is:
 * the label pairs and the board. A dark arm is values only (button-kit.test.ts).
 */
const darkOf = (id: string) => {
  const css = sheetOf(id);
  const at = strip(css).indexOf(`[data-theme="${id}"][data-mode="dark"] {`);
  return at < 0 ? null : { ...tokens(css, id), ...tokens(strip(css).slice(at - 6), id) };
};

describe("every palette has a dark side that clears the same floors", () => {
  it.each(PALETTES.filter((id) => id !== "arcade"))("%s", (id) => {
    const t = darkOf(id);
    expect(t, `${id} has no dark arm`).not.toBeNull();
    expect(contrastFailures(t!)).toEqual([]);
    expect(boardFailures(t!)).toEqual([]);
  });

  it("arcade is dark already and has no dark arm - its switch is hidden", () => {
    expect(darkOf("arcade")).toBeNull();
  });
});

describe("the pre-game Play button's ink holds on every yellow", () => {
  // `.play` and `.pk-btn` wear --doc-on-sun on --doc-sun (= --yellow). One dark
  // ink for all, so every style's yellow, light and dark, must carry it.
  const layout = readFileSync(root("../build/layout.ts"), "utf8");
  const onSun = /--doc-on-sun:(#[0-9a-f]{6})[;}]/.exec(layout)?.[1] ?? "";
  const yellows: [string, string][] = [
    ["market", tokens(TOKENS, "market")["--yellow"]],
    ["night", tokens(TOKENS, "night")["--yellow"]],
    ...SHEET_THEMES.flatMap((id) => {
      const light = tokens(sheetOf(id), id)["--yellow"];
      const dark = darkOf(id)?.["--yellow"];
      return [[id, light], ...(dark ? [[`${id} dark`, dark]] : [])] as [string, string][];
    }),
  ].filter(([, y]) => Boolean(y)) as [string, string][];

  it("reads a real ink and every yellow", () => {
    expect(onSun).toMatch(/^#[0-9a-f]{6}$/);
    expect(yellows.length).toBeGreaterThanOrEqual(9);
  });

  it.each(yellows)("%s", (_, y) => {
    expect(contrastRatio(onSun, y)).toBeGreaterThanOrEqual(4.5);
  });
});

describe("the served files", () => {
  const { hash, files } = themeSheetFiles();
  const names = files.map((f) => f.fileName);

  it("serves one sheet per sheet theme, under one shared hash", () => {
    for (const id of SHEET_THEMES) expect(names).toContain(`assets/theme-${id}-${hash}.css`);
    expect(hash).toMatch(/^[0-9a-f]{8}$/);
  });

  it("has drawn every picture - no art() call reaches a browser", () => {
    for (const f of files) if (f.fileName.endsWith(".css")) expect(String(f.source)).not.toMatch(/\bart\(/);
  });

  it("carries no @import - a resource behind one is found late and blocks", () => {
    for (const f of files) if (f.fileName.endsWith(".css")) expect(String(f.source)).not.toMatch(/@import/);
  });

  it("serves every font a sheet names, under the name it uses", () => {
    for (const f of files.filter((x) => x.fileName.endsWith(".css"))) {
      // `url(./name)` is a font; a picture is `url("data:...")` and names no file.
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

describe("a game reads every key a sheet may set", () => {
  // A game's keys are drawn by @ui/Key since the button kit (2026-09-28), so
  // the key-* names are read in the CSS it emits rather than in a game file.
  const games = [...gameSources(), KEY_CSS].join("\n");

  it.each(GAME_KEYS)("%s is read by a game", (key) => {
    expect(games).toContain(`var(${key},`);
  });

  it("is set by at least one sheet, each of them", () => {
    const all = SHEET_THEMES.map((id) => strip(sheetOf(id))).join("\n");
    expect(GAME_KEYS.filter((k) => !all.includes(`${k}:`))).toEqual([]);
  });

  it("leaves Day and Night the board they always had", () => {
    // tokens.css declares none of them, so a game's own fallback is what
    // paints - and the fallbacks are the literals that shipped before the keys.
    for (const k of GAME_KEYS) expect(TOKENS).not.toContain(`${k}:`);
    const sudoku = readFileSync(root("../games/sudoku/Sudoku.tsx"), "utf8");
    for (const was of [
      "var(--board-bg, #20244a)",
      "var(--board-frame, 3px solid #6c5ce7)",
      "var(--board-line, 1px solid rgba(255,255,255,0.08))",
      "var(--board-line, 2px outset rgb(0, 0, 0))",
      "var(--board-rule, 2px solid #6c5ce7)",
      "var(--board-sel, #4a4f96)",
      "var(--board-same, rgba(108,92,231,0.25))",
      "var(--board-bad, #ff7675)",
      "var(--board-ink, #ffffff)",
      "var(--board-you, #a29bfe)",
    ]) {
      expect(sudoku, was).toContain(was);
    }
    for (const was of ["var(--key-bg,var(--k-fill,var(--surface)))", "var(--key-shadow,var(--k-shadow,var(--shadow-1)))"]) {
      expect(KEY_CSS, was).toContain(was);
    }
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

  // The Light/Dark switch: the mode has its own key and is worn before paint.
  const attrsFor = (store: Record<string, string>) => {
    const attrs: Record<string, string> = {};
    new Function("localStorage", "document", script)(
      { getItem: (k: string) => store[k] ?? null },
      { documentElement: { setAttribute: (k: string, v: string) => (attrs[k] = v) }, write: () => {} },
    );
    return attrs;
  };

  it("wears the dark mode from its own key, beside the theme, before paint", () => {
    expect(attrsFor({ [THEME_KEY]: "paper", [MODE_STORAGE_KEY]: "dark" })).toEqual({ "data-mode": "dark", "data-theme": "paper" });
    expect(attrsFor({ [MODE_STORAGE_KEY]: "dark" })).toEqual({ "data-mode": "dark" });
  });

  it("wears no mode for a light player, or a junk value", () => {
    expect(attrsFor({ [THEME_KEY]: "paper" })).toEqual({ "data-theme": "paper" });
    expect(attrsFor({ [THEME_KEY]: "paper", [MODE_STORAGE_KEY]: "Dark" })).toEqual({ "data-theme": "paper" });
  });
});

describe("the switch maps a style and a mode onto what is worn", () => {
  it("Day + dark is Night, and a saved Night reads as Day + dark", () => {
    expect(wearOf("market", true).id).toBe("night");
    expect(wearOf("market", false).id).toBe("market");
    expect(styleOf("night", false)).toEqual({ style: "market", dark: true });
  });

  it("a style with a dark arm keeps its id and wears the mode; Arcade has none", () => {
    expect(wearOf("paper", true)).toEqual({ id: "paper", mode: true });
    expect(wearOf("arcade", true)).toEqual({ id: "arcade", mode: false });
    expect(styleOf("arcade", true)).toEqual({ style: "arcade", dark: false });
  });

  it("offers every style once, and Night is not one of them", () => {
    expect([...PICKER_STYLES].sort()).toEqual(THEMES.map((t) => t.id).filter((id) => id !== "night").sort());
    expect([...DARK_ARM].sort()).toEqual(SHEET_THEMES.filter((id) => darkOf(id)).sort());
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

  it("finds a label a brand fill cannot carry - Day's own pairing, on Paper's red", () => {
    const t = tokens(sheetOf("paper"), "paper");
    expect(contrastFailures({ ...t, "--ink-on-brand": t["--text"] })).toEqual(["--ink-on-brand on --brand: 2.67 < 4.5"]);
  });

  it("finds a board number below the floor", () => {
    const t = tokens(sheetOf("flat"), "flat");
    expect(boardFailures({ ...t, "--board-you": "#f25f5c" })).toEqual(["--board-you on the board: 3.20 < 4.5"]);
  });

  it("reads a see-through board over the page under it", () => {
    expect(solid("rgba(255, 255, 255, 0.5)", "#000000")).toBe("#808080");
    expect(solid("#123456", "#000000")).toBe("#123456");
  });

  it("finds a missing colour key", () => {
    const t = tokens(sheetOf("flat").replace(/--teal-ink:[^;]+;/, ""), "flat");
    expect(MARKET.filter((k) => !(k in t))).toEqual(["--teal-ink"]);
  });
});
