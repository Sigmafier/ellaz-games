import type { GameMeta } from "@sdk/index";

// DOM-free metadata: the portal catalog imports this statically so the home grid
// renders without pulling React/Phaser into the shell bundle.
export const meta: GameMeta = {
  id: "chess",
  title: { he: "שחמט", en: "Chess", es: "Ajedrez", sv: "Schack" },
  emoji: "♟️",
  color: "#8d6e63",
  // NOT `kids`. Chess has no floor - a five-year-old can move the pieces - but
  // `ageBand` is who the game is FOR, and this one is for anybody who wants a
  // real game. The shelf below is where it SITS.
  ageBand: "all",
  category: "classics",
  orientation: "any",
  renderer: "dom",
  tier: "simple",
  ownsChrome: true,
  // The record is the longest run of wins in a row, per difficulty - the same
  // thing tictactoe keeps, for the same reason: three strengths are three
  // different opponents and one number across them means nothing.
  scoreUnit: "points",
  // Beta while you play them live. It is a DECLARATION and nothing else -
  // the rules are proven by perft and the match tests, and the badge is not
  // about correctness. It says these two have never been played by a stranger
  // on a real phone, which is exactly what this deploy is for. It comes off
  // once the difficulty labels have been ruled on.
  beta: true,
};
