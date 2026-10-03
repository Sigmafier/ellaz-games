import { describe, expect, it } from "vitest";
import {
  ARENA, KINDS, UPGRADE_CAP, UPGRADE_IDS, runMs,
  applyUpgrade, boltCount, fireEvery, newRun, offerUpgrades, rngFor, step,
  type Enemy, type EnemyKind, type RunState, WEAPON_LV_MAX, hasEvolution, sightRange, shieldReady, shieldEvery,
} from "./logic";
import { POOL, SLOTS_MAX } from "./arsenal";
import { WALL, WORLD_SCALE } from "./world";

// The whole game is in `logic.ts`, so the whole game can be played here with no
// canvas. Every test below drives it the way a frame would: a handful of
// milliseconds and a steering vector, nothing else.

/** Put a shape exactly where the test needs it, bypassing the spawner. */
function place(s: RunState, kind: EnemyKind, x: number, y: number): Enemy {
  const e: Enemy = { id: s.nextId++, kind, x, y, hp: KINDS[kind].hp, flash: 0 };
  s.enemies.push(e);
  return e;
}

const STILL = { dx: 0, dy: 0 };

/**
 * Hold every gun still and put the dash out of reach. The tests that use this are
 * about what a shape COSTS when it reaches you, not about the weapons shooting it
 * first or the dash blinking you clear of it - both of those are pinned in their
 * own files (`weapons.test.ts`, `powers.test.ts`).
 */
function defenceless(s: RunState): RunState {
  for (const k of s.slots) k.cd = 9_000;
  s.dashCd = 9_000;
  return s;
}
/** Run n frames of 16 ms, the way a 60 Hz display would. */
function frames(s: RunState, n: number, rng = rngFor(1), input = STILL) {
  for (let i = 0; i < n; i++) step(s, 16, input, rng);
  return s;
}

describe("a new run", () => {
  it("starts in the middle of the world, on three hearts, with nothing on screen", () => {
    const s = newRun("normal");
    expect(s.phase).toBe("playing");
    expect(s.hp).toBe(3);
    expect(s.maxHp).toBe(3);
    expect(s.world).toEqual({ w: ARENA.w * WORLD_SCALE, h: ARENA.h * WORLD_SCALE });
    expect(s.x).toBe(s.world.w / 2);
    expect(s.y).toBe(s.world.h / 2);
    expect(s.enemies).toHaveLength(0);
    expect(s.popped).toBe(0);
    expect(s.power).toBe(1);
  });
});

describe("the same seed plays the same run", () => {
  it("lands on the same score, hearts and clock after 300 frames", () => {
    const a = newRun("normal");
    const b = newRun("normal");
    frames(a, 300, rngFor(7));
    frames(b, 300, rngFor(7));
    expect({ popped: a.popped, hp: a.hp, t: a.t, enemies: a.enemies.length })
      .toEqual({ popped: b.popped, hp: b.hp, t: b.t, enemies: b.enemies.length });
    // The vacuum control: a run where nothing happened would satisfy the line
    // above and prove nothing at all.
    expect(a.enemies.length).toBeGreaterThan(0);
  });
});

describe("shooting", () => {
  it("fires by itself at the nearest shape and pops it, leaving a gem", () => {
    const s = newRun("normal");
    place(s, "runner", s.x + 80, s.y);
    frames(s, 20);
    expect(s.popped).toBe(1);
    expect(s.enemies).toHaveLength(0);
    expect(s.gems.length).toBeGreaterThan(0);
  });

  it("does not fire at nothing", () => {
    const s = newRun("normal");
    step(s, 16, STILL, rngFor(1));
    expect(s.bolts).toHaveLength(0);
  });

  it("cannot hit the same shape twice with one bolt", () => {
    // A brute has five hit points and a bolt does one, so if a piercing bolt
    // were allowed to keep touching it while it passed through, the brute would
    // die in a single shot.
    const s = newRun("normal");
    s.up.pierce = 3;
    const brute = place(s, "brute", s.x + 60, s.y);
    frames(s, 12);
    expect(brute.hp).toBe(KINDS.brute.hp - 1);
  });
});

