// SNAKE SURVIVORS ON THE CAREER KIT: Fangs, Scales and a Charm, the vending
// machine's six rows, how a save becomes the numbers a level reads, and how a
// finished level is paid - once.
import { describe, expect, it } from "vitest";
import { mulberry32 } from "@shared/rng";
import { bankItems, gearProblems, itemKey } from "../../shared/career/gear";
import { currentNode } from "../../shared/career/progress";
import { freshSave, readSave, type CareerStore } from "../../shared/career/save";
import { buy, priceOf } from "../../shared/career/shop";
import { createDiamonds } from "@sdk/diamonds";
import {
  BOSS_GEAR, CAREER_KEY, GEAR_CHANCE, SETTLED_KEY, SNAKE_BASE, SNAKE_GEAR, SNAKE_SHOP,
  bankRun, clearBonus, payBossDiamond, settle, simStats, starsFor, statsOf,
} from "./careerRules";
import { PLAIN_STATS } from "./careerRun";
import { START_LEN } from "./body";
import { SNAKE_CAMPAIGN } from "./careerWorlds";
import type { SnakeCareerResult } from "./careerTypes";

function memStore(seed: Record<string, unknown> = {}): CareerStore & { data: Map<string, unknown> } {
  const data = new Map(Object.entries(seed));
  return { data, get: (k) => data.get(k), set: (k, v) => void data.set(k, v) };
}

const win = (level: string, over: Partial<SnakeCareerResult> = {}): SnakeCareerResult =>
  ({ level, won: true, hearts: 8, of: 8, gold: 10, ...over });

describe("Fangs, Scales and a Charm", () => {
  it("are the kit's three slots, and each moves ONE stat: crush, length, luck", () => {
    expect(gearProblems(SNAKE_GEAR)).toEqual([]);
    expect(gearProblems(BOSS_GEAR)).toEqual([]);
    expect(BOSS_GEAR.slots).toEqual(SNAKE_GEAR.slots);
    expect(SNAKE_GEAR.slots.map((s) => [s.id, s.stat])).toEqual([["weapon", "damage"], ["armor", "health"], ["ring", "luck"]]);
  });

  it("wearing one changes its own number in the run and nothing else", () => {
    const moved = (key: string) => {
      const a = simStats(bankItems(SNAKE_GEAR, freshSave(), [key]));
      return (Object.keys(a) as (keyof typeof a)[]).filter((k) => a[k] !== PLAIN_STATS[k]);
    };
    expect(moved(itemKey("weapon", "rare"))).toEqual(["crush"]);
    expect(moved(itemKey("armor", "rare"))).toEqual(["length"]);
    expect(moved(itemKey("ring", "rare"))).toEqual(["luck"]);
  });

  it("Scales add whole segments to the start: common 2, rare 4, epic 6", () => {
    for (const [tier, add] of [["common", 2], ["rare", 4], ["epic", 6]] as const) {
      expect(simStats(bankItems(SNAKE_GEAR, freshSave(), [itemKey("armor", tier)])).length).toBe(START_LEN + add);
    }
  });

  it("a boss drop is better odds of the same pieces", () => {
    expect(BOSS_GEAR.odds.epic).toBeGreaterThan(SNAKE_GEAR.odds.epic);
  });
});

