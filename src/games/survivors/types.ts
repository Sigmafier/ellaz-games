// Every shape the simulation moves around, and NOTHING that runs.
//
// This file is the leaf of the module graph: it imports nothing and emits no
// runtime code at all, so every other module here can import it without any
// chance of a cycle. That is the whole reason it exists - `world.ts`,
// `arsenal.ts` and `powers.ts` were already obeying a hand-kept rule that they
// may import TYPES from `logic.ts` and never values, and a rule kept by hand is
// one import away from being broken. Now the rule is the file layout.
//
// The layering, top to bottom, every arrow one way:
//
//   types.ts                      <- you are here, imports nothing
//     stages.ts   world.ts   arsenal.ts   upgrades.ts
//       enemies.ts    powers.ts
//         weapons.ts
//           logic.ts              <- newRun + step, and the public re-exports
//             cards.ts
//               SurvivorsScene.ts / SurvivorsGame.tsx

/** A battlefield, in logical units. The canvas is scaled to fit it. */
export type Arena = { readonly w: number; readonly h: number };

export type LevelKey = "calm" | "normal" | "wild";

/**
 * Every shape, the three bosses included.
 *
 * A BOSS KIND is not a kind the wave clock may send - `kindsAt` never returns
 * one and `stages.test.ts` pins that in both directions, because a golem in the
 * spawn pool would put a 420-health wall into a 40-second-old run and the only
 * tell would be a player who cannot understand why they died.
 */
export type EnemyKind =
  | "runner"
  | "orb"
  | "brute"
  | "shard"
  // THE TWO THAT SHOOT BACK (operator ruling 2026-09-21). Elites of the shape
  // they are drawn from - `BASE_OF` in `enemies.ts` names which - so a capped
  // wave is still the crowd the stage asked for, with no more guns in it.
  | "spitter"
  | "lancer"
  | "warden"
  | "queen"
  | "golem";

/**
 * NINE upgrades since 2026-09-22, ten before it.
 *
 * Ten arrived on 2026-09-21 because seven were capped at 26 steps between them
 * and a gem-chasing `wild` run was measured taking 29 of the 30 cards that
 * existed - its last level-ups offered an EMPTY screen, which was a defect
 * rather than a nicety.
 *
 * `crit` - *"sometimes hits twice as hard"* - was then removed by operator
 * ruling, 2026-09-22, and the reason is worth keeping because it is a design
 * argument rather than a tuning one. Every other upgrade changes a number the
 * player can watch: a faster gun looks faster, a wider fan looks wider, one
 * more heart is one more heart. Crit changed the AVERAGE of a number, which is
 * a thing a player cannot see happening and cannot plan around - the same shot
 * on the same shape killed it or did not, and nothing on screen said why.
 *
 * The card count is not a reason to keep it: eight remaining upgrades and five
 * weapons with five levels each still put the empty-screen ceiling far out of
 * reach, and `cards.test.ts` is what holds that rather than this sentence.
 */
export type UpgradeId =
  | "rapid"
  | "power"
  | "spread"
  | "swift"
  | "magnet"
  | "heart"
  | "pierce"
  | "shield"
  | "range";

