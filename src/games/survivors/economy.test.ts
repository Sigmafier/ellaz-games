// THE ECONOMY GATE - is this game still balanced?
//
// It exists because every other test in this directory asks whether a RULE
// works, and none of them can answer the only question that decides whether the
// stages-and-evolutions work was worth doing: does a run still hand a player a
// meaningful number of choices, and can they actually reach an evolution?
//
// Both are properties of the whole simulation over three minutes, so they cannot
// be asserted from a unit test and they must never be FELT. This plays real runs
// and reads the answer off them.
//
// IT PRINTS ITS POPULATION AND ITS READINGS, always, pass or fail. A gate that
// prints only a verdict is a number with no denominator, and this repo has a
// rule about that.
import { describe, expect, it } from "vitest";
import { applyCard, offerCards } from "./cards";
import { ARENA, ARENA_WIDE, RECIPE, RUN_MS, newRun, rngFor, step, type Arena, type LevelKey, type RunState } from "./logic";

/**
 * A player who walks away from what is nearest and TOWARD the gems.
 *
 * This is the upper bound of a real player, not a model of one: it never gets
 * cornered chasing a gem and it never misjudges a gap. The lower bound is a bot
 * that only flees, which leaves its xp on the floor. Measured 2026-09-21 the two
 * read 22.4 and 6.8 cards on `normal`, so a real player is between - which is
 * why the window below is wide and why it is a WINDOW rather than a number.
 */
function greedy(s: RunState) {
  let bx = 0, by = 0, bd = Infinity;
  for (const e of s.enemies) {
    const d = Math.hypot(s.x - e.x, s.y - e.y);
    if (d < bd) { bd = d; bx = e.x; by = e.y; }
  }
  if (bd < 90) { const l = bd || 1; return { dx: (s.x - bx) / l, dy: (s.y - by) / l }; }
  let gx = 0, gy = 0, gd = Infinity;
  for (const g of s.gems) {
    const d = Math.hypot(s.x - g.x, s.y - g.y);
    if (d < gd) { gd = d; gx = g.x; gy = g.y; }
  }
  if (gd === Infinity) return { dx: 0, dy: 0 };
  const l = gd || 1;
  return { dx: (gx - s.x) / l, dy: (gy - s.y) / l };
}

type Reading = {
  cards: number;
  evolutions: number;
  popped: number;
  stage: number;
  won: boolean;
  died: boolean;
  seconds: number;
};

/** Play one whole run, taking a card whenever one is offered. */
function play(level: LevelKey, arena: Arena, seed: number): Reading {
  const s = newRun(level, arena);
  const rng = rngFor(seed);
  let cards = 0;
  let evolutions = 0;
  let ms = 0;
  // Bounded by wall-clock frames rather than by `t`, because `t` stops during a
  // boss fight - a loop keyed on `t` would never exit if a boss were unkillable,
  // which is exactly the regression this gate should catch rather than hang on.
  for (let i = 0; i < 40_000 && s.phase === "playing"; i++) {
    if (s.choosing) {
      const offer = offerCards(s, rng);
      if (offer.length === 0) { s.choosing = false; continue; }
      const pick = offer[Math.floor(rng() * offer.length)];
      // A SUPER is not a level-up card: since 2026-09-30 a boss or mini-boss
      // kill hands it over, alone, and counting it here moved "cards per normal
      // run" by exactly the supers taken (24.2 -> 25.2 portrait with evo 1.0,
      // 25.6 -> 26.8 landscape with evo 1.2) while the xp curve was untouched.
      if (pick.kind === "evolve") evolutions++;
      else cards++;
      applyCard(s, pick);
      continue;
    }
    step(s, 16, greedy(s), rng);
    ms += 16;
  }
  return {
    cards,
    evolutions,
    popped: s.popped,
    stage: s.stage,
    won: s.phase === "won",
    died: s.phase === "over",
    seconds: Math.round(ms / 1000),
  };
}

/**
 * Play the way a player with a PLAN plays: take the level for the starting
 * weapon and the upgrade its evolution needs, and take the evolution the moment
 * it is offered. Everything else is a fallback.
 *
 * This is the honest reader for "is an evolution reachable" - a bot picking
 * uniformly at random measures luck rather than reach.
 */
