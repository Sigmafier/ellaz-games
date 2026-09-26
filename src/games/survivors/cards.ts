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
// `logic.ts` does not import this file, so importing values from it is one-way.

import { POOL, SLOTS_MAX, holds } from "./arsenal";
import { WEAPON_LV_MAX, canLevel, freshSlot } from "./weapons";
import { applyEvolve, evolvable } from "./evolve";
import { applyUpgrade, offerUpgrades, type RunState, type UpgradeId, type WeaponId } from "./logic";

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
  // AN EVOLUTION JUMPS THE QUEUE, and it is the one card that does.
  //
  // A run reaches the recipe - Lv5 and the partner upgrade maxed - perhaps once,
  // and it has spent most of its cards getting there. Leaving that card to a
  // one-in-three shuffle would mean a player who did everything the game asked
  // might simply never be offered it, which is the worst possible answer to the
  // work. It is offered ALONE, so the moment reads as a moment rather than as
  // another three-way pick.
  const ready = evolvable(s);
  if (ready.length > 0) return [{ kind: "evolve", id: ready[Math.floor(rng() * ready.length)].id }];

  const unheld = s.slots.length < SLOTS_MAX ? POOL.filter((id) => !holds(s, id)) : [];
  const weapon: Card[] = unheld.length > 0 ? [{ kind: "weapon", id: unheld[Math.floor(rng() * unheld.length)] }] : [];

  const want = 3 - weapon.length;
  // Every level a carried weapon could still take, one card each.
  const levels: Card[] = s.slots.filter(canLevel).map((k) => ({ kind: "level", id: k.id, to: k.lv + 1 }));
  // Ask `offerUpgrades` for as many as could possibly be wanted, then shuffle the
  // two kinds together and take the top. Asking for exactly `want` and topping up
  // with levels would put upgrades first whenever both existed, which is a bias
  // nobody chose and which would have made a maxed weapon much harder to reach.
  const ups: Card[] = offerUpgrades(s, rng, want).map((id): Card => ({ kind: "upgrade", id }));

  const pool = [...levels, ...ups];
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
  if (card.kind === "evolve") return applyEvolve(s, card.id);
  if (card.kind === "level") {
    const slot = s.slots.find((k) => k.id === card.id);
    if (slot && slot.lv < WEAPON_LV_MAX) slot.lv += 1;
    return s;
  }
  if (s.slots.length < SLOTS_MAX && !holds(s, card.id)) s.slots.push(freshSlot(card.id));
  return s;
}
