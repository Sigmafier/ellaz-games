// NEON SURVIVAL ON THE CAREER KIT: its gear, its shop, its base stats, and the one
// place a finished level is paid.
//
// The KIT (src/shared/career) owns the rules every career game shares - unlocking,
// stars, the shop's pricing, gear tiers and auto-equip. This file owns only what is
// Neon's: which stat each slot moves and by how much, what the vending machine
// sells, and what a level pays. It never touches the site's coins: gold is this
// game's own and lives in this game's own save (`ctx.storage`, key `career`).
//
// NUMBERS A PLAYER READS ARE SMALL. Health is HEARTS (3 to start), damage, speed
// and magnet are PERCENT of the plain robot (100), luck is gold points per kill
// (a coin per 100). The gear screen draws those as they are.

import { bankItems, rollDrop, type GearFile } from "../../shared/career/gear";
import { recordClear } from "../../shared/career/progress";
import { readSave, writeSave, type CareerSave, type CareerStore } from "../../shared/career/save";
import { earnGold, type ShopFile } from "../../shared/career/shop";
import { careerStats, type StatBlock } from "../../shared/career/stats";
import type { CareerResult, CareerStats } from "./types";
import { NEON_CAMPAIGN, levelRow, worldRow } from "./worlds";
import { HARD, readHard, recordHard, writeHard } from "./hardTier";

export type LevelResult = CareerResult;

/** Where the career lives in this game's storage. Persisted, so never renamed. */
export const CAREER_KEY = "career";
/** The last run that was paid, so a run reported twice is paid once. Persisted, never renamed. */
export const SETTLED_KEY = "careerRun";

/** The plain robot, in the units the gear screen shows. */
export const BASE_STATS: StatBlock = { health: 3, speed: 100, damage: 100, magnet: 100, luck: 15 };

/** Where each stat bar on the gear screen is full - a little past the best a full kit reaches. */
export const STAT_MAX: StatBlock = { health: 9, speed: 140, damage: 220, magnet: 250, luck: 60 };

/**
 * Three slots, as the kit rules (weapon, armor, ring), each moving ONE stat:
 * a weapon adds damage points, armor adds HEARTS, a ring adds luck.
 * Epic is worth roughly a shop row bought three times, so a boss drop matters.
 */
const SLOTS: GearFile["slots"] = [
  { id: "weapon", stat: "damage", values: { common: 10, rare: 22, epic: 40 } },
  { id: "armor", stat: "health", values: { common: 1, rare: 2, epic: 3 } },
  { id: "ring", stat: "luck", values: { common: 5, rare: 12, epic: 22 } },
];

/** What an elite drops, when it drops: mostly common. */
export const NEON_GEAR: GearFile = { slots: SLOTS, odds: { common: 0.7, rare: 0.25, epic: 0.05 } };
/** What a boss drops, always: better odds, the same pieces. */
export const BOSS_GEAR: GearFile = { slots: SLOTS, odds: { common: 0.45, rare: 0.4, epic: 0.15 } };

/** The chance each elite killed in a WON level drops a piece. At most one piece a level. */
export const ELITE_GEAR_CHANCE = 0.15;

/**
 * The vending machine. Six rows, one per thing a run can carry in; each dearer the
 * more you own, each capped so the shop runs out rather than making the robot
 * unkillable. Ids are forever - the save counts purchases against them.
 */
export const NEON_SHOP: ShopFile = {
  rows: [
    { id: "heart", icon: "heart", effect: { stat: "health", kind: "add", amount: 1 }, price: 40, step: 40, max: 3 },
    { id: "power", icon: "bolt", effect: { stat: "damage", kind: "pct", amount: 10 }, price: 50, step: 40, max: 5 },
    { id: "swift", icon: "boot", effect: { stat: "speed", kind: "pct", amount: 8 }, price: 35, step: 30, max: 3 },
    { id: "magnet", icon: "magnet", effect: { stat: "magnet", kind: "pct", amount: 25 }, price: 30, step: 30, max: 3 },
    { id: "luck", icon: "clover", effect: { stat: "luck", kind: "add", amount: 5 }, price: 30, step: 30, max: 3 },
    { id: "shield", icon: "shield", effect: { kind: "count", amount: 1 }, price: 120, step: 0, max: 1 },
  ],
};

/** A save's stats in gear-screen units: base, plus what is worn, plus what was bought. */
export const statsOf = (save: CareerSave): StatBlock => careerStats(BASE_STATS, NEON_GEAR, NEON_SHOP, save);

