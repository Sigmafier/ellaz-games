// SUPERS SHOWN, AND THREE EFFECTS (operator ruling 2026-10-03, "Show supers + 3
// effects"): the storm's arcs jump shape to shape and the railgun is a beam, a
// slot holding a super turns gold, a hint names the recipe one step away, a boss
// or an elite dies with a flash and a shake, and an XP bar fills with a soft ping.
//
// The scene is a Phaser class nothing here can drive, so every one of these is a
// pure function or a small class handed a recorder: what it would draw, what it
// would play, what it would shake - read back and compared.
import { describe, expect, it } from "vitest";
import { ARENA_WIDE, newRun, rngFor, step, type RunState } from "./logic";
import type { Pen } from "./groundArt";
import { SUPER_LV, RECIPE } from "./evolve";
import { RunFx, XP_BAR, type FxHost } from "./runFx";
import { drawMonsters } from "./monsterFx";
import { superHintOf, hintText } from "./superHint";
import { slotStyle, SUPER_GOLD } from "./superSlot";
import type { Bolt } from "./types";

type Call = [string, ...number[]];
function recorder(): Pen & { calls: Call[] } {
  const calls: Call[] = [];
  const rec = (name: string) => (...a: number[]) => void calls.push([name, ...a]);
  return {
    calls,
    fillStyle: rec("fillStyle"), lineStyle: rec("lineStyle"), fillRect: rec("fillRect"), fillCircle: rec("fillCircle"),
    fillEllipse: rec("fillEllipse"), fillTriangle: rec("fillTriangle"), lineBetween: rec("lineBetween"),
    strokeCircle: rec("strokeCircle"), fillGradientStyle: rec("fillGradientStyle"),
  };
}
function host(): FxHost & { log: string[] } {
  const log: string[] = [];
  return {
    log,
    shake: (ms, k) => void log.push(`shake ${ms} ${k}`),
    flash: (ms) => void log.push(`flash ${ms}`),
    tone: (o) => void log.push(`tone ${o.freq}`),
  };
}
const bolt = (kind: Bolt["kind"]): Bolt => ({ id: 1, kind, x: 100, y: 100, vx: 300, vy: 0, dmg: 1, pierce: 0, life: 500, age: 120, hit: [] });

describe("the recipe hint: shown when a weapon is ONE step from its super", () => {
  const run = () => newRun("normal", ARENA_WIDE, "arc");
  it("one level short, partner held: the hint names the level", () => {
    const s = run();
    s.slots[0].lv = SUPER_LV - 1;
    s.up[RECIPE.arc] = 1;
    expect(superHintOf(s)).toEqual({ weapon: "arc", partner: RECIPE.arc, lv: SUPER_LV, missing: "level" });
  });
  it("at the level, partner missing: the hint names the partner", () => {
    const s = run();
    s.slots[0].lv = SUPER_LV;
    expect(superHintOf(s)?.missing).toBe("partner");
  });
  it("two steps away, already a super, or ready and waiting: no hint", () => {
    const s = run();
    s.slots[0].lv = SUPER_LV - 1;
    expect(superHintOf(s)).toBeNull();
    s.slots[0].lv = SUPER_LV;
    s.up[RECIPE.arc] = 1;
    expect(superHintOf(s)).toBeNull();
    s.slots[0].evolved = true;
    expect(superHintOf(s)).toBeNull();
  });
  it("reads as the operator wrote it", () => {
    expect(hintText("Lv{n}", 4, "Spread", "Storm")).toBe("Lv4 + Spread = Storm");
  });
});

describe("a slot that holds a super turns gold", () => {
  it("gold only for a super", () => {
    expect(slotStyle(true).background).toContain(SUPER_GOLD);
    expect(JSON.stringify(slotStyle(false))).not.toContain(SUPER_GOLD);
  });
});

describe("the simulation says what the effects need", () => {
  it("an elite's death and a boss's death are marked; an ordinary one is not", () => {
    const s = newRun("normal", ARENA_WIDE);
    s.spawnIn = 1e9;
    const at = (dx: number, elite: boolean) => ({ id: s.nextId++, kind: "runner" as const, x: s.x + dx, y: s.y, hp: 0.5, flash: 0, ...(elite ? { elite: true } : {}) });
    const a = at(60, true);
    const b = at(-60, false);
    s.enemies.push(a, b);
    s.bolts.push({ ...bolt("bolt"), x: a.x, y: a.y }, { ...bolt("bolt"), id: 2, x: b.x, y: b.y });
    step(s, 16, { dx: 0, dy: 0 }, rngFor(1));
    const pops = s.events.filter((e) => e.type === "pop") as { big?: string; x: number }[];
    expect(pops.find((p) => p.x === a.x)?.big).toBe("elite");
    expect(pops.find((p) => p.x === b.x)?.big).toBeUndefined();
  });

  it("a storm's chain reports each jump, from where it hit to where it goes", () => {
    const s = newRun("normal", ARENA_WIDE, "arc");
    s.spawnIn = 1e9;
    for (const dx of [60, 110]) s.enemies.push({ id: s.nextId++, kind: "brute", x: s.x + dx, y: s.y, hp: 50, flash: 0 });
    s.bolts.push({ ...bolt("arc"), x: s.x + 60, y: s.y, chain: true, pierce: 3 });
    step(s, 16, { dx: 0, dy: 0 }, rngFor(2));
    const j = s.events.find((e) => e.type === "jump");
    expect(j).toMatchObject({ type: "jump", kind: "arc" });
    // The shape it jumps to has walked a step this frame, so near its spot, not on it.
    expect((j as { tx: number }).tx).toBeCloseTo(s.x + 110, -1);
  });
});

