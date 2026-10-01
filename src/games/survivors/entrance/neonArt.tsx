// NEON SURVIVAL'S KEY ART, for the title and the mode cards - ported from the
// approved mock (scratchpad entrance-mock/index.html, 2026-09-30) and drawn at
// whatever size the arena box is, rather than at the mock's two fixed sizes.
//
// Every colour is one the game already uses: the city's window inks from
// groundArt.ts, the bolt's ink (#d8fbff) and the robot's ice glow from the
// scene, the three worlds' bands from careerArt.tsx. The cast is the real sprite
// sheets (./sprite.tsx). Game art, fixed in both themes, the way the arena is.
//
// The skyline and the stars are random, from a FIXED seed, so a title looks the
// same on every visit and in every screenshot.

import { useMemo, type ReactElement, type ReactNode } from "react";
import { mulberry32 } from "@shared/rng";
import { Sprite, layer, type FrameId } from "./sprite";
import { WORLD_ART } from "../careerArt";

const K = "#241c17";
const WINDOWS = ["#ffd166", "#3de8ff", "#ff4dd2"];

/**
 * The synthwave world: a night sky with stars, a striped sun on the horizon,
 * two rows of lit towers, and a perspective floor running to the vanishing
 * point. `id` prefixes the gradients, so two drawings on one page cannot share one.
 */
