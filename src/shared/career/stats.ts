// STATS: the five numbers a career character carries, and how gear and the shop
// move them.
//
// One order of operations, written once: every flat ADD first, then every
// MULtiplier, then every PERCENT together - (base + adds) x muls x (1 + pcts).
// Summing the percentages rather than compounding them keeps "+10% twice" at
// +20%, which is what a player reading two "+10%" tiles expects to have bought.
//
// The game hands in its own base block; the kit never decides how fast a robot
// is, only how the things you found and bought change it.

import { gearModifiers } from "./gear";
import type { GearFile } from "./gear";
import { shopModifiers } from "./shop";
import type { ShopFile } from "./shop";
import type { CareerSave } from "./save";

export const STAT_IDS = ["health", "speed", "damage", "magnet", "luck"] as const;
export type StatId = (typeof STAT_IDS)[number];
export type StatBlock = Record<StatId, number>;

export interface StatModifier {
  stat: StatId;
  kind: "add" | "mul" | "pct";
  amount: number;
}

/** the base block with every modifier applied; the base is never mutated */
export function computeStats(base: StatBlock, mods: readonly StatModifier[]): StatBlock {
  const out = { ...base };
  for (const id of STAT_IDS) {
    const mine = mods.filter((m) => m.stat === id);
    if (mine.length === 0) continue;
    const add = mine.filter((m) => m.kind === "add").reduce((a, m) => a + m.amount, 0);
    const mul = mine.filter((m) => m.kind === "mul").reduce((a, m) => a * m.amount, 1);
    const pct = mine.filter((m) => m.kind === "pct").reduce((a, m) => a + m.amount, 0);
    out[id] = (base[id] + add) * mul * (1 + pct / 100);
  }
  return out;
}

/** a whole save's stats: the game's base, plus what is worn, plus what was bought */
export function careerStats(base: StatBlock, gear: GearFile, shop: ShopFile, save: CareerSave): StatBlock {
  return computeStats(base, [...gearModifiers(gear, save), ...shopModifiers(shop, save)]);
}
