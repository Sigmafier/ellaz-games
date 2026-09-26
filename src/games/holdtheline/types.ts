// Hold the Line - the shapes the simulation and its side modules share.
//
// A TYPES module rather than a section of `logic.ts`, which is the idiom
// survivors arrived at: `waves.ts`, `shop.ts`, `turrets.ts` and `defences.ts`
// all need these names, and if they took them from `logic.ts` while `logic.ts`
// took their rules, every one of them would be a cycle. Importing types from
// here is one-way by construction.
//
// NOTHING IN THIS FILE IS MEASURED. Every number in this game is a starting
// guess until a headless run says otherwise, and the ones that survive tuning
// get their measurement written beside them - see
// `.claude/rules/a-comment-that-explains-a-cost-must-name-its-measurement.md`.
// A number here with no comment is a number nobody has played yet.

/** A battlefield, in logical units. The canvas is scaled to fit it. */
export type Arena = { readonly w: number; readonly h: number };

export type LevelKey = "calm" | "normal" | "wild";

/**
 * What walks in.
 *
 * Each one exists because a COUNTER exists, never the other way round - the
 * shop's four lines are the answers to this list, and a kind with no answer is
 * a kind that makes the shop a shopping list instead of a forecast.
 */
export type WalkerKind =
  /** The ordinary attacker. Walks, hits the wall. */
  | "foot"
  /** Fast and thin. Punishes a player who is still reloading. */
  | "runner"
  /** Stops short and shoots BACK, at the wall and at the guards. */
  | "shooter"
  /** Slow, heavy, and expensive to stop with bullets. The rocketeer's reason. */
  | "vehicle"
  /** Flies over the lane. Ignores every ground defence. The AA gunner's reason. */
  | "air"
  /** The wave-20 boss, and overtime's periodic one. Carries its own bar. */
  | "heavy";

/** Which gun the player is holding. One at a time; buying one replaces it. */
export type WeaponId = "pistol" | "repeater" | "shotgun" | "rifle" | "launcher";

/** A hired body on the roof. Each has its own clock and picks its own target. */
export type GuardKind = "rifleman" | "marksman" | "aa" | "rocketeer";

/** Something planted in the lane. */
export type LaneKind = "mine" | "wire";

/**
 * The four shop lines the operator named. `gun` REPLACES, the other three
 * ACCUMULATE, and that difference is why they are one union rather than four
 * parallel ones - `buy` branches on it exactly once.
 */
export type ShopLine = "gun" | "power" | "guard" | "lane";

/** An upgrade that multiplies whatever gun is being held. */
export type PowerId = "damage" | "reload" | "magazine" | "pierce";

export type ShopId = WeaponId | PowerId | GuardKind | LaneKind | "repair" | "wall";

export interface ShopItem {
  id: ShopId;
  line: ShopLine;
  /** What it costs the FIRST time. A repeatable item's price climbs - see `priceOf`. */
  price: number;
  /**
   * How many times it may be bought, or `Infinity` for a wall repair.
   *
   * A cap is not a courtesy: an uncapped multiplier is how a long run stops
   * being a run and starts being a purchase order.
   */
  cap: number;
  /** The wave this first appears in the shop, so the list grows with the threat. */
  from: number;
}

export interface Walker {
  id: number;
  kind: WalkerKind;
  x: number;
  y: number;
  hp: number;
  maxHp: number;
  /** Units per second toward the house. */
  speed: number;
  /** Damage dealt per strike, to the wall and then to the house. */
  dmg: number;
  /** Milliseconds between strikes - or between shots, for a `shooter`. */
  cycle: number;
  /** Milliseconds until the next strike. */
  cool: number;
  /**
   * How far from the wall this one stops. 0 for anything that walks all the way
   * in; a `shooter`'s whole identity is that this is large.
   */
  standoff: number;
  /** Bigger bodies are harder to miss and easier to see. Drawn FROM this. */
  radius: number;
  /** Counting down while it falls over, so a corpse is not a target. */
  ko: number;
}

export interface Shot {
  id: number;
  x: number;
  y: number;
  /** Units per second. */
  vx: number;
  vy: number;
  dmg: number;
  /** How many more bodies it may pass through. 0 means it stops on the first. */
  pierce: number;
  /** Whose it is. An enemy shot cannot hurt an enemy. */
  hostile: boolean;
  /** Ids already hit, so one shot cannot hit one body twice. */
  hit: number[];
}

