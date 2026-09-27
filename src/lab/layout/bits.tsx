/**
 * The layout lab's small shared pieces: flag chips, the wireframe, the numbers
 * table. Colours are the lab's own dark slate (the same as #/lab/footers).
 */
import type { CSSProperties } from "react";
import type { Verdict } from "./verdicts";
import type { Box, Region, Report } from "./types";

export const FLAG: Record<string, string> = {
  wasted: "wasted screen",
  above: "buttons above the board",
  stray: "control in a different spot",
  cut: "cut off",
  small: "too small",
  error: "not read",
};
export const FLAG_COL: Record<string, string> = {
  wasted: "#f59e0b", above: "#fb923c", stray: "#a78bfa", cut: "#f87171", small: "#f472b6", error: "#64748b",
};
/** The bars, coloured as on the labelled page the operator confirmed. */
export const REG_COL: Partial<Record<Region, string>> = {
  bar: "#ef4444", tools: "#06b6d4", row: "#f97316", side: "#8b5cf6", footer: "#8b5cf6", strip: "#eab308", band: "#22c55e",
};
export const BOARD_COL = "#4ade80";
export const UI = { bg: "#020617", card: "#0f172a", line: "#1e293b", ink: "#e2e8f0", dim: "#94a3b8", on: "#2563eb" };

export const pct = (x: number | null | undefined) => (x == null ? "-" : `${Math.round(x * 100)}%`);

export function Chips({ flags }: { flags: string[] }) {
  return (
    <>
      {flags.map((f) => (
        <span key={f} style={{ display: "inline-block", borderRadius: 999, padding: "1px 8px", margin: "0 4px 4px 0", fontSize: 12, fontWeight: 600, color: UI.bg, background: FLAG_COL[f] }}>
          {FLAG[f] ?? f}
        </span>
      ))}
    </>
  );
}

export function Legend() {
  const box = (label: string, c: string) => (
    <span key={label} style={{ display: "inline-block", borderRadius: 999, padding: "1px 8px", margin: "0 4px 4px 0", fontSize: 12, fontWeight: 600, color: UI.bg, background: c }}>{label}</span>
  );
  return (
    <div style={{ margin: "0 0 12px" }}>
      <Chips flags={Object.keys(FLAG)} />
      <span style={{ color: UI.dim, fontSize: 12, margin: "0 6px" }}>boxes:</span>
      {box("board", BOARD_COL)}{box("site bar", REG_COL.bar!)}{box("tool row", REG_COL.tools!)}{box("numbers row", REG_COL.row!)}
      {box("side / footer", REG_COL.side!)}{box("end strip", REG_COL.strip!)}{box("band", REG_COL.band!)}
    </div>
  );
}

const abs = (b: Box, k: number, extra: CSSProperties): CSSProperties => ({
  position: "absolute", left: b.x * k, top: b.y * k, width: b.w * k, height: b.h * k, ...extra,
});

/** A page drawn as boxes at height `h`: the bars, then the board on top. */
export function Wire({ r, v, h }: { r: Report; v?: Verdict; h: number }) {
  if (!r.vw || !r.vh) return <div style={{ width: h * 0.6, height: h, border: `2px solid ${FLAG_COL.error}`, borderRadius: 4 }} />;
  const k = h / r.vh;
  const border = v?.flags.length ? FLAG_COL[v.flags[0]] : BOARD_COL;
  return (
    <div style={{ position: "relative", width: r.vw * k, height: h, background: "#0b1020", border: `2px solid ${border}`, borderRadius: 4, overflow: "hidden" }}>
      {(Object.entries(r.regions) as [Region, Box][]).map(([k2, b]) =>
        REG_COL[k2] ? <i key={k2} style={abs(b, k, { background: REG_COL[k2], opacity: 0.55 })} /> : null,
      )}
      {r.board && <i style={abs(r.board, k, { background: BOARD_COL, opacity: 0.8 })} />}
    </div>
  );
}

/** Outlines over a live page drawn at scale `k`. */
export function Outlines({ r, k }: { r: Report; k: number }) {
  return (
    <svg width={r.vw * k} height={r.vh * k} style={{ position: "absolute", left: 0, top: 0, pointerEvents: "none" }}>
      {(Object.entries(r.regions) as [Region, Box][]).map(([k2, b]) =>
        REG_COL[k2] ? <rect key={k2} x={b.x * k} y={b.y * k} width={b.w * k} height={b.h * k} fill="none" stroke={REG_COL[k2]} strokeWidth={2} /> : null,
      )}
      {r.board && <rect x={r.board.x * k} y={r.board.y * k} width={r.board.w * k} height={r.board.h * k} fill="none" stroke="#16a34a" strokeWidth={3} strokeDasharray="6 3" />}
    </svg>
  );
}

export function Numbers({ v, r, before }: { v: Verdict; r: Report; before?: Verdict }) {
  const delta = (a: number | null, b: number | null | undefined) =>
    before && a != null && b != null && Math.round(a * 100) !== Math.round(b * 100) ? ` (was ${pct(b)})` : "";
  const row = (k: string, val: string) => (
    <tr key={k}><td style={{ padding: "3px 8px", color: UI.dim }}>{k}</td><td style={{ padding: "3px 8px" }}><b>{val}</b></td></tr>
  );
  return (
    <table style={{ borderCollapse: "collapse", width: "100%", fontSize: 13 }}>
      <tbody>
        {row("board, share of the window", `${pct(v.area)}${delta(v.area, before?.area)}${r.boardFrom === "surface" ? " (play area - no board marked)" : ""}`)}
        {row("numbers row above the board", v.above ? `${v.above}px` : "none")}
        {row("empty under everything", `${v.empty}px`)}
        {row("controls too small / cut", `${v.small} / ${v.cut}`)}
        {row("in a different spot", v.strays.map((s) => `${s.role} in ${s.place} (most: ${s.usual})`).join(", ") || "none")}
        <tr><td style={{ padding: "3px 8px", color: UI.dim }}>flags</td><td style={{ padding: "3px 8px" }}>{v.flags.length ? <Chips flags={v.flags} /> : "none"}</td></tr>
      </tbody>
    </table>
  );
}

export const BTN: CSSProperties = { background: "#1e293b", color: UI.ink, border: `1px solid ${UI.line}`, borderRadius: 10, padding: "8px 14px", font: "inherit", cursor: "pointer", minHeight: 44 };
export const seg = (on: boolean): CSSProperties => ({ ...BTN, background: on ? UI.on : "#0b1222", color: on ? "#fff" : UI.dim, borderRadius: 0 });
