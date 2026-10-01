// Neon Survival's ONE screen, as rules (operator, 2026-10-01): the title's big
// PLAY starts a QUICK RUN on the LAST-USED weapon, and which screen is up. Pure,
// so it is tested without Phaser; SurvivorsGame.tsx only reads these.

import type { WeaponId } from "../types";

/** Where this device remembers the last-used weapon. Persisted, so never renamed. */
export const START_KEY = "startWeapon";

/** `ctx.storage`'s two methods - all this file needs of it. */
type Storage = { get<T>(key: string, fallback: T): T; set(key: string, value: unknown): void };

/**
 * The weapon a quick run starts on: the stored one if this save may pick it,
 * otherwise the first weapon it owns. A locked, unknown or foreign value is
 * never trusted. The bolt is open on every save, so the last line only guards
 * an empty list.
 */
export function quickWeapon(stored: unknown, open: readonly WeaponId[]): WeaponId {
  if ((open as readonly unknown[]).includes(stored)) return stored as WeaponId;
  return open[0] ?? "bolt";
}

/** Remember the weapon a run was started on - from the handler, never a state updater. */
export function rememberWeapon(storage: Storage, id: WeaponId): void {
  storage.set(START_KEY, id);
}

/** The remembered weapon, validated against what this save has open. */
export function readWeapon(storage: Storage, open: readonly WeaponId[]): WeaponId {
  return quickWeapon(storage.get<unknown>(START_KEY, null), open);
}

/** The screens the game switches between; the title holds both the quick run and the way to the career. */
export type NeonMode = "title" | "pick" | "quick" | "career";
export type NeonView = "title" | "pick" | "career" | "over" | "run";

/**
 * What is drawn over the arena. A quick run that has not started (PLAY pressed
 * before Phaser finished loading, or a page restart) is still the title; one
 * that ENDED is the game-over card, kept through a difficulty tap that puts the
 * scene back to "ready" - `ended` is the latch that remembers it.
 */
export function neonView(mode: NeonMode, phase: "ready" | "playing" | "won" | "over", choosing: boolean, ended: boolean): NeonView {
  if (mode === "pick" || mode === "career" || mode === "title") return mode;
  if (phase === "playing" || choosing) return "run";
  return ended ? "over" : "title";
}
