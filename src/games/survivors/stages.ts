// How hard the run is, how fast it tightens, and the three stages it is made of.
//
// Split out of `logic.ts` 2026-09-21; the stages arrived the same day. Both
// answer one question - how much pressure is the run under right now - and two
// modules that always change together are one module wearing two names.
//
// Operator ruling 2026-09-21, picked off a drawn before/after: a run is three
// stages of sixty seconds, each ending in a boss, and everything the player has
// earned carries across the boundary.

import type { EnemyKind, LevelKey, RunState } from "./types";

/**
 * What the three levels actually change: how fast the wave clock tightens, how
 * quickly the shapes come at you, and how soon a stage's new kind appears.
 * Nothing here touches your own ship - a calm run is a smaller crowd, never a
 * stronger player, so an upgrade means the same thing on all three.
 *
 * `unlockMs` REPLACED `orbAt`/`bruteAt` when the stages landed, and the reason
 * is that those were absolute times into the run: with three stages they would
 * have said "the brute appears 55 seconds in" about a stage that has not started
 * yet. Each stage now adds exactly one kind, `unlockMs` into that stage, so the
 * level still controls the ramp and the stage still caps the pool.
 *
 * TUNED AT T9 against `assert:survivors-economy`, not felt. The starting values
 * below keep roughly today's ramp (orb at 45/30/18 s into a flat run) inside a
 * 60-second stage.
 */
export const RULES: Record<
  LevelKey,
  {
    spawnMs: number;
    floorMs: number;
    tighten: number;
    speed: number;
    unlockMs: number;
    /**
     * How long ONE of this level's three stages lasts. Operator ruling
     * 2026-09-21: *"the whole game in hard mode takes 5 minutes ... lets make it
     * closer to 8-10 minutes"*, and *"Dont touch the easy mode"*. Three stages,
     * so this is a third of the swarm - 3:00 on calm, 5:00 on normal, 8:00 on
     * wild, plus the three boss fights.
     */
    stageMs: number;
    /**
     * How many shapes that shoot back may be on the board at once. Above this
     * the wave clock sends the ordinary shape they are elites of instead.
     */
    shooters: number;
    /**
     * QUALITY OVER QUANTITY, once this level's shooters are armed.
     *
     * Operator ruling 2026-09-22: *"In advanced phases, like when they start
     * shot back, lets do a bit more shooting back and less spamming low level
     * enemies. Like quality over quantity."*
     *
     * Multiplies `spawnEvery` from the moment the first shooter joins the pool,
     * so the back half of a run sends FEWER shapes - and `kindsAt` drops the
     * runner from the pool at the same moment, so the ones it does send are the
     * ones worth dealing with. Both halves are needed: thinning alone is just an
     * easier run, and dropping the runner alone is the same crowd wearing
     * bigger shapes.
     *
     * 1 on calm, which never arms a shooter at all, so easy mode never reads
     * this for a reason other than it being its identity element.
     */
    thin: number;
    /** Multiplies every shooter's `every`: above 1 is a slower gun. */
    shotEvery: number;
    /** Multiplies every shooter's bolt speed: below 1 is one you can walk away from. */
    shotSpeed: number;
    /** Multiplies every shooter's wind-up: above 1 is a longer telegraph, so more warning. */
    windup: number;
    /** Multiplies every BOSS's health. A longer run deserves a bigger wall at the end of it. */
    bossHp: number;
    /** Does the GOLEM itself shoot? Hard alone, so the finish is a different fight. */
    bossShoots: boolean;
    /**
     * The FLAT part of `xpNeeded` - what the very first level-up costs, before
     * the per-power terms are added.
     *
     * Operator ruling 2026-09-22: *"Make the upgrades even less frequent (mostly
     * in early game)"*, and this is the lever that says "mostly in early game"
     * rather than "everywhere". It is an OFFSET, so at power 0 it is the whole
     * cost and by power 10 it is a tenth of it:
     *
     *                  p=0   p=1   p=5   p=10   p=20
     *     calm (1)       1     5    21     41     81
     *     normal (5)     5     9    26     47     90    +400%, +80%, +24%, +15%, +11%
     *
     * `xpBase`, the multiplier beside it, was tried first and rejected on a
     * measurement: at 1.25 on both harder levels a wild run fell from 1 win in 5
     * to 0 in 5 and died at 157 seconds, because a multiplier raises the LATE
     * cost too and wild's crowd keeps hardening whether or not the player can
     * keep up. Same trap the note on `xpNeeded` already records at 1.7.
     */
    xpFirst: number;
    /** `xpNeeded` scales the whole flat cost by this... */
    xpBase: number;
    /** ...and adds this much of a QUADRATIC term, which is what stretches the late gaps. */
    xpRamp: number;
  }
