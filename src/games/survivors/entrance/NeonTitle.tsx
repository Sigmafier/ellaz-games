// Neon Survival's TITLE: the key art, the name in two glowing lines (the first
// in the robot's ice, the second in the city's pink), and one Tap to start,
// which goes on to the mode cards. Approved off the mock, 2026-09-30.
//
// The shell is the shared one (`@ui/ArcadeTitle`), so this file owns only what
// is Neon's: the picture and the two colours.

import type { ReactElement } from "react";
import { ArcadeTitle, titleLines } from "@ui/ArcadeTitle";
import { NeonTitleArt } from "./neonArt";
import { K } from "../careerArt";

export function NeonTitle(props: { name: string; locale: string; tap: string; onStart: () => void }): ReactElement {
  const lines = titleLines(props.name, props.locale).map((text, i) =>
    i === 0 ? { text, glow: "#3de8ff", fill: "#ffffff" } : { text, glow: "#ff4dd2", fill: "#ffe3f6" },
  );
  return (
    <ArcadeTitle label={props.name} lines={lines} action={props.tap} onAction={props.onStart} accent="#ffd166" ink={K} light="#ffffff">
      {(box) => <NeonTitleArt w={box.w} h={box.h} wide={box.wide} />}
    </ArcadeTitle>
  );
}
