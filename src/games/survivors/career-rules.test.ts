// NEON'S CAREER ON THE KIT: the gear it drops, the shop it sells, how the save
// becomes numbers the run reads, and how a finished level is paid - once.
import { describe, expect, it } from "vitest";
import { gearProblems, bankItems, itemKey } from "../../shared/career/gear";
import { freshSave, readSave, writeSave, type CareerStore } from "../../shared/career/save";
import { buy } from "../../shared/career/shop";
import { currentNode } from "../../shared/career/progress";
import { mulberry32 } from "@shared/rng";
import {
  BASE_STATS, BOSS_GEAR, CAREER_KEY, ELITE_GEAR_CHANCE, NEON_GEAR, NEON_SHOP, SETTLED_KEY,
  bankRun, clearBonus, settle, simStats, starsFor, statsOf, type LevelResult,
} from "./careerRules";
import { PLAIN_STATS } from "./careerRun";
import { NEON_CAMPAIGN } from "./worlds";

function memStore(seed: Record<string, unknown> = {}): CareerStore & { data: Map<string, unknown> } {
  const data = new Map(Object.entries(seed));
  return { data, get: (k) => data.get(k), set: (k, v) => void data.set(k, v) };
}

const win = (level: string, over: Partial<LevelResult> = {}): LevelResult =>
  ({ level, won: true, hp: 3, maxHp: 3, gold: 10, elites: 0, ...over });

describe("the gear and the shop are ones the kit can use", () => {
  it("both gear files pass the kit's own checks, and differ only in their odds", () => {
    expect(gearProblems(NEON_GEAR)).toEqual([]);
    expect(gearProblems(BOSS_GEAR)).toEqual([]);
    expect(BOSS_GEAR.slots).toEqual(NEON_GEAR.slots);
    expect(BOSS_GEAR.odds.epic).toBeGreaterThan(NEON_GEAR.odds.epic);
  });

  it("every shop row has a picture the kit draws and a price above zero", () => {
    const ids = NEON_SHOP.rows.map((r) => r.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const r of NEON_SHOP.rows) expect(r.price).toBeGreaterThan(0);
  });
});

describe("the save becomes the numbers the run reads", () => {
  it("a fresh save is the plain robot the simulation already assumes", () => {
    expect(simStats(freshSave())).toEqual(PLAIN_STATS);
    expect(statsOf(freshSave())).toEqual(BASE_STATS);
  });

  it("each gear slot moves its own stat and nothing else", () => {
    const worn = (key: string) => simStats(bankItems(NEON_GEAR, freshSave(), [key]));
    expect(worn(itemKey("weapon", "epic"))).toEqual({ ...PLAIN_STATS, damage: expect.any(Number) });
    expect(worn(itemKey("weapon", "epic")).damage).toBeGreaterThan(1);
    expect(worn(itemKey("armor", "rare")).hearts).toBe(PLAIN_STATS.hearts + 2);
    expect(worn(itemKey("ring", "common")).luck).toBeGreaterThan(PLAIN_STATS.luck);
  });

  it("each shop row moves the number it says it does", () => {
    const bought = (id: string) => {
      const r = buy(NEON_SHOP, { ...freshSave(), gold: 10_000 }, id);
      expect(r.ok, `could not buy ${id}`).toBe(true);
      return simStats(r.save);
    };
    const moved = (id: string) => {
      const a = bought(id);
      return (Object.keys(a) as (keyof typeof a)[]).filter((k) => a[k] !== PLAIN_STATS[k]);
    };
    expect(moved("heart")).toEqual(["hearts"]);
    expect(moved("power")).toEqual(["damage"]);
    expect(moved("swift")).toEqual(["speed"]);
    expect(moved("magnet")).toEqual(["magnet"]);
    expect(moved("luck")).toEqual(["luck"]);
    expect(moved("shield")).toEqual(["shield"]);
  });
});

describe("stars are hearts left", () => {
  it("3 of 3 is three stars, 2 is two, 1 is one, and a bigger heart bar scales", () => {
    expect([3, 2, 1].map((hp) => starsFor(hp, 3))).toEqual([3, 2, 1]);
    expect([5, 4, 3, 2, 1].map((hp) => starsFor(hp, 5))).toEqual([3, 3, 2, 2, 1]);
    expect(starsFor(0, 3)).toBe(0);
  });
});

