// What Snake Arena draws over and around its board, from the approved mock
// (2026-09-28): the band on top (LENGTH - TIME - PLACE), the start card, the
// out card, the final card, the ranking they share, the bots picker, and the
// PC's live-ranking column. DOM in the board's own colours, so every number is
// text and every control is a real button - and out of SnakeArenaGame.tsx,
// which only wires them to the scene.
import type { CSSProperties, ReactNode } from "react";
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

export function StartCard(p: { title: string; w: Words; bots: BotCount; onBots: (n: BotCount) => void; onPlay: () => void }) {
  return (
    <section className="arena-start-card" aria-label={p.title} style={overlay(false)}>
      <Panel>
        <div style={{ fontSize: 26, fontWeight: 700, letterSpacing: "0.06em", color: INK.mint, textShadow: `0 0 12px ${INK.mint}88` }}>{p.title}</div>
        <div style={{ fontSize: 14, opacity: 0.85, margin: "6px 0 12px" }}>{p.w.rule}</div>
        <BotsPicker bots={p.bots} onBots={p.onBots} w={p.w} dark />
        <button type="button" onClick={p.onPlay} style={{ ...primary, marginTop: 12, width: "100%" }}>
          {p.w.play}
        </button>
        <div style={{ fontSize: 13, opacity: 0.8, marginTop: 10 }}>{p.w.hint}</div>
      </Panel>
    </section>
  );
}

/** The player is out and the round stands still: where they are, and the two ways on. */
export function OutCard(p: { w: Words; place: number; count: number; peak: number; rows: Row[]; onWatch: () => void; onAgain: () => void }) {
  return (
    <section className="arena-out-card" aria-label={p.w.outTitle(p.place, p.count)} style={overlay(true)}>
      <Panel>
        <div style={{ fontSize: 22, fontWeight: 700 }}>{p.w.outTitle(p.place, p.count)}</div>
        <div style={{ opacity: 0.75, margin: "4px 0 12px" }}>{p.w.longest(p.peak)}</div>
        <Ranking rows={p.rows} w={p.w} dark />
        <div style={{ display: "flex", gap: 10, justifyContent: "center", marginTop: 14 }}>
          <button type="button" onClick={p.onWatch} style={{ ...primary, background: "#fff", color: "#241c17" }}>
            {p.w.watch}
          </button>
          <button type="button" onClick={p.onAgain} style={primary}>
            {p.w.playAgain}
          </button>
        </div>
      </Panel>
    </section>
  );
}

/** The bell, or the last snake standing: who won, where the player came, and Play again. */
export function FinalCard(p: { w: Words; place: number; count: number; peak: number; winner: number | null; rows: Row[]; onAgain: () => void }) {
  const won = p.winner === 0;
  const title = won ? p.w.youWin : p.w.placeTitle(p.place, p.count);
  return (
    <section className="arena-final-card" aria-label={p.w.final} style={overlay(true)}>
      <Panel>
        <div style={{ fontSize: 22, fontWeight: 700, color: won ? INK.gold : INK.text }}>{title}</div>
        {/* One line, not two: five rows and this card measured 401px against a
            396px board at 1536x639, and Play again was cut off at the bottom. */}
        <div style={{ opacity: 0.85, marginTop: 4, fontSize: 15 }}>
          {won ? p.w.longest(p.peak) : `${p.winner === null ? p.w.nobody : p.w.wins(nameOf(p.w, p.winner))} · ${p.w.longest(p.peak)}`}
        </div>
        <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", opacity: 0.7, margin: "8px 0 4px" }}>{p.w.final}</div>
        <Ranking rows={p.rows} w={p.w} dark />
        <button type="button" onClick={p.onAgain} style={{ ...primary, marginTop: 10, width: "100%" }}>
          {p.w.playAgain}
        </button>
      </Panel>
    </section>
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

const primary: CSSProperties = {
  minHeight: 48,
  padding: "0 18px",
  border: "none",
  borderRadius: 14,
  background: "var(--brand-strong)",
  color: "var(--on-brand)",
  fontFamily: FONT,
  fontWeight: 700,
  fontSize: 16,
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

function overlay(dim: boolean): CSSProperties {
  return {
    position: "absolute",
    inset: 0,
    display: "grid",
    placeItems: "center",
    background: dim ? `${INK.bg}aa` : "transparent",
    pointerEvents: "none",
    zIndex: 3,
  };
}

function Panel({ children }: { children: ReactNode }) {
  return (
    <div
      style={{
        pointerEvents: "auto",
        width: "min(86%, 340px)",
        boxSizing: "border-box",
        padding: "12px 16px",
        textAlign: "center",
        borderRadius: 18,
        border: `1.5px solid ${INK.rim}`,
        background: "linear-gradient(#1e2250, #151939)",
        boxShadow: `0 0 30px ${INK.rim}66`,
        color: INK.text,
        fontFamily: FONT,
      }}
    >
      {children}
    </div>
  );
}
