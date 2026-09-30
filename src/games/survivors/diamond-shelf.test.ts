// NEON'S DIAMOND SHELF: looks and an epic piece for diamonds, and one diamond per
// boss beaten - each path against a real diamond balance on a map, including the
// device that silently drops a write.
import { describe, expect, it } from "vitest";
import { createDiamonds, DIAMONDS_KEY, type DiamondStore } from "@sdk/diamonds";
import { freshSave, readSave, writeSave, type CareerStore } from "../../shared/career/save";
import { CAREER_KEY } from "./careerRules";
import {
  EPIC_PRICE, LOOKS, LOOKS_KEY, ROW, buyEpic, epicSlotsOwned, payBossDiamond, pressLook, readLooks, shelfRows,
} from "./diamondShelf";
import type { CareerResult } from "./types";

function gems(n: number, drop = false): DiamondStore & { all: Map<string, string> } {
  const all = new Map<string, string>([[DIAMONDS_KEY, String(n)]]);
  return { all, read: (k) => all.get(k) ?? null, write: (k, v) => { if (!drop) all.set(k, v); return !drop; } };
}
function game(seed: Record<string, string> = {}, dropKey?: string): CareerStore & { data: Map<string, unknown> } {
  const data = new Map<string, unknown>(Object.entries(seed));
  return { data, get: (k) => data.get(k), set: (k, v) => { if (k !== dropKey) data.set(k, v); } };
}
const WORDS = { wear: "Wear", worn: "Wearing", gold: "Gold bot", ice: "Ice bot", epic: "Epic" };
const result = (level: string, won: boolean): CareerResult => ({ level, won, hp: 3, maxHp: 3, gold: 10, elites: 0 });

describe("the shelf shows three capsules at the approved prices", () => {
  it("Gold bot 3, Ice bot 3, Epic gear 2 - priced in diamonds, afford read off the balance", () => {
    const rows = shelfRows({ owned: [], worn: null }, 2, WORDS);
    expect(rows.map((r) => [r.id, r.cost, r.afford])).toEqual([
      [ROW.gold, 3, false], [ROW.ice, 3, false], [ROW.epic, EPIC_PRICE, true],
    ]);
    expect(LOOKS.gold.price).toBe(3);
    expect(EPIC_PRICE).toBe(2);
  });

  it("an owned look offers to be worn instead of a price, and says when it is worn", () => {
    const rows = shelfRows({ owned: ["gold", "ice"], worn: "ice" }, 0, WORDS);
    expect(rows[0].tag).toBe("Wear");
    expect(rows[1].tag).toBe("Wearing");
    expect(rows[0].afford && rows[1].afford).toBe(true);
  });
});

describe("buying a look", () => {
  it("takes the diamonds, owns the look forever and wears it", () => {
    const d = createDiamonds(gems(5));
    const store = game();
    const r = pressLook(d, store, "gold");
    expect(r.ok).toBe(true);
    expect(d.count).toBe(2);
    expect(readLooks(store)).toEqual({ owned: ["gold"], worn: "gold" });
  });

  it("SHORT: refused, and nothing changes - not the balance, not the looks", () => {
    const d = createDiamonds(gems(2));
    const store = game();
    expect(pressLook(d, store, "ice")).toEqual({ ok: false, why: "short" });
    expect(d.count).toBe(2);
    expect(store.data.has(LOOKS_KEY)).toBe(false);
  });

  it("an owned look is worn and taken off for free", () => {
    const d = createDiamonds(gems(3));
    const store = game();
    pressLook(d, store, "ice");
    expect(pressLook(d, store, "ice").ok).toBe(true);
    expect(readLooks(store).worn).toBeNull();
    expect(pressLook(d, store, "ice").ok).toBe(true);
    expect(readLooks(store).worn).toBe("ice");
    expect(d.count).toBe(0);
  });

  it("A DROPPED LOOK: the device drops the look, so no diamond is taken", () => {
    const d = createDiamonds(gems(5));
    const store = game({}, LOOKS_KEY);
    expect(pressLook(d, store, "gold")).toEqual({ ok: false, why: "unsaved" });
    expect(d.count).toBe(5);
  });

  it("A DROPPED SPEND: the diamonds do not land, so the look is put back", () => {
    const d = createDiamonds(gems(5, true));
    const store = game();
    expect(pressLook(d, store, "gold").ok).toBe(false);
    expect(readLooks(store).owned).toEqual([]);
  });

  it("junk under the looks key reads as nothing owned, never throws", () => {
    for (const raw of ["{", "null", "[1]", JSON.stringify({ owned: ["pink"], worn: "pink" })]) {
      expect(readLooks(game({ [LOOKS_KEY]: raw }))).toEqual({ owned: [], worn: null });
    }
  });
});

