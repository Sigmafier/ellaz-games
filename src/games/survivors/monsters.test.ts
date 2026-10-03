// FOUR NEW MONSTERS AND THREE NEW POWERS (operator ruling 2026-10-03, "4 monsters
// + 3 powers"), all on sheets Neon already ships - no new art.
//
//   SPLITTER  a slime that splits into two small ones when it dies     (frost)
//   CHARGER   a bat that winds up, then dashes in a straight line      (frost)
//   BOMBER    a crab with a fuse that bursts into a ring of shots      (lava)
//   HORDE     eight shapes appearing in a ring around you              (lava)
//   AREA      blades, halo, nova and the thunder's blast reach further
//   REGEN     a heart back every few seconds
//   HASTE     the dash comes back sooner
import { describe, expect, it } from "vitest";
import { ARENA_WIDE, KINDS, newRun, rngFor, step, type Enemy, type RunState } from "./logic";
import { newCareerRun, PLAIN_STATS } from "./careerRun";
import { BOMBER, CHARGER, HORDE, MONSTER_KINDS } from "./monsters";
import { FOR_ENEMY } from "./sprites";
import { WORLDS } from "./worlds";
import { AREA_STEP, REGEN_MS, UPGRADE_CAP, UPGRADE_IDS, areaOf } from "./upgrades";
import { DASH_MS, dashEvery } from "./powers";
import { haloReach } from "./arms";
import { bladeReach } from "./arsenal";

const still = { dx: 0, dy: 0 };
function frostRun(): RunState {
  const s = newCareerRun("frost-1", { ...PLAIN_STATS, hearts: 99 }, ARENA_WIDE);
  s.enemies = [];
  s.spawnIn = 1e9;
  return s;
}
const put = (s: RunState, kind: Enemy["kind"], dx: number, dy = 0): Enemy => {
  const e: Enemy = { id: s.nextId++, kind, x: s.x + dx, y: s.y + dy, hp: KINDS[kind].hp, flash: 0 };
  s.enemies.push(e);
  return e;
};

describe("the monsters ride sheets that already ship", () => {
  it("each new kind is drawn from an existing sheet - slime, bat, crab", () => {
    expect(FOR_ENEMY.splitter).toBe("slime");
    expect(FOR_ENEMY.blob).toBe("slime");
    expect(FOR_ENEMY.charger).toBe("bat");
    expect(FOR_ENEMY.bomber).toBe("crab");
    for (const k of MONSTER_KINDS) expect(KINDS[k].hp, k).toBeGreaterThan(0);
  });

  it("frost sends the splitter and the charger, lava the bomber and the horde - and the city none of them", () => {
    const mix = (id: string) => WORLDS.find((w) => w.id === id)!.mix.map(([k]) => k);
    expect(mix("frost")).toEqual(expect.arrayContaining(["splitter", "charger"]));
    expect(mix("lava")).toEqual(expect.arrayContaining(["bomber"]));
    for (const k of MONSTER_KINDS) expect(mix("city"), k).not.toContain(k);
    expect(newCareerRun("lava-1", PLAIN_STATS).career!.hordeIn).toBe(HORDE.every);
    expect(newCareerRun("frost-1", PLAIN_STATS).career!.hordeIn).toBe(Infinity);
  });
});

describe("the splitter", () => {
  it("dies into two small ones where it stood", () => {
    const s = frostRun();
    const e = put(s, "splitter", 300);
    e.hp = 0.0001;
    s.bolts.push({ id: s.nextId++, kind: "bolt", x: e.x, y: e.y, vx: 0, vy: 0, dmg: 5, pierce: 0, life: 500, age: 0, hit: [] });
    step(s, 16, still, rngFor(1));
    const blobs = s.enemies.filter((q) => q.kind === "blob");
    expect(blobs).toHaveLength(2);
    for (const b of blobs) expect(Math.hypot(b.x - e.x, b.y - e.y)).toBeLessThan(30);
    expect(s.enemies.some((q) => q.kind === "splitter")).toBe(false);
  });

  it("a small one does not split again", () => {
    const s = frostRun();
    const b = put(s, "blob", 300);
    s.bolts.push({ id: s.nextId++, kind: "bolt", x: b.x, y: b.y, vx: 0, vy: 0, dmg: 5, pierce: 0, life: 500, age: 0, hit: [] });
    step(s, 16, still, rngFor(1));
    expect(s.enemies).toHaveLength(0);
  });
});

