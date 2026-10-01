import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

/**
 * The tutorial's chrome, pinned as SOURCE: this suite runs in node and the game
 * boots Phaser inside an effect, so it cannot be mounted here (the same reason
 * snake's strip test reads its file).
 *
 * The rule it holds is the house one: a thing that asks to be pressed IS a
 * button, and a thing that only tells the player what to do with the snake is
 * not one and must not look like one.
 */

const code = (t: string) => t.replace(/\/\*[\s\S]*?\*\//g, "").replace(/\/\/[^\n]*/g, "").replace(/\{\/\*[\s\S]*?\*\/\}/g, "");
const BANNER = code(readFileSync(new URL("./TutorialBanner.tsx", import.meta.url), "utf8"));
const GAME = code(readFileSync(new URL("./SnakeSurvivorsGame.tsx", import.meta.url), "utf8"));
const SCENE = code(readFileSync(new URL("./SnakeSurvivorsScene.ts", import.meta.url), "utf8"));

describe("the tutorial's words and its Skip", () => {
  it("Skip is the banner's one button, and it ends the tutorial", () => {
    expect(BANNER.match(/<button/g)?.length).toBe(1);
    expect(BANNER).toContain("onClick={onSkip}");
    expect(GAME).toContain("onSkip={() => sceneRef.current?.endTutorial()}");
    expect(BANNER, "never disabled").not.toMatch(/\bdisabled[=}]/);
  });

  it("the step line takes no pointer, so a thumb on it still steers the snake", () => {
    // The wrapper refuses pointers; only the button takes them back.
    expect(BANNER).toMatch(/pointerEvents: "none"/);
    expect(BANNER.match(/pointerEvents: "auto"/g)?.length).toBe(1);
  });

  it("is drawn on every step but done, over the card screen too", () => {
    expect(GAME).toMatch(/const tutoring = status\.tutorial !== null && status\.tutorial !== "done";/);
    expect(GAME).toMatch(/\{tutoring && [^\n]*\(\s*<TutorialBanner/);
    expect(GAME.indexOf("<TutorialBanner")).toBeLessThan(GAME.indexOf("{choosing && ("));
    expect(BANNER).toMatch(/zIndex: 2/);
  });
});

describe("How to play", () => {
  it("is a real button on the title, and it starts the tutorial", () => {
    // Since 2026-10-01 it is the title card's quiet link (`secondary`), which
    // the shared card draws as a <button> - no longer an `extra` on a second card.
    const at = GAME.indexOf("secondary: {");
    expect(at).toBeGreaterThan(0);
    const link = GAME.slice(at, GAME.indexOf("},", at));
    expect(link).toContain("?.startTutorial()");
    const CARD = code(readFileSync(new URL("../../ui/ArcadeTitle.tsx", import.meta.url), "utf8"));
    expect(CARD).toMatch(/const linkButton = link && !linkAsPill && \(\s*<button type="button" onClick=\{link\.onPress\}/);
  });
});

describe("the scene", () => {
  it("runs the practice run through the tutorial module, never the real step", () => {
    expect(SCENE).toMatch(/if \(this\.tut\) tickTutorial\(this\.tut, dt, this\.steer\(\), this\.rng\);\s*else step\(/);
  });

  it("offers the tutorial on a first Play only, and remembers it through the save store", () => {
    expect(SCENE).toMatch(/this\.phase === "ready" && !this\.tutorialDone && !hasSeenTutorial\(this\.ctx\.storage\)/);
    expect(SCENE).toContain("markTutorialSeen(this.ctx.storage)");
  });

  it("starts the real run from the fresh run leaveTutorial hands back", () => {
    expect(SCENE).toContain("this.restart(leaveTutorial(this.tut, this.level, this.arena, this.rng))");
  });

  it("a restart drops the tutorial, like everything else the input is gated on", () => {
    const at = SCENE.indexOf("private restart(");
    expect(SCENE.slice(at, SCENE.indexOf("}", at))).toContain("this.tut = null");
  });
});
