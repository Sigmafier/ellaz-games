// The golem, pinned by BEHAVIOUR.
//
// WHY THIS FILE EXISTS. The tier gate cannot see a boss at all - it greps for
// sprites, five clip ids, `@juice` calls and two weapons, and a run that ends
// with a 420-health wall walking in satisfies exactly none of those checks any
// differently from one that does not. So nothing outside this file can tell the
// difference between "the run ends by beating the golem" and "the run ends".
//
// Three of the assertions below are for things that were genuinely broken, or
// would have been, while this was written:
//
//   - the contact loop kills any shape that reaches the player, so the boss
//     killed itself by touching you and the run was WON by being hit;
//   - `kindsAt` must never hand the golem to the wave clock, or a 40-second-old
//     run gets a 420-health shape and the player never learns why they died;
//   - the swarm has to stop, or the duel happens inside a crowd arriving every
//     230 ms, which is `spawnEvery` at its floor by three minutes.
import { describe, expect, it } from "vitest";
import { cameraOf } from "./world";
import {
  ARENA, ARENA_WIDE, BOSS_KINDS, FINAL, GUNS, KINDS, STAGE_MS, applyUpgrade, bossHpFor, bossOf, kindsAt, newRun, rngFor, runMs, step,
  type Arena, type Enemy, type EnemyKind, type LevelKey, type RunState, type UpgradeId,
} from "./logic";

const STILL = { dx: 0, dy: 0 };

function frames(s: RunState, n: number, rng = rngFor(1)) {
  for (let i = 0; i < n; i++) step(s, 16, STILL, rng);
  return s;
}

function place(s: RunState, kind: EnemyKind, x: number, y: number): Enemy {
  const e: Enemy = { id: s.nextId++, kind, x, y, hp: KINDS[kind].hp, flash: 0 };
  s.enemies.push(e);
  return e;
}

/**
 * A run standing at three minutes with the golem already on the board.
 *
 * `arena` DEFAULTS to the portrait floor, the same way `newRun` does and for the
 * same reason: every assertion in this file that does not care about shape keeps
 * reading exactly what it read before, so a red here means a real regression
 * rather than a signature churn.
 */
function atTheGolem(
  up: Partial<Record<UpgradeId, number>> = {},
  arena: Arena = ARENA,
): RunState {
  const s = newRun("normal", arena);
  for (const [id, n] of Object.entries(up)) {
    for (let i = 0; i < (n ?? 0); i++) applyUpgrade(s, id as UpgradeId);
  }
  // STAGE 3, and not an afterthought: `t` alone stopped being enough when the
  // stages landed. A run at t = RUN_MS on stage 1 is 119 seconds PAST its own
  // stage boundary and summons a WARDEN, so every assertion in this file would
  // have been quietly measuring the wrong boss. The helper says where the run
  // is, and where it is is the last stage, one frame from the golem.
  s.stage = 3;
  s.t = runMs(s.level) - 10;
  step(s, 16, STILL, rngFor(1));
  return s;
}

/**
 * How long the gun needs to bring the golem down, with the player standing
 * still so the weapon is on target every frame it is in range.
 *
 * This is the FLOOR of the fight, not the fight: a real player dodges, walks out
 * of range and loses shots doing it. The hearts are taken out of the way on
 * purpose - this measures the gun, and whether three hearts survive the fight is
 * a different question from how long the fight is.
 */
/** The clock this instrument gives up at. A reading here is NOT a fight length. */
const GIVE_UP_MS = 300_000;

function msToKill(s: RunState): number {
  s.maxHp = 9999;
  s.hp = 9999;
  // Standing still means STILL: an auto-dash would blink the robot 70 units
  // each time the golem arrives, and this measures the gun, not the dash.
  s.dashCd = 1e12;
  // ONE generator for the whole fight, built OUTSIDE the loop.
  //
  // It used to read `step(s, 16, STILL, rngFor(1))`, which builds a FRESH
  // generator every frame and therefore hands back `rngFor(1)`'s first value,
  // sixty times a second, for ever. Every draw in the fight was the same
  // number: the same summon kind at the same angle, the same elite roll. It is
  // the trap this game's own tests hit once before, and it reads as a seed
  // rather than as a bug.
  const rng = rngFor(1);
  let ms = 0;
  while (s.phase === "playing" && ms < GIVE_UP_MS) {
    step(s, 16, STILL, rng);
    ms += 16;
  }
  return ms;
}

