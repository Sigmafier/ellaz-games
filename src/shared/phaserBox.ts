/**
 * Keep a Phaser canvas the size of the box it was given, on a page that SCALES
 * that box.
 *
 * WHY THIS EXISTS
 * ---------------
 * `ScaleManager.getParentBounds()` measures the parent with
 * `getBoundingClientRect()`, and that rect carries every ancestor transform. A
 * game page always has one available: `src/portal/fitStage.ts` puts
 * `transform: scale(...)` on `#game-frame` whenever the mounted game is taller
 * than the stage box - which is exactly what the end-of-run "Play again /
 * Share my result" strip makes it, because the strip is in flow inside the
 * frame.
 *
 * So Phaser reads the ALREADY-SCALED width, writes it as the canvas's CSS size,
 * and the browser then scales that again: the arena is drawn at `scale²` inside
 * a box drawn at `scale`. Everything around the canvas is DOM - the arcade HUD
 * is absolutely placed on the arena's own wrapper - and DOM is laid out, so the
 * HUD stays the size of the box while the picture inside it shrinks. The
 * readings end up stranded on the page background beside the arena, which is
 * what a player photographs and calls a layout bug.
 *
 * MEASURED on the built artifact, survivors at 390x844, the moment the strip
 * appears (2026-09-21, `scripts/repro/repro-arena-fills-its-box.mjs`):
 *
 *     frame transform   scale(0.9238)
 *     board rendered    331.5 x 698.6
 *     canvas rendered   306.2 x 645.4     <- 0.9238 of its own box
 *
 * It does not compound: four open/close rounds of the share sheet were measured
 * and the ratio stayed at 0.924 exactly, because Phaser re-measures the same
 * transformed rect each time rather than a rect it has already shrunk.
 *
 * WHAT THIS DOES
 * --------------
 * Replaces that one measurement with the parent's LAYOUT size, which is what
 * `clientWidth` / `clientHeight` report and what a transform does not touch.
 * Everything else about the scale manager is left alone on purpose:
 *
 * - the parent stays set, so Phaser keeps polling in `step()` and keeps
 *   refreshing when the page moves the canvas;
 * - the "the canvas moved" half of the check is kept verbatim, because that is
 *   what re-reads `canvasBounds` when the transform changes - and `canvasBounds`
 *   is what every pointer coordinate is mapped through. Input is measured from
 *   the canvas's RENDERED rect, so it goes on carrying the transform and goes
 *   on being right.
 *
 * `autoCenter` must be `NO_CENTER` in the game config of any caller, and the
 * host should centre with CSS instead: `updateCenter` compares the canvas's
 * rendered rect against `parentSize`, so once those two are in different units
 * it writes a margin of half the difference and pushes the canvas off its box.
 * Both callers' hosts carry the game's own aspect ratio, so there is nothing to
 * centre in practice; the CSS is there for the day one of them does not.
 *
 * Written against phaser 4.2.1 (`src/scale/ScaleManager.js`). A Phaser upgrade
 * that reshapes this method silently restores the bug, which is why the guard
 * is a browser gate that measures the canvas against its box rather than a unit
 * test that reads this file.
 */

/** The half of `Phaser.Scale.ScaleManager` this touches, so no engine type leaks in. */
export interface ScaleManagerLike {
  parent: HTMLElement | null;
  canvas: HTMLCanvasElement | null;
  parentSize: { width: number; height: number; setSize(width: number, height: number): unknown };
  canvasBounds: { x: number; y: number };
  getParentBounds(): boolean;
  refresh(): unknown;
}

/**
 * Point `scale` at the layout size of `host` instead of its rendered rect.
 *
 * Call it once, straight after `new Phaser.Game(...)`, with the same element
 * that was passed as `parent`.
 */
export function measureBoxUnscaled(scale: ScaleManagerLike, host: HTMLElement): void {
  // An arrow closing over `scale`, not a `function` reading `this`: the scale
  // manager calls this both as a method and through `_this` in its own resize
  // listener, and a bound closure answers the same either way.
  scale.getParentBounds = (): boolean => {
    const size = scale.parentSize;
    // LAYOUT px. `getBoundingClientRect()` - what Phaser reads here - would be
    // these numbers times every ancestor transform.
    const width = host.clientWidth;
    const height = host.clientHeight;

    if (size.width !== width || size.height !== height) {
      size.setSize(width, height);
      return true;
    }

    // Phaser's own second branch, kept: a canvas that MOVED needs a refresh
    // even when its box has not changed size, and a change to the frame's
    // transform moves it. That refresh is what keeps pointer mapping honest.
    if (scale.canvas) {
      const bounds = scale.canvasBounds;
      const rect = scale.canvas.getBoundingClientRect();
      if (rect.x !== bounds.x || rect.y !== bounds.y) return true;
    }

    return false;
  };

  // AND RE-MEASURE NOW, or the override changes nothing a player can see.
  //
  // Phaser has already booted by this line: it read the parent with its own
  // method and wrote a canvas size from it. From here on the poll in `step()`
  // asks `getParentBounds()` whether anything CHANGED, and the answer is no -
  // the layout box is the same box it always was, only the number Phaser holds
  // for it is right now and was wrong a moment ago. So nothing ever recomputes
  // the style and the canvas keeps the size boot gave it.
  //
  // Measured while writing this, snake at 390x844 on the built artifact
  // (2026-09-21): `parentSize` read 343 - the layout width, so the override was
  // plainly in force - while `canvas.style.width` sat at 309.246px, the scaled
  // one, for eight seconds and every poll in them. Nudging the window one pixel
  // moved it to 343px. A fix that needs the player to resize the window is not
  // a fix, and the reading that showed it was the pair, not either number.
  if (scale.canvas) {
    scale.getParentBounds();
    scale.refresh();
  }
}
