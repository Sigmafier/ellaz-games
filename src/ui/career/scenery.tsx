// The floor under each world on the trail map: a sky gradient and a few shapes
// that say which world you are in without a word - a skyline, snow peaks, a
// volcano. The three kinds the approved P0 lobby drew; a game names one per
// world (`scenery` in its campaign file) and an unknown name draws the plain
// floor rather than nothing.
//
// DETERMINISTIC. Every "random" position comes from the shape's own index, so
// the same box draws the same picture every time - a screenshot compared with
// yesterday's differs only where the layout did.

import type { ReactElement } from "react";

export type SceneryKind = "city" | "frost" | "lava" | "plain" | "garden" | "desert" | "cave";

export interface Rect { x: number; y: number; width: number; height: number }

const SKY: Record<SceneryKind, [string, string]> = {
  city: ["#1a1340", "#3d2a86"],
  frost: ["#a9dcff", "#3a7bd5"],
  lava: ["#2a0a0a", "#8a2a0a"],
  plain: ["#232a6b", "#0b0e22"],
  garden: ["#8fd99a", "#2f8a4c"],
  desert: ["#ffe1a8", "#e3a253"],
  cave: ["#120e1f", "#2a2142"],
};

/** the ink a world's name is written in over its own sky, and the outline under it */
export const LABEL_INK: Record<SceneryKind, [string, string]> = {
  city: ["#ffffff", "#241c17"],
  frost: ["#0d3357", "#ffffff"],
  lava: ["#ffd1b3", "#241c17"],
  plain: ["#ffffff", "#241c17"],
  garden: ["#ffffff", "#1b3a24"],
  desert: ["#5a2e0a", "#ffffff"],
  cave: ["#e6dcff", "#120e1f"],
};

export const asScenery = (name: string | undefined): SceneryKind =>
  name === "city" || name === "frost" || name === "lava" || name === "garden" || name === "desert" || name === "cave" ? name : "plain";

function skyline(r: Rect): ReactElement[] {
  const out: ReactElement[] = [];
  const n = Math.max(4, Math.round(r.width / 34));
  const bw = r.width / n;
  const tall = Math.min(r.height * 0.3, 190);
  for (let i = 0; i < n; i++) {
    const bh = tall * (0.35 + ((i * 53) % 100) / 160);
    const x = r.x + i * bw, top = r.y + r.height - bh;
    out.push(<rect key={`b${i}`} x={x} y={top} width={bw - 4} height={bh} fill="#140f33" />);
    for (let k = 0; k * 20 + 12 < bh - 8; k++) {
      out.push(<rect key={`w${i}-${k}`} x={x + bw * 0.3} y={top + 12 + k * 20} width={7} height={7} fill={(i + k) % 3 ? "#ffd16699" : "#3de8ff99"} />);
    }
  }
  for (let i = 0; i < 24; i++) {
    out.push(<circle key={`s${i}`} cx={r.x + ((i * 97) % Math.max(1, r.width))} cy={r.y + ((i * 53) % Math.max(1, r.height * 0.55))} r={1 + (i % 2)} fill="#fff" opacity={0.5} />);
  }
  return out;
}

function peaks(r: Rect): ReactElement[] {
  const out: ReactElement[] = [];
  const n = Math.max(3, Math.round(r.width / 90));
  const base = r.y + r.height;
  const half = Math.min(120, (r.width / n) * 1.1);
  for (let i = 0; i < n; i++) {
    const x = r.x + ((i + 0.5) * r.width) / n;
    const ph = Math.min(r.height * 0.42, (i % 2 ? 240 : 150) * (half / 120));
    out.push(<path key={`p${i}`} d={`M${x - half} ${base} L${x} ${base - ph} L${x + half} ${base} Z`} fill={i % 2 ? "#e8f6ff" : "#cfe9ff"} />);
    const cap = ph * 0.22;
    out.push(<path key={`c${i}`} d={`M${x - cap * 0.8} ${base - ph + cap} L${x} ${base - ph} L${x + cap * 0.8} ${base - ph + cap} Z`} fill="#fff" />);
  }
  for (let i = 0; i < 26; i++) {
    out.push(<circle key={`f${i}`} cx={r.x + ((i * 131) % Math.max(1, r.width))} cy={r.y + ((i * 71) % Math.max(1, r.height))} r={1.5 + (i % 3)} fill="#fff" opacity={0.8} />);
  }
  return out;
}

function volcano(r: Rect): ReactElement[] {
  const out: ReactElement[] = [];
  const k = Math.min(1, r.height / 560, r.width / 520);
  const vx = r.x + r.width * 0.62, vy = r.y + r.height;
  const w = 260 * k, top = 300 * k, mouth = 60 * k;
  out.push(<path key="v" d={`M${vx - w} ${vy} L${vx - mouth} ${vy - top} H${vx + mouth} L${vx + w} ${vy} Z`} fill="#3b0f0f" />);
  out.push(<path key="m" d={`M${vx - mouth} ${vy - top} Q${vx} ${vy - top * 0.87} ${vx + mouth} ${vy - top}`} fill="#ff7b00" />);
  out.push(<path key="g" d={`M${vx - 20 * k} ${vy - top} Q${vx - 60 * k} ${vy - top - 80 * k} ${vx} ${vy - top - 120 * k} Q${vx + 60 * k} ${vy - top - 70 * k} ${vx + 20 * k} ${vy - top}`} fill="#ffb347" opacity={0.8} />);
  out.push(<path key="l" d={`M${vx - 10 * k} ${vy - top + 10 * k} L${vx - 40 * k} ${vy - top * 0.6} L${vx - 20 * k} ${vy - top * 0.4} L${vx - 60 * k} ${vy}`} stroke="#ff7b00" strokeWidth={10 * k} fill="none" strokeLinejoin="round" />);
  for (let i = 0; i < 24; i++) {
    out.push(<circle key={`e${i}`} cx={r.x + ((i * 89) % Math.max(1, r.width))} cy={r.y + ((i * 67) % Math.max(1, r.height))} r={2 + (i % 2)} fill={i % 2 ? "#ffd166" : "#ff7b00"} opacity={0.8} />);
  }
  return out;
}

