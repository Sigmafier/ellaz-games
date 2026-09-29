import Phaser from "phaser";
import type { GameContext } from "@sdk/index";
import { winMoment } from "@shared/index";
// The MODULE, not the `@shared` barrel: the barrel is reachable from the shell,
// which is why `rng.ts` is pinned shell-side. Sprite code must never be dragged
// in behind a re-export - see the header of `@shared/sprites/manifest`.
import { animKey, createStudioAnims, originFor, type PhaserAnimsLike } from "@shared/sprites/load-atlas";
// Two REAL effects, not an import to satisfy a grep. `haptic.fail()` is physical
// and says something the camera shake cannot; `burst` is a DOM confetti puff and
// is deliberately reserved for LEVEL-UP, which happens a handful of times a run.
// Calling it per kill would mean ~14 DOM nodes several times a second on a
// phone, which is why the cheap in-canvas sparks below still do every pop.
import { burst as juiceBurst, haptic } from "@juice/index";
import { CAST, CAST_KEYS, FOR_ENEMY, PLAYER, enemyScale, scaleFor, type CastKey, type Clip } from "./sprites";
// ALIASED, and not for tidiness: `@shared/sprites/load-atlas` already exports an
// `originFor` and this file imports it for the sprite PIVOT. Two functions of
// that name in one module is a duplicate identifier, and the two mean entirely
// different things - one is where a character's feet are, the other is where a
// joystick is born.
import {
  STICK_RADIUS, knobAt, originFor as stickOriginFor, stickVector,
  type Stick,
} from "./stick";
import {
  ARENA, GUNS, RULES, TIER, WEAPONS, bossBar, bossOf, newRun, rngFor, runMs, step,
  type Arena, type EnemyKind, type LevelKey, type RunState, type ShotKind, type UpgradeId, type WeaponId, ELITE, radiusOf,
} from "./logic";
import { WALL, cameraOf } from "./world";
import { bladePositions, bladeReach, bladesEvolved, dronePosition, holds } from "./arsenal";
import { NOVA_FIRE } from "./evolve";
import { chargeOf, dashReady, triggerFreeze } from "./powers";
import { applyCard, offerCards, type Card } from "./cards";

// Phaser draws the arena and reads the input. Every rule is in `logic.ts`, so this
// class owns exactly three things: pixels, pointers, and telling the React chrome
// what just happened. It is the single source of truth for every number on screen -
// it publishes on each frame, and the chrome only ever asks it to do things.
//
// THE CAST ARRIVED 2026-09-12. Until then every shape in here was a Graphics
// primitive - a cyan circle, a pink triangle, a purple diamond. They are studio
// sprites now, five clips each, through the copied Phaser adapter. What did NOT
// change is that `logic.ts` still knows nothing about any of it: it reports
// positions, a `flash` countdown and events, and this file decides what those
// look like. A sprite is a drawing decision, so it lives on this side of the line.

export type Phase = "ready" | "playing" | "won" | "over";

export type SurvivorsStatus = {
  score: number;
  /** Milliseconds left of the three minutes. */
  timeLeft: number;
  hp: number;
  maxHp: number;
  power: number;
  /**
   * The weapons this run carries, in slot order. The HUD draws four slots from
   * this - the run's own list, so the HUD cannot show a weapon the run does not
   * fire.
   */
  slots: WeaponId[];
  /** The dash: 1 when ready, rising from 0 while it recharges. */
  dash: number;
  /** The freeze: how full its ring is, 0..1. The button can be pressed at 1. */
  charge: number;
  /** True while everything is frozen. */
  frozen: boolean;
  xp: number;
  need: number;
  level: LevelKey;
  phase: Phase;
  /**
   * Published rather than mirrored in React, for the same reason snake publishes
   * its own: the scene is what stops moving, so the scene is the one that knows.
   */
  paused: boolean;
  /** The cards on offer - upgrades, and a new weapon while a slot is free - or empty. */
  offer: Card[];
  /**
   * The current stage's boss once it is on the board, and null while its swarm
   * phase is still running. The chrome swaps its countdown cell for this: at a
   * stage boundary the clock is pinned and has nothing left to say, while this
   * is the one number that decides how the stage ends.
   *
   * `kind` rides along because the three bosses have three different healths
   * AND three different inks, so a reader with only `hp` cannot draw the bar.
   */
  boss: { hp: number; maxHp: number; kind: EnemyKind } | null;
  /** Which stage the run is on, 1 to 3, for the banner and the countdown label. */
  stage: number;
  /**
   * How many of each upgrade this run has taken, for the pips on the cards. A
   * COPY rather than the run's own object: handing React the live record would
   * mean a state object that mutates underneath it between renders.
   */
  taken: Record<UpgradeId, number>;
};

/** A mid-run ping every this many shapes. A nudge, not an achievement. */
const MILESTONE_EVERY = 25;

const INK = {
  ground: 0x0b0d1f,
  grid: 0x171a33,
  bolt: 0xd8fbff,
  /**
   * THE GEM IS RUBY, 2026-09-22. Operator ruling: *"Make the diamonds gold
   * color... The green mixes with the shots/enemies"*, then *"how about shiny
   * red?"* when gold turned out to be the most crowded hue on this board - the
   * orb, the arc's shots, the nova's fire and the boundary walls are all amber.
   *
   * They were mint, `0x6bff9e`, and the complaint was exact: the DRONE's shots
   * are `0x7df9a6`, whose own comment in `WEAPON_INK` below claims mint is "the
   * one hue no shape and no other shot uses". That was false the day the gems
   * were drawn, and it is the collision the operator saw.
   *
   * Red is not free either - the lancer is `0xff3b1f` and throws `0xff3b1f`
   * bolts at you on wild - so this is a CRIMSON that leans pink rather than the
   * lancer's orange-red, and the drawing carries the rest: a gem is faceted, lit
   * and STILL, while a bolt is a flat moving disc. If it ever reads badly in
   * play, the honest fix is to move the lancer, not to dim the gem.
   */
  gem: 0xff1f4f,
  /** The lit facet. A pale rose rather than white, so the glint belongs to the stone. */
  gemLit: 0xffd7e2,
} as const;

/**
 * One ink per weapon, and they are far apart on purpose: three weapons that
 * differ only in shape are still hard to tell apart at speed on a phone, so
 * colour carries the difference first and motion confirms it. Ice for the
 * straight bolt, amber for the curving arc, magenta for the burst ring.
 *
 * They are NOT the enemy inks - a shot drawn in a shape's colour reads as that
 * shape throwing it. Checked against ENEMY_INK above: none of these three is
 * within reach of runner pink, orb amber-orange or brute violet at speed.
 */
const WEAPON_INK: Record<ShotKind, number> = {
  bolt: 0xd8fbff,
  arc: 0xffd166,
  burst: 0xff5ce1,
  // Mint, the one hue no shape and no other shot uses, so the drone's shots are
  // told from the robot's own at a glance.
  drone: 0x7df9a6,
};

/** The blades' ink. Pink is a runner's colour, so the blades are a PALER pink with a white edge. */
const BLADE_INK = 0xff8fc0;

/**
 * The NOVA's fire. The burst's own magenta would read as a burst fragment lying
 * on the floor, so the fire takes AMBER - the one warm hue on this board that
 * belongs to no shape (the orb is amber, but an orb is a moving circle and this
 * is ground under everything) and that says "hot" without being red, which is
 * the channel a colour-blind player cannot use.
 */
const FIRE_INK = 0xffa23a;

/**
 * A gem worth this much or more is drawn large and haloed.
 *
 * TEN, which is `ELITE.xp` times a runner's 1 - so the threshold is exactly "an
 * elite dropped this" rather than a number chosen to look right. An ordinary
 * brute's 4 stays small; every elite's gem, from a runner's 10 to a brute's 40,
 * is big.
 */
const BIG_GEM = ELITE.xp;
/** Ice, for the freeze: the frozen shapes' tint and the cover over the view. */
const ICE = 0x9fe3ff;

/**
 * The shapes that wear another character's sprite, and are therefore DRESSED:
 * tinted in their own ink for as long as they live, so one never reads as the
 * ordinary shape it is drawn from. `FOR_ENEMY` in `sprites.ts` says why they
 * borrow a body at all.
 *
 * It used to carry a size table beside this Set. That is gone: `enemyScale`
 * sizes every shape off its hitbox, and the note at the `setScale` call says
 * why a second, hand-picked multiplier is not allowed to sit on top of it.
 *
 * A Set rather than a flag on `KINDS`, because this is a drawing decision and
 * the simulation is not allowed to hold one.
 */
const DRESSED = new Set<EnemyKind>(["spitter", "lancer"]);
/** The world's scenery and walls. Dim on purpose: nothing decorative may read as a shape. */
const SCENERY = { crystal: 0x6a5cff, rock: 0x262b52, tuft: 0x2f8f73, crack: 0x252a4d, wall: 0x1a1d38, stripe: 0xffb020, edge: 0xffd166 } as const;