> = {
  // EVERY FIELD THAT EXISTED BEFORE 2026-09-21 IS THE ONE IT ALWAYS WAS, and the
  // six added here are its identity element: one stage of sixty seconds, no
  // shooters, no boss multiplier and the flat xp curve. `calm-is-untouched.test.ts`
  // plays a whole calm run and fingerprints it against a recording taken before
  // the hardening, because "we did not touch it" is otherwise a claim with
  // nothing behind it.
  calm: {
    spawnMs: 1150, floorMs: 320, tighten: 3.6, speed: 0.82, unlockMs: 24_000,
    stageMs: 60_000, shooters: 0, thin: 1, shotEvery: 1, shotSpeed: 1, windup: 1,
    bossHp: 1, bossShoots: false, xpFirst: 1, xpBase: 1, xpRamp: 0,
  },
  // SOME, which is the operator's word for the middle. The stage is two thirds
  // longer, the crowd tightens to a lower floor, one shape shoots back from
  // stage 2 and it is the LESS LETHAL one: a longer telegraph, a slower bolt,
  // a longer wait between shots, and never more than three of them at once.
  normal: {
    spawnMs: 890, floorMs: 200, tighten: 2.4, speed: 1.0, unlockMs: 16_000,
    stageMs: 100_000, shooters: 3, thin: 1.25, shotEvery: 1.35, shotSpeed: 0.85, windup: 1.35,
    // `bossShoots` FLIPPED 2026-09-22. Only the golem has a gun, so this reads
    // "the final boss shoots on medium too" rather than "every boss does" - and
    // it is the mildest version of it, because every bolt it throws is still
    // slowed by 0.85 and telegraphed 1.35x as long by the two rows above.
    bossHp: 1.45, bossShoots: true, xpFirst: 14, xpBase: 1.0, xpRamp: 0.06,
  },
  // A LOT. Eight minutes of swarm, a spitter in the first stage and the lancer's
  // three-bolt fan in the last, bolts that come sooner and faster with less
  // warning, and bosses with two and a half times the health.
  //
  // `tighten` is LOWER than it was (5.2 -> 2.2) and that is not a softening: the
  // ramp is a fraction of the run rather than a slope. At 5.2 a wild run reached
  // its spawn floor 84 seconds in, which is a sixth of an eight-minute run - so
  // the crowd was at its maximum before the second stage and flat for the rest.
  // It starts denser instead (520 ms against 680) and arrives at a lower floor
  // (150 against 165) at 2:48.
  wild: {
    spawnMs: 660, floorMs: 150, tighten: 2.0, speed: 1.18, unlockMs: 9_000,
    stageMs: 160_000, shooters: 4, thin: 1.25, shotEvery: 0.9, shotSpeed: 1.12, windup: 0.85,
    bossHp: 1.9, bossShoots: true, xpFirst: 1, xpBase: 1.0, xpRamp: 0.4,
  },
};

/**
 * How long one of this level's stages lasts.
 *
 * `STAGE_MS` below stays exported and stays sixty seconds, so every caller that
 * does not care about the level - and every comment written before the levels
 * had their own clocks - reads exactly what it read before. What a RUN is held
 * to is this.
 */
export const stageMs = (level: LevelKey): number => RULES[level].stageMs;

/** The whole swarm, on this level: three stages of it. */
export const runMs = (level: LevelKey): number => RULES[level].stageMs * STAGE_COUNT;

