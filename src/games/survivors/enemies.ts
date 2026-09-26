// What a shape is, how many of them there are, and which one the gun is aiming at.
//
// Split out of `logic.ts` 2026-09-21, unchanged.

import type { Enemy, EnemyKind, LevelKey, RunState } from "./types";
import { dist2, spawnPoint } from "./world";
import { FINAL, RULES, SHOOTERS, STAGES, SUMMONS, stageT } from "./stages";
import { sightRange } from "./upgrades";

/**
 * The golem's health, and it is MEASURED rather than felt.
 *
 * The fight has to last long enough to be a finish and not so long that it is a
 * chore, so the number is READ off the simulation rather than guessed.
 * `boss.test.ts` measures time-to-kill and prints it, for BOTH arenas - a single
 * figure here would be a portrait figure wearing no label, which is exactly what
 * went stale when the landscape ruling landed.
 *
 * THE 2026-09-13 READING IS KEPT BELOW AND IS NO LONGER TRUE OF THIS TREE, which
 * is the point of writing the date beside a number:
 *
 *                                              portrait     landscape
 *     2026-09-13  loadout (rapid 3/2/1)       18,400 ms     16,000 ms   -13%
 *     2026-09-13  no upgrades at all          83,616 ms     81,120 ms    -3%
 *     2026-09-22  loadout (rapid 3/2/1)       52,096 ms     50,400 ms    -3%
 *     2026-09-22  no upgrades at all           NEVER         NEVER
 *
 * It was read as current on 2026-09-22 and sent a whole tuning pass chasing a
 * 2.8x regression that did not exist. What had happened in between is the stages
 * arc: `RULES.normal.bossHp` multiplies this by 1.45, and `FINAL.normal.hp` by a
 * further 1.25, so the wall a normal run meets is 761 rather than 420 and the
 * 18,400 belongs to a game with one stage and one boss. Measured on that day's
 * tree, with the stale row still in place, the honest before/after of the
 * 2026-09-22 hardening is 42,352 ms -> 52,096 ms.
 *
 * "NEVER" is not a long time: a bare loadout does not bring the golem down
 * inside the 300-second clock `msToKill` gives up at, and that was already true
 * before this change. The test asserts it rather than comparing two numbers, one
 * of which was a stopped clock.
 *
 * The landscape fight is shorter for a reason that is GEOMETRY rather than
 * tuning, and it is not a difficulty change anybody chose: the golem walks in at
 * the top edge, `TARGET_RANGE` is 240, and the landscape arena is only 364 tall,
 * so it is inside the gun's reach almost as soon as it appears. A 560-tall floor
 * makes it walk first.
 *
 * Every figure includes the seconds the golem spends walking in, and every one
 * is the FLOOR of the fight: the player stands still there, so the gun is on
 * target every frame it can be. A real player dodges and loses shots doing it.
 *
 * The second arm is the one worth keeping - arriving at the golem having taken
 * nothing costs 4.5x as long, which is the run's own argument for the upgrades.
 *
 * The test pins the WINDOW (6-40 s), not the number, so retuning a weapon moves
 * the fight length rather than reding a file about something else.
 */
export const BOSS_HP = 420;

/**
 * Size, toughness, pace and worth of each kind. The scene draws from the same row.
 *
 * NO BOSS is a shape the wave clock can send. `kindsAt` never returns one and
 * `stages.test.ts` pins that in both directions, because a golem in the spawn
 * pool would put a 420-health wall into a 40-second-old run and the only tell
 * would be a player who cannot understand why they died.
 */
