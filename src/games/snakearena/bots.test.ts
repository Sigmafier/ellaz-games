import { beforeAll, describe, expect, it } from "vitest";
import { mulberry32 } from "@shared/rng";
import { deadly, decide, movesOf, steerBots, viewOf } from "./bots";
import { carelessMove, measure, type Policy, type Shares } from "./ladder";
import { PC_SHAPE, PHONE_SHAPE, makeRound, newRound, tick, type Dir, type Point } from "./logic";
import { LEVEL, LEVELS, botsFor, type Level, type MapId } from "./setup";

const shape = { cols: 12, rows: 10 };
function line(x: number, y: number, len: number, dir: Dir): Point[] {
  const back = { left: [1, 0], right: [-1, 0], up: [0, 1], down: [0, -1] }[dir];
  return Array.from({ length: len }, (_, i) => ({ x: x + back[0] * i, y: y + back[1] * i }));
}
const never = () => 0.99; // an rng that never slips

describe("a bot's three rules", () => {
  it("never walks into a wall when a safe move exists", () => {
    const r = makeRound({ shape, snakes: [{ body: line(0, 2, 3, "down"), dir: "down" }, { body: line(11, 5, 3, "right"), dir: "right" }], apples: [], target: 0 });
    expect(["up", "down"]).toContain(decide(r, 1, 0, never));
  });

  it("never walks into a body when a safe move exists", () => {
    const r = makeRound({
      shape,
      snakes: [
        { body: [4, 5, 6, 7, 8].map((y) => ({ x: 6, y })), dir: "up" }, // a body standing across the bot's path
        { body: line(5, 5, 3, "right"), dir: "right" },
      ],
      apples: [{ x: 9, y: 5 }],
      target: 0,
    });
    expect(["up", "down"]).toContain(decide(r, 1, 0, never));
  });

  it("goes for the nearest apple it can reach", () => {
    const r = makeRound({ shape, snakes: [{ body: line(2, 9, 3, "right"), dir: "right" }, { body: line(6, 5, 3, "up"), dir: "up" }], apples: [{ x: 2, y: 5 }, { x: 11, y: 0 }], target: 0 });
    expect(decide(r, 1, 0, never)).toBe("left");
  });

  it("stays out of a pocket smaller than itself, apple or no apple", () => {
    // Another snake lies along row 8 and up the left edge, its head at the
    // pocket's mouth, so the four cells under it stay walled for longer than it
    // takes to reach the end of them. The apple is at the back of that strip.
    const blocker = [{ x: 3, y: 8 }, { x: 2, y: 8 }, { x: 1, y: 8 }, { x: 0, y: 8 }, ...[7, 6, 5, 4, 3, 2].map((y) => ({ x: 0, y }))];
    const r = makeRound({
      shape,
      snakes: [
        { body: blocker, dir: "right" },
        { body: line(4, 9, 6, "left"), dir: "left" }, // head (4,9), going left along the bottom
      ],
      apples: [{ x: 1, y: 9 }],
      target: 0,
    });
    // Left is the dead end with the apple in it; up is the open board.
    expect(decide(r, 1, 0, never)).toBe("up");
  });

  it("does not step beside another head if it can help it - a head-on puts both out", () => {
    const r = makeRound({
      shape,
      snakes: [
        { body: line(6, 4, 3, "left"), dir: "left" }, // its next cell may be (5,4)
        { body: line(4, 4, 3, "right"), dir: "right" }, // so going right is a coin toss on both lives
      ],
      apples: [{ x: 5, y: 4 }],
      target: 0,
    });
    expect(decide(r, 1, 0, never)).not.toBe("right");
  });

  it("a slip is a random move, never one that is out on the spot", () => {
    const r = makeRound({ shape, snakes: [{ body: line(0, 2, 3, "down"), dir: "down" }, { body: line(11, 5, 3, "right"), dir: "right" }], apples: [], target: 0 });
    const rng = mulberry32(5);
    for (let i = 0; i < 200; i++) expect(decide(r, 1, 1, rng)).not.toBe("right");
  });

  it("across whole seeded rounds, no bot and no careless player ever takes a deadly move a safe one was there for", () => {
    let checked = 0;
    for (let seed = 1; seed <= 12; seed++) {
      const rng = mulberry32(seed);
      let r = newRound(seed % 2 ? PC_SHAPE : PHONE_SHAPE, 5, rng);
      while (!r.over) {
        const v = viewOf(r);
        for (const s of r.snakes) {
          if (!s.alive || movesOf(s).every((d) => deadly(r, v, s, d))) continue;
          expect(deadly(r, v, s, decide(r, s.id, LEVEL.hard.mistake, rng, v))).toBe(false);
          expect(deadly(r, v, s, carelessMove(r, v, s.id, rng))).toBe(false);
          checked++;
        }
        r = tick(steerBots(r, LEVEL.hard.mistake, rng), rng).round;
      }
    }
    expect(checked).toBeGreaterThan(1000);
  }, 60_000);

  it("steers every bot and never the player", () => {
    const r = newRound(PC_SHAPE, 4, mulberry32(3));
    const s = steerBots({ ...r, apples: [{ x: 0, y: 0 }] }, 0, mulberry32(1));
    expect(s.snakes[0]).toEqual(r.snakes[0]);
  });
});

