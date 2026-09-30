// The cast, drawn in the DOM - the robot standing on the career map, wearing its
// gear, on the entrance tiles - from the SAME sheets the arena animates.
//
// One frame (idle 0), cropped by an SVG viewBox rather than re-exported as a
// picture: a second copy of the robot would be a second robot to keep in step with
// the studio's. The crop boxes are the frame's painted pixels, MEASURED off the
// sheets with Pillow on 2026-09-29 (robot idle_0000 bbox 175,10 - 340,250 in a
// 490x330 frame at 0,0 of a 2450x1650 sheet), so the character fills its box
// instead of floating in the frame's empty margin. `meet` keeps its shape in a box
// of any shape - the map, the gear ring and the shop each hand it a different one.

import type { CSSProperties, ReactElement } from "react";

const SHEET = {
  robot: { url: new URL("./sprites/robot.png", import.meta.url).href, w: 2450, h: 1650, box: "175 10 165 240" },
  bat: { url: new URL("./sprites/bat.png", import.meta.url).href, w: 1650, h: 1300, box: "65 65 200 135" },
  slime: { url: new URL("./sprites/slime.png", import.meta.url).href, w: 1850, h: 875, box: "85 55 195 115" },
} as const;

export type CastName = keyof typeof SHEET;

/** One cast member, as large as fits its box, centred, pixels kept hard. */
export function CastArt({ who, width = "100%", height = "100%", style }: { who: CastName; width?: number | string; height?: number | string; style?: CSSProperties }): ReactElement {
  const s = SHEET[who];
  return (
    <svg aria-hidden="true" viewBox={s.box} width={width} height={height} preserveAspectRatio="xMidYMid meet" style={{ display: "block", overflow: "hidden", ...style }}>
      <image href={s.url} width={s.w} height={s.h} style={{ imageRendering: "pixelated" }} />
    </svg>
  );
}

/**
 * The robot filling whatever box it is put in - what the kit's screens call `hero`.
 * `filter` is a worn look's CSS (diamondShelf.ts LOOKS), a hue turn on the same sheet.
 */
export const RobotFill = ({ filter }: { filter?: string } = {}): ReactElement => <CastArt who="robot" style={filter ? { filter } : undefined} />;
