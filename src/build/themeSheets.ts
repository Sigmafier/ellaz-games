/**
 * THE THEME SHEETS - one stylesheet per picked-only theme, served beside the
 * bundle and fetched by nobody who has not chosen that theme.
 *
 * Paper, Crayon, Flat and Arcade (the style round, 2026-09-27) each live in
 * `src/ui/themes/<id>.css`. That file is NOT imported by the app, so no chunk
 * and no first visit ever carries it. This module turns each one into a served
 * file:
 *
 *   `@import "./fonts/<slug>.css"`  inlined, so the served sheet has no @import
 *                                   (a resource behind one is invisible to the
 *                                   preload scanner and blocks late)
 *   `url(./<slug>-latin.woff2)`     renamed to a content-hashed font file
 *   `art(tear, 360, 10, 7, #c8433a)` drawn: a torn edge, grain, a crayon line
 *                                   (src/build/themeArt.ts), as a data URI
 *   the whole sheet                 minified, then named
 *                                   `assets/theme-<id>-<H>.css`
 *
 * H is ONE hash over every sheet, so the boot script can build any theme's URL
 * from `prefix + id + suffix` without carrying a table of names in the first
 * visit. `**\/assets/*.css` and `**\/*.woff2` are already in the precache's
 * globIgnores, so none of these reaches the service worker's install either.
 *
 * NODE ONLY, loaded by vite.config.ts at config time: relative imports, no
 * aliases (see the header of src/ui/themes.ts for why).
 */
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";
import type { Plugin } from "vite";
import { THEMES, type ThemeSheetHref } from "../ui/themes";
import { expandArt } from "./themeArt";

const DIR = join(dirname(fileURLToPath(import.meta.url)), "..", "ui", "themes");

export interface ServedFile {
  readonly fileName: string;
  readonly source: string | Uint8Array;
}

const hash8 = (b: string | Uint8Array) => createHash("sha256").update(b).digest("hex").slice(0, 8);

/** The ids that ship a sheet, read from the one list - never typed here. */
export const SHEET_THEMES = THEMES.filter((t) => t.sheet).map((t) => t.id);

/**
 * esbuild, loaded only when a sheet is actually minified. Imported at the top
 * it breaks every jsdom test that renders a page (esbuild refuses jsdom's
 * TextEncoder), and those tests only need the URL, which comes from the hash.
 */
function minify(css: string): string {
  const esbuild = createRequire(import.meta.url)("esbuild") as {
    transformSync: (code: string, opts: { loader: "css"; minify: boolean }) => { code: string };
  };
  return esbuild.transformSync(css, { loader: "css", minify: true }).code;
}

/** One theme's sheet, fonts inlined and renamed, NOT yet minified. Throws on a gap. */
function buildOne(id: string, fonts: Map<string, ServedFile>): string {
  let css = readFileSync(join(DIR, `${id}.css`), "utf8");
  css = css.replace(/@import\s+"\.\/fonts\/([a-z0-9-]+)\.css";/g, (_, slug: string) =>
    readFileSync(join(DIR, "fonts", `${slug}.css`), "utf8"),
  );
  if (/@import/.test(css.replace(/\/\*[\s\S]*?\*\//g, ""))) {
    throw new Error(`theme sheet ${id}: an @import survived inlining - a served sheet must carry none`);
  }
  css = css.replace(/url\(\.\/([a-z0-9-]+)\.woff2\)/g, (_, name: string) => {
    const bytes = readFileSync(join(DIR, "fonts", `${name}.woff2`));
    const fileName = `assets/${name}-${hash8(bytes)}.woff2`;
    fonts.set(fileName, { fileName, source: bytes });
    return `url(./${fileName.slice("assets/".length)})`;
  });
  // Last, so a picture's own `url("data:...")` is never read as a font.
  return expandArt(css, `theme sheet ${id}`);
}

/** The sheets before minifying, the fonts they name, and the hash over both. */
function sources() {
  const fonts = new Map<string, ServedFile>();
  const sheets = SHEET_THEMES.map((id) => [id, buildOne(id, fonts)] as const);
  // Font names are content hashes and appear in the sheets, so hashing the
  // sheets covers the fonts too.
  const hash = hash8(sheets.map(([id, css]) => `${id}\n${css}`).join("\n"));
  return { hash, sheets, fonts };
}

/** Every served file - the sheets and the fonts they name - and the shared hash. */
export function themeSheetFiles(): { hash: string; files: ServedFile[] } {
  const { hash, sheets, fonts } = sources();
  return {
    hash,
    files: [
      ...sheets.map(([id, css]) => ({ fileName: `assets/theme-${id}-${hash}.css`, source: minify(css) })),
      ...fonts.values(),
    ],
  };
}

let memo: string | undefined;

/** Where the boot script and the picker find a theme's sheet, under `base`. */
export function themeSheetHref(base: string): ThemeSheetHref {
  memo ??= sources().hash;
  return { prefix: `${base}assets/theme-`, suffix: `-${memo}.css` };
}

/**
 * Emits the files into the build, and serves them in dev. Dev rebuilds on
 * every request and ignores the hash in the URL, so an edited sheet shows on
 * the next reload without restarting the server.
 */
export function themeSheetsPlugin(): Plugin {
  return {
    name: "ellaz-theme-sheets",
    generateBundle() {
      for (const f of themeSheetFiles().files) {
        this.emitFile({ type: "asset", fileName: f.fileName, source: f.source });
      }
    },
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        const m = /\/assets\/(theme-[a-z]+|[a-z0-9-]+-latin)-[0-9a-f]{8}\.(css|woff2)(\?|$)/.exec(req.url ?? "");
        if (!m) return next();
        const { files } = themeSheetFiles();
        const want = new RegExp(`^assets/${m[1]}-[0-9a-f]{8}\\.${m[2]}$`);
        const hit = files.find((f) => want.test(f.fileName));
        if (!hit) return next();
        res.setHeader("Content-Type", m[2] === "css" ? "text/css" : "font/woff2");
        res.setHeader("Cache-Control", "no-store");
        res.end(hit.source);
      });
    },
  };
}