/**
 * The same reading, REFUSED when the clock ran out instead of the boss.
 *
 * WHY THIS EXISTS. `msToKill` returns `GIVE_UP_MS` for two completely different
 * events - "the fight took exactly 300 seconds" and "I stopped watching" - and
 * the second is not a fight length at all. Measured 2026-09-22: the bare arm
 * has been returning the cap on `main` for some time, so the cell below was
 * asserting `expect(bare).toBeGreaterThan(loaded)` against a saturated clock,
 * which is satisfied by a golem that can never be killed at all.
 *
 * An instrument that cannot tell "I looked and it was slow" from "I could not
 * look" is not a reader. This one says so out loud.
 */
function msToKillOrThrow(s: RunState, what: string): number {
  const ms = msToKill(s);
  if (ms >= GIVE_UP_MS) {
    throw new Error(
      `${what}: the golem was still standing after ${GIVE_UP_MS} ms, so this is the CLOCK running out, ` +
        `not a fight length. Either the gun got weaker or the boss got tougher than anything can chew.`,
    );
  }
  return ms;
}

describe("the golem arrives at three minutes", () => {
  it("is not there before, and walks in exactly once", () => {
    const s = newRun("normal");
    s.stage = 3;
    s.t = runMs(s.level) - 2000;
    frames(s, 20);
    expect(bossOf(s)).toBeNull();
    expect(s.boss).toBeNull();

    let arrivals = 0;
    for (let i = 0; i < 300; i++) {
      step(s, 16, STILL, rngFor(1));
      arrivals += s.events.filter((e) => e.type === "boss").length;
    }
    expect(arrivals).toBe(1);
    expect(s.enemies.filter((e) => e.kind === "golem")).toHaveLength(1);
    expect(bossOf(s)).not.toBeNull();
  });

  it("stops the clock instead of ending the run", () => {
    const s = atTheGolem();
    expect(s.phase).toBe("playing");
    expect(s.t).toBe(runMs(s.level));
    frames(s, 120);
    expect(s.t).toBe(runMs(s.level));
    expect(s.phase).toBe("playing");
  });

  it("THE CONTROL: the wave clock can never send a boss, on ANY stage", () => {
    // Widened when the stages landed. It used to ask one question at one moment;
    // there are three bosses now and three stages to ask it on, and a check that
    // only ever looked at stage 3 would not notice a warden in stage 1's pool.
    for (const stage of [1, 2, 3]) {
      const s = newRun("normal");
      s.stage = stage;
      s.t = stage * STAGE_MS - 1;
      const kinds = kindsAt(s);
      for (const boss of BOSS_KINDS) expect(kinds).not.toContain(boss);
      // Not vacuous: late in its stage every kind that stage has unlocked IS in
      // the pool, so this would catch a `kindsAt` that returned nothing at all.
      expect(kinds.length).toBe(stage + 1);
      expect(kinds).toContain("runner");
    }
  });

  it("stops the WAVE CLOCK - and the boss's own summons are not the wave clock", () => {
    // 400 frames is 6.4 seconds, and normal's golem calls its first shapes in at
    // 9 (`FINAL.normal.summonMs`), so this window sees the swarm stopped and no
    // summon yet. That used to be luck: this cell asserted "no shape but the
    // golem" full stop, which stopped being true the day the boss learned to
    // summon and would have gone red on a `summonMs` retune it has no opinion
    // about. The window is named now, and the summon has its own cell below.
    const duel = atTheGolem();
    frames(duel, 400);
    expect(400 * 16).toBeLessThan(FINAL.normal.summonMs);
    expect(duel.enemies.filter((e) => e.kind !== "golem")).toHaveLength(0);

    // The control, and it is what makes the line above mean something: the same
    // 400 frames a minute earlier fill the arena.
    const before = newRun("normal");
    before.stage = 3;
    before.t = runMs(before.level) - 60_000;
    frames(before, 400);
    expect(before.enemies.length).toBeGreaterThan(0);
  });

  it("CALLS SHAPES IN, on its own clock, and never on easy mode", () => {
    // Operator ruling 2026-09-22: the final boss *"spawns some enemies"*.
    //
    // Long enough to cross the summon clock twice, so this reads the CLOCK
    // rather than one arrival - a boss that summoned once and stopped would pass
    // a single-arrival check and is not what was asked for.
    const s = atTheGolem();
    // IMMORTAL, and this is the whole reason the first draft of this cell read
    // zero summons: `atTheGolem` leaves the player on three hearts, a golem that
    // now walks through its own wind-up reaches them well inside nine seconds,
    // and `step` returns early once the run is over. The cell was measuring how
    // long the player survived, not whether the boss summons.
    s.hp = 9999;
    s.maxHp = 9999;
    s.dashCd = 1e12;
    const rng = rngFor(5);
    let summons = 0;
    const called: EnemyKind[] = [];
    for (let i = 0; i < Math.ceil((FINAL.normal.summonMs * 2.5) / 16); i++) {
      const before = new Set(s.enemies.map((e) => e.id));
      step(s, 16, STILL, rng);
      const n = s.events.filter((e) => e.type === "summon").length;
      summons += n;
      // Whatever is new on the board on a frame the boss summoned is what it
      // called in. Read here because it does not survive to the end of the loop.
      if (n > 0) for (const e of s.enemies) if (!before.has(e.id)) called.push(e.kind);
    }
    expect(summons).toBeGreaterThanOrEqual(2);
    // SAMPLED ON THE SUMMON FRAME, never at the end.
    //
    // The first draft of this cell read `s.enemies` after the loop and found
    // nothing but the golem, which reads as "the summon does not work" and is
    // not: the called-in shapes walk straight at the player, and the contact
    // rule kills any shape that reaches them. On an immortal test player they
    // therefore live about a second. What the boss DID is an event; what is
    // standing there at the end is a different question.
    expect(called.length).toBeGreaterThan(0);
    // NEVER A BOSS AND NEVER A GUN, asserted as a PROPERTY rather than against
    // the list that produced it.
    //
    // This read `expect(SUMMONS).toContain(kind)` and could not fail: the kinds
    // come FROM `SUMMONS`, so it was asking whether a list contains its own
    // members. Planted `SUMMONS = ["runner", "orb", "lancer"]` - a boss handing
    // you a three-bolt shooter at point-blank range with no telegraph - and the
    // cell stayed green. `GUNS` and `BOSS_KINDS` are independent of `SUMMONS`,
    // so the same mutation reds now.
    for (const kind of called) {
      expect(GUNS[kind], `the golem called in a ${kind}, which shoots back`).toBeUndefined();
      expect(BOSS_KINDS, `the golem called in a ${kind}, which is a boss`).not.toContain(kind);
    }

    // EASY MODE NEVER MEETS ONE, over the same window. `FINAL.calm` is the
    // identity row, and this is the second guarantee beside it.
    const calm = newRun("calm");
    calm.stage = 3;
    calm.t = runMs("calm") - 10;
    step(calm, 16, STILL, rngFor(5));
    calm.hp = 9999;
    calm.maxHp = 9999;
    calm.dashCd = 1e12;
    const crng = rngFor(5);
    let calmSummons = 0;
    for (let i = 0; i < Math.ceil((FINAL.normal.summonMs * 2.5) / 16); i++) {
      step(calm, 16, STILL, crng);
      calmSummons += calm.events.filter((e) => e.type === "summon").length;
    }
    expect(calmSummons).toBe(0);
    expect(calm.enemies.filter((e) => e.kind !== "golem")).toHaveLength(0);
  });
});

