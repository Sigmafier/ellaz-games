// The three stages, pinned by BEHAVIOUR.
//
// WHY THIS FILE EXISTS. `boss.test.ts` pins the GOLEM and it is still right to,
// but every assertion in it now happens on stage 3 - so nothing in it can see a
// stage boundary at all. The things that can break here are the ones with no
// error attached to them: a stage that ends on a clock instead of on its boss, a
// warden in stage 1's spawn pool, a run that carries on at zero hearts because
// the tie rule was applied to the wrong stage.
import { describe, expect, it } from "vitest";
import {
  BOSS_KINDS, KINDS, RULES, RUN_MS, STAGE_COUNT, STAGE_MS, STAGES, bossHpFor, stageMs,
  bossBar, bossKindFor, bossOf, isLastStage, kindsAt, newRun, rngFor, stageIsOver, stageT, step,
  type EnemyKind, type LevelKey, type RunState,
} from "./logic";

const STILL = { dx: 0, dy: 0 };

/**
 * What a boss of this kind is worth on THIS run's level.
 *
 * `KINDS[kind].hp` is calm's row; `RULES[level].bossHp` multiplies it, so an
 * eight-minute wild run does not finish on the same wall a three-minute calm one
 * does (operator ruling 2026-09-21). A test that read the row alone would be
 * asserting calm's number about every level.
 */
const bossHpOn = (s: RunState, kind: EnemyKind) => bossHpFor(kind, s.level);

function frames(s: RunState, n: number, rng = rngFor(1)) {
  for (let i = 0; i < n; i++) step(s, 16, STILL, rng);
  return s;
}

/** Put the run one frame from stage `n`'s boss, with the hearts out of the way. */
function atBossOf(n: number): RunState {
  const s = newRun("normal");
  s.stage = n;
  s.t = n * stageMs(s.level) - 10;
  s.maxHp = 9999;
  s.hp = 9999;
  step(s, 16, STILL, rngFor(1));
  return s;
}

/** Kill whatever boss is on the board this instant, without playing the fight. */
function felledTheBoss(s: RunState) {
  const boss = bossOf(s);
  expect(boss).not.toBeNull();
  boss!.hp = 0;
  step(s, 16, STILL, rngFor(1));
}

describe("a run is three stages", () => {
  it("opens on stage 1, and the table is the only place that says how many", () => {
    expect(newRun("normal").stage).toBe(1);
    expect(STAGES).toHaveLength(STAGE_COUNT);
    // RUN_MS is DERIVED from the table rather than written down twice, so a
    // fourth stage cannot leave the clock describing a run that no longer exists.
    // RUN_MS stays CALM's - the exported default - and each level's own swarm is
    // `stageMs(level) * STAGE_COUNT`. Both are asserted, because the constant
    // going stale is exactly how a per-level clock gets quietly reverted.
    expect(RUN_MS).toBe(STAGE_MS * STAGE_COUNT);
    expect(stageMs("calm")).toBe(STAGE_MS);
    for (const level of ["calm", "normal", "wild"] as LevelKey[]) {
      expect(stageMs(level)).toBe(RULES[level].stageMs);
    }
  });

  it("each stage ends with its own boss, and the three are different", () => {
    const kinds = [1, 2, 3].map(bossKindFor);
    expect(kinds).toEqual(["warden", "queen", "golem"]);
    expect(new Set(kinds).size).toBe(3);
    // Not vacuous: three DIFFERENT healths, so the bar's denominator cannot be
    // hardcoded to any one of them without one of the other two reading wrong.
    expect(new Set(kinds.map((k) => KINDS[k].hp)).size).toBe(3);
  });

  it("only the last stage's boss wins the run", () => {
    expect(isLastStage(1)).toBe(false);
    expect(isLastStage(2)).toBe(false);
    expect(isLastStage(3)).toBe(true);
  });
});

