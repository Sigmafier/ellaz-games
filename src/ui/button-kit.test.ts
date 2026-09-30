import { describe, expect, it } from "vitest";
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { KIT, KIT_WIRING, SETTINGS } from "./kinds";
import { KEY_CSS } from "./Key";
// A test may reach into src/build (no-app-imports.test.ts exempts `.test.ts`).
import { KIT_CSS, TABLE_GAMES } from "../build/kitCss";

/**
 * A STYLE IS VALUES ONLY (games-doctrine G8, operator rulings 2026-09-28:
 * "we always generalize buttons and make them modular", then "Values only").
 *
 * The kit (./kinds.ts) owns every button's selector and reads every look from
 * a setting; a theme sheet gives the settings values and never names a button.
 * Four things hold that, each failing on its own:
 *
 *   1. No sheet rule names a button the kit draws. Hard zero.
 *   2. Everything else a sheet still styles by selector (the page, the board,
 *      the home screen - kinds not built yet) is counted, and the count only
 *      goes down. Moving one onto the kit lowers BY_SELECTOR in the same change.
 *   3. A sheet sets only settings that exist - `--tool-fil` would do nothing,
 *      silently, forever.
 *   4. Every setting is read by something - one nothing reads is a lever with
 *      no caller, and a sheet setting it would look like it themed something.
 */
const here = (p: string) => new URL(p, import.meta.url).pathname;
const SHEETS = readdirSync(here("./themes")).filter((f) => f.endsWith(".css"));
const sheet = (f: string) => readFileSync(here(`./themes/${f}`), "utf8");

/** The classes and attributes of the buttons the kit draws. */
export const KIT_BUTTONS = /\.hbtn|\.ubtn|\.wallet-wrap|\[data-sound\]|\.moresheet|\.langsheet|\.ellaz-key|\.gt-(disc|card|tok|row|dots)|\.gc-table/;

/**
 * The rules a sheet still styles by selector, counted by the check below.
 * Measured 2026-09-28 when the bar's buttons and the keys moved onto the kit:
 * the four sheets went from 193 rules, 189 of them by selector, to 120 rules,
 * 112 by selector. What is left is the page, the bar's own ground, the titles,
 * the number cells, the board, and the home screen's header and rail (the
 * corner buttons, K4). Lower this in the change that moves one of them.
 */
export const BY_SELECTOR = 112;

type Rule = { sel: string; body: string; media: string };

