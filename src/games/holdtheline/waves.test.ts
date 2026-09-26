import { describe, expect, it } from "vitest";
import {
  BANDS,
  CAMPAIGN_WAVES,
  RULES,
  countFor,
  gapFor,
  hasHeavy,
  poolFor,
  pressureFor,
  waveQueue,
} from "./waves";
import { runRng } from "./logic";

describe("the band table", () => {
  it("starts at wave 1, so there is always a pool", () => {
    expect(BANDS[0].from).toBe(1);
    expect(poolFor(1).length).toBeGreaterThan(0);
  });

  it("is sorted, or poolFor reads the wrong band", () => {
    for (let i = 1; i < BANDS.length; i++) {
      expect(BANDS[i].from).toBeGreaterThan(BANDS[i - 1].from);
    }
  });

  it("never drops a kind once it has arrived", () => {
    // A kind that appeared and then vanished would leave a counter the player
    // already bought answering nothing, which reads as the purchase having been
    // a trap.
    const seen = new Set<string>();
    for (const b of BANDS) {
      for (const k of seen) expect(b.kinds, `band ${b.from} dropped ${k}`).toContain(k);
      for (const k of b.kinds) seen.add(k);
    }
  });

  it("introduces the three answered threats in the plan's order", () => {
    const firstOf = (kind: string) => BANDS.find((b) => b.kinds.includes(kind as never))!.from;
    expect(firstOf("vehicle")).toBeLessThan(firstOf("shooter"));
    expect(firstOf("shooter")).toBeLessThan(firstOf("air"));
  });
});

describe("the two curves", () => {
  it("pressure rises every wave, in both of them", () => {
    for (let n = 2; n <= 40; n++) {
      expect(pressureFor(n), `wave ${n}`).toBeGreaterThan(pressureFor(n - 1));
    }
  });

  it("overtime is steeper than the campaign, because it inherits a full shop", () => {
    // The join is the thing worth asserting: a player who beat wave 20 owns the
    // whole catalogue, so continuing the campaign's own slope is a victory lap.
    const campaign = pressureFor(CAMPAIGN_WAVES) - pressureFor(CAMPAIGN_WAVES - 1);
    const overtime = pressureFor(CAMPAIGN_WAVES + 1) - pressureFor(CAMPAIGN_WAVES);
    expect(overtime).toBeGreaterThan(campaign);
  });

  it("is continuous at the join - no cliff at wave 21", () => {
    expect(pressureFor(CAMPAIGN_WAVES + 1) / pressureFor(CAMPAIGN_WAVES)).toBeLessThan(1.2);
  });

  it("a wave grows linearly, never exponentially", () => {
    // An exponential body count is how this shape turns into a slideshow on a
    // phone. Compare the second difference: linear means it is flat.
    const d = (n: number) => countFor(n + 1) - countFor(n);
    for (let n = 1; n < 39; n++) expect(Math.abs(d(n + 1) - d(n))).toBeLessThanOrEqual(1);
  });

  it("the arrival gap tightens and then floors", () => {
    for (let n = 2; n <= 60; n++) expect(gapFor(n)).toBeLessThanOrEqual(gapFor(n - 1));
    expect(gapFor(200)).toBeGreaterThan(0);
  });
});

describe("the heavy", () => {
  it("arrives on the campaign's last wave, and not before", () => {
    for (let n = 1; n < CAMPAIGN_WAVES; n++) expect(hasHeavy(n), `wave ${n}`).toBe(false);
    expect(hasHeavy(CAMPAIGN_WAVES)).toBe(true);
  });

  it("then every fifth wave of overtime", () => {
    expect(hasHeavy(CAMPAIGN_WAVES + 5)).toBe(true);
    expect(hasHeavy(CAMPAIGN_WAVES + 10)).toBe(true);
    expect(hasHeavy(CAMPAIGN_WAVES + 3)).toBe(false);
  });

  it("is LAST in the queue, so the crowd comes before the health bar", () => {
    const q = waveQueue(CAMPAIGN_WAVES, "normal", runRng(7));
    expect(q[q.length - 1]).toBe("heavy");
    expect(q.slice(0, -1)).not.toContain("heavy");
  });
});

describe("waveQueue", () => {
  it("is seeded - the same seed sends the same wave", () => {
    expect(waveQueue(9, "normal", runRng(42))).toEqual(waveQueue(9, "normal", runRng(42)));
  });

  it("differs on a different seed, or it is not random at all", () => {
    // Without this, a frozen generator and a working one are indistinguishable.
    const a = waveQueue(12, "normal", runRng(1));
    const b = waveQueue(12, "normal", runRng(999));
    expect(a).not.toEqual(b);
  });

  it("sends only kinds its band allows", () => {
    for (let n = 1; n <= 25; n++) {
      const pool = poolFor(n);
      for (const k of waveQueue(n, "wild", runRng(n))) {
        if (k === "heavy") continue;
        expect(pool, `wave ${n} sent ${k}`).toContain(k);
      }
    }
  });

  it("a calm wave is smaller than a wild one, and normal sits between", () => {
    const size = (l: "calm" | "normal" | "wild") => waveQueue(14, l, runRng(3)).length;
    expect(size("calm")).toBeLessThan(size("normal"));
    expect(size("normal")).toBeLessThan(size("wild"));
  });

  it("never sends an empty wave", () => {
    for (let n = 1; n <= 30; n++) expect(waveQueue(n, "calm", runRng(n)).length).toBeGreaterThan(0);
  });
});

describe("the levels change the crowd, never the player", () => {
  it("calm is a smaller, softer, slower crowd", () => {
    expect(RULES.calm.count).toBeLessThan(1);
    expect(RULES.calm.hp).toBeLessThan(1);
    expect(RULES.calm.speed).toBeLessThan(1);
  });

  it("and pays MORE per body, so a calm run does not fall behind its own shop", () => {
    // The one non-strength difference, and it is about the forecast rather than
    // about difficulty: a calm run kills fewer things, so a flat rate would
    // leave it unable to afford the counter for a threat that still arrives.
    expect(RULES.calm.pay).toBeGreaterThan(RULES.normal.pay);
    expect(RULES.wild.pay).toBeLessThan(RULES.normal.pay);
  });

  it("no level touches a gun, a power or a price", () => {
    // Survivors' rule, copied: an upgrade must mean the same thing on all three
    // or every price in the catalogue means three different things. The guard is
    // structural - RULES has no field that could reach the player's own numbers.
    const fields = Object.keys(RULES.normal).sort();
    expect(fields).toEqual(["count", "gap", "hp", "pay", "speed"]);
  });
});
