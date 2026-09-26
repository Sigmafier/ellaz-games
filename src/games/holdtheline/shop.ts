// The four shop lines, their prices and caps, and the one function that spends.
//
// TYPES ONLY from `./types`, so this is a one-way import and never a cycle.
//
// THE CURRENCY LAW, restated here because this is the file that spends it: the
// cash this module moves is `RunState.cash`, which lives and dies inside one
// run. It is NOT the wallet. `ctx.rewards` is add-only - no `spend()`, no
// `clear()` - precisely so that no game can take a child's coins, and nothing
// in this file may ever acquire a conversion between the two.
//
// `buy` REFUSES rather than throwing, and it refuses by returning `null`. That
// shape is load-bearing for the UI: a card the player cannot afford must stay
// PRESSABLE and answer with a gentle wiggle, because `disabled` is reserved for
// the genuinely impossible and "you have not earned this yet" is not that
// (`CLAUDE.md` § What a child touches). A `buy` that threw would make the
// natural call site a guard that disables the button.

import type { GuardKind, WeaponId, LaneKind, PowerId, RunState, ShopId, ShopItem } from "./types";

/**
 * THE WEAPONS a player can hold, before any power multiplies them.
 *
 * Named for what they are rather than for the first one on the list. The
 * five are meant to LOOK different as well as read different - a scattergun
 * throwing five pellets and a launcher throwing one heavy round are not the
 * same picture, and `assert-tier.mjs` holds a showcase game to that.
 */
export const WEAPONS: Record<WeaponId, { dmg: number; cycle: number; mag: number; reload: number; spread: number; shots: number }> = {
  // cycle/reload in ms; spread in radians; `shots` is pellets per press.
  pistol: { dmg: 10, cycle: 420, mag: 7, reload: 900, spread: 0, shots: 1 },
  repeater: { dmg: 8, cycle: 150, mag: 20, reload: 1300, spread: 0.02, shots: 1 },
  shotgun: { dmg: 7, cycle: 700, mag: 5, reload: 1500, spread: 0.18, shots: 5 },
  rifle: { dmg: 34, cycle: 800, mag: 5, reload: 1600, spread: 0, shots: 1 },
  launcher: { dmg: 70, cycle: 1400, mag: 3, reload: 2400, spread: 0, shots: 1 },
};

/** What each guard does. `only` narrows what it will shoot at all. */
export const GUARDS: Record<GuardKind, { dmg: number; cycle: number; range: number; only?: "air" | "ground" }> = {
  rifleman: { dmg: 9, cycle: 900, range: 380, only: "ground" },
  // The marksman's whole job is to OUTRANGE a shooter's standoff (280 in
  // `logic.ts`). If that standoff ever grows past this range, the counter stops
  // being a counter and `shop.test.ts` fails rather than letting it drift.
  marksman: { dmg: 22, cycle: 1600, range: 620, only: "ground" },
  aa: { dmg: 16, cycle: 700, range: 520, only: "air" },
  rocketeer: { dmg: 55, cycle: 2600, range: 520, only: "ground" },
};

/** How many of each power may be bought, and what one step of it is worth. */
export const POWERS: Record<PowerId, { cap: number; step: number }> = {
  // `damage` and `magazine` scale the gun's own numbers; `reload` and `pierce`
  // are subtractive and additive respectively. Every cap exists because an
  // uncapped multiplier is how a long run stops being a run.
  damage: { cap: 6, step: 0.18 },
  reload: { cap: 5, step: 0.12 },
  magazine: { cap: 5, step: 0.35 },
  pierce: { cap: 3, step: 1 },
};

/** What one wall repair restores, and what one wall upgrade adds to its cap. */
export const WALL_REPAIR = 140;
export const WALL_STEP = 180;
export const GUARD_SLOTS = 6;
export const MINE_CAP = 8;

/**
 * The catalogue. `from` is the wave an item first appears in the shop, and it
 * is one wave BEFORE the threat it answers - that gap is what makes the shop a
 * forecast rather than a shopping list, and `shop.test.ts` pins it against
 * `waves.ts`'s bands.
 */
