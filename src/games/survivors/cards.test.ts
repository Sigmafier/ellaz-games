// Picking weapons, pinned by behaviour. Operator ruling 2026-09-14: pick one of
// three at the start, new weapons as level-up cards, four slots. Re-ruled
// 2026-09-30: the start is the MAIN weapon, any of the five (the entrance decides
// which are unlocked); `super-power.test.ts` pins that half.
import { describe, expect, it } from "vitest";
import { UPGRADE_CAP, UPGRADE_IDS, newRun, rngFor, WEAPON_LV_MAX,
} from "./logic";
import { MAIN_POOL, POOL, SLOTS_MAX, STARTERS, asStarter } from "./arsenal";
import { GUARANTEED_WEAPONS, applyCard, offerCards } from "./cards";
import { raiseSuper } from "./evolve";

describe("the start", () => {
  it("a run starts with exactly the weapon it was given", () => {
    for (const id of STARTERS) {
      const s = newRun("normal", undefined, id);
      expect(s.slots.map((k) => k.id)).toEqual([id]);
    }
    // And the bolt when nobody said, which is what the game has always had.
    expect(newRun("normal").slots.map((k) => k.id)).toEqual(["bolt"]);
  });

  it("three starters, a main pick of five, nine weapons, six slots - so three never make a given run", () => {
    // Six slots and four new weapons since 2026-10-02 ("ack B"). The main pick
    // stays the five the operator ruled on; the four new ones are found in a run.
    expect(STARTERS).toHaveLength(3);
    expect(POOL).toHaveLength(9);
    expect(new Set(POOL).size).toBe(9);
    expect(MAIN_POOL).toEqual(["bolt", "arc", "burst", "blades", "drone"]);
    expect(SLOTS_MAX).toBe(6);
    for (const id of STARTERS) expect(MAIN_POOL).toContain(id);
    for (const id of MAIN_POOL) expect(POOL).toContain(id);
  });

  it("a stored starter is validated, never trusted", () => {
    expect(asStarter("arc")).toBe("arc");
    // A weapon the Quick run entrance never showed is STILL a valid main weapon
    // since 2026-09-30 - locking is the entrance's call, not the simulation's.
    expect(asStarter("blades")).toBe("blades");
    expect(asStarter("laser")).toBe("bolt");
    expect(asStarter("BOLT")).toBe("bolt");
    expect(asStarter(undefined)).toBe("bolt");
    expect(asStarter(7)).toBe("bolt");
  });
});

