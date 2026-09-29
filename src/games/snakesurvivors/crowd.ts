// The crowd: the shapes, the clock that sends them, how they chase, and the boss.
//
// The three shapes and the warden are Neon Survival's cast, so their sizes
// match the sprites that game already sized - but their NUMBERS are this game's
// own, because a crowd you trap is a different crowd from one you shoot.

import { isLeftBehind, spawnPoint } from "../survivors/world";
import { HIT_COST, START_LEN } from "./body";
import { frostOf, speedOf } from "./cards";
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
  // R4.5 (operator: "more bosses and monsters ... faster monsters"). Each
  // BEHAVES differently rather than being a resized copy:
  //   dasher    stage 2 on. Fast (1.8 x a runner) and weak (always 1 hit). It
  //             runs STRAIGHT at where the head WAS and re-aims every
  //             `DASH.aimMs`, so it overshoots a circle instead of falling in.
  //   shooter   stage 3 on. Walks in to `SHOT.range`, then STANDS, glows and
  //             fires a bolt at where the head is going. A circling snake
  //             swallows everything that walks at it; a bolt it has to dodge.
  //   mini      the MINI-BOSS, halfway to each warden (`MINI_AT`): a big
  //             version of a stage monster that winds up and lunges like the
  //             warden. Its health is `MINI_HP`, set when it comes.
  dasher: { r: 8, speed: 112, hp: 1, drops: [1] },
  shooter: { r: 14, speed: 34, hp: 2, drops: [2, 2] },
  mini: { r: 28, speed: 46, hp: 3, drops: [3, 3, 2] },
};

/** The two boss kinds: only a loop hurts them - no bite, spike, spit, zap, frost, vortex or Nova. */
export const isBoss = (kind: Kind) => kind === "warden" || kind === "mini";

/** The kinds the spawn clock sends. Never a boss. */
export type Sent = Exclude<Kind, "warden" | "mini">;

/** Kinds whose health never scales with the stage: they are weak by design. */
const ALWAYS_WEAK: readonly Kind[] = ["dasher"];

/** The dasher's re-aim clock. */
export const DASH = { aimMs: 900 } as const;
/**
 * The shooter: it stops at `range`, winds up for `windup` ms (glowing - the
 * telegraph), fires a bolt at `speed` aimed where the head WILL be, then waits
 * `every` ms. A bolt lives `life` ms and hits a head within `r` of it. It
 * fires a FAN of `fan` bolts `spread` radians apart, aimed `lead` of the way
 * to where the head will be - one bolt at a snake is dodged by any turn.
 */
export const SHOT = { range: 230, every: 2600, windup: 650, speed: 200, life: 2200, r: 5, fan: 3, spread: 0.22, lead: 0.5 } as const;

/**
 * THE MINI-BOSS (R4.5, operator: "more bosses"): one per stage, when the
 * stage is `MINI_AT` of the way to its warden (`stageProgress`). Its health
 * grows per stage; the three wardens are unchanged.
 */
export const MINI_AT = 0.5;
export const MINI_HP: Record<Stage, number> = { 1: 2, 2: 4, 3: 5 };

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
/*
 * ROUND FOUR (2026-09-29) added two numbers that only act from stage 2 on:
 * `tough` multiplies the stage's shape health (`STAGE_CROWD.hp`), and `bite`
 * is segments a bump costs ON TOP of `HIT_COST`. A third, `goal`, scales the
 * crushes stages 2 and 3 ask for (`stageGoal`): calm sends shapes slowest, so
 * it asks for fewer, and a calm run is not the LONGEST one. Wild also walks faster (pace
 * 1.15 -> 1.3). Measured with the bots: without them a circling bot won 12 of
 * 12 wild runs, and a bot that loops but never takes a card won 4 of 6 normal
 * ones - see `pacing.test.ts`.
 */
