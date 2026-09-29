// The career's pictures that are NEON's rather than the kit's: the world badges,
// the three twist signs, the two entrance tiles' little scenes, stars, gold, the
// trophy and the gear pieces on the result card. Ported from the approved p0 mock's
// own icon set (scratchpad career-p0/p0.html, `const ICON`), drawn on a 48-unit
// canvas centred on 0,0 with the mock's ink outline.
//
// Colours are game art, fixed in both themes, the way the arena's are.

import type { ReactElement, ReactNode } from "react";
import type { WorldId } from "./types";
import { CastArt } from "./castArt";

export const K = "#241c17";

/** Each world's badge fill, band colour on the map tile, and ribbon ink - p0's. */
export const WORLD_ART: Record<WorldId, { badge: string; deep: string; band: string; ribbon: string }> = {
  city: { badge: "#6c5ce7", deep: "#1a1340", band: "#3d2a86", ribbon: "#2a1a66" },
  frost: { badge: "#74b9ff", deep: "#0d3357", band: "#3a7bd5", ribbon: "#0d3357" },
  lava: { badge: "#ff7b00", deep: "#3b0f0f", band: "#8a2a0a", ribbon: "#6b1a05" },
};

const shapes: Record<string, (c?: string) => ReactNode> = {
  // Drawn at 2.1x: the p0 star is 20 units across, and on a 48-unit canvas it read as a speck.
  star: (c = "#ffd166") => <path d="M0 -10 L3 -3 L10 -3 L4 2 L6 10 L0 5 L-6 10 L-4 2 L-10 -3 L-3 -3 Z" transform="scale(2.1)" fill={c} stroke={K} strokeWidth={1.2} />,
  gold: () => (
    <g>
      <rect x="-11" y="-11" width="22" height="22" rx="5" fill="#ffc21a" stroke={K} strokeWidth={2.5} />
      <rect x="-6" y="-6" width="12" height="12" rx="2" fill="#ffe27a" />
    </g>
  ),
  trophy: (c = "#ffd166") => (
    <g>
      <path d="M-14 -18 H14 V-4 C14 6 6 10 0 10 C-6 10 -14 6 -14 -4 Z" fill={c} stroke={K} strokeWidth={2.5} />
      <path d="M-14 -12 H-20 C-22 -2 -18 2 -12 2 M14 -12 H20 C22 -2 18 2 12 2" fill="none" stroke={K} strokeWidth={2.5} />
      <rect x="-4" y="10" width="8" height="6" fill={c} stroke={K} strokeWidth={2.5} />
      <rect x="-12" y="16" width="24" height="6" rx="2" fill="#8a5a2b" stroke={K} strokeWidth={2.5} />
    </g>
  ),
  crown: (c = "#ffd166") => <path d="M-16 8 L-18 -10 L-8 -2 L0 -16 L8 -2 L18 -10 L16 8 Z" fill={c} stroke={K} strokeWidth={2.5} />,
  city: () => (
    <g>
      <rect x="-20" y="-6" width="10" height="24" fill="#6c5ce7" stroke={K} strokeWidth={2.5} />
      <rect x="-8" y="-20" width="12" height="38" fill="#a29bfe" stroke={K} strokeWidth={2.5} />
      <rect x="6" y="-10" width="14" height="28" fill="#6c5ce7" stroke={K} strokeWidth={2.5} />
      <rect x="-4" y="-14" width="4" height="4" fill="#ffd166" />
      <rect x="-4" y="-4" width="4" height="4" fill="#ffd166" />
      <rect x="10" y="-4" width="4" height="4" fill="#3de8ff" />
      <rect x="-17" y="0" width="4" height="4" fill="#3de8ff" />
    </g>
  ),
  frost: (c = "#fff") => (
    <g stroke={c} strokeWidth={3.2} strokeLinecap="round" fill="none">
      {[0, 60, 120].map((a) => (
        <g key={a} transform={`rotate(${a})`}>
          <path d="M0 -18 V18" />
          <path d="M-6 -13 L0 -8 L6 -13 M-6 13 L0 8 L6 13" />
        </g>
      ))}
    </g>
  ),
  lava: () => (
    <g>
      <path d="M0 -22 C8 -10 16 -4 14 8 C12 18 4 22 0 22 C-4 22 -12 18 -14 8 C-16 -2 -6 -6 -6 -14 C-2 -10 -2 -6 0 -4 C2 -10 0 -16 0 -22 Z" fill="#ff7b00" stroke={K} strokeWidth={2.5} strokeLinejoin="round" />
      <path d="M0 4 C5 8 6 14 0 17 C-6 14 -5 8 0 4 Z" fill="#ffd166" />
    </g>
  ),
  // The three twist signs: a lamp gone dark with eyes in it, a robot skidding, a pool.
  lights: () => (
    <g>
      <circle cy="-4" r="15" fill="#2d2f4a" stroke={K} strokeWidth={2.5} />
      <rect x="-7" y="10" width="14" height="9" rx="2" fill="#b2bec3" stroke={K} strokeWidth={2.5} />
      <circle cx="-5" cy="-5" r="3" fill="#ffd166" />
      <circle cx="5" cy="-5" r="3" fill="#ffd166" />
    </g>
  ),
  ice: () => (
    <g>
      <g transform="rotate(-14)">
        <rect x="-12" y="-20" width="22" height="18" rx="5" fill="#ff5a4a" stroke={K} strokeWidth={2.5} />
        <rect x="-7" y="-15" width="12" height="7" rx="2" fill="#ffd166" stroke={K} strokeWidth={1.5} />
        <rect x="-10" y="-2" width="18" height="14" rx="3" fill="#ff5a4a" stroke={K} strokeWidth={2.5} />
      </g>
      <path d="M-22 18 Q0 12 22 20" stroke="#74b9ff" strokeWidth={4} fill="none" strokeLinecap="round" />
      <path d="M-24 24 Q-2 18 20 26" stroke="#bfe6ff" strokeWidth={3} fill="none" strokeLinecap="round" />
    </g>
  ),
  pools: () => (
    <g>
      <path d="M-20 4 C-22 -8 -8 -12 0 -10 C10 -14 22 -8 20 4 C22 14 8 16 0 14 C-10 18 -22 14 -20 4 Z" fill="#ff7b00" stroke={K} strokeWidth={2.5} />
      <path d="M-10 2 C-10 -4 0 -6 4 -4 C10 -6 12 0 10 4 C8 8 -8 8 -10 2 Z" fill="#ffd166" />
      <circle cx="8" cy="-16" r="3" fill="#ffb347" stroke={K} strokeWidth={1.5} />
      <circle cx="-6" cy="-20" r="2.2" fill="#ffb347" />
    </g>
  ),
  map: () => (
    <g>
      <path d="M-20 -14 L-7 -18 L7 -14 L20 -18 V14 L7 18 L-7 14 L-20 18 Z" fill="#fff4e6" stroke={K} strokeWidth={2.5} strokeLinejoin="round" />
      <path d="M-7 -18 V14 M7 -14 V18" stroke={K} strokeWidth={2} opacity={0.5} />
      <path d="M-14 8 Q-6 -2 0 4 T14 -8" stroke="#c2185b" strokeWidth={3} fill="none" strokeDasharray="3 4" strokeLinecap="round" />
    </g>
  ),
  retry: () => (
    <g fill="none" stroke={K} strokeWidth={4} strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 -4 A15 15 0 1 1 6 -13" />
      <path d="M4 -20 L8 -12 L-1 -9" />
    </g>
  ),
  infinity: () => (
    <g fill="none" strokeLinejoin="round">
      <path d="M0 0 C-6 -10 -20 -10 -20 0 C-20 10 -6 10 0 0 C6 -10 20 -10 20 0 C20 10 6 10 0 0 Z" stroke={K} strokeWidth={9} />
      <path d="M0 0 C-6 -10 -20 -10 -20 0 C-20 10 -6 10 0 0 C6 -10 20 -10 20 0 C20 10 6 10 0 0 Z" stroke="#3de8ff" strokeWidth={5} />
    </g>
  ),
  sword: (c = "#dfe6e9") => (
    <g>
      <path d="M-2 -24 L2 -24 L4 6 L-4 6 Z" fill={c} stroke={K} strokeWidth={2.5} strokeLinejoin="round" />
      <rect x="-12" y="6" width="24" height="5" rx="2" fill="#ffd166" stroke={K} strokeWidth={2.5} />
      <rect x="-3" y="11" width="6" height="10" rx="2" fill="#8a5a2b" stroke={K} strokeWidth={2.5} />
    </g>
  ),
  armor: (c = "#74b9ff") => (
    <g>
      <path d="M-16 -16 L-6 -20 Q0 -14 6 -20 L16 -16 L20 -4 L13 -2 L13 18 L-13 18 L-13 -2 L-20 -4 Z" fill={c} stroke={K} strokeWidth={2.5} strokeLinejoin="round" />
      <path d="M-6 0 H6 M-6 8 H6" stroke="#ffffff88" strokeWidth={3} strokeLinecap="round" />
    </g>
  ),
  ring: (c = "#ffd166") => (
    <g>
      <circle cy="6" r="13" fill="none" stroke={K} strokeWidth={9} />
      <circle cy="6" r="13" fill="none" stroke={c} strokeWidth={5} />
      <path d="M0 -20 L9 -10 L0 -2 L-9 -10 Z" fill="#ff5ce1" stroke={K} strokeWidth={2.5} />
    </g>
  ),
};

