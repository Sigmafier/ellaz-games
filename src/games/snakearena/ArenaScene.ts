import Phaser from "phaser";
import type { GameContext } from "@sdk/index";
import { winMoment } from "@shared/index";
import { steerBots } from "./bots";
import { paletteFor, type ColourId } from "./colours";
import { CELL, burstSparks, drawAim, drawRound, drawSparks, labelAt, tickSparks, trailAfter, type Board, type Spark, type TrailMark } from "./draw";
import { RESTART_GRACE_MS, afterStep, decide, keyPress, running, stepMsFor, type Phase, type Press } from "./flow";
import { isSafe, launch, tick, turn, type Dir, type Round, type Shape, type TickEvents } from "./logic";
import { bestHuman, boardOf, grantFor, milestoneCrossed, reportDue, statusOf, type ArenaStatus } from "./result";
import { LEVEL, dealRound, type Setup } from "./setup";

/** Everything the title card chooses: what the next round is dealt from, and your colour. */
export type Choices = Setup & { colour: ColourId };

/**
 * Snake Arena's Phaser scene: draws the pure `Round` and feeds it input. The
 * rules are logic.ts, the bots bots.ts, what each press means flow.ts, what a
 * round pays result.ts and the look draw.ts - this class is render + input.
 *
 * The chrome never reaches in: it calls the public methods below and is told
 * what happened through `onStatus`, so every number on the page has one owner.
 */
export class ArenaScene extends Phaser.Scene {
  private ctx!: GameContext;
  private shape!: Shape;
  private name: (id: number, humans: number) => string = () => "";
  private choices: Choices = { level: "normal", map: "open", humans: 1, colour: "mint" };
  /** The setup the CURRENT round was dealt with - a choice made mid-round waits for the next. */
  private dealt: Setup = { level: "normal", map: "open", humans: 1 };
  private colors: string[] = [];
  private round!: Round;
  private phase: Phase = "ready";
  /** The player's pause - a lid over whichever phase is current, never a phase itself. */
  private paused = false;
  /** The PLATFORM's pause (the tab went away). Kept apart from the player's, like blocks. */
  private held = false;
  private acc = 0;
  /** Scene time a card last appeared (out or over) - the restart grace runs from it. */
  private endedAt = 0;
  /** This round's result is reported. One report and one grant per round, whatever happens after. */
  private reported = false;
  private newBest = false;
  private gfx!: Phaser.GameObjects.Graphics;
  private labels: Phaser.GameObjects.Text[] = [];
  private sparks: Spark[] = [];
  /** The slime trail, and the clock it fades by - scene time that stops while the round is frozen. */
  private trail: TrailMark[] = [];
  private trailNow = 0;
  private onStatus?: (s: ArenaStatus) => void;
  private onReady?: (scene: ArenaScene) => void;

  constructor() {
    super("snakearena");
  }

  init(data: {
    ctx: GameContext;
    shape: Shape;
    choices: Choices;
    name: (id: number, humans: number) => string;
    onStatus?: (s: ArenaStatus) => void;
    onReady?: (scene: ArenaScene) => void;
  }) {
    this.ctx = data.ctx;
    this.shape = data.shape;
    this.choices = data.choices;
    this.name = data.name;
    this.onStatus = data.onStatus;
    this.onReady = data.onReady;
  }

  create() {
    this.gfx = this.add.graphics();
    this.deal();
    this.ctx.lifecycle.gameplayStart();
    this.input.keyboard?.on("keydown", (e: KeyboardEvent) => {
      if (this.paused) return;
      const p = keyPress(e.key, this.round.humans > 1);
      if (!p || (p.kind === "confirm" && e.repeat)) return;
      this.press(p);
    });
    // Tap or swipe, decided on pointerUP: a swipe that began as the snake went
    // out is a direction, and a direction never restarts a round.
    let sx = 0;
    let sy = 0;
    this.input.on("pointerdown", (p: Phaser.Input.Pointer) => {
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
      this.press({ kind: "direction", dir, who: 0 });
    });
    this.draw();
    // LAST, so the chrome only ever gets a scene that is fully built.
    this.onReady?.(this);
  }

  /** The chrome's pause button. Only a round whose clock runs can be stopped. */
  setPaused(next: boolean) {
    if (!running(this.phase) || this.paused === next) return;
    this.paused = next;
    this.draw();
  }

  /** The platform's pause: the tab or app went away. Never lifts the player's own. */
  setHeld(next: boolean) {
    this.held = next;
  }

