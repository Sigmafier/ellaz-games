import { describe, expect, it } from "vitest";
import { circle, hold, idle, levelBy, play, toGems, type Outcome } from "./bots";
import { BOSS_AT, stageGoal } from "./crowd";
import { ARENA, ARENA_WIDE } from "./logic";
import type { Arena, LevelKey } from "./types";

/**
 * Whole runs, played by bots, on both arena shapes.
 *
 * These pin properties of the RULES, measured 2026-09-27 - not predictions of
 * how a person plays. Each is the answer to a defect the bots actually found.
 * Re-measured the same day once the safe start and floor gems landed (R2.4) -
 * the first twenty seconds no longer bite, so every death moved ~15 s later:
 *
 *                       phone 420x560          PC 648x364
 *   idle   (no steer)   dies ~40 s, 0 crushed  dies ~40 s, 0 crushed   (was ~25 / ~28)
 *   hold   (one key)    dies ~41 s, 0 crushed  dies ~40 s, 0 crushed   (was ~25 / ~23)
 *   circle, calm        wins 4 of 6            wins 2 of 6             (was 3 / 2)
 *   circle, normal      wins 3 of 6            wins 2 of 6             (was 1 / 3)
 *
 * NOT pinned, and handed to the operator's play instead: on WILD the circling
 * bot grows to the 60-segment cap and circles a loop so wide the crowd - the
 * warden included - settles inside it without ever reaching the head, so five
 * of six runs hit the eight-minute cap (after R2.4: all six on the phone, three
 * of six on the PC). Whether a person does that, and whether
 * it matters, is a question a bot this crude cannot answer.
 *
 * ROUND THREE (2026-09-28) moved every row - a bump costs one, the loop snaps
 * shut from 42 units, half the crowd, and the warden comes at 50 long or 10
 * crushed instead of on a clock. Re-measured, same bots, same seeds:
 *
 *                       phone 420x560            PC 648x364
 *   idle   (no steer)   dies ~58 s, 0 crushed    dies ~56-59 s, 0 crushed
 *   hold   (one key)    dies ~59 s, 0 crushed    dies ~58-60 s, 0 crushed
 *   circle, calm        wins 6 of 6, 37-42 s     wins 6 of 6, 36-41 s
 *   circle, normal      wins 6 of 6, 31-34 s     wins 6 of 6, 32-40 s
 *   circle, wild        wins 6 of 6, 29-32 s     wins 6 of 6, 29-38 s
 *
 * The circling bot reaches ten crushed 25-28 s in - seven seconds after the
 * safe start - so the warden comes at level 2, and the WILD time-outs above are
 * gone. A run for a player who loops is now about half a minute long; that is
 * the trigger working exactly as asked, and whether it is the right length is
 * the operator's call, not a bot's.
 *
 * ROUND FOUR (2026-09-28, operator ruling): "why does the game finish so
 * early?" - a run that ends in half a minute is the answer to a different
 * question than the one just asked. Three stages now, three wardens (hp
 * 3/4/5), each one's trigger a higher total CRUSHED (10/25/45); stage 2 and 3
 * also raise the crowd (`STAGE_CROWD` in `tuning.ts`) - a higher cap, the brute
 * joining sooner, and every non-warden shape TOUGHER (2 loops a kill at stage
 * 2, 3 at stage 3), which is what actually buys the extra minutes: a denser
 * crowd that dies just as fast is a denser crowd that reaches 45 SOONER, not
 * later (measured first, and undone - see `STAGE_CROWD`'s own comment).
 * Spawns were tuned SLOWER at the higher stages, not faster, for the same
 * reason: this game's whole crowd cools down fast (`LOOP_COOL_MS` 350 ms), so
 * a circling bot is refill-rate-bound, not cap-bound, once the fight is real.
 *
 * Re-measured, same six seeds, both arenas, full runs to `won` or `dead`:
 *
 *                       phone 420x560              PC 648x364
 *   circle, calm        wins 6/6, 330-347 s        wins 6/6, 332-357 s
 *   circle, normal      wins 6/6, 248-255 s        wins 6/6, 245-249 s
 *   circle, wild        wins 6/6, 207-211 s        wins 6/6, 206-213 s
 *
 * 36 of 36 won - every seed, every level, every arena - with the boss-1 leg
 * unchanged (26-34 s) and boss 2 and boss 3 each adding real minutes: boss 2
 * around the 1:30-2:15 mark, boss 3 around 3:20-5:45, the win a few seconds
 * after boss 3 falls (its own hp is what makes THAT leg short - a fight, not a
 * trickle). Calm is the slowest arm (the crowd ramps slowest there) and wild
 * the fastest, the same ordering round three measured - not something this
 * round changed, just carried forward at the new scale.
 *
 * ROUND FOUR, second pass (2026-09-29, operator): "it should be longer,
 * harder, more enemies, more powers ... the closing loop circle is not good
 * enough." The table above was a long run in an EMPTY arena: stage 2 held 0.9
 * shapes on the floor and stage 3 0.8, because `STAGE_CROWD.spawn` (3.8, 6.6)
 * multiplied the GAP between spawns. Now each stage sends faster and holds
 * more, shapes and wardens are tougher, the triggers ask for many more crushes,
 * and a loop closes from three quarters of a lap. Re-measured the same day,
 * seeds 1-6, first card every time (`circle`), no card ever (`nocard`):
 *
 *   NORMAL                phone 420x560                    PC 648x364
 *   circle   wins         5/6, 389-481 s                   6/6, 389-744 s
 *            stage 2 at   31-35 s                          32-36 s
 *            stage 3 at   213-231 s                        208-372 s
 *            on the floor 4.7 / 9.3 / 19.4 (max 11/26/44)  4.8 / 11.0 / 14.0 (max 11/26/44)
 *            level-ups    11-16 (the one death: 4)         5-12
 *   nocard   wins         1/6, deaths all in stage 2       4/6, deaths all in stage 2
 *   toGems   wins         3/6 (dies in stage 1 or 2)       6/6
 *
 *   CALM     circle 6/6 and 6/6, 421-442 s; nocard 5/6 and 6/6
 *            on the floor 3.5 / 6.1 / 10.4 and 3.4 / 6.3 / 11.0
 *   WILD     circle 3/6 and 2/6 (wins 367-453 s, every death in stage 2)
 *            on the floor 5.9 / 8.9 / 28.7 and 5.8 / 7.4 / 30.1; nocard 0/6 and 0/6
 *   idle and hold: dead by 55-62 s on every level and shape, 0 crushed
 *
 * The CARELESS row is honest rather than tidy: a bot that loops but never
 * takes a card dies in stage 2 on 7 of 12 normal arms, and the gem chaser -
 * whose curves now close loops from three quarters of a lap - wins most of its
 * normal runs. The bounds below pin what the operator asked for, a little
 * wider than measured so a seed's jitter is not a failure.
 *
 * R4.5 (2026-09-29, the operator's in-game report: "more enemies, more bosses
 * and monsters, more difficulty growing, faster monsters"): a dasher from
 * stage 2, a shooter from stage 3, a mini-boss halfway to every warden, a
 * crowd that CLIMBS into each stage instead of jumping (`crowdAt`), a pace that
 * grows by the level's `climb` every stage (calm 16%, normal and wild 22%), a
 * loop cooldown of 700 ms (was 350), and bumps that cost more later in a run
 * on normal and wild (`biteCost`). The table above had every circling-bot death
 * in the first minute of stage 2.
 *
 * TWELVE seeds now for the careful bot, not six: this crowd is chaotic enough
 * that one constant moved one or two runs of six either way, and the
 * operator's targets are RATES ("about 4-5 of 6"), which twelve reads honestly.
 * Re-measured 2026-09-29:
 *
 *                       phone 420x560                  PC 648x364
 *   CALM    circle      11/12, wins 402-625 s          10/12, wins 403-446 s
 *           deaths      stage 2 at 258 s               stage 2 at 178, stage 3 at 450 s
 *           on floor    3.5 / 5.3 / 15.0               3.5 / 6.0 / 16.1
 *   NORMAL  circle      9/12, wins 370-566 s           8/12, wins 369-379 s
 *           deaths      stage 2 at 149, stage 3 at     stage 2 at 146, stage 3 at
 *                       322 and 349 s                  304, 477 and 564 s
 *           on floor    4.7 / 8.6 / 19.0               4.8 / 9.4 / 22.1
 *           level-ups   9-16 a win                     11-16 a win
 *   WILD    circle      7/12, wins 346-353 s           8/12, wins 344-375 s
 *           deaths      stage 2 at 106-130 s (4),      stage 2 at 106 s,
 *                       stage 3 at 361 s               stage 3 at 243, 274 and 356 s
 *           on floor    5.7 / 9.5 / 20.8               5.7 / 8.2 / 24.0
 *
 *   careless, 6 seeds:  nocard dies 12 of 12 on normal (stage 2: 10, stage 3: 2)
 *                       and 11 of 12 on calm; toGems wins 2/6 and 4/6 on normal
 *
 * So the careful bot's deaths now fall in stage 2 AND stage 3, and a stage-2
 * death comes a minute or more in, never at the opening.
 */

