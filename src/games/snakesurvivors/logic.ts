// Snake Survivors' rules: a new run, one step of it, and taking a card.
//
// Pure - no DOM, no Phaser - and every random draw comes from the `rng` a
// caller hands in, so the same seed and the same hands play the same run.
//
// THE GAME IN ONE SENTENCE: close a loop with your body and every shape inside
// it is crushed. The tail is your health - a shape reaching your head costs one
// segment - and the gems the crushed shapes drop grow it back.

import { inView, worldFor } from "../survivors/world";
import {
  BODY_R, HEAD_R, HIT_COST, MIN_LEN, SEG, SPACING, START_LEN,
  advance, centreOf, findLoop, findTailLoop, inside, maxLenOf, trimTrail,
} from "./body";
import {
  CHAIN_RANGE, FROST_MS, HOLE, NOVA_EVERY, SPIT, TAIL_COOL_MS, applyCard, biteOf, chainOf, noneTaken, nextGoldDry, offerCards,
  pullOf, regrowEvery, shieldEvery, shockOf, spikeEvery, spitEvery,
} from "./cards";
import { BONUS_GEM, crushFx } from "./crushFx";
import {
  KINDS, SAFE_START_MS, SHOT, STAGE_BREATHER_MS, hitCost, isBoss, moveFoes, startBoss, tickMini, tickSpawns, wardenMayCome,
} from "./crowd";
import { gemReach, mergeGems } from "./merge";
import { FLOOR_GEMS, tickFloorGems } from "./floor";
// THE CAREER (snake career, 2026-10-03): every call below sits behind `if (run.career)`.
import { careerBonusHit, careerBossDown, careerCoins, careerEnd, careerLoot, careerPull, careerShield, careerTick } from "./careerHooks";
import type { Arena, CardId, Foe, LevelKey, Pt, Run, Stage, Steer } from "./types";

export type { Arena, CardId, Foe, LevelKey, Run, Stage, Steer } from "./types";

/** The view on a phone and on a PC: two shapes of the same area, Neon Survival's pair. */
export const ARENA: Arena = { w: 420, h: 560 };
export const ARENA_WIDE: Arena = { w: 648, h: 364 };

/**
 * ms of safety after a hit, so one crowd cannot take the whole tail at once. The
 * same on every level: the 2026-10-01 hardening tried 1.0 s on normal and wild,
 * and the operator ruled on 2026-10-02 to keep 1.4 s (see `HARDER` in tuning.ts).
 */
export const BLINK_MS = 1400;
/** ms after a crush before another may land - one closing is one crush. */
export const LOOP_COOL_MS = 700;
/** What one BLUE gem grows the snake by, in segments; a red is two, a yellow three. */
export const GROW = 1 / 3;
/** How close a gem must come to the head to be collected (a fused gem reaches further, `gemReach`). */
export const PICKUP = 16;
/** How fast a magnet pulls a gem, units/s. */
const PULL_SPEED = 240;

/**
 * How many hits the tail can still take, the one that ends the run included -
 * the number the HUD draws as hearts. Derived from the same two constants the
 * hit uses, so the hearts cannot disagree with the rule that empties them.
 * `cost` is what one bump costs right now (`hitCost`: half a heart on normal and wild, from a fifth into stage 2).
 */
export const hitsLeft = (len: number, cost = HIT_COST) => Math.max(1, Math.ceil((Math.floor(len) - MIN_LEN + 1) / cost));

/**
 * Gems to the next level: 7, 9, 15, 25, 39, 57, ... Round four made it grow
 * with the SQUARE of the level (it was 4 + 3 x level: 7, 10, 13), because a run
 * is now minutes of a real crowd - hundreds of crushes - and the old line gave
 * the looping bot 20 to 30 cards a run. Measured with this curve: 11 to 16 on
 * the phone, 5 to 12 on the PC (`pacing.test.ts`). The first level costs what
 * it always did, so floor gems still bring a new player's first card inside
 * half a minute.
 */
export const needFor = (lv: number) => 7 + 2 * (lv - 1) ** 2;

