// Snake Survivors' TITLE: the neon snake closing its loop round a crowd, the
// name in two glowing lines, "Circle them. Close the loop.", one Tap to start
// and a small How to play. Approved off the mock, 2026-09-30. After Tap to
// start, the entrance this game already had (difficulty, Play, How to play)
// carries on unchanged.
//
// On a phone the words stack over the picture; on a landscape PC box they sit
// in the start-side column and the loop takes the other side - which side is
// the reading direction's, so the Hebrew app mirrors it.
//
// The crowd is Neon Survival's sheets, as the arena's is (`cast.ts`); the snake
// is drawn here in the arena's own two inks, mint at the head to violet at the
// tail, and the gems in their three values' colours.

import { useMemo, type ReactElement, type ReactNode } from "react";
import { ArcadeTitle, titleLines, type TitleBox } from "@ui/ArcadeTitle";
import { mulberry32 } from "@shared/rng";
import { Sprite, layer, type FrameId } from "../survivors/entrance/sprite";

const HEAD = 0x55efc4;
const TAIL = 0x6c5ce7;

/** A colour between the head's mint and the tail's violet. */
function mix(a: number, b: number, t: number): string {
  const p = (c: number, s: number) => (c >> s) & 255;
  const m = (s: number) => Math.round(p(a, s) + (p(b, s) - p(a, s)) * t);
  return `rgb(${m(16)},${m(8)},${m(0)})`;
}

/** The question mark in a circle, for How to play. */
const HELP = (
  <svg aria-hidden="true" width={22} height={22} viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth={2.4} strokeLinecap="round">
    <circle cx="12" cy="12" r="10" />
    <path d="M9.3 9.2a2.8 2.8 0 1 1 3.9 2.6c-.8.4-1.2 1-1.2 1.8v.6" />
    <circle cx="12" cy="17.6" r=".6" fill="#fff" />
  </svg>
);