describe("a finished level is paid", () => {
  it("a win pays the gold picked up plus the world's clear bonus, records its stars and opens the next", () => {
    const r = settle(freshSave(), win("city-1", { hp: 2 }), mulberry32(1));
    expect(r.gold).toBe(10 + clearBonus("city-1"));
    expect(r.save.gold).toBe(r.gold);
    expect(r.stars).toBe(2);
    expect(r.save.stars["city-1"]).toBe(2);
    expect(currentNode(NEON_CAMPAIGN, r.save)?.id).toBe("city-2");
  });

  it("a loss keeps half the gold and nothing else", () => {
    const r = settle(freshSave(), win("city-1", { won: false, hp: 0, gold: 11 }), mulberry32(1));
    expect(r.gold).toBe(5);
    expect(r.stars).toBe(0);
    expect(r.drop).toBeNull();
    expect(r.save.stars).toEqual({});
  });

  it("a boss ALWAYS drops a piece of gear, and it is worn on the spot when it beats the slot", () => {
    let save = freshSave();
    for (let n = 1; n <= 3; n++) save = settle(save, win(`city-${n}`), mulberry32(n)).save;
    expect(currentNode(NEON_CAMPAIGN, save)?.id).toBe("city-boss");
    for (let seed = 1; seed <= 50; seed++) {
      const r = settle(save, win("city-boss"), mulberry32(seed));
      expect(r.drop, `seed ${seed} dropped nothing`).not.toBeNull();
      expect(r.save.gear.owned).toContain(r.drop);
      const slot = r.drop!.split(":")[0] as "weapon" | "armor" | "ring";
      expect(r.save.gear.equipped[slot]).toBe(r.drop);
    }
  });

  it("an elite is a SMALL chance at gear, and an ordinary level with none never drops", () => {
    let drops = 0;
    const N = 4000;
    for (let seed = 1; seed <= N; seed++) if (settle(freshSave(), win("city-1", { elites: 1 }), mulberry32(seed)).drop) drops++;
    expect(drops / N).toBeGreaterThan(ELITE_GEAR_CHANCE - 0.03);
    expect(drops / N).toBeLessThan(ELITE_GEAR_CHANCE + 0.03);
    for (let seed = 1; seed <= 200; seed++) expect(settle(freshSave(), win("city-1"), mulberry32(seed)).drop).toBeNull();
  });

  it("a boss clear pays more than an ordinary one, and a later world more than an earlier", () => {
    expect(clearBonus("city-boss")).toBeGreaterThan(clearBonus("city-3"));
    expect(clearBonus("frost-1")).toBeGreaterThan(clearBonus("city-1"));
    expect(clearBonus("lava-1")).toBeGreaterThan(clearBonus("frost-1"));
  });
});

describe("a level is paid ONCE, however often it is reported", () => {
  it("the same run banked twice pays once", () => {
    const store = memStore();
    const a = bankRun(store, "run-1", win("city-1"), mulberry32(1));
    const b = bankRun(store, "run-1", win("city-1"), mulberry32(1));
    expect(a).not.toBeNull();
    expect(b).toBeNull();
    expect(readSave(store, CAREER_KEY).gold).toBe(a!.gold);
  });

  it("LEAVE AND RETURN: a fresh page on the same device still refuses the same run", () => {
    const store = memStore();
    bankRun(store, "run-9", win("city-1"), mulberry32(1));
    const again = memStore(Object.fromEntries(store.data));
    expect(bankRun(again, "run-9", win("city-1"), mulberry32(1))).toBeNull();
    expect(readSave(again, CAREER_KEY).gold).toBe(readSave(store, CAREER_KEY).gold);
  });

  it("THE CONTROL: a different run is paid", () => {
    const store = memStore();
    const a = bankRun(store, "run-1", win("city-1"), mulberry32(1))!;
    const b = bankRun(store, "run-2", win("city-1"), mulberry32(2))!;
    expect(readSave(store, CAREER_KEY).gold).toBe(a.gold + b.gold);
  });
});

describe("today's Neon keys are never touched", () => {
  it("startWeapon, stickStyle and the score boards read back exactly as they were", () => {
    const before = { startWeapon: "arc", stickStyle: "corner", "score:normal": 812 };
    const store = memStore(before);
    bankRun(store, "run-1", win("city-1"), mulberry32(1));
    writeSave(store, CAREER_KEY, readSave(store, CAREER_KEY));
    for (const [k, v] of Object.entries(before)) expect(store.data.get(k)).toBe(v);
    expect([...store.data.keys()].sort()).toEqual([...Object.keys(before), CAREER_KEY, SETTLED_KEY].sort());
  });

  it("a save from before the career reads as a fresh career", () => {
    expect(readSave(memStore({ startWeapon: "arc" }), CAREER_KEY)).toEqual(freshSave());
  });
});
