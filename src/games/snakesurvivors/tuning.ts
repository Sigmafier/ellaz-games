// The crowd's NUMBERS: each shape's stats, each level's clock and cap, the
// stage triggers, the bosses' health, and how far through a stage a run is.
// Pure tables and fractions - nothing here moves a shape or sends one.
//
// Split out of `crowd.ts`, which re-exports every name here unchanged, so an
// importer reads them from `./crowd` exactly as before.

import { HIT_COST, START_LEN } from "./body";
import type { Kind, LevelKey, Run, Stage } from "./types";

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
