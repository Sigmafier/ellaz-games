// The career kit's picture set: SVG only, never an emoji.
//
// Drawn on a 48-unit box centred on 0,0, in the approved P0 mock's shapes
// (scratchpad career-p0/p0.html, ruled "Yes, build it" 2026-09-29), with the
// same ink outline on every one so a heart, a sword and a lock read as one set.
// These are GAME art - fixed colours, never theme tokens - because they sit on
// the career screens' own dark floor in every theme, and a token that flips
// with the theme against a literal that does not is the two-contrast trap in
// .claude/rules/a-contrast-floor-is-a-floor-not-a-target.md.

import type { ReactElement } from "react";

import { P } from "./palette";

/** the one outline every career picture is drawn with */
export const INK = P.ink;

const s = { stroke: INK, strokeWidth: 2.5, strokeLinejoin: "round" as const };

const DRAW = {
  heart: (c = "#ff5c7a") => <path d="M0 10 C-18 -4 -12 -20 0 -10 C12 -20 18 -4 0 10 Z" transform="scale(1.3)" fill={c} {...s} />,
  bolt: (c = "#ffd166") => <path d="M4 -22 L-12 4 L0 4 L-4 22 L12 -4 L0 -4 Z" fill={c} {...s} />,
  magnet: () => (
    <g>
      <path d="M-14 -6 V4 A14 14 0 0 0 14 4 V-6 H6 V4 A6 6 0 0 1 -6 4 V-6 Z" fill="#ff6b6b" {...s} />
      <rect x="-14" y="-14" width="8" height="8" fill="#dfe6e9" stroke={INK} strokeWidth={2} />
      <rect x="6" y="-14" width="8" height="8" fill="#dfe6e9" stroke={INK} strokeWidth={2} />
    </g>
  ),
  shield: (c = "#74b9ff") => (
    <g>
      <path d="M0 -20 L16 -13 V0 C16 12 8 18 0 22 C-8 18 -16 12 -16 0 V-13 Z" fill={c} {...s} />
      <path d="M0 -12 V14" stroke="#ffffff88" strokeWidth={3} />
    </g>
  ),
  boot: () => (
    <g>
      <path d="M-10 -18 H4 V2 L16 6 V14 H-12 Z" fill="#55efc4" {...s} />
      <path d="M-20 -6 H-12 M-22 2 H-12" stroke="#fff" strokeWidth={3} strokeLinecap="round" />
    </g>
  ),
  revive: () => (
    <g>
      <circle r="17" fill="#fd79a8" {...s} />
      <path d="M-9 0 H9 M0 -9 V9" stroke="#fff" strokeWidth={5} strokeLinecap="round" />
    </g>
  ),
  clover: () => (
    <g>
      {[0, 90, 180, 270].map((a) => <circle key={a} cx="0" cy="-8" r="8" fill="#2bb58a" stroke={INK} strokeWidth={2.5} transform={`rotate(${a})`} />)}
      <circle r="5" fill="#55efc4" />
      <path d="M2 6 Q6 16 12 20" stroke={INK} strokeWidth={3} fill="none" />
    </g>
  ),
  crown: (c = "#ffd166") => <path d="M-16 8 L-18 -10 L-8 -2 L0 -16 L8 -2 L18 -10 L16 8 Z" fill={c} {...s} />,
  gold: () => (
    <g>
      <rect x="-9" y="-9" width="18" height="18" rx="4" fill="#ffd34d" stroke="#6b4a00" strokeWidth={2.5} />
      <path d="M-4 -4 L2 -4" stroke="#ffffff99" strokeWidth={2.5} strokeLinecap="round" />
    </g>
  ),
  lock: () => (
    <g>
      <rect x="-9" y="-2" width="18" height="14" rx="3" fill="#b2bec3" {...s} />
      <path d="M-5 -2 V-7 A5 5 0 0 1 5 -7 V-2" fill="none" stroke={INK} strokeWidth={2.5} />
    </g>
  ),
  star: (c = "#ffd166") => <path d="M0 -10 L3 -3 L10 -3 L4 2 L6 10 L0 5 L-6 10 L-4 2 L-10 -3 L-3 -3 Z" fill={c} stroke={INK} strokeWidth={2} />,
  sword: (c = "#dfe6e9") => (
    <g>
      <path d="M-2 -24 L2 -24 L4 6 L-4 6 Z" fill={c} {...s} />
      <rect x="-12" y="6" width="24" height="5" rx="2" fill="#ffd166" {...s} />
      <rect x="-3" y="11" width="6" height="10" rx="2" fill="#8a5a2b" {...s} />
    </g>
  ),
  armor: (c = "#74b9ff") => (
    <g>
      <path d="M-16 -16 L-6 -20 Q0 -14 6 -20 L16 -16 L20 -4 L13 -2 L13 18 L-13 18 L-13 -2 L-20 -4 Z" fill={c} {...s} />
      <path d="M-6 0 H6 M-6 8 H6" stroke="#ffffff88" strokeWidth={3} strokeLinecap="round" />
    </g>
  ),
  ring: (c = "#ffd166") => (
    <g>
      <circle cy="6" r="13" fill="none" stroke={INK} strokeWidth={9} />
      <circle cy="6" r="13" fill="none" stroke={c} strokeWidth={5} />
      <path d="M0 -20 L9 -10 L0 -2 L-9 -10 Z" fill="#ff5ce1" {...s} />
    </g>
  ),
  cart: () => (
    <g>
      <path d="M-22 -14 H-14 L-8 8 H14 L19 -8 H-12" fill="none" stroke={INK} strokeWidth={3} strokeLinejoin="round" />
      <path d="M-11 -7 H18 L14 6 H-7 Z" fill="#ffd166" {...s} />
      <circle cx="-6" cy="15" r="4" fill="#fff" stroke={INK} strokeWidth={2.5} />
      <circle cx="12" cy="15" r="4" fill="#fff" stroke={INK} strokeWidth={2.5} />
    </g>
  ),
  chart: () => (
    <g>
      <rect x="-18" y="0" width="9" height="16" fill="#6c5ce7" stroke={INK} strokeWidth={2.5} />
      <rect x="-4.5" y="-10" width="9" height="26" fill="#55efc4" stroke={INK} strokeWidth={2.5} />
      <rect x="9" y="-18" width="9" height="34" fill="#ffd166" stroke={INK} strokeWidth={2.5} />
    </g>
  ),
  play: (c = "#fff") => <path d="M-9 -13 L14 0 L-9 13 Z" fill={c} stroke={INK} strokeWidth={3} strokeLinejoin="round" />,
  back: () => <path d="M10 0 H-10 M-2 -9 L-11 0 L-2 9" stroke={INK} strokeWidth={4} fill="none" strokeLinecap="round" strokeLinejoin="round" />,
  swap: () => (
    <path d="M-12 -6 H10 M4 -12 L10 -6 L4 0 M12 6 H-10 M-4 0 L-10 6 L-4 12" stroke={INK} strokeWidth={3.5} fill="none" strokeLinecap="round" strokeLinejoin="round" />
  ),
  bag: () => (
    <g>
      <path d="M-16 -10 H16 L20 18 H-20 Z" fill="#b8742a" stroke={INK} strokeWidth={3} />
      <path d="M-8 -10 V-16 A8 8 0 0 1 8 -16 V-10" fill="none" stroke={INK} strokeWidth={3} />
    </g>
  ),
  box: () => <rect x="-14" y="-14" width="28" height="28" rx="6" fill="#dfe6e9" {...s} />,
  // P4: the site-wide diamond, and a small robot a look recolours (the shelf's capsules).
  gem: () => (
    <g>
      <path d="M-9 -7 H9 L13 -1 L0 13 L-13 -1 Z" fill="#7fd4ff" stroke="#0b1a33" strokeWidth={2.5} strokeLinejoin="round" />
      <path d="M-13 -1 H13 M-4 -7 L0 13 L4 -7" fill="none" stroke="#0b1a33" strokeWidth={1.4} opacity={0.55} />
    </g>
  ),
  bot: (c = "#e84343") => (
    <g stroke={INK} strokeWidth={2.5}>
      <path d="M0 -20 V-14" />
      <rect x="-11" y="-14" width="22" height="14" rx="2" fill={c} />
      <rect x="-6" y="-10" width="4" height="4" fill="#241c17" strokeWidth={0} />
      <rect x="2" y="-10" width="4" height="4" fill="#241c17" strokeWidth={0} />
      <rect x="-13" y="0" width="26" height="14" rx="2" fill={c} />
      <rect x="-9" y="14" width="6" height="6" fill={c} />
      <rect x="3" y="14" width="6" height="6" fill={c} />
    </g>
  ),
  botGold: () => DRAW_BOT("#ffd166"),
  botIce: () => DRAW_BOT("#bdefff"),
} satisfies Record<string, (c?: string) => ReactElement>;