describe("level-up cards", () => {
  it("while a slot is free, the first card is a weapon the run does not carry", () => {
    for (let seed = 1; seed < 40; seed++) {
      const s = newRun("normal", undefined, "arc");
      const cards = offerCards(s, rngFor(seed));
      expect(cards).toHaveLength(3);
      expect(cards[0].kind).toBe("weapon");
      expect(cards[0].id).not.toBe("arc");
      // The other two are never a SECOND weapon - that is the property this test
      // exists for. It used to say "upgrade", and weapon LEVELS now compete for
      // the same two slots, which is deliberate: a guaranteed level card would
      // make levelling free, and an evolution is meant to cost a real choice.
      expect(cards.slice(1).every((c) => c.kind !== "weapon")).toBe(true);
    }
  });

  it("every unheld weapon can be offered - the draw is not stuck on one", () => {
    const seen = new Set<string>();
    for (let seed = 1; seed < 200; seed++) {
      const s = newRun("normal");
      seen.add(offerCards(s, rngFor(seed))[0].id);
    }
    expect([...seen].sort()).toEqual(["arc", "blades", "bouncer", "burst", "drone", "flask", "halo", "zap"]);
  });

  it("THE CONTROL: with all six slots full, no card is a weapon", () => {
    const s = newRun("normal");
    s.slots = POOL.slice(0, SLOTS_MAX).map((id) => ({ id, cd: 0, lv: 1 }));
    for (let seed = 1; seed < 60; seed++) {
      const cards = offerCards(s, rngFor(seed));
      expect(cards).toHaveLength(3);
      // No weapon card, because there is no slot to put one in.
      expect(cards.every((c) => c.kind !== "weapon")).toBe(true);
    }
  });

  it("a new weapon is guaranteed only until four are held - after that it has to come up", () => {
    // cards.ts GUARANTEED_WEAPONS: with six guaranteed, every level was spread
    // over six level-1 guns and no run earned a super (pacing.test.ts).
    const three = newRun("normal");
    three.slots = POOL.slice(0, 3).map((id) => ({ id, cd: 0, lv: 1 }));
    for (let seed = 1; seed < 40; seed++) expect(offerCards(three, rngFor(seed))[0].kind).toBe("weapon");
    const four = newRun("normal");
    four.slots = POOL.slice(0, GUARANTEED_WEAPONS).map((id) => ({ id, cd: 0, lv: 1 }));
    let without = 0;
    let withOne = 0;
    for (let seed = 1; seed < 200; seed++) {
      if (offerCards(four, rngFor(seed)).some((c) => c.kind === "weapon")) withOne++;
      else without++;
    }
    expect(without).toBeGreaterThan(0);
    expect(withOne).toBeGreaterThan(0);
  });

  it("TAKING a level card raises exactly one weapon, and refuses to pass the cap", () => {
    // Both halves of this were found by a mutation run, not by reading. The
    // tests above assert what `offerCards` OFFERS and that `weaponDamage` is
    // per-slot; neither of them ever drove `applyCard`, so a card that levelled
    // every slot at once - a global upgrade wearing a weapon's face, which is
    // the exact thing per-weapon levels exist to not be - survived them all.
    const s = newRun("normal");
    s.slots = [
      { id: "bolt", cd: 0, lv: 1 },
      { id: "arc", cd: 0, lv: 1 },
    ];
    applyCard(s, { kind: "level", id: "arc", to: 2 });
    expect(s.slots.map((k) => k.lv)).toEqual([1, 2]);
    applyCard(s, { kind: "level", id: "arc", to: 3 });
    expect(s.slots.map((k) => k.lv)).toEqual([1, 3]);

    // THE CAP, driven rather than merely not offered. `offerCards` will not
    // build this card, but a card that reached here must be ignored rather than
    // quietly taking the weapon to six.
    const maxed = newRun("normal");
    maxed.slots = [{ id: "bolt", cd: 0, lv: WEAPON_LV_MAX }];
    applyCard(maxed, { kind: "level", id: "bolt", to: WEAPON_LV_MAX + 1 });
    expect(maxed.slots[0].lv).toBe(WEAPON_LV_MAX);

    // And a card naming a weapon the run does not hold changes nothing at all.
    const one = newRun("normal");
    applyCard(one, { kind: "level", id: "drone", to: 2 });
    expect(one.slots).toHaveLength(1);
    expect(one.slots[0].lv).toBe(1);
  });

  it("offers a level only for a weapon the run CARRIES, and never past the cap", () => {
    const s = newRun("normal", undefined, "arc");
    s.slots = [{ id: "arc", cd: 0, lv: 4 }];
    const seen = new Set<string>();
    for (let seed = 1; seed < 60; seed++) {
      for (const c of offerCards(s, rngFor(seed))) {
        if (c.kind === "level") {
          expect(c.id).toBe("arc"); // never a weapon the run does not hold
          expect(c.to).toBe(5);
          seen.add("level");
        }
      }
    }
    expect(seen.has("level")).toBe(true);

    // THE CONTROL: at the cap that card disappears entirely, rather than
    // offering a sixth level that `applyCard` would then silently ignore.
    const maxed = newRun("normal", undefined, "arc");
    maxed.slots = [{ id: "arc", cd: 0, lv: WEAPON_LV_MAX }];
    for (let seed = 1; seed < 60; seed++) {
      expect(offerCards(maxed, rngFor(seed)).some((c) => c.kind === "level")).toBe(false);
    }
  });

  it("taking a weapon card adds a slot and lets the run carry on", () => {
    const s = newRun("normal");
    s.choosing = true;
    applyCard(s, { kind: "weapon", id: "blades" });
    expect(s.slots.map((k) => k.id)).toEqual(["bolt", "blades"]);
    expect(s.choosing).toBe(false);
    // Never twice, and never a seventh.
    applyCard(s, { kind: "weapon", id: "blades" });
    for (const id of ["drone", "arc", "burst", "halo", "zap", "flask"] as const) applyCard(s, { kind: "weapon", id });
    expect(s.slots).toHaveLength(SLOTS_MAX);
    expect(new Set(s.slots.map((k) => k.id)).size).toBe(SLOTS_MAX);
  });

  it("taking an upgrade card still upgrades", () => {
    const s = newRun("normal");
    applyCard(s, { kind: "upgrade", id: "rapid" });
    expect(s.up.rapid).toBe(1);
  });

  it("with slots full, every upgrade maxed, every weapon maxed AND evolved there is nothing to offer", () => {
    // The premise of this test has now moved TWICE, both times honestly, and
    // both times because the run genuinely gained something left to do.
    //
    //   originally  four weapons + seven maxed upgrades = nothing left
    //   + levels    ... and those four weapons at `WEAPON_LV_MAX`
    //   + evolution ... and every one of them already evolved
    //
    // The middle version went RED the moment evolutions landed, which is the
    // test doing its job: four maxed weapons beside seven maxed upgrades is
    // exactly the state in which every recipe is met, so "nothing to offer" was
    // false and the evolve card was right to appear.
    const s = newRun("normal");
    s.slots = POOL.slice(0, SLOTS_MAX).map((id) => ({ id, cd: 0, lv: WEAPON_LV_MAX, evolved: true }));
    for (const id of UPGRADE_IDS) s.up[id] = UPGRADE_CAP[id];
    expect(offerCards(s, rngFor(9))).toHaveLength(0);
  });

  it("THE CONTROL: the same run un-evolved is offered its supers - by a big kill, never a level-up", () => {
    // Without this the assertion above passes on an `offerCards` that returns
    // nothing at all, and it would also have hidden the fact that a fully maxed
    // run still has six supers waiting for it.
    //
    // SPLIT IN TWO on 2026-09-30. A level-up used to hand a ready super over
    // itself; now a boss or a mini-boss has to fall first. So the same run reads
    // EMPTY on a level-up - there is genuinely nothing left to take - and one
    // super the moment a kill raises it.
    const s = newRun("normal");
    s.slots = POOL.slice(0, SLOTS_MAX).map((id) => ({ id, cd: 0, lv: WEAPON_LV_MAX }));
    for (const id of UPGRADE_IDS) s.up[id] = UPGRADE_CAP[id];
    expect(offerCards(s, rngFor(9))).toHaveLength(0);
    expect(raiseSuper(s)).toBe(POOL[0]);
    const offer = offerCards(s, rngFor(9));
    expect(offer).toEqual([{ kind: "evolve", id: POOL[0] }]);
  });

  it("THE CONTROL: the same run with its weapons at level one is NOT empty", () => {
    // Without this, the assertion above passes on an `offerCards` that had
    // stopped returning anything at all - which is the failure it exists to
    // catch, wearing the face of the thing it asserts.
    const s = newRun("normal");
    s.slots = POOL.slice(0, SLOTS_MAX).map((id) => ({ id, cd: 0, lv: 1 }));
    for (const id of UPGRADE_IDS) s.up[id] = UPGRADE_CAP[id];
    const offer = offerCards(s, rngFor(9));
    expect(offer).toHaveLength(3);
    expect(offer.every((c) => c.kind === "level")).toBe(true);
  });
});
