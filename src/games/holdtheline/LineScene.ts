// Hold the Line, drawn. This file OWNS NO RULES and NO ARITHMETIC ABOUT SIZE:
// it hands `step` a frame's milliseconds, reads the run back, and moves sprites
// to match. Every number it draws with comes from `logic.ts` or `sprites.ts`.
//
// That split is not tidiness. NOTHING IN THIS REPO CAN DRIVE A PHASER SCENE, so
// a number computed in here is a number no test can ever fail over - which is
// exactly how survivors shipped its enemies at twenty-five times their area
// behind 173 green tests. See
// `.claude/rules/a-setter-that-replaces-erases-what-the-thing-was-born-with.md`.

// Phaser is imported STATICALLY here and this whole file is imported
// DYNAMICALLY by `LineGame.tsx`, which is what keeps the engine off a first
// visit while still letting the scene be an ordinary `Phaser.Scene`. Survivors
// does the same, and the alternative - hand-rolled structural types for the
// bits of Phaser this file touches - cost the scene its KEY, so `scene.start`
// never handed it any data and `init` read `arena.w` off undefined.
import Phaser from "phaser";
import type { GameContext } from "@sdk/index";
import { animKey, createStudioAnims, originFor, type PhaserAnimsLike } from "@shared/sprites/load-atlas";
import {
  GUN_X,
  KIND,
  airY,
  fire,
  groundY,
  gunY,
  isOver,
  reload,
  step,
  wallX,
} from "./logic";
import { CAST, CAST_KEYS, CLIPS, PLAYED_BY, drawScale, narrowBoost, type CastKey } from "./sprites";
import type { Arena, RunState, Walker } from "./types";

/** What the chrome needs from a frame. Plain data, so React can hold it. */
export interface LineStatus {
  phase: RunState["phase"];
  wave: number;
  wonAt: number;
  wall: number;
  wallMax: number;
  house: number;
  houseMax: number;
  cash: number;
  score: number;
  ammo: number;
  magazine: number;
  reloading: boolean;
  /** Still to arrive plus still standing, so the HUD can count a wave down. */
  left: number;
}

interface Booted {
  ctx: GameContext;
  arena: Arena;
  run: RunState;
  onStatus: (s: LineStatus) => void;
  onReady: (scene: LineScene) => void;
}

export class LineScene extends Phaser.Scene {
  private ctx!: GameContext;
  private arena!: Arena;
  private run!: RunState;
  private onStatus!: (s: LineStatus) => void;
  private onReady!: (scene: LineScene) => void;

  /** One pooled sprite per walker id, and the defender's own. */
  private pool = new Map<number, { s: Phaser.GameObjects.Sprite; key: CastKey; kind: string }>();
  private defender: Phaser.GameObjects.Sprite | null = null;
  /**
   * Every shot, the aim mark and the hit flashes, redrawn each frame on one
   * layer. It replaced a 6x2 pale-yellow rectangle per round, which on a
   * 360px phone was drawn about 3x1 CSS pixels, pale on a pale sky, and did
   * not point anywhere. Reported 2026-09-27: "shots are not clear where they
   * land or hit".
   */
  private fx: Phaser.GameObjects.Graphics | null = null;
  /** Recent hits, drawn as a flash that shrinks away. `age` is in ms. */
  private flashes: { x: number; y: number; age: number; kill: boolean }[] = [];
  private paused = false;
  private aim = { x: 0, y: 0 };
  private held = false;

  constructor() {
    // THE KEY, and it is load-bearing: `LineGame` calls
    // `g.scene.start("holdtheline", { ... })`, and a scene registered under any
    // other name never receives that data at all.
    super("holdtheline");
  }

  init(data: Booted): void {
    this.ctx = data.ctx;
    this.arena = data.arena;
    this.run = data.run;
    this.onStatus = data.onStatus;
    this.onReady = data.onReady;
    this.aim = { x: this.arena.w * 0.6, y: groundY(this.arena) - 40 };
  }

