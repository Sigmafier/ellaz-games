// The cast this game draws, and the one place that says which character plays
// which part. Beside the scene rather than in `@shared`, so every byte of it
// rides the lazy `game-survivors-*` chunk and a child who never opens this game
// downloads none of it.
//
// WHY A URL AT ALL. Phaser's `load.atlas(key, textureURL, atlasURL)` wants two
// URLs, and Vite content-hashes every emitted asset - so the sheet and its atlas
// have unrelated names at build time and cannot be derived from one base path.
// That is exactly why `loadStudioAtlas` in the copied adapter is unusable here
// and the scene calls `load.atlas` itself. The manifest comes in as a parsed
// object instead, because the scene reads its clips and pivot directly.
//
// WHY THE SHEETS USE `new URL(...)` AND THE ATLASES USE `?url` - TWO FORMS ON
// PURPOSE, and the asymmetry is measured rather than stylistic.
//
// `import png from "./sprites/robot.png?url"` does not build. Not in the app: in
// `vite.config.ts`. Vite pre-bundles its own config with esbuild, esbuild has no
// `.png` loader, and the config's import graph reaches this file:
//
//   vite.config.ts -> src/build/pages.ts -> src/portal/games.ts
//     -> src/portal/gamesRest.ts   <- 28 dynamic import() loaders sit beside
//                                     the metas, and esbuild follows them
//       -> games/survivors/index.ts -> SurvivorsGame.tsx
//         -> import("./SurvivorsScene") -> this file -> the .png
//
// The error names THIS file while no static import path to it exists, which is
// what makes it hard to read: `games.ts` is imported for metadata and drags the
// whole loader module in behind it. `new URL("./x.png", import.meta.url).href`
// is not an import statement, so esbuild leaves it alone and never needs a
// loader, while Vite still rewrites it to the hashed URL for the app build.
// Bisected 2026-09-12: swapping ONLY the five sheets and leaving all five
// `.atlas.json?url` imports in place built clean, so `?url` on JSON is fine and
// raster was the whole fault. Both forms emit identical hashed assets.
//
// `assetsInlineLimit` is Vite's default 4096 B and the smallest sheet is 7.9 KB,
// so all five emit as real files rather than base64 inside the chunk - measured
// on the built artifact: 7.9 / 11.0 / 12.2 / 16.8 / 26.1 KB under `dist/assets/`.
// The workbox `globPatterns` sweeps html/css/js/svg/woff2 and NOT raster, so no
// sheet can reach the precache and no `globIgnores` entry is owed - unlike a new
// JS chunk, which would need all three changes
// (.claude/rules/precache-glob-sweeps-new-chunks.md).

import type { Manifest } from "@shared/sprites/manifest";
import type { Enemy, EnemyKind } from "./logic";
import { KINDS, radiusOf } from "./enemies";

const robotPng = new URL("./sprites/robot.png", import.meta.url).href;
import robotAtlas from "./sprites/robot.atlas.json?url";
import robotManifest from "./sprites/robot.manifest.json";

const batPng = new URL("./sprites/bat.png", import.meta.url).href;
import batAtlas from "./sprites/bat.atlas.json?url";
import batManifest from "./sprites/bat.manifest.json";

const slimePng = new URL("./sprites/slime.png", import.meta.url).href;
import slimeAtlas from "./sprites/slime.atlas.json?url";
import slimeManifest from "./sprites/slime.manifest.json";

const crabPng = new URL("./sprites/crab.png", import.meta.url).href;
import crabAtlas from "./sprites/crab.atlas.json?url";
import crabManifest from "./sprites/crab.manifest.json";

const golemPng = new URL("./sprites/golem.png", import.meta.url).href;
import golemAtlas from "./sprites/golem.atlas.json?url";
import golemManifest from "./sprites/golem.manifest.json";

export type CastKey = "robot" | "bat" | "slime" | "crab" | "golem";

