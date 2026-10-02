// CALM IS THE CONTROL: seeded calm runs, played out step by step, fingerprinted.
//
// WHY THIS FILE EXISTS. The operator asked on 2026-10-01 for a harder run on
// Normal and Wild (a forum reviewer: "too easy ... you need to feel like you
// barely made it") and for calm to stay exactly what it was. Every knob that
// hardening turns - the spawn gap, what a bump costs, the warden's health - is
// shared code with a per-level row, so a calm run walks through every line the
// other two levels changed. (The mock also cut the blink after a bump; the
// operator ruled on 2026-10-02 to keep it at 1.4 s everywhere, and the table
// below still pins it.)
//
// The numbers below were RECORDED on the tree before the hardening (origin/main
// 59ec3251) by running this file and pasting its own output in. They are a
// photograph of what calm did, not a description of it.
//
// THE BOT NEVER TAKES GEM MERGE. The same change replaced Double Gems with Gem
// Merge on every level - a card ruling, not a difficulty one - so a fingerprint
// that took that card would red on the card and say nothing about the level.
// Skipping it keeps every rng draw identical on both trees: the offers are
// rolled before the pick, so which card is taken never changes what is offered.
import { describe, expect, it } from "vitest";
import { mulberry32 } from "@shared/rng";
import { circle } from "./bots";
import { BLINK_MS } from "./logic";
import { ARENA, ARENA_WIDE, newRun, pickCard, step } from "./logic";
import { bossHpOf, biteCost, spawnEvery } from "./crowd";
import type { Arena, Run, Stage } from "./types";

function fingerprint(seed: number, arena: Arena, ms: number) {
  const rng = mulberry32(seed);
  const run = newRun("calm", arena, rng);
  const met = new Set<number>();
  const kinds: Record<string, number> = {};
  let hits = 0;
  let gems = 0;
  while (run.t < ms) {
    step(run, 25, circle(run), rng);
    if (run.choosing) {
      const pick = run.choosing.find((c) => c !== "doubleGems");
      if (pick) pickCard(run, pick);
      else run.choosing = null;
    }
    for (const e of run.events) {
      if (e.k === "hit") hits += 1;
      if (e.k === "gem") gems += 1;
    }
    for (const f of run.foes) {
      if (met.has(f.id)) continue;
      met.add(f.id);
      kinds[f.kind] = (kinds[f.kind] ?? 0) + 1;
    }
    if (run.phase === "won" || run.phase === "dead") break;
  }
  return { end: run.phase, t: run.t, stage: run.stage, crushed: run.crushed, len: Math.round(run.len * 1000), lv: run.lv, spawned: met.size, kinds, hits, gems };
}

/** Calm's own numbers at every stage and a spread of progress: the spawn gap, a bump, the warden, the blink. */
function calmTable() {
  const out: string[] = [];
  for (const stage of [1, 2, 3] as Stage[]) {
    for (const crushedAt of [0, 0.3, 0.6, 1]) {
      const run = newRun("calm", ARENA, mulberry32(1)) as Run;
      run.stage = stage;
      run.t = 200_000 * crushedAt;
      run.crushed = Math.round(600 * crushedAt * stage);
      out.push(`${stage}@${crushedAt}: gap ${spawnEvery(run).toFixed(3)} bite ${biteCost(run)}`);
    }
    out.push(`warden ${stage}: ${bossHpOf("calm", stage)}`);
  }
  // Two copies of one number, so the line reads exactly as it was recorded.
  out.push(`blink ${BLINK_MS} ${BLINK_MS}`);
  return out.join("\n");
}

describe("calm is exactly what it was before the 2026-10-01 hardening", () => {
  it("calm's numbers, stage by stage", () => {
    const t = calmTable();
    console.log(t);
    expect(t).toBe(CALM_TABLE);
  });

  it("plays the same calm runs, shape for shape, on the phone and the PC", () => {
    const a = fingerprint(11, ARENA, 900_000);
    const b = fingerprint(23, ARENA_WIDE, 900_000);
    const c = fingerprint(5, ARENA, 900_000);
    console.log(`calm seed 11 phone: ${JSON.stringify(a)}`);
    console.log(`calm seed 23 pc: ${JSON.stringify(b)}`);
    console.log(`calm seed 5 phone: ${JSON.stringify(c)}`);
    expect(a).toEqual(RUN_11);
    expect(b).toEqual(RUN_23);
    expect(c).toEqual(RUN_5);
  });

  it("THE CONTROL: the fingerprint can tell two runs apart", () => {
    // Without this a `fingerprint` returning a constant would pass the cell above.
    expect(fingerprint(11, ARENA, 120_000)).not.toEqual(fingerprint(23, ARENA, 120_000));
    expect(fingerprint(11, ARENA, 60_000)).not.toEqual(fingerprint(11, ARENA, 120_000));
    // ...and the table can tell calm from normal.
    expect(bossHpOf("normal", 3)).not.toBe(bossHpOf("calm", 3));
  });
});

// Recorded on origin/main 59ec3251, before the hardening, by this file's own output.
const CALM_TABLE = [
  "1@0: gap 3000.000 bite 1",
  "1@0.3: gap 2440.000 bite 1",
  "1@0.6: gap 1880.000 bite 1",
  "1@1: gap 1600.000 bite 1",
  "warden 1: 3",
  "2@0: gap 3000.000 bite 1",
  "2@0.3: gap 1098.000 bite 1",
  "2@0.6: gap 846.000 bite 1",
  "2@1: gap 720.000 bite 1",
  "warden 2: 5",
  "3@0: gap 1350.000 bite 1",
  "3@0.3: gap 683.200 bite 1",
  "3@0.6: gap 526.400 bite 1",
  "3@1: gap 448.000 bite 1",
  "warden 3: 7",
  "blink 1400 1400",
].join("\n");
const RUN_11 = { end: "dead", t: 220875, stage: 2, crushed: 159, len: 3000, lv: 5, spawned: 181, kinds: { runner: 74, mini: 2, warden: 1, orb: 36, dasher: 45, brute: 23 }, hits: 54, gems: 66 };
const RUN_23 = { end: "won", t: 408625, stage: 3, crushed: 577, len: 100000, lv: 12, spawned: 590, kinds: { runner: 200, mini: 3, warden: 3, brute: 60, orb: 116, dasher: 118, shooter: 90 }, hits: 85, gems: 726 };
const RUN_5 = { end: "won", t: 410725, stage: 3, crushed: 592, len: 77667, lv: 12, spawned: 597, kinds: { runner: 197, mini: 3, warden: 3, orb: 124, dasher: 123, brute: 65, shooter: 82 }, hits: 118, gems: 641 };
