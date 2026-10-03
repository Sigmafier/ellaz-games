// Neon Survival - the frame loop, with no DOM, no Phaser and no clock of its
// own. The scene hands it a frame's worth of milliseconds and a steering vector;
// everything that happens in the arena happens here or in the modules below, so
// the rules can be played out a hundred times in node without a canvas.
//
// `step` MUTATES the state it is given rather than returning a fresh one. That
// is deliberate and it is the one place this file departs from the shape the
// rest of the roster uses: at 60 frames a second with up to 64 shapes, 48 bolts
// and their gems, rebuilding the world every frame is thousands of short-lived
// objects a second for a phone to collect. It stays testable because the
// function is still a pure function of (state, dt, input, rng) - the same seed
// plays the same run, which is exactly what `logic.test.ts` leans on.
//
// SPLIT 2026-09-21. This file was 829 lines, over this repo's 500-line gate, and
// the stages-and-evolutions work would have doubled it. What a shape is, what a
// weapon does, what an upgrade is worth and how hard the level is each moved to
// their own module; what is left is `newRun`, `step`, and the one place a kill
// is paid out. The move was byte-for-byte: the suite was 106 green before and
// 106 green after, so a red here means a real regression rather than churn.
//
// Everything this file re-exports below is re-exported on purpose: eight test
// files, the scene and the chrome import those names from HERE, and a split
// that made twenty-five import lines move would be a diff nobody could read.
//
// The direct module, never the `@shared` barrel: the barrel re-exports React
// components, and `logic-is-pure.test.ts` fails the build for importing it here.

import { mulberry32 } from "@shared/rng";
import type { Arena, Enemy, EnemyKind, RunState, WeaponId } from "./types";
import { cameraOf, clampToWorld, dist2, inView, isLeftBehind, keepInRing, ringAround, spawnPoint, worldFor } from "./world";
import { BLADES, DRONE, bladePositions, holds } from "./arsenal";
import { CAP_FIRES, NOVA_FIRE, raiseSuper } from "./evolve";
import { FREEZE_NEED, dashAway, tickPowers } from "./powers";
import { GUNS, bossHpFor, gunEveryFor, nearestEnemy, radiusOf, spawn, speedOf, summonAt, xpOf } from "./enemies";
import { WEAPONS, fireSlot, mainSlot, weaponDamage, weaponEvery } from "./weapons";
import { pulseHalo, zapSlot } from "./arms";
import { PICKUP_MS, dropFor, tickPickups } from "./pickups";
import { FINAL, RULES, STAGE_MS, bossKindFor, isLastStage, spawnEvery, stageIsOver, stageMs } from "./stages";
import { magnetRange, playerSpeed, shieldEvery, shieldReady, xpNeeded } from "./upgrades";
// THE CAREER (P3). Every call below sits behind `if (s.career)`, so a quick run -
// which has no career - runs exactly the lines it ran before, draw for draw.
import { careerClock, careerCoins, careerEnd, careerLoot, careerTime } from "./careerHooks";
import { slide, tickPools } from "./twists";

// The public surface, unchanged by the split. Types first, then the tables and
// the derived numbers, then this file's own.
export type {
  Arena,
  Bolt,
  Enemy,
  EnemyKind,
  Gem,
  LevelKey,
  RunEvent,
  RunState,
  ShotKind,
  Slot,
  UpgradeId,
  WeaponId,
  WeaponRow,
} from "./types";
export { EVOLUTIONS, PARTNER_NEED, RECIPE, SWARM_DRONES, applyEvolve, canEvolve, evolvable, hasEvolution, raiseSuper, recipeProgress } from "./evolve";
export { FINAL, RULES, SHOOTERS, STAGE_COUNT, STAGE_MS, STAGES, SUMMONS, TIER, bossKindFor, isLastStage, runMs, spawnEvery, stageIsOver, stageMs, stageT } from "./stages";
export { BASE_OF, BOSS_KINDS, ELITE, ELITE_CHANCE, GUNS, KINDS, bossBar, bossHpFor, bossOf, gunEveryFor, hpOf, isBossKind, kindsAt, nearestEnemy, radiusOf, speedOf, summonAt, xpOf } from "./enemies";
export { MAIN_PERK, STORM_JUMPS, WEAPONS, WEAPON_LV_MAX, canLevel, freshSlot, mainSlot, rowFor, weaponDamage, weaponEvery } from "./weapons";
export {
  UPGRADE_CAP,
  UPGRADE_IDS,
  shieldEvery,
  shieldReady,
  sightRange,
  applyUpgrade,
  boltCount,
  boltDamage,
  fireEvery,
  magnetRange,
  offerUpgrades,
  playerSpeed,
  xpNeeded,
} from "./upgrades";

/**
 * The PHONE arena. Portrait, because a phone is.
 *
 * It is still exported under its old name and is still the DEFAULT of `newRun`,
 * so every existing test and every caller that does not care reads exactly what
 * it read before.
 */
export const ARENA: Arena = { w: 420, h: 560 };