export interface CastEntry {
  /** The hashed URL of the sheet. */
  png: string;
  /** The hashed URL of the atlas JSON. */
  atlas: string;
  manifest: Manifest;
}

/**
 * The five clip ids every studio character carries. Written out rather than read
 * from a manifest at runtime because `assert-tier.mjs` greps this game's SOURCE
 * for all five as quoted strings - a showcase game that only ever names two of
 * them has not wired the other three, and the gate is right to say so.
 */
export const CLIPS = ["idle", "walk", "attack", "hurt", "ko"] as const;
export type Clip = (typeof CLIPS)[number];

/**
 * Body units per authored pixel, from the studio's own rig. DERIVED rather than
 * typed in: at `unit = 5` and an export `scale` of 1, one authored pixel is a
 * 5x5 block on the sheet, so drawing at 1/(5 * scale) puts exactly one authored
 * pixel on one arena unit and the pixel grid survives. Re-exporting at scale 2
 * changes the manifest and this follows it; a hardcoded 0.2 would silently
 * halve the cast.
 *
 * Measured 2026-09-12 against all five manifests - the hierarchy falls out of
 * the ART rather than out of per-character constants, which is why one rule
 * serves the whole cast:
 *
 *     robot 48   crab 30   bat 27   slime 23   golem 61   (arena units tall)
 *
 * The arena is 420x560 and its canvas FITs to at most 420 CSS px, so an arena
 * unit is at most one CSS pixel and the art is never upscaled past 1:1.
 */
const UNIT = 5;
export const scaleFor = (m: Manifest): number => 1 / (UNIT * m.scale);

/**
 * Which kind each sheet was DRAWN at true size for.
 *
 * `scaleFor` puts one authored pixel on one arena unit, so a sheet drawn for a
 * runner renders a runner correctly and renders a warden - three times its
 * collision radius - at exactly the same size. Three of the seven kinds share a
 * sheet with a bigger or smaller sibling, and the comment on `FOR_ENEMY` has
 * claimed since 2026-09-21 that "the SIZE is what says which is which". Nothing
 * implemented it. This table is the half that was missing.
 */
const NATIVE: Partial<Record<CastKey, EnemyKind>> = {
  bat: "runner",
  slime: "orb",
  crab: "brute",
  golem: "golem",
};

/**
 * How big to draw one enemy, as a Phaser scale.
 *
 * THE PICTURE IS DERIVED FROM THE HITBOX, which is the only version of this
 * that cannot drift: `radiusOf` already carries the kind's radius AND the
 * elite multiplier, so an elite is bigger for the same reason it is harder to
 * miss, and a warden is a giant bat because its radius says so.
 *
 * WHY THIS FUNCTION EXISTS AT ALL. It was one line inside `SurvivorsScene.ts`
 * and it shipped live drawing every enemy FIVE TIMES too big, because that line
 * called `setScale(e.elite ? ELITE.r : 1)` every frame and the `1` replaced the
 * `scaleFor(manifest)` the sprite was born with. Nothing in this repo can drive
 * a Phaser scene, so no test could have failed - the same trap the boss bar hit
 * in the same arc, fixed the same way: move the arithmetic somewhere a test can
 * reach it and leave the scene holding nothing but the call.
 */
export function enemyScale(e: Pick<Enemy, "kind" | "elite">): number {
  const key = FOR_ENEMY[e.kind];
  const native = NATIVE[key];
  // A sheet with no native kind would be a new cast member nobody sized; draw
  // it at true size rather than guessing, and let the missing row be visible.
  const base = scaleFor(CAST[key].manifest);
  if (!native) return base;
  return base * (radiusOf(e) / KINDS[native].r);
}

/**
 * `meta.image` inside each atlas names the studio's own export filename
 * (`robot--snes16.png`), which is NOT what ships here. Phaser fetches the
 * `textureURL` it is handed and reads only the frame table out of the atlas, so
 * the mismatch is inert - noted because it looks like a bug on every first read.
 */