export interface Enemy {
  id: number;
  kind: EnemyKind;
  x: number;
  y: number;
  hp: number;
  /** Milliseconds of white flash left after taking a hit. Drawn, never simulated. */
  flash: number;
  /**
   * Milliseconds before the blades may cut this shape again. Optional, so a test
   * that places a shape by hand does not have to know the blades exist.
   */
  bladeCd?: number;
  /**
   * Milliseconds until this shape may START its next shot, and milliseconds of
   * WIND-UP left once it has. Shooters only, and optional for the same reason as
   * `bladeCd` - a test that drops a runner on the board should not have to know
   * anything about guns.
   *
   * `wind` above zero means the shape is standing still and glowing, and the
   * scene draws that. It is simulated here rather than being a drawing the rules
   * know nothing about, because it is the whole warning a player gets: a
   * telegraph on a clock of the scene's own would drift from the rule it
   * describes and teach the wrong timing.
   */
  gunCd?: number;
  wind?: number;
  /**
   * Milliseconds until the FINAL BOSS calls in its next shapes.
   *
   * Operator ruling 2026-09-22: the golem *"spawns some enemies"*. Optional and
   * only ever set on the golem, so every other shape on the board carries no
   * field for a thing it can never do - and a test that drops a runner has
   * nothing new to know.
   *
   * On its own clock rather than on `gunCd`, because the two must be able to
   * happen at once: a golem that could only ever shoot OR summon would look
   * like a boss taking turns with itself, and the whole point of the ruling is
   * that the last thirty seconds get busier.
   */
  summonCd?: number;
  /**
   * Is this an ELITE - a rare, far tougher version of an ordinary kind that
   * drops a gem worth ten of the usual?
   *
   * A FLAG rather than a kind of its own, for the same reason an evolution is a
   * flag: three elite kinds would be three more rows, three more inks and three
   * more sprite mappings, and it would read as new monsters arriving rather than
   * as "that one is a big one". `hpOf` and `xpOf` read it; nothing else should.
   */
  elite?: boolean;
  /**
   * Milliseconds before burning ground may hurt this shape again. The same shape
   * as `bladeCd` and for the same reason: without it a shape standing in a fire
   * loses its whole health in the frames it overlaps, which is not a burn, it is
   * an instant kill wearing a slower name.
   */
  burnCd?: number;
}

/**
 * Five weapons since 2026-09-14. Two of them are not projectiles: `blades` turn
 * around the robot and `drone` shoots from a little bot at its shoulder.
 */
export type WeaponId = "bolt" | "arc" | "burst" | "blades" | "drone";

/** The four that throw something. The blades never leave the robot. */
export type ShotKind = Exclude<WeaponId, "blades">;

/**
 * A carried weapon: which one, when it may fire again, and how far it has been
 * levelled.
 *
 * `lv` arrived 2026-09-21 with the operator's ruling that a run maxes out its
 * starting weapon. Before it, a weapon was taken once and never grew - every
 * upgrade buffed all four at once, so "level up your bolt" was not a sentence
 * this simulation could express. It runs 1 to `WEAPON_LV_MAX`, and at the top,
 * with its partner upgrade maxed, the weapon EVOLVES.
 */
export interface Slot {
  id: WeaponId;
  cd: number;
  lv: number;
  /**
   * Has this weapon EVOLVED? Optional, so every test that builds a slot by hand
   * is unchanged and an absent flag reads as "no", which is the safe direction.
   *
   * The evolution is a flag rather than a new `WeaponId` deliberately - see the
   * head of `evolve.ts`. It keeps the weapon reading as the one you levelled
   * rather than as a different weapon arriving, and it keeps five new inks, five
   * draw branches and five names x four languages out of the change.
   */
  evolved?: boolean;
}

/**
 * One weapon's row: every way a weapon differs from every other weapon lives in
 * this one row each, so a single row is the whole answer to "what is this
 * weapon". Colour and sound are the scene's to draw and play; they are named
 * here so nothing has to be looked up in a second place.
 *
 * The TYPE lives here rather than beside the table in `weapons.ts` because an
 * EVOLVED weapon is a row too, and `evolve.ts` has to describe one without
 * importing the base table - otherwise those two modules point at each other
 * and the graph at the top of this file stops being a graph.
 */
export interface WeaponRow {
  /** Units per second. */
  speed: number;
  /** Milliseconds before it expires on its own. */
  life: number;
  /** Radians per second it may steer toward its target. 0 never steers. */
  turn: number;
  /** How many go out per shot, before the spread upgrade adds more. */
  count: number;
  /** Extra damage over the base bolt. */
  bonus: number;
  /** Collision radius, so a fat burst fragment is not a pinpoint. */
  r: number;
  /** The sound the scene plays. One of the nine real sfx names - never invent one. */
  sfx: "tap" | "flip" | "star" | "coin";
  /** This weapon's cadence as a multiple of `fireEvery`. A ring costs more than a bolt. */
  every: number;
}

