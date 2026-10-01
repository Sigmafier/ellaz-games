import { describe, expect, it } from "vitest";
import { mulberry32 } from "@shared/rng";
import { CALM_TIER_ODDS, CARD_IDS, CAPS, TIER, TIER_ODDS, epicOdds, nextGoldDry, noneTaken, offerCards, tierFor } from "./cards";
import { newRun, pickCard, step } from "./logic";
import type { CardId, LevelKey, Tier } from "./types";

/**
 * Operator ruling, 2026-10-01: "Rare, with a promise". Blue is 1 in 8 per
 * offered slot (was 1 in 4). Gold starts at 1% per slot and rises one
 * percentage point for every level-up offer that showed NO gold, back to 1% the
 * moment one does (it was a flat 1 in 12). The fallback order and the
 * once-a-run epic cap are unchanged. Whole-run numbers are in `pacing.test.ts`.
 *
 * And the same day, "Calm keeps old odds": on CALM a slot still rolls a flat
 * 1 in 12 gold and 1 in 4 blue, with no rising counter. Normal and wild use the
 * new rarity.
 */

describe("the roll", () => {
  it("blue is 1 in 8 per slot, and a run starts with gold at 1%", () => {
    expect(TIER_ODDS.rare).toBeCloseTo(1 / 8, 12);
    expect(TIER_ODDS.epic).toBeCloseTo(0.01, 12);
    expect(TIER_ODDS.common).toBeCloseTo(1 - 1 / 8 - 0.01, 12);
  });

  it("gold rises one point per dry offer: 1%, 2%, 3% ... 11% after ten", () => {
    for (let dry = 0; dry <= 20; dry++) expect(epicOdds(dry), `dry ${dry}`).toBeCloseTo((1 + dry) / 100, 12);
  });

  it("never squeezes blue: gold stops where grey would run out", () => {
    expect(epicOdds(500)).toBeCloseTo(1 - 1 / 8, 12);
    // At the cap grey is gone and blue keeps its eighth, at the top of the roll.
    expect(tierFor(0.5, 500)).toBe("epic");
    expect(tierFor(0.99, 500)).toBe("rare");
  });

  it("the boundaries sit where the odds say, at any dryness", () => {
    for (const dry of [0, 3, 10]) {
      const e = epicOdds(dry);
      expect(tierFor(0, dry)).toBe("epic");
      expect(tierFor(e - 1e-9, dry)).toBe("epic");
      expect(tierFor(e + 1e-9, dry)).toBe("rare");
      expect(tierFor(e + 1 / 8 - 1e-9, dry)).toBe("rare");
      expect(tierFor(e + 1 / 8 + 1e-9, dry)).toBe("common");
    }
    // A plain call is a fresh run's roll.
    expect(tierFor(0.0099)).toBe("epic");
    expect(tierFor(0.0101)).toBe("rare");
  });

  it("the counter rises on an offer with no gold and resets on one with gold", () => {
    expect(nextGoldDry(0, ["fangs", "chain", "magnet"])).toBe(1);
    expect(nextGoldDry(7, ["fangs", "chain"])).toBe(8);
    expect(nextGoldDry(7, ["fangs", "nova", "magnet"])).toBe(0);
    expect(nextGoldDry(0, ["twinHead"])).toBe(0);
  });

  it("per slot, the tiers come up at those odds - fresh and after ten dry offers", () => {
    for (const [dry, epic] of [[0, 0.01], [10, 0.11]] as const) {
      const rng = mulberry32(11 + dry);
      const seen: Record<Tier, number> = { common: 0, rare: 0, epic: 0 };
      const N = 20_000;
      // Only the FIRST slot of each offer: later slots are drawn without the
      // cards already offered, so a slot's tier odds are exact only on slot one.
      for (let i = 0; i < N; i++) seen[TIER[offerCards({ taken: noneTaken(), goldDry: dry }, rng)[0]]]++;
      expect(seen.epic / N, `dry ${dry} gold`).toBeGreaterThan(epic * 0.8);
      expect(seen.epic / N, `dry ${dry} gold`).toBeLessThan(epic * 1.2);
      expect(seen.rare / N, `dry ${dry} blue`).toBeGreaterThan(0.125 * 0.9);
      expect(seen.rare / N, `dry ${dry} blue`).toBeLessThan(0.125 * 1.1);
    }
  });

  it("still falls back a tier, and still offers gold only once a run per card", () => {
    const taken = noneTaken();
    for (const id of CARD_IDS) if (TIER[id] !== "epic") taken[id] = CAPS[id];
    expect([...offerCards({ taken, goldDry: 0 }, mulberry32(1))].sort()).toEqual(["blackHole", "nova", "twinHead"]);
    for (const id of CARD_IDS) if (TIER[id] === "epic") expect(CAPS[id]).toBe(1);
  });
});

