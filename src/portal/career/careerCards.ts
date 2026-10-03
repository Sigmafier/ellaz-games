// THE CAREER PAGE'S CARDS: what a career game's own save says, as the page draws
// it. Pure - the stores are injected, so the tests read real saves off a map.
//
// Two careers today: Neon Survival (the plan's P3) and Snake Survivors (snake
// career, 2026-10-03). Each save is the kit's career record under the game's own
// storage (`createSaveStore(<game id>)`, key `career`); "where you are" is the
// kit's own `currentNode` over the same campaign that game's lobby draws. No save
// is an honest NOT STARTED card - never a number the device does not hold.

import { currentNode, nodeStates } from "../../shared/career/progress";
import { readSave, type CareerStore } from "../../shared/career/save";
import { NEON_CAMPAIGN } from "../../games/survivors/worlds";
import { SNAKE_CAMPAIGN } from "../../games/snakesurvivors/careerWorlds";
import type { CampaignFile } from "../../shared/career/campaign";

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

/** One career game's card, from the save its lobby writes under `career`. */
function careerCard(id: string, campaign: CampaignFile, store: CareerStore): CareerCardView {
  const started = typeof store.get("career") === "string";
  const save = readSave(store, "career");
  const states = nodeStates(campaign, save);
  const done = states.filter((v) => v.state === "done").length;
  const now = currentNode(campaign, save);
  return {
    id,
    started,
    world: now ? now.world : null,
    level: now ? now.number : null,
    boss: now ? now.boss : false,
    of: campaign.worlds[0]?.levels.length ?? 0,
    progress: states.length ? done / states.length : 0,
    gold: save.gold,
    gear: new Set(save.gear.owned).size,
  };
}

/** Neon Survival's card, from the save its lobby writes. */
export const neonCard = (store: CareerStore): CareerCardView => careerCard("survivors", NEON_CAMPAIGN, store);

/** Snake Survivors' card, from the save its lobby writes. */
export const snakeCard = (store: CareerStore): CareerCardView => careerCard("snakesurvivors", SNAKE_CAMPAIGN, store);
