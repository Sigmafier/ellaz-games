import Phaser from "phaser";
import type { GameContext } from "@sdk/index";
import { winMoment } from "@shared/index";
import { mulberry32 } from "@shared/rng";
import { animKey, createStudioAnims, originFor, type PhaserAnimsLike } from "@shared/sprites/load-atlas";
// Two real effects: a buzz in the hand when the head is hit, and a confetti puff
// over the page for a crush of four or more.
import { burst as juiceBurst, haptic } from "@juice/index";
import { CAST, type CastKey, type Clip } from "../survivors/sprites";
import { knobAt, originFor as stickOriginFor, stickVector, STICK_RADIUS, type Stick } from "../survivors/stick";
import { WALL, cameraOf } from "../survivors/world";
import { FOR_KIND, SHEETS, kindScale } from "./cast";
import { KINDS, LEVELS } from "./crowd";
import { INK, drawGem, drawLoop, drawSnake } from "./draw";
import { ARENA, newRun, pickCard, step } from "./logic";
import type { Arena, CardId, Foe, LevelKey, Pt, Run, Steer } from "./types";

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
  /** ms left before the warden, 0 once it is here. */
  left: number;
  lv: number;
  offer: CardId[];
  taken: Record<CardId, number>;
  boss: { now: number; max: number } | null;
  newBest: boolean;
}

/** Coins, no star, every this many crushed - an endless-feeling mid-run ping. */
const MILESTONE_EVERY = 25;
const TIER: Record<LevelKey, "easy" | "medium" | "hard"> = { calm: "easy", normal: "medium", wild: "hard" };
const DEPTH = { bg: 0, fx: 5, corpse: 8, foe: 10, snake: 20, pop: 40, hud: 50 } as const;
const LOOP_LIFE = 520;
const MAX_CORPSES = 14;
const KEYS: Record<string, Steer> = {
  arrowleft: { dx: -1, dy: 0 }, a: { dx: -1, dy: 0 },
  arrowright: { dx: 1, dy: 0 }, d: { dx: 1, dy: 0 },
  arrowup: { dx: 0, dy: -1 }, w: { dx: 0, dy: -1 },
  arrowdown: { dx: 0, dy: 1 }, s: { dx: 0, dy: 1 },
};

type Spark = { x: number; y: number; vx: number; vy: number; life: number; ink: number };

export class SnakeSurvivorsScene extends Phaser.Scene {
  private ctx!: GameContext;
  private arena: Arena = ARENA;
  private onStatus?: (s: SnakeSurvivorsStatus) => void;
  private onReady?: (scene: SnakeSurvivorsScene) => void;
  private rng: () => number = Math.random;
  private run!: Run;
  private level: LevelKey = "normal";
  private phase: UiPhase = "ready";
  private paused = false;
  private stick: Stick | null = null;
  private keys = new Set<string>();
  private bg!: Phaser.GameObjects.Graphics;
  private fg!: Phaser.GameObjects.Graphics;
  private hud!: Phaser.GameObjects.Graphics;
  private lvText!: Phaser.GameObjects.Text;
  private mobs = new Map<number, Phaser.GameObjects.Sprite>();
  private corpses: Phaser.GameObjects.Sprite[] = [];
  private sparks: Spark[] = [];
  private loops: { poly: Pt[]; age: number }[] = [];
  private peak = 0;
  private bestBefore = 0;
  private newBest = false;
  private nextMilestone = MILESTONE_EVERY;
  private lastPublish = 0;
  private lastGemSound = 0;

  constructor() {
    super("snakesurvivors");
  }

