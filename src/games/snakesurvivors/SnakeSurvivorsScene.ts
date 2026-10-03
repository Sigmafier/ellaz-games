import Phaser from "phaser";
import type { GameContext } from "@sdk/index";
import { winMoment } from "@shared/index";
import { mulberry32 } from "@shared/rng";
import { animKey, createStudioAnims, originFor, type PhaserAnimsLike } from "@shared/sprites/load-atlas";
// Two real effects: a buzz in the hand when the head is hit, and a confetti puff
// over the page for a crush of four or more.
import { burst as juiceBurst, haptic, prefersReducedMotion } from "@juice/index";
import { textFor } from "@i18n/index";
import { CAST, type CastKey, type Clip } from "../survivors/sprites";
import { knobAt, originFor as stickOriginFor, stickVector, STICK_RADIUS, type Stick } from "../survivors/stick";
import { cameraOf } from "../survivors/world";
import { SHEETS, kindScale, sheetOf } from "./cast";
import { centreOf, guideShown, insideNow, pendingLoop } from "./body";
import { HOLE } from "./cards";
import { KINDS, LUNGE, MINI_HP, bossHpOf, hitCost, isBoss } from "./crowd";
import { crushFx, tailCrushFx } from "./crushFx";
import {
  INK, KIND_INK, dashes, drawBolt, drawGem, drawGemArrow, drawHpBar, drawGround, drawGuideRing, drawInsideMark, drawLoop, drawNova, drawShieldRing,
  drawShockRing, drawShot, drawSnake, drawSnapGuide, drawVortex, drawWindup, drawZap,
} from "./draw";
import { FX_TEXT, type FxText } from "./fxText";
import { ARENA, mergeGuard, newRun, pickCard, step } from "./logic";
import { pullPairs } from "./merge";
import {
  gemTarget, guideRing, hasSeenTutorial, leaveTutorial, markTutorialSeen, newTutorial, tickTutorial, tutorialPick,
  type Tutorial, type TutorialStep,
} from "./tutorial";
import type { Arena, CardId, Foe, LevelKey, Pt, Run, Stage, Steer } from "./types";
// THE CAREER (snake career, 2026-10-03): a level is built by `newCareerRun`, and
// each world's floor, sand, gold and dark are drawn by `careerScene.ts`.
import { PLAIN_STATS, careerResult, newCareerRun } from "./careerRun";
import { WORLD_GROUND, drawCareerLayers } from "./careerScene";
import type { SnakeCareerResult, SnakeCareerStats, SnakeWorldId } from "./careerTypes";

// The Phaser half of Snake Survivors. It owns pixels, pointers and telling the
// chrome what happened - every rule lives in the pure modules beside it.

export type UiPhase = "ready" | "playing" | "over" | "won";

export interface SnakeSurvivorsStatus {
  phase: UiPhase;
  paused: boolean;
  level: LevelKey;
  len: number;
  peak: number;
  crushed: number;
  /**
   * The BOSS meter: how near the run is to ITS CURRENT stage's warden -
   * length and crushed against `STAGE_TRIGGER[stage]`. Null once a warden is
   * actually up (see `boss` below).
   */
  meter: { len: number; crushed: number; stage: Stage } | null;
  lv: number;
  offer: CardId[];
  taken: Record<CardId, number>;
  boss: { now: number; max: number } | null;
  /** Segments one bump costs right now (`hitCost`: half a heart on normal and wild, from a fifth into stage 2) - the hearts divide by it. */
  bite: number;
  /** The goal row (round eight): ms of PLAY (never paused or choosing), and the stage whose warden is next. */
  ms: number;
  stage: Stage;
  newBest: boolean;
  /** The guided first run's step, or null on a real run. */
  tutorial: TutorialStep | null;
  /**
   * ROUND FOUR: which stage just opened, for a couple of seconds after a
   * warden falls (and there is a next one) - the chrome's "Stage 2" banner.
   * Null the rest of the time, including at the FINAL win (no next stage to
   * announce).
   */
  banner: Stage | null;
  /** A career level's goal and purse, or null on a quick run. */
  career: { level: string; world: SnakeWorldId; target: number; boss: boolean; bossUp: boolean; gold: number } | null;
}

/**
 * Coins, no star, every this many crushed - an endless-feeling mid-run ping.
 * 25 until round four's second pass (2026-09-29): a won run now crushes about
 * 580 to 900 shapes where it crushed 47, so 25 would have paid out thirty
 * times a run; 100 pays six to nine, a few more than the old two.
 */