export function NeonWorld(props: { w: number; h: number; hz: number; sun: number; id: string }): ReactElement {
  const { w: W, h: H, hz, id } = props;
  const art = useMemo(() => {
    const r = mulberry32(20260930);
    const out: ReactNode[] = [];
    for (let i = 0; i < 60; i++) {
      out.push(<circle key={`s${i}`} cx={r() * W} cy={r() * hz * 0.8} r={r() < 0.15 ? 1.4 : 0.8} fill="#fff" opacity={0.3 + r() * 0.6} />);
    }
    const sunR = Math.min(W, H) * props.sun;
    const sx = W / 2;
    const sy = hz - sunR * 0.25;
    out.push(<circle key="halo" cx={sx} cy={sy} r={sunR * 2} fill={`url(#${id}-halo)`} />);
    out.push(<circle key="sun" cx={sx} cy={sy} r={sunR} fill={`url(#${id}-sun)`} />);
    for (let i = 0; i < 6; i++) out.push(<rect key={`b${i}`} x={sx - sunR} y={sy + i * sunR * 0.16} width={sunR * 2} height={2 + i * 1.3} fill="#1a1046" />);
    // Two rows of towers, the near one taller and brighter.
    const rows: [number, number, string, string, number][] = [
      [0, H * 0.26, "#1b1450", "#3d2a86", 0.35],
      [1, H * 0.16, "#0f0b30", "#2a1f66", 0.22],
    ];
    for (const [row, hmax, fill, edge, lit] of rows) {
      let x = -10;
      let n = 0;
      while (x < W) {
        const bw = 26 + r() * 40;
        const bh = hmax * (0.35 + r() * 0.65);
        const y = hz - bh;
        out.push(<rect key={`t${row}-${n}`} x={x} y={y} width={bw} height={bh} fill={fill} stroke={edge} strokeWidth={1.5} />);
        let k = 0;
        for (let wy = y + 8; wy < hz - 8; wy += 11) {
          for (let wx = x + 5; wx < x + bw - 7; wx += 9) {
            if (r() < lit) out.push(<rect key={`w${row}-${n}-${k++}`} x={wx} y={wy} width={4} height={5} fill={WINDOWS[(r() * 3) | 0]} opacity={row ? 0.6 : 0.9} />);
          }
        }
        if (r() < 0.25 && bw > 40) {
          out.push(<rect key={`n${row}-${n}`} x={x + 6} y={y + 10} width={bw - 12} height={5} rx={2.5} fill={WINDOWS[(r() * 3) | 0]} />);
        }
        x += bw + 2 + r() * 10;
        n++;
      }
    }
    // The floor: a gradient, the pink horizon line, and the grid.
    out.push(<rect key="fl" y={hz} width={W} height={H - hz} fill={`url(#${id}-fl)`} />);
    out.push(<line key="hz" x1={0} y1={hz} x2={W} y2={hz} stroke="#ff4dd2" strokeWidth={3} />);
    for (let i = -14; i <= 14; i++) {
      out.push(<line key={`v${i}`} x1={W / 2} y1={hz} x2={W / 2 + i * W * 0.14} y2={H} stroke="#3de8ff" strokeOpacity={0.32} strokeWidth={1.4} />);
    }
    for (let k = 1; k < 12; k++) {
      const y = hz + (H - hz) * Math.pow(k / 11, 1.9);
      out.push(<line key={`h${k}`} x1={0} y1={y} x2={W} y2={y} stroke="#3de8ff" strokeOpacity={0.12 + k * 0.025} strokeWidth={1.4} />);
    }
    return out;
  }, [W, H, hz, props.sun, id]);
  return (
    <svg aria-hidden="true" width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ ...layer, display: "block" }}>
      <defs>
        <linearGradient id={`${id}-sky`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#07051a" />
          <stop offset=".7" stopColor="#1a1046" />
          <stop offset="1" stopColor="#4a1560" />
        </linearGradient>
        <linearGradient id={`${id}-sun`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#ffd166" />
          <stop offset=".55" stopColor="#ff4dd2" />
          <stop offset="1" stopColor="#6c2bd9" />
        </linearGradient>
        <linearGradient id={`${id}-fl`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#1a0f3a" />
          <stop offset="1" stopColor="#0b0d1f" />
        </linearGradient>
        <radialGradient id={`${id}-halo`}>
          <stop offset="0" stopColor="#ff4dd2" stopOpacity=".55" />
          <stop offset="1" stopColor="#ff4dd2" stopOpacity="0" />
        </radialGradient>
      </defs>
      <rect width={W} height={hz} fill={`url(#${id}-sky)`} />
      {art}
    </svg>
  );
}

/** One member of the crowd: where it stands (fractions of the box), what it is, how big, which way. */
type Spot = [fx: number, fy: number, f: FrameId, size: number, flip: boolean];

/**
 * The fight: the robot in the middle on its ice ring, firing its bolt into a
 * crowd that glows in its own colours, with a spark where each streak lands.
 * `sc` is the crowd's base height in px.
 */
function NeonFight(props: { w: number; h: number; hero: { x: number; y: number; h: number }; spots: Spot[]; sc: number }): ReactElement {
  const { w: W, h: H, hero, spots, sc } = props;
  const shots: ReactNode[] = [];
  const targets = spots.filter((_, i) => i % 3 === 0).slice(0, 4);
  targets.forEach(([fx, fy], n) => {
    const tx = W * fx;
    const ty = H * fy;
    const hx = hero.x + hero.h * 0.28;
    const hy = hero.y - hero.h * 0.08;
    const mx = hx + (tx - hx) * 0.72;
    const my = hy + (ty - hy) * 0.72;
    const bx = hx + (tx - hx) * 0.42;
    const by = hy + (ty - hy) * 0.42;
    shots.push(<line key={`l${n}`} x1={bx} y1={by} x2={mx} y2={my} stroke="#d8fbff" strokeWidth={Math.max(3, sc * 0.05)} strokeLinecap="round" />);
    shots.push(<circle key={`c${n}`} cx={mx} cy={my} r={Math.max(4, sc * 0.07)} fill="#fff" />);
    for (let a = 0; a < 6; a++) {
      const t = (a / 6) * Math.PI * 2;
      const rr = sc * 0.22;
      shots.push(
        <line key={`k${n}-${a}`} x1={tx + Math.cos(t) * rr * 0.45} y1={ty + Math.sin(t) * rr * 0.45} x2={tx + Math.cos(t) * rr} y2={ty + Math.sin(t) * rr}
          stroke="#ffd7e2" strokeWidth={2.5} strokeLinecap="round" opacity={0.85} />,
      );
    }
  });
  return (
    <>
      <svg aria-hidden="true" width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ ...layer, filter: "drop-shadow(0 0 6px #3de8ff)" }}>
        <ellipse cx={hero.x} cy={hero.y + hero.h * 0.47} rx={hero.h * 0.52} ry={hero.h * 0.13} fill="#3de8ff22" stroke="#3de8ff" strokeWidth={3} strokeDasharray="10 7" />
      </svg>
      {spots.map(([fx, fy, f, size, flip], i) => (
        <Sprite key={i} f={f} cx={W * fx} cy={H * fy} h={sc * size} flip={flip} />
      ))}
      <svg aria-hidden="true" width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ ...layer, filter: "drop-shadow(0 0 5px #d8fbff) drop-shadow(0 0 12px #3de8ff)" }}>
        {shots}
      </svg>
      <Sprite f="robotShoot" cx={hero.x + hero.h * 0.08} cy={hero.y} h={hero.h} glow="#3de8ff" />
    </>
  );
}

