// What Snake Arena's round-over cards SAY (operator, 2026-10-01, the title's
// style): a big heading and one gold line under it. Pure, per phase.
import { nameOf, type Words } from "./words";

export function cardText(
  w: Words,
  r: { phase: "out" | "over"; place: number; count: number; peak: number; winner: number | null; humans?: number; places?: number[] },
): { head: string; line: string } {
  const humans = r.humans ?? 1;
  if (humans > 1) {
    // Two players: who won is the heading, where each of you finished the line.
    const head = r.winner === null ? w.nobody : w.wins(nameOf(w, r.winner, humans));
    const line = (r.places ?? []).map((p, id) => `${nameOf(w, id, humans)} ${w.ord(p)}`).join(" · ");
    return { head, line };
  }
  const longest = w.longest(r.peak);
  if (r.phase === "out") return { head: w.outHead, line: `${w.of(r.place, r.count)} · ${longest}` };
  if (r.winner === 0) return { head: w.youWin, line: longest };
  return { head: w.of(r.place, r.count), line: `${r.winner === null ? w.nobody : w.wins(nameOf(w, r.winner))} · ${longest}` };
}
