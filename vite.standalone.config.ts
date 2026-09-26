/**
 * The STANDALONE single-game build: one game, one page, hosted by somebody else.
 *
 *   STANDALONE_GAME=snake npm run build:standalone
 *   npm run assert:standalone
 *
 * A SEPARATE CONFIG, NOT A BRANCH IN vite.config.ts, AND THAT IS THE POINT.
 * This target exists to publish a second copy of the games onto a host nothing
 * here can watch. The one thing it must never do is endanger the first copy -
 * the site a child actually loads. A branch inside the main config puts both
 * builds one typo apart; a separate file means the production build cannot
 * regress from this change at all. Rollback is deleting this file.
 *
 * The cost is duplicated `resolve.alias` and `build.target`. That is a real
 * drift risk and it is bounded: aliases fail loudly at build time, and every
 * property that actually matters for correctness here is asserted by
 * scripts/assert-standalone.mjs rather than trusted.
 *
 * WHAT IS DELIBERATELY ABSENT, AND WHY EACH ABSENCE IS LOAD-BEARING
 *
 *   VitePWA      - measured 2026-08-11: a relative-base build STILL emits
 *                  sw.js and workbox-*.js, so `base` alone does not drop it.
 *                  A service worker on a third-party origin caches their site
 *                  and its navigation fallback hijacks their routes.
 *   pagesPlugin  - it still emits all 52 prose pages under a relative base
 *                  (with correct absolute canonicals, so this is about size and
 *                  purpose, not correctness). A single-game bundle has no
 *                  business carrying the whole catalogue's prose.
 *   themeBoot    - inlines a no-flash script the standalone page does not need:
 *                  it has one theme, set statically in standalone.html.
 *
 * And the entry is `src/standalone.tsx`, never `src/main.tsx` - see the comment
 * at the top of that file for the analytics/cloud-sync reason, which is the
 * whole reason this target needed designing rather than configuring.
 */
import { execFileSync } from "node:child_process";
import { existsSync, readdirSync, readFileSync, renameSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath, URL } from "node:url";
import react from "@vitejs/plugin-react";
import { defineConfig, type Plugin } from "vite";
// Safe at config time for the same reason `src/build/routes.ts` reads it: the
// roster imports `meta.ts` files only, and those are DOM-free by contract.
// Never reach past it into a game module - `import("./src/games/snake")` would
// load Phaser inside this file.
import { GAMES } from "./src/portal/games";

const OUT_DIR_ROOT = "dist-standalone";

const gameId = process.env.STANDALONE_GAME;
if (!gameId) {
  throw new Error("STANDALONE_GAME is required, e.g. STANDALONE_GAME=snake");
}
const meta = GAMES.find((g) => g.id === gameId);
if (!meta) {
  throw new Error(
    `unknown game "${gameId}" - the roster has: ${GAMES.map((g) => g.id).join(", ")}`,
  );
}

/**
 * Mirrored in scripts/assert-standalone.mjs, which is a plain script and cannot
 * import this file. The same two-implementations arrangement as
 * `portal/paths.ts` against `build/routes.ts`, and safe for the same reason:
 * the gate FAILS on any drift, so the two cannot quietly disagree.
 *
 * `-dirty` is not decoration. A bundle built from an uncommitted tree is not
 * described by its HEAD sha, and saying so is what separates a stamp from a
 * sticker.
 */
function buildStamp(): string {
  const sha = execFileSync("git", ["rev-parse", "HEAD"], { encoding: "utf8" }).trim();
  const dirty = execFileSync("git", ["status", "--porcelain"], { encoding: "utf8" }).trim() !== "";
  return dirty ? `${sha}-dirty` : sha;
}

/**
 * Keep the other 22 games, and the cloud client, out of a one-game bundle.
 *
 * BOTH ARRIVE WITHOUT BEING WANTED, and neither is visible from the entry:
 *
 *   - `catalog.ts` holds a lazy loader per game, so Rollup emits all 23 plus
 *     Phaser. Measured before this hook: a SUDOKU bundle carried
 *     `phaser.esm-*.js` at 1,685 kB. Sudoku does not import Phaser; snake does.
 *   - `@sdk/index` statically re-exports `./cloudSync`, which dynamically
 *     imports `./cloud`. Nothing here calls `startCloudSync`, so the chunk is
 *     dead - and it still shipped, carrying `firestore.googleapis.com`,
 *     `identitytoolkit.googleapis.com` and `securetoken.googleapis.com` into
 *     an artifact bound for someone else's CDN.
 *
 * Dead bytes, in both cases. They would never have been fetched. They would
 * also have been sitting in a public zip labelled "Sudoku", which is how a
 * portal reviewer finds a Firestore endpoint in a game that claims to make no
 * network requests.
 *
 * Stubbed at RESOLUTION rather than pruned after the fact, because a chunk that
 * is never emitted cannot be forgotten later. Each stub THROWS: if this build
 * ever does reach for another game, that must be loud, not silently empty.
 *
 * IT MATCHES ON THE DIRECTORY, AND A DIRECTORY IS NOT AN ID. `2048` lives in
 * `src/games/n2048/` because a module name cannot start with a digit, so the
 * segment this regex captures is `n2048` and the id it was compared against is
 * `2048`. They differ, so THE CHOSEN GAME STUBBED ITSELF: the build succeeded,
 * every byte-level gate passed, and `dist-standalone/2048/` rendered "The game
 * didn't load" in a browser. Measured 2026-08-29, one day before that zip was
 * to be uploaded to itch. `gameDirFor()` resolves the directory from the id
 * instead of assuming they are the same word, and `sawOwnGame` below is the
 * control - a build that never resolved its own game's entry now refuses to
 * finish, which is the assertion that would have caught this on day one.
 */
