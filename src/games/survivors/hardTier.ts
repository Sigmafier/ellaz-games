// THE HARD TIER (operator ruling 2026-10-03, "Hard tier per world").
//
// The career's normal tier was measured too soft for a player who had already
// bought the shop out: a careful bot won the city 5 of 5 with every heart, and a
// full kit three-starred city and frost for free. A flat retune would either kill
// a new player or still miss the grinder, so the levels are not touched at all.
// Instead, once a world's boss has fallen on NORMAL, that world's four levels can
// be played again on HARD:
//
//   gaps -30%        `spawnMs` and `floorMs` x0.7 - the crowd comes faster
//   shapes +0.35     every swarm shape's health multiplier, +0.35
//   elites x2.5      capped at 20% of spawns
//   the boss x1.6    its health
//   guns from 0 s    every shooter in the world's mix joins at the first second,
//                    and the city - which has none - gets the spitter, because a
//                    city with nothing that shoots measured as free on hard too
//   gold x2          every coin and the clear bonus; the boss still pays its
//                    diamond (diamondShelf.ts `payBossDiamond`, once per run)
//
// WHERE IT LIVES. Hard stars are Neon's, kept under Neon's own key beside the
// looks (`careerHard`), never inside the kit's career save - that shape is pinned
// to the Toybox's (copied-rules.test.ts), and an old save must load untouched.
//
// Pure: no DOM, no Phaser. Stores are injected.

import { linearStates, nodeStates, type NodeStateView } from "../../shared/career/progress";
import type { CareerSave, CareerStore } from "../../shared/career/save";
import { RULES } from "./stages";
import type { EnemyKind, LevelKey, WorldId } from "./types";
import { LEVELS, NEON_CAMPAIGN, type LevelRow, type WorldRow } from "./worlds";

/** Where the hard stars live. Persisted, so never renamed. */
export const HARD_KEY = "careerHard";

/** Every lever the hard tier pulls, in one row. */
export const HARD = {
  gap: 0.7,
  hp: 0.35,
  elite: 2.5,
  eliteMax: 0.2,
  boss: 1.6,
  /** Multiplies the clear bonus. Coins keep their worth - a denser crowd already drops more. */
  gold: 2,
  /** The fewest guns a hard world may field at once - the city's base row has none. */
  shooters: 2,
} as const;

/**
 * PER-WORLD TRIM on top of the row above, MEASURED rather than felt - a careful
 * bot on a bought-out kit (6 hearts, +80% damage, every row, the shield), five
 * seeds a level, career-pacing.test.ts. One flat row cannot hit the targets: the
 * levers that left a bought-out city FREE (won 5/5 with every heart) killed lava
 * outright. Readings, 2026-10-03, wins per level 1/2/3/boss:
 *
 *                       city        frost      lava
 *   the flat row        5F 5F 5 5F  3 4 1 4    4 0 0 1
 *   + city on normal    5  5  3 4
 *   + lava trimmed                             3 3 1 1     <- this
 *
 *   CITY  plays on the NORMAL rules row - its guns, its xp curve and its walk speed.
 *         On calm's row a hard city handed out 13 to 24 cards a level and the kit
 *         never lost a heart, guns or not. +0.1 pace, one more gun.
 *   LAVA  every shape is at least 1.55 (normal lava is 1.2 to 1.45), so each
 *         level is tougher than its normal self - but the spec's +0.35 on top of
 *         1.45 left lava-3 unwinnable (0/5), and four guns at once with it.
 *   FROST is the flat row exactly.
 */
export const HARD_WORLD: Record<WorldId, { base: LevelKey; pace: number; hp: number; floor: number; shooters: number }> = {
  city: { base: "normal", pace: 0.1, hp: 0, floor: 0, shooters: 1 },
  frost: { base: "normal", pace: 0, hp: 0, floor: 0, shooters: 0 },
  lava: { base: "wild", pace: 0, hp: -0.25, floor: 1.55, shooters: -2 },
};

/** Which rules row a world's hard tier plays on - its guns, its xp curve, its boss. */
export const hardBase = (W: WorldRow): LevelKey => HARD_WORLD[W.id].base;

const GUNS: readonly EnemyKind[] = ["spitter", "lancer"];

