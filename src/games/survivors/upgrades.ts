// The upgrades, their caps, and every number they move.
//
// Split out of `logic.ts` 2026-09-21, unchanged.
//
// THE DERIVED FUNCTIONS ARE THE POINT OF THIS FILE. Every number an upgrade
// changes is derived in exactly one place, so a weapon, a card and a HUD chip
// cannot disagree about what `rapid` is worth. Adding an upgrade means adding a
// row to the cap table and a function here - never a second `* 0.86` somewhere
// that reads the same field.

import { RULES } from "./stages";
import type { LevelKey, RunState, UpgradeId } from "./types";

/** How many times each may be taken, so a run cannot end up as all of one thing. */
export const UPGRADE_CAP: Record<UpgradeId, number> = {
  // Raised 6 -> 8 and 5 -> 7 when the ceiling was measured: the two a player
  // reaches for most were also the two that ran out first.
  rapid: 8,
  power: 7,
  spread: 3,
  swift: 4,
  magnet: 3,
  heart: 2,
  pierce: 3,
  // THE TWO NEWER ONES, and there were three until 2026-09-22. New kinds rather
  // than higher caps everywhere, because a run that can only ever buy more of
  // the same seven is the same run twice - and `spread`, `magnet` and `heart`
  // are capped low on purpose, so raising them was never the answer.
  //
  // `crit` was the third and is gone by operator ruling; `types.ts` carries the
  // reason. Its four steps are NOT redistributed onto the survivors: the run is
  // meant to get harder in this change, and quietly handing back the same
  // number of upgrade steps under different names would undo half of that
  // without anybody deciding to.
  shield: 3,
  range: 3,
};

export const UPGRADE_IDS = Object.keys(UPGRADE_CAP) as UpgradeId[];

/**
 * How far a single weapon can be levelled. Five, then it can evolve.
 *
 * HERE rather than in `weapons.ts`, where it started, because `evolve.ts` needs
 * it to answer "is this weapon at the top" and `weapons.ts` imports `evolve.ts`
 * for the evolved rows. Putting it in the module that already owns every other
 * cap keeps the graph one-way; leaving it where it was would have closed a loop.
 */
export const WEAPON_LV_MAX = 5;

/* Every number the upgrades move, derived in one place so nothing drifts. */
export const fireEvery = (s: RunState) => Math.max(130, Math.round(620 * Math.pow(0.86, s.up.rapid)));
export const boltDamage = (s: RunState) => 1 + s.up.power;
export const boltCount = (s: RunState) => 1 + s.up.spread;
// A CAREER run's speed and reach carry what the player brought in (gear, shop).
// `?? 1` on a quick run, and x * 1 is x exactly, so its numbers do not move by a bit.
export const playerSpeed = (s: RunState) => (148 + 20 * s.up.swift) * (s.career?.speed ?? 1);
export const magnetRange = (s: RunState) => (46 + 30 * s.up.magnet) * (s.career?.magnet ?? 1);
/**
 * How much gem value the next power level costs.
 *
 * THE LEVEL IS AN ARGUMENT SINCE 2026-09-21, and it DEFAULTS to calm's curve -
 * `1 + power * 4`, the formula this was, to the character. A caller that does
 * not pass a level therefore reads exactly what it read before, and calm's
 * ladder is the old one rather than a re-derivation that happens to agree.
 *
 * TUNED 2026-09-21 against `assert:survivors-economy`, from `1 + power * 3`:
 * three stages, elites worth ten and two stage bosses paying out put a normal
 * run at 30.2 cards against a plan target of 18-28, and `wild` reached 40. The
 * curve was the right lever rather than the elite's worth - "a gem worth ten"
 * was an operator ruling, and re-tuning a ruling to fix a number the ruling did
 * not cause is how a design gets quietly overwritten.
 *
 * THREE TERMS, AND EACH ONE ANSWERS A DIFFERENT COMPLAINT. That separation is
 * the point of the shape:
 *
 *   `xpFirst`  the flat offset - what the FIRST level-up costs. Raising it
 *              stretches the opening minutes and is nearly invisible by power
 *              10, so it is the lever for "too many upgrades early".
 *   `xpBase`   multiplies the whole flat part, so it raises early AND late
 *              together. Almost never the right answer - see the measurement.
 *   `xpRamp`   the quadratic term. It outgrows the crowd, so it stretches the
 *              LATE gaps and barely touches the first minute.
 *
 * Printed from the formula rather than typed - the first version of this table
 * was pasted from the curve it replaced and was wrong in eight of twelve cells:
 *
 *              p=0   p=1   p=5   p=10   p=15   p=20
 *     calm       1     5    21     41     61     81    (unchanged, and pinned)
 *     normal    14    18    35     59     87    117
 *     wild       5     9    33     81    149    237
 *
 * WHY NORMAL ALONE CARRIES THE 2026-09-22 RAISE, and it is a measurement rather
 * than a preference. The operator asked for *"upgrades even less frequent
 * (mostly in early game)"*. Swept against a bot that plays whole runs:
 *
 *     xpFirst (normal/wild)   normal cards   wild cards   wild won
 *     5 / 5                       29.4          18.6        1/5
 *     12 / 12                     28.4          12.4        0/5   died at ~198s
 *     16 / 16                     27.6           7.2        0/5   died at ~129s
 *     14 / 5                      27.6          18.6        1/5   <- this
 *
 * Wild cannot pay a higher entry price. Its crowd hardens on a clock whatever
 * the player is doing, so an early cost raise there is not "fewer upgrades", it
 * is a run that dies before it is armed - the same trap this comment already
 * recorded for `xpBase` at 1.7, arrived at from a different direction. And the
 * surplus was never on wild anyway: a wild run hands out 18.6 cards to normal's
 * 29.4, because wild players die. The complaint was about the level that was
 * handing out a card every twelve seconds, and that is normal.
 *
 * What it moved, measured with a bot that walks a circle so gems reach it -
 * seconds into the run at which the first cards land, mean of 3 seeds:
 *
 *                  1st   2nd   3rd   4th
 *     before        32    54    67    80
 *     after         43    67    86   186
 *
 * `xpBase` IS DELIBERATELY 1 ON ALL THREE, and that is the part worth reading
 * twice. A first draft raised it to 1.7 on wild, which made the first two
 * minutes 70% slower to arm up - and measured with a bot that dodges perfectly,
 * that run died at 80 to 130 seconds in every seed, because the crowd had been
 * hardened at the same time as the player had been weakened.
 */
