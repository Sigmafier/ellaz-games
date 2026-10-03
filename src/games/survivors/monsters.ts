// FOUR NEW MONSTERS (operator ruling 2026-10-03, "4 monsters + 3 powers"), every
// one drawn from a sheet the game already ships - no new art, no new bytes of
// picture:
//
//   SPLITTER  slime sheet. When it dies it splits into two BLOBS - small, quick,
//             one hit each - where it stood. A kill that leaves a mess.     FROST
//   CHARGER   bat sheet. In range it stops and WINDS UP - the same glowing
//             telegraph a shooter gives - then dashes along the line it locked
//             when the wind-up began. It never turns mid-dash, so stepping off
//             the line is the whole answer.                                   FROST
//   BOMBER    crab sheet. Up close it lights a FUSE and stands still; when the
//             fuse is out it bursts into a ring of shots and is gone - no gem for
//             a bang. Shot down first, it pays like any shape.                LAVA
//   HORDE     not a shape, a pattern: eight runners appear in a ring around the
//             robot on lava's own clock, so a kiting thumb gets surrounded.   LAVA
//
// THE QUICK RUN NEVER MEETS ANY OF THEM. None is in `STAGES` or `SHOOTERS`, and the
// horde is a career world's clock - so a calm run's spawner, rng stream and
// fingerprint are what they were (calm-is-untouched.test.ts).
//
// Pure: no DOM, no Phaser.

import type { Enemy, EnemyKind, RunState } from "./types";
import { CAP_ENEMIES, hpOf } from "./enemies";
import { clampToWorld, inView } from "./world";

export const MONSTER_KINDS = ["splitter", "blob", "charger", "bomber"] as const satisfies readonly EnemyKind[];

/** A splitter's death: how many blobs, and how far apart they land. */
export const SPLIT = { n: 2, spread: 9 } as const;
/** The charger: when it commits, how long it warns, how far and fast it goes, how long it rests. */
export const CHARGER = { range: 190, wind: 650, dash: 420, speed: 330, rest: 1800 } as const;
/** The bomber: how close it lights up, how long the fuse burns, and the ring it bursts into. */
export const BOMBER = { reach: 64, fuse: 1100, shots: 8, speed: 120, life: 1500, r: 6 } as const;
/** Lava's horde ring: how often, how many, and how far from the robot it closes. */
export const HORDE = { every: 15_000, count: 8, radius: 170, kind: "runner" } as const;

/** A career shape's health carries its level's multiplier; a quick run's is the row's own. */
const healthOf = (s: RunState, kind: EnemyKind) => hpOf(kind) * (s.career?.hp ?? 1);

/** A splitter died: two blobs where it stood. Any other shape, nothing. */
export function splitOnDeath(s: RunState, e: Enemy): void {
  if (e.kind !== "splitter") return;
  for (let i = 0; i < SPLIT.n; i++) {
    if (s.enemies.length >= CAP_ENEMIES) return;
    const side = i === 0 ? -1 : 1;
    s.enemies.push({ id: s.nextId++, kind: "blob", x: e.x + side * SPLIT.spread, y: e.y + side * SPLIT.spread * 0.5, hp: healthOf(s, "blob"), flash: 0 });
  }
}

function charger(s: RunState, e: Enemy, dt: number, pace: number): boolean {
  if ((e.dash ?? 0) > 0) {
    e.dash = Math.max(0, (e.dash ?? 0) - dt);
    const v = CHARGER.speed * pace * (dt / 1000);
    const p = clampToWorld(s, e.x + (e.dx ?? 0) * v, e.y + (e.dy ?? 0) * v, 0);
    e.x = p.x;
    e.y = p.y;
    if (e.dash === 0) e.chargeCd = CHARGER.rest;
    return true;
  }
  if ((e.wind ?? 0) > 0) {
    e.wind = Math.max(0, (e.wind ?? 0) - dt);
    if (e.wind === 0) e.dash = CHARGER.dash;
    return true;
  }
  if ((e.chargeCd ?? 0) > 0) {
    e.chargeCd = Math.max(0, (e.chargeCd ?? 0) - dt);
    return false;
  }
  const d = Math.hypot(s.x - e.x, s.y - e.y) || 1;
  if (d > CHARGER.range || !inView(s, e.x, e.y)) return false;
  // The line is LOCKED here, at the start of the warning, so what the player sees
  // aimed is exactly where it goes.
  e.wind = CHARGER.wind;
  e.dx = (s.x - e.x) / d;
  e.dy = (s.y - e.y) / d;
  return true;
}

function bomber(s: RunState, e: Enemy, dt: number, cap: number): boolean {
  if ((e.fuse ?? 0) > 0) {
    e.fuse = Math.max(0, (e.fuse ?? 0) - dt);
    if (e.fuse > 0) return true;
    for (let i = 0; i < BOMBER.shots && s.shots.length < cap; i++) {
      const a = (i / BOMBER.shots) * Math.PI * 2;
      s.shots.push({ id: s.nextId++, from: "bomber", x: e.x, y: e.y, vx: Math.cos(a) * BOMBER.speed, vy: Math.sin(a) * BOMBER.speed, life: BOMBER.life, r: BOMBER.r });
    }
    // Gone in its own blast: no `damage`, so no gem and no score - a bang is not a kill.
    e.hp = 0;
    s.events.push({ type: "boom", x: e.x, y: e.y });
    return true;
  }
  if (Math.hypot(s.x - e.x, s.y - e.y) > BOMBER.reach) return false;
  e.fuse = BOMBER.fuse;
  return true;
}

/**
 * The monsters' own moves, called for each shape in `step`'s movement loop. TRUE
 * when this shape's move this frame is handled here (a wind-up, a dash, a lit
 * fuse), so the ordinary walk is skipped; false for every other shape and moment.
 */
export function moveMonster(s: RunState, e: Enemy, dt: number, pace: number, shotCap: number): boolean {
  if (e.kind === "charger") return charger(s, e, dt, pace);
  if (e.kind === "bomber") return bomber(s, e, dt, shotCap);
  return false;
}

/**
 * Lava's HORDE RING, on the world's own clock and only while the swarm runs (no
 * boss, nothing frozen). No rng: the ring's turn comes from the level's age, so a
 * horde never shifts a single draw of the run.
 */
export function tickHorde(s: RunState, dt: number): void {
  const c = s.career;
  if (!c || !Number.isFinite(c.hordeIn) || s.boss !== null || s.frozen > 0) return;
  c.hordeIn -= dt;
  if (c.hordeIn > 0) return;
  c.hordeIn = c.hordeEvery;
  const turn = (c.age / 1000) % (Math.PI * 2);
  let n = 0;
  for (let i = 0; i < HORDE.count && s.enemies.length < CAP_ENEMIES; i++) {
    const a = turn + (i / HORDE.count) * Math.PI * 2;
    const p = clampToWorld(s, s.x + Math.cos(a) * HORDE.radius, s.y + Math.sin(a) * HORDE.radius, 12);
    s.enemies.push({ id: s.nextId++, kind: HORDE.kind, x: p.x, y: p.y, hp: healthOf(s, HORDE.kind), flash: 0 });
    n++;
  }
  if (n > 0) s.events.push({ type: "horde", x: s.x, y: s.y, n });
}
