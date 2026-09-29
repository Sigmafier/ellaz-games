import { describe, expect, it } from "vitest";
import { CAREER_SAVE_VERSION, freshSave, isCareerSave, readSave, writeSave } from "./save";
import type { CareerStore } from "./save";

/** a map standing in for ctx.storage, and a count of what was written */
function memory(seed: Record<string, unknown> = {}): CareerStore & { data: Record<string, unknown> } {
  const data = { ...seed };
  return { data, get: (k) => (k in data ? data[k] : null), set: (k, v) => { data[k] = v; } };
}

const KEY = "career";

describe("the career save round-trips through an injected store", () => {
  it("reads a fresh save when nothing is stored", () => {
    expect(readSave(memory(), KEY)).toEqual(freshSave());
    expect(freshSave().version).toBe(CAREER_SAVE_VERSION);
    expect(freshSave().gold).toBe(0);
  });

  it("writes versioned JSON and reads the same thing back", () => {
    const store = memory();
    const save = { ...freshSave(), gold: 340, stars: { "city-1": 3, "city-2": 1 }, shop: { heart: 2 },
      gear: { owned: ["weapon:epic", "ring:common"], equipped: { weapon: "weapon:epic", armor: null, ring: "ring:common" } } };
    expect(writeSave(store, KEY, save)).toBe(true);
    expect(typeof store.data[KEY]).toBe("string");
    expect(JSON.parse(store.data[KEY] as string).version).toBe(CAREER_SAVE_VERSION);
    expect(readSave(store, KEY)).toEqual(save);
  });

  it("hands back a copy, so editing what was read does not edit the store", () => {
    const store = memory();
    writeSave(store, KEY, { ...freshSave(), gold: 5 });
    const a = readSave(store, KEY);
    a.stars["city-1"] = 3;
    expect(readSave(store, KEY).stars).toEqual({});
  });
});

describe("a wrong or corrupt save is discarded, and nothing throws", () => {
  const bad: [string, unknown][] = [
    ["another version", JSON.stringify({ ...freshSave(), version: CAREER_SAVE_VERSION + 1 })],
    ["no version", JSON.stringify({ gold: 5, stars: {}, shop: {}, gear: { owned: [], equipped: {} } })],
    ["not JSON", "{gold:"],
    ["JSON null", "null"],
    ["an array", "[]"],
    ["a number instead of text", 42],
    ["negative gold", JSON.stringify({ ...freshSave(), gold: -1 })],
    ["fractional gold", JSON.stringify({ ...freshSave(), gold: 1.5 })],
    ["four stars", JSON.stringify({ ...freshSave(), stars: { a: 4 } })],
    ["string stars", JSON.stringify({ ...freshSave(), stars: { a: "3" } })],
    ["a gear item that is not text", JSON.stringify({ ...freshSave(), gear: { owned: [7], equipped: {} } })],
    ["a slot holding a number", JSON.stringify({ ...freshSave(), gear: { owned: [], equipped: { ring: 3 } } })],
    ["a shop count below zero", JSON.stringify({ ...freshSave(), shop: { heart: -2 } })],
  ];

  it.each(bad)("discards %s", (_why, stored) => {
    expect(readSave(memory({ [KEY]: stored }), KEY)).toEqual(freshSave());
  });

  it("reads a fresh save when the store itself throws", () => {
    const hostile: CareerStore = { get: () => { throw new Error("SecurityError"); }, set: () => { throw new Error("QuotaExceeded"); } };
    expect(readSave(hostile, KEY)).toEqual(freshSave());
    expect(writeSave(hostile, KEY, freshSave())).toBe(false);
  });

  it("the shape check agrees with what freshSave builds", () => {
    expect(isCareerSave(freshSave())).toBe(true);
    expect(isCareerSave({ ...freshSave(), version: 0 })).toBe(false);
  });
});