const SEEDS = [1, 2, 3, 4, 5, 6];
/** The careful bot's population since R4.5: twelve seeds - see the table above. */
const SEEDS12 = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
const LEVELS_ = ["calm", "normal", "wild"] as const;
const SHAPES = [ARENA, ARENA_WIDE] as const;

/** Whole runs are the expensive part: each (level, shape, bot) is played once and read by every cell. */
const memo = new Map<string, Outcome[]>();
function runs(level: LevelKey, arena: Arena, who: "circle" | "nocard"): Outcome[] {
  const key = `${level} ${arena.w} ${who}`;
  let out = memo.get(key);
  if (!out) {
    const rules = { loops: true, weapons: true, cards: who === "circle" };
    out = (who === "circle" ? SEEDS12 : SEEDS).map((s) => play(level, s, circle, arena, 14 * 60_000, rules));
    memo.set(key, out);
  }
  return out;
}
/** Whole runs of six to fourteen minutes each: a cell may take a while on a busy machine. */
const WHOLE_RUNS_MS = 300_000;
const median = (xs: number[]) => [...xs].sort((a, b) => a - b)[Math.floor(xs.length / 2)];

describe("a run that never closes a loop", () => {
  it("dies, on every level and both shapes - standing still is not a strategy", () => {
    for (const arena of SHAPES) {
      for (const level of LEVELS_) {
        const o = play(level, 1, idle, arena);
        expect(o.end, `${level} ${arena.w}`).toBe("dead");
        // 55-62 s measured (round four did not touch stage 1's crowd).
        expect(o.ms).toBeLessThan(75_000);
      }
    }
  });

  it("dies when it only spins in place - the tightest turn crushes nothing", () => {
    for (const arena of SHAPES) {
      for (const level of LEVELS_) {
        const o = play(level, 2, hold, arena);
        expect(o.end, `${level} ${arena.w}`).toBe("dead");
        expect(o.crushed).toBe(0);
      }
    }
  });
});