describe("the golem does not die by touching you", () => {
  it("costs a heart and keeps its health", () => {
    const s = atTheGolem();
    const g = bossOf(s)!;
    // Hold the gun: this test is about the collision, not about the weapon.
    for (const k of s.slots) k.cd = 9000;
    s.dashCd = 9000;
    s.x = g.x;
    s.y = g.y;
    step(s, 16, STILL, rngFor(1));

    expect(bossOf(s)).not.toBeNull();
    expect(bossOf(s)!.hp).toBe(bossHpFor("golem", s.level));
    expect(s.phase).toBe("playing");
    expect(s.hp).toBe(2);
    expect(s.events.some((e) => e.type === "hurt")).toBe(true);
    expect(s.events.some((e) => e.type === "pop")).toBe(false);
  });

  it("THE CONTROL: an ordinary shape in the same place does die", () => {
    // Without this, "the golem survives contact" is satisfied by a build where
    // NOTHING dies on contact - which would be a different, larger bug.
    const s = newRun("normal");
    for (const k of s.slots) k.cd = 9000;
    s.dashCd = 9000;
    place(s, "runner", s.x, s.y);
    step(s, 16, STILL, rngFor(1));
    expect(s.enemies).toHaveLength(0);
    expect(s.events.some((e) => e.type === "pop")).toBe(true);
    expect(s.hp).toBe(2);
  });
});

