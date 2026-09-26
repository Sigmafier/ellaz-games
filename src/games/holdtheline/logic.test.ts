import { describe, expect, it } from "vitest";
import {
  ARENA,
  ARENA_WIDE,
  HOUSE_W,
  KIND,
  LANE,
  WALKER_CAP,
  airY,
  clearBonus,
  fire,
  groundY,
  gunY,
  inCampaign,
  isOver,
  newRun,
  reload,
  runRng,
  startWave,
  step,
  wallX,
} from "./logic";
import { CAMPAIGN_WAVES, poolFor } from "./waves";
import { buy, canBuy, magazineOf } from "./shop";
import type { RunState, ShopId } from "./types";

/** Drive one wave to its end, or give up after `cap` frames. Returns frames spent. */
function playWave(s: RunState, aim: () => { x: number; y: number }, cap = 60_000): number {
  let frames = 0;
  while (!isOver(s) && s.phase === "wave" && frames < cap) {
    const a = aim();
    fire(s, a.x, a.y, runRng(frames + 1));
    step(s, 16);
    frames++;
  }
  return frames;
}

/**
 * Aim at a body, but not the right one and not every frame.
 *
 * THE SECOND ARM, and it exists because of
 * `.claude/rules/a-perfect-bot-proves-a-level-can-be-won-not-how-hard-it-is.md`:
 * `aimNearest` below fires on every frame it legally can, at the closest thing,
 * which is a player no thumb can be. Its numbers say whether a campaign CAN be
 * won and say nothing whatever about how hard it is. This one is worse in the
 * ways a thumb is worse - a fixed rhythm rather than frame-perfect timing, and
 * whatever it happens to be pointing at rather than the thing about to arrive.
 *
 * The two bracket the answer. Neither is a tuning target; the operator's play is.
 */
function aimSloppy(s: RunState, everyNth = 5) {
  let n = 0;
  return () => {
    n++;
    const live = s.walkers.filter((w) => w.ko === 0);
    if (n % everyNth !== 0 || live.length === 0) {
      // Pointed at nothing, so `fire` spends a round on the empty lane.
      return { x: s.arena.w, y: groundY(s.arena) };
    }
    const w = live[n % live.length];
    return { x: w.x, y: w.y };
  };
}

/** Aim at the nearest live body, which is what a competent player does. */
function aimNearest(s: RunState) {
  return () => {
    let best = null as null | { x: number; y: number };
    let bx = Infinity;
    for (const w of s.walkers) {
      if (w.ko > 0) continue;
      if (w.x < bx) {
        bx = w.x;
        best = { x: w.x, y: w.y };
      }
    }
    return best ?? { x: s.arena.w, y: groundY(s.arena) };
  };
}

describe("the lane", () => {
  it("is the same width on both arms - this game holds LANE, not area", () => {
    // The deliberate departure from the showcase equal-area rule. Survivors
    // holds area because area is crowd density in an omnidirectional arena;
    // here the difficulty is lane length against gun reach, and height is sky.
    expect(ARENA.w).toBe(LANE);
    expect(ARENA_WIDE.w).toBe(LANE);
  });

  it("and the two arms really are different shapes, or there is nothing to hold", () => {
    expect(ARENA_WIDE.h).toBeGreaterThan(ARENA.h);
    expect(ARENA.w / ARENA.h).toBeGreaterThan(ARENA_WIDE.w / ARENA_WIDE.h);
  });

  it("both arms are landscape", () => {
    for (const a of [ARENA, ARENA_WIDE]) expect(a.w).toBeGreaterThan(a.h);
  });

  it("derives the sky from the arena, so a taller arm really moves the air lane", () => {
    expect(airY(ARENA_WIDE)).not.toBe(airY(ARENA));
    for (const a of [ARENA, ARENA_WIDE]) {
      expect(airY(a)).toBeLessThan(groundY(a));
      expect(airY(a)).toBeGreaterThan(0);
    }
  });

  it("keeps the gun inside the building and above the ground", () => {
    for (const a of [ARENA, ARENA_WIDE]) {
      expect(gunY(a)).toBeGreaterThan(0);
      expect(gunY(a)).toBeLessThan(groundY(a));
    }
    expect(wallX()).toBe(HOUSE_W);
  });
});

