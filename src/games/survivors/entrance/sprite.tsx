// The cast on the TITLE screens - Neon's and Snake Survivors', which borrows
// the same five sheets - drawn in the DOM from the SAME sprite sheets the arena
// animates, one frame cropped by an SVG viewBox (the castArt.tsx approach).
//
// castArt.tsx carries three idle crops; the title needs five more (the robot
// firing, a bat mid-flap, the crab, the golem). The boxes are each frame's
// painted pixels, MEASURED off the sheets for the approved mock (scratchpad
// entrance-mock/bbox.mjs, 2026-09-30); robot, bat and slime came out
// identical to castArt's own measured boxes, which is the check that the other
// four were measured the same way.
//
// Each shape GLOWS in its own colour (games doctrine: an effect is drawn in the
// object's own colour), and the glow is a CSS drop-shadow on an HTML <svg> -
// never an SVG filter reference, so there is no id to collide between the two
// titles or between two mounts.

import type { ReactElement } from "react";

const SHEET = {
  robot: { url: new URL("../sprites/robot.png", import.meta.url).href, w: 2450, h: 1650 },
  bat: { url: new URL("../sprites/bat.png", import.meta.url).href, w: 1650, h: 1300 },
  slime: { url: new URL("../sprites/slime.png", import.meta.url).href, w: 1850, h: 875 },
  crab: { url: new URL("../sprites/crab.png", import.meta.url).href, w: 1600, h: 1150 },
  golem: { url: new URL("../sprites/golem.png", import.meta.url).href, w: 3100, h: 1750 },
} as const;

/** One frame: its sheet, and the crop x, y, w, h in sheet pixels. */
const FRAME = {
  robot: ["robot", 175, 10, 165, 240],
  robotShoot: ["robot", 670, 670, 210, 240],
  bat: ["bat", 65, 65, 200, 135],
  batFly: ["bat", 395, 585, 210, 135],
  slime: ["slime", 85, 55, 195, 115],
  crab: ["crab", 60, 45, 200, 150],
  golem: ["golem", 170, 35, 280, 305],
} as const satisfies Record<string, readonly [keyof typeof SHEET, number, number, number, number]>;

export type FrameId = keyof typeof FRAME;

/** Each shape's own glow - the arena's inks for them. */
const GLOW: Record<FrameId, string> = {
  robot: "#3de8ff",
  robotShoot: "#3de8ff",
  bat: "#9b7bff",
  batFly: "#9b7bff",
  slime: "#7bd88f",
  crab: "#ff6b5b",
  golem: "#9fb3d9",
};

/**
 * One cast member, centred on (cx, cy), `h` px tall, pixels kept hard.
 * `glow: false` draws it plain; a string overrides the shape's own colour.
 */
export function Sprite(props: { f: FrameId; cx: number; cy: number; h: number; glow?: string | false; flip?: boolean; op?: number }): ReactElement {
  const [sheet, x, y, w, hh] = FRAME[props.f];
  const s = SHEET[sheet];
  const wpx = (props.h * w) / hh;
  const g = props.glow === false ? null : props.glow ?? GLOW[props.f];
  return (
    <svg
      aria-hidden="true"
      viewBox={`${x} ${y} ${w} ${hh}`}
      preserveAspectRatio="xMidYMid meet"
      style={{
        position: "absolute",
        display: "block",
        overflow: "hidden",
        left: props.cx - wpx / 2,
        top: props.cy - props.h / 2,
        width: wpx,
        height: props.h,
        filter: g ? `drop-shadow(0 0 ${Math.max(3, props.h * 0.05)}px ${g}) drop-shadow(0 0 ${Math.max(6, props.h * 0.12)}px ${g}99)` : undefined,
        opacity: props.op,
        transform: props.flip ? "scaleX(-1)" : undefined,
      }}
    >
      <image href={s.url} width={s.w} height={s.h} style={{ imageRendering: "pixelated" }} />
    </svg>
  );
}

/** A layer that fills its box, for sprites and drawings placed in px. */
export const layer = { position: "absolute", inset: 0 } as const;
