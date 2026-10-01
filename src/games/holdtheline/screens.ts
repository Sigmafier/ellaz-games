// Hold the Line's cover, as rules (operator, 2026-10-01): the title before
// wave 1, the shop between waves, and "The keep fell" - one card, three
// faces. Pure, so it is tested without Phaser; LineGame.tsx reads these.

type Phase = "shop" | "wave" | "over";

/** What the keep-fell card shows, kept until the next wave starts. */
export type LineEnd = { score: number; wave: number; best: number };

export const lineEnd = (score: number, wave: number, best: number): LineEnd => ({ score, wave, best });

/**
 * Which face the card wears, or null while a wave runs. Read off the LATCH:
 * a difficulty tap on the game-over card builds a fresh run, which is wave 1 in
 * the shop - read off the phase alone, that swaps the card for the title under
 * the finger.
 */
export function lineCard(phase: Phase | undefined, wave: number, end: LineEnd | null): "title" | "shop" | "over" | null {
  if (phase === "wave") return null;
  if (end || phase === "over") return "over";
  return wave <= 1 ? "title" : "shop";
}

/** The latch: set when the keep falls, kept through a fresh run, cleared when a wave starts. */
export function nextLineEnd(prev: LineEnd | null, phase: Phase | undefined, now: LineEnd): LineEnd | null {
  if (phase === "wave") return null;
  if (phase === "over") return now;
  return prev;
}
