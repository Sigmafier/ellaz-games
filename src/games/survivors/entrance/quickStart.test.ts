import { describe, expect, it } from "vitest";
import { START_KEY, neonView, quickWeapon, readWeapon, rememberWeapon } from "./quickStart";
import { weaponsOpen } from "../weaponPool";
import { freshSave } from "../../../shared/career/save";
import type { WeaponId } from "../types";

/**
 * Neon Survival's ONE screen (operator, 2026-10-01): the title holds the
 * difficulty and a big PLAY that starts a QUICK RUN on the player's LAST-USED
 * weapon, with a weapon pill (the pick screen) and a Career pill (the map).
 * The Career / Quick run cards screen is gone.
 */

/** `ctx.storage`'s two methods, in memory. */
function memStorage(seed: Record<string, unknown> = {}) {
  const m = new Map<string, unknown>(Object.entries(seed));
  return {
    get: <T>(key: string, fallback: T): T => (m.has(key) ? (m.get(key) as T) : fallback),
    set: (key: string, value: unknown) => void m.set(key, value),
    raw: m,
  };
}

const OPEN = weaponsOpen(freshSave()); // a fresh save: bolt, arc, burst

describe("the last-used weapon is remembered", () => {
  it("is stored under the key the game always used - a persisted id is forever", () => {
    expect(START_KEY).toBe("startWeapon");
  });

  it("a weapon used is read back as the next PLAY's weapon", () => {
    const s = memStorage();
    rememberWeapon(s, "arc");
    expect(s.raw.get("startWeapon")).toBe("arc");
    expect(readWeapon(s, OPEN)).toBe("arc");
    rememberWeapon(s, "burst");
    expect(readWeapon(s, OPEN)).toBe("burst");
  });

  it("nothing stored reads as the first weapon this save owns", () => {
    expect(readWeapon(memStorage(), OPEN)).toBe("bolt");
  });
});

describe("a remembered weapon is validated, never trusted", () => {
  it("one this save may pick stands", () => {
    expect(quickWeapon("burst", OPEN)).toBe("burst");
  });

  it("a LOCKED one falls back to the first owned weapon", () => {
    expect(OPEN).not.toContain("drone");
    expect(quickWeapon("drone", OPEN)).toBe(OPEN[0]);
    expect(readWeapon(memStorage({ startWeapon: "blades" }), OPEN)).toBe(OPEN[0]);
  });

  it("an absent or foreign value falls back the same way", () => {
    for (const v of [undefined, null, 7, "", "railgun", { id: "arc" }]) expect(quickWeapon(v, OPEN)).toBe(OPEN[0]);
  });

  it("the fallback is the first OWNED one, not a hard-coded name", () => {
    const open: WeaponId[] = ["arc", "burst"];
    expect(quickWeapon("drone", open)).toBe("arc");
  });

  it("and with nothing open at all, the bolt - the weapon no save can lose", () => {
    expect(quickWeapon("arc", [])).toBe("bolt");
  });
});

describe("which screen is up", () => {
  it("the game opens on the title", () => {
    expect(neonView("title", "ready", false, false)).toBe("title");
  });

  it("a quick run that has not started yet is still the title - PLAY before Phaser is ready", () => {
    expect(neonView("quick", "ready", false, false)).toBe("title");
  });

  it("a live quick run has no cover; neither do its level-up cards", () => {
    expect(neonView("quick", "playing", false, false)).toBe("run");
    expect(neonView("quick", "over", true, true)).toBe("run");
  });

  it("a quick run that ended shows the game-over card", () => {
    expect(neonView("quick", "over", false, true)).toBe("over");
    expect(neonView("quick", "won", false, true)).toBe("over");
  });

  it("a difficulty tap on the game-over card (scene back to ready) keeps the card", () => {
    expect(neonView("quick", "ready", false, true)).toBe("over");
  });

  it("the weapon pick and the career are their own screens, whatever the scene says", () => {
    expect(neonView("pick", "over", false, true)).toBe("pick");
    expect(neonView("career", "playing", false, false)).toBe("career");
  });
});
