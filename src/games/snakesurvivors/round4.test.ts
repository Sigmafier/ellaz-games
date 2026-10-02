import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { mulberry32 } from "@shared/rng";
import { SHIPPED_LOCALES } from "@i18n/locales";
import { MAX_LEN, findLoop, findTailLoop, insideNow, maxLenOf, pendingLoop, snapHint } from "./body";
import {
  CAPS, CARD_IDS, HOLE, LONG_STEP, NOVA_EVERY, SNAP, TIER, TIER_ODDS, cardOffer, noneTaken, offerCards, tierFor,
} from "./cards";
import { KINDS, LEVELS, STAGE_CROWD, STAGE_TRIGGER, biteCost, makeFoe, spawnEvery, stageGoal } from "./crowd";
import { BANNER_AT, BONUS_AT, BONUS_GEM, crushFx } from "./crushFx";
import { KIND_INK, guideArc } from "./draw";
import { FX_TEXT } from "./fxText";
import { hitsLeft, needFor, newRun, step } from "./logic";
import { ringRun } from "./testRing";
import type { CardId, Foe, Kind, Run, Tier } from "./types";

/**
 * Round four, second pass (operator, 2026-09-29): "it should be longer,
 * harder, more enemies, more powers, including rare powers that appear less
 * commonly, the closing loop circle is not good enough." One situation per
 * cell, set up by hand; the whole-run numbers are in `pacing.test.ts`.
 */

const STILL = { dx: 0, dy: 0 };
const fixed = () => 0.5;

let nextId = 20_000;
function foe(kind: Kind, x: number, y: number): Foe {
  return { id: nextId++, kind, x, y, hp: KINDS[kind].hp, hurt: 0, stun: 0, spikeCool: 0, dash: 0, dashCool: 0, windup: 0, slow: 0 };
}

function quiet(run: Run): Run {
  run.spawnIn = 1e12;
  run.floorIn = 1e12;
  run.foes = [];
  run.gems = [];
  run.mini = 3; // no mini-boss wanders into a hand-set cell
  return run;
}

/** A body curled `laps` of the way round a circle of radius 60 at (600, 800), head at its angle 0. */
const curl = (laps: number) => quiet(ringRun(600, 800, 60, laps * 2 * Math.PI));
const gapOf = (run: Run) => {
  const t = run.path[run.path.length - 1];
  return Math.hypot(t.x - run.x, t.y - run.y);
};

describe("the loop closes from three quarters of a lap", () => {
  it("a body curled three quarters round closes, with the head still far past the snap reach", () => {
    const run = curl(0.78);
    expect(gapOf(run)).toBeGreaterThan(SNAP + 20);
    expect(findLoop(run)).not.toBeNull();
  });

  it("two thirds of a lap does not - the rest is the player's to draw", () => {
    const run = curl(0.67);
    expect(gapOf(run)).toBeGreaterThan(SNAP);
    expect(findLoop(run)).toBeNull();
  });

  it("the guide shows from half a lap round, and not before", () => {
    expect(snapHint(curl(0.55))).not.toBeNull();
    expect(snapHint(curl(0.4))).toBeNull();
  });

  it("the guide's ring sits on the point the loop will close on", () => {
    const run = curl(0.8);
    const at = snapHint(run)!;
    const loop = findLoop(run)!;
    expect(loop[loop.length - 1]).toEqual(at);
  });

  it("the tightest spin still never closes one, at full Lasso, full Swift and full Long Body", () => {
    const run = quiet(newRun("normal", { w: 420, h: 560 }, fixed));
    run.taken.lasso = CAPS.lasso;
    run.taken.swift = CAPS.swift;
    run.taken.longBody = CAPS.longBody;
    run.calmMs = 0;
    for (let t = 0; t < 12_000; t += 16) {
      run.len = maxLenOf(run);
      step(run, 16, { dx: Math.cos(run.heading + 1.2), dy: Math.sin(run.heading + 1.2) }, fixed);
      expect(findLoop(run), `t ${t}`).toBeNull();
    }
  });
});