/** Which reward tier a survived run is worth. One table, so nothing has to guess. */
export const TIER: Record<LevelKey, "easy" | "medium" | "hard"> = {
  calm: "easy",
  normal: "medium",
  wild: "hard",
};

/** How long each stage's SWARM phase lasts. Three of them make today's three minutes. */
export const STAGE_MS = 60_000;

/** How many stages a run has. The last one's boss is the finish. */
export const STAGE_COUNT = 3;

/**
 * The three stages. Each ADDS one kind to the pool and ends with one boss.
 *
 * `adds` is what is new HERE - everything an earlier stage added stays, so the
 * crowd only ever grows. The runner is in the pool from the first frame and is
 * therefore not listed: a stage that added nothing would still have to be able
 * to send something.
 */
export const STAGES: readonly { adds: EnemyKind; boss: EnemyKind }[] = [
  { adds: "orb", boss: "warden" },
  { adds: "brute", boss: "queen" },
  { adds: "shard", boss: "golem" },
];

/**
 * THE FINAL BOSS, and only the final boss.
 *
 * Operator ruling 2026-09-22, after playing the hardened build: *"Make the final
 * boss harder to kill, faster, fires back more, spawns some enemies. Make it
 * follow me more."* Five asks, and this row is four of them - the fifth, the
 * following, is not a number (see `logic.ts`, where the boss keeps walking
 * through its own wind-up while every other shooter roots itself).
 *
 * A TABLE OF ITS OWN rather than more fields on `RULES`, for the same reason
 * `SHOOTERS` is one: `RULES` describes the CROWD, and every row in it is read
 * sixty times a second against every shape on the board. This is read against
 * one shape that exists for the last thirty seconds of a run. Keeping them apart
 * is also what makes "the golem is tougher" a one-row change that cannot reach
 * a runner by accident.
 *
 * `hp` and `speed` MULTIPLY what the level already does - `RULES[level].bossHp`
 * still applies to all three bosses - so the golem is the level's boss curve
 * TIMES this, and the warden and the queen are untouched by anything here.
 *
 * Calm's row is every field's identity element. That is not decoration: it is
 * the second independent guarantee that easy mode never meets any of this, the
 * first being that `RULES.calm.bossShoots` is false.
 */
export const FINAL: Record<
  LevelKey,
  {
    /** Multiplies the golem's health, ON TOP of `RULES[level].bossHp`. */
    hp: number;
    /** Multiplies how fast the golem walks. It is the slowest thing in the game at 1. */
    speed: number;
    /** Multiplies the golem's `every`: below 1 is a gun that comes round sooner. */
    gunEvery: number;
    /** Milliseconds between the golem CALLING IN shapes. `Infinity` is never. */
    summonMs: number;
    /** How many it calls each time. Zero pairs with an `Infinity` above it. */
    summonCount: number;
  }
> = {
  calm: { hp: 1, speed: 1, gunEvery: 1, summonMs: Infinity, summonCount: 0 },
  // SOME, in the operator's word for the middle. The golem shoots here now
  // (`bossShoots`), which it did not before, but everything it throws is still
  // read through normal's gentler `shotEvery`, `shotSpeed` and `windup`.
  normal: { hp: 1.25, speed: 1.15, gunEvery: 1, summonMs: 9_000, summonCount: 2 },
  // A LOT. Half again the health, a third faster, a gun round in under two
  // thirds of the time, and three shapes called in every six seconds.
  wild: { hp: 1.4, speed: 1.3, gunEvery: 0.62, summonMs: 6_000, summonCount: 3 },
};

/** What the golem calls in. Never a boss, and never something that shoots back. */
export const SUMMONS: readonly EnemyKind[] = ["runner", "orb", "brute"];

/**
 * The shapes that SHOOT BACK, and which stage of which level first sends one.
 *
 * Operator ruling 2026-09-21: *"lets introduce some harder enemies maybe that
 * shoots a bit back and need to dodge it. Make it a bit harder as we go ... The
 * sooting back guys keep in medium (less lethal) and hard (more brutal)."*
 *
 * A TABLE OF ITS OWN rather than a fourth field on `STAGES`, because `STAGES` is
 * the same on every level by design - it is what a stage IS - and this is the
 * one part of the crowd that differs between them. Calm's row is empty and
 * `RULES.calm.shooters` is 0, which is two independent guarantees that easy mode
 * never meets one.
 *
 * `at` is milliseconds into that stage, the same shape as `unlockMs`: nothing
 * shoots in the first minute of a medium run or the first forty-five seconds of
 * a hard one, because a player has to learn to steer before anything asks them
 * to dodge.
 */
