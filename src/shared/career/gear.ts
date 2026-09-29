// GEAR: three slots, three tiers, what a drop rolls, and what wearing adds.
//
// Carried over from the Toybox (studio/toybox/campaign/gear.ts) with the
// operator's rulings intact - "Three slots" (weapon, armor, ring), "Bigger
// numbers" (an item moves one stat and nothing else), and auto-equip: an item
// found that beats its slot is worn on the spot, so a player who never opens the
// gear screen still gets stronger. Re-typed for the site: an item is a readable
// string "<slot>:<tier>" instead of the Toybox's packed integer, and a slot
// names a career STAT rather than the Toybox's hp/power/mana.
//
// THE RNG IS INJECTED, LAST, as every game here takes it (src/shared/rng.ts), so
// a drop is reproducible in a test and in a replay. gear.test.ts rolls 10,000.

import type { StatId } from "./stats";
import type { StatModifier } from "./stats";
import type { CareerSave } from "./save";

export const SLOT_IDS = ["weapon", "armor", "ring"] as const;
export type SlotId = (typeof SLOT_IDS)[number];

/** common first: the ORDER is the ranking and the roll's walk */
export const TIERS = ["common", "rare", "epic"] as const;
export type Tier = (typeof TIERS)[number];

export interface GearSlotDef {
  id: SlotId;
  stat: StatId;
  /** what one item of each tier adds to `stat` */
  values: Record<Tier, number>;
}

export interface GearFile {
  /** exactly one per slot, in SLOT_IDS order */
  slots: GearSlotDef[];
  /** the chance a drop is each tier; they add up to 1 */
  odds: Record<Tier, number>;
}

/** what a run owns (a multiset: two identical items are two entries) and what each slot wears */
export interface GearSave {
  owned: string[];
  equipped: Partial<Record<SlotId, string | null>>;
}

export const itemKey = (slot: SlotId, tier: Tier): string => `${slot}:${tier}`;

/** an item key read back, or null for one this kit cannot describe */
export function parseItem(key: string): { slot: SlotId; tier: Tier } | null {
  const [slot, tier, extra] = key.split(":");
  if (extra !== undefined) return null;
  if (!(SLOT_IDS as readonly string[]).includes(slot) || !(TIERS as readonly string[]).includes(tier)) return null;
  return { slot: slot as SlotId, tier: tier as Tier };
}

/** every reason this gear file cannot be used, or an empty list */
export function gearProblems(file: GearFile): string[] {
  const out: string[] = [];
  SLOT_IDS.forEach((id, i) => {
    const s = file.slots[i];
    if (!s || s.id !== id) { out.push(`gear slot ${i + 1} must be "${id}"`); return; }
    for (let t = 1; t < TIERS.length; t++) {
      if (!(s.values[TIERS[t]] > s.values[TIERS[t - 1]])) out.push(`gear slot "${id}": ${TIERS[t]} must be worth more than ${TIERS[t - 1]}`);
    }
  });
  if (file.slots.length !== SLOT_IDS.length) out.push(`gear has ${file.slots.length} slots, not ${SLOT_IDS.length}`);
  const sum = TIERS.reduce((a, t) => a + file.odds[t], 0);
  if (TIERS.some((t) => !(file.odds[t] >= 0)) || Math.abs(sum - 1) > 1e-9) out.push(`gear odds add up to ${sum}, not 1`);
  return out;
}

/** one tier, walked common -> rare -> epic against one draw of `rng` */
export function rollTier(odds: Record<Tier, number>, rng: () => number = Math.random): Tier {
  const r = rng();
  let edge = 0;
  for (const t of TIERS) {
    edge += odds[t];
    if (r < edge) return t;
  }
  // a draw past every edge (odds adding to 0.9999999 by float rounding) is the rarest tier, never undefined
  return TIERS[TIERS.length - 1];
}

/** one drop: a slot, evenly, then a tier by the odds */
export function rollDrop(file: GearFile, rng: () => number = Math.random): string {
  const slot = SLOT_IDS[Math.min(SLOT_IDS.length - 1, Math.floor(rng() * SLOT_IDS.length))];
  return itemKey(slot, rollTier(file.odds, rng));
}

/** what an item adds, or 0 for an item this file cannot describe */
export function itemValue(file: GearFile, key: string): number {
  const it = parseItem(key);
  if (!it) return 0;
  const slot = file.slots.find((s) => s.id === it.slot);
  return slot ? slot.values[it.tier] : 0;
}

const beats = (file: GearFile, item: string, worn: string | null | undefined): boolean =>
  worn === null || worn === undefined || itemValue(file, item) > itemValue(file, worn);

/** keep everything found, and wear on the spot whatever beats its slot. An item it cannot read is kept and never worn */
export function bankItems(file: GearFile, save: CareerSave, found: readonly string[]): CareerSave {
  if (found.length === 0) return save;
  const owned = [...save.gear.owned];
  const equipped = { ...save.gear.equipped };
  for (const key of found) {
    owned.push(key);
    const it = parseItem(key);
    if (it && itemValue(file, key) > 0 && beats(file, key, equipped[it.slot])) equipped[it.slot] = key;
  }
  return { ...save, gear: { owned, equipped } };
}

/** wear an item the run owns; anything not owned, or already worn, hands the same save back */
export function equipItem(file: GearFile, save: CareerSave, key: string): CareerSave {
  const it = parseItem(key);
  if (!it || itemValue(file, key) === 0 || !save.gear.owned.includes(key)) return save;
  if (save.gear.equipped[it.slot] === key) return save;
  return { ...save, gear: { ...save.gear, equipped: { ...save.gear.equipped, [it.slot]: key } } };
}

/** what the worn items add, as stat modifiers - weapon, armor, ring in that order */
export function gearModifiers(file: GearFile, save: CareerSave): StatModifier[] {
  const out: StatModifier[] = [];
  for (const slot of file.slots) {
    const worn = save.gear.equipped[slot.id];
    if (!worn) continue;
    const amount = itemValue(file, worn);
    if (amount > 0) out.push({ stat: slot.stat, kind: "add", amount });
  }
  return out;
}

// ---- the gear screen, as data ------------------------------------------------

export interface SlotView { id: SlotId; stat: StatId; tier: Tier | null; key: string | null; value: number }
export interface BagItemView { key: string; slot: SlotId; tier: Tier; count: number; worn: boolean; value: number }
export interface GearView { slots: SlotView[]; bag: BagItemView[] }

/** three slots and the bag: identical items are one entry with a count, best tier first, then slot order */
export function gearView(file: GearFile, save: CareerSave): GearView {
  const slots: SlotView[] = file.slots.map((s) => {
    const key = save.gear.equipped[s.id] ?? null;
    const it = key ? parseItem(key) : null;
    return { id: s.id, stat: s.stat, tier: it ? it.tier : null, key: it ? key : null, value: key ? itemValue(file, key) : 0 };
  });
  const counts = new Map<string, number>();
  for (const key of save.gear.owned) if (parseItem(key)) counts.set(key, (counts.get(key) ?? 0) + 1);
  const worn = new Set(Object.values(save.gear.equipped));
  const bag: BagItemView[] = [...counts.entries()].map(([key, count]) => {
    const it = parseItem(key)!;
    return { key, slot: it.slot, tier: it.tier, count, worn: worn.has(key), value: itemValue(file, key) };
  });
  bag.sort((a, b) => TIERS.indexOf(b.tier) - TIERS.indexOf(a.tier) || SLOT_IDS.indexOf(a.slot) - SLOT_IDS.indexOf(b.slot));
  return { slots, bag };
}