/** Kept for the sparks a kill throws, which are still drawn rather than sprited. */
const ENEMY_INK: Record<EnemyKind, number> = {
  runner: 0xff4d9d,
  orb: 0xffc24b,
  brute: 0xa56bff,
  // THE TWO THAT SHOOT, and these three jobs are one colour each on purpose: the
  // body's standing tint, the sparks it throws when it dies, and the bolt it
  // fires. A bolt in a colour nothing on the board wears is a bolt a player
  // cannot trace back to whatever threw it.
  //
  // Checked against the rest of this file rather than picked: lime is the only
  // yellow-green among pink, amber, violet, stone, ice, magenta, mint and the
  // nova's orange, and vermilion the only pure red.
  spitter: 0xb6ff3a,
  lancer: 0xff3b1f,
  // Stone, and checked against the other six inks in this file rather than
  // picked: it is the only cool grey among three saturated shapes (pink, amber,
  // violet) and three weapons (ice, amber, magenta). It is the golem's death
  // sparks AND its health bar, so the bar reads as belonging to the thing it
  // measures.
  golem: 0x9fb3d9,
  // A splinter of the golem, so a paler version of the golem's own stone - it
  // should read as "one of those, small", which is exactly what it is.
  shard: 0xc3d2ea,
  // THE TWO STAGE BOSSES take a DEEPER version of the shape they are the big one
  // of: the warden is a giant bat and the runner is pink, the queen is a giant
  // crab and the brute is violet. Deliberately not a new hue each - a boss that
  // shares nothing with its crowd reads as a different game arriving, and this
  // one is meant to read as "the thing you have been fighting, grown up".
  warden: 0xff2d6f,
  queen: 0x7b3fe4,
};

/** Ground and grid at the bottom, the cast in the middle, shots and sparks on top. */
const DEPTH = { bg: 0, corpse: 5, enemy: 10, player: 20, fg: 30 } as const;

/** How long the one-shot clips hold before the sprite goes back to idle/walk. */
const ATTACK_MS = 260;

/**
 * The shortest gap between two shot sounds, in milliseconds.
 *
 * Measured against the cadence rather than picked: `fireEvery` starts at 620 ms
 * and `rapid` at its cap of 6 takes it to 130 ms (620 * 0.86^6 = 237, floored at
 * 130). At 130 ms a sound on every shot is roughly eight beeps a second. 260
 * keeps every shot audible at the opening cadence - where the player is still
 * learning that the weapon changed - and thins it to every other shot once the
 * gun is fully upgraded, which is exactly when the screen is loud anyway.
 */
const SHOT_SFX_GAP_MS = 260;
const HURT_MS = 380;
/** A cap on KO sprites, so a wave dying together cannot pile up game objects. */
const MAX_CORPSES = 12;

type Spark = { x: number; y: number; vx: number; vy: number; life: number; ink: number };

/**
 * A KILL, drawn in the manner of the weapon that made it.
 *
 * Operator ruling 2026-09-22: *"Can u do different animation for different
 * weapons? Like the blades- make them show cuts or something? And the
 * drone/missles make them go small boom?"*
 *
 * Until now every kill threw the same seven-spark puff whatever finished it, so
 * a run carrying four weapons looked like a run carrying one. The simulation
 * says WHICH weapon landed the blow (`pop.by`); this is the scene's answer to
 * it, and like every other drawing decision the rules know nothing about it.
 *
 * `age` counts UP from 0 to `ms`, because every one of these effects grows -
 * a ring widens, a slash sweeps, a spark flies out - and a countdown would have
 * each of them compute `1 - t` at its own call site.
 */
type Hit = { x: number; y: number; a: number; age: number; ms: number; by: WeaponId };

/**
 * THE GAME'S OWN SOUNDS, synthesised rather than sampled.
 *
 * Operator ruling 2026-09-22: *"What about some laser sounds or other sound
 * effects?"*
 *
 * WHY NOT A TENTH `SfxName`. The nine named sounds are the SITE's palette -
 * chosen in a sound lab on 2026-08-13, shared by all forty-five games, and a
 * player learns what each one means across the whole catalogue. A laser is one
 * game's voice, and putting it in the shared table would either teach `star` to
 * mean two things or add a name only one game ever plays. `ctx.audio.tone()`
 * exists for exactly this - the SDK's own comment says "for games that own
 * their own scale" - and it costs no asset, no request and no bytes on a first
 * visit.
 *
 * MUTE IS ALREADY HANDLED, and it needed no new control: `tone()` returns early
 * on `muted`, so the sound button already in the game's bar silences every one
 * of these. A second toggle would have broken the one-control-one-place law for
 * no gain.
 *
 * Each weapon gets a different PITCH as well as a different shape, so the ear
 * can tell which gun fired the way the eye can tell by colour.
 */
const LASER: Record<WeaponId, { from: number; to: number; ms: number; type: OscillatorType; gain: number }> = {
  // The rifle: a tight high chirp falling fast. The one that fires most often,
  // so it is also the quietest - at `rapid` 8 it comes round every 130 ms.
  bolt: { from: 1180, to: 460, ms: 70, type: "square", gain: 0.05 },
  // The curving shot: a longer, softer fall, because it travels and bends.
  arc: { from: 840, to: 300, ms: 120, type: "sawtooth", gain: 0.055 },
  // The ring: lowest and widest, a thump with a tail rather than a chirp.
  burst: { from: 420, to: 130, ms: 150, type: "sawtooth", gain: 0.07 },
  // The drone: thin and high, clearly not the robot's own gun.
  drone: { from: 1500, to: 900, ms: 60, type: "square", gain: 0.04 },
  // The blades never throw anything, so they never reach this table through the
  // `shot` event. The row exists so the record is total and a future weapon that
  // does throw cannot land here undefined.
  blades: { from: 600, to: 420, ms: 80, type: "triangle", gain: 0.04 },
};

/**
 * How long each weapon's kill effect lasts, and the numbers are the design.
 *
 * The blades are the longest because a CUT is a sweep and a sweep needs long
 * enough to read as motion rather than as a stroke that was simply there; the
 * bolt is the shortest because it is a rifle and a rifle's hit is an instant.
 * The two that boom sit between them.
 */
const HIT_MS: Record<WeaponId, number> = { blades: 260, burst: 300, drone: 260, arc: 240, bolt: 160 };

export class SurvivorsScene extends Phaser.Scene {
  private ctx!: GameContext;
  private run!: RunState;
  /**
   * The floor this scene draws and plays on.
   *
   * Handed in by the component, which is the only party that knows how much
   * room the screen has. It DEFAULTS to the phone's portrait arena so a caller
   * that says nothing gets what this game has always had, and it is read once:
   * the canvas is sized from it at boot, so a scene cannot change shape under a
   * run that is already going.
   */
  private arena: Arena = ARENA;
  private phase: Phase = "ready";
  /**
   * NOT a fourth phase. A phase is where the run is; a pause is a lid over
   * whichever of those is current.
   */
  private paused = false;
  private selectedLevel: LevelKey = "normal";
  /** The weapon a run starts with, chosen on the entrance. */
  private startWeapon: WeaponId = "bolt";
  private offer: Card[] = [];
  private nextMilestone = MILESTONE_EVERY;
  /** Ground and grid. Drawn ONCE - they never change, and clearing a Graphics
   *  every frame to redraw the same 22 lines was work for nothing. */
  private bg!: Phaser.GameObjects.Graphics;
  /** Bolts, gems and sparks. These do change, so this one is cleared per frame. */
  private fg!: Phaser.GameObjects.Graphics;
  /**
   * Things drawn in SCREEN space, over the scrolling world: the stick, the boss
   * bar, the minimap and the freeze cover. `setScrollFactor(0)` pins it to the
   * view, so none of them slides away as the camera follows the robot.
   */
  private hud!: Phaser.GameObjects.Graphics;
  /** Whether the shapes were frozen last frame, so their clips pause and resume once. */
  private wasFrozen = false;
  private sparks: Spark[] = [];
  /** Per-weapon kill effects. Capped by their own short lives, like the sparks. */
  private hits: Hit[] = [];
  private rng: () => number = Math.random;

  private ship!: Phaser.GameObjects.Sprite;
  /** One sprite per live enemy, keyed by the id `logic.ts` gave it. */
  private mobs = new Map<number, Phaser.GameObjects.Sprite>();
  private corpses: Phaser.GameObjects.Sprite[] = [];
  /** When the ship's one-shot clips stop holding, in scene time. */
  private attackUntil = 0;
  private hurtUntil = 0;
  /** Scene time the next shot may sound at. See the throttle in `consume`. */
  private nextShotSfx = 0;

  /**
   * The live joystick, or null when no thumb is down.
   *
   * This REPLACED a `hold` point, and the difference is the whole control: a
   * hold steers the ship TOWARD an absolute spot, so the ship stops the moment
   * it arrives and the thumb has to keep moving to keep the ship moving. A stick
   * steers by a vector FROM its origin, so a thumb that stays put keeps walking.
   * They are different games to play, and the second is what a joystick is.
   */
  private stick: Stick | null = null;
  /** Which touch owns the stick, so a second finger on the freeze button cannot steer. */
  private stickTouch = -1;
  /** Which stick this player chose. Their own setting, on this game's chrome. */
  /** Keys currently down. */
  private keys = new Set<string>();

  private onStatus?: (s: SurvivorsStatus) => void;
  /**
   * The scene hands ITSELF over once it exists. Asking Phaser for it does not
   * work: `scene.start()` only QUEUES a start, so `getScene` on the next line
   * returns null and the chrome's buttons silently do nothing forever.
   */
  private onReady?: (scene: SurvivorsScene) => void;

  constructor() {
    super("survivors");
  }

