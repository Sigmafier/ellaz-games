// The crowd: the shapes, the clock that sends them, how they chase, and the boss.
//
// The three shapes and the warden are Neon Survival's cast, so their sizes
// match the sprites that game already sized - but their NUMBERS are this game's
// own, because a crowd you trap is a different crowd from one you shoot.

import { isLeftBehind, spawnPoint } from "../survivors/world";
import { MAX_LEN } from "./body";
import type { Foe, Kind, LevelKey, Run, Stage } from "./types";

/**
 * r = hit radius, speed = units/s, hp = loops to crush, drops = the gems it
 * leaves, by VALUE (1 blue, 2 red, 3 yellow). Each shape is worth what it was
 * worth before gems had colours - a runner 1, an orb 2, a brute 3, the warden
 * 12 - only now in fewer, brighter gems, so a tougher shape LOOKS richer.
 */
export const KINDS: Record<Kind, { r: number; speed: number; hp: number; drops: readonly number[] }> = {
  runner: { r: 9, speed: 62, hp: 1, drops: [1] },
  orb: { r: 12, speed: 44, hp: 1, drops: [2] },
  brute: { r: 17, speed: 34, hp: 2, drops: [2, 1] },
  warden: { r: 24, speed: 50, hp: 3, drops: [3, 3, 3, 3] },
};

/**
 * What a level changes: how often a shape comes (from `spawnMs` down to
 * `floorMs` over `rampMs`), how fast they move (`pace`) and how many may be on
 * the floor at once. Never the snake.
 *
 * Round three (2026-09-28) HALVED the crowd - "fewer bats": every cap is half
 * what it was (22/30/38) and every interval twice as long (1500-800 / 1100-520
 * / 850-380 ms), so the clock sends half as many as well as holding half.
 *
 * `rampMs` was `stageMs`, the clock the warden came on. The warden now comes on
 * a trigger (`BOSS_AT`); the same span still decides how the crowd grows - when
 * orbs and brutes join and how fast the clock tightens.
 */
export const LEVELS: Record<LevelKey, { spawnMs: number; floorMs: number; rampMs: number; pace: number; cap: number }> = {
  calm: { spawnMs: 3000, floorMs: 1600, rampMs: 150_000, pace: 0.85, cap: 11 },
  normal: { spawnMs: 2200, floorMs: 1040, rampMs: 180_000, pace: 1, cap: 15 },
  wild: { spawnMs: 1700, floorMs: 760, rampMs: 210_000, pace: 1.15, cap: 19 },
};

/**
 * THE BOSS TRIGGER (round three, NePo's ask): the warden comes when the snake is
 * 50 long OR has crushed 10, whichever is first - never on a clock. "Boss
 * arrive way too early" was a boss that came at 3:00 whatever the player had
 * built; this one comes when they have built something.
 *
 * No clock fallback: a run that never grows and never crushes is not safe
 * forever - the crowd still chases and a bump still costs a segment - so there
 * is no stalled run for a fallback to rescue, and no test needs one.
 *
 * ROUND FOUR (2026-09-28, operator ruling): "why does the game finish so
 * early?" - one boss at 10 crushed let a looping player win by 34-40 s. Now a
 * run is THREE stages, closed by three wardens. Stage 1 keeps NePo's own
 * trigger untouched. Stage 2 and 3 raise the total CRUSHED - `run.crushed`
 * never resets, so "25" and "45" both count from the start of the run, same as
 * stage 1's "10" always did. Stage 2 also keeps a length trigger: reaching
 * `MAX_LEN` is itself a mark of a run that has been looping a while, so it is
 * the natural next rung above 50. Stage 3 is deep enough into a real run that
 * length has usually long since capped - a length trigger there would fire the
 * moment stage 3 opens, so stage 3 is reached by crushing alone.
 */
/**
 * `satisfies`, not a `Record<Stage, ...>` annotation, on purpose: it checks
 * the same shape and still lets `STAGE_TRIGGER[1].len` come out as a plain
 * `number` rather than `number | null` - stage 1's own length trigger is
 * never absent, and callers that read it directly (this file's `BOSS_AT`,
 * `round3.test.ts`) should not have to assert that past the type checker.
 */
