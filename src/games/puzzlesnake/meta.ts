import type { GameMeta } from "@sdk/index";

// DOM-free metadata: the portal roster imports this statically, so nothing here
// may reach React, an asset or another module of this game.
//
// The Snake family's third game (2026-09-28), after `snake` and
// `snakesurvivors`: the same neon snake on the same dark board, turned into a
// puzzle. Nothing moves until a press, you can never lose, and twelve fixed
// levels in two worlds are solved in as few presses as you can manage.
//
// `ageBand: "all"`, deliberately, although nothing here can hurt a child: the
// Maze world is built so that a player who always goes for the nearest apple
// gets stuck (`solver.test.ts` holds that), and planning four apples ahead
// with your own body in the way is not a five-year-old's puzzle. The D-pad
// keeps it tap-completable for anyone who wants to try.
//
// `category: "think"` - the shelf for puzzles with no clock (flow, onestroke,
// untangle, sort). Not `classics` beside its two siblings: a classic is a game
// people already know by name, and this one is ours.
//
// `scoreUnit: "moves"` - a solve is reported as the presses it took, per level,
// and fewer is better. `score-unit-declared.test.ts` pins it to the renderer.
export const meta: GameMeta = {
  id: "puzzlesnake",
  title: { he: "נחש חידות", en: "Puzzle Snake", es: "Serpiente enigma", sv: "Pusselorm" },
  emoji: "🐍",
  color: "#5646C9",
  ageBand: "all",
  category: "think",
  orientation: "any",
  renderer: "dom",
  tier: "simple",
  ownsChrome: true,
  scoreUnit: "moves",
  beta: true,
};