describe("the vending machine's six rows (operator ruling 2026-10-03)", () => {
  it("are these ids, prices, steps and caps - ids forever, the save counts against them", () => {
    expect(SNAKE_SHOP.rows.map((r) => [r.id, r.price, r.step, r.max])).toEqual([
      ["length", 40, 40, 3],
      ["crush", 50, 40, 5],
      ["swift", 35, 30, 3],
      ["magnet", 30, 30, 3],
      ["luck", 30, 30, 3],
      ["shield", 120, 0, 1],
    ]);
  });

  it("each row's gain reads as the ruling says: +4, +10%, +8%, +25%, +5, +1", () => {
    expect(SNAKE_SHOP.rows.map((r) => r.effect)).toEqual([
      { stat: "health", kind: "add", amount: 4 },
      { stat: "damage", kind: "pct", amount: 10 },
      { stat: "speed", kind: "pct", amount: 8 },
      { stat: "magnet", kind: "pct", amount: 25 },
      { stat: "luck", kind: "add", amount: 5 },
      { kind: "count", amount: 1 },
    ]);
  });

  it("each buy is dearer, and the cap refuses one more", () => {
    let save = { ...freshSave(), gold: 10_000 };
    const paid: number[] = [];
    for (let i = 0; i < 3; i++) {
      const before = save.gold;
      const r = buy(SNAKE_SHOP, save, "length");
      expect(r.ok).toBe(true);
      save = r.save;
      paid.push(before - save.gold);
    }
    expect(paid).toEqual([40, 80, 120]);
    expect(buy(SNAKE_SHOP, save, "length")).toMatchObject({ ok: false, why: "maxed" });
    expect(priceOf(SNAKE_SHOP.rows[1], 4)).toBe(210);
  });

  it("each row moves the number it says, and nothing else", () => {
    const moved = (id: string) => {
      const r = buy(SNAKE_SHOP, { ...freshSave(), gold: 10_000 }, id);
      expect(r.ok, id).toBe(true);
      const a = simStats(r.save);
      return (Object.keys(a) as (keyof typeof a)[]).filter((k) => a[k] !== PLAIN_STATS[k]);
    };
    expect(["length", "crush", "swift", "magnet", "luck", "shield"].map(moved)).toEqual([
      ["length"], ["crush"], ["speed"], ["magnet"], ["luck"], ["shield"],
    ]);
  });
});

describe("the save becomes the numbers a level reads", () => {
  it("a fresh save is the plain snake: 28 long, every multiplier at one", () => {
    expect(simStats(freshSave())).toEqual(PLAIN_STATS);
    expect(statsOf(freshSave())).toEqual(SNAKE_BASE);
    expect(PLAIN_STATS).toEqual({ length: START_LEN, speed: 1, crush: 1, magnet: 1, luck: 15, shield: 0 });
  });

  it("a bought-out shop adds 12 segments, 50% crush and one shield", () => {
    const save = { ...freshSave(), shop: { length: 3, crush: 5, swift: 3, magnet: 3, luck: 3, shield: 1 } };
    const s = simStats(save);
    expect(s.length).toBe(START_LEN + 12);
    expect(s.crush).toBeCloseTo(1.5);
    expect(s.speed).toBeCloseTo(1.24);
    expect(s.magnet).toBeCloseTo(1.75);
    expect(s.luck).toBe(30);
    expect(s.shield).toBe(1);
  });
});

describe("stars are hearts left (8 hearts, all of them is 3)", () => {
  it("all 8 is three, half or more is two (the mock's 5 of 8), fewer is one, 0 is a loss", () => {
    expect([8, 7, 6, 5, 4, 3, 2, 1, 0].map((h) => starsFor(h, 8))).toEqual([3, 2, 2, 2, 2, 1, 1, 1, 0]);
  });
});

describe("a finished level is paid", () => {
  it("a win pays the gold picked up plus the world's bonus, records its stars and opens the next", () => {
    const r = settle(freshSave(), win("garden-1", { hearts: 5 }), mulberry32(1));
    expect(r.gold).toBe(10 + clearBonus("garden-1"));
    expect(r.save.gold).toBe(r.gold);
    expect(r.stars).toBe(2);
    expect(currentNode(SNAKE_CAMPAIGN, r.save)?.id).toBe("garden-2");
  });

  it("a loss keeps HALF the gold picked up, and nothing else", () => {
    const r = settle(freshSave(), win("garden-1", { won: false, hearts: 0, gold: 18 }), mulberry32(1));
    expect(r.gold).toBe(9);
    expect(r.picked).toBe(18);
    expect(r.stars).toBe(0);
    expect(r.drop).toBeNull();
    expect(r.save.stars).toEqual({});
    expect(r.save.gold).toBe(9);
  });

  it("a boss clear ALWAYS drops a piece, worn on the spot when it beats the slot", () => {
    let save = freshSave();
    for (let n = 1; n <= 3; n++) save = settle(save, win(`garden-${n}`), mulberry32(n)).save;
    for (let seed = 1; seed <= 40; seed++) {
      const r = settle(save, win("garden-boss"), mulberry32(seed));
      expect(r.drop, `seed ${seed}`).not.toBeNull();
      expect(r.save.gear.equipped[r.drop!.split(":")[0] as "weapon"]).toBe(r.drop);
    }
  });

  it("an ordinary clear is a SMALL chance at gear", () => {
    let drops = 0;
    const N = 4000;
    for (let seed = 1; seed <= N; seed++) if (settle(freshSave(), win("garden-1"), mulberry32(seed)).drop) drops++;
    expect(drops / N).toBeGreaterThan(GEAR_CHANCE - 0.03);
    expect(drops / N).toBeLessThan(GEAR_CHANCE + 0.03);
  });

  it("a boss pays more than an ordinary level, a later world more than an earlier", () => {
    expect(clearBonus("garden-boss")).toBe(2 * clearBonus("garden-3"));
    expect(clearBonus("desert-1")).toBeGreaterThan(clearBonus("garden-1"));
    expect(clearBonus("cave-1")).toBeGreaterThan(clearBonus("desert-1"));
  });
});