describe("beating it is what wins the run", () => {
  it("wins when the golem falls, and not before", () => {
    const s = atTheGolem({ rapid: 3, power: 2, spread: 1 });
    s.maxHp = 9999;
    s.hp = 9999;
    const g = bossOf(s)!;
    g.x = s.x + 70;
    g.y = s.y;

    // Most of its health gone, but not all: still no win.
    g.hp = 12;
    frames(s, 2);
    expect(s.phase).toBe("playing");
    expect(s.events.some((e) => e.type === "won")).toBe(false);

    for (let i = 0; i < 400 && s.phase === "playing"; i++) step(s, 16, STILL, rngFor(1));
    expect(s.phase).toBe("won");
    expect(s.events.some((e) => e.type === "won")).toBe(true);
    expect(bossOf(s)).toBeNull();
  });

  it("a tie goes to the win - the golem fell, so the run is won", () => {
    // Both endings can land on one frame: a leftover shape reaching you as the
    // golem goes down. The ruling is in `logic.ts` and this is what pins it, in
    // the one arrangement that can produce the tie deterministically.
    const s = atTheGolem();
    s.enemies = s.enemies.filter((e) => e.id !== s.boss);
    s.hp = 1;
    s.invuln = 0;
    for (const k of s.slots) k.cd = 9000;
    s.dashCd = 9000;
    place(s, "runner", s.x, s.y);
    step(s, 16, STILL, rngFor(1));

    expect(s.hp).toBe(0);
    expect(s.phase).toBe("won");
    expect(s.events.some((e) => e.type === "over")).toBe(false);
  });

  it("running out of hearts with the golem still up is still a loss", () => {
    // The control for the tie above: the generous ruling must not have turned
    // every boss-phase death into a win.
    const s = atTheGolem();
    s.hp = 1;
    s.invuln = 0;
    for (const k of s.slots) k.cd = 9000;
    s.dashCd = 9000;
    place(s, "runner", s.x, s.y);
    step(s, 16, STILL, rngFor(1));
    expect(s.phase).toBe("over");
    expect(s.events.some((e) => e.type === "over")).toBe(true);
  });
});

/**
 * The window each level's golem fight is held to, with the WEAK loadout below.
 *
 * ONE loadout on all three, so the three readings are comparable and the only
 * variable is `bossHp`. It is not what a player arrives with - a five or eight
 * minute run hands out far more than three rapids and two powers - so these are
 * the fight's CEILING the way `msToKill` standing still is its floor. What a
 * real loadout does to a real golem is measured in `pacing.test.ts`, by a bot
 * that played the whole run to get there.
 */
const FIGHT_WINDOW: Record<LevelKey, [number, number]> = {
  calm: [6_000, 40_000],
  normal: [8_000, 62_000],
  wild: [10_000, 90_000],
};

