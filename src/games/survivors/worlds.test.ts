// The career's worlds as DATA: the campaign the map draws, and each level's own
// rules. Pinned here so a retune is a visible diff and a renamed id is a red.
import { describe, expect, it } from "vitest";
import { campaignProblems, nodesOf } from "../../shared/career/campaign";
import { BOSS_KINDS } from "./enemies";
import { LEVELS, NEON_CAMPAIGN, WORLDS, levelRow, worldRow } from "./worlds";

// IDS ARE FOREVER: the save records stars against them. A rename is a level every
// player has lost, so the list is written out rather than derived.
const IDS = [
  "city-1", "city-2", "city-3", "city-boss",
  "frost-1", "frost-2", "frost-3", "frost-boss",
  "lava-1", "lava-2", "lava-3", "lava-boss",
];

describe("the campaign the map draws", () => {
  it("is three worlds of three levels and a boss, and the kit can play it", () => {
    expect(campaignProblems(NEON_CAMPAIGN)).toEqual([]);
    expect(nodesOf(NEON_CAMPAIGN).map((n) => n.id)).toEqual(IDS);
    expect(NEON_CAMPAIGN.worlds.map((w) => w.scenery)).toEqual(["city", "frost", "lava"]);
  });

  it("every map node has exactly one row of rules, in the same order", () => {
    expect(LEVELS.map((l) => l.id)).toEqual(IDS);
    for (const id of IDS) expect(levelRow(id).id).toBe(id);
    expect(() => levelRow("city-4")).toThrow(/no level/);
  });
});

describe("each world is its own place", () => {
  it("one twist each, one boss each, and the boss is the one the quick run already has", () => {
    expect(WORLDS.map((w) => w.twist)).toEqual(["lights", "ice", "pools"]);
    expect(WORLDS.map((w) => w.boss)).toEqual(["warden", "queen", "golem"]);
  });

  it("the swarm never contains a boss, and something is there from the first second", () => {
    for (const w of WORLDS) {
      expect(w.mix.some(([, at]) => at === 0), `${w.id} opens on an empty board`).toBe(true);
      for (const [kind] of w.mix) expect(BOSS_KINDS, `${w.id} spawns a ${kind}`).not.toContain(kind);
    }
  });

  it("the three mixes are different crowds", () => {
    const sig = WORLDS.map((w) => w.mix.map(([k]) => k).sort().join(","));
    expect(new Set(sig).size).toBe(3);
  });
});

describe("difficulty climbs by world and by level", () => {
  it("each world asks more of its shapes than the one before", () => {
    const tiers = ["calm", "normal", "wild"];
    expect(WORLDS.map((w) => tiers.indexOf(w.base))).toEqual([0, 1, 2]);
    const first = (world: string) => LEVELS.find((l) => l.world === world)!;
    // Frost's crowd comes faster than the city's, and lava's is tougher than both.
    expect(first("lava").spawnMs).toBeLessThan(first("frost").spawnMs);
    expect(first("lava").hp).toBeGreaterThan(first("frost").hp);
    // Each world pays more per coin, because it costs more to earn one.
    expect(WORLDS.map((w) => w.coin)).toEqual([1, 2, 3]);
  });

  it("inside a world, level 2 is harder than 1 and 3 harder than 2", () => {
    for (const w of WORLDS) {
      const [a, b, c] = LEVELS.filter((l) => l.world === w.id && !l.boss);
      for (const [lo, hi] of [[a, b], [b, c]]) {
        expect(hi.timeMs, `${hi.id} is not longer`).toBeGreaterThanOrEqual(lo.timeMs);
        expect(hi.spawnMs, `${hi.id} does not spawn faster`).toBeLessThan(lo.spawnMs);
        expect(hi.hp, `${hi.id} shapes are not tougher`).toBeGreaterThanOrEqual(lo.hp);
      }
    }
  });

  it("a level is about a minute to a minute and a half, longer each world", () => {
    for (const l of LEVELS.filter((x) => !x.boss)) {
      expect(l.timeMs).toBeGreaterThanOrEqual(60_000);
      expect(l.timeMs).toBeLessThanOrEqual(90_000);
    }
    const longest = (world: string) => Math.max(...LEVELS.filter((l) => l.world === world && !l.boss).map((l) => l.timeMs));
    expect(longest("frost")).toBeGreaterThan(longest("city"));
    expect(longest("lava")).toBeGreaterThan(longest("frost"));
  });

  it("worldRow names the world a level id belongs to", () => {
    expect(worldRow("frost-2").id).toBe("frost");
    expect(worldRow("lava-boss").boss).toBe("golem");
  });
});