describe("a run starts in the shop", () => {
  it("so the first thing a player does is choose, not dodge", () => {
    const s = newRun("normal", ARENA);
    expect(s.phase).toBe("shop");
    expect(s.wave).toBe(1);
    expect(s.walkers).toHaveLength(0);
  });

  it("with enough cash to make wave 1 a decision", () => {
    const s = newRun("normal", ARENA);
    const affordable = (["damage", "reload", "repair"] as ShopId[]).filter((id) => canBuy(s, id));
    expect(affordable.length).toBeGreaterThan(0);
  });

  it("holding a loaded pistol", () => {
    const s = newRun("normal", ARENA);
    expect(s.weapon).toBe("pistol");
    expect(s.ammo).toBe(magazineOf(s));
  });

  it("and nothing is won yet", () => {
    expect(newRun("normal", ARENA).wonAt).toBe(0);
  });
});

describe("the same seed plays the same wave", () => {
  it("frame for frame", () => {
    const play = (seed: number) => {
      const s = newRun("normal", ARENA);
      startWave(s, runRng(seed));
      for (let i = 0; i < 400; i++) {
        fire(s, 400, groundY(ARENA), runRng(i + 1));
        step(s, 16);
      }
      return JSON.stringify({ w: s.walkers, cash: s.cash, wall: s.wall, score: s.score });
    };
    expect(play(5)).toBe(play(5));
  });

  it("and a different seed plays a different one", () => {
    // Without this pair, a frozen sim and a deterministic one read identically.
    //
    // AT A WAVE WITH A MIXED POOL, and the first version of this got it wrong:
    // it ran at wave 1, whose pool is `["foot"]` alone, so every seed sends
    // foot,foot,foot and the control could not express the difference it exists
    // to report. It failed on correct code - the family
    // `a-diagnostic-that-truncates-what-it-compares.md` collects.
    const play = (seed: number) => {
      const s = newRun("normal", ARENA);
      s.wave = 14;
      s.phase = "shop";
      startWave(s, runRng(seed));
      for (let i = 0; i < 400; i++) step(s, 16);
      return s.walkers.map((w) => w.kind).join(",");
    };
    expect(poolFor(14).length).toBeGreaterThan(1); // the population guard
    expect(play(1)).not.toBe(play(4242));
  });
});

describe("the gun", () => {
  it("will not fire in the shop", () => {
    const s = newRun("normal", ARENA);
    fire(s, 400, 300);
    expect(s.shots).toHaveLength(0);
  });

  it("spends a round and goes on cooldown", () => {
    const s = newRun("normal", ARENA);
    startWave(s, runRng(1));
    const mag = s.ammo;
    fire(s, 400, groundY(ARENA));
    expect(s.ammo).toBe(mag - 1);
    expect(s.weaponCool).toBeGreaterThan(0);
    expect(s.shots.length).toBeGreaterThan(0);
  });

  it("reloads on empty and comes back full", () => {
    const s = newRun("normal", ARENA);
    startWave(s, runRng(1));
    const mag = s.ammo;
    for (let i = 0; i < mag; i++) {
      s.weaponCool = 0;
      fire(s, 400, groundY(ARENA));
    }
    expect(s.ammo).toBe(0);
    expect(s.reloading).toBe(true);
    for (let i = 0; i < 400; i++) step(s, 16);
    expect(s.reloading).toBe(false);
    expect(s.ammo).toBe(mag);
  });

  it("a shotgun throws several pellets from one press", () => {
    const s = newRun("normal", ARENA);
    s.cash = 1e6;
    s.wave = 4;
    buy(s, "shotgun");
    startWave(s, runRng(1));
    fire(s, 400, groundY(ARENA), runRng(2));
    expect(s.shots.length).toBeGreaterThan(1);
  });

  it("an early reload is free to ask for and ignored when pointless", () => {
    const s = newRun("normal", ARENA);
    startWave(s, runRng(1));
    reload(s);
    expect(s.reloading).toBe(false); // already full
    s.weaponCool = 0;
    fire(s, 400, groundY(ARENA));
    reload(s);
    expect(s.reloading).toBe(true);
  });
});