export const xpNeeded = (power: number, level: LevelKey = "calm") => {
  const r = RULES[level];
  return Math.round((r.xpFirst + power * 4) * r.xpBase + power * (power - 1) * r.xpRamp);
};

/**
 * How far the gun can see. 240 is the figure every boss measurement and both
 * arena readings were taken against, so `range` ADDS to it rather than
 * replacing it - the old number is still the floor and still comparable.
 */
export const sightRange = (s: RunState) => 240 + 46 * s.up.range;

/**
 * How long the SHIELD takes to come back, in milliseconds, and `Infinity` when
 * the upgrade has not been taken - so an untaken shield can never be ready.
 *
 * `Infinity` rather than a large number: a large number is a duration a long
 * enough run reaches, and a shield quietly appearing in minute three of a run
 * that never bought one is the kind of thing nobody would think to test.
 */
export const shieldEvery = (s: RunState) => (s.up.shield > 0 ? 13_000 - 3_000 * (s.up.shield - 1) : Infinity);

/** Is the shield up right now? */
export const shieldReady = (s: RunState) => s.up.shield > 0 && s.shieldCd <= 0;

/**
 * Three upgrades to choose between: never one already maxed, never the same one
 * twice. With fewer than three left it offers what there is, and with none left
 * it offers nothing - the caller reads an empty offer as "carry on", so a fully
 * upgraded run keeps playing instead of stopping dead in front of no cards.
 */
/**
 * POWER SLOTS (operator ruling 2026-10-02, "ack B"): a run holds at most six
 * different power-ups, as the reference survivor-likes do. Once six are held, only
 * those six are offered again - which is what makes the first six a choice.
 */
export const PASSIVE_SLOTS = 6;

/** How many different power-ups this run holds. */
export const powersHeld = (s: Pick<RunState, "up">): number => UPGRADE_IDS.filter((id) => s.up[id] > 0).length;

export function offerUpgrades(s: RunState, rng: () => number = Math.random, count = 3): UpgradeId[] {
  const full = powersHeld(s) >= PASSIVE_SLOTS;
  const left = UPGRADE_IDS.filter((id) => s.up[id] < UPGRADE_CAP[id] && (!full || s.up[id] > 0));
  const out: UpgradeId[] = [];
  while (out.length < count && left.length > 0) {
    out.push(left.splice(Math.floor(rng() * left.length), 1)[0]);
  }
  return out;
}

/** Take one. `heart` is the only one that changes the present rather than the future. */
export function applyUpgrade(s: RunState, id: UpgradeId): RunState {
  s.choosing = false;
  if (s.up[id] >= UPGRADE_CAP[id]) return s;
  s.up[id] += 1;
  if (id === "heart") {
    s.maxHp += 1;
    s.hp = Math.min(s.maxHp, s.hp + 1);
  }
  return s;
}
