// THE MAIN WEAPON AND ITS SUPER POWER, pinned by behaviour.
//
// Operator ruling 2026-09-30, modelled on Survivor.io after it was researched:
//
//   1. A run starts on the MAIN weapon the player picked - any of the five.
//   2. Each weapon has a fixed RARITY, and it gives the MAIN weapon a perk:
//      common none, rare +20% damage, epic starts the run at level 2. A weapon
//      picked up later in the run gets no perk.
//   3. A run may still carry up to four weapons.
//   4. A SUPER POWER (the existing evolutions) is READY at weapon Lv5 with its
//      partner upgrade taken at least ONCE - and it is no longer a level-up
//      card. It is offered, alone, when a BOSS or a MINI-BOSS (an elite) dies:
//      one ready super per such kill, and nothing when none is ready.
//
// Every cell below drives the real path - `newRun`, `step`, `offerCards`,
// `applyCard` - because a super that is correct in a table and never reaches a
// card is the armed lever with no caller this repo has a rule about.
import { describe, expect, it } from "vitest";
import { applyCard, offerCards } from "./cards";
import {
  RECIPE, UPGRADE_CAP, WEAPON_LV_MAX, applyUpgrade, canEvolve, newRun, rngFor, step, weaponDamage,
  type Enemy, type RunState, type WeaponId,
} from "./logic";
import { POOL, asStarter } from "./arsenal";
import { RARITY } from "./weaponPool";
import { newCareerRun, PLAIN_STATS } from "./careerRun";

const STILL = { dx: 0, dy: 0 };

/** A run whose `id` is at Lv5 with its partner upgrade taken `partner` times. */
function readyRun(id: WeaponId, partner = 1): RunState {
  const s = newRun("normal", undefined, id);
  s.slots[0].lv = WEAPON_LV_MAX;
  for (let i = 0; i < partner; i++) applyUpgrade(s, RECIPE[id]);
  s.choosing = false;
  // Nothing else walks in while a cell is watching one kill.
  s.spawnIn = Infinity;
  return s;
}

/**
 * Put one shape a short way off, make it die to the next thing that touches it,
 * and step until it is gone. Returns every event seen on the way, so a cell can
 * ask what the kill raised. Stops on `choosing`, which is the pause a card is.
 */
function kill(s: RunState, how: "boss" | "elite" | "plain", dist = 40, rng = rngFor(3)) {
  const e: Enemy = {
    id: s.nextId++, kind: "runner", x: s.x + dist, y: s.y, hp: 0.01, flash: 0,
    ...(how === "elite" ? { elite: true } : {}),
  };
  s.enemies.push(e);
  if (how === "boss") s.boss = e.id;
  for (const k of s.slots) k.cd = 0;
  const seen: string[] = [];
  for (let i = 0; i < 120 && s.enemies.some((x) => x.id === e.id); i++) {
    step(s, 16, STILL, rng);
    for (const ev of s.events) seen.push(ev.type);
  }
  expect(s.enemies.some((x) => x.id === e.id), "the shape was never killed - the cell measured nothing").toBe(false);
  return seen;
}