const MILESTONE_EVERY = 100;
const TIER: Record<LevelKey, "easy" | "medium" | "hard"> = { calm: "easy", normal: "medium", wild: "hard" };
/** A career world's tier for the site's reward: the garden easy, the desert medium, the cave hard. */
const CAREER_TIER: Record<SnakeWorldId, "easy" | "medium" | "hard"> = { garden: "easy", desert: "medium", cave: "hard" };
const DEPTH = { bg: 0, fx: 5, corpse: 8, foe: 10, snake: 20, pop: 40, hud: 50 } as const;
const LOOP_LIFE = 620;
/** The level line's thickness in arena units: about 4px on a phone, 4.5 on a PC (the C3 mock). */
const XP_LINE = 3.5;
/** How long a Chain Crush zap and a Nova ring stay on screen. */
const ZAP_LIFE = 260;
const NOVA_LIFE = 700;
const MAX_CORPSES = 14;
const KEYS: Record<string, Steer> = {
  arrowleft: { dx: -1, dy: 0 }, a: { dx: -1, dy: 0 },
  arrowright: { dx: 1, dy: 0 }, d: { dx: 1, dy: 0 },
  arrowup: { dx: 0, dy: -1 }, w: { dx: 0, dy: -1 },
  arrowdown: { dx: 0, dy: 1 }, s: { dx: 0, dy: 1 },
};

type Spark = { x: number; y: number; vx: number; vy: number; life: number; ink: number; size: number };

export class SnakeSurvivorsScene extends Phaser.Scene {
  private ctx!: GameContext;
  private arena: Arena = ARENA;
  private onStatus?: (s: SnakeSurvivorsStatus) => void;
  private onReady?: (scene: SnakeSurvivorsScene) => void;
  private rng: () => number = Math.random;
  private run!: Run;
  /** The guided first run while it is on; `run` is then its practice run. */
  private tut: Tutorial | null = null;
  /** Finished or skipped on this mount - holds even when storage cannot remember it. */
  private tutorialDone = false;
  private level: LevelKey = "normal";
  private phase: UiPhase = "ready";
  private paused = false;
  private stick: Stick | null = null;
  private keys = new Set<string>();
  private bg!: Phaser.GameObjects.Graphics;
  private fg!: Phaser.GameObjects.Graphics;
  private hud!: Phaser.GameObjects.Graphics;
  private mobs = new Map<number, Phaser.GameObjects.Sprite>();
  private corpses: Phaser.GameObjects.Sprite[] = [];
  private sparks: Spark[] = [];
  private loops: { poly: Pt[]; age: number; flashMs: number }[] = [];
  /** Round four's crush: shockwave rings, Chain Crush zaps and Nova rings, each fading. */
  private rings: { c: Pt; from: number; to: number; age: number; life: number }[] = [];
  private zaps: { a: Pt; b: Pt; age: number }[] = [];
  private novas: { c: Pt; age: number }[] = [];
  /** Under the shapes: the mint marks on what the loop would catch now. */
  private under!: Phaser.GameObjects.Graphics;
  /** The "N inside" chip beside the head. */
  private insideChip!: Phaser.GameObjects.Text;
  private fx: FxText = FX_TEXT.en;
  /** The one "CRUSH xN!" on screen: a circling snake crushes every few hundred ms, and a new one replaces the last rather than stacking on it. */
  private crushBanner: Phaser.GameObjects.Text | null = null;
  private peak = 0;
  private bestBefore = 0;
  private newBest = false;
  private nextMilestone = MILESTONE_EVERY;
  private lastPublish = 0;
  private lastGemSound = 0;
  /** `this.time.now` the "Stage N" banner stays up until (round four). */
  private bannerUntil = 0;
  /** The career level being played, or null on a quick run; its stats; and the run's name, so it is paid once. */
  private careerLevel: string | null = null;
  private careerStats: SnakeCareerStats = PLAIN_STATS;
  private careerToken = "";
  private runCount = 0;
  private onCareerEnd?: (r: SnakeCareerResult, token: string) => void;
  /** Which floor is drawn: a career world, or the quick run's. */
  private groundFor: SnakeWorldId | "quick" = "quick";
  /** The career's sand, under everything that moves; the cave's dark, over the floor and under the shapes. */
  private low!: Phaser.GameObjects.Graphics;
  private dark!: Phaser.GameObjects.Graphics;

  constructor() {
    super("snakesurvivors");
  }

  init(data: { ctx: GameContext; arena?: Arena; onStatus?: (s: SnakeSurvivorsStatus) => void; onReady?: (s: SnakeSurvivorsScene) => void; onCareerEnd?: (r: SnakeCareerResult, token: string) => void }) {
    this.ctx = data.ctx;
    this.fx = textFor(FX_TEXT, data.ctx.locale);
    this.arena = data.arena ?? ARENA;
    this.onStatus = data.onStatus;
    this.onReady = data.onReady;
    this.onCareerEnd = data.onCareerEnd;
  }

  preload() {
    for (const key of SHEETS) this.load.atlas(key, CAST[key].png, CAST[key].atlas);
  }

