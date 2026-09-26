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
import { BOARD_CLASS, boardVars } from "@ui/boardSize";
import { ShopCard } from "./shopArt";

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
  play: { he: "להתחיל", en: "Start", es: "Empezar", sv: "Börja" },
  send: { he: "לשלוח גל", en: "Send the wave", es: "Enviar la oleada", sv: "Skicka vågen" },
  again: { he: "עוד פעם", en: "Play again", es: "Otra vez", sv: "Spela igen" },
  wave: { he: "גל", en: "Wave", es: "Oleada", sv: "Våg" },
  cleared: { he: "הגל נוצח", en: "Wave cleared", es: "Oleada superada", sv: "Vågen klarad" },
  fell: { he: "הבית נפל", en: "The keep fell", es: "La fortaleza cayó", sv: "Fästet föll" },
  won: { he: "החזקתם את הקו!", en: "You held the line!", es: "¡Aguantaste!", sv: "Ni höll linjen!" },
  overtime: { he: "תוספת זמן", en: "Overtime", es: "Tiempo extra", sv: "Övertid" },
  tagline: {
    he: "המצודה משמאל. הם באים מימין.",
    en: "Your keep is on the left. They come from the right.",
    es: "Tu fortaleza está a la izquierda. Vienen por la derecha.",
    sv: "Ditt fäste står till vänster. De kommer från höger.",
  },
} as const;

const say = (ctx: GameContext, k: keyof typeof T): string =>
  (T[k] as Record<string, string>)[ctx.locale] ?? T[k].en;

export function LineGame({ ctx }: { ctx: GameContext }) {
  const host = useRef<HTMLDivElement | null>(null);
  const scene = useRef<LineScene | null>(null);
  const [level, setLevel] = useRememberedLevel<LevelKey>(ctx, LEVELS.map((l) => l.id), "normal");
  const [status, setStatus] = useState<LineStatus | null>(null);
  const [paused, setPaused] = useState(false);
  const [, force] = useState(0);

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
    const r = run.current;
    if (r.phase === "over") {
      restart();
      return;
    }
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
  const over = status?.phase === "over";

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

  const entrance: ArcadeEntrance | null = running
    ? null
    : {
        title: over
          ? say(ctx, "fell")
          : r.wonAt > 0 && r.wave > CAMPAIGN_WAVES
            ? `${say(ctx, "overtime")} · ${say(ctx, "wave")} ${r.wave}`
            : r.wave === 1
              ? "Hold the Line"
              : `${say(ctx, "cleared")} · +$${clearBonus(r)}`,
        tagline: r.wave === 1 ? say(ctx, "tagline") : undefined,
        action: over ? say(ctx, "again") : r.wave === 1 ? say(ctx, "play") : say(ctx, "send"),
        result: r.wonAt > 0 && r.wave === CAMPAIGN_WAVES + 1 ? say(ctx, "won") : undefined,
        onAction: send,
        pick: over ? undefined : (
          <div className="ellaz-strip" style={{ display: "flex", flexWrap: "wrap", gap: 8, justifyContent: "center", maxWidth: 560 }}>
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
        ),
      };

  return (
    <ArcadeChrome
      ctx={ctx}
      hud={hud}
      entrance={entrance}
      levels={LEVELS}
      level={level}
      onLevel={(next: LevelKey) => {
        setLevel(next);
        run.current = newRun(next, arenaRef.current);
        scene.current?.restartFrom(run.current);
      }}
      onRestart={restart}
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
