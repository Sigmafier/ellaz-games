// SNAKE SURVIVORS ON THE CAREER KIT: its gear, its shop, its base stats, and the
// one place a finished level is paid (operator rulings 2026-10-03).
//
// The KIT (src/shared/career) owns what every career game shares - unlocking,
// stars, the shop's pricing, gear tiers and auto-equip. This file owns only what
// is the snake's: which stat each slot moves and by how much, what the vending
// machine sells, and what a level pays. It never touches the site's coins: gold is
// this game's own and lives in this game's own save (`ctx.storage`, key `career`).
//
// THE SLOTS ARE THE KIT'S, THE NAMES ARE THE SNAKE'S. `weapon`, `armor` and `ring`
// are save keys and never move; the gear screen draws them as FANGS (crush power,
// in percent of the plain snake), SCALES (segments added to the start - the tail
// is the health) and a CHARM (gold luck, points per shape). `careerSkin.ts` says so.

import { bankItems, rollDrop, type GearFile } from "../../shared/career/gear";
import { recordClear } from "../../shared/career/progress";
import { readSave, writeSave, type CareerSave, type CareerStore } from "../../shared/career/save";
import { earnGold, type ShopFile } from "../../shared/career/shop";
import { careerStats, type StatBlock } from "../../shared/career/stats";
import type { Diamonds } from "@sdk/diamonds";
import { START_LEN } from "./body";
import { SNAKE_CAMPAIGN, snakeLevel, snakeWorld } from "./careerWorlds";
import type { SnakeCareerResult, SnakeCareerStats } from "./careerTypes";

/** Where the career lives in this game's storage. Persisted, so never renamed. */
export const CAREER_KEY = "career";
/** The last run that was paid, so a run reported twice is paid once. Persisted, never renamed. */
export const SETTLED_KEY = "careerRun";

/** The plain snake, in the gear screen's units: health is the START LENGTH in segments, the rest percent and points. */
export const SNAKE_BASE: StatBlock = { health: START_LEN, speed: 100, damage: 100, magnet: 100, luck: 15 };

/** Where each stat bar on the gear screen is full - a little past the best a full kit reaches. */
export const SNAKE_MAX: StatBlock = { health: START_LEN + 20, speed: 130, damage: 220, magnet: 190, luck: 60 };

/**
 * Three slots, each moving ONE stat: Fangs add crush points, Scales add whole
 * segments to the start, a Charm adds luck. Epic Fangs are worth about four of
 * the shop's crush rows, so a boss drop is worth having.
 */
const SLOTS: GearFile["slots"] = [
  { id: "weapon", stat: "damage", values: { common: 10, rare: 22, epic: 40 } },
  { id: "armor", stat: "health", values: { common: 2, rare: 4, epic: 6 } },
  { id: "ring", stat: "luck", values: { common: 5, rare: 12, epic: 22 } },
];

/** What an ordinary clear drops, when it drops: mostly common. */
export const SNAKE_GEAR: GearFile = { slots: SLOTS, odds: { common: 0.7, rare: 0.25, epic: 0.05 } };
/** What a boss drops, always: better odds, the same pieces. */
export const BOSS_GEAR: GearFile = { slots: SLOTS, odds: { common: 0.45, rare: 0.4, epic: 0.15 } };
/** The chance an ordinary level WON drops a piece. A boss always does. */
export const GEAR_CHANCE = 0.25;

/**
 * The vending machine: the snake's own six (operator ruling 2026-10-03). Each
 * dearer the more you own, each capped so the shop runs out rather than making
 * the snake unkillable. Ids are forever - the save counts purchases against them.
 */
export const SNAKE_SHOP: ShopFile = {
  rows: [
    { id: "length", icon: "snake", effect: { stat: "health", kind: "add", amount: 4 }, price: 40, step: 40, max: 3 },
    { id: "crush", icon: "fang", effect: { stat: "damage", kind: "pct", amount: 10 }, price: 50, step: 40, max: 5 },
    { id: "swift", icon: "dash", effect: { stat: "speed", kind: "pct", amount: 8 }, price: 35, step: 30, max: 3 },
    { id: "magnet", icon: "magnet", effect: { stat: "magnet", kind: "pct", amount: 25 }, price: 30, step: 30, max: 3 },
    { id: "luck", icon: "clover", effect: { stat: "luck", kind: "add", amount: 5 }, price: 30, step: 30, max: 3 },
    { id: "shield", icon: "shield", effect: { kind: "count", amount: 1 }, price: 120, step: 0, max: 1 },
  ],
};

/** A save's stats in gear-screen units: base, plus what is worn, plus what was bought. */
export const statsOf = (save: CareerSave): StatBlock => careerStats(SNAKE_BASE, SNAKE_GEAR, SNAKE_SHOP, save);

/** A save reduced to the numbers a level reads. */
export function simStats(save: CareerSave): SnakeCareerStats {
  const s = statsOf(save);
  return {
    length: Math.round(s.health),
    speed: s.speed / 100,
    crush: s.damage / 100,
    magnet: s.magnet / 100,
    luck: s.luck,
    shield: save.shop.shield ?? 0,
  };
}

