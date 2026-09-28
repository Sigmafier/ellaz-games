// The Snake family's board colours, copied from `snake/SnakeCards.tsx` rather
// than imported: an import would make this game's chunk load Snake's whole
// chunk (the family's known cost - snakesurvivors pays 7.7 KB gz for it), for
// six strings. `ink.test.ts` pins the copy to the original, so the family can
// never drift apart in silence.
export const INK = { bg: "#0b0e22", rim: "#6c5ce7", mint: "#55efc4", gold: "#ffd166", text: "#f5f6ff", red: "#ff7675" };

/** A family LIST - "Fredoka, inherit" is invalid CSS and drops the whole declaration. */
export const FONT = "Fredoka, Heebo, sans-serif";