  init(data: {
    ctx: GameContext;
    /** Portrait on a phone, landscape on a desktop. The component decides. */
    arena?: Arena;
    onStatus?: (s: SurvivorsStatus) => void;
    onReady?: (scene: SurvivorsScene) => void;
  }) {
    this.ctx = data.ctx;
    this.arena = data.arena ?? ARENA;
    this.onStatus = data.onStatus;
    this.onReady = data.onReady;
  }

  /**
   * The sheets. Two URLs per character rather than one base path, because Vite
   * content-hashes both and they cannot be derived from each other - which is
   * why the adapter's own `loadStudioAtlas` is unusable in a bundled game and
   * this calls `load.atlas` directly. See the header of `./sprites.ts`.
   */
  preload() {
    for (const key of CAST_KEYS) {
      this.load.atlas(key, CAST[key].png, CAST[key].atlas);
    }
  }

  create() {
    this.rng = rngFor(Date.now() >>> 0);
    this.run = newRun(this.selectedLevel, this.arena, this.startWeapon);
    // The camera never shows past the world; its scroll is set from `cameraOf`
    // every frame, so the view the scene draws is the view the simulation spawns around.
    this.cameras.main.setBounds(0, 0, this.run.world.w, this.run.world.h);

    // NEAREST, per texture, and this is the whole reason the art survives. Every
    // authored pixel is a 5x5 block on the sheet and is drawn at 0.2, so one
    // block becomes one arena unit; a smoothed filter would blur exactly the
    // edges this style is made of. Set here rather than in the game config
    // because that lives in SurvivorsGame.tsx and this change stays in one file.
    for (const key of CAST_KEYS) {
      this.textures.get(key).setFilter(Phaser.Textures.FilterMode.NEAREST);
      // THE CAST IS THE BOUNDARY, and it is here rather than in the adapter on
      // purpose. `PhaserAnimsLike` declares `frames: unknown[]` - the studio
      // wrote it engine-neutrally so the file could be copied into any game -
      // but Phaser 4's real `anims.create` wants `string | AnimationFrame[]`,
      // and `unknown[]` is not assignable to that. So the adapter's header claim
      // of "Phaser 3 / 4" does not hold for this one method under Phaser 4's
      // types. The copy is held byte-equal to the studio's by
      // `copies-match-the-studio.test.ts`, so widening the interface is the
      // STUDIO's change to make, not a local edit that would red that gate.
      createStudioAnims(this as unknown as PhaserAnimsLike, key, CAST[key].manifest);
    }

    this.bg = this.add.graphics().setDepth(DEPTH.bg);
    this.drawGround();
    this.fg = this.add.graphics().setDepth(DEPTH.fg);
    this.hud = this.add.graphics().setDepth(DEPTH.fg + 1).setScrollFactor(0);

    this.ship = this.spriteFor(PLAYER, this.run.x, this.run.y, DEPTH.player);
    this.ship.play(animKey(PLAYER, "idle"));

    // A THUMB DOWN BORNS THE STICK, wherever the thumb landed. There was a
    // second style until 2026-09-22 - a ring bolted to the arena's lower corner,
    // with a picker to choose - and the operator removed the choice.
    // SCREEN coordinates (`p.x`), never world ones (`p.worldX`). The stick is a
    // thing under a thumb on the glass; once the camera follows the robot the
    // world point under that thumb moves every frame while the thumb does not,
    // and a stick read in world units would steer by the scroll.
    this.input.on("pointerdown", (p: Phaser.Input.Pointer) => {
      if (this.paused) return;
      if (this.phase !== "playing") return void this.startFromChrome();
      const o = stickOriginFor(p.x, p.y);
      this.stick = { ox: o.ox, oy: o.oy, px: p.x, py: p.y };
      this.stickTouch = p.identifier;
    });
    this.input.on("pointermove", (p: Phaser.Input.Pointer) => {
      if (this.paused) return;
      if (p.isDown && this.phase === "playing" && this.stick) {
        this.stick.px = p.x;
        this.stick.py = p.y;
      }
    });
    this.input.on("pointerup", () => {
      this.stick = null;
    });
    // Let go OFF the canvas - a mouse released over the page. Phaser reports it
    // as this and never as `pointerup`, so without it the ship would walk on in
    // the last direction held.
    this.input.on("pointerupoutside", () => {
      this.stick = null;
    });
    // THE THUMB OVER THE CHROME IS STILL STEERING. Reported 2026-09-27 from a
    // 360x726 phone: "When joystick goes over the snow it stops" - the snow
    // being the freeze button's snowflake, one of the DOM controls drawn over
    // this canvas. Phaser decides "over the game" per touchmove with
    // `elementFromPoint`, so a thumb sliding onto ANY overlay fired `gameout`,
    // this dropped the stick, and the robot stood still until the thumb was
    // lifted and put down again. A finger that is still down is still the
    // stick's; only letting go (above) ends it. `gameout` now clears only a
    // stick nothing is holding.
    this.input.on("gameout", () => {
      if (!this.input.activePointer.isDown) this.stick = null;
    });
    // And while the thumb is over an overlay Phaser forwards no `pointermove`
    // at all, so the stick would freeze in the last direction held. A touch
    // keeps reporting to the element it began on - this canvas - wherever it
    // travels, so the canvas's own `touchmove` follows it the whole way.
    // `transformX/Y` is the same page-to-arena mapping Phaser applies to `p.x`.
    const canvas = this.game.canvas;
    const follow = (e: TouchEvent) => {
      if (this.paused || this.phase !== "playing" || !this.stick) return;
      const t = [...e.touches].find((x) => x.identifier === this.stickTouch) ?? e.touches[0];
      if (!t) return;
      this.stick.px = this.scale.transformX(t.pageX);
      this.stick.py = this.scale.transformY(t.pageY);
    };
    canvas.addEventListener("touchmove", follow, { passive: true });
    this.events.once("shutdown", () => canvas.removeEventListener("touchmove", follow));
    this.events.once("destroy", () => canvas.removeEventListener("touchmove", follow));

    const kb = this.input.keyboard;
    kb?.on("keydown", (e: KeyboardEvent) => {
      if (this.paused) return;
      // Space is the freeze on a keyboard - the same action as the button.
      if (e.key === " ") return void this.freezeFromChrome();
      this.keys.add(e.key.toLowerCase());
    });
    kb?.on("keyup", (e: KeyboardEvent) => {
      this.keys.delete(e.key.toLowerCase());
    });

    this.draw();
    this.publish();
    this.onReady?.(this);
  }

  /** A cast member at true game size, pivot (the feet) on the point given. */
  private spriteFor(key: CastKey, x: number, y: number, depth: number) {
    const m = CAST[key].manifest;
    const o = originFor(m);
    return this.add
      .sprite(x, y, key)
      .setOrigin(o.x, o.y)
      .setScale(scaleFor(m))
      .setDepth(depth);
  }

  /** Push the current status out. Called from `draw`, so it cannot go stale. */
  private publish() {
    this.onStatus?.({
      score: this.run.popped,
      // From `bossBar`, never rebuilt here. A hardcoded golem denominator drew
      // an 80-health warden's bar 19% full and never moved it - and when that
      // was fixed in this file, the planted mutation SURVIVED, because nothing
      // in this repo can drive a Phaser scene. The arithmetic lives in the
      // simulation where a test can reach it; this reads the answer.
      boss: bossBar(this.run),
      stage: this.run.stage,
      taken: { ...this.run.up },
      // THE LEVEL'S OWN CLOCK, not a module constant: the swarm is three minutes
      // on calm, five on normal and eight on wild since 2026-09-21.
      timeLeft: Math.max(0, runMs(this.run.level) - this.run.t),
      hp: this.run.hp,
      maxHp: this.run.maxHp,
      power: this.run.power,
      slots: this.run.slots.map((k) => k.id),
      dash: dashReady(this.run),
      charge: chargeOf(this.run),
      frozen: this.run.frozen > 0,
      xp: this.run.xp,
      need: this.run.need,
      level: this.selectedLevel,
      phase: this.phase,
      paused: this.paused,
      offer: this.offer,
    });
  }

  /** The chrome's pause button. Only a moving arena can be stopped. */
  setPaused(next: boolean) {
    if (this.phase !== "playing") return;
    if (this.paused === next) return;
    this.paused = next;
    // Every key is released on the way in: a key held when the lid came down
    // would otherwise still be held when it lifts, and the ship sets off alone.
    if (next) {
      this.keys.clear();
      this.stick = null;
    }
    this.publish();
  }

  setLevel(next: LevelKey) {
    if (this.selectedLevel === next) return;
    this.selectedLevel = next;
    this.restart();
  }

  restartFromChrome() {
    this.restart();
  }

  /** The ready and game-over screens both start a run, the way a canvas tap does. */
  startFromChrome() {
    this.ctx.audio.unlock();
    if (this.phase === "playing") return;
    if (this.phase !== "ready") this.restart();
    this.phase = "playing";
    this.ctx.analytics.levelStart(this.selectedLevel);
    this.publish();
  }

  /** The chrome's level-up cards. An empty offer simply carries on. */
  choose(card: Card) {
    if (this.offer.length === 0) return;
    applyCard(this.run, card);
    this.offer = [];
    this.ctx.audio.play("pop");
    this.publish();
  }

  /**
   * The entrance's weapon pick. Only a run that has not started takes a new
   * starting weapon - a run in progress keeps the loadout it is playing.
   */
  setStartWeapon(next: WeaponId) {
    if (this.startWeapon === next) return;
    this.startWeapon = next;
    if (this.phase === "ready") this.restart();
  }

