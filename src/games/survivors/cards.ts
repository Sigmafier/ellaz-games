// The level-up cards: upgrades, a new weapon while a slot is free, and - since
// 2026-09-21 - a LEVEL for a weapon the run already carries.
//
// Operator ruling 2026-09-14, picked off a mock drawn on the real level-up
// screen: a new weapon arrives as a card beside the upgrades, and it takes a
// slot. With four slots full the cards are upgrades only, exactly as before.
//
// Operator ruling 2026-09-21: a weapon has its own level, and maxing your
// starting weapon is what unlocks its superpower version. So a third card kind
// exists, and it is the one a player spends most of a run taking.
//
// Re-ruled 2026-09-30: the SUPER POWER (`kind: "evolve"`) is no longer a
// level-up card. A boss or a mini-boss kill raises it (`raiseSuper`) and this
// file only hands over the one that kill named.
//
// `logic.ts` does not import this file, so importing values from it is one-way.

import { POOL, SLOTS_MAX, holds } from "./arsenal";
import { WEAPON_LV_MAX, canLevel, freshSlot } from "./weapons";
import { applyEvolve } from "./evolve";
import { applyUpgrade, offerUpgrades, type RunState, type UpgradeId, type WeaponId } from "./logic";
import { PASSIVE_SLOTS, UPGRADE_IDS } from "./upgrades";

export type Card =
  | { kind: "weapon"; id: WeaponId }
  | { kind: "level"; id: WeaponId; to: number }
  | { kind: "evolve"; id: WeaponId }
  | { kind: "upgrade"; id: UpgradeId };

/**
 * Three cards.
 *
 * The shape is unchanged from the day the weapon card landed, and deliberately:
 * while a slot is free and a weapon remains that the run does not carry, the
 * FIRST card is one such weapon, chosen at random - so a new weapon is always on
 * offer but never forced, and a player who wants to keep their loadout small
 * simply takes something else.
 *
 * WHAT CHANGED is the pool the other cards come from. It used to be upgrades
 * only; it is now upgrades AND a level for each carried weapon that is not at
 * `WEAPON_LV_MAX`. Both are drawn from one shuffled pool rather than one
 * guaranteed of each, because a guaranteed level card would make levelling free
 * - the whole point of an evolution costing seven to ten cards is that taking
 * them is a CHOICE against the upgrades, and a choice needs the two to compete.
 *
 * Built on `offerUpgrades`, so everything it promises still holds for the
 * upgrade cards: never a maxed one, never the same one twice, and an empty list
 * when there is nothing left, which the scene reads as "carry on".
 */
export function offerCards(s: RunState, rng: () => number = Math.random): Card[] {
  // A SUPER POWER ON OFFER JUMPS THE QUEUE, and it is the one card that does.
  //
  // It is on offer only because a boss or a mini-boss just fell with a super
  // ready (`raiseSuper`), and it is offered ALONE, so the moment reads as a
  // reward for that kill rather than as another three-way pick. A level-up with
  // a ready super and no kill behind it offers ordinary cards: that is the
  // operator's rule, not an omission. No rng draw here, for the reason
  // `raiseSuper` gives.
  if (s.pendingSuper) return [{ kind: "evolve", id: s.pendingSuper }];

  const unheld = s.slots.length < SLOTS_MAX ? POOL.filter((id) => !holds(s, id)) : [];
  // A NEW WEAPON IS GUARANTEED only until four are held. Six slots arrived on
  // 2026-10-02 ("ack B"), and a guaranteed weapon card for all six spread every
  // level over six level-1 guns: no weapon reached level 5, so no run ever
  // earned a super (wild, careful bot: 0 supers on all five seeds). The fifth and
  // sixth weapons compete in the shuffled pool with the levels and upgrades.
  const forced = s.slots.length < GUARANTEED_WEAPONS && unheld.length > 0;
  const pick = unheld.length > 0 ? unheld[Math.floor(rng() * unheld.length)] : null;
  const weapon: Card[] = forced && pick ? [{ kind: "weapon", id: pick }] : [];

  const want = 3 - weapon.length;
  // Every level a carried weapon could still take, one card each.
  const levels: Card[] = s.slots.filter(canLevel).map((k) => ({ kind: "level", id: k.id, to: k.lv + 1 }));
  // Ask `offerUpgrades` for as many as could possibly be wanted, then shuffle the
  // two kinds together and take the top. Asking for exactly `want` and topping up
  // with levels would put upgrades first whenever both existed, which is a bias
  // nobody chose and which would have made a maxed weapon much harder to reach.
  const ups: Card[] = offerUpgrades(s, rng, want).map((id): Card => ({ kind: "upgrade", id }));

  const pool = [...levels, ...ups, ...(!forced && pick ? [{ kind: "weapon", id: pick } as Card] : [])];
  const picked: Card[] = [];
  while (picked.length < want && pool.length > 0) {
    picked.push(pool.splice(Math.floor(rng() * pool.length), 1)[0]);
  }
  return [...weapon, ...picked];
}

/**
 * Take one.
 *
 * A weapon lands in the next free slot at level one, ready to fire on this
 * frame. A level card raises that weapon's own level, capped - a card offering a
 * sixth level cannot be built by `offerCards`, and if one ever reached here it
 * would be ignored rather than quietly breaking the cap.
 */
export function applyCard(s: RunState, card: Card): RunState {
  if (card.kind === "upgrade") return applyUpgrade(s, card.id);
  s.choosing = false;
  if (card.kind === "evolve") {
    applyEvolve(s, card.id);
    if (s.pendingSuper === card.id) s.pendingSuper = null;
    // A level-up that landed on the super's frame is still owed: the run stays
    // paused, and the next `offerCards` is that level-up's three cards.
    if (s.levelOwed) {
      s.levelOwed = false;
      s.choosing = true;
    }
    return s;
  }
  if (card.kind === "level") {
    const slot = s.slots.find((k) => k.id === card.id);
    if (slot && slot.lv < WEAPON_LV_MAX) slot.lv += 1;
    return s;
  }
  if (s.slots.length < SLOTS_MAX && !holds(s, card.id)) s.slots.push(freshSlot(card.id));
  return s;
}

/**
 * THE REROLL (operator ruling 2026-10-02, card option B): one free swap of an
 * offer per stage. The SCENE keeps the count - the simulation never sees it, so a
 * run with no reroll pressed is draw-for-draw the run it always was.
 */
export const REROLLS_PER_STAGE = 1;

/** How many weapons a run is offered without fail; past this a weapon card has to come up. */
export const GUARANTEED_WEAPONS = 4;

/** A reroll swaps ordinary cards only: a super power is the reward for a kill and is never rerolled. */
export const canReroll = (offer: readonly Card[], left: number): boolean =>
  left > 0 && offer.length > 0 && offer.every((c) => c.kind !== "evolve");

/**
 * The counts the level-up screen shows: weapons held out of `SLOTS_MAX`, powers held
 * out of `PASSIVE_SLOTS` - the slot LIMITS. Until 2026-10-03 the powers line divided
 * by the number of power-ups that exist (9, then 12), which no run can ever hold.
 */
export function slotCounts(slots: readonly WeaponId[], taken: Record<UpgradeId, number>): { weapons: { held: number; of: number }; powers: { held: number; of: number } } {
  return {
    weapons: { held: slots.length, of: SLOTS_MAX },
    powers: { held: UPGRADE_IDS.filter((id) => (taken[id] ?? 0) > 0).length, of: PASSIVE_SLOTS },
  };
}