  init(data: { ctx: GameContext; arena?: Arena; onStatus?: (s: SnakeSurvivorsStatus) => void; onReady?: (s: SnakeSurvivorsScene) => void }) {
    this.ctx = data.ctx;
    this.arena = data.arena ?? ARENA;
    this.onStatus = data.onStatus;
    this.onReady = data.onReady;
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
    this.drawGround();
    this.fg = this.add.graphics().setDepth(DEPTH.snake);
    this.hud = this.add.graphics().setDepth(DEPTH.hud).setScrollFactor(0);
    this.lvText = this.add
      .text(12, this.arena.h - 14, "", { fontFamily: "Fredoka, Heebo, sans-serif", fontSize: "12px", color: "#cfd3f5", fontStyle: "bold" })
      .setOrigin(0, 1)
      .setScrollFactor(0)
      .setDepth(DEPTH.hud);

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
    if (this.phase !== "ready") this.restart();
    this.phase = "playing";
    this.bestBefore = this.ctx.score?.best(this.level) ?? 0;
    this.ctx.analytics.levelStart(this.level);
    this.publish(true);
  }

  choose(id: CardId) {
    if (!this.run.choosing) return;
    pickCard(this.run, id);
    this.ctx.audio.play("pop");
    this.publish(true);
  }

  // A restart clears everything the input is gated on - the stick, the keys,
  // the pause, the offer - not only the board.
  private restart() {
    this.run = newRun(this.level, this.arena, this.rng);
    this.phase = "ready";
    this.paused = false;
    this.stick = null;
    this.keys.clear();
    this.peak = this.run.len;
    this.newBest = false;
    this.nextMilestone = MILESTONE_EVERY;
    for (const s of this.mobs.values()) s.destroy();
    this.mobs.clear();
    for (const c of this.corpses) c.destroy();
    this.corpses.length = 0;
    this.sparks.length = 0;
    this.loops.length = 0;
    this.draw();
    this.publish(true);
  }

  // ---- the frame ------------------------------------------------------------

