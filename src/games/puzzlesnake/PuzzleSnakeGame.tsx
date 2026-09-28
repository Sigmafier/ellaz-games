// Puzzle Snake - the game. A DOM game over the pure rules in `logic.ts`: the
// board is a grid of divs, every press is one step, and nothing moves on a
// clock. React owns the state; `logic.ts` decides what every press does.
//
// Split into small hooks - the state (`useStore`), the solve (`useSolved`), the
// presses (`usePresses`) and moving between levels (`useLevels`) - so that no
// function here runs past a screen. They share one `Store`; each destructures
// what it touches, so a gate like `if (picker) return` reads as itself and
// `restart-clears-the-input-gate.test.ts` can see it.
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { textFor } from "@i18n/index";
import type { GameContext, RewardTier } from "@sdk/index";
import { isPcArena } from "@ui/boardSize";
import { GameChrome } from "@ui/GameChrome";
import { haptic, shake } from "@juice/index";
import { useGameSession, useRememberedLevel, winMoment } from "@shared/index";
import { newGame, parseLevel, starsFor, step, undo as takeBack, isStuck, type Dir, type PuzzleState } from "./logic";
import { LEVELS, LEVEL_IDS, introduces, levelById, nextLevelId, placeInWorld, type LevelDef } from "./levels";
import { STARS_KEY, isOpen, readStars, recordSolve, startingLevel, type StarMap } from "./progress";
import { SESSION, pressesOf, replay } from "./session";
import { Board, type SolvedCard } from "./Board";
import { Picker } from "./Picker";
import { PcFooter, PcSide, PhoneFooter } from "./Controls";
import { WORDS, fill } from "./words";

/**
 * What a solve is worth is the economy's business; which TIER it is, is ours.
 * The first three garden levels are the tutorial, the rest of the garden is
 * the real thing, and Tricks (World 2) is the hard world.
 */
function tierOf(def: LevelDef): RewardTier {
  if (def.world === 2) return "hard";
  return LEVELS.indexOf(def) < 3 ? "easy" : "medium";
}

function fresh(id: string): PuzzleState {
  return newGame(parseLevel((levelById(id) ?? LEVELS[0]).rows));
}

/** Storage is try/catch-wrapped by the SDK already; this also survives a throwing port. */
function loadStars(ctx: GameContext): StarMap {
  try {
    return readStars(ctx.storage.get<unknown>(STARS_KEY, {}));
  } catch {
    return {};
  }
}

export function PuzzleSnakeGame({ ctx }: { ctx: GameContext }) {
  const T = textFor(WORDS, ctx.locale);
  const [pc] = useState(isPcArena);
  const st = useStore(ctx);
  const solved = useSolved(ctx, st);
  const { press, undo } = usePresses(ctx, st, solved);
  const { restart, open } = useLevels(ctx, st);
  useKeys({ press, undo, restart, active: !st.picker });

  const { def, game, picker, setPicker } = st;
  const next = nextLevelId(def.id);
  const worldLine = `${T.world} ${def.world} · ${def.world === 1 ? T.garden : T.tricks}`;
  const side = pc && !picker ? <PcSide T={T} worldLine={worldLine} levelLine={fill(T.levelOf, placeInWorld(def.id))} onLevels={() => setPicker(true)} /> : undefined;
  const footer = picker ? undefined : pc ? (
    <PcFooter T={T} onUndo={undo} onRestart={restart} />
  ) : (
    <PhoneFooter T={T} onUndo={undo} onRestart={restart} onLevels={() => setPicker(true)} onDir={press} />
  );

  return (
    <GameChrome ctx={ctx} stats={[]} numbersOnBoard onRestart={restart} side={side} footer={footer}>
      {picker ? (
        <Picker stars={st.stars} current={def.id} T={T} pc={pc} onPick={open} onBack={() => setPicker(false)} />
      ) : (
        <Board
          state={game}
          id={def.id}
          par={def.par}
          pc={pc}
          T={T}
          card={st.card}
          last={next === undefined}
          headRef={st.headRef}
          exitRef={st.exitRef}
          stuck={isStuck(game)}
          newTiles={introduces(def.id)}
          onSwipe={press}
          onTry={restart}
          onNext={() => (next ? open(next) : setPicker(true))}
          onUndo={undo}
          onStartOver={restart}
        />
      )}
    </GameChrome>
  );
}

type Store = ReturnType<typeof useStore>;

/** Every piece of state, restored from the session and the saved stars. */
function useStore(ctx: GameContext) {
  const [stars, setStars] = useState<StarMap>(() => loadStars(ctx));
  const [remembered, remember] = useRememberedLevel(ctx, LEVEL_IDS, startingLevel(stars));
  const restored = useMemo(() => ctx.session.load(SESSION), [ctx]);
  // A remembered or restored level must still be OPEN - a hand-edited save
  // must not be a way past a locked door.
  const [levelId, setLevelId] = useState(() => {
    const want = restored?.level ?? remembered;
    return isOpen(want, stars) ? want : startingLevel(stars);
  });
  const [game, setGame] = useState<PuzzleState>(() => (restored && restored.level === levelId && replay(restored)) || fresh(levelId));
  // One reward per attempt: set on a solve, cleared on a restart or a new level.
  // Carried in the snapshot, so undo-leave-return-solve cannot pay it twice.
  const [paid, setPaid] = useState(() => Boolean(restored?.level === levelId && restored.paid));
  const [card, setCard] = useState<SolvedCard | null>(null);
  const [picker, setPicker] = useState(false);
  const headRef = useRef<HTMLDivElement>(null);
  const exitRef = useRef<HTMLDivElement>(null);
  const def = levelById(levelId) ?? LEVELS[0];

  useGameSession(ctx, SESSION, () => ({ level: levelId, presses: pressesOf(game), paid }), { live: !game.solved });
  useEffect(() => {
    // Once, at mount; later levels announce themselves in `useLevels`.
    ctx.lifecycle.gameplayStart();
    ctx.analytics.levelStart(levelId);
  }, [ctx]);

  return { stars, setStars, remember, levelId, setLevelId, game, setGame, paid, setPaid, card, setCard, picker, setPicker, headRef, exitRef, def };
}