describe("RunFx: big deaths, the chain's arcs, the XP bar and its ping", () => {
  it("a boss death flashes and shakes harder and longer than an elite's; an ordinary death does neither", () => {
    const fx = new RunFx();
    const s = newRun("normal");
    const h = host();
    fx.consume({ type: "pop", x: 1, y: 1, kind: "runner" }, s, 0, h);
    expect(h.log).toEqual([]);
    fx.consume({ type: "pop", x: 1, y: 1, kind: "runner", big: "elite" }, s, 0, h);
    fx.consume({ type: "pop", x: 1, y: 1, kind: "warden", big: "boss" }, s, 0, h);
    const shakes = h.log.filter((l) => l.startsWith("shake")).map((l) => l.split(" ").slice(1).map(Number));
    expect(shakes).toHaveLength(2);
    expect(shakes[1][0]).toBeGreaterThan(shakes[0][0]);
    expect(shakes[1][1]).toBeGreaterThan(shakes[0][1]);
    expect(h.log.filter((l) => l.startsWith("flash"))).toHaveLength(2);
  });

  it("a storm jump is drawn as an arc between the two shapes; a bouncer's is not (its ball is the picture)", () => {
    const fx = new RunFx();
    const s = newRun("normal");
    const h = host();
    fx.consume({ type: "jump", kind: "bouncer", x: 0, y: 0, tx: 50, ty: 0 }, s, 0, h);
    let g = recorder();
    fx.draw(g, s, 0);
    expect(g.calls.filter((c) => c[0] === "lineBetween")).toHaveLength(0);
    fx.consume({ type: "jump", kind: "arc", x: 0, y: 0, tx: 50, ty: 0 }, s, 0, h);
    g = recorder();
    fx.draw(g, s, 0);
    const lines = g.calls.filter((c) => c[0] === "lineBetween");
    expect(lines.length).toBeGreaterThan(2);
    expect(lines[0][1]).toBe(0);
    expect(lines[lines.length - 1][3]).toBe(50);
    fx.tick(10_000);
    g = recorder();
    fx.draw(g, s, 0);
    expect(g.calls.filter((c) => c[0] === "lineBetween")).toHaveLength(0);
  });

  it("the RAILGUN is a beam and the STORM a crackling orb - each drawn unlike its plain weapon", () => {
    const fx = new RunFx();
    const plain = newRun("normal", ARENA_WIDE, "bolt");
    const evolved = newRun("normal", ARENA_WIDE, "bolt");
    evolved.slots[0].evolved = true;
    const draw = (s: RunState, b: Bolt) => {
      const g = recorder();
      return { drew: fx.drawShot(g, b, 0xffffff, s), calls: JSON.stringify(g.calls) };
    };
    expect(draw(plain, bolt("bolt")).drew).toBe(false);
    expect(draw(evolved, bolt("bolt")).drew).toBe(true);
    const arcRun = newRun("normal", ARENA_WIDE, "arc");
    expect(draw(arcRun, bolt("arc")).drew).toBe(false);
    arcRun.slots[0].evolved = true;
    const storm = draw(arcRun, bolt("arc"));
    expect(storm.drew).toBe(true);
    expect(storm.calls).not.toBe(draw(evolved, bolt("bolt")).calls);
  });

  it("the XP bar is as full as the run's xp, and only while a run is on", () => {
    const fx = new RunFx();
    const s = newRun("normal");
    s.xp = 3;
    s.need = 12;
    const g = recorder();
    fx.drawHud(g, s, 600, true);
    const rects = g.calls.filter((c) => c[0] === "fillRect");
    expect(rects.length).toBeGreaterThanOrEqual(2);
    const track = rects[0][3];
    const fill = rects[rects.length - 1][3];
    expect(fill / track).toBeCloseTo(0.25, 2);
    expect(rects[0][4]).toBe(XP_BAR.h);
    const off = recorder();
    fx.drawHud(off, s, 600, false);
    expect(off.calls).toHaveLength(0);
  });

  it("a gem pings softly - once per burst, not once per gem", () => {
    const fx = new RunFx();
    const s = newRun("normal");
    const h = host();
    fx.consume({ type: "gem" }, s, 1000, h);
    fx.consume({ type: "gem" }, s, 1010, h);
    fx.consume({ type: "gem" }, s, 1300, h);
    expect(h.log.filter((l) => l.startsWith("tone"))).toHaveLength(2);
  });
});

describe("the new monsters' tells", () => {
  it("a charger winding up draws the line it will dash along; a lit bomber draws its fuse", () => {
    const g = recorder();
    drawMonsters(g, [
      { id: 1, kind: "charger", x: 0, y: 0, hp: 1, flash: 0, wind: 300, dx: 1, dy: 0 },
      { id: 2, kind: "bomber", x: 50, y: 50, hp: 1, flash: 0, fuse: 500 },
      { id: 3, kind: "charger", x: 9, y: 9, hp: 1, flash: 0 },
    ], 0);
    const lines = g.calls.filter((c) => c[0] === "lineBetween");
    expect(lines.some((c) => c[1] === 0 && c[2] === 0)).toBe(true);
    expect(Math.max(...lines.filter((c) => c[2] === 0 && c[4] === 0).map((c) => c[3]))).toBeGreaterThan(100);
    expect(g.calls.some((c) => c[0] === "fillCircle" && Math.abs(c[1] - 50) < 25 && c[2] < 50)).toBe(true);
    const idle = recorder();
    drawMonsters(idle, [{ id: 3, kind: "charger", x: 9, y: 9, hp: 1, flash: 0 }], 0);
    expect(idle.calls).toHaveLength(0);
  });
});