/**
 * A bolt thrown by a SHAPE, at the player.
 *
 * Deliberately not a `Bolt`: the player's bolts carry damage, pierce, a list of
 * what they have already touched, and flags for the nova and the storm, and none
 * of that means anything here - a shape's bolt costs one heart and is spent. One
 * shared type would be one type with half its fields always unused, and the
 * first bug would be a shape's bolt hitting a shape.
 */
export interface Shot {
  id: number;
  /** Which kind threw it, so the scene can draw it in that shape's ink. */
  from: EnemyKind;
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  r: number;
}

export interface Bolt {
  id: number;
  /** Which weapon threw this. The scene draws and sounds each one differently. */
  kind: ShotKind;
  x: number;
  y: number;
  vx: number;
  vy: number;
  dmg: number;
  pierce: number;
  life: number;
  /** Counted down for the trail the scene draws, so a curve leaves a comet. */
  age: number;
  /** What this bolt has already touched, so passing through cannot hit twice. */
  hit: number[];
  /**
   * Does this shot leave BURNING GROUND where it dies? The NOVA's fragments,
   * and nothing else's. Optional for the same reason as `chain`.
   */
  nova?: boolean;
  /**
   * Does this shot CHAIN - re-aim at the next shape it has not touched when it
   * lands? The STORM's, and nothing else's. Optional, so every hand-built bolt
   * in the tests is unchanged and an absent flag reads as "no".
   */
  chain?: boolean;
}

/**
 * A patch of burning ground - the NOVA's, and nothing else's.
 *
 * The first state this simulation carries that is neither a shape, a shot nor a
 * gem: it sits still, hurts what stands in it, and expires. Damage over time is
 * what makes the nova a different weapon rather than a bigger burst, and it is
 * why the burst's evolution was the expensive half of the work.
 */
export interface Fire {
  id: number;
  x: number;
  y: number;
  /** Milliseconds left before it burns out. */
  ms: number;
  /** How far it reaches, in world units. */
  r: number;
  /** What one tick of it takes off. */
  dmg: number;
}

export interface Gem {
  id: number;
  x: number;
  y: number;
  value: number;
}

/**
 * What happened during one step, for the scene to turn into sparks and sounds and
 * for the chrome to turn into the upgrade cards. The simulation neither draws nor
 * plays anything - it only says what occurred.
 */
export type RunEvent =
  /**
   * A shape died. `by` names the WEAPON that landed the killing blow, so the
   * scene can draw a different hit for each one - a slash for the blades, a
   * small shockwave for the drone and the burst, a spark for the bolt.
   *
   * Optional, and absent means "something else finished it": today that is the
   * nova's burning ground, which has no slot by the time its patch ticks. A
   * drawing decision reads an absent `by` as the plain spark it always drew, so
   * a new damage source cannot make the scene throw - it simply looks ordinary
   * until somebody gives it a look of its own.
   */
  | { type: "pop"; x: number; y: number; kind: EnemyKind; by?: WeaponId }
  /** A shot left the ship. Carries WHICH weapon, so the scene can sound it. */
  | { type: "shot"; weapon: ShotKind; x: number; y: number }
  /** A SHAPE threw one, so the scene can flash its muzzle. */
  | { type: "efire"; kind: EnemyKind; x: number; y: number }
  | { type: "hurt" }
  /** The SHIELD ate a hit. Distinct from `hurt` so the scene can sound it differently. */
  | { type: "shield" }
  /** A hit was dodged by the dash. Carries where the robot blinked FROM, for the trail. */
  | { type: "dash"; x: number; y: number }
  | { type: "gem" }
  /**
   * A stage boss has arrived. Carries WHICH stage, so the scene can name it and
   * the chrome can draw the right health bar. Fires once per stage, never twice.
   */
  | { type: "boss"; stage: number; kind: EnemyKind }
  /** The final boss called shapes in. `n` is how many really arrived, never how many it asked for. */
  | { type: "summon"; x: number; y: number; n: number }
  /** A stage boss fell and the next stage has begun. Never fires for stage 3 - that is `won`. */
  | { type: "stage"; n: number }
  | { type: "levelup" }
  | { type: "won" }
  | { type: "over" };

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
}