  /** The freeze button, and Space. Plays the moment only when a freeze really started. */
  freezeFromChrome() {
    if (this.paused || this.phase !== "playing") return;
    if (!triggerFreeze(this.run)) return;
    this.ctx.audio.play("success");
    haptic.tap();
    this.cameras.main.flash(260, 180, 230, 255);
    this.publish();
  }

  private restart() {
    this.run = newRun(this.selectedLevel, this.arena, this.startWeapon);
    this.phase = "ready";
    // A new run is never a paused one: restarting from behind the cover would
    // otherwise leave a lid over a ready screen nobody can read or reach.
    this.paused = false;
    this.offer = [];
    this.nextMilestone = MILESTONE_EVERY;
    this.sparks.length = 0;
    // Beside the sparks and for the same reason: a kill mark left over from the
    // last run would be drawn over the first frame of the new one.
    this.hits.length = 0;
    this.stick = null;
    this.keys.clear();
    // Every sprite the last run owned goes with it. A mob left behind would be
    // drawn forever at the place its enemy died, with nothing to move it.
    for (const s of this.mobs.values()) s.destroy();
    this.mobs.clear();
    for (const c of this.corpses) c.destroy();
    this.corpses.length = 0;
    this.attackUntil = 0;
    this.hurtUntil = 0;
    this.wasFrozen = false;
    this.ship.setPosition(this.run.x, this.run.y).clearTint().setAlpha(1);
    this.ship.play(animKey(PLAYER, "idle"));
    this.draw();
    this.publish();
  }

  /** A thumb beats the keys; with neither, the ship holds still. */
  private inputVector(): { dx: number; dy: number } {
    // The stick's own deadzone decides "not moving", so a thumb resting still
    // is a request to stand still rather than a drift - the same judgement the
    // old hold-point made with its 6 units, now made in one place.
    if (this.stick) return stickVector(this.stick);
    let dx = 0;
    let dy = 0;
    const k = this.keys;
    if (k.has("arrowleft") || k.has("a")) dx -= 1;
    if (k.has("arrowright") || k.has("d")) dx += 1;
    if (k.has("arrowup") || k.has("w")) dy -= 1;
    if (k.has("arrowdown") || k.has("s")) dy += 1;
    return { dx, dy };
  }

  update(_time: number, delta: number) {
    if (this.phase !== "playing" || this.paused) return;
    // Nothing above this line accumulates, so a paused arena banks no time and
    // resumes exactly where it stopped rather than replaying what it "owed".
    if (this.run.choosing) {
      this.drawSparks(delta);
      return;
    }

    const input = this.inputVector();
    step(this.run, delta, input, this.rng);
    this.consume();
    this.drawSparks(delta);
    this.syncSprites(input);
    this.draw();
    this.publish();
  }

  /** Turn what the simulation reported into sparks, sounds and rewards. */
  private consume() {
    for (const e of this.run.events) {
      if (e.type === "pop") {
        this.burst(e.x, e.y, ENEMY_INK[e.kind]);
        this.layCorpse(e.x, e.y, FOR_ENEMY[e.kind]);
        // THE WEAPON'S OWN MARK, on top of the shape's own sparks. The sparks
        // say WHAT died (they are the shape's ink); this says WHAT KILLED IT.
        //
        // The heading is taken from the robot to the corpse, because every one
        // of these weapons acts outward from the robot - a bolt arrives along
        // that line, a blade sweeps across it, a drone's shot comes in near it.
        // The simulation could report the real impact vector, and deliberately
        // does not: that would be a drawing detail in the rules, and the
        // difference is invisible at the size a hit is drawn.
        if (e.by) {
          this.hits.push({
            x: e.x,
            y: e.y,
            a: Math.atan2(e.y - this.run.y, e.x - this.run.x),
            age: 0,
            ms: HIT_MS[e.by],
            by: e.by,
          });
        }
      } else if (e.type === "shot") {
        // Each weapon has its own voice, from the nine real sfx names - a name
        // that is not in that table is a silent no-op with nothing in the log.
        //
        // THROTTLED, and this is the whole reason the throttle exists: `rapid`
        // takes the cadence to 130 ms, and a sound on every shot at that rate is
        // a machine-gun of beeps that makes a child put the phone down. The
        // weapon still always LOOKS different; it just does not always speak.
        const now = this.time.now;
        if (now >= this.nextShotSfx) {
          this.ctx.audio.play(WEAPONS[e.weapon].sfx);
          // AND THE LASER, on the same throttle. Two layers on purpose: the
          // named sfx is the site's voice and carries the weight, the chirp is
          // this game's own and carries WHICH gun. Riding the existing throttle
          // rather than a second one is what keeps them from drifting into two
          // sounds a hundred milliseconds apart.
          this.laser(e.weapon);
          this.nextShotSfx = now + SHOT_SFX_GAP_MS;
        }
        this.attackUntil = now + ATTACK_MS;
      } else if (e.type === "efire") {
        // A shape threw one. A puff of its own ink at the muzzle, so the bolt is
        // seen LEAVING something rather than simply existing - which is what lets
        // a player work out who to go and deal with.
        //
        // NO SOUND, and that is on the record rather than an omission: the nine
        // sfx names are all spoken for, and re-using one would teach a player
        // that a sound they already know means two opposite things. The warning
        // this game gives is the wind-up, and it is visual on purpose.
        for (let i = 0; i < 5; i++) {
          const a = this.rng() * Math.PI * 2;
          const v = 20 + this.rng() * 40;
          this.sparks.push({ x: e.x, y: e.y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, life: 200, ink: ENEMY_INK[e.kind] });
        }
      } else if (e.type === "hurt") {
        this.ctx.audio.play("fail");
        this.cameras.main.shake(160, 0.008);
        // Physical, and it says something the shake cannot. No-ops silently off
        // Android-Chrome, which is what makes it safe to fire unconditionally.
        haptic.fail();
        this.hurtUntil = this.time.now + HURT_MS;
      } else if (e.type === "shield") {
        // THE SHIELD ATE A HIT, and it must not look like nothing happened.
        // Without this a player sees a shape reach them, sees no heart go, and
        // has no way to learn that the upgrade they bought is what did it - the
        // event would be a lever the simulation pulls and nobody can see.
        //
        // A ring rather than a streak, and "coin" rather than "fail": it is a
        // SAVE, and this repo's own law is that a save is never mistaken for a
        // hit. Deliberately quieter than the dash, which is the better outcome.
        this.ctx.audio.play("coin");
        for (let i = 0; i < 14; i++) {
          const a2 = (i / 14) * Math.PI * 2;
          this.sparks.push({
            x: this.run.x + Math.cos(a2) * 18,
            y: this.run.y + Math.sin(a2) * 18,
            vx: Math.cos(a2) * 46,
            vy: Math.sin(a2) * 46,
            ink: ICE,
            life: 260,
          });
        }
        this.cameras.main.shake(90, 0.004);
      } else if (e.type === "dash") {
        // The dash saved a heart. A streak of ice from where the robot was to
        // where it is, and a sound that is not the hurt sound - a save must never
        // be mistaken for a hit.
        this.ctx.audio.play("pop");
        for (let i = 0; i <= 8; i++) {
          const t = i / 8;
          this.sparks.push({
            x: e.x + (this.run.x - e.x) * t,
            y: e.y + (this.run.y - e.y) * t,
            vx: 0,
            vy: 0,
            life: 180 + 140 * t,
            ink: WEAPON_INK.bolt,
          });
        }
      } else if (e.type === "boss") {
        // The arrival is the loudest thing in the run, and it is the only place
        // `streak` is played: three minutes of the same handful of sounds, then
        // one this game has never made before. The shake is longer and harder
        // than the one a hit costs (160 ms at 0.008) so the two cannot be
        // confused - this is the ground moving, not you being hurt.
        this.ctx.audio.play("streak");
        // Under it, a low double thump on the game's own voice - the footfall of
        // something big arriving. It is the one place two sounds are stacked
        // deliberately: `streak` says "an event", the thump says "and it is
        // heavy", and neither says it alone.
        this.thump(90, 260, 0.14);
        this.cameras.main.shake(420, 0.016);
      } else if (e.type === "summon") {
        // THE GOLEM CALLED SHAPES IN. A rising pair rather than a falling one -
        // every other sound in this game falls, so "something arrived" is the
        // one that goes up, and it cannot be mistaken for a weapon.
        const t0 = this.ctx.audio.time();
        this.ctx.audio.tone({ freq: 220, ms: 90, type: "triangle", gain: 0.08 });
        this.ctx.audio.tone({ freq: 330, ms: 120, type: "triangle", gain: 0.07, at: t0 + 0.09 });
        for (let i = 0; i < 8; i++) {
          const a = this.rng() * Math.PI * 2;
          const v = 30 + this.rng() * 70;
          this.sparks.push({
            x: e.x, y: e.y,
            vx: Math.cos(a) * v, vy: Math.sin(a) * v,
            life: 260, ink: ENEMY_INK.golem,
          });
        }
      } else if (e.type === "levelup") {
        this.ctx.audio.play("success");
        // The one DOM effect in the arena, and it is here because a level-up is
        // rare and worth a puff. Per-kill it would be a DOM storm.
        const at = this.screenPoint(this.run.x, this.run.y);
        juiceBurst(at.x, at.y, { count: 12 });
        this.offer = offerCards(this.run, this.rng);
        // Nothing left to offer: carry on rather than stopping dead in front of
        // no cards. `logic.ts` returns an empty list for exactly this case.
        if (this.offer.length === 0) this.run.choosing = false;
      } else if (e.type === "won") this.finish(true);
      else if (e.type === "over") this.finish(false);
    }
    // An endless-feeling mid-run ping. Coins, no star, no confetti.
    while (this.run.popped >= this.nextMilestone) {
      this.nextMilestone += MILESTONE_EVERY;
      winMoment(this.ctx, {
        reason: "milestone",
        level: `score-${this.run.popped}`,
        at: this.shipPoint(),
        confetti: false,
      });
    }
  }

