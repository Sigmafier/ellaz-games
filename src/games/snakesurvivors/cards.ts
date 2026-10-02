// The level-up cards, their tiers, their caps, and every number they move.
//
// Every number a card changes is derived HERE and nowhere else, the rule Neon
// Survival's `upgrades.ts` learned: a card, a HUD line and the simulation cannot
// disagree about what `swift` is worth if only one function knows.

import { MERGE } from "./merge";
import type { CardId, LevelKey, Run, Tier } from "./types";

/** How many times each card may be taken. An epic is once a run. */
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
  chain: 2,
  doubleGems: 1,
  frost: 2,
  longBody: 2,
  twinHead: 1,
  blackHole: 1,
  nova: 1,
};

export const CARD_IDS = Object.keys(CAPS) as CardId[];

/**
 * ROUND FOUR (operator ruling, 2026-09-29): "more powers, including rare powers
 * that appear less commonly". Sixteen cards in three colours - the nine a run
 * had, grey; four blue rares; three gold epics.
 */
export const TIER: Record<CardId, Tier> = {
  fangs: "common",
  spikes: "common",
  magnet: "common",
  swift: "common",
  regrow: "common",
  shockwave: "common",
  spit: "common",
  lasso: "common",
  shield: "common",
  chain: "rare",
  doubleGems: "rare",
  frost: "rare",
  longBody: "rare",
  twinHead: "epic",
  blackHole: "epic",
  nova: "epic",
};

/**
 * The odds of each tier, PER OFFERED SLOT. A slot rolls its tier first and then
 * a card inside it, so the odds do not depend on how many cards a tier holds.
 *
 * "RARE, WITH A PROMISE" (operator ruling, 2026-10-01; it was a flat 1 in 12
 * gold and 1 in 4 blue): blue is 1 in 8. Gold starts every run at 1% and rises
 * one percentage point for each level-up offer that showed NO gold
 * (`run.goldDry`, moved by `nextGoldDry`), back to 1% the moment one does - so
 * gold is rare, and a long dry spell is promised an end.
 *
 * "CALM KEEPS OLD ODDS" (operator ruling, the same day): on calm a slot still
 * rolls a flat 1 in 12 gold and 1 in 4 blue (`CALM_TIER_ODDS`), and the
 * counter changes nothing there. Normal and wild use the rarity above.
 */
export const RARE_ODDS = 1 / 8;
export const EPIC_START = 0.01;
export const EPIC_STEP = 0.01;

/** Gold's odds per slot after `dry` offers without gold. Capped so grey never goes negative. */
export function epicOdds(dry: number): number {
  return Math.min(1 - RARE_ODDS, EPIC_START + EPIC_STEP * dry);
}

/** The odds a normal or wild run STARTS with (`goldDry` 0). */
export const TIER_ODDS: Record<Tier, number> = { epic: EPIC_START, rare: RARE_ODDS, common: 1 - EPIC_START - RARE_ODDS };

/** Calm's odds, always: the flat ones every level had before 2026-10-01. */
export const CALM_TIER_ODDS: Record<Tier, number> = { epic: 1 / 12, rare: 1 / 4, common: 1 - 1 / 12 - 1 / 4 };

/**
 * Which tier one slot rolls, from one draw in [0, 1): on calm the flat old
 * odds; otherwise the rarity, `dry` offers since the last gold. No level
 * given reads as normal.
 */
export function tierFor(roll: number, dry = 0, level?: LevelKey): Tier {
  const epic = level === "calm" ? CALM_TIER_ODDS.epic : epicOdds(dry);
  const rare = level === "calm" ? CALM_TIER_ODDS.rare : RARE_ODDS;
  if (roll < epic) return "epic";
  if (roll < epic + rare) return "rare";
  return "common";
}

/** The counter after an offer: 0 if it showed a gold card, one more if it did not. */
export function nextGoldDry(dry: number, offer: readonly CardId[]): number {
  return offer.some((id) => TIER[id] === "epic") ? 0 : dry + 1;
}

/**
 * Where a slot goes when its tier has nothing left: DOWN a tier first (a gold
 * roll with no gold left becomes a blue card, then a grey one), and only then
 * up - so a run that has taken every grey card still gets offered what is left.
 */
const FALLBACK: Record<Tier, readonly Tier[]> = {
  epic: ["epic", "rare", "common"],
  rare: ["rare", "common", "epic"],
  common: ["common", "rare", "epic"],
};

/**
 * The seven cards round four added (2026-09-29). A card from this list that a
 * run has never taken counts as new (`CardOffer.isNew`).
 */
