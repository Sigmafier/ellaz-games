// THE SHAPES THAT SHOOT BACK, pinned by behaviour.
//
// Operator ruling 2026-09-21: *"lets introduce some harder enemies maybe that
// shoots a bit back and need to dodge it. Make it a bit harder as we go ... The
// sooting back guys keep in medium (less lethal) and hard (more brutal)."*
//
// WHY THIS FILE EXISTS. Nothing outside it can tell the difference between a
// shooter and a slow runner. `assert-tier.mjs` greps this game's source for
// sprites, clip ids and the word WEAPONS; `logic.test.ts` drives the crowd;
// `boss.test.ts` drives the golem. A `spitter` that walked in and never fired
// would satisfy every one of them, and the only tell would be a player who
// noticed the game was not harder after all.
//
// Three claims, and each one is a promise to the player rather than a number:
//   - it TELEGRAPHS: it stops, it glows, and only then does a bolt exist;
//   - it KEEPS ITS DISTANCE, so it is a problem to go and solve rather than one
//     more body in the crowd;
//   - it is NEVER on the easy level, and never more than a handful at once.
import { describe, expect, it } from "vitest";
import {
  ARENA_WIDE, BASE_OF, GUNS, KINDS, RULES, SHOOTERS, STAGE_COUNT, kindsAt, newRun, rngFor, stageMs, step,
  type Enemy, type EnemyKind, type LevelKey, type RunState,
} from "./logic";
import { FREEZE_NEED, triggerFreeze } from "./powers";

const STILL = { dx: 0, dy: 0 };

/** Put a shape exactly where the test needs it, with its gun ready to start. */
function place(s: RunState, kind: EnemyKind, x: number, y: number): Enemy {
  const e: Enemy = { id: s.nextId++, kind, x, y, hp: KINDS[kind].hp, flash: 0, gunCd: 0 };
  s.enemies.push(e);
  return e;
}

/**
 * Hold the player's own guns AND the wave clock, so a test about one shooter is
 * about that shooter: not about the gun that would kill it, and not about the
 * crowd that would otherwise arrive behind it. The spawner is the one that
 * matters - the dodge control below reported a hit for three runs before anybody
 * noticed the robot had backed into a runner while sidestepping a bolt.
 */
function unarmed(s: RunState): RunState {
  for (const k of s.slots) k.cd = 9_000;
  s.spawnIn = Number.MAX_SAFE_INTEGER;
  return s;
}

/** Run frames until `stop` says so, or give up after `cap` of them. */
function until(s: RunState, stop: (s: RunState) => boolean, cap = 600): number {
  for (let i = 0; i < cap; i++) {
    for (const k of s.slots) k.cd = 9_000;
    s.spawnIn = Number.MAX_SAFE_INTEGER;
    step(s, 16, STILL, rngFor(1));
    if (stop(s)) return i + 1;
  }
  return -1;
}

describe("a shooter tells you before it shoots", () => {
  it("stops, winds up, and only then is there a bolt", () => {
    const s = unarmed(newRun("wild"));
    const e = place(s, "spitter", s.x + 170, s.y);
    const x0 = e.x;

    // The wind-up starts on the first frame - its clock was handed to it ready.
    step(s, 16, STILL, rngFor(1));
    expect(e.wind, "no wind-up started").toBeGreaterThan(0);
    expect(s.shots, "a bolt existed before the telegraph finished").toHaveLength(0);

    // It holds still for the whole telegraph. A shooter that walked while it
    // charged would move the line of fire the player just read. Within ONE
    // frame of travel, because the frame the bolt leaves on is also the frame it
    // starts walking again - which is the behaviour, not a tolerance.
    const frames = until(s, (q) => q.shots.length > 0);
    expect(frames, "it never fired").toBeGreaterThan(0);
    expect(Math.abs(e.x - x0)).toBeLessThan(KINDS.spitter.speed * 0.016 * 1.5);
    // And the wait was the wind-up the table declares, not an instant shot.
    const want = GUNS.spitter!.windup * RULES.wild.windup;
    expect(frames * 16).toBeGreaterThanOrEqual(want - 16);
    expect(frames * 16).toBeLessThanOrEqual(want + 64);
  });

  it("aims at the player, and the bolt costs a heart when it lands", () => {
    const s = unarmed(newRun("wild"));
    s.dashCd = 9_000; // the dash is pinned in powers.test.ts; this is about the bolt
    place(s, "spitter", s.x + 170, s.y);
    until(s, (q) => q.shots.length > 0);
    const b = s.shots[0];
    // Thrown back along the line to the player: leftward, and level.
    expect(b.vx).toBeLessThan(0);
    expect(Math.abs(b.vy)).toBeLessThan(1);

    const hit = until(s, (q) => q.hp < 3, 400);
    expect(hit, "the bolt never reached a player standing in front of it").toBeGreaterThan(0);
    expect(s.hp).toBe(2);
    expect(s.shots, "the bolt was not spent on the hit").toHaveLength(0);
  });

  it("THE CONTROL: a step aside and the same bolt misses", () => {
    // Without this, "the bolt costs a heart" is satisfied by a bolt that cannot
    // be dodged - which is a shape that takes a heart rather than one you play
    // against, and the opposite of what was asked for.
    const s = unarmed(newRun("wild"));
    s.dashCd = 9_000;
    place(s, "spitter", s.x + 170, s.y);
    until(s, (q) => q.shots.length > 0);
    // THAT bolt, by id, for as long as IT is in the air. Watching `shots.length`
    // instead would keep the loop running through the spitter's next shot and
    // the one after, and walk the robot into a wall - which is how the first
    // version of this control reported a dodge that had worked as a hit.
    const id = s.shots[0].id;
    for (let i = 0; i < 400 && s.shots.some((b) => b.id === id); i++) {
      for (const k of s.slots) k.cd = 9_000;
      step(s, 16, { dx: 0, dy: -1 }, rngFor(1));
    }
    expect(s.hp).toBe(3);
  });

  it("never shoots from off the screen", () => {
    // A bolt from a shape the player cannot see is a heart taken by something
    // they had no way to answer, and the world is three views wide.
    const s = unarmed(newRun("wild", ARENA_WIDE));
    // BOTH halves have to hold or this proves nothing: inside the gun's 235 and
    // outside the view, whose top edge is 182 above a player standing in the
    // middle of it. 210 is the only band where the two disagree.
    const off = 210;
    const e = place(s, "spitter", s.x, s.y - off);
    expect(off).toBeLessThan(GUNS.spitter!.range);
    expect(off).toBeGreaterThan(ARENA_WIDE.h / 2);
    for (let i = 0; i < 200; i++) {
      for (const k of s.slots) k.cd = 9_000;
      // Hold it out there: the walk would otherwise bring it into view.
      e.x = s.x;
      e.y = s.y - off;
      step(s, 16, STILL, rngFor(1));
    }
    expect(s.shots).toHaveLength(0);
  });
});

