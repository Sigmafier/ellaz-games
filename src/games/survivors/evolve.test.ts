// The evolutions, pinned by BEHAVIOUR.
//
// WHY THIS FILE EXISTS. An evolution is a flag, and a flag is the easiest thing
// in this repo to ship armed and unreachable: `EVOLUTIONS` can be a perfect
// table, `canEvolve` can be perfectly correct, and if no card ever offers it the
// whole feature is a lever with no caller that reads green in every search. So
// the assertions below run the RECIPE end to end - level the weapon, take the
// partner upgrade, take the card that appears - and then check the weapon fires
// differently in the arena. Since 2026-09-30 the card appears when a boss or a
// mini-boss falls (`raiseSuper`); `super-power.test.ts` drives that kill through
// `step`, and the partner-taken-once threshold.
import { describe, expect, it } from "vitest";
import { applyCard, offerCards } from "./cards";
import { SUPER_LV, raiseSuper } from "./evolve";
import {
  EVOLUTIONS, KINDS, RECIPE, STORM_JUMPS, SWARM_DRONES, UPGRADE_CAP, WEAPON_LV_MAX,
  applyUpgrade, canEvolve, evolvable, hasEvolution, newRun, recipeProgress, rowFor, rngFor, step,
  type Enemy, type EnemyKind, type RunState, type WeaponId, WEAPONS, 
} from "./logic";
import { bladeReach } from "./arsenal";

const STILL = { dx: 0, dy: 0 };

/**
 * Run `n` frames, dismissing any level-up that lands.
 *
 * NOT optional book-keeping. `step` returns on its first line while `choosing`
 * is true, so a test that kills anything worth a gem silently stops simulating
 * from that frame on - and every assertion after it measures a paused arena
 * rather than the thing it thinks it is measuring. The railgun test below read
 * "1 of 5 killed" for exactly this reason, which looks like a broken railgun and
 * was a frozen clock.
 */
function frames(s: RunState, n: number, rng = rngFor(1)) {
  for (let i = 0; i < n; i++) {
    step(s, 16, STILL, rng);
    s.choosing = false;
  }
  return s;
}

function place(s: RunState, kind: EnemyKind, x: number, y: number): Enemy {
  const e: Enemy = { id: s.nextId++, kind, x, y, hp: KINDS[kind].hp, flash: 0 };
  s.enemies.push(e);
  return e;
}

/** A run carrying `id` at the top level with its partner upgrade maxed. */
function atTheRecipe(id: WeaponId): RunState {
  const s = newRun("normal", undefined, id === "blades" || id === "drone" ? "bolt" : id);
  s.slots = [{ id, cd: 0, lv: WEAPON_LV_MAX }];
  const up = RECIPE[id];
  for (let i = 0; i < UPGRADE_CAP[up]; i++) applyUpgrade(s, up);
  return s;
}

/**
 * All five are built now. `NOT_YET` is deliberately kept and deliberately
 * EMPTY rather than deleted, because the test that reads it asserts a real
 * property - an evolution with no behaviour is never offered - and that property
 * has to keep working for the next evolution somebody adds. An empty list makes
 * that test vacuous, which is why the assertion below states it out loud.
 */
const BUILT: WeaponId[] = ["bolt", "arc", "burst", "blades", "drone"];
const NOT_YET: WeaponId[] = [];