describe("N inside", () => {
  it("counts exactly the shapes the loop would catch if it snapped now", () => {
    const run = curl(0.55);
    const inIt = [foe("runner", 600, 790), foe("orb", 620, 780), foe("brute", 580, 770)];
    const out = [foe("runner", 600, 850), foe("runner", 900, 800)];
    run.foes = [...inIt, ...out];
    expect(pendingLoop(run)).not.toBeNull();
    expect(insideNow(run).map((f) => f.id).sort()).toEqual(inIt.map((f) => f.id).sort());
  });

  it("is what the crush then catches: the marks tell the truth", () => {
    const run = curl(0.78);
    run.foes = [foe("runner", 600, 790), foe("runner", 620, 780), foe("runner", 580, 770), foe("runner", 640, 900)];
    const marked = insideNow(run).length;
    step(run, 16, STILL, fixed);
    expect(marked).toBe(3);
    expect(run.crushed).toBe(marked);
  });

  it("is nothing while no loop is being drawn", () => {
    const run = quiet(newRun("normal", { w: 420, h: 560 }, fixed));
    run.foes = [foe("runner", run.x - 30, run.y)];
    expect(insideNow(run)).toEqual([]);
  });
});

describe("the guide arc", () => {
  it("leaves the head along its heading and lands on the snap point", () => {
    const head = { x: 0, y: 0 };
    const at = { x: 40, y: 60 };
    const arc = guideArc(head, 0, at);
    expect(arc[0].x).toBeCloseTo(0, 6);
    expect(arc[0].y).toBeCloseTo(0, 6);
    expect(arc[arc.length - 1].x).toBeCloseTo(40, 6);
    expect(arc[arc.length - 1].y).toBeCloseTo(60, 6);
    // The first step goes the way the head faces (right), not backwards.
    expect(arc[1].x).toBeGreaterThan(0);
  });

  it("bends the way the target lies, on either side", () => {
    const up = guideArc({ x: 0, y: 0 }, 0, { x: 30, y: -50 });
    expect(up[Math.floor(up.length / 2)].y).toBeLessThan(0);
    const down = guideArc({ x: 0, y: 0 }, 0, { x: 30, y: 50 });
    expect(down[Math.floor(down.length / 2)].y).toBeGreaterThan(0);
  });
});

describe("a crush HITS - which effect, decided in pure code", () => {
  it("one shape: a flash and a ring, no banner, no bonus", () => {
    const fx = crushFx(1, false);
    expect(fx.banner).toBeNull();
    expect(fx.bonusGem).toBe(false);
    expect(fx.flashMs).toBeGreaterThan(0);
    expect(fx.ringReach).toBeGreaterThan(1);
  });

  it("two or more: the CRUSH xN banner; four or more: a bonus gem", () => {
    expect(BANNER_AT).toBe(2);
    expect(BONUS_AT).toBe(4);
    expect(crushFx(2, false).banner).toBe(2);
    expect(crushFx(3, false).bonusGem).toBe(false);
    expect(crushFx(4, false).bonusGem).toBe(true);
    expect(crushFx(9, false).banner).toBe(9);
  });

  it("a bigger crush shakes harder - and reduced motion never shakes", () => {
    expect(crushFx(6, false).shake!.amount).toBeGreaterThan(crushFx(1, false).shake!.amount);
    for (const n of [1, 4, 12]) expect(crushFx(n, true).shake).toBeNull();
  });

  it("a real loop that catches four drops one yellow bonus gem at its middle; three drop none", () => {
    for (const n of [3, 4]) {
      const run = curl(1.05);
      run.foes = Array.from({ length: n }, (_, i) => foe("runner", 590 + i * 8, 795));
      step(run, 16, STILL, fixed);
      const crush = run.events.find((e) => e.k === "crush");
      expect(crush, `n ${n}`).toMatchObject({ n, bonus: n >= 4 });
      const bonus = run.gems.filter((g) => g.v === BONUS_GEM && Math.hypot(g.x - 600, g.y - 800) < 30);
      expect(bonus.length, `n ${n}`).toBe(n >= 4 ? 1 : 0);
    }
  });

  it("the crush reports every shape it caught and what it was, so each bursts in its own colour", () => {
    const run = curl(1.05);
    run.foes = [foe("runner", 600, 790), foe("orb", 610, 800), foe("brute", 590, 805)];
    step(run, 16, STILL, fixed);
    const crush = run.events.find((e) => e.k === "crush");
    expect(crush && crush.k === "crush" && crush.caught.map((c) => c.kind).sort()).toEqual(["brute", "orb", "runner"]);
    // Three different colours, none of them white.
    const inks = new Set(Object.values(KIND_INK));
    expect(inks.has(0xffffff)).toBe(false);
    expect(new Set([KIND_INK.runner, KIND_INK.orb, KIND_INK.brute]).size).toBe(3);
  });
});

