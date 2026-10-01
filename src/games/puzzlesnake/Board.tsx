// Puzzle Snake - the board: the band on top, the grid, and the two things drawn
// over it (the solved card and the stuck strip). DOM, so every number is text
// and every control is a real button. It owns no state; the game hands it the
// board and the handlers.
import { useRef, type CSSProperties, type ReactNode, type Ref } from "react";
import { BOARD_CLASS, boardVars } from "@ui/boardSize";
import { exitOpen, facing, holdsKey, starMargin, type Dir, type PuzzleState } from "./logic";
import type { Trick } from "./levels";
import { FONT, INK } from "./ink";
import { TileIcon } from "./TileIcon";
import { fill, hintFor, type Words } from "./words";

/** The band on top of the board. Fixed height, so a digit never moves the frame. */
export const BAND_H = 44;

/**
 * What shares this board's column on a PC, in px: GameChrome's head row (empty
 * - the numbers are on the board), the band, the board's 3px rim top and
 * bottom, and the play surface's padding. MEASURED, not summed: the sum of the
 * parts said 89 and the built page renders 105 at 1536x639, 1536x695 and
 * 1920x1080 alike (`repro-board-fills-the-window.mjs`, 2026-09-28), which reds
 * when this drifts more than 8px from the rendered number.
 */
const CHROME = 105;

/** Phone width: the same three terms the gate asserts, as one expression. */
const PHONE = "min(92vw, 42vh, 440px)";

export type SolvedCard = { stars: 1 | 2 | 3; moves: number };

export function Board(props: {
  state: PuzzleState;
  id: string;
  par: number;
  pc: boolean;
  T: Words;
  card: SolvedCard | null;
  last: boolean;
  headRef: Ref<HTMLDivElement>;
  exitRef: Ref<HTMLDivElement>;
  onSwipe: (dir: Dir) => void;
  onTry: () => void;
  onNext: () => void;
  /** Opens the level picker - offered on the solved card, so a won level can be replayed. */
  onLevels: () => void;
  onUndo: () => void;
  onStartOver: () => void;
  stuck: boolean;
  /** The tiles this level is the first to use; a one-line hint explains them. */
  newTiles: readonly Trick[];
}) {
  const { state, T } = props;
  const hint = props.newTiles.map((t) => hintFor(T, t)).join(" ");
  return (
    <div
      className="puzzlesnake-board"
      style={{
        position: "relative",
        display: "inline-flex",
        flexDirection: "column",
        borderRadius: 16,
        overflow: "hidden",
        border: `3px solid ${INK.rim}`,
        background: INK.bg,
        boxShadow: `0 10px 30px ${INK.rim}33`,
        fontFamily: FONT,
      }}
    >
      <Band
        cells={[
          { label: T.level, value: props.id, color: INK.mint },
          { label: T.moves, value: state.moves, color: INK.text },
          { label: T.parIn, value: props.par, color: INK.gold },
        ]}
      />
      <Grid {...props} />
      {hint && <Hint text={hint} rows={state.level.height} />}
      {props.stuck && !props.card && <StuckStrip T={T} onUndo={props.onUndo} onStartOver={props.onStartOver} />}
      {props.card && (
        <Solved card={props.card} id={props.id} par={props.par} T={T} last={props.last} onTry={props.onTry} onNext={props.onNext} onLevels={props.onLevels} />
      )}
    </div>
  );
}

function Band({ cells }: { cells: { label: string; value: string | number; color: string }[] }) {
  return (
    <div
      aria-live="off"
      style={{
        height: BAND_H,
        flex: "0 0 auto",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "0 14px",
        background: `linear-gradient(#171b3a, ${INK.bg})`,
        color: INK.text,
        lineHeight: 1,
      }}
    >
      {cells.map((c) => (
        <div key={c.label} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 3, minWidth: 48 }}>
          <span style={{ fontSize: 10, letterSpacing: "0.12em", textTransform: "uppercase", opacity: 0.75 }}>{c.label}</span>
          <b dir="ltr" style={{ fontSize: 19, color: c.color }}>
            {c.value}
          </b>
        </div>
      ))}
    </div>
  );
}