function playAiming(level: LevelKey, arena: Arena, seed: number): Reading {
  // Since 2026-09-30 the recipe is bolt Lv5 + pierce taken ONCE, and the super
  // arrives on a boss or mini-boss kill - so "aiming" is the four bolt levels and
  // one pierce; the evolve line below takes the card the kill hands over.
  const s = newRun(level, arena);
  const rng = rngFor(seed);
  const want = RECIPE.bolt; // the run starts on the bolt
  let cards = 0;
  let evolutions = 0;
  let ms = 0;
  for (let i = 0; i < 40_000 && s.phase === "playing"; i++) {
    if (s.choosing) {
      const offer = offerCards(s, rng);
      if (offer.length === 0) { s.choosing = false; continue; }
      const pick =
        offer.find((c) => c.kind === "evolve") ??
        offer.find((c) => c.kind === "level" && c.id === "bolt") ??
        offer.find((c) => c.kind === "upgrade" && c.id === want) ??
        offer[0];
      // A SUPER is not a level-up card: since 2026-09-30 a boss or mini-boss
      // kill hands it over, alone, and counting it here moved "cards per normal
      // run" by exactly the supers taken (24.2 -> 25.2 portrait with evo 1.0,
      // 25.6 -> 26.8 landscape with evo 1.2) while the xp curve was untouched.
      if (pick.kind === "evolve") evolutions++;
      else cards++;
      applyCard(s, pick);
      continue;
    }
    step(s, 16, greedy(s), rng);
    ms += 16;
  }
  return {
    cards, evolutions, popped: s.popped, stage: s.stage,
    won: s.phase === "won", died: s.phase === "over", seconds: Math.round(ms / 1000),
  };
}

const SEEDS = [1, 2, 3, 4, 5];
/** A wider population for the one reading that is genuinely stochastic. */
const AIM_SEEDS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
const avg = (xs: number[]) => xs.reduce((a, b) => a + b, 0) / xs.length;