/** Every rule in a sheet, with the @media it sits in. Comments go first. */
export function rulesOf(css: string): Rule[] {
  const src = css.replace(/\/\*[\s\S]*?\*\//g, "").replace(/@import[^;]*;/g, "");
  const out: Rule[] = [];
  const walk = (text: string, media: string) => {
    let i = 0;
    while (i < text.length) {
      const open = text.indexOf("{", i);
      if (open < 0) break;
      const head = text.slice(i, open).trim();
      let depth = 1, j = open + 1;
      for (; j < text.length && depth; j++) depth += text[j] === "{" ? 1 : text[j] === "}" ? -1 : 0;
      const inner = text.slice(open + 1, j - 1);
      if (head.startsWith("@")) walk(inner, head);
      else out.push({ sel: head.replace(/\s+/g, " "), body: inner, media });
      i = j;
    }
  };
  walk(src, "");
  return out;
}

/**
 * A rule is VALUES ONLY when it sits on the theme's root or body - in either mode,
 * light or dark (the switch, 2026-09-30) - and sets custom properties.
 */
export function isValuesOnly(r: Rule): boolean {
  const onRoot = r.sel.split(",").every((s) => /^:root\[data-theme="[a-z]+"\](\[data-mode="dark"\])?( body)?$/.test(s.trim()));
  const decls = r.body.split(";").map((d) => d.trim()).filter(Boolean);
  return onRoot && decls.every((d) => d.startsWith("--"));
}

const KIT_PREFIX = new RegExp(`^--(${Object.keys(KIT).join("|")})-`);
export function unknownSettings(css: string): string[] {
  return [...css.matchAll(/(--[a-z0-9-]+)\s*:/g)]
    .map((m) => m[1])
    .filter((p) => KIT_PREFIX.test(p) && !SETTINGS.includes(p.slice(2) as never));
}

/**
 * Everything that may read a setting: the kit's own CSS as it is emitted (a
 * role's or a cycle's setting is named by a loop, so only the output names it),
 * the table's and the key's source, and the games - a game in the tray reads
 * `tray-ink`.
 */
function readers(): string {
  const files: string[] = [];
  const walk = (dir: string) => {
    for (const e of readdirSync(dir, { withFileTypes: true })) {
      const p = join(dir, e.name);
      if (e.isDirectory()) walk(p);
      else if (/\.tsx?$/.test(e.name) && !/\.test\.tsx?$/.test(e.name) && e.name !== "kinds.ts") files.push(p);
    }
  };
  walk(here("../games"));
  return [KIT_CSS, KEY_CSS, ...["./GameTable.tsx", "./Key.tsx"].map((f) => readFileSync(here(f), "utf8")), ...files.map((f) => readFileSync(f, "utf8"))].join("\n");
}

describe("a theme sheet is values only", () => {
  const all = SHEETS.flatMap((f) => rulesOf(sheet(f)).map((r) => ({ ...r, f })));

  it("reads every sheet, rule by rule", () => {
    expect(SHEETS.length).toBeGreaterThanOrEqual(4);
    expect(all.length).toBeGreaterThan(80);
    expect(all.filter(isValuesOnly).length).toBeGreaterThanOrEqual(SHEETS.length);
  });

  it("names no button the kit draws", () => {
    const hits = all.filter((r) => KIT_BUTTONS.test(r.sel)).map((r) => `${r.f}: ${r.sel.slice(0, 90)}`);
    expect(hits).toEqual([]);
  });

  it("styles by selector no more than it did - the count only goes down", () => {
    const left = all.filter((r) => !isValuesOnly(r) && !/^:root\[data-theme="[a-z]+"\]$/.test(r.sel));
    expect(left.length).toBeLessThanOrEqual(BY_SELECTOR);
  });

  it("sets only settings that exist", () => {
    expect(SHEETS.flatMap((f) => unknownSettings(sheet(f)).map((p) => `${f}: ${p}`))).toEqual([]);
  });
});

describe("the kit", () => {
  const src = readers();

  it("has every setting read by something, and no setting twice", () => {
    const unread = SETTINGS.filter((s) => !src.includes(`K("${s}"`) && !new RegExp(`--${s}[,)]`).test(src));
    expect(unread).toEqual([]);
    expect(new Set(SETTINGS).size).toBe(SETTINGS.length);
  });

  it("uses all of its wiring, and no sheet touches it", () => {
    expect(KIT_WIRING.filter((w) => !new RegExp(`${w}"?:`).test(src) || !src.includes(`var(${w}`))).toEqual([]);
    expect(SHEETS.filter((f) => KIT_WIRING.some((w) => sheet(f).includes(`${w}:`)))).toEqual([]);
  });
});

describe("the corners (K4)", () => {
  // The games on the table are pinned in ONE place, layout-is-declared.test.ts;
  // this reads that list rather than keeping a second, so a game joining the
  // table reds here only if the kit did not pick it up from its meta.
  const pinned = readFileSync(here("../games/layout-is-declared.test.ts"), "utf8");
  const list = /const ON_THE_TABLE = \[([^\]]*)\]/.exec(pinned)?.[1] ?? "";
  const onTable = [...list.matchAll(/"([^"]+)"/g)].map((m) => m[1]);
  // The layout gate's control is a game that is NOT on the table (that test holds it).
  const control = /export const CONTROL = "([^"]+)"/.exec(readFileSync(here("../lab/layout/gate.ts"), "utf8"))?.[1] ?? "";

  it("puts every table game, and only those, in the corners", () => {
    expect(onTable.length).toBeGreaterThanOrEqual(6);
    expect([...TABLE_GAMES].sort()).toEqual([...onTable].sort());
    for (const id of TABLE_GAMES) expect(KIT_CSS).toContain(`[data-game="${id}"]`);
    expect(control).toBeTruthy();
    expect(KIT_CSS).not.toContain(`[data-game="${control}"]`);
  });

  it("keys on what the emitted page carries, so the corners are there at first paint", () => {
    // data-layout is set by GameHost when the game's chunk loads - too late.
    expect(KIT_CSS).not.toMatch(/data-layout/);
    expect(KIT_CSS).toContain('.screen[data-page="game"]:is(');
  });
});

describe("the checks themselves, on planted sheets", () => {
  it("refuses a button selector, and passes a values block", () => {
    const planted = rulesOf(':root[data-theme="x"] body { --tool-fill: red; }\n:root[data-theme="x"] .ubtn[data-pause] { rotate: 4deg; }');
    expect(planted.filter((r) => KIT_BUTTONS.test(r.sel))).toHaveLength(1);
    expect(planted.filter(isValuesOnly)).toHaveLength(1);
  });

  it("counts a look on the body as a look, and a rule inside @media", () => {
    const planted = rulesOf('@media (max-width: 719px) { :root[data-theme="x"] body { background: red; --lid-fill: blue; } }');
    expect(planted).toHaveLength(1);
    expect(planted[0].media).toContain("max-width");
    expect(isValuesOnly(planted[0])).toBe(false);
  });

  it("catches a misspelt setting and passes a real one and a theme token", () => {
    expect(unknownSettings("--tool-fil: red; --tool-fill: red; --crayon-line: 2px solid; --key-bg: red;")).toEqual(["--tool-fil"]);
  });
});