describe("being hit", () => {
  it("costs exactly one heart even when three shapes arrive together", () => {
    // The ship would otherwise shoot one of them off the board on frame one,
    // and this test is about what the survivors cost, not about the gun.
    const s = defenceless(newRun("normal"));
    place(s, "runner", s.x, s.y);
    place(s, "runner", s.x + 2, s.y);
    place(s, "runner", s.x, s.y + 2);
    step(s, 16, STILL, rngFor(1));
    expect(s.hp).toBe(2);
    expect(s.enemies).toHaveLength(0);
  });

  it("gives mercy afterwards, so the next shape in the queue is free", () => {
    const s = defenceless(newRun("normal"));
    place(s, "runner", s.x, s.y);
    step(s, 16, STILL, rngFor(1));
    expect(s.hp).toBe(2);
    expect(s.invuln).toBeGreaterThan(0);
    place(s, "runner", s.x, s.y);
    step(s, 16, STILL, rngFor(1));
    expect(s.hp).toBe(2);
  });

  it("ends the run when the last heart goes", () => {
    const s = defenceless(newRun("normal"));
    s.hp = 1;
    s.invuln = 0;
    place(s, "runner", s.x, s.y);
    step(s, 16, STILL, rngFor(1));
    expect(s.phase).toBe("over");
    expect(s.events.some((e) => e.type === "over")).toBe(true);
  });
});

describe("the clock", () => {
  it("STOPS at three minutes without winning - that is when the golem arrives", () => {
    // This test asserted `phase === "won"` here until 2026-09-12, and it was
    // correct: reaching three minutes WAS the win. Task 7 moved the finish onto
    // the golem, so the assertion is inverted deliberately rather than deleted.
    // The clock reaching its end is still a real event worth pinning; it simply
    // means something else now, and what it means is pinned in `boss.test.ts`.
    const s = newRun("normal");
    // On the LAST stage - `t` alone stopped saying where a run is when the three
    // stages landed, and at t = RUN_MS on stage 1 the boss that walks in is a
    // warden. The clock still stops; it is just a different thing arriving.
    s.stage = 3;
    s.t = runMs(s.level) - 10;
    step(s, 16, STILL, rngFor(1));
    expect(s.phase).toBe("playing");
    expect(s.t).toBe(runMs(s.level));
    expect(s.events.some((e) => e.type === "won")).toBe(false);
  });

  it("clamps a frame that took ten seconds", () => {
    // A backgrounded tab comes back with an enormous delta. Without the clamp
    // it would teleport ten seconds of shapes into the player's face.
    const s = newRun("normal");
    step(s, 10_000, STILL, rngFor(1));
    expect(s.t).toBeLessThanOrEqual(50);
  });

  it("stops entirely while an upgrade is being chosen", () => {
    const s = newRun("normal");
    s.choosing = true;
    const before = s.t;
    frames(s, 30);
    expect(s.t).toBe(before);
  });
});

