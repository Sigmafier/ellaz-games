/**
 * The one control a game owns that is drawn OUTSIDE the game panel.
 *
 * `.claude/rules/game-controls-and-platform-chrome-never-share-a-bar.md` puts
 * restart with the game, because it means nothing with no game mounted - and
 * the operator put it on the page row, under the breadcrumb, where the rest of
 * the page's utilities live. Those two are only reconcilable through a handoff:
 * the button is emitted HTML the build writes once, and the handler lives
 * inside whichever game is currently mounted.
 *
 * So this is a one-slot registry rather than a prop: `GameChrome` fills it on
 * mount and empties it on unmount, and the page wires the button to whatever is
 * in it. A subscriber is told when that changes so the button can hide itself
 * when there is no game - a dead restart button is the same failure as a dead
 * full-screen button, which is why that one is emitted `hidden` too.
 *
 * Deliberately NOT in `@sdk`: a game never touches this. It is chrome talking
 * to chrome.
 */
type Handler = () => void;

/**
 * A RUN HAS STARTED - chrome telling chrome, like everything else in this file.
 *
 * `GameHost`'s end-of-run strip is raised by a win and was lowered by nothing
 * except leaving the game, so it outlived the run it belongs to: it sat under
 * the NEXT run, offering to replay a board already replayed and to share a
 * result the player had moved past.
 *
 * It costs that run real height, in every game rather than the one that was
 * reported. The strip is in flow inside `#game-frame`, so `fitStage` scales the
 * whole frame while it is up - measured on the built artifact at 390x844,
 * 2026-09-21 and again on the merge tree 2026-09-22, sweeping all 45 games in two
 * arms from one tree:
 *
 *     frame natural   776 -> 840px against a 792px box
 *     45 of 45 games scale, 42 of them 1 -> 0.9238
 *     the three already scaled get worse: snake 0.9011 -> 0.8387,
 *     maze 0.8684 -> 0.8103, coloring 0.9841 -> 0.9103
 *
 * The strip cannot simply be drawn OVER the game instead: 21 of those 43 have a
 * control in the bottom 64px it would cover (counted at 43 games) - sudoku's keypad, wordguess's
 * keyboard, coloring's palette, blocks' and bubbleshooter's steering, pet's four
 * actions. So the shrink is the price of the strip, and what this fixes is that
 * it stops the moment the player starts playing again.
 *
 * Announced by whoever draws the control that starts a run, never by the game:
 * a game talks to `GameContext` and nothing else. There is no state here, and no
 * slot to fill - a run starting is an event, not a thing a caller can hold.
 */
const runStartListeners = new Set<() => void>();

export function notifyRunStart(): void {
  runStartListeners.forEach((cb) => cb());
}

export function onRunStart(cb: () => void): () => void {
  runStartListeners.add(cb);
  return () => {
    runStartListeners.delete(cb);
  };
}


let restart: Handler | null = null;
const listeners = new Set<(available: boolean) => void>();

/** Called by `GameChrome`. Pass null on unmount - the button hides itself. */
export function setRestart(fn: Handler | null): void {
  if (restart === fn) return;
  restart = fn;
  listeners.forEach((cb) => cb(fn !== null));
}

export function runRestart(): void {
  // EVERY restart announces a run start, and that is why the announcement lives
  // here rather than at the call sites. A restart reaches this one function from
  // the phone bar's button, `GameChrome`'s own, the standalone bundle's and the
  // win strip's "Play again" - putting the notice in any one of them leaves the
  // others still dragging a finished run's strip into the next one.
  notifyRunStart();
  restart?.();
}

export function hasRestart(): boolean {
  return restart !== null;
}

/**
 * The PAUSE slot, and it carries STATE where restart carries only a handler.
 *
 * A pause button has to say which of the two things it will do next, so the
 * page needs the flag as well as the toggle - and the game owns that flag
 * (`.claude/rules/...` and `GameChrome`'s own note: the game is what stops).
 * Passing `null` means this game has no pause at all, or its run is over, and
 * the button hides itself - a pause on a dead board offers to stop something
 * that already stopped.
 */
export type PauseSlot = { paused: boolean; toggle: () => void };

let pause: PauseSlot | null = null;
const pauseListeners = new Set<(state: PauseSlot | null) => void>();

export function setPause(next: PauseSlot | null): void {
  // Compared FIELD BY FIELD, not by identity: the game rebuilds this object on
  // every render, so an identity check would announce a change on every
  // keystroke and repaint the button under the player's finger.
  if (pause === next) return;
  if (pause && next && pause.paused === next.paused && pause.toggle === next.toggle) return;
  pause = next;
  pauseListeners.forEach((cb) => cb(next));
}

export function getPause(): PauseSlot | null {
  return pause;
}

export function onPauseChange(cb: (state: PauseSlot | null) => void): () => void {
  pauseListeners.add(cb);
  return () => {
    pauseListeners.delete(cb);
  };
}

/**
 * The page tells the chrome it has already drawn a restart button.
 *
 * `GameChrome` is mounted by TWO entries: `PageApp`, on an emitted page that
 * carries the utility row, and `standalone.tsx`, which is one game in a zip on
 * somebody else's CDN and has no emitted anything. Without this the standalone
 * bundle would ship with no restart at all - a real control silently missing
 * from a published artifact, and no gate here fetches that artifact back.
 *
 * So the chrome draws its own button unless a page has claimed the slot. A
 * boolean rather than a DOM read, so it is the same fact in a test as it is in
 * a browser.
 */
let pageOwns = false;

export function claimRestartSlot(): void {
  pageOwns = true;
}

export function pageOwnsRestart(): boolean {
  return pageOwns;
}

/** Fires on every change. Returns the unsubscribe, like `onMuteChange`. */
export function onRestartChange(cb: (available: boolean) => void): () => void {
  listeners.add(cb);
  return () => {
    listeners.delete(cb);
  };
}
