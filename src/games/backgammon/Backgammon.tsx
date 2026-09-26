import { textFor } from "@i18n/index";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { GameContext, RewardTier } from "@sdk/index";
import type { SessionSpec } from "@sdk/session";
import { GameChrome } from "@ui/GameChrome";
import { BOARD_CLASS, boardVars } from "@ui/boardSize";
import type { DifficultyOption } from "@ui/DifficultySelector";
import { burst, haptic, prefersReducedMotion } from "@juice/index";
import { useGameSession, useRememberedLevel, winMoment } from "@shared/index";
import { scheduleOpponent } from "@shared/opponent";
import {
  finish as finishMatch,
  newVersus,
  nextMatch,
  pass as passSeat,
  versusWords,
  type Seat,
  type VersusState,
} from "@shared/versus";
import { VersusBanner, VersusToggle } from "@shared/VersusBanner";
import { versusMatchEnd } from "@shared/versusMoment";
import { chooseTurn, type Level } from "./engine";
import {
  BAR,
  OFF,
  applyGameResult,
  applyMove,
  gameResult,
  legalFrom,
  legalPlays,
  matchOver,
  nextGame,
  opponent,
  pipCount,
  roll,
  startGame,
  type Board,
  type Game,
  type Move,
  type Side,
} from "./logic";

const DIFF_OPTIONS: DifficultyOption<Level>[] = [
  { id: "easy", label: { he: "קל", en: "Easy", es: "Fácil", sv: "Lätt" } },
  { id: "normal", label: { he: "בינוני", en: "Med", es: "Media", sv: "Medel" } },
  { id: "hard", label: { he: "קשה", en: "Hard", es: "Difícil", sv: "Svår" } },
];

/** The engine's word for a strength, translated to the economy's word for a tier. */
const TIER: Record<Level, RewardTier> = { easy: "easy", normal: "medium", hard: "hard" };

/** The match every game here belongs to. First to five points. */
const TARGET = 5;

/**
 * THE BOARD IS HORIZONTAL, like every backgammon board ever made.
 *
 * It shipped turned 90 degrees - an arm picked off a mock in September for the
 * PHONE, where it buys bigger checkers, and then used on a PC too. The operator,
 * looking at it live: "backgamoon board should be horizontal! not like this ...
 * the view is on 90degrees wrong". Ruled horizontal EVERYWHERE, 2026-09-22, off
 * a four-frame mock that showed exactly what it costs on a phone.
 *
 * The four quadrants, in the order a player reads them. White moves 24 -> 1 and
 * its home is the bottom right, which is where a right-handed board puts it.
 */
const TOP_LEFT = [13, 14, 15, 16, 17, 18];
const TOP_RIGHT = [19, 20, 21, 22, 23, 24];
const BOTTOM_LEFT = [12, 11, 10, 9, 8, 7];
const BOTTOM_RIGHT = [6, 5, 4, 3, 2, 1];

/**
 * THE CHECKERS DO NOT FOLLOW THE THEME, for the reason chess's pieces do not:
 * `var(--surface)` against `var(--text)` INVERTS between the two, so the side
 * called white is the DARK disc at night and the light one by day. It is high
 * contrast either way and it is still wrong - a player learns "mine are the
 * pale ones" and the app changes its mind when they tap the moon.
 *
 * Measured 2026-09-22: ivory against near-black is 15.83:1, and each reads
 * against both triangle tones by its fill or its rim.
 */
const LIGHT_CHECKER = "#fbf6ec";
const DARK_CHECKER = "#241a12";
/**
 * The points and the felt, fixed in both themes for the reason the checkers
 * are: a board is a board. These are the mock's numbers, and the same walnut
 * and cream chess got - the two games sit on the same shelf and looked like
 * two different products while one was navy and the other was wood.
 *
 * THE FELT MUST DIFFER FROM BOTH POINT TONES. With it matching either one,
 * half the points vanish into it and the board reads as twelve points instead
 * of twenty-four - seen on the mock's first render, 2026-09-21, and again on
 * the horizontal mock's.
 */
const POINT_DARK = "#9a6f4c";
const POINT_LIGHT = "#efdcbe";
const FELT = "#41301f";
const RAIL = "#2b2015";

