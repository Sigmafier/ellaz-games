import { describe, expect, it } from "vitest";
import { HALO, trailLayout } from "./trail";
import type { Box, TrailLayout } from "./trail";

const PC: Box = { width: 1536, height: 639 };
const PHONE: Box = { width: 390, height: 844 };
/** other real shapes, so a pass is not a fact about two numbers */
const MORE: Box[] = [
  { width: 1920, height: 1080 }, { width: 1024, height: 600 }, { width: 1280, height: 547 },
  { width: 360, height: 640 }, { width: 412, height: 915 }, { width: 375, height: 667 },
];
const NEON = [4, 4, 4];

/** every node's whole drawing - stars above, shadow below, glow either side - inside the playable rectangle */
function outside(t: TrailLayout): string[] {
  const bad: string[] = [];
  t.points.forEach((p, i) => {
    const l = p.x - p.r * HALO.side, r = p.x + p.r * HALO.side;
    const top = p.y - p.r * HALO.up, bot = p.y + p.r * HALO.down;
    if (l < t.insets.side || r > t.width - t.insets.side) bad.push(`node ${i} x ${l.toFixed(0)}..${r.toFixed(0)} of ${t.width}`);
    if (top < t.insets.top || bot > t.height - t.insets.bottom) bad.push(`node ${i} y ${top.toFixed(0)}..${bot.toFixed(0)} of ${t.height}`);
    if (p.y - p.r * HALO.hero < 0) bad.push(`node ${i} hero off the top`);
  });
  return bad;
}

function crowded(t: TrailLayout): string[] {
  const bad: string[] = [];
  for (let i = 1; i < t.points.length; i++) {
    const a = t.points[i - 1], b = t.points[i];
    const d = Math.hypot(a.x - b.x, a.y - b.y);
    if (d < a.r + b.r + 8) bad.push(`nodes ${i - 1} and ${i} are ${d.toFixed(0)}px apart`);
  }
  return bad;
}

describe("the trail on a PC is landscape and fits the box with no scroll", () => {
  const t = trailLayout(NEON, PC);

  it("is landscape, as wide as the box, and places all twelve nodes", () => {
    expect(t.orientation).toBe("landscape");
    expect(t.points).toHaveLength(12);
    expect(t.width).toBe(PC.width);
    expect(t.height).toBe(PC.height);
  });

  it("keeps every node inside the box at 1536x639, clear of the HUD and the dock", () => {
    expect(outside(t)).toEqual([]);
    expect(crowded(t)).toEqual([]);
  });

  it("walks left to right and makes the last node of each world its boss", () => {
    for (let i = 1; i < t.points.length; i++) expect(t.points[i].x).toBeGreaterThan(t.points[i - 1].x);
    expect(t.points.map((p) => p.boss)).toEqual([false, false, false, true, false, false, false, true, false, false, false, true]);
    expect(t.points.map((p) => p.world)).toEqual([0, 0, 0, 0, 1, 1, 1, 1, 2, 2, 2, 2]);
  });

  it("gives each world a band of the floor, covering the width with no gap", () => {
    expect(t.bands.map((b) => b.world)).toEqual([0, 1, 2]);
    expect(t.bands[0].x).toBe(0);
    expect(t.bands[1].x).toBeCloseTo(t.bands[0].x + t.bands[0].width, 6);
    expect(t.bands[2].x + t.bands[2].width).toBeCloseTo(t.width, 6);
    t.points.forEach((p) => {
      const b = t.bands[p.world];
      expect(p.x).toBeGreaterThanOrEqual(b.x);
      expect(p.x).toBeLessThanOrEqual(b.x + b.width);
    });
  });

  it("scrolls sideways once a campaign is too long for the screen, and still fits every node", () => {
    const long = trailLayout([4, 4, 4, 4, 4, 4, 4, 4], { width: 1024, height: 600 });
    expect(long.width).toBeGreaterThan(1024);
    expect(outside(long)).toEqual([]);
    expect(crowded(long)).toEqual([]);
    expect(long.scrollFor(31).left).toBe(long.width - 1024);
    expect(long.scrollFor(0).left).toBe(0);
  });
});

describe("the trail on a phone is portrait, climbs upward, and scrolls", () => {
  const t = trailLayout(NEON, PHONE);

  it("is portrait, as wide as the box, and at least as tall", () => {
    expect(t.orientation).toBe("portrait");
    expect(t.width).toBe(PHONE.width);
    expect(t.height).toBeGreaterThanOrEqual(PHONE.height);
  });

  it("keeps every node inside the scrolling box at 390x844", () => {
    expect(outside(t)).toEqual([]);
    expect(crowded(t)).toEqual([]);
  });

  it("starts at the bottom: world one below world two below world three", () => {
    for (let i = 1; i < t.points.length; i++) expect(t.points[i].y).toBeLessThan(t.points[i - 1].y);
    expect(t.bands[0].y).toBeGreaterThan(t.bands[1].y);
    expect(t.bands[1].y).toBeGreaterThan(t.bands[2].y);
  });

  it("scrolls any node into the window, clear of the HUD and the dock", () => {
    t.points.forEach((p, i) => {
      const top = t.scrollFor(i).top;
      expect(top).toBeGreaterThanOrEqual(0);
      expect(top).toBeLessThanOrEqual(t.height - PHONE.height);
      expect(p.y - top - p.r * HALO.up, `node ${i}`).toBeGreaterThanOrEqual(t.insets.top);
      expect(p.y - top + p.r * HALO.down, `node ${i}`).toBeLessThanOrEqual(PHONE.height - t.insets.bottom);
    });
  });
});

describe("every node fits on other real screens too", () => {
  it.each(MORE.map((b) => [`${b.width}x${b.height}`, b] as const))("%s", (_n, box) => {
    for (const worlds of [[4], [4, 4, 4], [5, 5, 5, 5, 5]]) {
      const t = trailLayout(worlds, box);
      expect(outside(t), `${worlds.join("+")}`).toEqual([]);
      expect(crowded(t), `${worlds.join("+")}`).toEqual([]);
    }
  });

  it("refuses a box with no size and a world with no levels", () => {
    expect(() => trailLayout(NEON, { width: 0, height: 600 })).toThrow();
    expect(() => trailLayout([4, 0], PC)).toThrow();
  });
});
