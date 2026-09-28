// Every shape the simulation moves around, and nothing that runs.
//
// The leaf of the module graph, the same layering as Neon Survival's: this file
// imports nothing, so every rule module can import it without a cycle.
//
//   types.ts                   <- you are here
//     body.ts    cards.ts      the snake, and what the cards change
//       crowd.ts               the shapes, their clock, the boss
//         logic.ts             newRun + step + pickCard
//           SnakeSurvivorsScene.ts / SnakeSurvivorsGame.tsx

/** A view, in logical units. The canvas is scaled to fit it. */
export type Arena = { readonly w: number; readonly h: number };

export type LevelKey = "calm" | "normal" | "wild";

/**
 * The three shapes from Neon Survival's cast, and its warden as the boss. The
 * names are Neon Survival's so a reader of both games reads one vocabulary.
 */
export type Kind = "runner" | "orb" | "brute" | "warden";

/**
 * Which boss a run is working toward: 1, 2 or 3 (round four, operator ruling:
 * "three stages, three bosses, then win"). It only counts up, once per warden
 * beaten - never resets, never skips.
 */
export type Stage = 1 | 2 | 3;

export type Pt = { x: number; y: number };

export interface Foe {
  readonly id: number;
  readonly kind: Kind;
  x: number;
  y: number;
  hp: number;
  /** ms left on the white flash after taking a hit. */
  hurt: number;
  /** ms left frozen after a knock-back; a stunned shape does not chase. */
  stun: number;
  /** ms until the spiked tail may hurt this shape again. */
  spikeCool: number;
  /** ms left in the warden's lunge (0 = walking). Only the boss lunges. */
  dash: number;
  /** ms until the warden may lunge again. */
  dashCool: number;
  /**
   * ms left of the warden's WIND-UP: it stands still, glowing, before a lunge -
   * the telegraph that lets a player see it coming (round three, 2026-09-28).
   */
  windup: number;
}

export interface Gem {
  x: number;
  y: number;
  /**
   * What it is worth, to the bar and to the snake's length, in BLUE gems:
   * 1 blue, 2 red, 3 yellow (NePo's colours). A blue gem is the old gem.
   */
  v: number;
  /** Laid on the floor by the clock (`floor.ts`), not dropped by a crushed shape. */
  floor?: true;
}

/**
 * The nine cards. `fangs`, `spikes` and `spit` are the three WEAPONS - three
 * different ways the snake hurts a shape without closing a loop, and they look
 * different: a bite at the head, spikes along the body, a shot from the mouth.
 * The other six change the snake.
 */
export type CardId = "fangs" | "spikes" | "magnet" | "swift" | "regrow" | "shockwave" | "spit" | "lasso" | "shield";

/** A Spit shot in flight. */
export interface Shot {
  x: number;
  y: number;
  vx: number;
  vy: number;
  /** ms before it fizzles out. */
  life: number;
}

/**
 * What one step did, for the scene to draw and play. The rules never read these
 * back; they are a report, emptied at the start of every step.
 */
export type Ev =
  | { k: "crush"; n: number; x: number; y: number; poly: Pt[] }
  | { k: "ko"; kind: Kind; x: number; y: number }
  | { k: "hurt"; kind: Kind; x: number; y: number }
  | { k: "hit"; kind: Kind; x: number; y: number }
  | { k: "shield" }
  | { k: "spit"; x: number; y: number }
  | { k: "windup"; x: number; y: number }
  | { k: "bite"; x: number; y: number }
  | { k: "spike"; x: number; y: number }
  | { k: "gem" }
  | { k: "level" }
  | { k: "boss" }
  | { k: "bosshit"; x: number; y: number }
  | { k: "lunge" }
  /** A boss fell and it was not the last one: the next stage just opened. */
  | { k: "stage"; stage: Stage }
  | { k: "won" }
  | { k: "dead" };

export type Phase = "stage" | "boss" | "won" | "dead";

/** Steering: a direction to turn toward. (0, 0) keeps the current heading. */
export type Steer = { dx: number; dy: number };

export interface Run {
  readonly level: LevelKey;
  /** The VIEW. The world is derived from it, three views each way. */
  readonly arena: Arena;
  readonly world: Arena;
  /** The head, in world units. Named x/y so Neon Survival's camera reads it. */
  x: number;
  y: number;
  /** Radians, 0 = right, PI/2 = down (screen space). */
  heading: number;
  /** The body behind the head, head-first, one point every `SPACING` units. */
  path: Pt[];
  /** Length in SEGMENTS, the number the HUD shows. Fractional while growing. */
  len: number;
  foes: Foe[];
  gems: Gem[];
  nextId: number;
  /** ms of play so far - never counts while a card is being chosen. */
  t: number;
  /** ms until the next shape is sent. */
  spawnIn: number;
  /** ms until the next floor gem is laid (`floor.ts`). */
  floorIn: number;
  /**
   * While `t` is under this, shapes wander slowly instead of chasing the head -
   * the safe start. `SAFE_START_MS` on a real run; the tutorial holds it open.
   */
  calmMs: number;
  xp: number;
  need: number;
  lv: number;
  /** The three cards on offer, or null while playing. */
  choosing: CardId[] | null;
  taken: Record<CardId, number>;
  /** ms left of the safety blink after a hit. */
  blink: number;
  /** ms before another loop may crush - one closing is one crush. */
  loopCool: number;
  /** ms banked toward the next regrown segment. */
  regrowAt: number;
  /** Spit shots in flight. */
  shots: Shot[];
  /** ms until Spit may shoot again. */
  spitIn: number;
  /** ms until the Shield is ready again; 0 = ready (with the card). */
  shieldIn: number;
  crushed: number;
  phase: Phase;
  /** Which boss is next - 1, 2 or 3. See `Stage`. */
  stage: Stage;
  events: Ev[];
}
