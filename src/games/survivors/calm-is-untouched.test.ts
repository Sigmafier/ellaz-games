// CALM IS THE CONTROL: a seeded run, played out frame by frame, fingerprinted.
//
// WHY THIS FILE EXISTS. The operator asked on 2026-09-21 for a harder game -
// *"Dont touch the easy mode, just some in the medium and a lot in the hard"* -
// and "do not touch it" is a claim nothing in this repo could check. Every knob
// the hardening turns (the wave table, the spawn clock, the xp cost, the golem's
// health, the shooters) is shared code with a per-level row, so a calm run walks
// through every line the other two levels changed.
//
// The numbers below were RECORDED by running this file and pasting its own
// output in. They are not a description of what calm does; they are a photograph
// of what calm did. A tuning edit that reaches calm by accident moves at least
// one of them.
//
// RE-RECORDED 2026-09-22, and the reason matters more than the numbers.
// Removing the `crit` upgrade deleted one rng draw per shot, so every calm seed
// now plays a different SHUFFLE of the same game - no damage number moved, but
// seed 11 fell from 5 level-ups to 4 and read like a nerf. It was not: measured
// over 40 seeds on both trees, calm's mean level-ups moved 4.15 -> 4.03 and its
// mean kills 100.50 -> 101.10.
//
// That episode is why the second cell below exists. A fingerprint can only ever
// say "something changed", and its only remedy is a paste - so on its own it
// teaches its reader to re-record rather than to look. The band beside it is
// what a re-record has to survive.
//
// NOT RE-RECORDED for the gem merge, and that is the interesting half.
//
// Gems now MERGE when they fall near each other (operator: *"do less diamonds
// to pick, the screen is full of them"*). The first version left the merged
// pile where the OLDER gem lay, and this file went red - seeds 11 and 23 each
// lost a level-up. The band cell below stayed GREEN, because the aggregate over
// 24 seeds did not move at all:
//
//     n=24            levelups   power   popped
//     without merge     4.13      5.13   101.33
//     with merge        4.13      5.13   101.33
//
// So the honest reading was "a re-shuffle", and the paste was justified. It was
// also the WRONG conclusion to stop at. The same change measured against a bot
// that MOVES took wild from 3 wins in 5 to 1, with `power` down on every seed:
// a kiting player's kills happen ahead of them, and the pile was being left
// behind. A standing fingerprint and a 24-seed mean of standing runs are both
// blind to that, by construction.
//
// Merging forwards - the pile moves to the new kill - fixed the moving case and
// put THIS file back to the numbers it had before merging existed, to the
// character. Which is why the rows above are the pre-merge ones and there is no
// third re-record.
//
// The lesson is not about gems. A control whose player never moves cannot see a
// change that only costs a player who moves, however many seeds it averages.
//
// WATCHED FAILING, 2026-09-21, because a gate nobody has seen fail is not a
// gate - and one that reds on every edit anywhere is not one either:
//
//   calm `spawnMs` 1150 -> 1149      RED    one millisecond
//   calm `stageMs` 60_000 -> 61_000  RED    one second of one stage
//   wild's `bossHp` 1.9 -> 2.4       GREEN  the two harder levels are what the
//                                           hardening was allowed to touch
//
// The third arm is the one that makes the first two worth having. Without it
// this file reds on any edit to `RULES` at all, and a control that cannot tell
// "you changed easy mode" from "you changed something" teaches its reader to
// re-record the numbers rather than to look.
//
// WATCHED AGAIN 2026-09-22, when the band cell was added, and the second arm is
// the one that earns it - a gate that reds on both is no better than the
// fingerprint alone:
//
//   calm `xpBase` 1 -> 0.8          fingerprint RED,  band RED
//     a real nerf: cards arrive sooner on easy mode
//   one dead `rng()` draw per frame  fingerprint RED,  band GREEN
//     a pure re-shuffle: nothing reads the draw, so no number moves
//
// That second row is what a re-record looks like when it is honest, and the
// first is what it looks like when it is not.
import { describe, expect, it } from "vitest";
import { newRun, rngFor, step, type RunState } from "./logic";

const STILL = { dx: 0, dy: 0 };

/**
 * Play a whole calm run with nobody steering, and hash what happened.
 *
 * IMMORTAL on purpose: the fingerprint is of the WAVE, not of how long a statue
 * survives, and a run that ends early would fingerprint the first forty seconds
 * and call it the level. `choosing` is cleared every frame for the same reason -
 * nobody is here to take a card, and a stalled simulation fingerprints nothing.
 */
