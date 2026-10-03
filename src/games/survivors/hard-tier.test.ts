// THE HARD TIER (operator ruling 2026-10-03, "Hard tier per world"): once a
// world's boss has fallen, its four levels can be played again on HARD - a
// faster, tougher crowd that shoots from the first second, paying more gold and a
// diamond for the boss. NORMAL is untouched for a new player: every cell below
// that reads a normal run asserts it is the run it always was.
import { describe, expect, it } from "vitest";
import { createDiamonds, DIAMONDS_KEY, type DiamondStore } from "@sdk/diamonds";
import { mulberry32 } from "@shared/rng";
import { freshSave, readSave, writeSave, type CareerSave, type CareerStore } from "../../shared/career/save";
import { ARENA_WIDE, bossHpFor, rngFor, step } from "./logic";
import { newCareerRun, careerResult, PLAIN_STATS } from "./careerRun";
import { CAREER_KEY, bankRun, clearBonus, settle } from "./careerRules";
import { payBossDiamond } from "./diamondShelf";
import { HARD, HARD_KEY, HARD_WORLD, hardBase, hardLevel, hardMix, hardOpen, hardStates, readHard, recordHard, writeHard } from "./hardTier";
import { LEVELS, WORLDS, levelRow, worldRow } from "./worlds";
import type { CareerResult } from "./types";

function memStore(seed: Record<string, unknown> = {}): CareerStore & { data: Map<string, unknown> } {
  const data = new Map(Object.entries(seed));
  return { data, get: (k) => data.get(k), set: (k, v) => void data.set(k, v) };
}
const cleared = (...ids: string[]): CareerSave => ({ ...freshSave(), stars: Object.fromEntries(ids.map((id) => [id, 3])) });
const CITY = ["city-1", "city-2", "city-3", "city-boss"];
const win = (level: string, hard: boolean): CareerResult => ({ level, won: true, hp: 3, maxHp: 3, gold: 10, elites: 0, ...(hard ? { hard: true } : {}) });

describe("a hard level is its normal row, harder on every axis the ruling named", () => {
  it("gaps -30%, tougher shapes, elites x2.5, the boss x1.6", () => {
    for (const L of LEVELS) {
      const H = hardLevel(L);
      expect(H.id).toBe(L.id);
      expect(H.spawnMs).toBe(Math.round(L.spawnMs * HARD.gap));
      expect(H.floorMs).toBe(Math.round(L.floorMs * HARD.gap));
      expect(H.hp).toBeCloseTo(Math.max(HARD_WORLD[L.world].floor, L.hp + HARD.hp + HARD_WORLD[L.world].hp), 6);
      // Whatever the trim, every hard level's shapes are tougher than its normal self.
      expect(H.hp, L.id).toBeGreaterThan(L.hp);
      expect(H.pace).toBeCloseTo(L.pace + HARD_WORLD[L.world].pace, 6);
      expect(H.elite).toBeCloseTo(Math.min(HARD.eliteMax, L.elite * HARD.elite), 6);
      expect(H.bossHp).toBeCloseTo(L.bossHp * HARD.boss, 6);
      expect(H.timeMs).toBe(L.timeMs);
    }
    expect(HARD).toMatchObject({ gap: 0.7, hp: 0.35, elite: 2.5, boss: 1.6 });
  });

  it("the shapes that shoot are there from the first second - the city, which has none, gets one", () => {
    for (const W of WORLDS) {
      const mix = hardMix(W);
      const guns = mix.filter(([k]) => k === "spitter" || k === "lancer");
      expect(guns.length, W.id).toBeGreaterThan(0);
      for (const [, at] of guns) expect(at, W.id).toBe(0);
    }
    expect(WORLDS.find((w) => w.id === "city")!.mix.some(([k]) => k === "spitter")).toBe(false);
  });

  it("a NORMAL run carries no hard field at all - its state is the state it always was", () => {
    for (const L of LEVELS) {
      const c = newCareerRun(L.id, PLAIN_STATS, ARENA_WIDE).career!;
      expect("hard" in c, L.id).toBe(false);
      expect("shooters" in c, L.id).toBe(false);
      expect(c.spawnMs).toBe(L.spawnMs);
      expect(c.mix).toBe(worldRow(L.id).mix);
    }
  });

  it("a HARD run reads the hard row, the hard mix and a shooter cap", () => {
    const c = newCareerRun("city-2", PLAIN_STATS, ARENA_WIDE, "bolt", true).career!;
    expect(c.hard).toBe(true);
    expect(c.spawnMs).toBe(hardLevel(levelRow("city-2")).spawnMs);
    expect(c.shooters).toBeGreaterThan(0);
    expect(c.coin).toBe(worldRow("city-2").coin);
    const boss = newCareerRun("city-boss", PLAIN_STATS, ARENA_WIDE, "bolt", true).career!;
    const W = worldRow("city-boss");
    expect(boss.bossHp).toBe(Math.round(bossHpFor(W.boss, hardBase(W)) * levelRow("city-boss").bossHp * HARD.boss));
    expect(boss.bossHp).toBeGreaterThan(newCareerRun("city-boss", PLAIN_STATS, ARENA_WIDE).career!.bossHp);
  });

  it("the hard city SENDS a shooter, and the normal city never does (one seed, 40 s, nobody steering)", () => {
    const sent = (hard: boolean) => {
      const s = newCareerRun("city-1", { ...PLAIN_STATS, hearts: 999 }, ARENA_WIDE, "bolt", hard);
      const rng = rngFor(7);
      const seen = new Set<string>();
      for (let t = 0; t < 40_000 && s.phase === "playing"; t += 16) {
        s.choosing = false;
        step(s, 16, { dx: 0, dy: 0 }, rng);
        for (const e of s.enemies) seen.add(e.kind);
      }
      return seen;
    };
    expect(sent(true).has("spitter")).toBe(true);
    expect(sent(false).has("spitter")).toBe(false);
  });

  it("the result says it was hard, and a normal result does not grow the field", () => {
    expect(careerResult(newCareerRun("city-1", PLAIN_STATS, ARENA_WIDE, "bolt", true)).hard).toBe(true);
    expect("hard" in careerResult(newCareerRun("city-1", PLAIN_STATS, ARENA_WIDE))).toBe(false);
  });
});