describe("buying an epic piece", () => {
  it("lands an EPIC item in the chosen slot, and costs 2", () => {
    const d = createDiamonds(gems(2));
    const store = game();
    writeSave(store, CAREER_KEY, freshSave());
    const r = buyEpic(d, store, "armor");
    expect(r.ok).toBe(true);
    expect(readSave(store, CAREER_KEY).gear.owned).toEqual(["armor:epic"]);
    expect(d.count).toBe(0);
  });

  it("SHORT: refused with the save untouched", () => {
    const d = createDiamonds(gems(1));
    const store = game();
    expect(buyEpic(d, store, "ring")).toEqual({ ok: false, why: "short" });
    expect(readSave(store, CAREER_KEY).gear.owned).toEqual([]);
  });

  it("A DROPPED SPEND: the piece is taken back out of the save", () => {
    const d = createDiamonds(gems(4, true));
    const store = game();
    expect(buyEpic(d, store, "weapon").ok).toBe(false);
    expect(readSave(store, CAREER_KEY).gear.owned).toEqual([]);
  });

  // Found by /deep-test after P4 shipped: the second buy for one slot took 2
  // diamonds and banked a duplicate that shows "x2" and changes no stat, because
  // bankItems stacks duplicates on purpose (a random boss DROP may repeat) and
  // only the WORN piece counts.
  it("A SLOT THAT ALREADY HOLDS AN EPIC is refused: nothing spent, nothing written", () => {
    const d = createDiamonds(gems(4));
    const store = game();
    writeSave(store, CAREER_KEY, freshSave());
    expect(buyEpic(d, store, "armor").ok).toBe(true);
    expect(buyEpic(d, store, "armor")).toEqual({ ok: false, why: "owned" });
    expect(d.count).toBe(2);
    expect(readSave(store, CAREER_KEY).gear.owned).toEqual(["armor:epic"]);
  });

  it("an epic that came from a boss DROP counts as held too", () => {
    const d = createDiamonds(gems(2));
    const store = game();
    writeSave(store, CAREER_KEY, { ...freshSave(), gear: { owned: ["ring:epic"], equipped: {} } });
    expect(buyEpic(d, store, "ring")).toEqual({ ok: false, why: "owned" });
    expect(d.count).toBe(2);
  });

  it("THE CONTROL: holding one epic still sells the other two slots", () => {
    const d = createDiamonds(gems(4));
    const store = game();
    writeSave(store, CAREER_KEY, freshSave());
    buyEpic(d, store, "armor");
    expect(buyEpic(d, store, "weapon").ok).toBe(true);
    expect(epicSlotsOwned(readSave(store, CAREER_KEY))).toEqual(["weapon", "armor"]);
    expect(d.count).toBe(0);
  });

  it("the Epic capsule reads SOLD OUT once all three slots hold one, and not before", () => {
    const rows = (n: number) => shelfRows({ owned: [], worn: null }, 9, WORDS, n);
    expect(rows(2)[2].maxed).toBe(false);
    expect(rows(3)[2].maxed).toBe(true);
    expect(shelfRows({ owned: [], worn: null }, 9, WORDS)[2].maxed).toBe(false);
  });
});

describe("the boss diamond", () => {
  it("a won BOSS level pays exactly one, once per run", () => {
    const d = createDiamonds(gems(0));
    expect(payBossDiamond(d, result("city-boss", true), "run-1")).toBe(1);
    expect(payBossDiamond(d, result("city-boss", true), "run-1")).toBe(0);
    expect(d.count).toBe(1);
  });

  it("THE CONTROL: a second boss run pays again", () => {
    const d = createDiamonds(gems(0));
    payBossDiamond(d, result("frost-boss", true), "run-1");
    payBossDiamond(d, result("frost-boss", true), "run-2");
    expect(d.count).toBe(2);
  });

  it("a lost boss, or any won ordinary level, pays none", () => {
    const d = createDiamonds(gems(0));
    expect(payBossDiamond(d, result("lava-boss", false), "a")).toBe(0);
    expect(payBossDiamond(d, result("city-3", true), "b")).toBe(0);
    expect(d.count).toBe(0);
  });
});
