// MAP PICKUPS (operator ruling 2026-10-02, "ack B"): the three things a
// survivor-like leaves on the floor for you to walk over.
//
//   MAGNET  every gem on the board flies to you
//   BOMB    every ordinary shape in view is blown up; a boss takes a dent
//   FOOD    one heart back
//
// WHERE THEY COME FROM: mostly ELITES (a quarter of them), and very rarely an
// ordinary shape. Decided from the shape's own id - a hash, never an rng draw -
// so adding pickups does not move a single random number the run already
// draws, and the rest of the game plays exactly as it did.
//
// PURE: no DOM, no Phaser. The kills a bomb makes go through the caller's
// `kill` (logic.ts `damage`), so they pay out exactly like any other kill.

import type { Enemy, RunState } from "./types";
import { dist2, inView } from "./world";

export type PickupKind = "magnet" | "bomb" | "food";
export interface Pickup {
  id: number;
  x: number;
  y: number;
  kind: PickupKind;
  /** Time left on the floor before it fades. */
  ms: number;
}

/** The chance a shape drops one: an elite, and an ordinary shape. */
export const DROP = { elite: 0.25, plain: 0.004 } as const;
/** Which one, once something drops. */
const WEIGHT: readonly (readonly [PickupKind, number])[] = [["magnet", 0.45], ["food", 0.35], ["bomb", 0.2]];
/** How close the robot must come to take one. */
export const PICKUP_R = 16;
/** How long a pickup lies on the floor. */
export const PICKUP_MS = 30_000;
/** How long the magnet's pull lasts. */
export const VACUUM_MS = 1600;
/** What a bomb does to a boss - a dent, never a kill. */
export const BOMB_BOSS = 12;

/** A shape's id, hashed to two independent numbers in 0..1. */
function rolls(id: number): [number, number] {
  // Every step ends in `>>> 0`: an XOR returns a SIGNED int, and a negative
  // remainder is below every drop rate - the first version dropped on half of
  // all kills, at a rate of zero.
  let h = Math.imul(id ^ 0x5bd1e995, 0x9e3779b1) >>> 0;
  h = (h ^ (h >>> 15)) >>> 0;
  const a = (h % 10_000) / 10_000;
  h = Math.imul(h ^ (h >>> 13), 0x85ebca6b) >>> 0;
  return [a, (h % 10_000) / 10_000];
}

/** What this shape drops when it dies, if anything. Never a boss: a boss pays a super. */
export function dropFor(e: Pick<Enemy, "id" | "elite">, isBoss: boolean, rate: number = e.elite ? DROP.elite : DROP.plain): PickupKind | null {
  if (isBoss) return null;
  const [chance, which] = rolls(e.id);
  if (chance >= rate) return null;
  let acc = 0;
  for (const [kind, w] of WEIGHT) {
    acc += w;
    if (which < acc) return kind;
  }
  return "magnet";
}

/**
 * One frame of pickups: they age, the ones the robot touches are taken and do
 * their thing, and the magnet's pull counts down.
 */
export function tickPickups(s: RunState, dt: number, playerR: number, kill: (e: Enemy, dmg: number) => void): void {
  if (s.vacuum) s.vacuum = Math.max(0, s.vacuum - dt);
  const list = s.pickups;
  if (!list || list.length === 0) return;
  const reach = (PICKUP_R + playerR) ** 2;
  const keep: Pickup[] = [];
  for (const p of list) {
    p.ms -= dt;
    if (p.ms <= 0) continue;
    if (dist2(s.x, s.y, p.x, p.y) > reach) {
      keep.push(p);
      continue;
    }
    s.events.push({ type: "pickup", kind: p.kind, x: p.x, y: p.y });
    if (p.kind === "food") s.hp = Math.min(s.maxHp, s.hp + 1);
    else if (p.kind === "magnet") s.vacuum = VACUUM_MS;
    else {
      for (const e of s.enemies) {
        if (e.hp <= 0 || !inView(s, e.x, e.y, 0)) continue;
        kill(e, e.id === s.boss ? BOMB_BOSS : e.hp);
      }
    }
  }
  s.pickups = keep;
}
