// Map pickups (operator ruling 2026-10-02, "ack B"): what drops, and what each does.
import { describe, expect, it } from "vitest";
import { newRun } from "./logic";
import { BOMB_BOSS, DROP, VACUUM_MS, dropFor, tickPickups } from "./pickups";
import type { Enemy, RunState } from "./types";

const at = (s: RunState, kind: "magnet" | "bomb" | "food") => {
  s.pickups = [{ id: 1, x: s.x, y: s.y, kind, ms: 10_000 }];
};
const shape = (id: number, x: number, y: number, hp = 3): Enemy => ({ id, kind: "runner", x, y, hp, flash: 0 });

describe("what drops", () => {
  it("elites drop one at the elite rate, ordinary shapes almost never, a boss never", () => {
    const N = 40_000;
    let elite = 0;
    let plain = 0;
    for (let id = 1; id <= N; id++) {
      if (dropFor({ id, elite: true }, false)) elite++;
      if (dropFor({ id }, false)) plain++;
      expect(dropFor({ id, elite: true }, true)).toBeNull();
    }
    expect(elite / N).toBeGreaterThan(DROP.elite * 0.85);
    expect(elite / N).toBeLessThan(DROP.elite * 1.15);
    expect(plain / N).toBeLessThan(DROP.plain * 2);
    expect(plain).toBeGreaterThan(0);
  });
  it("THE CONTROL: at a rate of zero nothing drops - the roll is never negative", () => {
    // The first hash returned a signed int and dropped on half of all kills at
    // ANY rate; this cell reds on that build and passes on this one.
    for (let id = 1; id < 20_000; id++) expect(dropFor({ id, elite: false }, false, 0)).toBeNull();
  });
  it("is decided by the shape's id, the same every time, and uses no rng", () => {
    for (let id = 1; id < 500; id++) expect(dropFor({ id, elite: true }, false)).toBe(dropFor({ id, elite: true }, false));
  });
  it("all three kinds turn up", () => {
    const seen = new Set<string>();
    for (let id = 1; id < 5000; id++) {
      const k = dropFor({ id, elite: true }, false);
      if (k) seen.add(k);
    }
    expect([...seen].sort()).toEqual(["bomb", "food", "magnet"]);
  });
});

describe("what each one does", () => {
  it("FOOD gives one heart back, never past the top", () => {
    const s = newRun("normal");
    s.hp = 1;
    at(s, "food");
    tickPickups(s, 16, 11, () => {});
    expect(s.hp).toBe(2);
    expect(s.pickups).toHaveLength(0);
    const full = newRun("normal");
    at(full, "food");
    tickPickups(full, 16, 11, () => {});
    expect(full.hp).toBe(full.maxHp);
  });
  it("the MAGNET starts the pull", () => {
    const s = newRun("normal");
    at(s, "magnet");
    tickPickups(s, 16, 11, () => {});
    expect(s.vacuum).toBe(VACUUM_MS);
  });
  it("the BOMB kills every ordinary shape in view and dents the boss", () => {
    const s = newRun("normal");
    s.enemies = [shape(1, s.x + 60, s.y), shape(2, s.x - 80, s.y + 40), shape(3, s.x + 9000, s.y), shape(4, s.x + 30, s.y - 30, 200)];
    s.boss = 4;
    at(s, "bomb");
    const hit: [number, number][] = [];
    tickPickups(s, 16, 11, (e, d) => void hit.push([e.id, d]));
    expect(hit).toContainEqual([1, 3]);
    expect(hit).toContainEqual([2, 3]);
    expect(hit).toContainEqual([4, BOMB_BOSS]);
    expect(hit.some(([id]) => id === 3)).toBe(false);
  });
  it("THE CONTROL: a pickup out of reach is left where it lies", () => {
    const s = newRun("normal");
    s.pickups = [{ id: 1, x: s.x + 200, y: s.y, kind: "food", ms: 10_000 }];
    s.hp = 1;
    tickPickups(s, 16, 11, () => {});
    expect(s.hp).toBe(1);
    expect(s.pickups).toHaveLength(1);
  });
});