describe("sixteen cards in three tiers", () => {
  it("nine grey, four blue, three gold", () => {
    const count = (t: Tier) => CARD_IDS.filter((id) => TIER[id] === t).length;
    expect(CARD_IDS).toHaveLength(16);
    expect([count("common"), count("rare"), count("epic")]).toEqual([9, 4, 3]);
    for (const id of CARD_IDS) if (TIER[id] === "epic") expect(CAPS[id], id).toBe(1);
  });

  // 2026-10-01, "Rare, with a promise": a FRESH run's slot rolls 1% gold and
  // 1 in 8 blue (was 1 in 12 and 1 in 4); gold then rises with every dry offer,
  // which `gold-is-rare-with-a-promise.test.ts` pins.
  it("a fresh run's slot rolls 1 in 100 gold and 1 in 8 blue", () => {
    expect(TIER_ODDS.epic).toBeCloseTo(1 / 100, 9);
    expect(TIER_ODDS.rare).toBeCloseTo(1 / 8, 9);
    const rng = mulberry32(7);
    const seen: Record<Tier, number> = { common: 0, rare: 0, epic: 0 };
    const N = 4000;
    for (let i = 0; i < N; i++) for (const id of offerCards({ taken: noneTaken() }, rng)) seen[TIER[id]]++;
    const total = seen.common + seen.rare + seen.epic;
    expect(total).toBe(3 * N);
    expect(seen.epic / total).toBeGreaterThan(0.006);
    expect(seen.epic / total).toBeLessThan(0.014);
    expect(seen.rare / total).toBeGreaterThan(0.11);
    expect(seen.rare / total).toBeLessThan(0.14);
  });

  it("the roll's boundaries are where the odds say", () => {
    expect(tierFor(0)).toBe("epic");
    expect(tierFor(1 / 100 - 1e-9)).toBe("epic");
    expect(tierFor(1 / 100)).toBe("rare");
    expect(tierFor(1 / 100 + 1 / 8 - 1e-9)).toBe("rare");
    expect(tierFor(1 / 100 + 1 / 8)).toBe("common");
  });

  it("never offers a card twice in one offer, and never one at its cap", () => {
    const rng = mulberry32(3);
    const taken = { ...noneTaken(), nova: 1, fangs: CAPS.fangs };
    for (let i = 0; i < 2000; i++) {
      const o = offerCards({ taken }, rng);
      expect(new Set(o).size).toBe(o.length);
      expect(o).not.toContain("nova");
      expect(o).not.toContain("fangs");
    }
  });

  it("falls back a tier when one is empty: with only gold left, it still offers gold", () => {
    const taken = noneTaken();
    for (const id of CARD_IDS) if (TIER[id] !== "epic") taken[id] = CAPS[id];
    const o = offerCards({ taken }, mulberry32(1));
    expect([...o].sort()).toEqual(["blackHole", "nova", "twinHead"]);
  });

  it("a seeded run replays its offers exactly", () => {
    const a = mulberry32(99);
    const b = mulberry32(99);
    for (let i = 0; i < 50; i++) expect(offerCards({ taken: noneTaken() }, a)).toEqual(offerCards({ taken: noneTaken() }, b));
  });

  it("the offer says the card's tier", () => {
    expect(cardOffer(noneTaken(), "nova").tier).toBe("epic");
    expect(cardOffer(noneTaken(), "chain").tier).toBe("rare");
    expect(cardOffer(noneTaken(), "magnet").tier).toBe("common");
  });
});