/**
 * The grid. `dir="ltr"` because it is SPATIAL: under the Hebrew app's RTL the
 * columns would mirror and "right" would move the head left
 * (`.claude/rules/rtl-spatial-grid-dir-ltr.md`).
 *
 * The box is square and the SAME size on every level; a 7x7 and a 9x9 level
 * differ only in how big a cell is, so moving between levels never moves the
 * frame.
 */
function Grid(props: Parameters<typeof Board>[0]) {
  const { state, pc } = props;
  const { level } = state;
  const swipe = useRef<{ x: number; y: number } | null>(null);
  const kinds = cellKinds(state);
  return (
    <div
      dir="ltr"
      role="img"
      aria-label={props.T.board}
      className={pc ? BOARD_CLASS : undefined}
      onPointerDown={(e) => {
        swipe.current = { x: e.clientX, y: e.clientY };
      }}
      onPointerUp={(e) => {
        const from = swipe.current;
        swipe.current = null;
        const dir = from && swipeDir(e.clientX - from.x, e.clientY - from.y);
        if (dir) props.onSwipe(dir);
      }}
      style={{
        ...(pc ? boardVars({ vw: 92, vh: 42, cap: 440, chrome: CHROME, ratio: 1 }) : { width: PHONE }),
        position: "relative",
        aspectRatio: "1",
        boxSizing: "border-box",
        display: "grid",
        gridTemplateColumns: `repeat(${level.width}, minmax(0, 1fr))`,
        gridTemplateRows: `repeat(${level.height}, minmax(0, 1fr))`,
        gap: 3,
        padding: 10,
        touchAction: "none",
        userSelect: "none",
      }}
    >
      {kinds.map((k, i) => (
        <Cell key={i} kind={k} cellRef={i === state.body[0] ? props.headRef : i === level.exit ? props.exitRef : undefined}>
          {k === "head" && <Eyes dir={facing(state)} />}
          {k === "key" && <TileIcon trick="key" size="62%" />}
          {k === "lock" && <TileIcon trick="lock" size="58%" />}
          {k === "arrow" && <TileIcon trick="oneway" dir={level.arrows[i] ?? "right"} size="64%" />}
        </Cell>
      ))}
    </div>
  );
}

type Kind =
  | "wall"
  | "floor"
  | "apple"
  | "exit"
  | "open"
  | "body"
  | "head"
  | "key"
  | "lock"
  | "unlocked"
  | "arrow"
  | "portalA"
  | "portalB";

/** What every cell shows, in reading order. The snake is drawn over any floor-like tile it lies on. */
export function cellKinds(s: PuzzleState): Kind[] {
  const { level } = s;
  const held = holdsKey(s);
  const out: Kind[] = level.walls.map((w, i) =>
    w ? "wall" : level.locks[i] ? (held ? "unlocked" : "lock") : level.arrows[i] ? "arrow" : "floor",
  );
  level.portals.forEach((p, i) => {
    out[p] = i === 0 ? "portalA" : "portalB";
  });
  level.keys.forEach((k, i) => {
    if (!s.got[i]) out[k] = "key";
  });
  level.apples.forEach((a, i) => {
    if (!s.eaten[i]) out[a] = "apple";
  });
  out[level.exit] = exitOpen(s) ? "open" : "exit";
  s.body.forEach((c, i) => {
    out[c] = i === 0 ? "head" : "body";
  });
  return out;
}

const CELL_STYLE: Record<Kind, CSSProperties> = {
  wall: { background: "#3b3f7a", boxShadow: "inset 0 -3px 0 #262a5c" },
  floor: { background: "#141938" },
  apple: { background: "#141938" },
  exit: { background: "transparent", border: `3px dashed ${INK.gold}88` },
  open: { background: `radial-gradient(${INK.gold}55, transparent)`, border: `3px solid ${INK.gold}`, boxShadow: `0 0 16px ${INK.gold}88` },
  body: { background: `linear-gradient(135deg, ${INK.rim}, ${INK.mint})`, borderRadius: "22%", boxShadow: `0 0 10px ${INK.mint}55` },
  head: { background: INK.mint, borderRadius: "26%", boxShadow: `0 0 14px ${INK.mint}` },
  // World 2's tiles, as the approved mock draws them.
  key: { background: "#141938", display: "grid", placeItems: "center" },
  lock: { background: "#5a3b16", boxShadow: `inset 0 0 0 3px ${INK.gold}`, display: "grid", placeItems: "center" },
  unlocked: { background: "#141938", boxShadow: `inset 0 0 0 2px ${INK.gold}55` },
  arrow: { background: "#16224d", display: "grid", placeItems: "center" },
  portalA: { background: "radial-gradient(circle, #a29bfe 0 30%, #6c5ce7 31% 55%, #141938 56%)", boxShadow: "0 0 14px #a29bfe" },
  portalB: { background: "radial-gradient(circle, #fd79a8 0 30%, #e84393 31% 55%, #141938 56%)", boxShadow: "0 0 14px #fd79a8" },
};