export const ITEMS: readonly ShopItem[] = [
  { id: "repair", line: "lane", price: 60, cap: Infinity, from: 1 },
  { id: "damage", line: "power", price: 90, cap: POWERS.damage.cap, from: 1 },
  { id: "reload", line: "power", price: 80, cap: POWERS.reload.cap, from: 1 },
  { id: "repeater", line: "gun", price: 220, cap: 1, from: 2 },
  { id: "rifleman", line: "guard", price: 200, cap: 3, from: 3 },
  { id: "magazine", line: "power", price: 110, cap: POWERS.magazine.cap, from: 3 },
  { id: "shotgun", line: "gun", price: 340, cap: 1, from: 4 },
  { id: "wall", line: "lane", price: 240, cap: 4, from: 4 },
  // vehicles arrive at 7, so their two answers are buyable at 6
  { id: "mine", line: "lane", price: 70, cap: MINE_CAP, from: 6 },
  { id: "rocketeer", line: "guard", price: 460, cap: 2, from: 6 },
  { id: "rifle", line: "gun", price: 520, cap: 1, from: 7 },
  { id: "pierce", line: "power", price: 200, cap: POWERS.pierce.cap, from: 8 },
  // shooters arrive at 10, so the marksman is buyable at 9
  { id: "marksman", line: "guard", price: 420, cap: 2, from: 9 },
  { id: "wire", line: "lane", price: 130, cap: 4, from: 9 },
  { id: "launcher", line: "gun", price: 780, cap: 1, from: 11 },
  // air arrives at 13, so AA is buyable at 12
  { id: "aa", line: "guard", price: 400, cap: 2, from: 12 },
];

export function itemFor(id: ShopId): ShopItem | undefined {
  return ITEMS.find((i) => i.id === id);
}

/** What is on the shelf at wave `n`, in catalogue order. */
export function shelfFor(n: number): readonly ShopItem[] {
  return ITEMS.filter((i) => i.from <= n);
}

/** How many of `id` this run has already bought. */
export function ownedOf(s: RunState, id: ShopId): number {
  return s.bought[id] ?? 0;
}

/**
 * What `id` costs THIS run.
 *
 * A repeatable item's price climbs 45% per copy, which is what stops a player
 * who under-spent for nine waves from buying the whole shop at wave 10 - one of
 * the four tuning traps the plan names. A wall repair is deliberately flat: it
 * is the one purchase a losing player has to be able to keep making, and a
 * climbing repair price turns a bad wave into an unrecoverable one.
 */
export function priceOf(s: RunState, id: ShopId): number {
  const item = itemFor(id);
  if (!item) return Infinity;
  if (id === "repair") return item.price;
  return Math.round(item.price * Math.pow(1.45, ownedOf(s, id)));
}

/** True when the item is on the shelf, under its cap, and affordable. */
export function canBuy(s: RunState, id: ShopId): boolean {
  const item = itemFor(id);
  if (!item) return false;
  if (s.wave < item.from) return false;
  if (ownedOf(s, id) >= item.cap) return false;
  return s.cash >= priceOf(s, id);
}

/** True when the shelf shows it at all - a capped-out item stops being offered. */
export function isOffered(s: RunState, id: ShopId): boolean {
  const item = itemFor(id);
  if (!item) return false;
  return s.wave >= item.from && ownedOf(s, id) < item.cap;
}

const WEAPON_IDS: readonly WeaponId[] = ["pistol", "repeater", "shotgun", "rifle", "launcher"];
const POWER_IDS: readonly PowerId[] = ["damage", "reload", "magazine", "pierce"];
const GUARD_IDS: readonly GuardKind[] = ["rifleman", "marksman", "aa", "rocketeer"];
const LANE_IDS: readonly LaneKind[] = ["mine", "wire"];