export const CAST: Record<CastKey, CastEntry> = {
  robot: { png: robotPng, atlas: robotAtlas, manifest: robotManifest as unknown as Manifest },
  bat: { png: batPng, atlas: batAtlas, manifest: batManifest as unknown as Manifest },
  slime: { png: slimePng, atlas: slimeAtlas, manifest: slimeManifest as unknown as Manifest },
  crab: { png: crabPng, atlas: crabAtlas, manifest: crabManifest as unknown as Manifest },
  golem: { png: golemPng, atlas: golemAtlas, manifest: golemManifest as unknown as Manifest },
};

export const CAST_KEYS = Object.keys(CAST) as CastKey[];

/** The ship. A hero at 48 units, the tallest thing in the arena until the boss. */
export const PLAYER: CastKey = "robot";

/**
 * Which character plays each shape, and the sizes are why.
 *
 * `runner` is the small fast one (r 9) -> the BAT at 27 units.
 * `orb` drifts and takes two hits (r 12) -> the SLIME at 23.
 * `brute` is the slow tough one (r 17) -> the CRAB at 30.
 *
 * `golem` is the BOSS, added here 2026-09-12. It is in this table because the
 * table is a `Record<EnemyKind, CastKey>` and `golem` is now an `EnemyKind` -
 * which is the useful half: adding the kind to `logic.ts` broke THIS file at
 * compile time and named it, rather than leaving a boss with no picture to find
 * in a browser. Being in this table does NOT put it in the spawn pool; `kindsAt`
 * decides that, it never returns `golem`, and `boss.test.ts` pins both halves.
 *
 * ONE MISMATCH WORTH WATCHING, measured rather than discovered in play: `brute`
 * collides at r 17, a 34-unit circle, against a crab drawn 30 units tall - so it
 * hits very slightly wider than it looks. Art larger than its hitbox is the
 * forgiving direction and the other two have it; this one is the other way by
 * four units. Eyeball it before deciding whether the crab wants a nudge.
 */
export const FOR_ENEMY: Record<EnemyKind, CastKey> = {
  runner: "bat",
  orb: "slime",
  brute: "crab",
  // THE THREE NEW SHAPES REUSE THE FIVE SHEETS, and that is a decision rather
  // than a shortcut. A new character costs a sprite sheet, and the five here
  // emit as real files under `dist/assets/` at 7.9 to 26.1 KB each; three more
  // would be the only part of the stages work that cost a first visit anything.
  //
  // It also reads correctly: the warden IS a giant bat, the queen IS a giant
  // crab, and a shard IS a small golem. The SIZE is what says which is which,
  // and `enemyScale` below is what MAKES it so - this comment claimed it for a
  // day while nothing implemented it, and a warden drew exactly as big as a
  // runner. A sentence is not a mechanism.
  shard: "golem",
  // THE TWO THAT SHOOT BACK WEAR AN EXISTING CHARACTER, 2026-09-21, and that is
  // a deliberate deferral rather than an oversight. New art is a STUDIO job -
  // painted on the rig by `studio/tools/roster-painter`, exported at snes16 and
  // copied in by `scripts/sprites/sync-sprites.mjs` - which is the
  // `add-a-pixel-character` skill's whole recipe, a day's work with its own nine
  // gates, and none of it is this change.
  //
  // So they are ELITES of the shape they are built from, which is a read that
  // works rather than an excuse: a spitter is an orb that learned to spit and a
  // lancer is a brute with a gun. The scene dresses both - a standing tint in the
  // kind's own ink, drawn larger, and a ring that says "this one shoots" - and
  // what really tells them apart is BEHAVIOUR: they stop, they glow, and then a
  // bolt comes out.
  spitter: "slime",
  lancer: "crab",
  warden: "bat",
  queen: "crab",
  golem: "golem",
};
