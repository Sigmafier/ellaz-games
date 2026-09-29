import { describe, expect, it } from "vitest";
import { campaignProblems, defineCampaign, nodesOf } from "./campaign";
import type { CampaignFile } from "./campaign";
import { TEST_CAMPAIGN } from "./testData";

const clone = (c: CampaignFile): CampaignFile => JSON.parse(JSON.stringify(c)) as CampaignFile;

describe("a campaign is worlds of levels, with a boss last in each world", () => {
  it("accepts a well-formed campaign and hands the same file back", () => {
    expect(campaignProblems(TEST_CAMPAIGN)).toEqual([]);
    expect(defineCampaign(TEST_CAMPAIGN)).toBe(TEST_CAMPAIGN);
  });

  it("flattens to one play order, worlds in order and levels in order", () => {
    const nodes = nodesOf(TEST_CAMPAIGN);
    expect(nodes.map((n) => n.id)).toEqual([
      "city-1", "city-2", "city-3", "city-boss",
      "frost-1", "frost-2", "frost-3", "frost-boss",
      "lava-1", "lava-2", "lava-3", "lava-boss",
    ]);
    expect(nodes.map((n) => n.order)).toEqual(nodes.map((_, i) => i));
    expect(nodes.filter((n) => n.boss).map((n) => n.id)).toEqual(["city-boss", "frost-boss", "lava-boss"]);
  });

  it("numbers a world's ordinary levels from one and gives the boss no number", () => {
    const frost = nodesOf(TEST_CAMPAIGN).filter((n) => n.world === "frost");
    expect(frost.map((n) => n.number)).toEqual([1, 2, 3, null]);
    expect(frost.map((n) => n.worldIndex)).toEqual([1, 1, 1, 1]);
    expect(frost.map((n) => n.index)).toEqual([0, 1, 2, 3]);
  });

  it("refuses a world whose boss is not last", () => {
    const c = clone(TEST_CAMPAIGN);
    c.worlds[1].levels = [c.worlds[1].levels[3], ...c.worlds[1].levels.slice(0, 3)];
    expect(campaignProblems(c).join(" ")).toMatch(/frost.*boss.*last/);
    expect(() => defineCampaign(c)).toThrow(/frost/);
  });

  it("refuses a world with no boss, and a world with two", () => {
    const none = clone(TEST_CAMPAIGN);
    delete none.worlds[0].levels[3].boss;
    expect(campaignProblems(none).join(" ")).toMatch(/city/);
    const two = clone(TEST_CAMPAIGN);
    two.worlds[2].levels[1].boss = true;
    expect(campaignProblems(two).join(" ")).toMatch(/lava/);
  });

  it("refuses a level id used twice anywhere in the campaign, because the save is keyed on it", () => {
    const c = clone(TEST_CAMPAIGN);
    c.worlds[2].levels[0].id = "city-1";
    expect(campaignProblems(c).join(" ")).toMatch(/city-1/);
  });

  it("refuses a repeated world id, an empty world, no worlds, and an id that is not a plain slug", () => {
    const dupe = clone(TEST_CAMPAIGN);
    dupe.worlds[1].id = "city";
    expect(campaignProblems(dupe).length).toBeGreaterThan(0);
    const empty = clone(TEST_CAMPAIGN);
    empty.worlds[0].levels = [];
    expect(campaignProblems(empty).join(" ")).toMatch(/city/);
    expect(campaignProblems({ id: "x", worlds: [] }).length).toBeGreaterThan(0);
    const spaced = clone(TEST_CAMPAIGN);
    spaced.worlds[0].levels[0].id = "City 1";
    expect(campaignProblems(spaced).join(" ")).toMatch(/City 1/);
  });
});
