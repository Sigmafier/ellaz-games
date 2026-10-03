import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { GameContext, SessionSpec } from "@sdk/index";
import type { Locale } from "@i18n/index";
import { BOARD_CLASS, boardVars, isPcArena } from "@ui/boardSize";
import { GameChrome } from "@ui/GameChrome";
import { type DifficultyOption } from "@ui/DifficultySelector";
import { haptic, popEl } from "@juice/index";
import { playNote } from "@sdk/note";
import { useGameSession, useRememberedLevel } from "@shared/index";
import {
  LENGTHS,
  ROWS,
  VOICES,
  cellIndex,
  clearTune,
  columnRows,
  isMusicSnapshot,
  newTune,
  resumeTune,
  noteCount,
  resize,
  setVoice,
  surprise,
  toggleCell,
  SNAPSHOT_VERSION,
  type Length,
  type MusicSnapshot,
  type TuneState,
  type Voice,
} from "./logic";
import { STEP_MS, bassFor, noteFor } from "./sound";

// The renderer. Every rule about what a tap DOES lives in logic.ts; this file
// decides what a tap LOOKS and SOUNDS like.
//
// NO SCORE AND NO COINS, like `coloring` (operator ruling 2026-10-03, from a
// player report of 2026-09-14). It used to bank a record of the biggest tune
// and a coin every six notes, and both were judgements of a thing a child
// made: the record said busy beats pretty, and the coin paid for busy. What is
// left on screen is a plain count of the notes in the tune right now.
//
// TAP, NEVER DRAG. There is no gesture in this game at all: a square is on or
// off, the play button is a button, and the three voices are three buttons.
// Painting a row by dragging across it would be a lovely addition ON TOP; it
// may never be the only way through (the kids rule in CLAUDE.md).
//
// THE CLOCK LIVES HERE AND NOWHERE ELSE. `playing` and the playhead are React
// state, never `TuneState`, so a snapshot can never restore a tune that is
// mid-playback with no loop behind it - which is the memory `lock` trap in
// session-snapshot-convention.md, avoided by construction rather than by a
// `settle()` at save time.

const LEVEL_OPTIONS: DifficultyOption<Length>[] = [
  { id: "short", label: { he: "קצר", en: "Short", es: "Corta", sv: "Kort" } },
  // "Medium", not "Med": the disc has room for the word, and a child reading
  // "Med" next to "Short" and "Long" is reading an abbreviation for nothing.
  { id: "medium", label: { he: "בינוני", en: "Medium", es: "Media", sv: "Medel" } },
  { id: "long", label: { he: "ארוך", en: "Long", es: "Larga", sv: "Lång" } },
];

// This game's own words, as a locale RECORD rather than a `locale === "he" ?`
// ternary - promoting a language reds this block by name instead of leaving the
// game speaking English inside a page that is not.
/**
 * What the level picker IS. The three levels are a tune's LENGTH - four, six or
 * eight beats - and nothing about a longer tune is harder; the chrome's default
 * word "Difficulty" told a child otherwise (report, 2026-09-14).
 */
const LENGTH_LABEL: Record<Locale, string> = { he: "אורך", en: "Length", es: "Duración", sv: "Längd" };

const WORDS: Record<
  Locale,
  {
    hint: string;
    notes: string;
    play: string;
    stop: string;
    surprise: string;
    voice: Record<Voice, string>;
    note: (col: number) => string;
    on: string;
    off: string;
  }
