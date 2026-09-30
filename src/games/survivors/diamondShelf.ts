// NEON'S DIAMOND SHELF: what diamonds buy here, and the boss diamond.
//
// Diamonds are the SITE's (src/sdk/diamonds.ts, operator ruling G13): one per boss
// beaten in any career game, spent on looks and special gear. This file owns only
// what Neon sells for them (the operator's pick, 2026-09-30): two LOOKS that
// recolour the robot - Gold bot and Ice bot, 3 each - and one EPIC piece of gear,
// 2, in the slot the player picks - never a slot that already holds an epic, since
// the kit stacks a duplicate (for boss drops) and only the worn piece counts.
//
// WHERE A PURCHASE LIVES. A look is Neon's, so it is saved under Neon's own key
// (`careerLooks`), never inside the kit's career save - that shape is pinned to the
// Toybox's by copied-rules.test.ts. An epic piece is gear, so it is banked into the
// career save the way a boss drop is.
//
// THE ORDER OF THE TWO WRITES. The item is written first and READ BACK, and only
// then are the diamonds taken; a spend the device refuses puts the item back. So a
// device that dies between the two writes can hand a child a free look - it can
// never take diamonds and give nothing. `diamonds.spend` has no memory of what it
// bought, which is why the order is the guard.
//
// Pure: no DOM, no Phaser. The diamonds and the stores are injected, so the tests
// run every path against a map.

import type { Diamonds } from "@sdk/diamonds";
import { SLOT_IDS, bankItems, itemKey, type SlotId } from "../../shared/career/gear";
import { readSave, writeSave, type CareerSave, type CareerStore } from "../../shared/career/save";
import { CAREER_KEY, NEON_GEAR } from "./careerRules";
import type { CareerResult } from "./types";
import { levelRow } from "./worlds";

/** Neon's looks, under this game's own storage. Persisted, so never renamed. */
export const LOOKS_KEY = "careerLooks";

export type LookId = "gold" | "ice";
export const LOOK_IDS: readonly LookId[] = ["gold", "ice"];

/**
 * A look is a hue turn on the robot's own sheet, never a second robot to keep in
 * step: `css` for the DOM (map, shop, gear), `hue`/`bright` for the arena's
 * colour matrix. The robot is red, so +45 lands on gold and +190 on ice blue.
 */
export const LOOKS: Record<LookId, { price: number; icon: string; hue: number; bright: number; css: string }> = {
  gold: { price: 3, icon: "botGold", hue: 45, bright: 1.25, css: "hue-rotate(45deg) saturate(1.3) brightness(1.25)" },
  ice: { price: 3, icon: "botIce", hue: 190, bright: 1.35, css: "hue-rotate(190deg) saturate(0.7) brightness(1.35)" },
};

/** One epic piece of gear, in the slot the player picks. */
export const EPIC_PRICE = 2;

/** Shelf row ids. Forever: never renamed, never reused. */
export const ROW = { gold: "look-gold", ice: "look-ice", epic: "epic-gear" } as const;

export interface LooksSave {
  owned: LookId[];
  worn: LookId | null;
}

const isLook = (v: unknown): v is LookId => v === "gold" || v === "ice";

/** The looks on this device; nothing usable reads as none owned, none worn. */
export function readLooks(store: CareerStore): LooksSave {
  try {
    const text = store.get(LOOKS_KEY);
    if (typeof text !== "string") return { owned: [], worn: null };
    const raw: unknown = JSON.parse(text);
    if (!raw || typeof raw !== "object") return { owned: [], worn: null };
    const r = raw as { owned?: unknown; worn?: unknown };
    const owned = Array.isArray(r.owned) ? LOOK_IDS.filter((id) => (r.owned as unknown[]).includes(id)) : [];
    const worn = isLook(r.worn) && owned.includes(r.worn) ? r.worn : null;
    return { owned, worn };
  } catch {
    return { owned: [], worn: null };
  }
}

/** Write the looks and report whether they READ BACK - `ctx.storage.set` swallows a refusal. */
export function writeLooks(store: CareerStore, looks: LooksSave): boolean {
  try {
    store.set(LOOKS_KEY, JSON.stringify(looks));
  } catch {
    return false;
  }
  const back = readLooks(store);
  return back.worn === looks.worn && back.owned.join() === looks.owned.join();
}