describe("the main weapon", () => {
  it("any of the five can start a run - which ones are UNLOCKED is the entrance's business", () => {
    for (const id of POOL) {
      expect(asStarter(id)).toBe(id);
      expect(newRun("normal", undefined, id).slots.map((k) => k.id)).toEqual([id]);
    }
    // Still validated rather than trusted.
    expect(asStarter("laser")).toBe("bolt");
    expect(asStarter(undefined)).toBe("bolt");
    expect(asStarter(7)).toBe("bolt");
  });

  it("the rarity table is the one the entrance draws, and it covers every weapon", () => {
    expect(RARITY).toEqual({ bolt: "common", arc: "common", burst: "rare", blades: "rare", drone: "epic" });
  });

  it("a RARE main weapon deals 20% more than the same weapon picked up later", () => {
    for (const id of POOL.filter((w) => RARITY[w] === "rare")) {
      const main = newRun("normal", undefined, id);
      const later = newRun("normal", undefined, "bolt");
      applyCard(later, { kind: "weapon", id });
      const picked = later.slots.find((k) => k.id === id)!;
      expect(picked.lv).toBe(main.slots[0].lv);
      expect(weaponDamage(main, main.slots[0]) / weaponDamage(later, picked)).toBeCloseTo(1.2, 9);
    }
  });

  it("THE CONTROL: a COMMON main weapon deals exactly what it deals picked up later", () => {
    // Without this, the cell above passes on a perk that multiplies EVERY main
    // weapon - which would also move calm, whose bolt is a common.
    for (const id of POOL.filter((w) => RARITY[w] === "common")) {
      const main = newRun("normal", undefined, id);
      const later = newRun("normal", undefined, id === "bolt" ? "arc" : "bolt");
      applyCard(later, { kind: "weapon", id });
      const picked = later.slots.find((k) => k.id === id)!;
      expect(weaponDamage(main, main.slots[0])).toBe(weaponDamage(later, picked));
    }
  });

  it("an EPIC main weapon starts the run at level 2, and only as the main weapon", () => {
    for (const id of POOL) {
      const s = newRun("normal", undefined, id);
      expect(s.slots[0].lv, id).toBe(RARITY[id] === "epic" ? 2 : 1);
    }
    const later = newRun("normal", undefined, "bolt");
    applyCard(later, { kind: "weapon", id: "drone" });
    expect(later.slots.find((k) => k.id === "drone")!.lv).toBe(1);
  });

  it("the CAREER starts on the same main weapon, with the same perk", () => {
    const s = newCareerRun("city-1", PLAIN_STATS, undefined, "drone");
    expect(s.slots.map((k) => [k.id, k.lv])).toEqual([["drone", 2]]);
    const r = newCareerRun("city-1", PLAIN_STATS, undefined, "burst");
    const q = newRun("normal", undefined, "bolt");
    applyCard(q, { kind: "weapon", id: "burst" });
    const picked = q.slots.find((k) => k.id === "burst")!;
    expect(weaponDamage(r, r.slots[0]) / weaponDamage(q, picked)).toBeCloseTo(1.2, 9);
  });
});

describe("a super power is READY at Lv5 with its partner upgrade taken once", () => {
  it("not with the partner at zero, yes with it at one - for every weapon", () => {
    for (const id of POOL) {
      const none = readyRun(id, 0);
      expect(canEvolve(none, none.slots[0]), `${id} partner 0`).toBe(false);
      const one = readyRun(id, 1);
      expect(canEvolve(one, one.slots[0]), `${id} partner 1`).toBe(true);
      // And one level short is still not ready, whatever the partner says.
      const short = readyRun(id, UPGRADE_CAP[RECIPE[id]]);
      short.slots[0].lv = WEAPON_LV_MAX - 1;
      expect(canEvolve(short, short.slots[0]), `${id} Lv4`).toBe(false);
    }
  });
});

