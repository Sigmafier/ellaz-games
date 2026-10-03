// EVERY CAREER NODE, PLAYED - by a careful bot and a careless one, at four kits.
//
// The same bracket `pacing.test.ts` uses for the quick run: the circling bot,
// CAREFUL takes the first card every level-up, CARELESS never takes one. A level
// the careful arm cannot finish at the kit a player plausibly has is broken; a
// level the careless arm always 3-stars asks nothing. Every row is printed on
// every run so the next retune starts from a reading, not a memory.
//
// THE KIT A PLAYER HAS, by world - assumed, not simulated, because the shop is
// the player's choice; written out here so the assumption sits on the record
// beside the numbers. Gold a careful first pass earns, measured off this table:
// the garden ~97 (four clears), the desert ~230 more.
//
//   base  nothing bought, nothing worn                  -> the GARDEN
//   mid   +4 length, +25% magnet (70 g), common Fangs    -> the DESERT
//         from the garden's boss
//   high  +4 length, +20% crush, +8% speed, +25% magnet, -> the CAVE
//         +5 luck (325 g), common Fangs, rare Scales
//   full  every shop row bought out, epic in all three   -> the comparison arm:
//         slots                                             what money cannot buy
//
// MEASURED 2026-10-03 on this table, 15 seeds x both arenas (30 a cell). The
// lessons that set the rows, in order: (1) a whole-run loss is a CASCADE - a
// shorter snake draws smaller loops, crushes less, grows less - so the bot either
// clears a level or dies, and the first star rule (Neon's two thirds) 3-starred
// almost every win; three stars now need every heart. (2) Shape health 1.5 made a
// runner a two-loop shape and the desert a cliff (5/20 at the base kit); 1.2-1.25
// keeps the small shapes one loop and makes the brutes and shooters the tough
// ones. (3) In the cave the shooters' bolts are most of the hits (a probe counted
// 6-22 of 9-36 per run), so they join at 45% of the target. (4) Which purchase
// matters, desert-boss at the mid kit, 50 runs each: +length 46, +Scales 46,
// +magnet 45, +speed 42, +crush 35, +luck 34, nothing 34 - crush earns its keep on
// bosses and brutes, luck is gold.
import { describe, expect, it } from "vitest";
import { MAX_LEVEL_MS, kitSave, playCareer, type Arm, type CareerRow } from "./careerBots";
import { SNAKE_LEVELS, type SnakeLevelRow } from "./careerWorlds";
import { ARENA, ARENA_WIDE } from "./logic";

const KITS = {
  base: kitSave({}, []),
  mid: kitSave({ length: 1, magnet: 1 }, ["weapon:common"]),
  high: kitSave({ length: 1, crush: 2, swift: 1, magnet: 1, luck: 1 }, ["weapon:common", "armor:rare"]),
  full: kitSave({ length: 3, crush: 5, swift: 3, magnet: 3, luck: 3, shield: 1 }, ["weapon:epic", "armor:epic", "ring:epic"]),
};
type Kit = keyof typeof KITS;
const ASSUMED: Record<SnakeLevelRow["world"], Kit> = { garden: "base", desert: "mid", cave: "high" };

const SEEDS = Array.from({ length: 15 }, (_, i) => i + 1);
const cache = new Map<string, CareerRow[]>();

function rows(id: string, kit: Kit, arm: Arm): CareerRow[] {
  const key = `${id}/${kit}/${arm}`;
  let out = cache.get(key);
  if (!out) {
    out = [ARENA, ARENA_WIDE].flatMap((a) => SEEDS.map((s) => playCareer(id, s, KITS[kit], a, arm)));
    cache.set(key, out);
  }
  return out;
}
const wins = (r: CareerRow[]) => r.filter((x) => x.end === "won").length;
const threeStars = (r: CareerRow[]) => r.filter((x) => x.stars === 3).length;
const cave = SNAKE_LEVELS.filter((l) => l.world === "cave");