export function newRun(level: LevelKey, arena: Arena = ARENA, rng: () => number = Math.random): Run {
  const world = worldFor(arena);
  const x = world.w / 2;
  const y = world.h / 2;
  const n = Math.ceil((START_LEN * SEG) / SPACING);
  return {
    level, arena, world, x, y,
    heading: 0,
    path: Array.from({ length: n }, (_, i) => ({ x: x - (i + 1) * SPACING, y })),
    len: START_LEN,
    peak: START_LEN,
    foes: [], gems: [], nextId: 1,
    t: 0,
    // A first shape a second or so in, jittered so two runs do not open alike.
    spawnIn: 900 + rng() * 600,
    floorIn: FLOOR_GEMS.firstMs,
    calmMs: SAFE_START_MS,
    xp: 0, need: needFor(1), lv: 1,
    choosing: null,
    taken: noneTaken(),
    goldDry: 0,
    blink: 0, loopCool: 0, regrowAt: 0,
    shots: [], bolts: [], spitIn: 0, shieldIn: 0,
    loopsCaught: 0, vortices: [], tailCool: 0,
    crushed: 0,
    phase: "stage",
    stage: 1,
    mini: 0,
    events: [],
  };
}

/** One step of play. Mutates and returns the run; does nothing once it is over or while a card is up. */
export function step(run: Run, dt: number, steer: Steer, rng: () => number = Math.random): Run {
  run.events = [];
  if (run.phase === "dead" || run.phase === "won" || run.choosing) return run;
  run.t += dt;
  run.blink = Math.max(0, run.blink - dt);
  run.loopCool = Math.max(0, run.loopCool - dt);
  run.tailCool = Math.max(0, run.tailCool - dt);
  tickVortices(run, dt);
  regrow(run, dt);
  run.shieldIn = Math.max(0, run.shieldIn - dt);

  advance(run, dt, steer);
  if (run.career) careerTick(run, dt);
  else {
    if (wardenMayCome(run)) startBoss(run, rng);
    tickMini(run, rng);
  }
  tickSpawns(run, dt, rng);
  tickFloorGems(run, dt, rng);
  moveFoes(run, dt, rng);
  bodyContacts(run, rng);
  spit(run, dt, rng);
  if (run.loopCool === 0) {
    const loop = findLoop(run);
    if (loop) crush(run, loop, rng, "head");
  }
  if (run.tailCool === 0) {
    const loop = findTailLoop(run);
    if (loop) crush(run, loop, rng, "tail");
  }
  headContacts(run, rng);
  bolts(run, dt);
  collectGems(run, dt, rng);

  // A career level ends on its crush target, or brings its boss (`careerHooks.ts`).
  if (run.career) careerEnd(run, rng);
  // Read afresh: a crush or a bite above may have just won the run.
  if ((run.phase as Run["phase"]) !== "won" && run.len < MIN_LEN) {
    run.phase = "dead";
    run.events.push({ k: "dead" });
  }
  return run;
}

/** Take one of the cards on offer. Anything not on offer is ignored. */
export function pickCard(run: Run, id: CardId): void {
  if (!run.choosing?.includes(id)) return;
  applyCard(run, id);
  run.choosing = null;
}

function grow(run: Run, by: number): void {
  run.len = Math.min(maxLenOf(run), run.len + by);
  run.peak = Math.max(run.peak, Math.floor(run.len));
}

function regrow(run: Run, dt: number): void {
  const every = regrowEvery(run);
  if (!Number.isFinite(every)) return;
  run.regrowAt += dt;
  if (run.regrowAt < every) return;
  run.regrowAt -= every;
  grow(run, 1);
}

/** Take one hit off a shape; a shape at zero is killed. */
function wound(run: Run, f: Foe, rng: () => number): void {
  f.hp -= 1;
  f.hurt = 250;
  if (f.hp <= 0) kill(run, f, rng);
  else run.events.push({ k: "hurt", kind: f.kind, x: f.x, y: f.y });
}

/**
 * A warden falling either OPENS the next stage or WINS the run (round four,
 * operator ruling: "three stages, three bosses, then win"). Opening a stage
 * hands the crowd back to `bossDue` - stage 1's own path, just with a higher
 * `run.stage` reading a tougher trigger - and grants a breather
 * (`STAGE_BREATHER_MS`) the same way the run's own start does.
 */