function gameDirFor(id: string): string {
  const root = fileURLToPath(new URL("./src/games", import.meta.url));
  const wanted = new RegExp(`\\bid:\\s*"${id.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}"`);
  const hits = readdirSync(root, { withFileTypes: true })
    .filter((e) => e.isDirectory())
    .filter((e) => {
      const metaFile = join(root, e.name, "meta.ts");
      return existsSync(metaFile) && wanted.test(readFileSync(metaFile, "utf8"));
    })
    .map((e) => e.name);
  if (hits.length !== 1) {
    throw new Error(
      `expected exactly one src/games/*/meta.ts declaring id "${id}", found ${hits.length}` +
        (hits.length ? `: ${hits.join(", ")}` : ""),
    );
  }
  return hits[0];
}

function oneGameOnly(): Plugin {
  const STUB = "\0ellaz-standalone-stub";
  const other = /\/src\/games\/([^/]+)\/index\.tsx?$/;
  const cloud = /\/src\/sdk\/cloud\.ts$/;
  // The bug reporter, for exactly the reason the cloud client is stubbed: a
  // game bundle runs on somebody else's domain, and a game may fetch nothing
  // off-site. That rule is why this SDK is listable on a portal at all. The
  // whole directory rather than `send.ts` alone - the sheet is useless
  // without a transport, and a stub that throws is louder than a dead button.
  const report = /\/src\/report\//;
  const ownDir = gameDirFor(meta!.id);
  let sawOwnGame = false;
  return {
    name: "ellaz-standalone-one-game",
    enforce: "pre",
    // RESOLVE FIRST, then match. `resolveId` is handed the raw specifier, and
    // catalog.ts writes `import("../games/snake/index")` - a string containing
    // no `src/` at all. The first version of this hook matched the specifier
    // directly, fired on nothing, and produced a byte-identical bundle that
    // looked exactly like a working one. Only the gate's output disagreed.
    async resolveId(source, importer, options) {
      if (!importer) return null;
      const resolved = await this.resolve(source, importer, { ...options, skipSelf: true });
      if (!resolved) return null;
      const id = resolved.id.replace(/\\/g, "/");
      if (cloud.test(id) || report.test(id)) return STUB;
      const match = other.exec(id);
      if (match && match[1] !== ownDir) return STUB;
      if (match) sawOwnGame = true;
      return null;
    },
    load(id) {
      if (id !== STUB) return null;
      return `export default new Proxy({}, { get() {
        throw new Error("standalone bundle for ${meta!.id}: another game or the cloud client was reached; this build ships neither");
      }});`;
    },
    // THE CONTROL. Without it this plugin cannot tell "I kept the right game"
    // from "I stubbed every game including the one I was built for" - both look
    // like a clean build and only one of them plays.
    //
    // IN `generateBundle`, NOT `buildEnd`. A throw in `buildEnd` does fail the
    // build (exit 1), but rollup then still runs `closeBundle`, whose own
    // failure is the one printed - so the operator reads "no remote @import
    // found" and goes looking at the CSS. Measured 2026-08-29 while proving
    // this control fires.
    generateBundle() {
      if (!sawOwnGame) {
        throw new Error(
          `the standalone build for "${meta!.id}" never resolved src/games/${ownDir}/index - ` +
            "its own game module was stubbed out, so this bundle would render nothing",
        );
      }
    },
  };
}

