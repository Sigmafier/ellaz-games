// The SHOP: rows for sale, what each costs, and buying - with the GAME's gold.
//
// Buying spends `save.gold`, the gold that lives in this game's own save, and
// changes exactly two things: that gold, and how many of the row were bought.
// It reaches nothing on the site - no wallet, no site coins, no profile - and
// shop.test.ts reads every file in this directory to hold that, because the
// site's coins are add-only for a game (RewardsPort has no spend) and this is
// not the place that rule gets amended.
//
// Carried over from the Toybox (studio/toybox/campaign/shop.ts): a row is priced
// off how many are already owned (price + step x owned), and a purse that cannot
// pay is refused with the save untouched. A refused row is still PRESSABLE on the
// screen and answers with a wiggle - the ellaz law - which is why `shopView`
// reports `afford` rather than hiding the row.

import type { CareerSave } from "./save";
import type { StatId, StatModifier } from "./stats";

/** what one purchase of a row does: move a stat, or add one to a count the game reads itself (a shield, a revive) */
export type ShopEffect =
  | { stat: StatId; kind: "add" | "pct" | "mul"; amount: number }
  | { kind: "count"; amount: number };

export interface ShopRowDef {
  /** forever: the save counts purchases against it */
  id: string;
  /** the picture the tile draws (a career icon name) */
  icon: string;
  effect: ShopEffect;
  /** what the first one costs, in gold */
  price: number;
  /** how much dearer each one after it is; 0 for a flat price */
  step: number;
  /** how many can ever be bought; absent is no limit */
  max?: number;
}

export interface ShopFile { rows: ShopRowDef[] }

export interface ShopRowView {
  id: string;
  icon: string;
  /** the big number on the tile, already written as drawn: "+20", "+10%", "x1.2" */
  gain: string;
  cost: number;
  owned: number;
  afford: boolean;
  maxed: boolean;
}

export type BuyResult =
  | { ok: true; save: CareerSave }
  | { ok: false; why: "short" | "maxed" | "unknown"; save: CareerSave };

export const priceOf = (row: ShopRowDef, owned: number): number => row.price + row.step * owned;

const ownedOf = (save: CareerSave, id: string): number => save.shop[id] ?? 0;
const isMaxed = (row: ShopRowDef, owned: number): boolean => row.max !== undefined && owned >= row.max;

export function gainText(row: ShopRowDef): string {
  const e = row.effect;
  if (e.kind === "pct") return `+${e.amount}%`;
  if (e.kind === "mul") return `x${e.amount}`;
  return `+${e.amount}`;
}

/** gold a level paid: whole, positive coins only; anything else hands the same save back */
export function earnGold(save: CareerSave, amount: number): CareerSave {
  if (!Number.isInteger(amount) || amount <= 0) return save;
  return { ...save, gold: save.gold + amount };
}

/** every row with its price today and whether today's gold pays it */
export function shopView(file: ShopFile, save: CareerSave): ShopRowView[] {
  return file.rows.map((row) => {
    const owned = ownedOf(save, row.id);
    const cost = priceOf(row, owned);
    const maxed = isMaxed(row, owned);
    return { id: row.id, icon: row.icon, gain: gainText(row), cost, owned, maxed, afford: !maxed && save.gold >= cost };
  });
}

/** buy one of a row with the game's gold; a refusal names why and hands the SAME save back */
export function buy(file: ShopFile, save: CareerSave, id: string): BuyResult {
  const row = file.rows.find((r) => r.id === id);
  if (!row) return { ok: false, why: "unknown", save };
  const owned = ownedOf(save, id);
  if (isMaxed(row, owned)) return { ok: false, why: "maxed", save };
  const cost = priceOf(row, owned);
  if (save.gold < cost) return { ok: false, why: "short", save };
  return { ok: true, save: { ...save, gold: save.gold - cost, shop: { ...save.shop, [id]: owned + 1 } } };
}

/** what was bought, as stat modifiers: n adds sum, n multipliers compound, n percents sum. Counts are the game's to read */
export function shopModifiers(file: ShopFile, save: CareerSave): StatModifier[] {
  const out: StatModifier[] = [];
  for (const row of file.rows) {
    const n = ownedOf(save, row.id);
    const e = row.effect;
    if (n === 0 || e.kind === "count") continue;
    const amount = e.kind === "mul" ? Number((e.amount ** n).toFixed(6)) : e.amount * n;
    out.push({ stat: e.stat, kind: e.kind, amount });
  }
  return out;
}
