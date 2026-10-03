// THE TWO WEAPONS THAT THROW NOTHING, added 2026-10-02 with the six-slot run
// (operator ruling "ack B", off the drawn weapon pictures):
//
//   HALO   a glowing ring around the robot that hurts any shape touching it.
//          Super BARRIER (Halo + Shield): the ring nearly doubles and throws a
//          shape back when it cuts it.
//   ZAP    lightning drops on shapes in sight, on its own clock.
//          Super THUNDERHEAD (Zap + Range): five strikes, each with a blast.
//
// (The other two new weapons, FLASK and BOUNCER, throw things, so they live in
// weapons.ts beside the bolt and reuse the nova's fire and the storm's chain.)
//
// PURE: no DOM, no Phaser. The kill itself is the caller's - `hurt` is
// logic.ts `damage`, so a shape killed by lightning pays out exactly like one
// killed by a bolt, which is the rule that file states for every weapon.

import type { Enemy, RunState, Slot } from "./types";
import { radiusOf } from "./enemies";
import { areaOf, sightRange } from "./upgrades";
import { dist2 } from "./world";

export type Hurt = (e: Enemy, dmg: number) => void;

/**
 * The halo: its reach, and its PULSE against the run's own fire clock. A pulse,
 * not a per-shape cooldown: with one, every 1-health shape died the moment it
 * entered the ring, so a robot standing still was untouchable and won the first
 * city level by doing nothing (career-pacing.test.ts, 2026-10-02). Between
 * pulses a shape can slip through, the way a forcefield works.
 */
export const HALO = { r: 52, every: 1.4 } as const;
/** The barrier: a wider ring, and how far it throws what it cuts. Never the boss. */
export const BARRIER = { r: 104, push: 34 } as const;

/** Zap: strikes per round and its pace against the run's own fire clock. */
export const ZAP = { strikes: 1, every: 1.2 } as const;
/** Thunderhead: more strikes, a blast around each. */
export const THUNDER = { strikes: 4, splash: 34, every: 1.2 } as const;

/** How far the halo reaches, evolved or not - the scene draws this same number. */
export const haloReach = (evolved: boolean, s?: Parameters<typeof areaOf>[0]): number => (evolved ? BARRIER.r : HALO.r) * (s ? areaOf(s) : 1);

/**
 * One PULSE of the halo: every shape inside the ring is hurt once. Called on the
 * slot's clock (logic.ts), and it always reports a pulse - even with nobody in
 * the ring - so the beat is steady rather than firing the instant a shape
 * steps in, which would bring back the untouchable statue.
 */
export function pulseHalo(s: RunState, slot: Slot, dmg: number, hurt: Hurt): true {
  const reach = haloReach(!!slot.evolved, s);
  for (const e of s.enemies) {
    if (e.hp <= 0) continue;
    const r = reach + radiusOf(e);
    if (dist2(s.x, s.y, e.x, e.y) > r * r) continue;
    hurt(e, dmg);
    if (slot.evolved && e.hp > 0 && e.id !== s.boss) {
      const d = Math.hypot(e.x - s.x, e.y - s.y) || 1;
      e.x += ((e.x - s.x) / d) * BARRIER.push;
      e.y += ((e.y - s.y) / d) * BARRIER.push;
    }
  }
  s.events.push({ type: "halo", x: s.x, y: s.y, big: !!slot.evolved });
  return true;
}

/**
 * One round of lightning: `strikes` shapes picked at random among those in sight,
 * each hit once. Thunderhead adds a blast that hurts every other shape near a
 * strike. Returns false when nothing is in sight, so the slot holds its clock at
 * zero rather than banking strikes - the same rule every gun follows.
 */
export function zapSlot(s: RunState, slot: Slot, dmg: number, rng: () => number, hurt: Hurt): boolean {
  const sight = sightRange(s) ** 2;
  const live = s.enemies.filter((e) => e.hp > 0 && dist2(s.x, s.y, e.x, e.y) <= sight);
  if (live.length === 0) return false;
  const big = !!slot.evolved;
  const n = Math.min(live.length, big ? THUNDER.strikes : ZAP.strikes);
  for (let i = 0; i < n; i++) {
    const e = live.splice(Math.floor(rng() * live.length), 1)[0]!;
    s.events.push({ type: "zap", x: e.x, y: e.y, big });
    hurt(e, dmg);
    if (!big) continue;
    for (const o of s.enemies) {
      if (o === e || o.hp <= 0) continue;
      const r = THUNDER.splash * areaOf(s) + radiusOf(o);
      if (dist2(e.x, e.y, o.x, o.y) <= r * r) hurt(o, dmg);
    }
  }
  return true;
}