  create() {
    this.rng = mulberry32(Date.now() >>> 0);
    this.run = newRun(this.level, this.arena, this.rng);
    this.peak = this.run.len;
    this.cameras.main.setBounds(0, 0, this.run.world.w, this.run.world.h);
    for (const key of SHEETS) {
      // NEAREST keeps the pixel art's edges; see Neon Survival's scene.
      this.textures.get(key).setFilter(Phaser.Textures.FilterMode.NEAREST);
      createStudioAnims(this as unknown as PhaserAnimsLike, key, CAST[key].manifest);
    }
    this.bg = this.add.graphics().setDepth(DEPTH.bg);
    drawGround(this.bg, this.run.world);
    this.low = this.add.graphics().setDepth(DEPTH.bg + 1);
    this.dark = this.add.graphics().setDepth(DEPTH.corpse + 1);
    this.under = this.add.graphics().setDepth(DEPTH.fx);
    this.fg = this.add.graphics().setDepth(DEPTH.snake);
    this.insideChip = this.add
      .text(0, 0, "", {
        fontFamily: "Fredoka, Heebo, sans-serif",
        fontSize: "15px",
        color: "#0b0e22",
        fontStyle: "bold",
        backgroundColor: "#55efc4",
        padding: { x: 8, y: 4 },
      })
      .setOrigin(0, 0.5)
      .setDepth(DEPTH.pop)
      .setVisible(false);
    this.hud = this.add.graphics().setDepth(DEPTH.hud).setScrollFactor(0);

    // A thumb down is born as a stick wherever it lands, in SCREEN units - the
    // lesson Neon Survival learned once its camera started to move.
    this.input.on("pointerdown", (p: Phaser.Input.Pointer) => {
      if (this.paused) return;
      if (this.phase !== "playing") return void this.startFromChrome();
      const o = stickOriginFor(p.x, p.y);
      this.stick = { ox: o.ox, oy: o.oy, px: p.x, py: p.y };
    });
    this.input.on("pointermove", (p: Phaser.Input.Pointer) => {
      if (p.isDown && this.stick) (this.stick.px = p.x), (this.stick.py = p.y);
    });
    this.input.on("pointerup", () => (this.stick = null));
    this.input.on("gameout", () => (this.stick = null));
    const kb = this.input.keyboard;
    kb?.on("keydown", (e: KeyboardEvent) => {
      if (!this.paused) this.keys.add(e.key.toLowerCase());
    });
    kb?.on("keyup", (e: KeyboardEvent) => this.keys.delete(e.key.toLowerCase()));

    this.draw();
    this.publish(true);
    this.onReady?.(this);
  }

  // ---- the chrome's handles -------------------------------------------------

  setLevel(next: LevelKey) {
    if (this.level === next) return;
    this.level = next;
    this.restart();
  }

  setPaused(next: boolean) {
    if (this.phase !== "playing" || this.paused === next) return;
    this.paused = next;
    // Keys held when the lid came down would still be held when it lifts.
    if (next) (this.keys.clear(), (this.stick = null));
    this.publish(true);
  }

  restartFromChrome() {
    this.restart();
  }

  /** The entrance's Play, and a tap on the canvas: one path, so they cannot drift. */
  startFromChrome() {
    this.ctx.audio.unlock();
    if (this.phase === "playing") return;
    // A first-ever Play walks through the tutorial first (ruling R2.5).
    // A career level never detours through it: the map is reached from the title, past the guided run.
    if (this.careerLevel === null && this.phase === "ready" && !this.tutorialDone && !hasSeenTutorial(this.ctx.storage)) return this.startTutorial();
    if (this.phase !== "ready") this.restart();
    this.phase = "playing";
    this.bestBefore = this.ctx.score?.best(this.level) ?? 0;
    this.ctx.analytics.levelStart(this.careerLevel ? `career-${this.careerLevel}` : this.level);
    this.publish(true);
  }

  /** A career level, from the map: the save's stats, reduced by `careerRules.simStats`. The run waits at "ready". */
  startCareer(levelId: string, stats: SnakeCareerStats) {
    this.careerLevel = levelId;
    this.careerStats = stats;
    this.restart();
  }

  /** Back to the quick run: its own floor, its own rules, untouched. */
  leaveCareer() {
    if (this.careerLevel === null) return;
    this.careerLevel = null;
    this.restart();
  }

  choose(id: CardId) {
    if (!this.run.choosing) return;
    if (this.tut) tutorialPick(this.tut, id);
    else pickCard(this.run, id);
    this.ctx.audio.play("pop");
    if (this.tut?.step === "done") return this.endTutorial();
    this.publish(true);
  }

  /** The entrance's "How to play", and a first-ever Play: the practice run. */
  startTutorial() {
    this.ctx.audio.unlock();
    this.restart();
    this.tut = newTutorial(this.arena, this.rng);
    this.run = this.tut.run;
    this.phase = "playing";
    this.publish(true);
  }

