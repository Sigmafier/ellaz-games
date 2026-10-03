// THE CARDS' COUNTS ARE THE SLOT LIMITS (operator ruling 2026-10-03, "Fix now"):
// the level-up screen said "Powers n of 12" - the number of power-ups that EXIST -
// while a run can only ever hold six (PASSIVE_SLOTS). Both lines read the limit
// from the slot constants, and the screen reads them from `slotCounts`.
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { slotCounts } from "./cards";
import { SLOTS_MAX } from "./arsenal";
import { PASSIVE_SLOTS, UPGRADE_IDS } from "./upgrades";
import type { UpgradeId } from "./types";

const none = Object.fromEntries(UPGRADE_IDS.map((id) => [id, 0])) as Record<UpgradeId, number>;

describe("the level-up cards count against the real slot limits", () => {
  it("powers are out of PASSIVE_SLOTS and weapons out of SLOTS_MAX", () => {
    const c = slotCounts(["bolt", "arc"], { ...none, rapid: 2, heart: 1 });
    expect(c.weapons).toEqual({ held: 2, of: SLOTS_MAX });
    expect(c.powers).toEqual({ held: 2, of: PASSIVE_SLOTS });
  });

  it("THE CONTROL: the limit is not the number of power-ups that exist, so the old wording cannot pass", () => {
    expect(PASSIVE_SLOTS).toBeLessThan(UPGRADE_IDS.length);
    expect(slotCounts([], none).powers.of).not.toBe(UPGRADE_IDS.length);
  });

  it("the screen reads its counts from slotCounts, not a count of its own", () => {
    const src = readFileSync(new URL("./SurvivorsGame.tsx", import.meta.url), "utf8");
    expect(src).toMatch(/slotCounts\(status\.slots, status\.taken\)/);
    expect(src).not.toMatch(/of:\s*UPGRADE_IDS\.length/);
  });
});
