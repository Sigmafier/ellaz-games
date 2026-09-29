// TEST FIXTURES for the career kit, and nothing else imports this file.
//
// A career-shaped campaign (three worlds of three levels and a boss), a gear
// file and a shop file, written the way a game will write its own. They are
// here so every rule's test reads the same campaign rather than eight private
// copies drifting apart. Clearly fixtures: no game ships these numbers.

import type { CampaignFile } from "./campaign";
import type { GearFile } from "./gear";
import type { ShopFile } from "./shop";

export const TEST_CAMPAIGN: CampaignFile = {
  id: "test-career",
  worlds: [
    { id: "city", levels: [{ id: "city-1" }, { id: "city-2" }, { id: "city-3" }, { id: "city-boss", boss: true }] },
    { id: "frost", levels: [{ id: "frost-1" }, { id: "frost-2" }, { id: "frost-3" }, { id: "frost-boss", boss: true }] },
    { id: "lava", levels: [{ id: "lava-1" }, { id: "lava-2" }, { id: "lava-3" }, { id: "lava-boss", boss: true }] },
  ],
};

export const TEST_GEAR: GearFile = {
  slots: [
    { id: "weapon", stat: "damage", values: { common: 4, rare: 9, epic: 16 } },
    { id: "armor", stat: "health", values: { common: 10, rare: 25, epic: 45 } },
    { id: "ring", stat: "luck", values: { common: 2, rare: 5, epic: 9 } },
  ],
  odds: { common: 0.7, rare: 0.25, epic: 0.05 },
};

export const TEST_SHOP: ShopFile = {
  rows: [
    { id: "heart", icon: "heart", effect: { stat: "health", kind: "add", amount: 20 }, price: 60, step: 30 },
    { id: "power", icon: "bolt", effect: { stat: "damage", kind: "pct", amount: 10 }, price: 80, step: 40 },
    { id: "magnet", icon: "magnet", effect: { stat: "magnet", kind: "mul", amount: 1.2 }, price: 45, step: 45, max: 3 },
    { id: "shield", icon: "shield", effect: { kind: "count", amount: 1 }, price: 150, step: 0, max: 1 },
  ],
};
