// Card option B (operator ruling 2026-10-02): the reroll's rule, and the words
// every card now carries.
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { REROLLS_PER_STAGE, canReroll, type Card } from "./cards";
import { CARD_WORDS } from "./cardWords";
import { UPGRADE_IDS } from "./upgrades";

const plain: Card[] = [{ kind: "upgrade", id: "rapid" }, { kind: "level", id: "bolt", to: 2 }];

describe("one reroll a stage, never on a super", () => {
  it("rerolls an ordinary offer while one is left", () => {
    expect(REROLLS_PER_STAGE).toBe(1);
    expect(canReroll(plain, 1)).toBe(true);
  });
  it("refuses with none left, with nothing on offer, and on a super", () => {
    expect(canReroll(plain, 0)).toBe(false);
    expect(canReroll([], 1)).toBe(false);
    expect(canReroll([{ kind: "evolve", id: "bolt" }], 1)).toBe(false);
  });
  it("the count lives in the SCENE, so the simulation never sees a reroll", () => {
    const logic = readFileSync(new URL("./logic.ts", import.meta.url), "utf8");
    const types = readFileSync(new URL("./types.ts", import.meta.url), "utf8");
    expect(logic).not.toMatch(/reroll/i);
    expect(types).not.toMatch(/reroll/i);
    const scene = readFileSync(new URL("./SurvivorsScene.ts", import.meta.url), "utf8");
    expect(scene).toContain("if (!canReroll(this.offer, this.rerolls())) return;");
    expect(scene).toContain("this.rerollStage = 0;");
  });
});

describe("every card says what it does, in every language", () => {
  it("names every power-up, the level line, the counts and the reroll - with no em or en dash", () => {
    for (const [loc, w] of Object.entries(CARD_WORDS)) {
      expect(Object.keys(w.says).sort(), loc).toEqual([...UPGRADE_IDS].sort());
      const all = [...Object.values(w.says), w.level, w.weapons, w.powers, w.reroll, w.left];
      for (const t of all) {
        expect(t.trim(), loc).not.toBe("");
        expect(t, loc).not.toMatch(/[–—―]/);
      }
      expect(w.weapons, loc).toContain("{n}");
      expect(w.weapons, loc).toContain("{of}");
      expect(w.left, loc).toContain("{n}");
    }
  });
});