/**
 * The DESKTOP arena. Landscape, because a desktop window is.
 *
 * Operator ruling 2026-09-13, picked off a drawn mock at their own 1536x695:
 * *"make it landscape on PC"*. It supersedes the earlier "scale it up only"
 * reading, and it is a bigger change than it looks - a wider arena shows more
 * battlefield, so it changes what the player can SEE and therefore how hard the
 * run is. Every timing measured against the portrait arena is invalidated by it.
 *
 * THE SAME AREA, NOT THE SAME HEIGHT, and that is a deliberate conservative
 * choice rather than an arithmetic accident:
 *
 *     portrait    420 x 560  = 235,200 sq units
 *     same AREA   648 x 364  = 235,872   (+0.3%)   <- this
 *     same HEIGHT 996 x 560  = 557,760   (+137%)
 *
 * Enemies arrive at a rate the clock sets, not a rate per unit of floor, so
 * doubling the floor would roughly halve the crowd a player has to deal with -
 * a much easier game, handed out silently under the name of a layout change.
 * Holding the area constant keeps the density it was tuned at, and leaves the
 * difficulty question a separate, deliberate one. 16:9 because that is the
 * shape of the window it is filling.
 *
 * WHAT IT DOES CHANGE, stated rather than hidden: the arena is 648 wide against
 * a 240-unit `TARGET_RANGE`, so the gun can no longer cover the full width from
 * the middle, while the full HEIGHT (364) is now inside it. Sight lines are not
 * symmetric any more. That is a real difficulty change in both directions and
 * it is exactly what `boss.test.ts`'s re-measurement has to confirm.
 */
export const ARENA_WIDE: Arena = { w: 648, h: 364 };

/**
 * The whole run's SWARM time - three stages of `STAGE_MS`. Three minutes,
 * chosen to be a bus ride, and unchanged by the stages landing.
 *
 * It is DERIVED from the stage table rather than written down again, so a
 * fourth stage cannot leave this number describing a run that no longer exists.
 *
 * `t` does not advance during a boss fight, so it reaches exactly `RUN_MS` on
 * the frame the golem walks in - however long the warden and the queen took.
 * That is what lets the chrome count down to something true. The WALL-CLOCK run
 * is longer than three minutes by however long the three fights last; the
 * operator ruled on that explicitly (2026-09-21, "accept ~3:45").
 *
 * This used to be the win itself, and the sentence here used to say so. It is
 * not: the run is won by beating the golem. Corrected rather than left standing,
 * because a comment that says a run is won at three minutes is a sentence the
 * next reader will act on.
 */
export const RUN_MS = STAGE_MS * 3;

const PLAYER_R = 11;
/**
 * How many shapes' bolts may be in the air at once.
 *
 * Small on purpose, and it is a FAIRNESS cap rather than a performance one: a
 * screen of forty incoming bolts is not a harder game, it is an unreadable one,
 * and a player who cannot see a way out stops playing. A lancer throws three at a
 * time and `RULES.wild.shooters` holds wild to five of them, so this is every
 * shooter on the board firing at once with a round still in the air.
 */
const CAP_SHOTS = 18;
const GEM_R = 16;
/**
 * How close a new gem has to be to an old one to be absorbed by it.
 *
 * TUNED, not chosen. It started at 26 - a little over a gem's own pickup radius
 * and a little under a brute's diameter - which reads well and made hard mode
 * unwinnable: merging concentrates value, a player who misses a pile misses all
 * of it, and that cost falls only on a player who MOVES. Swept against a bot
 * that plays whole wild runs:
 *
 *     GEM_MERGE_R    wild wins    kills    cards
 *     none (control)     1/5        624     15.2
 *     18                 1/5        624     15.2
 *     20                 1/5        817     18.4   <- this
 *     22                 0/5        670     16.8
 *     26                 0/5        332      9.8
 *
 * The 18/20/22 rows are within seed noise of each other at five seeds; what the
 * sweep establishes is the CLIFF above 20, not a ranking below it. 20 is taken
 * as the largest radius that has not been measured to cost a win.
 */
const GEM_MERGE_R = 20;
/**
 * How much further a MERGED pile pulls and is caught from, as a multiplier on
 * both the magnet range and the pickup radius.
 *
 * Capped at 2, so the biggest elite pile on the board reaches twice as far and
 * never further - an uncapped version would let one late-run pile vacuum the
 * arena, which is a different game. A single ordinary gem is `value` 1 to 4 and
 * reads 1.00 to 1.18, so nothing about an unmerged run moves much.
 */
const gemReach = (g: { value: number }) => Math.min(2, 1 + (g.value - 1) * 0.06);
/** The longest frame the simulation will believe, in ms. See `step`. */
const MAX_FRAME_MS = 50;
const MERCY_MS = 900;
/**
 * How far a STORM bolt will jump. SHORTER than the gun's own sight - a chain
 * that reached as far as the gun would cross the whole view and read as a
 * teleport rather than as lightning walking between two shapes standing near
 * each other. Tuned at T9 against the economy gate.
 */
const CHAIN_RANGE = 130;
const FLASH_MS = 90;

/**
 * A fresh run on `arena`, which DEFAULTS to the phone's portrait floor.
 *
 * The default is what keeps every existing caller and all four test files
 * unchanged: a test that does not care about shape gets the shape it has always
 * had, so a red in `logic.test.ts` after this change means a real regression
 * rather than a signature churn.
 */