/** A level's row on hard: the same level, harder on every axis above. */
export function hardLevel(L: LevelRow): LevelRow {
  const trim = HARD_WORLD[L.world];
  return {
    ...L,
    spawnMs: Math.round(L.spawnMs * HARD.gap),
    floorMs: Math.round(L.floorMs * HARD.gap),
    hp: Math.max(trim.floor, L.hp + HARD.hp + trim.hp),
    pace: L.pace + trim.pace,
    elite: Math.min(HARD.eliteMax, L.elite * HARD.elite),
    bossHp: L.bossHp * HARD.boss,
  };
}

/** A world's crowd on hard: every gun from the first second, and a spitter where there was none. */
export function hardMix(W: WorldRow): readonly (readonly [EnemyKind, number])[] {
  const mix = W.mix.map(([k, at]) => [k, GUNS.includes(k) ? 0 : at] as const);
  return mix.some(([k]) => GUNS.includes(k)) ? mix : [...mix, ["spitter", 0] as const];
}

/** How many guns may be on the board at once on this world's hard tier. */
export const hardShooters = (W: WorldRow): number => Math.max(HARD.shooters, RULES[hardBase(W)].shooters) + HARD_WORLD[W.id].shooters;

/** Hard stars, per level id. */
export interface HardSave {
  stars: Record<string, number>;
}

const world = (id: string) => LEVELS.find((l) => l.id === id)?.world;
const bossOf = (w: WorldId) => LEVELS.find((l) => l.world === w && l.boss)!.id;
const idsOf = (w: WorldId) => LEVELS.filter((l) => l.world === w).map((l) => l.id);

/** A world's hard tier is open once its boss has fallen on normal. */
export const hardOpen = (save: CareerSave, w: WorldId): boolean => (save.stars[bossOf(w)] ?? 0) > 0;

/** The worlds whose hard tier is open, in play order. */
export const hardWorlds = (save: CareerSave): WorldId[] =>
  NEON_CAMPAIGN.worlds.map((w) => w.id as WorldId).filter((w) => hardOpen(save, w));

/** The map's states on hard: each open world climbs its own four levels; a closed one is locked. */
export function hardStates(save: CareerSave, hard: HardSave): NodeStateView[] {
  const base = nodeStates(NEON_CAMPAIGN, save);
  const by = new Map<string, { state: NodeStateView["state"]; stars: number }>();
  for (const w of NEON_CAMPAIGN.worlds) {
    const id = w.id as WorldId;
    const view = linearStates(idsOf(id), { ...save, stars: hard.stars });
    for (const v of view) by.set(v.id, hardOpen(save, id) ? v : { state: "locked", stars: v.stars });
  }
  return base.map((v) => ({ node: v.node, ...by.get(v.node.id)! }));
}

/** Bank a hard clear: its best stars, never lower - and nothing on a closed world or a level out of order. */
export function recordHard(save: CareerSave, hard: HardSave, id: string, stars: number): HardSave {
  const w = world(id);
  if (!w || !hardOpen(save, w)) return hard;
  const v = linearStates(idsOf(w), { ...save, stars: hard.stars }).find((x) => x.id === id);
  if (!v || v.state === "locked") return hard;
  const best = Math.max(hard.stars[id] ?? 0, Math.min(3, Math.max(1, Math.floor(stars))));
  return best === (hard.stars[id] ?? 0) ? hard : { stars: { ...hard.stars, [id]: best } };
}

const ok = (n: unknown): n is number => typeof n === "number" && Number.isInteger(n) && n >= 1 && n <= 3;

/** The hard stars on this device; anything unusable reads as none. */
export function readHard(store: CareerStore): HardSave {
  try {
    const text = store.get(HARD_KEY);
    if (typeof text !== "string") return { stars: {} };
    const raw = JSON.parse(text) as { stars?: unknown };
    const s = raw?.stars;
    if (!s || typeof s !== "object" || Array.isArray(s)) return { stars: {} };
    const entries = Object.entries(s as Record<string, unknown>);
    if (!entries.every(([id, n]) => world(id) && ok(n))) return { stars: {} };
    return { stars: Object.fromEntries(entries) as Record<string, number> };
  } catch {
    return { stars: {} };
  }
}

/** Write the hard stars; false when the device refused them (`ctx.storage.set` swallows a refusal, so it is read back). */
export function writeHard(store: CareerStore, hard: HardSave): boolean {
  try {
    store.set(HARD_KEY, JSON.stringify(hard));
  } catch {
    return false;
  }
  return JSON.stringify(readHard(store)) === JSON.stringify(hard);
}