describe("what walks in", () => {
  it("enters from outside the lane, so nothing pops into view at the edge", () => {
    const s = newRun("normal", ARENA);
    startWave(s, runRng(1));
    step(s, 16);
    expect(s.walkers.length).toBeGreaterThan(0);
    expect(s.walkers[0].x).toBeGreaterThan(s.arena.w);
  });

  it("walks toward the house and stops at its own standoff", () => {
    const s = newRun("normal", ARENA);
    startWave(s, runRng(1));
    step(s, 16);
    const w = s.walkers[0];
    w.kind = "foot";
    w.standoff = 0;
    for (let i = 0; i < 4000; i++) step(s, 16);
    // It either reached the wall's face or died on the way; both are fine. What
    // must never happen is walking THROUGH the building.
    for (const x of s.walkers) expect(x.x).toBeGreaterThanOrEqual(wallX());
  });

  it("a shooter never reaches the wall - which is why only reach answers it", () => {
    const s = newRun("normal", ARENA);
    startWave(s, runRng(1));
    s.queue.length = 0;
    s.walkers.length = 0;
    s.spawnCool = 0;
    s.queue.push("shooter");
    step(s, 16);
    const sh = s.walkers[0];
    sh.hp = 1e9; // immortal, so this measures geometry and not survival
    sh.maxHp = 1e9;
    for (let i = 0; i < 6000; i++) step(s, 16);
    expect(sh.x).toBeGreaterThan(wallX() + KIND.shooter.standoff - 1);
  });

  it("never exceeds the lane's body cap", () => {
    const s = newRun("wild", ARENA);
    s.wave = 40;
    startWave(s, runRng(3));
    for (let i = 0; i < 6000; i++) {
      step(s, 16);
      expect(s.walkers.length).toBeLessThanOrEqual(WALKER_CAP);
      if (s.phase !== "wave") break;
    }
  });

  it("a long frame cannot teleport a wave in", () => {
    const s = newRun("normal", ARENA);
    startWave(s, runRng(1));
    step(s, 100_000);
    expect(s.walkers.length).toBeLessThanOrEqual(2);
  });
});

describe("the building", () => {
  it("takes wall damage before house damage", () => {
    const s = newRun("normal", ARENA);
    startWave(s, runRng(1));
    const wall = s.wall;
    const house = s.house;
    s.queue.length = 0;
    s.walkers.length = 0;
    s.spawnCool = 0;
    s.queue.push("foot");
    step(s, 16);
    const w = s.walkers[0];
    w.x = wallX();
    w.cool = 0;
    w.hp = 1e9;
    step(s, 16);
    expect(s.wall).toBeLessThan(wall);
    expect(s.house).toBe(house);
  });

  it("and the house only once the wall is gone", () => {
    const s = newRun("normal", ARENA);
    startWave(s, runRng(1));
    s.wall = 0;
    const house = s.house;
    s.queue.length = 0;
    s.walkers.length = 0;
    s.spawnCool = 0;
    s.queue.push("foot");
    step(s, 16);
    const w = s.walkers[0];
    w.x = wallX();
    w.cool = 0;
    w.hp = 1e9;
    step(s, 16);
    expect(s.house).toBeLessThan(house);
  });

  it("the run is over when the house falls, and nothing happens after it", () => {
    const s = newRun("normal", ARENA);
    startWave(s, runRng(1));
    s.wall = 0;
    s.house = 1;
    s.queue.length = 0;
    s.walkers.length = 0;
    s.spawnCool = 0;
    s.queue.push("vehicle");
    step(s, 16);
    const w = s.walkers[0];
    w.x = wallX();
    w.cool = 0;
    w.hp = 1e9;
    step(s, 16);
    expect(s.phase).toBe("over");
    expect(s.events.some((e) => e.t === "over")).toBe(true);
    const frozen = JSON.stringify(s.walkers);
    step(s, 16);
    expect(JSON.stringify(s.walkers)).toBe(frozen);
  });
});