export const KINDS: Record<EnemyKind, { hp: number; r: number; speed: number; xp: number }> = {
  runner: { hp: 1, r: 9, speed: 62, xp: 1 },
  orb: { hp: 2, r: 12, speed: 44, xp: 2 },
  brute: { hp: 5, r: 17, speed: 30, xp: 4 },
  // A splinter of the golem, and the reason stage 3 has a new kind at all: it is
  // FASTER than a runner and tougher than an orb, so the last minute is the one
  // where standing still stops working. Drawn from the golem sheet at a small
  // scale - no new sprite sheet, which is what kept this whole feature at zero
  // new bytes on the first visit.
  shard: { hp: 3, r: 11, speed: 72, xp: 3 },

  // THE TWO THAT SHOOT BACK (operator ruling 2026-09-21). Both are slow, and
  // that is the deal they offer: they will not run you down, they will make the
  // ground you are standing on a bad place to be. Worth more than the shape they
  // are drawn from, because killing one is a decision rather than a tax.
  spitter: { hp: 3, r: 13, speed: 34, xp: 3 },
  lancer: { hp: 8, r: 19, speed: 26, xp: 6 },

  // THE THREE BOSSES. Each ends a stage, and none of them can be spawned by the
  // wave clock - see `kindsAt`, which is pinned in both directions.
  //
  // The first two pay out a gem and the golem does not, and that is not an
  // oversight: the run CONTINUES after a warden or a queen falls, so a gem they
  // dropped is a gem a player collects, and it is the reward for the fight. The
  // run ENDS on the frame the golem dies, so a gem it dropped would be collected
  // by nobody.
  //
  // Health is a starting number tuned at T9 against the fight lengths the
  // economy gate prints, not a felt one. The golem's 420 is unchanged and stays
  // measured - see BOSS_HP above.
  warden: { hp: 80, r: 20, speed: 46, xp: 12 },
  queen: { hp: 180, r: 23, speed: 40, xp: 20 },
  // r 26 is a 52-unit circle under art drawn 61 units tall, so the golem hits
  // slightly NARROWER than it looks - the forgiving direction, and deliberately
  // the opposite way round from the brute/crab mismatch noted in `sprites.ts`.
  // `xp: 0` because the run ends on the frame it dies: a gem it dropped would
  // never be collected by anyone.
  golem: { hp: BOSS_HP, r: 26, speed: 38, xp: 0 },
};

/**
 * What being an ELITE multiplies.
 *
 * Operator ruling 2026-09-21: the strong monster drops a big gem, not a chest.
 * A chest is a second reward economy beside the gems and can hand a run three
 * levels in one moment; a gem worth ten rides the economy that already exists -
 * `Gem.value` is already a number, so this needed no new field anywhere.
 *
 * Slower and bigger as well as tougher, because a shape with six times the
 * health moving at a runner's pace is not a target, it is a chase. Tuned at T9
 * against the economy gate, not felt.
 */
export const ELITE = { hp: 6, xp: 10, r: 1.3, speed: 0.9 } as const;

/**
 * How often an elite arrives, by stage. None in stage 1 - the first minute is
 * where a player learns what the ordinary shapes do, and a 30-health brute in
 * it would read as the game being broken rather than as a rare event.
 */
export const ELITE_CHANCE: readonly number[] = [0, 0.05, 0.1];

/**
 * Every shape that shoots back, and everything about how it does.
 *
 * ONE table of behaviour, with the LETHALITY a per-level multiplier on top of it
 * (`shotEvery`, `shotSpeed`, `windup` in `RULES`) rather than a second copy of
 * these rows - two tables would be two answers the first time somebody retuned
 * one of them.
 *
 * `windup` is what makes this dodgeable rather than unfair: a shooter STOPS,
 * glows for that long, and only then throws. Everything the player needs in
 * order not to be hit happens before the bolt exists.
 *
 * `keep` is how close it is willing to get. A shooter that walked all the way in
 * would just be a slow runner that also shoots; holding its distance is what
 * makes it a different problem - the thing you have to go and deal with.
 */
export const GUNS: Partial<
  Record<
    EnemyKind,
    {
      /** How far it will shoot. Beyond this it holds its fire and walks. */
      range: number;
      /** How close it tries to get before it stops walking. */
      keep: number;
      /** Milliseconds between one shot being started and the next. */
      every: number;
      /** Units per second. */
      speed: number;
      /** Milliseconds before the bolt expires on its own. */
      life: number;
      /** How many go out per shot. */
      count: number;
      /** Radians between them, when there is more than one. */
      spread: number;
      /** A bolt's collision radius. */
      r: number;
      /** Milliseconds it stands still and glows before the bolt leaves. */
      windup: number;
    }
  >
