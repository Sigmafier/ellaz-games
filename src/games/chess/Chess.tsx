import { textFor } from "@i18n/index";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { GameContext, RewardTier } from "@sdk/index";
import type { SessionSpec } from "@sdk/session";
import { GameChrome } from "@ui/GameChrome";
import { BOARD_CLASS, boardVars } from "@ui/boardSize";
import type { DifficultyOption } from "@ui/DifficultySelector";
import { burst, haptic, shake } from "@juice/index";
import { useGameSession, useRememberedLevel, winMoment } from "@shared/index";
import { scheduleOpponent } from "@shared/opponent";
// Direct module paths, not the `@shared` barrel: pass-and-play is two games'
// worth of code and the barrel would pull it into every other game's chunk.
import {
  finish as finishMatch,
  newVersus,
  nextMatch,
  pass,
  versusWords,
  type Seat,
  type VersusState,
} from "@shared/versus";
import { VersusBanner, VersusToggle } from "@shared/VersusBanner";
import { versusMatchEnd } from "@shared/versusMoment";
import { type Level, think } from "./engine";
import {
  applyMove,
  fromFen,
  legalMoves,
  isCheck,
  outcome,
  positionKey,
  squareName,
  startPosition,
  toFen,
  type Move,
  type Position,
} from "./logic";

/**
 * The pieces, as the one glyph set that renders SOLID at any size.
 *
 * U+265A..265F is Unicode's "black" set, and both sides are drawn from it -
 * white is the same shape in white ink with a dark outline. The outline set
 * (U+2654..2659) is NOT used, because it is hairline at a phone's cell size
 * and several fonts substitute a different face for it, so the two armies stop
 * matching. This is what the approved mock draws.
 */
const GLYPH: Record<string, string> = { k: "♚", q: "♛", r: "♜", b: "♝", n: "♞", p: "♟" };

/**
 * THE TWO SIDES ARE A FIXED PAIR, AND NEITHER MAY BE A THEME TOKEN.
 *
 * This shipped as `#fff` against `var(--text)`, which is right on the day
 * theme and collapses on the night one: measured on the live page,
 * 2026-09-21, white-against-black was **16.75:1 in market and 1.08:1 in
 * night**. Both armies rendered the same near-white, and a player could not
 * tell their pieces from the computer's. Found by loading the page, not by
 * any gate here - `contrast.test.ts` reads a hand-kept list of token pairs
 * and this collision is between a token and a literal.
 *
 * A fixed pair alone is not enough either, because the SQUARES invert with
 * the theme - measured the same minute, off the rendered buttons:
 *
 *            squares                 INK alone, against those squares
 *   market   255,247,224 / 234,175,195    light piece 1.00 / 1.72   <- gone
 *   night     57, 54, 70 /  57, 54,121    dark  piece 1.45 / 1.61   <- gone
 *
 * So each side carries the OTHER tone as an outline, `paintOrder: stroke
 * fill` so the outline sits outside the glyph rather than eating it. The
 * light army reads by its dark edge on a light board and by its fill on a
 * dark one; the dark army does the opposite. Sides against each other:
 * 15.96:1 in BOTH themes, which is the number that actually matters.
 */
const LIGHT_ARMY = "#fbf6ec";
const DARK_ARMY = "#241a12";
/**
 * THE BOARD IS FIXED TOO, and that is the half the first fix missed.
 *
 * Giving the two armies a fixed pair made them 15.96:1 apart from each other
 * and still left them looking alike, because the SQUARES followed the theme:
 * at night both were navy (57,54,70 and 57,54,121), so the dark army was
 * 1.45:1 against the board and survived only as its own outline - and an
 * outline drawn in the light army's tone reads, at 40px, as a light piece.
 * Operator, looking at the live phone render: "they look the same color!"
 *
 * A chess set does not change colour with the room. Cream and walnut in both
 * themes, which is also what the approved mock showed - that mock was only
 * ever rendered in the LIGHT theme, where these tokens happened to resolve to
 * exactly this. Measured on the rendered board, 2026-09-22:
 *
 *            light sq   dark sq        ivory piece    near-black piece
 *   both     #efdcbe    #9a6f4c        1.29 / 2.69    11.41 / 5.46
 *
 * The ivory army reads by its DARK RIM and the dark army by its FILL, on both
 * squares, in both themes - one pair of numbers now instead of two.
 */