describe("where hard opens, and how its stars are kept", () => {
  it("a world's hard tier opens when ITS boss falls on normal, and not before", () => {
    expect(hardOpen(freshSave(), "city")).toBe(false);
    expect(hardOpen(cleared("city-1", "city-2", "city-3"), "city")).toBe(false);
    expect(hardOpen(cleared(...CITY), "city")).toBe(true);
    expect(hardOpen(cleared(...CITY), "frost")).toBe(false);
  });

  it("the map's hard view: an open world climbs on its own, a closed one is locked (and wiggles)", () => {
    const v = hardStates(cleared(...CITY), { stars: { "city-1": 2 } });
    const of = (id: string) => v.find((x) => x.node.id === id)!;
    expect([of("city-1").state, of("city-1").stars]).toEqual(["done", 2]);
    expect(of("city-2").state).toBe("now");
    expect(of("city-3").state).toBe("locked");
    expect(of("frost-1").state).toBe("locked");
    expect(v.map((x) => x.node.id)).toEqual(LEVELS.map((l) => l.id));
  });

  it("hard stars are recorded in order, only rise, and never on a closed world", () => {
    const save = cleared(...CITY);
    let h = recordHard(save, { stars: {} }, "city-2", 3);
    expect(h.stars).toEqual({});
    h = recordHard(save, h, "city-1", 2);
    h = recordHard(save, h, "city-1", 1);
    expect(h.stars).toEqual({ "city-1": 2 });
    expect(recordHard(save, { stars: {} }, "frost-1", 3).stars).toEqual({});
  });

  it("the hard save lives under its own key, forever; nothing usable reads as none", () => {
    expect(HARD_KEY).toBe("careerHard");
    const store = memStore();
    expect(readHard(store)).toEqual({ stars: {} });
    expect(writeHard(store, { stars: { "city-1": 3 } })).toBe(true);
    expect(readHard(store)).toEqual({ stars: { "city-1": 3 } });
    for (const junk of ["{", "null", '{"stars":{"city-1":9}}', '{"stars":[1]}', 42]) {
      expect(readHard(memStore({ [HARD_KEY]: junk }))).toEqual({ stars: {} });
    }
  });

  it("an OLD save - written before hard existed - loads untouched, and opens nothing on hard", () => {
    const store = memStore();
    writeSave(store, CAREER_KEY, cleared("city-1"));
    expect(readSave(store, CAREER_KEY).stars).toEqual({ "city-1": 3 });
    expect(readHard(store)).toEqual({ stars: {} });
  });
});

describe("a hard clear pays more, and records its stars in the hard save only", () => {
  it("double the clear bonus, the normal stars unmoved", () => {
    const save = cleared(...CITY);
    const n = settle(save, win("city-1", false), mulberry32(1));
    const h = settle(save, win("city-1", true), mulberry32(1));
    expect(h.bonus).toBe(clearBonus("city-1") * HARD.gold);
    expect(h.gold).toBeGreaterThan(n.gold);
    expect(h.save.stars).toEqual(save.stars);
  });

  it("bankRun writes the hard star once, and pays the run once", () => {
    const store = memStore();
    writeSave(store, CAREER_KEY, cleared(...CITY));
    const a = bankRun(store, "h-1", win("city-1", true), mulberry32(1))!;
    expect(bankRun(store, "h-1", win("city-1", true), mulberry32(1))).toBeNull();
    expect(readHard(store).stars).toEqual({ "city-1": 3 });
    expect(readSave(store, CAREER_KEY).gold).toBe(a.gold);
    expect(readSave(store, CAREER_KEY).stars).toEqual(cleared(...CITY).stars);
  });

  it("a hard BOSS pays the diamond, once per run token", () => {
    const all = new Map<string, string>([[DIAMONDS_KEY, "0"]]);
    const st: DiamondStore = { read: (k) => all.get(k) ?? null, write: (k, v) => (all.set(k, v), true) };
    const d = createDiamonds(st);
    expect(payBossDiamond(d, win("city-boss", true), "hb-1")).toBe(1);
    expect(payBossDiamond(d, win("city-boss", true), "hb-1")).toBe(0);
    expect(d.count).toBe(1);
  });
});
