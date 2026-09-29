// WHAT EACH WORLD DRAWS, read back off a recording pen - the arena itself needs a
// browser, but every call `groundArt.ts` makes goes through `Pen`, so the colours a
// floor paints and the shapes a twist lays down can be asserted here.
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { WORLD_INK, drawCoins, drawDark, drawPools, drawWeather, drawWorldGround, tintFor, type Pen } from "./groundArt";
import type { Enemy, Pool, RunState } from "./types";
import { POOL } from "./twists";

function recorder() {
  const fills: number[] = [];
  const lines: number[] = [];
  const calls: string[] = [];
  const pen: Pen = {
    fillStyle: (c) => void fills.push(c),
    lineStyle: (_w, c) => void lines.push(c),
    fillRect: () => void calls.push("rect"),
    fillCircle: () => void calls.push("circle"),
    fillEllipse: () => void calls.push("ellipse"),
    fillTriangle: () => void calls.push("tri"),
    lineBetween: () => void calls.push("line"),
    strokeCircle: () => void calls.push("ring"),
    fillGradientStyle: (a, b, c, d) => void fills.push(a, b, c, d),
  };
  return { pen, fills, lines, calls };
}

describe("each world lays its own floor", () => {
  const floor = (world: "city" | "frost" | "lava") => {
    const r = recorder();
    drawWorldGround(r.pen, world, 1944, 1092, 42);
    return r;
  };

  it("paints its own ground and walls, and not another world's", () => {
    for (const world of ["city", "frost", "lava"] as const) {
      const r = floor(world);
      expect(r.fills, `${world} did not paint its ground`).toContain(WORLD_INK[world].ground);
      expect(r.fills, `${world} did not paint its walls`).toContain(WORLD_INK[world].wall);
      for (const other of ["city", "frost", "lava"] as const) {
        if (other === world) continue;
        expect(r.fills, `${world} painted ${other}'s ground`).not.toContain(WORLD_INK[other].ground);
      }
    }
  });

  it("the city's grid glows, frost's floor is scratched ice, lava's is cracked with fire", () => {
    expect(floor("city").lines).toContain(WORLD_INK.city.neonA);
    expect(floor("frost").lines).toContain(WORLD_INK.frost.neonA);
    expect(floor("lava").lines).toContain(WORLD_INK.lava.neonB);
  });

  it("is the same picture every time for the same level", () => {
    expect(floor("lava").calls).toEqual(floor("lava").calls);
  });
});

describe("the twists are drawn as what they are", () => {
  const pool = (over: Partial<Pool>): Pool => ({ id: 1, x: 100, y: 100, r: POOL.r, warn: 0, live: 3000, ...over });

  it("a WARNING pool is a dashed ring and a small growing heart, never the molten pool", () => {
    const warn = recorder();
    drawPools(warn.pen, [pool({ warn: 700 })], 0);
    expect(warn.lines).toContain(0xffb347);
    expect(warn.fills).not.toContain(0x3a0a05);
    const live = recorder();
    drawPools(live.pen, [pool({})], 0);
    expect(live.fills).toContain(0x3a0a05);
    expect(live.lines).not.toContain(0xffb347);
  });

  it("the dark draws eyes for the shapes hidden in it, and only for them", () => {
    const e = (id: number, x: number): Enemy => ({ id, kind: "runner", x, y: 0, hp: 1, flash: 0 });
    const s = { career: { dark: [{ x: 0, y: 0, r: 60 }] }, enemies: [e(1, 0), e(2, 300)] } as unknown as RunState;
    const r = recorder();
    drawDark(r.pen, s, (x) => Math.abs(x) < 60, 0);
    // Two eyes, each a glow and a pupil, for the ONE hidden shape.
    expect(r.fills.filter((c) => c === 0xffe14d)).toHaveLength(2);
    const none = recorder();
    drawDark(none.pen, { career: { dark: [] }, enemies: [e(1, 0)] } as unknown as RunState, () => true, 0);
    expect(none.calls).toEqual([]);
  });

  it("snow falls on frost, embers rise on lava, and the city's air is clear", () => {
    const at = (world: "city" | "frost" | "lava") => {
      const r = recorder();
      drawWeather(r.pen, world, 648, 364, 1234);
      return r;
    };
    expect(at("city").calls).toEqual([]);
    expect(at("frost").fills).toContain(0xffffff);
    expect(at("lava").fills).toContain(0xff7b00);
    expect(at("frost").calls.length).toBeGreaterThan(30);
  });

  it("gold on the floor is gold", () => {
    const r = recorder();
    drawCoins(r.pen, [{ id: 1, x: 0, y: 0, value: 3 }], 0);
    expect(r.fills).toContain(0xffc21a);
  });

  it("frost and lava tint their crowd; the city keeps the cast's neon; a shooter keeps its own ink", () => {
    expect(tintFor("city", "runner")).toBeNull();
    expect(tintFor("frost", "runner")).not.toBeNull();
    expect(tintFor("lava", "brute")).not.toBeNull();
    expect(tintFor("lava", "spitter")).toBeNull();
    expect(tintFor("frost", "spitter")).toBeNull();
  });
});

// The scene cannot be driven here (nothing in this repo can drive Phaser), so the
// cheap half that CAN run every time: the calls are still made.
describe("the scene still calls the drawing", () => {
  const scene = readFileSync(new URL("./SurvivorsScene.ts", import.meta.url), "utf8");
  it("a career run's floor is its world's, and the twists are drawn every frame", () => {
    expect(scene).toContain("drawWorldGround(g, c.world, w, h, c.seed)");
    expect(scene).toMatch(/this\.drawCareer\(\);/);
    for (const call of ["drawPools(this.low", "drawCoins(this.low", "drawDark(this.high", "drawWeather(this.weather"]) expect(scene).toContain(call);
  });
  it("a career level reports no score, so the quick run's boards are never written by it", () => {
    const body = scene.slice(scene.indexOf("private finishCareer("), scene.indexOf("private drawCareer("));
    expect(body.length).toBeGreaterThan(100);
    expect(body).not.toMatch(/score/);
    expect(body).toContain("this.onCareerEnd?.(careerResult(this.run), this.careerToken)");
  });
});