const LIGHT_SQ = "#efdcbe";
const DARK_SQ = "#9a6f4c";

const DIFF_OPTIONS: DifficultyOption<Level>[] = [
  { id: "easy", label: { he: "קל", en: "Easy", es: "Fácil", sv: "Lätt" } },
  { id: "normal", label: { he: "בינוני", en: "Med", es: "Media", sv: "Medel" } },
  { id: "hard", label: { he: "קשה", en: "Hard", es: "Difícil", sv: "Svår" } },
];

/**
 * The engine's word for a strength, translated to the ECONOMY's word for a
 * tier. They differ by one - `normal` against `medium` - and this map is where
 * that is said, once. `Record<Level, ...>` means a fourth strength cannot be
 * added without deciding what it pays.
 */
const TIER: Record<Level, RewardTier> = { easy: "easy", normal: "medium", hard: "hard" };

/** Which seat plays which colour in pass-and-play. Seat 0 is white and opens. */
const SEAT_COLOR = ["w", "b"] as const;

interface ChessSession {
  level: Level;
  /** The whole game as FENs, start first. Take-back and threefold both need the list. */
  fens: string[];
}

const SESSION: SessionSpec<ChessSession> = {
  version: 1,
  validate(value): value is ChessSession {
    if (typeof value !== "object" || value === null) return false;
    const v = value as Partial<ChessSession>;
    if (!DIFF_OPTIONS.some((o) => o.id === v.level)) return false;
    // A FEN list with nothing in it is not a position, and one that is not a
    // list of strings is something this build cannot parse. Both read as
    // "never played", which is the one answer every caller already handles.
    return Array.isArray(v.fens) && v.fens.length > 0 && v.fens.every((f) => typeof f === "string");
  },
};

/**
 * Chess, the whole official rules, against a computer at three strengths or
 * against the person next to you.
 *
 * THE PLAYER IS ALWAYS WHITE and the board is never flipped. Two people
 * passing one phone share one view: a board that spins between turns is how a
 * child loses track of which pieces are theirs, and it buys nothing that
 * `VersusBanner`'s colour does not already say.
 *
 * WHAT THIS FILE DOES NOT KNOW: any rule of chess, and anything about how the
 * computer chooses. `logic.ts` owns the first and `engine.ts` the second, and
 * this file may not re-derive either - a renderer that decides what is legal
 * is a second rulebook nothing keeps in sync with the one perft proved.
 */
