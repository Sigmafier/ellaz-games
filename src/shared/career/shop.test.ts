import { describe, expect, it } from "vitest";
import { readdirSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { buy, earnGold, gainText, priceOf, shopModifiers, shopView } from "./shop";
import { freshSave } from "./save";
import type { CareerSave } from "./save";
import { TEST_SHOP } from "./testData";

const S = TEST_SHOP;
const withGold = (gold: number): CareerSave => ({ ...freshSave(), gold });

describe("gold is earned in whole coins and lives in the game's own save", () => {
  it("adds whole, non-negative amounts and ignores anything else", () => {
    expect(earnGold(withGold(10), 25).gold).toBe(35);
    const s = withGold(10);
    expect(earnGold(s, -5)).toBe(s);
    expect(earnGold(s, 2.5)).toBe(s);
    expect(earnGold(s, Number.NaN)).toBe(s);
  });
});

describe("the shop's rows: a gain, a price, and whether today's gold pays it", () => {
  it("prices each row off how many are already owned", () => {
    expect(priceOf(S.rows[0], 0)).toBe(60);
    expect(priceOf(S.rows[0], 2)).toBe(120);
    expect(priceOf(S.rows[3], 0)).toBe(150);
  });

  it("writes the gain the way the tile draws it", () => {
    expect(S.rows.map(gainText)).toEqual(["+20", "+10%", "x1.2", "+1"]);
  });

  it("marks what can and cannot be afforded, and what is sold out", () => {
    const v = shopView(S, { ...withGold(70), shop: { shield: 1 } });
    expect(v.map((r) => [r.id, r.cost, r.afford, r.maxed])).toEqual([
      ["heart", 60, true, false], ["power", 80, false, false], ["magnet", 45, true, false], ["shield", 150, false, true],
    ]);
  });
});

describe("buying spends the game's gold and nothing else", () => {
  it("takes the price and counts the row", () => {
    const r = buy(S, withGold(200), "heart");
    expect(r.ok).toBe(true);
    expect(r.save.gold).toBe(140);
    expect(r.save.shop).toEqual({ heart: 1 });
    const again = buy(S, r.save, "heart");
    expect(again.save.gold).toBe(50);
    expect(again.save.shop.heart).toBe(2);
  });

  it("changes ONLY gold and that row's count", () => {
    const before: CareerSave = { ...withGold(500), stars: { "city-1": 2 }, gear: { owned: ["ring:rare"], equipped: { ring: "ring:rare" } } };
    const after = buy(S, before, "power").save;
    expect({ ...after, gold: before.gold, shop: before.shop }).toEqual(before);
  });

  it("refuses when short, and the save comes back untouched", () => {
    const s = withGold(59);
    const r = buy(S, s, "heart");
    expect(r).toEqual({ ok: false, why: "short", save: s });
  });

  it("refuses a row that is sold out, and a row it has never heard of", () => {
    const full = { ...withGold(9999), shop: { magnet: 3 } };
    expect(buy(S, full, "magnet")).toMatchObject({ ok: false, why: "maxed" });
    expect(buy(S, full, "rocket")).toMatchObject({ ok: false, why: "unknown" });
  });

  it("turns what was bought into modifiers, compounding a multiplier per purchase", () => {
    const s = { ...freshSave(), shop: { heart: 2, magnet: 2, shield: 1 } };
    expect(shopModifiers(S, s)).toEqual([
      { stat: "health", kind: "add", amount: 40 },
      { stat: "magnet", kind: "mul", amount: 1.44 },
    ]);
  });

  it("imports nothing from the site's wallet, economy or profile: no site coins, no diamonds", () => {
    const here = dirname(fileURLToPath(import.meta.url));
    const files = readdirSync(here).filter((f) => f.endsWith(".ts") && !f.endsWith(".test.ts"));
    expect(files.length, "no career modules found - this compared nothing").toBeGreaterThan(5);
    for (const f of files) {
      const text = readFileSync(join(here, f), "utf8");
      expect(text, `${f} reaches the site's currency`).not.toMatch(/from\s+["'](@sdk|\.\.\/\.\.\/sdk|[^"']*wallet|[^"']*economy|[^"']*profile)/);
      expect(text, `${f} mentions diamonds`).not.toMatch(/diamond|\bgems?\b/i);
    }
  });
});
