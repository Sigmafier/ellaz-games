// THE CAREER PAGE'S CARDS: what a career game's own save says, as the page draws
// it. Pure - the stores are injected, so the tests read real saves off a map.
//
// Only Neon Survival has a career today (the plan's P3). Its save is the kit's
// career record under Neon's own game storage (`createSaveStore("survivors")`,
// key `career`); "where you are" is the kit's own `currentNode` over the same
// campaign the lobby draws. No save is an honest NOT STARTED card - never a
// number the device does not hold.

import { currentNode, nodeStates } from "../../shared/career/progress";
import { readSave, type CareerStore } from "../../shared/career/save";
import { NEON_CAMPAIGN } from "../../games/survivors/worlds";

/** Every distinct gear piece a career can own: three slots, three tiers. */
export const GEAR_KINDS = 9;

export interface CareerCardView {
  id: string;
  /** Not started: the device holds no career save for this game yet. */
  started: boolean;
  /** The world the player is in now, as its id; null once every level is cleared. */
  world: string | null;
  /** Its level number inside that world, or null for its boss. */
  level: number | null;
  boss: boolean;
  /** Levels in each world, boss included. */
  of: number;
  /** Cleared levels over all levels, 0 to 1. */
  progress: number;
  gold: number;
  /** Distinct gear pieces owned, out of `GEAR_KINDS`. */
  gear: number;
}

/** Neon Survival's card, from the save its lobby writes. */
export function neonCard(store: CareerStore): CareerCardView {
  const started = typeof store.get("career") === "string";
  const save = readSave(store, "career");
  const states = nodeStates(NEON_CAMPAIGN, save);
  const done = states.filter((v) => v.state === "done").length;
  const now = currentNode(NEON_CAMPAIGN, save);
  return {
    id: "survivors",
    started,
    world: now ? now.world : null,
    level: now ? now.number : null,
    boss: now ? now.boss : false,
    of: NEON_CAMPAIGN.worlds[0]?.levels.length ?? 0,
    progress: states.length ? done / states.length : 0,
    gold: save.gold,
    gear: new Set(save.gear.owned).size,
  };
}
