import { describe, expect, it } from "vitest";
import { circle, hold, idle, levelBy, play, toGems } from "./bots";
import { BOSS_AT, STAGE_TRIGGER } from "./crowd";
import { ARENA, ARENA_WIDE } from "./logic";

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
 * also raise the crowd (`STAGE_CROWD` in `crowd.ts`) - a higher cap, the brute
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
 */

const SEEDS = [1, 2, 3, 4, 5, 6];

describe("a run that never closes a loop", () => {
  it("dies, on every level and both shapes - standing still is not a strategy", () => {
    for (const arena of [ARENA, ARENA_WIDE]) {
      for (const level of ["calm", "normal", "wild"] as const) {
        const o = play(level, 1, idle, arena);
        expect(o.end, `${level} ${arena.w}`).toBe("dead");
        // 56-59 s measured since a bump costs one segment (was ~40 s at two).
        expect(o.ms).toBeLessThan(75_000);
      }
    }
  });

  it("dies when it only spins in place - the tightest turn crushes nothing", () => {
    for (const arena of [ARENA, ARENA_WIDE]) {
      for (const level of ["calm", "normal", "wild"] as const) {
        const o = play(level, 2, hold, arena);
        expect(o.end, `${level} ${arena.w}`).toBe("dead");
        expect(o.crushed).toBe(0);
      }
    }
  });
});

describe("a run that keeps closing loops", () => {
  /**
   * ROUND FOUR: clearing the run now means all THREE wardens, not one -
   * `crushed` at the win is `STAGE_TRIGGER[3].crushed` (45) or more, never the
   * old single-boss ten.
   */
  it("can clear every level, warden and all THREE, on both shapes", () => {
    for (const arena of [ARENA, ARENA_WIDE]) {
      for (const level of ["calm", "normal", "wild"] as const) {
        const wins = SEEDS.map((s) => play(level, s, circle, arena)).filter((o) => o.end === "won");
        // 36 of 36 measured 2026-09-28; 5 of 6 leaves room for a retune.
        expect(wins.length, `${level} ${arena.w}`).toBeGreaterThanOrEqual(5);
        for (const w of wins) expect(w.crushed).toBeGreaterThanOrEqual(STAGE_TRIGGER[3].crushed);
      }
    }
  });

  /**
   * THE TARGET the operator set, measured with `circle` (a good looping bot):
   * about 4-6 minutes to clear all three, and never under 3 - a run that ends
   * in half a minute is the exact complaint this round answers. The bounds
   * here are wider than the measured 206-357 s table above on purpose: a
   * pinned test should fail on a real regression, not on next seed's jitter.
   */
  it("never wins before 3 minutes, whatever the level or arena", () => {
    for (const arena of [ARENA, ARENA_WIDE]) {
      for (const level of ["calm", "normal", "wild"] as const) {
        for (const s of SEEDS) {
          const o = play(level, s, circle, arena);
          if (o.end === "won") expect(o.ms, `${level} ${arena.w} seed ${s}`).toBeGreaterThan(180_000);
        }
      }
    }
  });

  it("a good looping bot clears the whole run in minutes - about 4 to 6", () => {
    for (const arena of [ARENA, ARENA_WIDE]) {
      for (const level of ["calm", "normal", "wild"] as const) {
        const wins = SEEDS.map((s) => play(level, s, circle, arena)).filter((o) => o.end === "won");
        expect(wins.length, `${level} ${arena.w}`).toBeGreaterThan(0);
        for (const w of wins) {
          expect(w.ms, `${level} ${arena.w}`).toBeGreaterThan(180_000);
          // 7 minutes: past the measured 5:57 ceiling (calm), room for a retune.
          expect(w.ms, `${level} ${arena.w}`).toBeLessThan(420_000);
        }
      }
    }
  });

  /**
   * A boss can only fall through `crush()`, and `crush()` is only ever
   * reached from a closed loop - so this is a structural guarantee, not a
   * probability. `play`'s `loops: false` forces `run.loopCool` open forever
   * (the same trick `levelBy` already used below), so no loop this bot draws
   * can ever register, however wide or however long it circles. Weapons stay
   * ON, so the bot gets every advantage a loop cannot give it, and still
   * cannot touch a single warden (`headContacts`/`bodyContacts`/`spit` all
   * skip `kind === "warden"`).
   */
  it("a bot that never loops never wins, however long it plays", () => {
    for (const arena of [ARENA, ARENA_WIDE]) {
      for (const level of ["calm", "normal", "wild"] as const) {
        for (const s of SEEDS) {
          const o = play(level, s, circle, arena, 8 * 60_000, { loops: false, weapons: true });
          expect(o.end, `${level} ${arena.w} seed ${s}`).not.toBe("won");
        }
      }
    }
  });
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