/** A shelf row as the kit's shop draws it. `tag` is shown instead of a price. */
export interface ShelfRow {
  id: string;
  icon: string;
  gain: string;
  cost: number;
  owned: number;
  afford: boolean;
  maxed: boolean;
  tag?: string;
}

/** The slots that already hold an epic piece, from a purchase or a boss drop. */
export function epicSlotsOwned(save: CareerSave): SlotId[] {
  return SLOT_IDS.filter((slot) => save.gear.owned.includes(itemKey(slot, "epic")));
}

/**
 * The three capsules. An owned look sells no more: it offers to be worn instead.
 * The epic capsule is sold out once `epicHeld` (epicSlotsOwned().length) covers every slot.
 */
export function shelfRows(looks: LooksSave, diamonds: number, words: { wear: string; worn: string; gold: string; ice: string; epic: string }, epicHeld = 0): ShelfRow[] {
  const look = (id: LookId): ShelfRow => {
    const owned = looks.owned.includes(id);
    const tag = !owned ? undefined : looks.worn === id ? words.worn : words.wear;
    return { id: ROW[id], icon: LOOKS[id].icon, gain: words[id], cost: LOOKS[id].price, owned: owned ? 1 : 0, afford: owned || diamonds >= LOOKS[id].price, maxed: false, tag };
  };
  return [look("gold"), look("ice"), { id: ROW.epic, icon: "crown", gain: words.epic, cost: EPIC_PRICE, owned: 0, afford: diamonds >= EPIC_PRICE, maxed: epicHeld >= SLOT_IDS.length }];
}

export type ShelfResult =
  | { ok: true; looks: LooksSave; save: CareerSave; spent: number }
  | { ok: false; why: "short" | "unsaved" | "unknown" | "owned" };

/**
 * Press a look's capsule: WEAR it if it is owned (free, toggles off if worn),
 * otherwise BUY it - item first, then the diamonds, the item put back if the
 * spend does not land.
 */
export function pressLook(d: Diamonds, store: CareerStore, id: LookId): ShelfResult {
  const before = readLooks(store);
  const save = readSave(store, CAREER_KEY);
  if (before.owned.includes(id)) {
    const next = { owned: before.owned, worn: before.worn === id ? null : id };
    return writeLooks(store, next) ? { ok: true, looks: next, save, spent: 0 } : { ok: false, why: "unsaved" };
  }
  const price = LOOKS[id].price;
  if (d.count < price) return { ok: false, why: "short" };
  const next: LooksSave = { owned: LOOK_IDS.filter((l) => l === id || before.owned.includes(l)), worn: id };
  if (!writeLooks(store, next)) return { ok: false, why: "unsaved" };
  const paid = d.spend(price);
  if (!paid.ok) {
    writeLooks(store, before);
    return { ok: false, why: paid.reason === "unaffordable" ? "short" : "unsaved" };
  }
  return { ok: true, looks: next, save, spent: price };
}

/**
 * Buy one epic piece for `slot`: banked into the career save first, then paid for.
 * A slot that already holds one is refused before anything is read off the balance.
 */
export function buyEpic(d: Diamonds, store: CareerStore, slot: SlotId): ShelfResult {
  const before = readSave(store, CAREER_KEY);
  if (epicSlotsOwned(before).includes(slot)) return { ok: false, why: "owned" };
  if (d.count < EPIC_PRICE) return { ok: false, why: "short" };
  const key = itemKey(slot, "epic");
  const next = bankItems(NEON_GEAR, before, [key]);
  const landed = writeSave(store, CAREER_KEY, next) && readSave(store, CAREER_KEY).gear.owned.length === next.gear.owned.length;
  if (!landed) return { ok: false, why: "unsaved" };
  const paid = d.spend(EPIC_PRICE);
  if (!paid.ok) {
    writeSave(store, CAREER_KEY, before);
    return { ok: false, why: paid.reason === "unaffordable" ? "short" : "unsaved" };
  }
  return { ok: true, looks: readLooks(store), save: next, spent: EPIC_PRICE };
}

/**
 * The boss diamond: a WON BOSS level pays what `economy.ts` says `boss_defeated`
 * is worth, once per run token - the same token the gold is paid under, so a run
 * reported twice pays one diamond. A loss, or any other level, pays nothing.
 */
export function payBossDiamond(d: Diamonds, r: CareerResult, token: string): number {
  if (!r.won || !levelRow(r.level).boss) return 0;
  return d.grant("boss_defeated", `survivors:${token}`).granted;
}
