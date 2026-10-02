// The shop says what every item adds (operator ruling 2026-10-02): each vending
// row names its stat in words and shows the number now beside the number after.
import { describe, expect, it } from "vitest";
import { freshSave } from "../../shared/career/save";
import { CAREER_WORDS } from "../../ui/career/words";
import { NEON_SHOP } from "./careerRules";
import { NEON_CAREER_WORDS, neonCareerWords } from "./careerWords";
import { capsuleInfo, statText, vendingInfo } from "./shopInfo";

const en = neonCareerWords("en");
const stat = CAREER_WORDS.en.stat;
const fresh = freshSave();

describe("every shop row says what it adds", () => {
  it("every vending row has a stat word, a sentence and a now -> after number", () => {
    const info = vendingInfo(fresh, stat, en);
    expect(Object.keys(info).sort()).toEqual(NEON_SHOP.rows.map((r) => r.id).sort());
    for (const row of NEON_SHOP.rows) {
      const i = info[row.id]!;
      expect(i.stat, row.id).toBeTruthy();
      expect(i.says.length, row.id).toBeGreaterThan(10);
      expect(i.move, row.id).toBeDefined();
      expect(i.move!.from, row.id).not.toBe(i.move!.to);
    }
  });

  it("the numbers are the gear screen's own: power 100% -> 110%, a heart 3 -> 4, the shield 0 -> 1", () => {
    const info = vendingInfo(fresh, stat, en);
    expect(info.power!.move).toEqual({ label: "Damage", from: "100%", to: "110%" });
    expect(info.heart!.move).toEqual({ label: "Health", from: "3", to: "4" });
    expect(info.luck!.move).toEqual({ label: "Luck", from: "15", to: "20" });
    expect(info.shield!.move).toEqual({ label: "Shield", from: "0", to: "1" });
  });

  it("after counts what is already bought: two powers owned reads 120% -> 130%", () => {
    const info = vendingInfo({ ...fresh, shop: { power: 2 } }, stat, en);
    expect(info.power!.move).toEqual({ label: "Damage", from: "120%", to: "130%" });
  });

  it("a sold-out row shows the same number on both sides - buying is over", () => {
    const info = vendingInfo({ ...fresh, shop: { swift: 3, shield: 1 } }, stat, en);
    expect(info.swift!.move!.from).toBe(info.swift!.move!.to);
    expect(info.shield!.move).toEqual({ label: "Shield", from: "1", to: "1" });
  });

  it("the diamond capsules say what they are", () => {
    const c = capsuleInfo(en);
    expect(c.gold.says).toMatch(/gold/i);
    expect(c.epic.says).toMatch(/weapon/i);
  });

  it("statText writes percents for damage, speed and magnet only", () => {
    expect(statText("damage", 109.6)).toBe("110%");
    expect(statText("health", 4)).toBe("4");
  });
});

describe("the item words are customer copy", () => {
  it("every language names and describes all nine items, with no em or en dash", () => {
    for (const [loc, words] of Object.entries(NEON_CAREER_WORDS)) {
      expect(Object.keys(words.item).sort(), loc).toEqual(["epic", "gold", "heart", "ice", "luck", "magnet", "power", "shield", "swift"]);
      for (const [id, { name, says }] of Object.entries(words.item)) {
        expect(name.trim(), `${loc}.${id}`).not.toBe("");
        expect(says.trim(), `${loc}.${id}`).not.toBe("");
        expect(`${name}${says}`, `${loc}.${id}`).not.toMatch(/[–—―]/);
      }
    }
    for (const [loc, w] of Object.entries(CAREER_WORDS)) expect(w.gives, loc).toMatch(/\{n\}.*\{stat\}|\{stat\}.*\{n\}/);
  });
});
