import Phaser from "phaser";
import type { GameContext } from "@sdk/index";
import { winMoment } from "@shared/index";
import { step, turn, type SnakeState, type Dir } from "./logic";
import { burst, drawAim, drawApple, drawBoard, drawSnake, drawSparks, drawWallFlash, drawWalls, tickSparks, type Board, type Spark } from "./draw";
import { dealBoard } from "./todayBoard";
import { decide, keyPress, launch, type Phase, type Press } from "./flow";
import { FOOD_PER_LEVEL, addStageWalls, stageOf } from "./stageWalls";

const COLS = 17;
const ROWS = 17;

// Base tick rates (ms/step) the player picks on the ready screen.
export type SpeedKey = "slow" | "normal" | "fast";
const SPEEDS: Record<SpeedKey, number> = { slow: 170, normal: 130, fast: 90 };

// Progressive difficulty: every FOOD_PER_LEVEL food eaten bumps the stage; each
// stage shaves STEP_DECAY_MS off the effective tick, never faster than STEP_FLOOR,
// and on the classic board drops a little wall (stageWalls.ts).
const STEP_DECAY_MS = 8;
const STEP_FLOOR = 60;

/**
 * Which board. `classic` is the open 17x17 it has always been; `today` is the
 * same walls and the same apple order for everyone on a given day, seeded by
 * `ctx.daily` - the platform's one definition of "a day".
 */
export type BoardMode = "classic" | "today";

/**
 * What the scene tells the React chrome around it. Read-only - the chrome never
 * reaches into the scene's fields, it calls `setSpeed` / `restartFromChrome`
 * and waits to be told what happened. Two owners of one number is how the
 * canvas and the header end up disagreeing about the score.
 */
export type SnakeStatus = {
  score: number;
  level: number;
  speed: SpeedKey;
  phase: Phase;
  /**
   * Published rather than mirrored in React, for the reason the whole type
   * exists: the scene is what stops moving, so the scene is the one that knows.
   * A `useState` in the chrome beside a flag in here is two owners of one fact,
   * and they disagree the first time anything but the button changes it — a
   * restart, say, which clears the pause down here and would leave a chrome
   * still drawing its cover over a snake that had already set off.
   */
  paused: boolean;
  /**
   * The stored record, as of the last run that ended - what the game-over card
   * and the band print. Read at create, raised at death. The port owns the
   * record; this is only the number to SHOW, published so the chrome keeps no
   * copy of its own.
   */
  best: number;
  /** The run that just ended beat the record. Only the score port decides. */
  newBest: boolean;
  mode: BoardMode;
  /** Today's date key from `ctx.daily`, e.g. "2026-09-27". The chrome formats it. */
  today: string;
};

/** How long the death flash runs, ms. `RESTART_GRACE_MS` in flow.ts outlasts it. */
const DEATH_FLASH_MS = 600;
/** How long a stage's new walls flash as they land, ms. */
const WALL_FLASH_MS = 900;

// Phaser scene: draws the pure SnakeState and feeds it input. The snake does not
// move until the player's first DIRECTION (ready/aim -> playing), so it never
// dies before they have chosen a way. Rules live in logic.ts, what each input
// means in flow.ts, the stage walls in stageWalls.ts; this class is render + input.
export class SnakeScene extends Phaser.Scene {
  private ctx!: GameContext;
  private state!: SnakeState;
  private phase: Phase = "ready";
  /**
   * NOT a fourth `Phase`. A phase is where the run is — waiting to start,
   * running, dead — and a pause is a lid over whichever of those is current.
   * As a phase it would have to remember what it interrupted in order to give
   * it back, and every `phase !== "playing"` test in this file (there are five)
   * would have to learn about it separately.
   */
  private paused = false;
  private cell = 20;
  private acc = 0;
  // Base speed the player selected; persists across restarts within the session.
  private selectedSpeed: SpeedKey = "normal";
  private baseStepMs = SPEEDS.normal;
  private gfx!: Phaser.GameObjects.Graphics;
  private best = 0;
  private newBest = false;
  private mode: BoardMode = "classic";
  /** Apples come from this. Math.random on the classic board, the day's generator on today's. */
  private foodRng: () => number = Math.random;
  /** Eat sparks, advanced every frame whatever the phase. */
  private sparks: Spark[] = [];
  /** Scene time of the last death, 0 for none - drives the red flash. */
  private diedAt = 0;
  /** The walls the last stage dropped, and when - drives their flash. */
  private freshWalls: number[] = [];
  private wallsAt = 0;
  /** Told to the chrome on every change. Set from `init`. */
  private onStatus?: (s: SnakeStatus) => void;
  /**
   * Handed to the chrome once this scene exists, so the chrome's buttons have
   * something to call.
   *
   * The chrome CANNOT get here by asking Phaser: `scene.start()` only QUEUES a
   * start, so a `game.scene.getScene("snake")` on the next line returns null and
   * the reference stays null forever. Measured - the toggle and the restart
   * button both silently did nothing, because `ref?.setSpeed()` on a null ref is
   * a no-op that throws no error and logs nothing, while status kept flowing the
   * other way and made the bridge look alive.
   */
  private onReady?: (scene: SnakeScene) => void;

