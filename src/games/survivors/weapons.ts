// The four weapons that throw something, and the one function that throws.
//
// Split out of `logic.ts` 2026-09-21, unchanged.

import type { RunState, ShotKind, Slot, WeaponId, WeaponRow } from "./types";
import { WEAPON_LV_MAX, boltCount, boltDamage, fireEvery } from "./upgrades";
import { EVOLUTIONS, SWARM_DRONES } from "./evolve";

// Re-exported so every existing importer of `WEAPON_LV_MAX` from here (and from
// `logic.ts`, which re-exports this module) is unmoved by it changing home.
export { WEAPON_LV_MAX };
import { nearestEnemy } from "./enemies";
import { dronePositions } from "./arsenal";

const CAP_BOLTS = 48;
const SPREAD_RAD = 0.16;

/**
 * The four weapons that throw something, and every way they differ lives in
 * this one row each.
 *
 * EACH SLOT FIRES ON ITS OWN CLOCK since 2026-09-14. They used to take turns on
 * one shared cadence, and that was right while a run held all three from the
 * start - it showed a player every weapon within two seconds. The operator then
 * ruled that a run PICKS one and collects more, and a rotation would make each
 * new weapon slow the others down: picking up a second gun would halve the
 * first. So a slot's clock is `fireEvery(s) * every`, and a test that needs the
 * gun still sets every slot's `cd` (see `holdFire` in the tests).
 *
 * `turn` is what makes the MOTIONS different rather than one projectile at four
 * speeds - the arc is the only one that steers after it leaves, and the burst is
 * the only one that ignores the target and goes out as a ring. Colour and sound
 * are the scene's to draw and play; they are named here so that one row is the
 * whole answer to "what is this weapon".
 */
export const WEAPONS: Record<ShotKind, WeaponRow> = {
  // Straight, fast, cheap. The one this game already had.
  bolt: { speed: 330, life: 1500, turn: 0, count: 1, bonus: 0, r: 4, sfx: "tap", every: 1 },
  // Slower, and it CURVES - it keeps steering at the nearest shape after it has
  // left, so it rounds corners the bolt drives past. Hits harder to pay for it.
  arc: { speed: 205, life: 2200, turn: 3.4, count: 1, bonus: 1, r: 5, sfx: "flip", every: 1.2 },
  // A ring, thrown outward in every direction at once, dying quickly. It ignores
  // the target entirely, which is what makes it the answer to being surrounded.
  // Slowest to come round, because seven fragments a shot is a lot of floor.
  burst: { speed: 150, life: 520, turn: 0, count: 7, bonus: 0, r: 6, sfx: "star", every: 1.8 },
  // The drone's shot: quick and thin, thrown from the drone rather than the
  // robot, at whatever is nearest to the DRONE - so it covers the side the robot
  // is not facing.
  drone: { speed: 300, life: 1300, turn: 0, count: 1, bonus: 0, r: 4, sfx: "coin", every: 1.4 },
};

/**
 * What one LEVEL of a weapon is worth, and both halves are here rather than at
 * the two call sites for the same reason `fireEvery` and `boltDamage` are: one
 * place, so a card, a shot and a HUD chip cannot disagree about what Lv4 means.
 *
 * Damage is FLAT and cadence is GEOMETRIC, which is deliberate. A flat cadence
 * cut would eventually reach zero; 0.92 per level leaves Lv5 at 0.72x of Lv1
 * and can never reach it. Tuned at T9 against the economy gate, not felt.
 */
const LV_CADENCE = 0.92;

/** How many shapes a STORM bolt jumps between before it is spent. */
export const STORM_JUMPS = 3;

/**
 * THE ROW THIS SLOT ACTUALLY FIRES BY.
 *
 * One lookup, and it is the whole mechanism of an evolution: an evolved slot
 * reads its own row out of `EVOLUTIONS` instead of the base table, so every
 * number a shot is built from - speed, life, turn, count, damage bonus, radius,
 * sound, cadence - changes at once and no call site has to know it happened.
 *
 * The blades never throw anything and have no row in either table, so callers
 * hold them out; `weaponDamage` is the one that knows.
 */
export function rowFor(slot: Slot): WeaponRow {
  const evo = slot.evolved ? EVOLUTIONS[slot.id].row : null;
  return evo ?? WEAPONS[slot.id as ShotKind];
}

/**
 * This weapon's damage per shot, at its level.
 *
 * The blades have no `WEAPONS` row - they never throw anything - so they take
 * the base damage plus their level, which is what they already did before levels
 * existed, plus the new term.
 */
export const weaponDamage = (s: RunState, slot: Slot): number =>
  (boltDamage(s) + (slot.id === "blades" ? 0 : rowFor(slot).bonus) + (slot.lv - 1)) *
  // A career run's damage stat (gear, shop). `?? 1` on a quick run - x * 1 is x.
  (s.career?.damage ?? 1);

/** How long this slot waits between shots, at its level. */
export const weaponEvery = (s: RunState, slot: Slot): number =>
  slot.id === "blades" ? 0 : fireEvery(s) * rowFor(slot).every * Math.pow(LV_CADENCE, slot.lv - 1);

