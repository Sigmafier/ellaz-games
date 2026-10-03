// A CAREER LEVEL in the simulation: it ends on a crush target, a boss level ends
// only when its boss falls, the stats a save brings in move what they say, and
// each world's twist acts in that world and nowhere else.
//
// Each cell sets up its one situation by hand - a body laid round a circle, a
// shape placed inside it - the way logic.test.ts does, so a failure names the
// rule and not a seed's luck.
import { describe, expect, it } from "vitest";
import { mulberry32 } from "@shared/rng";
import { ringRun } from "./testRing";
import { SPACING, START_LEN, SEG } from "./body";
import { speedOf, turnOf } from "./cards";
import { KINDS, hitCost, spawnEvery } from "./crowd";
import { ARENA, newRun, step } from "./logic";
import { PLAIN_STATS, careerResult, newCareerRun } from "./careerRun";
import { SAND, inSand } from "./careerTwists";
import { SNAKE_LEVELS, snakeLevel } from "./careerWorlds";
import type { SnakeCareerStats } from "./careerTypes";
import type { Foe, Kind, Run } from "./types";
import { careerGoal } from "./hud";
import { drawCareerLayers } from "./careerScene";

const STILL = { dx: 0, dy: 0 };
const fixed = () => 0.5;
let nextId = 5000;
function foe(kind: Kind, x: number, y: number, hp = KINDS[kind].hp): Foe {
  return { id: nextId++, kind, x, y, hp, hurt: 0, stun: 0, spikeCool: 0, dash: 0, dashCool: 0, windup: 0, slow: 0 };
}

/** A career level with its body laid round a circle and the spawn clock held off - only the shapes a cell places exist. */
function careerRing(id: string, stats: SnakeCareerStats = PLAIN_STATS): Run {
  const run = newCareerRun(id, stats, ARENA, fixed);
  const ring = ringRun(run.world.w / 2, run.world.h / 2, 60);
  Object.assign(run, { x: ring.x, y: ring.y, heading: ring.heading, path: ring.path, len: ring.len, peak: ring.len });
  run.spawnIn = 1e9;
  run.floorIn = 1e9;
  run.calmMs = 0;
  run.foes = [];
  run.gems = [];
  return run;
}
const centre = (run: Run) => ({ x: run.world.w / 2, y: run.world.h / 2 });

describe("a career level is built from its row and the save's stats", () => {
  it("plain stats: the starting length, the level's target, no boss yet", () => {
    const run = newCareerRun("garden-1", PLAIN_STATS, ARENA, fixed);
    expect(run.len).toBe(START_LEN);
    expect(run.career?.target).toBe(snakeLevel("garden-1").target);
    expect(run.career?.boss).toBe(false);
    expect(run.foes).toEqual([]);
  });

  it("Scales and the length row start the snake longer - and the body is laid that long", () => {
    const run = newCareerRun("garden-1", { ...PLAIN_STATS, length: 40 }, ARENA, fixed);
    expect(run.len).toBe(40);
    expect(run.peak).toBe(40);
    expect(run.path.length).toBe(Math.ceil((40 * SEG) / SPACING));
  });

  it("a QUICK run has no career at all", () => {
    const run = newRun("normal", ARENA, fixed);
    expect("career" in run).toBe(false);
    step(run, 25, STILL, fixed);
    expect("career" in run).toBe(false);
  });
});

