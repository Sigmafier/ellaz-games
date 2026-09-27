// The guided first run (operator ruling R2.5): three steps on a practice run
// before the real one, as a pure state machine. The scene only draws what this
// says; the chrome only prints the step's words.
//
//   loop  one slow bat that does not chase, a dotted ring round it   -> a LOOP crushes it
//   eat   an arrow at the gems it dropped                             -> every one eaten
//   pick  exactly one level's XP, so the card screen opens           -> a card is picked
//   done  the real run starts from a fresh state
//
// Written for the Phaser-forum reviewer who had never seen a game like it: "I
// tried to surround the bats, but instead I lost a life and the length of the
// snake." So NOTHING in here can fail - a hit costs nothing and shows nothing,
// the run cannot end, and the boss can never come.

import { cameraOf, clampToWorld, inView } from "../survivors/world";
import { makeFoe } from "./crowd";
import { newRun, pickCard, step } from "./logic";
import type { Arena, CardId, LevelKey, Pt, Run, Steer } from "./types";

export type TutorialStep = "loop" | "eat" | "pick" | "done";

export interface Tutorial {
  step: TutorialStep;
  /** The practice run. Thrown away when the tutorial ends. */
  run: Run;
  /** Where the bat bobs, and the centre of the ring drawn round it. */
  home: Pt;
  /** ms the tutorial has run - its own clock, because the run's is held at 0. */
  ms: number;
  skipped: boolean;
}

/**
 * The ring's radius. A loop round it encloses pi * 46^2 = 6,648 square units,
 * well over the 4,000 a loop needs to crush, and its 289-unit rim is under the
 * 336 units of body a new snake has - so following the ring closes a loop that
 * counts, with body to spare.
 */
export const GUIDE_R = 46;
/** How far in front of the head the bat is put. */
const AHEAD = GUIDE_R + 64;
/** The bat's bob: a small circle round its home, so it reads as alive. */
const BOB = { r: 8, ms: 1600 };
/** Gems the bat leaves: its own one and these two more, so step 2 is a trail. */
const EXTRA_GEMS = 2;

export function newTutorial(arena: Arena, rng: () => number = Math.random): Tutorial {
  const run = newRun("calm", arena, rng);
  run.spawnIn = Infinity; // no crowd: the bat is the only shape
  run.floorIn = Infinity; // no floor gems: the bat's gems are the only gems
  run.calmMs = Infinity; // and it never starts to chase
  const home = { x: run.x + AHEAD, y: run.y };
  run.foes.push(makeFoe(run, "runner", home.x, home.y));
  return { step: "loop", run, home, ms: 0, skipped: false };
}

/** One frame of the tutorial. Does nothing once it is done or while the cards are up. */
export function tickTutorial(tut: Tutorial, dt: number, steer: Steer, rng: () => number = Math.random): void {
  if (tut.step === "done" || tut.step === "pick") return;
  tut.ms += dt;
  const run = tut.run;
  const len = run.len;
  if (tut.step === "loop") keepTheBat(tut);
  step(run, dt, steer, rng);
  forgive(run, len);
  if (tut.step === "loop" && run.events.some((e) => e.k === "crush")) {
    const at = run.gems[0] ?? tut.home;
    for (let i = 0; i < EXTRA_GEMS; i++) run.gems.push({ x: at.x + (i ? -1 : 1) * 22, y: at.y + (i ? 12 : -12), v: 1 });
    tut.step = "eat";
  } else if (tut.step === "eat" && run.gems.length === 0) {
    toPick(tut, rng);
  }
}

/**
 * Hits cost nothing and the run cannot end: the length a hit took is given
 * back, the hit is struck from the report (no buzz, no shake, no fail sound),
 * and the clock is held at zero so the stage never runs out into the boss.
 */
function forgive(run: Run, len: number): void {
  if (run.len < len) run.len = len;
  run.blink = 0;
  run.phase = "stage";
  run.t = 0;
  run.events = run.events.filter((e) => e.k !== "hit" && e.k !== "dead");
}

