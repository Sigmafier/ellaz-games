import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";

/**
 * Snake Survivors' TITLE (operator, 2026-09-30, approved off a mock): the neon
 * snake closing its loop round a crowd, the name, "Circle them. Close the
 * loop.", one Tap to start and a small How to play. After Tap to start, the
 * entrance it has today - difficulty, Play, How to play - carries on unchanged.
 *
 * Source assertions with their mutations, as tutorial-chrome.test.ts does.
 */

const code = (t: string) => t.replace(/\/\*[\s\S]*?\*\//g, " ").replace(/\/\/[^\n]*/g, " ").replace(/\{\/\*[\s\S]*?\*\/\}/g, " ");
const GAME = code(readFileSync(new URL("./SnakeSurvivorsGame.tsx", import.meta.url), "utf8"));
const TITLE = code(readFileSync(new URL("./SnakeTitle.tsx", import.meta.url), "utf8"));

describe("the game opens on its title", () => {
  const gated = (s: string) => /entrance=\{\s*titled && asking && !choosing/.test(s);

  it("the title is up until Tap to start", () => {
    expect(GAME).toMatch(/const \[titled, setTitled\] = useState\(false\);/);
    expect(GAME).toMatch(/\{!titled && \(\s*<SnakeTitle/);
  });

  it("today's entrance waits behind it, gated the way it was", () => {
    expect(gated(GAME)).toBe(true);
  });

  it("FIRES if the entrance stops waiting", () => {
    const m = GAME.replace("titled && asking && !choosing", "asking && !choosing");
    expect(m).not.toBe(GAME);
    expect(gated(m)).toBe(false);
  });

  it("Tap to start reveals the entrance; How to play starts the guided run", () => {
    expect(GAME).toMatch(/onStart=\{\(\) => setTitled\(true\)\}/);
    expect(GAME).toMatch(/onHow=\{\(\) => \{\s*setTitled\(true\);\s*sceneRef\.current\?\.startTutorial\(\);\s*\}\}/);
  });

  it("the title is the shared shell and draws no button of its own", () => {
    expect(TITLE).toContain("<ArcadeTitle");
    expect(TITLE).not.toMatch(/<button\b/);
    expect(TITLE).toMatch(/secondary=\{\{/);
  });
});

describe("the words", () => {
  it("Tap to start exists in all four languages, with no long dashes", () => {
    expect(GAME.split("tap: \"").length - 1).toBe(4);
    expect(new RegExp("[\\u2013\\u2014\\u2015]").test(GAME + TITLE)).toBe(false);
  });
});