describe("an ordinary level ends on its crush target", () => {
  it("the loop that reaches N wins the level", () => {
    const run = careerRing("garden-1");
    run.crushed = run.career!.target - 1;
    const c = centre(run);
    run.foes.push(foe("runner", c.x, c.y));
    step(run, 16, STILL, fixed);
    expect(run.crushed).toBe(run.career!.target);
    expect(run.phase).toBe("won");
    expect(run.events.some((e) => e.k === "won")).toBe(true);
  });

  it("THE CONTROL: one short of N is not a win", () => {
    const run = careerRing("garden-1");
    run.crushed = run.career!.target - 2;
    const c = centre(run);
    run.foes.push(foe("runner", c.x, c.y));
    step(run, 16, STILL, fixed);
    expect(run.crushed).toBe(run.career!.target - 1);
    expect(run.phase).toBe("stage");
  });

  it("no warden ever walks into an ordinary level, however many are crushed", () => {
    const run = careerRing("garden-3");
    run.crushed = 10_000;
    run.phase = "stage";
    run.len = 99;
    step(run, 16, STILL, fixed);
    expect(run.foes.some((f) => f.kind === "warden" || f.kind === "mini")).toBe(false);
  });
});

describe("a boss level wins only when the boss falls", () => {
  it("reaching N brings the world's boss, at the level's own health - and is not a win", () => {
    const run = careerRing("garden-boss");
    run.crushed = run.career!.target - 1;
    const c = centre(run);
    run.foes.push(foe("runner", c.x, c.y));
    step(run, 16, STILL, fixed);
    expect(run.phase).toBe("boss");
    const boss = run.foes.find((f) => f.kind === "warden");
    expect(boss?.hp).toBe(snakeLevel("garden-boss").bossHp);
    expect(run.career!.bossUp).toBe(true);
    // ...and crushing more does not win it.
    run.crushed += 50;
    step(run, 16, STILL, fixed);
    expect(run.phase).toBe("boss");
  });

  it("the loop that crushes the boss's last health wins", () => {
    const run = careerRing("garden-boss");
    run.crushed = run.career!.target;
    run.career!.bossUp = true;
    run.phase = "boss";
    const c = centre(run);
    run.foes.push(foe("warden", c.x, c.y, 1));
    step(run, 16, STILL, fixed);
    expect(run.phase).toBe("won");
    expect(run.stage).toBe(1);
  });

  it("only ONE boss comes, and no mini-boss ever does", () => {
    const run = careerRing("desert-boss");
    run.crushed = run.career!.target;
    for (let i = 0; i < 20; i++) step(run, 16, STILL, fixed);
    expect(run.foes.filter((f) => f.kind === "warden")).toHaveLength(1);
    expect(run.foes.some((f) => f.kind === "mini")).toBe(false);
  });
});

