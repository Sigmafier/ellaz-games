import type { GameMeta } from "@sdk/index";

// DOM-free metadata: the portal roster imports this statically, so nothing here
// may reach React, Phaser, an asset or another module of this game.
//
// The Snake family's fourth game (2026-09-28), after `snake`, `snakesurvivors`
// and `puzzlesnake`: the classic grid snake in a 90-second round against three
// to five computer snakes, longest one alive at the bell wins.
//
// `ageBand: "all"`: a five-year-old can steer it (the pad keeps it
// tap-completable), but a real-time round where another snake's body puts you
// out is not built for them, and "kids" would bind it to the kids band's
// rules - no fail state is the first of those, and being out is the game.
// The speed shelf's other snake, `snakesurvivors`, made the same call.
//
// `category: "speed"` - the shelf for games where the danger moves on its own
// and a clock runs (survivors, snakesurvivors, holdtheline, bees, frog). Not
// `classics` beside `snake`: a classic is a game people already know by name,
// and this one is ours.
//
// `scoreUnit: "points"` - the record is the LONGEST the player's snake got in a
// round, per bot count, and longer is better. Not the place: 1st of 4 and 1st
// of 6 are different things, and a place only ever runs 1 to 6, so a record of
// it would be "1st" after the first good round and never move again.
// `score-unit-declared.test.ts` pins it to the scene's `unit:`.
export const meta: GameMeta = {
  id: "snakearena",
  title: { he: "זירת נחשים", en: "Snake Arena", es: "Arena de serpientes", sv: "Ormarenan" },
  emoji: "🐍",
  color: "#0F7F60",
  ageBand: "all",
  category: "speed",
  orientation: "any",
  renderer: "phaser",
  tier: "simple",
  ownsChrome: true,
  scoreUnit: "points",
  beta: true,
};