  private finish(survived: boolean) {
    this.phase = survived ? "won" : "over";
    this.offer = [];
    this.ctx.audio.play(survived ? "win" : "fail");
    // The ship falls over when the hearts run out. `ko` is a one-shot, so it
    // holds its last frame rather than looping a death forever.
    if (!survived) this.ship.play(animKey(PLAYER, "ko"));
    if (survived) {
      this.ctx.analytics.levelComplete(this.selectedLevel, this.run.t);
      // The score rides the win rather than being a second announcement, so the
      // run is reported exactly once either way.
      winMoment(this.ctx, {
        reason: "level_complete",
        tier: TIER[this.selectedLevel],
        level: this.selectedLevel,
        ms: this.run.t,
        at: this.shipPoint(),
        score: { value: this.run.popped, unit: "points", board: this.selectedLevel },
      });
    } else {
      this.ctx.analytics.levelFail(this.selectedLevel, "out of hearts");
      const record = this.ctx.score?.report({
        value: this.run.popped,
        unit: "points",
        board: this.selectedLevel,
      });
      if (record?.isPersonalBest) {
        winMoment(this.ctx, {
          reason: "personal_best",
          level: `score-${this.run.popped}`,
          at: this.shipPoint(),
        });
      }
    }
    this.draw();
    this.publish();
  }

  /** An arena point in viewport pixels - what the DOM effects and coins need. */
  private screenPoint(x: number, y: number): { x: number; y: number } {
    const c = this.game.canvas?.getBoundingClientRect();
    if (!c) return { x: 0, y: 0 };
    // A WORLD point, so the camera comes off first - without this every coin and
    // puff would fly from where the robot would be if the camera had never moved.
    const cam = cameraOf(this.run);
    return {
      x: c.left + ((x - cam.x) / this.arena.w) * c.width,
      y: c.top + ((y - cam.y) / this.arena.h) * c.height,
    };
  }

  /** Where the coins should fly from: the ship, in viewport pixels. */
  private shipPoint(): { x: number; y: number } {
    return this.screenPoint(this.run.x, this.run.y);
  }

  /**
   * A weapon's chirp: a pitch that falls, built from three short tones.
   *
   * THREE STEPS RATHER THAN A GLIDE, because `tone()` plays one frequency for a
   * fixed length - the port has no ramp, and adding one would be a change to the
   * SDK every game shares for the sake of this game's laser. Three scheduled
   * tones at falling pitches read as a fall; two read as a beep followed by a
   * lower beep.
   *
   * SCHEDULED ON THE AUDIO CLOCK (`time()`), never `setTimeout`. The audio clock
   * is a seconds-based clock of its own and the two must never be mixed - a
   * timer-driven version drifts under load and the chirp arrives as three
   * separate notes.
   *
   * Silently does nothing when audio is muted or not yet unlocked, because
   * `tone()` does.
   */
  private laser(id: WeaponId) {
    const l = LASER[id];
    const t0 = this.ctx.audio.time();
    const steps = 3;
    for (let i = 0; i < steps; i++) {
      const p = i / (steps - 1);
      this.ctx.audio.tone({
        freq: l.from + (l.to - l.from) * p,
        ms: l.ms / steps,
        type: l.type,
        // The tail is quieter than the head, which is what makes it a chirp
        // rather than three notes of equal weight.
        gain: l.gain * (1 - p * 0.5),
        at: t0 + (i * (l.ms / steps)) / 1000,
      });
    }
  }

  /**
   * A low thump, for something big going down.
   *
   * Deliberately NOT on every kill - at a late wild board's rate that is a
   * drum roll - so the caller decides, and today only a boss falling and the
   * golem's summons reach it.
   */
  private thump(freq: number, ms: number, gain: number) {
    this.ctx.audio.tone({ freq, ms, type: "sine", gain });
    this.ctx.audio.tone({ freq: freq * 0.5, ms: ms * 1.4, type: "triangle", gain: gain * 0.8 });
  }

  private burst(x: number, y: number, ink: number) {
    for (let i = 0; i < 7; i++) {
      const a = this.rng() * Math.PI * 2;
      const v = 40 + this.rng() * 110;
      this.sparks.push({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, life: 320, ink });
    }
  }

  /** A body that plays `ko` once and removes itself. Capped, oldest first. */
  private layCorpse(x: number, y: number, key: CastKey) {
    while (this.corpses.length >= MAX_CORPSES) this.corpses.shift()?.destroy();
    const s = this.spriteFor(key, x, y, DEPTH.corpse);
    s.play(animKey(key, "ko"));
    s.once("animationcomplete", () => {
      const i = this.corpses.indexOf(s);
      if (i >= 0) this.corpses.splice(i, 1);
      s.destroy();
    });
    this.corpses.push(s);
  }

  private drawSparks(delta: number) {
    const sec = Math.min(50, delta) / 1000;
    for (const s of this.sparks) {
      s.x += s.vx * sec;
      s.y += s.vy * sec;
      s.life -= delta;
    }
    this.sparks = this.sparks.filter((s) => s.life > 0);
    for (const h of this.hits) h.age += delta;
    this.hits = this.hits.filter((h) => h.age < h.ms);
  }

  /**
   * Play `clip` unless it is already the one running. Without this guard a
   * looping clip is restarted sixty times a second and never leaves frame zero -
   * a walk cycle that looks like a statue, with nothing in the log to say why.
   */
  private want(sprite: Phaser.GameObjects.Sprite, key: CastKey, clip: Clip) {
    const k = animKey(key, clip);
    if (sprite.anims.currentAnim?.key === k) return;
    sprite.play(k);
  }

  /** Every cast member follows the simulation: position, facing, clip, flash. */
  private syncSprites(input: { dx: number; dy: number }) {
    const now = this.time.now;
    const frozen = this.run.frozen > 0;

    // The ship. It blinks while the mercy window is open, so a player can see why
    // the next shape went through them without costing a heart.
    const blink = this.run.invuln > 0 && Math.floor(this.run.invuln / 90) % 2 === 0;
    this.ship.setPosition(this.run.x, this.run.y).setAlpha(blink ? 0.25 : 1);
    if (Math.abs(input.dx) > 0.02) this.ship.setFlipX(input.dx < 0);
    if (this.phase === "playing") {
      const moving = Math.hypot(input.dx, input.dy) > 0.02;
      this.want(this.ship, PLAYER, now < this.hurtUntil ? "hurt" : now < this.attackUntil ? "attack" : moving ? "walk" : "idle");
    }

    // Enemies. One sprite per id, made on first sight and destroyed with its
    // enemy - keyed by id rather than by index, because `logic.ts` filters the
    // dead out and every index after one would otherwise shift onto a stranger.
    const seen = new Set<number>();
    for (const e of this.run.enemies) {
      seen.add(e.id);
      const key = FOR_ENEMY[e.kind];
      let s = this.mobs.get(e.id);
      if (!s) {
        s = this.spriteFor(key, e.x, e.y, DEPTH.enemy);
        this.mobs.set(e.id, s);
      }
      s.setPosition(e.x, e.y);
      s.setFlipX(this.run.x < e.x);
      // HOW BIG, from `enemyScale` and never rebuilt here.
      //
      // This line used to read `setScale(e.elite ? ELITE.r : 1)` and it shipped
      // live drawing every enemy FIVE TIMES too big: `setScale` REPLACES, so the
      // `1` threw away the `scaleFor(manifest)` the sprite was given at birth
      // and every shape rendered at raw sheet pixels. A ring is still drawn
      // under an elite in `drawEliteRings` - size alone reads as "nearer", not
      // as "tougher", with no other shape beside it for comparison.
      //
      // THE TWO DRESSED SHAPES GET NO EXTRA MULTIPLIER, 2026-09-22, resolving
      // this merge. They were written with a `DRESS_SCALE` of 1.2 and 1.35 to
      // tell a spitter from the orb and a lancer from the brute whose sprite
      // they wear - drawn before `enemyScale` existed, when the line above
      // could not read a hitbox at all. It does now, and it already separates
      // them: spitter r13 against orb r12 is 1.08x, lancer r19 against brute
      // r17 is 1.12x. A hand-picked multiplier on top would put the picture at
      // a different size from the thing the simulation collides with, which is
      // the exact drift the function was extracted to end. What tells them
      // apart is the standing ring in the kind's own ink plus the wind-up
      // telegraph - a tint alone was measured invisible on 2026-09-21, lime on
      // a green slime - and neither of those is a size.
      s.setScale(enemyScale(e));
      // White on the frame it was hit, straight off the `flash` countdown the
      // simulation already keeps. FILL replaces the texture colour while
      // respecting its alpha, so the SILHOUETTE flashes and a dark sprite reads
      // as brightly as a pale one - Phaser's default MULTIPLY would barely move
      // the crab's own dark shell.
      //
      // This was `setTintFill(0xffffff)`, which does not compile under Phaser 4:
      // the method survives only as a DEPRECATED ZERO-ARGUMENT stub, so the
      // colour had nowhere to go. Its own declaration names the replacement and
      // this is it verbatim. `clearTint()` below was checked rather than
      // assumed - it is unchanged at 0 args, and had it moved too, fixing only
      // the line above would have left the other half of the pair broken with
      // nothing to say so.
      if (e.flash > 0) s.setTint(0xffffff).setTintMode(Phaser.TintModes.FILL);
      // Ice while frozen, and the walk cycle stops with them: a shape that keeps
      // walking on the spot reads as a shape that is only slowed.
      else if (frozen) s.setTint(ICE).setTintMode(Phaser.TintModes.MULTIPLY);
      // WINDING UP: it has stopped and it is about to throw. It PULSES rather
      // than holding one colour, because a steady white body is what a hit flash
      // looks like and these two must never be read for each other - one says
      // "you got it", the other says "move". The ring `drawShooters` puts on the
      // ground under it is the other half, and the one you can see from the far
      // side of the arena.
      else if ((e.wind ?? 0) > 0) {
        if (Math.floor((e.wind ?? 0) / 110) % 2 === 0) s.setTint(0xffffff).setTintMode(Phaser.TintModes.FILL);
        else s.setTint(ENEMY_INK[e.kind]).setTintMode(Phaser.TintModes.FILL);
      }
      // A dressed shape wears its own ink for as long as it lives, so an elite is
      // never read as the ordinary shape whose body it borrows.
      else if (DRESSED.has(e.kind)) s.setTint(ENEMY_INK[e.kind]).setTintMode(Phaser.TintModes.MULTIPLY);
      else s.clearTint();
      if (frozen) {
        if (!this.wasFrozen || !s.anims.isPaused) s.anims.pause();
      } else {
        if (s.anims.isPaused) s.anims.resume();
        this.want(s, key, e.flash > 0 ? "hurt" : "walk");
      }
    }
    this.wasFrozen = frozen;
    for (const [id, s] of this.mobs) {
      if (seen.has(id)) continue;
      s.destroy();
      this.mobs.delete(id);
    }
  }