  constructor() {
    super("snake");
  }

  init(data: {
    ctx: GameContext;
    onStatus?: (s: SnakeStatus) => void;
    onReady?: (scene: SnakeScene) => void;
  }) {
    this.ctx = data.ctx;
    this.onStatus = data.onStatus;
    this.onReady = data.onReady;
  }

  /** Push the current status out. Called from `draw`, so it cannot go stale. */
  private publish() {
    this.onStatus?.({
      score: this.state.score,
      level: this.level(),
      speed: this.selectedSpeed,
      phase: this.phase,
      paused: this.paused,
      best: this.best,
      newBest: this.newBest,
      mode: this.mode,
      today: this.today(),
    });
  }

  /**
   * The chrome's pause button.
   *
   * `acc` is deliberately left alone. `update` returns before touching it while
   * paused, so no delta is banked in the meantime and the snake resumes with
   * whatever fraction of a step it had — it does not lurch forward by however
   * long the tablet was face-down, which is what a running accumulator would
   * have made it do.
   */
  setPaused(next: boolean) {
    // Only a moving snake can be stopped. On the ready screen or the game-over
    // screen there is nothing to hold, and a lid over either hides the words
    // telling the player how to leave it.
    if (this.phase !== "playing") return;
    if (this.paused === next) return;
    this.paused = next;
    this.draw();
  }

  /**
   * The chrome's difficulty toggle. Unlike the old in-canvas picker this does
   * NOT start the game: the toggle is reachable mid-run, and a speed change
   * must never also be a "go". Changing speed mid-run is deliberate and takes
   * effect on the next tick.
   */
  setSpeed(key: SpeedKey) {
    this.selectedSpeed = key;
    this.baseStepMs = SPEEDS[key];
    this.draw();
  }

  /** Pick the board. Deals it and waits on the ready screen: a choice is not a "go". */
  setMode(mode: BoardMode) {
    if (mode === this.mode && this.phase === "ready") return;
    this.mode = mode;
    this.restart();
  }

  /** The chrome's restart button. */
  restartFromChrome() {
    this.restart();
  }

  /**
   * A card's button: the start card's Play / Today's board, the game-over
   * card's Play again, the on-board stick's tap. The same CONFIRM a tap on the
   * canvas or Space is, through the same `press` - so a button and the board
   * cannot drift, and Play again waits out the same grace after a death.
   * (Until 2026-08-30 the thing saying "tap" did not answer a tap; see
   * a-control-that-carries-an-imperative-must-be-a-control.md.)
   */
  startFromChrome() {
    if (this.paused) return;
    this.press({ kind: "confirm" });
  }

  /** An on-screen D-pad, stick or on-board stick press: a direction, like an arrow key. */
  steer(dir: Dir) {
    // Behind the cover, and that is the whole point of checking here: the
    // D-pad is in the FOOTER, outside the cover the chrome draws, so it stays
    // tappable. Without this a paused snake can be steered into a wall the
    // player cannot see.
    if (this.paused) return;
    this.press({ kind: "direction", dir });
  }

  /**
   * EVERY input lands here - keys, taps, swipes, the pad, the stick, the cards
   * - and `decide` (flow.ts) says what it means. Nothing else in this file
   * restarts a finished run except the platform bar and a board change.
   *
   * It does not check the pause itself: each of the five surfaces calling it
   * does, one guard each (pause-stops-the-game.test.ts counts them, so a new
   * surface cannot arrive without saying it thought about the pause).
   */
  private press(p: Press) {
    this.ctx.audio.unlock();
    this.ctx.speech.unlock();
    const since = this.phase === "over" ? this.time.now - this.diedAt : Infinity;
    switch (decide(this.phase, p.kind, since)) {
      case "aim":
        this.phase = "aim";
        break;
      case "again":
        // One press, and the next run is waiting for its first direction - it
        // never stops on the start card, and never sets off on its own.
        this.restart();
        this.phase = "aim";
        break;
      case "go":
        if (p.kind === "direction") this.state = launch(this.state, p.dir);
        this.phase = "playing";
        break;
      case "turn":
        if (p.kind === "direction") this.state = turn(this.state, p.dir);
        break;
      default:
        return;
    }
    this.draw();
  }

