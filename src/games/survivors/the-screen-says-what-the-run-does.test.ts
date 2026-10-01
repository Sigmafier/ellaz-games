// What the SCREEN shows, pinned where a test can reach it.
//
// WHY A SOURCE SCAN. Nothing in this repo can drive a Phaser scene, and the
// React chrome that draws the cards needs one to render - so the four changes
// the operator asked for on 2026-09-22 were verified by loading the built game
// in a browser and looking. That is the right check and it is not a repeatable
// one: it cannot run in CI, and it says nothing tomorrow.
//
// These assertions are the cheap half that CAN run every time. They do not
// prove the screen looks right; they prove the specific thing that was wrong is
// still gone, which is the failure mode a re-write would reintroduce.
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const chrome = readFileSync(new URL("./SurvivorsGame.tsx", import.meta.url), "utf8");
const scene = readFileSync(new URL("./SurvivorsScene.ts", import.meta.url), "utf8");
const arcade = readFileSync(new URL("../../ui/ArcadeChrome.tsx", import.meta.url), "utf8");
// The starting weapon is picked on its own screen since 2026-09-30 (the whole
// collection, in rarity frames), so the rule about its colours reads that file.
const pick = readFileSync(new URL("./entrance/WeaponPick.tsx", import.meta.url), "utf8");

describe("the cards say a level the way every other card says a count", () => {
  it("a weapon LEVEL card draws pips, and never the words 1 -> 2", () => {
    // Operator ruling: *"Some upgrades show like 1->2. Can u do them with the
    // bullets?"*. The arrow is what has to be absent - a pip row added beside a
    // surviving arrow would look right in a diff and wrong on a phone.
    expect(chrome).not.toContain("&rarr;");
    expect(chrome).not.toMatch(/\{card\.to - 1\}/);
    // And the row is built from the rules' own cap, so a retune redraws it.
    expect(chrome).toMatch(/Array\.from\(\{ length: WEAPON_LV_MAX \}/);
  });

  it("THE CONTROL: the pip row the UPGRADE cards already had is still there", () => {
    // Without this the assertions above are satisfied by a file that lost both
    // rows. Two different lengths, so this cannot be the same line twice.
    expect(chrome).toMatch(/Array\.from\(\{ length: cap \}/);
  });
});

describe("the entrance tells the weapons apart", () => {
  it("a starter button is drawn in its own weapon's ink, not the shared cyan", () => {
    // Operator: *"The start icons in the beginning should be different color
    // than the other buttons"*. `#22e7ff` is the entrance's own cyan and is
    // still correct on the upgrade cards; what must not come back is a STARTER
    // button hard-coded to it.
    // NAMED DECLARATIONS, never a slice of the file.
    //
    // The first version of this cell took 2,200 characters from `{STARTERS.map(`
    // and asserted the cyan was not in them. It could not fail: the comment
    // explaining the change pushed the `border` line past the window, so the
    // window held the map and none of the styling. Planting the cyan back
    // SURVIVED. It is this repo's most-collected instrument fault - a check that
    // truncates away the thing it is checking - met again in a test written to
    // catch a regression.
    //
    // 2026-09-30: the three starter buttons became five cards on the weapon
    // pick. The FRAME is the rarity's now (grey, blue, gold - a word on the
    // ribbon says it too), so what carries the weapon's own ink is the picture
    // and the picked card's glow. Those are what is pinned: the colour a player
    // picks is still the colour they then see leaving the robot.
    expect(pick).toContain("const ink = WEAPON_INK_CSS[id];");
    expect(pick).toContain('style={{ display: "flex", color: ink, opacity: locked ? 0.5 : 1');
    expect(pick).toContain("boxShadow: props.on ? `0 0 0 3px #ffffff, 0 0 22px ${ink}8c");
    // And the old row is gone from the quick run's result screen - one pick, one place.
    expect(chrome).not.toContain("STARTERS.map(");
  });

  it("THE CONTROL: planting the shared cyan on the picture turns it red", () => {
    const planted = pick.replace('color: ink, opacity: locked', 'color: "#22e7ff", opacity: locked');
    expect(planted).not.toBe(pick);
    expect(planted).not.toContain('style={{ display: "flex", color: ink, opacity: locked ? 0.5 : 1');
  });
});

describe("the steering is one stick", () => {
  it("the corner style and its picker are gone", () => {
    // Operator: *"Lets remove the joystick/on screen buttons and just do the on
    // screen"*. `kids-games-keep-the-pad.test.ts` holds the other half - that
    // survivors still HAS a stick and is not in the kids band.
    expect(chrome).not.toContain("setStickStyle");
    expect(chrome).not.toContain("stickCorner");
    expect(scene).not.toContain("StickStyle");
  });
});

describe("the health is hearts", () => {
  it("the arcade HUD draws one heart per point, not a proportion", () => {
    // A bar cannot say "three of four" - two of three and four of six draw the
    // same rectangle. The count is what a player glances at.
    expect(arcade).toMatch(/const hearts = \(now: number, max: number\)/);
    expect(arcade).toMatch(/length: Math\.max\(0, max\)/);
    // The bar helper SURVIVES, and that is deliberate: the boss's health really
    // is a proportion. This is the line that catches a sweep deleting both.
    expect(arcade).toMatch(/const bar = \(fraction: number/);
    expect(arcade).toContain("bar(bossLeft");
  });
});