function Cell({ kind, children, cellRef }: { kind: Kind; children?: ReactNode; cellRef?: Ref<HTMLDivElement> }) {
  return (
    <div
      ref={cellRef}
      data-kind={kind}
      style={{ position: "relative", borderRadius: "14%", boxSizing: "border-box", minWidth: 0, minHeight: 0, ...CELL_STYLE[kind] }}
    >
      {kind === "apple" && (
        <span
          style={{
            position: "absolute",
            inset: "20%",
            borderRadius: "50%",
            background: "radial-gradient(circle at 35% 35%, #ff9f9f, #e84343)",
            boxShadow: `0 0 12px ${INK.red}99`,
          }}
        />
      )}
      {children}
    </div>
  );
}

const EYE_AT: Record<Dir, [string, string][]> = {
  right: [["58%", "28%"], ["58%", "56%"]],
  left: [["24%", "28%"], ["24%", "56%"]],
  up: [["26%", "22%"], ["56%", "22%"]],
  down: [["26%", "60%"], ["56%", "60%"]],
};

function Eyes({ dir }: { dir: Dir }) {
  return (
    <>
      {EYE_AT[dir].map(([left, top]) => (
        <span key={left + top} style={{ position: "absolute", left, top, width: "18%", height: "18%", borderRadius: "50%", background: INK.bg }} />
      ))}
    </>
  );
}

/**
 * The level's new tile, explained in one line. Drawn over the BOTTOM wall row
 * every World 2 board has (the band and top row belong to the stuck strip),
 * and out of layout, so a level with a hint is exactly as tall as one
 * without: moving between levels never moves the frame. Outside the grid's
 * `role="img"`, so a screen reader reads it.
 */
function Hint({ text, rows }: { text: string; rows: number }) {
  return (
    <p
      role="note"
      style={{
        position: "absolute",
        left: 10,
        right: 10,
        bottom: 10,
        // One grid row: the grid is the board minus the band, then its 10px
        // padding top and bottom and a 3px gap between rows.
        height: `calc((100% - ${BAND_H}px - 20px - ${(rows - 1) * 3}px) / ${rows})`,
        margin: 0,
        padding: "0 8px",
        boxSizing: "border-box",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        textAlign: "center",
        borderRadius: 8,
        background: "#1a1f45f2",
        border: `1.5px solid ${INK.rim}`,
        color: INK.text,
        fontSize: 12,
        lineHeight: 1.15,
        fontWeight: 600,
        overflow: "hidden",
        zIndex: 1,
        pointerEvents: "none",
      }}
    >
      {text}
    </p>
  );
}

/** A drag of 24px or more on the board is a press in its longer direction. */
export function swipeDir(dx: number, dy: number): Dir | null {
  if (Math.max(Math.abs(dx), Math.abs(dy)) < 24) return null;
  return Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? "right" : "left") : dy > 0 ? "down" : "up";
}

/**
 * NO WAY ON. Text saying so, and the two ways out as REAL buttons under it:
 * the words describe, the buttons do - never a disabled control standing in
 * for either (`a-control-that-carries-an-imperative-must-be-a-control.md`).
 *
 * Drawn over the TOP of the board - the band and the border wall row every
 * level has - so it never covers the snake it is talking about, and never
 * takes layout room: a press that leaves the snake stuck must not move the
 * frame (`a-key-a-game-could-use-never-scrolls-the-page.md`).
 */