  /** The arena floor. Static, so this runs once rather than sixty times a second. */
  private drawGround() {
    const g = this.bg;
    const { w, h } = this.run.world;
    g.clear();
    g.fillStyle(INK.ground, 1);
    g.fillRect(0, 0, w, h);
    g.lineStyle(1, INK.grid, 1);
    // The grid pitch stays 42 units on every floor rather than scaling with it:
    // it is a sense of SPEED, and with the camera following the robot it is also
    // what tells a player they are moving at all.
    for (let x = 42; x < w; x += 42) g.lineBetween(x, 0, x, h);
    for (let y = 42; y < h; y += 42) g.lineBetween(0, y, w, y);
    this.drawScenery(g, w, h);
    this.drawWalls(g, w, h);
  }

  /**
   * Scenery you walk over (operator ruling 2026-09-14: decoration, not
   * obstacles). Seeded, so a floor looks the same every run and a landmark can be
   * learned. Dim, so nothing here can be mistaken for a shape coming at you, and
   * sparse near the start so the first seconds read clearly.
   */
  private drawScenery(g: Phaser.GameObjects.Graphics, w: number, h: number) {
    const rnd = rngFor(20260914);
    const n = Math.round((w * h) / 5200);
    for (let i = 0; i < n; i++) {
      const x = rnd() * w;
      const y = rnd() * h;
      const k = rnd();
      if (Math.hypot(x - w / 2, y - h / 2) < 70) continue;
      if (k < 0.25) {
        g.fillStyle(SCENERY.crystal, 0.32);
        g.fillTriangle(x, y - 7, x + 4, y, x, y + 7);
        g.fillTriangle(x, y - 7, x - 4, y, x, y + 7);
      } else if (k < 0.5) {
        g.fillStyle(SCENERY.rock, 1);
        g.fillRoundedRect(x, y, 10, 7, 2);
        g.fillRoundedRect(x + 6, y - 4, 8, 6, 2);
      } else if (k < 0.8) {
        g.lineStyle(1.6, SCENERY.tuft, 0.55);
        g.lineBetween(x, y, x - 3, y - 7);
        g.lineBetween(x, y, x, y - 9);
        g.lineBetween(x, y, x + 3, y - 7);
      } else {
        g.lineStyle(1.6, SCENERY.crack, 1);
        g.lineBetween(x, y, x + 9, y + 4);
        g.lineBetween(x + 9, y + 4, x + 14, y + 1);
        g.lineBetween(x + 14, y + 1, x + 22, y + 7);
      }
    }
  }

  /** The edge of the world: a striped band the robot cannot cross, `WALL` units thick. */
  private drawWalls(g: Phaser.GameObjects.Graphics, w: number, h: number) {
    g.fillStyle(SCENERY.wall, 1);
    g.fillRect(0, 0, w, WALL);
    g.fillRect(0, h - WALL, w, WALL);
    g.fillRect(0, 0, WALL, h);
    g.fillRect(w - WALL, 0, WALL, h);
    g.fillStyle(SCENERY.stripe, 0.9);
    for (let x = 0; x < w; x += 16) {
      g.fillRect(x, 0, 8, WALL);
      g.fillRect(x, h - WALL, 8, WALL);
    }
    for (let y = 0; y < h; y += 16) {
      g.fillRect(0, y, WALL, 8);
      g.fillRect(w - WALL, y, WALL, 8);
    }
    g.lineStyle(2, SCENERY.edge, 0.9);
    g.strokeRect(WALL, WALL, w - WALL * 2, h - WALL * 2);
  }

