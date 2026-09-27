import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

/**
 * The footer strip under Snake's board, pinned as SOURCE.
 *
 * Measured 2026-08-30 on the bundle published to itch: the strip read
 * "Tap to start", was a white rounded card with bold centred text sitting
 * directly under the board - and two taps on it did nothing. Only a tap on the
 * CANVAS started the game. On a phone that strip is the most button-looking
 * thing on the screen, and it was the one thing that was not a button.
 *
 * The strip says three things and only two are instructions: "Tap to start"
 * (ready) and "Game over - tap to play again" (over) ASK; "Buttons, swipe or
 * arrow keys" (playing) TELLS. So it is a real `<button>` while it asks and a
 * plain line of text while it tells, rather than one shape doing both.
 *
 * Source rather than render: vitest runs `environment: "node"` here and this
 * component boots Phaser inside an effect, so it cannot be mounted in this
 * suite at all - the same reason `game-chrome-pause.test.ts` reads its file.
 */

const GAME = readFileSync(new URL("./SnakeGame.tsx", import.meta.url), "utf8");
const SCENE = readFileSync(new URL("./SnakeScene.ts", import.meta.url), "utf8");

const CARDS = readFileSync(new URL("./SnakeCards.tsx", import.meta.url), "utf8");
const code = (t: string) => t.replace(/\/\*[\s\S]*?\*\//g, "").replace(/\/\/[^\n]*/g, "");

/**
 * The START CARD. Its markup lives in SnakeCards.tsx; its wiring - which
 * scene method each button calls - lives in SnakeGame.tsx. Both halves are
 * read, because a button can be a real button and still call the wrong thing.
 *
 * Since 2026-09-26 the instruction is a card over the board rather than a strip
 * under it; since 2026-09-27 it offers two boards. The rule this file exists
 * for is unchanged - the thing that says "tap" must answer a tap.
 */
function startCardMarkup(): string {
  const at = CARDS.indexOf("snake-start-card");
  expect(at, "the start card moved - this whole file is reading the wrong text").toBeGreaterThan(0);
  return CARDS.slice(CARDS.lastIndexOf("export function StartCard", at), CARDS.indexOf("</section>", at));
}

/** The `startOn` helper both start buttons go through. */
function startOn(): string {
  const at = GAME.indexOf("const startOn = ");
  expect(at, "the start buttons must share one path into the scene").toBeGreaterThan(0);
  return GAME.slice(at, GAME.indexOf("};", at));
}

describe("the card that asks the player to tap", () => {
  it("is real buttons - both of them", () => {
    const card = code(startCardMarkup());
    expect(card.match(/<button/g)?.length, "Play and Today's board are both instructions").toBe(2);
    expect(card, "never disable it").not.toMatch(/\bdisabled[=}]/);
  });

  it("asks the SCENE to start, never to restart", () => {
    // Anchored on the `?.`: `restartFromChrome()` CONTAINS `startFromChrome()`,
    // so an unanchored check passes when the button calls restart instead -
    // that mutation SURVIVED this file's first mutation run.
    expect(startOn(), "the canvas is this game's single owner of input").toContain("?.startFromChrome()");
    expect(startOn(), "restart on the READY screen throws the board away").not.toContain("?.restartFromChrome()");
    const from = GAME.indexOf("<StartCard");
    const wired = GAME.slice(from, GAME.indexOf("/>", from));
    expect(wired).toContain('onPlay={() => startOn("classic")}');
    expect(wired).toContain('onToday={() => startOn("today")}');
  });

  it("exists only while the words are an instruction", () => {
    // The ready screen and nowhere else. Mid-run there is nothing to ask, and
    // after a game over the game-over card asks instead.
    expect(GAME).toMatch(/status\.phase === "ready" && \(\s*<StartCard/);
  });

  it("no strip under the board asks anything any more", () => {
    const start = GAME.indexOf("footer={");
    expect(start).toBeGreaterThan(0);
    const footer = GAME.slice(start, GAME.indexOf("<ControlModePicker", start));
    expect(footer, "a leftover strip would be a second start button").not.toContain("<button");
  });

  it("does not fork the start logic - the card walks the canvas's path", () => {
    // ANCHORED on the newline and indent. `restartFromChrome` CONTAINS
    // `startFromChrome` as a substring, so an unanchored indexOf finds the
    // wrong method and reads its one-line body - which it did, on the first
    // run of this file, and reported a real method as missing its calls.
    const start = SCENE.indexOf("\n  startFromChrome() {");
    expect(start, "the scene must expose startFromChrome").toBeGreaterThan(0);
    const body = SCENE.slice(start, SCENE.indexOf("\n  }", start));
    // Since 2026-09-27 every input - a canvas tap included - goes through ONE
    // method, `press`, as a CONFIRM. So the card is the canvas tap by
    // construction, and `press` is what must unlock, respect the pause cover,
    // and restart a finished run.
    expect(body).toContain('this.press({ kind: "confirm" });');
    expect(body, "and it must respect the pause cover, like every other entry point").toContain(
      "if (this.paused) return;",
    );
    const at = SCENE.indexOf("\n  private press(");
    expect(at, "the scene must have press").toBeGreaterThan(0);
    const press = SCENE.slice(at, SCENE.indexOf("\n  }\n", at));
    for (const call of ["audio.unlock()", "speech.unlock()", "this.restart()"]) {
      expect(press, `press must ${call} for a card exactly as for a canvas tap`).toContain(call);
    }
    expect(SCENE, "and the canvas tap is that same confirm").toContain(
      'return this.press({ kind: "confirm" });',
    );
  });

  it("the chrome's view of the scene names the method it calls", () => {
    // A ref typed as the scene's public surface is the only thing standing
    // between the chrome and a method that does not exist; tsc catches a
    // missing name, nothing catches a name that was never added.
    const iface = GAME.slice(GAME.indexOf("useRef<{"), GAME.indexOf("} | null>(null)"));
    expect(iface).toContain("startFromChrome");
  });
});
