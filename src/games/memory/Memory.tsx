import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { textFor } from "@i18n/index";
import type { GameContext, SessionSpec } from "@sdk/index";
import { GameChrome } from "@ui/GameChrome";
import { BOARD_CLASS, boardVars } from "@ui/boardSize";
import { type DifficultyOption } from "@ui/DifficultySelector";
import { burst, haptic } from "@juice/index";
import { useGameSession, useRememberedLevel, winMoment } from "@shared/index";
// Direct module paths, not the `@shared` barrel: pass-and-play is two games'
// worth of code and the barrel would pull it into every other game's chunk.
import {
  finish,
  leader,
  newVersus,
  nextMatch,
  pass,
  take,
  versusWords,
  type Seat,
  type VersusState,
} from "@shared/versus";
import { VersusBanner, VersusToggle } from "@shared/VersusBanner";
import { versusMatchEnd } from "@shared/versusMoment";
import { newGame, flip, pick, resolveMismatch, isWon, settle, type MemoryState } from "./logic";
import {
  DEFAULT_THEME,
  THEMES,
  THEME_IDS,
  backSvg,
  faceOf,
  faceSvg,
  themeOf,
  type ThemeId,
} from "./faces";

/**
 * The theme a player last chose, remembered by ID under a key that is forever
 * (the same shape as `useRememberedLevel`'s `level`). An id no longer in the
 * list reads as the default rather than as a board with no pictures.
 */
const THEME_KEY = "theme";
const isThemeId = (v: unknown): v is ThemeId => typeof v === "string" && (THEME_IDS as readonly string[]).includes(v);

// Difficulty = how many pairs. Grid stays 4 cols for easy/medium; hard (20 cards)
// goes to 5 cols so it keeps 4 rows and fits the height cap.
const LEVELS = [
  { id: "easy", pairs: 6, cols: 4, he: "קל", en: "Easy", es: "Fácil", sv: "Lätt" },
  { id: "medium", pairs: 8, cols: 4, he: "בינוני", en: "Med", es: "Media", sv: "Medel" },
  { id: "hard", pairs: 10, cols: 5, he: "קשה", en: "Hard", es: "Difícil", sv: "Svår" },
] as const;

type LevelId = (typeof LEVELS)[number]["id"];

const LEVEL_OPTIONS: DifficultyOption<LevelId>[] = LEVELS.map((lv) => ({
  id: lv.id,
  label: { he: lv.he, en: lv.en, es: lv.es, sv: lv.sv },
}));

function deckFor(themeId: ThemeId, levelIdx: number) {
  return newGame(pick(themeOf(themeId).faces.map((f) => f.id), LEVELS[levelIdx].pairs));
}

/**
 * A deal in progress — which theme, which difficulty, and the board.
 *
 * `themeId` travels because the deck is dealt from it: a card's `face` is a
 * face ID, and it only means a picture inside the theme that dealt it. It is
 * stored as an ID, never an index, for the reason the level is.
 *
 * VERSION 2 (2026-09-22): version 1 stored an emoji per card and a `setIdx`
 * into five emoji sets. Those snapshots are discarded rather than migrated,
 * per session-snapshot-convention.md - a half-finished memory board is worth a
 * minute of play.
 *
 * The state is SETTLED on the way in (see `settle` in logic.ts): a snapshot
 * caught inside the 850ms mismatch window would otherwise restore a locked
 * board with no timer to unlock it, and every card would be refused.
 */
interface MemorySession {
  levelId: LevelId;
  themeId: ThemeId;
  state: MemoryState;
}

const SESSION: SessionSpec<MemorySession> = {
  version: 2,
  validate: (value): value is MemorySession => {
    const s = value as Partial<MemorySession> | null;
    if (typeof s !== "object" || s === null) return false;
    if (typeof s.levelId !== "string") return false;
    const level = LEVELS.find((lv) => lv.id === s.levelId);
    if (!level) return false;
    if (!isThemeId(s.themeId)) return false;
    const theme = themeOf(s.themeId);
    const g = s.state;
    if (typeof g !== "object" || g === null) return false;
    // The deck must be the size this difficulty deals. `cols` comes from the
    // LEVEL, so a deck of some other length lays out as a grid with a ragged
    // last row rather than as anything obviously wrong.
    if (g.totalPairs !== level.pairs) return false;
    return (
      Array.isArray(g.cards) &&
      g.cards.length === level.pairs * 2 &&
      // Every face must be a picture this theme can draw, or the card renders
      // as nothing and can never be matched by sight.
      g.cards.every(
        (c) => c && typeof c.face === "string" && !!faceOf(theme, c.face) && typeof c.matched === "boolean",
      ) &&
      typeof g.moves === "number" &&
      typeof g.matchedPairs === "number"
    );
  },
};

