// Snake Survivors' rules: a new run, one step of it, and taking a card.
//
// Pure - no DOM, no Phaser - and every random draw comes from the `rng` a
// caller hands in, so the same seed and the same hands play the same run.
//
// THE GAME IN ONE SENTENCE: close a loop with your body and every shape inside
// it is crushed. The tail is your health - a shape reaching your head costs two
// segments - and the gems the crushed shapes drop grow it back.

import { worldFor } from "../survivors/world";
import {
  BODY_R, HEAD_R, HIT_COST, MAX_LEN, MIN_LEN, SEG, SPACING, START_LEN,
  advance, centreOf, findLoop, inside, trimTrail,
} from "./body";
import { applyCard, biteOf, noneTaken, offerCards, pullOf, regrowEvery, shockOf, spikeEvery } from "./cards";
import { KINDS, LEVELS, SAFE_START_MS, moveFoes, startBoss, tickSpawns } from "./crowd";
import { FLOOR_GEMS, tickFloorGems } from "./floor";
import type { Arena, CardId, Foe, LevelKey, Pt, Run, Steer } from "./types";

export type { Arena, CardId, Foe, LevelKey, Run, Steer } from "./types";

/** The view on a phone and on a PC: two shapes of the same area, Neon Survival's pair. */
export const ARENA: Arena = { w: 420, h: 560 };
export const ARENA_WIDE: Arena = { w: 648, h: 364 };

/** ms of safety after a hit, so one crowd cannot take the whole tail at once. */
export const BLINK_MS = 1400;
/** ms after a crush before another may land - one closing is one crush. */
export const LOOP_COOL_MS = 350;
/** What one gem grows the snake by, in segments. */
export const GROW = 1 / 3;
/** How close a gem must come to the head to be collected. */
const PICKUP = 16;
/** How fast a magnet pulls a gem, units/s. */
const PULL_SPEED = 240;

/**
 * How many hits the tail can still take, the one that ends the run included -
 * the number the HUD draws as hearts. Derived from the same two constants the
 * hit uses, so the hearts cannot disagree with the rule that empties them.
 */
export const hitsLeft = (len: number) => Math.max(1, Math.ceil((Math.floor(len) - MIN_LEN + 1) / HIT_COST));

/** Gems to the next level. */
export const needFor = (lv: number) => 4 + 3 * lv;

export function newRun(level: LevelKey, arena: Arena = ARENA, rng: () => number = Math.random): Run {
  const world = worldFor(arena);
  const x = world.w / 2;
  const y = world.h / 2;
  const n = Math.ceil((START_LEN * SEG) / SPACING);
  return {
    level, arena, world, x, y,
    heading: 0,
    path: Array.from({ length: n }, (_, i) => ({ x: x - (i + 1) * SPACING, y })),
    len: START_LEN,
    foes: [], gems: [], nextId: 1,
    t: 0,
    // A first shape a second or so in, jittered so two runs do not open alike.
    spawnIn: 900 + rng() * 600,
    floorIn: FLOOR_GEMS.firstMs,
    calmMs: SAFE_START_MS,
    xp: 0, need: needFor(1), lv: 1,
    choosing: null,
    taken: noneTaken(),
    blink: 0, loopCool: 0, regrowAt: 0,
    crushed: 0,
    phase: "stage",
    events: [],
  };
}

/** One step of play. Mutates and returns the run; does nothing once it is over or while a card is up. */
export function step(run: Run, dt: number, steer: Steer, rng: () => number = Math.random): Run {
  run.events = [];
  if (run.phase === "dead" || run.phase === "won" || run.choosing) return run;
  run.t += dt;
  run.blink = Math.max(0, run.blink - dt);
  run.loopCool = Math.max(0, run.loopCool - dt);
  regrow(run, dt);

  advance(run, dt, steer);
  if (run.phase === "stage" && run.t >= LEVELS[run.level].stageMs) startBoss(run, rng);
  tickSpawns(run, dt, rng);
  tickFloorGems(run, dt, rng);
  moveFoes(run, dt, rng);
  bodyContacts(run, rng);
  if (run.loopCool === 0) {
    const loop = findLoop(run);
    if (loop) crush(run, loop, rng);
  }
  headContacts(run, rng);
  collectGems(run, dt, rng);

  // Read afresh: a crush or a bite above may have just won the run.
  if ((run.phase as Run["phase"]) !== "won" && run.len < MIN_LEN) {
    run.phase = "dead";
    run.events.push({ k: "dead" });
  }
  return run;
}

/** Take one of the cards on offer. Anything not on offer is ignored. */
export function pickCard(run: Run, id: CardId): void {
  if (!run.choosing?.includes(id)) return;
  applyCard(run, id);
  run.choosing = null;
}

function grow(run: Run, by: number): void {
  run.len = Math.min(MAX_LEN, run.len + by);
}

function regrow(run: Run, dt: number): void {
  const every = regrowEvery(run);
  if (!Number.isFinite(every)) return;
  run.regrowAt += dt;
  if (run.regrowAt < every) return;
  run.regrowAt -= every;
  grow(run, 1);
}

