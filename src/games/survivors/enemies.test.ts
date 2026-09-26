// Elites, pinned by BEHAVIOUR.
//
// WHY THIS FILE EXISTS. An elite is a FLAG, and a flag is worth nothing until
// every number that reads a shape reads it too. The ways this ships broken are
// all silent: a six-times-tougher shape that drops an ordinary gem is six times
// the work for the same reward, which is worse than having no elites at all; a
// bigger sprite over an ordinary hitbox is a shape that is hit where it is not;
// and an elite in stage 1 is a 30-health brute in the minute a player is still
// learning what a brute is.
import { describe, expect, it } from "vitest";
import {
  ELITE, ELITE_CHANCE, KINDS, bossHpFor, hpOf, kindsAt, newRun, radiusOf, rngFor, speedOf, stageMs, step, xpOf,
  type Enemy, type EnemyKind, type RunState,
} from "./logic";

const STILL = { dx: 0, dy: 0 };

function frames(s: RunState, n: number, rng = rngFor(1)) {
  for (let i = 0; i < n; i++) {
    step(s, 16, STILL, rng);
    s.choosing = false;
  }
  return s;
}

/** Play a stage's swarm phase and hand back every shape it ever sent. */
function spawnsOf(stage: number, seed: number, frameCount = 2400): Enemy[] {
  const s = newRun("normal");
  s.stage = stage;
  s.t = (stage - 1) * stageMs(s.level);
  s.maxHp = 1e9;
  s.hp = 1e9;
  s.dashCd = 1e12;
  const seen = new Map<number, Enemy>();
  const rng = rngFor(seed);
  for (let i = 0; i < frameCount; i++) {
    step(s, 16, STILL, rng);
    s.choosing = false;
    for (const e of s.enemies) if (!seen.has(e.id)) seen.set(e.id, { ...e });
  }
  return [...seen.values()];
}

describe("an elite is the same shape, harder", () => {
  it("multiplies health, gem, size and pace - and nothing else", () => {
    for (const kind of ["runner", "orb", "brute", "shard"] as EnemyKind[]) {
      const plain = { kind, elite: false } as Pick<Enemy, "kind" | "elite">;
      const elite = { kind, elite: true } as Pick<Enemy, "kind" | "elite">;
      expect(hpOf(kind, true)).toBe(KINDS[kind].hp * ELITE.hp);
      expect(xpOf(elite)).toBe(KINDS[kind].xp * ELITE.xp);
      expect(radiusOf(elite)).toBeCloseTo(KINDS[kind].r * ELITE.r, 6);
      expect(speedOf(elite)).toBeCloseTo(KINDS[kind].speed * ELITE.speed, 6);
      // The plain arm, so none of the above passes on a multiplier of one.
      expect(hpOf(kind, false)).toBe(KINDS[kind].hp);
      expect(xpOf(plain)).toBe(KINDS[kind].xp);
      expect(radiusOf(plain)).toBe(KINDS[kind].r);
      expect(speedOf(plain)).toBe(KINDS[kind].speed);
    }
  });

  it("is tougher AND slower - a six-health runner at full pace is a chase, not a target", () => {
    expect(ELITE.hp).toBeGreaterThan(1);
    expect(ELITE.xp).toBeGreaterThan(1);
    expect(ELITE.speed).toBeLessThan(1);
    expect(ELITE.r).toBeGreaterThan(1);
  });
});