export function newRun(level: RunState["level"], arena: Arena = ARENA, start: WeaponId = "bolt"): RunState {
  const world = worldFor(arena);
  return {
    level,
    arena,
    world,
    t: 0,
    stage: 1,
    phase: "playing",
    hp: 3,
    maxHp: 3,
    invuln: 0,
    xp: 0,
    need: xpNeeded(1, level),
    power: 1,
    popped: 0,
    choosing: false,
    // The middle of the WORLD, one full view from every wall.
    x: world.w / 2,
    y: world.h / 2,
    enemies: [],
    bolts: [],
    shots: [],
    gems: [],
    fires: [],
    up: { rapid: 0, power: 0, spread: 0, swift: 0, magnet: 0, heart: 0, pierce: 0, shield: 0, range: 0 },
    // The MAIN weapon, wearing its rarity's perk (`mainSlot`, `weaponPool.ts`).
    // Calm's default bolt is a common, so this is `freshSlot` plus a flag there.
    slots: [mainSlot(start)],
    bladeAngle: 0,
    droneAngle: 0,
    dashCd: 0,
    charge: 0,
    frozen: 0,
    shieldCd: 0,
    boss: null,
    spawnIn: RULES[level].spawnMs,
    nextId: 1,
    events: [],
  };
}

/**
 * The nearest shape a chaining bolt has not already touched, within its own
 * reach. Its own position rather than the robot's, because a chain walks through
 * a crowd and the next link starts where the last one landed.
 */
function nearestUnhit(s: RunState, b: { x: number; y: number; hit: number[] }): Enemy | null {
  let best: Enemy | null = null;
  let bestD = CHAIN_RANGE ** 2;
  for (const e of s.enemies) {
    if (e.hp <= 0 || b.hit.includes(e.id)) continue;
    const d = dist2(b.x, b.y, e.x, e.y);
    if (d < bestD) {
      bestD = d;
      best = e;
    }
  }
  return best;
}

/**
 * One hit on one shape, from anything - a bolt, a blade. The kill, the score,
 * the gem and the pop all happen HERE, so a weapon added later cannot pay out a
 * kill differently from the ones already here.
 */
function damage(s: RunState, e: Enemy, dmg: number, by?: WeaponId) {
  e.hp -= dmg;
  e.flash = FLASH_MS;
  if (e.hp <= 0) {
    s.popped += 1;
    // A BOSS OR A MINI-BOSS (an elite) PAYS OUT A SUPER POWER, if one is ready
    // (operator ruling 2026-09-30; `raiseSuper` holds the rest). Here, in the one
    // function every kill goes through, so no weapon can kill a boss "around" it.
    // Not on the kill that ENDS the run - the last stage's boss, or a career
    // level's one boss - because a card behind the win screen is a promise
    // nobody can take.
    const endsRun = e.id === s.boss && (s.career !== undefined || isLastStage(s.stage));
    if ((e.id === s.boss || e.elite) && !endsRun) raiseSuper(s);
    // `by` rides the event rather than being inferred by the scene from what is
    // near the corpse. A shape killed by a blade is usually also inside a bolt's
    // path, so "what was closest" is a guess the simulation does not have to
    // make: it is the one that knows.
    s.events.push({ type: "pop", x: e.x, y: e.y, kind: e.kind, ...(by ? { by } : {}) });
    // `xpOf`, never `KINDS[kind].xp` - an elite's gem is worth ten, and this is
    // the ONE line in the game that mints a gem. Miss it and an elite is six
    // times the work for the same reward, which is worse than not having one.
    //
    // GEMS MERGE since 2026-09-22. Operator ruling: *"do less diamonds to pick,
    // the screen is full of them"*. A kill that drops its gem within
    // `GEM_MERGE_R` of one already lying there adds its value to that gem
    // instead of leaving a second one beside it.
    //
    // IT IS WORTH EXACTLY THE SAME XP, and that is the property to hold on to.
    // Both the level-up and the freeze read `gained` - the total VALUE collected
    // on a frame, never the number of pickups - so a player who walks over one
    // gem worth six is where a player who walked over three worth two would
    // have been. This declutters the floor and does not touch the economy, which
    // is why the operator's other ask (*"make the upgrades even less
    // frequent"*) is a separate change to the cost curve rather than a
    // side-effect of this one. Two effects, two levers.
    const worth = xpOf(e);
    const near = s.gems.find((g) => dist2(g.x, g.y, e.x, e.y) <= GEM_MERGE_R * GEM_MERGE_R);
    if (near) {
      near.value += worth;
      // THE PILE MOVES TO THE NEW KILL, and this is not cosmetic.
      //
      // The first version left the merged gem where the OLDER one lay, which is
      // neutral for a player standing still and a real nerf for one who is
      // moving: a kiting player's kills happen ahead of them and the pile was
      // being left behind. Measured on wild with a bot that kites, it took the
      // run from 3 wins in 5 to 1, with `power` down across every seed - a
      // difficulty change smuggled in by a change meant to tidy the floor.
      // Absorbing forwards costs at most `GEM_MERGE_R` of drift and keeps the
      // value where the player is looking.
      near.x = e.x;
      near.y = e.y;
    } else s.gems.push({ id: s.nextId++, x: e.x, y: e.y, value: worth });
    // A career kill may drop gold too - on top of the gem, never instead of it.
    if (s.career) careerLoot(s, e);
    // A MAP PICKUP, sometimes (pickups.ts) - decided by the shape's id, never by
    // an rng draw, so no random number the run already draws moves.
    const drop = dropFor(e, e.id === s.boss);
    if (drop) (s.pickups ??= []).push({ id: s.nextId++, x: e.x, y: e.y, kind: drop, ms: PICKUP_MS });
  }
}

