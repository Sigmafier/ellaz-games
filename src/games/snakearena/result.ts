// What a round is worth and what the chrome is told about it - pure, so node
// tests both; the scene only calls these. Games report REASONS, never amounts
// (`economy.ts` decides coins), and a record is a value and a unit, never a
// direction (`score.ts` decides which way it ranks).
import type { Phase } from "./flow";
import { START_LEN, placeOf, secondsLeft, standing, type BotCount, type Round } from "./logic";

export type Tier = "easy" | "medium" | "hard";

/** More bots is the harder round: they fill more of the board and take more of the apples. */
export const TIER: Record<BotCount, Tier> = { 3: "easy", 4: "medium", 5: "hard" };

/** The record is kept per bot count - a length reached against five is not one reached against three. */
export const boardOf = (bots: BotCount) => `bots-${bots}`;

/** A coin every this many apples the player eats: progress, never a star. */
export const MILESTONE_APPLES = 5;

export const milestoneCrossed = (before: number, after: number) =>
  Math.floor(after / MILESTONE_APPLES) > Math.floor(before / MILESTONE_APPLES);

export type Grant = { reason: "level_complete" | "personal_best"; tier: Tier; level: string } | null;

/**
 * The one grant a finished round earns, if any. Winning is finishing something,
 * so it is the star; a new longest-ever that did NOT win is the consolation
 * star. Never both - one round, one star. A best needs at least one apple:
 * the first report on an empty record is always "better", and a snake that
 * never ate is not a record anyone set.
 */
export function grantFor(o: { won: boolean; newBest: boolean; peak: number; bots: BotCount }): Grant {
  const level = boardOf(o.bots);
  if (o.won) return { reason: "level_complete", tier: TIER[o.bots], level };
  if (o.newBest && o.peak > START_LEN) return { reason: "personal_best", tier: TIER[o.bots], level };
  return null;
}

export type Row = { id: number; len: number; alive: boolean };

/** What the scene publishes to the chrome: every number it shows, from one owner. */
export type ArenaStatus = {
  phase: Phase;
  paused: boolean;
  bots: BotCount;
  /** The player's length now; 0 once out, as the approved mock shows it. */
  len: number;
  /** The longest the player got this round. */
  peak: number;
  seconds: number;
  place: number;
  count: number;
  /** Every snake, best first. */
  rows: Row[];
  winner: number | null;
  newBest: boolean;
};

export function statusOf(r: Round, phase: Phase, paused: boolean, bots: BotCount, newBest: boolean): ArenaStatus {
  const me = r.snakes[0];
  return {
    phase,
    paused,
    bots,
    len: me.alive ? me.body.length : 0,
    peak: me.peak,
    seconds: secondsLeft(r),
    place: placeOf(r, 0),
    count: r.snakes.length,
    rows: standing(r).map((id) => ({ id, len: r.snakes[id].alive ? r.snakes[id].body.length : r.snakes[id].peak, alive: r.snakes[id].alive })),
    winner: r.winner,
    newBest,
  };
}