describe("a shooter keeps its distance", () => {
  it("walks in only as far as its gun wants, and then holds", () => {
    const s = unarmed(newRun("wild"));
    s.dashCd = 1e12;
    s.hp = 9_999;
    const e = place(s, "spitter", s.x + 340, s.y);
    for (let i = 0; i < 900; i++) {
      for (const k of s.slots) k.cd = 9_000;
      step(s, 16, STILL, rngFor(1));
    }
    const d = Math.hypot(s.x - e.x, s.y - e.y);
    expect(d).toBeLessThan(GUNS.spitter!.keep + 12);
    expect(d, "it walked all the way in, which makes it a slow runner").toBeGreaterThan(
      GUNS.spitter!.keep - 40,
    );
  });

  it("THE CONTROL: an ordinary shape in the same place walks right into you", () => {
    const s = unarmed(newRun("wild"));
    s.dashCd = 1e12;
    s.hp = 9_999;
    const e = place(s, "orb", s.x + 340, s.y);
    let reached = false;
    for (let i = 0; i < 900 && !reached; i++) {
      for (const k of s.slots) k.cd = 9_000;
      step(s, 16, STILL, rngFor(1));
      reached = e.hp <= 0;
    }
    expect(reached, "the orb never arrived").toBe(true);
  });
});

describe("the freeze stops the bolts too", () => {
  it("holds a bolt where it is, and it hurts nobody while it is held", () => {
    // The one moment the super must not make things worse: every shape stopped
    // and their bolts still coming would be a freeze that gets you hit.
    const s = unarmed(newRun("wild"));
    s.dashCd = 9_000;
    place(s, "spitter", s.x + 170, s.y);
    until(s, (q) => q.shots.length > 0);
    const b = s.shots[0];
    s.charge = FREEZE_NEED;
    expect(triggerFreeze(s)).toBe(true);
    const at = { x: b.x, y: b.y };
    for (let i = 0; i < 60; i++) {
      for (const k of s.slots) k.cd = 9_000;
      step(s, 16, STILL, rngFor(1));
    }
    expect({ x: b.x, y: b.y }).toEqual(at);
    expect(s.hp).toBe(3);
  });
});

