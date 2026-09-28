import type { GameMeta } from "@sdk/index";

// DOM-free metadata: the portal catalog imports this statically so the home grid
// renders without pulling React/Phaser into the shell bundle.
export const meta: GameMeta = {
  id: "memory",
  title: { he: "זיכרון", en: "Memory", es: "Memoria", sv: "Minnesspel" },
  emoji: "🧠",
  color: "#fd79a8",
  ageBand: "kids",
  category: "kids",
  orientation: "any",
  renderer: "dom",
  tier: "simple",
  layout: "table",
  ownsChrome: true,
  scoreUnit: "moves",
};