function fingerprint(seed: number, ms: number) {
  const s: RunState = newRun("calm");
  const rng = rngFor(seed);
  s.hp = 9_999;
  s.maxHp = 9_999;
  const seen: Record<string, number> = {};
  let stage = 1;
  // Every kind that has ever been on the board, counted the first frame its id
  // appears - so this reads the SPAWNER rather than how long anything lived.
  const met = new Set<number>();
  let levelups = 0;
  for (let t = 0; t < ms; t += 16) {
    s.choosing = false;
    step(s, 16, STILL, rng);
    levelups += s.events.filter((e) => e.type === "levelup").length;
    stage = Math.max(stage, s.stage);
    for (const e of s.enemies) {
      if (met.has(e.id)) continue;
      met.add(e.id);
      seen[e.kind] = (seen[e.kind] ?? 0) + 1;
    }
  }
  return { spawned: met.size, kinds: seen, popped: s.popped, power: s.power, levelups, need: s.need, stage };
}

describe("easy mode is exactly what it was", () => {
  it("plays the same 180-second run, shape for shape", () => {
    const a = fingerprint(11, 180_000);
    const b0 = fingerprint(23, 180_000);
    // BOTH printed BEFORE either is asserted. They used to be logged one at a
    // time beside their own expectation, so a failure on the first hid the
    // second - and a re-record then needed two runs to read two numbers.
    console.log(`calm seed 11: ${JSON.stringify(a)}`);
    console.log(`calm seed 23: ${JSON.stringify(b0)}`);
    expect(a).toEqual({
      spawned: 131,
      kinds: { runner: 77, orb: 42, warden: 1, brute: 10, queen: 1 },
      popped: 105,
      power: 5,
      levelups: 4,
      need: 21,
      stage: 2,
    });

    expect(b0).toEqual({
      spawned: 131,
      kinds: { runner: 61, orb: 47, warden: 1, brute: 21, queen: 1 },
      popped: 100,
      power: 5,
      levelups: 4,
      need: 21,
      stage: 2,
    });
  });

  it("keeps easy mode's DIFFICULTY across a re-record, not just its shuffle", () => {
    // WHY THIS CELL EXISTS, and it is the weakness in the one above.
    //
    // A fingerprint is exact, so any change at all reds it - and the only way
    // past a red is to paste in new numbers. That makes it a perfect detector
    // and a terrible judge: it cannot tell "the rng stream shifted and calm
    // plays a different shuffle of the same game" from "calm got easier", and
    // it pushes its reader toward re-recording either way.
    //
    // It happened on 2026-09-22. Removing `crit` deleted one rng draw per shot,
    // so every calm seed re-shuffled; seed 11 went from 5 level-ups to 4, which
    // read exactly like a nerf. Measured over 40 seeds on both trees, from one
    // file, it was not one:
    //
    //     n=40          spawned   popped   levelups   power
    //     with crit     131.00    100.50     4.15      5.15
    //     without       131.00    101.10     4.03      5.03
    //
    // So the guarantee worth holding is the AGGREGATE, and these bands are wide
    // enough to survive a re-shuffle and far too tight to survive a tuning
    // change: calm's spawn clock is fixed, so `spawned` is 131 on every seed,
    // and one extra level-up per run on average is a different game.
    const runs = Array.from({ length: 24 }, (_, i) => fingerprint(200 + i, 180_000));
    const mean = (pick: (r: (typeof runs)[number]) => number) =>
      runs.reduce((acc, r) => acc + pick(r), 0) / runs.length;

    // Not an average: calm's wave clock takes no rng at all, so a re-shuffle
    // cannot move this by one. A spawn-rate edit moves it immediately.
    for (const r of runs) expect(r.spawned).toBe(131);
    expect(mean((r) => r.popped)).toBeGreaterThan(95);
    expect(mean((r) => r.popped)).toBeLessThan(107);
    expect(mean((r) => r.levelups)).toBeGreaterThan(3.5);
    expect(mean((r) => r.levelups)).toBeLessThan(4.7);
    expect(mean((r) => r.power)).toBeGreaterThan(4.5);
    expect(mean((r) => r.power)).toBeLessThan(5.7);
  });

  it("THE CONTROL: the fingerprint can tell two runs apart", () => {
    // Without this, the assertions above are satisfied by a `fingerprint` that
    // returns a constant - which is exactly what a broken instrument looks like.
    expect(fingerprint(11, 180_000)).not.toEqual(fingerprint(23, 180_000));
    expect(fingerprint(11, 60_000)).not.toEqual(fingerprint(11, 180_000));
  });
});
