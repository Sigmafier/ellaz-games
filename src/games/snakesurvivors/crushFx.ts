// What a crush LOOKS like, decided in one pure function (round four, operator
// ruling: "a crush HITS"). The scene only plays what this returns, so which
// crush gets the shake, the banner and the bonus gem is testable without
// Phaser - and a player who asked the system for less motion gets no shake.

import { HEAD_R } from "./body";
import { tailHead } from "./twinHead";
import type { Pt, Run } from "./types";

/** A loop catching this many or more drops one bonus gem. */
export const BONUS_AT = 4;
/** The bonus gem's value: a yellow one, the richest colour. */
export const BONUS_GEM = 3;
/** From this many caught, the big "CRUSH xN!" banner shows. */
export const BANNER_AT = 2;

export interface CrushFx {
  /** ms the loop's fill flashes white before it fades to mint. */
  flashMs: number;
  /** How far past the loop the shockwave ring travels, as a multiple of the loop's size. */
  ringReach: number;
  /** ms the ring takes to get there. */
  ringMs: number;
  /** The camera shake, or null (a small crush, or reduced motion). */
  shake: { ms: number; amount: number } | null;
  /** Particles EACH caught shape bursts into, in its own colour. */
  perFoe: number;
  /** The banner's count, or null under `BANNER_AT`. */
  banner: number | null;
  /** One bonus gem drops at the loop's middle. */
  bonusGem: boolean;
  /** Which sound: a pop for one or two, the success chime from three. */
  sound: "pop" | "success";
}

export function crushFx(n: number, reducedMotion: boolean): CrushFx {
  const big = Math.min(n, 8);
  return {
    flashMs: 140 + 20 * big,
    ringReach: 1.4 + 0.1 * big,
    ringMs: 420 + 30 * big,
    shake: reducedMotion ? null : { ms: 140 + 30 * big, amount: 0.004 + 0.0018 * big },
    perFoe: 10 + 2 * big,
    banner: n >= BANNER_AT ? n : null,
    bonusGem: n >= BONUS_AT,
    sound: n >= 3 ? "success" : "pop",
  };
}

/**
 * TWIN HEAD, SEEN (round eight): a crush the TAIL closed also flashes at the
 * tail tip - a ring and a spray in the head's mint - so the second head is seen
 * doing its job. Null for a head crush, or without the card.
 */
export function tailCrushFx(run: Pick<Run, "taken" | "path">, by: "head" | "tail"): { at: Pt; from: number; to: number; life: number; sparks: number } | null {
  const tip = by === "tail" ? tailHead(run) : null;
  return tip ? { at: { x: tip.x, y: tip.y }, from: HEAD_R, to: HEAD_R * 5, life: 420, sparks: 14 } : null;
}
