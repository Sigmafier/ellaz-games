// The Career page reads each career game's REAL save - and says "not started"
// when there is none, never a number the device does not hold.
import { describe, expect, it } from "vitest";
import { createDiamonds, DIAMONDS_KEY } from "@sdk/diamonds";
import { freshSave, writeSave, type CareerSave, type CareerStore } from "../../shared/career/save";
import { GEAR_KINDS, neonCard, snakeCard } from "./careerCards";

function store(seed: Record<string, unknown> = {}): CareerStore {
  const data = new Map<string, unknown>(Object.entries(seed));
  return { get: (k) => data.get(k), set: (k, v) => void data.set(k, v) };
}
const withSave = (save: CareerSave): CareerStore => {
  const s = store();
  writeSave(s, "career", save);
  return s;
};

describe("Neon Survival's card", () => {
  it("a save four levels in reads Frost, level 2 of 4, with its own gold and gear", () => {
    const save = freshSave();
    save.stars = { "city-1": 3, "city-2": 2, "city-3": 1, "city-boss": 3, "frost-1": 2 };
    save.gold = 340;
    save.gear = { owned: ["armor:rare", "ring:common", "armor:rare"], equipped: {} };
    const card = neonCard(withSave(save));
    expect(card).toMatchObject({ started: true, world: "frost", level: 2, boss: false, of: 4, gold: 340, gear: 2 });
    expect(card.progress).toBeCloseTo(5 / 12);
  });

  it("the boss of a world reads as the boss, with no level number", () => {
    const save = freshSave();
    save.stars = { "city-1": 3, "city-2": 3, "city-3": 3 };
    expect(neonCard(withSave(save))).toMatchObject({ world: "city", level: null, boss: true });
  });

  it("NO SAVE: not started, and every number is the honest zero", () => {
    expect(neonCard(store())).toMatchObject({ started: false, world: "city", level: 1, gold: 0, gear: 0, progress: 0 });
  });

  it("a gear count can never pass the nine distinct pieces", () => {
    expect(GEAR_KINDS).toBe(9);
  });
});

describe("Snake Survivors' card (snake career, 2026-10-03)", () => {
  it("a save five levels in reads Desert, level 2 of 4, with its own gold and gear", () => {
    const save = freshSave();
    save.stars = { "garden-1": 3, "garden-2": 2, "garden-3": 2, "garden-boss": 1, "desert-1": 2 };
    save.gold = 120;
    save.gear = { owned: ["weapon:rare", "armor:common"], equipped: {} };
    const card = snakeCard(withSave(save));
    expect(card).toMatchObject({ id: "snakesurvivors", started: true, world: "desert", level: 2, boss: false, of: 4, gold: 120, gear: 2 });
    expect(card.progress).toBeCloseTo(5 / 12);
  });

  it("NO SAVE: not started, at the garden's first level, every number zero", () => {
    expect(snakeCard(store())).toMatchObject({ started: false, world: "garden", level: 1, gold: 0, gear: 0, progress: 0 });
  });

  it("THE CONTROL: Neon's save is not the snake's - the same store reads two different careers", () => {
    const save = freshSave();
    save.stars = { "city-1": 3 };
    const s = withSave(save);
    expect(neonCard(s).level).toBe(2);
    expect(snakeCard(s).level).toBe(1);
  });
});

describe("the diamond box", () => {
  it("reads the real balance off the device", () => {
    const all = new Map([[DIAMONDS_KEY, "2"]]);
    const d = createDiamonds({ read: (k) => all.get(k) ?? null, write: (k, v) => { all.set(k, v); return true; } });
    expect(d.count).toBe(2);
  });
});
