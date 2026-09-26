// What wave N contains, for both curves.
//
// TYPES ONLY from `./types`, so this is a one-way import and never a cycle.
//
// TWO CURVES, AND THE JOIN IS THE HARD PART. The campaign runs 1..20 and is
// tuned to be beatable by a player who buys the right things in the right
// order. Overtime starts at 21 and inherits a FULLY EQUIPPED player, so it
// cannot simply continue the campaign's slope - it has to start from the top of
// the shop rather than from wave 1's assumptions.
//
// NOTHING HERE IS MEASURED. These are the numbers the first headless run will
// argue with.

import type { LevelKey, WalkerKind } from "./types";

/** Beat this wave and the campaign is won. The lane keeps going afterwards. */
export const CAMPAIGN_WAVES = 20;

/**
 * The band table from the plan, as data.
 *
 * Every band's arrival is the reason to have banked for its counter one wave
 * earlier, which is the entire design: `vehicle` at 7 is the rocketeer's
 * reason, `shooter` at 10 is the marksman's, `air` at 13 is the AA gunner's.
 * Reordering this without reordering `shop.ts`'s `from` fields breaks the
 * forecast and `waves.test.ts` says so.
 */
export const BANDS: ReadonlyArray<{ from: number; kinds: readonly WalkerKind[] }> = [
  { from: 1, kinds: ["foot"] },
  { from: 2, kinds: ["foot", "runner"] },
  { from: 4, kinds: ["foot", "foot", "runner"] },
  { from: 7, kinds: ["foot", "runner", "vehicle"] },
  { from: 10, kinds: ["foot", "runner", "shooter", "vehicle"] },
  { from: 13, kinds: ["foot", "runner", "shooter", "vehicle", "air"] },
  { from: 16, kinds: ["foot", "runner", "shooter", "vehicle", "air", "air"] },
];

/** The kinds wave `n` may send, widest band at or below `n`. */
export function poolFor(n: number): readonly WalkerKind[] {
  let pool = BANDS[0].kinds;
  for (const b of BANDS) if (n >= b.from) pool = b.kinds;
  return pool;
}

/**
 * What each level changes: the SIZE of a wave and the TOUGHNESS of what is in
 * it - never the player's own gun.
 *
 * Survivors' rule, copied deliberately: *a calm run is a smaller crowd, never a
 * stronger player, so an upgrade means the same thing on all three*. A level
 * that changed the gun would make every price in `shop.ts` mean three different
 * things.
 *
 * `pay` is the one exception and it is not about strength: a calm run kills
 * fewer things, so it would bank less and fall behind its own shop. The
 * multiplier holds the FORECAST intact across the three.
 */
export const RULES: Record<LevelKey, { count: number; hp: number; speed: number; pay: number; gap: number }> = {
  calm: { count: 0.75, hp: 0.8, speed: 0.85, pay: 1.3, gap: 1.25 },
  normal: { count: 1, hp: 1, speed: 1, pay: 1, gap: 1 },
  wild: { count: 1.3, hp: 1.25, speed: 1.15, pay: 0.85, gap: 0.8 },
};

/**
 * How many bodies wave `n` sends, before the level multiplier.
 *
 * Deliberately NOT exponential. An exponential wave count is how a siege game
 * turns into a slideshow on a phone at wave 18, and the difficulty this game
 * wants comes from the KINDS arriving and from the standoff shooters impose,
 * not from the body count. `WALKER_CAP` in `logic.ts` is the backstop.
 */
export function countFor(n: number): number {
  return 4 + Math.floor(n * 1.6);
}

/**
 * Milliseconds between arrivals. Tightens with the wave and floors out, so a
 * late wave is a steady stream rather than one unsurvivable clump.
 */
export function gapFor(n: number): number {
  return Math.max(260, 1100 - n * 38);
}

/**
 * The health and pay multiplier for wave `n`.
 *
 * ONE function for both curves, and the overtime slope is steeper on purpose:
 * past the campaign the player owns the whole shop, so a continuation of the
 * campaign's own slope is a victory lap rather than a score chase.
 */
export function pressureFor(n: number): number {
  if (n <= CAMPAIGN_WAVES) return 1 + (n - 1) * 0.12;
  const base = 1 + (CAMPAIGN_WAVES - 1) * 0.12;
  return base * (1 + (n - CAMPAIGN_WAVES) * 0.09);
}

/** A heavy walks in on wave 20, and every 5th wave of overtime after it. */
export function hasHeavy(n: number): boolean {
  return n === CAMPAIGN_WAVES || (n > CAMPAIGN_WAVES && (n - CAMPAIGN_WAVES) % 5 === 0);
}

/**
 * The wave, as a queue of kinds in arrival order.
 *
 * Seeded and pure, so the same seed sends the same wave and a test can assert
 * a whole campaign without a canvas. The heavy is LAST, so a player meets the
 * crowd before the thing with the health bar.
 */
export function waveQueue(n: number, level: LevelKey, rng: () => number = Math.random): WalkerKind[] {
  const pool = poolFor(n);
  const total = Math.max(1, Math.round(countFor(n) * RULES[level].count));
  const out: WalkerKind[] = [];
  for (let i = 0; i < total; i++) out.push(pool[Math.floor(rng() * pool.length)] ?? "foot");
  if (hasHeavy(n)) out.push("heavy");
  return out;
}