  preload(): void {
    // `loadStudioAtlas` in the copied adapter is unusable here: Phaser wants two
    // URLs and Vite content-hashes each asset, so the sheet and its atlas have
    // unrelated names at build time and cannot be derived from one base path.
    for (const key of CAST_KEYS) {
      this.load.atlas(key, CAST[key].png, CAST[key].atlas);
    }
  }

  create(): void {
    for (const key of CAST_KEYS) {
      // `this`, NOT `this.anims`: the helper wants the SCENE - it reaches for
      // `anims.generateFrameNames` itself. Passing the manager threw
      // `e.anims.generateFrameNames is not a function` in the browser, which
      // no test here could see, because nothing in this repo drives a scene.
      createStudioAnims(this as unknown as PhaserAnimsLike, key, CAST[key].manifest);
    }
    this.drawGround();
    this.spawnDefender();
    this.fx = this.add.graphics().setDepth(8);

    this.input.on("pointerdown", (p: Phaser.Input.Pointer) => {
      this.held = true;
      this.aim = { x: p.x, y: p.y };
      this.shoot();
    });
    this.input.on("pointermove", (p: Phaser.Input.Pointer) => {
      this.aim = { x: p.x, y: p.y };
    });
    this.input.on("pointerup", () => {
      this.held = false;
    });
    this.input.keyboard?.on("keydown", (e: KeyboardEvent) => {
      if (e.code === "KeyR") reload(this.run);
      if (e.code === "Space") this.shoot();
    });

    this.onReady(this);
    this.push();
  }

  /**
   * The lane: sky, hills, the ground and the keep the run defends.
   *
   * Drawn from the SAME shapes the studio's `hold-line` reference scene uses,
   * so the picture a style card shows and the picture a player gets are the
   * same composition rather than two guesses at it. Flat bands and rectangles
   * only - no gradient - because the reference has to survive being quantised
   * by every style in the registry, and a gradient is the one thing `onebit`
   * cannot read.
   *
   * Everything here is background: `setDepth` below -10, so no walker, shot or
   * effect can ever be hidden behind the scenery.
   */
  private drawGround(): void {
    const { w, h } = this.arena;
    const g = groundY(this.arena);
    const band = (y: number, height: number, colour: number, depth: number) => {
      const r = this.add.rectangle(0, y, w, height, colour);
      r.setOrigin(0, 0);
      r.setDepth(depth);
      return r;
    };

    // Sky in two flat bands rather than a gradient.
    band(0, g, 0xa8d8f0, -60);
    band(g * 0.42, g * 0.3, 0xc7e6f6, -59);
    const sun = this.add.circle(w * 0.84, h * 0.12, Math.round(h * 0.05), 0xfff6cc);
    sun.setDepth(-58);

    // Two hill ranges, the far one paler, so the lane has depth to recede into.
    const hill = (top: number, colour: number, depth: number) => {
      const r = this.add.rectangle(0, top, w, g - top, colour);
      r.setOrigin(0, 0);
      r.setDepth(depth);
    };
    hill(g - h * 0.26, 0x8fa9b8, -57);
    hill(g - h * 0.17, 0x6f8a96, -56);

    // Grass, then the ROAD: a real surface the cast stands on rather than a lip.
    band(g - h * 0.08, h * 0.08, 0x7fae57, -40);
    band(g - 4, 4, 0x9ed073, -39);
    band(g, h - g, 0xc3a469, -38);
    // Ruts down the lane, so the eye is led to the gate.
    band(g + (h - g) * 0.3, 2, 0xab8d55, -37);
    band(g + (h - g) * 0.62, 2, 0xb59760, -37);

    this.drawKeep(g);
  }

  /** The keep: a crenellated wall with a gate and a banner, not a grey slab. */
  private drawKeep(g: number): void {
    const { h } = this.arena;
    const x = wallX();
    const top = gunY(this.arena) + 18;
    const put = (px: number, py: number, pw: number, ph: number, c: number, d = -20) => {
      const r = this.add.rectangle(px, py, pw, ph, c);
      r.setOrigin(0, 0);
      r.setDepth(d);
      return r;
    };
    // the body, and the darker base it stands on
    put(0, top, x, h - top, 0x7c8391);
    put(0, g - (h - g) * 0.5, x, h - g + (h - g) * 0.5, 0x5e6472, -19);
    // stone courses
    for (let y = top + 14; y < g; y += 16) put(0, y, x, 2, 0x6d737f, -18);
    // merlons along the top
    for (let mx = 0; mx < x; mx += 22) put(mx, top - 14, 14, 14, 0x8d94a2, -18);
    // the gate the whole lane is walking at
    put(x * 0.34, g - 54, 26, 54, 0x3a3f4a, -17);
    // a banner, because a keep with nobody's colours on it reads as scenery
    put(x * 0.2, top + 16, 16, 30, 0xb4541e, -17);
  }