describe("what an elite is worth actually reaches the player", () => {
  it("mints a gem in `damage` and nowhere else - zeroing health by hand pays nothing", () => {
    // The assertion this whole file exists for. `damage()` is the ONE place a
    // gem is minted, and it read `KINDS[e.kind].xp` until elites landed - so an
    // elite would have died like a boss and paid like a runner.
    const s = newRun("normal");
    const plain: Enemy = { id: s.nextId++, kind: "brute", x: s.x + 200, y: s.y, hp: 1, flash: 0 };
    const elite: Enemy = { id: s.nextId++, kind: "brute", x: s.x + 240, y: s.y, hp: 1, flash: 0, elite: true };
    s.enemies.push(plain, elite);
    // Kill both by hand, so this measures the payout and not the gun.
    plain.hp = 0;
    elite.hp = 0;
    // One frame of the fire/contact loops is enough for `step` to sweep them.
    frames(s, 1);
    const values = s.gems.map((g) => g.value).sort((a, b) => a - b);
    expect(values).toHaveLength(0); // hand-zeroing does not mint - `damage` does
  });

  it("MINTS ten times the gem when the gun kills it", () => {
    const gemFrom = (elite: boolean) => {
      const s = newRun("normal");
      // OUTSIDE THE MAGNET. The first version stood the victim 40 units away,
      // well inside `magnetRange`'s 46, so the gem was swallowed on the frame it
      // dropped and both arms read an empty list - a magnet doing its job,
      // reported as a payout that never happened.
      const e: Enemy = {
        id: s.nextId++, kind: "runner", x: s.x + 200, y: s.y,
        hp: hpOf("runner", elite), flash: 0, ...(elite ? { elite: true } : {}),
      };
      s.enemies.push(e);
      // Strong enough to take an elite runner down, so both arms really die.
      s.up.power = 8;
      frames(s, 120);
      return s.gems.map((g) => g.value);
    };
    const plain = gemFrom(false);
    const elite = gemFrom(true);
    // The population: both arms must actually have dropped something, or the
    // comparison below is between two empty lists.
    expect(plain, "the plain runner never died").toHaveLength(1);
    expect(elite, "the elite runner never died").toHaveLength(1);
    expect(elite[0]).toBe(plain[0] * ELITE.xp);
    expect(elite[0]).toBe(KINDS.runner.xp * ELITE.xp);
  });
});

describe("when an elite may appear", () => {
  it("never in stage 1 - the minute a player is still learning the shapes", () => {
    expect(ELITE_CHANCE[0]).toBe(0);
    const stage1 = spawnsOf(1, 7);
    expect(stage1.length).toBeGreaterThan(20); // the population, asserted
    expect(stage1.filter((e) => e.elite)).toHaveLength(0);
  });

  it("THE CONTROL: it DOES happen later, or the line above is vacuous", () => {
    // Without this, "no elites in stage 1" passes on a build where elites were
    // never implemented at all - which is the failure it exists to catch.
    const later = [...spawnsOf(2, 7), ...spawnsOf(3, 7), ...spawnsOf(2, 11), ...spawnsOf(3, 11)];
    expect(later.length).toBeGreaterThan(40);
    expect(later.filter((e) => e.elite).length).toBeGreaterThan(0);
  });

  it("gets rarer than ordinary shapes, and stage 3 is no kinder than stage 2", () => {
    expect(ELITE_CHANCE[1]).toBeGreaterThan(0);
    expect(ELITE_CHANCE[1]).toBeLessThan(0.5);
    expect(ELITE_CHANCE[2]).toBeGreaterThanOrEqual(ELITE_CHANCE[1]);
  });

  it("an elite is never a boss, and a boss is never elite", () => {
    // A 6x golem is 2,520 health and the run would simply not end.
    for (const stage of [1, 2, 3]) {
      const s = newRun("normal");
      s.stage = stage;
      s.t = stage * stageMs(s.level) - 10;
      s.maxHp = 1e9;
      s.hp = 1e9;
      frames(s, 2);
      const boss = s.enemies.find((e) => e.id === s.boss);
      expect(boss).toBeDefined();
      expect(boss!.elite).toBeFalsy();
      expect(boss!.hp).toBe(bossHpFor(boss!.kind, s.level));
      // And the wave clock still cannot send the boss kind at all.
      expect(kindsAt(s)).not.toContain(boss!.kind);
    }
  });

  it("the same seed still plays the same run, with the roll in the stream", () => {
    // The elite roll consumes an rng draw per spawn. That is fine, and it is
    // pinned: what would not be fine is a roll that happens only sometimes,
    // because then the stream's shape would depend on the stage and two runs of
    // one seed would diverge at the first stage boundary.
    const a = spawnsOf(2, 99).map((e) => `${e.kind}${e.elite ? "!" : ""}@${e.x.toFixed(2)}`);
    const b = spawnsOf(2, 99).map((e) => `${e.kind}${e.elite ? "!" : ""}@${e.x.toFixed(2)}`);
    expect(a).toEqual(b);
    expect(a.length).toBeGreaterThan(20);
  });
});
