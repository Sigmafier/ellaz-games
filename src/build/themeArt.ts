/**
 * THE THEMES' DRAWN PARTS - a torn edge, paper grain, crayon hatching, a night sky
 * of pixels - generated, never pasted.
 *
 * A theme sheet (src/ui/themes/<id>.css) asks for one by name:
 *
 *     background: art(tear, 360, 10, 7, #c8433a) 0 0 / 360px 10px repeat-x;
 *
 * and `expandArt` swaps the call for a `url("data:image/svg+xml,...")` while
 * src/build/themeSheets.ts builds the served file. So the sheet a person reads
 * stays a page of CSS, the picture is reproducible from the five numbers
 * beside it, and there is no committed literal whose generator could go
 * missing (.claude/rules/a-generator-of-committed-literals-lives-beside-them.md).
 *
 * EVERY PICTURE IS A PURE FUNCTION OF ITS ARGUMENTS. The "hand" in a torn edge
 * or a crayon stroke is a seeded generator, so one call always draws the same
 * thing: the sheet's content hash only moves when the sheet does, and two
 * builds of one tree serve one file.
 *
 * NODE ONLY, like themeSheets.ts: relative imports, no aliases, no DOM.
 */

/** Deterministic 0..1, one stream per seed. */
function hand(seed: number): () => number {
  let s = seed >>> 0 || 1;
  return () => {
    s = (Math.imul(s, 1664525) + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

const n1 = (v: number) => String(Math.round(v * 10) / 10);

function uri(svg: string): string {
  const body = svg
    .replace(/\s+/g, " ")
    .replace(/> </g, "><")
    .replace(/%/g, "%25")
    .replace(/#/g, "%23")
    .replace(/</g, "%3C")
    .replace(/>/g, "%3E")
    .replace(/"/g, "'");
  return `url("data:image/svg+xml,${body}")`;
}

const SVG = `xmlns='http://www.w3.org/2000/svg'`;

/**
 * A strip of torn paper hanging from the top edge. Tiles sideways: the first
 * and last point sit at the same height. `fill` is the paper, `core` the pale
 * fibre a real tear shows along its edge (pass `none` to leave it out).
 */
function tear(w: number, h: number, seed: number, fill: string, core = "none"): string {
  const rnd = hand(seed);
  const y0 = h * 0.45;
  const pts: Array<[number, number]> = [[0, y0]];
  let x = 0;
  for (;;) {
    x += 5 + rnd() * 9;
    if (x >= w - 6) break;
    const down = pts.length % 2 === 1;
    pts.push([x, down ? h * (0.62 + rnd() * 0.3) : h * (0.14 + rnd() * 0.3)]);
  }
  pts.push([w, y0]);
  const edge = pts.map(([a, b]) => `L${n1(a)} ${n1(b)}`).join("");
  const shape = (lift: number) =>
    `M0 0${pts.map(([a, b]) => `L${n1(a)} ${n1(Math.max(0, b - lift))}`).join("")}L${w} 0Z`;
  const fibre = core === "none" ? "" : `<path d='M0 0${edge}L${w} 0Z' fill='${core}'/>`;
  return uri(
    `<svg ${SVG} width='${w}' height='${h}' viewBox='0 0 ${w} ${h}' preserveAspectRatio='none'>${fibre}<path d='${shape(core === "none" ? 0 : 1.6)}' fill='${fill}'/></svg>`,
  );
}

/**
 * Grain: paper fibre, wax, the tooth of a card. A square tile of noise in one
 * ink colour, its strength the most opaque a speck gets (0..1).
 */
function grain(size: number, ink: string, strength: number, freq = 0.8, seed = 3): string {
  const [r, g, b] = rgb(ink);
  return uri(
    `<svg ${SVG} width='${size}' height='${size}'><filter id='n' x='0' y='0' width='100%' height='100%'>` +
      `<feTurbulence type='fractalNoise' baseFrequency='${freq}' numOctaves='2' seed='${seed}' stitchTiles='stitch'/>` +
      `<feColorMatrix values='0 0 0 0 ${n3(r)} 0 0 0 0 ${n3(g)} 0 0 0 0 ${n3(b)} ${n3(strength * 1.6)} 0 0 0 ${n3(-strength * 0.35)}'/>` +
      `</filter><rect width='${size}' height='${size}' filter='url(#n)'/></svg>`,
  );
}

const n3 = (v: number) => String(Math.round(v * 1000) / 1000);

function rgb(hex: string): [number, number, number] {
  const h = hex.replace("#", "");
  const full = h.length === 3 ? [...h].map((c) => c + c).join("") : h;
  if (!/^[0-9a-fA-F]{6}$/.test(full)) throw new Error(`theme art: "${hex}" is not a hex colour`);
  return [0, 2, 4].map((i) => parseInt(full.slice(i, i + 2), 16) / 255) as [number, number, number];
}

/**
 * Crayon hatching: slanted strokes of uneven weight with the wax breaking up
 * along them. A square tile that repeats; `gap` is the distance between
 * strokes and must divide `size`.
 */
function hatch(size: number, gap: number, ink: string, opacity: number, seed: number, lean = 1): string {
  if (size % gap !== 0) throw new Error(`theme art: hatch gap ${gap} must divide the tile ${size}`);
  const rnd = hand(seed);
  let strokes = "";
  for (let c = -size; c <= size * 2; c += gap) {
    const w = 3.2 + rnd() * 1.6;
    const o = opacity * (0.7 + rnd() * 0.3);
    const x1 = lean > 0 ? c : c + size;
    const x2 = lean > 0 ? c + size : c;
    strokes += `<path d='M${n1(x1)} ${size + 2}L${n1(x2)} -2' stroke='${ink}' stroke-width='${n1(w)}' stroke-opacity='${n3(o)}' stroke-linecap='round'/>`;
  }
  return uri(
    `<svg ${SVG} width='${size}' height='${size}' viewBox='0 0 ${size} ${size}'><filter id='w' x='0' y='0' width='100%' height='100%'>` +
      `<feTurbulence type='fractalNoise' baseFrequency='.55' numOctaves='2' seed='${seed}' stitchTiles='stitch' result='t'/>` +
      `<feColorMatrix in='t' values='0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 3.4 -.5' result='m'/>` +
      `<feComposite in='SourceGraphic' in2='m' operator='in'/></filter><g filter='url(#w)'>${strokes}</g></svg>`,
  );
}

/** A night sky of square pixels, a few of them bright. Tiles. */
function stars(size: number, count: number, seed: number, dim: string, bright: string): string {
  const rnd = hand(seed);
  let dots = "";
  for (let i = 0; i < count; i++) {
    const x = Math.floor((rnd() * size) / 2) * 2;
    const y = Math.floor((rnd() * size) / 2) * 2;
    const big = rnd() > 0.82;
    dots += `<rect x='${x}' y='${y}' width='${big ? 4 : 2}' height='${big ? 4 : 2}' fill='${big ? bright : dim}' fill-opacity='${n3(0.35 + rnd() * 0.5)}'/>`;
  }
  return uri(`<svg ${SVG} width='${size}' height='${size}' shape-rendering='crispEdges'>${dots}</svg>`);
}

type Draw = (...args: string[]) => string;

const num = (name: string, v: string | undefined, fallback?: number): number => {
  if (v === undefined || v === "") {
    if (fallback === undefined) throw new Error(`theme art: ${name} is missing a number`);
    return fallback;
  }
  const n = Number(v);
  if (!Number.isFinite(n)) throw new Error(`theme art: ${name} got "${v}", not a number`);
  return n;
};

/** Every picture a sheet may ask for. A name not here fails the build. */
export const ART: Record<string, Draw> = {
  tear: (w, h, seed, fill, core) => tear(num("tear", w), num("tear", h), num("tear", seed), fill, core),
  grain: (size, ink, strength, freq, seed) =>
    grain(num("grain", size), ink, num("grain", strength), num("grain", freq, 0.8), num("grain", seed, 3)),
  hatch: (size, gap, ink, opacity, seed, lean) =>
    hatch(num("hatch", size), num("hatch", gap), ink, num("hatch", opacity), num("hatch", seed), num("hatch", lean, 1)),
  stars: (size, count, seed, dim, bright) => stars(num("stars", size), num("stars", count), num("stars", seed), dim, bright),
};

const CALL = /\bart\(\s*([a-z]+)\s*((?:,[^(),]*)*)\)/g;

/** Swap every `art(name, ...)` in a sheet for the picture it names. */
export function expandArt(css: string, where = "a theme sheet"): string {
  const out = css.replace(CALL, (_, name: string, rest: string) => {
    const draw = ART[name];
    if (!draw) throw new Error(`${where}: art(${name}) is not a picture this build can draw`);
    const args = rest
      .split(",")
      .slice(1)
      .map((a) => a.trim());
    return draw(...args);
  });
  if (/\bart\(/.test(out.replace(/\/\*[\s\S]*?\*\//g, ""))) {
    throw new Error(`${where}: an art() call survived - check its commas and brackets`);
  }
  return out;
}