describe("the run economy", () => {
  it("prints what a run is worth, on every level and both arenas", () => {
    const rows: string[] = [];
    for (const [shape, arena] of [["portrait", ARENA], ["landscape", ARENA_WIDE]] as const) {
      for (const level of ["calm", "normal", "wild"] as LevelKey[]) {
        const runs = SEEDS.map((seed) => play(level, arena, seed));
        rows.push(
          `${shape.padEnd(10)} ${level.padEnd(7)}` +
            ` cards ${avg(runs.map((r) => r.cards)).toFixed(1).padStart(5)}` +
            `  evo ${avg(runs.map((r) => r.evolutions)).toFixed(1).padStart(4)}` +
            `  popped ${avg(runs.map((r) => r.popped)).toFixed(0).padStart(5)}` +
            `  won ${runs.filter((r) => r.won).length}/5` +
            `  died ${runs.filter((r) => r.died).length}/5` +
            `  ~${avg(runs.map((r) => r.seconds)).toFixed(0)}s` +
            `  [${runs.map((r) => r.cards).join(",")}]`,
        );
      }
    }
    // The POPULATION, printed beside every reading - 5 seeds x 2 arenas x 3
    // levels, one gem-chasing bot. Without it these are numbers with no
    // denominator.
    console.log(`\npopulation: ${SEEDS.length} seeds x 2 arenas x 3 levels, gem-chasing bot, ${RUN_MS / 1000}s of swarm`);
    console.log(rows.join("\n"));
    expect(rows).toHaveLength(6);
  });

  it("a normal run hands the player a real number of choices, at a rate", () => {
    // The WINDOW is the assertion, not a number: too few and the run is a
    // treadmill with nothing to decide, too many and every card is free and the
    // 61 that exist stop being a choice between them.
    //
    // THE CEILING MOVED 28 -> 32 ON 2026-09-21, and the argument is the run
    // length rather than the reading. The operator ruled that a medium run lasts
    // five minutes of swarm instead of three (*"lets make it closer to 8-10
    // minutes"*, applied per level), so this bot now plays 361 seconds where it
    // used to play 234 - and a count held still across a 54% longer run is a
    // RATE that fell by a third, which is the other half of the same ruling
    // (*"Make the intervals between upgrades to be leas frequent"*).
    //
    //                    cards   seconds   per minute
    //     before          26.2       234          6.7
    //     after           29.8       361          5.0
    //
    // So the rate is asserted too, and it is the bound that carries the meaning
    // now: a gate whose bounds are chosen after reading the number is not a
    // gate, it is a description - so the number that moved is the one the design
    // changed, and the one that did not is pinned harder than before.
    for (const [shape, arena] of [["portrait", ARENA], ["landscape", ARENA_WIDE]] as const) {
      const runs = SEEDS.map((seed) => play("normal", arena, seed));
      const cards = avg(runs.map((r) => r.cards));
      const perMinute = cards / (avg(runs.map((r) => r.seconds)) / 60);
      console.log(`\n${shape}: ${cards.toFixed(1)} cards per normal run, ${perMinute.toFixed(1)} per minute`);
      expect(cards, `${shape}: cards per normal run`).toBeGreaterThanOrEqual(18);
      expect(cards, `${shape}: cards per normal run`).toBeLessThanOrEqual(32);
      // A CARD EVERY TWELVE SECONDS OR SLOWER. This is what the operator's
      // complaint was about - *"every 5-18 seconds in advanced levels"* - and it
      // is the half a per-run count cannot express.
      expect(perMinute, `${shape}: cards per minute on normal`).toBeLessThanOrEqual(5.6);
    }
  });

  it("a player AIMING at an evolution reaches one - the random bot is the wrong reader", () => {
    // Picking at random is the wrong population for this question. A player who
    // wants the railgun takes bolt levels and pierce; asking whether a bot that
    // picks uniformly stumbles into a recipe measures luck, not reachability.
    // TWELVE seeds and a RATE, not five seeds and an all-must-pass.
    //
    // Whether a particular run reaches the recipe is stochastic - the offer is
    // three cards drawn from a pool of about thirteen - so "every seed reaches
    // one" is a threshold that flakes rather than a property that holds. What
    // the design actually promises is that a player who aims at an evolution
    // USUALLY gets there, and a rate is how that is said.
    const aimed = AIM_SEEDS.map((seed) => playAiming("normal", ARENA, seed));
    const evo = aimed.map((r) => r.evolutions);
    const reached = evo.filter((n) => n > 0).length;
    console.log(
      `\naiming for the railgun: ${reached}/${AIM_SEEDS.length} runs reached one` +
        `  evolutions ${evo.join(",")}  cards ${aimed.map((r) => r.cards).join(",")}`,
    );
    expect(reached / AIM_SEEDS.length, "a player who aims at an evolution rarely gets one").toBeGreaterThanOrEqual(0.7);
  });

  it("an evolution is EARNED - a bot picking at random does not stumble into two", () => {
    // The one number the whole feature turns on. A bot that picks at random is a
    // pessimistic reader of this - a player aiming at an evolution will reach it
    // sooner - so the floor is what matters and the ceiling is the warning.
    // THE RANDOM BOT ANSWERS A DIFFERENT QUESTION from the aiming one above, and
    // conflating them is what the first version of this file did.
    //
    //   aiming  -> is an evolution REACHABLE by a player who wants it?   (10/12)
    //   random  -> is it handed out to a player who is not trying?       (0.10)
    //
    // So this one asserts the CEILING only. Asserting `max > 0` here too would
    // be a coin-flip dressed as a gate: a mean of 0.10 over ten runs is one
    // evolution in ten, and a seed set that happened to contain none would red a
    // perfectly healthy game.
    //
    // RE-ARGUED 2026-09-30, when the operator re-ruled the recipe (partner upgrade
    // taken ONCE instead of maxed; the super handed over by a boss or mini-boss
    // kill, never by a level-up card). The absolute `< 1` below it was tuned on
    // the old recipe, where the random bot read 0.10 - and the rule change moves
    // it on purpose, because one partner card is far cheaper than three to eight:
    //
    //                          random mean   aiming, normal portrait
    //     before (maxed)           0.10           9/12 reached
    //     after  (taken once)      1.00          12/12 reached
    //
    // So the property is stated as what it always meant - picking at random must
    // not out-evolve TRYING - against an aiming bot on the SAME seeds, levels and
    // arena, rather than as a constant read off the old recipe.
    const evo = SEEDS.flatMap((seed) => [
      play("normal", ARENA, seed).evolutions,
      play("wild", ARENA, seed).evolutions,
    ]);
    const aim = SEEDS.flatMap((seed) => [
      playAiming("normal", ARENA, seed).evolutions,
      playAiming("wild", ARENA, seed).evolutions,
    ]);
    const mean = avg(evo);
    console.log(
      `\nevolutions per run, normal+wild, random picks: ${evo.join(",")} (mean ${mean.toFixed(2)})` +
        `  aiming, same runs: ${aim.join(",")} (mean ${avg(aim).toFixed(2)})`,
    );
    expect(mean, "evolutions are being handed out rather than earned").toBeLessThanOrEqual(2.5);
    // And it must stay EARNED rather than free: a bot picking at random should
    // not out-evolve one that is trying.
    expect(mean, "picking at random evolves as often as aiming does").toBeLessThan(avg(aim));
  });

  it("THE CONTROL: a run that never collects a gem gets almost nothing", () => {
    // Without this, every window above passes on a simulation that hands out
    // cards for free - the readings would be high for a reason that has nothing
    // to do with the player. A bot that stands still collects only what drifts
    // into its magnet.
    const still = SEEDS.map((seed) => {
      const s = newRun("normal");
      const rng = rngFor(seed);
      let cards = 0;
      for (let i = 0; i < 40_000 && s.phase === "playing"; i++) {
        if (s.choosing) {
          const offer = offerCards(s, rng);
          if (offer.length === 0) { s.choosing = false; continue; }
          applyCard(s, offer[0]);
          cards++;
          continue;
        }
        step(s, 16, { dx: 0, dy: 0 }, rng);
      }
      return cards;
    });
    console.log(`standing still: ${still.join(",")} cards`);
    expect(avg(still), "standing still earns as much as playing").toBeLessThan(
      avg(SEEDS.map((seed) => play("normal", ARENA, seed).cards)),
    );
  });
});