/** The solve: stars first (a fact about the player), then the win moment. */
function useSolved(ctx: GameContext, st: Store) {
  const { def, stars, setStars, setCard, paid, setPaid, exitRef } = st;
  return useCallback(
    (s: PuzzleState) => {
      const earned = starsFor(s.moves, def.par);
      const rec = recordSolve(stars, def.id, earned);
      setStars(rec.stars);
      ctx.storage.set(STARS_KEY, rec.stars);
      setCard({ stars: earned, moves: s.moves });
      if (paid) return;
      setPaid(true);
      const r = exitRef.current?.getBoundingClientRect();
      winMoment(ctx, {
        // Reasons, never amounts. A better star count on a level already
        // solved is a personal best; any other solve completes the level.
        reason: rec.improved ? "personal_best" : "level_complete",
        tier: tierOf(def),
        level: def.id,
        at: r ? { x: r.left + r.width / 2, y: r.top + r.height / 2 } : undefined,
        score: { value: s.moves, unit: "moves", board: def.id },
        // The solved card offers Try again and Next level itself; the host's
        // end-of-run strip would be a second Play again beside them.
        runEnded: false,
      });
    },
    [ctx, def, paid, stars, setStars, setCard, setPaid, exitRef],
  );
}

/** A press, and undo. From the handler flow, never from a state updater. */
function usePresses(ctx: GameContext, st: Store, solved: (s: PuzzleState) => void) {
  const { game, setGame, setCard, picker, headRef } = st;
  const press = useCallback(
    (dir: Dir) => {
      if (picker) return;
      ctx.audio.unlock();
      const r = step(game, dir);
      if (r.state === game) {
        // Refused: a wall, the body, the shut door, a lock without a key, or an
        // arrow entered the wrong way. A bump, never a penalty.
        if (r.outcome !== "solved" && headRef.current) shake(headRef.current, 3, 160);
        haptic.tap();
        return;
      }
      setGame(r.state);
      ctx.audio.play(r.outcome === "ate" ? "pop" : r.outcome === "key" ? "star" : "tap");
      if (r.outcome === "solved") solved(r.state);
    },
    [ctx, game, picker, solved, setGame, headRef],
  );
  const undo = useCallback(() => {
    setCard(null);
    setGame((g) => takeBack(g));
  }, [setCard, setGame]);
  return { press, undo };
}

/** Restart the level, or go to another. A level not open yet answers with a wiggle. */
function useLevels(ctx: GameContext, st: Store) {
  const { levelId, setLevelId, setGame, setCard, setPaid, setPicker, stars, remember } = st;
  const restart = useCallback(() => {
    setPicker(false);
    setCard(null);
    setPaid(false);
    setGame(fresh(levelId));
    ctx.analytics.levelStart(levelId);
  }, [ctx, levelId, setPicker, setCard, setPaid, setGame]);
  const open = useCallback(
    (id: string, el?: HTMLElement) => {
      if (!isOpen(id, stars)) {
        if (el) shake(el, 5, 260);
        haptic.tap();
        return;
      }
      remember(id);
      setLevelId(id);
      setPicker(false);
      setCard(null);
      setPaid(false);
      setGame(fresh(id));
      ctx.analytics.levelStart(id);
    },
    [ctx, remember, stars, setLevelId, setPicker, setCard, setPaid, setGame],
  );
  return { restart, open };
}

const KEYS: Record<string, Dir> = {
  ArrowUp: "up",
  ArrowDown: "down",
  ArrowLeft: "left",
  ArrowRight: "right",
  w: "up",
  s: "down",
  a: "left",
  d: "right",
};

/**
 * Arrows and WASD step; Z undoes; R restarts. Never while somebody is typing,
 * and never with a modifier held (Ctrl+R is the browser's). The page already
 * stops the scrolling keys from scrolling (`src/portal/keyGuard.ts`), so this
 * adds no scroll-blocking of its own.
 */
function useKeys(h: { press: (d: Dir) => void; undo: () => void; restart: () => void; active: boolean }) {
  const ref = useRef(h);
  ref.current = h;
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey || e.altKey || !ref.current.active) return;
      const t = e.target as HTMLElement | null;
      if (t && (t.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName) || t.closest("dialog"))) return;
      const k = e.key.length === 1 ? e.key.toLowerCase() : e.key;
      if (KEYS[k]) ref.current.press(KEYS[k]);
      else if (k === "z") ref.current.undo();
      else if (k === "r") ref.current.restart();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);
}