function DRAW_BOT(c: string): ReactElement {
  return DRAW.bot(c);
}

export type CareerIconName = keyof typeof DRAW;

/** how much an icon is scaled inside its box: the small square ones are drawn at half size */
const GROW: Partial<Record<CareerIconName, number>> = { gold: 2.1, star: 2.1, lock: 1.8 };

export const isCareerIcon = (name: string): name is CareerIconName => Object.prototype.hasOwnProperty.call(DRAW, name);

/** the icon's SHAPES only, for drawing inside an SVG the caller owns; unknown names draw a plain box */
export function iconShapes(name: string, color?: string): ReactElement {
  if (!isCareerIcon(name)) return DRAW.box();
  const draw: (c?: string) => ReactElement = DRAW[name];
  return draw(color);
}

/** one icon as its own `<svg>`, `size` px square; always decorative - the control around it carries the name */
export function CareerIcon({ name, size, color }: { name: string; size: number; color?: string }): ReactElement {
  const grow = isCareerIcon(name) ? GROW[name] ?? 1 : 1;
  return (
    <svg width={size} height={size} viewBox="-24 -24 48 48" aria-hidden="true" focusable="false" style={{ display: "block", overflow: "visible" }}>
      <g transform={`scale(${grow})`}>{iconShapes(name, color)}</g>
    </svg>
  );
}
