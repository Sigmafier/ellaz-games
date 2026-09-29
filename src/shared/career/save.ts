// The career save: one versioned JSON record in the GAME's own storage.
//
// Gold, stars, gear and what the shop has sold all live here, in the game's
// save, and never on the site profile - a career game's gold is that game's,
// and the platform's add-only coin law stays exactly as it was.
//
// NEVER THROWS. Every read and write sits under try/catch: a private window, a
// full quota or a refused origin reads as a fresh save. A record of the wrong
// version or the wrong shape is DISCARDED, never migrated - migration code is a
// second copy of the rules that nothing keeps in sync (the Toybox's own ruling,
// studio/toybox/campaign/save.ts, carried over; copied-rules.test.ts pins it).
//
// The store is INJECTED: `ctx.storage` in a game, a map in a test.

import { SLOT_IDS } from "./gear";
import type { GearSave } from "./gear";

export const CAREER_SAVE_VERSION = 1;

export interface CareerSave {
  version: typeof CAREER_SAVE_VERSION;
  /** best stars per level id, 1 to 3; a level not in here has never been cleared */
  stars: Record<string, number>;
  /** the game's own gold - whole coins, never below zero */
  gold: number;
  gear: GearSave;
  /** how many of each shop row have been bought */
  shop: Record<string, number>;
}

/** the two calls this file makes, so `ctx.storage` and a test's map both fit */
export interface CareerStore {
  get(key: string): unknown;
  set(key: string, value: string): void;
}

export function freshSave(): CareerSave {
  return { version: CAREER_SAVE_VERSION, stars: {}, gold: 0, gear: { owned: [], equipped: {} }, shop: {} };
}

const whole = (v: unknown): v is number => typeof v === "number" && Number.isInteger(v) && v >= 0;
const record = (v: unknown): v is Record<string, unknown> => !!v && typeof v === "object" && !Array.isArray(v);

function isGear(g: unknown): g is GearSave {
  if (!record(g) || !Array.isArray(g.owned) || !record(g.equipped)) return false;
  if (!g.owned.every((x) => typeof x === "string")) return false;
  return Object.entries(g.equipped).every(([slot, v]) => (SLOT_IDS as readonly string[]).includes(slot) && (v === null || typeof v === "string"));
}

/** the shape check: right version, whole gold, stars 1-3, gear as text, shop counts whole */
export function isCareerSave(raw: unknown): raw is CareerSave {
  if (!record(raw) || raw.version !== CAREER_SAVE_VERSION) return false;
  if (!whole(raw.gold)) return false;
  if (!record(raw.stars) || !Object.values(raw.stars).every((n) => whole(n) && n >= 1 && n <= 3)) return false;
  if (!record(raw.shop) || !Object.values(raw.shop).every(whole)) return false;
  return isGear(raw.gear);
}

function copy(s: CareerSave): CareerSave {
  return {
    version: s.version, gold: s.gold, stars: { ...s.stars }, shop: { ...s.shop },
    gear: { owned: [...s.gear.owned], equipped: { ...s.gear.equipped } },
  };
}

/** the save under `key`, or a fresh one when nothing usable is stored */
export function readSave(store: CareerStore, key: string): CareerSave {
  try {
    const text = store.get(key);
    if (typeof text !== "string") return freshSave();
    const raw: unknown = JSON.parse(text);
    return isCareerSave(raw) ? copy(raw) : freshSave();
  } catch {
    return freshSave();
  }
}

/** write the save; false when the device refused it - a fact about the device, never an error of the page */
export function writeSave(store: CareerStore, key: string, save: CareerSave): boolean {
  try {
    store.set(key, JSON.stringify({ ...save, version: CAREER_SAVE_VERSION }));
    return true;
  } catch {
    return false;
  }
}