/** Can this weapon still be levelled, or is it at the top? */
export const canLevel = (slot: Slot): boolean => slot.lv < WEAPON_LV_MAX;

/** A freshly taken weapon starts at level one. */
export const freshSlot = (id: WeaponId): Slot => ({ id, cd: 0, lv: 1 });

// `critRoll` LIVED HERE and was deleted on 2026-09-22 with the upgrade it
// served, and the deletion is worth a note because of what it moved.
//
// It drew from `rng` on EVERY shot, at a zero chance in a run that had not
// bought crit, so that its cost in draws did not depend on the loadout. Taking
// it out therefore shifts the rng stream by one draw per shot in every run on
// every level - including `calm`, which this change is otherwise forbidden to
// touch. No damage number moves (a zero-chance roll never doubled anything),
// but a calm run on a given seed now spawns its shapes in different places.
//
// That is a re-shuffle rather than a difficulty change, and
// `calm-is-untouched.test.ts` says which is which: its fingerprint was
// re-recorded, and the aggregate band beside it is what stops a re-record from
// laundering a real change into easy mode.
//
// IT TOOK THE `rng` PARAMETER WITH IT, and that is the interesting half. Crit
// was the ONLY randomness anywhere in the firing path, so with it gone these
// two functions have nothing left to draw for: where a shot starts, which way
// it points, how wide the fan spreads and how hard it lands are now all decided
// by the run's own state. The compiler found it (`'rng' is declared but its
// value is never read`) rather than a reader, which is the argument for letting
// a dead parameter go red instead of underscoring it away.

/**
 * One weapon's shot. Returns whether it fired, so a slot with nothing in range
 * holds its clock at zero and goes off the moment something walks in.
 *
 * The drone throws from the DRONE and aims at what is nearest to it; every other
 * weapon throws from the robot.
 *
 * TAKES NO `rng`: every weapon in this game aims, and none of them scatters.
 */
export function fireSlot(s: RunState, slot: Slot): boolean {
  const id = slot.id as ShotKind;
  // WHERE THE SHOT COMES FROM. The robot, the drone at its shoulder, or - once
  // the drone has evolved - each of three drones spread around the same circle.
  // A list rather than a point, so "three drones each firing" is one loop rather
  // than a second copy of this function.
  const sources =
    id === "drone" ? dronePositions(s, slot.evolved ? SWARM_DRONES : 1) : [{ x: s.x, y: s.y }];

  let fired = false;
  for (const from of sources) if (fireFrom(s, slot, id, from)) fired = true;
  return fired;
}

/** One shot, from one place. The loop above calls it once per drone. */
function fireFrom(s: RunState, slot: Slot, id: ShotKind, from: { x: number; y: number }): boolean {
  const target = nearestEnemy(s, from.x, from.y);
  // The burst does not aim, but it still holds its shot when the view is empty:
  // a ring thrown at nothing is noise.
  if (!target) return false;

  const w = rowFor(slot);
  const aim = Math.atan2(target.y - from.y, target.x - from.x);
  // The spread upgrade widens every weapon, but the burst is already a full
  // circle, so there it adds fragments to the ring instead of fanning it.
  const n = w.count + (boltCount(s) - 1);

  // THE RAILGUN PASSES THROUGH EVERYTHING. `Infinity` rather than a big number,
  // because a big number is a budget that a long enough line of shapes can still
  // exhaust - and "it stopped after eleven" is a bug nobody would ever reproduce
  // on purpose. The bolt loop already counts down and only expires at zero.
  const pierce = slot.evolved && slot.id === "bolt" ? Infinity : s.up.pierce;
  // THE STORM CHAINS. Its jumps ride the same counter a pierce does - the bolt
  // loop already counts it down and expires the shot at zero - so a chain is
  // "keep going after a hit" with a re-aim attached rather than a second budget
  // that could disagree with the first.
  const chain = slot.evolved && slot.id === "arc";
  // THE NOVA's fragments are marked, not its weapon - the bolt loop is what lays
  // the fire, and by then the slot that threw it is long out of scope.
  const nova = slot.evolved && slot.id === "burst";
  const dmg = weaponDamage(s, slot);
  const budget = chain ? Math.max(pierce, STORM_JUMPS) : pierce;

  for (let i = 0; i < n; i++) {
    if (s.bolts.length >= CAP_BOLTS) break;
    const a =
      id === "burst"
        ? aim + (i / n) * Math.PI * 2
        : aim + (n === 1 ? 0 : (i - (n - 1) / 2) * SPREAD_RAD);
    s.bolts.push({
      id: s.nextId++,
      kind: id,
      x: from.x,
      y: from.y,
      vx: Math.cos(a) * w.speed,
      vy: Math.sin(a) * w.speed,
      dmg,
      pierce: budget,
      chain,
      nova,
      life: w.life,
      age: 0,
      hit: [],
    });
  }
  s.events.push({ type: "shot", weapon: id, x: from.x, y: from.y });
  return true;
}
