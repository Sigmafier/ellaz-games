// What Snake Arena draws over and around its board, from the approved mock
// (2026-09-28): the band on top (LENGTH - TIME - PLACE), the ranking, the bots
// picker, and the PC's live-ranking column. Since 2026-10-01 ("one-screen
// start, all four") the start, out and final cards are the shared title card
// (`@ui/ArcadeTitle`) - this file hands it the inks, the heading style and the
// ranking panel. DOM in the board's own colours, so every number is
// text and every control is a real button - and out of SnakeArenaGame.tsx,
// which only wires them to the scene.
import type { CSSProperties } from "react";
import type { TitleInks, TitleLine } from "@ui/ArcadeTitle";
import { FONT, INK, SNAKE_COLORS } from "./ink";
import { BOT_COUNTS, type BotCount } from "./logic";
import type { Row } from "./result";
import { nameOf, type Words } from "./words";

/** The band on top of the board. Fixed, so the frame never moves with a digit. */
export const BAND_H = 44;

type Cell = { label: string; value: number | string; color: string };

export function Band({ cells }: { cells: [Cell, Cell, Cell] }) {
  return (
    <div
      className="arena-band"
      aria-live="off"
      style={{
        height: BAND_H,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "0 14px",
        background: `linear-gradient(#171b3a, ${INK.bg})`,
        color: INK.text,
        fontFamily: FONT,
        lineHeight: 1,
      }}
    >
      {cells.map((c) => (
        <div key={c.label} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 3, minWidth: 48 }}>
          <span style={{ fontSize: 10, letterSpacing: "0.12em", textTransform: "uppercase", opacity: 0.75 }}>{c.label}</span>
          <b style={{ fontSize: 19, color: c.color }}>{c.value}</b>
        </div>
      ))}
    </div>
  );
}

/** 1, a colour, a name, a length - one row per snake, best first. */
export function Ranking({ rows, w, dark }: { rows: Row[]; w: Words; dark: boolean }) {
  return (
    <ol style={{ listStyle: "none", margin: 0, padding: 0, display: "flex", flexDirection: "column", gap: 4, textAlign: "start" }}>
      {rows.map((r, i) => (
        <li key={r.id} style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 15, opacity: r.alive || dark ? 1 : 0.55 }}>
          <b style={{ width: 14 }}>{i + 1}</b>
          <span aria-hidden="true" style={{ width: 14, height: 14, borderRadius: 4, background: SNAKE_COLORS[r.id % SNAKE_COLORS.length] }} />
          <span style={{ flex: 1, minWidth: 0 }}>{nameOf(w, r.id)}</span>
          <span style={{ opacity: 0.7 }}>{r.len}</span>
        </li>
      ))}
    </ol>
  );
}

/**
 * 3, 4 or 5 bots. Three real buttons, the chosen one filled - a picker, not a
 * toggle, because the mock drew all three and a child can see which is on.
 */
export function BotsPicker({ bots, onBots, w, dark }: { bots: BotCount; onBots: (n: BotCount) => void; w: Words; dark?: boolean }) {
  return (
    <div role="group" aria-label={w.bots} style={{ display: "flex", alignItems: "center", gap: 6, justifyContent: "center" }}>
      <span style={{ fontSize: 12, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", opacity: 0.7, marginInlineEnd: 4 }}>{w.bots}</span>
      {BOT_COUNTS.map((n) => (
        <button
          key={n}
          type="button"
          aria-pressed={n === bots}
          aria-label={w.botsLabel(n)}
          onClick={() => onBots(n)}
          style={{
            ...pill,
            background: n === bots ? "var(--brand-strong)" : dark ? "#2a2f63" : "var(--surface)",
            color: n === bots ? "var(--on-brand)" : dark ? INK.text : "var(--text)",
          }}
        >
          {n}
        </button>
      ))}
    </div>
  );
}

/** Snake Arena's inks on its title card (the mock's "arena" theme). */
export const ARENA_INKS: TitleInks = {
  accent: INK.mint,
  ink: "#141234",
  light: "#e8eaff",
  chip: "rgba(20, 14, 12, 0.88)",
  sel: "#e8eaff",
  selRing: "#7a6cf0",
  panel: "rgba(11, 13, 31, 0.86)",
  line: "#2a2f55",
  gold: INK.gold,
};

/** A heading in the card's two glows: mint, then violet. */
export const arenaLines = (texts: string[]): TitleLine[] =>
  texts.map((text, i) => (i === 0 ? { text, glow: INK.mint, fill: "#f4fffd" } : { text, glow: "#7a6cf0", fill: "#fff0fb" }));

/** Behind a card: the band's strip solid, then the live board under a veil. */
export const arenaCover = (veil: number) => `linear-gradient(${INK.bg} 0 ${BAND_H}px, rgba(11, 13, 31, ${veil}) ${BAND_H}px)`;

/** The round-over cards' ranking: 1, a colour, a name, a length - in the mock's dark panel. */
export function RankCard({ rows, w, pc }: { rows: Row[]; w: Words; pc: boolean }) {
  return (
    <ol
      style={{
        listStyle: "none",
        margin: 0,
        width: pc ? 330 : 290,
        maxWidth: "90%",
        boxSizing: "border-box",
        padding: "8px 16px",
        borderRadius: 18,
        border: "2px solid #2a2f55",
        background: "rgba(11, 13, 31, 0.86)",
        fontFamily: FONT,
        textAlign: "start",
      }}
    >
      {rows.map((r, i) => (
        <li key={r.id} style={{ display: "flex", alignItems: "center", gap: 12, height: pc ? 28 : 29, fontSize: 18, fontWeight: 600, color: INK.text }}>
          <b style={{ width: 18, fontWeight: 700 }}>{i + 1}</b>
          <span aria-hidden="true" style={{ width: 18, height: 18, borderRadius: 5, flex: "none", background: SNAKE_COLORS[r.id % SNAKE_COLORS.length] }} />
          <span style={{ flex: 1, minWidth: 0 }}>{nameOf(w, r.id)}</span>
          <span style={{ color: "#c9cde6" }}>{r.len}</span>
        </li>
      ))}
    </ol>
  );
}

/** The PC's left column: the live ranking, and the rule under it. */
export function RankPanel({ rows, w }: { rows: Row[]; w: Words }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10, width: 230 }}>
      <div style={panel}>
        <div style={heading}>{w.live}</div>
        <Ranking rows={rows} w={w} dark={false} />
      </div>
      <div style={{ ...panel, fontSize: 14, color: "var(--text-dim)" }}>{w.rule}</div>
    </div>
  );
}

/** The PC's right column head: the bots picker in a panel, as the mock has it. */
export function BotsPanel(p: { bots: BotCount; onBots: (n: BotCount) => void; w: Words }) {
  return (
    <div style={{ ...panel, width: 230, boxSizing: "border-box" }}>
      <BotsPicker {...p} />
    </div>
  );
}

const pill: CSSProperties = {
  minWidth: 44,
  height: 40,
  border: "none",
  borderRadius: 12,
  fontFamily: FONT,
  fontWeight: 700,
  fontSize: 17,
  cursor: "pointer",
  touchAction: "manipulation",
};

const panel: CSSProperties = {
  background: "var(--surface)",
  borderRadius: 16,
  padding: 14,
  boxShadow: "var(--shadow-1)",
  color: "var(--text)",
  fontFamily: FONT,
};

const heading: CSSProperties = { fontSize: 12, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", opacity: 0.6, marginBottom: 8 };
