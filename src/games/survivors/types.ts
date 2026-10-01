// Every shape the simulation moves around, and NOTHING that runs.
//
// This file and the two it re-exports (`entities.ts`, `careerTypes.ts`) are the
// leaf of the module graph: they import nothing but each other's TYPES, one way,
// and emit no runtime code at all, so every other module here can import them
// without any chance of a cycle. That is the whole reason it exists - `world.ts`,
// `arsenal.ts` and `powers.ts` were already obeying a hand-kept rule that they
// may import TYPES from `logic.ts` and never values, and a rule kept by hand is
// one import away from being broken. Now the rule is the file layout.
//
// The layering, top to bottom, every arrow one way:
//
//   entities.ts                   <- the pieces, imports nothing
//     careerTypes.ts              <- the career's types, imports entities
//       types.ts                  <- you are here: RunState, and the re-exports
//         stages.ts   world.ts   arsenal.ts   upgrades.ts
//           enemies.ts    powers.ts
//             weapons.ts
//               logic.ts              <- newRun + step, and the public re-exports
//                 cards.ts
//                   SurvivorsScene.ts / SurvivorsGame.tsx

export type * from "./entities";
export type * from "./careerTypes";

import type { CareerState } from "./careerTypes";
import type { Arena, Bolt, Enemy, Fire, Gem, LevelKey, RunEvent, Shot, Slot, UpgradeId, WeaponId } from "./entities";

export interface RunState {
  level: LevelKey;
  /**
   * The floor this run is being played on.
   *
   * ON THE RUN rather than read from the module, and that is the whole shape of
   * the landscape change. A module constant is one arena for every player, so a
   * desktop could not have a wider one without a phone having it too - and the
   * phone is the platform that cannot afford it. Carrying it here means `step`
   * is still a pure function of what it is handed, the same seed still plays the
   * same run, and a test can drive either shape without touching a global.
   */
  arena: Arena;
  /**
   * The whole floor, three views wide and tall (operator ruling 2026-09-14, "map
   * to go to the sides"). `arena` is still the VIEW - what the canvas shows and
   * what the camera window is - and the world is derived from it in `newRun`.
   */
  world: Arena;
  /**
   * Milliseconds of SWARM survived - it does NOT advance while a boss is up.
   *
   * That is what keeps one number honest across three stages: the swarm phases
   * are 60 seconds each, so `t` reaches `RUN_MS` exactly as the golem walks in,
   * however long the first two fights took. A clock that ran during the fights
   * would mean the golem arrived at a different time in every run, and the
   * chrome would have nothing it could truthfully count down to.
   */
  t: number;
  /**
   * Which stage this run is on, 1 to 3. STORED rather than derived, because a
   * stage ends when its boss FALLS and not when a clock says so - there is no
   * function of `t` that could answer it.
   */
  stage: number;
  phase: "playing" | "won" | "over";
  hp: number;
  maxHp: number;
  /** Milliseconds of mercy left after a knock, so one mistake is not three. */
  invuln: number;
  xp: number;
  need: number;
  /** How many upgrades deep this run is. Shown as the power level. */
  power: number;
  /** The score: shapes popped. `ms` would rank the wrong way round, and kills read plainly. */
  popped: number;
  /** True while an upgrade is being chosen. Nothing moves, and the clock stops too. */
  choosing: boolean;
  x: number;
  y: number;
  enemies: Enemy[];
  bolts: Bolt[];
  /** What the shapes have thrown at the player, and it is the player's to dodge. */
  shots: Shot[];
  gems: Gem[];
  /** Burning ground the NOVA has laid down. Empty in every run that has no nova. */
  fires: Fire[];
  up: Record<UpgradeId, number>;
  /** The weapons this run carries, up to `SLOTS_MAX`, each on its own clock. */
  slots: Slot[];
  /** Where the blades are in their turn, in radians. Advances only while they are carried. */
  bladeAngle: number;
  /** Where the drone is in its circle, in radians. */
  droneAngle: number;
  /** Milliseconds until the dash can save you again. 0 is ready. */
  dashCd: number;
  /** Gem value collected toward the freeze, up to `FREEZE_NEED`. */
  charge: number;
  /** Milliseconds left of a freeze. While above 0 no shape moves or hurts. */
  frozen: number;
  /**
   * Milliseconds until the SHIELD can absorb a hit again. 0 is ready, and a run
   * that never took the upgrade simply never reads it.
   *
   * A clock rather than a boolean, so "how long until it comes back" is drawable
   * - the same shape `dashCd` already uses, and for the same reason.
   */
  shieldCd: number;
  /**
   * The CURRENT stage's boss id once it has arrived, and null while its swarm
   * phase is still running. An ID rather than a copy of its health: a second
   * copy of a number the enemy list already holds is two records of one fact,
   * and they drift the first time one of them is updated and the other is not.
   * `bossOf` reads it, and `KINDS[boss.kind].hp` is the bar's denominator - a
   * hardcoded `KINDS.golem.hp` would draw a warden's bar 19% full forever.
   */
  boss: number | null;
  spawnIn: number;
  nextId: number;
  /** Reused between frames rather than replaced, for the reason at the top. */
  events: RunEvent[];
  /**
   * THE CAREER, when this run is one of its levels - and ABSENT on a quick run.
   *
   * Optional on purpose, and the absence is the whole guarantee: every career
   * rule in `step` sits behind `if (s.career)`, takes no rng draw outside that
   * branch, and multiplies by `?? 1` where it touches a shared number, so a
   * quick run plays exactly the run it played before the career existed.
   * `calm-is-untouched.test.ts` fingerprints that, shape for shape.
   */
  career?: CareerState;
  /**
   * The SUPER POWER on offer right now, raised by a boss or mini-boss kill and
   * cleared when it is taken. Absent or null means none.
   *
   * STORED rather than recomputed at offer time, and that is what makes it one
   * super per kill: `offerCards` hands back exactly the weapon the kill named,
   * so a level-up can never offer a super (it has no kill behind it) and a kill
   * can never offer two.
   */
  pendingSuper?: WeaponId | null;
  /**
   * A level-up landed on the same frame as a super and is waiting behind it.
   * Both pause the run through the one `choosing` flag, so without this, taking
   * the super card would clear the flag and silently drop the level-up.
   */
  levelOwed?: boolean;
}
