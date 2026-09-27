/**
 * THE VERDICTS - what the lab and `assert:layout` both print, from one walk.
 *
 * Kept apart from the views so the gate mode and the wall read one function:
 * a flag the wall paints red is, by construction, the flag the gate ratchets.
 */
import { consistency, flagsOf, measure, suggestClass, THRESHOLDS, type Flag, type Stray } from "./classify";
import type { Row } from "./walk";
import type { LayoutClass, Report, ScreenId } from "./types";

export type Verdict = {
  id: string;
  screen: ScreenId;
  flags: (Flag | "stray")[];
  strays: Stray[];
  area: number | null;
  above: number;
  empty: number;
  small: number;
  cut: number;
  error?: string;
};

export function verdicts(rows: Row[]): Verdict[] {
  const byScreen = new Map<ScreenId, Record<string, Report>>();
  for (const r of rows) byScreen.set(r.screen, { ...(byScreen.get(r.screen) ?? {}), [r.id]: r.report });
  const strays = new Map([...byScreen].map(([s, g]) => [s, consistency(g)]));
  return rows.map(({ id, screen, report }) => {
    const m = measure(report);
    const st = strays.get(screen)?.[id] ?? [];
    const flags: Verdict["flags"] = [...flagsOf(report, screen, THRESHOLDS), ...(st.length ? (["stray"] as const) : [])];
    return { id, screen, flags, strays: st, area: m.boardArea, above: m.aboveBoard, empty: m.emptyBelow, small: m.small.length, cut: m.cut.length, error: report.error };
  });
}

/** The class a game's laptop page suggests - a suggestion the operator rules on. */
export function suggested(rows: Row[]): Record<string, LayoutClass | null> {
  return Object.fromEntries(rows.filter((r) => r.screen === "laptop").map((r) => [r.id, suggestClass(r.report)]));
}