/** Take one hit off a shape; a shape at zero is killed. */
function wound(run: Run, f: Foe, rng: () => number): void {
  f.hp -= 1;
  f.hurt = 250;
  if (f.hp <= 0) kill(run, f, rng);
  else run.events.push({ k: "hurt", kind: f.kind, x: f.x, y: f.y });
}

function kill(run: Run, f: Foe, rng: () => number): void {
  run.foes = run.foes.filter((o) => o !== f);
  run.crushed += 1;
  for (let i = 0; i < KINDS[f.kind].gems; i++) {
    run.gems.push({ x: f.x + (rng() - 0.5) * 14, y: f.y + (rng() - 0.5) * 14, v: 1 });
  }
  run.events.push({ k: "ko", kind: f.kind, x: f.x, y: f.y });
  if (f.kind === "warden") {
    run.phase = "won";
    run.events.push({ k: "won" });
  }
}

/**
 * THE LOOP. Every shape whose centre is inside takes one hit - a runner or an
 * orb dies, a brute needs two loops, the warden three. With the shockwave card
 * the shapes just outside are thrown back and stunned.
 */
function crush(run: Run, poly: Pt[], rng: () => number): void {
  run.loopCool = LOOP_COOL_MS;
  const caught = run.foes.filter((f) => inside(poly, f.x, f.y));
  const c = centreOf(poly);
  for (const f of caught) {
    if (f.kind === "warden") {
      f.stun = 900;
      run.events.push({ k: "bosshit", x: f.x, y: f.y });
    }
    wound(run, f, rng);
  }
  // Only a loop that CAUGHT something throws the rest back. Firing on every
  // closing held the whole crowd off for ever (see the shockwave tests).
  const reach = caught.length ? shockOf(run) : 0;
  if (reach) {
    for (const f of run.foes) {
      if (caught.includes(f)) continue;
      const d = Math.hypot(f.x - c.x, f.y - c.y);
      if (d === 0 || d > reach) continue;
      f.x += ((f.x - c.x) / d) * 50;
      f.y += ((f.y - c.y) / d) * 50;
      f.stun = Math.max(f.stun, 600);
    }
  }
  if (caught.length) run.events.push({ k: "crush", n: caught.length, x: c.x, y: c.y, poly });
}

/**
 * A shape touching the body. The body is NOT a wall: shapes cross it freely,
 * and that is what makes the game work. A crowd chasing a head that circles
 * faster than it can run falls INSIDE the circle (pure pursuit settles on a
 * smaller circle within), so closing the loop catches it. The first build
 * pushed shapes out of the body and was measured catching nothing: 626 loops
 * closed in 25 seconds with zero shapes inside any of them. With spikes, the
 * touch hurts.
 */
function bodyContacts(run: Run, rng: () => number): void {
  const every = spikeEvery(run);
  if (!Number.isFinite(every)) return;
  for (const f of [...run.foes]) {
    if (f.spikeCool > 0 || f.kind === "warden") continue;
    const r2 = (KINDS[f.kind].r + BODY_R) ** 2;
    if (!run.path.some((p, i) => i >= 3 && (f.x - p.x) ** 2 + (f.y - p.y) ** 2 < r2)) continue;
    f.spikeCool = every;
    run.events.push({ k: "spike", x: f.x, y: f.y });
    wound(run, f, rng);
  }
}

/** A shape at the head: bitten if the fangs are strong enough, otherwise a hit. */
function headContacts(run: Run, rng: () => number): void {
  for (const f of [...run.foes]) {
    const r = HEAD_R + KINDS[f.kind].r;
    const dx = f.x - run.x;
    const dy = f.y - run.y;
    if (dx * dx + dy * dy >= r * r) continue;
    if (f.kind !== "warden" && biteOf(run) >= KINDS[f.kind].hp) {
      run.events.push({ k: "bite", x: f.x, y: f.y });
      kill(run, f, rng);
      continue;
    }
    if (run.blink > 0) continue;
    run.len -= HIT_COST;
    run.blink = BLINK_MS;
    run.events.push({ k: "hit" });
    trimTrail(run);
    const d = Math.hypot(dx, dy) || 1;
    f.x += (dx / d) * 30;
    f.y += (dy / d) * 30;
    f.stun = Math.max(f.stun, 400);
  }
}

function collectGems(run: Run, dt: number, rng: () => number): void {
  const pull = pullOf(run);
  const kept = [];
  for (const g of run.gems) {
    const dx = run.x - g.x;
    const dy = run.y - g.y;
    const d = Math.hypot(dx, dy);
    if (d < PICKUP) {
      run.xp += g.v;
      grow(run, g.v * GROW);
      run.events.push({ k: "gem" });
      continue;
    }
    if (pull && d < pull) {
      const v = Math.min(d, (PULL_SPEED * dt) / 1000);
      g.x += (dx / d) * v;
      g.y += (dy / d) * v;
    }
    kept.push(g);
  }
  run.gems = kept;
  if (run.xp >= run.need && !run.choosing) {
    run.xp -= run.need;
    run.lv += 1;
    run.need = needFor(run.lv);
    const offer = offerCards(run, rng);
    run.choosing = offer.length ? offer : null;
    run.events.push({ k: "level" });
  }
}

