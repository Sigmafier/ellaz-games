// Hold the Line's chrome: the arcade HUD, the entrance, and the shop.
//
// THE SHOP NEEDS NO CHANGE TO `@ui`, which is the finding this file rests on.
// `ArcadeEntrance.pick` is documented as *a choice the player makes BEFORE
// pressing the button, drawn between the difficulty and the button, because it
// changes what the button starts* - which is exactly a shop. So `ArcadeChrome`
// never learns what a shop is, and the between-waves screen is the entrance
// wearing different words.
//
// It also keeps the law: a showcase game's own controls go on an ENTRANCE over
// its arena, never in a row under it. A row reserves height on every frame of
// the run; an entrance reserves it on none - measured 234px -> 359px of arena
// at 1536x639.

import { useCallback, useEffect, useRef, useState } from "react";
import type { GameContext } from "@sdk/index";
import { ArcadeChrome, type ArcadeEntrance, type ArcadeHud } from "@ui/ArcadeChrome";
import type { DifficultyOption } from "@ui/DifficultySelector";
import { winMoment } from "@shared/index";
// Hit feedback. The arena is a canvas, so the JUICE that a DOM game gets from
// a CSS class has to be driven from here: a kill pops a burst at the body's
// own place on screen, and a strike on the keep shakes the frame. Both are
// read off the run's events rather than guessed at, so the picture cannot
// disagree with what the simulation did.
import { burst, shake } from "@juice/index";
import { useRememberedLevel } from "@shared/useRememberedLevel";
import { laneArena } from "./arena";
import { ARENA, clearBonus, newRun, runRng, startWave } from "./logic";
import { CAMPAIGN_WAVES } from "./waves";
import {
  ITEMS,
  buy,
  canBuy,
  isOffered,
  ownedOf,
  priceOf,
} from "./shop";
import type { Arena, LevelKey, RunState, ShopId } from "./types";
import type { LineScene, LineStatus } from "./LineScene";
import { measureBoxUnscaled, type ScaleManagerLike } from "@shared/phaserBox";
import { BOARD_CLASS, boardVars, isPcArena } from "@ui/boardSize";
import { balancedLines, type TitleInks, type TitleLine } from "@ui/ArcadeTitle";
import { ShopCard } from "./shopArt";
import { lineCard, lineEnd, nextLineEnd, type LineEnd } from "./screens";

// `ctx.locale` is a SHIPPED locale - en, he, es, sv - and NOT a page locale.
// French is the fifth PAGE_LOCALES arm, so it has a content file under
// `src/content/games/fr/` and no interface strings at all. An `fr:` key here
// does not compile, and the `as never` that was hiding that on the first draft
// is gone rather than kept.
const LEVELS: readonly DifficultyOption<LevelKey>[] = [
  { id: "calm", label: { he: "רגוע", en: "Calm", es: "Tranquilo", sv: "Lugn" } },
  { id: "normal", label: { he: "רגיל", en: "Normal", es: "Normal", sv: "Normal" } },
  { id: "wild", label: { he: "פראי", en: "Wild", es: "Salvaje", sv: "Vild" } },
];

const T = {
  // "Play", as the approved title card has it (2026-10-01) - it was "Start" on the plain card.
  play: { he: "שחקו", en: "Play", es: "Jugar", sv: "Spela" },
  send: { he: "לשלוח גל", en: "Send the wave", es: "Enviar la oleada", sv: "Skicka vågen" },
  again: { he: "עוד פעם", en: "Play again", es: "Otra vez", sv: "Spela igen" },
  wave: { he: "גל", en: "Wave", es: "Oleada", sv: "Våg" },
  cleared: { he: "הגל נוצח", en: "Wave cleared", es: "Oleada superada", sv: "Vågen klarad" },
  fell: { he: "הבית נפל", en: "The keep fell", es: "La fortaleza cayó", sv: "Fästet föll" },
  won: { he: "החזקתם את הקו!", en: "You held the line!", es: "¡Aguantaste!", sv: "Ni höll linjen!" },
  overtime: { he: "תוספת זמן", en: "Overtime", es: "Tiempo extra", sv: "Övertid" },
  // The title's hint on a narrow portrait screen (`ROTATE_HINT`).
  rotate: {
    he: "סובבו את המסך לתצוגה גדולה יותר",
    en: "Rotate for a bigger view",
    es: "Gira la pantalla para verlo más grande",
    sv: "Vrid skärmen för en större bild",
  },
  tagline: {
    he: "המצודה משמאל. הם באים מימין.",
    en: "Your keep is on the left. They come from the right.",
    es: "Tu fortaleza está a la izquierda. Vienen por la derecha.",
    sv: "Ditt fäste står till vänster. De kommer från höger.",
  },
} as const;