export const NEW_CARDS: readonly CardId[] = ["chain", "doubleGems", "frost", "longBody", "twinHead", "blackHole", "nova"];

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
 * Up to three different cards that are not at their cap. Each slot rolls a
 * tier (`tierFor`, at the run's level and `goldDry`), falls back when that tier is empty (`FALLBACK`), and draws
 * a card from it - every draw from `rng`, so a seeded run replays its offers.
 * An empty list means nothing is left to take, and the run carries on.
 */
export function offerCards(run: Pick<Run, "taken"> & { goldDry?: number; level?: LevelKey }, rng: () => number = Math.random): CardId[] {
  const left = CARD_IDS.filter((id) => run.taken[id] < CAPS[id]);
  const out: CardId[] = [];
  for (let slot = 0; slot < 3; slot++) {
    const want = tierFor(rng(), run.goldDry ?? 0, run.level);
    let pool: CardId[] = [];
    for (const tier of FALLBACK[want]) {
      pool = left.filter((id) => TIER[id] === tier && !out.includes(id));
      if (pool.length) break;
    }
    if (!pool.length) break;
    out.push(pool[Math.floor(rng() * pool.length)]);
  }
  return out;
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
 *   hand                   touch 10   reach 20   30   36   42   42 + 3/4 lap
 *   orbits the bat            30         30      28   28   28        28
 *   circles, steady           26         26      26   24   24        20
 *   circles, widens 20        24         22      20   20   18        18
 *   circles, tightens 12      56         28      28   28   26        20
 *   circles, tightens 20      60         32      30   30   28        20
 *
 * (touch 10 on the old rules; the rest with the one-lap bound in `body.ts`.)
 * 42 is the smallest reach tried at which every hand closes from the starting
 * 28. The last column is round four (2026-09-29): a body curled three quarters
 * of the way round closes too (`THREE_QUARTER` in body.ts), and every circling
 * hand now crushes from 20 - eight segments under the start. Orbiting the bat
 * itself stays at 28: that hand collapses toward the tightest spin, which the
 * area floor refuses however far round it goes. The tightest spin still cannot
 * crush at any reach, with or without the new rule, at full Lasso and full
 * Long Body (0 loops in 12 s each, measured the same day): see `LAP_SLACK`.
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

/** Chain Crush: how many shapes OUTSIDE the loop a crush zaps - 2, then 3. 0 = no card. */
export const chainOf = (r: Taken) => (r.taken.chain ? 1 + r.taken.chain : 0);
/** How far Chain Crush looks for a shape to zap, from the loop's middle. */
export const CHAIN_RANGE = 240;
/** Frost Trail: a shape touching the body moves at this fraction of its speed... */
export const frostOf = (r: Taken) => [1, 0.55, 0.4][r.taken.frost] ?? 0.4;
/** ...for this long after the touch. */
export const FROST_MS = 1500;
/** Long Body: segments added to the most a snake can grow, per level. */
export const LONG_STEP = 20;
export const longOf = (r: Taken) => LONG_STEP * r.taken.longBody;
/** Black Hole: how long a vortex stays open, how far it reaches, how hard it pulls (units/s). */
export const HOLE = { ms: 2500, reach: 150, pull: 70 } as const;
/** Nova: every this many loops that CAUGHT something, the screen is cleared. */
export const NOVA_EVERY = 5;
/**
 * Twin Head: ms between two loops the TAIL closes - longer than the head's
 * `LOOP_COOL_MS`, so the tail is a second chance at a crush, not a second
 * blender running beside the first.
 */
export const TAIL_COOL_MS = 1200;

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
    case "chain":
      return chainOf(r);
    case "doubleGems":
      // Gem Merge (the id is forever; the card changed 2026-10-01): how near two gems fuse from.
      return MERGE.reach;
    case "frost":
      return Math.round(100 * (1 - frostOf(r)));
    case "longBody":
      return longOf(r);
    case "twinHead":
      return 2;
    case "blackHole":
      return secs(HOLE.ms);
    case "nova":
      return NOVA_EVERY;
  }
}

/** What the picker shows for one offered card: which level it goes to, and the numbers. */
export interface CardOffer {
  id: CardId;
  /** The level the run has now (0 = not owned) and the one this pick gives. */
  from: number;
  to: number;
  owned: boolean;
  /** One of round four's new cards, never taken on this run. */
  isNew: boolean;
  tier: Tier;
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
    tier: TIER[id],
    now: cardStat(id, to),
    was: from > 0 ? cardStat(id, from) : null,
  };
}
