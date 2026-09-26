// The home's Toybox links are a hand-kept mirror of studio/games/hub-games.ts
// (the app may not import the studio - assert-boundary refuses it), so this
// reads the hub's source and holds the two equal: same games, same order, same
// campaign ids. A wrong campaign id is a link to a page that cannot load its
// levels, and a missing `?campaign=` opened a bare versus match from the home
// for four days (2026-09-22 to 26) with every gate green.
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { TOYBOX_GAMES } from "./ToyboxRow";
import { toyboxGameHref } from "./paths";

const HUB = readFileSync(resolve(__dirname, "../../studio/games/hub-games.ts"), "utf8");
const hub = [...HUB.matchAll(/\{ dir: "([\w-]+)", title: "([^"]+)".*?campaignId: "([\w-]+)"/g)].map((m) => [m[1], m[3], m[2]]);

describe("the home's Toybox games are the hub's", () => {
  it("reads a real population off the hub", () => {
    expect(hub.length).toBeGreaterThanOrEqual(4);
  });

  it("names the same games, in order, with the same campaigns and titles", () => {
    expect(TOYBOX_GAMES).toEqual(hub);
  });

  it("links every one to its campaign, never the bare page", () => {
    for (const [dir, campaign] of TOYBOX_GAMES) {
      expect(toyboxGameHref(dir, campaign)).toMatch(new RegExp(`toybox/games/${dir}/page/index\\.html\\?campaign=${campaign}$`));
    }
  });

  it("each campaign it names exists in that game's data", () => {
    for (const [dir, campaign] of TOYBOX_GAMES) {
      expect(() => readFileSync(resolve(__dirname, `../../studio/games/${dir}/data/campaign/${campaign}.json`))).not.toThrow();
    }
  });
});