describe("the charger", () => {
  it("stops and winds up in range, then dashes along the line it aimed - and never turns mid-dash", () => {
    const s = frostRun();
    const e = put(s, "charger", CHARGER.range - 20);
    const rng = rngFor(2);
    step(s, 16, still, rng);
    expect(e.wind ?? 0).toBeGreaterThan(0);
    const x0 = e.x;
    for (let t = 0; t < CHARGER.wind - 40; t += 16) step(s, 16, still, rng);
    expect(Math.abs(e.x - x0), "it walked during its wind-up").toBeLessThan(1);
    for (let t = 0; t < 120; t += 16) step(s, 16, still, rng);
    expect(e.dash ?? 0).toBeGreaterThan(0);
    const dy0 = e.y;
    s.y += 80; // the robot steps aside - a dash does not follow it
    for (let k = 0; k < 4; k++) step(s, 16, still, rng);
    expect(e.dash ?? 0, "the dash ended inside the window this cell reads").toBeGreaterThan(0);
    expect(Math.abs(e.y - dy0)).toBeLessThan(0.5);
    expect(e.x).toBeLessThan(x0 - 5);
  });

  it("THE CONTROL: out of range it simply walks", () => {
    const s = frostRun();
    const e = put(s, "charger", CHARGER.range + 120);
    const x0 = e.x;
    step(s, 16, still, rngFor(3));
    expect(e.wind ?? 0).toBe(0);
    expect(e.x).toBeLessThan(x0);
  });
});

describe("the bomber", () => {
  it("lights its fuse up close, then bursts into a ring of shots and is gone - no gem for a bang", () => {
    const s = frostRun();
    const e = put(s, "bomber", BOMBER.reach - 10);
    const rng = rngFor(4);
    step(s, 16, still, rng);
    expect(e.fuse ?? 0).toBeGreaterThan(0);
    for (let t = 0; t < BOMBER.fuse + 32; t += 16) step(s, 16, still, rng);
    expect(s.enemies.some((q) => q.id === e.id)).toBe(false);
    expect(s.gems).toHaveLength(0);
    expect(s.shots.length).toBeGreaterThanOrEqual(BOMBER.shots - 2);
  });

  it("shot down before it bursts, it pays like any shape", () => {
    const s = frostRun();
    const e = put(s, "bomber", 200);
    s.bolts.push({ id: s.nextId++, kind: "bolt", x: e.x, y: e.y, vx: 0, vy: 0, dmg: 99, pierce: 0, life: 500, age: 0, hit: [] });
    step(s, 16, still, rngFor(5));
    expect(s.gems.length).toBe(1);
    expect(s.shots).toHaveLength(0);
  });
});

describe("the horde ring", () => {
  it("eight shapes appear around the robot on lava's clock", () => {
    const s = newCareerRun("lava-1", { ...PLAIN_STATS, hearts: 99 }, ARENA_WIDE);
    s.spawnIn = 1e9;
    const rng = rngFor(6);
    for (let t = 0; t < HORDE.every + 32; t += 16) {
      s.choosing = false;
      step(s, 16, still, rng);
    }
    const ring = s.enemies.filter((e) => Math.abs(Math.hypot(e.x - s.x, e.y - s.y) - HORDE.radius) < 60);
    expect(ring.length).toBeGreaterThanOrEqual(HORDE.count - 1);
    expect(s.events.some((e) => e.type === "horde") || ring.length >= HORDE.count - 1).toBe(true);
  });
});

describe("three new powers", () => {
  it("are on the card pool with their own caps", () => {
    for (const id of ["area", "regen", "haste"] as const) {
      expect(UPGRADE_IDS).toContain(id);
      expect(UPGRADE_CAP[id]).toBeGreaterThan(0);
    }
  });

  it("AREA widens the halo and the blades, by its step", () => {
    const s = newRun("normal");
    expect(areaOf(s)).toBe(1);
    const h0 = haloReach(false, s);
    const b0 = bladeReach(s, false);
    s.up.area = 2;
    expect(areaOf(s)).toBeCloseTo(1 + 2 * AREA_STEP, 6);
    expect(haloReach(false, s)).toBeCloseTo(h0 * areaOf(s), 6);
    expect(bladeReach(s, false)).toBeCloseTo(b0 * areaOf(s), 6);
  });

  it("REGEN hands back a heart on its clock, never past the bar", () => {
    const s = newRun("calm");
    s.up.regen = 1;
    s.hp = 1;
    s.spawnIn = 1e9;
    const rng = rngFor(7);
    for (let t = 0; t < REGEN_MS[0] + 32; t += 16) step(s, 16, still, rng);
    expect(s.hp).toBe(2);
    s.hp = s.maxHp;
    // The swarm clock back to zero, so the stage's boss never walks in on the test.
    s.t = 0;
    for (let t = 0; t < REGEN_MS[0] + 5_000; t += 16) step(s, 16, still, rng);
    expect(s.hp).toBe(s.maxHp);
  });

  it("THE CONTROL: without regen nothing comes back", () => {
    const s = newRun("calm");
    s.hp = 1;
    s.spawnIn = 1e9;
    for (let t = 0; t < REGEN_MS[0] + 32; t += 16) step(s, 16, still, rngFor(8));
    expect(s.hp).toBe(1);
  });

  it("HASTE brings the dash back sooner", () => {
    const s = newRun("normal");
    expect(dashEvery(s)).toBe(DASH_MS);
    s.up.haste = 2;
    expect(dashEvery(s)).toBeLessThan(DASH_MS);
  });
});
