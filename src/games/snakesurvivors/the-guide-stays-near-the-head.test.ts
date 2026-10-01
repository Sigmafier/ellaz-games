import { describe, expect, it } from "vitest";
import { guideArc } from "./draw";
import type { Pt } from "./types";

/**
 * NePo, forum post #13: "the loop guide is sometimes huge". The guide is a
 * circle tangent to the head's heading through the snap point, and its radius
 * is d^2 / (2 * side) - so a snap point almost straight BEHIND the head (side
 * near 0) asks for a circle hundreds or thousands of units across. Measured on
 * the shipped code, head (0,0) heading 0:
 *
 *   snap point (-60,-5)   arc bounding box  718 x 722
 *   snap point (-60,-1)   arc bounding box 3578 x 3568
 *
 * and the snap reach is SNAP 42 x GUIDE_REACH 2 = 84 units, so both are points
 * a player meets. The bound: no point of the guide is further from the head,
 * or from the snap point, than the two are from each other.
 */

const dist = (a: Pt, b: Pt) => Math.hypot(a.x - b.x, a.y - b.y);
const box = (arc: Pt[]) => {
  const xs = arc.map((p) => p.x);
  const ys = arc.map((p) => p.y);
  return { w: Math.max(...xs) - Math.min(...xs), h: Math.max(...ys) - Math.min(...ys) };
};

describe("the guide arc stays near the head and the snap point", () => {
  it("the two points the forum report measured fit inside the head-to-point distance", () => {
    for (const at of [{ x: -60, y: -5 }, { x: -60, y: -1 }]) {
      const head = { x: 0, y: 0 };
      const arc = guideArc(head, 0, at);
      const d = dist(head, at);
      const b = box(arc);
      expect(b.w, `${at.x},${at.y} width`).toBeLessThanOrEqual(d + 1e-6);
      expect(b.h, `${at.x},${at.y} height`).toBeLessThanOrEqual(d + 1e-6);
      expect(arc[0].x).toBeCloseTo(0, 6);
      expect(arc[0].y).toBeCloseTo(0, 6);
      expect(arc[arc.length - 1].x).toBeCloseTo(at.x, 6);
      expect(arc[arc.length - 1].y).toBeCloseTo(at.y, 6);
    }
  });

  it("never strays further than that, at any angle, distance or heading within snap reach", () => {
    let checked = 0;
    for (const heading of [0, 0.7, 2.2, -1.9, Math.PI]) {
      for (let deg = 0; deg < 360; deg += 3) {
        for (let d = 6; d <= 84; d += 6) {
          const head = { x: 200, y: 150 };
          const a = heading + (deg * Math.PI) / 180;
          const at = { x: head.x + Math.cos(a) * d, y: head.y + Math.sin(a) * d };
          const arc = guideArc(head, heading, at);
          for (const p of arc) {
            expect(dist(p, head)).toBeLessThanOrEqual(d * (1 + 1e-9) + 1e-9);
            expect(dist(p, at)).toBeLessThanOrEqual(d * (1 + 1e-9) + 1e-9);
          }
          expect(dist(arc[arc.length - 1], at)).toBeLessThan(1e-6);
          checked++;
        }
      }
    }
    // The population: 5 headings x 120 angles x 14 distances.
    expect(checked).toBe(5 * 120 * 14);
  });

  it("a snap point behind still bends toward the side it lies on", () => {
    const up = guideArc({ x: 0, y: 0 }, 0, { x: -60, y: -5 });
    expect(up[Math.floor(up.length / 2)].y).toBeLessThan(-20);
    const down = guideArc({ x: 0, y: 0 }, 0, { x: -60, y: 5 });
    expect(down[Math.floor(down.length / 2)].y).toBeGreaterThan(20);
  });

  it("does not jump as the snap point crosses from beside the head to behind it", () => {
    const head = { x: 0, y: 0 };
    const just = (deg: number) => guideArc(head, 0, { x: Math.cos((deg * Math.PI) / 180) * 70, y: Math.sin((deg * Math.PI) / 180) * 70 });
    const a = just(89.9);
    const b = just(90.1);
    for (let i = 0; i < a.length; i++) expect(dist(a[i], b[i])).toBeLessThan(0.5);
  });
});

describe("the guide arc in the ordinary cases is the arc that shipped", () => {
  // Read off the shipped guideArc (origin/main a01d96fd) at points 4, 8 and 12
  // of 16: a snap point beside the head or ahead of it keeps its exact arc.
  const PINNED: [Pt, number, Pt, [number, number][]][] = [
    [{ x: 0, y: 0 }, 0, { x: 40, y: 60 }, [[21.6876, 5.8177], [37.5519, 21.7086], [43.3333, 43.4059]]],
    [{ x: 0, y: 0 }, 0, { x: 30, y: -50 }, [[17.7579, -5.0059], [30.2867, -18.5495], [33.8971, -36.6428]]],
    [{ x: 0, y: 0 }, 0, { x: 0, y: 70 }, [[26.0101, 11.5804], [34.8083, 38.6585], [20.5725, 63.3156]]],
    [{ x: 0, y: 0 }, 0, { x: 80, y: 10 }, [[21.5391, 0.7145], [42.9834, 2.855], [64.2388, 6.4119]]],
    [{ x: 100, y: 50 }, 2.2, { x: 60, y: 120 }, [[87.8403, 67.7793], [76.7446, 86.2412], [66.751, 105.3223]]],
  ];
  it.each(PINNED)("head %o heading %d to %o", (head, heading, at, pts) => {
    const arc = guideArc(head, heading, at);
    expect(arc).toHaveLength(16);
    [4, 8, 12].forEach((i, k) => {
      expect(arc[i].x).toBeCloseTo(pts[k][0], 3);
      expect(arc[i].y).toBeCloseTo(pts[k][1], 3);
    });
  });
});
