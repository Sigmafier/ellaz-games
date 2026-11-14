import type { GameMeta } from "@sdk/index";

// DOM-free metadata: the portal catalog imports this statically so the home grid
// renders without pulling React into the shell bundle.
//
// The second game in `create`, beside `music`. Music Box is a looping grid you
// draw a tune on; this is an instrument you play, plus a songs mode that waits
// on the next note of a children's song and never ends a run on a miss. The
// header of `logic.ts` carries the whole comparison.
//
// ageBand "all": the basic keyboard is ten coloured keys a four-year-old can
// hit, and the pro one is two sliding octaves with a sustain switch.
export const meta: GameMeta = {
  id: "piano",
  title: { he: "פסנתר", en: "Piano", es: "Piano", sv: "Piano" },
  emoji: "🎹",
  // A deep teal nothing else in the roster wears; white ink on it clears the
  // 4.5 floor (`ui/contrast.test.ts` reads every meta colour).
  color: "#00796b",
  ageBand: "all",
  category: "create",
  orientation: "any",
  renderer: "dom",
  tier: "simple",
  layout: "table",
  ownsChrome: true,
  // NO `scoreUnit`: free play keeps no record, like `music` - ranking what a
  // child plays is judging it. Finishing a song pays a `level_complete`, and
  // that is a reward, not a record. `score-unit-declared.test.ts` names this
  // game in its scoreless list.
};