export function isWeapon(id: ShopId): id is WeaponId {
  return (WEAPON_IDS as readonly string[]).includes(id);
}
export function isPower(id: ShopId): id is PowerId {
  return (POWER_IDS as readonly string[]).includes(id);
}
export function isGuard(id: ShopId): id is GuardKind {
  return (GUARD_IDS as readonly string[]).includes(id);
}
export function isLane(id: ShopId): id is LaneKind {
  return (LANE_IDS as readonly string[]).includes(id);
}

/**
 * Spend, or refuse.
 *
 * MUTATES and returns `s` on success, and returns `null` on a refusal without
 * touching anything - so a caller cannot half-buy. See the header for why it
 * refuses rather than throwing.
 *
 * `laneX` is where a mine or wire is planted, and it is the CALLER's because
 * only the renderer knows where the player tapped. Everything else ignores it.
 */
export function buy(s: RunState, id: ShopId, laneX = 0): RunState | null {
  if (s.phase !== "shop") return null; // nothing is bought while something is walking
  if (!canBuy(s, id)) return null;

  s.cash -= priceOf(s, id);
  s.bought[id] = ownedOf(s, id) + 1;

  if (isWeapon(id)) {
    s.weapon = id;
    // A new gun arrives loaded. Buying mid-shop and walking into a wave with an
    // empty magazine would read as the purchase having broken something.
    s.ammo = magazineOf(s);
    s.weaponCool = 0;
    s.reloading = false;
  } else if (isPower(id)) {
    s.powers[id] += 1;
    if (id === "magazine") s.ammo = magazineOf(s);
  } else if (isGuard(id)) {
    s.guards.push({ id: s.seq++, kind: id, slot: s.guards.length % GUARD_SLOTS, cool: 0, down: 0 });
  } else if (isLane(id)) {
    s.mines.push({ id: s.seq++, x: laneX, kind: id });
  } else if (id === "repair") {
    s.wall = Math.min(s.wallMax, s.wall + WALL_REPAIR);
  } else if (id === "wall") {
    s.wallMax += WALL_STEP;
    // The upgrade fills what it adds. A cap raise that left the wall on its old
    // value would be a purchase with no visible effect until a repair followed.
    s.wall += WALL_STEP;
  }
  return s;
}

// ---------------------------------------------------------------------------
// what the powers actually do to the gun in hand
//
// All four read the gun AND the powers, so none of them can be a constant, and
// every one of them is here rather than in the scene - arithmetic inside a
// Phaser scene is arithmetic no test in this repo can reach
// (`a-setter-that-replaces-erases-what-the-thing-was-born-with.md`).
// ---------------------------------------------------------------------------

export function damageOf(s: RunState): number {
  return WEAPONS[s.weapon].dmg * (1 + s.powers.damage * POWERS.damage.step);
}

export function magazineOf(s: RunState): number {
  return Math.round(WEAPONS[s.weapon].mag * (1 + s.powers.magazine * POWERS.magazine.step));
}

/**
 * The shortest a gun may ever take, whatever is stacked on it.
 *
 * Multiplicative scaling cannot reach zero in real arithmetic, and the first
 * version of this file said so in a comment and shipped without a floor. It was
 * wrong: `Math.round` reaches zero long before the multiplication does, and a
 * 0ms reload is an infinite gun. The floor is the mechanism; the sentence about
 * multiplication was prose standing in for one.
 */
export const MIN_RELOAD_MS = 120;
export const MIN_CYCLE_MS = 60;

export function reloadOf(s: RunState): number {
  const scaled = WEAPONS[s.weapon].reload * Math.pow(1 - POWERS.reload.step, s.powers.reload);
  return Math.max(MIN_RELOAD_MS, Math.round(scaled));
}

export function cycleOf(s: RunState): number {
  const scaled = WEAPONS[s.weapon].cycle * Math.pow(1 - POWERS.reload.step, s.powers.reload);
  return Math.max(MIN_CYCLE_MS, Math.round(scaled));
}

export function pierceOf(s: RunState): number {
  return s.powers.pierce * POWERS.pierce.step;
}