function nextStage(run: Run): void {
  if (run.stage < 3) {
    run.stage = (run.stage + 1) as Stage;
    run.phase = "stage";
    run.calmMs = Math.max(run.calmMs, run.t + STAGE_BREATHER_MS);
    run.events.push({ k: "stage", stage: run.stage });
  } else {
    run.phase = "won";
    run.events.push({ k: "won" });
  }
}

function kill(run: Run, f: Foe, rng: () => number): void {
  run.foes = run.foes.filter((o) => o !== f);
  run.crushed += 1;
  for (const v of KINDS[f.kind].drops) {
    run.gems.push({ x: f.x + (rng() - 0.5) * 14, y: f.y + (rng() - 0.5) * 14, v });
  }
  run.events.push({ k: "ko", kind: f.kind, x: f.x, y: f.y, form: f.form });
  if (run.career) careerLoot(run, f);
  if (f.kind === "warden") (run.career ? careerBossDown(run) : nextStage(run));
}


/**
 * THE LOOP. Every shape whose centre is inside takes one hit - a runner or an
 * orb dies, a brute needs two loops, the warden three. With the shockwave card
 * the shapes just outside are thrown back and stunned.
 *
 * Round four adds what a crush can set off: a bonus gem for a big catch
 * (`crushFx`), Chain Crush's zaps, a Black Hole where it closed, and Nova on
 * every fifth loop that caught something. `by` says which end closed it - the
 * head, or the tail with Twin Head - and each end has its own cooldown.
 */
function crush(run: Run, poly: Pt[], rng: () => number, by: "head" | "tail"): void {
  if (by === "head") run.loopCool = LOOP_COOL_MS;
  else run.tailCool = TAIL_COOL_MS;
  const caught = run.foes.filter((f) => inside(poly, f.x, f.y));
  if (!caught.length) return;
  const c = centreOf(poly);
  const report = caught.map((f) => ({ kind: f.kind, x: f.x, y: f.y }));
  for (const f of caught) {
    if (isBoss(f.kind)) {
      f.stun = 900;
      run.events.push({ k: "bosshit", x: f.x, y: f.y });
    }
    wound(run, f, rng);
    // A career's crush power: a survivor may owe a second hit (`careerBonusHit`).
    if (run.career && careerBonusHit(run, f)) wound(run, f, rng);
  }
  // Only a loop that CAUGHT something throws the rest back. Firing on every
  // closing held the whole crowd off for ever (see the shockwave tests).
  const reach = shockOf(run);
  if (reach) {
    for (const f of run.foes) {
      if (caught.includes(f)) continue;
      const d = Math.hypot(f.x - c.x, f.y - c.y);
      if (d === 0 || d > reach) continue;
      f.x += ((f.x - c.x) / d) * 50;
      f.y += ((f.y - c.y) / d) * 50;
      f.stun = Math.max(f.stun, 600);
    }
  }
  const fx = crushFx(caught.length, false);
  if (fx.bonusGem) run.gems.push({ x: c.x, y: c.y, v: BONUS_GEM });
  run.events.push({ k: "crush", n: caught.length, x: c.x, y: c.y, poly, caught: report, bonus: fx.bonusGem, by });
  chainZap(run, poly, c, rng);
  if (run.taken.blackHole) {
    run.vortices.push({ x: c.x, y: c.y, life: HOLE.ms });
    run.events.push({ k: "vortex", x: c.x, y: c.y });
  }
  run.loopsCaught += 1;
  if (run.taken.nova && run.loopsCaught % NOVA_EVERY === 0) nova(run, rng);
}

/** CHAIN CRUSH: the nearest shapes OUTSIDE the loop take one hit each. Never the warden. */
function chainZap(run: Run, poly: Pt[], c: Pt, rng: () => number): void {
  const n = chainOf(run);
  if (!n) return;
  const near = run.foes
    .filter((f) => !isBoss(f.kind) && !inside(poly, f.x, f.y))
    .map((f) => ({ f, d: Math.hypot(f.x - c.x, f.y - c.y) }))
    .filter((o) => o.d <= CHAIN_RANGE)
    .sort((a, b) => a.d - b.d)
    .slice(0, n);
  for (const { f } of near) {
    run.events.push({ k: "zap", x0: c.x, y0: c.y, x1: f.x, y1: f.y });
    wound(run, f, rng);
  }
}

