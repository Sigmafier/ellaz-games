// A CAREER LEVEL IN THE SIMULATION: what the player brings in reaches the run,
// the level ends on its own rule, and each world's twist is a rule rather than a
// picture. Every cell drives `step` itself - nothing here reads a drawing.
import { describe, expect, it } from "vitest";
import { ARENA_WIDE, bossBar, magnetRange, nearestEnemy, newRun, playerSpeed, rngFor, step, weaponDamage, type Enemy, type RunState } from "./logic";
import { PLAIN_STATS, careerResult, newCareerRun } from "./careerRun";
import { WORLDS, levelRow } from "./worlds";
import { POOL } from "./twists";

const STILL = { dx: 0, dy: 0 };
const run = (id: string, stats = PLAIN_STATS) => newCareerRun(id, stats, ARENA_WIDE, "bolt");

/** Nothing new arrives: the cell places what it needs by hand. */
function quiet(s: RunState): RunState {
  s.spawnIn = 1e12;
  s.career!.spawnMs = 1e12;
  s.career!.floorMs = 1e12;
  s.career!.poolIn = 1e12;
  // The city's shade parked far away, so a cell that stands still is not blinded.
  s.career!.shadeX = -1e6;
  return s;
}

function shape(s: RunState, dx: number, dy: number, over: Partial<Enemy> = {}): Enemy {
  const e: Enemy = { id: s.nextId++, kind: "runner", x: s.x + dx, y: s.y + dy, hp: 1, flash: 0, ...over };
  s.enemies.push(e);
  return e;
}

function play(s: RunState, ms: number, input = STILL, seed = 7): RunState {
  const rng = rngFor(seed);
  for (let t = 0; t < ms && s.phase === "playing"; t += 16) {
    s.choosing = false;
    step(s, 16, input, rng);
  }
  return s;
}

describe("a quick run carries no career at all", () => {
  it("newRun has no career, and ten seconds of play does not grow one", () => {
    const s = newRun("normal", ARENA_WIDE);
    expect(s.career).toBeUndefined();
    play(s, 10_000);
    expect(s.career).toBeUndefined();
  });
});

describe("what the player brings in reaches the run", () => {
  it("HEALTH is the hearts the run starts with", () => {
    const s = run("city-1", { ...PLAIN_STATS, hearts: 5 });
    expect([s.hp, s.maxHp]).toEqual([5, 5]);
    expect(run("city-1").maxHp).toBe(3);
  });

  it("SPEED moves the robot further in the same second", () => {
    const walk = (speed: number) => {
      const s = quiet(run("city-1", { ...PLAIN_STATS, speed }));
      const x0 = s.x;
      play(s, 1000, { dx: 1, dy: 0 });
      return s.x - x0;
    };
    expect(playerSpeed(run("city-1", { ...PLAIN_STATS, speed: 1.25 }))).toBeCloseTo(playerSpeed(run("city-1")) * 1.25, 6);
    expect(walk(1.25) / walk(1)).toBeCloseTo(1.25, 1);
  });

  it("DAMAGE rides every shot the gun throws", () => {
    const shot = (damage: number) => {
      const s = quiet(run("city-1", { ...PLAIN_STATS, damage }));
      shape(s, 120, 0, { hp: 50 });
      s.career!.pace = 0;
      for (let i = 0; i < 40 && s.bolts.length === 0; i++) step(s, 16, STILL, rngFor(1));
      return s.bolts[0]?.dmg ?? 0;
    };
    expect(shot(1)).toBeGreaterThan(0);
    expect(shot(1.5)).toBeCloseTo(shot(1) * 1.5, 6);
    const s = run("city-1", { ...PLAIN_STATS, damage: 2 });
    expect(weaponDamage(s, s.slots[0])).toBeCloseTo(weaponDamage(run("city-1"), s.slots[0]) * 2, 6);
  });

  it("MAGNET reaches further for gems and gold", () => {
    expect(magnetRange(run("city-1", { ...PLAIN_STATS, magnet: 1.5 }))).toBeCloseTo(magnetRange(run("city-1")) * 1.5, 6);
  });

  it("LUCK is how often a kill drops a coin", () => {
    const coins = (luck: number) => {
      const s = quiet(run("city-1", { ...PLAIN_STATS, luck }));
      s.career!.pace = 0;
      for (let i = 0; i < 10; i++) shape(s, 100 + i * 3, 0, { hp: 0.5 });
      play(s, 12_000);
      expect(s.popped, "the gun did not kill the ten").toBe(10);
      return s.career!.coins.reduce((a, c) => a + c.value, 0) + s.career!.gold;
    };
    expect(coins(0)).toBe(0);
    expect(coins(50)).toBe(5);
    expect(coins(100)).toBe(10);
  });

  it("the shop's SHIELD starts the run with one", () => {
    expect(run("city-1", { ...PLAIN_STATS, shield: 1 }).up.shield).toBe(1);
    expect(run("city-1").up.shield).toBe(0);
  });
});