export function Memory({ ctx }: { ctx: GameContext }) {
  const restored = useMemo(() => ctx.session.load(SESSION), [ctx]);
  const [themeId, setThemeId] = useState<ThemeId>(() => {
    if (restored) return restored.themeId;
    const stored = ctx.storage.get<unknown>(THEME_KEY, null);
    return isThemeId(stored) ? stored : DEFAULT_THEME;
  });
  // The level is remembered by ID, then resolved to the index everything else
  // here works in. Storing the INDEX would be the smaller change and the wrong
  // one: an index means "whichever level is third", so inserting a difficulty
  // silently moves every returning player to a different board than the one
  // they left — and to a different record, since the board is scoped by id.
  const [levelId, setLevelId] = useRememberedLevel(
    ctx,
    LEVEL_OPTIONS.map((o) => o.id),
    LEVELS[0].id,
  );
  const levelIdx = Math.max(
    0,
    LEVELS.findIndex((lv) => lv.id === levelId),
  );
  // Adopted only for the difficulty this mount opened on, and never once it is
  // won — a completed board has nothing left to turn over.
  const resume =
    restored && restored.levelId === levelId && !isWon(restored.state) ? restored : undefined;
  const [state, setState] = useState<MemoryState>(() => resume?.state ?? deckFor(themeId, levelIdx));
  const [won, setWon] = useState(false);
  // Fewest moves, per DIFFICULTY. A board is scoped to LEVELS[i].id because
  // clearing 6 pairs and clearing 10 are not the same achievement, and one
  // shared record would mean a child's easy run permanently outranks every
  // hard one they will ever play.
  const [best, setBest] = useState<number | undefined>(() => ctx.score?.best(levelId));
  const gridRef = useRef<HTMLDivElement>(null);
  const started = useRef(false);
  /**
   * PASS-AND-PLAY. `undefined` means one player, which is what this game has
   * always been; a state means two people are sitting here taking turns.
   *
   * NOT persisted, and that is deliberate rather than unfinished — see the
   * `useGameSession` call below.
   */
  const [versus, setVersus] = useState<VersusState | undefined>(undefined);
  /**
   * Which seat took each card, by card id.
   *
   * THE SCORING RULE IS THE BOARD ITSELF. A five-year-old is not told "you have
   * four pairs and she has three" — a taken pair turns that player's colour and
   * stays face-up, so the answer to "who is winning" is which colour covers more
   * of the table. It is the rule every family already plays by, and it needs no
   * number at all to read.
   *
   * State rather than a ref so the board stays a pure function of what is
   * rendered — and deliberately NOT part of `MemoryState`, because that shape is
   * the session snapshot's and widening it would invalidate every stored solo
   * board for the sake of a mode that is never stored.
   */
  const [owners, setOwners] = useState<Record<number, Seat>>({});
  // One payout per match, latched. The board's last pair is reachable from one
  // handler, but a latch costs nothing and a double payout is real money.
  const paidRef = useRef(false);
  /**
   * Which deal the pending mismatch timer belongs to.
   *
   * A mismatch is turned back over 850ms later by a `setTimeout` holding two
   * card INDICES. Deal a new board inside that window — restart, a new set, a
   * difficulty change, and now the two-player switch — and those indices point
   * at two cards on a deck that did not exist when the timer was set, so it
   * turns whatever is at those positions face down. Pre-existing; two-player
   * mode adds an easier door to it.
   */
  const dealRef = useRef(0);

  // `settle(state)`, not `state`. A flush can land inside the 850ms a mismatch
  // is shown for, and that state is only escapable by the timer that is about
  // to be thrown away — see settle() in logic.ts.
  /**
   * `settle(state)`, not `state`. A flush can land inside the 850ms a mismatch
   * is shown for, and that state is only escapable by the timer that is about
   * to be thrown away — see settle() in logic.ts.
   *
   * `live` also goes false the moment two people are playing, and that CLEARS
   * rather than freezes. Three reasons, and the third is the one that matters:
   *
   *  1. A match is two people who are in the room together. Restoring one into a
   *     room the second player has left is worse than a clean board.
   *  2. The board on screen already changed when they tapped "two players" —
   *     a fresh deck is dealt — so the stored position was gone from view either
   *     way. Clearing it makes the disk agree with the screen.
   *  3. IT REMOVES THE DOUBLE-PAY HOLE BY CONSTRUCTION. A snapshot must carry
   *     every latch recording a reward the run already collected, or walking out
   *     and coming back is a way to be paid twice
   *     (.claude/rules/session-snapshot-convention.md). Nothing about a match
   *     ever reaches the disk, so there is no latch to lose and no restore to
   *     pay for.
   */
  useGameSession(ctx, SESSION, () => ({ levelId, themeId, state: settle(state) }), {
    live: !won && !versus,
  });

  useEffect(() => {
    if (!started.current) {
      started.current = true;
      ctx.lifecycle.gameplayStart();
      ctx.analytics.levelStart(`${themeId}-${levelId}`);
    }
  }, [ctx]);

  const reset = useCallback(
    (opts?: { theme?: ThemeId; level?: number }) => {
      dealRef.current += 1;
      const ti = opts?.theme ?? themeId;
      const li = opts?.level ?? levelIdx;
      setThemeId(ti);
      setLevelId(LEVELS[li].id);
      setState(deckFor(ti, li));
      setWon(false);
      setBest(ctx.score?.best(LEVELS[li].id));
      setOwners({});
      paidRef.current = false;
      // In two-player mode the restart button is "deal again", and dealing again
      // is what hands the first move to whoever lost the last match.
      setVersus((v) => (v ? nextMatch(v) : v));
      ctx.analytics.levelStart(`${ti}-${LEVELS[li].id}`);
    },
    [ctx, themeId, levelIdx, setLevelId],
  );

  /**
   * Invite somebody, or go back to playing alone.
   *
   * Two people start a game together with ONE TAP and nothing else: no code, no
   * pairing, no second device, and above all no name to type — both players are
   * DRAWN from the pool the moment this is tapped. Tapping it again ends the
   * match and returns to playing alone.
   */
  const toggleVersus = useCallback(() => {
    ctx.audio.unlock();
    ctx.audio.play("pop");
    setVersus((v) => (v ? undefined : newVersus()));
    reset();
  }, [ctx, reset]);

  const onCard = useCallback(
    (index: number) => {
      ctx.audio.unlock();
      ctx.speech.unlock();
      const { state: ns, outcome } = flip(state, index);
      if (outcome.kind === "ignored") return;
      setState(ns);
      if (outcome.kind === "revealed") {
        ctx.audio.play("flip");
        haptic.tap();
      } else if (outcome.kind === "matched") {
        ctx.audio.play("success");
        haptic.success();
        const el = gridRef.current;
        const r = el?.getBoundingClientRect();
        const centre = r ? { x: r.left + r.width / 2, y: r.top + r.height / 2 } : undefined;
        if (centre) burst(centre.x, centre.y, { count: 10 });

        // TWO PLAYERS. The rule is the one every family already plays: a pair
        // you find is YOURS and you go again; a miss hands the turn over; the
        // most cards at the end wins. Nothing about it has to be read.
        if (versus) {
          const mine = versus.turn;
          setOwners((o) => ({ ...o, [ns.cards[outcome.a].id]: mine, [ns.cards[outcome.b].id]: mine }));
          const scored = take(versus, mine);
          if (isWon(ns)) {
            setWon(true);
            setVersus(finish(scored, leader(scored)));
            if (!paidRef.current) {
              paidRef.current = true;
              // ONE payout per match, for FINISHING and not for winning — so it
              // lands on a draw too, and the child who lost watches the same
              // coin fly to the same wallet. No score is reported: see
              // versusWinOptions for why a match must not touch a personal best.
              versusMatchEnd(ctx, centre, `versus-${LEVELS[levelIdx].id}`);
            }
          } else {
            // A match keeps the turn. That is the whole reason memory is worth
            // playing against a person.
            setVersus(scored);
          }
          return;
        }

        if (isWon(ns)) {
          setWon(true);
          // `ms` is deliberately absent. It used to carry `ns.moves`, which is
          // not a duration — it fed analytics.levelComplete() as one and would
          // have reported a 14-move game as a 14-millisecond game. Memory keeps
          // no clock, so the honest answer is "not measured"; the moves count
          // now goes where it means something, as the score.
          const result = winMoment(ctx, {
            reason: "level_complete",
            tier: LEVELS[levelIdx].id,
            level: `${themeId}-${LEVELS[levelIdx].id}`,
            at: centre,
            score: { value: ns.moves, unit: "moves", board: LEVELS[levelIdx].id },
          });
          if (result.score) setBest(result.score.best);
        }
      } else if (outcome.kind === "mismatch") {
        const { a, b } = outcome;
        const deal = dealRef.current;
        setTimeout(() => {
          // Those two indices belong to a deck that is no longer on the table.
          if (dealRef.current !== deal) return;
          setState((s) => resolveMismatch(s, a, b));
        }, 850);
        // The turn passes on a miss, and it passes NOW rather than when the
        // cards flip back — so the banner has already changed colour while the
        // two wrong cards are still up, which is what makes a four-year-old
        // look at the banner at all.
        if (versus) setVersus(pass(versus));
      }
    },
    [ctx, state, themeId, levelIdx, versus],
  );

  const cols = LEVELS[levelIdx].cols;
  const rows = Math.ceil((LEVELS[levelIdx].pairs * 2) / cols);
  const theme = themeOf(themeId);
  // THE HARD LEVEL HIDES THE GROUNDS (operator ruling 2026-09-22). On easy and
  // medium a face's own colour is a second clue to match by; on hard only the
  // picture is left, so it has to be remembered for what it is.
  const plain = LEVELS[levelIdx].id === "hard";
  // Built once per deal, not once per card per render: 20 cards re-render on
  // every flip, and the markup only changes when the theme or the level does.
  const art = useMemo(() => {
    const m = new Map<string, string>();
    for (const f of theme.faces) m.set(f.id, faceSvg(theme, f, plain));
    return m;
  }, [theme, plain]);
  const back = useMemo(() => backSvg(theme), [theme]);
  const T = textFor(
    {
      he: { pictures: "תמונות" },
      en: { pictures: "Pictures" },
      es: { pictures: "Dibujos" },
      sv: { pictures: "Bilder" },
    },
    ctx.locale,
  );
  // Written through from the tap, like `useRememberedLevel`: nothing can
  // unmount between the tap and the write.
  const chooseTheme = (id: ThemeId) => {
    ctx.audio.unlock();
    ctx.audio.play("tap");
    ctx.storage.set(THEME_KEY, id);
    reset({ theme: id });
  };
  return (
    <GameChrome
      ctx={ctx}
      stats={
        versus
          ? // The personal best is a fact about the PROFILE and a match is not,
            // so it would be answering a question nobody asked. Pairs left and
            // matches played are the two numbers that are true of this sitting.
            [
              {
                icon: "cards",
                label: ctx.t("pairs"),
                value: `${state.matchedPairs}/${state.totalPairs}`,
                ltr: true,
              },
              { icon: "flag", label: versusWords(ctx.locale).matches, value: versus.matches },
            ]
          : [
              {
                icon: "cards",
                label: ctx.t("pairs"),
                value: `${state.matchedPairs}/${state.totalPairs}`,
                ltr: true,
                compact: true,
              },
              {
                icon: "moves",
                label: ctx.t("moves"),
                value: state.moves,
                record: best ?? "-",
                compact: true,
              },
            ]
      }
      levels={LEVEL_OPTIONS}
      level={LEVELS[levelIdx].id}
      onLevel={(id) => reset({ level: LEVEL_OPTIONS.findIndex((o) => o.id === id) })}
      onRestart={() => reset()}
      // THE THEME PICKER, which replaced a "New set" button that stepped through
      // five emoji sets in an order nobody could see. Each choice is a PICTURE
      // from its own theme - a child who cannot read still knows what it gives
      // them - and the one being played is marked. In the side column on a PC
      // (GameChrome `side`), under the board on a phone. Hidden during a
      // two-player match, as the button was: the footer is the banner's then.
      side={
        versus ? undefined : (
          <div
            role="group"
            aria-label={T.pictures}
            className="ellaz-strip"
            style={{ display: "flex", gap: 8, justifyContent: "center" }}
          >
            {THEMES.map((t) => {
              const active = t.id === themeId;
              return (
                <button
                  key={t.id}
                  type="button"
                  aria-label={textFor(t.name, ctx.locale)}
                  aria-pressed={active}
                  onClick={() => chooseTheme(t.id)}
                  style={{
                    flex: "0 0 auto",
                    width: 72,
                    height: 72,
                    padding: 0,
                    borderRadius: 16,
                    overflow: "hidden",
                    border: active ? "4px solid var(--brand)" : "2px solid var(--line)",
                    boxShadow: active ? "var(--shadow-2)" : "var(--shadow-1)",
                    background: t.faces[0].bg,
                    cursor: "pointer",
                  }}
                  // The theme's first face, always drawn with its ground: the
                  // picker is a menu, not part of the board, so hard's rule
                  // does not reach it.
                  dangerouslySetInnerHTML={{ __html: faceSvg(t, t.faces[0], false) }}
                />
              );
            })}
          </div>
        )
      }
      footer={
        <div style={{ display: "grid", gap: 8 }}>
          {versus && (
            <VersusBanner
              v={versus}
              locale={ctx.locale}
              // The pile taken THIS match — the number that is changing while
              // they play, and the one the coloured cards on the table already
              // show. The sitting's tally lives in the stat row instead.
              counts={versus.taken}
              result={won ? leader(versus) : undefined}
            />
          )}
          <VersusToggle on={!!versus} locale={ctx.locale} onToggle={toggleVersus} />
        </div>
      }
    >
      <div
        ref={gridRef}
        className={BOARD_CLASS}
        style={{
          display: "grid",
          gridTemplateColumns: `repeat(${cols}, 1fr)`,
          gap: 12,
          // Phone: `min(92vw, 56vh, 460px)`, as it always was. PC: the height
          // the page has, times the grid's own shape (cols over rows), with the
          // 12px gaps declared so every level is one height - they used to make
          // a 4x3 board 3px shorter than a 4x4 one.
          ...boardVars({ vw: 92, vh: 56, cap: 460, chrome: 111, ratio: cols / rows, space: { x: (cols - 1) * 12, y: (rows - 1) * 12 } }),
        }}
      >
        {state.cards.map((card, i) => {
          const faceUp = card.flipped || card.matched;
          const face = faceOf(theme, card.face);
          // WHO TOOK IT — and this is memory's whole scoring rule, drawn rather
          // than counted. A taken pair wears the colour of the player who took
          // it, as a thick frame and a corner badge over the picture, so "who
          // is winning" is answered by looking at the table. Alone, a found
          // pair wears the same frame in one colour and simply stays found.
          const owner = versus ? owners[card.id] : undefined;
          const ring = owner === undefined ? "#17B98A" : versus?.players[owner].color;
          return (
            <button
              key={card.id}
              type="button"
              className={faceUp ? "ellaz-flip" : undefined}
              aria-label={faceUp && face ? textFor(face.name, ctx.locale) : "card"}
              onClick={() => onCard(i)}
              style={{
                position: "relative",
                aspectRatio: "1",
                minHeight: 64,
                minWidth: 0,
                padding: 0,
                border: "none",
                borderRadius: 16,
                overflow: "hidden",
                display: "block",
                background: faceUp ? "#fff" : "linear-gradient(180deg,var(--brand-2),var(--brand))",
                boxShadow: "var(--shadow-1)",
                transition: "background 0.15s ease",
                cursor: "pointer",
              }}
            >
              <span
                aria-hidden="true"
                style={{ position: "absolute", inset: 0, display: "block" }}
                dangerouslySetInnerHTML={{ __html: faceUp && face ? (art.get(face.id) ?? "") : back }}
              />
              {card.matched && (
                <span
                  aria-hidden="true"
                  style={{
                    position: "absolute",
                    inset: 0,
                    borderRadius: 16,
                    boxShadow: `inset 0 0 0 5px ${ring}`,
                    pointerEvents: "none",
                  }}
                >
                  <span
                    style={{
                      position: "absolute",
                      top: 5,
                      right: 5,
                      width: "24%",
                      aspectRatio: "1",
                      borderRadius: "50%",
                      background: ring,
                      color: "#fff",
                      display: "grid",
                      placeItems: "center",
                      fontSize: "clamp(10px, 3vw, 18px)",
                      fontWeight: 900,
                      lineHeight: 1,
                    }}
                  >
                    ✓
                  </span>
                </span>
              )}
            </button>
          );
        })}
      </div>
    </GameChrome>
  );
}