/**
 * WIDTH OVER HEIGHT, and the number that decides how much screen this game gets.
 *
 * It was 1.45, which is a wide board, and the operator looking at the live game
 * on 2026-09-22: "use more of the height of the screen". 1.2 is what a real
 * board measures - about 20 inches across a 24-point surface plus the bar,
 * about 17 tall - so this is the authentic number as well as the taller one.
 *
 * It buys height on BOTH arms, and for two different reasons, which is why one
 * number fixed both. Measured on the live page before the change and on the
 * build after it:
 *
 *     390 x 844 phone    width-bound at 92vw      359 x 247  ->  359 x 299
 *     1536 x 864 PC      width-bound at --b-room  751 x 518  ->  751 x 626
 *
 * On the PC the board is NOT height-bound: `--b-room` (the viewport less the
 * two side columns the footer sits in) binds at 751 while the window would
 * have allowed 729px of height. So the width is fixed on both arms and the
 * ratio is the only lever either of them has.
 *
 * WRITTEN ONCE AND USED TWICE, and it has to be: `.ellaz-board` sets a board's
 * WIDTH and leaves its height `auto`, while this board declares
 * `container-type: size` so its checkers can size off both axes. Size
 * containment means the contents do not contribute to the box - so with no
 * `aspect-ratio` the height resolves to ZERO and the whole board disappears,
 * silently, with every gate still green. The inline `aspectRatio` is what
 * makes the height definite; `--b-ratio` is what the PC arm divides by. Two
 * numbers here would be two answers.
 */
const RATIO = 1.2;

/**
 * How much of the board's height one row of points takes, and what is left in
 * the middle. A real board's points run about two fifths of the surface each
 * and leave a bare strip down the centre - which is where the dice land, and
 * why they now live on the board rather than in the card underneath it.
 */
const QUAD = 41;

/**
 * The checker, in container units. A point is about a fourteenth of the
 * board's width (two quadrants of six plus the bar), and a stack of five must
 * fit inside ONE QUADRANT - which is 41cqh now, not half the board, so five
 * times 8 is 40 with a point's inset to spare. 24px on a 390px phone and 50px
 * on a 1536px PC, measured 2026-09-22.
 */
const CHECKER = "min(7.2cqw, 8cqh)";

/**
 * A die, in container units. Four of them fit across one half of the board on
 * a double - half a board is 42.5cqw, four dice and their gaps are 38.5 - and
 * one fits inside the 18cqh strip down the middle. 30px on a 390px phone, 64px
 * on a 1536px PC.
 */
const DIE = "min(11cqh, 8.5cqw)";

/** Which of the nine cells of a face carry a pip, per number. */
const PIPS: Record<number, number[]> = {
  1: [4],
  2: [0, 8],
  3: [0, 4, 8],
  4: [0, 2, 6, 8],
  5: [0, 2, 4, 6, 8],
  6: [0, 2, 3, 5, 6, 8],
};

/**
 * THE THROW, and it is the only animation on this board.
 *
 * Seven frames at 55ms - long enough to read as a throw, short enough that a
 * player who rolls twenty times a match never waits for it. The faces are real
 * random numbers rather than a cycle, because a cycle reads as a spinner; the
 * tilt alternates so the dice look knocked about rather than pulsed. Under
 * `prefers-reduced-motion` the dice simply appear.
 *
 * 385ms is what the timers ASK for and not what a browser delivers. Sampled on
 * the built page at 390px on 2026-09-22, load average 13: still tilting at
 * 500ms, flat by 900ms. The same sample before the tumble moved out of the
 * parent component read still tilting at 900ms and flat only by 1500ms.
 */
const TUMBLE_TICKS = 7;
const TUMBLE_MS = 55;

const face = (): number => 1 + Math.floor(Math.random() * 6);

/**
 * THE DICE, AND THE THROW, as their own component - which is the only thing
 * here that is about performance rather than about backgammon.
 *
 * The tumble was parent state first, and every one of its seven frames
 * re-rendered the whole board: 24 point buttons, up to 30 checkers, each with
 * its own style object. Measured on a loaded machine that turned a 385ms throw
 * into 1.2 seconds of dice still tilting after they should have landed. Local
 * state in a leaf component means a frame re-renders two dice instead.
 *
 * It is REMOUNTED per throw, by `key`, rather than watching its own props for
 * a new roll - a component whose whole job is an animation should start when
 * it is born, and the parent already knows when a throw happened.
 */
