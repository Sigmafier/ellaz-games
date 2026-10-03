// SNAKE SURVIVORS' CAREER MAP: twelve ids written out by hand, three worlds that
// each end on a boss, crush targets that rise, and one twist per world.
import { describe, expect, it } from "vitest";
import { defineCampaign, nodesOf } from "../../shared/career/campaign";
import { SNAKE_CAMPAIGN, SNAKE_LEVELS, SNAKE_WORLDS, levelNumber, snakeLevel, snakeWorld } from "./careerWorlds";

describe("the career's twelve levels", () => {
  it("are these ids, in this order, forever - the save records stars against them", () => {
    expect(nodesOf(SNAKE_CAMPAIGN).map((n) => n.id)).toEqual([
      "garden-1", "garden-2", "garden-3", "garden-boss",
      "desert-1", "desert-2", "desert-3", "desert-boss",
      "cave-1", "cave-2", "cave-3", "cave-boss",
    ]);
    expect(SNAKE_CAMPAIGN.id).toBe("snake-career");
  });

  it("pass the kit's own checks: every world ends on its boss and only there", () => {
    expect(() => defineCampaign(SNAKE_CAMPAIGN)).not.toThrow();
    for (const w of SNAKE_CAMPAIGN.worlds) {
      expect(w.levels.map((l) => l.boss === true)).toEqual([false, false, false, true]);
    }
  });

  it("each world names its own floor on the map: garden, desert, cave", () => {
    expect(SNAKE_CAMPAIGN.worlds.map((w) => [w.id, w.scenery])).toEqual([["garden", "garden"], ["desert", "desert"], ["cave", "cave"]]);
  });

  it("every boss row brings a boss with real health, and no ordinary row does", () => {
    for (const r of SNAKE_LEVELS) {
      if (r.boss) expect(r.bossHp, r.id).toBeGreaterThan(0);
      else expect(r.bossHp, r.id).toBe(0);
    }
  });
});

describe("the crush targets rise", () => {
  it("inside every world: level 1 < level 2 < level 3", () => {
    for (const w of ["garden", "desert", "cave"]) {
      const t = [1, 2, 3].map((n) => snakeLevel(`${w}-${n}`).target);
      expect(t[0], w).toBeLessThan(t[1]);
      expect(t[1], w).toBeLessThan(t[2]);
    }
  });

  it("across worlds: a world's first level asks more than the last world's third", () => {
    expect(snakeLevel("desert-1").target).toBeGreaterThan(snakeLevel("garden-3").target);
    expect(snakeLevel("cave-1").target).toBeGreaterThan(snakeLevel("desert-3").target);
  });

  it("and the bosses get tougher, world by world", () => {
    expect(snakeLevel("desert-boss").bossHp).toBeGreaterThan(snakeLevel("garden-boss").bossHp);
    expect(snakeLevel("cave-boss").bossHp).toBeGreaterThan(snakeLevel("desert-boss").bossHp);
  });
});

describe("each world's twist", () => {
  it("garden none, desert sand, cave dark", () => {
    expect(SNAKE_WORLDS.map((w) => [w.id, w.twist])).toEqual([["garden", "none"], ["desert", "sand"], ["cave", "dark"]]);
  });

  it("later worlds pay more for a coin and a clear", () => {
    expect(snakeWorld("desert-1").coin).toBeGreaterThan(snakeWorld("garden-1").coin);
    expect(snakeWorld("cave-1").bonus).toBeGreaterThan(snakeWorld("desert-1").bonus);
  });
});

describe("lookups", () => {
  it("a level's number in its world, and none for the boss", () => {
    expect(["garden-1", "desert-2", "cave-3", "cave-boss"].map(levelNumber)).toEqual([1, 2, 3, null]);
  });

  it("an id the career does not have is refused at the call", () => {
    expect(() => snakeLevel("garden-4")).toThrow(/no level "garden-4"/);
  });
});