// The partner upgrade MAXED still satisfies the recipe (it is "taken at least
// once"), so these cells keep the maxed setup and keep guarding what they always
// did: neither half alone, the near miss, and never twice.
describe("the recipe is Lv4 (SUPER_LV) AND the partner upgrade taken", () => {
  it("refuses until BOTH halves are done - neither one alone", () => {
    for (const id of BUILT) {
      const up = RECIPE[id];

      // Level maxed, upgrade untouched.
      const a = newRun("normal");
      a.slots = [{ id, cd: 0, lv: WEAPON_LV_MAX }];
      expect(canEvolve(a, a.slots[0])).toBe(false);

      // Upgrade maxed, level at one.
      const b = newRun("normal");
      b.slots = [{ id, cd: 0, lv: 1 }];
      for (let i = 0; i < UPGRADE_CAP[up]; i++) applyUpgrade(b, up);
      expect(canEvolve(b, b.slots[0])).toBe(false);

      // One short of the super level, with the upgrade maxed - the near miss.
      // SUPER_LV (4) since 2026-10-02, not the cap (5): operator ruling.
      const c = atTheRecipe(id);
      c.slots[0].lv = SUPER_LV - 1;
      expect(canEvolve(c, c.slots[0])).toBe(false);

      // Both. THE POSITIVE CONTROL - without it every line above passes on a
      // `canEvolve` that simply always returns false.
      const d = atTheRecipe(id);
      expect(canEvolve(d, d.slots[0])).toBe(true);
    }
  });

  it("is already-evolved-proof, so it cannot be taken twice", () => {
    const s = atTheRecipe("bolt");
    expect(canEvolve(s, s.slots[0])).toBe(true);
    s.slots[0].evolved = true;
    expect(canEvolve(s, s.slots[0])).toBe(false);
    expect(evolvable(s)).toHaveLength(0);
  });

  it("never offers an evolution whose behaviour is not built", () => {
    // `EVOLUTIONS` names five and three are built. A card for one of the other
    // two would be a promise the simulation cannot keep - the player takes it,
    // the weapon is flagged, and nothing whatever changes in the arena.
    for (const id of NOT_YET) {
      expect(hasEvolution(id)).toBe(false);
      expect(EVOLUTIONS[id].row).toBeNull();
      const s = atTheRecipe(id);
      expect(canEvolve(s, s.slots[0])).toBe(false);
      for (let seed = 1; seed < 30; seed++) {
        expect(offerCards(s, rngFor(seed)).some((c) => c.kind === "evolve")).toBe(false);
      }
    }
    for (const id of BUILT) expect(hasEvolution(id)).toBe(true);
    // Said out loud: the loop above is VACUOUS today, because every evolution is
    // built. It is kept because the rule it guards is about the next one added,
    // and this line is what stops a reader mistaking a green run for evidence.
    expect(NOT_YET, "no unbuilt evolutions remain - the loop above ran zero times").toHaveLength(0);
    expect(BUILT).toHaveLength(5);
  });
});

describe("the card reaches the player - the feature is not an armed lever", () => {
  it("is offered, ALONE, the moment a big kill lands with the recipe met", () => {
    for (const id of BUILT) {
      const s = atTheRecipe(id);
      // Recipe met, no kill yet: a level-up is ordinary cards.
      expect(offerCards(s, rngFor(1)).some((c) => c.kind === "evolve")).toBe(false);
      expect(raiseSuper(s)).toBe(id);
      for (let seed = 1; seed < 25; seed++) {
        const offer = offerCards(s, rngFor(seed));
        expect(offer).toHaveLength(1);
        expect(offer[0]).toEqual({ kind: "evolve", id });
      }
    }
  });

  it("taking it flags exactly that weapon, and the offer then goes away", () => {
    const s = atTheRecipe("bolt");
    s.slots.push({ id: "drone", cd: 0, lv: 1 });
    expect(raiseSuper(s)).toBe("bolt");
    applyCard(s, { kind: "evolve", id: "bolt" });
    expect(s.pendingSuper).toBeNull();
    expect(s.slots[0].evolved).toBe(true);
    expect(s.slots[1].evolved).toBeFalsy();
    expect(s.choosing).toBe(false);
    for (let seed = 1; seed < 25; seed++) {
      expect(offerCards(s, rngFor(seed)).some((c) => c.kind === "evolve")).toBe(false);
    }
  });

  it("a card for a weapon that has not met the recipe does nothing", () => {
    const s = newRun("normal");
    applyCard(s, { kind: "evolve", id: "bolt" });
    expect(s.slots[0].evolved).toBeFalsy();
  });

  it("the recipe's progress is readable, for the card that shows it", () => {
    const s = newRun("normal");
    expect(recipeProgress(s, "bolt")).toBe(0);
    for (let i = 0; i < UPGRADE_CAP[RECIPE.bolt]; i++) applyUpgrade(s, RECIPE.bolt);
    expect(recipeProgress(s, "bolt")).toBe(1);
  });
});