  create() {
    this.deal();
    this.phase = "ready";
    this.computeCell();
    this.gfx = this.add.graphics();
    // No text on the canvas at all. The score, stage and best are in the band
    // on top of the board, and the start and game-over cards sit over it - all
    // DOM, in the board's own colours, so each is a real button or a real number.

    this.ctx.lifecycle.gameplayStart();
    this.ctx.analytics.levelStart("classic");

    this.input.keyboard?.on("keydown", (e: KeyboardEvent) => {
      if (this.paused) return;
      const p = keyPress(e.key);
      // A HELD Space auto-repeats; only a fresh press confirms anything.
      if (!p || (p.kind === "confirm" && e.repeat)) return;
      this.press(p);
    });

    // Tap or swipe is decided on pointerUP, never down: a swipe that began as
    // the snake died is a direction, and a direction never restarts a run.
    let sx = 0, sy = 0;
    this.input.on("pointerdown", (p: Phaser.Input.Pointer) => {
      // The canvas IS covered while paused; guarded anyway, because Phaser's
      // input runs off the canvas element rather than the DOM node the cover
      // sits over.
      if (this.paused) return;
      sx = p.x;
      sy = p.y;
    });
    this.input.on("pointerup", (p: Phaser.Input.Pointer) => {
      if (this.paused) return;
      const dx = p.x - sx;
      const dy = p.y - sy;
      if (Math.abs(dx) < 18 && Math.abs(dy) < 18) return this.press({ kind: "confirm" });
      const dir: Dir = Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? "right" : "left") : dy > 0 ? "down" : "up";
      this.press({ kind: "direction", dir });
    });

