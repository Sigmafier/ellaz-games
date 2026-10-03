// A career game's SKIN over the kit: the pictures its three gear slots wear, the
// colour each tier tints them, the icon beside each stat bar, and the game's own
// words for its slots and stats.
//
// WHY THIS EXISTS (snake career S1, 2026-10-03). The kit was built for Neon
// Survival and drew a sword, a shirt and a ring for weapon, armor and ring, and
// called them that. Snake Survivors wears the SAME three slot ids (they are
// forever - `SLOT_IDS` in src/shared/career/gear.ts) as Fangs, Scales and a
// Charm, and its "health" is a starting LENGTH. A slot id is a save key and must
// not move; what it LOOKS like and what it is CALLED is the game's to say.
//
// NEON IS THE DEFAULT, value for value. A screen handed no skin draws exactly
// what it drew before this file existed - `skin.test.ts` holds every entry of
// `NEON_SKIN` against the literals the screens used to carry, so Neon's gear
// screen cannot move under it.
//
// The colours are the kit's palette (`P`), never a literal: this file is not one
// of the art files token-hygiene.test.ts exempts.

import type { SlotId, Tier } from "../../shared/career/gear";
import type { StatId } from "../../shared/career/stats";
import { P } from "./palette";
import type { CareerWords } from "./words";

export interface CareerSkin {
  /** the career icon each slot is drawn with */
  slotIcon: Record<SlotId, string>;
  /** the colour each slot's icon is tinted at each tier; undefined draws the icon's own colour */
  art: Record<SlotId, Record<Tier, string | undefined>>;
  /** each stat bar's icon and its fill colour */
  statIcon: Record<StatId, readonly [string, string]>;
  /** the game's own words for its slots and stats, already in the player's language; absent keys read the kit's */
  words?: { slot?: Partial<CareerWords["slot"]>; stat?: Partial<CareerWords["stat"]> };
}

/** Neon Survival's look - the kit's look before skins existed. */
export const NEON_SKIN: CareerSkin = {
  slotIcon: { weapon: "sword", armor: "armor", ring: "ring" },
  art: {
    weapon: { common: undefined, rare: undefined, epic: undefined },
    armor: { common: P.steel, rare: P.sky, epic: P.sun },
    ring: { common: P.silver, rare: P.sun, epic: P.sun },
  },
  statIcon: {
    health: ["heart", P.rose], speed: ["boot", P.aqua], damage: ["bolt", P.sun], magnet: ["magnet", P.coral], luck: ["clover", P.mint],
  },
};

/** a game's partial skin laid over Neon's, so a game names only what differs */
export const skinOf = (skin?: Partial<CareerSkin>): CareerSkin => ({ ...NEON_SKIN, ...skin });

/** the kit's words with the skin's slot and stat names laid over them */
export function skinWords(w: CareerWords, skin: CareerSkin): CareerWords {
  if (!skin.words) return w;
  return { ...w, slot: { ...w.slot, ...skin.words.slot }, stat: { ...w.stat, ...skin.words.stat } };
}