/**
 * One hit on the player, from a body or from a bolt. ONE function, so the two
 * cannot pay differently.
 *
 * THE DASH fires by itself (operator ruling 2026-09-14): a hit that would cost a
 * heart blinks you out of it instead, once per `DASH_MS`, and the mercy window
 * that follows stops the rest of the crowd landing on the spot you blinked to.
 * THE SHIELD sits BETWEEN the dash and the heart deliberately - the dash is the
 * better outcome, so it goes first and the shield catches what the dash could
 * not.
 */
function takeHit(s: RunState, fromX: number, fromY: number) {
  if (s.invuln > 0) return;
  if (s.dashCd <= 0) {
    const from = dashAway(s, fromX, fromY, PLAYER_R);
    s.invuln = MERCY_MS;
    s.events.push({ type: "dash", x: from.x, y: from.y });
    return;
  }
  if (shieldReady(s)) {
    s.shieldCd = shieldEvery(s);
    s.invuln = MERCY_MS;
    s.events.push({ type: "shield" });
    return;
  }
  s.hp -= 1;
  s.invuln = MERCY_MS;
  s.events.push({ type: "hurt" });
}

/**
 * One shooter's clock. Three states, in priority order: winding up, cooling
 * down, or looking for a shot.
 *
 * IT NEVER SHOOTS FROM OFF SCREEN. A bolt from a shape the player cannot see is
 * a heart taken by something they had no way to answer, which is the opposite of
 * what this game asks of them - and on a world three views wide there is always
 * something off screen.
 */
/**
 * The FINAL BOSS calls in shapes, on a clock of its own.
 *
 * Operator ruling 2026-09-22: the golem *"spawns some enemies"*. Its own clock
 * rather than the gun's, because the two are meant to overlap - a boss that
 * alternated between shooting and summoning would read as taking turns with
 * itself, and the point of the ruling is that the finish gets busier.
 *
 * The guard is `summonCount`, not the level: `FINAL.calm` is the identity row
 * (`Infinity` / 0), so easy mode's golem runs this function every frame of its
 * fight and leaves with nothing done - and no draw is taken, which is what
 * keeps a calm run's rng stream exactly where it was.
 */
function tickSummon(s: RunState, e: Enemy, dt: number, rng: () => number) {
  const f = FINAL[s.level];
  if (f.summonCount <= 0 || !Number.isFinite(f.summonMs)) return;
  e.summonCd = Math.max(0, (e.summonCd ?? f.summonMs) - dt);
  if (e.summonCd > 0) return;
  e.summonCd = f.summonMs;
  const made = summonAt(s, e, rng);
  // Reported only when something really arrived. `summonAt` returns short at
  // the board cap, and an event on a summon that produced nothing would have
  // the scene draw a flash and play a sound over an empty ring.
  if (made > 0) s.events.push({ type: "summon", x: e.x, y: e.y, n: made });
}

function tickGun(s: RunState, e: Enemy, dt: number) {
  const gun = GUNS[e.kind];
  if (!gun) return;
  if (e.id === s.boss && !RULES[s.level].bossShoots) return;
  const r = RULES[s.level];

  if ((e.wind ?? 0) > 0) {
    e.wind = Math.max(0, (e.wind ?? 0) - dt);
    if (e.wind === 0) {
      fireEnemy(s, e, gun);
      e.gunCd = gunEveryFor(e.kind, s.level);
    }
    return;
  }
  e.gunCd = Math.max(0, (e.gunCd ?? 0) - dt);
  if (e.gunCd > 0) return;
  if (Math.hypot(s.x - e.x, s.y - e.y) > gun.range) return;
  if (!inView(s, e.x, e.y)) return;
  e.wind = gun.windup * r.windup;
}

/** The bolts leave, aimed where the player WAS when the wind-up finished. */
function fireEnemy(s: RunState, e: Enemy, gun: NonNullable<(typeof GUNS)[EnemyKind]>) {
  const speed = gun.speed * RULES[s.level].shotSpeed;
  const aim = Math.atan2(s.y - e.y, s.x - e.x);
  for (let i = 0; i < gun.count; i++) {
    if (s.shots.length >= CAP_SHOTS) break;
    const a = aim + (gun.count === 1 ? 0 : (i - (gun.count - 1) / 2) * gun.spread);
    s.shots.push({
      id: s.nextId++,
      from: e.kind,
      x: e.x,
      y: e.y,
      vx: Math.cos(a) * speed,
      vy: Math.sin(a) * speed,
      life: gun.life,
      r: gun.r,
    });
  }
  s.events.push({ type: "efire", kind: e.kind, x: e.x, y: e.y });
}

/**
 * A boss walks in at the top edge of the VIEW, just out of sight. ONE function for
 * the quick run's three stage bosses and the career's one, so the two cannot
 * arrive differently. `gunCd` and `summonCd` start FULL - the first thing a boss
 * does is walk, not throw, and it does not arrive already surrounded.
 */
function arriveBoss(s: RunState, kind: EnemyKind, hp: number) {
  const id = s.nextId++;
  const cam = cameraOf(s);
  s.enemies.push({
    id,
    kind,
    x: cam.x + s.arena.w / 2,
    y: cam.y - 34,
    hp,
    flash: 0,
    gunCd: gunEveryFor(kind, s.level),
    summonCd: FINAL[s.level].summonMs,
  });
  s.boss = id;
  // THE BOSS WALL closes around the robot (world.ts `ringAround`) - never on
  // CALM. Easy mode gets every new thing that is content, but its difficulty is
  // the operator's ("don't touch the easy mode", 2026-09-21), and a cage is a
  // difficulty: with it a careless player never reached calm's last boss
  // (pacing.test.ts). The City career world runs on calm's row, so it has none either.
  if (s.level !== "calm") s.ring = ringAround(s);
  s.events.push({ type: "boss", stage: s.stage, kind });
}