export const STAGE_TRIGGER = {
  1: { len: 50, crushed: 10 },
  2: { len: MAX_LEN, crushed: 25 },
  3: { len: null, crushed: 45 },
} satisfies Record<Stage, { len: number | null; crushed: number }>;
/** Stage 1's trigger, under its round-three name: still read on its own. */
export const BOSS_AT = STAGE_TRIGGER[1];

/**
 * Each boss tougher than the last: more loops to crush it, and a shorter fuse
 * on its lunge. Stage 1 stays `KINDS.warden.hp` rather than a second copy of
 * the same number, so the two can never drift apart.
 */
export const BOSS_HP: Record<Stage, number> = { 1: KINDS.warden.hp, 2: 4, 3: 5 };
/** How much of `LUNGE.every` the boss's recharge keeps - under 1 lunges sooner. */
export const BOSS_LUNGE_MULT: Record<Stage, number> = { 1: 1, 2: 0.82, 3: 0.65 };

/**
 * How near THIS stage's boss is, 0 to 1: the larger of its two fractions (no
 * length trigger reads as 0 on that side, so crushed alone decides).
 */
export function bossProgress(run: Pick<Run, "len" | "crushed" | "stage">): number {
  const at = STAGE_TRIGGER[run.stage];
  const byLen = at.len == null ? 0 : Math.floor(run.len) / at.len;
  return Math.min(1, Math.max(byLen, run.crushed / at.crushed));
}

/** Is it time for this stage's warden? */
export const bossDue = (run: Pick<Run, "len" | "crushed" | "stage">) => bossProgress(run) >= 1;

/**
 * How much harder each stage's crowd is than stage 1's baseline (operator
 * ruling: "more and tougher shapes - raise the crowd: faster spawns, the
 * brute joins earlier, higher cap"). `brute` replaces stage 1's fixed `JOINS`
 * entry; `cap` and `spawn` scale the level's own numbers, so a WILD stage 3 is
 * still wilder than a CALM stage 3 - this never overrides the level, only
 * multiplies it.
 *
 * `hp` is the other half of "TOUGHER": stage 1 leaves every shape at its
 * `KINDS` value (multiplier 1 - nothing here changes). Without it, a bigger
 * cap only ever made a looping bot FASTER - more shapes near a fixed-size loop
 * is more shapes caught per closing, so `run.crushed` (what `STAGE_TRIGGER`
 * actually counts) climbed quicker the harder the crowd got, the wrong way
 * round for a run meant to run longer. A shape needing more loops before it
 * counts is what lets "more shapes" and "takes longer to reach 25, then 45"
 * both be true at once. Measured with the bots in `bots.ts` - see the table in
 * `pacing.test.ts`.
 */
export const STAGE_CROWD: Record<Stage, { cap: number; spawn: number; brute: number; hp: number }> = {
  1: { cap: 1, spawn: 1, brute: 0.55, hp: 1 },
  2: { cap: 1.1, spawn: 3.8, brute: 0.3, hp: 2 },
  3: { cap: 1.2, spawn: 6.6, brute: 0.12, hp: 3 },
};

/** How far into the stage each shape joins, as a fraction of it (brute: see `STAGE_CROWD`). */
const JOINS: Record<Exclude<Kind, "warden" | "brute">, number> = { runner: 0, orb: 0.25 };
const WEIGHT: Record<Exclude<Kind, "warden">, number> = { runner: 3, orb: 2, brute: 1 };

/**
 * The warden's lunge: how long, how much faster, how often, from how near - and
 * the WIND-UP before it, when it stands still and glows (round three). A lunge
 * at 130 units/s outruns the snake's 105, and with no warning it landed on a
 * head that was busy closing a loop: at length 60 by the boss, the reviewer
 * "died because I bit my own tail". Nothing bites a tail here; that was this.
 */
export const LUNGE = { ms: 600, boost: 2.6, every: 4000, from: 200, windup: 550 };

/**
 * THE SAFE START (operator ruling R2.4): for this long at the start of a run the
 * shapes wander slowly instead of chasing the head. A first-time player learns
 * the loop on a crowd that is not biting - the reviewer who asked for it circled
 * the bats, was bitten on the way round and never got a loop closed at all.
 */
export const SAFE_START_MS = 20_000;

