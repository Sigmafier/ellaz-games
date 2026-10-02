// WHAT EACH SHOP ROW ADDS, as the info card and the tile draw it.
//
// Operator ruling 2026-10-02: *"in shop we must know whats each item or gear
// adds"*. Every row gets its stat in words (drawn under the tile's "+10%") and an
// info card: the name, one sentence, and the number the row moves - what the
// robot has NOW beside what it would have AFTER one more. The numbers are the
// gear screen's own units (`statsOf`), so the card and the stat bars never
// disagree: hearts for health, percent of the plain robot for damage, speed and
// magnet, points for luck.
//
// Pure: no DOM, and only TYPES from the kit, so it tests in node and adds nothing
// to the shell.

import type { CareerSave } from "../../shared/career/save";
import type { StatId } from "../../shared/career/stats";
import type { ItemInfo } from "../../ui/career/InfoCard";
import { NEON_SHOP, statsOf } from "./careerRules";
import type { NeonCareerWords, ShopItemId } from "./careerWords";

/** The kit's stat words - the same ones the gear screen's bars use. */
export type StatWords = Record<StatId, string>;

const PERCENT: ReadonlySet<StatId> = new Set<StatId>(["damage", "speed", "magnet"]);

/** One stat as the player reads it: whole hearts and points, whole percents. */
export function statText(stat: StatId, value: number): string {
  const n = Math.round(value);
  return PERCENT.has(stat) ? `${n}%` : String(n);
}

/** The save with one more of a row bought - for the AFTER number only; nothing is spent. */
const withOneMore = (save: CareerSave, id: string): CareerSave => ({ ...save, shop: { ...save.shop, [id]: (save.shop[id] ?? 0) + 1 } });

/**
 * Each vending row's info, keyed by row id. A row already at its cap shows the
 * same number on both sides, because buying is over; the card's button says so.
 */
export function vendingInfo(save: CareerSave, stat: StatWords, w: NeonCareerWords): Record<string, ItemInfo> {
  const out: Record<string, ItemInfo> = {};
  const now = statsOf(save);
  for (const row of NEON_SHOP.rows) {
    const words = w.item[row.id as ShopItemId];
    const owned = save.shop[row.id] ?? 0;
    const maxed = row.max !== undefined && owned >= row.max;
    const e = row.effect;
    if (e.kind === "count") {
      const to = maxed ? owned : owned + e.amount;
      out[row.id] = { name: words.name, says: words.says, stat: words.name, move: { label: words.name, from: String(owned), to: String(to) } };
      continue;
    }
    const after = maxed ? now : statsOf(withOneMore(save, row.id));
    out[row.id] = {
      name: words.name,
      says: words.says,
      stat: stat[e.stat],
      move: { label: stat[e.stat], from: statText(e.stat, now[e.stat]), to: statText(e.stat, after[e.stat]) },
    };
  }
  return out;
}

/** The diamond capsules' info: a name and a sentence; a look moves no number. */
export function capsuleInfo(w: NeonCareerWords): Record<"gold" | "ice" | "epic", ItemInfo> {
  return { gold: { ...w.item.gold }, ice: { ...w.item.ice }, epic: { ...w.item.epic } };
}
