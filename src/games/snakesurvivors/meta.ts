import type { GameMeta } from "@sdk/index";

// DOM-free metadata: the portal roster imports this statically, so nothing here
// may reach React, Phaser or an asset.
//
// The Snake family's second game (2026-09-27), answering a Phaser-forum reviewer
// who asked for a roguelike, vampire-survivor style snake. `ageBand: "all"` for
// Neon Survival's reason: a five-year-old can steer it, but the crowd at two
// minutes is not for them. Beta until the operator has played it through.
export const meta: GameMeta = {
  id: "snakesurvivors",
  title: { he: "נחש הישרדות", en: "Snake Survivors", es: "Serpiente superviviente", sv: "Ormöverlevare" },
  emoji: "🐍",
  color: "#16755F",
  ageBand: "all",
  category: "speed",
  orientation: "any",
  renderer: "phaser",
  tier: "showcase",
  ownsChrome: true,
  scoreUnit: "points",
  beta: true,
};
