import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { nameSize, titleLines } from "./ArcadeTitle";

/**
 * The shared TITLE screen a showcase game opens on (operator, 2026-09-30:
 * *"we have to have 1 enter game screen"*, approved off a mock).
 *
 * SOURCE assertions, for the reason arcade-entrance-covers-the-arena.test.ts
 * gives: this suite runs in node and renders nothing, so what it can hold is
 * the shape a refactor would break silently. Each check carries a mutation that
 * must NOT pass, so a matcher that stopped matching cannot read as green.
 * The rendered screen is checked in a browser, by the shots.
 */

const UI = fileURLToPath(new URL(".", import.meta.url));
const SRC = readFileSync(UI + "ArcadeTitle.tsx", "utf8");
/** Code with comments removed, so prose cannot trip a matcher. */
const code = (t: string) => t.replace(/\/\*[\s\S]*?\*\//g, " ").replace(/\/\/[^\n]*/g, " ");
const CODE = code(SRC);

describe("the population is real", () => {
  it("read the component", () => {
    expect(SRC.length).toBeGreaterThan(2000);
    expect(CODE).toContain("export function ArcadeTitle");
  });
});

describe("one card, one thing to press", () => {
  const primaries = (s: string) => (s.match(/data-primary="true"/g) ?? []).length;
  const buttons = (s: string) => (s.match(/<button\b/g) ?? []).length;

  it("exactly one PRIMARY control, and it is a real <button> that calls the game's own start", () => {
    expect(primaries(CODE)).toBe(1);
    expect(CODE).toMatch(/<button\s+type="button"\s+data-primary="true"\s+onClick=\{props\.onAction\}/);
    expect((CODE.match(/onClick=\{props\.onAction\}/g) ?? []).length, "one press path, never a second").toBe(1);
  });

  /*
   * 2026-10-01 ("one-screen start, all four"): the card gained the chips, the
   * pills and the link as a pill, so it is no longer "at most one other
   * button". What is held instead: every other button is one the GAME handed
   * over - a chip per option, a pill per pill, the link - each pressing that
   * item's own handler, and none of them is the primary.
   */
  it("every other button is a chip, a pill or the link, each the game's own", () => {
    expect(buttons(CODE)).toBe(5);
    expect(CODE).toMatch(/props\.chips\.options\.map\(\(o\) => \{[\s\S]*?<button[\s\S]*?aria-pressed=\{on\}[\s\S]*?onClick=\{\(\) => props\.chips\?\.onChange\(o\.id\)\}/);
    expect(CODE).toMatch(/const pill = \(p: TitlePill, i: number\) => \(\s*<button key=\{i\} type="button" onClick=\{p\.onPress\}/);
    expect(CODE).toMatch(/\{linkAsPill && link && \(\s*<button type="button" onClick=\{link\.onPress\}/);
    expect(CODE).toMatch(/const linkButton = link && !linkAsPill && \(\s*<button type="button" onClick=\{link\.onPress\}/);
  });

  it("nothing on it is ever disabled", () => {
    expect(CODE).not.toMatch(/\bdisabled\b/);
  });

  it("FIRES on a second primary, on a lost handler, a disabled button, and an extra button", () => {
    const two = CODE.replace('data-primary="true"', 'data-primary="true" /><button data-primary="true"');
    expect(two).not.toBe(CODE);
    expect(primaries(two)).toBe(2);

    const lost = CODE.replace("onClick={props.onAction}", "onClick={() => {}}");
    expect(lost).not.toBe(CODE);
    expect(lost).not.toMatch(/<button\s+type="button"\s+data-primary="true"\s+onClick=\{props\.onAction\}/);

    const off = CODE.replace('data-primary="true"', 'data-primary="true" disabled');
    expect(off).toMatch(/\bdisabled\b/);

    expect(buttons(CODE + "<button />")).toBe(6);
  });
});

describe("it covers its box and never resizes it", () => {
  // The card is drawn OVER the arena (or the panel), like the entrance it
  // replaced: the ROOT absolutely placed, all four insets zero. A card in flow
  // would push the board and change the size the board gate measured.
  const covers = (s: string) => /ref=\{ref\}\s*role="group"[\s\S]{0,80}?position: "absolute",\s*inset: 0,/.test(s);

  it("its root is an absolute cover with every inset zero", () => {
    expect(covers(CODE)).toBe(true);
  });

  it("FIRES when it joins the flow", () => {
    const m = CODE.replace(/(role="group"[\s\S]{0,80}?)position: "absolute",/, '$1position: "relative",');
    expect(m).not.toBe(CODE);
    expect(covers(m)).toBe(false);
  });

  it("accepts pointers - it is the one thing on the arena a player must press", () => {
    expect(CODE).not.toMatch(/pointerEvents:\s*"none"/);
  });
});

describe("the difficulty chips are buttons the gates can read", () => {
  it("each chip carries the name it was handed and says whether it is picked", () => {
    expect(CODE).toMatch(/aria-label=\{o\.aria\}\s*aria-pressed=\{on\}/);
  });
});

describe("no colour of its own", () => {
  it("every ink comes from the game", () => {
    expect(CODE).toContain("inks: TitleInks;");
    expect(CODE).not.toMatch(/#[0-9a-fA-F]{3,8}\b|\brgba?\(/);
  });
});

describe("the shared shell knows nothing about a game", () => {
  it("imports nothing from src/games", () => {
    expect(SRC).not.toMatch(/from ["']@?[./\w-]*games\//);
  });

  it("FIRES on a game import", () => {
    expect(`import { X } from "../games/survivors/x";\n${SRC}`).toMatch(/from ["']@?[./\w-]*games\//);
  });
});

describe("the name is set in one or two lines that fit the box", () => {
  it("splits at the first space, upper-cased for the locale", () => {
    expect(titleLines("Neon Survival", "en")).toEqual(["NEON", "SURVIVAL"]);
    expect(titleLines("Snake Survivors", "en")).toEqual(["SNAKE", "SURVIVORS"]);
    expect(titleLines("Supervivencia Neón", "es")).toEqual(["SUPERVIVENCIA", "NEÓN"]);
    expect(titleLines("Serpiente superviviente", "es")).toEqual(["SERPIENTE", "SUPERVIVIENTE"]);
  });

  it("one word stays one line, and Hebrew is left as it is written", () => {
    expect(titleLines("Neonöverlevnad", "sv")).toEqual(["NEONÖVERLEVNAD"]);
    expect(titleLines("הישרדות ניאון", "he")).toEqual(["הישרדות", "ניאון"]);
  });

  it("the size shrinks for the longest line and never overflows the box", () => {
    for (const [w, h] of [[358, 756], [852, 479], [320, 568]] as const) {
      for (const lines of [["NEON", "SURVIVAL"], ["SUPERVIVENCIA", "NEÓN"], ["NEONÖVERLEVNAD"]]) {
        const fs = nameSize(lines, w, h);
        const longest = Math.max(...lines.map((l) => l.length));
        // The estimate the size is made from: 0.72em a glyph, which is wider
        // than Fredoka Bold's capitals, so a name held to it has room to spare.
        expect(fs * longest * 0.72, `${lines.join(" ")} @${w}x${h}`).toBeLessThanOrEqual(w * 0.9 + 0.01);
        expect(fs).toBeGreaterThan(20);
      }
    }
    // A split title's column is narrower than it is tall; the BOX's shape decides the cap.
    expect(nameSize(["SURVIVORS"], 443, 479, true)).toBeGreaterThan(nameSize(["SURVIVORS"], 443, 479));
    // THE CONTROL: a longer line is set smaller, or the fit above is luck.
    expect(nameSize(["SUPERVIVENCIA"], 358, 756)).toBeLessThan(nameSize(["NEON"], 358, 756));
  });
});
