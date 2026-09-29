import { describe, expect, it } from "vitest";
import { mulberry32, seedFrom } from "../rng";
import { bankItems, equipItem, gearModifiers, gearProblems, gearView, itemKey, itemValue, rollDrop, rollTier, SLOT_IDS, TIERS } from "./gear";
import type { GearFile, Tier } from "./gear";
import { freshSave } from "./save";
import { TEST_GEAR } from "./testData";

const G = TEST_GEAR;

describe("three slots, three tiers", () => {
  it("is exactly weapon, armor and ring, and common, rare and epic", () => {
    expect(SLOT_IDS).toEqual(["weapon", "armor", "ring"]);
    expect(TIERS).toEqual(["common", "rare", "epic"]);
    expect(gearProblems(G)).toEqual([]);
  });

  it("refuses a gear file with a missing slot, odds that do not add to one, or a tier worth less than the one below", () => {
    expect(gearProblems({ ...G, slots: G.slots.slice(0, 2) }).join(" ")).toMatch(/ring/);
    expect(gearProblems({ ...G, odds: { common: 0.7, rare: 0.25, epic: 0.1 } }).join(" ")).toMatch(/odds/);
    const flat: GearFile = { ...G, slots: [{ ...G.slots[0], values: { common: 9, rare: 4, epic: 16 } }, G.slots[1], G.slots[2]] };
    expect(gearProblems(flat).join(" ")).toMatch(/weapon/);
  });

  it("values an item from its slot and tier, and an item it cannot read at 0", () => {
    expect(itemValue(G, itemKey("weapon", "epic"))).toBe(16);
    expect(itemValue(G, itemKey("armor", "common"))).toBe(10);
    expect(itemValue(G, "boots:epic")).toBe(0);
    expect(itemValue(G, "weapon:legendary")).toBe(0);
    expect(itemValue(G, "nonsense")).toBe(0);
  });
});

describe("drop odds, measured over 10,000 drops", () => {
  const N = 10_000;

  function tally(rng: () => number): Record<Tier, number> {
    const n: Record<Tier, number> = { common: 0, rare: 0, epic: 0 };
    for (let i = 0; i < N; i++) n[rollTier(G.odds, rng)]++;
    return n;
  }

  it("lands each tier within two points of its odds", () => {
    const n = tally(mulberry32(seedFrom("gear-odds")));
    // population: 10,000 drops. 3 sigma at p=0.7 is 1.4 points, so 2 points cannot fail by chance
    for (const t of TIERS) expect(Math.abs(n[t] / N - G.odds[t]), `${t}: ${n[t]} of ${N}`).toBeLessThan(0.02);
    expect(n.common + n.rare + n.epic).toBe(N);
    expect(n.common).toBeGreaterThan(n.rare);
    expect(n.rare).toBeGreaterThan(n.epic);
  });

  it("the control: a different file gives a different spread, so the tally is reading the odds", () => {
    const rng = mulberry32(seedFrom("gear-odds"));
    const inverted = { common: 0.05, rare: 0.25, epic: 0.7 };
    const n: Record<Tier, number> = { common: 0, rare: 0, epic: 0 };
    for (let i = 0; i < N; i++) n[rollTier(inverted, rng)]++;
    expect(n.epic / N).toBeGreaterThan(0.65);
    expect(n.common / N).toBeLessThan(0.1);
  });

  it("spreads drops across all three slots", () => {
    const rng = mulberry32(seedFrom("gear-slots"));
    const per: Record<string, number> = {};
    for (let i = 0; i < N; i++) { const k = rollDrop(G, rng).split(":")[0]; per[k] = (per[k] ?? 0) + 1; }
    for (const s of SLOT_IDS) expect(Math.abs(per[s] / N - 1 / 3), s).toBeLessThan(0.02);
  });

  it("an rng at the very edge still answers with a real tier", () => {
    expect(rollTier(G.odds, () => 0)).toBe("common");
    expect(rollTier(G.odds, () => 0.999999999)).toBe("epic");
  });
});

describe("banking, wearing, and what the gear adds", () => {
  it("keeps every item and wears one on the spot when it beats the slot", () => {
    const s = bankItems(G, freshSave(), ["weapon:common", "weapon:epic", "weapon:rare", "ring:rare"]);
    expect(s.gear.owned).toEqual(["weapon:common", "weapon:epic", "weapon:rare", "ring:rare"]);
    expect(s.gear.equipped).toEqual({ weapon: "weapon:epic", ring: "ring:rare" });
  });

  it("keeps an item it cannot read but never wears it", () => {
    const s = bankItems(G, freshSave(), ["boots:epic"]);
    expect(s.gear.owned).toEqual(["boots:epic"]);
    expect(s.gear.equipped).toEqual({});
  });

  it("wears only what is owned, and puts it in its own slot", () => {
    const s = bankItems(G, freshSave(), ["armor:epic", "armor:common"]);
    const worse = equipItem(G, s, "armor:common");
    expect(worse.gear.equipped.armor).toBe("armor:common");
    expect(equipItem(G, s, "armor:rare")).toBe(s);
    expect(equipItem(G, s, "armor:epic")).toBe(s);
  });

  it("turns what is worn into stat modifiers", () => {
    const s = bankItems(G, freshSave(), ["weapon:rare", "armor:epic"]);
    expect(gearModifiers(G, s)).toEqual([
      { stat: "damage", kind: "add", amount: 9 },
      { stat: "health", kind: "add", amount: 45 },
    ]);
  });

  it("builds the gear screen: three slots, the bag grouped with counts, best first", () => {
    const s = bankItems(G, freshSave(), ["ring:common", "ring:common", "weapon:epic", "ring:rare"]);
    const v = gearView(G, s);
    expect(v.slots.map((x) => [x.id, x.tier])).toEqual([["weapon", "epic"], ["armor", null], ["ring", "rare"]]);
    expect(v.bag.map((b) => [b.key, b.count, b.worn])).toEqual([
      ["weapon:epic", 1, true], ["ring:rare", 1, true], ["ring:common", 2, false],
    ]);
  });
});