describe("a level is paid ONCE, however often it is reported", () => {
  it("the same run banked twice pays once", () => {
    const store = memStore();
    const a = bankRun(store, "run-1", win("garden-1"), mulberry32(1));
    const b = bankRun(store, "run-1", win("garden-1"), mulberry32(1));
    expect(a).not.toBeNull();
    expect(b).toBeNull();
    expect(readSave(store, CAREER_KEY).gold).toBe(a!.gold);
  });

  it("LEAVE AND RETURN: a fresh page on the same device still refuses the same run", () => {
    const store = memStore();
    bankRun(store, "run-9", win("garden-1"), mulberry32(1));
    const again = memStore(Object.fromEntries(store.data));
    expect(bankRun(again, "run-9", win("garden-1"), mulberry32(1))).toBeNull();
  });

  it("THE CONTROL: a different run is paid", () => {
    const store = memStore();
    const a = bankRun(store, "run-1", win("garden-1"), mulberry32(1))!;
    const b = bankRun(store, "run-2", win("garden-1"), mulberry32(2))!;
    expect(readSave(store, CAREER_KEY).gold).toBe(a.gold + b.gold);
  });

  it("A DROPPED SAVE: the run is not marked paid, so the next report pays it", () => {
    const store = memStore();
    const drops: CareerStore = { get: store.get, set: (k, v) => { if (k !== CAREER_KEY) store.set(k, v); } };
    const first = bankRun(drops, "run-5", win("garden-1"), mulberry32(1))!;
    expect(first.gold).toBeGreaterThan(0);
    expect(store.data.get(SETTLED_KEY)).toBeUndefined();
    expect(bankRun(store, "run-5", win("garden-1"), mulberry32(1))).not.toBeNull();
  });

  it("the quick run's keys are never touched", () => {
    const before = { "score:normal": 812, tutorialSeen: true, controlMode: "stick" };
    const store = memStore(before);
    bankRun(store, "run-1", win("garden-1"), mulberry32(1));
    for (const [k, v] of Object.entries(before)) expect(store.data.get(k)).toBe(v);
    expect([...store.data.keys()].sort()).toEqual([...Object.keys(before), CAREER_KEY, SETTLED_KEY].sort());
  });
});

describe("site diamonds: one per boss, paid once per run (as Neon)", () => {
  const fresh = () => {
    const all = new Map<string, string>();
    return createDiamonds({ read: (k) => all.get(k) ?? null, write: (k, v) => { all.set(k, v); return true; } });
  };

  it("a won boss level pays one, the same run reported again pays none", () => {
    const d = fresh();
    expect(payBossDiamond(d, win("garden-boss"), "t1")).toBe(1);
    expect(payBossDiamond(d, win("garden-boss"), "t1")).toBe(0);
    expect(d.count).toBe(1);
  });

  it("an ordinary level, or a lost boss level, pays nothing", () => {
    const d = fresh();
    expect(payBossDiamond(d, win("garden-3"), "t2")).toBe(0);
    expect(payBossDiamond(d, win("garden-boss", { won: false, hearts: 0 }), "t3")).toBe(0);
    expect(d.count).toBe(0);
  });
});