describe("round four: longer, harder, more enemies", () => {
  it("a careful looping bot wins most NORMAL runs, and a win takes minutes of fighting", () => {
    for (const arena of SHAPES) {
      const os = runs("normal", arena, "circle");
      const wins = os.filter((o) => o.end === "won");
      // R4.5: 9/12 and 8/12 measured - "about 4-5 of 6": most runs, NOT every run.
      expect(wins.length, `normal ${arena.w}`).toBeGreaterThanOrEqual(7);
      expect(wins.length, `normal ${arena.w}`).toBeLessThanOrEqual(10);
      for (const w of wins) {
        expect(w.crushed).toBeGreaterThanOrEqual(stageGoal("normal", 3).crushed);
        // 369-566 s measured: never under 5:30.
        expect(w.ms, `normal ${arena.w}`).toBeGreaterThan(330_000);
      }
      // The operator's 6-9 minutes, read as the middle win: 375 and 375 s measured.
      expect(median(wins.map((w) => w.ms)), `normal ${arena.w}`).toBeGreaterThan(360_000);
      expect(median(wins.map((w) => w.ms)), `normal ${arena.w}`).toBeLessThan(540_000);
    }
  }, WHOLE_RUNS_MS);

  it("calm stays winnable: at least 5 of 6 on both shapes", () => {
    for (const arena of SHAPES) {
      // 11/12 and 10/12 measured (R4.5).
      expect(runs("calm", arena, "circle").filter((o) => o.end === "won").length, `calm ${arena.w}`).toBeGreaterThanOrEqual(10);
    }
  }, WHOLE_RUNS_MS);

  it("wild is not a formality: the careful bot loses at least 2 of 6 on each shape, and still wins some", () => {
    for (const arena of SHAPES) {
      const wins = runs("wild", arena, "circle").filter((o) => o.end === "won").length;
      // 7/12 and 8/12 measured (R4.5) - the operator's "at most 4 of 6".
      expect(wins, `wild ${arena.w}`).toBeLessThanOrEqual(8);
      expect(wins, `wild ${arena.w}`).toBeGreaterThan(0);
    }
  }, WHOLE_RUNS_MS);

  /** The games-doctrine pacing rule: a stage holding fewer than the one before it is a defect. */
  it("every stage holds more shapes on the floor than the one before it, on every level and shape", () => {
    for (const arena of SHAPES) {
      for (const level of LEVELS_) {
        const avg = [1, 2, 3].map((k) => {
          const seen = runs(level, arena, "circle").flatMap((o) => o.stages.filter((s) => s.stage === k));
          return seen.reduce((n, s) => n + s.avg, 0) / seen.length;
        });
        expect(avg[1], `${level} ${arena.w} stage 2 over 1`).toBeGreaterThan(avg[0]);
        expect(avg[2], `${level} ${arena.w} stage 3 over 2`).toBeGreaterThan(avg[1]);
      }
    }
  }, WHOLE_RUNS_MS);

  it("normal comes close to the target crowd - about 5, 9 and 14 on the floor", () => {
    for (const arena of SHAPES) {
      const avg = [1, 2, 3].map((k) => {
        const seen = runs("normal", arena, "circle").flatMap((o) => o.stages.filter((s) => s.stage === k));
        return seen.reduce((n, s) => n + s.avg, 0) / seen.length;
      });
      // R4.5: 4.7 / 8.6 / 19.0 and 4.8 / 9.4 / 22.1 measured. Stage 2's crowd
      // CLIMBS in from stage 1's numbers over its first quarter now.
      expect(avg[0], `${arena.w}`).toBeGreaterThan(4);
      expect(avg[1], `${arena.w}`).toBeGreaterThan(7);
      expect(avg[2], `${arena.w}`).toBeGreaterThan(14);
    }
  }, WHOLE_RUNS_MS);

  it("a whole normal run sees about 10 to 15 level-ups", () => {
    const ups = SHAPES.flatMap((a) => runs("normal", a, "circle").filter((o) => o.end === "won").map((o) => o.ups));
    // R4.5: 9-16 measured across the seventeen wins, the middle one 12.
    expect(median(ups)).toBeGreaterThanOrEqual(9);
    expect(median(ups)).toBeLessThanOrEqual(18);
    expect(Math.max(...ups)).toBeGreaterThanOrEqual(12);
  }, WHOLE_RUNS_MS);

  it("a careless bot - loops, never takes a card - dies on normal more often than not, and in stage 2 or 3", () => {
    const os = SHAPES.flatMap((a) => runs("normal", a, "nocard"));
    const dead = os.filter((o) => o.end === "dead");
    // R4.5: 12 of 12 measured - 10 in stage 2, 2 in stage 3.
    expect(dead.length).toBeGreaterThanOrEqual(9);
    for (const d of dead) expect(d.stage).toBeGreaterThanOrEqual(2);
  }, WHOLE_RUNS_MS);

  /**
   * R4.5, the operator's "difficulty that keeps growing": round four's circling
   * bot died only in the first minute of stage 2 - a wall. Now its deaths fall
   * in BOTH later stages, and a stage-2 death comes after the crowd has climbed
   * in, not at the opening.
   */
  it("when the careful bot dies, it dies in stage 2 AND in stage 3 - never all at the stage-2 opening", () => {
    const deaths = LEVELS_.flatMap((level) => SHAPES.flatMap((a) => runs(level, a, "circle"))).filter((o) => o.end === "dead");
    // 21 deaths measured across the 72 runs: 10 in stage 2, 11 in stage 3.
    expect(deaths.length).toBeGreaterThanOrEqual(6);
    expect(deaths.some((d) => d.stage === 2)).toBe(true);
    expect(deaths.some((d) => d.stage === 3)).toBe(true);
    expect(deaths.filter((d) => d.stage === 3).length * 3).toBeGreaterThanOrEqual(deaths.length);
    for (const d of deaths) {
      expect(d.stage, "no careful death in stage 1").toBeGreaterThan(1);
      const s2 = d.stages.find((s) => s.stage === 2)!;
      // At least 45 s into stage 2: the crowd has climbed in by then.
      if (d.stage === 2) expect(d.ms - s2.at).toBeGreaterThan(45_000);
    }
  }, WHOLE_RUNS_MS);

  /**
   * A boss can only fall through `crush()`, and `crush()` is only ever
   * reached from a closed loop - so this is a structural guarantee, not a
   * probability. `play`'s `loops: false` holds both loop cooldowns shut for
   * ever (the head's and the tail's), so no loop this bot draws can register.
   * Weapons stay ON, so the bot gets every advantage a loop cannot give it,
   * and still cannot touch a single warden.
   */
  it("a bot that never loops never wins, however long it plays", () => {
    for (const arena of SHAPES) {
      for (const level of LEVELS_) {
        for (const s of SEEDS) {
          const o = play(level, s, circle, arena, 8 * 60_000, { loops: false, weapons: true });
          expect(o.end, `${level} ${arena.w} seed ${s}`).not.toBe("won");
        }
      }
    }
  }, WHOLE_RUNS_MS);
});