  /** Skip, or the last step done: remember it, and start the real run fresh. */
  endTutorial() {
    if (!this.tut) return;
    this.tutorialDone = true;
    markTutorialSeen(this.ctx.storage);
    this.restart(leaveTutorial(this.tut, this.level, this.arena, this.rng));
    this.startFromChrome();
  }

  // A restart clears everything the input is gated on - the stick, the keys,
  // the pause, the offer - not only the board.
  private restart(run: Run = this.freshRun()) {
    this.run = run;
    this.tut = null;
    // A run's name, so the save can refuse to pay the same run twice; and its world's floor.
    this.careerToken = this.tokenFor(run);
    this.paintGround();
    this.phase = "ready";
    this.paused = false;
    this.stick = null;
    this.keys.clear();
    this.peak = this.run.len;
    this.newBest = false;
    this.nextMilestone = MILESTONE_EVERY;
    this.bannerUntil = 0;
    this.crushBanner?.destroy();
    this.crushBanner = null;
    for (const s of this.mobs.values()) s.destroy();
    this.mobs.clear();
    for (const c of this.corpses) c.destroy();
    this.corpses.length = 0;
    this.sparks.length = this.loops.length = this.rings.length = this.zaps.length = this.novas.length = 0;
    this.draw();
    this.publish(true);
  }

  // ---- the frame ------------------------------------------------------------

  update(_time: number, delta: number) {
    const dt = Math.min(50, delta);
    if (this.phase === "playing" && !this.paused && !this.run.choosing) {
      if (this.tut) tickTutorial(this.tut, dt, this.steer(), this.rng);
      else step(this.run, dt, this.steer(), this.rng);
      this.peak = Math.max(this.peak, Math.floor(this.run.len));
      this.react();
      if (this.run.choosing) this.publish(true);
      if (this.run.phase === "won" || this.run.phase === "dead") this.finish(this.run.phase === "won");
    }
    if (!this.paused) this.tickFx(dt);
    this.draw();
    this.publish(false);
  }

  /** A thumb beats the keys; with neither, the snake keeps its heading. */
  private steer(): Steer {
    if (this.stick) return stickVector(this.stick);
    let dx = 0;
    let dy = 0;
    for (const k of this.keys) {
      const s = KEYS[k];
      if (s) (dx += s.dx), (dy += s.dy);
    }
    return { dx, dy };
  }

