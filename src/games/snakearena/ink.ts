// The Snake family's board colours, copied from `snake/SnakeCards.tsx` rather
// than imported: an import would make this game's chunk load Snake's whole
// chunk for six strings (Puzzle Snake's reason, and its test's shape).
// `ink.test.ts` pins the copy to the original, so the family cannot drift.
export const INK = { bg: "#0b0e22", rim: "#6c5ce7", mint: "#55efc4", gold: "#ffd166", text: "#f5f6ff", red: "#ff7675" };

/** A family LIST - "Fredoka, inherit" is invalid CSS and drops the whole declaration. */
export const FONT = "Fredoka, Heebo, sans-serif";

/**
 * Each snake's colour, by id: the player is Snake's own mint, then the bots in
 * the approved mock's pink, amber and blue, and two more for a five-bot round.
 * None of them is the apples' red, so a body is never mistaken for food.
 */
export const SNAKE_COLORS = ["#55efc4", "#fd79a8", "#fdcb6e", "#74b9ff", "#a29bfe", "#dfe6e9"] as const;

/** The apples: the classic's red, and the glow round it. */
export const APPLE = { fill: "#ff5e62", glow: "#ff7675" } as const;

/** "#rrggbb" as the number Phaser's Graphics takes. */
export const hex = (c: string) => parseInt(c.slice(1), 16);