/**
 * Floor gems (operator ruling R2.4): a player who has not closed a loop yet
 * must still be able to grow and level - but slowly enough that looping stays
 * the way to play. Two arms, the same six seeds, both arena shapes, NORMAL (the
 * level a new player opens on):
 *
 *   FLOOR   toGems, loops held off, never a weapon   floor gems and nothing else
 *   LOOPS   circle, loops on, first card every time   the careful looping bot
 *
 * Measured 2026-09-27 (floor: first at 0.8 s, one every 3 s, 4 out at once;
 * safe start 20 s):
 *
 *                     level 2 at        level at 60 s   level at 90 s
 *   FLOOR, phone      19.6 - 22.2 s     2 - 3           2 - 3, all dead by 57 s
 *   FLOOR, PC         20.9 - 21.9 s     2 - 3           2 - 3, all dead by 80 s
 *   LOOPS, phone      24.9 - 26.1 s     4 - 5           6 - 7
 *   LOOPS, PC         25.6 - 26.3 s     3 - 5           3 - 7  (one run dead at 47 s)
 *
 * So the floor gets a new player to their FIRST card sooner than looping does -
 * during the safe start the crowd wanders instead of falling into a circle, and
 * that is the window floor gems exist for - and then falls behind for good:
 * one gem every 3 s is about a third of what a looping bot crushes, and 1/3 of a
 * segment a gem cannot pay back the bites a player who never loops still takes.
 *
 * NOT PINNED, and handed to the operator: a bot that never loops but DOES take
 * fangs reaches level 8 by 90 s on 6 of 12 arms, one level past the looping bot,
 * because every shape that chases it into its mouth drops a gem there. Floor
 * gems are what get it to its first card; the card is the bite, and whether a
 * bite build that never loops should be that strong is a card question.
 */