  /** Turn what the step did into sound, shake and sparks. */
  private react() {
    const now = this.time.now;
    for (const e of this.run.events) {
      if (e.k === "crush") {
        // WHICH effect for which crush is decided in `crushFx`, pure and
        // tested; this only plays it.
        const fx = crushFx(e.n, prefersReducedMotion());
        this.loops.push({ poly: e.poly, age: 0, flashMs: fx.flashMs });
        const c = centreOf(e.poly);
        const size = Math.max(...e.poly.map((p) => Math.hypot(p.x - c.x, p.y - c.y)));
        this.rings.push({ c, from: size * 0.9, to: size * fx.ringReach, age: 0, life: fx.ringMs });
        const tail = tailCrushFx(this.run, e.by);
        if (tail) this.rings.push({ c: tail.at, from: tail.from, to: tail.to, age: 0, life: tail.life }), this.spray(tail.at.x, tail.at.y, INK.mint, tail.sparks, 5);
        for (const f of e.caught) this.spray(f.x, f.y, KIND_INK[f.kind], fx.perFoe, 5, 520);
        this.ctx.audio.play(fx.sound, { semitones: Math.min(12, e.n * 2) });
        if (fx.shake) this.cameras.main.shake(fx.shake.ms, fx.shake.amount);
        if (fx.banner !== null) this.banner(this.fx.crush(fx.banner), e.x, e.y - size * 0.55);
        else this.popup(`+${e.n}`, e.x, e.y);
        if (e.bonus) this.popup(this.fx.bonus, e.x, e.y + 6, "#ffd166", 16);
        if (e.n >= 4) {
          const p = this.screenPoint(e.x, e.y);
          juiceBurst(p.x, p.y);
        }
      } else if (e.k === "ko") {
        this.corpse(e.x, e.y, e.kind, e.form);
        this.spray(e.x, e.y, INK.gold, 8);
      } else if (e.k === "zap") {
        this.zaps.push({ a: { x: e.x0, y: e.y0 }, b: { x: e.x1, y: e.y1 }, age: 0 });
        this.spray(e.x1, e.y1, INK.zap, 6);
      } else if (e.k === "nova") {
        this.novas.push({ c: { x: e.x, y: e.y }, age: 0 });
        this.popup(this.fx.nova, e.x, e.y - 30, "#ffd166", 30);
        this.ctx.audio.play("success", { semitones: 12 });
        if (!prefersReducedMotion()) this.cameras.main.shake(320, 0.012);
      } else if (e.k === "mini") {
        // The callout: a MINI-BOSS banner over the arena, a gold flash and the
        // boss sting - the same weight as a warden arriving, in its own colour.
        this.banner(this.fx.mini, this.run.x, this.run.y - 70, 1400);
        this.ctx.audio.play("star", { semitones: 3 });
        this.cameras.main.flash(180, 255, 209, 102);
      } else if (e.k === "bolt") this.spray(e.x, e.y, 0xff7a3d, 6);
      else if (e.k === "vortex") this.spray(e.x, e.y, 0x9b7bff, 10);
      else if (e.k === "hurt") this.spray(e.x, e.y, 0xffffff, 5);
      else if (e.k === "hit") {
        // Drawn AT THE SHAPE that bit, in red, with the segment it cost over the
        // head: a bump with no mark on its cause read as "I bit my own tail"
        // (NePo, round three) - the snake never bites itself.
        this.ctx.audio.play("fail");
        this.cameras.main.shake(160, 0.008);
        haptic.fail();
        this.spray(e.x, e.y, INK.red, 9);
        // What the bump actually cost (`hitCost`: half a heart on normal and wild, from a fifth into stage 2), not always 1.
        this.popup(`-${hitCost(this.run)}`, this.run.x, this.run.y, "#ff7675");
      } else if (e.k === "shield") {
        this.ctx.audio.play("pop", { semitones: -3 });
        this.spray(this.run.x, this.run.y, INK.gem, 10);
      } else if (e.k === "gold") {
        // Career gold, picked up: the coin sound and its worth over the head.
        this.ctx.audio.play("coin", { semitones: 5 });
        this.popup(`+${e.v}`, this.run.x, this.run.y - 14, "#ffd166", 18);
      } else if (e.k === "spit") this.spray(e.x, e.y, INK.gold, 2);
      else if (e.k === "bite") {
        this.ctx.audio.play("pop", { semitones: 7 });
        this.spray(e.x, e.y, INK.gold, 6);
      } else if (e.k === "spike") this.spray(e.x, e.y, INK.gold, 3);
      else if (e.k === "gem" && now - this.lastGemSound > 70) {
        this.lastGemSound = now;
        this.ctx.audio.play("coin");
      } else if (e.k === "level") this.ctx.audio.play("streak");
      else if (e.k === "boss") {
        this.ctx.audio.play("star");
        this.cameras.main.flash(300, 255, 118, 117);
      } else if (e.k === "bosshit") {
        this.cameras.main.shake(260, 0.014);
        haptic.tap();
      } else if (e.k === "stage") {
        // A warden fell and it was not the last one: a gold flash (never the
        // boss-arrival red above), the level-up fanfare, and the chrome's own
        // "Stage N" banner for a couple of seconds - see `publish`.
        this.ctx.audio.play("streak", { semitones: 4 });
        this.cameras.main.flash(320, 255, 209, 102);
        this.bannerUntil = now + 2200;
      }
    }
    while (this.run.crushed >= this.nextMilestone) {
      this.nextMilestone += MILESTONE_EVERY;
      winMoment(this.ctx, { reason: "milestone", level: `score-${this.run.crushed}`, at: this.headPoint(), confetti: false });
    }
  }

  private finish(won: boolean) {
    this.phase = won ? "won" : "over";
    this.stick = null;
    this.keys.clear();
    if (this.run.career) return this.finishCareer(won);
    const score = this.run.crushed;
    this.newBest = score > 0 && score > this.bestBefore;
    this.ctx.audio.play(won ? "win" : "fail");
    if (won) {
      this.ctx.analytics.levelComplete(this.level, this.run.t);
      winMoment(this.ctx, {
        reason: "level_complete",
        tier: TIER[this.level],
        level: this.level,
        ms: this.run.t,
        at: this.headPoint(),
        score: { value: score, unit: "points", board: this.level },
      });
    } else {
      this.ctx.analytics.levelFail(this.level, "tail gone");
      const record = this.ctx.score?.report({ value: score, unit: "points", board: this.level });
      // A best needs a crush: a first run of zero is not a record worth a star.
      if (record?.isPersonalBest && score > 0) {
        winMoment(this.ctx, { reason: "personal_best", level: `score-${score}`, at: this.headPoint() });
      }
    }
    this.publish(true);
  }

