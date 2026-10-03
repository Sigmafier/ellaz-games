// THE RECIPE HINT (operator ruling 2026-10-03, "Show supers"): "Lv4 + Spread =
// Storm", shown during a run when a carried weapon is ONE card from its super -
// either one level short with the partner held, or at the level with the partner
// missing. Two steps away it says nothing (the weapon pick already teaches the
// recipe), and a weapon that is ready waits for a boss or elite kill, which is a
// different sentence the chest already says.
//
// Pure: the run in, a small record out; the words are the caller's.

import { PARTNER_NEED, RECIPE, SUPER_LV, hasEvolution } from "./evolve";
import type { RunState, UpgradeId, WeaponId } from "./types";

export interface SuperHint {
  weapon: WeaponId;
  partner: UpgradeId;
  lv: number;
  missing: "level" | "partner";
}

/** The first carried weapon (the main one first) that is exactly one card from its super, or null. */
export function superHintOf(s: Pick<RunState, "slots" | "up">): SuperHint | null {
  const order = [...s.slots].sort((a, b) => Number(!!b.main) - Number(!!a.main));
  for (const slot of order) {
    if (slot.evolved || !hasEvolution(slot.id)) continue;
    const partner = RECIPE[slot.id];
    const lvShort = Math.max(0, SUPER_LV - slot.lv);
    const partnerShort = s.up[partner] >= PARTNER_NEED ? 0 : 1;
    if (lvShort + partnerShort !== 1) continue;
    return { weapon: slot.id, partner, lv: SUPER_LV, missing: lvShort ? "level" : "partner" };
  }
  return null;
}

/** "Lv4 + Spread = Storm" - `lv` carries "{n}" for the level number. */
export const hintText = (lv: string, n: number, partner: string, superName: string): string =>
  `${lv.replace("{n}", String(n))} + ${partner} = ${superName}`;