/**
 * THE BREATHER between stages (round four, operator ruling: "a short
 * breather (e.g. 3 s calm)"): the same wandering `SAFE_START_MS` gives a fresh
 * run, granted again the moment a boss falls and the next stage opens. Set as
 * an absolute clock (`run.t + this`), the same way `calmMs` always has been,
 * so it stacks with nothing and simply holds the crowd off for this long.
 */
export const STAGE_BREATHER_MS = 3000;

/** How fast a wandering shape moves, as a fraction of its chasing speed. */
export const CALM_PACE = 0.35;
/**
 * How fast a wandering shape turns, radians/s. A shape moving at a steady speed
 * and turning at a steady rate walks a CIRCLE of radius speed / turn - so a
 * wanderer mills about where it is (a runner on a circle ~54 units across)
 * instead of drifting off, with no state kept for it at all.
 */
const WANDER_TURN = 0.8;

/** Is the crowd still wandering? */
export const isCalm = (run: Pick<Run, "t" | "calmMs">) => run.t < run.calmMs;

/**
 * Which way a wandering shape faces: its own start angle (from its id), turned
 * at `WANDER_TURN`, clockwise or not by the id's parity. A pure function of the
 * shape and the clock, so wandering spends no random draws and a seeded run
 * replays exactly.
 */
export function wanderHeading(f: Pick<Foe, "id">, t: number): number {
  const spin = f.id % 2 === 0 ? 1 : -1;
  return f.id * 2.399963 + spin * WANDER_TURN * (t / 1000);
}

const progress = (run: Run) => Math.min(1, run.t / LEVELS[run.level].rampMs);

/** The shapes the clock may send right now. Never the warden; the brute's own
 *  join point rises with the stage (`STAGE_CROWD`), the other two never move. */
export function kindsAt(run: Run): Exclude<Kind, "warden">[] {
  const p = progress(run);
  const out: Exclude<Kind, "warden">[] = (Object.keys(JOINS) as Exclude<Kind, "warden" | "brute">[]).filter((k) => p >= JOINS[k]);
  if (p >= STAGE_CROWD[run.stage].brute) out.push("brute");
  return out;
}

/** ms between two shapes: tightening over the stage, eased off for the boss fight,
 *  and tightened again per stage - `STAGE_CROWD`'s "faster spawns". */
export function spawnEvery(run: Run): number {
  const L = LEVELS[run.level];
  const base = L.spawnMs + (L.floorMs - L.spawnMs) * progress(run);
  const staged = base * STAGE_CROWD[run.stage].spawn;
  return run.phase === "boss" ? staged * 1.6 : staged;
}

/**
 * A fresh shape. Every non-warden kind's hp is scaled by `STAGE_CROWD`'s
 * "tougher" - 1 at stage 1, so nothing here moves for the round-three crowd -
 * rounded and floored at 1, so a shape is never immortal or a zero-hit kill.
 * The warden's own hp is set separately, by `startBoss` (`BOSS_HP`).
 */
export function makeFoe(run: Run, kind: Kind, x: number, y: number): Foe {
  const hp = kind === "warden" ? KINDS.warden.hp : Math.max(1, Math.round(KINDS[kind].hp * STAGE_CROWD[run.stage].hp));
  return { id: run.nextId++, kind, x, y, hp, hurt: 0, stun: 0, spikeCool: 0, dash: 0, dashCool: LUNGE.every, windup: 0 };
}

function pick(run: Run, rng: () => number): Exclude<Kind, "warden"> {
  const kinds = kindsAt(run);
  const total = kinds.reduce((n, k) => n + WEIGHT[k], 0);
  let roll = rng() * total;
  for (const k of kinds) if ((roll -= WEIGHT[k]) < 0) return k;
  return kinds[kinds.length - 1];
}

/** Run the spawn clock: send what is due, up to the level's cap - raised per
 *  stage by `STAGE_CROWD`'s "higher cap". */
export function tickSpawns(run: Run, dt: number, rng: () => number): void {
  run.spawnIn -= dt;
  const cap = Math.round(LEVELS[run.level].cap * STAGE_CROWD[run.stage].cap);
  while (run.spawnIn <= 0) {
    run.spawnIn += spawnEvery(run);
    if (run.foes.filter((f) => f.kind !== "warden").length >= cap) continue;
    const kind = pick(run, rng);
    const at = spawnPoint(rng, run);
    run.foes.push(makeFoe(run, kind, at.x, at.y));
  }
}