  private publish(now: boolean) {
    const t = this.time?.now ?? 0;
    if (!now && t - this.lastPublish < 100) return;
    this.lastPublish = t;
    const r = this.run;
    const boss = r.foes.find((f) => f.kind === "warden");
    this.onStatus?.({
      phase: this.phase,
      paused: this.paused,
      level: this.level,
      len: Math.floor(r.len),
      peak: this.peak,
      crushed: r.crushed,
      // A career level has no warden meter: its goal row counts the crush target instead.
      meter: r.phase === "stage" && !r.career ? { len: Math.floor(r.len), crushed: r.crushed, stage: r.stage } : null,
      lv: r.lv,
      offer: r.choosing ? [...r.choosing] : [],
      taken: { ...r.taken },
      // bossHpOf(level, r.stage): while a warden is up, r.stage is still ITS
      // stage - it only moves on once the warden falls and `boss` goes back to null.
      boss: boss ? { now: boss.hp, max: r.career ? r.career.bossHp : bossHpOf(r.level, r.stage) } : null,
      bite: hitCost(r),
      ms: r.t, stage: r.stage,
      newBest: this.newBest,
      tutorial: this.tut ? this.tut.step : null,
      banner: r.phase === "stage" && t < this.bannerUntil && !r.career ? r.stage : null,
      career: r.career ? { level: r.career.level, world: r.career.world, target: r.career.target, boss: r.career.boss, bossUp: r.career.bossUp, gold: r.career.gold } : null,
    });
  }

  /**
   * A CAREER level ended. The SITE hears a reason, never an amount: a win is
   * `level_complete` at the world's tier and nothing more - no score, so a career
   * level never writes the quick run's boards. The game's own gold, stars and gear
   * are banked by the chrome, once, from what this reports.
   */
  private finishCareer(won: boolean) {
    const c = this.run.career!;
    const label = `career-${c.level}`;
    this.ctx.audio.play(won ? "win" : "fail");
    if (won) {
      this.ctx.analytics.levelComplete(label, this.run.t);
      winMoment(this.ctx, { reason: "level_complete", tier: CAREER_TIER[c.world], level: label, ms: this.run.t, at: this.headPoint() });
    } else this.ctx.analytics.levelFail(label, "tail gone");
    this.onCareerEnd?.(careerResult(this.run), this.careerToken);
    this.publish(true);
  }

  /** A career run's name: its level, the time and a count, unique on this device. A quick run has none. */
  private tokenFor(run: Run): string {
    return run.career ? `${run.career.level}:${Date.now()}:${++this.runCount}` : "";
  }

  /** The next run: the career level being played, or a quick run at the chosen level. */
  private freshRun(): Run {
    return this.careerLevel ? newCareerRun(this.careerLevel, this.careerStats, this.arena, this.rng) : newRun(this.level, this.arena, this.rng);
  }

  /** The floor for this run's world, repainted only when the world changes. */
  private paintGround() {
    const want = this.run.career?.world ?? "quick";
    if (!this.bg || want === this.groundFor) return;
    this.groundFor = want;
    this.bg.clear();
    drawGround(this.bg, this.run.world, want === "quick" ? undefined : WORLD_GROUND[want]);
  }

  // ---- drawing --------------------------------------------------------------

