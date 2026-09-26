// What a weapon becomes when you take it to the top.
//
// Operator ruling 2026-09-21: level your starting weapon to max and it turns
// into a superpower version of itself - survivor.io's evolution, and the reason
// per-weapon levels exist at all. The recipe is Lv5 AND the weapon's partner
// upgrade maxed, so an evolution costs 4 level cards plus 3 to 8 upgrade cards
// out of a run that yields about 22. It is a CHOICE, which is the whole point.
//
// AN EVOLUTION IS A FLAG, NOT A NEW WEAPON. The slot keeps its `id` and gains
// `evolved`, and `rowFor` hands back the evolved row instead of the base one.
// The alternative - five new `WeaponId`s - would mean five new inks, five draw
// branches, five art components and five names in four languages, and it would
// read as a different weapon arriving rather than as YOUR weapon grown up. Same
// reading the stage bosses already took: a warden is a deeper pink because it is
// the big version of the pink thing.
//
// What it must NOT become is one shape at a bigger size. Each evolution below
// is a BEHAVIOUR the base weapon does not have, so each is a different motion on
// screen rather than a louder one.
//
// Imports types and `upgrades` only - `weapons.ts` imports THIS, so anything
// here importing back would close the loop that `types.ts` exists to prevent.

import type { RunState, Slot, UpgradeId, WeaponId, WeaponRow } from "./types";
import { UPGRADE_CAP, WEAPON_LV_MAX } from "./upgrades";

/**
 * Which upgrade each weapon needs MAXED before it can evolve.
 *
 * Chosen so the pairing is the one a player would already be taking for that
 * weapon - pierce for the straight shot, spread for the one that fans, power for
 * the ring - rather than an arbitrary lock. `magnet` and `heart` are pair to
 * nothing on purpose: they are utility, and making them a gate would mean a run
 * that took them for their own sake had accidentally spent its evolution.
 */
export const RECIPE: Record<WeaponId, UpgradeId> = {
  bolt: "pierce",
  arc: "spread",
  burst: "power",
  blades: "swift",
  drone: "rapid",
};

/**
 * One evolution: the name it takes and the row it fires by.
 *
 * `row` is `null` for an evolution whose BEHAVIOUR has not been built yet, and
 * `canEvolve` refuses those. That is deliberate rather than a placeholder: this
 * table is the one place that says which evolutions exist, so a card can never
 * be offered for something the simulation cannot then do. A row with no
 * behaviour behind it is exactly the "armed lever with no caller" this repo has
 * a rule about.
 */
export type Evolution = { name: string; row: WeaponRow | null };

/**
 * The five, and the three that are built.
 *
 * Every row is the BASE weapon's row with its own numbers, so an evolved weapon
 * still reads as the thing it came from. The behaviour each one adds lives in
 * `weapons.ts` (how it is thrown) and `logic.ts` (what it does on contact),
 * keyed on `slot.evolved` - never on the name, which is a label for a player.
 */
export const EVOLUTIONS: Record<WeaponId, Evolution> = {
  // RAILGUN - the bolt stops being a bullet and becomes a beam. Far faster,
  // hits much harder, and passes through EVERYTHING rather than counting down a
  // pierce budget. The motion is a long streak where the bolt drew a short one.
  bolt: {
    name: "railgun",
    row: { speed: 560, life: 1400, turn: 0, count: 1, bonus: 4, r: 7, sfx: "tap", every: 1.25 },
  },
  // STORM - the arc stops chasing one shape and jumps between them. Two go out
  // per shot, they steer harder, and each one CHAINS on contact to the next
  // shape in reach. The motion is a visible link between two enemies.
  arc: {
    name: "storm",
    row: { speed: 240, life: 2400, turn: 4.4, count: 2, bonus: 2, r: 6, sfx: "flip", every: 1.35 },
  },
  // NOVA - the ring is still a ring, and where each fragment dies it leaves
  // BURNING GROUND. The motion is the ring you already know followed by a
  // circle of fire that stays; the fragments are shorter-lived than the burst's
  // so the fire lands as a ring rather than scattered across the view.
  burst: {
    name: "nova",
    row: { speed: 165, life: 460, turn: 0, count: 8, bonus: 1, r: 7, sfx: "star", every: 2 },
  },
  // SAWSTORM - the blades stop being a ring at a fixed distance and BREATHE:
  // out to `SAW_REACH` and back, once per turn of the ring. The motion is the
  // reach changing, which is the one thing a ring at a fixed radius cannot do.
  blades: {
    name: "sawstorm",
    // `blades` never throws anything, so this row is never read by `fireSlot` -
    // it exists because `hasEvolution` asks whether a row is there, and the
    // blades' behaviour lives in `bladePositions` and the blade loop instead.
    // `bonus` still has to beat the base row's 0, which the evolve test checks.
    row: { speed: 0, life: 0, turn: 0, count: 0, bonus: 2, r: 0, sfx: "star", every: 0 },
  },
  // SWARM - one drone becomes three, each on its own arc of the circle and each
  // firing. The motion is three sources instead of one, which is the clearest
  // read of "more" there is.
  drone: {
    name: "swarm",
    row: { speed: 320, life: 1300, turn: 0, count: 1, bonus: 1, r: 4, sfx: "coin", every: 1.2 },
  },
};

/** How many drones a SWARM flies. One is the ordinary drone. */
export const SWARM_DRONES = 3;

/** How long a patch of NOVA fire burns, and how far it reaches. */
export const NOVA_FIRE = { ms: 2600, r: 26, hitMs: 420 } as const;

/** The most patches that may burn at once, so a corner-camped nova cannot flood the world. */
export const CAP_FIRES = 28;

/** How far past the ring a SAWSTORM blade reaches at the top of its breath. */
export const SAW_REACH = 92;

/** Does this weapon have an evolution that is actually built? */
export const hasEvolution = (id: WeaponId): boolean => EVOLUTIONS[id].row !== null;

/** The partner upgrade's progress toward the gate, 0..1 - for the card's recipe line. */
export const recipeProgress = (s: RunState, id: WeaponId): number => {
  const up = RECIPE[id];
  return Math.max(0, Math.min(1, s.up[up] / UPGRADE_CAP[up]));
};

/**
 * May this slot evolve right now?
 *
 * Three things, and all three are load-bearing: it is not already evolved, it is
 * at the level cap, and its partner upgrade is maxed. The last one is what makes
 * an evolution cost a run's worth of choosing rather than four level cards.
 */
export function canEvolve(s: RunState, slot: Slot): boolean {
  if (slot.evolved) return false;
  if (!hasEvolution(slot.id)) return false;
  if (slot.lv < WEAPON_LV_MAX) return false;
  const up = RECIPE[slot.id];
  return s.up[up] >= UPGRADE_CAP[up];
}

/** Every carried weapon that could evolve this instant. */
export const evolvable = (s: RunState): Slot[] => s.slots.filter((k) => canEvolve(s, k));

/** Take it. Idempotent, and it never touches any other slot. */
export function applyEvolve(s: RunState, id: WeaponId): RunState {
  const slot = s.slots.find((k) => k.id === id);
  if (slot && canEvolve(s, slot)) slot.evolved = true;
  return s;
}
