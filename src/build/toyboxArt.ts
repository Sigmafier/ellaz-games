import { Resvg } from "@resvg/resvg-js";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { ART_HEIGHT, ART_WIDTH } from "./artFiles";
import { TOYBOX_LIST } from "../content/toybox";
import { toyboxPagePath } from "./routes";

/**
 * The picture of a Toybox game, for its page here and for its share card.
 *
 * WHERE THE PIXELS COME FROM, and why not from `studio/`. The Brawl's hero is
 * the studio's `robot` in the `snes16` style. `src/` may not import `studio/`
 * - the two workspaces share a repo and nothing else - and this page must not
 * depend on `dist/toybox/` either, which the deploy writes AFTER this build.
 * But the same robot already ships INSIDE this tree: Neon Survival carries it
 * as `src/games/survivors/sprites/robot.png`, copied across by the studio's
 * bridge (commit ef7901ae, "studio art reaches a shipping game, by copy and
 * never by import"). Same character, same style, the sheet exported at half
 * the studio's scale. So the picture is read from there, one frame of it, and
 * no new asset is committed.
 *
 * ONE FRAME, NEVER THE SHEET. The sheet is 2450x1650 - thirty frames - and a
 * page showing it would be a filmstrip. The frame's rectangle comes from the
 * sheet's own atlas rather than from a number typed here, so a re-export that
 * moves the frame moves this picture with it; a frame that is gone throws.
 *
 * FRAMED ON THE SPRITE, NOT ON THE CELL. A cell is 490x330 and the robot fills
 * about half of it, so it is measured: the frame is rasterised once and its
 * opaque pixels bound the crop. Then it is scaled with nearest-neighbour
 * (`image-rendering="optimizeSpeed"`) so the pixel art stays pixel art.
 *
 * BUILD-TIME ONLY. `src/build` ships to nobody; the rasteriser costs a first
 * visit nothing.
 */

/** Which sheet and which frame draw each Toybox page's picture, by `ToyboxEntry.id`. */
const SOURCES: Record<string, { sheet: string; atlas: string; frame: string }> = {
  // The punch with the star: the one frame that says "brawler" at a glance.
  brawl: {
    sheet: "../games/survivors/sprites/robot.png",
    atlas: "../games/survivors/sprites/robot.atlas.json",
    frame: "robot_attack_0002",
  },
};

/** The ground the robot stands on - the share card's own bar colour, so a card's letterbox is invisible. */
export const TOYBOX_GROUND = "#241C3B";

interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}

interface Sprite {
  /** The whole sheet, as a data URI resvg can embed. */
  href: string;
  sheetW: number;
  sheetH: number;
  /** The drawn part of the frame, in sheet pixels. */
  box: Rect;
}

const sprites = new Map<string, Sprite>();

function sourceOf(id: string) {
  const src = SOURCES[id];
  if (!src) {
    throw new Error(
      `toyboxArt: no picture source for Toybox page "${id}". Add one to SOURCES in ` +
        `src/build/toyboxArt.ts - a page with no picture is a result with no thumbnail.`,
    );
  }
  return src;
}

function sprite(id: string): Sprite {
  const cached = sprites.get(id);
  if (cached) return cached;
  const src = sourceOf(id);
  const png = readFileSync(new URL(src.sheet, import.meta.url));
  const atlas = JSON.parse(readFileSync(new URL(src.atlas, import.meta.url), "utf8")) as {
    frames: Record<string, { frame: Rect }>;
  };
  const cell = atlas.frames[src.frame]?.frame;
  if (!cell) throw new Error(`toyboxArt: ${src.atlas} has no frame "${src.frame}"`);
  // PNG IHDR: width and height are the two big-endian words at byte 16.
  const sheetW = png.readUInt32BE(16);
  const sheetH = png.readUInt32BE(20);
  const href = `data:image/png;base64,${png.toString("base64")}`;

  // Rasterise the cell alone, 1:1, and bound its opaque pixels.
  const cellSvg =
    `<svg xmlns="http://www.w3.org/2000/svg" width="${cell.w}" height="${cell.h}" ` +
    `viewBox="${cell.x} ${cell.y} ${cell.w} ${cell.h}">` +
    `<image href="${href}" width="${sheetW}" height="${sheetH}" image-rendering="optimizeSpeed"/></svg>`;
  const img = new Resvg(cellSvg).render();
  const px = img.pixels;
  let x0 = img.width;
  let y0 = img.height;
  let x1 = -1;
  let y1 = -1;
  for (let y = 0; y < img.height; y++) {
    for (let x = 0; x < img.width; x++) {
      if (px[(y * img.width + x) * 4 + 3]! > 8) {
        if (x < x0) x0 = x;
        if (x > x1) x1 = x;
        if (y < y0) y0 = y;
        if (y > y1) y1 = y;
      }
    }
  }
  // A frame with nothing drawn in it would be a flat slab with the right name.
  if (x1 < 0) throw new Error(`toyboxArt: frame "${src.frame}" of ${src.sheet} is fully transparent`);
  const s: Sprite = {
    href,
    sheetW,
    sheetH,
    box: { x: cell.x + x0, y: cell.y + y0, w: x1 - x0 + 1, h: y1 - y0 + 1 },
  };
  sprites.set(id, s);
  return s;
}