  private draw() {
    const r = this.run;
    const cam = cameraOf(r);
    this.cameras.main.setScroll(cam.x, cam.y);
    const g = this.fg;
    g.clear();
    this.under.clear();
    const now = this.time?.now ?? 0;
    const pulse = now / 180;
    if (r.taken.doubleGems) {
      // GEM MERGE's pull, drawn: a faint dashed line from each gem to the one it is sliding into.
      g.lineStyle(2, INK.gold, 0.6);
      for (const [a, b] of pullPairs(r.gems, r, mergeGuard(r))) for (const [p, q] of dashes(a, b, 3, 3)) g.lineBetween(p.x, p.y, q.x, q.y);
    }
    for (const gem of r.gems) drawGem(g, gem.x, gem.y, pulse + gem.x, gem.v);
    drawCareerLayers({ low: this.low, coins: g, dark: this.dark }, this.run, pulse);
    for (const v of r.vortices) drawVortex(this.under, v, now, v.life, HOLE.ms);
    for (const l of this.loops) drawLoop(g, l.poly, l.age, LOOP_LIFE, l.flashMs);
    for (const ring of this.rings) {
      const k = ring.age / ring.life;
      drawShockRing(g, ring.c, ring.from + (ring.to - ring.from) * Math.sqrt(k), k);
    }
    for (const z of this.zaps) drawZap(g, z.a, z.b, Math.floor(now / 50) + z.a.x, 1 - z.age / ZAP_LIFE);
    for (const n of this.novas) drawNova(g, n.c, 40 + 420 * (n.age / NOVA_LIFE), n.age / NOVA_LIFE);
    this.drawTutorial(g);
    // The warden's wind-up: the warning before its lunge.
    for (const f of r.foes) if (isBoss(f.kind) && f.windup > 0) drawWindup(g, f, r, f.windup, LUNGE.windup);
    // A shooter winding up glows orange under it: the shot is coming.
    for (const f of r.foes) if (f.kind === "shooter" && f.windup > 0) drawInsideMark(this.under, f.x, f.y, KINDS.shooter.r + 2, pulse * 3, 0xff7a3d);
    // A mini-boss wears a gold ring under it and its health over its head.
    for (const f of r.foes) {
      if (f.kind !== "mini") continue;
      drawInsideMark(this.under, f.x, f.y, KINDS.mini.r + 4, pulse, INK.gold);
      drawHpBar(g, f.x, f.y - KINDS.mini.r - 30, 64, f.hp / MINI_HP[f.form ?? 1]);
    }
    // The guide: where the loop is about to close, and - round four - a mint
    // mark under every shape it would catch now, with the count by the head.
    const pending = this.phase === "playing" ? pendingLoop(r) : null;
    const caught = pending ? insideNow(r, pending) : [];
    if (pending && guideShown(caught.length, this.tut !== null)) drawSnapGuide(g, r, r.heading, pending.at, pulse);
    for (const f of caught) drawInsideMark(this.under, f.x, f.y, KINDS[f.kind].r, pulse + f.id);
    this.insideChip.setVisible(caught.length > 0);
    if (caught.length) {
      this.insideChip.setText(this.fx.inside(caught.length));
      // Beside the head, held inside the view so a head at the edge keeps it on screen.
      const x = Math.min(r.x + 18, cam.x + this.arena.w - this.insideChip.width - 6);
      const y = Math.max(r.y - 22, cam.y + this.insideChip.height);
      this.insideChip.setPosition(Math.max(cam.x + 6, x), y);
    }
    drawSnake(g, r, r.blink > 0 && Math.floor(r.blink / 90) % 2 === 0);
    if (r.taken.shield && r.shieldIn === 0) drawShieldRing(g, r, pulse);
    for (const shot of r.shots) drawShot(g, shot);
    for (const b of r.bolts) drawBolt(g, b);
    for (const s of this.sparks) {
      g.fillStyle(s.ink, Math.min(1, s.life / 200));
      g.fillRect(s.x - s.size / 2, s.y - s.size / 2, s.size, s.size);
    }
    this.syncSprites();
    this.drawHud();
  }

  /** What the tutorial's step says to show: the ring round the bat, or the arrow to the gems. */
  private drawTutorial(g: Phaser.GameObjects.Graphics) {
    if (!this.tut) return;
    const ring = guideRing(this.tut);
    if (ring) drawGuideRing(g, ring, this.tut.ms);
    const gem = gemTarget(this.tut);
    if (gem) drawGemArrow(g, this.run, gem, this.tut.ms);
  }

  /**
   * The level line along the bottom edge, and the stick under the thumb. C3
   * (2026-10-01): a thin unlabelled line, edge to edge - the LV number moved to
   * the pause and game-over cards, so play carries no level clutter.
   */
  private drawHud() {
    const h = this.hud;
    const { w, h: vh } = this.arena;
    h.clear();
    h.fillStyle(0x232a5c, 0.9);
    h.fillRect(0, vh - XP_LINE, w, XP_LINE);
    h.fillStyle(INK.gem, 1);
    h.fillRect(0, vh - XP_LINE, Math.max(XP_LINE, (w * this.run.xp) / this.run.need), XP_LINE);
    if (this.stick) {
      const k = knobAt(this.stick);
      h.lineStyle(2, 0xf5f6ff, 0.28);
      h.strokeCircle(this.stick.ox, this.stick.oy, STICK_RADIUS);
      h.fillStyle(0xf5f6ff, 0.22);
      h.fillCircle(k.x, k.y, 18);
    }
  }

  /** One sprite per shape, keyed by id; clip and flash follow the simulation. */
  private syncSprites() {
    const seen = new Set<number>();
    for (const f of this.run.foes) {
      seen.add(f.id);
      let s = this.mobs.get(f.id);
      if (!s) {
        s = this.spriteFor(sheetOf(f), f.x, f.y, DEPTH.foe).setScale(kindScale(f.kind, f.form));
        this.mobs.set(f.id, s);
      }
      s.setPosition(f.x, f.y).setFlipX(this.run.x < f.x);
      this.want(s, sheetOf(f), this.clipOf(f));
      if (f.hurt > 0) s.setTint(0xffffff).setTintMode(Phaser.TintModes.FILL);
      else if ((isBoss(f.kind) || f.kind === "shooter") && f.windup > 0 && Math.floor(f.windup / 90) % 2 === 0) s.setTint(0xffffff).setTintMode(Phaser.TintModes.FILL);
      else if (f.kind === "warden") s.setTint(INK.red).setTintMode(Phaser.TintModes.MULTIPLY);
      else if (f.kind === "mini") s.setTint(INK.gold).setTintMode(Phaser.TintModes.MULTIPLY);
      else if (f.slow > 0) s.setTint(INK.ice).setTintMode(Phaser.TintModes.MULTIPLY);
      else s.clearTint();
    }
    for (const [id, s] of this.mobs) {
      if (seen.has(id)) continue;
      s.destroy();
      this.mobs.delete(id);
    }
  }

