// The computer taking its turn - scheduling only, never the thinking itself.
//
// PURE: no DOM, no React, no game. It takes a function that returns a move and
// gives it back to you at the right moment, and it can be driven by fake timers
// in node. Everything about WHAT to play lives in each game's own `engine.ts`.
//
// WHY THIS IS ONE MODULE AND NOT A `setTimeout` PER GAME
// Tictactoe already writes the argument out, in a sixteen-line comment above
// the ref it needed to fix it: its AI answers from a timer holding the board it
// was thinking about, and anything that deals a new board inside that window -
// restart, a difficulty change, the two-player switch - leaves the timer alive,
// so "the player watches their new game turn back into the old one with an
// extra O in it, and nothing errors". That is a guard, not a feature, and a
// guard re-implemented per game is a guard that is missing from one of them.
//
// WHAT THIS ADDS THAT TICTACTOE NEVER NEEDED
// Minimax on a 3x3 board is instant, so tictactoe can wait 380ms and THEN think
// and nobody can tell. A chess search at hard takes real wall-clock time, and
// the order matters:
//
//   think inside the beat     paint "thinking" ... freeze 300ms ... move
//   this module               paint "thinking" | think 300ms | move
//
// Both show a thinking banner. Only the second one has painted it before the
// main thread is taken away. That is the whole reason `yieldMs` exists, and it
// is why the search must NOT be started in the same tick as the player's move.
//
// WHAT IS DELIBERATELY ABSENT
//   - No Web Worker. A worker is a new chunk - a dynamic import, a named
//     `manualChunks` branch and a matching `globIgnores` entry - and the
//     precache glob sweeps `**/*.js`, so getting it wrong puts an engine in
//     every child's first visit. The engines bound their own search by wall
//     clock instead; see each game's `engine.ts`.
//   - No React. A hook here would drag `src/shared` into whatever React does
//     next, for three lines a renderer can hold in a ref.
//   - No queue, no "cancel the previous one for me". A caller that schedules
//     twice without cancelling has a bug this module must not paper over.

/**
 * How long after the player's own move the reply lands, at the earliest.
 *
 * Not a delay - a FLOOR. A reply that arrives in 4ms reads as the board
 * playing itself rather than as an opponent answering, and tictactoe picked
 * 380ms for the same reason. Slightly longer here because these two games have
 * more on the board to notice.
 */
export const MIN_BEAT = 420;

/**
 * The gap before the search starts, for the browser to paint the thinking
 * banner. One frame at 60Hz is 16.7ms; 24 clears a frame without being
 * perceptible on top of MIN_BEAT, which is running concurrently anyway.
 */
export const YIELD_MS = 24;

export interface OpponentRun<T> {
  /** The search. Runs ONCE, off the tick that scheduled it. May throw. */
  think: () => T;
  /** Play it. Never called after `cancel`, and never called twice. */
  onMove: (move: T) => void;
  /**
   * The search threw. The turn stays the player's and the board is untouched -
   * an engine bug must cost a move, not the game. Never called for a run that
   * was cancelled: a restart mid-search is not a fault.
   */
  onError?: (err: unknown) => void;
  minBeat?: number;
  yieldMs?: number;
  /** Injectable clock, so the slow-search arm is testable without a slow search. */
  now?: () => number;
}

/**
 * Schedule one reply. Returns the cancel, which the caller MUST hold and MUST
 * call on unmount, on restart, on a difficulty change, and on the switch to
 * two players - every door that deals a new board.
 */
export function scheduleOpponent<T>(run: OpponentRun<T>): () => void {
  const {
    think,
    onMove,
    onError,
    minBeat = MIN_BEAT,
    yieldMs = YIELD_MS,
    now = () => Date.now(),
  } = run;

  // ONE cancel mechanism, and that is the point.
  //
  // The first version carried two - this flag AND a `clearTimeout` of the
  // pending timer - which read as belt-and-braces and measured as neither.
  // Planted mutations, 2026-09-21, against this file's own ten tests:
  //
  //   drop `live = false` from cancel, keep clearTimeout   10 passed
  //   drop clearTimeout from cancel, keep `live = false`   10 passed
  //   drop the liveness check at the top of the callback   10 passed
  //
  // Three guards, blast radius zero each, because either mechanism alone
  // satisfied every test and so no test could see any of them. That is the
  // shape `an-armed-lever-with-no-caller-reads-as-yes.md` collects: a guard
  // nothing reaches reads as protection to every future reader.
  //
  // With clearTimeout gone the flag is the only thing standing between a
  // cancelled run and a move landing on a board that no longer exists, both
  // remaining checks are reachable, and both are killed by mutation. The cost
  // is a timer that fires and does nothing up to `minBeat` after a cancel,
  // which is free.
  let live = true;
  const started = now();

  const cancel = (): void => {
    live = false;
  };

  setTimeout(() => {
    // Cancelled before the search even started - a restart, a level change, or
    // the game unmounting inside one frame of the player's move.
    if (!live) return;

    let move: T;
    try {
      move = think();
    } catch (err) {
      onError?.(err);
      return;
    }

    // A search that already outlasted the beat has been legible for longer than
    // the beat. Waiting again would only make hard mode feel worse than it is.
    const left = minBeat - (now() - started);
    if (left <= 0) {
      onMove(move);
      return;
    }
    // Cancelled while the beat was running: the move is correct for a board
    // that is gone. Drop it rather than paint it over what is on screen now.
    setTimeout(() => {
      if (live) onMove(move);
    }, left);
  }, yieldMs);

  return cancel;
}