> = {
  spitter: { range: 235, keep: 150, every: 2600, speed: 118, life: 3200, count: 1, spread: 0, r: 6, windup: 680 },
  lancer: { range: 285, keep: 195, every: 2200, speed: 160, life: 3400, count: 3, spread: 0.26, r: 6, windup: 640 },
  // The GOLEM's own gun, and only a wild golem carries it (`RULES.wild.bossShoots`
  // is what `tickGun` reads). A slow five-bolt fan it cannot miss with and you
  // can walk out of, so hard mode's finish is about where you stand rather than
  // how long you can hold a trigger.
  golem: { range: 420, keep: 0, every: 2400, speed: 135, life: 4200, count: 5, spread: 0.3, r: 7, windup: 800 },
};

/**
 * The ordinary shape each shooter is an elite of, which is what arrives once
 * `RULES[level].shooters` of them are already on the board.
 *
 * It is also the read the art leans on: a spitter wears the slime's body and a
 * lancer the crab's, tinted (`FOR_ENEMY` in `sprites.ts`), so "the elite version
 * of that one" is the same sentence in the rules and on the screen.
 */
export const BASE_OF: Partial<Record<EnemyKind, EnemyKind>> = { spitter: "orb", lancer: "brute" };

/**
 * A boss's health on this level. ONE function, so the wall a player fights and
 * the bar they read it off cannot disagree.
 *
 * That guarantee is not theoretical: the bar used to compute its own maximum
 * from `KINDS[kind].hp`, and under a per-level multiplier a wild bar sat full
 * for the first half of the fight. Both read this now.
 *
 * THE GOLEM TAKES A SECOND MULTIPLIER since 2026-09-22 (`FINAL[level].hp`), on
 * top of the one every boss takes. It is folded in HERE rather than at the
 * spawn for exactly the reason above - a final boss whose health the bar did
 * not know about would reproduce the same defect, one level down.
 *
 *     level    warden   queen   golem
 *     calm         80     180     420
 *     normal      116     261     761
 *     wild        152     342    1277
 */
export const bossHpFor = (kind: EnemyKind, level: LevelKey): number =>
  Math.round(KINDS[kind].hp * RULES[level].bossHp * (kind === "golem" ? FINAL[level].hp : 1));

/** This shape's health, elite or not. The ONE place the multiplier is applied. */
export const hpOf = (kind: EnemyKind, elite = false): number =>
  KINDS[kind].hp * (elite ? ELITE.hp : 1);

/** This shape's gem value, elite or not. */
export const xpOf = (e: Pick<Enemy, "kind" | "elite">): number =>
  KINDS[e.kind].xp * (e.elite ? ELITE.xp : 1);

/** This shape's collision radius, elite or not. */
export const radiusOf = (e: Pick<Enemy, "kind" | "elite">): number =>
  KINDS[e.kind].r * (e.elite ? ELITE.r : 1);

/** This shape's pace, elite or not. */
export const speedOf = (e: Pick<Enemy, "kind" | "elite">): number =>
  KINDS[e.kind].speed * (e.elite ? ELITE.speed : 1);

/** The three that end a stage. Nothing else may ever be `s.boss`. */
export const BOSS_KINDS: readonly EnemyKind[] = ["warden", "queen", "golem"];

export const isBossKind = (k: EnemyKind): boolean => BOSS_KINDS.includes(k);

/** How far your ship can see a target. Beyond it the shot is saved. */
export const TARGET_RANGE = 240;

const CAP_ENEMIES = 64;

/**
 * Which kinds the clock has unlocked. Always at least the little fast one.
 *
 * Reads the STAGE, not the run clock. Every stage before this one has already
 * added its kind and keeps it - the crowd only grows - and the CURRENT stage's
 * addition arrives `unlockMs` into it, which is the knob the difficulty still
 * owns. So a wild run meets each new shape sooner, exactly as it used to, while
 * the stage caps what can appear at all.
 *
 * A BOSS KIND IS NEVER RETURNED. `stages.test.ts` pins that in both directions,
 * because a golem in the spawn pool would put a 420-health wall into a
 * 40-second-old run and the only tell would be a player who cannot understand
 * why they died.
 */
