// A screen handed NO skin draws exactly what it drew before skins existed: Neon
// Survival's sword, shirt and ring, in the same tier colours, with the same stat
// icons and the kit's own words. The literals below are the ones Gear.tsx carried
// until 2026-10-03, copied out of that file - so a change to the default is a red
// here, not a quiet change to Neon's gear screen.
import { describe, expect, it } from "vitest";
import { NEON_SKIN, skinOf, skinWords } from "./skin";
import { CAREER_WORDS } from "./words";
import { isCareerIcon } from "./icons";

describe("the default skin is Neon Survival's, value for value", () => {
  it("slot pictures, tier tints and stat icons are the literals Gear.tsx used to hold", () => {
    expect(NEON_SKIN.slotIcon).toEqual({ weapon: "sword", armor: "armor", ring: "ring" });
    expect(NEON_SKIN.art).toEqual({
      weapon: { common: undefined, rare: undefined, epic: undefined },
      armor: { common: "#b2bec3", rare: "#74b9ff", epic: "#ffd166" },
      ring: { common: "#dfe6e9", rare: "#ffd166", epic: "#ffd166" },
    });
    expect(NEON_SKIN.statIcon).toEqual({
      health: ["heart", "#ff5c7a"], speed: ["boot", "#55efc4"], damage: ["bolt", "#ffd166"], magnet: ["magnet", "#ff6b6b"], luck: ["clover", "#2bb58a"],
    });
  });

  it("no skin is the default, and the kit's words come back unchanged - the same object", () => {
    expect(skinOf()).toEqual(NEON_SKIN);
    expect(skinOf(undefined)).toEqual(NEON_SKIN);
    expect(skinWords(CAREER_WORDS.en, NEON_SKIN)).toBe(CAREER_WORDS.en);
  });
});

describe("a game's skin names only what differs", () => {
  it("Fangs, Scales and a Charm over the kit's slots, keeping every other word", () => {
    const k = skinOf({ slotIcon: { weapon: "fang", armor: "scales", ring: "charm" }, words: { slot: { weapon: "Fangs" }, stat: { health: "Length" } } });
    expect(k.slotIcon.armor).toBe("scales");
    expect(k.statIcon).toEqual(NEON_SKIN.statIcon);
    const w = skinWords(CAREER_WORDS.en, k);
    expect(w.slot).toEqual({ weapon: "Fangs", armor: "Armor", ring: "Ring" });
    expect(w.stat.health).toBe("Length");
    expect(w.stat.damage).toBe("Damage");
    expect(w.buy).toBe(CAREER_WORDS.en.buy);
  });

  it("the snake's own pictures exist in the kit's icon set", () => {
    for (const name of ["fang", "scales", "charm", "snake", "dash"]) expect(isCareerIcon(name), name).toBe(true);
  });
});