const PORTRAIT_CROWD: Spot[] = [
  [0.12, 0.53, "bat", 1, false], [0.86, 0.5, "batFly", 1.1, true], [0.2, 0.66, "slime", 1, false], [0.84, 0.66, "crab", 1.15, true],
  [0.1, 0.79, "golem", 1.35, false], [0.9, 0.8, "slime", 1.1, true], [0.34, 0.5, "slime", 0.7, true], [0.68, 0.52, "bat", 0.75, true],
  [0.62, 0.76, "batFly", 0.8, false],
];
const LANDSCAPE_CROWD: Spot[] = [
  [0.08, 0.55, "bat", 1, false], [0.9, 0.5, "batFly", 1.1, true], [0.22, 0.7, "slime", 1, false], [0.78, 0.7, "crab", 1.15, true],
  [0.06, 0.85, "golem", 1.5, false], [0.94, 0.84, "golem", 1.3, true], [0.33, 0.52, "slime", 0.7, true], [0.66, 0.52, "bat", 0.75, true],
  [0.24, 0.86, "crab", 1, false], [0.76, 0.86, "slime", 1, true], [0.16, 0.43, "batFly", 0.7, false], [0.83, 0.38, "bat", 0.7, true],
];

/** The title's key art: the world, and the robot firing into the crowd before it. */
export function NeonTitleArt({ w, h, wide }: { w: number; h: number; wide: boolean }): ReactElement {
  // Heights scale from the mock's two boxes (358x756 and 852x479), by the
  // shorter side, so a smaller phone gets a smaller robot rather than a crowded one.
  const u = wide ? h / 479 : Math.min(w / 358, h / 756);
  return (
    <div aria-hidden="true" style={layer}>
      <NeonWorld w={w} h={h} hz={h * (wide ? 0.45 : 0.47)} sun={wide ? 0.2 : 0.26} id="neon-title" />
      <NeonFight
        w={w}
        h={h}
        hero={wide ? { x: w / 2, y: h * 0.56, h: 132 * u } : { x: w / 2, y: h * 0.6, h: 150 * u }}
        spots={wide ? LANDSCAPE_CROWD : PORTRAIT_CROWD}
        sc={(wide ? 54 : 58) * u}
      />
    </div>
  );
}

/** The mode screen's backdrop: the same world, dimmed, fading to night at the bottom. */
export function NeonDimWorld({ w, h }: { w: number; h: number }): ReactElement {
  return (
    <div aria-hidden="true" style={layer}>
      <div style={{ ...layer, filter: "brightness(.42) saturate(1.1)" }}>
        <NeonWorld w={w} h={h} hz={h * 0.42} sun={0.22} id="neon-mode" />
      </div>
      <div style={{ ...layer, background: "linear-gradient(#07051a00, #07051acc)" }} />
    </div>
  );
}

const STAR = (k: string, x: number, y: number) => (
  <g key={k} transform={`translate(${x} ${y}) scale(.55)`}>
    <path d="M0 -10 L3 -3 L10 -3 L4 2 L6 10 L0 5 L-6 10 L-4 2 L-10 -3 L-3 -3 Z" fill="#ffd166" stroke={K} strokeWidth={2} />
  </g>
);

/**
 * The CAREER card's picture: the three worlds (city towers, frost peaks, the
 * volcano), the dotted trail with a stone per level, a castle crowned for each
 * boss, and the robot standing where you are up to.
 */