export function kindsAt(s: RunState): EnemyKind[] {
  const kinds: EnemyKind[] = ["runner"];
  for (let i = 0; i < STAGES.length; i++) {
    const stageN = i + 1;
    if (stageN < s.stage) kinds.push(STAGES[i].adds);
    else if (stageN === s.stage && stageT(s) >= RULES[s.level].unlockMs) kinds.push(STAGES[i].adds);
  }
  // The shapes that shoot back, on the levels that have them. The same rule the
  // stage additions follow - a past stage's is in the pool, the current stage's
  // arrives at its own moment - so the crowd only ever grows, and `SHOOTERS.calm`
  // being empty is what makes easy mode's pool identical to what it always was.
  for (const g of SHOOTERS[s.level]) {
    if (g.stage < s.stage || (g.stage === s.stage && stageT(s) >= g.at)) kinds.push(g.kind);
  }
  // QUALITY OVER QUANTITY IS A RATE, NOT A DELETION - and that is a measured
  // decision rather than a preference.
  //
  // Operator ruling 2026-09-22: *"lets do a bit more shooting back and less
  // spamming low level enemies"*. The obvious reading is to drop the runner
  // from the pool once something shoots back, and that was built and measured
  // first. It makes hard mode unwinnable: with the runner gone every shape the
  // clock sends has 2 to 5 times the health, a careful bot went from 1 win in 5
  // to 0 in 5, and it died at 157 to 217 seconds - within twenty seconds of the
  // phase starting - on every thinning setting tried (1.1, 1.15, 1.25, 1.35)
  // and at every shooter cap (3, 4, 5). Gating it on stage 2 did not save it
  // either. The runner is not filler: it is the cheap xp the gun that answers
  // the rest of the crowd is paid for with.
  //
  // So the pool keeps every kind it unlocked, and "less spamming" is delivered
  // by `spawnEvery` sending fewer shapes per second once the quality phase
  // starts (`RULES[level].thin`), while "more shooting back" is delivered by a
  // higher `shooters` cap. Same sentence, and hard mode is still winnable.
  return kinds;
}

export function spawn(s: RunState, rng: () => number) {
  if (s.enemies.length >= CAP_ENEMIES) return;
  const kinds = kindsAt(s);
  let kind = kinds[Math.floor(rng() * kinds.length)];
  // THE SHOOTER CAP, and it downgrades rather than re-rolling: a re-roll would
  // take a second rng call and every calm run ever played would deal a different
  // board. The shape that arrives instead is the ordinary one the shooter is an
  // elite of, so a capped wave is still the crowd the stage asked for - it
  // simply has no more guns in it.
  //
  // MEASURED, not chosen: uncapped, a late wild board held 20 to 23 bolts in the
  // air at once and a bot that dodges perfectly died to a hail it could not read.
  if (GUNS[kind] && s.enemies.reduce((n, q) => n + (GUNS[q.kind] && q.id !== s.boss ? 1 : 0), 0) >= RULES[s.level].shooters) {
    kind = BASE_OF[kind] ?? kind;
  }
  // The elite roll happens for EVERY spawn, including in stage 1 where the
  // chance is zero. Rolling unconditionally keeps the rng stream the same shape
  // on every stage, so the same seed still plays the same run - a roll that only
  // sometimes happens would shift every draw after it.
  const elite = rng() < (ELITE_CHANCE[s.stage - 1] ?? 0);
  // Just outside the VIEW, not the world - see `spawnPoint`.
  const p = spawnPoint(rng, s);
  s.enemies.push({
    id: s.nextId++,
    kind,
    x: p.x,
    y: p.y,
    hp: hpOf(kind, elite),
    flash: 0,
    ...(elite ? { elite: true } : {}),
  });
}

/**
 * How long this shape waits between shots, on this level.
 *
 * ONE function for the same reason `bossHpFor` is one: the boss's `gunCd` is
 * set in two places - once when it walks in, and once after every shot it
 * throws - and those two disagreeing is a boss whose first shot comes at a
 * different cadence from its tenth, which nobody would reproduce on purpose.
 */
export const gunEveryFor = (kind: EnemyKind, level: LevelKey): number =>
  (GUNS[kind]?.every ?? 0) * RULES[level].shotEvery * (kind === "golem" ? FINAL[level].gunEvery : 1);

