// The weapon slots, and where the two weapons that are not projectiles stand.
//
// Operator ruling 2026-09-14: pick one of three on the entrance, carry up to
// four, and new weapons arrive as level-up cards. Orbiting blades and a helper
// drone are WEAPONS, so they take a slot - five exist, four fit, and one never
// makes it into a given run.
//
// Types only from `logic.ts`, so there is no import cycle. The scene reads the
// geometry below to draw exactly where the simulation hits.

import type { RunState, WeaponId } from "./types";
import { SAW_REACH } from "./evolve";

/** How many weapons a run can carry. */
export const SLOTS_MAX = 4;

/** The three a run can START with - the ones on the entrance screen. */
export const STARTERS = ["bolt", "arc", "burst"] as const satisfies readonly WeaponId[];
export type StarterId = (typeof STARTERS)[number];

/** Every weapon a level-up can offer, in the order the art and the words list them. */
export const POOL: readonly WeaponId[] = ["bolt", "arc", "burst", "blades", "drone"];

/**
 * A stored starting weapon, validated rather than trusted. Anything that is not
 * one of the three reads as never chosen - the same discipline the stick style
 * and `session.ts` apply to a value this app did not write this session.
 */
export const asStarter = (v: unknown): StarterId =>
  (STARTERS as readonly unknown[]).includes(v) ? (v as StarterId) : "bolt";

/**
 * The blades. They never fire: they turn around the robot and cut whatever they
 * touch, and each shape can be cut by them at most once per `hitMs`, or a brute
 * standing in the ring would lose all its health in the frames it overlaps.
 */
export const BLADES = { count: 3, radius: 44, spin: 3.2, r: 9, hitMs: 420 } as const;

/** The drone circles slowly at the robot's shoulder and shoots from where IT is. */
export const DRONE = { radius: 34, spin: 1.1 } as const;

export const holds = (s: Pick<RunState, "slots">, id: WeaponId): boolean => s.slots.some((k) => k.id === id);

/**
 * Where each blade is, in world units. `spread` adds a blade rather than fanning
 * a shot, because a ring has no fan - the same reading the burst already gives it.
 */
/**
 * How far the blades ride from the robot right now.
 *
 * A fixed radius for the ordinary blades; for a SAWSTORM it BREATHES - out to
 * `BLADES.radius + SAW_REACH` and back, once per turn of the ring. Derived from
 * `bladeAngle` rather than from a second clock, because a second clock is a
 * second record of where the ring is in its cycle and the two would drift the
 * first time one was updated and the other was not.
 *
 * `(1 - cos) / 2` runs 0 -> 1 -> 0 over one full turn with no discontinuity at
 * the wrap, which a sawtooth on the raw angle would have: the blades would snap
 * back to the robot every two seconds instead of returning to it.
 */
export function bladeReach(s: Pick<RunState, "bladeAngle">, evolved: boolean): number {
  if (!evolved) return BLADES.radius;
  return BLADES.radius + (SAW_REACH * (1 - Math.cos(s.bladeAngle))) / 2;
}

/**
 * Has this run's blades evolved into a SAWSTORM?
 *
 * Read off the run rather than passed in, and that is the whole point of it
 * existing. Both the simulation and the scene need the blades' reach, and while
 * `evolved` was a parameter the scene was passing nothing - so a sawstorm CUT at
 * its breathing reach and was DRAWN at the fixed one. Nothing in this repo can
 * drive a Phaser scene, so no test could have seen it. One function that reads
 * the answer for itself cannot be handed the wrong flag.
 */
export const bladesEvolved = (s: Pick<RunState, "slots">): boolean =>
  s.slots.some((k) => k.id === "blades" && k.evolved === true);

export function bladePositions(
  s: Pick<RunState, "x" | "y" | "bladeAngle" | "up" | "slots">,
): { x: number; y: number; a: number }[] {
  const evolved = bladesEvolved(s);
  const n = BLADES.count + s.up.spread;
  const reach = bladeReach(s, evolved);
  const out: { x: number; y: number; a: number }[] = [];
  for (let i = 0; i < n; i++) {
    const a = s.bladeAngle + (i / n) * Math.PI * 2;
    out.push({ x: s.x + Math.cos(a) * reach, y: s.y + Math.sin(a) * reach, a });
  }
  return out;
}

export function dronePosition(s: Pick<RunState, "x" | "y" | "droneAngle">): { x: number; y: number } {
  return { x: s.x + Math.cos(s.droneAngle) * DRONE.radius, y: s.y + Math.sin(s.droneAngle) * DRONE.radius };
}

/**
 * Where all of this run's drones are - one, or three once the drone has evolved
 * into the SWARM.
 *
 * Spread evenly around the same circle rather than bunched, so three drones read
 * as three sources covering three sides rather than as one drone drawn thicker.
 * That distinction is the rule this repo learned the hard way: a distinct power
 * gets its own MOTION, never one shape resized.
 */
export function dronePositions(s: Pick<RunState, "x" | "y" | "droneAngle">, n: number): { x: number; y: number }[] {
  const out: { x: number; y: number }[] = [];
  for (let i = 0; i < n; i++) {
    const a = s.droneAngle + (i / n) * Math.PI * 2;
    out.push({ x: s.x + Math.cos(a) * DRONE.radius, y: s.y + Math.sin(a) * DRONE.radius });
  }
  return out;
}