describe("an evolved weapon fires by its OWN row", () => {
  it("swaps every number at once, and leaves an unevolved weapon alone", () => {
    // THROWERS ONLY. The blades have no base row at all - they never throw
    // anything, so `WEAPONS` has no entry for them and `rowFor` is never called
    // on an unevolved pair of blades. Excluded with its reason rather than
    // quietly skipped, and the exclusion is checked: if a `blades` row ever
    // appears in `WEAPONS`, the assertion below reds and this comment is wrong.
    expect((WEAPONS as Record<string, unknown>).blades).toBeUndefined();
    for (const id of BUILT.filter((w) => w !== "blades")) {
      const base = rowFor({ id, cd: 0, lv: 1 });
      const evo = rowFor({ id, cd: 0, lv: 1, evolved: true });
      expect(evo).toBe(EVOLUTIONS[id].row);
      expect(evo).not.toBe(base);
      // Not a cosmetic swap: it hits harder than the weapon it came from.
      expect(evo.bonus).toBeGreaterThan(base.bonus);
    }
  });

  it("THE RAILGUN passes through everything, where a bolt stops", () => {
    // A line of five brutes. An ordinary bolt with no pierce stops at the first;
    // the railgun goes through all five on the frames it crosses them.
    //
    // COUNTED BY WHAT IS GONE, not by what is damaged - `step` filters the dead
    // out of `s.enemies` at the end of every frame, so a one-shot kill leaves no
    // damaged enemy to find and the first version of this read 0 for both arms.
    // An instrument that cannot express the difference reports no difference.
    const shot = (evolved: boolean) => {
      const s = newRun("normal");
      s.slots = [{ id: "bolt", cd: 0, lv: WEAPON_LV_MAX, ...(evolved ? { evolved: true } : {}) }];
      for (let i = 0; i < 5; i++) place(s, "brute", s.x + 30 + i * 22, s.y);
      frames(s, 40);
      return 5 - s.enemies.length;
    };
    const plain = shot(false);
    const rail = shot(true);
    expect(rail).toBeGreaterThan(plain);
    expect(rail).toBe(5);
  });

  it("THE STORM chains between shapes instead of stopping at one", () => {
    const s = newRun("normal");
    s.slots = [{ id: "arc", cd: 0, lv: WEAPON_LV_MAX, evolved: true }];
    frames(s, 3);
    place(s, "runner", s.x + 40, s.y);
    frames(s, 20);
    const chained = s.bolts.filter((b) => b.chain);
    expect(chained.length).toBeGreaterThan(0);
    // Its jump budget is the storm's, not the run's `pierce` - which is zero here.
    expect(s.up.pierce).toBe(0);
    expect(Math.max(...chained.map((b) => b.pierce))).toBe(STORM_JUMPS);
  });

  it("THE NOVA leaves burning ground where its fragments die, and a burst does not", () => {
    const lay = (evolved: boolean) => {
      const s = newRun("normal");
      s.slots = [{ id: "burst", cd: 0, lv: 1, ...(evolved ? { evolved: true } : {}) }];
      place(s, "runner", s.x + 60, s.y);
      frames(s, 60);
      return s.fires.length;
    };
    expect(lay(false)).toBe(0);
    expect(lay(true)).toBeGreaterThan(0);
  });

  it("burning ground hurts what stands in it, on a clock, and then burns out", () => {
    const s = newRun("normal");
    s.slots = [{ id: "burst", cd: 0, lv: 1, evolved: true }];
    place(s, "runner", s.x + 60, s.y);
    frames(s, 40);
    expect(s.fires.length).toBeGreaterThan(0);

    // A victim PINNED in the flames. The first version of this let a brute walk
    // in on its own and measured nothing, because a shape that reaches the robot
    // is spent on contact - it died to the player, not to the fire, 25 frames
    // before the fire could tick. Holding it in place each frame is what makes
    // this measure the fire rather than the contact rule.
    const fire = s.fires[0];
    const victim = place(s, "brute", fire.x, fire.y);
    victim.hp = 999;
    const before = victim.hp;
    for (let i = 0; i < 30; i++) {
      victim.x = fire.x;
      victim.y = fire.y;
      frames(s, 1);
    }
    const taken = before - victim.hp;

    // It ticks on a COOLDOWN, not every frame. Without `burnCd` a shape loses
    // its whole health in the frames it overlaps, which is an instant kill
    // wearing a slower name - so 30 frames of standing in fire must cost little.
    expect(taken, "the fire never burned it").toBeGreaterThan(0);
    expect(taken, "the fire burned every frame - `burnCd` is not holding").toBeLessThan(10);

    // And it expires rather than burning for the rest of the run.
    s.slots = [];
    frames(s, 400);
    expect(s.fires).toHaveLength(0);
  });

  it("THE SAWSTORM's ring breathes; ordinary blades hold one distance", () => {
    const reachOver = (evolved: boolean) => {
      const s = newRun("normal");
      s.slots = [{ id: "blades", cd: 0, lv: 1, ...(evolved ? { evolved: true } : {}) }];
      const seen: number[] = [];
      for (let i = 0; i < 140; i++) {
        step(s, 16, STILL, rngFor(1));
        s.choosing = false;
        seen.push(bladeReach(s, evolved));
      }
      return { min: Math.min(...seen), max: Math.max(...seen) };
    };
    const plain = reachOver(false);
    expect(plain.max - plain.min).toBe(0); // a fixed ring

    const saw = reachOver(true);
    expect(saw.max - saw.min).toBeGreaterThan(40); // it really goes out and comes back
    expect(saw.min).toBeCloseTo(plain.min, 0); // and it returns to where the ring was
    expect(saw.max).toBeGreaterThan(plain.max);
  });

  it("a SAWSTORM blade CUTS at its extended reach - the ring is not just drawn wider", () => {
    // The assertion a mutation run demanded. The test above measures
    // `bladeReach`, and `bladeReach` being right proves nothing about the blade
    // loop passing `evolved` to `bladePositions` - planting `bladePositions(s,
    // false)` in that loop left every other test green. Exactly the shape of the
    // boss-bar defect: the helper was correct and the CALL SITE was not.
    //
    // So this one drives the arena: a shape parked where ONLY a breathing ring
    // can reach it, and the question is whether it gets cut.
    const cut = (evolved: boolean) => {
      const s = newRun("normal");
      s.slots = [{ id: "blades", cd: 0, lv: 1, ...(evolved ? { evolved: true } : {}) }];
      // Beyond the fixed ring (44 + blade r 9 + brute r 17 = 70) and inside the
      // sawstorm's top of breath (44 + 92 + 26 = 162).
      const far = place(s, "brute", s.x + 120, s.y);
      far.hp = 9999;
      // The gun would shoot it long before the blades arrive, so take the gun
      // away entirely - this measures the ring.
      s.slots = s.slots.filter((k) => k.id === "blades");
      const before = far.hp;
      for (let i = 0; i < 160; i++) {
        far.x = s.x + 120;
        far.y = s.y;
        frames(s, 1);
      }
      return before - far.hp;
    };
    expect(cut(false), "ordinary blades reached 120 units - they should not").toBe(0);
    expect(cut(true), "a sawstorm never reached 120 units").toBeGreaterThan(0);
  });

  it("THE SWARM throws from three places at once, where a drone throws from one", () => {
    const count = (evolved: boolean) => {
      const s = newRun("normal");
      s.slots = [{ id: "drone", cd: 0, lv: 1, ...(evolved ? { evolved: true } : {}) }];
      place(s, "runner", s.x, s.y + 60);
      step(s, 16, STILL, rngFor(1));
      return s.events.filter((e) => e.type === "shot").length;
    };
    expect(count(false)).toBe(1);
    expect(count(true)).toBe(SWARM_DRONES);
  });
});