export function Chess({ ctx }: { ctx: GameContext }) {
  const [difficulty, setDifficulty] = useRememberedLevel(
    ctx,
    DIFF_OPTIONS.map((o) => o.id),
    "normal",
  );

  // THE GAME IS THE LIST OF POSITIONS, not the current one. Take-back needs
  // the previous board and threefold repetition needs every board, so keeping
  // the list IS the state and `positions[positions.length - 1]` is the board.
  const restored = useMemo(() => ctx.session.load(SESSION), [ctx]);
  const [positions, setPositions] = useState<Position[]>(() => {
    if (!restored || restored.level !== difficulty) return [startPosition()];
    try {
      const list = restored.fens.map(fromFen);
      const last = list[list.length - 1];
      // A finished game is not a position to carry on from. Discarding it here
      // also closes the only door through which a restored board could reach
      // the win path twice.
      return outcome(last, list.slice(0, -1).map(positionKey)).kind === "playing"
        ? list
        : [startPosition()];
    } catch {
      return [startPosition()];
    }
  });

  const [versus, setVersus] = useState<VersusState | undefined>(undefined);
  const [from, setFrom] = useState<number | null>(null);
  const [promoting, setPromoting] = useState<{ from: number; to: number } | null>(null);
  const [thinking, setThinking] = useState(false);
  const [best, setBest] = useState<number | undefined>(() => ctx.score?.best(difficulty));
  const [wins, setWins] = useState(0);

  const boardRef = useRef<HTMLDivElement>(null);
  const started = useRef(false);
  // The run of wins, in a ref rather than state: `finish` runs from a click
  // handler AND from the opponent's callback, where a state read is stale.
  const streakRef = useRef(0);
  // ONE payout per game, latched rather than derived: a terminal position is
  // reachable from the player's move and from the computer's, and `winMoment`
  // must not run twice for one game.
  const paidRef = useRef(false);
  // The cancel for the reply in flight. Every door that deals a new board must
  // call it - restart, difficulty, the two-player switch, unmount, take-back.
  const cancelRef = useRef<(() => void) | null>(null);

  const position = positions[positions.length - 1];
  const keys = useMemo(() => positions.map(positionKey), [positions]);
  const result = outcome(position, keys.slice(0, -1));
  const done = result.kind !== "playing";
  const moves = useMemo(() => (done ? [] : legalMoves(position)), [position, done]);

  // Whose hand is on the board. Against the computer that is white and only
  // white; in a match it is whichever seat's turn it is.
  const mySide = versus ? SEAT_COLOR[versus.turn] : "w";
  const myTurn = !done && position.turn === mySide && !thinking;

  const winner: Seat | "draw" | undefined = !versus
    ? undefined
    : result.kind === "checkmate"
      ? ((result.winner === "w" ? 0 : 1) as Seat)
      : done
        ? "draw"
        : undefined;

  useEffect(() => {
    if (started.current) return;
    started.current = true;
    ctx.lifecycle.gameplayStart();
    ctx.analytics.levelStart("vs-ai");
  }, [ctx]);

  // Nothing about "the computer is thinking" ever reaches the disk: it is a
  // state only a timer can leave, and a snapshot caught inside it would restore
  // a board waiting forever for a reply nobody scheduled. The list of FENs says
  // whose turn it is, and the effect below schedules a fresh think from that.
  useGameSession(ctx, SESSION, () => ({ level: difficulty, fens: positions.map(toFen) }), {
    live: !done && !versus,
  });

  useEffect(() => () => cancelRef.current?.(), []);

  /** Bank a finished game. Solo only - a match pays through `finishVersus`. */
  const finish = useCallback(
    (p: Position, history: string[]) => {
      if (paidRef.current) return;
      const r = outcome(p, history);
      if (r.kind === "playing") return;
      paidRef.current = true;
      const box = boardRef.current?.getBoundingClientRect();
      const at = box ? { x: box.left + box.width / 2, y: box.top + box.height / 2 } : undefined;

      if (r.kind === "checkmate" && r.winner === "w") {
        setWins((w) => w + 1);
        if (at) burst(at.x, at.y, { count: 16 });
        // Extend the run BEFORE reporting, so the score includes this win.
        streakRef.current += 1;
        const won = winMoment(ctx, {
          reason: "level_complete",
          tier: TIER[difficulty],
          level: "vs-ai",
          at,
          score: { value: streakRef.current, unit: "points", board: difficulty },
        });
        if (won.score) setBest(won.score.best);
        return;
      }
      // A loss or a draw pays nothing and costs nothing. The run of WINS ends,
      // because a draw against a stronger opponent is a fine result and still
      // not a win.
      streakRef.current = 0;
      if (r.kind === "checkmate") {
        ctx.audio.play("fail");
        if (boardRef.current) shake(boardRef.current);
        ctx.analytics.levelFail("vs-ai", "checkmated");
      } else {
        ctx.audio.play("pop");
      }
    },
    [ctx, difficulty],
  );

  /**
   * The two-player half of the same moment, deliberately not folded into the
   * one above. That decides what a PLAYER earned against the computer - a run,
   * a personal best, a tier payout - and none of those is a fact about a match
   * two people played on one device. `versusMatchEnd` cannot attach a score
   * even if this file asked it to.
   */
  const finishVersus = useCallback(
    (p: Position, history: string[], v: VersusState) => {
      const r = outcome(p, history);
      if (r.kind === "playing") return;
      const who: Seat | "draw" = r.kind === "checkmate" ? ((r.winner === "w" ? 0 : 1) as Seat) : "draw";
      setVersus(finishMatch(v, who));
      const box = boardRef.current?.getBoundingClientRect();
      const at = box ? { x: box.left + box.width / 2, y: box.top + box.height / 2 } : undefined;
      if (at && r.kind === "checkmate") burst(at.x, at.y, { count: 16 });
      if (paidRef.current) return;
      paidRef.current = true;
      // One payout per match, for FINISHING rather than for winning, so the
      // player who lost watches the same coin fly to the same wallet.
      versusMatchEnd(ctx, at, "vs-player");
    },
    [ctx],
  );

  /** Put a move on the board and hand the turn on. The one write path. */
  const play = useCallback(
    (m: Move) => {
      setFrom(null);
      setPromoting(null);
      // THE NEXT BOARD IS COMPUTED HERE, NOT INSIDE THE UPDATER. React may run
      // an updater twice, and a `winMoment` inside one is a double grant - this
      // repo's oldest game law, and the first draft of this file broke it with
      // a `queueMicrotask` that only LOOKED like it was outside. `position` and
      // `keys` are both current in every caller: a tap handler and the
      // opponent's callback, neither of which can be running on a stale board.
      const next = applyMove(position, m);
      setPositions((list) => [...list, next]);
      if (outcome(next, keys).kind !== "playing") {
        if (versus) finishVersus(next, keys, versus);
        else finish(next, keys);
      } else if (versus) {
        setVersus((v) => (v ? pass(v) : v));
      }
    },
    [finish, finishVersus, keys, position, versus],
  );

  // THE COMPUTER'S TURN. Solo only, and driven from the board rather than from
  // the click handler: a reply is owed whenever it is black's move and the game
  // is on, however the board got that way - a move, a take-back, a restore.
  useEffect(() => {
    if (versus || done || position.turn === "w") return;
    setThinking(true);
    const history = keys.slice(0, -1);
    cancelRef.current = scheduleOpponent<Move | null>({
      think: () => think(position, difficulty, { history })?.move ?? null,
      onMove: (m) => {
        setThinking(false);
        if (m) {
          ctx.audio.play("flip");
          play(m);
        }
      },
      onError: () => {
        // An engine bug costs a move, not the game. The turn stays where it is
        // and the board is untouched, which is a position the player can still
        // restart from rather than a frozen banner.
        setThinking(false);
      },
    });
    return () => {
      cancelRef.current?.();
      cancelRef.current = null;
      setThinking(false);
    };
  }, [position, keys, versus, done, difficulty, ctx, play]);

  const reset = useCallback(() => {
    cancelRef.current?.();
    setPositions([startPosition()]);
    setFrom(null);
    setPromoting(null);
    setThinking(false);
    paidRef.current = false;
    // In two-player mode restart is "deal again", which is what hands the first
    // move to whoever lost the last one.
    setVersus((v) => (v ? nextMatch(v) : v));
    ctx.analytics.levelStart(versus ? "vs-player" : "vs-ai");
  }, [ctx, versus]);

  const changeDifficulty = useCallback(
    (next: Level) => {
      if (next === difficulty) return;
      setDifficulty(next);
      setWins(0);
      streakRef.current = 0;
      setBest(ctx.score?.best(next));
      reset();
    },
    [ctx, difficulty, reset],
  );

  const toggleVersus = useCallback(() => {
    ctx.audio.unlock();
    ctx.audio.play("pop");
    cancelRef.current?.();
    setVersus((v) => (v ? undefined : newVersus()));
    setPositions([startPosition()]);
    setFrom(null);
    setPromoting(null);
    setThinking(false);
    paidRef.current = false;
    streakRef.current = 0;
    setWins(0);
  }, [ctx]);

  /**
   * Take back, against the computer only.
   *
   * It undoes TWO plies - the reply and the move that invited it - so the
   * board comes back to a position the player can actually move from. One ply
   * would hand them a board where it is still the computer's turn, and the
   * effect above would instantly play the same reply again.
   */
  const takeBack = useCallback(() => {
    // The guard is `versus || nothing-to-undo` rather than a bare `if (versus)
    // return`, and both halves are real: take-back is solo-only, and an
    // untouched board has nothing to take back. Written as one identifier it
    // also reads to `restart-clears-the-input-gate` as a gate on the BOARD's
    // input, which `versus` is not - restart in a match deals the next match
    // rather than leaving it, so clearing it there would be the bug.
    if (versus || positions.length < 2) return;
    cancelRef.current?.();
    setThinking(false);
    setFrom(null);
    setPromoting(null);
    paidRef.current = false;
    setPositions((list) => (list.length > 2 ? list.slice(0, -2) : [startPosition()]));
    ctx.audio.play("tap");
  }, [ctx, positions.length, versus]);

  const onSquare = useCallback(
    (i: number) => {
      if (done || thinking || promoting) return;
      ctx.audio.unlock();
      ctx.speech.unlock();
      const piece = position.board[i];

      if (from === null) {
        if (!piece || piece[0] !== position.turn || !myTurn) return;
        ctx.audio.play("tap");
        haptic.tap();
        setFrom(i);
        return;
      }
      if (i === from) {
        setFrom(null);
        return;
      }
      // Tapping another of your own pieces re-aims rather than doing nothing.
      // A child who picked the wrong piece should not have to tap it twice.
      if (piece && piece[0] === position.turn) {
        ctx.audio.play("tap");
        setFrom(i);
        return;
      }
      const options = moves.filter((m) => m.from === from && m.to === i);
      if (options.length === 0) {
        setFrom(null);
        return;
      }
      // Four moves for one square is a promotion, and the player picks which.
      // A silent queen is the usual shortcut and it is wrong often enough to
      // matter - underpromotion is the only way out of some stalemates.
      if (options.length > 1) {
        setPromoting({ from, to: i });
        return;
      }
      ctx.audio.play("flip");
      haptic.tap();
      play(options[0]);
    },
    [ctx, done, from, moves, myTurn, play, position, promoting, thinking],
  );

  const T = textFor(
    {
      he: {
        turn: "התור שלך", think: "חושב...", check: "שח!", mate: "מט", draw: "תיקו",
        stale: "פט", wins: "ניצחונות", back: "אחורה", promote: "בחרו כלי", black: "תור השחור",
      },
      en: {
        turn: "Your turn", think: "Thinking...", check: "Check!", mate: "Checkmate", draw: "Draw",
        stale: "Stalemate", wins: "Wins", back: "Take back", promote: "Choose a piece",
        black: "Black to move",
      },
      es: {
        turn: "Te toca", think: "Pensando...", check: "¡Jaque!", mate: "Jaque mate", draw: "Tablas",
        stale: "Ahogado", wins: "Victorias", back: "Deshacer", promote: "Elige una pieza",
        black: "Juegan las negras",
      },
      sv: {
        turn: "Din tur", think: "Tänker...", check: "Schack!", mate: "Schackmatt", draw: "Remi",
        stale: "Patt", wins: "Vinster", back: "Ångra", promote: "Välj en pjäs",
        black: "Svart spelar",
      },
    },
    ctx.locale,
  );

  const status =
    result.kind === "checkmate"
      ? versus
        ? T.mate
        : result.winner === "w"
          ? ctx.t("youWon")
          : ctx.t("gameOver")
      : result.kind === "stalemate"
        ? T.stale
        : result.kind === "draw"
          ? T.draw
          : thinking
            ? T.think
            : isCheck(position)
              ? T.check
              : myTurn
                ? T.turn
                : T.black;

  const targets = useMemo(() => {
    if (from === null) return new Map<number, boolean>();
    const m = new Map<number, boolean>();
    for (const mv of moves) if (mv.from === from) m.set(mv.to, !!mv.captured);
    return m;
  }, [from, moves]);

  return (
    <GameChrome
      ctx={ctx}
      stats={
        versus
          ? [
              { icon: "flag", label: versusWords(ctx.locale).matches, value: versus.matches, compact: true },
              { icon: "draw", label: T.draw, value: versus.draws, compact: true },
            ]
          : [
              { icon: "star", label: T.wins, value: wins, compact: true, record: best ?? "-" },
              { icon: "flag", label: ctx.t("moves"), value: positions.length - 1, compact: true },
            ]
      }
      levels={versus ? undefined : DIFF_OPTIONS}
      level={versus ? undefined : difficulty}
      onLevel={versus ? undefined : changeDifficulty}
      onRestart={reset}
      footer={
        <div style={{ display: "grid", gap: 8 }}>
          {versus ? (
            <VersusBanner v={versus} locale={ctx.locale} counts={versus.wins} result={winner} />
          ) : (
            <div
              style={{
                background: "var(--surface)",
                borderRadius: "var(--radius-2)",
                boxShadow: "var(--shadow-1)",
                padding: "13px 12px",
                // THE TALLEST STATE, reserved on every frame. The take-back
                // button is absent on an untouched board and present after
                // one move, and a card that grows by 34px when it appears
                // MOVES THE BOARD - which is the defect `assert:keys` and
                // `assert:difficulty` exist to catch, arriving through a
                // different door. Measured 2026-09-21: 94px with the button,
                // 56px without.
                minHeight: 110,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                gap: 6,
                textAlign: "center",
              }}
            >
              <b style={{ fontSize: 23, fontFamily: "Fredoka, inherit" }}>{status}</b>
              {/*
                TAKE-BACK LIVES HERE, in the game's own footer, and not on the
                utility row beside restart. `gameTools.ts` is a ONE-SLOT
                registry and restart already holds the slot; a second tool
                there would be a new emitted button in the page HTML for every
                game on the site. It is also solo-only: taking a move back in a
                match is asking the other person for a favour, not pressing a
                button.
              */}
              {/*
                NOT `disabled` on an empty board - it is simply absent. This
                platform reserves `disabled` for the genuinely impossible, and
                a greyed-out button is a control a child taps and learns
                nothing from. The status line keeps one height either way, so
                the button appearing does not move the board.
              */}
              {positions.length > 1 && (
                <button
                  type="button"
                  onClick={takeBack}
                  style={{
                    border: "2px solid var(--brand-strong)",
                    background: "transparent",
                    color: "var(--brand-strong)",
                    borderRadius: 999,
                    padding: "6px 18px",
                    fontSize: 15,
                    fontWeight: 700,
                  }}
                >
                  ↶ {T.back}
                </button>
              )}
            </div>
          )}
          <VersusToggle on={!!versus} locale={ctx.locale} onToggle={toggleVersus} />
        </div>
      }
    >
      {/*
        `dir="ltr"` on the board, always. The app is RTL in Hebrew, and a CSS
        grid inside it renders MIRRORED - a8 would land on the visual right and
        every coordinate this file computes would point at the wrong square.
        `containerType: inline-size` is what lets the glyph size off the BOARD
        (9.4cqw is ~75% of a 12.5cqw cell at any board size) rather than off an
        inherited font-size, which renders 12px pieces on a 354px board.
      */}
      <div
        ref={boardRef}
        dir="ltr"
        className={BOARD_CLASS}
        style={{
          position: "relative",
          containerType: "inline-size",
          border: "10px solid var(--surface-2)",
          borderRadius: 6,
          background: "var(--surface-2)",
          boxShadow: "var(--shadow-2)",
          boxSizing: "border-box",
          // chrome 111: the head row only - the footer sits beside the board on
          // a PC, so it costs no height. Same figure tictactoe measured.
          ...boardVars({ vw: 92, vh: 48, cap: 460, chrome: 111 }),
          aspectRatio: "1",
        }}
      >
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(8, 1fr)",
            // EVERY TILE THE SAME. Explicit equal rows, and cells that may
            // shrink below their content - without both, the one cell holding
            // a tall glyph grows its row and the eight ranks stop matching.
            gridTemplateRows: "repeat(8, 1fr)",
            width: "100%",
            height: "100%",
            fontSize: "9.4cqw",
            lineHeight: 1,
          }}
        >
          {position.board.map((piece, i) => {
            const dark = ((i & 7) + (i >> 3)) % 2 === 1;
            const target = targets.get(i);
            const picked = from === i;
            return (
              <button
                key={i}
                type="button"
                onClick={() => onSquare(i)}
                aria-label={squareName(i) + (piece ? ` ${piece}` : "")}
                style={{
                  position: "relative",
                  border: "none",
                  padding: 0,
                  minWidth: 0,
                  minHeight: 0,
                  display: "grid",
                  placeItems: "center",
                  background: dark ? DARK_SQ : LIGHT_SQ,
                  boxShadow: picked ? "inset 0 0 0 3px var(--brand-strong)" : undefined,
                  font: "inherit",
                }}
              >
                {piece && (
                  <span
                    style={{
                      lineHeight: 1,
                      userSelect: "none",
                      pointerEvents: "none",
                      color: piece[0] === "w" ? LIGHT_ARMY : DARK_ARMY,
                      // BOTH sides are outlined, in the other army's tone. One
                      // of the two outlines is what makes its piece visible on
                      // any given board, and which one it is changes with the
                      // theme - see LIGHT_ARMY above for the measurement.
                      WebkitTextStroke: `.09em ${piece[0] === "w" ? DARK_ARMY : LIGHT_ARMY}`,
                      paintOrder: "stroke fill" as const,
                      textShadow: "0 1px 1px rgba(0,0,0,.22)",
                    }}
                  >
                    {GLYPH[piece[1]]}
                  </span>
                )}
                {target !== undefined &&
                  (target ? (
                    // A capture is a RING round the piece you would take; an
                    // empty square is a dot. Same mark for both would make a
                    // child look twice to see what a tap is about to cost.
                    <span
                      style={{
                        position: "absolute",
                        inset: "8%",
                        borderRadius: 8,
                        border: "3px solid var(--brand-strong)",
                        opacity: 0.75,
                        pointerEvents: "none",
                      }}
                    />
                  ) : (
                    <span
                      style={{
                        position: "absolute",
                        width: "26%",
                        height: "26%",
                        borderRadius: "50%",
                        background: "var(--brand-strong)",
                        opacity: 0.42,
                        pointerEvents: "none",
                      }}
                    />
                  ))}
              </button>
            );
          })}
        </div>

        {promoting && (
          // The dim backdrop is a BUTTON, so a tap anywhere outside the four
          // pieces puts the pawn back down. Without it the chooser is a trap:
          // there is no other way out of it, the board behind is frozen, and a
          // child who opened it by accident has to restart the game.
          <button
            type="button"
            aria-label={T.promote}
            onClick={() => setPromoting(null)}
            style={{
              position: "absolute",
              inset: 0,
              display: "grid",
              placeItems: "center",
              border: "none",
              padding: 0,
              background: "color-mix(in srgb, var(--text) 55%, transparent)",
              borderRadius: 4,
            }}
          >
            <div
              onClick={(e) => e.stopPropagation()}
              style={{
                background: "var(--surface)",
                borderRadius: "var(--radius-2)",
                padding: "12px 14px",
                display: "grid",
                gap: 8,
                justifyItems: "center",
                boxShadow: "var(--shadow-2)",
              }}
            >
              <span style={{ fontSize: 14, fontWeight: 700 }}>{T.promote}</span>
              <div style={{ display: "flex", gap: 6 }}>
                {(["q", "r", "b", "n"] as const).map((kind) => (
                  <button
                    key={kind}
                    type="button"
                    onClick={() => {
                      const m = moves.find(
                        (x) => x.from === promoting.from && x.to === promoting.to && x.promo === kind,
                      );
                      if (m) {
                        ctx.audio.play("flip");
                        play(m);
                      } else setPromoting(null);
                    }}
                    style={{
                      width: 46,
                      height: 46,
                      fontSize: 30,
                      lineHeight: 1,
                      border: "2px solid var(--brand-strong)",
                      borderRadius: 10,
                      background: "var(--surface)",
                      color: position.turn === "w" ? LIGHT_ARMY : DARK_ARMY,
                      WebkitTextStroke: `.06em ${position.turn === "w" ? DARK_ARMY : LIGHT_ARMY}`,
                      paintOrder: "stroke fill",
                    }}
                  >
                    {GLYPH[kind]}
                  </button>
                ))}
              </div>
            </div>
          </button>
        )}
      </div>
    </GameChrome>
  );
}