function grantXp(s: RunState, value: number) {
  s.xp += value;
  while (s.xp >= s.need) {
    s.xp -= s.need;
    s.power += 1;
    s.need = xpNeeded(s.power, s.level);
    // A super already paused this frame: this level-up waits behind it.
    if (s.pendingSuper) s.levelOwed = true;
    s.choosing = true;
    s.events.push({ type: "levelup" });
  }
}

/**
 * One frame. `dt` is milliseconds and is CLAMPED: a tab that spent a minute in
 * the background must not teleport sixty seconds of shapes into the player's
 * face on the frame it comes back.
 */
export function step(
  s: RunState,
  dtMs: number,
  input: { dx: number; dy: number },
  rng: () => number = Math.random,
): RunState {
  s.events.length = 0;
  if (s.phase !== "playing" || s.choosing) return s;
  const dt = Math.min(MAX_FRAME_MS, Math.max(0, dtMs));
  const sec = dt / 1000;

  // THE CLOCK IS SWARM TIME, and it stops dead while a boss is up.
  //
  // Not a detail: it is what makes `t` mean the same thing in every run. Three
  // stages of `STAGE_MS` each, so `t` hits `RUN_MS` exactly as the golem walks
  // in no matter how long the first two fights ran, and the chrome can count
  // down to a moment that really arrives. A clock that kept running would put
  // the golem at a different time in every run and the countdown would be a
  // number with nothing behind it.
  //
  // Clamped to the stage boundary rather than left to overshoot, so `stageT`
  // reads exactly `STAGE_MS` for the whole fight instead of drifting past it.
  //
  // The boss enters at the top edge of the VIEW, just out of sight, and walks in
  // like every other shape. `s.boss === null` is what makes this fire once:
  // without it a frame at the boundary would push a fresh boss sixty times a
  // second.
  if (s.boss === null) {
    s.t += dt;
    // A career level's boss comes on ITS clock, at ITS health (careerHooks.ts).
    if (s.career) careerClock(s, (kind, hp) => arriveBoss(s, kind, hp));
    else if (stageIsOver(s)) {
      s.t = s.stage * stageMs(s.level);
      const kind = bossKindFor(s.stage);
      // THE LEVEL'S OWN WALL: `RULES[level].bossHp` multiplies every boss, so an
      // eight-minute wild run does not end on the same 420 a three-minute calm
      // one does.
      arriveBoss(s, kind, bossHpFor(kind, s.level));
    }
  }
  if (s.career) careerTime(s, dt);
  if (s.invuln > 0) s.invuln = Math.max(0, s.invuln - dt);
  if (s.shieldCd > 0) s.shieldCd = Math.max(0, s.shieldCd - dt);
  tickPowers(s, dt);
  const frozen = s.frozen > 0;

  // Steering. The vector arrives in -1..1; normalise it, or a diagonal is faster
  // than a straight line - the oldest bug in the genre. Held inside the walls of
  // the WORLD, not the view: the view follows you, the walls do not.
  const len = Math.hypot(input.dx, input.dy);
  // FROST's twist: on ice the robot eases up to speed and slides when let go.
  if (s.career?.twist === "ice") slide(s, input, playerSpeed(s), sec, PLAYER_R);
  else if (len > 0.02) {
    const v = playerSpeed(s) * sec;
    const p = clampToWorld(s, s.x + (input.dx / len) * v, s.y + (input.dy / len) * v, PLAYER_R);
    s.x = p.x;
    s.y = p.y;
  }
  // Inside the boss wall while a boss fight is on - after the slide and the step
  // alike, so neither can carry the robot out (world.ts `keepInRing`).
  keepInRing(s, PLAYER_R);

  // The swarm stops the moment the golem is on the board. The finish is a duel,
  // not a duel inside a crowd that is still tightening every second - by 3:00
  // `spawnEvery` is at its floor, so leaving it on would mean a shape every 230
  // ms for as long as the fight lasts. Whatever was already on the board stays
  // and has to be dealt with; nothing new arrives behind it.
  //
  // A freeze holds the spawn clock too, so two seconds of calm is not followed
  // by two seconds of shapes arriving at once.
  if (s.boss === null && !frozen) {
    s.spawnIn -= dt;
    while (s.spawnIn <= 0) {
      spawn(s, rng);
      s.spawnIn += spawnEvery(s);
    }
  }

  // Every carried weapon on its own clock. A slot with nothing in range holds at
  // zero rather than banking shots, so it fires once when a shape walks in, not
  // a burst of everything it "owed".
  for (const slot of s.slots) {
    if (slot.id === "blades") continue;
    slot.cd -= dt;
    // The HALO pulses on its clock, always (arms.ts says why it never holds).
    if (slot.id === "halo") {
      if (slot.cd <= 0) {
        pulseHalo(s, slot, weaponDamage(s, slot), (e, d) => damage(s, e, d, "halo"));
        slot.cd = weaponEvery(s, slot);
      }
      continue;
    }
    // The ZAP strikes rather than throws (arms.ts); same clock, same hold-at-zero.
    if (slot.id === "zap") {
      if (slot.cd <= 0 && zapSlot(s, slot, weaponDamage(s, slot), rng, (e, d) => damage(s, e, d, "zap"))) slot.cd = weaponEvery(s, slot);
      if (slot.cd < 0) slot.cd = 0;
      continue;
    }
    // `weaponEvery` folds the run's `rapid`, the weapon's own cadence and the
    // slot's LEVEL into one number, so a levelled weapon really does come round
    // faster rather than merely claiming to on a card.
    if (slot.cd <= 0 && fireSlot(s, slot)) slot.cd = weaponEvery(s, slot);
    if (slot.cd < 0) slot.cd = 0;
  }
  // The ring turns whether one drone rides it or three: `dronePositions` spreads
  // them around this same angle, so one number moves all of them.
  if (holds(s, "drone")) s.droneAngle = (s.droneAngle + DRONE.spin * sec) % (Math.PI * 2);

  // A career level's shapes move at its own pace on top of the world's base row.
  const pace = s.career ? RULES[s.level].speed * s.career.pace : RULES[s.level].speed;
  for (const e of s.enemies) {
    if (e.flash > 0) e.flash = Math.max(0, e.flash - dt);
    if (e.bladeCd) e.bladeCd = Math.max(0, e.bladeCd - dt);
    if (e.burnCd) e.burnCd = Math.max(0, e.burnCd - dt);
    if (frozen) continue;
    // Walked back in from off the view once it has fallen a whole view behind -
    // see `isLeftBehind`. Never the golem: the finish does not teleport.
    if (e.id !== s.boss && isLeftBehind(s, e.x, e.y)) {
      const p = spawnPoint(rng, s);
      e.x = p.x;
      e.y = p.y;
      // A shape that was mid-wind-up is now somewhere else entirely, so the
      // telegraph the player was reading belongs to a fight that no longer
      // exists. Dropping it is what stops a bolt arriving from nowhere.
      e.wind = 0;
      continue;
    }
    tickGun(s, e, dt);
    const isBoss = e.id === s.boss;
    if (isBoss) tickSummon(s, e, dt, rng);
    const gun = GUNS[e.kind];
    const d = Math.hypot(s.x - e.x, s.y - e.y) || 1;
    // A shooter holds still while it winds up - the telegraph is a commitment -
    // and stops walking once it is as close as it wants to be. Everything else
    // comes straight at you, which is what it has always done.
    //
    // THE BOSS IS THE EXCEPTION since 2026-09-22, and it is the whole of the
    // operator's *"Make it follow me more"*. A golem that rooted itself for its
    // own 800 ms wind-up, five bolts at a time, spent most of the fight standing
    // still - so the answer to it was to walk away and keep walking, and a boss
    // you can out-walk is not a wall. It still telegraphs exactly as long; it
    // simply does not stop to do it.
    //
    // Scoped to the boss rather than to shooters in general on purpose: for a
    // spitter the root IS the tell, the thing that says "this one is about to
    // throw". The golem is the only shape on the board a player is already
    // looking at.
    if (gun && !isBoss && ((e.wind ?? 0) > 0 || d <= gun.keep)) continue;
    const v = speedOf(e) * pace * (isBoss ? FINAL[s.level].speed : 1) * sec;
    e.x += ((s.x - e.x) / d) * v;
    e.y += ((s.y - e.y) / d) * v;
  }

  // The shapes' bolts. They fly, they expire, and a freeze holds them exactly
  // where they are - a freeze that stopped every shape but left their bolts
  // coming would be the one moment in a run where the super made things worse.
  if (!frozen) {
    for (const b of s.shots) {
      b.x += b.vx * sec;
      b.y += b.vy * sec;
      b.life -= dt;
    }
  }

  // The blades: a ring that turns around the robot and cuts what it touches,
  // each shape at most once per `BLADES.hitMs`.
  const bladeSlot = s.slots.find((k) => k.id === "blades");
  if (bladeSlot) {
    s.bladeAngle = (s.bladeAngle + BLADES.spin * sec) % (Math.PI * 2);
    // A SAWSTORM's ring breathes - `bladePositions` reads the reach off the same
    // angle AND works out for itself whether the blades evolved, so the arena
    // and the picture can never disagree about where the ring is.
    const blades = bladePositions(s);
    // The blades level like every other weapon. They have no `WEAPONS` row
    // because they never throw anything, so `weaponDamage` gives them the base
    // plus their level and nothing else.
    const dmg = weaponDamage(s, bladeSlot);
    for (const e of s.enemies) {
      if (e.hp <= 0 || (e.bladeCd ?? 0) > 0) continue;
      const r = radiusOf(e) + BLADES.r;
      if (!blades.some((b) => dist2(b.x, b.y, e.x, e.y) <= r * r)) continue;
      damage(s, e, dmg, "blades");
      e.bladeCd = BLADES.hitMs;
    }
  }

  for (const b of s.bolts) {
    // The arc is the only one that steers, and it steers by a capped turn rate
    // rather than snapping to the target - a shot that turns instantly is a
    // homing missile and never misses, which is not a weapon, it is an autowin.
    const turn = WEAPONS[b.kind].turn;
    if (turn > 0) {
      const t = nearestEnemy(s, b.x, b.y);
      if (t) {
        const want = Math.atan2(t.y - b.y, t.x - b.x);
        const have = Math.atan2(b.vy, b.vx);
        // Wrapped into -PI..PI, or steering across the seam takes the long way
        // round and the arc visibly loops the wrong direction.
        let d = ((want - have + Math.PI * 3) % (Math.PI * 2)) - Math.PI;
        const cap = turn * sec;
        d = Math.max(-cap, Math.min(cap, d));
        const sp = Math.hypot(b.vx, b.vy);
        b.vx = Math.cos(have + d) * sp;
        b.vy = Math.sin(have + d) * sp;
      }
    }
    b.x += b.vx * sec;
    b.y += b.vy * sec;
    b.life -= dt;
    b.age += dt;
  }

  // Bolts against shapes. A bolt remembers what it has already touched, so one
  // that passes through cannot hit the same shape on every frame of the journey.
  for (const b of s.bolts) {
    if (b.life <= 0) continue;
    for (const e of s.enemies) {
      if (e.hp <= 0 || b.hit.includes(e.id)) continue;
      const r = radiusOf(e) + WEAPONS[b.kind].r;
      if (dist2(b.x, b.y, e.x, e.y) > r * r) continue;
      damage(s, e, b.dmg, b.kind);
      b.hit.push(e.id);
      if (b.pierce > 0) {
        b.pierce -= 1;
        // THE STORM'S JUMP. A chaining shot re-aims at the nearest shape it has
        // NOT already touched and carries on from where it landed. Re-aiming the
        // same bolt rather than spawning a new one is what makes it read as one
        // arc of lightning walking through a crowd - and it cannot run away with
        // the bolt cap, because a jump costs nothing.
        //
        // `b.hit` is the exclusion list, so a chain can never bounce back to the
        // shape it just killed, and a shape already dead is skipped anyway.
        if (b.chain) {
          const next = nearestUnhit(s, b);
          if (next) {
            const sp = Math.hypot(b.vx, b.vy) || 1;
            const a2 = Math.atan2(next.y - b.y, next.x - b.x);
            b.vx = Math.cos(a2) * sp;
            b.vy = Math.sin(a2) * sp;
          } else {
            // Nothing left in reach. A chain with nowhere to go is spent rather
            // than flying on as an ordinary shot - it has done its whole job.
            b.life = 0;
          }
        }
      } else {
        b.life = 0;
        break;
      }
    }
  }

  // Shapes against the player. The one that reaches you is spent doing it, so a
  // crowd arriving together costs a heart rather than all of them at once. It is
  // not scored: a shape that got through is not a shape you popped.
  //
  // A FROZEN shape hurts nobody and is not spent - it is ice, and a player who
  // walks through the crowd during a freeze is using the freeze, not being hit.
  for (const e of s.enemies) {
    if (frozen) break;
    if (e.hp <= 0) continue;
    const r = radiusOf(e) + PLAYER_R;
    if (dist2(s.x, s.y, e.x, e.y) > r * r) continue;
    // THE GOLEM IS THE ONE THING THAT DOES NOT DIE BY WALKING INTO YOU, and the
    // exception is not a detail. Every other shape is spent reaching you, which
    // is why a crowd arriving together costs one heart rather than all of them.
    // Apply that to the boss and it kills itself on contact: the run would be
    // WON by being hit, at full health, on the frame it touched you - the exact
    // opposite of every other rule in this file. It costs a heart and keeps
    // coming; `boss.test.ts` pins both halves.
    if (e.id !== s.boss) {
      e.hp = 0;
      s.events.push({ type: "pop", x: e.x, y: e.y, kind: e.kind });
    }
    takeHit(s, e.x, e.y);
  }

  // A shape's BOLT costs the same as the shape itself, and is spent doing it.
  // Through `takeHit`, so a bolt and a body cannot pay differently the first time
  // somebody retunes either: the dash saves you from both, the shield catches
  // both, and the same mercy window follows.
  if (!frozen) {
    for (const b of s.shots) {
      if (b.life <= 0) continue;
      const r = b.r + PLAYER_R;
      if (dist2(s.x, s.y, b.x, b.y) > r * r) continue;
      b.life = 0;
      takeHit(s, b.x, b.y);
    }
  }

  // LAVA's twist: pools open near the robot, warn, then burn - through `takeHit`,
  // so the dash and the shield answer a pool exactly as they answer a shape.
  if (s.career?.twist === "pools" && !frozen) tickPools(s, dt, rng, PLAYER_R, (x, y) => takeHit(s, x, y));

  // Gems drift in once they are close enough, and are collected on touch.
  //
  // A BIGGER PILE IS A BIGGER TARGET (`gemReach`), and that is what pays for
  // merging rather than a tuning number. Merging concentrates the same value
  // into fewer things, so a player who misses one now misses six xp where they
  // used to miss two - and that cost falls entirely on a player who MOVES.
  // Measured on wild with a bot that picks at random: merging alone took it
  // from 1 win in 5 to 0, kills from 624 to 332. Letting a pile pull from
  // further and be caught from further gives back exactly what concentrating it
  // took away, and it is what a heap of gems should do anyway.
  const pull = magnetRange(s);
  // The MAGNET pickup pulls every gem on the board, from anywhere, fast.
  const vacuum = (s.vacuum ?? 0) > 0;
  for (const g of s.gems) {
    const d = Math.hypot(s.x - g.x, s.y - g.y) || 1;
    if (!vacuum && d >= pull * gemReach(g)) continue;
    const v = vacuum ? Math.max(700, d * 2.5) * sec : Math.max(90, 260 - d) * sec * 1.8;
    g.x += ((s.x - g.x) / d) * v;
    g.y += ((s.y - g.y) / d) * v;
  }
  let gained = 0;
  s.gems = s.gems.filter((g) => {
    const r = GEM_R * gemReach(g);
    if (dist2(s.x, s.y, g.x, g.y) > r * r) return true;
    gained += g.value;
    return false;
  });
  if (gained > 0) {
    s.events.push({ type: "gem" });
    // The same gems fill the freeze. Capped, so a full ring stays full rather
    // than banking a second freeze behind the first.
    s.charge = Math.min(FREEZE_NEED, s.charge + gained);
    grantXp(s, gained);
  }
  // A career level's gold on the floor, under the same magnet.
  if (s.career) careerCoins(s, pull, sec);
  // Map pickups: taken on touch, and the magnet's pull counts down.
  tickPickups(s, dt, PLAYER_R, (e, d) => damage(s, e, d));

  // THE NOVA LEAVES BURNING GROUND where each of its fragments dies.
  //
  // On expiry rather than on contact, and that is what makes it a ring of fire
  // rather than a scatter: every fragment of one shot has the same `life`, so
  // they all burn out at the same distance and the patches land in a circle.
  // A fragment that hit something has `life = 0` too and drops its patch where
  // it landed, which is the forgiving direction - the fire is where the crowd is.
  for (const b of s.bolts) {
    // `burn` is the patch's radius: the nova's ring, and since 2026-10-02 every
    // FLASK bottle (weapons.ts) - the same fire, the same clock.
    if (b.life > 0 || !b.burn) continue;
    if (s.fires.length >= CAP_FIRES) break;
    s.fires.push({ id: s.nextId++, x: b.x, y: b.y, ms: NOVA_FIRE.ms, r: b.burn, dmg: b.dmg });
  }

  // Burning ground ticks. A shape standing in fire is hurt once per `hitMs`,
  // the same discipline the blades use and for the same reason: without it a
  // shape loses its whole health in the frames it overlaps, which is not a burn.
  if (s.fires.length > 0) {
    for (const f of s.fires) f.ms -= dt;
    if (!frozen) {
      for (const e of s.enemies) {
        if (e.hp <= 0) continue;
        if (e.burnCd && e.burnCd > 0) continue;
        // The patch that is actually touching it, not the first one in the list.
        // `fires[0]` would have been a different nova's damage - an older, weaker
        // shot's - and it would have read correctly in every test with one fire.
        const hit = s.fires.find((f) => f.ms > 0 && dist2(f.x, f.y, e.x, e.y) <= (f.r + radiusOf(e)) ** 2);
        if (!hit) continue;
        damage(s, e, hit.dmg);
        e.burnCd = NOVA_FIRE.hitMs;
      }
    }
    s.fires = s.fires.filter((f) => f.ms > 0);
  }

  s.enemies = s.enemies.filter((e) => e.hp > 0);
  // A shot that has left the view is spent: a bolt crossing a three-screen world
  // would otherwise kill shapes the player never saw.
  s.bolts = s.bolts.filter((b) => b.life > 0 && inView(s, b.x, b.y, 40));
  // The same for the shapes' bolts, and here it is the PLAYER it protects: one
  // that chased them off the edge of the view would arrive unseen.
  s.shots = s.shots.filter((b) => b.life > 0 && inView(s, b.x, b.y, 40));

  // A stage ends when its boss FALLS - never on a clock. Checked after the dead
  // have been filtered out, so "the boss is gone" is read off the board rather
  // than off a health number somebody has to remember to update.
  //
  // THE TIE RULE IS SPLIT, and the split is the ruling rather than an accident.
  // A tie on the LAST stage goes to the win: the golem is down, the player did
  // the thing the run asked for, and this platform does not punish. A tie on
  // stage 1 or 2 is a LOSS, because the run would otherwise carry on with zero
  // hearts - "you won" and "you have nothing left and two stages to go" are not
  // the same sentence, and only one of them is true. The boss itself can never
  // be the shape that ties, because a dead enemy is skipped by the contact loop.
  // The boss wall lifts the moment its boss falls - career and quick run alike.
  if (s.ring && s.boss !== null && !s.enemies.some((e) => e.id === s.boss)) s.ring = null;
  // A career level ends on its own rule - its clock, or its one boss.
  if (s.career) {
    careerEnd(s);
    return s;
  }
  const bossDown = s.boss !== null && !s.enemies.some((e) => e.id === s.boss);
  if (bossDown && isLastStage(s.stage)) {
    s.phase = "won";
    s.events.push({ type: "won" });
  } else if (s.hp <= 0) {
    s.phase = "over";
    s.events.push({ type: "over" });
  } else if (bossDown) {
    // On to the next stage. Everything the player earned comes with them, and so
    // does whatever crowd was still on the board when the boss fell - the same
    // reading the boss fight already gives it. Only the spawn clock is reset, so
    // the new stage does not open by dumping the shapes it "owed" during the fight.
    s.stage += 1;
    s.boss = null;
    s.spawnIn = spawnEvery(s);
    s.events.push({ type: "stage", n: s.stage });
  }
  return s;
}

/** A seeded run, for tests and for anything that needs the same arena twice. */
export const rngFor = (seed: number) => mulberry32(seed);
