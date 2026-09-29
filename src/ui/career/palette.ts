// The career screens' colours - every one of them, in one place.
//
// FIXED, NEVER THEME TOKENS, and on purpose. The career screens are game art: a
// dark floor, a raspberry machine, tier colours a player learns (grey common,
// blue rare, gold epic). They look the same in every theme the way a game's own
// arena does, and each fill here is paired with its ink HERE rather than with a
// theme's - a theme ink on a literal fill is the two-contrast defect in
// .claude/rules/a-contrast-floor-is-a-floor-not-a-target.md (chess, 1.08:1 at night).
//
// ONE FILE so the colour gate (src/ui/token-hygiene.test.ts) can exempt the kit's
// palette by name while still refusing a stray literal typed into a screen file:
// TrailMap, VendingShop, Gear, BoardMap and parts carry none. The two pure-art
// files, icons.tsx and scenery.tsx, draw pictures the way ui/gameArt.ts does.

export const P = {
  sun: "#ffd166",
  berry: "#c2185b",
  white: "#fff",
  mint: "#2bb58a",
  night: "#0b0e22",
  shade33: "#00000055",
  cream: "#fff4e6",
  orange: "#f5a623",
  sand: "#f2e6cf",
  steel: "#b2bec3",
  stone: "#8a8f99",
  violet: "#6c5ce7",
  slate: "#5b5f77",
  dusk: "#4a4f6a",
  nightVeil: "#0b0e22d9",
  nightClear: "#0b0e2200",
  glass20: "#ffffff33",
  glass8: "#ffffff14",
  glass5: "#ffffff0d",
  sunGlow: "#ffd16633",
  roseGlow: "#ff5c7a33",
  berryDeep: "#8e0f45",
  slot: "#555a80",
  indigo: "#3d2a86",
  navyLit: "#2a3170",
  ink: "#241c17",
  mintDeep: "#1f9e75",
  teal: "#1f6b8f",
  tealDeep: "#0a2233",
  shade40: "#00000066",
  glass13: "#ffffff22",
  glass7: "#ffffff12",
  glass4: "#ffffff0a",
  gold: "#ffc21a",
  coral: "#ff6b6b",
  rose: "#ff5c7a",
  silver: "#dfe6e9",
  sky: "#74b9ff",
  aqua: "#55efc4",
  blue: "#3d8bff",
  navy: "#232a6b",
  navyDeep: "#1c2150",
  navyDark: "#15183a",
  shade35: "#00000059",
  mintDark: "#1f7a5c",
  glass27: "#ffffff44",
  shade67: "#000000aa",
  inkVeil: "#241c17d9",
} as const;