describe("what the save brings in", () => {
  it("CRUSH POWER: at 2.0 a brute (two loops) falls to one; at 1.0 it does not", () => {
    for (const [crush, dead] of [[1, false], [2, true]] as const) {
      const run = careerRing("garden-1", { ...PLAIN_STATS, crush });
      const c = centre(run);
      run.foes.push(foe("brute", c.x, c.y));
      step(run, 16, STILL, fixed);
      expect(run.foes.length === 0, `crush ${crush}`).toBe(dead);
    }
  });

  it("crush power on 1.5 is an extra hit every second shape that survives, never a roll", () => {
    const run = careerRing("garden-1", { ...PLAIN_STATS, crush: 1.5 });
    const c = centre(run);
    for (let i = 0; i < 4; i++) run.foes.push(foe("brute", c.x + (i - 1.5) * 8, c.y));
    step(run, 16, STILL, fixed);
    expect(run.foes).toHaveLength(2);
  });

  it("SPEED moves the snake faster and turns it tighter in step, so its loops stay the same size", () => {
    const plain = newCareerRun("garden-1", PLAIN_STATS, ARENA, fixed);
    const fast = newCareerRun("garden-1", { ...PLAIN_STATS, speed: 1.24 }, ARENA, fixed);
    expect(speedOf(fast) / speedOf(plain)).toBeCloseTo(1.24);
    expect(turnOf(fast) / speedOf(fast)).toBeCloseTo(turnOf(plain) / speedOf(plain));
  });

  it("the SHIELD takes the first bump for free, and the second costs", () => {
    const run = careerRing("garden-1", { ...PLAIN_STATS, shield: 1 });
    const len = run.len;
    run.foes.push(foe("runner", run.x, run.y));
    step(run, 16, STILL, fixed);
    expect(run.len).toBe(len);
    expect(run.career!.shield).toBe(0);
    run.blink = 0;
    run.foes = [foe("runner", run.x, run.y)];
    step(run, 16, STILL, fixed);
    expect(run.len).toBeLessThan(len);
  });

  it("LUCK drops gold: 100 points a crush is a coin a shape, picked up at the head", () => {
    const run = careerRing("garden-1", { ...PLAIN_STATS, luck: 100 });
    const c = centre(run);
    run.foes.push(foe("runner", c.x, c.y), foe("runner", c.x + 10, c.y));
    step(run, 16, STILL, fixed);
    expect(run.career!.coins).toHaveLength(2);
    for (const k of run.career!.coins) (k.x = run.x), (k.y = run.y);
    step(run, 16, STILL, fixed);
    expect(run.career!.gold).toBe(2 * run.career!.coin);
    expect(run.events.some((e) => e.k === "gold")).toBe(true);
  });

  it("MAGNET pulls gold from further away", () => {
    const pull = (magnet: number) => {
      const run = careerRing("garden-1", { ...PLAIN_STATS, magnet });
      run.career!.coins.push({ id: 1, x: run.x + 80, y: run.y, value: 1 });
      const x0 = run.career!.coins[0].x;
      step(run, 16, STILL, fixed);
      return x0 - (run.career!.coins[0]?.x ?? run.x);
    };
    expect(pull(1)).toBe(0);
    expect(pull(1.75)).toBeGreaterThan(0);
  });

  it("a won level sweeps the gold still on the floor into the purse", () => {
    const run = careerRing("garden-1");
    run.crushed = run.career!.target - 1;
    run.career!.coins.push({ id: 1, x: 10, y: 10, value: 3 });
    const c = centre(run);
    run.foes.push(foe("runner", c.x, c.y));
    step(run, 16, STILL, fixed);
    expect(run.phase).toBe("won");
    expect(run.career!.gold).toBe(3);
  });

  it("a bump costs the level's own bite, not the quick run's", () => {
    for (const id of ["garden-1", "desert-1", "cave-3"]) {
      const run = careerRing(id);
      expect(hitCost(run), id).toBe(snakeLevel(id).bite);
    }
  });
});

describe("each twist acts in its own world and nowhere else", () => {
  it("SAND: in the desert the patches drift, and the head in one moves at SAND.slow", () => {
    const run = careerRing("desert-1");
    step(run, 16, STILL, fixed);
    expect(run.career!.sand.length).toBeGreaterThan(0);
    const p = run.career!.sand[0];
    const base = speedOf(run) / run.career!.slow;
    run.x = p.x;
    run.y = p.y;
    step(run, 16, STILL, fixed);
    expect(inSand(run.career!.sand, run.x, run.y)).toBe(true);
    expect(run.career!.slow).toBe(SAND.slow);
    expect(speedOf(run)).toBeCloseTo(base * SAND.slow);
  });

  it("no sand in the garden or the cave, wherever the head goes", () => {
    for (const id of ["garden-2", "cave-2"]) {
      const run = careerRing(id);
      for (let i = 0; i < 30; i++) {
        run.x = 60 + i * 37;
        run.y = 80 + i * 29;
        step(run, 16, STILL, fixed);
        expect(run.career!.sand, id).toEqual([]);
        expect(run.career!.slow, id).toBe(1);
      }
    }
  });

  it("DARK: only the cave has a light around the head", () => {
    for (const l of SNAKE_LEVELS) {
      const run = newCareerRun(l.id, PLAIN_STATS, ARENA, fixed);
      if (l.world === "cave") expect(run.career!.light, l.id).toBeGreaterThan(0);
      else expect(run.career!.light, l.id).toBe(0);
    }
  });
});