describe("which levels get them, and how many", () => {
  it("CALM NEVER DOES, at any moment of any of its stages", () => {
    // The operator's line was *"Dont touch the easy mode"*. This walks every
    // stage of the whole calm clock rather than sampling it, because a table of
    // shooters is a list and a list is exactly the shape one gets added to by
    // accident.
    const s = newRun("calm");
    for (let stage = 1; stage <= STAGE_COUNT; stage++) {
      s.stage = stage;
      for (let t = (stage - 1) * stageMs("calm"); t <= stage * stageMs("calm"); t += 1_000) {
        s.t = t;
        for (const kind of kindsAt(s)) {
          expect(GUNS[kind], `calm can send a ${kind} at ${t} ms`).toBeUndefined();
        }
      }
    }
    expect(SHOOTERS.calm, "calm has a shooter in its table").toEqual([]);
    // And the second guarantee, which is independent of the table: even a shape
    // that somehow got drawn could not keep its gun.
    expect(RULES.calm.shooters).toBe(0);
  });

  it("normal gets the spitter and never the lancer; wild gets both, later", () => {
    const seen = (level: LevelKey) => {
      const s = newRun(level);
      const out = new Map<EnemyKind, number>();
      for (let stage = 1; stage <= STAGE_COUNT; stage++) {
        s.stage = stage;
        for (let t = (stage - 1) * stageMs(level); t <= stage * stageMs(level); t += 1_000) {
          s.t = t;
          for (const kind of kindsAt(s)) if (!out.has(kind)) out.set(kind, t);
        }
      }
      return out;
    };
    const n = seen("normal");
    const w = seen("wild");
    expect(n.has("spitter")).toBe(true);
    expect(n.has("lancer"), "the lancer is hard mode's, not medium's").toBe(false);
    expect(w.has("spitter")).toBe(true);
    expect(w.has("lancer")).toBe(true);

    // LATER IS THE POINT: *"Make it a bit harder as we go"*. Nothing shoots in
    // the first minute of medium or the first half minute of hard, and the
    // lancer is a thing that happens to a run that is already going well.
    expect(n.get("spitter")!, "medium shoots at you in its first minute").toBeGreaterThanOrEqual(60_000);
    expect(w.get("spitter")!, "hard shoots at you in its first minute").toBeGreaterThanOrEqual(60_000);
    expect(w.get("lancer")!).toBeGreaterThan(w.get("spitter")!);
  });

  it("hard is more brutal than medium, in every term that decides a bolt", () => {
    // *"(less lethal)"* and *"(more brutal)"* are the operator's own words, and
    // this is the whole of what they mean in the table: a wild bolt comes
    // sooner, faster, with less warning, and from more shapes at once.
    expect(RULES.wild.shotEvery).toBeLessThan(RULES.normal.shotEvery);
    expect(RULES.wild.shotSpeed).toBeGreaterThan(RULES.normal.shotSpeed);
    expect(RULES.wild.windup).toBeLessThan(RULES.normal.windup);
    expect(RULES.wild.shooters).toBeGreaterThan(RULES.normal.shooters);

    // Driven, not merely read: the same shape on the two levels, from the same
    // place, and the wild one fires first and its bolt travels faster.
    const fire = (level: LevelKey) => {
      const s = unarmed(newRun(level));
      place(s, "spitter", s.x + 170, s.y);
      const frames = until(s, (q) => q.shots.length > 0);
      return { frames, speed: Math.hypot(s.shots[0].vx, s.shots[0].vy) };
    };
    const n = fire("normal");
    const w = fire("wild");
    expect(w.frames).toBeLessThan(n.frames);
    expect(w.speed).toBeGreaterThan(n.speed);
  });

  it("caps how many can be shooting at once, and sends their base shape instead", () => {
    // MEASURED, and the reason the cap exists: without it, wild's late weights
    // against a board of 64 shapes held 20 to 23 bolts in the air at once - the
    // shot cap itself saturated - and a bot that dodges perfectly died at 80 to
    // 130 seconds in every seed, to a hail it had no way to read.
    const s = newRun("wild");
    s.stage = STAGE_COUNT; // the stage that has both shooters in its pool
    s.t = (STAGE_COUNT - 1) * stageMs("wild") + stageMs("wild") / 2;
    // IMMORTAL, and it is load-bearing rather than tidy: `step` returns on the
    // first frame after the run ends, so a robot that dies on frame nine turns
    // every frame after it into a no-op and the cap is "never exceeded" by a
    // simulation that stopped. That is what the first version of this measured.
    s.hp = 9_999;
    s.maxHp = 9_999;
    s.dashCd = 1e12;
    const cap = RULES.wild.shooters;
    // ONE generator for the whole run, hoisted out of the loop. `rngFor(7)` on
    // every frame is a FRESH mulberry32 handing back its first value forever, so
    // the weighted pick lands on the same kind every time - this test spawned 65
    // runners and nothing else, and read as a cap that was never exercised. The
    // pattern is all over this game's older tests and is harmless where a frame
    // is driven once; it is fatal to anything that samples a distribution.
    const rng = rngFor(7);
    for (let i = 0; i < 400; i++) {
      s.spawnIn = 0;
      for (const k of s.slots) k.cd = 9_000;
      step(s, 16, STILL, rng);
      const armed = s.enemies.filter((e) => GUNS[e.kind]).length;
      expect(armed, `${armed} shooters on the board, cap is ${cap}`).toBeLessThanOrEqual(cap);
    }
    // NOT VACUOUS: the cap was actually reached, and the crowd that arrived
    // after it is the ordinary shape rather than nothing at all.
    expect(s.enemies.filter((e) => GUNS[e.kind]).length).toBe(cap);
    expect(s.enemies.length).toBeGreaterThan(cap * 2);
    // And every shooter has somewhere to downgrade to, or the cap would silently
    // keep sending the shooter it was meant to replace.
    for (const { kind } of SHOOTERS.wild) {
      if (!GUNS[kind]) continue;
      expect(BASE_OF[kind], `${kind} has no ordinary shape to fall back to`).toBeTruthy();
      expect(GUNS[BASE_OF[kind]!], `${kind} falls back to something that also shoots`).toBeUndefined();
    }
  });
});