function line(id: string, kit: Kit, arm: Arm): string {
  const r = rows(id, kit, arm);
  const st = [0, 1, 2, 3].map((k) => r.filter((x) => x.stars === k).length).join("/");
  const ms = r.filter((x) => x.end === "won").map((x) => x.ms / 1000).sort((a, b) => a - b);
  const t = ms.length ? `${ms[0].toFixed(0)}-${ms[ms.length - 1].toFixed(0)}s` : "-";
  const gold = (r.reduce((n, x) => n + x.gold, 0) / r.length).toFixed(1);
  return `${id.padEnd(12)} ${kit.padEnd(4)} ${arm.padEnd(8)} won ${String(wins(r)).padStart(2)}/${r.length}  stars 0/1/2/3 ${st.padEnd(11)} time ${t.padEnd(7)} gold ${gold}`;
}

const SLOW = 600_000;

describe("the career's twelve nodes, played (S4)", () => {
  it("prints the whole table", () => {
    const out: string[] = [];
    for (const l of SNAKE_LEVELS) for (const kit of Object.keys(KITS) as Kit[]) for (const arm of ["careful", "careless"] as Arm[]) out.push(line(l.id, kit, arm));
    console.log(out.join("\n"));
    expect(cache.size).toBe(SNAKE_LEVELS.length * 4 * 2);
  }, SLOW);

  it("the careful bot clears every node at the kit its world assumes - most of the time, on every one", () => {
    // Measured, of 30: garden 30/30/29/29 (base), desert 29/28/28/25 (mid), cave
    // 30/29/30/26 (high). A chaotic crowd costs a seed here and there, so the floor
    // is 80% of a cell, not all of it.
    for (const l of SNAKE_LEVELS) {
      const r = rows(l.id, ASSUMED[l.world], "careful");
      expect(wins(r), `${l.id} at ${ASSUMED[l.world]}`).toBeGreaterThanOrEqual(Math.ceil(r.length * 0.8));
    }
  }, SLOW);

  it("the careless bot loses some in the cave, at the cave's own kit", () => {
    let lost = 0;
    let all = 0;
    for (const l of cave) {
      const r = rows(l.id, "high", "careless");
      lost += r.length - wins(r);
      all += r.length;
    }
    // Measured 1 + 3 + 1 + 11 of 120 lost (13%); the boss is where cards tell.
    expect(lost / all).toBeGreaterThanOrEqual(0.08);
    expect(wins(rows("cave-boss", "high", "careless"))).toBeLessThan(wins(rows("cave-boss", "high", "careful")));
  }, SLOW);

  it("a BOUGHT-OUT shop does not 3-star the cave for free (Neon's known flaw)", () => {
    // A third star is finishing with every heart. Measured, full kit, careful:
    // 13 + 17 + 17 + 14 = 61 of 120 three-starred across the cave - about half.
    let three = 0;
    let all = 0;
    for (const l of cave) {
      const r = rows(l.id, "full", "careful");
      expect(threeStars(r), `${l.id} is 3-starred on every run`).toBeLessThan(r.length);
      three += threeStars(r);
      all += r.length;
    }
    expect(three / all).toBeLessThanOrEqual(0.75);
  }, SLOW);

  it("what you bought is what gets you through: the cave at the base kit is lost more often than won", () => {
    for (const l of cave) {
      const r = rows(l.id, "base", "careful");
      expect(wins(r), l.id).toBeLessThan(r.length / 2);
    }
  }, SLOW);

  it("the careless bot is the bottom of the bracket on every node, at every kit", () => {
    for (const l of SNAKE_LEVELS) {
      for (const kit of Object.keys(KITS) as Kit[]) {
        // +2: two seeds of chaos either way, on 30 runs.
        expect(wins(rows(l.id, kit, "careless")), `${l.id} ${kit}`).toBeLessThanOrEqual(wins(rows(l.id, kit, "careful")) + 2);
      }
    }
  }, SLOW);

  it("NO LEVEL CAN STALL: nothing times out, every win is inside the cap, and the crowd never runs dry", () => {
    for (const r of [...cache.values()].flat()) {
      expect(r.end).not.toBe("timeout");
      expect(r.ms).toBeLessThan(MAX_LEVEL_MS);
      // Time with no shape on the floor after the safe start, summed over the level.
      expect(r.dryMs).toBeLessThan(4000);
    }
    // population guard: the walk above read every cell the table played
    expect([...cache.values()].flat().length).toBe(SNAKE_LEVELS.length * 4 * 2 * 30);
  }, SLOW);
});