  private spawnDefender(): void {
    const key = PLAYED_BY.defender;
    const s = this.add.sprite(GUN_X, gunY(this.arena), key);
    const o = originFor(CAST[key].manifest);
    s.setOrigin(o.x, o.y);
    // COMPOSED with what the part was born at, never an absolute literal.
    s.setScale(drawScale("defender"));
    s.setDepth(10);
    s.anims.play(animKey(key, "idle"), true);
    this.defender = s;
  }

  /** Pull the trigger, through the sim. The scene decides nothing about it. */
  private shoot(): void {
    if (this.paused) return;
    const before = this.run.ammo;
    fire(this.run, this.aim.x, this.aim.y);
    if (this.run.ammo !== before) {
      this.ctx.audio.play("tap");
      this.defender?.anims.play(animKey(PLAYED_BY.defender, "attack"), false);
    }
  }

  setPaused(p: boolean): void {
    this.paused = p;
  }

  /** The chrome calls this to send the next wave; the sim owns what is in it. */
  restartFrom(run: RunState): void {
    for (const { s } of this.pool.values()) s.destroy();
    this.pool.clear();
    this.run = run;
    this.push();
  }

  update(_t: number, dtMs: number): void {
    if (this.paused) return;
    if (this.held) this.shoot();
    step(this.run, dtMs);
    this.draw(dtMs);
    this.push();
  }

  private spriteFor(w: Walker): { s: Phaser.GameObjects.Sprite; key: CastKey; kind: string } {
    const found = this.pool.get(w.id);
    if (found) return found;
    const key = PLAYED_BY[w.kind];
    const s = this.add.sprite(w.x, w.y, key);
    const o = originFor(CAST[key].manifest);
    s.setOrigin(o.x, o.y);
    s.setScale(drawScale(w.kind));
    s.setDepth(KIND[w.kind].air === true ? 6 : 5);
    // They come from the right, so they face left. The sheets are authored
    // facing right, so every walker is flipped and the defender is not.
    s.setFlipX(true);
    const made = { s, key, kind: w.kind as string };
    this.pool.set(w.id, made);
    return made;
  }

  /**
   * How much bigger the fight is drawn on a lane shown small (`narrowBoost`).
   * Read off the canvas's SHOWN size every frame, so turning a phone sideways
   * mid-wave settles the cast back to full size on the next frame.
   */
  private boost(): number {
    return narrowBoost(1 / this.scale.displayScale.x);
  }

  private draw(dtMs = 0): void {
    const live = new Set<number>();
    const k = this.boost();
    for (const w of this.run.walkers) {
      live.add(w.id);
      const { s, key } = this.spriteFor(w);
      s.setPosition(w.x, w.y);
      // COMPOSED with the birth scale's own derivation, never a literal - the
      // survivors trap (a-setter-that-replaces-erases-what-the-thing-was-born-with.md).
      // The hitbox is not touched; only the picture grows.
      s.setScale(drawScale(w.kind) * k);
      const clip = w.ko > 0 ? "ko" : w.cool > w.cycle * 0.8 ? "attack" : "walk";
      s.anims.play(animKey(key, clip), true);
    }
    for (const [id, { s }] of this.pool) {
      if (!live.has(id)) {
        s.destroy();
        this.pool.delete(id);
      }
    }

    this.drawShots(dtMs);

    if (this.defender) {
      const d = this.defender;
      d.setVisible(!isOver(this.run));
      // The defender leans at whatever it is aiming at, which is the one cue a
      // player has that the gun is pointed where they think it is.
      d.setFlipX(this.aim.x < GUN_X);
    }
  }

