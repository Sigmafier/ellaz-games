// The crowd: the shapes, the clock that sends them, how they chase, and the boss.
//
// The three shapes and the warden are Neon Survival's cast, so their sizes
// match the sprites that game already sized - but their NUMBERS are this game's
// own, because a crowd you trap is a different crowd from one you shoot.

import { isLeftBehind, spawnPoint } from "../survivors/world";
import type { Foe, Kind, LevelKey, Run } from "./types";

/** r = hit radius, speed = units/s, hp = loops to crush, gems = what it drops. */
export const KINDS: Record<Kind, { r: number; speed: number; hp: number; gems: number }> = {
  runner: { r: 9, speed: 62, hp: 1, gems: 1 },
  orb: { r: 12, speed: 44, hp: 1, gems: 2 },
  brute: { r: 17, speed: 34, hp: 2, gems: 3 },
  warden: { r: 24, speed: 50, hp: 3, gems: 12 },
};

/**
 * What a level changes: how often a shape comes (from `spawnMs` down to
 * `floorMs` over the stage), how fast they move (`pace`), how many may be on
 * the floor at once, and how long the stage runs before the warden. Never the
 * snake.
 */
export const LEVELS: Record<LevelKey, { spawnMs: number; floorMs: number; stageMs: number; pace: number; cap: number }> = {
  calm: { spawnMs: 1500, floorMs: 800, stageMs: 150_000, pace: 0.85, cap: 22 },
  normal: { spawnMs: 1100, floorMs: 520, stageMs: 180_000, pace: 1, cap: 30 },
  wild: { spawnMs: 850, floorMs: 380, stageMs: 210_000, pace: 1.15, cap: 38 },
};

/** How far into the stage each shape joins, as a fraction of it. */
const JOINS: Record<Exclude<Kind, "warden">, number> = { runner: 0, orb: 0.25, brute: 0.55 };
const WEIGHT: Record<Exclude<Kind, "warden">, number> = { runner: 3, orb: 2, brute: 1 };

/** The warden's lunge: how long, how much faster, how often, from how near. */
const LUNGE = { ms: 600, boost: 2.6, every: 4000, from: 200 };

const progress = (run: Run) => Math.min(1, run.t / LEVELS[run.level].stageMs);

/** The shapes the clock may send right now. Never the warden. */
export function kindsAt(run: Run): Exclude<Kind, "warden">[] {
  const p = progress(run);
  return (Object.keys(JOINS) as Exclude<Kind, "warden">[]).filter((k) => p >= JOINS[k]);
}

/** ms between two shapes: tightening over the stage, eased off for the boss fight. */
export function spawnEvery(run: Run): number {
  const L = LEVELS[run.level];
  const base = L.spawnMs + (L.floorMs - L.spawnMs) * progress(run);
  return run.phase === "boss" ? base * 1.6 : base;
}

export function makeFoe(run: Run, kind: Kind, x: number, y: number): Foe {
  return { id: run.nextId++, kind, x, y, hp: KINDS[kind].hp, hurt: 0, stun: 0, spikeCool: 0, dash: 0, dashCool: LUNGE.every };
}

function pick(run: Run, rng: () => number): Exclude<Kind, "warden"> {
  const kinds = kindsAt(run);
  const total = kinds.reduce((n, k) => n + WEIGHT[k], 0);
  let roll = rng() * total;
  for (const k of kinds) if ((roll -= WEIGHT[k]) < 0) return k;
  return kinds[kinds.length - 1];
}

/** Run the spawn clock: send what is due, up to the level's cap. */
export function tickSpawns(run: Run, dt: number, rng: () => number): void {
  run.spawnIn -= dt;
  const cap = LEVELS[run.level].cap;
  while (run.spawnIn <= 0) {
    run.spawnIn += spawnEvery(run);
    if (run.foes.filter((f) => f.kind !== "warden").length >= cap) continue;
    const kind = pick(run, rng);
    const at = spawnPoint(rng, run);
    run.foes.push(makeFoe(run, kind, at.x, at.y));
  }
}

/** The stage clock ran out: the warden comes. */
export function startBoss(run: Run, rng: () => number): void {
  run.phase = "boss";
  const at = spawnPoint(rng, run);
  run.foes.push(makeFoe(run, "warden", at.x, at.y));
  run.events.push({ k: "boss" });
}

/**
 * Every shape walks at the head. A stunned one stands; one left a whole view
 * behind is walked back in from the edge, or the cap fills with shapes that
 * never arrive (Neon Survival measured exactly that on its big map).
 */
export function moveFoes(run: Run, dt: number, rng: () => number): void {
  const pace = LEVELS[run.level].pace;
  for (const f of run.foes) {
    f.hurt = Math.max(0, f.hurt - dt);
    f.spikeCool = Math.max(0, f.spikeCool - dt);
    if (f.stun > 0) {
      f.stun = Math.max(0, f.stun - dt);
      continue;
    }
    if (isLeftBehind(run, f.x, f.y)) {
      const at = spawnPoint(rng, run);
      f.x = at.x;
      f.y = at.y;
      continue;
    }
    const dx = run.x - f.x;
    const dy = run.y - f.y;
    const d = Math.hypot(dx, dy) || 1;
    if (f.kind === "warden") lunge(run, f, d, dt);
    const v = (KINDS[f.kind].speed * pace * (f.dash > 0 ? LUNGE.boost : 1) * dt) / 1000;
    f.x += (dx / d) * Math.min(v, d);
    f.y += (dy / d) * Math.min(v, d);
  }
  separate(run);
}

function lunge(run: Run, f: Foe, d: number, dt: number): void {
  f.dash = Math.max(0, f.dash - dt);
  f.dashCool = Math.max(0, f.dashCool - dt);
  if (f.dashCool === 0 && d < LUNGE.from) {
    f.dash = LUNGE.ms;
    f.dashCool = LUNGE.every;
    run.events.push({ k: "lunge" });
  }
}

/** Shapes do not stack on one another: overlapping pairs are eased apart. */
function separate(run: Run): void {
  const fs = run.foes;
  for (let i = 0; i < fs.length; i++) {
    for (let j = i + 1; j < fs.length; j++) {
      const a = fs[i];
      const b = fs[j];
      const min = (KINDS[a.kind].r + KINDS[b.kind].r) * 0.9;
      const dx = b.x - a.x;
      const dy = b.y - a.y;
      const d2 = dx * dx + dy * dy;
      if (d2 >= min * min || d2 === 0) continue;
      const d = Math.sqrt(d2);
      const push = (min - d) / 2;
      a.x -= (dx / d) * push;
      a.y -= (dy / d) * push;
      b.x += (dx / d) * push;
      b.y += (dy / d) * push;
    }
  }
}