/**
 * THE LADDER, measured: 360 seeded rounds, bots against a player who is also a
 * bot, 30 per board shape per level per arm, both shapes summed.
 *
 *   level                    fair   careful win   careless win
 *   Easy   (2 bots, 185 ms)  0.333     0.683          0.100
 *   Normal (3 bots, 140 ms)  0.250     0.567          0.017
 *   Hard   (5 bots, 140 ms)  0.167     0.300          0.000
 *
 * LEVELS, 2026-10-01 (forum review: "Easy could be 2 opponents, hard 4 or 5.
 * Slower on easy."). Normal and Hard ARE the old 3- and 5-bot rounds - same
 * bots, step and slip rate, and an Open deal draws from the RNG exactly as
 * before - so their two rows did not move. Easy's slip rate was measured, not
 * felt, at four values on these same seeds:
 *
 *   Easy slip   careful win   careless win
 *     0.06         0.517          0.067     <- under Normal's 0.567: not easier
 *     0.08         0.583          0.017     <- a gap of one round in sixty
 *     0.10         0.617          0.033
 *     0.12         0.683          0.100     <- chosen: a clear step down
 *
 * 0.12 leaves the careless arm at 10%, inside the "loses most rounds" bound
 * below. The slower step is the half a person feels and node cannot: the
 * harness plays in steps, so 185 ms shows up only as a shorter round (486
 * steps for 642), which is part of why Easy's careful player lasts longer.
 *
 * "Fair" is one share in n+1. The two arms are the bounds a person sits between:
 *
 * - CAREFUL is the bots' own logic with no slips. It should win AT LEAST its
 *   fair share, because the only thing between it and the bots is the slip
 *   rate - if it cannot, the bots are stronger than anything a player who reads
 *   the board perfectly can be, which is not a fair game. `MISTAKE` still forgives
 *   more at 3 bots than at 5, so careful wins well past its fair share there too.
 * - CARELESS moves at random among the moves that do not die on the spot and
 *   never chases an apple. It should LOSE MOST rounds - a player not steering
 *   anywhere must not win just because the bots crash. It wins 0 to 2%, and
 *   only ever by being the last one left.
 *
 * RAISED 2026-09-28, the same day as the gentler round (safe start, roomier
 * phone board, apples kept off anyone's head): a snake that cannot be put out
 * for its first 3 seconds, and a bigger phone board, both hand the CAREFUL arm
 * more of the round to work with, and it took the win share up across the
 * table (was 0.367 / 0.2 / 0.167) while CARELESS - who gets no benefit from
 * surviving longer, since it still never plans a route to an apple - fell (was
 * 0.117 / 0.05 / 0.083). The invariants below did not move; only the pin did.
 *
 * Why the slips: with `MISTAKE` at 0 the careful arm measured 0.30 and 0.12 at
 * 3 and 5 bots (under its fair share at 5), and with slips that could hit a
 * wall the bots crashed so often that the careless arm won 45% - survival was
 * the whole game. A slip is a random move that is NOT out on the spot, and at
 * 0.15 per step the careful arm won 47% and the careless 22%, so the table
 * sits between the two.
 *
 * Deterministic - every round is a function of its seed - so these are pinned
 * exactly: a change to the bots or the rules moves them, and this is where the
 * next person reads what it moved.
 */
