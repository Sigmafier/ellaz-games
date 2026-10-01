import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";

/**
 * Snake Survivors' ONE screen (operator, 2026-10-01, approved off the "one-
 * screen start, all four" mock): the title art stays and gains Calm / Normal /
 * Wild above one big PLAY (replacing Tap to start), How to play is a small
 * link, and there is NO second, plain card after it. Game over is its own card
 * in the title's style. The rules (which screen, the latch, the hint's 3 s) are
 * in screens.test.ts; these are the wiring, as source assertions with their
 * mutations, the way tutorial-chrome.test.ts does it.
 *
 * REPLACES the 2026-09-30 pins ("the title is up until Tap to start", "today's
 * entrance waits behind it") - the two-screen flow they held is the one the
 * operator asked to remove.
 */

const code = (t: string) => t.replace(/\/\*[\s\S]*?\*\//g, " ").replace(/\/\/[^\n]*/g, " ").replace(/\{\/\*[\s\S]*?\*\/\}/g, " ");
const GAME = code(readFileSync(new URL("./SnakeSurvivorsGame.tsx", import.meta.url), "utf8"));
const TITLE = code(readFileSync(new URL("./SnakeTitle.tsx", import.meta.url), "utf8"));

describe("one screen: the title IS the entrance", () => {
  const oneScreen = (s: string) => /screen === "title"\s*\?\s*\{/.test(s) && /entrance=\{entrance\}/.test(s);

  it("the chrome's entrance is the title before a run, and nothing gates it behind a first tap", () => {
    expect(oneScreen(GAME)).toBe(true);
    expect(GAME).not.toMatch(/\btitled\b/);
    expect(GAME).not.toMatch(/<SnakeTitle\b/);
  });

  it("FIRES if a first-tap gate comes back", () => {
    const m = GAME.replace("entrance={entrance}", "entrance={titled ? entrance : null}");
    expect(m).not.toBe(GAME);
    expect(m).toMatch(/\btitled\b/);
  });

  it("PLAY starts the run; How to play starts the guided run", () => {
    const title = GAME.slice(GAME.indexOf('screen === "title"'), GAME.indexOf('screen === "over"'));
    expect(title).toContain("onAction: () => sceneRef.current?.startFromChrome()");
    expect(title).toMatch(/secondary: \{ label: HOW_TO, icon: HOW_ICON, onPress: \(\) => sceneRef\.current\?\.startTutorial\(\) \}/);
    expect(title).toContain("children: art");
  });

  it("the game-over card is its own card in the title's style, with PLAY AGAIN", () => {
    const over = GAME.slice(GAME.indexOf('screen === "over"'), GAME.indexOf(": null;", GAME.indexOf('screen === "over"')));
    expect(over).toContain('layout: "stack"');
    expect(over).toContain("action: T.playAgain");
    expect(over).toContain("again: true");
    expect(over).toContain("ribbon: shown.newBest ? T.ribbon : undefined");
  });

  it("the art module draws no button of its own", () => {
    expect(TITLE).not.toMatch(/<button\b/);
    expect(TITLE).toContain("export function SnakeTitleArt");
  });
});

describe("the controls line", () => {
  it("is drawn only while a real run is live, and fades on the pure rule", () => {
    expect(GAME).toContain("const live = status.phase === \"playing\" && !tutoring;");
    expect(GAME).toContain("const hintOn = runAt !== null && hintVisible(Date.now() - runAt);");
    expect(GAME).toMatch(/\{live && !choosing && \(\s*<div\s+data-hint="controls"/);
  });

  it("is a picture, never a control", () => {
    const at = GAME.indexOf('data-hint="controls"');
    const block = GAME.slice(at, GAME.indexOf("{T.hint}", at));
    expect(block).toContain('pointerEvents: "none"');
    expect(block).not.toContain("<button");
  });
});

describe("the words", () => {
  const DASHES = new RegExp("[\\u2013\\u2014\\u2015]");
  it("the new heading and ribbon exist in all four languages, with no long dashes", () => {
    expect(GAME.split('youWin: "').length - 1).toBe(4);
    expect(GAME.split('ribbon: "').length - 1).toBe(4);
    expect(DASHES.test(GAME + TITLE)).toBe(false);
  });
});