  private clipOf(f: Foe): Clip {
    if (f.hurt > 0) return "hurt";
    if (f.dash > 0) return "attack";
    if (f.stun > 0 || this.phase !== "playing") return "idle";
    return "walk";
  }

  /** Play a clip unless it is already running - or a loop never leaves frame 0. */
  private want(s: Phaser.GameObjects.Sprite, key: CastKey, clip: Clip) {
    const k = animKey(key, clip);
    if (s.anims.currentAnim?.key !== k) s.play(k);
  }

  private spriteFor(key: CastKey, x: number, y: number, depth: number) {
    const o = originFor(CAST[key].manifest);
    return this.add.sprite(x, y, key).setOrigin(o.x, o.y).setDepth(depth);
  }

  /** A crushed shape plays `ko` once where it fell, then goes. */
  private corpse(x: number, y: number, kind: Foe["kind"], form?: Stage) {
    while (this.corpses.length >= MAX_CORPSES) this.corpses.shift()?.destroy();
    const key = sheetOf({ kind, form });
    const s = this.spriteFor(key, x, y, DEPTH.corpse).setScale(kindScale(kind, form));
    s.play(animKey(key, "ko"));
    s.once("animationcomplete", () => {
      const i = this.corpses.indexOf(s);
      if (i >= 0) this.corpses.splice(i, 1);
      s.destroy();
    });
    this.corpses.push(s);
  }

  private spray(x: number, y: number, ink: number, n: number, size = 3, life = 360) {
    for (let i = 0; i < n; i++) {
      const a = this.rng() * Math.PI * 2;
      const v = 40 + this.rng() * (size > 3 ? 180 : 120);
      this.sparks.push({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, life, ink, size });
    }
  }

  private popup(text: string, x: number, y: number, color = "#ffd166", size = 24) {
    const t = this.add
      .text(x, y - 20, text, { fontFamily: "Fredoka, Heebo, sans-serif", fontSize: `${size}px`, color, fontStyle: "bold", stroke: "#0b0e22", strokeThickness: 5 })
      .setOrigin(0.5)
      .setDepth(DEPTH.pop);
    this.tweens.add({ targets: t, y: y - 56, alpha: 0, duration: 800, ease: "Cubic.easeOut", onComplete: () => t.destroy() });
  }

  /** The big "CRUSH xN!": pops in large over the loop, holds, and floats away. */
  private banner(text: string, x: number, y: number, holdMs = 650) {
    if (this.crushBanner) {
      this.tweens.killTweensOf(this.crushBanner);
      this.crushBanner.destroy();
    }
    const t = this.add
      .text(x, y, text, { fontFamily: "Fredoka, Heebo, sans-serif", fontSize: "40px", color: "#ffd166", fontStyle: "bold", stroke: "#3b2a05", strokeThickness: 7 })
      .setOrigin(0.5)
      .setDepth(DEPTH.pop)
      .setScale(prefersReducedMotion() ? 1 : 0.4);
    this.tweens.add({ targets: t, scale: 1, duration: 160, ease: "Back.easeOut" });
    this.tweens.add({
      targets: t, y: y - 36, alpha: 0, delay: holdMs, duration: 450, ease: "Cubic.easeIn",
      onComplete: () => {
        if (this.crushBanner === t) this.crushBanner = null;
        t.destroy();
      },
    });
    this.crushBanner = t;
  }

  private tickFx(dt: number) {
    const sec = dt / 1000;
    for (const s of this.sparks) (s.x += s.vx * sec), (s.y += s.vy * sec), (s.life -= dt);
    this.sparks = this.sparks.filter((s) => s.life > 0);
    for (const l of this.loops) l.age += dt;
    this.loops = this.loops.filter((l) => l.age < LOOP_LIFE);
    for (const r of this.rings) r.age += dt;
    this.rings = this.rings.filter((r) => r.age < r.life);
    for (const z of this.zaps) z.age += dt;
    this.zaps = this.zaps.filter((z) => z.age < ZAP_LIFE);
    for (const n of this.novas) n.age += dt;
    this.novas = this.novas.filter((n) => n.age < NOVA_LIFE);
  }

  // ---- screen points for the DOM effects ------------------------------------

  private screenPoint(x: number, y: number): { x: number; y: number } {
    const c = this.game.canvas?.getBoundingClientRect();
    if (!c) return { x: 0, y: 0 };
    const cam = cameraOf(this.run);
    return { x: c.left + ((x - cam.x) / this.arena.w) * c.width, y: c.top + ((y - cam.y) / this.arena.h) * c.height };
  }

  private headPoint() {
    return this.screenPoint(this.run.x, this.run.y);
  }
}
