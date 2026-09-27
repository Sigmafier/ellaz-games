/**
 * THE OVERALL VIEW - every game on every screen, worst first.
 *
 * Pictures by default (operator pick 2026-09-27, design A), with the numbers
 * table one tap away ("both"). A game's name opens it in the one-game view.
 */
import { useState } from "react";
import { BTN, Chips, Legend, UI, Wire, pct, seg, FLAG_COL, BOARD_COL } from "./bits";
import type { Snapshot } from "./store";
import { SCREENS, type ScreenId } from "./types";

const worst = (s: Snapshot, id: string) =>
  SCREENS.reduce((n, sc) => n + (s.cells[`${id}|${sc.id}`]?.v.flags.length ?? 1), 0);

export function Wall({ snap, onOpen }: { snap: Snapshot; onOpen: (id: string) => void }) {
  const [mode, setMode] = useState<"pictures" | "numbers">("pictures");
  const [only, setOnly] = useState<string | null>(null);
  const ids = [...snap.games]
    .filter((id) => !only || SCREENS.some((sc) => snap.cells[`${id}|${sc.id}`]?.v.flags.includes(only as never)))
    .sort((a, b) => worst(snap, b) - worst(snap, a));
  return (
    <div>
      <p style={{ color: UI.dim, fontSize: 13, margin: "0 0 8px" }}>
        <b style={{ color: UI.ink }}>The site's own bars, once for every game:</b> {snap.platform.join(" · ") || "nothing"}
      </p>
      <Legend />
      <div style={{ display: "flex", gap: 12, flexWrap: "wrap", margin: "0 0 12px", alignItems: "center" }}>
        <span style={{ display: "inline-flex", border: `1px solid ${UI.line}`, borderRadius: 10, overflow: "hidden" }}>
          <button type="button" style={seg(mode === "pictures")} onClick={() => setMode("pictures")}>Pictures</button>
          <button type="button" style={seg(mode === "numbers")} onClick={() => setMode("numbers")}>Numbers</button>
        </span>
        <select value={only ?? ""} onChange={(e) => setOnly((e.target as HTMLSelectElement).value || null)} style={{ ...BTN, background: "#0b1222" }}>
          <option value="">every game ({snap.games.length})</option>
          {Object.keys(FLAG_COL).map((f) => <option key={f} value={f}>only: {f}</option>)}
        </select>
        <span style={{ color: UI.dim, fontSize: 13 }}>{ids.length} shown, worst first</span>
      </div>
      {mode === "pictures" ? <Pictures snap={snap} ids={ids} onOpen={onOpen} /> : <Table snap={snap} ids={ids} onOpen={onOpen} />}
    </div>
  );
}

function Name({ id, snap, onOpen }: { id: string; snap: Snapshot; onOpen: (id: string) => void }) {
  return (
    <button type="button" onClick={() => onOpen(id)} style={{ background: "none", border: 0, color: UI.ink, textAlign: "start", cursor: "pointer", font: "inherit", padding: 0, minHeight: 44 }}>
      <b>{id}</b>
      <small style={{ display: "block", color: UI.dim }}>suggested: {snap.suggested[id] ?? "?"}</small>
    </button>
  );
}

function Pictures({ snap, ids, onOpen }: { snap: Snapshot; ids: string[]; onOpen: (id: string) => void }) {
  return (
    <div>
      {ids.map((id) => (
        <div key={id} style={{ display: "flex", gap: 14, alignItems: "flex-end", padding: "10px 0", borderBottom: `1px solid ${UI.line}`, flexWrap: "wrap" }}>
          <div style={{ width: 130 }}><Name id={id} snap={snap} onOpen={onOpen} /></div>
          {SCREENS.map((sc) => {
            const c = snap.cells[`${id}|${sc.id}`];
            return (
              <div key={sc.id}>
                {c ? <Wire r={c.r} v={c.v} h={110} /> : null}
                <div style={{ fontSize: 12, color: UI.dim, marginTop: 4, textAlign: "center" }}>
                  {sc.id} · board {pct(c?.v.area)}{c?.v.above ? ` · ${c.v.above}px above` : ""}{c?.v.error ? " · not read" : ""}
                </div>
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
}

function Table({ snap, ids, onOpen }: { snap: Snapshot; ids: string[]; onOpen: (id: string) => void }) {
  const cell = (id: string, sc: ScreenId) => {
    const c = snap.cells[`${id}|${sc}`];
    if (!c) return <td key={sc} />;
    return (
      <td key={sc} style={{ padding: 8, borderBottom: `1px solid ${UI.line}`, verticalAlign: "top" }}>
        board {pct(c.v.area)} of the window
        <div style={{ height: 8, width: 120, background: UI.line, borderRadius: 4, margin: "4px 0" }}>
          <b style={{ display: "block", height: 8, borderRadius: 4, width: `${Math.min(100, (c.v.area ?? 0) * 200)}%`, background: c.v.flags.length ? FLAG_COL[c.v.flags[0]] : BOARD_COL }} />
        </div>
        <Chips flags={c.v.error ? ["error"] : c.v.flags} />
      </td>
    );
  };
  return (
    <table style={{ borderCollapse: "collapse", width: "100%", fontSize: 13 }}>
      <thead>
        <tr>{["game", ...SCREENS.map((s) => `${s.id} ${s.w}x${s.h}`)].map((h) => <th key={h} style={{ textAlign: "start", padding: 8, color: UI.dim }}>{h}</th>)}</tr>
      </thead>
      <tbody>
        {ids.map((id) => (
          <tr key={id}>
            <td style={{ padding: 8, borderBottom: `1px solid ${UI.line}` }}><Name id={id} snap={snap} onOpen={onOpen} /></td>
            {SCREENS.map((s) => cell(id, s.id))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}