describe("no level can stall", () => {
  it("every level keeps sending shapes: a finite gap and room on the floor, at every point of the level", () => {
    for (const l of SNAKE_LEVELS) {
      const run = newCareerRun(l.id, PLAIN_STATS, ARENA, fixed);
      for (const share of [0, 0.5, 1, 3]) {
        run.crushed = Math.round(l.target * share);
        const gap = spawnEvery(run);
        expect(gap, l.id).toBeGreaterThan(0);
        expect(gap, l.id).toBeLessThan(5000);
      }
      expect(l.cap, l.id).toBeGreaterThanOrEqual(6);
    }
  });

  it("a snake left alone still dies - the crowd keeps coming and biting", () => {
    const run = newCareerRun("garden-1", PLAIN_STATS, ARENA, mulberry32(3));
    const rng = mulberry32(3);
    while (run.phase !== "dead" && run.t < 240_000) step(run, 25, STILL, rng);
    expect(run.phase).toBe("dead");
  });
});

describe("what a finished level reports", () => {
  it("hearts left out of 8, the gold picked up, and won or not", () => {
    const run = careerRing("garden-1");
    run.career!.gold = 7;
    run.phase = "won";
    expect(careerResult(run)).toEqual({ level: "garden-1", won: true, hearts: 8, of: 8, gold: 7 });
    run.phase = "dead";
    run.len = 2;
    expect(careerResult(run)).toMatchObject({ won: false, hearts: 0 });
  });
});

describe("the career's goal row (the approved mock: '9/15' and the level, no clock)", () => {
  it("counts toward the target, never past it", () => {
    expect(careerGoal({ target: 15, bossUp: false }, 9, "Boss", "Garden 2")).toEqual({ count: "9/15", head: null, level: "Garden 2" });
    expect(careerGoal({ target: 15, bossUp: false }, 22, "Boss", "Garden 2").count).toBe("15/15");
  });

  it("says BOSS once a boss level's boss is up", () => {
    expect(careerGoal({ target: 25, bossUp: true }, 25, "Boss", "Garden boss")).toEqual({ count: null, head: "Boss", level: "Garden boss" });
  });
});

describe("what the scene draws for a career level (careerScene.ts)", () => {
  /** A pen that only counts its calls, so the layers can be read without Phaser. */
  const pen = () => {
    const calls: string[] = [];
    const rec = (name: string) => () => void calls.push(name);
    return { calls, fillStyle: rec("fillStyle"), fillCircle: rec("fillCircle"), fillTriangle: rec("fillTriangle"), fillPoints: rec("fillPoints"),
      lineStyle: rec("lineStyle"), strokePoints: rec("strokePoints"), strokeCircle: rec("strokeCircle"), clear: rec("clear") };
  };
  const draw = (run: Run) => {
    const l = { low: pen(), coins: pen(), dark: pen() };
    drawCareerLayers(l, run, 0);
    return { low: l.low.calls.filter((c) => c !== "clear").length, coins: l.coins.calls.length, dark: l.dark.calls.filter((c) => c !== "clear").length };
  };

  it("a quick run: the layers are cleared and nothing is drawn", () => {
    expect(draw(newRun("normal", ARENA, fixed))).toEqual({ low: 0, coins: 0, dark: 0 });
  });

  it("the desert draws sand and no dark; the cave draws dark and no sand; the garden neither", () => {
    const at = (id: string) => {
      const run = careerRing(id);
      step(run, 16, STILL, fixed);
      return draw(run);
    };
    expect(at("desert-1").low).toBeGreaterThan(0);
    expect(at("desert-1").dark).toBe(0);
    expect(at("cave-1").dark).toBeGreaterThan(0);
    expect(at("cave-1").low).toBe(0);
    expect(at("garden-1")).toEqual({ low: 0, coins: 0, dark: 0 });
  });
});