describe("a stage ends when its boss falls, NOT on a clock", () => {
  it("holds the clock at the boundary for as long as the fight lasts", () => {
    const s = atBossOf(1);
    expect(s.t).toBe(stageMs(s.level));
    expect(stageT(s)).toBe(stageMs(s.level));
    expect(stageIsOver(s)).toBe(true);
    // Six seconds of fighting, and the clock has not moved a millisecond. This
    // is what lets `RUN_MS - t` count down to a moment that really arrives,
    // however long the first two fights ran.
    frames(s, 375);
    expect(s.t).toBe(stageMs(s.level));
    expect(s.stage).toBe(1);
    expect(s.phase).toBe("playing");
  });

  it("advances the stage the frame the boss goes down, and never wins early", () => {
    const s = atBossOf(1);
    felledTheBoss(s);
    expect(s.stage).toBe(2);
    expect(s.boss).toBeNull();
    expect(s.phase).toBe("playing");
    expect(s.events.filter((e) => e.type === "stage")).toHaveLength(1);
    // THE CONTROL that makes the line above mean something: beating stage 1's
    // boss must not fire a `won`. A run that ended on the warden would look
    // exactly like a working run to anybody only checking that the stage moved.
    expect(s.events.some((e) => e.type === "won")).toBe(false);
    // The new stage's clock starts where the old one ended, so `stageT` is zero
    // rather than still reading a full stage.
    expect(stageT(s)).toBe(0);
  });

  it("carries the weapons, the upgrades and the level across the boundary", () => {
    const s = atBossOf(1);
    s.up.rapid = 4;
    s.power = 7;
    s.popped = 123;
    s.slots.push({ id: "blades", cd: 0 , lv: 1 });
    felledTheBoss(s);
    expect(s.stage).toBe(2);
    expect(s.up.rapid).toBe(4);
    expect(s.power).toBe(7);
    expect(s.popped).toBe(123);
    expect(s.slots.map((k) => k.id)).toEqual(["bolt", "blades"]);
  });

  it("beating the LAST boss wins, and that is the only thing that does", () => {
    const s = atBossOf(3);
    expect(bossOf(s)!.kind).toBe("golem");
    felledTheBoss(s);
    expect(s.phase).toBe("won");
    expect(s.events.some((e) => e.type === "won")).toBe(true);
    // And it does NOT try to walk on to a fourth stage that does not exist.
    expect(s.stage).toBe(3);
    expect(s.events.some((e) => e.type === "stage")).toBe(false);
  });
});

describe("the tie rule is split, and the split is the ruling", () => {
  it("a tie on the LAST stage goes to the win - this platform does not punish", () => {
    const s = atBossOf(3);
    s.maxHp = 1;
    s.hp = 0;
    const boss = bossOf(s)!;
    boss.hp = 0;
    step(s, 16, STILL, rngFor(1));
    expect(s.phase).toBe("won");
  });

  it("THE CONTROL: the same tie on stage 1 is a LOSS, not a free stage", () => {
    // "You won" and "you have nothing left and two stages to go" are not the
    // same sentence, and only one of them is true. Without this the run would
    // carry on at zero hearts, which is a state nothing else in the game can
    // produce and nothing in the chrome can draw.
    const s = atBossOf(1);
    s.maxHp = 1;
    s.hp = 0;
    const boss = bossOf(s)!;
    boss.hp = 0;
    step(s, 16, STILL, rngFor(1));
    expect(s.phase).toBe("over");
    expect(s.stage).toBe(1);
  });
});

describe("what the wave clock may send", () => {
  it("adds exactly one kind per stage, and keeps what earlier stages added", () => {
    // CALM, because it is the level with no shooters - so this reads the STAGE
    // table alone, which is what the claim is about. The shapes that shoot back
    // are a per-LEVEL addition on top of it (2026-09-21) and have their own test
    // below; asserting both in one list would make this red whenever either
    // moved, and unable to say which.
    const seen: EnemyKind[][] = [];
    for (const stage of [1, 2, 3]) {
      const s = newRun("calm");
      s.stage = stage;
      s.t = stage * stageMs(s.level) - 1; // late in the stage, so its own addition is unlocked
      seen.push(kindsAt(s));
    }
    expect(seen[0]).toEqual(["runner", "orb"]);
    expect(seen[1]).toEqual(["runner", "orb", "brute"]);
    expect(seen[2]).toEqual(["runner", "orb", "brute", "shard"]);

    // AND THE CONTROL THAT MAKES THAT A CLAIM ABOUT THE STAGES: the same three
    // stages on `normal` carry the stage table's kinds too, plus its shooter -
    // so the list above is short because calm has no gun, not because `kindsAt`
    // stopped returning things.
    const n = newRun("normal");
    n.stage = 3;
    n.t = 3 * stageMs(n.level) - 1;
    expect(kindsAt(n)).toEqual(expect.arrayContaining(["runner", "orb", "brute", "shard", "spitter"]));
  });

  it("holds a stage's new kind back until `unlockMs`, and the level sets that", () => {
    const early = newRun("wild");
    early.stage = 2;
    early.t = stageMs(early.level); // the instant stage 2 opens
    // The brute is what is held back here. Wild's spitter arrived in stage 1, so
    // it is in the pool and stays - the crowd only ever grows.
    expect(kindsAt(early)).not.toContain("brute");
    expect(kindsAt(early)).toEqual(["runner", "orb", "spitter"]);

    // Wild unlocks at 9s and calm at 24s, so at 12 seconds in they disagree -
    // which is the whole point of the knob, and a test that only looked at one
    // level could not see it had stopped working.
    const w = newRun("wild");
    w.stage = 2;
    w.t = stageMs(w.level) + 12_000;
    expect(kindsAt(w)).toContain("brute");

    const c = newRun("calm");
    c.stage = 2;
    c.t = stageMs(c.level) + 12_000;
    expect(kindsAt(c)).not.toContain("brute");
  });

  it("THE CONTROL: never a boss, on any stage, at any moment in it", () => {
    for (const stage of [1, 2, 3]) {
      for (const at of [0, 0.5, 0.99]) {
        const s = newRun("normal");
        s.stage = stage;
        s.t = (stage - 1) * stageMs(s.level) + stageMs(s.level) * at;
        const kinds = kindsAt(s);
        for (const boss of BOSS_KINDS) expect(kinds).not.toContain(boss);
        expect(kinds).toContain("runner");
      }
    }
  });
});

