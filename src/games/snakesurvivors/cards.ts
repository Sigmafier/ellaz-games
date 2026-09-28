// The nine level-up cards, their caps, and every number they move.
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
  spit: 3,
  lasso: 2,
  shield: 2,
};

export const CARD_IDS = Object.keys(CAPS) as CardId[];

/**
 * The three cards round three added (2026-09-28). A card from this list that a
 * run has never taken wears a NEW badge on the picker.
 */
export const NEW_CARDS: readonly CardId[] = ["spit", "lasso", "shield"];

/**
 * The three WEAPONS: the ways the snake hurts a shape without closing a loop.
 * Fangs bite at the head, spikes stand along the body, Spit shoots from the
 * mouth. Different places, different pictures, and a player can tell which one
 * did it.
 */
export const WEAPONS: readonly CardId[] = ["fangs", "spikes", "spit"];

export const noneTaken = (): Record<CardId, number> =>
  Object.fromEntries(CARD_IDS.map((id) => [id, 0])) as Record<CardId, number>;

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

/**
 * How near the head must come to its own body for a loop to SNAP SHUT, in
 * units. It was a touch (10 units) until round three, and the reviewer could
 * not crush a bat below length 50. Measured 2026-09-28 with `lassoTrial` in
 * bots.ts - one chasing bat, ten seeds a length - the shortest length that
 * crushes on half the seeds:
 *
 *   hand                   touch 10   reach 20   30   36   42
 *   orbits the bat            30         30      28   28   28
 *   circles, steady           26         26      26   24   24
 *   circles, widens 20        24         22      20   20   18
 *   circles, tightens 12      56         28      28   28   26
 *   circles, tightens 20      60         32      30   30   28
 *
 * (touch 10 on the old rules; the rest with the one-lap bound in `body.ts`.)
 * 42 is the smallest reach tried at which every hand closes from the starting
 * 28. The tightest spin still cannot crush at any reach: see `LAP_SLACK`.
 */
export const SNAP = 42;
/** What each Lasso level adds to the reach. */
export const LASSO_STEP = 12;

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
/** How near the head must come to its body for a loop to snap shut. */
export const snapOf = (r: Taken) => SNAP + LASSO_STEP * r.taken.lasso;
/** ms between two Spit shots: 2 s, then 1.4, then 1. */
export const spitEvery = (r: Taken) => [Infinity, 2000, 1400, 1000][r.taken.spit] ?? 1000;
/** ms for the Shield to recharge after it takes a bump. */
export const shieldEvery = (r: Taken) => [Infinity, 12_000, 7000][r.taken.shield] ?? 7000;

/** Spit's shot: how far it looks for a target, how fast it flies, how long it lasts. */
export const SPIT = { range: 260, speed: 320, lifeMs: 1000 } as const;

const at = (id: CardId, level: number): Taken => ({ taken: { ...noneTaken(), [id]: level } });
const secs = (ms: number) => Math.round(ms / 100) / 10;

/**
 * The one number the picker quotes for a card at a level - "pull reaches 110",
 * "every 1.4 s" - so a card you already own reads as an UPGRADE and never as a
 * repeat (NePo: "if I already have a magnet why do I get the same card a second
 * time?"). Each is read off the same function the rules use.
 */
export function cardStat(id: CardId, level: number): number {
  const r = at(id, level);
  switch (id) {
    case "fangs":
      return biteOf(r);
    case "spikes":
      return secs(spikeEvery(r));
    case "magnet":
      return pullOf(r);
    case "swift":
      return Math.round(10 * r.taken.swift);
    case "regrow":
      return secs(regrowEvery(r));
    case "shockwave":
      return shockOf(r);
    case "spit":
      return secs(spitEvery(r));
    case "lasso":
      return snapOf(r);
    case "shield":
      return secs(shieldEvery(r));
  }
}

/** What the picker shows for one offered card: which level it goes to, and the numbers. */
export interface CardOffer {
  id: CardId;
  /** The level the run has now (0 = not owned) and the one this pick gives. */
  from: number;
  to: number;
  owned: boolean;
  /** One of the three new cards, never taken on this run. */
  isNew: boolean;
  /** The card's number at the level this pick gives, and at the level held now (null when not owned). */
  now: number;
  was: number | null;
}

export function cardOffer(taken: Record<CardId, number>, id: CardId): CardOffer {
  const from = taken[id];
  const to = Math.min(CAPS[id], from + 1);
  return {
    id,
    from,
    to,
    owned: from > 0,
    isNew: from === 0 && NEW_CARDS.includes(id),
    now: cardStat(id, to),
    was: from > 0 ? cardStat(id, from) : null,
  };
}