describe("floor gems, for a player who has not learnt to loop", () => {
  const FLOOR = { loops: false, weapons: false };
  const LOOPS = { loops: true, weapons: true };
  /** 30 s against a measured 22.2 s worst: room for a retune, and still inside a first minute. */
  const LV2_BY_MS = 30_000;

  it("level a bot that never loops to level 2 within 30 s, on every seed and both shapes", () => {
    for (const arena of [ARENA, ARENA_WIDE]) {
      for (const s of SEEDS) {
        const o = levelBy("normal", s, toGems, LV2_BY_MS, FLOOR, arena);
        expect(o.crushed, `seed ${s}`).toBe(0);
        expect(o.lv2At, `seed ${s} ${arena.w}`).toBeLessThanOrEqual(LV2_BY_MS);
      }
    }
  });

  /**
   * Round three re-pinned this. "The looping bot is ahead at 60 and 90 s" could
   * not survive the boss trigger: the looping bot has WON by 31-40 s, at level 2,
   * so there is no level at 60 s to compare. What the rule was for - a player
   * who never loops is not carried by the floor - is now read off the warden:
   *
   *                  warden came at     at 120 s
   *   LOOPS, phone   25 - 27 s          won, all six, by 34 s
   *   LOOPS, PC      26 - 28 s          won, all six, by 40 s
   *   FLOOR, phone   never              length 2 - 24, three of six dead
   *   FLOOR, PC      never              length 3 - 17, three of six dead
   */
  it("are a trickle: the looping bot brings the warden within 40 s, floor gems alone never do", () => {
    for (const arena of [ARENA, ARENA_WIDE]) {
      for (const s of SEEDS) {
        const l40 = levelBy("normal", s, circle, 40_000, LOOPS, arena);
        expect(l40.crushed, `loops seed ${s} ${arena.w}`).toBeGreaterThanOrEqual(BOSS_AT.crushed);
        const f90 = levelBy("normal", s, toGems, 90_000, FLOOR, arena);
        expect(f90.crushed, `floor seed ${s} ${arena.w}`).toBe(0);
        expect(f90.end, `floor seed ${s} ${arena.w}`).not.toBe("won");
      }
    }
  });
});
