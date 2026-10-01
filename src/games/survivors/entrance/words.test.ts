import { describe, expect, it } from "vitest";
import { SHIPPED_LOCALES } from "@i18n/index";
import { POOL } from "../arsenal";
import { WEAPON_WORDS } from "./weaponWords";
import { pickLayout } from "./WeaponPick";

const DASHES = new RegExp("[\\u2013\\u2014\\u2015]");

describe("the pick's and the super card's words", () => {
  it("every shipped language names every super, with no long dashes", () => {
    for (const loc of SHIPPED_LOCALES) {
      const w = WEAPON_WORDS[loc];
      for (const id of POOL) {
        const [name, line] = w.supers[id];
        expect(name.length, `${loc} ${id}`).toBeGreaterThan(0);
        expect(line.length, `${loc} ${id}`).toBeGreaterThan(8);
      }
      const all = JSON.stringify(w);
      expect(DASHES.test(all), loc).toBe(false);
      expect(w.lock, loc).toContain("{n}");
      expect(w.level, loc).toContain("{n}");
      // The two perks carry their numbers, which are the rules' - 20% and level 2.
      expect(w.perk.rare, loc).toContain("20");
      expect(w.perk.epic, loc).toContain("2");
    }
  });

  it("THE CONTROL: the super names differ between languages somewhere", () => {
    expect(WEAPON_WORDS.he.supers.bolt[0]).not.toBe(WEAPON_WORDS.en.supers.bolt[0]);
  });
});

describe("the five cards fit the box", () => {
  for (const [w, h, levels] of [[358, 756, true], [320, 568, true], [358, 756, false], [852, 479, true], [1100, 520, false]] as const) {
    it(`${w}x${h}${levels ? " with the difficulty row" : ""}`, () => {
      const L = pickLayout(w, h, levels);
      const across = L.wide ? 5 : 3;
      expect(across * L.cw + (across - 1) * L.gap).toBeLessThanOrEqual(w - 20);
      // Two centimetres is the kids-band floor for a target; the cards are far over it.
      expect(L.cw).toBeGreaterThanOrEqual(76);
      expect(L.ch).toBeGreaterThanOrEqual(110);
    });
  }
});
