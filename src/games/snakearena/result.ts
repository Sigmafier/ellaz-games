// What a round is worth and what the chrome is told about it - pure, so node
// tests both; the scene only calls these. Games report REASONS, never amounts
// (`economy.ts` decides coins), and a record is a value and a unit, never a
// direction (`score.ts` decides which way it ranks).
import type { Phase } from "./flow";
import { START_LEN, placeOf, secondsLeft, standing, type Round } from "./logic";
import { LEVEL, type Level, type MapId, type Setup } from "./setup";

export type Tier = "easy" | "medium" | "hard";

/** The level IS the tier: Easy's two slow bots, Normal's three, Hard's five. */
export const TIER: Record<Level, Tier> = { easy: "easy", normal: "medium", hard: "hard" };

/**
 * The record is kept per level and map - a length reached against five is not
 * one reached against three, and rocks take room. Named by the level's BOT
 * COUNT, as it was when the level was the bot count, so a Normal or Hard record
 * set before the levels existed (`bots-3`, `bots-5`) is still the one it beats.
 */
export const boardOf = (level: Level, map: MapId = "open") => `bots-${LEVEL[level].bots}${map === "rocks" ? "-rocks" : ""}`;

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
export function grantFor(o: { won: boolean; newBest: boolean; peak: number; level: Level; map: MapId }): Grant {
  const level = boardOf(o.level, o.map);
  if (o.won) return { reason: "level_complete", tier: TIER[o.level], level };
  if (o.newBest && o.peak > START_LEN) return { reason: "personal_best", tier: TIER[o.level], level };
  return null;
}

/**
 * Which person a two-player round pays: whoever stands higher in the ranking.
 * One round, one report, one grant - two people at one keyboard do not earn
 * twice for the same 90 seconds. With one player it is always snake 0.
 */
export const bestHuman = (r: Round) => standing(r).find((id) => id < r.humans) ?? 0;

/** Is the round over for the people in it - the one player out, or the bell, or (two players) both out? */
export const reportDue = (r: Round) => r.over || (r.humans === 1 && !r.snakes[0].alive);

export type Row = { id: number; len: number; alive: boolean };

/** What the scene publishes to the chrome: every number it shows, from one owner. */
export type ArenaStatus = {
  phase: Phase;
  paused: boolean;
  setup: Setup;
  /** Every snake's colour, by id. */
  colors: string[];
  humans: number;
  /** The player's (P1's) length now; 0 once out, as the approved mock shows it. */
  len: number;
  /** P2's, the same way - 0 with one player. */
  len2: number;
  /** Each person's place, P1 first. */
  places: number[];
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

export function statusOf(r: Round, phase: Phase, paused: boolean, setup: Setup, newBest: boolean, colors: string[]): ArenaStatus {
  const me = r.snakes[0];
  const two = r.snakes[1];
  return {
    phase,
    paused,
    setup,
    colors,
    humans: r.humans,
    len: me.alive ? me.body.length : 0,
    len2: r.humans > 1 && two.alive ? two.body.length : 0,
    places: r.snakes.slice(0, r.humans).map((s) => placeOf(r, s.id)),
    peak: r.snakes[bestHuman(r)].peak,
    seconds: secondsLeft(r),
    place: placeOf(r, 0),
    count: r.snakes.length,
    rows: standing(r).map((id) => ({ id, len: r.snakes[id].alive ? r.snakes[id].body.length : r.snakes[id].peak, alive: r.snakes[id].alive })),
    winner: r.winner,
    newBest,
  };
}
