import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { ART, expandArt } from "./themeArt";

/**
 * The themes' drawn parts. A picture is a pure function of the numbers beside
 * it in the sheet, so the served sheet - and the hash every page names it by -
 * only moves when the sheet does.
 */

const sheet = (id: string) => readFileSync(fileURLToPath(new URL(`../ui/themes/${id}.css`, import.meta.url)), "utf8");
const strip = (css: string) => css.replace(/\/\*[\s\S]*?\*\//g, "");
const svgOf = (value: string) => decodeURIComponent(/^url\("data:image\/svg\+xml,(.*)"\)$/.exec(value)![1]);

describe("expandArt", () => {
  it("draws the same picture from the same numbers, every time", () => {
    const css = "a{background:art(tear, 360, 10, 7, #c8433a, #f3c9bd) 0 0/360px 10px repeat-x}";
    expect(expandArt(css)).toBe(expandArt(css));
  });

  it("draws a different picture from a different seed", () => {
    expect(expandArt("a{b:art(tear, 360, 10, 7, #c8433a)}")).not.toBe(expandArt("a{b:art(tear, 360, 10, 8, #c8433a)}"));
  });

  it("leaves everything that is not a picture exactly as it was", () => {
    const css = "a{color:red;background:var(--x) 0 0/9px 9px,#fff}";
    expect(expandArt(css)).toBe(css);
  });

  it("writes a data URI a stylesheet can hold: no raw #, <, > or double quote inside", () => {
    for (const [name, args] of Object.entries(SAMPLES)) {
      const inner = /^url\("(.*)"\)$/.exec(ART[name](...args))![1];
      expect(inner, name).toMatch(/^data:image\/svg\+xml,/);
      expect(inner, name).not.toMatch(/[#<>"]/);
    }
  });

  it("draws well-formed SVG, every picture", () => {
    for (const [name, args] of Object.entries(SAMPLES)) {
      const svg = svgOf(ART[name](...args));
      expect(svg.startsWith("<svg xmlns='http://www.w3.org/2000/svg'"), name).toBe(true);
      expect(svg.endsWith("</svg>"), name).toBe(true);
      const opened = [...svg.matchAll(/<([a-zA-Z]+)\b[^>]*?(\/?)>/g)].filter((m) => m[2] !== "/").map((m) => m[1]);
      const closed = [...svg.matchAll(/<\/([a-zA-Z]+)>/g)].map((m) => m[1]);
      expect(opened.sort(), name).toEqual(closed.sort());
    }
  });

  it("tiles a torn edge: it leaves the strip at the height it entered", () => {
    const svg = svgOf(ART.tear("360", "10", "7", "#c8433a"));
    const d = /d='([^']+)'/.exec(svg)![1];
    const ys = [...d.matchAll(/L([\d.]+) ([\d.]+)/g)].map((m) => [Number(m[1]), Number(m[2])]);
    const first = ys.find(([x]) => x === 0)!;
    const last = ys.find(([x]) => x === 360)!;
    expect(first[1]).toBe(last[1]);
  });
});

/** One call of each picture, as a sheet would write it. */
const SAMPLES: Record<string, string[]> = {
  tear: ["360", "10", "7", "#c8433a", "#f3c9bd"],
  grain: ["160", "#5a4326", "0.1", "0.85", "3"],
  hatch: ["24", "8", "#f25f5c", "0.5", "41"],
  stars: ["240", "46", "9", "#b0a9e0", "#05d9e8"],
};

describe("the pictures and the samples agree", () => {
  it("samples every picture this build can draw", () => {
    expect(Object.keys(SAMPLES).sort()).toEqual(Object.keys(ART).sort());
  });

  it("is asked for by a sheet, every one - a picture nothing draws is dead weight", () => {
    const all = ["paper", "crayon", "flat", "arcade"].map((id) => strip(sheet(id))).join("\n");
    const unused = Object.keys(ART).filter((name) => !new RegExp(`\\bart\\(\\s*${name}\\b`).test(all));
    expect(unused).toEqual([]);
  });
});

describe("the checks above can fail", () => {
  it("refuses a picture it cannot draw", () => {
    expect(() => expandArt("a{b:art(glitter, 1, 2)}", "theme sheet test")).toThrow(/art\(glitter\) is not a picture/);
  });

  it("refuses a colour that is not one", () => {
    expect(() => expandArt("a{b:art(grain, 160, red, 0.1)}")).toThrow(/is not a hex colour/);
  });

  it("refuses a number that is not one", () => {
    expect(() => expandArt("a{b:art(tear, wide, 10, 7, #c8433a)}")).toThrow(/not a number/);
  });

  it("refuses a hatch whose strokes would not meet at the tile's edge", () => {
    expect(() => expandArt("a{b:art(hatch, 24, 7, #f25f5c, 0.5, 1)}")).toThrow(/must divide the tile/);
  });

  it("refuses a call it could not read, rather than serving it", () => {
    // A bracket inside an argument ends the call early and leaves `art(` behind.
    expect(() => expandArt("a{b:art(grain, 160, rgb(1,2,3), 0.1)}")).toThrow();
  });
});