  /** Everything that is still a primitive: the shots, the gems and the sparks. */
  private draw() {
    const g = this.fg;
    g.clear();
    const hud = this.hud;
    hud.clear();
    // The view follows the robot. Set from `cameraOf`, the same function the
    // simulation spawns around, so what is drawn and what is played agree.
    const cam = cameraOf(this.run);
    this.cameras.main.setScroll(cam.x, cam.y);

    // GEMS ARE DRAWN BY WHAT THEY ARE WORTH. Every gem used to be the same
    // little diamond, which was right while they were worth 1, 2 or 4 - close
    // enough that the difference was not worth a picture. An elite drops one
    // worth 40, and a reward ten times the size that looks identical to the
    // ordinary one is a reward a player never learns to go after.
    //
    // SIZE plus a halo, not a second colour: the value is a quantity, and a
    // quantity reads as size. A new hue would say "different kind of thing".
    for (const gem of this.run.gems) {
      const big = gem.value >= BIG_GEM;
      const r = big ? 9 : 5;
      if (big) {
        // A halo that breathes, so a big one catches the eye from off-centre.
        // `this.time.now` rather than a `now` parameter: `draw()` takes none, and
        // threading one through for a halo would change a signature the rest of
        // the scene shares. Phaser's own clock is the same clock either way.
        const pulse = 0.5 + 0.5 * Math.sin(this.time.now / 160);
        g.fillStyle(INK.gem, 0.13 + 0.12 * pulse);
        g.fillCircle(gem.x, gem.y, r + 5 + 2 * pulse);
      }
      // A DARK RIM UNDER THE FACE, then the face, then one bright facet.
      //
      // Three passes rather than one fill, and each pays for itself now that the
      // gem is RED (operator ruling 2026-09-22, *"how about shiny red?"*). Red
      // is not a free hue on this board: the lancer's body, its sparks and its
      // bolts are all `0xff3b1f`, and on wild those bolts fly at you. What keeps
      // them apart is that a gem is STILL, and that it is faceted and lit while
      // a bolt is a flat disc - so the rim and the glint are doing the work the
      // colour cannot.
      //
      // The rim is the ground's own navy, so it reads as a dark outline on any
      // background the arena has, and it is drawn a pixel proud of the face.
      g.fillStyle(INK.ground, 1);
      g.beginPath();
      g.moveTo(gem.x, gem.y - r - 1.5);
      g.lineTo(gem.x + r * 0.8 + 1.5, gem.y);
      g.lineTo(gem.x, gem.y + r + 1.5);
      g.lineTo(gem.x - r * 0.8 - 1.5, gem.y);
      g.closePath();
      g.fillPath();

      g.fillStyle(INK.gem, 1);
      g.beginPath();
      g.moveTo(gem.x, gem.y - r);
      g.lineTo(gem.x + r * 0.8, gem.y);
      g.lineTo(gem.x, gem.y + r);
      g.lineTo(gem.x - r * 0.8, gem.y);
      g.closePath();
      g.fillPath();

      // THE GLINT: the upper-left facet, in the gem's own highlight. Fixed to
      // the shape rather than animated - a moving specular on forty gems is
      // forty things twinkling, and the halo above already carries the pulse for
      // the ones worth pulsing.
      g.fillStyle(INK.gemLit, 0.92);
      g.beginPath();
      g.moveTo(gem.x, gem.y - r);
      g.lineTo(gem.x - r * 0.8, gem.y);
      g.lineTo(gem.x - r * 0.24, gem.y - r * 0.12);
      g.closePath();
      g.fillPath();
    }

    // Three weapons, three MOTIONS and three SHAPES - never one shape at three
    // sizes, which reads as one weapon with a zoom. The bolt is a hard streak
    // along its own heading, the arc is a comet with a tail that curves because
    // its velocity does, and a burst fragment is a square that spins and fades
    // as it dies. Each is drawn in its own ink.
    for (const b of this.run.bolts) {
      const ink = WEAPON_INK[b.kind];
      if (b.kind === "bolt" || b.kind === "drone") {
        const sp = Math.hypot(b.vx, b.vy) || 1;
        g.lineStyle(3, ink, 1);
        g.lineBetween(b.x, b.y, b.x - (b.vx / sp) * 9, b.y - (b.vy / sp) * 9);
      } else if (b.kind === "arc") {
        const sp = Math.hypot(b.vx, b.vy) || 1;
        // Three tail dots behind the head, fading. They trail the CURRENT
        // heading, so the tail swings as the shot turns and the curve is legible.
        for (let i = 3; i >= 1; i--) {
          g.fillStyle(ink, 0.16 * i);
          g.fillCircle(b.x - (b.vx / sp) * (i * 5), b.y - (b.vy / sp) * (i * 5), 3);
        }
        g.fillStyle(ink, 1);
        g.fillCircle(b.x, b.y, 4);
      } else {
        const w = WEAPONS.burst;
        const fade = Math.max(0, Math.min(1, b.life / w.life));
        const spin = b.age / 90;
        g.fillStyle(ink, 0.35 + 0.65 * fade);
        // A square on its own rotation, so a ring of them tumbles outward.
        const r = 4;
        const c = Math.cos(spin) * r;
        const s2 = Math.sin(spin) * r;
        g.beginPath();
        g.moveTo(b.x + c, b.y + s2);
        g.lineTo(b.x - s2, b.y + c);
        g.lineTo(b.x - c, b.y - s2);
        g.lineTo(b.x + s2, b.y - c);
        g.closePath();
        g.fillPath();
      }
    }

    for (const s of this.sparks) {
      g.fillStyle(s.ink, Math.max(0, s.life / 320));
      g.fillCircle(s.x, s.y, 2.5);
    }

    this.drawHits(g);
    this.drawEliteRings(g);
    this.drawShooters(g);
    this.drawEnemyShots(g);
    this.drawFires(g);
    this.drawBlades(g);
    this.drawDrone(g);

    if (this.run.frozen > 0) {
      // A cool cover over the whole view, fading out over the last half second
      // so the thaw is seen coming.
      hud.fillStyle(ICE, 0.14 * Math.min(1, this.run.frozen / 500));
      hud.fillRect(0, 0, this.arena.w, this.arena.h);
    }

    // The joystick, drawn where the thumb put it - in SCREEN space, on the HUD
    // layer. Only while a thumb is down: a ring sitting on an untouched screen is
    // furniture, and this game's whole point is that the arena is the control.
    if (this.stick) {
      const k = knobAt(this.stick);
      hud.lineStyle(2, INK.bolt, 0.35);
      hud.strokeCircle(this.stick.ox, this.stick.oy, STICK_RADIUS);
      hud.fillStyle(INK.bolt, 0.14);
      hud.fillCircle(this.stick.ox, this.stick.oy, STICK_RADIUS);
      hud.fillStyle(INK.bolt, 0.8);
      hud.fillCircle(k.x, k.y, 13);
    }

    // Only mid-run: on the entrance and the end screens it would show through the cover.
    if (this.phase === "playing") this.drawMinimap(hud, cam);

    // The boss's health, along the top of the arena. It is a LENGTH, not a
    // colour code - the bar shortens, and nothing in it has to be read as red
    // against green, which is a channel the operator cannot use and a sizeable
    // fraction of players cannot either.
    //
    // Read through `bossBar` rather than computed here, so the bar cannot
    // disagree with the enemy it is drawing AND the arithmetic sits somewhere a
    // test can drive. Computed here it was un-testable, and a planted mutation
    // hardcoding the golem's health as the denominator survived a green suite.
    const boss = bossBar(this.run);
    if (boss) {
      const m = 16;
      const w = this.arena.w - m * 2;
      const p = boss.fill;
      hud.fillStyle(INK.ground, 0.9);
      hud.fillRect(m - 3, 11, w + 6, 13);
      hud.fillStyle(INK.grid, 1);
      hud.fillRect(m, 14, w, 7);
      hud.fillStyle(ENEMY_INK[boss.kind], 1);
      hud.fillRect(m, 14, w * p, 7);
    }
  }

  /**
   * A ring under every elite.
   *
   * Scale alone is not enough: a shape 1.3x bigger reads as nearer rather than
   * as tougher, and there is nothing beside it at a known size to compare
   * against. The ring is drawn at the radius the simulation actually collides
   * with (`radiusOf`), so it doubles as an honest picture of the hitbox.
   */
  /**
   * Which shapes shoot, and which one is about to.
   *
   * A STANDING MARK ON ANYTHING ARMED, drawn whether or not it is winding up.
   * Measured on the built artifact rather than assumed: the spitter wears the
   * slime's body under a lime tint, and on a green slime that tint is nearly
   * invisible - a screenshot of a live wild run had two shapes a player could not
   * tell apart, one of which shoots. A ring the colour of its bolts says which is
   * which from across the arena, and it costs no art. Delete it the day the
   * spitter gets a body of its own.
   *
   * The WIND-UP half is read off `e.wind`, which the simulation counts down, so
   * the ring cannot be showing a wind-up that is not happening and it closes at
   * exactly the rate the bolt is coming. A telegraph on a clock of the scene's
   * own would drift from the rule it describes and teach the wrong timing.
   */
  private drawShooters(g: Phaser.GameObjects.Graphics) {
    for (const e of this.run.enemies) {
      const gun = GUNS[e.kind];
      if (!gun || e.id === this.run.boss) continue;
      const ink = ENEMY_INK[e.kind];
      const r = radiusOf(e);
      g.lineStyle(1.5, ink, 0.55);
      g.strokeCircle(e.x, e.y, r + 6);
      // Two ticks on the ring, so it reads as a sight rather than a shadow.
      g.lineStyle(2.5, ink, 0.9);
      g.lineBetween(e.x - r - 9, e.y, e.x - r - 3, e.y);
      g.lineBetween(e.x + r + 3, e.y, e.x + r + 9, e.y);

      const wind = e.wind ?? 0;
      if (wind <= 0) continue;
      const full = gun.windup * RULES[this.run.level].windup;
      // 1 when the wind-up starts, 0 on the frame the bolt leaves.
      const left = Math.max(0, Math.min(1, wind / (full || 1)));
      g.lineStyle(2, ink, 0.75);
      g.strokeCircle(e.x, e.y, r + 6 + 30 * left);
      // The line of fire, to where the player is standing NOW. The bolt is aimed
      // when it LEAVES, so this is an honest preview only while the player holds
      // still - which is the point.
      const a = Math.atan2(this.run.y - e.y, this.run.x - e.x);
      g.lineStyle(1.5, ink, 0.3 + 0.4 * (1 - left));
      g.lineBetween(
        e.x + Math.cos(a) * (r + 5),
        e.y + Math.sin(a) * (r + 5),
        e.x + Math.cos(a) * (r + 5 + gun.range * 0.35),
        e.y + Math.sin(a) * (r + 5 + gun.range * 0.35),
      );
    }
  }

  /**
   * What the shapes have thrown: a fat round head in the thrower's ink, a pale
   * core, and a short tail along its heading.
   *
   * DELIBERATELY NOT SHAPED LIKE ANY OF THE PLAYER'S. The bolt is a hard streak,
   * the arc a comet, the burst a tumbling square, the drone's a thin streak - so
   * an incoming bolt is a filled disc, which none of them is, and it carries a
   * dark outline so it stays legible over a bright floor.
   */
  private drawEnemyShots(g: Phaser.GameObjects.Graphics) {
    for (const b of this.run.shots) {
      const ink = ENEMY_INK[b.from];
      const sp = Math.hypot(b.vx, b.vy) || 1;
      g.lineStyle(3, ink, 0.35);
      g.lineBetween(b.x, b.y, b.x - (b.vx / sp) * 11, b.y - (b.vy / sp) * 11);
      g.fillStyle(INK.ground, 0.9);
      g.fillCircle(b.x, b.y, b.r + 1.5);
      g.fillStyle(ink, 1);
      g.fillCircle(b.x, b.y, b.r);
      g.fillStyle(0xffffff, 0.85);
      g.fillCircle(b.x, b.y, b.r * 0.4);
    }
  }