> = {
  he: {
    hint: "הקישו על הריבועים, ואז על הנגן",
    notes: "תווים",
    play: "נגנו",
    stop: "עצרו",
    surprise: "הפתיעו אותי",
    voice: { round: "צליל עגול", soft: "צליל רך", bright: "צליל בהיר" },
    note: (col) => `תו בפעימה ${col}`,
    on: "דולק",
    off: "כבוי",
  },
  en: {
    hint: "Tap the squares, then tap play",
    notes: "Notes",
    play: "Play",
    stop: "Stop",
    surprise: "Surprise me",
    voice: { round: "round sound", soft: "soft sound", bright: "bright sound" },
    note: (col) => `note on beat ${col}`,
    on: "on",
    off: "off",
  },
  es: {
    hint: "Toca los cuadros y luego el play",
    notes: "Notas",
    play: "Tocar",
    stop: "Parar",
    surprise: "Sorpréndeme",
    voice: { round: "sonido redondo", soft: "sonido suave", bright: "sonido brillante" },
    note: (col) => `nota en el tiempo ${col}`,
    on: "encendida",
    off: "apagada",
  },
  sv: {
    hint: "Tryck på rutorna och sedan på play",
    notes: "Toner",
    play: "Spela",
    stop: "Stopp",
    surprise: "Överraska mig",
    voice: { round: "runt ljud", soft: "mjukt ljud", bright: "ljust ljud" },
    note: (col) => `ton på slag ${col}`,
    on: "på",
    off: "av",
  },
};

/* -------------------------------------------------------------- the style */

/**
 * One colour per ROW, warm at the top and cool at the bottom.
 *
 * The colour is the second way a child reads the pitch, after the height - and
 * it is the one that survives a tune being looked at rather than listened to.
 * Index 0 is the top row, which `pitchFor` makes the highest note.
 */
const ROW_COLORS: readonly string[] = [
  "#FF4D8D", // raspberry - highest
  "#FF8A3D", // tangerine
  "#FFC730", // sunflower
  "#6FD44E", // lime
  "#3DBBEE", // lagoon
  "#8093F1", // periwinkle - lowest
];

/** The board itself. Deliberately not a theme token - see the note on the grid. */
const WELL = "#1D2440";
const WELL_CELL = "#28315A";
/** The column the playhead is on, behind whatever notes sit in it. */
const WELL_HEAD = "#3B477E";

/**
 * WHAT A SQUARE SOUNDS LIKE lives in `sound.ts`, and so does the beat length
 * (`STEP_MS`). Since 2026-10-03 a square is a STRUCK note - round = marimba bar,
 * soft = kalimba tine, bright = glass - played through `playNote` from
 * `@sdk/note`, with a quiet bass on beat 1 of every loop. The operator picked
 * that arm ("struck + bass", arm C) by ear in the listening lab
 * (`src/lab/musicSound/`) over today's bare oscillator, after a player wrote
 * "the music feels too empty". One file owns the numbers, so the game and the
 * lab cannot drift apart.
 */
const BASS = "downbeat" as const;

/* ------------------------------------------------------------------ glyphs */

/**
 * Original SVG, and that is a rule rather than a preference: the operator's
 * standing law is no emoji in product chrome, SVG only. A play triangle and a
 * stop square also need no reading, in any language.
 */
function Glyph({ d, filled = false }: { d: string; filled?: boolean }) {
  return (
    <svg
      viewBox="0 0 24 24"
      width="1em"
      height="1em"
      aria-hidden="true"
      fill={filled ? "currentColor" : "none"}
      stroke={filled ? "none" : "currentColor"}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d={d} />
    </svg>
  );
}

const PLAY_D = "M7.5 5.2 19 12 7.5 18.8z";
const STOP_D = "M6.4 6.4h11.2v11.2H6.4z";
const SPARK_D = "M12 3.4 13.7 9l5.6 1.7-5.6 1.7L12 18l-1.7-5.6L4.7 10.7 10.3 9z";
/** The three voices, drawn as what they sound like: smooth, soft, spiky. */
const VOICE_D: Record<Voice, string> = {
  round: "M3 12c2.6-7 5.2-7 7.8 0s5.2 7 7.8 0",
  soft: "M3.5 15.5c3-9 6-9 8.5 0 2.5-6 5-6 8 0",
  bright: "M3 16.5 6 7.5 9 16.5 12 7.5 15 16.5 18 7.5 21 16.5",
};

/* ------------------------------------------------------------- the snapshot */

