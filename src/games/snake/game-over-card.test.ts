import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { overCard, bodyColor } from "./draw";
import type { SnakeStatus } from "./SnakeScene";

/**
 * The game-over card and the score band, answering a Phaser-forum review of
 * 2026-09-26 sentence by sentence:
 *
 *   "If I die, what's my last and highest scores?"   -> the card
 *   "Interface looks like not a part of the game."   -> the band on the board
 *
 * Before this the canvas printed "Game over / Score: N / Tap to play again"
 * and the best lived in a cream stat card above the board, in 10.5px, as
 * "Best 0". Source-read for the component half, for the same reason as
 * `a-strip-that-says-tap-must-be-tappable.test.ts`: this suite runs in node and
 * the component boots Phaser.
 */

const GAME = readFileSync(new URL("./SnakeGame.tsx", import.meta.url), "utf8");
const SCENE = readFileSync(new URL("./SnakeScene.ts", import.meta.url), "utf8");
const code = (s: string) => s.replace(/\/\*[\s\S]*?\*\//g, "").replace(/\/\/[^\n]*/g, "");

const base: SnakeStatus = {
  score: 23,
  level: 5,
  speed: "normal",
  phase: "over",
  paused: false,
  best: 41,
  newBest: false,
};

describe("the game-over card", () => {
  it("exists only once the run is over", () => {
    expect(overCard({ ...base, phase: "ready" })).toBeNull();
    expect(overCard({ ...base, phase: "playing" })).toBeNull();
    expect(overCard(base)).not.toBeNull();
  });

  it("says the run's score AND the best - the reviewer's exact question", () => {
    expect(overCard(base)).toEqual({ score: 23, best: 41, newBest: false });
  });

  it("calls it a new best only when the score port said so", () => {
    expect(overCard({ ...base, score: 50, best: 50, newBest: true })?.newBest).toBe(true);
    // Equal to the record is not a new one: the port answers that, not us.
    expect(overCard({ ...base, score: 41, best: 41, newBest: false })?.newBest).toBe(false);
  });

  it("never shows a best lower than the score it sits beside", () => {
    // The best is read once at mount and a record is only reported at death,
    // so a stale best is one missed update away. The card cannot print one.
    expect(overCard({ ...base, score: 60, best: 41 })?.best).toBe(60);
  });

  it("is a real button, walking the canvas's own path", () => {
    const at = GAME.indexOf("snake-over-card");
    expect(at, "the card must be rendered, and named").toBeGreaterThan(0);
    const card = code(GAME.slice(at, GAME.indexOf("</section>", at)));
    expect(card).toContain("<button");
    // Anchored on `?.` - `restartFromChrome` CONTAINS `startFromChrome`.
    expect(card, "Play again goes through the scene, like a canvas tap").toContain(
      "?.startFromChrome()",
    );
    expect(card).not.toContain("?.restartFromChrome()");
    expect(card, "never disabled").not.toMatch(/\bdisabled[=}]/);
  });

  it("Play again starts the next run, it does not stop on a ready screen", () => {
    // A canvas tap on the game-over screen restarts on pointerdown and starts
    // on pointerup - one tap, moving snake. The card's button must do the same
    // in one press, so startFromChrome restarts AND starts when the run is over.
    const start = SCENE.indexOf("\n  startFromChrome() {");
    const body = SCENE.slice(start, SCENE.indexOf("\n  }", start));
    // Only the over BRANCH, up to its own `return` - the start that follows
    // the branch is the ready path, and reading past the return let a planted
    // "restart and stop" survive on the first mutation run.
    const from = body.indexOf('this.phase === "over"');
    expect(from).toBeGreaterThan(0);
    const over = body.slice(from, body.indexOf("return;", from));
    expect(over.indexOf("this.restart()")).toBeGreaterThan(0);
    expect(over.indexOf("this.startPlaying()")).toBeGreaterThan(over.indexOf("this.restart()"));
  });
});

describe("the score band", () => {
  it("is part of the board, and the cream stat cards are gone", () => {
    expect(GAME, "the band must be rendered, and named").toContain("snake-band");
    const stats = GAME.slice(GAME.indexOf("stats={"), GAME.indexOf("levels={"));
    expect(code(stats), "score and stage live on the board now, not in the page's cards").not.toMatch(
      /status\.(score|level)/,
    );
  });
});

describe("the body colour", () => {
  it("runs from the head's mint to the tail's violet", () => {
    expect(bodyColor(0)).toBe(0x55efc4);
    expect(bodyColor(1)).toBe(0x6c5ce7);
    const mid = bodyColor(0.5);
    expect(mid).not.toBe(bodyColor(0));
    expect(mid).not.toBe(bodyColor(1));
  });

  it("clamps, so a one-segment snake or a rounding slip cannot draw black", () => {
    expect(bodyColor(-1)).toBe(bodyColor(0));
    expect(bodyColor(2)).toBe(bodyColor(1));
    expect(bodyColor(Number.NaN)).toBe(bodyColor(0));
  });
});