describe("gold on the floor", () => {
  it("is picked up like a gem and counted, and an elite drops a pile and is counted", () => {
    const s = quiet(run("frost-1"));
    s.career!.coins.push({ id: s.nextId++, x: s.x + 4, y: s.y, value: 6 });
    play(s, 200);
    expect(s.career!.gold).toBe(6);
    expect(s.career!.coins).toEqual([]);

    const t = quiet(run("frost-1", { ...PLAIN_STATS, luck: 0 }));
    t.career!.pace = 0;
    shape(t, 130, 0, { hp: 0.5, elite: true });
    play(t, 3000);
    expect(t.career!.elites).toBe(1);
    const lying = t.career!.coins.reduce((a, c) => a + c.value, 0) + t.career!.gold;
    expect(lying).toBe(5 * WORLDS[1].coin);
  });
});

describe("a level ends on its own rule", () => {
  it("an ordinary level is WON by surviving its clock, and no boss ever comes", () => {
    const s = run("city-2");
    s.hp = s.maxHp = 9_999;
    play(s, levelRow("city-2").timeMs + 2000);
    expect(s.phase).toBe("won");
    expect(s.t).toBeGreaterThanOrEqual(levelRow("city-2").timeMs);
    expect(s.enemies.some((e) => e.kind === "warden")).toBe(false);
    expect(careerResult(s)).toMatchObject({ level: "city-2", won: true });
  });

  it("a boss level sends its world's boss at the clock, at the level's own health, and falls to the win", () => {
    const s = run("frost-boss");
    s.hp = s.maxHp = 9_999;
    const rng = rngFor(2);
    for (let t = 0; s.boss === null && t < levelRow("frost-boss").timeMs + 1000; t += 16) {
      s.choosing = false;
      step(s, 16, STILL, rng);
    }
    expect(s.t).toBe(levelRow("frost-boss").timeMs);
    const boss = s.enemies.find((e) => e.id === s.boss);
    expect(boss?.kind).toBe("queen");
    expect(boss?.hp).toBe(s.career!.bossHp);
    // The bar's denominator is the level's, never the quick run's queen.
    expect(bossBar(s)?.maxHp).toBe(s.career!.bossHp);
    expect(s.phase).toBe("playing");
    boss!.hp = 0.01;
    s.bolts.push({ id: s.nextId++, kind: "bolt", x: boss!.x, y: boss!.y, vx: 0, vy: 0, dmg: 5, pierce: 0, life: 500, age: 0, hit: [] });
    play(s, 100);
    expect(s.phase).toBe("won");
  });

  it("out of hearts is a loss, and the result says so", () => {
    const s = quiet(run("city-1"));
    s.hp = 1;
    s.dashCd = 1e9;
    // Tough enough that the gun cannot kill it before it touches the robot.
    shape(s, 0, 0, { hp: 100 });
    play(s, 100);
    expect(s.phase).toBe("over");
    expect(careerResult(s)).toMatchObject({ won: false, hp: 0 });
  });

  it("only the world's own crowd comes, and never a boss in the swarm", () => {
    for (const w of WORLDS) {
      const s = run(`${w.id}-3`);
      s.hp = s.maxHp = 9_999;
      const seen = new Set<string>();
      const rng = rngFor(3);
      for (let t = 0; t < 80_000 && s.phase === "playing"; t += 16) {
        s.choosing = false;
        step(s, 16, STILL, rng);
        for (const e of s.enemies) seen.add(e.kind);
      }
      const allowed = new Set(w.mix.map(([k]) => k));
      for (const k of seen) expect(allowed.has(k as never), `${w.id} sent a ${k}`).toBe(true);
      expect(seen.size, `${w.id} sent a thin crowd`).toBeGreaterThanOrEqual(3);
    }
  });
});