  /**
   * Where the gun is pointed, where every round is, and where one struck.
   *
   * Three cues, each drawn at a size set in SCREEN pixels rather than arena
   * units - `px` converts - because the arena is drawn at about half size on
   * a portrait phone and a mark sized in units shrinks with it:
   *
   * - an AIM RING where the next round will pass, and a faint dotted line to
   *   it from the gun, only while a wave is running;
   * - each round as a TRACER along its own path, a bright core on a dark edge
   *   so it reads on the pale sky and on the road alike; the enemy's are red;
   * - a FLASH where a round struck a walker, bigger for the one that dropped
   *   it, read off the run's own `hit` and `kill` events so it cannot claim a
   *   hit the simulation did not make.
   */
  private drawShots(dtMs: number): void {
    const g = this.fx;
    if (!g) return;
    g.clear();
    // Screen pixels, times the narrow-lane boost: the ring and the tracers grow
    // with the cast on a phone, so the cue stays in proportion to its target.
    const k = this.boost();
    const px = (n: number) => n * Math.max(1, this.scale.displayScale.x) * k;

    for (const e of this.run.events) {
      if (e.t === "hit" || e.t === "kill") this.flashes.push({ x: e.x, y: e.y, age: 0, kill: e.t === "kill" });
    }

    if (this.run.phase === "wave" && !isOver(this.run)) {
      const gx = GUN_X;
      const gy = gunY(this.arena);
      const dx = this.aim.x - gx;
      const dy = this.aim.y - gy;
      const len = Math.hypot(dx, dy);
      if (len > px(20)) {
        g.fillStyle(0xffffff, 0.55);
        for (let d = px(18); d < len - px(12); d += px(10)) {
          g.fillCircle(gx + (dx / len) * d, gy + (dy / len) * d, px(1.2));
        }
      }
      g.lineStyle(px(4), 0x3a2410, 0.55);
      g.strokeCircle(this.aim.x, this.aim.y, px(11));
      g.lineStyle(px(2), 0xffffff, 0.95);
      g.strokeCircle(this.aim.x, this.aim.y, px(11));
      g.fillStyle(0xffffff, 0.95);
      g.fillCircle(this.aim.x, this.aim.y, px(2));
    }

    for (const b of this.run.shots) {
      const v = Math.hypot(b.vx, b.vy) || 1;
      const tail = px(16);
      const tx = b.x - (b.vx / v) * tail;
      const ty = b.y - (b.vy / v) * tail;
      g.lineStyle(px(5), 0x3a2410, 0.8);
      g.lineBetween(tx, ty, b.x, b.y);
      g.lineStyle(px(3), b.hostile ? 0xff4b3a : 0xffd23f, 1);
      g.lineBetween(tx, ty, b.x, b.y);
    }

    const LIFE = 220;
    this.flashes = this.flashes.filter((f) => (f.age += dtMs) < LIFE);
    for (const f of this.flashes) {
      const k = 1 - f.age / LIFE;
      const r = px(f.kill ? 16 : 10) * (0.6 + 0.4 * k);
      g.fillStyle(0xffffff, 0.9 * k);
      g.fillCircle(f.x, f.y, r * 0.55);
      g.lineStyle(px(3), 0xffd23f, k);
      g.strokeCircle(f.x, f.y, r);
    }
  }

  private push(): void {
    const r = this.run;
    this.onStatus({
      phase: r.phase,
      wave: r.wave,
      wonAt: r.wonAt,
      wall: r.wall,
      wallMax: r.wallMax,
      house: r.house,
      houseMax: r.houseMax,
      cash: r.cash,
      score: r.score,
      ammo: r.ammo,
      magazine: r.ammo,
      reloading: r.reloading,
      left: r.queue.length + r.walkers.filter((w) => w.ko === 0).length,
    });
  }

  /** Where an air unit flies, for anything outside that needs to know. */
  airLane(): number {
    return airY(this.arena);
  }

  /** The clip ids this scene plays, so a reader can see all five are wired. */
  static readonly CLIPS = CLIPS;
}
