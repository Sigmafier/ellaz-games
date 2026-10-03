// EVERY CAREER NODE, PLAYED - by a careful bot, a careless one and a statue.
//
// The same bracket `pacing.test.ts` uses for the quick run
// (.claude/rules/a-perfect-bot-proves-a-level-can-be-won-not-how-hard-it-is.md):
// a level the careful arm cannot finish is broken, a level the statue finishes
// asks nothing, and between the two only the operator's own play is a verdict.
// Every row is printed on every run so the next retune starts from a reading.
//
// THE KIT A PLAYER HAS, by world, because a career is not played naked: the city
// is played with nothing, frost with what four city clears plausibly bought
// (a heart, one power, a common weapon from the warden, some magnet), lava with a
// fuller kit. Assumed rather than simulated - the shop is the player's choice - and
// written out here so the assumption is on the record next to the numbers.
import { describe, expect, it } from "vitest";
import { ARENA_WIDE, rngFor, step, type RunState } from "./logic";
import { applyCard, offerCards } from "./cards";
import { PLAIN_STATS, newCareerRun } from "./careerRun";
import { LEVELS } from "./worlds";
import { bestCard, kite, stroll } from "./testBots";
import type { CareerStats } from "./types";

const KIT: Record<string, CareerStats> = {
  city: PLAIN_STATS,
  frost: { hearts: 4, speed: 1, damage: 1.21, magnet: 1.25, luck: 15, shield: 0 },
  lava: { hearts: 5, speed: 1.08, damage: 1.5, magnet: 1.25, luck: 20, shield: 1 },
};

type Arm = "careful" | "careless" | "statue";

interface Row { won: boolean; ms: number; hp: number; gold: number; cards: number }

function play(id: string, seed: number, arm: Arm, stats: CareerStats, hard = false): Row {
  const rng = rngFor(seed);
  const s: RunState = newCareerRun(id, stats, ARENA_WIDE, "bolt", hard);
  const held = { dx: 1, dy: 0, until: 0 };
  let ms = 0;
  let cards = 0;
  while (s.phase === "playing" && ms < 600_000) {
    const input = arm === "careful" ? kite(s) : arm === "careless" ? stroll(s, rng, held) : { dx: 0, dy: 0 };
    step(s, 16, input, rng);
    ms += 16;
    if (s.choosing) {
      cards++;
      const offer = offerCards(s, rng);
      if (offer.length > 0) applyCard(s, arm === "careful" ? bestCard(offer) : offer[0]);
      else s.choosing = false;
    }
  }
  return { won: s.phase === "won", ms, hp: Math.max(0, s.hp), gold: s.career!.gold, cards };
}

const SEEDS = [11, 23, 41, 57, 71];
const cache = new Map<string, Row[]>();

function rows(id: string, arm: Arm, kitted = true): Row[] {
  const key = `${id}/${arm}/${kitted}`;
  const hit = cache.get(key);
  if (hit) return hit;
  const world = id.split("-")[0];
  const out = SEEDS.map((seed) => play(id, seed, arm, kitted ? KIT[world] : PLAIN_STATS));
  const wins = out.filter((r) => r.won).length;
  console.log(
    `${id.padEnd(10)} ${arm.padEnd(8)} ${kitted ? "kit  " : "plain"} wins ${wins}/5  ` +
      `time ${out.map((r) => (r.ms / 1000).toFixed(0)).join("/")}s  hearts ${out.map((r) => r.hp).join("/")}  ` +
      `gold ${out.map((r) => r.gold).join("/")}  cards ${out.map((r) => r.cards).join("/")}`,
  );
  cache.set(key, out);
  return out;
}
export const wins = (r: Row[]) => r.filter((x) => x.won).length;

