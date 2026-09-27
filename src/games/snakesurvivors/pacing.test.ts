import { describe, expect, it } from "vitest";
import { circle, hold, idle, levelBy, play, toGems } from "./bots";
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
 */

const SEEDS = [1, 2, 3, 4, 5, 6];

describe("a run that never closes a loop", () => {
  it("dies, on every level and both shapes - standing still is not a strategy", () => {
    for (const arena of [ARENA, ARENA_WIDE]) {
      for (const level of ["calm", "normal", "wild"] as const) {
        const o = play(level, 1, idle, arena);
        expect(o.end, `${level} ${arena.w}`).toBe("dead");
        expect(o.ms).toBeLessThan(60_000);
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
  it("can clear calm, warden and all, on both shapes", () => {
    for (const arena of [ARENA, ARENA_WIDE]) {
      const wins = SEEDS.map((s) => play("calm", s, circle, arena)).filter((o) => o.end === "won");
      expect(wins.length, `calm ${arena.w}`).toBeGreaterThanOrEqual(2);
      for (const w of wins) expect(w.crushed).toBeGreaterThan(100);
    }
  });

  it("can clear normal on both shapes", () => {
    for (const arena of [ARENA, ARENA_WIDE]) {
      const wins = SEEDS.map((s) => play("normal", s, circle, arena)).filter((o) => o.end === "won");
      expect(wins.length, `normal ${arena.w}`).toBeGreaterThanOrEqual(1);
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

  it("are a trickle: the looping bot is ahead at 60 s on every seed, by 3 levels on average at 90 s", () => {
    let gap90 = 0;
    let arms = 0;
    for (const arena of [ARENA, ARENA_WIDE]) {
      for (const s of SEEDS) {
        const f60 = levelBy("normal", s, toGems, 60_000, FLOOR, arena);
        const l60 = levelBy("normal", s, circle, 60_000, LOOPS, arena);
        expect(l60.lv, `seed ${s} ${arena.w}: loops ${l60.lv} floor ${f60.lv}`).toBeGreaterThan(f60.lv);
        gap90 += levelBy("normal", s, circle, 90_000, LOOPS, arena).lv - levelBy("normal", s, toGems, 90_000, FLOOR, arena).lv;
        arms++;
      }
    }
    expect(gap90 / arms).toBeGreaterThanOrEqual(3);
  });
});