export const LEVELS: Record<LevelKey, { spawnMs: number; floorMs: number; rampMs: number; pace: number; cap: number; tough: number; bite: number; bite3: number; goal: number; climb: number }> = {
  calm: { spawnMs: 3000, floorMs: 1600, rampMs: 150_000, pace: 0.85, cap: 11, tough: 1, bite: 0, bite3: 0, goal: 0.75, climb: 0.16 },
  normal: { spawnMs: 2200, floorMs: 1040, rampMs: 180_000, pace: 1, cap: 15, tough: 1.4, bite: 0, bite3: 2, goal: 1, climb: 0.22 },
  wild: { spawnMs: 1700, floorMs: 760, rampMs: 210_000, pace: 1.3, cap: 19, tough: 1.5, bite: 1, bite3: 3, goal: 1.2, climb: 0.22 },
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
 * never resets, so every number here counts from the start of the run, same
 * as stage 1's "10" always did.
 *
 * ROUND FOUR, second pass (2026-09-29, operator: "longer, harder, more
 * enemies"): 25 / 45 became 240 / 660, and stage 2 lost its length trigger.
 * The crowd now comes FASTER at each stage (`STAGE_CROWD`), so a circling
 * player crushes a few shapes a second and the count has to be that much
 * bigger to hold a stage for minutes; and with Long Body a snake can grow past
 * `MAX_LEN`, so a length rung would fire at a different point on every run.
 * Measured stage opening times, circling bot, normal, phone: stage 2 at ~33 s,
 * stage 3 at ~3:40, the win at 6:20-10:30 (the table in `pacing.test.ts`).
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
  2: { len: null, crushed: 240 },
  3: { len: null, crushed: 760 },
} satisfies Record<Stage, { len: number | null; crushed: number }>;
/**
 * Segments one bump costs: `HIT_COST` in stage 1, plus the level's `bite` from
 * halfway through stage 2 (`BITE_FROM`), plus `bite3` in stage 3.
 */
export const biteCost = (run: Pick<Run, "level" | "stage" | "len" | "crushed" | "phase">) =>
  HIT_COST +
  (run.stage > 2 || (run.stage === 2 && stageProgress(run) >= BITE_FROM) ? LEVELS[run.level].bite : 0) +
  (run.stage > 2 ? LEVELS[run.level].bite3 : 0);
/**
 * Where in stage 2 the level's extra `bite` starts (R4.5): not at the opening,
 * which is where every wild death used to be, but once the stage is under way.
 */
export const BITE_FROM = 0.2;

/**
 * THIS run's trigger for a stage: stage 1 is NePo's own, the same on every
 * level; stages 2 and 3 ask the level's `goal` times `STAGE_TRIGGER`.
 */
export function stageGoal(level: LevelKey, stage: Stage): { len: number | null; crushed: number } {
  const at = STAGE_TRIGGER[stage];
  return stage === 1 ? at : { len: at.len, crushed: Math.round(at.crushed * LEVELS[level].goal) };
}

/** Stage 1's trigger, under its round-three name: still read on its own. */
export const BOSS_AT = STAGE_TRIGGER[1];

/**
 * Each boss tougher than the last: more loops to crush it, and a shorter fuse
 * on its lunge. Stage 1 stays `KINDS.warden.hp` rather than a second copy of
 * the same number, so the two can never drift apart.
 */
export const BOSS_HP: Record<Stage, number> = { 1: KINDS.warden.hp, 2: 5, 3: 7 };
// (round four: 3 / 4 / 5 became 3 / 5 / 7 - "tougher bosses")
/** How much of `LUNGE.every` the boss's recharge keeps - under 1 lunges sooner. */
export const BOSS_LUNGE_MULT: Record<Stage, number> = { 1: 1, 2: 0.82, 3: 0.65 };

/**
 * How near THIS stage's boss is, 0 to 1: the larger of its two fractions (no
 * length trigger reads as 0 on that side, so crushed alone decides). With no
 * level given it reads normal's goal.
 */
export function bossProgress(run: Pick<Run, "len" | "crushed" | "stage"> & { level?: LevelKey }): number {
  const at = stageGoal(run.level ?? "normal", run.stage);
  const byLen = at.len == null ? 0 : Math.floor(run.len) / at.len;
  return Math.min(1, Math.max(byLen, run.crushed / at.crushed));
}

/** Is it time for this stage's warden? */
export const bossDue = (run: Pick<Run, "len" | "crushed" | "stage" | "level">) => bossProgress(run) >= 1;

/**
 * How much harder each stage's crowd is than stage 1's baseline (operator
 * ruling: "more and tougher shapes - raise the crowd: faster spawns, the
 * brute joins earlier, higher cap"). `brute` replaces stage 1's fixed `JOINS`
 * entry; `cap` and `spawn` scale the level's own numbers, so a WILD stage 3 is
 * still wilder than a CALM stage 3 - this never overrides the level, only
 * multiplies it.
 *
 * `spawn` multiplies the GAP between two shapes (`spawnEvery`), so UNDER 1 is
 * faster. Round four's first pass had it at 3.8 and 6.6 - stages 2 and 3
 * sending shapes four and seven times SLOWER than stage 1, under a comment
 * that said "faster spawns" - and measured stage 2 at 0.9 shapes on the floor
 * and stage 3 at 0.8, against stage 1's 4.8: the run was long because the
 * arena was empty (operator, 2026-09-29: "it should be longer, harder, more
 * enemies"). Now each stage sends faster and holds more than the one before,
 * and the length comes from the fight instead - more crushes to the next
 * warden (`STAGE_TRIGGER`), tougher wardens (`BOSS_HP`), and:
 *
 * `hp`, the other half of "TOUGHER": stage 1 leaves every shape at its `KINDS`
 * value (multiplier 1 - nothing here changes); from stage 2 a shape needs
 * that many loops, times the level's `tough`. `pace` makes them walk faster.
 * Measured with the bots in `bots.ts` - see the table in `pacing.test.ts`.
 */
export const STAGE_CROWD: Record<Stage, { cap: number; spawn: number; brute: number; hp: number }> = {
  1: { cap: 1, spawn: 1, brute: 0.55, hp: 1 },
  2: { cap: 2.0, spawn: 0.45, brute: 0.3, hp: 3 },
  3: { cap: 3.2, spawn: 0.28, brute: 0.12, hp: 4 },
};

/**
 * R4.5: DIFFICULTY THAT KEEPS GROWING, with no wall at a stage's opening.
 *
 * Round four measured every circling-bot death in the first minute of stage 2:
 * the crowd's cap, spawn rate and health all jumped the moment the first warden
 * fell. Now a stage's crowd CLIMBS from the last stage's numbers to its own
 * over the first `RAMP_IN` of the stage (`crowdAt`), and the crowd's walking
 * pace grows by the level's `climb` across every stage, continuously - so the
 * last shape of a stage and the first of the next walk at the same speed.
 */
export const RAMP_IN = 0.25;

/**
 * How far through THIS stage a run is, 0 to 1, counted from where the stage
 * opened. Stage 1 opens at `START_LEN` and 0 crushed, so its length half
 * counts from the starting length - a new snake is 28 long, not 56% of the
 * way to its first warden.
 */
export function stageProgress(run: Pick<Run, "len" | "crushed" | "stage" | "level" | "phase">): number {
  if (run.phase === "boss" || run.phase === "won") return 1;
  if (run.stage === 1) {
    const byLen = (Math.floor(run.len) - START_LEN) / (BOSS_AT.len - START_LEN);
    return Math.max(0, Math.min(1, Math.max(byLen, run.crushed / BOSS_AT.crushed)));
  }
  const from = stageGoal(run.level, (run.stage - 1) as Stage).crushed;
  const to = stageGoal(run.level, run.stage).crushed;
  return Math.max(0, Math.min(1, (run.crushed - from) / (to - from)));
}

const anchor = (level: LevelKey, stage: Stage) => ({
  cap: STAGE_CROWD[stage].cap,
  spawn: STAGE_CROWD[stage].spawn,
  hp: stage === 1 ? 1 : STAGE_CROWD[stage].hp * LEVELS[level].tough,
});

/** The crowd's numbers RIGHT NOW: cap and spawn multipliers, the health multiplier, and the pace. */
export function crowdAt(run: Pick<Run, "len" | "crushed" | "stage" | "level" | "phase">): { cap: number; spawn: number; hp: number; pace: number } {
  const p = stageProgress(run);
  const cur = anchor(run.level, run.stage);
  const prev = run.stage === 1 ? cur : anchor(run.level, (run.stage - 1) as Stage);
  const t = run.stage === 1 ? 1 : Math.min(1, p / RAMP_IN);
  const mix = (a: number, b: number) => a + (b - a) * t;
  return {
    cap: mix(prev.cap, cur.cap),
    spawn: mix(prev.spawn, cur.spawn),
    hp: mix(prev.hp, cur.hp),
    pace: 1 + LEVELS[run.level].climb * (run.stage - 1 + p),
  };
}

/** How far into the stage each shape joins, as a fraction of it (brute: see `STAGE_CROWD`). */
const JOINS: Record<"runner" | "orb", number> = { runner: 0, orb: 0.25 };
/** The stage each R4.5 shape first comes in. */
export const JOINS_STAGE: Record<"dasher" | "shooter", Stage> = { dasher: 2, shooter: 3 };
const WEIGHT: Record<Sent, number> = { runner: 3, orb: 2, brute: 1, dasher: 2, shooter: 2 };

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

/** The shapes the clock may send right now. Never a boss; the brute's own
 *  join point rises with the stage (`STAGE_CROWD`), the dasher and the shooter
 *  come with their stage (`JOINS_STAGE`). */
export function kindsAt(run: Run): Sent[] {
  const p = progress(run);
  const out: Sent[] = (Object.keys(JOINS) as ("runner" | "orb")[]).filter((k) => p >= JOINS[k]);
  if (p >= STAGE_CROWD[run.stage].brute) out.push("brute");
  for (const k of ["dasher", "shooter"] as const) if (run.stage >= JOINS_STAGE[k]) out.push(k);
  return out;
}

/** ms between two shapes: tightening over the stage, eased off for the boss fight,
 *  and multiplied per stage by `STAGE_CROWD.spawn` - under 1 from stage 2, so faster. */
export function spawnEvery(run: Run): number {
  const L = LEVELS[run.level];
  const base = L.spawnMs + (L.floorMs - L.spawnMs) * progress(run);
  const staged = base * crowdAt(run).spawn;
  return run.phase === "boss" ? staged * 1.6 : staged;
}

/**
 * A fresh shape. Every non-warden kind's hp is scaled by `STAGE_CROWD`'s
 * "tougher" - 1 at stage 1, so nothing here moves for the round-three crowd -
 * rounded and floored at 1, so a shape is never immortal or a zero-hit kill.
 * The warden's own hp is set separately, by `startBoss` (`BOSS_HP`).
 */
export function makeFoe(run: Run, kind: Kind, x: number, y: number): Foe {
  const stageHp = ALWAYS_WEAK.includes(kind) ? 1 : crowdAt(run).hp;
  const hp = isBoss(kind) ? KINDS[kind].hp : Math.max(1, Math.round(KINDS[kind].hp * stageHp));
  return { id: run.nextId++, kind, x, y, hp, hurt: 0, stun: 0, spikeCool: 0, dash: 0, dashCool: LUNGE.every, windup: 0, slow: 0 };
}

function pick(run: Run, rng: () => number): Sent {
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
  const cap = Math.round(LEVELS[run.level].cap * crowdAt(run).cap);
  while (run.spawnIn <= 0) {
    run.spawnIn += spawnEvery(run);
    if (run.foes.filter((f) => !isBoss(f.kind)).length >= cap) continue;
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

/** Halfway to this stage's warden (`MINI_AT`): its mini-boss comes, once. */
export function tickMini(run: Run, rng: () => number): void {
  if (run.phase !== "stage" || run.mini >= run.stage || stageProgress(run) < MINI_AT) return;
  run.mini = run.stage;
  const at = spawnPoint(rng, run);
  const m = makeFoe(run, "mini", at.x, at.y);
  m.hp = MINI_HP[run.stage];
  m.form = run.stage;
  run.foes.push(m);
  run.events.push({ k: "mini", x: at.x, y: at.y, stage: run.stage });
}

/**
 * Every shape walks at the head - or, in the safe start, wanders. A stunned one stands; one left a whole view
 * behind is walked back in from the edge, or the cap fills with shapes that
 * never arrive (Neon Survival measured exactly that on its big map).
 */
export function moveFoes(run: Run, dt: number, rng: () => number): void {
  const pace = LEVELS[run.level].pace * crowdAt(run).pace;
  for (const f of run.foes) {
    f.hurt = Math.max(0, f.hurt - dt);
    f.spikeCool = Math.max(0, f.spikeCool - dt);
    f.slow = Math.max(0, f.slow - dt);
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
    const cold = f.slow > 0 ? frostOf(run) : 1;
    if (f.kind === "dasher") {
      dashAt(run, f, (KINDS.dasher.speed * pace * cold * dt) / 1000, dt);
      continue;
    }
    if (f.kind === "shooter" && shoot(run, f, dt)) continue;
    const dx = run.x - f.x;
    const dy = run.y - f.y;
    const d = Math.hypot(dx, dy) || 1;
    if (isBoss(f.kind) && lunge(run, f, d, dt)) continue;
    const v = (KINDS[f.kind].speed * pace * cold * (f.dash > 0 ? LUNGE.boost : 1) * dt) / 1000;
    f.x += (dx / d) * Math.min(v, d);
    f.y += (dy / d) * Math.min(v, d);
  }
  separate(run);
}

/**
 * A dasher runs STRAIGHT at the point it last aimed at - where the head was -
 * and re-aims every `DASH.aimMs`, or at once when it gets there. A pursuer
 * that keeps re-aiming falls into a circling snake's loop; this one cuts
 * across it.
 */
function dashAt(run: Run, f: Foe, v: number, dt: number): void {
  if (!f.aim || f.aim.ms <= 0) f.aim = { x: run.x, y: run.y, ms: DASH.aimMs };
  f.aim.ms -= dt;
  const dx = f.aim.x - f.x;
  const dy = f.aim.y - f.y;
  const d = Math.hypot(dx, dy);
  if (d < 2) {
    f.aim.ms = 0;
    return;
  }
  f.x += (dx / d) * Math.min(v, d);
  f.y += (dy / d) * Math.min(v, d);
}

/**
 * A shooter within `SHOT.range` STANDS and runs its clock: wind up, fire, wait.
 * Returns true while it stands (so it does not also walk). The aim LEADS the
 * head by the bolt's flight time along its heading - a snake that holds its
 * course is hit, one that turns hard dodges.
 */
function shoot(run: Run, f: Foe, dt: number): boolean {
  const d = Math.hypot(run.x - f.x, run.y - f.y);
  if (d > SHOT.range && f.windup === 0) return false;
  f.fire = Math.max(0, (f.fire ?? SHOT.every / 2) - dt);
  if (f.windup > 0) {
    f.windup = Math.max(0, f.windup - dt);
    if (f.windup === 0) {
      const ahead = (d / SHOT.speed) * speedOf(run) * SHOT.lead;
      const tx = run.x + Math.cos(run.heading) * ahead;
      const ty = run.y + Math.sin(run.heading) * ahead;
      const a0 = Math.atan2(ty - f.y, tx - f.x);
      for (let i = 0; i < SHOT.fan; i++) {
        const a = a0 + (i - (SHOT.fan - 1) / 2) * SHOT.spread;
        run.bolts.push({ x: f.x, y: f.y, vx: Math.cos(a) * SHOT.speed, vy: Math.sin(a) * SHOT.speed, life: SHOT.life });
      }
      run.events.push({ k: "bolt", x: f.x, y: f.y });
      // A level's pace is also its shooters' trigger finger: wild fires 1.3x as often.
      f.fire = SHOT.every / LEVELS[run.level].pace;
    }
    return true;
  }
  if (f.fire === 0) f.windup = SHOT.windup;
  return true;
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
