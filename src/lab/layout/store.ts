/**
 * THE LAST WALK, kept in this browser so the wall opens on data instead of a
 * five-minute wait. A convenience only (the walk is the truth, and the gate
 * never reads this): wrapped in try/catch, and an empty store just means "walk".
 */
import { measure } from "./classify";
import { suggested, verdicts, type Verdict } from "./verdicts";
import type { Row } from "./walk";
import type { LayoutClass, Report } from "./types";

/** A report without its item list - what the wall draws. */
export type Slim = Pick<Report, "vw" | "vh" | "scale" | "regions" | "board" | "boardFrom" | "inPlay" | "error"> & { items: [] };

export type Snapshot = {
  at: number;
  ms: number;
  games: string[];
  cells: Record<string, { r: Slim; v: Verdict }>;
  suggested: Record<string, LayoutClass | null>;
  /** The site's own bar and tool row, once: "Home (cut 12px) on 139 of 188 pages". */
  platform: string[];
};

const KEY = "ellaz:layout-lab:v1";

export function snapshot(games: string[], rows: Row[], ms: number): Snapshot {
  const vs = verdicts(rows);
  const cells: Snapshot["cells"] = {};
  rows.forEach(({ id, screen, report: r }, i) => {
    cells[`${id}|${screen}`] = { r: { vw: r.vw, vh: r.vh, scale: r.scale, regions: r.regions, board: r.board, boardFrom: r.boardFrom, inPlay: r.inPlay, error: r.error, items: [] }, v: vs[i] };
  });
  const plat = new Map<string, number>();
  for (const { report } of rows)
    for (const i of measure(report).platform) {
      const k = `${i.label} (${i.state === "ok" ? "under 44px" : `${i.state} ${i.hidden}px`})`;
      plat.set(k, (plat.get(k) ?? 0) + 1);
    }
  const platform = [...plat].sort((a, b) => b[1] - a[1]).slice(0, 6).map(([k, n]) => `${k} on ${n} of ${rows.length} pages`);
  return { at: Date.now(), ms, games, cells, suggested: suggested(rows), platform };
}

export function load(): Snapshot | null {
  try {
    const s = localStorage.getItem(KEY);
    return s ? (JSON.parse(s) as Snapshot) : null;
  } catch {
    return null;
  }
}

export function save(s: Snapshot): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(s));
  } catch {
    /* a full or blocked store only costs the next visit a walk */
  }
}
