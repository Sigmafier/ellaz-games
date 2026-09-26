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

/**
 * The START CARD, from its opening to its `</section>`.
 *
 * Since 2026-09-26 the instruction is no longer a strip under the board: it is
 * a card over it, beside the game-over card, so the score band on top of the
 * board costs the phone frame nothing. The rule this file exists for is
 * unchanged - the thing that says "Tap to start" must answer a tap - so the
 * file follows the words to where they now live.
 */
function startCard(): string {
  const at = GAME.indexOf("snake-start-card");
  expect(at, "the start card moved - this whole file is reading the wrong text").toBeGreaterThan(0);
  return GAME.slice(GAME.lastIndexOf("{", at), GAME.indexOf("</section>", at));
}

describe("the card that asks the player to tap", () => {
  it("is a real button, and its handler is the scene's", () => {
    const card = startCard();
    expect(card, "the instruction must be a <button>, not a <div> that looks like one").toContain(
      "<button",
    );
    // Anchored on the `?.`, for the THIRD time in this file's short life:
    // `restartFromChrome()` contains `startFromChrome()`, so an unanchored
    // check passes when the button calls restart instead of start. That
    // mutation SURVIVED the first mutation run and nothing else caught it.
    expect(
      card,
      "the button must ask the SCENE to start - the canvas is this game's single owner of input",
    ).toContain("?.startFromChrome()");
    expect(
      card,
      "and it must be start, not restart - restart on the READY screen throws the board away",
    ).not.toContain("?.restartFromChrome()");
  });

  it("exists only while the words are an instruction", () => {
    // Drawn on the ready screen and nowhere else. Mid-run there is nothing to
    // ask, and after a game over the game-over card asks instead - a second
    // button there would be two controls doing one thing.
    const at = GAME.indexOf("snake-start-card");
    const guard = GAME.slice(GAME.lastIndexOf("{", GAME.lastIndexOf("<section", at)) - 60, at);
    expect(guard, "the card must be gated on the ready phase").toContain('status.phase === "ready" &&');
    // `disabled` is reserved for the genuinely impossible (CLAUDE.md). Strip
    // comments first: prose explaining why it is not disabled is not a
    // violation, and a bare scan read it as one on this file's first run.
    const code = startCard().replace(/\/\*[\s\S]*?\*\//g, "").replace(/\/\/[^\n]*/g, "");
    expect(code, "never disable it").not.toMatch(/\bdisabled[=}]/);
  });

  it("no strip under the board asks anything any more", () => {
    const start = GAME.indexOf("footer={");
    expect(start).toBeGreaterThan(0);
    const footer = GAME.slice(start, GAME.indexOf("<ControlModePicker", start));
    expect(footer, "a leftover strip would be a second start button").not.toContain("<button");
  });

  it("does not fork the start logic - the strip walks the canvas's path", () => {
    // ANCHORED on the newline and indent. `restartFromChrome` CONTAINS
    // `startFromChrome` as a substring, so an unanchored indexOf finds the
    // wrong method and reads its one-line body - which it did, on the first
    // run of this file, and reported a real method as missing its calls.
    const start = SCENE.indexOf("\n  startFromChrome() {");
    expect(start, "the scene must expose startFromChrome").toBeGreaterThan(0);
    const body = SCENE.slice(start, SCENE.indexOf("\n  }", start));
    // The canvas tap unlocks audio and speech, restarts when the run is over,
    // and otherwise starts. Anything less is a second, drifting copy.
    for (const call of ["audio.unlock()", "speech.unlock()", "this.restart()", "this.startPlaying()"]) {
      expect(body, `startFromChrome must ${call} exactly as a canvas tap does`).toContain(call);
    }
    expect(body, "and it must respect the pause cover, like every other entry point").toContain(
      "this.paused",
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
