import type { WeaponId } from "./types";

export type Rarity = "common" | "rare" | "epic";
export const RARITY: Record<WeaponId, Rarity> = { bolt: "common", arc: "common", burst: "rare", blades: "rare", drone: "epic", halo: "common", zap: "rare", flask: "common", bouncer: "rare" };

// THE WEAPON COLLECTION (operator ruling 2026-09-30, "like Survivor.io"): a run
// starts on one MAIN weapon picked from all five. Rarity is fixed per weapon and
// is a perk for the main weapon - common none, rare +20% damage, epic starts at
// level 2 (the perk itself lives in the run's rules; this file only says which
// weapon has which). Two of the five are locked until a career world is won.
//
// The two exports above are written byte-for-byte the same by the lane that
// builds the weapon RULES, so the two halves merge without a conflict; what
// follows is the entrance's half - what is open, and the stored pick validated.

import { MAIN_POOL } from "./arsenal";
import { CAREER_KEY } from "./careerRules";
import { nodeStates } from "../../shared/career/progress";
import { readSave, type CareerSave, type CareerStore } from "../../shared/career/save";
import type { WorldId } from "./types";
import { NEON_CAMPAIGN } from "./worlds";

/** Which career world must be WON before a weapon can be picked. The rest are open from the start. */
export const UNLOCK: Partial<Record<WeaponId, WorldId>> = { blades: "city", drone: "frost" };

/**
 * Is this world won - its boss cleared, as the career map reads it? Through the
 * kit's `nodeStates`, whose "done" stops at the first gap, so a star recorded
 * past a gap (a hand-edited save) opens nothing here either.
 */
export function worldWon(save: CareerSave, world: WorldId): boolean {
  return nodeStates(NEON_CAMPAIGN, save).some((v) => v.node.world === world && v.node.boss && v.state === "done");
}

/** The weapons this save may take as its main weapon, in the collection's own order. */
export function weaponsOpen(save: CareerSave): WeaponId[] {
  return MAIN_POOL.filter((id) => {
    const w = UNLOCK[id];
    return !w || worldWon(save, w);
  });
}

/** The same, read straight off a store - for the quick run, which does not hold the save. */
export const weaponsOpenIn = (store: CareerStore): WeaponId[] => weaponsOpen(readSave(store, CAREER_KEY));

/**
 * A stored main weapon, validated rather than trusted: one this save may pick
 * stands, and anything else - locked, unknown, or not written by this app -
 * reads as the bolt, which is always open.
 */
export const asMainWeapon = (v: unknown, open: readonly WeaponId[]): WeaponId =>
  (open as readonly unknown[]).includes(v) ? (v as WeaponId) : "bolt";

/** "Win World {n}": the world's number in the campaign, for a locked card's line. */
export const unlockNumber = (id: WeaponId): number | null => {
  const w = UNLOCK[id];
  return w ? NEON_CAMPAIGN.worlds.findIndex((x) => x.id === w) + 1 : null;
};