/** The trigger is met (`bossDue`): the warden for THIS stage comes, tougher
 *  than the one before it (`BOSS_HP`). */
export function startBoss(run: Run, rng: () => number): void {
  run.phase = "boss";
  const at = spawnPoint(rng, run);
  const boss = makeFoe(run, "warden", at.x, at.y);
  boss.hp = BOSS_HP[run.stage];
  run.foes.push(boss);
  run.events.push({ k: "boss" });
}

/**
 * Every shape walks at the head - or, in the safe start, wanders. A stunned one stands; one left a whole view
 * behind is walked back in from the edge, or the cap fills with shapes that
 * never arrive (Neon Survival measured exactly that on its big map).
 */
export function moveFoes(run: Run, dt: number, rng: () => number): void {
  const pace = LEVELS[run.level].pace;
  for (const f of run.foes) {
    f.hurt = Math.max(0, f.hurt - dt);
    f.spikeCool = Math.max(0, f.spikeCool - dt);
    if (f.stun > 0) {
      f.stun = Math.max(0, f.stun - dt);
      continue;
    }
    if (isLeftBehind(run, f.x, f.y)) {
      const at = spawnPoint(rng, run);
      f.x = at.x;
      f.y = at.y;
      continue;
    }
    if (isCalm(run)) {
      wander(f, run.t, (KINDS[f.kind].speed * pace * CALM_PACE * dt) / 1000);
      continue;
    }
    const dx = run.x - f.x;
    const dy = run.y - f.y;
    const d = Math.hypot(dx, dy) || 1;
    if (f.kind === "warden" && lunge(run, f, d, dt)) continue;
    const v = (KINDS[f.kind].speed * pace * (f.dash > 0 ? LUNGE.boost : 1) * dt) / 1000;
    f.x += (dx / d) * Math.min(v, d);
    f.y += (dy / d) * Math.min(v, d);
  }
  separate(run);
}

/** One step of wandering: `v` units along the shape's own turning heading. */
function wander(f: Foe, t: number, v: number): void {
  const a = wanderHeading(f, t);
  f.x += Math.cos(a) * v;
  f.y += Math.sin(a) * v;
}

/**
 * Run the warden's lunge clock. Returns true while it is WINDING UP - standing
 * still, so the scene can draw the warning and a player can step aside.
 *
 * The RECHARGE shortens per stage (`BOSS_LUNGE_MULT`, "boss 3 may lunge more
 * often") - the fuse before the very FIRST lunge stays `LUNGE.every` on every
 * stage (set at creation, in `makeFoe`), so a fresh boss always gives the same
 * first breath before it starts to press.
 */
function lunge(run: Run, f: Foe, d: number, dt: number): boolean {
  f.dash = Math.max(0, f.dash - dt);
  f.dashCool = Math.max(0, f.dashCool - dt);
  if (f.windup > 0) {
    f.windup = Math.max(0, f.windup - dt);
    if (f.windup > 0) return true;
    f.dash = LUNGE.ms;
    run.events.push({ k: "lunge" });
    return false;
  }
  if (f.dashCool === 0 && f.dash === 0 && d < LUNGE.from) {
    f.windup = LUNGE.windup;
    f.dashCool = LUNGE.every * BOSS_LUNGE_MULT[run.stage];
    run.events.push({ k: "windup", x: f.x, y: f.y });
    return true;
  }
  return false;
}

/** Shapes do not stack on one another: overlapping pairs are eased apart. */
function separate(run: Run): void {
  const fs = run.foes;
  for (let i = 0; i < fs.length; i++) {
    for (let j = i + 1; j < fs.length; j++) {
      const a = fs[i];
      const b = fs[j];
      const min = (KINDS[a.kind].r + KINDS[b.kind].r) * 0.9;
      const dx = b.x - a.x;
      const dy = b.y - a.y;
      const d2 = dx * dx + dy * dy;
      if (d2 >= min * min || d2 === 0) continue;
      const d = Math.sqrt(d2);
      const push = (min - d) / 2;
      a.x -= (dx / d) * push;
      a.y -= (dy / d) * push;
      b.x += (dx / d) * push;
      b.y += (dy / d) * push;
    }
  }
}
