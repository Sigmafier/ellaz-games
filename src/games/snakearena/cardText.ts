// What Snake Arena's round-over cards SAY (operator, 2026-10-01, the title's
// style): a big heading and one gold line under it. Pure, per phase.
import { nameOf, type Words } from "./words";

export function cardText(
  w: Words,
  r: { phase: "out" | "over"; place: number; count: number; peak: number; winner: number | null },
): { head: string; line: string } {
  const longest = w.longest(r.peak);
  if (r.phase === "out") return { head: w.outHead, line: `${w.of(r.place, r.count)} · ${longest}` };
  if (r.winner === 0) return { head: w.youWin, line: longest };
  return { head: w.of(r.place, r.count), line: `${r.winner === null ? w.nobody : w.wins(nameOf(w, r.winner))} · ${longest}` };
}
