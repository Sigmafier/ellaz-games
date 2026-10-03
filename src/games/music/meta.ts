import type { GameMeta } from "@sdk/index";

// DOM-free metadata: the portal catalog imports this statically so the home grid
// renders without pulling React/Phaser into the shell bundle.
//
// The first game in the `create` section, which has been declared in
// `CATEGORY_ORDER` and empty since the catalogue was written.
//
// Not `echo`, the repeat-after-me game, even though both make notes. There the
// app plays and the child copies, and a wrong tap ends the run; here the child
// plays and nothing can be wrong. The header of `logic.ts` carries the full
// comparison.
//
// The tune, the scale and the three voices are ours. A grid of notes is as old
// as notation and nothing here quotes anybody's instrument, artwork or name.
export const meta: GameMeta = {
  id: "music",
  title: { he: "תיבת נגינה", en: "Music Box", es: "Caja de música", sv: "Speldosa" },
  emoji: "🎵",
  // A deep rose nothing else in the roster uses - the pinks here are all light
  // (memory, pet, wordguess) and this is two steps down from them, clearing the
  // 4.5 ink floor at 5.87 with the white ink `inkFor` picks
  // (`ui/contrast.test.ts`).
  color: "#c2185b",
  ageBand: "kids",
  category: "create",
  orientation: "any",
  renderer: "dom",
  tier: "simple",
  layout: "table",
  ownsChrome: true,
  // NO `scoreUnit`, and on purpose (operator ruling 2026-10-03): like
  // `coloring`, this toy keeps no record and pays no coins - ranking a tune a
  // child made is judging it. `score-unit-declared.test.ts` names this game
  // beside coloring, so adding a unit back reds a test somebody has to delete.
};
