// What the kit's screens wear for Snake Survivors: Fangs, Scales and a Charm on
// the three slots, the snake's own stat names, and what each shop row adds.
//
// Pure - no DOM, and only TYPES from the kit - so it tests in node and adds
// nothing to anybody's first visit. The colours are game art, fixed in every
// theme like the arena's own.

import type { CareerSave } from "../../shared/career/save";
import type { StatId } from "../../shared/career/stats";
import type { ItemInfo } from "../../ui/career/InfoCard";
import type { CareerSkin } from "../../ui/career/skin";
import { SNAKE_SHOP, statsOf } from "./careerRules";
import type { SnakeCareerWords, SnakeShopId } from "./careerWords";

const MINT = "#55efc4";
const SKY = "#74b9ff";
const SUN = "#ffd166";

/**
 * The snake's skin over the kit. A tier tints the piece the way the kit tints a
 * Neon piece: grey-white, blue, gold. Length's bar wears the snake, crush's the fang.
 */
export function snakeSkin(w: SnakeCareerWords): Partial<CareerSkin> {
  return {
    slotIcon: { weapon: "fang", armor: "scales", ring: "charm" },
    art: {
      weapon: { common: "#f5f6ff", rare: SKY, epic: SUN },
      armor: { common: "#b2bec3", rare: MINT, epic: SUN },
      ring: { common: "#dfe6e9", rare: SKY, epic: SUN },
    },
    statIcon: { health: ["snake", MINT], speed: ["dash", MINT], damage: ["fang", SUN], magnet: ["magnet", "#ff6b6b"], luck: ["clover", "#2bb58a"] },
    words: { slot: w.slot, stat: w.stat },
  };
}

const PERCENT: ReadonlySet<StatId> = new Set<StatId>(["damage", "speed", "magnet"]);

/** One stat as the player reads it: whole segments and points, whole percents. */
export function statText(stat: StatId, value: number): string {
  const n = Math.round(value);
  return PERCENT.has(stat) ? `${n}%` : String(n);
}

const withOneMore = (save: CareerSave, id: string): CareerSave => ({ ...save, shop: { ...save.shop, [id]: (save.shop[id] ?? 0) + 1 } });

/**
 * Each vending row's info card, keyed by row id: its name, one sentence, and the
 * number it moves - what the snake has NOW beside what it would have after one
 * more (operator ruling 2026-10-02, "in shop we must know whats each item adds").
 * A row at its cap shows the same number on both sides.
 */
export function snakeShopInfo(save: CareerSave, w: SnakeCareerWords): Record<string, ItemInfo> {
  const out: Record<string, ItemInfo> = {};
  const now = statsOf(save);
  for (const row of SNAKE_SHOP.rows) {
    const words = w.item[row.id as SnakeShopId];
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
      stat: w.stat[e.stat],
      move: { label: w.stat[e.stat], from: statText(e.stat, now[e.stat]), to: statText(e.stat, after[e.stat]) },
    };
  }
  return out;
}
