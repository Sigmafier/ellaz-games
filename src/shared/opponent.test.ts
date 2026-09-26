import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { scheduleOpponent, MIN_BEAT, YIELD_MS } from "./opponent";

/**
 * The behaviours this module exists for, one test each.
 *
 * Every one of them is a bug that has already happened in this repo or is one
 * `setTimeout` away from happening: tictactoe's own source carries a comment
 * about the reply that lands on a board the player has already restarted
 * ("the player watches their new game turn back into the old one with an extra
 * O in it, and nothing errors"). This module is that guard, hoisted, plus the
 * one thing tictactoe never needed - a search that takes real time.
 */
describe("scheduleOpponent", () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it("does not think synchronously, so the caller can paint first", () => {
    const think = vi.fn(() => "e4");
    scheduleOpponent({ think, onMove: vi.fn() });
    // A search that ran here would block the paint that shows "thinking",
    // and the player would see a frozen board with no explanation.
    expect(think).not.toHaveBeenCalled();
  });

  it("plays the move its own think returned", () => {
    const onMove = vi.fn();
    scheduleOpponent({ think: () => "e4", onMove });
    vi.advanceTimersByTime(YIELD_MS + MIN_BEAT + 10);
    expect(onMove).toHaveBeenCalledWith("e4");
  });

  it("holds an instant move back for the full beat, so it is legible", () => {
    const onMove = vi.fn();
    scheduleOpponent({ think: () => "e4", onMove });
    // The beat is measured from SCHEDULING, not from the end of the search -
    // what a player experiences is the gap after their own move.
    vi.advanceTimersByTime(MIN_BEAT - 20);
    expect(onMove).not.toHaveBeenCalled();
    vi.advanceTimersByTime(40);
    expect(onMove).toHaveBeenCalledTimes(1);
  });

  it("does NOT add a beat on top of a slow think", () => {
    // A search that already took longer than the beat has been legible for
    // longer than the beat. Waiting again would only make hard mode feel worse.
    const onMove = vi.fn();
    let clock = 1000;
    scheduleOpponent({
      think: () => {
        clock += MIN_BEAT * 3; // the search burned three beats of wall clock
        return "e4";
      },
      onMove,
      now: () => clock,
    });
    vi.advanceTimersByTime(YIELD_MS);
    expect(onMove).toHaveBeenCalledWith("e4");
  });

  it("cancel before the yield means it never thinks at all", () => {
    const think = vi.fn(() => "e4");
    const onMove = vi.fn();
    const cancel = scheduleOpponent({ think, onMove });
    cancel();
    vi.advanceTimersByTime(YIELD_MS + MIN_BEAT + 100);
    expect(think).not.toHaveBeenCalled();
    expect(onMove).not.toHaveBeenCalled();
  });

  it("cancel after it has thought still never lands the move", () => {
    // The restart case: the search finished, the beat has not elapsed, and the
    // board it was thinking about is gone.
    const onMove = vi.fn();
    const cancel = scheduleOpponent({ think: () => "e4", onMove });
    vi.advanceTimersByTime(YIELD_MS + 5);
    cancel();
    vi.advanceTimersByTime(MIN_BEAT + 100);
    expect(onMove).not.toHaveBeenCalled();
  });

  it("a fresh schedule after a cancel lands, and only once", () => {
    const onMove = vi.fn();
    const cancel = scheduleOpponent({ think: () => "old", onMove });
    cancel();
    scheduleOpponent({ think: () => "new", onMove });
    vi.advanceTimersByTime(YIELD_MS + MIN_BEAT + 50);
    expect(onMove).toHaveBeenCalledTimes(1);
    expect(onMove).toHaveBeenCalledWith("new");
  });

  it("a thrown search never takes the board with it", () => {
    // An engine bug must cost the player a move, not the whole game. The board
    // is handed back with `onError` and the turn stays theirs.
    const onMove = vi.fn();
    const onError = vi.fn();
    scheduleOpponent({
      think: () => {
        throw new Error("search blew up");
      },
      onMove,
      onError,
    });
    expect(() => vi.advanceTimersByTime(YIELD_MS + MIN_BEAT + 50)).not.toThrow();
    expect(onMove).not.toHaveBeenCalled();
    expect(onError).toHaveBeenCalledTimes(1);
  });

  it("a cancelled run does not report an error either", () => {
    // Otherwise a restart mid-search would surface as a fault to the player.
    const onError = vi.fn();
    const cancel = scheduleOpponent({
      think: () => {
        throw new Error("search blew up");
      },
      onMove: vi.fn(),
      onError,
    });
    cancel();
    vi.advanceTimersByTime(YIELD_MS + MIN_BEAT + 50);
    expect(onError).not.toHaveBeenCalled();
  });

  it("cancel is idempotent", () => {
    const cancel = scheduleOpponent({ think: () => "e4", onMove: vi.fn() });
    expect(() => {
      cancel();
      cancel();
    }).not.toThrow();
  });
});