describe("the new powers do what their cards say", () => {
  const withCard = (id: CardId, laps = 1.05) => {
    const run = curl(laps);
    run.taken[id] = 1;
    return run;
  };

  it("Chain Crush zaps the 2 nearest shapes OUTSIDE the loop, and never the warden", () => {
    const run = withCard("chain");
    const warden = foe("warden", 700, 800);
    const near1 = foe("runner", 700, 830);
    const near2 = foe("runner", 710, 760);
    const far = foe("runner", 780, 700);
    run.foes = [foe("runner", 600, 800), warden, near1, near2, far];
    step(run, 16, STILL, fixed);
    expect(run.events.filter((e) => e.k === "zap")).toHaveLength(2);
    expect(run.foes).not.toContain(near1);
    expect(run.foes).not.toContain(near2);
    expect(run.foes).toContain(far);
    expect(warden.hp).toBe(KINDS.warden.hp);
  });

  it("without the card, nothing outside the loop is touched", () => {
    const run = curl(1.05);
    const near = foe("runner", 700, 830);
    run.foes = [foe("runner", 600, 800), near];
    step(run, 16, STILL, fixed);
    expect(run.foes).toContain(near);
  });

  // Double Gems became GEM MERGE on 2026-10-01 (same id, forever). A gem now
  // counts exactly its value with or without the card; what the card changes
  // is how MANY gems lie about, not what they are worth.
  it("Gem Merge: a gem picked up counts its value once, with or without the card", () => {
    const one = quiet(newRun("normal", { w: 420, h: 560 }, fixed));
    const two = quiet(newRun("normal", { w: 420, h: 560 }, fixed));
    two.taken.doubleGems = 1;
    for (const r of [one, two]) r.gems = [{ x: r.x, y: r.y, v: 1 }];
    step(one, 16, STILL, fixed);
    step(two, 16, STILL, fixed);
    expect(two.xp).toBe(one.xp);
    expect(two.len).toBeCloseTo(one.len, 6);
  });

  it("Gem Merge: gems lying near each other fuse into one worth the sum, only with the card", () => {
    const pile = (r: Run) => [0, 1, 2].map((i) => ({ x: r.x + 200 + i * 20, y: r.y + 200, v: 1 }));
    const off = quiet(newRun("normal", { w: 420, h: 560 }, fixed));
    const on = quiet(newRun("normal", { w: 420, h: 560 }, fixed));
    on.taken.doubleGems = 1;
    for (const r of [off, on]) r.gems = pile(r);
    for (let i = 0; i < 80; i++) for (const r of [off, on]) (r.calmMs = 1e12), step(r, 25, STILL, fixed);
    expect(off.gems).toHaveLength(3);
    expect(on.gems).toHaveLength(1);
    expect(on.gems[0].v).toBe(3);
  });

  it("Frost Trail slows a shape that touches the body, and only one that does", () => {
    const run = quiet(newRun("normal", { w: 420, h: 560 }, fixed));
    run.calmMs = 0;
    run.taken.frost = 1;
    const touching = foe("runner", run.path[20].x, run.path[20].y + 4);
    const clear = foe("runner", run.x - 60, run.y - 200);
    run.foes = [touching, clear];
    step(run, 16, STILL, fixed);
    expect(touching.slow).toBeGreaterThan(0);
    expect(clear.slow).toBe(0);
  });

  it("Long Body lets the snake grow 20 past the old cap, per level", () => {
    const run = quiet(newRun("normal", { w: 420, h: 560 }, fixed));
    expect(maxLenOf(run)).toBe(MAX_LEN);
    run.taken.longBody = 1;
    expect(maxLenOf(run)).toBe(MAX_LEN + LONG_STEP);
    run.len = MAX_LEN;
    run.gems = [{ x: run.x, y: run.y, v: 3 }];
    step(run, 16, STILL, fixed);
    expect(run.len).toBeGreaterThan(MAX_LEN);
  });

  it("Twin Head: the TAIL closes a loop the head cannot, and only with the card", () => {
    const setUp = (card: boolean) => {
      const run = curl(1.05);
      run.loopCool = 1e12; // the head is held off: only the tail can close
      if (card) run.taken.twinHead = 1;
      run.foes = [foe("runner", 600, 800)];
      return run;
    };
    const without = setUp(false);
    expect(findTailLoop(without)).toBeNull();
    step(without, 16, STILL, fixed);
    expect(without.crushed).toBe(0);
    const withIt = setUp(true);
    expect(findTailLoop(withIt)).not.toBeNull();
    step(withIt, 16, STILL, fixed);
    expect(withIt.crushed).toBe(1);
    expect(withIt.events.find((e) => e.k === "crush")).toMatchObject({ by: "tail" });
  });

  it("Black Hole: a crush leaves a vortex that pulls shapes in, then closes", () => {
    const run = withCard("blackHole");
    run.foes = [foe("runner", 600, 800)];
    step(run, 16, STILL, fixed);
    expect(run.vortices).toHaveLength(1);
    const v = run.vortices[0];
    const drifter = foe("orb", v.x + 100, v.y);
    drifter.stun = 1e12; // it would walk at the head otherwise; this reads the pull alone
    run.foes = [drifter];
    run.loopCool = 1e12;
    for (let i = 0; i < 40; i++) step(run, 25, STILL, fixed);
    expect(Math.hypot(drifter.x - v.x, drifter.y - v.y)).toBeLessThan(100 - 30);
    for (let t = 0; t < HOLE.ms; t += 25) step(run, 25, STILL, fixed);
    expect(run.vortices).toHaveLength(0);
  });

  it("Nova: the fifth loop that catches something clears every non-boss shape in view", () => {
    const run = withCard("nova");
    run.loopsCaught = NOVA_EVERY - 1;
    const boss = foe("warden", run.x + 80, run.y - 150);
    boss.stun = 1e12;
    const outside = [foe("runner", run.x + 90, run.y + 120), foe("brute", run.x - 150, run.y - 100)];
    for (const f of outside) f.stun = 1e12;
    run.foes = [foe("runner", 600, 800), boss, ...outside];
    step(run, 16, STILL, fixed);
    expect(run.events.some((e) => e.k === "nova")).toBe(true);
    expect(run.foes).toEqual([boss]);
  });

  it("Nova waits for the fifth: the fourth does nothing extra", () => {
    const run = withCard("nova");
    run.loopsCaught = NOVA_EVERY - 2;
    const outside = foe("runner", run.x + 90, run.y + 120);
    outside.stun = 1e12;
    run.foes = [foe("runner", 600, 800), outside];
    step(run, 16, STILL, fixed);
    expect(run.events.some((e) => e.k === "nova")).toBe(false);
    expect(run.foes).toContain(outside);
  });
});