export interface Guard {
  id: number;
  kind: GuardKind;
  /** Which roof position, 0 upward. Drawn from this; the sim only counts them. */
  slot: number;
  cool: number;
  /** A shooter can knock a guard out for a while. It never dies for good. */
  down: number;
}

export interface Mine {
  id: number;
  x: number;
  kind: LaneKind;
}

/**
 * What `step` did this frame, for the renderer and the chrome to react to.
 *
 * Drained at the top of every `step`, exactly as survivors does it: a caller
 * that misses a frame misses the event, which is correct - these are cues, not
 * state, and a cue nobody drew is a cue that has passed.
 */
export type RunEvent =
  | { t: "fire" }
  | { t: "hit"; x: number; y: number }
  | { t: "kill"; x: number; y: number; kind: WalkerKind; cash: number }
  | { t: "wallHit"; dmg: number }
  | { t: "houseHit"; dmg: number }
  | { t: "mine"; x: number }
  | { t: "waveClear"; wave: number; cash: number }
  | { t: "won" }
  | { t: "over" };

export interface RunState {
  level: LevelKey;
  /**
   * The lane this run is being played on.
   *
   * ON THE RUN rather than read from the module, for the reason survivors'
   * `arena` field gives: a module constant is one shape for every player, so a
   * desktop could not have a wider one without a phone having it too. Carrying
   * it here keeps `step` a pure function of what it is handed.
   *
   * What is held constant between the two arms is the WIDTH - the lane - and
   * not the area. See `logic.ts`'s ARENA comment for why this game departs from
   * the equal-area rule survivors set.
   */
  arena: Arena;

  /** `shop` between waves, `wave` while something is walking. */
  phase: "shop" | "wave" | "over";
  /** Which wave is next (in `shop`) or running (in `wave`). 1-based. */
  wave: number;
  /**
   * The wave the campaign was WON on, or 0.
   *
   * A latch rather than a phase, because the run does not stop here - wave 20
   * is a win and then the lane keeps sending them. It is also the reward latch
   * a saved position has to carry, or leaving and returning pays
   * `level_complete` twice.
   */
  wonAt: number;

  /** Absorbs damage first. Repairs buy it back; the wall upgrade raises its cap. */
  wall: number;
  wallMax: number;
  /** When this reaches 0 the run is over. Nothing repairs it. */
  house: number;
  houseMax: number;

  /**
   * IN-RUN CURRENCY. It is created by the run, spent by the run, and dies with
   * the run.
   *
   * IT NEVER REACHES `ctx.rewards`, THE PROFILE, OR STORAGE AS A WALLET, and
   * there is no exchange rate between it and a coin. `ctx.rewards` is add-only
   * by law so that no game can take a child's coins; this is a different object
   * living entirely inside one run, and the two must never acquire a conversion
   * - the moment they do, a bug in the damage table below is a bug in a child's
   * wallet.
   */
  cash: number;
  /** Everything ever earned, which is what the SCORE is built from. */
  earned: number;
  /** The reported score. Points, so higher wins; `score.ts` decides that, not us. */
  score: number;

  /** Which weapon is in hand. Buying another replaces it. */
  weapon: WeaponId;
  /** How many of each power have been bought. Capped in `shop.ts`. */
  powers: Record<PowerId, number>;
  /** Rounds left before a reload. */
  ammo: number;
  /** Milliseconds until the weapon can fire again, reload included. */
  weaponCool: number;
  /** True while reloading, so the chrome can say so without inferring it. */
  reloading: boolean;

  guards: Guard[];
  mines: Mine[];
  walkers: Walker[];
  shots: Shot[];

  /** How many of each shop item have been bought, for caps and for prices. */
  bought: Partial<Record<ShopId, number>>;
  /**
   * Which `milestone` payouts have already been banked, by wave.
   *
   * THE REWARD LATCH. A snapshot carries this or leaving and returning at wave
   * 10 pays the wave-10 milestone twice - `session-snapshot-convention.md`.
   */
  paidMilestones: number[];

  /** Monotonic id source. On the run so a replay is byte-identical. */
  seq: number;
  /** Milliseconds elapsed in the CURRENT wave. Not a run clock. */
  t: number;
  /** Still to arrive in this wave, oldest first. Drained by the spawn clock. */
  queue: WalkerKind[];
  /** Milliseconds until the next one walks in. */
  spawnCool: number;

  events: RunEvent[];
}