const say = (ctx: GameContext, k: keyof typeof T): string =>
  (T[k] as Record<string, string>)[ctx.locale] ?? T[k].en;

/**
 * WHEN THE TITLE ASKS FOR A TURN: a portrait screen under 600px wide. The lane is
 * 900 units, so there it is drawn under 0.66x - the same line at which the cast
 * starts being drawn bigger (`narrowBoost`) - and turning the phone is the one
 * thing that makes the whole lane bigger without changing the game. A media
 * query, LIVE: the hint goes the moment the phone is turned, and comes back if
 * it is turned upright again on the title.
 */
const ROTATE_HINT = "(orientation: portrait) and (max-width: 599px)";

/** True while `query` matches; follows the window. */
function useMatches(query: string): boolean {
  const [on, setOn] = useState(() => typeof matchMedia === "function" && matchMedia(query).matches);
  useEffect(() => {
    if (typeof matchMedia !== "function") return undefined;
    const mq = matchMedia(query);
    const read = () => setOn(mq.matches);
    read();
    mq.addEventListener("change", read);
    return () => mq.removeEventListener("change", read);
  }, [query]);
  return on;
}

/** The keep-fell card's three tile words. */
const TILE = {
  score: { he: "ניקוד", en: "Score", es: "Puntos", sv: "Poäng" },
  wave: { he: "גל", en: "Wave", es: "Oleada", sv: "Våg" },
  best: { he: "שיא", en: "Best", es: "Récord", sv: "Rekord" },
} as const;

/** Hold the Line's inks on its title card (the mock's warm "htl" theme). */
const INKS: TitleInks = {
  accent: "#ffc24b",
  ink: "#2a1608",
  light: "#fff1d6",
  chip: "rgba(20, 14, 12, 0.88)",
  sel: "#fff1d6",
  selRing: "#ff8a3d",
  panel: "rgba(11, 13, 31, 0.88)",
  line: "#2a2f55",
  gold: "#ffd166",
};

/** A heading in the card's two warm glows. */
const warm = (texts: string[]): TitleLine[] =>
  texts.map((text, i) => (i === 0 ? { text, glow: "#ffd27a", fill: "#f4fffd" } : { text, glow: "#ff8a3d", fill: "#fff0fb" }));

/** The tiles' drawings: a face for the score, a chevron for the wave, a crown for the record. */
const SCORE_ICON = (
  <svg viewBox="0 0 16 16" width="100%" height="100%" aria-hidden="true">
    <circle cx="8" cy="8" r="6.4" fill="none" stroke="#ffd166" strokeWidth="1.8" />
    <path d="M5.2 5.9l2 2m0-2l-2 2M8.8 5.9l2 2m0-2l-2 2M5.6 11.2q2.4-1.7 4.8 0" fill="none" stroke="#ffd166" strokeWidth="1.5" strokeLinecap="round" />
  </svg>
);
const WAVE_ICON = (
  <svg viewBox="0 0 24 24" width="100%" height="100%" aria-hidden="true" fill="none" stroke="#74b9ff" strokeWidth="3.4" strokeLinecap="round" strokeLinejoin="round">
    <path d="M5 15l7-7 7 7" />
  </svg>
);
const BEST_ICON = (
  <svg viewBox="0 0 16 16" width="100%" height="100%" aria-hidden="true">
    <path d="M2 12.5l-.8-7 3.6 3.2L8 3.5l3.2 5.2 3.6-3.2-.8 7z" fill="#ffd166" />
  </svg>
);

