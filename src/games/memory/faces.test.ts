import { describe, expect, it } from "vitest";
import { THEMES, THEME_IDS, DEFAULT_THEME, backSvg, faceOf, faceSvg, themeOf } from "./faces";

// The largest deal memory makes (LEVELS in Memory.tsx: hard is 10 pairs).
const MAX_PAIRS = 10;

/**
 * A tag-balance walk over SVG markup. Not a parser - just enough to say every
 * element that opens also closes, in order, because a face with an unclosed
 * <g> swallows the frame drawn after it and still renders SOMETHING.
 */
function unbalanced(svg: string): string | null {
  const stack: string[] = [];
  for (const m of svg.matchAll(/<(\/?)([a-z]+)\b[^>]*?(\/?)>/g)) {
    const [, close, name, self] = m;
    if (self) continue;
    if (!close) stack.push(name);
    else if (stack.pop() !== name) return `</${name}> closes the wrong element`;
  }
  return stack.length ? `<${stack.join("><")}> never closed` : null;
}

describe("memory's pictures", () => {
  it("offers the four themes the operator picked, animals first", () => {
    // Operator ruling 2026-09-22: animals, fruits & veggies, things that go,
    // and nature kept; smileys dropped.
    expect(THEME_IDS).toEqual(["animals", "food", "vehicles", "nature"]);
    expect(DEFAULT_THEME).toBe("animals");
  });

  it.each(THEMES.map((t) => [t.id, t] as const))("%s carries enough distinct faces for the hardest deal", (_, t) => {
    expect(t.faces.length).toBeGreaterThanOrEqual(MAX_PAIRS);
    expect(new Set(t.faces.map((f) => f.id)).size).toBe(t.faces.length);
    // The ground is a matching clue on easy and medium, so two faces sharing
    // one would be a clue that points at the wrong card.
    expect(new Set(t.faces.map((f) => f.bg.toLowerCase())).size).toBe(t.faces.length);
  });

  it("names every theme and every face in every shipped language", () => {
    for (const t of THEMES) {
      for (const names of [t.name, ...t.faces.map((f) => f.name)]) {
        for (const l of ["en", "he", "es"] as const) expect(names[l].trim(), `${t.id} ${names.en} ${l}`).not.toBe("");
      }
    }
  });

  it("draws every face as balanced markup with no ids, defs or gradients", () => {
    // Each face is inlined twice per board; an id inlined twice is two
    // elements with one name (the same rule gameArt.ts states).
    for (const t of THEMES) {
      for (const f of t.faces) {
        for (const plain of [false, true]) {
          const svg = faceSvg(t, f, plain);
          expect(unbalanced(svg), `${t.id}/${f.id}`).toBeNull();
          expect(svg, `${t.id}/${f.id}`).not.toMatch(/\sid=|<defs|Gradient|url\(|NaN|undefined/);
        }
      }
      expect(unbalanced(backSvg(t)), t.id).toBeNull();
    }
  });

  it("the tag walk can fail, so its green means something", () => {
    expect(unbalanced("<svg><g><path/></svg>")).not.toBeNull();
    expect(unbalanced("<svg><g><path/></g></svg>")).toBeNull();
  });

  it("hides the ground on the plain (hard) card and only there", () => {
    for (const t of THEMES) {
      for (const f of t.faces) {
        const ground = faceSvg(t, f, false);
        const plain = faceSvg(t, f, true);
        expect(ground).toContain(`fill="${f.bg}"`);
        expect(ground).toContain(t.deco);
        expect(plain).not.toContain(`fill="${f.bg}"`);
        expect(plain).not.toContain(t.deco);
        // The picture itself is identical either way.
        expect(plain).toContain(f.art);
      }
    }
  });

  it("resolves an unknown theme to the default and an unknown face to nothing", () => {
    expect(themeOf("smileys").id).toBe("animals");
    expect(faceOf(themeOf("animals"), "dog")?.id).toBe("dog");
    expect(faceOf(themeOf("animals"), "🐶")).toBeUndefined();
  });
});
