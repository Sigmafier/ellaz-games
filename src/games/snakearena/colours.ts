// "Your colour" (forum review, "ability to choose your color"): six swatches,
// the snake family's six colours. Pure - who wears which colour is a function
// of the pick and how many people play.
import { SNAKE_COLORS } from "./ink";

/**
 * The swatches' SAVED ids, in `SNAKE_COLORS` order. Saved by name rather than
 * by hex or index, and never renamed or reused: a persisted id is forever, and
 * the hex behind a name may be retuned one day without moving anyone's pick.
 */
export const COLOUR_IDS = ["mint", "pink", "amber", "blue", "violet", "silver"] as const;
export type ColourId = (typeof COLOUR_IDS)[number];

export const colourFromSaved = (v: unknown): ColourId =>
  typeof v === "string" && (COLOUR_IDS as readonly string[]).includes(v) ? (v as ColourId) : "mint";

export const hexOf = (id: ColourId) => SNAKE_COLORS[COLOUR_IDS.indexOf(id)];

/**
 * Every snake's colour, by id, for a round of `n` snakes. You (snake 0) wear
 * your pick; with two people, P2 wears the next colour round the wheel - so the
 * two of you can never match; the bots take the colours left, in the family's
 * order. Mint with one player is exactly the round as it always looked.
 */
export function paletteFor(you: ColourId, humans: number, n: number): string[] {
  const first = COLOUR_IDS.indexOf(you);
  const people = Array.from({ length: humans }, (_, i) => SNAKE_COLORS[(first + i) % SNAKE_COLORS.length]);
  const rest = SNAKE_COLORS.filter((c) => !people.includes(c));
  const all = [...people, ...rest];
  return Array.from({ length: n }, (_, i) => all[i % all.length]);
}
