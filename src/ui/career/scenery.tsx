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

export type SceneryKind = "city" | "frost" | "lava" | "plain";

export interface Rect { x: number; y: number; width: number; height: number }

const SKY: Record<SceneryKind, [string, string]> = {
  city: ["#1a1340", "#3d2a86"],
  frost: ["#a9dcff", "#3a7bd5"],
  lava: ["#2a0a0a", "#8a2a0a"],
  plain: ["#232a6b", "#0b0e22"],
};

/** the ink a world's name is written in over its own sky, and the outline under it */
export const LABEL_INK: Record<SceneryKind, [string, string]> = {
  city: ["#ffffff", "#241c17"],
  frost: ["#0d3357", "#ffffff"],
  lava: ["#ffd1b3", "#241c17"],
  plain: ["#ffffff", "#241c17"],
};

export const asScenery = (name: string | undefined): SceneryKind =>
  name === "city" || name === "frost" || name === "lava" ? name : "plain";

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

const SHAPES: Record<SceneryKind, (r: Rect) => ReactElement[]> = { city: skyline, frost: peaks, lava: volcano, plain: () => [] };

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
