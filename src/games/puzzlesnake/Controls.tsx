// Puzzle Snake - the game's own controls around the board. On a phone they sit
// under it (Undo / Restart / Levels, then the D-pad); on a PC the info panel and
// All levels take the column on the board's left (`GameChrome`'s `side`) and
// Undo / Restart and the keys hint take the right (`footer`), so the board
// stays on the screen's centre line.
//
// Undo and Restart are ALWAYS pressable. An undo with nothing to take back
// simply does nothing; it is never `disabled`, because the one promise this
// game makes is that there is always a way out.
import type { CSSProperties, ReactNode } from "react";
import { DirectionPad, type PadDir } from "@ui/DirectionPad";
import { FONT } from "./ink";
import type { Words } from "./words";

/**
 * The pad's key, in px: 76, the approved mock's size, rather than the shared
 * 88. Three keys and two 8px gaps are 244px against 280, which is what lets
 * the board, the tool row and the pad share a 390x844 phone without the frame
 * being scaled down.
 */
export const PAD_KEY = 76;

export function PhoneFooter(p: { T: Words; onUndo: () => void; onRestart: () => void; onLevels: () => void; onDir: (d: PadDir) => void }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 12 }}>
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", justifyContent: "center" }}>
        <Btn onClick={p.onUndo}>↶ {p.T.undo}</Btn>
        <Btn onClick={p.onRestart}>↺ {p.T.restart}</Btn>
        <Btn onClick={p.onLevels}>▦ {p.T.levels}</Btn>
      </div>
      <DirectionPad onDir={p.onDir} size={PAD_KEY} />
    </div>
  );
}

export function PcFooter(p: { T: Words; onUndo: () => void; onRestart: () => void }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12, width: 240 }}>
      <Btn onClick={p.onUndo} wide>
        ↶ {p.T.undo} <Key>Z</Key>
      </Btn>
      <Btn onClick={p.onRestart} wide>
        ↺ {p.T.restart} <Key>R</Key>
      </Btn>
      <div style={{ ...panel, fontSize: 14, color: "var(--text-dim)" }}>{p.T.keysHint}</div>
    </div>
  );
}

export function PcSide(p: { T: Words; worldLine: string; levelLine: string; onLevels: () => void }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12, width: 240 }}>
      <div style={panel}>
        <div style={{ fontSize: 13, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--text-dim)", marginBottom: 6 }}>
          {p.worldLine}
        </div>
        <div style={{ fontWeight: 700, fontSize: 18, fontFamily: FONT }}>{p.levelLine}</div>
        <div style={{ fontSize: 14, color: "var(--text-dim)", marginTop: 4 }}>{p.T.goal}</div>
      </div>
      <Btn onClick={p.onLevels} wide>
        ▦ {p.T.allLevels}
      </Btn>
    </div>
  );
}

function Btn({ onClick, children, wide }: { onClick: () => void; children: ReactNode; wide?: boolean }) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        minHeight: 52,
        minWidth: 52,
        padding: "0 18px",
        border: "none",
        borderRadius: 14,
        background: "var(--surface)",
        boxShadow: "var(--shadow-1)",
        color: "var(--text)",
        fontFamily: FONT,
        fontWeight: 700,
        fontSize: 16,
        display: "flex",
        alignItems: "center",
        justifyContent: wide ? "flex-start" : "center",
        gap: 8,
        cursor: "pointer",
        touchAction: "manipulation",
      }}
    >
      {children}
    </button>
  );
}

function Key({ children }: { children: ReactNode }) {
  return <small style={{ opacity: 0.5, fontSize: 13 }}>{children}</small>;
}

const panel: CSSProperties = {
  background: "var(--surface)",
  borderRadius: 16,
  padding: 14,
  boxShadow: "var(--shadow-1)",
  color: "var(--text)",
};
