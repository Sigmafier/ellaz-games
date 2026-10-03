import { describe, expect, it } from "vitest";
import { POOL } from "./arsenal";
import { RARITY, UNLOCK, asMainWeapon, weaponsOpen } from "./weaponPool";
import { freshSave, type CareerSave } from "../../shared/career/save";

/**
 * Which weapons a player may take as their MAIN weapon, and how rare each is
 * (operator ruling 2026-09-30, "like Survivor.io"): all five are in the
 * collection, Blades opens when World 1 is won in the career and Drone when
 * World 2 is, and a weapon's rarity is fixed.
 *
 * "Won" is the career map's own word for it - the world's boss cleared, read
 * through the kit's `nodeStates`, so a star recorded past a gap opens nothing.
 */

const clear = (s: CareerSave, ...ids: string[]) => {
  for (const id of ids) s.stars[id] = 2;
  return s;
};
const CITY = ["city-1", "city-2", "city-3", "city-boss"];
const FROST = ["frost-1", "frost-2", "frost-3", "frost-boss"];

describe("rarity is fixed per weapon", () => {
  it("common, common, rare, rare, epic - and the four found in a run", () => {
    expect(RARITY).toEqual({
      bolt: "common", arc: "common", burst: "rare", blades: "rare", drone: "epic",
      halo: "common", zap: "rare", flask: "common", bouncer: "rare",
    });
  });
  it("covers the whole pool and nothing else", () => {
    expect(Object.keys(RARITY).sort()).toEqual([...POOL].sort());
  });
});

describe("what is open", () => {
  it("a fresh save opens exactly bolt, arc and burst", () => {
    expect(weaponsOpen(freshSave())).toEqual(["bolt", "arc", "burst"]);
  });

  it("winning World 1 adds the blades", () => {
    expect(weaponsOpen(clear(freshSave(), ...CITY))).toEqual(["bolt", "arc", "burst", "blades"]);
  });

  it("winning World 2 adds the drone", () => {
    expect(weaponsOpen(clear(freshSave(), ...CITY, ...FROST))).toEqual(["bolt", "arc", "burst", "blades", "drone"]);
  });

  it("World 1 part-way is not won", () => {
    expect(weaponsOpen(clear(freshSave(), "city-1", "city-2", "city-3"))).toEqual(["bolt", "arc", "burst"]);
  });

  it("a boss star past a gap opens nothing - the kit's own rule", () => {
    expect(weaponsOpen(clear(freshSave(), "city-boss", "frost-boss"))).toEqual(["bolt", "arc", "burst"]);
  });

  it("every lock names a world, and only the two locked weapons have one", () => {
    expect(UNLOCK).toEqual({ blades: "city", drone: "frost" });
  });
});

describe("the stored main weapon is validated, never trusted", () => {
  const open = weaponsOpen(freshSave());
  it("an open weapon stands", () => {
    expect(asMainWeapon("burst", open)).toBe("burst");
  });
  it("a locked one reads as the bolt", () => {
    expect(asMainWeapon("drone", open)).toBe("bolt");
    expect(asMainWeapon("blades", open)).toBe("bolt");
  });
  it("and so does anything this app did not write", () => {
    for (const v of [undefined, null, 7, "", "railgun", { id: "bolt" }]) expect(asMainWeapon(v, open)).toBe("bolt");
  });
  it("THE CONTROL: the same locked weapon stands once its world is won", () => {
    expect(asMainWeapon("blades", weaponsOpen(clear(freshSave(), ...CITY)))).toBe("blades");
  });
});