// PINNED 2026-09-29 against the table this file prints (5 seeds, 16 ms steps, the
// PC arena). Bands, not points: a re-shuffle of the rng may move a seed, and a
// tuning change that moves a whole world should red here and be re-read.
describe("the career's levels, played", () => {
  it("prints the whole table", () => {
    for (const l of LEVELS) {
      rows(l.id, "careful");
      rows(l.id, "careless");
    }
    for (const id of ["city-1", "frost-1", "lava-1"]) rows(id, "statue");
    for (const id of ["frost-3", "lava-3", "lava-boss"]) rows(id, "careful", false);
    expect(cache.size).toBe(LEVELS.length * 2 + 6);
  });

  it("NEON CITY is learnable: the careful thumb clears every level, boss included", () => {
    for (const id of ["city-1", "city-2", "city-3"]) expect(wins(rows(id, "careful")), id).toBe(5);
    expect(wins(rows("city-boss", "careful"))).toBeGreaterThanOrEqual(4);
  });

  it("a thumb that does nothing loses - in the city too, where the dark follows it", () => {
    for (const id of ["city-1", "frost-1", "lava-1"]) expect(wins(rows(id, "statue")), id).toBeLessThanOrEqual(1);
  });

  it("the careless thumb is the bottom of the bracket everywhere", () => {
    for (const l of LEVELS) expect(wins(rows(l.id, "careless")), l.id).toBeLessThanOrEqual(wins(rows(l.id, "careful")));
    for (const id of ["frost-3", "lava-3", "lava-boss"]) expect(wins(rows(id, "careless")), id).toBeLessThanOrEqual(1);
  });

  it("FROST asks more, and can be cleared with what the city bought", () => {
    for (const id of ["frost-1", "frost-2"]) expect(wins(rows(id, "careful")), id).toBeGreaterThanOrEqual(3);
    for (const id of ["frost-3", "frost-boss"]) expect(wins(rows(id, "careful")), id).toBeGreaterThanOrEqual(1);
  });

  it("LAVA is a real challenge: a kitted careful thumb wins some and loses some, a bare one barely", () => {
    for (const id of ["lava-3", "lava-boss"]) {
      const w = wins(rows(id, "careful"));
      expect(w, `${id} never won`).toBeGreaterThanOrEqual(1);
      expect(w, `${id} always won`).toBeLessThanOrEqual(4);
    }
    // What you bought and found is what gets you through.
    expect(wins(rows("lava-boss", "careful", false))).toBeLessThan(wins(rows("lava-boss", "careful")));
    expect(wins(rows("lava-3", "careful", false))).toBeLessThanOrEqual(1);
  });
});

// THE HARD TIER (hardTier.ts, operator ruling 2026-10-03), played on the kit of a
// player who has BOUGHT THE SHOP OUT - the player hard exists for. Six hearts,
// +80% damage, every speed, magnet and luck row, the shield. On normal this kit
// three-starred the city and frost for free (scratchpad tune runs, 2026-10-03).
const GRIND: CareerStats = { hearts: 6, speed: 1.24, damage: 1.8, magnet: 1.75, luck: 30, shield: 1 };

function hardRows(id: string): Row[] {
  const key = `${id}/hard`;
  const hit = cache.get(key);
  if (hit) return hit;
  const out = SEEDS.map((seed) => play(id, seed, "careful", GRIND, true));
  console.log(
    `${id.padEnd(10)} HARD     grind wins ${wins(out)}/5  ` +
      `time ${out.map((r) => (r.ms / 1000).toFixed(0)).join("/")}s  hearts ${out.map((r) => r.hp).join("/")}  ` +
      `gold ${out.map((r) => r.gold).join("/")}  cards ${out.map((r) => r.cards).join("/")}`,
  );
  cache.set(key, out);
  return out;
}
/** Free: every seed won with every one of the six hearts still there. */
const free = (r: Row[]) => r.every((x) => x.won && x.hp >= GRIND.hearts);

describe("THE HARD TIER, played by a careful thumb on a bought-out kit", () => {
  it("prints the hard table", () => {
    for (const l of LEVELS) hardRows(l.id);
    expect(LEVELS.every((l) => cache.has(`${l.id}/hard`))).toBe(true);
  });

  it("the CITY stops being free: no hard city level is won 5 of 5 with every heart kept", () => {
    for (const id of ["city-1", "city-2", "city-3", "city-boss"]) expect(free(hardRows(id)), id).toBe(false);
  });

  it("FROST on hard is won 1 to 4 times in 5 on every level", () => {
    for (const id of ["frost-1", "frost-2", "frost-3", "frost-boss"]) {
      expect(wins(hardRows(id)), `${id} never won`).toBeGreaterThanOrEqual(1);
      expect(wins(hardRows(id)), `${id} always won`).toBeLessThanOrEqual(4);
    }
  });

  it("LAVA on hard is won 1 to 3 times in 5 on every level", () => {
    for (const id of ["lava-1", "lava-2", "lava-3", "lava-boss"]) {
      expect(wins(hardRows(id)), `${id} never won`).toBeGreaterThanOrEqual(1);
      expect(wins(hardRows(id)), `${id} too often`).toBeLessThanOrEqual(3);
    }
  });

  it("THE CONTROL: the same kit on NORMAL is free in the city - so the cell above can fail", () => {
    const normal = SEEDS.map((seed) => play("city-1", seed, "careful", GRIND));
    expect(free(normal)).toBe(true);
  });
});