export function CareerCardArt({ w, h }: { w: number; h: number }): ReactElement {
  const b = w / 3;
  const pts = ([[0.06, 0.8], [0.2, 0.6], [0.3, 0.78], [0.42, 0.5], [0.56, 0.7], [0.68, 0.44], [0.82, 0.62], [0.94, 0.3]] as const).map(
    ([x, y]) => [x * w, y * h] as const,
  );
  const towers = useMemo(() => {
    const r = mulberry32(7);
    const out: ReactNode[] = [];
    let n = 0;
    for (let x = 2; x < b - 8; ) {
      const bw = 12 + r() * 14;
      const bh = h * (0.2 + r() * 0.3);
      out.push(<rect key={`t${n}`} x={x} y={h - bh} width={bw} height={bh} fill="#241a5e" stroke="#6c5ce7" strokeWidth={1.5} />);
      for (let wy = h - bh + 5, k = 0; wy < h - 4; wy += 8, k++) {
        if (r() < 0.6) out.push(<rect key={`w${n}-${k}`} x={x + 3} y={wy} width={3} height={3} fill={r() < 0.5 ? "#ffd166" : "#3de8ff"} />);
      }
      x += bw + 3;
      n++;
    }
    return out;
  }, [b, h]);
  const vx = 2 * b + b * 0.55;
  const cur = pts[3];
  return (
    <div aria-hidden="true" style={{ position: "relative", width: w, height: h, overflow: "hidden" }}>
      <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} style={{ display: "block" }}>
        <defs>
          <linearGradient id="neon-cc" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor={WORLD_ART.city.deep} /><stop offset="1" stopColor={WORLD_ART.city.band} /></linearGradient>
          <linearGradient id="neon-cf" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#bfe6ff" /><stop offset="1" stopColor={WORLD_ART.frost.band} /></linearGradient>
          <linearGradient id="neon-cl" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#3b0f0f" /><stop offset="1" stopColor={WORLD_ART.lava.band} /></linearGradient>
        </defs>
        <rect width={b} height={h} fill="url(#neon-cc)" />
        <rect x={b} width={b} height={h} fill="url(#neon-cf)" />
        <rect x={2 * b} width={w - 2 * b} height={h} fill="url(#neon-cl)" />
        {towers}
        {([[0.05, 0.5, 0.55], [0.35, 0.5, 0.75], [0.65, 0.45, 0.5]] as const).map(([px, pw, ph], i) => {
          const x0 = b + px * b;
          return (
            <g key={`p${i}`}>
              <path d={`M${x0} ${h} L${x0 + (pw * b) / 2} ${h * (1 - ph)} L${x0 + pw * b} ${h} Z`} fill="#fff" stroke="#74b9ff" strokeWidth={2} />
              <path d={`M${x0 + (pw * b) / 2} ${h * (1 - ph)} L${x0 + pw * b * 0.62} ${h * (1 - ph * 0.65)} L${x0 + (pw * b) / 2} ${h}`} fill="#d6ecff" />
            </g>
          );
        })}
        <path d={`M${2 * b + 4} ${h} L${vx - b * 0.14} ${h * 0.38} L${vx + b * 0.14} ${h * 0.38} L${w} ${h} Z`} fill="#4a1a12" stroke={K} strokeWidth={2} />
        <path d={`M${vx - b * 0.14} ${h * 0.38} Q${vx} ${h * 0.5} ${vx + b * 0.14} ${h * 0.38} L${vx + b * 0.08} ${h * 0.5} L${vx - b * 0.06} ${h * 0.46} Z`} fill="#ff7b00" />
        <circle cx={vx - 4} cy={h * 0.28} r={b * 0.06} fill="#6b4a44" opacity={0.8} />
        <circle cx={vx + 8} cy={h * 0.18} r={b * 0.08} fill="#6b4a44" opacity={0.6} />
        <circle cx={vx - 2} cy={h * 0.07} r={b * 0.1} fill="#6b4a44" opacity={0.4} />
        <path d={`M${pts.map((p) => p.join(" ")).join(" L")}`} fill="none" stroke="#fff" strokeWidth={5} strokeDasharray="1 10" strokeLinecap="round" />
        {pts.map(([x, y], i) => {
          const done = i < 3;
          const now = i === 3;
          if (i === 2 || i === 7) {
            const c = done ? "#6c5ce7" : "#4a4f63";
            return (
              <g key={`c${i}`} transform={`translate(${x} ${y})`}>
                <rect x={-17} y={-14} width={34} height={26} fill={c} stroke={K} strokeWidth={3} />
                <path d="M-17 -14 v-6 h7 v6 M-3 -14 v-6 h6 v6 M10 -14 v-6 h7 v6" fill={c} stroke={K} strokeWidth={3} />
                <path d="M-6 12 v-10 a6 6 0 0 1 12 0 v10" fill={K} />
                <path d="M-11 -24 L-12 -34 L-5 -29 L0 -37 L5 -29 L12 -34 L11 -24 Z" fill="#ffd166" stroke={K} strokeWidth={2} />
              </g>
            );
          }
          return (
            <g key={`n${i}`}>
              <circle cx={x} cy={y} r={now ? 15 : 12} fill={done ? "#2bb58a" : now ? "#c2185b" : "#8a8f99"} stroke={K} strokeWidth={3} />
              {done && [-1, 0, 1].map((k) => STAR(`s${i}${k}`, x + k * 10, y - 20 - (k ? 0 : 3)))}
            </g>
          );
        })}
      </svg>
      <Sprite f="robot" cx={cur[0]} cy={cur[1] - 34} h={50} glow="#fff" />
    </div>
  );
}