describe("levelling up", () => {
  it("asks for a choice once enough gems are collected", () => {
    const s = newRun("normal");
    s.gems.push({ id: 999, x: s.x, y: s.y, value: s.need });
    step(s, 16, STILL, rngFor(1));
    expect(s.power).toBe(2);
    expect(s.choosing).toBe(true);
    expect(s.events.some((e) => e.type === "levelup")).toBe(true);
  });

  it("offers three different upgrades and never a maxed one", () => {
    const s = newRun("normal");
    s.up.rapid = UPGRADE_CAP.rapid;
    const offer = offerUpgrades(s, rngFor(3));
    expect(offer).toHaveLength(3);
    expect(new Set(offer).size).toBe(3);
    expect(offer).not.toContain("rapid");
  });

  it("offers nothing at all once everything is maxed, rather than stalling", () => {
    const s = newRun("normal");
    for (const id of UPGRADE_IDS) s.up[id] = UPGRADE_CAP[id];
    expect(offerUpgrades(s, rngFor(3))).toHaveLength(0);
  });

  it("applies the choice and lets the run carry on", () => {
    const s = newRun("normal");
    s.choosing = true;
    const before = fireEvery(s);
    applyUpgrade(s, "rapid");
    expect(s.up.rapid).toBe(1);
    expect(fireEvery(s)).toBeLessThan(before);
    expect(s.choosing).toBe(false);
  });

  it("gives a heart back as well as raising the ceiling", () => {
    const s = newRun("normal");
    s.hp = 1;
    applyUpgrade(s, "heart");
    expect(s.maxHp).toBe(4);
    expect(s.hp).toBe(2);
  });

  it("adds a bolt per spread, and refuses to go past the cap", () => {
    const s = newRun("normal");
    expect(boltCount(s)).toBe(1);
    for (let i = 0; i < UPGRADE_CAP.spread + 3; i++) applyUpgrade(s, "spread");
    expect(s.up.spread).toBe(UPGRADE_CAP.spread);
    expect(boltCount(s)).toBe(1 + UPGRADE_CAP.spread);
  });
});

describe("the world's walls hold you", () => {
  it("never lets you walk out of it", () => {
    // Immortal, or a run that ends part way stops the robot short of the wall
    // and the assertion reads a death rather than a wall.
    const s = newRun("normal");
    s.hp = 9_999;
    // A level-up stops the simulation until a card is taken, and nobody takes one
    // here - so the choice is dismissed every frame or the robot stalls mid-floor.
    const walk = (n: number, dx: number, dy: number) => {
      for (let i = 0; i < n; i++) {
        s.choosing = false;
        step(s, 16, { dx, dy }, rngFor(2));
      }
    };
    walk(1200, -1, -1);
    expect(s.x).toBeGreaterThanOrEqual(WALL);
    expect(s.y).toBeGreaterThanOrEqual(WALL);
    // Actually AT the wall, so the two lines above are not satisfied by a robot
    // that never got near it.
    expect(s.x).toBeLessThan(WALL + 20);
    walk(2400, 1, 1);
    expect(s.x).toBeLessThanOrEqual(s.world.w - WALL);
    expect(s.y).toBeLessThanOrEqual(s.world.h - WALL);
    expect(s.x).toBeGreaterThan(s.world.w - WALL - 20);
  });
});