  /** The title card's choices and the PC's level panel. Before a round starts it re-deals at once; mid-round it waits for the next. */
  setChoices(next: Choices) {
    this.choices = next;
    if (this.phase === "ready" || this.phase === "aim") this.restart(this.phase);
    else this.draw();
  }

  /** The platform bar's restart: a new round on the start card, deliberately. */
  restartFromChrome() {
    this.restart("ready");
  }

  /** A card's Play or Play again, or a tap on the board: a CONFIRM, the same as Space. */
  startFromChrome() {
    if (this.paused) return;
    if (this.phase === "out") return this.again();
    this.press({ kind: "confirm" });
  }

  /** The out card's Watch: the rest of the round at three times the speed. */
  watch() {
    if (this.phase !== "out" || this.sinceEnd() < RESTART_GRACE_MS) return;
    this.phase = "watch";
    this.acc = 0;
    this.draw();
  }

  /** An on-screen pad, stick or board-stick press: a direction, like an arrow key - always P1's. */
  steer(dir: Dir) {
    // The pad is outside the pause cover, so it stays tappable: without this
    // a paused snake could be steered into a body the player cannot see.
    if (this.paused) return;
    this.press({ kind: "direction", dir, who: 0 });
  }

  private sinceEnd() {
    return this.time.now - this.endedAt;
  }

  /** The out card's Play again, and Space on the final card: a new round, waiting for a direction. */
  private again() {
    if (this.sinceEnd() < RESTART_GRACE_MS) return;
    this.restart("aim");
  }

  /** EVERY input lands here, and `decide` (flow.ts) says what it means. */
  private press(p: Press) {
    this.ctx.audio.unlock();
    this.ctx.speech.unlock();
    const move = decide(this.phase, p.kind, this.phase === "over" ? this.sinceEnd() : Infinity);
    if (move === "none") return;
    if (move === "aim") this.phase = "aim";
    if (move === "again") return this.restart("aim");
    // Either person's first direction starts a two-player round; the other's
    // snake sets off the way it was dealt, and turns on their first key.
    if (move === "go" && p.kind === "direction") {
      this.round = launch(this.round, p.who, p.dir);
      this.phase = "playing";
    }
    if (move === "turn" && p.kind === "direction") this.round = turn(this.round, p.who, p.dir);
    this.draw();
  }

  /** A fresh round of the current size and bot count, in `phase`. Clears everything input is gated on. */
  private restart(phase: Phase) {
    this.deal();
    this.phase = phase;
    this.paused = false;
    this.draw();
  }

  private deal() {
    const { colour, ...setup } = this.choices;
    this.dealt = setup;
    this.round = dealRound(this.shape, setup, Math.random);
    this.colors = paletteFor(colour, setup.humans, this.round.snakes.length);
    this.phase = "ready";
    this.acc = 0;
    this.endedAt = 0;
    this.reported = false;
    this.newBest = false;
    this.sparks = [];
    this.trail = [];
    for (const l of this.labels) l.destroy();
    this.labels = this.round.snakes.map((s) =>
      this.add
        .text(0, 0, this.name(s.id, setup.humans), {
          fontFamily: "Fredoka, Heebo, sans-serif",
          fontSize: `${Math.round(CELL * 0.6)}px`,
          fontStyle: "bold",
          color: this.colors[s.id],
        })
        .setOrigin(0.5, 1)
        .setDepth(5),
    );
    this.ctx.analytics.levelStart(boardOf(setup.level, setup.map));
  }

  update(time: number, delta: number) {
    const frozen = this.paused || this.held;
    if (!frozen) {
      this.sparks = tickSparks(this.sparks, delta);
      this.trailNow += delta;
    }
    this.render(time);
    if (!running(this.phase) || frozen) return;
    this.acc += delta;
    const ms = stepMsFor(this.phase, this.round.stepMs);
    while (this.acc >= ms && running(this.phase)) {
      this.acc -= ms;
      this.stepOnce();
    }
  }

  /** One step of the round: the bots choose, everyone moves, and whatever that did. */
  private stepOnce() {
    const before = this.humanApples();
    const prev = this.round;
    const { round, events } = tick(steerBots(this.round, LEVEL[this.dealt.level].mistake, Math.random), Math.random);
    this.round = round;
    this.trail = trailAfter(this.trail, round, this.trailNow);
    this.effects(prev, events, before);
    const was = this.phase;
    this.phase = afterStep(this.phase, round);
    if (this.phase !== was) {
      this.endedAt = this.time.now;
      this.acc = 0;
    }
    if (!this.reported && reportDue(round)) this.report();
    this.draw();
  }