describe("the crowd: more, faster, tougher, each stage over the last", () => {
  it("stages 2 and 3 SEND faster than stage 1 - a spawn multiplier under 1 - and hold more", () => {
    expect(STAGE_CROWD[1].spawn).toBe(1);
    expect(STAGE_CROWD[2].spawn).toBeLessThan(1);
    expect(STAGE_CROWD[3].spawn).toBeLessThan(STAGE_CROWD[2].spawn);
    // Each read once the stage's crowd has finished climbing in (`RAMP_IN`).
    const at = (stage: 1 | 2 | 3) => {
      const run = newRun("normal", { w: 420, h: 560 }, fixed);
      run.stage = stage;
      run.t = 60_000;
      run.crushed = stage === 1 ? 0 : Math.round((stageGoal("normal", (stage - 1) as 1 | 2).crushed + stageGoal("normal", stage).crushed) / 2);
      return spawnEvery(run);
    };
    expect(at(2)).toBeLessThan(at(1));
    expect(at(3)).toBeLessThan(at(2));
  });

  it("each warden asks for more crushes than the last, and a level's goal scales stages 2 and 3 only", () => {
    expect(stageGoal("normal", 2).crushed).toBeGreaterThan(stageGoal("normal", 1).crushed);
    expect(stageGoal("normal", 3).crushed).toBeGreaterThan(stageGoal("normal", 2).crushed);
    for (const level of ["calm", "normal", "wild"] as const) expect(stageGoal(level, 1)).toEqual(STAGE_TRIGGER[1]);
    expect(stageGoal("calm", 3).crushed).toBeLessThan(stageGoal("wild", 3).crushed);
  });

  it("a stage-3 shape needs more loops than a stage-2 one, and wild's more than calm's", () => {
    const hpAt = (level: "calm" | "wild", stage: 1 | 2 | 3) => {
      const run = newRun(level, { w: 420, h: 560 }, fixed);
      run.stage = stage;
      if (stage > 1) run.crushed = stageGoal(level, stage).crushed - 1; // past the climb-in
      return makeFoe(run, "runner", 0, 0).hp;
    };
    expect(hpAt("calm", 1)).toBe(1);
    expect(hpAt("wild", 3)).toBeGreaterThan(hpAt("wild", 2));
    expect(hpAt("wild", 3)).toBeGreaterThan(hpAt("calm", 3));
  });

  it("on wild a bump costs more once stage 2 is under way (R4.5: not at its opening), and the hearts count it", () => {
    const run = newRun("wild", { w: 420, h: 560 }, fixed);
    expect(biteCost(run)).toBe(1);
    run.stage = 2;
    run.crushed = stageGoal("wild", 2).crushed - 1;
    expect(biteCost(run)).toBe(1 + LEVELS.wild.bite);
    // Normal's own extra bite: 0 until the 2026-10-01 hardening, 1 since (1/2/4 a bump by stage).
    expect(LEVELS.normal.bite).toBe(1);
    expect(LEVELS.wild.bite).toBeGreaterThan(LEVELS.normal.bite);
    expect(hitsLeft(40, 2)).toBeLessThan(hitsLeft(40, 1));
  });

  it("the level bar grows with the square of the level, and the first card still costs 7", () => {
    expect(needFor(1)).toBe(7);
    for (let lv = 2; lv < 15; lv++) expect(needFor(lv + 1) - needFor(lv)).toBeGreaterThan(needFor(lv) - needFor(lv - 1));
  });
});