describe("a super power arrives from a boss or a mini-boss, never from a level-up", () => {
  it("a level-up NEVER offers it, even with the recipe met", () => {
    for (const id of POOL) {
      const s = readyRun(id);
      for (let seed = 1; seed < 40; seed++) {
        const offer = offerCards(s, rngFor(seed));
        expect(offer.some((c) => c.kind === "evolve"), `${id} seed ${seed}`).toBe(false);
        // THE CONTROL: the level-up still offers SOMETHING, so the line above is
        // not passing on an `offerCards` that went quiet.
        expect(offer.length).toBeGreaterThan(0);
      }
    }
  });

  it("a BOSS kill offers the ready super, alone", () => {
    const s = readyRun("bolt");
    const seen = kill(s, "boss");
    expect(seen).toContain("super");
    expect(s.choosing).toBe(true);
    expect(offerCards(s, rngFor(1))).toEqual([{ kind: "evolve", id: "bolt" }]);
  });

  it("a MINI-BOSS (an elite) kill offers the ready super, alone", () => {
    const s = readyRun("arc");
    const seen = kill(s, "elite");
    expect(seen).toContain("super");
    expect(s.choosing).toBe(true);
    expect(offerCards(s, rngFor(1))).toEqual([{ kind: "evolve", id: "arc" }]);
    applyCard(s, { kind: "evolve", id: "arc" });
    expect(s.slots[0].evolved).toBe(true);
    expect(s.choosing).toBe(false);
  });

  it("THE CONTROL: an ordinary shape's kill offers nothing, ready or not", () => {
    const s = readyRun("bolt");
    const seen = kill(s, "plain");
    expect(seen).not.toContain("super");
    expect(s.choosing).toBe(false);
  });

  it("nothing is offered on a boss kill when no super is ready", () => {
    const s = readyRun("bolt", 0);
    const seen = kill(s, "elite");
    expect(seen).not.toContain("super");
    expect(s.choosing).toBe(false);
    const t = readyRun("bolt", 1);
    t.slots[0].lv = WEAPON_LV_MAX - 1;
    expect(kill(t, "boss")).not.toContain("super");
    expect(t.choosing).toBe(false);
  });

  it("ONE super per kill, and each weapon's only once", () => {
    const s = readyRun("bolt");
    s.slots.push({ id: "arc", cd: 0, lv: WEAPON_LV_MAX });
    applyUpgrade(s, RECIPE.arc);
    s.choosing = false;

    kill(s, "elite");
    const first = offerCards(s, rngFor(1));
    expect(first).toHaveLength(1);
    // The MAIN weapon first - slot order, never a draw, so no rng stream moves.
    expect(first[0]).toEqual({ kind: "evolve", id: "bolt" });
    applyCard(s, first[0]);

    kill(s, "elite");
    const second = offerCards(s, rngFor(1));
    expect(second).toEqual([{ kind: "evolve", id: "arc" }]);
    applyCard(s, second[0]);
    expect(s.slots.every((k) => k.evolved)).toBe(true);

    // Both taken: a third kill has nothing left to give.
    expect(kill(s, "elite")).not.toContain("super");
    expect(s.choosing).toBe(false);
  });

  it("the kill that WINS the run offers nothing - there is no run left to spend it in", () => {
    const s = readyRun("bolt");
    s.stage = 3;
    const seen = kill(s, "boss");
    expect(s.phase).toBe("won");
    expect(seen).not.toContain("super");
  });

  it("a level-up that lands on the same frame as a super is not lost", () => {
    // The super jumps the queue; the level-up waits behind it. Both used to
    // share one `choosing` flag, and taking the first cleared the second.
    const s = readyRun("bolt");
    s.xp = s.need - 1e-6;
    const power = s.power;
    // Close enough that the elite's gem is pulled in and collected on the frame
    // it dies - at 40 units it lands a frame later and nothing coincides.
    const seen = kill(s, "elite", 20);
    // Precondition, said out loud: both really did land together. If the gem
    // stops being collected on the kill frame this cell measures nothing.
    expect(seen.filter((t) => t === "super" || t === "levelup").sort()).toEqual(["levelup", "super"]);
    expect(s.power).toBe(power + 1);
    expect(offerCards(s, rngFor(1))).toEqual([{ kind: "evolve", id: "bolt" }]);
    applyCard(s, { kind: "evolve", id: "bolt" });
    expect(s.choosing, "the level-up was dropped when the super was taken").toBe(true);
    const next = offerCards(s, rngFor(1));
    expect(next.length).toBeGreaterThan(0);
    expect(next.some((c) => c.kind === "evolve")).toBe(false);
    applyCard(s, next[0]);
    expect(s.choosing).toBe(false);
  });
});