/** NOVA: every non-boss shape in view is cleared at once - killed, gems and all. */
function nova(run: Run, rng: () => number): void {
  const gone = run.foes.filter((f) => !isBoss(f.kind) && inView(run, f.x, f.y));
  for (const f of gone) kill(run, f, rng);
  run.events.push({ k: "nova", x: run.x, y: run.y, n: gone.length });
}

/** BLACK HOLE: an open vortex pulls the shapes near it in, then closes. */
function tickVortices(run: Run, dt: number): void {
  if (!run.vortices.length) return;
  const sec = dt / 1000;
  for (const v of run.vortices) {
    v.life -= dt;
    for (const f of run.foes) {
      if (isBoss(f.kind)) continue;
      const dx = v.x - f.x;
      const dy = v.y - f.y;
      const d = Math.hypot(dx, dy);
      if (d < 4 || d > HOLE.reach) continue;
      const pull = Math.min(d - 3, HOLE.pull * sec);
      f.x += (dx / d) * pull;
      f.y += (dy / d) * pull;
    }
  }
  run.vortices = run.vortices.filter((v) => v.life > 0);
}

/**
 * A shape touching the body. The body is NOT a wall: shapes cross it freely,
 * and that is what makes the game work. A crowd chasing a head that circles
 * faster than it can run falls INSIDE the circle (pure pursuit settles on a
 * smaller circle within), so closing the loop catches it. The first build
 * pushed shapes out of the body and was measured catching nothing: 626 loops
 * closed in 25 seconds with zero shapes inside any of them. With spikes, the
 * touch hurts.
 */
function bodyContacts(run: Run, rng: () => number): void {
  const every = spikeEvery(run);
  const spikes = Number.isFinite(every);
  const frost = run.taken.frost > 0;
  if (!spikes && !frost) return;
  for (const f of [...run.foes]) {
    if (isBoss(f.kind)) continue;
    if (!frost && f.spikeCool > 0) continue;
    const r2 = (KINDS[f.kind].r + BODY_R) ** 2;
    if (!run.path.some((p, i) => i >= 3 && (f.x - p.x) ** 2 + (f.y - p.y) ** 2 < r2)) continue;
    // FROST TRAIL (round four): a touch slows the shape for a while.
    if (frost) f.slow = FROST_MS;
    if (!spikes || f.spikeCool > 0) continue;
    f.spikeCool = every;
    run.events.push({ k: "spike", x: f.x, y: f.y });
    wound(run, f, rng);
  }
}

/** A shape at the head: bitten if the fangs are strong enough, otherwise a hit. */
function headContacts(run: Run, rng: () => number): void {
  for (const f of [...run.foes]) {
    const r = HEAD_R + KINDS[f.kind].r;
    const dx = f.x - run.x;
    const dy = f.y - run.y;
    if (dx * dx + dy * dy >= r * r) continue;
    if (!isBoss(f.kind) && biteOf(run) >= KINDS[f.kind].hp) {
      run.events.push({ k: "bite", x: f.x, y: f.y });
      kill(run, f, rng);
      continue;
    }
    if (run.blink > 0) continue;
    takeHit(run, f.kind, f.x, f.y);
    const d = Math.hypot(dx, dy) || 1;
    f.x += (dx / d) * 30;
    f.y += (dy / d) * 30;
    f.stun = Math.max(f.stun, 400);
  }
}

/**
 * One bump to the head, from a shape or a bolt: the blink starts, and the
 * Shield takes it if it is ready, otherwise it costs `hitCost` segments -
 * half a heart on normal and wild, from a fifth into stage 2 since round eight, today's `biteCost` on calm.
 */
function takeHit(run: Run, kind: Foe["kind"], x: number, y: number): void {
  run.blink = BLINK_MS;
  if (run.taken.shield && run.shieldIn === 0) {
    // The Shield takes this one: no segment, and it recharges.
    run.shieldIn = shieldEvery(run);
    run.events.push({ k: "shield" });
  } else if (run.career && careerShield(run)) {
    // The shop's shield: this one bump is free, once a level.
    run.events.push({ k: "shield" });
  } else {
    run.len = Math.max(0, run.len - hitCost(run));
    run.events.push({ k: "hit", kind, x, y });
    trimTrail(run);
  }
}