/**
 * Everything that has to happen to the FINISHED files, in one plugin and in order.
 *
 * TWO jobs, and they were two plugins until the stack trace said `hookParallel`:
 * Rollup runs every plugin's `closeBundle` CONCURRENTLY, so a strip in one and a
 * rename in the other race each other and read half-written state. Merged, the
 * order is the order of the statements and there is nothing to reason about.
 *
 * 1. DROP THE GOOGLE FONTS @import - RETIRED 2026-09-20, and the retirement is
 *    the interesting part. `src/ui/global.css:5` used to pull Heebo and Fredoka
 *    from `fonts.googleapis.com`; a webfont fetch is an external request from a
 *    game, the one thing this artifact promises not to make, and it hands a
 *    child's IP to Google from a page hosted by a third party. It was found by
 *    loading the built bundle in a real browser and reading the network panel,
 *    because the request is one `@import` line that looks nothing like a
 *    phone-home.
 *
 *    Then 2026-09-07 SELF-HOSTED the fonts for unrelated reasons (1,300 ms of
 *    blocked mobile render - see
 *    `.claude/rules/a-font-behind-an-import-is-invisible-to-every-preload.md`).
 *    There has been no remote `@import` to strip since, so this step threw on
 *    every build for thirteen days - and nobody saw it, because nobody built a
 *    standalone bundle in that window. The throw was RIGHT: it is what the step
 *    was told to do rather than go quietly inert.
 *
 *    It is deleted rather than relaxed, on its own instruction. The invariant it
 *    guarded is now held by `externalOrigins()` in `scripts/assert-standalone.mjs`,
 *    which is strictly stronger: it reads every text file in the shipped tree
 *    rather than only the CSS, it is an allowlist of namespace hosts rather than
 *    a denylist of vendors, and it carries a planted `webfont origin` control
 *    among its 14. A guard that asserts a MECHANISM dies when the mechanism is
 *    replaced by a better one; a guard that asserts the INVARIANT does not.
 *
 * 2. NAME THE ENTRY `index.html`. itch wants the entry point there, in its own
 *    words. Vite names the output after the INPUT file, and the input cannot be
 *    `index.html` because the real app already owns that name at the repo root.
 *
 * The rename asserts rather than no-ops. An inert step here is how a bundle
 * ships that itch cannot start.
 *
 * KNOWN AND ACCEPTED: editing the CSS here is AFTER Vite computed its content
 * hash, so `standalone-<hash>.css` no longer describes its own contents. That
 * matters on a host doing hash-keyed caching and does not matter on itch, which
 * serves a freshly uploaded zip. Do not copy this shape into the main build,
 * where the hash IS the cache key and a lying one is the deploy-ledger bug in
 * miniature. If it ever needs to be honest, strip in a `transform` before the
 * hash instead - which means fighting Vite's CSS plugin ordering, and that is
 * exactly the fight this arrangement was chosen to avoid.
 */
function finalizeBundle(outDir: string): Plugin {
  return {
    name: "ellaz-standalone-finalize",
    closeBundle() {
      // A FAILED BUILD STILL REACHES HERE. Rollup runs closeBundle after an
      // upstream hook throws, so the assertions below would fire against an
      // unwritten tree and PRINT OVER the real error - measured 2026-08-29,
      // where the one-game control's message was replaced by "no remote
      // @import found in 0 css file(s)" and sent the reader to the CSS.
      // `standalone.html` exists only once the write completed.
      if (!existsSync(join(outDir, "standalone.html"))) return;

      const from = join(outDir, "standalone.html");
      if (!existsSync(from)) {
        throw new Error(`expected ${from} to exist before renaming it to index.html`);
      }
      renameSync(from, join(outDir, "index.html"));
    },
  };
}

/** Fill the placeholders in standalone.html. */
function stampPlugin(): Plugin {
  return {
    name: "ellaz-standalone-stamp",
    transformIndexHtml(html) {
      const filled = html
        .replaceAll("__ELLAZ_COMMIT__", buildStamp())
        .replaceAll("__ELLAZ_GAME__", meta!.id)
        .replaceAll("__ELLAZ_TITLE__", `${meta!.title.en} - Ellaz`);
      // A placeholder that survives means a rename went one way only, and the
      // symptom would be the literal string `__ELLAZ_GAME__` shipped as a game
      // id: a bundle that renders and mounts nothing.
      if (filled.includes("__ELLAZ_")) {
        throw new Error("a standalone.html placeholder was left unfilled");
      }
      return filled;
    },
  };
}

export default defineConfig({
  // Relative, because itch serves from a CDN subdirectory whose path we never
  // see. Measured on this plugin set: 0 absolute refs, 32 relative ones.
  base: "./",
  plugins: [oneGameOnly(), react(), stampPlugin(), finalizeBundle(`${OUT_DIR_ROOT}/${meta.id}`)],
  resolve: {
    alias: {
      "@sdk": fileURLToPath(new URL("./src/sdk", import.meta.url)),
      "@ui": fileURLToPath(new URL("./src/ui", import.meta.url)),
      "@juice": fileURLToPath(new URL("./src/juice", import.meta.url)),
      "@i18n": fileURLToPath(new URL("./src/i18n", import.meta.url)),
      "@shared": fileURLToPath(new URL("./src/shared", import.meta.url)),
    },
  },
  build: {
    target: "es2022",
    // Its own tree, never `dist/`. `build:check` writes and reads `dist/`, so
    // sharing it would let a standalone bug red the gate that protects the real
    // site - or, worse, ship.
    outDir: `${OUT_DIR_ROOT}/${meta.id}`,
    emptyOutDir: true,
    rollupOptions: {
      input: fileURLToPath(new URL("./standalone.html", import.meta.url)),
    },
  },
});