  /**
   * ONE MARK PER WEAPON, drawn where a shape died.
   *
   * Five branches, five silhouettes, and the shapes are chosen so they are told
   * apart by MOTION as much as by colour - the same argument `WEAPON_INK` makes
   * about the shots themselves. A player who cannot name which weapon is firing
   * still sees that two different things are happening.
   *
   *   blades   two crossing arcs that SWEEP outward - a cut
   *   burst    a ring that widens, with debris thrown off it - a small boom
   *   drone    the same ring, tighter and quieter - a smaller boom
   *   arc      a ribbon that curls as it fades - the shot's own curve, landing
   *   bolt     three short lines along the impact heading - a rifle's hit
   *
   * `t` runs 0 to 1 across the effect's life and every branch reads it, so all
   * five fade together and none needs its own clock.
   */
  private drawHits(g: Phaser.GameObjects.Graphics) {
    for (const h of this.hits) {
      const t = Math.min(1, h.age / h.ms);
      const fade = 1 - t;
      if (h.by === "blades") {
        // A CUT. Two arcs on the same centre, swept apart by `t` and drawn in
        // the blades' own pale pink with a white inner edge - so it reads as a
        // slash rather than as a ring that failed to close.
        const r = 9 + t * 16;
        for (const side of [-1, 1] as const) {
          const mid = h.a + side * 0.55;
          g.lineStyle(3 * fade + 0.5, BLADE_INK, 0.9 * fade);
          g.beginPath();
          g.arc(h.x, h.y, r, mid - 0.7, mid + 0.7);
          g.strokePath();
        }
        g.lineStyle(1.2 * fade, 0xffffff, 0.8 * fade);
        g.beginPath();
        g.arc(h.x, h.y, r - 2, h.a - 1.2, h.a + 1.2);
        g.strokePath();
      } else if (h.by === "burst" || h.by === "drone") {
        // A SMALL BOOM. The burst's is wider and throws six pieces; the drone's
        // is tighter and throws three, because a drone is the lighter weapon and
        // the two must not read as the same event at two sizes.
        const big = h.by === "burst";
        const ink = WEAPON_INK[h.by];
        const r = (big ? 6 : 4) + t * (big ? 26 : 17);
        g.lineStyle((big ? 3.5 : 2.5) * fade + 0.5, ink, 0.95 * fade);
        g.strokeCircle(h.x, h.y, r);
        // A filled core that shrinks as the ring grows - the flash inside the
        // shockwave, and what stops the ring reading as an empty bubble.
        g.fillStyle(0xffffff, 0.55 * fade * fade);
        g.fillCircle(h.x, h.y, (big ? 7 : 5) * fade);
        const pieces = big ? 6 : 3;
        for (let i = 0; i < pieces; i++) {
          const a = h.a + (i / pieces) * Math.PI * 2;
          const d = r + 3;
          g.fillStyle(ink, 0.9 * fade);
          g.fillCircle(h.x + Math.cos(a) * d, h.y + Math.sin(a) * d, 2.2 * fade + 0.6);
        }
      } else if (h.by === "arc") {
        // A RIBBON that keeps curling after the shot has landed, so the hit
        // belongs to the weapon whose whole character is that it bends.
        const ink = WEAPON_INK.arc;
        const r = 7 + t * 14;
        const from = h.a - 0.4 + t * 2.4;
        g.lineStyle(3.2 * fade + 0.4, ink, 0.95 * fade);
        g.beginPath();
        g.arc(h.x, h.y, r, from, from + 1.9);
        g.strokePath();
      } else {
        // THE BOLT. Three lines along the heading, the middle one longest, so
        // the mark points the way the shot was travelling. No ring: a rifle hit
        // is a direction, not an event with a radius.
        const ink = WEAPON_INK.bolt;
        g.lineStyle(2.4 * fade + 0.4, ink, 0.95 * fade);
        for (const off of [-0.42, 0, 0.42]) {
          const a = h.a + off;
          const near = 4 + t * 8;
          const far = near + (off === 0 ? 11 : 7) * fade;
          g.lineBetween(
            h.x + Math.cos(a) * near, h.y + Math.sin(a) * near,
            h.x + Math.cos(a) * far, h.y + Math.sin(a) * far,
          );
        }
      }
    }
  }

  private drawEliteRings(g: Phaser.GameObjects.Graphics) {
    for (const e of this.run.enemies) {
      if (!e.elite) continue;
      const r = radiusOf(e);
      g.lineStyle(2, ENEMY_INK[e.kind], 0.85);
      g.strokeCircle(e.x, e.y, r + 3);
      g.lineStyle(1, 0xffffff, 0.5);
      g.strokeCircle(e.x, e.y, r + 6);
    }
  }

  /**
   * The NOVA's burning ground, drawn where the simulation actually burns.
   *
   * WITHOUT THIS THE WHOLE MECHANIC IS INVISIBLE. The fire hurts, expires and
   * is tested - and a player would see shapes losing health while standing on
   * nothing, which reads as a bug rather than as a weapon. A behaviour with no
   * picture is the same armed-lever shape as a picture with no behaviour.
   *
   * Radius from `f.r` and alpha from how much of `f.ms` is left, so what is
   * drawn is the patch that is doing the damage rather than a decoration beside
   * it. Under the cast, because it is ground.
   */
  private drawFires(g: Phaser.GameObjects.Graphics) {
    for (const f of this.run.fires) {
      const fade = Math.max(0, Math.min(1, f.ms / NOVA_FIRE.ms));
      // Two rings rather than one disc: a filled circle at this size reads as a
      // hole in the floor, and the shapes walking over it disappear into it.
      g.fillStyle(FIRE_INK, 0.1 + 0.18 * fade);
      g.fillCircle(f.x, f.y, f.r);
      g.lineStyle(2, FIRE_INK, 0.35 + 0.45 * fade);
      g.strokeCircle(f.x, f.y, f.r * (0.62 + 0.3 * fade));
    }
  }

  /** The blades, where the simulation cuts with them: `bladePositions` is the one source. */
  private drawBlades(g: Phaser.GameObjects.Graphics) {
    if (!holds(this.run, "blades")) return;
    // The guide circle follows the REACH, not the resting radius - a sawstorm's
    // ring breathes, and a fixed circle under blades that fly out reads as the
    // blades having come loose.
    g.lineStyle(1, BLADE_INK, 0.28);
    g.strokeCircle(this.run.x, this.run.y, bladeReach(this.run, bladesEvolved(this.run)));
    for (const b of bladePositions(this.run)) {
      // A crescent leading in the direction of spin: a wide triangle along the
      // tangent, with a pale edge on its outer side.
      const t = b.a + Math.PI / 2;
      const cx = Math.cos(t);
      const cy = Math.sin(t);
      const ox = Math.cos(b.a);
      const oy = Math.sin(b.a);
      g.fillStyle(BLADE_INK, 1);
      g.fillTriangle(
        b.x + cx * 11, b.y + cy * 11,
        b.x - cx * 9 + ox * 4, b.y - cy * 9 + oy * 4,
        b.x - cx * 9 - ox * 4, b.y - cy * 9 - oy * 4,
      );
      g.lineStyle(1.5, 0xffffff, 0.8);
      g.lineBetween(b.x + cx * 11, b.y + cy * 11, b.x - cx * 9 + ox * 4, b.y - cy * 9 + oy * 4);
    }
  }

  /** The drone at the robot's shoulder: a saucer with a dome and one dark eye. */
  private drawDrone(g: Phaser.GameObjects.Graphics) {
    if (!holds(this.run, "drone")) return;
    const d = dronePosition(this.run);
    const bob = Math.sin(this.time.now / 180) * 1.5;
    g.fillStyle(WEAPON_INK.drone, 0.25);
    g.fillEllipse(d.x, d.y + 9, 16, 4);
    g.fillStyle(0xd6ffe6, 1);
    g.fillCircle(d.x, d.y - 2 + bob, 5);
    g.fillStyle(WEAPON_INK.drone, 1);
    g.fillEllipse(d.x, d.y + 1 + bob, 22, 7);
    g.fillStyle(INK.ground, 1);
    g.fillCircle(d.x, d.y - 3 + bob, 1.6);
  }

  /**
   * The minimap (the operator took it with the build, 2026-09-14): the world,
   * the view, the robot, every shape and the golem, top-right under the score.
   *
   * Sized in CSS pixels and converted to arena units here, because the HUD's
   * score block is DOM and sized in CSS pixels - a minimap sized in units would
   * slide under the score on one screen and float away from it on another.
   */
  private drawMinimap(g: Phaser.GameObjects.Graphics, cam: { x: number; y: number }) {
    const cssPerUnit = this.scale.displaySize.width / this.arena.w || 1;
    const wide = this.arena.w > this.arena.h;
    const size = (wide ? 104 : 72) / cssPerUnit;
    const top = (wide ? 122 : 118) / cssPerUnit;
    const right = 14 / cssPerUnit;
    const world = this.run.world;
    // Keep the world's shape inside a square box.
    const k = Math.min(size / world.w, size / world.h);
    const mw = world.w * k;
    const mh = world.h * k;
    const x0 = this.arena.w - right - size + (size - mw) / 2;
    const y0 = top + (size - mh) / 2;

    g.fillStyle(INK.ground, 0.82);
    g.fillRoundedRect(x0 - 3, y0 - 3, mw + 6, mh + 6, 4);
    g.lineStyle(1, SCENERY.stripe, 0.9);
    g.strokeRect(x0, y0, mw, mh);
    g.fillStyle(ENEMY_INK.runner, 0.85);
    for (const e of this.run.enemies) {
      if (e.id === this.run.boss) continue;
      g.fillRect(x0 + e.x * k - 1, y0 + e.y * k - 1, 2, 2);
    }
    const boss = bossOf(this.run);
    if (boss) {
      g.fillStyle(ENEMY_INK[boss.kind], 1);
      g.fillCircle(x0 + boss.x * k, y0 + boss.y * k, 3);
    }
    g.lineStyle(1, 0xffffff, 0.9);
    g.strokeRect(x0 + cam.x * k, y0 + cam.y * k, this.arena.w * k, this.arena.h * k);
    g.fillStyle(WEAPON_INK.bolt, 1);
    g.fillCircle(x0 + this.run.x * k, y0 + this.run.y * k, 2.2);
  }
}