describe("cash", () => {
  it("is paid for a kill, and the score is the cash EARNED not the cash held", () => {
    const s = newRun("normal", ARENA);
    startWave(s, runRng(1));
    s.queue.length = 0;
    s.walkers.length = 0;
    s.spawnCool = 0;
    s.queue.push("foot");
    step(s, 16);
    const w = s.walkers[0];
    w.hp = 1;
    const cash = s.cash;
    const score = s.score;
    fire(s, w.x, w.y);
    for (let i = 0; i < 200; i++) step(s, 16);
    expect(s.cash).toBeGreaterThan(cash);
    expect(s.score).toBeGreaterThan(score);
    expect(s.earned).toBe(s.score);
  });

  it("so spending never costs a player their place on the board", () => {
    const s = newRun("normal", ARENA);
    s.cash = 1e6;
    s.earned = 1e6;
    s.score = 1e6;
    const score = s.score;
    buy(s, "damage");
    expect(s.cash).toBeLessThan(1e6);
    expect(s.score).toBe(score);
  });

  it("never reaches the wallet - there is no coin field on a run", () => {
    // The whole currency law in one assertion. `ctx.rewards` is add-only so that
    // no game can take a child's coins; this currency lives and dies in the run,
    // and the day something adds a conversion this reads as the wrong shape.
    const s = newRun("normal", ARENA);
    const keys = Object.keys(s);
    for (const banned of ["coins", "stars", "wallet", "profile"]) {
      expect(keys, `a run must not carry ${banned}`).not.toContain(banned);
    }
  });

  it("a cleared wave pays a bonus, so barely surviving is still worth something", () => {
    const s = newRun("normal", ARENA);
    startWave(s, runRng(1));
    const bonus = clearBonus(s);
    s.queue.length = 0;
    s.walkers.length = 0;
    step(s, 16);
    expect(s.phase).toBe("shop");
    expect(s.events.some((e) => e.t === "waveClear")).toBe(true);
    expect(s.cash).toBeGreaterThanOrEqual(bonus);
  });
});

describe("clearing a wave", () => {
  it("needs BOTH an empty queue and an empty lane", () => {
    const s = newRun("normal", ARENA);
    startWave(s, runRng(1));
    s.queue.length = 0;
    s.spawnCool = 0;
    s.walkers.length = 0;
    s.queue.push("foot");
    step(s, 16);
    expect(s.walkers.length).toBe(1);
    expect(s.phase).toBe("wave"); // an empty queue with a body still up is a lull
  });

  it("advances the wave and goes back to the shop", () => {
    const s = newRun("normal", ARENA);
    startWave(s, runRng(1));
    s.queue.length = 0;
    s.walkers.length = 0;
    step(s, 16);
    expect(s.wave).toBe(2);
    expect(s.phase).toBe("shop");
  });

  it("and nothing is bought while a wave is walking", () => {
    const s = newRun("normal", ARENA);
    s.cash = 1e6;
    startWave(s, runRng(1));
    expect(buy(s, "damage")).toBeNull();
  });
});

describe("the campaign is won at wave 20 and then keeps going", () => {
  /** Skip to the shop before `wave`, with the state a player would plausibly hold. */
  function at(wave: number): RunState {
    const s = newRun("normal", ARENA);
    s.wave = wave;
    s.phase = "shop";
    return s;
  }

  it("clearing wave 20 latches the win and fires it once", () => {
    const s = at(CAMPAIGN_WAVES);
    startWave(s, runRng(1));
    s.queue.length = 0;
    s.walkers.length = 0;
    step(s, 16);
    expect(s.wonAt).toBe(CAMPAIGN_WAVES);
    expect(s.events.filter((e) => e.t === "won")).toHaveLength(1);
  });

  it("but the run does not stop - overtime is a phase the player keeps playing", () => {
    const s = at(CAMPAIGN_WAVES);
    startWave(s, runRng(1));
    s.queue.length = 0;
    s.walkers.length = 0;
    step(s, 16);
    expect(s.phase).toBe("shop");
    expect(s.wave).toBe(CAMPAIGN_WAVES + 1);
    expect(inCampaign(s)).toBe(false);
  });

  it("and the win never fires twice, however many waves follow", () => {
    // The reward latch. Without it, overtime pays `level_complete` every wave.
    const s = at(CAMPAIGN_WAVES);
    let wins = 0;
    for (let n = 0; n < 4; n++) {
      startWave(s, runRng(n + 1));
      s.queue.length = 0;
      s.walkers.length = 0;
      step(s, 16);
      wins += s.events.filter((e) => e.t === "won").length;
    }
    expect(wins).toBe(1);
  });
});