describe("the bot ladder", () => {
  const ROUNDS = 30;
  const both = (level: Level, p: Policy, map: MapId = "open") => {
    const a: Shares = measure(PC_SHAPE, level, p, ROUNDS, 1, map);
    const b: Shares = measure(PHONE_SHAPE, level, p, ROUNDS, 1, map);
    return { win: (a.win + b.win) / 2, survive: (a.survive + b.survive) / 2, place: (a.place + b.place) / 2 };
  };
  type Row = { level: Level; bots: number; careful: ReturnType<typeof both>; careless: ReturnType<typeof both> };
  let table: Row[] = [];
  beforeAll(() => {
    table = LEVELS.map((level) => ({ level, bots: botsFor(level, 1), careful: both(level, "careful"), careless: both(level, "careless") }));
  }, 180_000);
  const r3 = (x: number) => Math.round(x * 1000) / 1000;

  it("prints the table", () => {
    for (const row of table) {
      console.log(
        `${row.level} (${row.bots} bots)  fair ${r3(1 / (row.bots + 1))}  careful win ${r3(row.careful.win)} survive ${r3(row.careful.survive)} place ${r3(row.careful.place)}` +
          `  careless win ${r3(row.careless.win)} survive ${r3(row.careless.survive)} place ${r3(row.careless.place)}`,
      );
    }
    expect(table.map((t) => [t.level, r3(t.careful.win), r3(t.careless.win)])).toEqual([
      ["easy", 0.683, 0.1],
      ["normal", 0.567, 0.017],
      ["hard", 0.3, 0],
    ]);
  });

  it("each level is harder than the one before it: a careful player's win share strictly falls Easy > Normal > Hard", () => {
    for (let i = 1; i < table.length; i++) expect(table[i].careful.win, `${table[i].level}`).toBeLessThan(table[i - 1].careful.win);
  });

  it("a careless player loses most rounds at every level", () => {
    for (const row of table) expect(row.careless.win, row.level).toBeLessThan(0.2);
  });

  it("a careful player wins at least its fair share at every level", () => {
    for (const row of table) expect(row.careful.win, row.level).toBeGreaterThanOrEqual(1 / (row.bots + 1) - 0.001);
  });

  it("and careful always beats careless", () => {
    for (const row of table) expect(row.careful.win).toBeGreaterThan(row.careless.win);
  });
});

/**
 * THE ROCKS MAP, measured on the same seeds (2026-10-01), careful win share:
 *
 *            Open    Rocks
 *   Easy     0.683   0.750
 *   Normal   0.567   0.500
 *   Hard     0.300   0.350
 *
 * Rocks do not make the bot-measured round uniformly harder: they cost a bot
 * room as much as they cost the player, and on Easy and Hard that comes out a
 * few rounds in sixty in the player's favour. What a person meets is a board
 * with less open floor to plan on, which this harness cannot weigh. What it
 * CAN hold is the order: on Rocks too, each level is harder than the last.
 */
describe("the bot ladder on Rocks", () => {
  const ROUNDS = 30;
  const careful = (level: Level) =>
    (measure(PC_SHAPE, level, "careful", ROUNDS, 1, "rocks").win + measure(PHONE_SHAPE, level, "careful", ROUNDS, 1, "rocks").win) / 2;
  let rows: [Level, number][] = [];
  beforeAll(() => {
    rows = LEVELS.map((l) => [l, Math.round(careful(l) * 1000) / 1000]);
  }, 180_000);

  it("prints and pins the careful win share per level", () => {
    console.log(`rocks careful win: ${rows.map(([l, w]) => `${l} ${w}`).join("  ")}`);
    expect(rows).toEqual([
      ["easy", 0.75],
      ["normal", 0.5],
      ["hard", 0.35],
    ]);
  });

  it("each level is still harder than the one before it", () => {
    for (let i = 1; i < rows.length; i++) expect(rows[i][1], rows[i][0]).toBeLessThan(rows[i - 1][1]);
  });
});