/** The picture: the dark grid, the gems, the crowd inside and outside the loop, and the snake closing it. */
function SnakeTitleArt({ w: W, h: H, wide, rtl }: TitleBox): ReactElement {
  const drawn = useMemo(() => {
    // The mock's geometry, scaled by the box's shorter side so any phone gets
    // the same composition. The loop sits on the end side of a landscape box.
    const u = wide ? H / 479 : Math.min(W / 358, H / 756);
    const endX = rtl ? 0.3 : 0.7;
    const cx = wide ? W * endX : W / 2;
    const cy = wide ? H * 0.52 : H * 0.5;
    const R = (wide ? 150 : 116) * u;
    const ry = R * (wide ? 0.8 : 1.05);
    const sc = (wide ? 1.8 : 1.9) * u;
    const colX = wide ? W * (rtl ? 0.74 : 0.26) : W / 2;
    const r = mulberry32(20260927);

    const grid: ReactNode[] = [];
    for (let x = 20; x < W; x += 40) grid.push(<line key={`x${x}`} x1={x} y1={0} x2={x} y2={H} stroke="#161b3d" />);
    for (let y = 20; y < H; y += 40) grid.push(<line key={`y${y}`} x1={0} y1={y} x2={W} y2={y} stroke="#161b3d" />);
    for (let i = 0; i < (W * H) / 6000; i++) grid.push(<circle key={`d${i}`} cx={r() * W} cy={r() * H} r={1.3} fill="#2a3170" />);

    // The loop: a wobbly ring that nearly closes, the head coming back round to
    // the body, and a tail that curls out and away from where it began.
    const N = 170;
    const loop: [number, number][] = [];
    for (let i = 0; i < N; i++) {
      const t = i / (N - 1);
      const a = -Math.PI * 0.55 - t * Math.PI * 1.9;
      const k = 1 + 0.07 * Math.sin(t * 17);
      loop.push([cx + Math.cos(a) * R * k, cy + Math.sin(a) * ry * k]);
    }
    const tail: [number, number][] = [];
    let [qx, qy] = loop[0];
    const tg = Math.atan2(loop[0][1] - loop[1][1], loop[0][0] - loop[1][0]);
    const nm = Math.atan2(loop[0][1] - cy, loop[0][0] - cx);
    let ta = Math.atan2(Math.sin(tg) + 0.9 * Math.sin(nm), Math.cos(tg) + 0.9 * Math.cos(nm));
    for (let i = 0; i < 52; i++) {
      ta += 0.045 * Math.sin(i / 8 + 1);
      qx += Math.cos(ta) * 2.4 * u;
      qy += Math.sin(ta) * 2.4 * u;
      tail.push([qx, qy]);
    }
    const body = loop.slice().reverse().concat(tail);

    // Gems, kept off the loop and off the words: blue 1, red 2, gold 3.
    const gemC = ["#74b9ff", "#ff7675", "#ffd166"];
    const gems: ReactNode[] = [];
    for (let i = 0; i < 26; i++) {
      const gx = 14 + r() * (W - 28);
      const gy = 14 + r() * (H - 28);
      if (Math.hypot((gx - cx) / R, (gy - cy) / ry) < 1.2) continue;
      if (wide ? Math.abs(gx - colX) < W * 0.2 : gy < H * 0.33 || gy > H - 190 * u) continue;
      const c = gemC[i % 7 === 0 ? 2 : i % 4 === 0 ? 1 : 0];
      const z = 5 + (c === "#ffd166" ? 2 : 0);
      gems.push(<path key={`g${i}`} d={`M${gx} ${gy - z} L${gx + z * 0.75} ${gy} L${gx} ${gy + z} L${gx - z * 0.75} ${gy} Z`} fill={c} stroke="#dff1ff" strokeWidth={1} />);
    }

    // The crowd: caught inside the loop, and more coming from outside it.
    const inside: [number, number, FrameId, number][] = [[-0.42, -0.28, "bat", 1], [0.36, -0.3, "slime", 1], [-0.34, 0.34, "crab", 1], [0.38, 0.3, "batFly", 0.9], [0, 0.02, "golem", 1.4]];
    const outsideFr: [number, number, FrameId][] = wide
      ? [[0.52, 0.12, "slime"], [0.93, 0.14, "bat"], [0.97, 0.52, "crab"], [0.9, 0.9, "slime"], [0.52, 0.9, "batFly"], [0.06, 0.1, "bat"], [0.06, 0.9, "crab"]]
      : [[0.13, 0.31, "bat"], [0.12, 0.72, "crab"], [0.88, 0.73, "bat"], [0.86, 0.37, "slime"]];
    const outside = outsideFr.map(([fx, fy, f]) => [wide && rtl ? 1 - fx : fx, fy, f] as const);
    const crowd = [
      ...inside.map(([dx, dy, f, k], i) => <Sprite key={`i${i}`} f={f} cx={cx + dx * R} cy={cy + dy * ry} h={36 * k * u} flip={dx > 0} />),
      ...outside.map(([fx, fy, f], i) => <Sprite key={`o${i}`} f={f} cx={W * fx} cy={H * fy} h={34 * u} flip={fx > 0.5} op={0.92} />),
    ];

    // The snake, tail first so the head is on top.
    const n = body.length;
    const rad = (i: number) => {
      const t = i / (n - 1);
      return 6 * sc * (1.18 - 0.8 * t * t);
    };
    const snake: ReactNode[] = [];
    for (let i = n - 1; i >= 0; i--) snake.push(<circle key={`b${i}`} cx={body[i][0]} cy={body[i][1]} r={rad(i)} fill={mix(HEAD, TAIL, Math.pow(i / (n - 1), 0.6))} />);
    for (let i = n - 1; i >= 4; i -= 7) {
      const [x0, y0] = body[i];
      const [x1, y1] = body[i - 2];
      const d = Math.atan2(y1 - y0, x1 - x0);
      snake.push(<circle key={`h${i}`} cx={x0 - Math.sin(d) * rad(i) * 0.35} cy={y0 + Math.cos(d) * rad(i) * 0.35 - rad(i) * 0.25} r={rad(i) * 0.32} fill="#fff" opacity={0.35} />);
    }
    const [hx, hy] = body[0];
    const [px, py] = body[4];
    const hd = Math.atan2(hy - py, hx - px);
    const HR = 9 * sc;
    snake.push(<circle key="head" cx={hx} cy={hy} r={HR} fill="#55efc4" />);
    snake.push(<circle key="shine" cx={hx - Math.cos(hd) * 2} cy={hy - Math.sin(hd) * 2 - 4} r={HR * 0.45} fill="#fff" opacity={0.25} />);
    for (const k of [-1, 1]) {
      const ex = hx + Math.cos(hd) * 3 * sc - Math.sin(hd) * 4.2 * sc * k;
      const ey = hy + Math.sin(hd) * 3 * sc + Math.cos(hd) * 4.2 * sc * k;
      snake.push(<circle key={`e${k}`} cx={ex} cy={ey} r={2.6 * sc} fill="#fff" />);
      snake.push(<circle key={`p${k}`} cx={ex + Math.cos(hd) * sc} cy={ey + Math.sin(hd) * sc} r={1.3 * sc} fill="#0b0e22" />);
    }
    // The closing spark, just ahead of the head where it meets its own body.
    const sx = hx + Math.cos(hd) * HR * 1.9;
    const sy = hy + Math.sin(hd) * HR * 1.9;
    const spark: ReactNode[] = [];
    for (let a = 0; a < 8; a++) {
      const t = (a / 8) * Math.PI * 2;
      spark.push(<line key={a} x1={sx + Math.cos(t) * 8 * u} y1={sy + Math.sin(t) * 8 * u} x2={sx + Math.cos(t) * 19 * u} y2={sy + Math.sin(t) * 19 * u} stroke="#fff" strokeWidth={3} strokeLinecap="round" />);
    }
    const lit = `M${loop.map((p) => `${p[0].toFixed(1)} ${p[1].toFixed(1)}`).join(" L")} Z`;
    return { grid, gems, crowd, snake, spark, lit };
  }, [W, H, wide, rtl]);

  return (
    <div aria-hidden="true" style={layer}>
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ ...layer, display: "block" }}>
        <defs>
          <radialGradient id="snake-title-lit">
            <stop offset="0" stopColor="#55efc4" stopOpacity=".34" />
            <stop offset="1" stopColor="#55efc4" stopOpacity=".07" />
          </radialGradient>
        </defs>
        <rect width={W} height={H} fill="#0b0e22" />
        {drawn.grid}
        <path d={drawn.lit} fill="url(#snake-title-lit)" />
        <g style={{ filter: "drop-shadow(0 0 5px #74b9ff)" }}>{drawn.gems}</g>
        <rect x={3} y={3} width={W - 6} height={H - 6} rx={14} fill="none" stroke="#6c5ce7" strokeWidth={6} opacity={0.55} />
      </svg>
      {drawn.crowd}
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ ...layer, filter: "drop-shadow(0 0 6px #55efc4) drop-shadow(0 0 16px #55efc488)" }}>
        {drawn.snake}
      </svg>
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ ...layer, filter: "drop-shadow(0 0 6px #55efc4)" }}>
        {drawn.spark}
      </svg>
    </div>
  );
}

export function SnakeTitle(props: { name: string; tagline: string; locale: string; tap: string; how: string; onStart: () => void; onHow: () => void }): ReactElement {
  const lines = titleLines(props.name, props.locale).map((text, i) =>
    i === 0 ? { text, glow: "#55efc4", fill: "#eafff8" } : { text, glow: "#6c5ce7", fill: "#efeaff" },
  );
  return (
    <ArcadeTitle
      label={props.name}
      lines={lines}
      tagline={props.tagline}
      action={props.tap}
      onAction={props.onStart}
      accent="#55efc4"
      ink="#241c17"
      light="#d6fff3"
      secondary={{ label: props.how, onPress: props.onHow, icon: HELP }}
      split
    >
      {(box) => <SnakeTitleArt {...box} />}
    </ArcadeTitle>
  );
}