// Snake Survivors' three worlds (snake career, 2026-10-03): a garden of hills and
// flowers, desert dunes under a sun, and a cave of stalactites and glowing crystals.
function garden(r: Rect): ReactElement[] {
  const out: ReactElement[] = [];
  const base = r.y + r.height;
  const n = Math.max(3, Math.round(r.width / 140));
  for (let i = 0; i < n; i++) {
    const cx = r.x + ((i + 0.5) * r.width) / n, rx = r.width / n * 0.8, ry = Math.min(r.height * 0.22, 90);
    out.push(<ellipse key={`h${i}`} cx={cx} cy={base} rx={rx} ry={ry} fill={i % 2 ? "#2a7a43" : "#3c9a55"} />);
  }
  for (let i = 0; i < 30; i++) {
    const x = r.x + ((i * 97) % Math.max(1, r.width)), y = r.y + r.height * 0.15 + ((i * 61) % Math.max(1, r.height * 0.8));
    out.push(<circle key={`f${i}`} cx={x} cy={y} r={3 + (i % 2)} fill={["#ff8fc8", "#ffd166", "#ffffff"][i % 3]} opacity={0.9} />);
  }
  return out;
}

function dunes(r: Rect): ReactElement[] {
  const out: ReactElement[] = [];
  const k = Math.min(1, r.height / 560, r.width / 520);
  out.push(<circle key="sun" cx={r.x + r.width * 0.82} cy={r.y + r.height * 0.22} r={44 * k + 14} fill="#fff3c4" opacity={0.85} />);
  const base = r.y + r.height;
  for (let j = 0; j < 3; j++) {
    const h = r.height * (0.18 + j * 0.08), y = base - h * (1 - j * 0.25);
    let d = `M${r.x} ${base} L${r.x} ${y}`;
    const n = Math.max(2, Math.round(r.width / 220));
    for (let i = 0; i < n; i++) {
      const x0 = r.x + (i * r.width) / n, x1 = r.x + ((i + 1) * r.width) / n;
      d += ` Q${(x0 + x1) / 2} ${y - h * 0.5 * (i % 2 ? 0.6 : 1)} ${x1} ${y}`;
    }
    out.push(<path key={`d${j}`} d={`${d} L${r.x + r.width} ${base} Z`} fill={["#f0c27a", "#e2a95c", "#c98a3f"][j]} />);
  }
  for (let i = 0; i < 3; i++) {
    const x = r.x + r.width * (0.18 + i * 0.31), y = base - r.height * 0.12, h = 46 * k + 10;
    out.push(<path key={`c${i}`} d={`M${x} ${y} V${y - h} M${x} ${y - h * 0.55} H${x - 12 * k - 4} V${y - h * 0.85} M${x} ${y - h * 0.4} H${x + 12 * k + 4} V${y - h * 0.7}`} stroke="#3f8a4a" strokeWidth={9 * k + 3} strokeLinecap="round" fill="none" />);
  }
  return out;
}

function cavern(r: Rect): ReactElement[] {
  const out: ReactElement[] = [];
  const n = Math.max(5, Math.round(r.width / 46));
  for (let i = 0; i < n; i++) {
    const x = r.x + (i * r.width) / n, w = r.width / n, h = Math.min(r.height * 0.3, 40 + ((i * 37) % 70));
    out.push(<path key={`t${i}`} d={`M${x} ${r.y} L${x + w / 2} ${r.y + h} L${x + w} ${r.y} Z`} fill="#0a0814" />);
  }
  for (let i = 0; i < 16; i++) {
    const x = r.x + ((i * 113) % Math.max(1, r.width)), y = r.y + r.height * 0.35 + ((i * 53) % Math.max(1, r.height * 0.6));
    const c = i % 2 ? "#7fd4ff" : "#c39bff", z = 5 + (i % 3) * 2;
    out.push(<circle key={`g${i}`} cx={x} cy={y} r={z * 2.4} fill={c} opacity={0.18} />);
    out.push(<path key={`k${i}`} d={`M${x} ${y - z} L${x + z * 0.6} ${y} L${x} ${y + z} L${x - z * 0.6} ${y} Z`} fill={c} />);
  }
  return out;
}

const SHAPES: Record<SceneryKind, (r: Rect) => ReactElement[]> = { city: skyline, frost: peaks, lava: volcano, plain: () => [], garden, desert: dunes, cave: cavern };

/** one world's floor, clipped to its band; `id` must be unique within the SVG */
export function Backdrop({ kind, rect, id }: { kind: SceneryKind; rect: Rect; id: string }): ReactElement {
  const [a, b] = SKY[kind];
  return (
    <g>
      <defs>
        <linearGradient id={`${id}-sky`} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor={a} /><stop offset="1" stopColor={b} /></linearGradient>
        <clipPath id={`${id}-clip`}><rect x={rect.x} y={rect.y} width={rect.width} height={rect.height} /></clipPath>
      </defs>
      <rect x={rect.x} y={rect.y} width={rect.width} height={rect.height} fill={`url(#${id}-sky)`} />
      <g clipPath={`url(#${id}-clip)`}>{SHAPES[kind](rect)}</g>
    </g>
  );
}