/** A save reduced to the numbers the simulation reads. */
export function simStats(save: CareerSave): CareerStats {
  const s = statsOf(save);
  return {
    hearts: Math.round(s.health),
    speed: s.speed / 100,
    damage: s.damage / 100,
    magnet: s.magnet / 100,
    luck: s.luck,
    shield: save.shop.shield ?? 0,
  };
}

/** Stars are hearts left: all of them is three, down to one for scraping through. 0 is a loss. */
export function starsFor(hp: number, maxHp: number): number {
  if (hp <= 0 || maxHp <= 0) return 0;
  return Math.max(1, Math.min(3, Math.ceil((3 * hp) / maxHp)));
}

/** Gold for a clear: the world's bonus, doubled for its boss. */
export const clearBonus = (levelId: string): number => worldRow(levelId).bonus * (levelRow(levelId).boss ? 2 : 1);

export interface Settlement {
  won: boolean;
  stars: number;
  /** Everything this level put in the purse, bonus included. */
  gold: number;
  bonus: number;
  /** The gear piece found, or null. */
  drop: string | null;
  save: CareerSave;
}

/**
 * Pay a finished level into the save. A WIN keeps every coin picked up, adds the
 * clear bonus, records its stars (never lower than before) and rolls gear - a boss
 * always, each elite a small chance, one piece at most. A LOSS keeps HALF the gold
 * picked up and nothing else: the Toybox ruling "a defeat costs coins, not gear".
 */
export function settle(save: CareerSave, r: CareerResult, rng: () => number): Settlement {
  if (!r.won) {
    const kept = Math.floor(Math.max(0, r.gold) / 2);
    return { won: false, stars: 0, gold: kept, bonus: 0, drop: null, save: earnGold(save, kept) };
  }
  // A HARD clear pays its bonus twice over and records its stars in the hard
  // save (`bankRun`), never here: the normal map's stars are the normal tier's.
  const bonus = clearBonus(r.level) * (r.hard ? HARD.gold : 1);
  const gold = Math.max(0, Math.floor(r.gold)) + bonus;
  const stars = starsFor(r.hp, r.maxHp);
  let next = r.hard ? earnGold(save, gold) : recordClear(NEON_CAMPAIGN, earnGold(save, gold), r.level, stars);
  let drop: string | null = null;
  if (levelRow(r.level).boss) drop = rollDrop(BOSS_GEAR, rng);
  else for (let i = 0; i < r.elites && drop === null; i++) if (rng() < ELITE_GEAR_CHANCE) drop = rollDrop(NEON_GEAR, rng);
  if (drop) next = bankItems(NEON_GEAR, next, [drop]);
  return { won: true, stars, gold, bonus, drop, save: next };
}

/**
 * Pay a finished level ONCE. `token` names the run; the last token paid is kept
 * beside the save, so a run reported twice - a re-render, a second effect, a page
 * left and come back to - is paid once. The save is written first, and the run is
 * marked paid only once the save READS BACK: `ctx.storage.set` swallows a refused
 * write, so a full device looks like a working one, and marking the run first
 * would lose its gold for good. A save that did not land leaves the run unpaid,
 * and the next report pays it into the save the device really holds.
 */
export function bankRun(store: CareerStore, token: string, r: CareerResult, rng: () => number): Settlement | null {
  let last: unknown;
  try {
    last = store.get(SETTLED_KEY);
  } catch {
    last = undefined;
  }
  if (last === token) return null;
  const out = settle(readSave(store, CAREER_KEY), r, rng);
  // A hard win's stars go to the hard save first - re-recording them is a no-op,
  // so a run paid again after a refused write cannot over-count anything.
  if (r.hard && out.won && !writeHard(store, recordHard(out.save, readHard(store), r.level, out.stars))) return out;
  if (!writeSave(store, CAREER_KEY, out.save) || !landed(store, out.save)) return out;
  try {
    store.set(SETTLED_KEY, token);
  } catch {
    /* a refused write is a fact about the device */
  }
  return out;
}

/** The save on the device is this one - the only proof a swallowed write can give. */
function landed(store: CareerStore, save: CareerSave): boolean {
  const back = readSave(store, CAREER_KEY);
  return (["gold", "stars", "gear", "shop"] as const).every((k) => JSON.stringify(back[k]) === JSON.stringify(save[k]));
}