function Dice({ values, rolled, onLand }: { values: number[]; rolled: number; onLand: () => void }) {
  const [spin, setSpin] = useState(() => (prefersReducedMotion() ? 0 : TUMBLE_TICKS));
  const faces = useRef<number[]>(Array.from({ length: rolled }, face));

  useEffect(() => {
    if (spin <= 0) return;
    const t = setTimeout(() => {
      faces.current = faces.current.map(face);
      // The landing sound fires HERE and not inside the updater: React may run
      // an updater twice, and a sound played twice is the mild end of the
      // defect `snapshot.test.ts` refuses.
      if (spin === 1) onLand();
      setSpin((n) => n - 1);
    }, TUMBLE_MS);
    return () => clearTimeout(t);
  }, [spin, onLand]);

  const shown = spin > 0 ? faces.current : values;
  return (
    <div
      role="img"
      aria-label={`dice ${values.join(" ")}`}
      style={{ display: "flex", gap: "1.5cqw", alignItems: "center", justifyContent: "center", height: "100%" }}
    >
      {shown.map((value, i) => (
        <span
          key={i}
          style={{
            width: DIE,
            height: DIE,
            borderRadius: "18%",
            background: LIGHT_CHECKER,
            boxShadow: "var(--shadow-1)",
            display: "grid",
            gridTemplateColumns: "repeat(3, 1fr)",
            gridTemplateRows: "repeat(3, 1fr)",
            padding: "1.2cqh",
            boxSizing: "border-box",
            // Knocked one way and then the other while it is in the air, and
            // flat the moment it lands. The transition is shorter than a frame
            // of the throw, so the tilt keeps up rather than lagging behind.
            transform: spin > 0 ? `rotate(${(spin + i) % 2 ? 11 : -9}deg) scale(1.06)` : "none",
            transition: "transform 50ms linear",
          }}
        >
          {Array.from({ length: 9 }, (_, c) => (
            <span
              key={c}
              style={{
                width: "72%",
                height: "72%",
                margin: "auto",
                borderRadius: "50%",
                background: PIPS[value].includes(c) ? DARK_CHECKER : "transparent",
              }}
            />
          ))}
        </span>
      ))}
    </div>
  );
}

interface BgSession {
  level: Level;
  game: Game;
}

const SESSION: SessionSpec<BgSession> = {
  // 2: the doubling cube was removed, so every v1 snapshot carries a `cube`
  // this build has no rules for. A bumped version DISCARDS those rather than
  // migrating them - the house rule for a snapshot whose shape changed.
  version: 2,
  validate(value): value is BgSession {
    if (typeof value !== "object" || value === null) return false;
    const v = value as Partial<BgSession>;
    if (!DIFF_OPTIONS.some((o) => o.id === v.level)) return false;
    const g = v.game as Game | undefined;
    // Everything whose absence would render a board the rules cannot explain.
    // `dice` is deliberately NOT required to be empty: a roll already made is
    // part of the position, and re-rolling it on a restore would hand the
    // player a second roll for the same turn.
    return (
      !!g &&
      !!g.board &&
      Array.isArray(g.board.points) &&
      g.board.points.length === 26 &&
      !!g.board.bar &&
      !!g.board.off &&
      (g.turn === "w" || g.turn === "b") &&
      Array.isArray(g.dice) &&
      !!g.match &&
      typeof g.match.target === "number" &&
      !!g.match.score
    );
  },
};

const apply = (b: Board, side: Side, ms: Move[]): Board => ms.reduce((acc, m) => applyMove(acc, side, m), b);

/**
 * Backgammon: full rules and a match to five points.
 *
 * The player is WHITE and bears off at the bottom right. Nothing here knows a
 * rule of backgammon - `logic.ts` owns every one of them, including which
 * points a tap may pick up from and where that tap may land, so this file can
 * never offer a move the rules would refuse.
 */
