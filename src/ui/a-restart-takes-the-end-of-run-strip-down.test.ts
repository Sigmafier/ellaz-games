import { beforeEach, describe, expect, it, vi } from "vitest";
import { notifyRunStart, onRunStart, runRestart, setRestart } from "./gameTools";

/*
 * THE END-OF-RUN STRIP MUST NOT OUTLIVE THE RUN.
 *
 * `GameHost` raises "Play again / Share my result" on a win and used to lower it
 * on nothing but leaving the game, so it sat under the NEXT run - offering to
 * replay a board already replayed, and costing that run height, because the
 * strip is in flow and `fitStage` scales the whole frame while it is up.
 *
 * Measured on the built artifact at 390x844, 2026-09-21, two arms from one tree
 * over all 43 games: the frame's natural height goes 776 -> 840 against a 792px
 * box, and 43 of 43 games scale - 40 of them 1 -> 0.9238, with snake 0.9011 ->
 * 0.8387, maze 0.8684 -> 0.8103 and coloring 0.9841 -> 0.9103 already scaled and
 * made worse. So this is not one game's bug and the pin is not one game's pin.
 *
 * These are BEHAVIOUR tests rather than source scans - `gameTools` is plain
 * module state with no DOM in it, so the real functions can simply be called and
 * the real listener watched. A source scan here would assert a spelling; this
 * asserts the thing a player gets.
 */
describe("a restart announces that a run has started", () => {
  beforeEach(() => {
    setRestart(null);
  });

  it("every restart path announces it, because the announcement is inside runRestart", () => {
    const heard = vi.fn();
    const off = onRunStart(heard);
    setRestart(() => {});

    runRestart();

    expect(heard).toHaveBeenCalledTimes(1);
    off();
  });

  /*
   * The ORDER is the half that is easy to get wrong and impossible to see: the
   * strip has to come down BEFORE the game restarts, or the game lays itself out
   * into a box that is about to change size underneath it.
   */
  it("announces BEFORE the game restarts, so the box is its final size first", () => {
    const order: string[] = [];
    const off = onRunStart(() => order.push("strip down"));
    setRestart(() => order.push("game restarts"));

    runRestart();

    expect(order).toEqual(["strip down", "game restarts"]);
    off();
  });

  /*
   * A game with no restart in the slot must still take the strip down - the
   * player pressed something, and a strip that survives the press is the defect
   * whichever way the slot happens to be filled.
   */
  it("announces even when no game has filled the restart slot", () => {
    const heard = vi.fn();
    const off = onRunStart(heard);

    runRestart();

    expect(heard).toHaveBeenCalledTimes(1);
    off();
  });

  it("a listener that unsubscribed hears nothing more", () => {
    const heard = vi.fn();
    onRunStart(heard)();

    notifyRunStart();

    expect(heard).not.toHaveBeenCalled();
  });

  /*
   * THE CONTROL. Every assertion above passes on a `notifyRunStart` that fires
   * into an empty set, so this proves the listener set is the thing being read -
   * two subscribers, both told, which a no-op notifier cannot produce.
   */
  it("THE CONTROL: the notice reaches every subscriber, not an empty set", () => {
    const a = vi.fn();
    const b = vi.fn();
    const offA = onRunStart(a);
    const offB = onRunStart(b);

    notifyRunStart();

    expect(a).toHaveBeenCalledTimes(1);
    expect(b).toHaveBeenCalledTimes(1);
    offA();
    offB();
  });
});