  /**
   * The apples the coin milestone counts: the one player's, or with two, the
   * better eater's - so two people at one keyboard earn what one would, never
   * twice for the same round.
   */
  private humanApples() {
    return Math.max(...this.round.snakes.slice(0, this.round.humans).map((s) => s.eaten));
  }

  /** Sounds, sparks and the coin milestone for one step's events. */
  private effects(prev: Round, events: TickEvents, eatenBefore: number) {
    const b = this.board();
    for (const o of events.out) {
      this.sparks = this.sparks.concat(burstSparks(b, o.id, prev.snakes[o.id].body, this.colors));
      if (o.id < this.round.humans) {
        this.cameras.main.shake(220, 0.01);
        this.ctx.audio.play("fail");
      } else if (this.phase === "playing") this.ctx.audio.play("tap");
    }
    if (!events.ate.some((id) => id < this.round.humans) || this.phase !== "playing") return;
    const eaten = this.humanApples();
    this.ctx.audio.play("pop", { semitones: (eaten % 5) * 2 });
    if (milestoneCrossed(eatenBefore, eaten)) {
      winMoment(this.ctx, { reason: "milestone", level: `apples-${eaten}`, at: this.headPoint(), confetti: false });
    }
  }

  /**
   * The round is over for the player - out, or the bell with them still in.
   * The record is the longest they got; the port owns it and says if it is new.
   */
  private report() {
    this.reported = true;
    // Two players: one report and one grant, for whoever finished higher.
    const r = this.round;
    const me = r.snakes[bestHuman(r)];
    const { level, map } = this.dealt;
    const board = boardOf(level, map);
    const record = this.ctx.score?.report({ value: me.peak, unit: "points", board });
    this.newBest = Boolean(record?.isPersonalBest);
    const won = r.winner !== null && r.winner < r.humans;
    if (won) this.ctx.analytics.levelComplete(board, r.tick * r.stepMs);
    else this.ctx.analytics.levelFail(board, me.alive ? "time" : me.cause);
    const grant = grantFor({ won, newBest: this.newBest, peak: me.peak, level, map });
    if (grant) winMoment(this.ctx, { ...grant, at: this.headPoint() });
  }

  /** The canvas's grid, in canvas px. */
  private board(): Board {
    return { ox: 0, oy: 0, c: CELL, cols: this.shape.cols, rows: this.shape.rows };
  }

  /** The player's head (or where it burst) in VIEWPORT px - where coins fly from. */
  private headPoint(): { x: number; y: number } | undefined {
    const canvas = this.game.canvas;
    const head = this.round.snakes[bestHuman(this.round)].body[0] ?? this.round.snakes[0].body[0];
    if (!canvas || !head) return undefined;
    const rect = canvas.getBoundingClientRect();
    if (!rect.width || !rect.height) return undefined;
    return {
      x: rect.left + ((head.x + 0.5) * CELL * rect.width) / this.scale.width,
      y: rect.top + ((head.y + 0.5) * CELL * rect.height) / this.scale.height,
    };
  }

  /** Every frame: the board, the apples, the snakes, their names, and the sparks. */
  private render(time: number) {
    const g = this.gfx;
    const b = this.board();
    g.clear();
    drawRound(g, b, this.round, (Math.sin(time / 260) + 1) / 2, 0, isSafe(this.round), this.colors, this.trail, this.trailNow);
    if (this.phase === "aim") {
      const pulse = (Math.sin(time / 180) + 1) / 2;
      for (const s of this.round.snakes.slice(0, this.round.humans)) drawAim(g, b, s.body[0], pulse, this.colors[s.id]);
    }
    drawSparks(g, this.sparks, CELL);
    this.round.snakes.forEach((s, i) => {
      const label = this.labels[i];
      if (!label) return;
      label.setVisible(s.alive);
      if (!s.alive) return;
      const at = labelAt(b, s.body[0]);
      label.setPosition(at.x, at.y);
    });
  }

  private draw() {
    this.render(this.time.now);
    // LAST, so every published status reflects a frame already drawn.
    this.onStatus?.(statusOf(this.round, this.phase, this.paused, this.dealt, this.newBest, this.colors));
  }
}