describe("NEON CITY: the lights go out, and the guns cannot see into the dark", () => {
  it("a shape in a dark patch is not a target; the same shape in the light is", () => {
    const s = quiet(run("city-1"));
    const e = shape(s, 100, 0);
    s.career!.dark = [{ x: e.x, y: e.y, r: 70 }];
    expect(nearestEnemy(s)).toBeNull();
    s.career!.dark = [{ x: e.x + 400, y: e.y, r: 70 }];
    expect(nearestEnemy(s)).toBe(e);
  });

  it("the BOSS is never hidden - a warden in the dark is still a target", () => {
    const s = quiet(run("city-boss"));
    const e = shape(s, 100, 0, { kind: "warden", hp: 80 });
    s.boss = e.id;
    s.career!.dark = [{ x: e.x, y: e.y, r: 70 }];
    expect(nearestEnemy(s)).toBe(e);
  });

  it("the city has darkness that drifts; the other worlds have none", () => {
    const s = quiet(run("city-1"));
    play(s, 16);
    expect(s.career!.dark.length).toBeGreaterThan(4);
    const before = JSON.stringify(s.career!.dark);
    play(s, 1500);
    expect(JSON.stringify(s.career!.dark)).not.toBe(before);
    for (const id of ["frost-1", "lava-1"]) expect(play(quiet(run(id)), 16).career!.dark).toEqual([]);
  });
});

describe("FROST: the robot slides on ice", () => {
  const coast = (id: string) => {
    const s = quiet(run(id));
    play(s, 400, { dx: 1, dy: 0 });
    const x = s.x;
    play(s, 300);
    return s.x - x;
  };
  it("let go of the stick and it keeps going", () => {
    expect(coast("frost-1")).toBeGreaterThan(15);
  });
  it("THE CONTROL: on the city floor it stops dead", () => {
    expect(coast("city-1")).toBe(0);
  });
  it("and it takes a moment to get going, which is the other half of ice", () => {
    const s = quiet(run("frost-1"));
    const c = quiet(run("city-1"));
    play(s, 100, { dx: 1, dy: 0 });
    play(c, 100, { dx: 1, dy: 0 });
    expect(s.x - s.world.w / 2).toBeLessThan(c.x - c.world.w / 2);
  });
});

describe("LAVA: hot pools open, with a warning first", () => {
  it("a pool under the robot is harmless while it warns, and burns once it is live", () => {
    const s = quiet(run("lava-1"));
    s.career!.pools.push({ id: s.nextId++, x: s.x, y: s.y, r: POOL.r, warn: 400, live: 2000 });
    const hits = () => s.events.filter((e) => e.type === "hurt" || e.type === "dash" || e.type === "shield").length;
    let during = 0;
    const rng = rngFor(1);
    for (let t = 0; t < 350; t += 16) { step(s, 16, STILL, rng); during += hits(); }
    expect(during, "a warning ring hurt").toBe(0);
    let after = 0;
    for (let t = 0; t < 200; t += 16) { step(s, 16, STILL, rng); after += hits(); }
    expect(after, "a live pool did not burn").toBeGreaterThan(0);
  });

  it("pools keep opening near the robot, each one warning first, and go cold again", () => {
    const s = run("lava-1");
    s.hp = s.maxHp = 9_999;
    s.spawnIn = 1e12;
    s.career!.spawnMs = 1e12;
    const born = new Set<number>();
    const rng = rngFor(5);
    for (let t = 0; t < 20_000; t += 16) {
      step(s, 16, STILL, rng);
      for (const p of s.career!.pools) {
        if (born.has(p.id)) continue;
        born.add(p.id);
        expect(p.warn, "a pool opened without warning").toBe(POOL.warn);
        expect(Math.hypot(p.x - s.x, p.y - s.y)).toBeLessThan(POOL.near[1] + 1);
      }
    }
    expect(born.size).toBeGreaterThanOrEqual(4);
    expect(s.career!.pools.length).toBeLessThanOrEqual(POOL.cap);
  });

  it("THE CONTROL: no pool ever opens in the other worlds", () => {
    for (const id of ["city-1", "frost-1"]) {
      const s = run(id);
      s.hp = s.maxHp = 9_999;
      play(s, 15_000);
      expect(s.career!.pools).toEqual([]);
    }
  });
});
