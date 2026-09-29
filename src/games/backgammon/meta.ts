import type { GameMeta } from "@sdk/index";

// DOM-free metadata: the portal catalog imports this statically so the home grid
// renders without pulling React/Phaser into the shell bundle.
export const meta: GameMeta = {
  id: "backgammon",
  title: { he: "שש בש", en: "Backgammon", es: "Backgammon", sv: "Backgammon" },
  emoji: "🎲",
  color: "#c0703f",
  ageBand: "all",
  category: "classics",
  orientation: "any",
  renderer: "dom",
  tier: "simple",
  layout: "table",
  ownsChrome: true,
  // Matches won, per difficulty. A single GAME inside a match is not the unit
  // a player remembers - the match to 5 is - so the record counts matches.
  scoreUnit: "points",
  // Beta while you play them live. It is a DECLARATION and nothing else -
  // the rules are proven by perft and the match tests, and the badge is not
  // about correctness. It says these two have never been played by a stranger
  // on a real phone, which is exactly what this deploy is for. It comes off
  // once the difficulty labels have been ruled on.
  beta: true,
};