/** The tune, and nothing else - see `SNAPSHOT_VERSION` in logic.ts for why. */
const SESSION: SessionSpec<MusicSnapshot> = { version: SNAPSHOT_VERSION, validate: isMusicSnapshot };

/* ----------------------------------------------------------------- the game */

export function MusicGame({ ctx }: { ctx: GameContext }) {
  // The length a child last chose, VALIDATED against this game's own list - an
  // id no longer in the list resolves to -1 in GameChrome's findIndex and the
  // toggle silently disappears.
  const [level, setLevel] = useRememberedLevel(ctx, LENGTHS, "medium");
  // Read ONCE at mount. A phone run keeps its per-cell viewport expression; a
  // PC run sizes the whole board from the height the window gives it.
  const [pc] = useState(isPcArena);

  // Read ONCE, before the first render, so a returning child's tune never
  // flashes as an empty grid.
  // A version-2 save, or a version-1 one from before the toy stopped paying -
  // the tune comes back either way (`resumeTune`, logic.ts).
  const restored = useMemo(() => resumeTune((spec) => ctx.session.load(spec)), [ctx]);
  const resume = restored && restored.state.level === level ? restored : undefined;

  const [state, setState] = useState<TuneState>(() => resume?.state ?? newTune(level));
  const [playing, setPlaying] = useState(false);
  /** Which beat is sounding right now. Renderer-only - see the header. */
  const [head, setHead] = useState<number | null>(null);

  const startedRef = useRef(false);
  /** The live tune, for the playback loop - so editing does not restart it. */
  const stateRef = useRef(state);
  stateRef.current = state;

  const T = WORDS[ctx.locale];
  const notes = noteCount(state);

  /* ------------------------------------------------------------ the sound */

  /** Ring one square. Every note in the app goes through here. */
  const ring = useCallback(
    (row: number, voice: Voice) => {
      playNote(ctx.audio, noteFor(row, voice));
    },
    [ctx],
  );

  /** Ring a whole beat. Top note first, always - see `columnRows`. */
  const ringColumn = useCallback(
    (col: number) => {
      const tune = stateRef.current;
      for (const row of columnRows(tune, col)) ring(row, tune.voice);
      // The quiet bass under the tune, on beat 1 of each loop (see `sound.ts`).
      const bass = bassFor(BASS, col);
      if (bass) playNote(ctx.audio, bass);
    },
    [ctx, ring],
  );

  // The playhead. A frame loop rather than an interval, and it reads the tune
  // out of a REF rather than out of props: a loop that restarted on every edit
  // would jump the beat every time a child touched a square, which is exactly
  // when they are listening hardest.
  useEffect(() => {
    if (!playing) return;
    const started = performance.now();
    let raf = 0;
    let last = -1;
    const tick = (now: number) => {
      const col = Math.floor((now - started) / STEP_MS) % stateRef.current.steps;
      if (col !== last) {
        last = col;
        setHead(col);
        ringColumn(col);
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(raf);
      setHead(null);
    };
  }, [playing, ringColumn]);

  // A tune playing into a pocket is the one thing this toy could do that a
  // parent would mind. The tab going away stops it.
  useEffect(() => ctx.onPause(() => setPlaying(false)), [ctx]);

  /* ------------------------------------------------------------ the taps */

  const startLevel = useCallback(
    (next: Length) => {
      setLevel(next);
      // RESIZE, never a fresh grid. Every other game in this catalogue treats a
      // level change as a new deal, and that is right for a puzzle and wrong
      // for a thing somebody made.
      setState((prev) => resize(prev, next));
      ctx.analytics.levelStart(next);
    },
    [ctx, setLevel],
  );

  // GameChrome's restart button. A deliberate act on an empty-able toy, so it
  // starts a genuinely new tune.
  const restart = useCallback(() => {
    setPlaying(false);
    setState((prev) => clearTune(prev));
  }, []);

  useEffect(() => {
    if (!startedRef.current) {
      startedRef.current = true;
      ctx.lifecycle.gameplayStart();
      ctx.analytics.levelStart(level);
    }
  }, [ctx, level]);

  // ALWAYS live. A tune is never over, so there is nothing to clear - the same
  // answer `coloring` gives, and for the same reason: a finished drawing is not
  // a solved puzzle.
  useGameSession(ctx, SESSION, () => ({ state }), { live: true });

  const onCell = useCallback(
    (index: number, el: HTMLElement) => {
      ctx.audio.unlock();
      ctx.speech.unlock();

      const { state: next, outcome } = toggleCell(state, index);
      if (outcome.kind === "ignored") return;
      setState(next);
      haptic.tap();
      popEl(el);

      // Turning a note ON plays it, so a child hears what they just made
      // without waiting for the playhead to come round. Turning one off is
      // silent - there is no sound for a thing that is no longer there.
      if (outcome.kind !== "on") return;
      ring(outcome.row, next.voice);
    },
    [ctx, ring, state],
  );

  const onSurprise = useCallback(() => {
    ctx.audio.unlock();
    setState(surprise(state));
    haptic.tap();
  }, [ctx, state]);

  const onPlay = useCallback(() => {
    // Inside the tap, so iOS opens its gate. Without this the first play of a
    // session is silent and nothing on screen says why.
    ctx.audio.unlock();
    haptic.tap();
    setPlaying((p) => !p);
  }, [ctx]);

  const onVoice = useCallback(
    (voice: Voice) => {
      ctx.audio.unlock();
      const next = setVoice(state, voice);
      if (next === state) return;
      setState(next);
      haptic.tap();
      // Hear the new voice at once, on a note the tune actually contains, so
      // the button demonstrates itself rather than describing itself.
      ring(columnRows(next, 0)[0] ?? Math.floor(ROWS / 2), voice);
    },
    [ctx, ring, state],
  );

  /* ----------------------------------------------------------- the screen */

  const steps = state.steps;
  // Sized against the VIEWPORT, not this container, like every board here. On a
  // 390px phone the eight-beat grid comes out ~43px a square; the 62px cap
  // stops the four-beat one becoming enormous on a desktop and sits well under
  // what the 700px panel leaves (game-panel-clears-widest-board.test.ts).
  const cell = `min(${(88 / steps).toFixed(2)}vw, 7vh, 62px)`;

  const controlStyle = {
    height: 56,
    minWidth: 56,
    border: "none",
    borderRadius: "var(--radius-2)",
    background: "var(--surface-2)",
    color: "var(--text)",
    display: "grid",
    placeItems: "center",
    fontSize: 26,
    cursor: "pointer",
    touchAction: "none" as const,
  };

  return (
    <GameChrome
      ctx={ctx}
      // The notes in the tune RIGHT NOW, and no record beside them: a count of
      // what is there, never a best to beat.
      stats={[{ icon: "layers", label: T.notes, value: notes, compact: true }]}
      levels={LEVEL_OPTIONS}
      level={level}
      onLevel={startLevel}
      levelLabel={LENGTH_LABEL[ctx.locale]}
      onRestart={restart}
      footer={
        <div
          style={{
            background: "var(--surface)",
            borderRadius: "var(--radius-2)",
            boxShadow: "var(--shadow-1)",
            padding: "10px 10px 12px",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 8,
          }}
        >
          <div
            // The controls. LTR like the grid: these are positions a child
            // points at, and they sit under a strip that reads left to right.
            dir="ltr"
            style={{
              display: "flex",
              // The count is fixed but the WIDTH is not, and this container
              // clips rather than scrolls
              // (a-row-that-grows-with-the-catalog-must-wrap.md).
              flexWrap: "wrap",
              justifyContent: "center",
              alignItems: "center",
              gap: 8,
              width: "100%",
            }}
          >
            <button
              type="button"
              aria-label={playing ? T.stop : T.play}
              onClick={onPlay}
              style={{
                ...controlStyle,
                flex: "1 1 120px",
                // --brand-strong: white on Day's --brand is 3.14:1 and on
                // Night's --brand-fill gradient 2.28 (contrast sweep 2026-09-29).
                background: "var(--brand-strong)",
                color: "var(--on-brand)",
                fontSize: 30,
              }}
            >
              <Glyph d={playing ? STOP_D : PLAY_D} filled />
            </button>
            <button
              type="button"
              aria-label={T.surprise}
              onClick={onSurprise}
              style={{ ...controlStyle, flex: "0 0 auto" }}
            >
              <Glyph d={SPARK_D} filled />
            </button>
            {VOICES.map((v) => (
              <button
                key={v}
                type="button"
                aria-label={T.voice[v]}
                aria-pressed={state.voice === v}
                onClick={() => onVoice(v)}
                style={{
                  ...controlStyle,
                  flex: "0 0 auto",
                  outline: state.voice === v ? "3px solid var(--brand)" : "none",
                  outlineOffset: -3,
                }}
              >
                <Glyph d={VOICE_D[v]} />
              </button>
            ))}
          </div>
          <b
            style={{
              fontSize: 15,
              fontFamily: "Fredoka, inherit",
              textAlign: "center",
              color: "var(--text-dim)",
            }}
          >
            {T.hint}
          </b>
        </div>
      }
    >
      <div
        className={pc ? `ellaz-play-surface ${BOARD_CLASS}` : "ellaz-play-surface"}
        // LTR, always. Time runs left to right in every notation there is, and
        // an RTL grid would lay beat 1 out on the visual right - so the tune a
        // child watched would play backwards against the one they drew
        // (rtl-spatial-grid-dir-ltr.md).
        dir="ltr"
        style={{
          // PC: the strip's width comes from `.ellaz-board` - the height the
          // window leaves, times beats over notes - and every square is a `1fr`
          // track of it. chrome 230 is an ESTIMATE: the 111 every GameChrome
          // game pays plus the controls card (56px row, the hint line, its
          // padding) and the footer's 14.
          ...(pc
            ? {
                ...boardVars({ vw: 92, vh: 56, cap: 520, chrome: 111, ratio: steps / ROWS }),
                aspectRatio: `${steps} / ${ROWS}`,
              }
            : {}),
          display: "grid",
          gridTemplateColumns: pc ? `repeat(${steps}, 1fr)` : `repeat(${steps}, ${cell})`,
          // Explicit ROWS as well: without them a taller cell stretches its row
          // and the square grid deforms.
          gridTemplateRows: pc ? `repeat(${ROWS}, 1fr)` : `repeat(${ROWS}, ${cell})`,
          gap: 4,
          padding: 6,
          background: WELL,
          borderRadius: 16,
          touchAction: "none",
        }}
      >
        {state.cells.map((on, i) => {
          const row = Math.floor(i / steps);
          const col = i % steps;
          const lit = head === col;
          return (
            <button
              key={i}
              type="button"
              // Every square reads the same without its beat and its colour, so
              // a screen reader could not tell 48 of them apart. One-based,
              // because nobody counts from zero out loud.
              aria-label={`${T.note(col + 1)} ${on ? T.on : T.off}`}
              aria-pressed={on}
              onClick={(e) => onCell(cellIndex(row, col, steps), e.currentTarget)}
              style={{
                minWidth: 0,
                minHeight: 0,
                padding: 0,
                border: "none",
                borderRadius: "26%",
                background: on ? ROW_COLORS[row] : lit ? WELL_HEAD : WELL_CELL,
                // A note under the playhead lifts rather than changes colour,
                // so the beat is legible without the tune appearing to change.
                transform: on && lit ? "scale(1.08)" : "none",
                boxShadow: on
                  ? "inset 0 2px 0 rgba(255,255,255,0.3), inset 0 -2px 0 rgba(0,0,0,0.22)"
                  : "none",
                transition: "background 0.1s ease, transform 0.1s ease",
                cursor: "pointer",
                touchAction: "none",
              }}
            />
          );
        })}
      </div>
    </GameChrome>
  );
}
