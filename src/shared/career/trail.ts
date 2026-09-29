// The TRAIL's geometry: where every level sits on the winding path, which band of
// floor belongs to which world, and where to scroll to show a level.
//
// Two shapes, picked by the box and nothing else (the operator's P0 lobby):
//   LANDSCAPE (a PC)  - left to right across the screen, a wave through the
//                       middle band, one screen wide until a campaign is too
//                       long for it, then it scrolls sideways.
//   PORTRAIT (a phone) - bottom to top, zig-zagging, taller than the screen and
//                       scrolled so the level you are on sits mid-screen.
//
// Every number a node DRAWS outside its circle is in HALO - the stars over a
// cleared stone, the shadow under it, the glow round the current one, the hero
// standing on it - and the layout keeps all of that inside the box, clear of the
// top bar (`insets.top`) and the dock of big buttons (`insets.bottom`). The
// component draws with the same HALO and the same insets, so the node test in
// trail.test.ts is a test of what is on screen, not of a centre point.
//
// Pure: a box in, positions out. The component measures its box from LAYOUT
// (clientWidth/clientHeight), never from a transformed rect.

export interface Box { width: number; height: number }

export interface TrailInsets { top: number; bottom: number; side: number }

/** how far a node's drawing reaches past its centre, in multiples of its radius */
export const HALO = { up: 2.1, down: 1.15, side: 1.7, hero: 4.2 } as const;

export interface TrailPoint { x: number; y: number; r: number; world: number; boss: boolean }
export interface TrailBand { world: number; x: number; y: number; width: number; height: number }

export interface TrailLayout {
  orientation: "landscape" | "portrait";
  /** the scrolling content's size: at least the box, larger along the scroll axis when the trail needs it */
  width: number;
  height: number;
  insets: TrailInsets;
  points: TrailPoint[];
  bands: TrailBand[];
  /** the scroll offset that puts node `i` as near the middle of the box as the content allows */
  scrollFor: (i: number) => { left: number; top: number };
}

/** the room the top bar and the dock hold, per shape - the component's own sizes */
export const TRAIL_INSETS = {
  landscape: { top: 116, bottom: 140, side: 24 },
  portrait: { top: 70, bottom: 130, side: 12 },
} as const;

const SIZE = { landscape: { r: 28, step: 100 }, portrait: { r: 25, step: 65 } } as const;
const BOSS = 1.4;

const clamp = (n: number, lo: number, hi: number): number => Math.max(lo, Math.min(hi, n));

/** the room above the highest node: its stars clear of the top bar, and the hero standing on it inside the box */
const headroom = (insets: TrailInsets, rb: number): number => Math.max(insets.top + HALO.up * rb, HALO.hero * rb);

function check(worlds: readonly number[], box: Box): void {
  if (!(box.width > 0) || !(box.height > 0)) throw new Error(`trailLayout needs a box with a size, got ${box.width}x${box.height}`);
  if (worlds.length === 0 || worlds.some((n) => !Number.isInteger(n) || n < 1)) throw new Error(`trailLayout needs worlds of at least one level each, got [${worlds.join(", ")}]`);
}

/** world index and boss flag for every node, in play order */
function walk(worlds: readonly number[]): { world: number; boss: boolean }[] {
  return worlds.flatMap((n, world) => Array.from({ length: n }, (_, i) => ({ world, boss: i === n - 1 })));
}

function landscape(worlds: readonly number[], box: Box): Omit<TrailLayout, "scrollFor"> {
  const insets = TRAIL_INSETS.landscape;
  const { r, step } = SIZE.landscape;
  const rb = r * BOSS;
  const nodes = walk(worlds);
  const edge = insets.side + HALO.side * rb;
  const width = Math.max(box.width, 2 * edge + (nodes.length - 1) * step);
  const yMin = headroom(insets, rb), yMax = box.height - insets.bottom - HALO.down * rb;
  const mid = (yMin + yMax) / 2, amp = Math.max(0, (yMax - yMin) / 2);
  const gap = nodes.length > 1 ? (width - 2 * edge) / (nodes.length - 1) : 0;
  const points = nodes.map((n, i) => ({
    x: nodes.length > 1 ? edge + i * gap : width / 2,
    y: mid + Math.sin(i * 1.15 + 0.4) * amp,
    r: n.boss ? rb : r, world: n.world, boss: n.boss,
  }));
  const cut = (w: number) => (lastOf(points, w).x + firstOf(points, w + 1).x) / 2;
  const bands = worlds.map((_, w) => {
    const x0 = w === 0 ? 0 : cut(w - 1), x1 = w === worlds.length - 1 ? width : cut(w);
    return { world: w, x: x0, y: 0, width: x1 - x0, height: box.height };
  });
  return { orientation: "landscape", width, height: box.height, insets, points, bands };
}

function portrait(worlds: readonly number[], box: Box): Omit<TrailLayout, "scrollFor"> {
  const insets = TRAIL_INSETS.portrait;
  const { r } = SIZE.portrait;
  const rb = r * BOSS;
  const nodes = walk(worlds);
  const gapWorld = r * 1.6;
  const crossings = worlds.length - 1;
  const ends = headroom(insets, rb) + HALO.down * rb + insets.bottom;
  const fill = nodes.length > 1 ? (box.height - ends - crossings * gapWorld) / (nodes.length - 1) : 0;
  const step = Math.max(SIZE.portrait.step, Math.min(fill, SIZE.portrait.step * 1.8));
  const height = Math.max(box.height, ends + (nodes.length - 1) * step + crossings * gapWorld);
  const ampX = box.width / 2 - insets.side - HALO.side * rb;
  let y = height - insets.bottom - HALO.down * rb;
  const points = nodes.map((n, i) => {
    if (i > 0) y -= step + (n.world !== nodes[i - 1].world ? gapWorld : 0);
    return { x: box.width / 2 - Math.sin((i * Math.PI) / 2) * ampX, y, r: n.boss ? rb : r, world: n.world, boss: n.boss };
  });
  // world one is at the BOTTOM: its band runs from the cut above it down to the end of the content
  const cut = (w: number) => (lastOf(points, w).y + firstOf(points, w + 1).y) / 2;
  const bands = worlds.map((_, w) => {
    const bottom = w === 0 ? height : cut(w - 1), top = w === worlds.length - 1 ? 0 : cut(w);
    return { world: w, x: 0, y: top, width: box.width, height: bottom - top };
  });
  return { orientation: "portrait", width: box.width, height, insets, points, bands };
}

const firstOf = (ps: TrailPoint[], w: number): TrailPoint => ps.find((p) => p.world === w)!;
const lastOf = (ps: TrailPoint[], w: number): TrailPoint => ps.filter((p) => p.world === w).slice(-1)[0];

/** the whole trail for worlds of these many levels (each world's last is its boss), in this box */
export function trailLayout(worlds: readonly number[], box: Box): TrailLayout {
  check(worlds, box);
  const t = box.width > box.height ? landscape(worlds, box) : portrait(worlds, box);
  const scrollFor = (i: number) => {
    const p = t.points[clamp(Math.round(i), 0, t.points.length - 1)];
    return {
      left: clamp(p.x - box.width / 2, 0, t.width - box.width),
      top: clamp(p.y - box.height / 2, 0, t.height - box.height),
    };
  };
  return { ...t, scrollFor };
}