describe("the cards that exist - the ceiling the operator asked to raise", () => {
  it("counts them, so the number in the plan and the number in the game agree", () => {
    const upgradeSteps = UPGRADE_IDS.reduce((a, id) => a + UPGRADE_CAP[id], 0);
    const weaponLevels = POOL.length * (WEAPON_LV_MAX - 1);
    const newWeapons = SLOTS_MAX - 1; // a run starts with one and can hold six
    const evolutions = POOL.filter(hasEvolution).length;
    const total = upgradeSteps + weaponLevels + newWeapons + evolutions;

    // MEASURED 2026-09-21. Before this work the whole game held 30 cards - 26
    // upgrade steps plus 4 weapons - and a gem-chasing `wild` run was measured
    // taking 29.0 of them, so its last level-ups offered an empty screen. That
    // is the defect the operator's "deeper level-ups" named.
    console.log(
      `cards that exist: ${total}  (${upgradeSteps} upgrade steps + ${weaponLevels} weapon levels` +
        ` + ${newWeapons} new weapons + ${evolutions} evolutions)`,
    );
    // 40, not the 37 the plan first said - that figure forgot that raising rapid
    // 6->8 and power 5->7 is four steps, not two. Corrected here and in the plan
    // rather than left to be quoted: 26 + 4 + 9 = 39 was arithmetic done in a
    // sentence, and 40 is arithmetic done by the table.
    //
    // 36 SINCE 2026-09-22: removing `crit` took its four steps with it, and they
    // were deliberately NOT redistributed onto the nine that remain. This round
    // is meant to make the run harder, and handing the same number of upgrade
    // steps back under other names would have undone part of that silently.
    //
    // 44 SINCE 2026-10-03: area 3, regen 2 and haste 3 ("3 powers"). A run still
    // holds six powers at most (PASSIVE_SLOTS), so the ceiling a run can SEE is
    // unchanged - these are more ways to fill the same six slots.
    expect(upgradeSteps).toBe(44);
    // 86 SINCE 2026-10-02: nine weapons (four added) and six slots ("ack B").
    // Nine weapons' levels are 36, but a run holds six of them and six of the
    // nine upgrades, so no run can see all 86 - which is the point of slots.
    expect(weaponLevels).toBe(36);
    expect(total).toBe(94);

    // The point of the raise, stated as the thing that must stay true: a run
    // that takes 30 cards must still have somewhere to spend the 31st.
    expect(total).toBeGreaterThan(30 + 20);
  });

  it("nine upgrades, and every one of them is reachable", () => {
    // NINE since 2026-09-22, ten before it: `crit` was removed by operator
    // ruling. The count is pinned rather than derived on purpose - it is the
    // line that makes dropping an upgrade a decision somebody has to write down
    // rather than a diff nobody notices.
    // TWELVE since 2026-10-03: area, regen and haste (operator ruling "3 powers").
    expect(UPGRADE_IDS).toHaveLength(12);
    expect(UPGRADE_IDS).toEqual(expect.arrayContaining(["area", "regen", "haste"]));
    for (const id of UPGRADE_IDS) expect(UPGRADE_CAP[id]).toBeGreaterThan(0);
    // The two newest by name, so a rename cannot silently drop one.
    expect(UPGRADE_IDS).toEqual(expect.arrayContaining(["shield", "range"]));
    // And the removed one by name, so a revert has to walk past this line.
    expect(UPGRADE_IDS).not.toContain("crit");
  });
});

