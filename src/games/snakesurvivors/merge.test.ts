import { describe, expect, it } from "vitest";
import { mulberry32 } from "@shared/rng";
import { MERGE, gemReach, mergeGems, pullPairs } from "./merge";
import type { Gem } from "./types";

// GEM MERGE (operator ruling 2026-10-01, replacing Double Gems; the card id
// stays `doubleGems` because ids persist in saves). A forum reviewer: "way too
// many gems. It's not interesting." Gems lying near each other pull together
// and fuse into one gem worth the SUM - fewer things to chase, the same value.

const FAR = { x: 10_000, y: 10_000 };
const total = (gs: readonly Gem[]) => gs.reduce((n, g) => n + g.v, 0);

/** Step the merge for `ms` at the game's own 25 ms tick. */
function settle(gems: Gem[], ms: number, head = FAR, guard = 16): Gem[] {
  let out = gems;
  for (let t = 0; t < ms; t += 25) out = mergeGems(out, head, guard, 25);
  return out;
}

function scatter(seed: number, n: number, span: number): Gem[] {
  const rng = mulberry32(seed);
  return Array.from({ length: n }, () => ({ x: rng() * span, y: rng() * span, v: 1 + Math.floor(rng() * 3) }));
}

describe("gem merge", () => {
  it("two gems near each other slide together and fuse into one worth both", () => {
    const out = settle([{ x: 0, y: 0, v: 1 }, { x: 30, y: 0, v: 2 }], 2000);
    expect(out).toHaveLength(1);
    expect(out[0].v).toBe(3);
  });

  it("the pull is a short visible slide, not a teleport: one tick moves a gem a little", () => {
    const out = mergeGems([{ x: 0, y: 0, v: 1 }, { x: 40, y: 0, v: 1 }], FAR, 16, 25);
    expect(out).toHaveLength(2);
    const moved = Math.abs(out[0].x - 0);
    expect(moved).toBeGreaterThan(0);
    expect(moved).toBeLessThanOrEqual((MERGE.pull * 25) / 1000 + 1e-9);
  });

  it("conserves the total value EXACTLY, over many random floors and many ticks", () => {
    for (let seed = 1; seed <= 40; seed++) {
      const before = scatter(seed, 60, 400);
      const after = settle(before, 4000);
      expect(total(after), `seed ${seed}`).toBe(total(before));
      for (const g of after) expect(Number.isInteger(g.v), `seed ${seed}`).toBe(true);
    }
  });

  it("leaves fewer gems to chase", () => {
    let before = 0;
    let after = 0;
    for (let seed = 1; seed <= 20; seed++) {
      const gs = scatter(seed, 60, 400);
      before += gs.length;
      after += settle(gs, 4000).length;
    }
    expect(after).toBeLessThan(before * 0.6);
  });

  it("does not touch a gem the head is already pulling in, or one inside the pickup", () => {
    const head = { x: 0, y: 0 };
    const near = { x: 50, y: 0, v: 1 };
    const partner = { x: 70, y: 0, v: 1 };
    const out = settle([near, partner], 2000, head, 60);
    const kept = out.find((g) => g.x === 50 && g.y === 0);
    expect(kept, "the pulled gem stayed exactly where the merge found it").toBeTruthy();
    expect(kept!.v).toBe(1);
    expect(total(out)).toBe(2);
  });

  it("never merges a floor gem: they are the beginner's trickle and their count is a cap", () => {
    const out = settle([{ x: 0, y: 0, v: 1, floor: true }, { x: 10, y: 0, v: 1 }, { x: 20, y: 0, v: 1, floor: true }], 2000);
    expect(out.filter((g) => g.floor)).toHaveLength(2);
    expect(out.filter((g) => g.floor).every((g) => g.v === 1)).toBe(true);
  });

  it("gems further apart than its reach stay apart", () => {
    const out = settle([{ x: 0, y: 0, v: 1 }, { x: MERGE.reach + 5, y: 0, v: 1 }], 3000);
    expect(out).toHaveLength(2);
    expect(out[0].x).toBe(0);
  });

  it("is pure: the gems it is handed are not changed", () => {
    const gs: Gem[] = [{ x: 0, y: 0, v: 1 }, { x: 4, y: 0, v: 1 }];
    const copy = JSON.stringify(gs);
    mergeGems(gs, FAR, 16, 25);
    expect(JSON.stringify(gs)).toBe(copy);
  });

  it("names the pairs it is pulling, so the scene can draw the pull", () => {
    const pairs = pullPairs([{ x: 0, y: 0, v: 1 }, { x: 30, y: 0, v: 2 }, { x: 900, y: 0, v: 1 }], FAR, 16);
    expect(pairs).toHaveLength(2);
    for (const [a, b] of pairs) expect(Math.hypot(a.x - b.x, a.y - b.y)).toBeLessThanOrEqual(MERGE.reach);
  });

  it("a bigger gem is picked up from a little further, up to twice as far, and a 1 to 3 gem is unchanged", () => {
    expect(gemReach(1)).toBe(1);
    expect(gemReach(3)).toBe(1);
    expect(gemReach(6)).toBeGreaterThan(1);
    expect(gemReach(500)).toBe(2);
  });
});
