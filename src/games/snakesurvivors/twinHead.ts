// TWIN HEAD, shown and seen (round eight, the forum player: "Double Head is
// pointless-looking"). The card's rule is unchanged - the tail closes loops by
// the head's own rule (`findTailLoop`) - but it used to wear a small violet
// head nobody read as a head, and a loop it closed looked like any other.
// Now the tail tip is drawn as a second HEAD in the head's own look
// (`drawSnake`), and a crush the tail closes flashes at the tail.

import type { Pt, Run } from "./types";

/** The second head: the tail tip, facing away from the body. Null without the card. */
export function tailHead(run: Pick<Run, "taken" | "path">): (Pt & { heading: number }) | null {
  const n = run.path.length;
  if (!run.taken.twinHead || n < 2) return null;
  const t = run.path[n - 1];
  const q = run.path[n - 2];
  return { x: t.x, y: t.y, heading: Math.atan2(t.y - q.y, t.x - q.x) };
}