/** The career's three worlds (P3, 2026-09-29). Written into level ids, so never renamed. */
export type WorldId = "city" | "frost" | "lava";

/** Each world's one twist: the lights go out, the floor is ice, lava pools open. */
export type TwistId = "lights" | "ice" | "pools";

/** A lava pool: it WARNS (a ring, no harm), then it is LIVE (it burns), then it is gone. */
export interface Pool {
  id: number;
  x: number;
  y: number;
  r: number;
  /** Milliseconds of warning left. Harmless while above 0. */
  warn: number;
  /** Milliseconds of burning left once the warning is over. */
  live: number;
}

/** A patch of darkness in Neon City, where the guns cannot see. */
export interface DarkPatch {
  x: number;
  y: number;
  r: number;
}

/**
 * What the player brings INTO a career level: base stats plus gear plus what the
 * shop sold, already reduced to the numbers the simulation reads. Worked out by
 * `careerRules.ts` from the save; the simulation never sees a save.
 */
export interface CareerStats {
  /** Hearts at the start, whole. */
  hearts: number;
  /** Multipliers on the robot's speed, every weapon's damage and the gem/gold reach. 1 is unchanged. */
  speed: number;
  damage: number;
  magnet: number;
  /** Gold luck: every kill adds this many points, and each 100 drops a coin. */
  luck: number;
  /** Shield levels the run starts with (the shop's shield row). */
  shield: number;
}

/** One career level in progress: its rules, what it has dropped, and its twist's state. */
export interface CareerState {
  /** The level id, forever - `city-1` ... `lava-boss`. */
  level: string;
  world: WorldId;
  twist: TwistId;
  /** An ordinary level is WON at this much swarm time; a boss level's boss walks in at it. */
  timeMs: number;
  /** The boss level's boss, or null for an ordinary level. */
  boss: EnemyKind | null;
  /** The boss's health, already multiplied - the bar's denominator reads this. */
  bossHp: number;
  /** The world's swarm: each kind and the swarm time it joins at. */
  mix: readonly (readonly [EnemyKind, number])[];
  spawnMs: number;
  floorMs: number;
  tighten: number;
  /** Multipliers on every swarm shape's health and pace. */
  hp: number;
  pace: number;
  /** Chance a spawn is an elite. */
  elite: number;
  speed: number;
  damage: number;
  magnet: number;
  luck: number;
  /** What one coin is worth in this world. */
  coin: number;
  /** Gold picked up this level. Banked only when the level ends. */
  gold: number;
  /** Luck points toward the next coin. */
  luckAcc: number;
  /** Gold lying on the floor. */
  coins: Gem[];
  /** Elites killed this level - each is a chance at gear when it is banked. */
  elites: number;
  /** Real milliseconds played, which unlike `t` keeps running through a boss fight. Drives the drifting dark and the pools. */
  age: number;
  /** Ice momentum. */
  vx: number;
  vy: number;
  pools: Pool[];
  poolIn: number;
  poolEvery: number;
  /** The darkness this frame, recomputed from `age` - read by the guns. */
  dark: DarkPatch[];
  /** Neon City's SHADE: the one patch of dark that follows the robot, slower than it walks. */
  shadeX: number;
  shadeY: number;
  /** The level's own layout seed, from its id, so a level looks the same every time. */
  seed: number;
}

/** What a finished career level reports, to be banked into the save once. */
export interface CareerResult {
  level: string;
  won: boolean;
  /** Hearts left (0 on a loss) and the bar they were out of - the stars are read off these. */
  hp: number;
  maxHp: number;
  /** Gold picked up during the level. */
  gold: number;
  /** Elites killed - each is a small chance at gear. */
  elites: number;
}