describe("a campaign is losable AND winnable - the property the shop exists for", () => {
  // The plan's first tuning trap: if any purchase order survives wave 20 the
  // shop is decoration, and if none does the game is unwinnable. Both arms have
  // to be real, so both are played headlessly here. These are the SHAPE of the
  // check rather than tuned targets - the numbers will move, and when they do
  // this is the instrument that says which direction.

  /** Buys nothing, ever, and aims at the nearest body. */
  function careless(level: "calm" | "normal" | "wild") {
    const s = newRun(level, ARENA);
    while (!isOver(s) && s.wave <= CAMPAIGN_WAVES) {
      startWave(s, runRng(s.wave));
      playWave(s, aimNearest(s));
      if (isOver(s)) break;
    }
    return s;
  }

  /**
   * Buys the counter for what is coming, in priority order, spending down each
   * shop visit rather than one item per wave.
   *
   * THE ORDER IS THE POINT, and it is the plan's forecast read as a shopping
   * plan: the counter for a threat is taken on the visit BEFORE the threat's
   * band opens. The first version of this bot tried a flat list from the top
   * every visit, so it bought `damage` until the cap and never reached a guard
   * at all - it reached wave 6 having bought two distinct things, and the block
   * below was comparing two bots that both effectively bought nothing.
   */
  function careful(level: "calm" | "normal" | "wild", sloppy = false) {
    const s = newRun(level, ARENA);
    // Each entry is tried once per visit, so one visit can fill several slots.
    const wants: ShopId[] = [
      "rifleman", "rocketeer", "marksman", "aa", // the counters, first
      "launcher", "rifle", "shotgun", "repeater", // then the best gun affordable
      "damage", "magazine", "reload", "pierce", // then the multipliers
      "wall", "mine", "wire", // then the lane
    ];
    while (!isOver(s) && s.wave <= CAMPAIGN_WAVES) {
      // Repair first when the wall is hurting - a dead house scores nothing.
      while (s.wall < s.wallMax * 0.7 && canBuy(s, "repair")) buy(s, "repair");
      // Then spend down, in priority order, as long as anything is affordable.
      let spent = true;
      while (spent) {
        spent = false;
        for (const id of wants) {
          if (canBuy(s, id) && buy(s, id)) {
            spent = true;
            break;
          }
        }
      }
      startWave(s, runRng(s.wave));
      playWave(s, sloppy ? aimSloppy(s) : aimNearest(s));
      if (isOver(s)) break;
    }
    return s;
  }

  it("a player who buys nothing does NOT reach wave 20 on normal", () => {
    const s = careless("normal");
    expect(s.phase).toBe("over");
    expect(s.wonAt).toBe(0);
    expect(s.wave).toBeLessThan(CAMPAIGN_WAVES);
  });

  it("and does not on wild either", () => {
    expect(careless("wild").wonAt).toBe(0);
  });

  it("a player who buys the counters gets FURTHER than one who buys nothing", () => {
    // The weakest honest form of "the shop matters", and the one that survives
    // retuning. A stronger claim (the careful bot WINS) is what slice 5 tunes
    // toward; asserting it today would red the build on every balance change.
    expect(careful("normal").wave).toBeGreaterThan(careless("normal").wave);
  });

  it("buying the counters banks a bigger score than buying nothing", () => {
    expect(careful("normal").score).toBeGreaterThan(careless("normal").score);
  });

  it("calm is kinder than wild for the same bot", () => {
    expect(careful("calm").wave).toBeGreaterThanOrEqual(careful("wild").wave);
  });

  it("the careful bot really did buy things - or this whole block measures nothing", () => {
    // The population guard. Two bots that both buy nothing would satisfy every
    // comparison above by arithmetic rather than by play.
    //
    // It failed on the first run at exactly 2, which is what surfaced the bot
    // rather than the game: a flat priority list tried from the top every visit
    // bought `damage` to its cap and never reached a guard.
    const s = careful("normal");
    expect(Object.keys(s.bought).length).toBeGreaterThan(2);
  });

  it("a sloppy player gets LESS far than a frame-perfect one, same purchases", () => {
    // The bracket, not a target. `aimNearest` is a player no thumb can be, so
    // its reach is an upper bound and this is the lower one. What the pair says
    // is that AIM matters at all - if these two landed on the same wave, the
    // shop would be the only thing in the game and the shooting would be decor.
    expect(careful("normal", true).wave).toBeLessThan(careful("normal", false).wave);
  });

  it("and the sloppy player still gets further than one who buys nothing", () => {
    // Which is the honest form of "the shop carries a weak player". If this
    // failed, buying would only pay off for someone who already aims well.
    expect(careful("normal", true).wave).toBeGreaterThan(careless("normal").wave);
  });
});