describe("the newer upgrades do something", () => {
  it("RANGE extends how far the gun sees, and 240 is still the floor", () => {
    const s = newRun("normal");
    expect(sightRange(s)).toBe(240);
    const far = newRun("normal");
    far.up.range = UPGRADE_CAP.range;
    expect(sightRange(far)).toBeGreaterThan(240);

    // End to end: a shape parked beyond the base sight must be shot at only by
    // the run that bought the upgrade.
    const shotsAt = (range: number) => {
      const r = newRun("normal");
      r.up.range = range;
      r.enemies.push({ id: r.nextId++, kind: "runner", x: r.x + 300, y: r.y, hp: 99, flash: 0 });
      step(r, 16, STILL, rngFor(1));
      return r.events.filter((e) => e.type === "shot").length;
    };
    expect(shotsAt(0)).toBe(0);
    expect(shotsAt(UPGRADE_CAP.range)).toBeGreaterThan(0);
  });

  it("SHIELD eats a hit instead of a heart, then needs time", () => {
    const hitIt = (shield: number) => {
      const s = newRun("normal");
      s.up.shield = shield;
      s.dashCd = 1e12; // the dash would blink clear first - this measures the shield
      // HOLD THE GUN AND MAKE THE SHAPE TOUGH. The first version stood a
      // one-health runner on the robot, and the weapons fire BEFORE the contact
      // loop runs - so the bolt killed it at zero range and nothing ever touched
      // the player. Both arms read "no heart lost", which is what a working
      // shield looks like, on a frame where there was no hit to absorb.
      for (const k of s.slots) k.cd = 9_000;
      s.enemies.push({ id: s.nextId++, kind: "runner", x: s.x, y: s.y, hp: 999, flash: 0 });
      step(s, 16, STILL, rngFor(1));
      return { hp: s.hp, cd: s.shieldCd, ev: s.events.map((e) => e.type) };
    };
    const bare = hitIt(0);
    expect(bare.hp).toBe(2); // a heart gone
    expect(bare.ev).toContain("hurt");

    const held = hitIt(1);
    expect(held.hp).toBe(3); // the shield ate it
    expect(held.ev).toContain("shield");
    expect(held.ev).not.toContain("hurt");
    expect(held.cd).toBeGreaterThan(0);
  });

  it("an untaken SHIELD is never ready, however long the run goes", () => {
    // `shieldEvery` is Infinity when untaken, so the clock can never reach zero
    // from above. A large number instead would be a duration a long run reaches,
    // and a shield appearing in minute three of a run that never bought one is
    // exactly the kind of thing nobody would think to test for.
    const s = newRun("normal");
    expect(shieldReady(s)).toBe(false);
    expect(shieldEvery(s)).toBe(Infinity);
    s.shieldCd = 0;
    expect(shieldReady(s)).toBe(false);
    s.up.shield = 1;
    expect(shieldReady(s)).toBe(true);
  });

  it("no upgrade makes a shot SOMETIMES hit harder - damage is read, never rolled", () => {
    // THE CELL THAT REPLACES THE CRIT CELL, and it asserts the opposite
    // property on purpose. `crit` was removed by operator ruling on 2026-09-22
    // - *"Remove the sometimes hits twice upgrade"* - and "we deleted it" is a
    // claim about a diff, not about the game. This is a claim about the game:
    // with the loadout held still, one weapon does ONE damage number, every
    // shot, for a whole run.
    //
    // It would red on a re-added crit, and on any future upgrade that multiplies
    // damage by a roll - which is the point of writing it as a property rather
    // than as `expect(UPGRADE_IDS).not.toContain("crit")`. That version passes
    // on a game where `power` secretly doubles a tenth of the time.
    const r = newRun("normal");
    r.maxHp = 1e9;
    r.hp = 1e9;
    const rng = rngFor(31337);
    const perWeapon = new Map<string, Set<number>>();
    for (let i = 0; i < 1800; i++) {
      step(r, 16, STILL, rng);
      // Held still so the loadout cannot change under the measurement: a level-up
      // taken mid-run moves `power`, and THAT is a damage change nobody is
      // calling a roll.
      r.choosing = false;
      for (const b of r.bolts) {
        const seen = perWeapon.get(b.kind) ?? new Set<number>();
        seen.add(b.dmg);
        perWeapon.set(b.kind, seen);
      }
    }
    // The population, stated: a run that threw nothing proves nothing.
    expect(perWeapon.size, "no weapon fired - the measurement is empty").toBeGreaterThan(0);
    for (const [kind, seen] of perWeapon) {
      expect([...seen], `${kind} threw more than one damage value`).toHaveLength(1);
    }
  });

  it("the same seed with the same loadout still plays the same run", () => {
    // The determinism property that is actually TRUE. An earlier version of this
    // asked whether two DIFFERENT loadouts share a stream; they cannot, because
    // a loadout changes which shapes die, which changes how many shots are fired
    // and how often a full board skips a spawn - and each of those is an rng draw.
    //
    // The knob was `crit` until 2026-09-22 and is `power` now: the cell was never
    // about crit, only about holding a loadout still while the seed moves.
    const play = (power: number, seed: number) => {
      const r = newRun("normal");
      r.up.power = power;
      r.maxHp = 1e9;
      r.hp = 1e9;
      const rng = rngFor(seed);
      const seen = new Map<number, string>();
      for (let i = 0; i < 1800; i++) {
        step(r, 16, STILL, rng);
        r.choosing = false;
        for (const e of r.enemies) {
          if (!seen.has(e.id)) seen.set(e.id, `${e.kind}@${e.x.toFixed(3)},${e.y.toFixed(3)}`);
        }
      }
      return [...seen.values()];
    };
    const a = play(UPGRADE_CAP.power, 4242);
    expect(a.length, "the population - a run that spawned twice proves nothing").toBeGreaterThan(20);
    expect(play(UPGRADE_CAP.power, 4242)).toEqual(a);
    // THE CONTROL: a different seed must NOT match, or the line above passes on
    // a `play` that returns the same thing whatever it is handed.
    expect(play(UPGRADE_CAP.power, 4243)).not.toEqual(a);
  });
});
