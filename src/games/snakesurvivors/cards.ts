// The six level-up cards, their caps, and every number they move.
//
// Every number a card changes is derived HERE and nowhere else, the rule Neon
// Survival's `upgrades.ts` learned: a card, a HUD line and the simulation cannot
// disagree about what `swift` is worth if only one function knows.

import type { CardId, Run } from "./types";

/** How many times each card may be taken. */
export const CAPS: Record<CardId, number> = {
  fangs: 3,
  spikes: 3,
  magnet: 3,
  swift: 3,
  regrow: 2,
  shockwave: 2,
};

export const CARD_IDS = Object.keys(CAPS) as CardId[];

/**
 * The two WEAPONS: the ways the snake hurts a shape without closing a loop.
 * Fangs bite at the head; spikes stand along the body. Different places,
 * different pictures, and a player can tell which one did it.
 */
export const WEAPONS: readonly CardId[] = ["fangs", "spikes"];

export const noneTaken = (): Record<CardId, number> => ({ fangs: 0, spikes: 0, magnet: 0, swift: 0, regrow: 0, shockwave: 0 });

/**
 * Up to three different cards that are not at their cap, in a random order.
 * An empty list means nothing is left to take, and the run carries on.
 */
export function offerCards(run: Pick<Run, "taken">, rng: () => number = Math.random): CardId[] {
  const pool = CARD_IDS.filter((id) => run.taken[id] < CAPS[id]);
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }
  return pool.slice(0, 3);
}

export function applyCard(run: Pick<Run, "taken">, id: CardId): void {
  run.taken[id] = Math.min(CAPS[id], run.taken[id] + 1);
}

/** Units per second. The same on every level: a level changes the crowd, never the snake. */
export const SPEED = 105;
/** Radians per second the head can turn. */
export const TURN = 3.6;

type Taken = Pick<Run, "taken">;

export const speedOf = (r: Taken) => SPEED * (1 + 0.1 * r.taken.swift);
export const turnOf = (r: Taken) => TURN * (1 + 0.1 * r.taken.swift);
/** How far a gem is pulled from. 0 = only what the head touches. */
export const pullOf = (r: Taken) => (r.taken.magnet ? 40 + 35 * r.taken.magnet : 0);
/** The toughest shape a bite kills outright, by its health. 0 = no fangs. */
export const biteOf = (r: Taken) => r.taken.fangs;
/** ms between two spike hits on one shape. */
export const spikeEvery = (r: Taken) => (r.taken.spikes ? 900 / r.taken.spikes : Infinity);
/** ms to grow one segment back. */
export const regrowEvery = (r: Taken) => (r.taken.regrow ? 9000 / r.taken.regrow : Infinity);
/** How far a crush throws the shapes outside the loop. 0 = no shockwave. */
export const shockOf = (r: Taken) => (r.taken.shockwave ? 70 + 40 * r.taken.shockwave : 0);
