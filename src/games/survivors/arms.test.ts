// The six-slot run's new rules (operator ruling 2026-10-02, "ack B"): the halo's
// pulse, the barrier's push, the zap and the thunderhead, and the six-power cap.
import { describe, expect, it } from "vitest";
import { BARRIER, HALO, THUNDER, haloReach, pulseHalo, zapSlot } from "./arms";
import { newRun, rngFor } from "./logic";
import { PASSIVE_SLOTS, UPGRADE_IDS, offerUpgrades, powersHeld } from "./upgrades";
import type { Enemy, RunState } from "./types";

const shape = (id: number, x: number, y: number, hp = 5): Enemy => ({ id, kind: "runner", x, y, hp, flash: 0 });
const hits = () => {
  const seen: number[] = [];
  return { seen, hurt: (e: Enemy, d: number) => { seen.push(e.id); e.hp -= d; } };
};

describe("the halo pulses: everyone inside, once, on a beat", () => {
  it("hurts every shape inside the ring and none outside it", () => {
    const s = newRun("normal");
    s.enemies = [shape(1, s.x + 20, s.y), shape(2, s.x, s.y - HALO.r), shape(3, s.x + HALO.r + 40, s.y)];
    const h = hits();
    pulseHalo(s, { id: "halo", cd: 0, lv: 1 }, 1, h.hurt);
    expect(h.seen.sort()).toEqual([1, 2]);
    expect(s.events.some((e) => e.type === "halo")).toBe(true);
  });
  it("THE BARRIER reaches further and throws a shape back - never the boss", () => {
    expect(haloReach(true)).toBe(BARRIER.r);
    const s: RunState = newRun("normal");
    const near = shape(1, s.x + 40, s.y);
    const boss = shape(2, s.x - 40, s.y, 100);
    s.enemies = [near, boss];
    s.boss = 2;
    pulseHalo(s, { id: "halo", cd: 0, lv: 1, evolved: true }, 1, hits().hurt);
    expect(near.x).toBeCloseTo(s.x + 40 + BARRIER.push, 6);
    expect(boss.x).toBe(s.x - 40);
  });
});

describe("the zap strikes shapes in sight", () => {
  it("one strike a round, and holds its clock when nothing is in sight", () => {
    const s = newRun("normal");
    s.enemies = [shape(1, s.x + 50, s.y), shape(2, s.x - 50, s.y)];
    const h = hits();
    expect(zapSlot(s, { id: "zap", cd: 0, lv: 1 }, 1, rngFor(3), h.hurt)).toBe(true);
    expect(h.seen).toHaveLength(1);
    const empty = newRun("normal");
    expect(zapSlot(empty, { id: "zap", cd: 0, lv: 1 }, 1, rngFor(3), hits().hurt)).toBe(false);
  });
  it("THE THUNDERHEAD strikes more and blasts the shapes beside each strike", () => {
    const s = newRun("normal");
    s.enemies = Array.from({ length: 6 }, (_, i) => shape(i + 1, s.x + 60 + i * 200, s.y, 9));
    s.enemies.push(shape(99, s.x + 60 + THUNDER.splash / 2, s.y, 9));
    const h = hits();
    zapSlot(s, { id: "zap", cd: 0, lv: 1, evolved: true }, 1, rngFor(5), h.hurt);
    const struck = s.events.filter((e) => e.type === "zap");
    expect(struck.length).toBeLessThanOrEqual(THUNDER.strikes);
    expect(struck.length).toBeGreaterThan(1);
    // more hurts than strikes means the blast landed on a neighbour
    expect(h.seen.length).toBeGreaterThan(struck.length);
  });
});

describe("six power-ups at most", () => {
  it("once six different ones are held, only those six are offered", () => {
    const s = newRun("normal");
    const six = UPGRADE_IDS.slice(0, PASSIVE_SLOTS);
    for (const id of six) s.up[id] = 1;
    expect(powersHeld(s)).toBe(6);
    for (let seed = 1; seed < 50; seed++) {
      for (const id of offerUpgrades(s, rngFor(seed), 3)) expect(six).toContain(id);
    }
  });
  it("THE CONTROL: with five held, a seventh kind can still be offered", () => {
    const s = newRun("normal");
    for (const id of UPGRADE_IDS.slice(0, 5)) s.up[id] = 1;
    const seen = new Set<string>();
    for (let seed = 1; seed < 80; seed++) for (const id of offerUpgrades(s, rngFor(seed), 3)) seen.add(id);
    expect(UPGRADE_IDS.slice(5).some((id) => seen.has(id))).toBe(true);
  });
});