    this.scale.on("resize", () => this.computeCell());
    this.draw();
    // LAST in create, so the chrome only ever gets a scene that is fully built.
    this.onReady?.(this);
  }

  private computeCell() {
    this.cell = Math.floor(Math.min(this.scale.width, this.scale.height) / COLS);
  }

  // Board origin inside the canvas, in canvas pixels (shared by draw + headPoint).
  private boardOrigin(): { ox: number; oy: number } {
    return {
      ox: Math.floor((this.scale.width - COLS * this.cell) / 2),
      oy: Math.floor((this.scale.height - ROWS * this.cell) / 2),
    };
  }

  /**
   * The snake's head in VIEWPORT coordinates — where the flying coins should
   * start from. Canvas pixels are not viewport pixels: Phaser's FIT scale mode
   * letterboxes the canvas, so the canvas's CSS size differs from
   * `scale.width/height` and both axes need their own factor.
   */
  private headPoint(): { x: number; y: number } | undefined {
    const canvas = this.game.canvas;
    if (!canvas) return undefined;
    const rect = canvas.getBoundingClientRect();
    if (!rect.width || !rect.height) return undefined;
    const { ox, oy } = this.boardOrigin();
    const head = this.state.body[0];
    const sx = rect.width / this.scale.width;
    const sy = rect.height / this.scale.height;
    return {
      x: rect.left + (ox + head.x * this.cell + this.cell / 2) * sx,
      y: rect.top + (oy + head.y * this.cell + this.cell / 2) * sy,
    };
  }

  // Current stage (1-based) and the effective tick after progressive speed-up.
  private level(): number {
    return stageOf(this.state.score);
  }
  private effectiveStep(): number {
    return Math.max(STEP_FLOOR, this.baseStepMs - (this.level() - 1) * STEP_DECAY_MS);
  }

  private today(): string {
    try {
      return this.ctx.daily?.today ?? "";
    } catch {
      return "";
    }
  }

  /** Today's board keeps its own record, one per day; the classic keeps the old one. */
  private recordBoard(): string | undefined {
    return this.mode === "today" ? `today-${this.today()}` : undefined;
  }

  /** A fresh board of the current kind (see `dealBoard`), and its record. */
  private deal() {
    ({ state: this.state, foodRng: this.foodRng } = dealBoard(this.mode, () => this.ctx.daily.rng(), COLS, ROWS));
    this.best = this.ctx.score?.best(this.recordBoard()) ?? 0;
  }

  private restart() {
    this.deal();
    this.phase = "ready";
    // A new run is never a paused one. Restarting from behind the cover
    // otherwise leaves the chrome holding a lid over a ready screen whose
    // "tap to start" nobody can read or reach.
    this.paused = false;
    this.acc = 0;
    this.newBest = false;
    this.diedAt = 0;
    this.freshWalls = [];
    // NB: baseStepMs / selectedSpeed intentionally kept — speed persists across restarts.
    this.ctx.analytics.levelStart(this.mode);
    this.draw();
  }

  update(_time: number, delta: number) {
    // The effects run in every phase - sparks finish flying and the death
    // flash plays out on the game-over screen - but nothing moves while paused.
    if (!this.paused) this.sparks = tickSparks(this.sparks, delta);
    this.render(this.time.now);
    if (this.phase !== "playing" || this.paused) return;
    this.acc += delta;
    const stepMs = this.effectiveStep();
    while (this.acc >= stepMs) {
      this.acc -= stepMs;
      const prevScore = this.state.score;
      this.state = step(this.state, this.foodRng);
      if (this.mode === "classic" && stageOf(this.state.score) > stageOf(prevScore)) {
        const grown = addStageWalls(this.state, Math.random);
        this.state = grown.state;
        this.freshWalls = grown.added;
        this.wallsAt = this.time.now;
      }
      if (this.state.score > prevScore) {
        // A pop that climbs a step with each apple of a stage, so a run sounds
        // like it is going somewhere.
        this.ctx.audio.play("pop", { semitones: (this.state.score % FOOD_PER_LEVEL) * 2 });
        this.eaten();
        // Endless game: a mid-run ping every 5 food. Coins, no star, no confetti.
        if (this.state.score % 5 === 0) {
          winMoment(this.ctx, {
            reason: "milestone",
            level: `score-${this.state.score}`,
            at: this.headPoint(),
            confetti: false,
          });
        }
      }
      if (!this.state.alive) {
        this.phase = "over";
        this.diedAt = this.time.now;
        this.cameras.main.shake(220, 0.012);
        this.ctx.audio.play("fail");
        this.ctx.analytics.levelFail(this.mode, "collision");
        // A run that beat the stored record ends on a high note. The port owns
        // the record outright now — it compares, persists and answers, so the
        // scene keeps no copy to drift out of sync (snake never displays it).
        // Reported once, at death: snake's score only ever climbs, so asking
        // per food would put the same question dozens of times a run.
        const record = this.ctx.score?.report({ value: this.state.score, unit: "points", board: this.recordBoard() });
        // A first score on a fresh record is always "better", 0 included - so
        // a best needs an apple, and only the classic board pays for one:
        // today's record resets daily, so paying it would be a star a day.
        const pb = Boolean(record?.isPersonalBest) && this.state.score > 0;
        this.newBest = pb;
        this.best = Math.max(this.best, this.state.score);
        if (pb && this.mode === "classic") {
          winMoment(this.ctx, {
            reason: "personal_best",
            level: `score-${this.state.score}`,
            at: this.headPoint(),
          });
        }
      }
      this.draw();
    }
  }

  private board(): Board {
    const { ox, oy } = this.boardOrigin();
    return { ox, oy, c: this.cell, cols: COLS, rows: ROWS };
  }

  /** Sparks where the head was, and a +1 that floats off it. */
  private eaten() {
    const b = this.board();
    const head = this.state.body[0];
    const x = b.ox + (head.x + 0.5) * b.c;
    const y = b.oy + (head.y + 0.5) * b.c;
    this.sparks = this.sparks.concat(burst(x, y, b.c * 3));
    const plus = this.add
      .text(x, y - b.c * 0.6, "+1", {
        fontFamily: "Fredoka, sans-serif",
        fontSize: `${Math.round(b.c * 0.8)}px`,
        fontStyle: "bold",
        color: "#ffd166",
      })
      .setOrigin(0.5)
      .setDepth(11);
    this.tweens.add({
      targets: plus,
      y: y - b.c * 1.8,
      alpha: 0,
      duration: 650,
      onComplete: () => plus.destroy(),
    });
  }

  /** Every frame: the board, the breathing apple, the snake, the sparks. */
  private render(time: number) {
    const g = this.gfx;
    const b = this.board();
    g.clear();
    drawBoard(g, b);
    drawWalls(g, b, this.state.walls);
    drawWallFlash(g, b, this.freshWalls, (time - this.wallsAt) / WALL_FLASH_MS);
    drawApple(g, b, this.state.food, (Math.sin(time / 260) + 1) / 2);
    const since = this.diedAt ? time - this.diedAt : Infinity;
    // Blinks three times, then settles on the snake's own colours.
    const flash = since < DEATH_FLASH_MS && Math.floor(since / 100) % 2 === 0 ? 1 : 0;
    drawSnake(g, b, this.state.body, this.state.dir, flash);
    if (this.phase === "aim") drawAim(g, b, this.state.body[0], (Math.sin(time / 180) + 1) / 2);
    drawSparks(g, this.sparks, b.c);
  }

  private draw() {
    this.render(this.time.now);
    // LAST in draw, so every published status reflects a frame that has already
    // been rendered - the chrome can never show a score the canvas has not.
    this.publish();
  }
}