  update(_time: number, delta: number) {
    const dt = Math.min(50, delta);
    if (this.phase === "playing" && !this.paused && !this.run.choosing) {
      step(this.run, dt, this.steer(), this.rng);
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
        this.loops.push({ poly: e.poly, age: 0 });
        this.popup(`+${e.n}`, e.x, e.y);
        this.ctx.audio.play(e.n >= 3 ? "success" : "pop", { semitones: Math.min(12, e.n * 2) });
        this.cameras.main.shake(120 + 30 * Math.min(e.n, 6), 0.004 + 0.002 * Math.min(e.n, 6));
        if (e.n >= 4) {
          const p = this.screenPoint(e.x, e.y);
          juiceBurst(p.x, p.y);
        }
      } else if (e.k === "ko") {
        this.corpse(e.x, e.y, e.kind);
        this.spray(e.x, e.y, INK.gold, 8);
      } else if (e.k === "hurt") this.spray(e.x, e.y, 0xffffff, 5);
      else if (e.k === "hit") {
        this.ctx.audio.play("fail");
        this.cameras.main.shake(160, 0.008);
        haptic.fail();
      } else if (e.k === "bite") {
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
      left: Math.max(0, LEVELS[this.level].stageMs - r.t),
      lv: r.lv,
      offer: r.choosing ? [...r.choosing] : [],
      taken: { ...r.taken },
      boss: boss ? { now: boss.hp, max: KINDS.warden.hp } : null,
      newBest: this.newBest,
    });
  }

  // ---- drawing --------------------------------------------------------------

  private draw() {
    const r = this.run;
    const cam = cameraOf(r);
    this.cameras.main.setScroll(cam.x, cam.y);
    const g = this.fg;
    g.clear();
    const pulse = (this.time?.now ?? 0) / 180;
    for (const gem of r.gems) drawGem(g, gem.x, gem.y, pulse + gem.x);
    for (const l of this.loops) drawLoop(g, l.poly, l.age, LOOP_LIFE);
    drawSnake(g, r, r.blink > 0 && Math.floor(r.blink / 90) % 2 === 0);
    for (const s of this.sparks) {
      g.fillStyle(s.ink, Math.min(1, s.life / 200));
      g.fillRect(s.x - 1.5, s.y - 1.5, 3, 3);
    }
    this.syncSprites();
    this.drawHud();
  }

  /** The level bar along the bottom edge, and the stick under the thumb. */
  private drawHud() {
    const h = this.hud;
    const { w, h: vh } = this.arena;
    h.clear();
    const x = 12;
    const bw = w - 24;
    h.fillStyle(0x232a5c, 0.9);
    h.fillRoundedRect(x, vh - 10, bw, 5, 2.5);
    h.fillStyle(INK.gem, 1);
    h.fillRoundedRect(x, vh - 10, Math.max(5, (bw * this.run.xp) / this.run.need), 5, 2.5);
    this.lvText.setText(`LV ${this.run.lv}`);
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
        s = this.spriteFor(FOR_KIND[f.kind], f.x, f.y, DEPTH.foe).setScale(kindScale(f.kind));
        this.mobs.set(f.id, s);
      }
      s.setPosition(f.x, f.y).setFlipX(this.run.x < f.x);
      this.want(s, FOR_KIND[f.kind], this.clipOf(f));
      if (f.hurt > 0) s.setTint(0xffffff).setTintMode(Phaser.TintModes.FILL);
      else if (f.kind === "warden") s.setTint(INK.red).setTintMode(Phaser.TintModes.MULTIPLY);
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
  private corpse(x: number, y: number, kind: Foe["kind"]) {
    while (this.corpses.length >= MAX_CORPSES) this.corpses.shift()?.destroy();
    const key = FOR_KIND[kind];
    const s = this.spriteFor(key, x, y, DEPTH.corpse).setScale(kindScale(kind));
    s.play(animKey(key, "ko"));
    s.once("animationcomplete", () => {
      const i = this.corpses.indexOf(s);
      if (i >= 0) this.corpses.splice(i, 1);
      s.destroy();
    });
    this.corpses.push(s);
  }

  private spray(x: number, y: number, ink: number, n: number) {
    for (let i = 0; i < n; i++) {
      const a = this.rng() * Math.PI * 2;
      const v = 40 + this.rng() * 120;
      this.sparks.push({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, life: 360, ink });
    }
  }

  private popup(text: string, x: number, y: number) {
    const t = this.add
      .text(x, y - 20, text, { fontFamily: "Fredoka, Heebo, sans-serif", fontSize: "24px", color: "#ffd166", fontStyle: "bold", stroke: "#0b0e22", strokeThickness: 5 })
      .setOrigin(0.5)
      .setDepth(DEPTH.pop);
    this.tweens.add({ targets: t, y: y - 56, alpha: 0, duration: 800, ease: "Cubic.easeOut", onComplete: () => t.destroy() });
  }

  private tickFx(dt: number) {
    const sec = dt / 1000;
    for (const s of this.sparks) (s.x += s.vx * sec), (s.y += s.vy * sec), (s.life -= dt);
    this.sparks = this.sparks.filter((s) => s.life > 0);
    for (const l of this.loops) l.age += dt;
    this.loops = this.loops.filter((l) => l.age < LOOP_LIFE);
  }

  /** The floor: a faint grid, scattered dots, and striped walls at the world's edge. */
  private drawGround() {
    const g = this.bg;
    const { w, h } = this.run.world;
    g.fillStyle(INK.ground, 1).fillRect(0, 0, w, h);
    g.lineStyle(1, INK.grid, 1);
    for (let x = 40; x < w; x += 40) g.lineBetween(x, 0, x, h);
    for (let y = 40; y < h; y += 40) g.lineBetween(0, y, w, y);
    const rnd = mulberry32(20260927);
    g.fillStyle(0x2a3170, 1);
    for (let i = 0; i < (w * h) / 6000; i++) g.fillCircle(rnd() * w, rnd() * h, 1.3);
    g.fillStyle(INK.wall, 0.55);
    g.fillRect(0, 0, w, WALL).fillRect(0, h - WALL, w, WALL).fillRect(0, 0, WALL, h).fillRect(w - WALL, 0, WALL, h);
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