/**
 * Hold the bat on its small bob round `home`, and move `home` back in front of a
 * player who has driven so far that the ring is out of sight. It never chases.
 */
function keepTheBat(tut: Tutorial): void {
  const run = tut.run;
  if (!inView(run, tut.home.x, tut.home.y, -GUIDE_R / 2)) tut.home = homeFor(run);
  const bat = run.foes[0];
  if (!bat) return;
  const a = (tut.ms / BOB.ms) * 2 * Math.PI;
  bat.x = tut.home.x + Math.cos(a) * BOB.r;
  bat.y = tut.home.y + Math.sin(a) * BOB.r;
  bat.stun = 0;
}

/** A home for the bat in front of the head - toward the middle of the view when the head is at a wall. */
function homeFor(run: Run): Pt {
  const c = cameraOf(run);
  const dx = c.x + run.arena.w / 2 - run.x;
  const dy = c.y + run.arena.h / 2 - run.y;
  const d = Math.hypot(dx, dy);
  const ux = d > 20 ? dx / d : Math.cos(run.heading);
  const uy = d > 20 ? dy / d : Math.sin(run.heading);
  return clampToWorld(run, run.x + ux * AHEAD, run.y + uy * AHEAD, GUIDE_R + 12);
}

/** Step 3: exactly one level's XP, and the level-up is the run's own. */
function toPick(tut: Tutorial, rng: () => number): void {
  tut.step = "pick";
  tut.run.xp = tut.run.need;
  step(tut.run, 0, { dx: 0, dy: 0 }, rng);
}

/** Take a card on the step-3 screen. Anything not on offer is ignored. */
export function tutorialPick(tut: Tutorial, id: CardId): void {
  if (tut.step !== "pick" || !tut.run.choosing?.includes(id)) return;
  pickCard(tut.run, id);
  tut.step = "done";
}

export function skipTutorial(tut: Tutorial): void {
  if (tut.step === "done") return;
  tut.step = "done";
  tut.skipped = true;
}

/**
 * End the tutorial, wherever it is, and hand back the REAL run - a new one,
 * built exactly as a first Play builds it. Nothing the practice earned (the
 * card, the level, the crush) carries over.
 */
export function leaveTutorial(tut: Tutorial, level: LevelKey, arena: Arena, rng: () => number = Math.random): Run {
  if (tut.step !== "done") skipTutorial(tut);
  return newRun(level, arena, rng);
}

/** Step 1's dotted ring: where to draw it, or null on every other step. */
export function guideRing(tut: Tutorial): { x: number; y: number; r: number } | null {
  const bat = tut.run.foes[0];
  if (tut.step !== "loop" || !bat) return null;
  return { x: bat.x, y: bat.y, r: GUIDE_R };
}

/** Step 2's arrow: the nearest gem to the head, or null on every other step. */
export function gemTarget(tut: Tutorial): Pt | null {
  if (tut.step !== "eat") return null;
  let best: Pt | null = null;
  let d2 = Infinity;
  for (const g of tut.run.gems) {
    const d = (g.x - tut.run.x) ** 2 + (g.y - tut.run.y) ** 2;
    if (d < d2) (d2 = d), (best = g);
  }
  return best;
}

/**
 * The remembered flag, under the game's own save namespace. A persisted id, so
 * it is never renamed. Both calls are try/catch-wrapped even though the SDK's
 * store already is: a store that throws must neither crash the game nor stop a
 * first-time player being shown the way in - an unreadable flag reads as "not
 * seen yet", and the tutorial can always be skipped.
 */
export const TUTORIAL_KEY = "tutorialSeen";

type FlagStore = { get<T>(key: string, fallback: T): T; set<T>(key: string, value: T): void };

export function hasSeenTutorial(store: FlagStore): boolean {
  try {
    return store.get<unknown>(TUTORIAL_KEY, false) === true;
  } catch {
    return false;
  }
}

export function markTutorialSeen(store: FlagStore): void {
  try {
    store.set(TUTORIAL_KEY, true);
  } catch {
    /* storage unavailable - it will simply be offered again next time */
  }
}
