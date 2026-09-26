// Picking weapons, pinned by behaviour. Operator ruling 2026-09-14: pick one of
// three at the start, new weapons as level-up cards, four slots.
import { describe, expect, it } from "vitest";
import { UPGRADE_CAP, UPGRADE_IDS, newRun, rngFor, WEAPON_LV_MAX,
} from "./logic";
import { POOL, SLOTS_MAX, STARTERS, asStarter } from "./arsenal";
import { applyCard, offerCards } from "./cards";

describe("the start", () => {
  it("a run starts with exactly the weapon it was given", () => {
    for (const id of STARTERS) {
      const s = newRun("normal", undefined, id);
      expect(s.slots.map((k) => k.id)).toEqual([id]);
    }
    // And the bolt when nobody said, which is what the game has always had.
    expect(newRun("normal").slots.map((k) => k.id)).toEqual(["bolt"]);
  });

  it("three starters, five weapons, four slots - so one never makes a given run", () => {
    expect(STARTERS).toHaveLength(3);
    expect(POOL).toHaveLength(5);
    expect(new Set(POOL).size).toBe(5);
    expect(SLOTS_MAX).toBe(4);
    for (const id of STARTERS) expect(POOL).toContain(id);
  });

  it("a stored starter is validated, never trusted", () => {
    expect(asStarter("arc")).toBe("arc");
    expect(asStarter("blades")).toBe("bolt"); // a weapon, but not a starter
    expect(asStarter("laser")).toBe("bolt");
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
    expect([...seen].sort()).toEqual(["arc", "blades", "burst", "drone"]);
  });

  it("THE CONTROL: with four slots full, the cards are upgrades only", () => {
    const s = newRun("normal");
    s.slots = [
      { id: "bolt", cd: 0 , lv: 1 },
      { id: "arc", cd: 0 , lv: 1 },
      { id: "blades", cd: 0 , lv: 1 },
      { id: "drone", cd: 0 , lv: 1 },
    ];
    const cards = offerCards(s, rngFor(4));
    expect(cards).toHaveLength(3);
    // No weapon card, because there is no slot to put one in. Levels and
    // upgrades both may appear; a fifth weapon may not.
    expect(cards.every((c) => c.kind !== "weapon")).toBe(true);
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
    // Never twice, and never a fifth.
    applyCard(s, { kind: "weapon", id: "blades" });
    applyCard(s, { kind: "weapon", id: "drone" });
    applyCard(s, { kind: "weapon", id: "arc" });
    applyCard(s, { kind: "weapon", id: "burst" });
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
    s.slots = POOL.slice(0, 4).map((id) => ({ id, cd: 0, lv: WEAPON_LV_MAX, evolved: true }));
    for (const id of UPGRADE_IDS) s.up[id] = UPGRADE_CAP[id];
    expect(offerCards(s, rngFor(9))).toHaveLength(0);
  });

  it("THE CONTROL: the same run un-evolved is offered its evolutions", () => {
    // Without this the assertion above passes on an `offerCards` that returns
    // nothing at all, and it would also have hidden the fact that a fully maxed
    // run still has five evolutions waiting for it.
    const s = newRun("normal");
    s.slots = POOL.slice(0, 4).map((id) => ({ id, cd: 0, lv: WEAPON_LV_MAX }));
    for (const id of UPGRADE_IDS) s.up[id] = UPGRADE_CAP[id];
    const offer = offerCards(s, rngFor(9));
    expect(offer).toHaveLength(1);
    expect(offer[0].kind).toBe("evolve");
  });

  it("THE CONTROL: the same run with its weapons at level one is NOT empty", () => {
    // Without this, the assertion above passes on an `offerCards` that had
    // stopped returning anything at all - which is the failure it exists to
    // catch, wearing the face of the thing it asserts.
    const s = newRun("normal");
    s.slots = POOL.slice(0, 4).map((id) => ({ id, cd: 0, lv: 1 }));
    for (const id of UPGRADE_IDS) s.up[id] = UPGRADE_CAP[id];
    const offer = offerCards(s, rngFor(9));
    expect(offer).toHaveLength(3);
    expect(offer.every((c) => c.kind === "level")).toBe(true);
  });
});