/**
 * THE SHOOTERS' BOLTS (R4.5): they fly straight, pass over the body, and a
 * bolt reaching the HEAD is a hit like a bump - unless the head is blinking.
 */
function bolts(run: Run, dt: number): void {
  if (!run.bolts.length) return;
  const sec = dt / 1000;
  const r2 = (HEAD_R + SHOT.r) ** 2;
  const flying = [];
  for (const b of run.bolts) {
    b.x += b.vx * sec;
    b.y += b.vy * sec;
    b.life -= dt;
    if ((b.x - run.x) ** 2 + (b.y - run.y) ** 2 < r2) {
      if (run.blink === 0) takeHit(run, "shooter", b.x, b.y);
      continue;
    }
    if (b.life > 0) flying.push(b);
  }
  run.bolts = flying;
}

/**
 * SPIT: every `spitEvery` a shot leaves the mouth at the nearest shape within
 * `SPIT.range` - never the warden, whose fight stays a loop fight - and the
 * first shape it meets takes one hit, the same hit a loop gives. A waiting shot
 * is held until there is something to shoot, so it fires the moment a shape
 * comes in range.
 */
function spit(run: Run, dt: number, rng: () => number): void {
  const every = spitEvery(run);
  if (Number.isFinite(every)) {
    run.spitIn = Math.max(0, run.spitIn - dt);
    if (run.spitIn === 0) {
      let target: Foe | null = null;
      let best = SPIT.range * SPIT.range;
      for (const f of run.foes) {
        if (isBoss(f.kind)) continue;
        const d2 = (f.x - run.x) ** 2 + (f.y - run.y) ** 2;
        if (d2 < best) (best = d2), (target = f);
      }
      if (target) {
        const d = Math.sqrt(best) || 1;
        const vx = ((target.x - run.x) / d) * SPIT.speed;
        const vy = ((target.y - run.y) / d) * SPIT.speed;
        run.shots.push({ x: run.x, y: run.y, vx, vy, life: SPIT.lifeMs });
        run.spitIn = every;
        run.events.push({ k: "spit", x: run.x, y: run.y });
      }
    }
  }
  const sec = dt / 1000;
  const flying = [];
  for (const s of run.shots) {
    s.x += s.vx * sec;
    s.y += s.vy * sec;
    s.life -= dt;
    const hit = run.foes.find((f) => !isBoss(f.kind) && (f.x - s.x) ** 2 + (f.y - s.y) ** 2 < (KINDS[f.kind].r + 4) ** 2);
    if (hit) wound(run, hit, rng);
    else if (s.life > 0) flying.push(s);
  }
  run.shots = flying;
}

/** How near the head a gem is the magnet's or the pickup's, and so never merged. */
export const mergeGuard = (run: Run) => Math.max(pullOf(run), 2 * PICKUP);

function collectGems(run: Run, dt: number, rng: () => number): void {
  const pull = run.career ? careerPull(run, pullOf(run)) : pullOf(run);
  // GEM MERGE (the `doubleGems` card since 2026-10-01): gems near each other
  // slide together and fuse, worth the sum (`merge.ts`). Gems the magnet or the
  // pickup already has are left alone.
  if (run.taken.doubleGems) run.gems = mergeGems(run.gems, run, mergeGuard(run), dt);
  const kept = [];
  for (const g of run.gems) {
    const dx = run.x - g.x;
    const dy = run.y - g.y;
    const d = Math.hypot(dx, dy);
    if (d < PICKUP * gemReach(g.v)) {
      const v = g.v;
      run.xp += v;
      grow(run, v * GROW);
      run.events.push({ k: "gem" });
      continue;
    }
    if (pull && d < pull) {
      const v = Math.min(d, (PULL_SPEED * dt) / 1000);
      g.x += (dx / d) * v;
      g.y += (dy / d) * v;
    }
    kept.push(g);
  }
  run.gems = kept;
  if (run.career) careerCoins(run, pull, dt);
  if (run.xp >= run.need && !run.choosing) {
    run.xp -= run.need;
    run.lv += 1;
    run.need = needFor(run.lv);
    const offer = offerCards(run, rng);
    run.goldDry = nextGoldDry(run.goldDry, offer);
    run.choosing = offer.length ? offer : null;
    run.events.push({ k: "level" });
  }
}

