// Neon Survival's TITLE CARD pieces: the key art, the name in two glowing
// lines (the first in the robot's ice, the second in the city's pink), and the
// inks its title and its game-over card share. Approved off the mock,
// 2026-09-30; on 2026-10-01 ("one-screen start, all four") the title gained the
// difficulty chips, a big PLAY that starts a quick run on the last-used weapon,
// and two pills - the weapon pick and the Career map - and the Career / Quick
// run cards screen it used to lead to went away.
//
// The card is the shared one (`@ui/ArcadeTitle`, drawn by `ArcadeChrome`'s
// entrance), so this file owns only what is Neon's: the picture and the colours.

import type { ReactElement } from "react";
import type { TitleBox, TitleInks, TitleLine } from "@ui/ArcadeTitle";
import { NeonTitleArt } from "./neonArt";
import { K } from "../careerArt";

/** Neon's inks on its title card (the mock's "neon" theme). */
export const NEON_INKS: TitleInks = {
  accent: "#ffd166",
  ink: K,
  light: "#ffe9b0",
  chip: "rgba(20, 14, 12, 0.88)",
  sel: "#ffe9f8",
  selRing: "#ff4fd8",
  panel: "rgba(11, 13, 31, 0.88)",
  line: "#2a2f55",
  gold: "#ffd166",
};

/** A heading in the title's two glows: ice, then pink. */
export function neonLines(texts: string[]): TitleLine[] {
  return texts.map((text, i) => (i === 0 ? { text, glow: "#3de8ff", fill: "#ffffff" } : { text, glow: "#ff4dd2", fill: "#ffe3f6" }));
}

/**
 * The key art, with the mock's dark fade along the bottom so the chips, PLAY and
 * the pills read on it: the lowest 36% of a phone, 46% of a PC.
 */
export function neonArt(box: TitleBox): ReactElement {
  return (
    <>
      <NeonTitleArt w={box.w} h={box.h} wide={box.wide} />
      <div
        aria-hidden="true"
        style={{
          position: "absolute",
          insetInline: 0,
          bottom: 0,
          height: box.wide ? "46%" : "36%",
          background: "linear-gradient(transparent, rgba(11, 13, 31, 0.82))",
        }}
      />
    </>
  );
}

/** The Career pill's crown, in gold. */
export const CROWN = (
  <svg aria-hidden="true" width="100%" height="100%" viewBox="0 0 16 16">
    <path d="M2 12.5l-.8-7 3.6 3.2L8 3.5l3.2 5.2 3.6-3.2-.8 7z" fill="#ffd166" />
  </svg>
);
