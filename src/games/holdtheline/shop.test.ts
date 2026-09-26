import { describe, expect, it } from "vitest";
import { ARENA, KIND, newRun } from "./logic";
import {
  GUARDS,
  WEAPONS,
  ITEMS,
  MIN_CYCLE_MS,
  MIN_RELOAD_MS,
  POWERS,
  WALL_STEP,
  buy,
  canBuy,
  cycleOf,
  damageOf,
  isOffered,
  itemFor,
  magazineOf,
  ownedOf,
  priceOf,
  reloadOf,
  shelfFor,
} from "./shop";
import { BANDS } from "./waves";
import type { ShopId } from "./types";

describe("the shop is a forecast, not a shopping list", () => {
  // The design claim is that every counter is buyable BEFORE the threat it
  // answers arrives. That is a relationship between two files, so it is the one
  // thing here that a test has to hold - prose in either file cannot.
  const answers: ReadonlyArray<{ threat: "vehicle" | "shooter" | "air"; counter: ShopId }> = [
    { threat: "vehicle", counter: "rocketeer" },
    { threat: "shooter", counter: "marksman" },
    { threat: "air", counter: "aa" },
  ];

  /** The first wave whose pool can send `kind`, read out of the band table. */
  function firstWaveOf(kind: string): number {
    for (const b of BANDS) if (b.kinds.includes(kind as never)) return b.from;
    throw new Error(`no band sends ${kind} - the band table and this test disagree`);
  }

  for (const { threat, counter } of answers) {
    it(`${counter} is on the shelf before the first ${threat} walks in`, () => {
      const arrives = firstWaveOf(threat);
      const item = itemFor(counter);
      expect(item, `${counter} is not in the catalogue`).toBeDefined();
      expect(item!.from).toBeLessThan(arrives);
    });
  }

  it("every catalogue id is unique - a persisted id is forever", () => {
    const ids = ITEMS.map((i) => i.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("the shelf only grows", () => {
    let last = 0;
    for (let n = 1; n <= 20; n++) {
      const size = shelfFor(n).length;
      expect(size).toBeGreaterThanOrEqual(last);
      last = size;
    }
    expect(shelfFor(20).length).toBe(ITEMS.length);
  });
});

describe("the marksman outranges what it exists to answer", () => {
  // If a shooter's standoff ever grows past the marksman's range, the counter
  // silently stops being a counter: the guard still fires, just never at the
  // thing it was bought for. Nothing else in the repo would notice.
  it("marksman range clears the shooter's standoff", () => {
    expect(GUARDS.marksman.range).toBeGreaterThan(KIND.shooter.standoff);
  });

  it("and the rifleman does NOT - that is what makes the marksman a purchase", () => {
    expect(GUARDS.rifleman.range).toBeLessThan(KIND.shooter.standoff);
  });

  it("AA is the only guard that will shoot an air unit", () => {
    const willShootAir = (Object.keys(GUARDS) as Array<keyof typeof GUARDS>).filter(
      (k) => GUARDS[k].only !== "ground",
    );
    expect(willShootAir).toEqual(["aa"]);
  });
});

describe("buying", () => {
  it("refuses rather than throwing, and changes nothing on a refusal", () => {
    const s = newRun("normal", ARENA);
    s.cash = 0;
    const before = JSON.stringify(s);
    expect(buy(s, "damage")).toBeNull();
    expect(JSON.stringify(s)).toBe(before);
  });

  it("refuses while a wave is walking", () => {
    const s = newRun("normal", ARENA);
    s.cash = 9999;
    s.phase = "wave";
    expect(buy(s, "damage")).toBeNull();
  });

  it("refuses an item that is not on the shelf yet", () => {
    const s = newRun("normal", ARENA);
    s.cash = 9999;
    expect(s.wave).toBe(1);
    expect(itemFor("aa")!.from).toBeGreaterThan(1);
    expect(buy(s, "aa")).toBeNull();
  });

  it("spends exactly the price and records the purchase", () => {
    const s = newRun("normal", ARENA);
    s.cash = 1000;
    const price = priceOf(s, "damage");
    buy(s, "damage");
    expect(s.cash).toBe(1000 - price);
    expect(ownedOf(s, "damage")).toBe(1);
    expect(s.powers.damage).toBe(1);
  });

  it("stops at the cap, and a capped item stops being offered", () => {
    const s = newRun("normal", ARENA);
    s.cash = 1e6;
    s.wave = 20;
    const cap = itemFor("damage")!.cap;
    for (let i = 0; i < cap; i++) expect(buy(s, "damage")).not.toBeNull();
    expect(ownedOf(s, "damage")).toBe(cap);
    expect(canBuy(s, "damage")).toBe(false);
    expect(isOffered(s, "damage")).toBe(false);
    expect(buy(s, "damage")).toBeNull();
  });

  it("a repeatable price climbs, so a hoarder cannot buy the shop at once", () => {
    const s = newRun("normal", ARENA);
    s.cash = 1e6;
    const first = priceOf(s, "damage");
    buy(s, "damage");
    expect(priceOf(s, "damage")).toBeGreaterThan(first);
  });

  it("but a wall repair stays flat, so a losing player can keep repairing", () => {
    const s = newRun("normal", ARENA);
    s.cash = 1e6;
    const first = priceOf(s, "repair");
    buy(s, "repair");
    buy(s, "repair");
    expect(priceOf(s, "repair")).toBe(first);
  });

  it("a new gun arrives loaded", () => {
    const s = newRun("normal", ARENA);
    s.cash = 1e6;
    s.wave = 4;
    s.ammo = 0;
    buy(s, "shotgun");
    expect(s.weapon).toBe("shotgun");
    expect(s.ammo).toBe(magazineOf(s));
    expect(s.reloading).toBe(false);
  });

  it("a wall upgrade fills what it adds, so the purchase is visible at once", () => {
    const s = newRun("normal", ARENA);
    s.cash = 1e6;
    s.wave = 4;
    const wall = s.wall;
    const max = s.wallMax;
    buy(s, "wall");
    expect(s.wallMax).toBe(max + WALL_STEP);
    expect(s.wall).toBe(wall + WALL_STEP);
  });

  it("a repair never exceeds the cap", () => {
    const s = newRun("normal", ARENA);
    s.cash = 1e6;
    s.wall = s.wallMax - 1;
    buy(s, "repair");
    expect(s.wall).toBe(s.wallMax);
  });
});

describe("the powers multiply the gun in hand, not a constant", () => {
  it("damage scales with the gun, so one power means more on a better gun", () => {
    const a = newRun("normal", ARENA);
    a.powers.damage = 3;
    const withPistol = damageOf(a);
    a.weapon = "rifle";
    expect(damageOf(a)).toBeGreaterThan(withPistol);
    expect(damageOf(a) / WEAPONS.rifle.dmg).toBeCloseTo(withPistol / WEAPONS.pistol.dmg, 6);
  });

  it("reload has a FLOOR, because rounding reaches zero before the maths does", () => {
    // Not a hypothetical: the first version of `reloadOf` was multiplicative
    // with no floor and a comment claiming that made zero unreachable.
    // `Math.round` disagreed at 99 stacks, and a 0ms reload is an infinite gun.
    const s = newRun("normal", ARENA);
    s.powers.reload = 99;
    expect(reloadOf(s)).toBe(MIN_RELOAD_MS);
    expect(cycleOf(s)).toBe(MIN_CYCLE_MS);
  });

  it("and the floor is not reachable by legitimate play, or it is a cap in disguise", () => {
    // The floor must be a backstop rather than the number a real run lands on.
    const s = newRun("normal", ARENA);
    s.powers.reload = POWERS.reload.cap;
    expect(reloadOf(s)).toBeGreaterThan(MIN_RELOAD_MS);
    expect(cycleOf(s)).toBeGreaterThan(MIN_CYCLE_MS);
  });
});
