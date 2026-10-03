// TEST FIXTURE - the two bot thumbs, and nothing ships this file.
//
// COPIED from `pacing.test.ts` rather than moved out of it: the task that added
// the career ruled every existing survivors test stays byte-for-byte unchanged,
// and a test file cannot be imported without registering its own cells. So the
// same `kite` / `stroll` / card picker live here for the career's pacing test, and
// `career-pacing.test.ts` is the only importer. If one copy is retuned the other
// should be too - they model the same two players.
import type { RunState, UpgradeId } from "./types";
import type { Card } from "./cards";

/** A competent thumb: away from the crowd, toward loose gems, across a bolt's path, off a lava pool. */
export function kite(s: RunState): { dx: number; dy: number } {
  let dx = 0;
  let dy = 0;
  for (const b of s.shots) {
    const rx = s.x - b.x;
    const ry = s.y - b.y;
    const sp = Math.hypot(b.vx, b.vy) || 1;
    const along = (rx * b.vx + ry * b.vy) / sp;
    if (along <= 0 || along > 220) continue;
    const off = (rx * -b.vy + ry * b.vx) / sp;
    if (Math.abs(off) > 46) continue;
    const side = off >= 0 ? 1 : -1;
    const urgency = 3 * (1 - along / 220);
    dx += (-b.vy / sp) * side * urgency;
    dy += (b.vx / sp) * side * urgency;
  }
  for (const e of s.enemies) {
    const d = Math.hypot(s.x - e.x, s.y - e.y) || 1;
    if (d > 150) continue;
    const w = (150 - d) / 150;
    dx += ((s.x - e.x) / d) * w * 2;
    dy += ((s.y - e.y) / d) * w * 2;
  }
  // A player keeps out of the dark, where the gun cannot see (Neon City).
  for (const d of s.career?.dark ?? []) {
    const dd = Math.hypot(s.x - d.x, s.y - d.y) || 1;
    if (dd > d.r + 20) continue;
    dx += ((s.x - d.x) / dd) * 1.5;
    dy += ((s.y - d.y) / dd) * 1.5;
  }
  // A player reads the warning ring: step out of any pool that is warning or live.
  for (const p of s.career?.pools ?? []) {
    const d = Math.hypot(s.x - p.x, s.y - p.y) || 1;
    if (d > p.r + 30) continue;
    dx += ((s.x - p.x) / d) * 3;
    dy += ((s.y - p.y) / d) * 3;
  }
  let best: { x: number; y: number } | null = null;
  let bestD = 220;
  for (const g of [...s.gems, ...(s.career?.coins ?? [])]) {
    const d = Math.hypot(s.x - g.x, s.y - g.y);
    if (d < bestD) {
      bestD = d;
      best = g;
    }
  }
  if (best) {
    const d = Math.hypot(best.x - s.x, best.y - s.y) || 1;
    dx += ((best.x - s.x) / d) * 0.7;
    dy += ((best.y - s.y) / d) * 0.7;
  }
  const m = 90;
  if (s.x < m) dx += 1;
  if (s.x > s.world.w - m) dx -= 1;
  if (s.y < m) dy += 1;
  if (s.y > s.world.h - m) dy -= 1;
  const len = Math.hypot(dx, dy);
  return len > 0.01 ? { dx: dx / len, dy: dy / len } : { dx: 0, dy: 0 };
}

/** A careless thumb: somewhere for about a second, then somewhere else. */
export function stroll(s: RunState, rng: () => number, held: { dx: number; dy: number; until: number }) {
  const now = s.career?.age ?? s.t;
  if (now >= held.until) {
    const a = rng() * Math.PI * 2;
    held.dx = Math.cos(a);
    held.dy = Math.sin(a);
    held.until = now + 700 + rng() * 900;
  }
  const m = 70;
  if ((s.x < m && held.dx < 0) || (s.x > s.world.w - m && held.dx > 0)) held.dx = -held.dx;
  if ((s.y < m && held.dy < 0) || (s.y > s.world.h - m && held.dy > 0)) held.dy = -held.dy;
  return { dx: held.dx, dy: held.dy };
}

// The three of 2026-10-03 go LAST: the bot's picks for every older card stay as
// they were, so a table it prints still compares with the one before them.
const CARD_ORDER: UpgradeId[] = ["rapid", "power", "spread", "pierce", "heart", "swift", "shield", "range", "magnet", "area", "haste", "regen"];

/**
 * The card a player who knows the game takes. A super (`evolve`) arrives alone
 * after a boss or mini-boss kill since 2026-09-30, so it is taken because it is
 * the only card; the rest of the order is the level-up pick.
 */
export function bestCard(cards: Card[]): Card {
  return (
    cards.find((c) => c.kind === "evolve") ??
    cards.find((c) => c.kind === "weapon") ??
    cards.find((c) => c.kind === "level") ??
    [...cards].sort((a, b) => CARD_ORDER.indexOf(a.id as UpgradeId) - CARD_ORDER.indexOf(b.id as UpgradeId))[0]
  );
}