/** The QUICK RUN card's picture: the dark arena, the robot in the swarm, its bolts going out. */
export function QuickCardArt({ w, h }: { w: number; h: number }): ReactElement {
  const cx = w / 2;
  const cy = h * 0.55;
  const rr = Math.min(w, h) * 0.4;
  const sc = h * 0.26;
  const crowd: Spot[] = [
    [0.12, 0.22, "bat", 1, false], [0.86, 0.2, "batFly", 1, true], [0.1, 0.8, "slime", 1, false], [0.88, 0.78, "crab", 1.1, true],
    [0.3, 0.12, "slime", 0.7, true], [0.72, 0.9, "bat", 0.8, false], [0.3, 0.88, "crab", 0.8, false], [0.7, 0.14, "slime", 0.75, false],
  ];
  const lines: ReactNode[] = [];
  for (let x = 24; x < w; x += 36) lines.push(<line key={`x${x}`} x1={x} y1={0} x2={x} y2={h} stroke="#1c2046" strokeWidth={2} />);
  for (let y = 18; y < h; y += 36) lines.push(<line key={`y${y}`} x1={0} y1={y} x2={w} y2={y} stroke="#1c2046" strokeWidth={2} />);
  return (
    <div aria-hidden="true" style={{ position: "relative", width: w, height: h, overflow: "hidden" }}>
      <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} style={{ ...layer, display: "block" }}>
        <rect width={w} height={h} fill="#0b0d1f" />
        {lines}
        <circle cx={cx} cy={cy} r={rr * 0.55} fill="none" stroke="#3de8ff" strokeOpacity={0.5} strokeWidth={2} strokeDasharray="6 6" />
      </svg>
      <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} style={{ ...layer, filter: "drop-shadow(0 0 5px #3de8ff)" }}>
        {([[-0.9, -0.5], [0.95, -0.35], [-0.7, 0.55]] as const).map(([dx, dy], i) => (
          <line key={i} x1={cx + dx * rr * 0.35} y1={cy + dy * rr * 0.35} x2={cx + dx * rr * 0.65} y2={cy + dy * rr * 0.65} stroke="#d8fbff" strokeWidth={4} strokeLinecap="round" />
        ))}
      </svg>
      {crowd.map(([fx, fy, f, size, flip], i) => (
        <Sprite key={i} f={f} cx={w * fx} cy={h * fy} h={sc * size} flip={flip} />
      ))}
      <Sprite f="robotShoot" cx={cx + 6} cy={cy - 4} h={h * 0.5} glow="#3de8ff" />
    </div>
  );
}