/** A picture's bare shapes, on its 48-unit canvas centred on 0,0 - for drawing inside a larger SVG. */
export const neonShape = (name: string, color?: string): ReactNode => shapes[name]?.(color) ?? null;

/** One Neon career picture at `size` px. `name` is a key of the set above; an unknown one draws nothing. */
export function NeonIcon({ name, size, color }: { name: string; size: number; color?: string }): ReactElement {
  return (
    <svg aria-hidden="true" width={size} height={size} viewBox="-24 -24 48 48" style={{ display: "block", overflow: "visible", flex: "none" }}>
      {shapes[name]?.(color) ?? null}
    </svg>
  );
}

/** The Career tile's little scene: the three worlds' bands, the dotted trail, the robot on it, the castle crown. */
export function CareerTileArt(): ReactElement {
  const pts = [[26, 118], [86, 92], [146, 66], [206, 108], [264, 58]];
  return (
    <svg aria-hidden="true" viewBox="0 0 290 150" width="100%" height="100%" preserveAspectRatio="xMidYMid slice" style={{ display: "block" }}>
      <rect x="0" y="0" width="97" height="150" fill={WORLD_ART.city.band} />
      <rect x="97" y="0" width="97" height="150" fill={WORLD_ART.frost.band} />
      <rect x="194" y="0" width="96" height="150" fill={WORLD_ART.lava.band} />
      <path d={`M${pts.map((p) => p.join(" ")).join(" L")}`} fill="none" stroke="#fff" strokeWidth={5} strokeDasharray="2 10" strokeLinecap="round" />
      {pts.map(([x, y], i) => (
        <circle key={i} cx={x} cy={y} r={11} fill={i < 2 ? "#2bb58a" : i === 2 ? "#c2185b" : "#8a8f99"} stroke={K} strokeWidth={3} />
      ))}
      <g transform="translate(282 44) scale(0.6)">{shapes.crown("#ffd166")}</g>
      <foreignObject x="126" y="8" width="40" height="52">
        <CastArt who="robot" />
      </foreignObject>
    </svg>
  );
}

/** The Quick run tile's little scene: a dark arena grid, two bats, the robot, a slime, and infinity. */
export function QuickTileArt(): ReactElement {
  return (
    <svg aria-hidden="true" viewBox="0 0 290 150" width="100%" height="100%" preserveAspectRatio="xMidYMid slice" style={{ display: "block" }}>
      <rect width="290" height="150" fill="#0b0d1f" />
      {[48, 96, 144, 192, 240].map((x) => <line key={x} x1={x} y1="0" x2={x} y2="150" stroke="#1c2046" strokeWidth={2} />)}
      {[38, 76, 114].map((y) => <line key={y} x1="0" y1={y} x2="290" y2={y} stroke="#1c2046" strokeWidth={2} />)}
      <foreignObject x="30" y="16" width="52" height="36"><CastArt who="bat" /></foreignObject>
      <foreignObject x="222" y="18" width="36" height="26"><CastArt who="bat" /></foreignObject>
      <foreignObject x="126" y="44" width="42" height="62"><CastArt who="robot" /></foreignObject>
      <foreignObject x="212" y="92" width="44" height="28"><CastArt who="slime" /></foreignObject>
      <g transform="translate(62 110) scale(0.9)">{shapes.infinity()}</g>
    </svg>
  );
}
