// What Snake draws over and on top of its board: the score band, the start
// card and the game-over card. DOM, in the board's own colours, so every
// number is text and every control is a real button - and out of
// SnakeGame.tsx, which only wires them to the scene.
//
// The band and both cards answer a Phaser-forum review of 2026-09-26 ("If I
// die, what's my last and highest scores?", "Interface looks like not a part
// of the game"); today's board rides the same cards from 2026-09-27.
import type { ReactNode } from "react";
import type { OverCard as OverCardModel } from "./draw";

/** A family LIST, never `inherit` inside one: "Fredoka, inherit" is an invalid
 *  declaration and the browser drops it whole, which is how the first build of
 *  the card rendered its button in the default face. */
export const FONT = "Fredoka, Heebo, sans-serif";
/** The board's own colours, shared by the canvas, the band and the cards. */
export const INK = { bg: "#0b0e22", rim: "#6c5ce7", mint: "#55efc4", gold: "#ffd166", text: "#f5f6ff", red: "#ff7675" };
/** The score band on top of the board. Fixed, so the frame never moves with a digit. */
export const BAND_H = 44;
/** The start button's height: the ready strip's measured 49px, which it replaced. */
const BUTTON_H = 49;

type Cell = { label: string; value: number | string };

/** THE BAND. Part of the board: its colours, its width, its corners. */
export function Band({ score, mid, best }: { score: Cell; mid: Cell; best: Cell }) {
  return (
    <div
      className="snake-band"
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
      <BandCell {...score} color={INK.mint} />
      <BandCell {...mid} color={INK.text} small />
      <BandCell {...best} color={INK.gold} />
    </div>
  );
}

export type StartWords = { title: string; play: string; ready: string; todayBoard: string; sameWalls: string; hint: string };

/**
 * THE START CARD. Two real buttons, because both are instructions: "a thing
 * that tells the player to tap it must answer a tap". The hint under them
 * describes rather than asks, so it is plain text. The backdrop lets pointers
 * through, so a tap on the board still starts the board already dealt.
 */
export function StartCard({ words, day, onPlay, onToday }: { words: StartWords; day: string; onPlay: () => void; onToday: () => void }) {
  return (
    <section className="snake-start-card" aria-label={words.ready} style={overlay(false)}>
      <Panel>
        <div style={{ fontSize: 26, fontWeight: 700, letterSpacing: "0.08em", color: INK.mint, textShadow: `0 0 12px ${INK.mint}88` }}>
          {words.title}
        </div>
        <button type="button" onClick={onPlay} style={{ ...primary, marginTop: 12, minHeight: BUTTON_H }}>
          {words.play}
        </button>
        <button type="button" onClick={onToday} style={{ ...secondary, marginTop: 10 }}>
          {words.todayBoard}
          <span style={{ display: "block", fontSize: 12, fontWeight: 600, opacity: 0.85, marginTop: 2 }}>
            {day ? `${day} - ` : ""}
            {words.sameWalls}
          </span>
        </button>
        <div style={{ fontSize: 13, opacity: 0.8, marginTop: 10 }}>{words.hint}</div>
      </Panel>
    </section>
  );
}

export type OverWords = {
  over: string;
  score: string;
  best: string;
  todayBest: string;
  newBest: string;
  newBestToday: string;
  playAgain: string;
  todayBoard: string;
  backToClassic: string;
};

/**
 * THE GAME-OVER CARD. The only Play again on the page - GameHost's end-of-run
 * strip does not appear for snake (a personal best is not `runEnded`). On
 * today's board it says so, and its best is TODAY's, never the all-time one.
 */
export function OverCard({
  card,
  words,
  day,
  onPlayAgain,
  onClassic,
}: {
  card: OverCardModel;
  words: OverWords;
  day: string;
  onPlayAgain: () => void;
  onClassic: () => void;
}) {
  return (
    <section className="snake-over-card" aria-label={words.over} style={overlay(true)}>
      <Panel>
        <div style={{ fontSize: 24, fontWeight: 700, letterSpacing: "0.06em", color: INK.red }}>{words.over}</div>
        {card.today && (
          <div style={{ fontSize: 13, opacity: 0.85, marginTop: 4 }}>
            {words.todayBoard}
            {day ? ` - ${day}` : ""}
          </div>
        )}
        <div style={{ display: "flex", justifyContent: "center", gap: 26, margin: "10px 0 6px" }}>
          <CardNum label={words.score} value={card.score} color={INK.mint} />
          <CardNum label={card.today ? words.todayBest : words.best} value={card.best} color={INK.gold} />
        </div>
        {card.newBest && (
          <div
            style={{ display: "inline-block", margin: "0 0 10px", padding: "3px 12px", borderRadius: 99, background: INK.gold, color: "#241c17", fontWeight: 700, fontSize: 13 }}
          >
            ★ {card.today ? words.newBestToday : words.newBest}
          </div>
        )}
        <button type="button" onClick={onPlayAgain} style={primary}>
          {words.playAgain}
        </button>
        {card.today && (
          <button type="button" onClick={onClassic} style={{ ...secondary, marginTop: 10 }}>
            {words.backToClassic}
          </button>
        )}
      </Panel>
    </section>
  );
}

const primary = {
  display: "block",
  width: "100%",
  border: "none",
  borderRadius: 14,
  padding: "11px 12px",
  background: "var(--brand-strong)",
  color: "var(--on-brand)",
  fontFamily: FONT,
  fontWeight: 700,
  fontSize: 18,
  cursor: "pointer",
  touchAction: "manipulation",
} as const;

const secondary = { ...primary, background: "#2a2f63", color: INK.text, fontSize: 16 } as const;

function overlay(dim: boolean) {
  return {
    position: "absolute",
    inset: 0,
    display: "grid",
    placeItems: "center",
    background: dim ? `${INK.bg}99` : "transparent",
    pointerEvents: "none",
    zIndex: 3,
  } as const;
}

function Panel({ children }: { children: ReactNode }) {
  return (
    <div
      style={{
        pointerEvents: "auto",
        width: "74%",
        padding: "16px 14px",
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

/** One number in the band: a small caption over a big value. */
function BandCell({ label, value, color, small }: Cell & { color: string; small?: boolean }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 3, minWidth: 48 }}>
      <span style={{ fontSize: 10, letterSpacing: "0.12em", textTransform: "uppercase", opacity: 0.75 }}>{label}</span>
      <b style={{ fontSize: small ? 17 : 21, color }}>{value}</b>
    </div>
  );
}

/** One number on the game-over card. */
function CardNum({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 2 }}>
      <span style={{ fontSize: 12, letterSpacing: "0.1em", textTransform: "uppercase", opacity: 0.8 }}>{label}</span>
      <b style={{ fontSize: 32, lineHeight: 1.05, color }}>{value}</b>
    </div>
  );
}