export const SHOOTERS: Record<LevelKey, readonly { kind: EnemyKind; stage: number; at: number }[]> = {
  calm: [],
  normal: [{ kind: "spitter", stage: 2, at: 35_000 }],
  wild: [
    { kind: "spitter", stage: 1, at: 80_000 },
    { kind: "lancer", stage: 3, at: 30_000 },
  ],
};

/**
 * The first stage the QUALITY-OVER-QUANTITY rule may apply in.
 *
 * TWO, and it is load-bearing rather than round. The operator's words were *"in
 * ADVANCED phases, like when they start shot back"*, and on wild those two are
 * not the same moment: its spitter arms at stage 1 plus 80 seconds, which is
 * eighty seconds into an eight-minute run. Triggering the rule there took wild
 * from 1 win in 5 to 0 in 5, dying at 109 to 156 seconds, because it deleted the
 * runner - the shape a first stage is mostly made of - before the player had
 * anything to fight it with. Measured, three thinning settings, same result
 * every time; the trigger was wrong, not the amount.
 */
export const QUALITY_STAGE = 2;

/**
 * Has this level's crowd reached the phase where something shoots back?
 *
 * THE SAME PREDICATE `kindsAt` USES, exported so the spawn clock and the spawn
 * pool cannot disagree about when the back half of a run starts. Two copies of
 * "are the shooters out yet" is two answers the first time somebody retunes
 * `SHOOTERS`, and the whole point of the ruling is that both things happen at
 * the same moment.
 *
 * BOTH conditions, not either: something shoots back AND the run is past its
 * first stage. Always false on calm, because `SHOOTERS.calm` is empty.
 */
export const shootersArmed = (s: Pick<RunState, "level" | "stage" | "t">): boolean =>
  s.stage >= QUALITY_STAGE &&
  SHOOTERS[s.level].some((g) => g.stage < s.stage || (g.stage === s.stage && stageT(s) >= g.at));

/**
 * How often a shape arrives: tightening with the clock, never below the floor -
 * and THINNED once this level's shooters are armed.
 */
export function spawnEvery(s: RunState): number {
  const r = RULES[s.level];
  const base = Math.max(r.floorMs, r.spawnMs - (s.t / 1000) * r.tighten);
  // The multiplier goes OUTSIDE the floor, not inside it. Inside, `floorMs`
  // would cap the thinned interval at the same number it caps the dense one and
  // the whole rule would vanish exactly when the crowd is thickest, which is
  // when it is meant to apply.
  return shootersArmed(s) ? base * r.thin : base;
}

/**
 * Milliseconds into the CURRENT stage's swarm phase.
 *
 * DERIVED, never stored, for the same reason `cameraOf` and `bossOf` are: a
 * second record of a number `t` and `stage` already determine between them is
 * two records of one fact, and they drift the first time one is updated and the
 * other is not. `t` does not advance while a boss is up, so this holds at
 * `STAGE_MS` for the whole fight rather than running past it.
 */
export const stageT = (s: Pick<RunState, "t" | "stage" | "level">): number =>
  s.t - (s.stage - 1) * stageMs(s.level);

/** Has this stage's swarm phase run out, so its boss should walk in? */
export const stageIsOver = (s: Pick<RunState, "t" | "stage" | "level">): boolean =>
  stageT(s) >= stageMs(s.level);

/** Which boss ends this stage. */
export const bossKindFor = (stage: number): EnemyKind =>
  STAGES[Math.min(STAGES.length, Math.max(1, stage)) - 1].boss;

/** Is this stage the last one, so beating its boss wins the run? */
export const isLastStage = (stage: number): boolean => stage >= STAGE_COUNT;