describe("the bosses themselves", () => {
  it("fill their health bar from their OWN health, not the golem's", () => {
    // This is the assertion the first version of this file could not make. The
    // bar was built inside the Phaser scene, nothing here can drive a scene, and
    // a planted mutation hardcoding `KINDS.golem.hp` as the denominator SURVIVED
    // a 122-green run. `bossBar` exists so the arithmetic is reachable.
    for (const stage of [1, 2, 3]) {
      const s = atBossOf(stage);
      const bar = bossBar(s)!;
      expect(bar.kind).toBe(bossKindFor(stage));
      expect(bar.maxHp).toBe(bossHpOn(s, bar.kind));
      expect(bar.fill).toBe(1);
      // Half its health is half a bar - on a warden that is 40, and a golem
      // denominator would read it as 0.095 instead.
      const boss = bossOf(s)!;
      boss.hp = Math.round(bossHpOn(s, boss.kind) / 2);
      expect(bossBar(s)!.fill).toBeCloseTo(0.5, 2);
    }
    expect(bossBar(newRun("normal"))).toBeNull();
  });

  it("walk in as the stage's own kind, with that kind's own health", () => {
    for (const stage of [1, 2, 3]) {
      const s = atBossOf(stage);
      const boss = bossOf(s)!;
      expect(boss.kind).toBe(bossKindFor(stage));
      expect(boss.hp).toBe(bossHpOn(s, boss.kind));
      // The bar's denominator read off the boss rather than off the golem. A
      // hardcoded `KINDS.golem.hp` drew the warden at 19% and never moved it.
      expect(boss.hp / bossHpOn(s, boss.kind)).toBe(1);
    }
  });

  it("stop the swarm while they are up, on every stage", () => {
    for (const stage of [1, 2, 3]) {
      const s = atBossOf(stage);
      const before = s.enemies.length;
      frames(s, 400);
      expect(s.enemies.filter((e) => !BOSS_KINDS.includes(e.kind)).length).toBeLessThanOrEqual(before);
    }
  });

  it("the two that are not the finish pay out a gem; the golem does not", () => {
    // The run CONTINUES after a warden or a queen, so a gem they drop is a gem
    // somebody collects. It ENDS on the frame the golem dies, so a gem there
    // would be collected by nobody - which is why its xp is 0 rather than an
    // oversight somebody should "fix".
    expect(KINDS.warden.xp).toBeGreaterThan(0);
    expect(KINDS.queen.xp).toBeGreaterThan(0);
    expect(KINDS.golem.xp).toBe(0);
  });

  it("arrive exactly once per stage, however many frames pass", () => {
    const s = newRun("normal");
    s.maxHp = 9999;
    s.hp = 9999;
    s.t = stageMs(s.level) - 2000;
    let arrivals = 0;
    for (let i = 0; i < 600; i++) {
      step(s, 16, STILL, rngFor(1));
      arrivals += s.events.filter((e) => e.type === "boss").length;
    }
    expect(arrivals).toBe(1);
    expect(s.enemies.filter((e) => e.kind === "warden")).toHaveLength(1);
  });
});