/**
 * Stars are hearts left (operator ruling 2026-10-03, "all = 3"): every heart
 * still full is three, half of them or more is two, fewer is one for scraping
 * through - the S0 mock's "5 of 8 hearts left = 2 stars". A win always earns one;
 * 0 is a loss.
 *
 * STRICTER THAN NEON'S on purpose. Neon gives three stars for two thirds of its
 * hearts, and a bought-out shop three-stars its whole map; here a third star is
 * finishing with no bump left un-regrown, and the bot table shows even a full kit
 * missing it on the cave (`career-pacing.test.ts`).
 */
export function starsFor(hearts: number, of: number): number {
  if (hearts <= 0 || of <= 0) return 0;
  if (hearts >= of) return 3;
  return 2 * hearts >= of ? 2 : 1;
}

/**
 * The stars a finished level shows on its card AND records in the save - one
 * number, so the two can never disagree. A WIN is at least one star: hearts are
 * counted FULL, so a win scraped through on half a heart reads 0 hearts, and
 * `starsFor` alone would put "0 stars" on the card while `recordClear` (which
 * never stores fewer than one) saved 1 - reported 2026-10-03. Neon's `starsFor`
 * carries the same floor. A loss is 0.
 */
export function levelStars(r: Pick<SnakeCareerResult, "won" | "hearts" | "of">): number {
  return r.won ? Math.max(1, starsFor(r.hearts, r.of)) : 0;
}

/** Gold for a clear: the world's bonus, doubled for its boss. */
export const clearBonus = (levelId: string): number => snakeWorld(levelId).bonus * (snakeLevel(levelId).boss ? 2 : 1);

export interface Settlement {
  won: boolean;
  stars: number;
  /** Everything this level put in the purse, bonus included. */
  gold: number;
  /** The gold picked up during the level, before a loss halved it - the lost card says "9 of 18". */
  picked: number;
  bonus: number;
  /** The gear piece found, or null. */
  drop: string | null;
  save: CareerSave;
}

/**
 * Pay a finished level into the save. A WIN keeps every coin picked up, adds the
 * clear bonus, records its stars (never lower than before) and rolls gear - a boss
 * always, an ordinary level a small chance. A LOSS keeps HALF the gold picked up
 * and nothing else: the Toybox ruling "a defeat costs coins, not gear".
 */
export function settle(save: CareerSave, r: SnakeCareerResult, rng: () => number): Settlement {
  const picked = Math.max(0, Math.floor(r.gold));
  if (!r.won) {
    const kept = Math.floor(picked / 2);
    return { won: false, stars: 0, gold: kept, picked, bonus: 0, drop: null, save: earnGold(save, kept) };
  }
  const bonus = clearBonus(r.level);
  const gold = picked + bonus;
  const stars = levelStars(r);
  let next = recordClear(SNAKE_CAMPAIGN, earnGold(save, gold), r.level, stars);
  let drop: string | null = null;
  if (snakeLevel(r.level).boss) drop = rollDrop(BOSS_GEAR, rng);
  else if (rng() < GEAR_CHANCE) drop = rollDrop(SNAKE_GEAR, rng);
  if (drop) next = bankItems(SNAKE_GEAR, next, [drop]);
  return { won: true, stars, gold, picked, bonus, drop, save: next };
}

/** The save on the device is this one - the only proof a swallowed write can give. */
function landed(store: CareerStore, save: CareerSave): boolean {
  const back = readSave(store, CAREER_KEY);
  return (["gold", "stars", "gear", "shop"] as const).every((k) => JSON.stringify(back[k]) === JSON.stringify(save[k]));
}

/**
 * Pay a finished level ONCE (Neon Survival's `bankRun`, the same rule). `token`
 * names the run; the last token paid is kept beside the save, so a run reported
 * twice is paid once. The save is written first and the run is marked paid only
 * once the save READS BACK - `ctx.storage.set` swallows a refused write, and
 * marking the run first would lose its gold for good.
 */
export function bankRun(store: CareerStore, token: string, r: SnakeCareerResult, rng: () => number): Settlement | null {
  let last: unknown;
  try {
    last = store.get(SETTLED_KEY);
  } catch {
    last = undefined;
  }
  if (last === token) return null;
  const out = settle(readSave(store, CAREER_KEY), r, rng);
  if (!writeSave(store, CAREER_KEY, out.save) || !landed(store, out.save)) return out;
  try {
    store.set(SETTLED_KEY, token);
  } catch {
    /* a refused write is a fact about the device */
  }
  return out;
}

/**
 * The site's diamond for a boss beaten: one, by REASON (`boss_defeated`), never
 * an amount, riding the same token as the gold - the diamond store keeps its own
 * list of paid tokens, so a run reported twice pays one.
 */
export function payBossDiamond(d: Pick<Diamonds, "grant">, r: SnakeCareerResult, token: string): number {
  if (!r.won || !snakeLevel(r.level).boss) return 0;
  return d.grant("boss_defeated", `snakesurvivors:${token}`).granted;
}
