// The cast this game draws, and the one place that says which studio character
// plays which part.
//
// Beside the scene rather than in `@shared`, so every byte of it rides the lazy
// `game-holdtheline-*` chunk and a child who never opens this game downloads
// none of it.
//
// THE SHEETS USE `new URL(...)` AND THE ATLASES USE `?url` - two forms on
// purpose, and the asymmetry is measured rather than stylistic. `import png
// from "./sprites/x.png?url"` does not build: Vite pre-bundles `vite.config.ts`
// with esbuild, esbuild has no `.png` loader, and the config's import graph
// reaches this file through `portal/games.ts` -> `gamesRest.ts` -> this game's
// loader. The error names THIS file while no static import path to it exists,
// which is what makes it unreadable if you have not met it. `new URL(...,
// import.meta.url).href` is not an import statement, so esbuild leaves it alone
// while Vite still rewrites it to the hashed URL. Bisected 2026-09-12 on
// survivors; `?url` on JSON is fine and raster was the whole fault.

import type { Manifest } from "@shared/sprites/manifest";
import { KIND } from "./logic";
import type { WalkerKind } from "./types";

const knightPng = new URL("./sprites/knight.png", import.meta.url).href;
import knightAtlas from "./sprites/knight.atlas.json?url";
import knightManifest from "./sprites/knight.manifest.json";

const ninjaPng = new URL("./sprites/ninja.png", import.meta.url).href;
import ninjaAtlas from "./sprites/ninja.atlas.json?url";
import ninjaManifest from "./sprites/ninja.manifest.json";

const brawlerPng = new URL("./sprites/brawler.png", import.meta.url).href;
import brawlerAtlas from "./sprites/brawler.atlas.json?url";
import brawlerManifest from "./sprites/brawler.manifest.json";

const wizardPng = new URL("./sprites/wizard.png", import.meta.url).href;
import wizardAtlas from "./sprites/wizard.atlas.json?url";
import wizardManifest from "./sprites/wizard.manifest.json";

const golemPng = new URL("./sprites/golem.png", import.meta.url).href;
import golemAtlas from "./sprites/golem.atlas.json?url";
import golemManifest from "./sprites/golem.manifest.json";

const batPng = new URL("./sprites/bat.png", import.meta.url).href;
import batAtlas from "./sprites/bat.atlas.json?url";
import batManifest from "./sprites/bat.manifest.json";

export type CastKey = "knight" | "ninja" | "brawler" | "wizard" | "golem" | "bat";

export interface CastEntry {
  /** The hashed URL of the sheet. */
  png: string;
  /** The hashed URL of the atlas JSON. */
  atlas: string;
  manifest: Manifest;
}

export const CAST: Record<CastKey, CastEntry> = {
  knight: { png: knightPng, atlas: knightAtlas, manifest: knightManifest as Manifest },
  ninja: { png: ninjaPng, atlas: ninjaAtlas, manifest: ninjaManifest as Manifest },
  brawler: { png: brawlerPng, atlas: brawlerAtlas, manifest: brawlerManifest as Manifest },
  wizard: { png: wizardPng, atlas: wizardAtlas, manifest: wizardManifest as Manifest },
  golem: { png: golemPng, atlas: golemAtlas, manifest: golemManifest as Manifest },
  bat: { png: batPng, atlas: batAtlas, manifest: batManifest as Manifest },
};

export const CAST_KEYS = Object.keys(CAST) as CastKey[];

/**
 * The five clip ids every studio character carries.
 *
 * Written out rather than read from a manifest at runtime because
 * `assert-tier.mjs` greps this game's SOURCE for all five as quoted strings - a
 * showcase game that only ever names two of them has not wired the other three,
 * and the gate is right to say so.
 */
export const CLIPS = ["idle", "walk", "attack", "hurt", "ko"] as const;
export type Clip = (typeof CLIPS)[number];

/** Who plays what. The defender is the figure on the roof; the rest walk in. */
export const PLAYED_BY: Record<WalkerKind | "defender", CastKey> = {
  defender: "knight",
  foot: "brawler",
  runner: "ninja",
  shooter: "wizard",
  vehicle: "golem",
  air: "bat",
  // THE GOLEM PLAYS TWO PARTS, told apart by size alone - survivors' own
  // pattern, where a warden IS a giant bat. See `drawScale`.
  heavy: "golem",
};

/**
 * Which walker kind each sheet is drawn at its NATIVE size for.
 *
 * Every sheet but the golem's is used by exactly one kind, so that kind is its
 * native size by construction and its ratio below is 1. The golem is shared, so
 * one of the two has to be the size it was drawn at and the other is derived
 * from it.
 */
const SHEET_NATIVE: Record<CastKey, WalkerKind | "defender"> = {
  knight: "defender",
  ninja: "runner",
  brawler: "foot",
  wizard: "shooter",
  golem: "vehicle",
  bat: "air",
};

/**
 * Body units per authored pixel, from the studio's own rig.
 *
 * DERIVED rather than typed in: at `unit = 5` and an export `scale` of 1, one
 * authored pixel is a 5x5 block on the sheet, so drawing at `1 / (5 * scale)`
 * puts exactly one authored pixel on one arena unit and the pixel grid
 * survives. Re-exporting at a different scale changes the manifest and this
 * follows it; a hardcoded 0.2 would silently halve the cast.
 */
const UNIT = 5;

/** The scale that draws one authored pixel on one arena unit. */
export const nativeScale = (m: Manifest): number => 1 / (UNIT * m.scale);

/** The defender's radius, for the ratio below. It never walks, so it has no KIND row. */
const DEFENDER_RADIUS = 12;

const radiusOf = (part: WalkerKind | "defender"): number =>
  part === "defender" ? DEFENDER_RADIUS : KIND[part].radius;

/**
 * How big a part is DRAWN, derived from its hitbox and never written as a
 * literal.
 *
 * This is the shape `a-setter-that-replaces-erases-what-the-thing-was-born-with.md`
 * exists for. Survivors shipped live with every enemy five times too big -
 * twenty-five times the area - because a draw loop wrote `setScale(elite ? r :
 * 1)` and the `1` discarded the scale set at birth. 173 tests, four build gates,
 * a browser probe and a green live deploy were all correct about everything they
 * read, and the operator found it by looking.
 *
 * Two things follow, and both are deliberate here:
 *
 *  - the number is a FUNCTION OF THE HITBOX, so the picture cannot disagree with
 *    what the simulation collides;
 *  - it lives in a pure module a test can call, because nothing in this repo can
 *    drive a Phaser scene, so arithmetic inside one is arithmetic no run can
 *    ever fail over.
 *
 * The scene composes with this and never sets an absolute scale of its own.
 */
export function drawScale(part: WalkerKind | "defender"): number {
  const key = PLAYED_BY[part];
  const m = CAST[key].manifest;
  return nativeScale(m) * (radiusOf(part) / radiusOf(SHEET_NATIVE[key]));
}