/**
 * The picture as an SVG document of `w` x `h`, the sprite centred on the ground
 * and scaled to fill `fill` of the shorter room.
 *
 * The scale is rounded DOWN to a multiple of 0.25, so the sprite's own pixel
 * blocks land on whole device pixels at every size this is asked for rather
 * than alternating 7 and 8 wide.
 */
export function toyboxArtSvg(id: string, w: number, h: number, fill = 0.8): string {
  const s = sprite(id);
  const raw = Math.min((w * fill) / s.box.w, (h * fill) / s.box.h);
  const scale = Math.max(0.25, Math.floor(raw * 4) / 4);
  const dw = s.box.w * scale;
  const dh = s.box.h * scale;
  return (
    `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">` +
    `<rect width="${w}" height="${h}" fill="${TOYBOX_GROUND}"/>` +
    `<svg x="${(w - dw) / 2}" y="${(h - dh) / 2}" width="${dw}" height="${dh}" ` +
    `viewBox="${s.box.x} ${s.box.y} ${s.box.w} ${s.box.h}">` +
    `<image href="${s.href}" width="${s.sheetW}" height="${s.sheetH}" image-rendering="optimizeSpeed"/>` +
    `</svg></svg>`
  );
}

/** The picture rasterised at `w` x `h`. Synchronous, so the pure page emitter can name it by hash. */
export function toyboxArtPng(id: string, w: number, h: number): Uint8Array {
  return new Resvg(toyboxArtSvg(id, w, h), { fitTo: { mode: "width", value: w } }).render().asPng();
}

const pagePngs = new Map<string, Uint8Array>();

/** The page's own picture: 1200x900, the same 4:3 box every game page's art declares. */
function pagePng(id: string): Uint8Array {
  let png = pagePngs.get(id);
  if (!png) {
    png = toyboxArtPng(id, ART_WIDTH, ART_HEIGHT);
    pagePngs.set(id, png);
  }
  return png;
}

/**
 * `games/toybox-brawl/hero-3f9a1c2e.png` - BESIDE the page that embeds it.
 *
 * NOT under `art/`. That directory is the roster's own scenes, one SVG per
 * game, and `assert-pages.mjs` holds every file in it to being an SVG a game
 * page embeds; a raster from another workspace is a different thing and gets
 * its own place rather than an exemption in that check.
 *
 * CONTENT-HASHED for the reason `artFile` is: the deploy's `mirror` pass can
 * only trust a name that changes when its bytes do. Never precached: the
 * workbox glob sweeps html/css/js/svg/woff2 and not raster, and `games/**` is
 * in `globIgnores` besides.
 */
export function toyboxArtFile(id: string): string {
  const entry = TOYBOX_LIST.find((t) => t.id === id);
  // Resolve the picture first: an id with no picture source throws there,
  // naming the missing SOURCES entry, which is the more useful of the two.
  const hash = createHash("sha256").update(pagePng(id)).digest("hex").slice(0, 8);
  if (!entry) throw new Error(`toyboxArt: no Toybox page "${id}" in src/content/toybox.ts`);
  return `${toyboxPagePath(entry.slug, entry.locale).slice(1)}hero-${hash}.png`;
}

/** For an `<img src>`: served by a host, so it carries the base. */
export function toyboxArtHref(base: string, id: string): string {
  return `${base}${toyboxArtFile(id)}`;
}

/** For a canonical URL - JSON-LD. The base belongs to a host, not an identity. */
export function toyboxArtPath(id: string): string {
  return `/${toyboxArtFile(id)}`;
}

/** Every Toybox page picture this build writes, BINARY - so it is emitted beside the share cards, not by `allEmittedFiles`. */
export function toyboxArtFiles(ids: string[]): Array<{ fileName: string; png: Uint8Array }> {
  return ids.map((id) => ({ fileName: toyboxArtFile(id), png: pagePng(id) }));
}