describe("the words", () => {
  const strip = (t: string) => t.replace(/\/\*[\s\S]*?\*\//g, "").replace(/\/\/[^\n]*/g, "");
  const GAME = strip(readFileSync(new URL("./SnakeSurvivorsGame.tsx", import.meta.url), "utf8"));
  const SCENE = strip(readFileSync(new URL("./SnakeSurvivorsScene.ts", import.meta.url), "utf8"));
  const DASHES = new RegExp("[\\u2013\\u2014\\u2015]");

  it("the arena's words exist in every shipped language, with no long dashes", () => {
    for (const loc of SHIPPED_LOCALES) {
      const t = FX_TEXT[loc];
      for (const w of [t.inside(3), t.crush(4), t.bonus, t.nova]) {
        expect(w.length, loc).toBeGreaterThan(0);
        expect(DASHES.test(w), `${loc}: ${w}`).toBe(false);
      }
      expect(t.inside(3), loc).toContain("3");
      expect(t.crush(4), loc).toContain("4");
    }
  });

  it("every card has a name and a line in every language the picker speaks, with no long dashes in the file", () => {
    expect(DASHES.test(GAME)).toBe(false);
    for (const id of CARD_IDS) expect(GAME.split(`${id}: [`).length - 1, id).toBe(4);
  });

  it("the picker wears the tier as a WORD and a colour, and reads the tier off the offer", () => {
    expect(GAME).toContain("const look = TIER_LOOK[o.tier];");
    expect(GAME).toContain("{T.tier[o.tier]}");
    expect(GAME).toContain("border: `2px solid ${look.ink}`");
  });

  it("the scene plays crushFx, marks what is inside, and bursts each shape in its own colour", () => {
    expect(SCENE).toContain("crushFx(e.n, prefersReducedMotion())");
    expect(SCENE).toContain("insideNow(r, pending)");
    expect(SCENE).toContain("drawSnapGuide(g, r, r.heading, pending.at, pulse)");
    expect(SCENE).toContain("this.spray(f.x, f.y, KIND_INK[f.kind], fx.perFoe, 5, 520)");
    expect(SCENE).toMatch(/if \(fx\.shake\) this\.cameras\.main\.shake/);
  });
});