export function LineGame({ ctx }: { ctx: GameContext }) {
  const host = useRef<HTMLDivElement | null>(null);
  const scene = useRef<LineScene | null>(null);
  const [level, setLevel] = useRememberedLevel<LevelKey>(ctx, LEVELS.map((l) => l.id), "normal");
  const [status, setStatus] = useState<LineStatus | null>(null);
  const [paused, setPaused] = useState(false);
  const [, force] = useState(0);
  /**
   * PC or phone, read once at mount - the same breakpoint the board sizes on.
   * On a phone the lane is a short strip, so the title card takes the whole
   * game panel (the approved mock) with the live lane as its art strip on top.
   */
  const [pc] = useState(isPcArena);
  const askTurn = useMatches(ROTATE_HINT);

  /**
   * The lane shape, picked ONCE at mount and handed to the simulation.
   *
   * A media query can change how big a box is drawn; it cannot change how much
   * lane the game has. `laneArena` reads the box it will really be drawn in, so
   * every window gets an honest shape rather than one of two constants.
   *
   * MEASURED IN THE MOUNT EFFECT, NOT IN A `useMemo`. The first version read
   * `host.current` from a memo, which runs during RENDER - before the ref is
   * attached - so it was always null and the lane was always the `ARENA`
   * fallback, on every window. `assert:arena` caught it as a 900x420 canvas in
   * a 900x429 box; nothing else could, because a fallback that renders is a
   * fallback that looks correct.
   */
  const arenaRef = useRef<Arena>(ARENA);
  /**
   * A mirror of the lane, for the STYLE only.
   *
   * The box has to carry the arena's own aspect ratio or Phaser's FIT
   * letterboxes inside it - which `assert:arena` reads, correctly, as a
   * canvas that is not its box. Deliberately NOT in the mount effect's deps:
   * the effect sets it, and re-running the effect on it would re-create the
   * game for ever.
   */
  const [drawn, setDrawn] = useState<Arena>(ARENA);

  /**
   * The run. A ref because the scene mutates it every frame and React must not
   * re-render on that - `an-animation-in-parent-state-redraws-the-whole-screen.md`
   * is exactly this shape, and a wave of 40 walkers ticked through `setState`
   * would redraw the whole shop every frame.
   */
  const run = useRef<RunState>(newRun(level, ARENA));

  /**
   * The frame shakes when the keep is struck, and a kill pops where it fell.
   *
   * Driven from the run's own event list, which `step` drains every frame - so
   * a cue nobody drew is a cue that has passed, and none of this can claim
   * something the simulation did not do. `prefersReducedMotion` is respected
   * inside `@juice` itself, so there is no branch here.
   */
  const onFrameEvents = useCallback(() => {
    const el = host.current;
    if (!el) return;
    const box = el.getBoundingClientRect();
    const a = run.current.arena;
    for (const e of run.current.events) {
      if (e.t === "kill") {
        burst(box.left + (e.x / a.w) * box.width, box.top + (e.y / a.h) * box.height, { count: 8 });
      } else if (e.t === "houseHit") {
        shake(el, 6);
      }
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    let game: { destroy(b: boolean): void } | null = null;
    const el = host.current;
    if (!el) return;

    // The box is real by now, so this is the first moment the lane can be
    // measured rather than guessed. The run is rebuilt on it before anything
    // is drawn, so the simulation and the canvas agree from frame one.
    arenaRef.current = laneArena(el.clientWidth, el.clientHeight);
    const arena = arenaRef.current;
    setDrawn(arena);
    run.current = newRun(level, arena);

    ctx.lifecycle.loadingStart();
    void (async () => {
      const [{ default: Phaser }, { LineScene: Scene }] = await Promise.all([
        import("phaser"),
        import("./LineScene"),
      ]);
      if (cancelled) return;
      const g = new Phaser.Game({
        type: Phaser.AUTO,
        parent: el,
        width: arena.w,
        height: arena.h,
        backgroundColor: "#9ecfe8",
        // NO_CENTER, and the host centres with CSS instead: `updateCenter`
        // compares the canvas's RENDERED rect against `parentSize`, and
        // `measureBoxUnscaled` deliberately puts those two in different units.
        scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.NO_CENTER },
        render: { preserveDrawingBuffer: true },
        scene: Scene as never,
      });
      game = g as never;
      // THE CANVAS FOLLOWS THE BOX'S LAYOUT SIZE, NOT ITS RENDERED ONE. Without
      // this the arena is drawn at the frame's scale inside a box already drawn
      // at that scale - `scale²` - while the HUD, being DOM, is laid out and
      // left standing around a smaller picture. Measured on survivors at
      // 390x844: a 331x699 box holding a 306x645 arena.
      measureBoxUnscaled(g.scale as unknown as ScaleManagerLike, el);
      g.scene.start("holdtheline", {
        ctx,
        arena,
        run: run.current,
        onStatus: (s: LineStatus) => {
          if (cancelled) return;
          onFrameEvents();
          setStatus(s);
        },
        onReady: (s: LineScene) => {
          if (!cancelled) scene.current = s;
        },
      });
      ctx.lifecycle.loadingFinished();
    })();

    return () => {
      cancelled = true;
      game?.destroy(true);
      scene.current = null;
    };
  }, [ctx, level, onFrameEvents]);

  useEffect(() => {
    scene.current?.setPaused(paused);
  }, [paused]);



  /**
   * Bank the wave's reward.
   *
   * FROM AN EFFECT WATCHING THE STATUS, never from inside a `setState` updater -
   * React may run an updater twice and for `winMoment` that is a double grant.
   * The latch is on the RUN (`paidMilestones`, `wonAt`) rather than on a ref, so
   * a saved position carries it and leaving and returning cannot be paid twice.
   */
  useEffect(() => {
    if (!status) return;
    const r = run.current;
    if (status.phase !== "shop") return;
    const cleared = status.wave - 1;
    if (cleared < 1) return;

    if (r.wonAt === cleared) {
      winMoment(ctx, {
        reason: "level_complete",
        tier: level === "wild" ? "hard" : level === "normal" ? "medium" : "easy",
        level: `wave-${cleared}`,
        score: { value: r.score, unit: "points", board: level },
      });
      return;
    }
    if (cleared % 5 === 0 && !r.paidMilestones.includes(cleared)) {
      r.paidMilestones.push(cleared);
      winMoment(ctx, { reason: "milestone", level: `wave-${cleared}`, confetti: false });
    }
  }, [status?.phase, status?.wave, ctx, level, status]);

  const restart = useCallback(() => {
    run.current = newRun(level, arenaRef.current);
    scene.current?.restartFrom(run.current);
    setPaused(false);
  }, [level]);

  const send = useCallback(() => {
    // PLAY AGAIN starts the new run's first wave, rather than landing on the
    // title for a second press.
    if (run.current.phase === "over") restart();
    const r = run.current;
    startWave(r, runRng(r.wave * 7 + 1));
    ctx.audio.unlock();
    force((n) => n + 1);
  }, [ctx, restart]);

  const purchase = useCallback(
    (id: ShopId, el: HTMLButtonElement) => {
      const bought = buy(run.current, id, run.current.arena.w * 0.45);
      if (bought) {
        ctx.audio.play("coin");
      } else {
        // NEVER `disabled`: a locked item stays pressable and answers with a
        // gentle wiggle. `disabled` is for the genuinely impossible, and "you
        // have not earned this yet" is not that.
        el.animate(
          [{ transform: "translateX(0)" }, { transform: "translateX(-4px)" }, { transform: "translateX(4px)" }, { transform: "translateX(0)" }],
          { duration: 180 },
        );
        ctx.audio.play("fail");
      }
      force((n) => n + 1);
    },
    [ctx],
  );

  const r = run.current;
  const running = status?.phase === "wave";

  const hud: ArcadeHud = {
    hearts: { now: Math.ceil((status?.house ?? r.house) / 100), max: Math.ceil(r.houseMax / 100) },
    score: status?.score ?? 0,
    best: ctx.score?.best(level),
    clock: `${say(ctx, "wave")} ${status?.wave ?? 1}`,
    slots: [],
    boss: null,
    // The HUD draws these two words; they are the game's, so they are localised
    // here rather than inside `@ui`. "hearts" is what the keep has left.
    labels: {
      hearts: { he: "מצודה", en: "Keep", es: "Fortaleza", sv: "Fäste" }[ctx.locale],
      score: { he: "ניקוד", en: "Score", es: "Puntos", sv: "Poäng" }[ctx.locale],
    },
  };

  /**
   * THE CARD (operator, 2026-10-01, "one-screen start, all four"): the title
   * before wave 1, the shop between waves, and "The keep fell" - one shared card
   * in the title's style. The keep-fell card is LATCHED: a difficulty tap on it
   * builds a fresh run at wave 1, and read off the phase alone the card would
   * turn into the title under the finger.
   */
  const now = lineEnd(status?.score ?? r.score, status?.wave ?? r.wave, ctx.score?.best(level) ?? 0);
  const [end, setEnd] = useState<LineEnd | null>(null);
  const phase = status?.phase;
  useEffect(() => {
    setEnd((prev) => nextLineEnd(prev, phase, now));
  }, [phase]);
  const shown = phase === "over" ? now : end;
  const face = lineCard(phase, r.wave, shown);
  const name = "Hold the Line";
  /* On a phone the lane sits at the top of the panel and is the card's art: the
     card is clear over it (a light veil) and dark below it. */
  const strip = (veil: number) =>
    pc ? "transparent" : `linear-gradient(rgba(11, 13, 31, ${veil}), rgba(11, 13, 31, ${veil + 0.4}) var(--title-head), #0b0e22 var(--title-head))`;
  const shop = (
    <div className="ellaz-strip" style={{ display: "flex", flexWrap: "wrap", gap: 10, justifyContent: "center", maxWidth: 560 }}>
      {ITEMS.filter((i) => isOffered(r, i.id)).map((i) => (
        <ShopCard
          key={i.id}
          id={i.id}
          line={i.line}
          price={priceOf(r, i.id)}
          owned={ownedOf(r, i.id)}
          cap={i.cap}
          affordable={canBuy(r, i.id)}
          locale={ctx.locale}
          onBuy={purchase}
        />
      ))}
    </div>
  );
  const common = {
    inks: INKS,
    layout: "stack" as const,
    design: { tall: [390, 792] as [number, number], wide: [1026, 479] as [number, number] },
    play: { tall: [290, 78] as [number, number], wide: [300, 64] as [number, number] },
  };
  const entrance: ArcadeEntrance | null =
    face === null || running
      ? null
      : face === "over"
        ? {
            ...common,
            label: say(ctx, "fell"),
            lines: warm(balancedLines(say(ctx, "fell"), ctx.locale)),
            nameFs: [42, 58],
            top: [0.06, 0.042],
            tiles: [
              { id: "score", icon: SCORE_ICON, value: shown?.score ?? 0, label: TILE.score[ctx.locale], color: "#ffd166" },
              { id: "wave", icon: WAVE_ICON, value: shown?.wave ?? 1, label: TILE.wave[ctx.locale], color: "#74b9ff" },
              { id: "best", icon: BEST_ICON, value: shown?.best ?? 0, label: TILE.best[ctx.locale], color: "#ffffff" },
            ],
            action: say(ctx, "again"),
            again: true,
            onAction: () => {
              setEnd(null);
              send();
            },
            cover: strip(0.45),
            scrim: pc ? "rgba(11, 13, 31, 0.62)" : undefined,
          }
        : {
            ...common,
            label: face === "title" ? name : say(ctx, "cleared"),
            lines: warm([
              face === "title"
                ? name.toLocaleUpperCase()
                : r.wonAt > 0 && r.wave > CAMPAIGN_WAVES
                  ? `${say(ctx, "overtime")} · ${say(ctx, "wave")} ${r.wave}`
                  : `${say(ctx, "cleared")} · +$${clearBonus(r)}`,
            ]),
            nameFs: face === "title" ? [44, 70] : [30, 46],
            top: [0.06, 0.058],
            tagline: face === "title" ? say(ctx, "tagline") : undefined,
            hint: face === "title" && askTurn ? say(ctx, "rotate") : undefined,
            result: r.wonAt > 0 && r.wave === CAMPAIGN_WAVES + 1 ? say(ctx, "won") : undefined,
            pick: shop,
            action: face === "title" ? say(ctx, "play") : say(ctx, "send"),
            onAction: send,
            cover: strip(0.15),
            scrim: pc ? "linear-gradient(rgba(11, 13, 31, 0.5), rgba(11, 13, 31, 0.5)), linear-gradient(transparent 30%, rgba(11, 13, 31, 0.6))" : undefined,
          };

  return (
    <ArcadeChrome
      ctx={ctx}
      hud={hud}
      entrance={entrance}
      span={pc ? "arena" : "panel"}
      levels={LEVELS}
      level={level}
      onLevel={(next: LevelKey) => {
        setLevel(next);
        run.current = newRun(next, arenaRef.current);
        scene.current?.restartFrom(run.current);
      }}
      onRestart={() => {
        setEnd(null);
        restart();
      }}
      paused={paused}
      onPaused={setPaused}
    >
      <div
        className={BOARD_CLASS}
        style={{
          position: "relative",
          // THE PC SIZING POLICY. Without `.ellaz-board` a PC gets the phone's
          // fixed box, which `repro-board-fills-the-window.mjs` refuses by name
          // - it reported "no .ellaz-board, so a PC gets the phone's fixed box"
          // on three of its four arms before this existed.
          //
          // `ratio` is the lane the run is really being played on, so the box
          // and the simulation cannot disagree about their shape. `chrome` is
          // NOT YET MEASURED on a built page - it is survivors' entrance-screen
          // figure, and this game has the same arcade chrome and no footer, so
          // it is the honest starting value rather than a reading. Re-measure
          // it as `#game-frame.offsetHeight - board.offsetHeight` before
          // quoting it anywhere.
          ...boardVars({
            vw: 96,
            vh: 58,
            cap: 900,
            chrome: 16,
            ratio: drawn.w / drawn.h,
            // 1760 rather than survivors' 1664, and it is the 90% floor that
            // sets it: the board gate measures the board against its ROW, and
            // 1664 of a 1920 row is 87%. A lane game wants the width anyway -
            // a wider board is the same lane drawn bigger, never a longer one.
            capPc: 1760,
          }),
        }}
      >
      <div
        ref={host}
        style={{
          width: "100%",
          // THE SAME value the simulation was handed, so the drawn box and the
          // lane being played on cannot disagree about their shape. Without it
          // FIT letterboxes the canvas inside a box of a different ratio, and
          // `assert:arena` reads that gap as the scale-squared defect it is
          // built to catch - which it is not, but the gate cannot tell them
          // apart and should not have to.
          aspectRatio: `${drawn.w} / ${drawn.h}`,
          maxHeight: "100%",
          borderRadius: 14,
          overflow: "hidden",
          // Phaser's `autoCenter` is NO_CENTER (see the config above), so the
          // centring happens here.
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          margin: "0 auto",
        }}
      />
      </div>
    </ArcadeChrome>
  );
}