function StuckStrip({ T, onUndo, onStartOver }: { T: Words; onUndo: () => void; onStartOver: () => void }) {
  return (
    <div
      role="status"
      style={{
        position: "absolute",
        left: 8,
        right: 8,
        top: 6,
        padding: "8px 10px",
        borderRadius: 14,
        background: "#1a1f45ee",
        border: `1.5px solid ${INK.rim}`,
        color: INK.text,
        display: "flex",
        flexWrap: "wrap",
        alignItems: "center",
        justifyContent: "center",
        gap: 8,
        zIndex: 2,
      }}
    >
      <span style={{ fontWeight: 700, fontSize: 15, flexBasis: "100%", textAlign: "center" }}>{T.stuck}</span>
      <button type="button" onClick={onUndo} style={{ ...cardBtn, background: "#fff", color: "#241c17" }}>
        ↶ {T.undo}
      </button>
      <button type="button" onClick={onStartOver} style={{ ...cardBtn, background: "#fff", color: "#241c17" }}>
        ↺ {T.restart}
      </button>
    </div>
  );
}

const cardBtn: CSSProperties = {
  minHeight: 44,
  padding: "0 16px",
  border: "none",
  borderRadius: 14,
  fontFamily: FONT,
  fontWeight: 700,
  fontSize: 16,
  cursor: "pointer",
  touchAction: "manipulation",
};

/**
 * The solved card. NePo, forum post #13: "There should be a menu option to
 * replay levels you have already won" - the picker existed, behind the footer's
 * Levels button, and a player who had just won did not find it. So the card
 * offers it too: Next level stays the primary button, and All levels sits under
 * it as a secondary one. On the last level there is no next, and All levels
 * takes the primary place instead of appearing twice.
 */
function Solved(p: { card: SolvedCard; id: string; par: number; T: Words; last: boolean; onTry: () => void; onNext: () => void; onLevels: () => void }) {
  const { card, T } = p;
  return (
    <section
      aria-label={fill(T.solved, { id: p.id })}
      style={{ position: "absolute", inset: 0, display: "grid", placeItems: "center", background: `${INK.bg}cc`, zIndex: 3 }}
    >
      <div
        style={{
          width: "82%",
          padding: "20px 16px",
          textAlign: "center",
          borderRadius: 18,
          border: `1px solid ${INK.rim}`,
          background: "#1a1f45",
          color: INK.text,
        }}
      >
        <div style={{ fontWeight: 700, fontSize: 22 }}>{fill(T.solved, { id: p.id })}</div>
        <div role="img" aria-label={fill(T.starsOf, { n: card.stars })} dir="ltr" style={{ fontSize: 40, letterSpacing: 6, margin: "4px 0" }}>
          {[1, 2, 3].map((n) => (
            <span key={n} style={n <= card.stars ? { color: INK.gold, textShadow: `0 0 12px ${INK.gold}88` } : { color: "#ffffff30" }}>
              ★
            </span>
          ))}
        </div>
        <div style={{ opacity: 0.8, margin: "2px 0 14px", fontSize: 15 }}>
          {fill(T.movesDone, { moves: card.moves })} · {fill(T.starsIn, { stars: "★★★", n: p.par })} ·{" "}
          {fill(T.starsIn, { stars: "★★", n: p.par + starMargin(p.par) })}
        </div>
        <div style={{ display: "flex", gap: 10, justifyContent: "center", flexWrap: "wrap" }}>
          <button type="button" onClick={p.onTry} style={{ ...cardBtn, background: "#fff", color: "#241c17", minHeight: 52 }}>
            {T.tryAgain}
          </button>
          <button type="button" onClick={p.last ? p.onLevels : p.onNext} style={{ ...cardBtn, background: "var(--brand-strong)", color: "var(--on-brand)", minHeight: 52 }}>
            {p.last ? T.allLevels : T.nextLevel}
          </button>
        </div>
        {!p.last && (
          <button
            type="button"
            onClick={p.onLevels}
            style={{ ...cardBtn, marginTop: 10, background: "transparent", color: INK.text, border: `2px solid ${INK.rim}` }}
          >
            ▦ {T.allLevels}
          </button>
        )}
      </div>
    </section>
  );
}
