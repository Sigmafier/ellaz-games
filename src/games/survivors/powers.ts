// The two powers: a dash that fires by itself, and a freeze on the one button.
//
// Operator ruling 2026-09-14, picked off mocks drawn over the live game. Freeze
// is the super: it charges as gems are collected and one tap stops every shape
// for two seconds. Dash is automatic: when a shape would cost a heart and the
// dash is ready, the robot blinks away from it instead, and the dash recharges.
//
// Types only from `logic.ts`, so there is no import cycle.

import type { RunState } from "./types";
import { clampToWorld } from "./world";
import { regenEvery } from "./upgrades";

/** How long the dash takes to come back after it has saved you. */
export const DASH_MS = 8000;
/** How far the blink carries you, in world units - clear of a runner's reach. */
export const DASH_DIST = 70;
/** Gem value that fills the freeze. A runner is worth 1, an orb 2, a brute 4. */
export const FREEZE_NEED = 30;
/** How long everything stays frozen. "Two seconds" was the ruling. */
export const FREEZE_MS = 2000;

const unit = (v: number) => Math.max(0, Math.min(1, v));

/** HASTE (2026-10-03): each level takes this share off the dash's recharge. */
export const HASTE_STEP = 0.18;

/** How long the dash takes to come back on this run - `DASH_MS` exactly with no haste. */
export const dashEvery = (s: { up?: { haste?: number } }): number => Math.round(DASH_MS * (1 - HASTE_STEP * (s.up?.haste ?? 0)));

/** 1 when the dash is ready, rising from 0 while it recharges. For the HUD chip. */
export const dashReady = (s: Pick<RunState, "dashCd">, every = DASH_MS): number => unit(1 - s.dashCd / every);

/** How full the freeze is, 0..1. For the ring around the button. */
export const chargeOf = (s: Pick<RunState, "charge">): number => unit(s.charge / FREEZE_NEED);

export function canFreeze(s: Pick<RunState, "phase" | "choosing" | "frozen" | "charge">): boolean {
  return s.phase === "playing" && !s.choosing && s.frozen <= 0 && s.charge >= FREEZE_NEED;
}

/**
 * The button. Returns whether it did anything, so the scene plays the moment
 * only when it really happened - a tap on an empty ring is not a freeze.
 */
export function triggerFreeze(s: RunState): boolean {
  if (!canFreeze(s)) return false;
  s.frozen = FREEZE_MS;
  s.charge = 0;
  return true;
}

/** Count both clocks down. Called once per simulated frame. */
export function tickPowers(s: Pick<RunState, "dashCd" | "frozen">, dt: number) {
  if (s.dashCd > 0) s.dashCd = Math.max(0, s.dashCd - dt);
  if (s.frozen > 0) s.frozen = Math.max(0, s.frozen - dt);
}

/**
 * Blink away from the point a hit came from. `r` is the robot's radius, so the
 * landing spot is clear of the walls. Straight away from the shape, because a
 * dash that could land you on the far side of it would carry you into the crowd
 * that shape was leading.
 */
export function dashAway(s: RunState, fromX: number, fromY: number, r: number): { x: number; y: number } {
  let dx = s.x - fromX;
  let dy = s.y - fromY;
  let len = Math.hypot(dx, dy);
  if (len < 0.001) {
    dx = 1;
    dy = 0;
    len = 1;
  }
  const from = { x: s.x, y: s.y };
  const to = clampToWorld(s, s.x + (dx / len) * DASH_DIST, s.y + (dy / len) * DASH_DIST, r);
  s.x = to.x;
  s.y = to.y;
  s.dashCd = dashEvery(s);
  return from;
}

/**
 * REGEN (2026-10-03): a heart back on the upgrade's clock. The clock runs only
 * while a heart is missing, so a full robot does not bank one. No-op on a run that
 * never took it - nothing is read, nothing is drawn, no rng is touched.
 */
export function tickRegen(s: RunState, dt: number): void {
  if (s.up.regen <= 0) return;
  const every = regenEvery(s);
  if (s.hp >= s.maxHp) {
    s.regenMs = every;
    return;
  }
  s.regenMs = Math.min(every, s.regenMs ?? every) - dt;
  if (s.regenMs > 0) return;
  s.hp = Math.min(s.maxHp, s.hp + 1);
  s.regenMs = every;
  s.events.push({ type: "regen" });
}