/**
 * THE FINAL BOSS CALLS IN SHAPES. Operator ruling 2026-09-22.
 *
 * HERE rather than in `logic.ts` because `CAP_ENEMIES` is here, and a summon
 * that ignored the board cap would be the one way to get past it - a golem on
 * wild calls three every six seconds, so a fight that ran long could otherwise
 * push the board past a limit every other spawn respects.
 *
 * They arrive ON the golem's own ring rather than at the view's edge, which is
 * the whole point: a shape walked in from off screen is the swarm, and a shape
 * that appears out of the boss is the boss doing something. It also means they
 * are between you and it, which is what makes them worth calling.
 *
 * Never a shooter and never a boss (`SUMMONS`), because a called-in spitter
 * would be a gun that arrives already inside your guard with no telegraph you
 * could have read.
 */
export function summonAt(s: RunState, e: Enemy, rng: () => number): number {
  const f = FINAL[s.level];
  let made = 0;
  for (let i = 0; i < f.summonCount; i++) {
    if (s.enemies.length >= CAP_ENEMIES) break;
    // Two draws per summon, always both, for the same reason the elite roll
    // above is unconditional: a loop that sometimes drew once would shift every
    // draw after it and re-deal the rest of the run.
    const kind = SUMMONS[Math.floor(rng() * SUMMONS.length)] ?? "runner";
    const a = rng() * Math.PI * 2;
    const ring = radiusOf(e) + 30;
    s.enemies.push({
      id: s.nextId++,
      kind,
      x: e.x + Math.cos(a) * ring,
      y: e.y + Math.sin(a) * ring,
      hp: hpOf(kind),
      flash: 0,
    });
    made += 1;
  }
  return made;
}

/**
 * The nearest shape to a point, within sight of it.
 *
 * `fromX`/`fromY` DEFAULT to the ship, so every caller that asks "what is the
 * gun pointing at" is unchanged. The arc passes its own position instead: a
 * curving shot must steer at what is nearest to IT, not at what was nearest to
 * the ship when it left, or two arcs fired a second apart both bend toward the
 * same shape and the second one chases a corpse.
 */
export function nearestEnemy(s: RunState, fromX = s.x, fromY = s.y): Enemy | null {
  let best: Enemy | null = null;
  // `sightRange`, not the bare constant - the RANGE upgrade extends it. The
  // constant is still the floor and every boss measurement was taken against
  // it, so a run that never buys `range` sees exactly what it always saw.
  let bestD = sightRange(s) ** 2;
  for (const e of s.enemies) {
    if (e.hp <= 0) continue;
    const d = dist2(fromX, fromY, e.x, e.y);
    if (d < bestD) {
      bestD = d;
      best = e;
    }
  }
  return best;
}

/**
 * The golem, while it is on the board, or null before it arrives and after it
 * falls. DERIVED on demand rather than kept: the scene needs its health to draw
 * a bar, and a `bossHp` field beside the enemy's own would be two records of one
 * number, agreeing right up until one of them is updated and the other is not.
 */
export const bossOf = (s: RunState): Enemy | null =>
  s.boss === null ? null : (s.enemies.find((e) => e.id === s.boss) ?? null);

/**
 * Everything a health bar needs, derived in the SIMULATION rather than in the
 * scene - and it is here for a reason a mutation run found rather than a tidiness
 * one.
 *
 * The bar used to be built inside `SurvivorsScene.ts` with `KINDS.golem.hp` as
 * its denominator. That was correct while there was one boss and silently wrong
 * the moment there were three: an 80-health warden would draw at 19% and never
 * move. It was fixed, a test was written for it - and the test could not see the
 * fix, because it asserted against the RUN while the defect lived in the scene,
 * which is a Phaser class nothing in this repo can drive. The planted mutation
 * SURVIVED and the suite read green.
 *
 * So the arithmetic moved to where it can be tested. The scene draws what this
 * returns; it does not compute a second answer of its own.
 */
export function bossBar(s: RunState): { hp: number; maxHp: number; kind: EnemyKind; fill: number } | null {
  const boss = bossOf(s);
  if (!boss) return null;
  // THE RUN'S OWN maximum, not the module's row. `RULES[level].bossHp`
  // multiplies every boss since 2026-09-21, so a bar drawn against calm's figure
  // would sit full for the first 45% of a wild fight and then fall off a cliff -
  // the same defect the comment above describes, one level further out.
  const maxHp = bossHpFor(boss.kind, s.level);
  return { hp: boss.hp, maxHp, kind: boss.kind, fill: Math.max(0, Math.min(1, boss.hp / maxHp)) };
}
