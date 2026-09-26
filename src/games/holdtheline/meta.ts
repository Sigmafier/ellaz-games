import type { GameMeta } from "@sdk/index";

// DOM-free metadata. `portal/games.ts` imports this statically, so the home grid
// renders without pulling React, Phaser or any game code into the shell - which
// is also why this file MUST NOT import an asset (`assert-tier.mjs` enforces it:
// a sheet imported here lands in the shell chunk every child downloads before
// choosing anything).
//
// `ageBand: "all"` rather than "kids", and that is a judgement rather than a
// formality: a child can play a siege, but the thing being played is not aimed
// at a five-year-old. Nothing is gated on the band - it says who the game is
// FOR, which is the field the outside world reads, and CrazyGames keys its
// rejection on the AUDIENCE rather than on which shelf we file it under.
//
// It also means this game is NOT bound by the DirectionPad law, which binds
// `ageBand: "kids"` only. Nothing here steers - the player aims - so there is
// nothing for it to bind.
//
// `category: "speed"` is survivors' shelf. "classics" is for the mechanics
// everybody already knows (2048, minesweeper, bubbleshooter) and this is not
// that to a child.
//
// `orientation: "landscape"` is a DECLARATION and is read by nothing that ships
// - `src/build/factSheet.ts` prints it on the page and that is all. The
// landscape that matters is enforced by the arena, which is a property of the
// RUN (`logic.ts` § LANE).
//
// `color` is NOT YET MEASURED against the tile grid or `contrast.test.ts`, in
// either theme. A literal-against-a-token has two contrast values and only one
// of them gets checked - see
// `.claude/rules/a-contrast-floor-is-a-floor-not-a-target.md` § the 2026-09-21
// chess instance - so this gets read off a rendered tile before it is believed.
export const meta: GameMeta = {
  id: "holdtheline",
  title: { he: "להחזיק את הקו", en: "Hold the Line", es: "Aguanta la línea", sv: "Håll linjen" },
  emoji: "🏰",
  color: "#B4541E",
  ageBand: "all",
  category: "speed",
  orientation: "landscape",
  renderer: "phaser",
  tier: "showcase",
  ownsChrome: true,
  scoreUnit: "points",
  beta: true,
};