export function Backgammon({ ctx }: { ctx: GameContext }) {
  const [difficulty, setDifficulty] = useRememberedLevel(
    ctx,
    DIFF_OPTIONS.map((o) => o.id),
    "normal",
  );

  const restored = useMemo(() => ctx.session.load(SESSION), [ctx]);
  const [game, setGame] = useState<Game>(() =>
    restored && restored.level === difficulty && !restored.game.over ? restored.game : startGame(TARGET),
  );
  /** The moves made so far THIS turn. The turn is not on the board until it ends. */
  const [played, setPlayed] = useState<Move[]>([]);
  /** The computer's remaining moves, played out one at a time so they are legible. */
  const [pending, setPending] = useState<Move[]>([]);
  const [pick, setPick] = useState<number | null>(null);
  const [thinking, setThinking] = useState(false);
  /** Counts throws. It is only a `key`, so a new throw restarts the tumble. */
  const [rollId, setRollId] = useState(0);
  const [versus, setVersus] = useState<VersusState | undefined>(undefined);
  const [best, setBest] = useState<number | undefined>(() => ctx.score?.best(difficulty));

  const boardRef = useRef<HTMLDivElement>(null);
  const started = useRef(false);
  const cancelRef = useRef<(() => void) | null>(null);
  /** Matches won this sitting, for the record. One per MATCH, not per game. */
  const streakRef = useRef(0);
  /** One payout per match, latched: the match can end from either side's move. */
  const paidRef = useRef(false);

  const me: Side = versus ? (versus.turn === 0 ? "w" : "b") : "w";
  const board = useMemo(() => apply(game.board, game.turn, played), [game, played]);
  const champion = matchOver(game);
  const busy = thinking || pending.length > 0;
  const myTurn = !champion && !game.over && game.turn === me && !busy;
  const sources = useMemo(
    () => (myTurn && game.dice.length > 0 ? legalFrom(game.board, game.turn, game.dice, played) : []),
    [myTurn, game, played],
  );
  const plays = useMemo(
    () => (pick === null ? [] : legalPlays(game.board, game.turn, game.dice, played, pick)),
    [pick, game, played],
  );

  useEffect(() => {
    if (started.current) return;
    started.current = true;
    ctx.lifecycle.gameplayStart();
    ctx.analytics.levelStart("vs-ai");
  }, [ctx]);

  // The saved position is the MATCH, not the half-played turn: `played` and
  // `pending` are both states only a timer or a tap can leave, and a snapshot
  // caught inside either would restore a board mid-turn with no dice to
  // finish it. Nothing about thinking reaches the disk for the same reason.
  useGameSession(ctx, SESSION, () => ({ level: difficulty, game }), {
    live: !champion && !game.over && !versus,
  });

  useEffect(() => () => cancelRef.current?.(), []);

  /** Bank a finished MATCH. Solo only. A single game inside it pays nothing. */
  const bank = useCallback(
    (winner: Side) => {
      if (paidRef.current) return;
      paidRef.current = true;
      const box = boardRef.current?.getBoundingClientRect();
      const at = box ? { x: box.left + box.width / 2, y: box.top + box.height / 2 } : undefined;
      if (winner !== "w") {
        streakRef.current = 0;
        ctx.audio.play("fail");
        ctx.analytics.levelFail("vs-ai", "lost-match");
        return;
      }
      if (at) burst(at.x, at.y, { count: 18 });
      streakRef.current += 1;
      const won = winMoment(ctx, {
        reason: "level_complete",
        tier: TIER[difficulty],
        level: "vs-ai",
        at,
        score: { value: streakRef.current, unit: "points", board: difficulty },
      });
      if (won.score) setBest(won.score.best);
    },
    [ctx, difficulty],
  );

  /** A game inside the match ended. Score it, and open the next one. */
  const settle = useCallback(
    (g: Game) => {
      const champ = matchOver(g);
      if (!champ) {
        // A single game is a MILESTONE - one coin, no confetti. The match is
        // what `winMoment` is for, and paying both would pay a whole match
        // five times over.
        if (!versus) winMoment(ctx, { reason: "milestone", level: "game", confetti: false });
        else ctx.audio.play("pop");
        return g;
      }
      if (versus) {
        setVersus((v) => (v ? finishMatch(v, (champ === "w" ? 0 : 1) as Seat) : v));
        const box = boardRef.current?.getBoundingClientRect();
        const at = box ? { x: box.left + box.width / 2, y: box.top + box.height / 2 } : undefined;
        if (!paidRef.current) {
          paidRef.current = true;
          versusMatchEnd(ctx, at, "vs-player");
        }
      } else {
        bank(champ);
      }
      return g;
    },
    [bank, ctx, versus],
  );

  /** End the turn: put it on the board, score it if it finished the game. */
  const commit = useCallback(() => {
    // Computed HERE and not inside the updater: React may run an updater
    // twice, and `settle` pays a coin. Every caller holds a current `game` -
    // one timer in an effect, and nothing else.
    const next = apply(game.board, game.turn, played);
    const result = gameResult(next);
    if (result) {
      const scored = applyGameResult({ ...game, board: next }, result);
      setGame(scored);
      settle(scored);
    } else {
      setGame({ ...game, board: next, turn: opponent(game.turn), dice: [] });
    }
    setPlayed([]);
    setPick(null);
  }, [game, played, settle]);

  // A TURN ENDS WHEN THE RULES SAY IT DOES, never when a button is pressed:
  // `legalFrom` returning nothing IS "no dice left to play", and it is the same
  // answer for a turn played out and a turn that was blocked from the start.
  // The beat is so the last checker is seen landing rather than teleporting.
  useEffect(() => {
    if (game.over || champion || pending.length > 0) return;
    if (game.dice.length === 0) return;
    if (legalFrom(game.board, game.turn, game.dice, played).length > 0) return;
    const t = setTimeout(commit, 520);
    return () => clearTimeout(t);
  }, [game, played, pending, champion, commit]);

  // The computer plays out its chosen turn one move at a time. A whole turn
  // appearing at once is four checkers teleporting on a double, which is the
  // single most confusing thing a backgammon board can do.
  useEffect(() => {
    if (pending.length === 0) return;
    const t = setTimeout(() => {
      setPlayed((p) => [...p, pending[0]]);
      setPending((q) => q.slice(1));
      ctx.audio.play("tap");
    }, 300);
    return () => clearTimeout(t);
  }, [pending, ctx]);

  // THE COMPUTER'S TURN, in two steps: it throws, and then - once there are
  // dice on the board for the player to see - it plays them.
  useEffect(() => {
    if (versus || game.over || champion || game.turn !== "b") return;
    if (pending.length > 0 || played.length > 0) return;

    if (game.dice.length === 0) {
      cancelRef.current = scheduleOpponent<number[]>({
        think: () => roll(),
        onMove: (dice) => setGame((g) => ({ ...g, dice })),
      });
    } else {
      setThinking(true);
      cancelRef.current = scheduleOpponent<Move[]>({
        think: () => chooseTurn(game.board, "b", game.dice, difficulty),
        onMove: (turn) => {
          setThinking(false);
          setPending(turn);
        },
        // An engine bug costs a turn, not the match: the dice stay on the
        // table and restart is one tap away, rather than a frozen banner.
        onError: () => setThinking(false),
      });
    }
    return () => {
      cancelRef.current?.();
      cancelRef.current = null;
      setThinking(false);
    };
  }, [game, versus, champion, difficulty, pending.length, played.length]);

  // THE THROW. `game.dice` goes empty -> full exactly once a turn, from either
  // side, so one effect covers the player's roll and the computer's without
  // either of them knowing an animation exists. The ref is seeded from the
  // RESTORED game, so a position resumed mid-turn does not re-throw dice that
  // were already on the table.
  const hadDice = useRef(game.dice.length);
  useEffect(() => {
    const before = hadDice.current;
    hadDice.current = game.dice.length;
    if (game.dice.length === 0 || before > 0) return;
    setRollId((n) => n + 1);
  }, [game.dice]);

  /** The dice landing. Stable, so it never restarts the tumble it is passed to. */
  const onLand = useCallback(() => ctx.audio.play("tap"), [ctx]);

  const doRoll = useCallback(() => {
    if (!myTurn || game.dice.length > 0) return;
    ctx.audio.unlock();
    ctx.audio.play("flip");
    haptic.tap();
    setGame((g) => ({ ...g, dice: roll() }));
  }, [ctx, game.dice.length, myTurn]);

  const playMove = useCallback(
    (m: Move) => {
      ctx.audio.play(m.hit ? "fail" : "tap");
      haptic.tap();
      setPlayed((p) => [...p, m]);
      setPick(null);
    },
    [ctx],
  );

  /**
   * UNDO INSIDE THE TURN, and it is not a take-back.
   *
   * It is on in both modes, because moving checkers one at a time with no way
   * back is unusable - the dice are already thrown and nothing about the game
   * has been decided yet. A whole COMPLETED turn is never undone: that would
   * mean unrolling dice, which is a different thing entirely and is not
   * offered here at all.
   */
  const undo = useCallback(() => {
    if (busy || played.length === 0) return;
    ctx.audio.play("tap");
    setPlayed((p) => p.slice(0, -1));
    setPick(null);
  }, [busy, ctx, played.length]);

  const onPoint = useCallback(
    (p: number) => {
      if (!myTurn || game.dice.length === 0) return;
      ctx.audio.unlock();
      if (pick !== null) {
        const m = plays.find((x) => x.to === p);
        if (m) {
          playMove(m);
          return;
        }
      }
      // Tapping the checker you already picked up puts it back down. Without
      // it the only way out of a pick is to tap somewhere illegal, which is a
      // thing a player has to discover rather than be shown.
      if (p === pick) {
        setPick(null);
        return;
      }
      if (!sources.includes(p)) {
        setPick(null);
        return;
      }
      const options = legalPlays(game.board, game.turn, game.dice, played, p);
      // One destination is not a choice, so it is not asked as one. Undo is
      // one tap away, which is what makes moving on the first tap safe.
      if (options.length === 1) playMove(options[0]);
      else {
        ctx.audio.play("tap");
        setPick(p);
      }
    },
    [ctx, game, myTurn, pick, played, playMove, plays, sources],
  );

  const reset = useCallback(() => {
    cancelRef.current?.();
    setGame(startGame(TARGET));
    setPlayed([]);
    setPending([]);
    setPick(null);
    setThinking(false);
    paidRef.current = false;
    setVersus((v) => (v ? nextMatch(v) : v));
    ctx.analytics.levelStart(versus ? "vs-player" : "vs-ai");
  }, [ctx, versus]);

  const changeDifficulty = useCallback(
    (next: Level) => {
      if (next === difficulty) return;
      setDifficulty(next);
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
    setGame(startGame(TARGET));
    setPlayed([]);
    setPending([]);
    setPick(null);
    setThinking(false);
    paidRef.current = false;
    streakRef.current = 0;
  }, [ctx]);

  // In a match the seat follows the side whose turn it is, so the banner and
  // the board can never disagree about whose hand is on the checkers.
  useEffect(() => {
    if (!versus) return;
    const want: Seat = game.turn === "w" ? 0 : 1;
    setVersus((v) => (v && v.turn !== want ? passSeat(v) : v));
  }, [game.turn, versus]);

  /** Open the next game of the match. */
  const nextLeg = useCallback(() => {
    setGame((g) => nextGame(g, opponent(g.over?.winner ?? "w")));
    setPlayed([]);
    setPick(null);
  }, []);

  const T = textFor(
    {
      he: {
        roll: "הטילו", undo: "בטלו", next: "המשחק הבא",
        think: "חושב...", turn: "התור שלכם", other: "תור היריב", noMove: "אין מהלך",
        match: "מערכה", pip: "פיפס", off: "בחוץ", won: "ניצחתם את המשחק", lost: "הפסדתם את המשחק",
      },
      en: {
        roll: "Roll", undo: "Undo", next: "Next game",
        think: "Thinking...", turn: "Your turn", other: "Their turn", noMove: "No move",
        match: "Match", pip: "Pips", off: "Off", won: "You won the game", lost: "They won the game",
      },
      es: {
        roll: "Tirar", undo: "Deshacer",
        next: "Siguiente", think: "Pensando...", turn: "Te toca", other: "Le toca",
        noMove: "Sin jugada", match: "Partida", pip: "Pips", off: "Fuera",
        won: "Ganaste la partida", lost: "La perdiste",
      },
      sv: {
        roll: "Slå", dbl: "Dubbla", take: "Jag tar", drop: "Jag passar", undo: "Ångra",
        next: "Nästa", think: "Tänker...", turn: "Din tur", other: "Motståndarens tur",
        noMove: "Inget drag", match: "Parti", pip: "Pips", off: "Ute",
        won: "Du vann partiet", lost: "Du förlorade", offered: "Dubbel erbjuden",
      },
    },
    ctx.locale,
  );

  const status = champion
    ? champion === "w"
      ? ctx.t("youWon")
      : ctx.t("gameOver")
    : game.over
      ? game.over.winner === "w"
        ? T.won
        : T.lost
      : busy
        ? T.think
        : myTurn
          ? game.dice.length === 0
            ? T.turn
            : sources.length === 0
              ? T.noMove
              : T.turn
          : T.other;

  /** One point, with its triangle and its stack of checkers. */
  const point = (p: number, down: boolean) => {
    const men = board.points[p];
    const count = Math.abs(men);
    const side: Side | null = men > 0 ? "w" : men < 0 ? "b" : null;
    const lit = sources.includes(p);
    const target = plays.some((m) => m.to === p);
    // Past five, the stack overlaps so it still ends inside its own quadrant.
    // 39, not 44: a quadrant is QUAD tall now and a checker starts 2% in.
    const step = count > 5 ? `calc((39cqh - ${CHECKER}) / ${count - 1})` : CHECKER;
    return (
      <button
        key={p}
        type="button"
        onClick={() => onPoint(p)}
        aria-label={`point ${p}`}
        style={{
          position: "relative",
          flex: "1 1 0",
          minWidth: 0,
          border: "none",
          padding: 0,
          background: "transparent",
          display: "block",
        }}
      >
        <span
          style={{
            position: "absolute",
            inset: 0,
            clipPath: down ? "polygon(0 0,100% 0,50% 100%)" : "polygon(0 100%,100% 100%,50% 0)",
            background: p % 2 === 0 ? POINT_DARK : POINT_LIGHT,
          }}
        />
        {/* The mark for "you may pick this up" and the mark for "you may land
            here" are different shapes, never two colours of the same shape -
            the operator cannot read red from green, and neither can a child. */}
        {(lit || target) && (
          <span
            style={{
              position: "absolute",
              inset: "6%",
              borderRadius: 6,
              border: `3px ${target ? "solid" : "dashed"} var(--brand-strong)`,
              opacity: target ? 0.95 : 0.7,
            }}
          />
        )}
        {side &&
          Array.from({ length: count }, (_, i) => (
            <span
              key={i}
              style={{
                position: "absolute",
                left: "50%",
                [down ? "top" : "bottom"]: `calc(${step} * ${i} + 2%)`,
                transform: "translateX(-50%)",
                width: CHECKER,
                height: CHECKER,
                borderRadius: "50%",
                boxShadow: "var(--shadow-1)",
                background: side === "w" ? LIGHT_CHECKER : DARK_CHECKER,
                border: `3px solid ${side === "w" ? DARK_CHECKER : LIGHT_CHECKER}`,
                boxSizing: "border-box",
              }}
            />
          ))}
      </button>
    );
  };

  /** A tray: the bar in the middle, or one side's borne-off men at an end. */
  const tray = (kind: "bar" | "off", side: Side) => {
    const n = kind === "bar" ? board.bar[side] : board.off[side];
    const from = kind === "bar" ? BAR[side] : null;
    const isTarget = kind === "off" && plays.some((m) => m.to === OFF[side]);
    const isSource = from !== null && sources.includes(from);
    const onClick = () => {
      if (isTarget) {
        const m = plays.find((x) => x.to === OFF[side]);
        if (m) playMove(m);
      } else if (isSource && from !== null) onPoint(from);
    };
    return (
      <button
        type="button"
        onClick={onClick}
        aria-label={kind === "bar" ? `bar ${side}` : `off ${side}`}
        style={{
          flex: "1 1 0",
          minHeight: 0,
          flexDirection: "column",
          border: isTarget || isSource ? "3px solid var(--brand-strong)" : "none",
          borderRadius: 4,
          background: "transparent",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 4,
          color: LIGHT_CHECKER,
          fontSize: "3.2cqh",
          fontWeight: 800,
          padding: 0,
        }}
      >
        {/*
          THE CHECKER IS DRAWN ONLY WHEN THERE IS ONE. An empty tray used to
          draw its little disc anyway, and on a fresh board that is four loose
          circles sitting on the felt - one above the board, one below, two in
          the bar - which read as checkers nobody can move rather than as empty
          slots. Seen on the first render, 2026-09-21, and it is the reason
          this file gets looked at in a browser rather than reasoned about.
        */}
        {n > 0 && (
          <>
            <span
              style={{
                width: "3.4cqh",
                height: "3.4cqh",
                borderRadius: "50%",
                background: side === "w" ? LIGHT_CHECKER : DARK_CHECKER,
                border: `2px solid ${side === "w" ? DARK_CHECKER : LIGHT_CHECKER}`,
                boxSizing: "border-box",
              }}
            />
            {n}
          </>
        )}
      </button>
    );
  };

  /** Six points in a row, all pointing the same way. */
  const quad = (points: number[], down: boolean) => (
    <div style={{ display: "flex", flex: `0 0 ${QUAD}%`, minWidth: 0, minHeight: 0 }}>
      {points.map((p) => point(p, down))}
    </div>
  );

  /**
   * THE DICE, ON THE BOARD, in the bare strip between the two quadrants of the
   * half whose turn it is - white on the right, black on the left, which is
   * the half each of them would be throwing into on a real board.
   *
   * Only the dice still to PLAY are drawn, so a player never has to remember
   * which of two numbers they have already spent.
   */
  const diceFor = (thrower: Side) => {
    if (game.turn !== thrower || game.dice.length === 0) return null;
    return (
      <Dice
        key={rollId}
        values={game.dice.filter((_, i) => i >= played.length)}
        rolled={game.dice.length}
        onLand={onLand}
      />
    );
  };

  /**
   * One SIDE of the board: a quadrant, the bare strip the dice land in, and
   * the opposite quadrant. The strip is what a real board has and this one did
   * not - the points used to run the full half-height and meet in the middle.
   */
  const side = (top: number[], bottom: number[], thrower: Side) => (
    <div
      style={{ display: "flex", flexDirection: "column", flex: "1 1 0", minWidth: 0, minHeight: 0 }}
    >
      {quad(top, true)}
      <div style={{ flex: "1 1 0", minHeight: 0 }}>{diceFor(thrower)}</div>
      {quad(bottom, false)}
    </div>
  );

  const pill = (label: string, onClick: () => void, primary = false) => (
    <button
      type="button"
      onClick={onClick}
      style={{
        border: `2px solid var(--brand-strong)`,
        background: primary ? "var(--brand-strong)" : "transparent",
        color: primary ? "var(--on-brand)" : "var(--brand-strong)",
        borderRadius: 999,
        padding: "7px 18px",
        fontSize: 15,
        fontWeight: 700,
      }}
    >
      {label}
    </button>
  );

  return (
    <GameChrome
      ctx={ctx}
      stats={
        versus
          ? [
              { icon: "flag", label: versusWords(ctx.locale).matches, value: versus.matches, compact: true },
              { icon: "star", label: T.match, value: `${game.match.score.w}-${game.match.score.b}`, compact: true },
            ]
          : [
              {
                icon: "star",
                label: T.match,
                value: `${game.match.score.w}-${game.match.score.b}`,
                compact: true,
                record: best ?? "-",
              },
              { icon: "flag", label: T.pip, value: pipCount(board, "w"), compact: true },
            ]
      }
      levels={versus ? undefined : DIFF_OPTIONS}
      level={versus ? undefined : difficulty}
      onLevel={versus ? undefined : changeDifficulty}
      onRestart={reset}
      footer={
        <div style={{ display: "grid", gap: 8 }}>
          {versus && (
            <VersusBanner
              v={versus}
              locale={ctx.locale}
              counts={versus.wins}
              result={champion ? ((champion === "w" ? 0 : 1) as Seat) : undefined}
            />
          )}
          <div
            style={{
              background: "var(--surface)",
              borderRadius: "var(--radius-2)",
              boxShadow: "var(--shadow-1)",
              padding: "12px",
              // THE TALLEST STATE, reserved on every frame. This card's row
              // holds a different set of buttons in every phase - Roll before
              // the throw, Undo during the turn, Next game after one - and the
              // row WRAPS. A card that grows when a button appears moves the
              // board, which is exactly what `assert:keys` refuses.
              //
              // 104, not the 140 it reserved while the cube shipped: the dice
              // moved onto the board and Double, Take and Pass are gone, so the
              // row can never hold more than two pills. Measured on the built
              // page 2026-09-22 - the tallest real state is 96px.
              minHeight: 104,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
              textAlign: "center",
            }}
          >
            <b style={{ fontSize: 20, fontFamily: "Fredoka, inherit" }}>{status}</b>
            {/* THE DICE ARE NOT HERE. They are thrown onto the board, in the
                bare strip down the middle of the half whose turn it is, which
                is where they land on a real board and where a player is
                already looking. */}
            <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap", justifyContent: "center" }}>
              {game.over && !champion && pill(T.next, nextLeg, true)}
              {!game.over && !champion && myTurn && game.dice.length === 0 && pill(T.roll, doRoll, true)}
              {myTurn && played.length > 0 && pill(`↶ ${T.undo}`, undo)}
            </div>
          </div>
          <VersusToggle on={!!versus} locale={ctx.locale} onToggle={toggleVersus} />
        </div>
      }
    >
      {/* `dir="ltr"`: the board is spatial, and in the Hebrew app a mirrored
          grid would put point 24 where point 12 is drawn. */}
      <div
        ref={boardRef}
        dir="ltr"
        className={BOARD_CLASS}
        style={{
          containerType: "size",
          display: "flex",
          flexDirection: "row",
          border: `10px solid ${RAIL}`,
          borderRadius: 6,
          boxShadow: "var(--shadow-2)",
          boxSizing: "border-box",
          // The ground is a THIRD colour, darker than both triangles. With it
          // matching either one, half the points vanish into it and the board
          // reads as twelve points instead of twenty-four - seen on the mock's
          // first render, 2026-09-21.
          background: FELT,
          // chrome 111, MEASURED on the rendered page at three PC widths on
          // 2026-09-21, not the 150 first typed here from the footer card's
          // reserved height. On a PC the footer sits in the column BESIDE the
          // board and adds no height at all, so 150 sized the board 39px
          // shorter than the window allowed - the stale-number failure
          // `repro-board-fills-the-window.mjs` exists for, and it caught it.
          ...boardVars({ vw: 92, vh: 52, cap: 420, chrome: 111, ratio: RATIO }),
          aspectRatio: String(RATIO),
        }}
      >
        {side(TOP_LEFT, BOTTOM_LEFT, "b")}
        {/* The bar stands UPRIGHT between the two sides, black's men above the
            middle and white's below - the way you would find them on a real
            board, and the way a player picks the right one up without reading
            a label. */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            flex: "0 0 8%",
            minWidth: 0,
            background: RAIL,
          }}
        >
          {tray("bar", "b")}
          {tray("bar", "w")}
        </div>
        {side(TOP_RIGHT, BOTTOM_RIGHT, "w")}
        {/* The off tray at the side, split the same way. */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            flex: "0 0 7%",
            minWidth: 0,
            background: RAIL,
          }}
        >
          {tray("off", "b")}
          {tray("off", "w")}
        </div>
      </div>
    </GameChrome>
  );
}