describe("the fight is a fight, measured rather than felt", () => {
  it("takes between six and forty seconds with a representative loadout", () => {
    const loaded = msToKillOrThrow(atTheGolem({ rapid: 3, power: 2, spread: 1 }), "normal, three rapids");
    // NOT `msToKillOrThrow`: this arm is EXPECTED to run the clock out, and the
    // assertion below says so. See the note on that function.
    const bare = msToKill(atTheGolem());
    // Printed so the constant in `logic.ts` can be retuned from a reading rather
    // than from a guess, and so a weapon change shows up here as a number.
    console.log(`golem time-to-kill: loadout ${loaded} ms, no upgrades ${bare} ms`);

    // The WINDOW is pinned, not the number: retuning a weapon should move the
    // fight length, not red an unrelated file. Six seconds is "not a speed
    // bump"; the ceiling is "not a chore".
    //
    // IT IS PER LEVEL SINCE 2026-09-21, because `RULES[level].bossHp` is: an
    // eight-minute wild run does not finish on the same wall a three-minute calm
    // one does, so holding wild's 798-health golem to calm's forty seconds would
    // be pinning a number that belongs to another level. Calm's is unchanged.
    const [lo, hi] = FIGHT_WINDOW.normal;
    expect(loaded).toBeGreaterThan(lo);
    expect(loaded).toBeLessThan(hi);
    // UPGRADES HAVE TO MATTER, and this is the honest version of that claim.
    //
    // It read `expect(bare).toBeGreaterThan(loaded)` until 2026-09-22, which
    // sounds like a statement about the gun and is not: `msToKill` saturates at
    // `GIVE_UP_MS`, the bare arm has been saturated on `main` for some time, and
    // a saturated clock is greater than any real fight length whatever the game
    // is doing. It would have passed on a golem with a million health.
    //
    // What is actually true, measured, and worth holding: a run that arrives at
    // the final boss having taken NOTHING does not beat it. That is the run's own
    // argument for the upgrade cards, and unlike the line it replaces it fails
    // the day a bare loadout starts winning.
    expect(bare).toBe(GIVE_UP_MS);
    expect(loaded).toBeLessThan(GIVE_UP_MS);
  });

  it("walks in from just above the VIEW, so it is seen coming", () => {
    // Since the big map (2026-09-14) the golem enters over the top edge of what
    // the player can SEE, wherever on the world that is - not at the top of a
    // world three screens tall, from where it would walk for most of a minute.
    const s = atTheGolem();
    const g = bossOf(s)!;
    const c = cameraOf(s);
    expect(g.y).toBeLessThan(c.y);
    expect(g.y).toBeGreaterThan(c.y - 60);
    expect(g.x).toBeGreaterThan(c.x);
    expect(g.x).toBeLessThan(c.x + ARENA.w);

    // The same on the landscape view, which is a different arrival: it enters
    // at that view's own middle, not at a number baked in for one shape.
    const w = atTheGolem({}, ARENA_WIDE);
    const gw = bossOf(w)!;
    const cw = cameraOf(w);
    expect(gw.y).toBeLessThan(cw.y);
    expect(gw.x).toBeGreaterThan(cw.x);
    expect(gw.x).toBeLessThan(cw.x + ARENA_WIDE.w);
  });

  it("is still a fight on the LANDSCAPE arena, and shorter for a reason", () => {
    // WHY THIS EXISTS. The fight above is measured on the portrait floor only.
    // Once a PC plays on a 648x364 arena, a portrait-only figure is a number
    // wearing no label - and it went stale silently the day the landscape ruling
    // landed, with this file still green. So both shapes are measured here.
    const wide = msToKill(atTheGolem({ rapid: 3, power: 2, spread: 1 }, ARENA_WIDE));
    const portrait = msToKill(atTheGolem({ rapid: 3, power: 2, spread: 1 }));
    console.log(`golem time-to-kill: landscape ${wide} ms, portrait ${portrait} ms`);

    // The same WINDOW the portrait arm is held to. A landscape fight that fell
    // out of it would be a different game, not a different layout.
    const [lo, hi] = FIGHT_WINDOW.normal;
    expect(wide).toBeGreaterThan(lo);
    expect(wide).toBeLessThan(hi);

    // Shorter is EXPECTED and is geometry, not tuning: the golem enters at the
    // top edge, `TARGET_RANGE` is 240, and this arena is only 364 tall, so it is
    // inside the gun's reach almost as soon as it appears. What is pinned is
    // that it is shorter by a LITTLE - a landscape fight at half the length
    // would mean the boss had stopped being the finish the run is built toward.
    expect(wide).toBeLessThan(portrait);
    expect(wide).toBeGreaterThan(portrait * 0.7);
  });
});