describe("the counter lives on the run", () => {
  it("a run starts dry at 0, and every level-up offer moves it by the rule", () => {
    const rng = mulberry32(5);
    const run = newRun("normal", { w: 420, h: 560 }, rng);
    expect(run.goldDry).toBe(0);
    let offers = 0;
    let resets = 0;
    let rises = 0;
    // Feed the run gems straight to its level-ups; nothing else matters here.
    for (let i = 0; i < 4000 && offers < 40; i++) {
      run.xp = run.need;
      const before = run.goldDry;
      step(run, 16, { dx: 1, dy: 0 }, rng);
      if (run.phase === "dead") break;
      if (!run.choosing) continue;
      offers++;
      const hasGold = run.choosing.some((id: CardId) => TIER[id] === "epic");
      expect(run.goldDry).toBe(hasGold ? 0 : before + 1);
      if (hasGold) resets++;
      else rises++;
      pickCard(run, run.choosing.find((id) => TIER[id] !== "epic") ?? run.choosing[0]);
    }
    // The population: the counter was really seen both rising and resetting.
    expect(offers).toBeGreaterThanOrEqual(20);
    expect(rises).toBeGreaterThan(0);
    expect(resets).toBeGreaterThan(0);
  });
});

describe("calm keeps the old odds; normal and wild use the new rarity", () => {
  it("calm's odds are the old flat 1 in 12 gold and 1 in 4 blue", () => {
    expect(CALM_TIER_ODDS.epic).toBeCloseTo(1 / 12, 12);
    expect(CALM_TIER_ODDS.rare).toBeCloseTo(1 / 4, 12);
    expect(CALM_TIER_ODDS.common).toBeCloseTo(1 - 1 / 12 - 1 / 4, 12);
  });

  it("on calm the boundaries are the old ones, however long gold has stayed away", () => {
    for (const dry of [0, 5, 30]) {
      expect(tierFor(1 / 12 - 1e-9, dry, "calm"), `dry ${dry}`).toBe("epic");
      expect(tierFor(1 / 12 + 1e-9, dry, "calm"), `dry ${dry}`).toBe("rare");
      expect(tierFor(1 / 12 + 1 / 4 - 1e-9, dry, "calm"), `dry ${dry}`).toBe("rare");
      expect(tierFor(1 / 12 + 1 / 4 + 1e-9, dry, "calm"), `dry ${dry}`).toBe("common");
    }
  });

  it("on normal and wild the boundaries are the new ones, and gold rises with the counter", () => {
    for (const level of ["normal", "wild"] as const) {
      expect(tierFor(0.0099, 0, level), level).toBe("epic");
      expect(tierFor(0.0101, 0, level), level).toBe("rare");
      expect(tierFor(0.01 + 1 / 8 + 1e-9, 0, level), level).toBe("common");
      expect(tierFor(0.05, 10, level), level).toBe("epic");
    }
  });

  it("per slot, each difficulty rolls its own odds - fresh and after ten dry offers", () => {
    const want: Record<LevelKey, (dry: number) => { epic: number; rare: number }> = {
      calm: () => ({ epic: 1 / 12, rare: 1 / 4 }),
      normal: (dry) => ({ epic: (1 + dry) / 100, rare: 1 / 8 }),
      wild: (dry) => ({ epic: (1 + dry) / 100, rare: 1 / 8 }),
    };
    for (const level of ["calm", "normal", "wild"] as const) {
      for (const dry of [0, 10]) {
        const rng = mulberry32(31 + dry + level.length);
        const seen: Record<Tier, number> = { common: 0, rare: 0, epic: 0 };
        const N = 20_000;
        for (let i = 0; i < N; i++) seen[TIER[offerCards({ taken: noneTaken(), goldDry: dry, level }, rng)[0]]]++;
        const w = want[level](dry);
        expect(seen.epic / N, `${level} dry ${dry} gold`).toBeGreaterThan(w.epic * 0.8);
        expect(seen.epic / N, `${level} dry ${dry} gold`).toBeLessThan(w.epic * 1.2);
        expect(seen.rare / N, `${level} dry ${dry} blue`).toBeGreaterThan(w.rare * 0.9);
        expect(seen.rare / N, `${level} dry ${dry} blue`).toBeLessThan(w.rare * 1.1);
      }
    }
  });

  it("a calm run's own level-ups are rolled at calm's odds", () => {
    // Twenty level-ups on a calm run and on a normal run from the same seed:
    // calm offers far more gold and blue, the counter being no help to normal.
    const tally = (level: LevelKey) => {
      const rng = mulberry32(8);
      const run = newRun(level, { w: 420, h: 560 }, rng);
      const n = { gold: 0, blue: 0, offers: 0 };
      for (let i = 0; i < 4000 && n.offers < 60; i++) {
        run.xp = run.need;
        step(run, 16, { dx: 1, dy: 0 }, rng);
        if (run.phase === "dead") break;
        if (!run.choosing) continue;
        n.offers++;
        for (const id of run.choosing) (n.gold += TIER[id] === "epic" ? 1 : 0), (n.blue += TIER[id] === "rare" ? 1 : 0);
        pickCard(run, run.choosing.find((id) => TIER[id] === "common") ?? run.choosing[0]);
      }
      return n;
    };
    const calm = tally("calm");
    const normal = tally("normal");
    expect(calm.offers).toBeGreaterThanOrEqual(30);
    expect(normal.offers).toBeGreaterThanOrEqual(30);
    expect(calm.blue / calm.offers).toBeGreaterThan(normal.blue / normal.offers);
  });
});
