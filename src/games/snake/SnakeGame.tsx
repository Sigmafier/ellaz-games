import { textFor } from "@i18n/index";
import { useEffect, useRef, useState } from "react";
import type { GameContext } from "@sdk/index";
import { BOARD_CLASS, boardVars, isPcArena } from "@ui/boardSize";
import { GameChrome } from "@ui/GameChrome";
import { DirectionPad } from "@ui/DirectionPad";
import { BoardStick } from "@ui/BoardStick";
import { ControlModePicker } from "@ui/ControlModePicker";
import { type DifficultyOption } from "@ui/DifficultySelector";
// The MODULE, not the `@shared/index` barrel — sanctioned by that barrel's own
// header, and deliberate here. Snake is the only game importing none of
// `@shared`, and pulling the barrel in for one hook would drag `spawn`,
// `Prompt` and the rest of it along for the ride.
import { useRememberedLevel } from "@shared/useRememberedLevel";
import { useControlMode } from "@shared/useControlMode";
import { measureBoxUnscaled, type ScaleManagerLike } from "@shared/phaserBox";
// TYPE-ONLY, and that is load-bearing. Importing one VALUE from this module
// (it was `SPEED_KEYS`, for a decorative exhaustiveness check) makes the static
// import real, and Rollup then refuses to move the module behind the dynamic
// `import()` below - it says so out loud: "dynamically imported ... but also
// statically imported ... will not move module into another chunk". The scene
// pulls Phaser, so that one convenience import un-deferred 380 KB of engine
// while every comment here still claimed it was lazy.
import type { SnakeStatus, SpeedKey } from "./SnakeScene";
import type { Dir } from "./logic";
import { overCard } from "./draw";

// The one Phaser game in the roster, wearing the same chrome as the other
// twenty. Its score, level and speed used to be drawn INSIDE the canvas at
// 20px in a corner, and its speed picker was three Phaser text buttons that
// only existed on the ready screen - so it was the one game where "restart"
// and "change difficulty" were unreachable once a run had started.
//
// React owns the chrome, Phaser owns the canvas, and the scene is the single
// source of truth for every number: it publishes on each `draw`, and the chrome
// only ever asks it to do things (`setSpeed`, `restartFromChrome`).
//
// Phaser is imported LAZILY, inside the effect. A static import would pull 379
// KB of engine into this module's chunk at parse time; snake is the only game
// that imports it at all, and it must stay that way.

// NO EMOJI IN THESE LABELS, and that is a measurement rather than a taste.
// The toggle's floor is 132px (see `GameChrome`), and "🙂 Normal" needs 146
// where the next widest label in the whole catalogue needs 128 - so snake was
// the ONE game whose difficulty read "Nor..." on a 390px phone. Raising the
// floor to fit it wrapped sudoku instead, whose third cell is a 99px compact
// one: the honest window was [146, 147], one pixel, in English only. Measured
// on the live site 2026-08-20. The dots beside the label already say which of
// the three you are on, which is what the animals were doing.
const SPEED_OPTIONS: DifficultyOption<SpeedKey>[] = [
  { id: "slow", label: { he: "איטי", en: "Slow", es: "Lento", sv: "Sakta" } },
  { id: "normal", label: { he: "רגיל", en: "Normal", es: "Normal", sv: "Normal" } },
  { id: "fast", label: { he: "מהיר", en: "Fast", es: "Rápido", sv: "Snabb" } },
];

// A fixed LOGICAL size, scaled to the parent by Phaser.Scale.FIT. Booting at a
// measured pixel width was the old shape and it read `clientWidth`, which
// includes padding - so the canvas was born slightly too big and FIT quietly
// corrected it. A constant cannot be measured wrong.
const LOGICAL = 440;
/** The start strip's height in both of its states: the ready button's measured
 *  49px, so the ready screen - and the phone frame baseline - are unchanged. */
const STRIP_H = 49;
/** The score band on top of the board. Fixed, so the frame never moves with a digit. */
const BAND_H = 44;
/** The board's own colours, shared by the canvas, the band and the card. */
/** A family LIST, never `inherit` inside one: "Fredoka, inherit" is an invalid
 *  declaration and the browser drops it whole, which is how the first build of
 *  the card rendered its button in the default face. */
const FONT = "Fredoka, Heebo, sans-serif";
const INK = { bg: "#0b0e22", rim: "#6c5ce7", mint: "#55efc4", gold: "#ffd166", text: "#f5f6ff", red: "#ff7675" };

export function SnakeGame({ ctx }: { ctx: GameContext }) {
  const hostRef = useRef<HTMLDivElement>(null);
  // Typed as the scene's public surface only. `any` for the Phaser.Game itself
  // would be honest but useless; this is the half we actually call.
  const sceneRef = useRef<{
    setSpeed: (k: SpeedKey) => void;
    setPaused: (p: boolean) => void;
    restartFromChrome: () => void;
    startFromChrome: () => void;
    steer: (dir: Dir) => void;
  } | null>(null);
  // Snake is the one game whose level lives inside the engine rather than in
  // React: the scene owns `selectedSpeed` and publishes it back out. So the
  // memory sits here and is pushed INTO the scene once it boots, rather than
  // the scene being taught to persist anything.
  const [speed, setSpeed] = useRememberedLevel(
    ctx,
    SPEED_OPTIONS.map((o) => o.id),
    "normal",
  );
  const speedRef = useRef(speed);
  speedRef.current = speed;
  const [status, setStatus] = useState<SnakeStatus>({
    score: 0,
    level: 1,
    speed,
    phase: "ready",
    paused: false,
    // Read here too, not only in the scene, so the band's first frame - before
    // Phaser has even downloaded - already shows the record.
    best: ctx.score?.best() ?? 0,
    newBest: false,
  });
  // Arrows (the default), one big stick, or a stick born under the thumb on
  // the board. Keyboard arrows and WASD steer in all three.
  const [controlMode, setControlMode] = useControlMode(ctx);
  // Read ONCE at mount. A phone run keeps the host's viewport expression
  // untouched; a PC run sizes the host from the height the window leaves
  // (`.ellaz-board`). The canvas follows either way: Phaser.Scale.FIT fits the
  // 440x440 logical canvas to whatever box the host is, so the grid, the speed
  // and the rules do not move - only the CSS size of the same canvas does.
  const [pc] = useState(isPcArena);

  useEffect(() => {
    let game: { destroy: (removeCanvas: boolean) => void } | null = null;
    let cancelled = false;
    const host = hostRef.current;
    if (!host) return;

    ctx.lifecycle.loadingStart();
    void (async () => {
      const [{ default: Phaser }, { SnakeScene }] = await Promise.all([
        import("phaser"),
        import("./SnakeScene"),
      ]);
      // The component may have unmounted while the engine was downloading. On a
      // cold cache that is seconds, not milliseconds, so this is a real race and
      // not a formality - without it Phaser mounts a canvas into a detached node
      // and nothing ever destroys it.
      if (cancelled) return;
      const g = new Phaser.Game({
        type: Phaser.AUTO,
        parent: host,
        width: LOGICAL,
        height: LOGICAL,
        backgroundColor: INK.bg,
        // NO_CENTER, and the host centres with CSS instead - `updateCenter`
        // would fight `measureBoxUnscaled` below. See `@shared/phaserBox`.
        scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.NO_CENTER },
        // The only reason this line exists: a bug report from this game can
        // carry a picture of the board.
        //
        // WebGL discards the drawing buffer after each frame is presented, so
        // `canvas.toDataURL()` from outside Phaser reads back a single flat
        // colour - it does not throw, it returns a well-formed black square.
        // Measured on the built bundle, 2026-09-03
        // (`scripts/repro/repro-report-shot.mjs`): snake's raw read-back was
        // 1 distinct colour against bubbleshooter's 67, so `shot.ts` refused
        // it as blank, correctly, and snake was the one canvas game whose
        // reports could never carry a screenshot.
        //
        // The cost is real and it is a rendering cost, not a frame-rate one:
        // the driver keeps the back buffer alive instead of discarding it, on
        // one 440x440 canvas. Named here rather than assumed - if snake ever
        // feels worse on a low-end phone, this is the line to question first,
        // and the fps column is not the instrument for that
        // (see .claude/rules on the engine benchmark).
        render: { preserveDrawingBuffer: true },
        scene: SnakeScene,
      });
      game = g;
      // The canvas follows the box's LAYOUT size, not its rendered one, so a
      // frame `fitStage` has scaled does not shrink the board twice. Snake has
      // no DOM drawn over its canvas, so the defect is quieter here than in
      // survivors - it is the same defect.
      measureBoxUnscaled(g.scale as unknown as ScaleManagerLike, host);
      g.scene.start("snake", {
        ctx,
        onStatus: (s: SnakeStatus) => {
          if (!cancelled) setStatus(s);
        },
        // The scene hands ITSELF over when it is built. Asking Phaser for it
        // here does not work: `scene.start` queues, so `getScene` on the next
        // line is null. See the comment on `onReady` in SnakeScene.
        onReady: (scene: typeof sceneRef.current) => {
          if (cancelled) return;
          sceneRef.current = scene;
          // The remembered speed, applied the moment the scene exists. Read
          // through a REF, not the state value: this effect's dependency list
          // is `[ctx]` on purpose, and closing over `speed` directly would
          // either go stale or — once added as a dependency — tear down and
          // reboot the whole Phaser game on every speed change.
          //
          // `setSpeed` republishes the status, so the chrome's toggle catches
          // up on its own rather than needing to be told twice.
          scene?.setSpeed(speedRef.current);
        },
      });
      ctx.lifecycle.loadingFinished();
    })();

    return () => {
      cancelled = true;
      sceneRef.current = null;
      game?.destroy(true);
    };
  }, [ctx]);

  // This game's own words. A locale RECORD, so promoting a language reds
  // this block by name instead of leaving the game speaking English
  // inside a page that is not.
  const T = textFor(
    {
      he: {
        over: "המשחק נגמר",
        newBest: "שיא חדש",
        ready: "הקישו כדי להתחיל",
        hint: "כפתורים, החלקה או חצים",
      },
      en: {
        over: "Game over",
        newBest: "New best",
        ready: "Tap to start",
        hint: "Buttons, swipe or arrow keys",
      },
      es: {
        over: "Fin del juego",
        newBest: "Nuevo récord",
        ready: "Toca para empezar",
        hint: "Botones, desliza o flechas",
      },
      sv: {
        over: "Spelet är slut",
        newBest: "Nytt rekord",
        ready: "Tryck för att börja",
        hint: "Knappar, svep eller pilar",
      },
    },
    ctx.locale,
  );

  // The pad's four directions are this game's four directions, so the shared
  // `PadDir` is `Dir` here rather than something to map. Steering is idempotent
  // — the scene ignores a turn into the direction it is already going — so the
  // joystick needs no repeat: entering a direction once is the whole message.
  const steer = (dir: Dir) => sceneRef.current?.steer(dir);
  const card = overCard(status);
  // The band never shows a best behind the score it sits beside, mid-run
  // included: the record is only reported at death.
  const bandBest = Math.max(status.best, status.score);

  return (
    <GameChrome
      ctx={ctx}
      // The score, stage and best are on the BOARD now, in its own colours -
      // "the interface looks like not a part of the game" was the review. Only
      // the difficulty stays up here, where every game keeps it.
      stats={[]}
      numbersOnBoard
      levels={SPEED_OPTIONS}
      level={status.speed}
      // Reachable MID-RUN, which the in-canvas picker never was. The scene
      // applies it on the next tick and does not treat it as a "go".
      onLevel={(k) => {
        setSpeed(k);
        sceneRef.current?.setSpeed(k);
      }}
      onRestart={() => sceneRef.current?.restartFromChrome()}
      // Only while it is actually moving. On the ready screen and the game-over
      // screen the snake is already stopped, and a cover over either hides the
      // one line telling the player how to leave it.
      //
      // Both read from the SCENE's published status rather than from a state
      // beside it, so a restart taken from behind the cover lifts it: the scene
      // clears its own flag and the next publish says so.
      paused={status.phase === "playing" ? status.paused : undefined}
      onPaused={
        status.phase === "playing" ? (next) => sceneRef.current?.setPaused(next) : undefined
      }
      footer={
        <div style={{ display: "flex", flexDirection: "column", gap: 10, alignItems: "center" }}>
          {/* No strip under the board any more (2026-09-26). "Tap to start"
              and the controls hint are on the START CARD over the board, and
              Play again is on the game-over card - so the band on top of the
              board costs the phone nothing: -49px of strip, +44px of band. */}
          {/* The Controls setting, directly above what it controls. */}
          <ControlModePicker mode={controlMode} onMode={setControlMode} t={ctx.t} />

          {/* On-screen controls — the old-school pad for a player with no
              keyboard who would rather tap than swipe, plus the stick in the
              middle for one who would rather steer. The Joystick setting draws
              one big stick instead; "On the board" draws nothing here. */}
          {controlMode !== "board" && (
            <DirectionPad onDir={steer} variant={controlMode === "joystick" ? "stick" : "pad"} />
          )}
        </div>
      }
    >
      {/* Always the same wrapper, so switching mode never remounts the node
          Phaser mounted its canvas into. In board mode its overlay sits over
          the canvas, so the canvas's own tap and swipe cannot also fire: the
          overlay's stick steers, and a tap with no travel is the same
          `startFromChrome` the strip below calls. */}
      <div
        className="snake-board"
        style={{ display: "inline-flex", flexDirection: "column", borderRadius: 14, overflow: "hidden", boxShadow: `0 0 0 2px ${INK.rim}, 0 10px 30px ${INK.rim}44` }}
      >
      {/* THE BAND. Part of the board: its colours, its width, its corners. */}
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
        <BandCell label={ctx.t("score")} value={status.score} color={INK.mint} />
        <BandCell label={ctx.t("stage")} value={status.level} color={INK.text} small />
        <BandCell label={ctx.t("best")} value={bandBest} color={INK.gold} />
      </div>
      <div style={{ position: "relative" }}>
      <BoardStick
        active={controlMode === "board"}
        onDir={steer}
        onTap={() => sceneRef.current?.startFromChrome()}
      >
        <div
          ref={hostRef}
          className={pc ? BOARD_CLASS : undefined}
          style={{
            // chrome 111 is an ESTIMATE, not a measurement: the head row every
            // GameChrome game pays once its footer (the strip, the picker and
            // the pad) sits in the column beside the board. Nothing else shares
            // this column.
            ...(pc
              ? boardVars({ vw: 88, vh: 46, cap: 440, chrome: 111 + BAND_H, ratio: 1 })
              : { width: "min(88vw, 46vh, 440px)" }),
            aspectRatio: "1",
            overflow: "hidden",
            // Phaser's `autoCenter` is off (see the config above), so the
            // centring is here. The box is square and so is the game, so FIT
            // fills it exactly and there is nothing to centre today.
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            // The canvas owns the gesture: no scroll, no pinch under a finger
            // that is mid-swipe.
            touchAction: "none",
          }}
        />
      </BoardStick>
      {/* THE GAME-OVER CARD. Over the board, above the board stick, and the
          only Play again on the page - GameHost's end-of-run strip does not
          appear for snake (a personal best is not `runEnded`). The backdrop
          lets pointers through, so a tap on the board still restarts the way
          it always has; the card itself takes them. */}
      {/* THE START CARD. The ready screen's one instruction, and a real
          button because it is one: "a thing that tells the player to tap it
          must answer a tap". Same path as a tap on the board, never a copy.
          The hint under it describes rather than asks, so it is plain text. */}
      {status.phase === "ready" && (
        <section
          className="snake-start-card"
          aria-label={T.ready}
          style={{ position: "absolute", inset: 0, display: "grid", placeItems: "center", pointerEvents: "none", zIndex: 3 }}
        >
          <div style={{ pointerEvents: "auto", display: "flex", flexDirection: "column", alignItems: "center", gap: 8, marginTop: "38%" }}>
            <button
              type="button"
              onClick={() => sceneRef.current?.startFromChrome()}
              style={{
                border: "none",
                borderRadius: 14,
                padding: "10px 22px",
                minHeight: STRIP_H,
                background: "var(--brand-strong)",
                color: "var(--on-brand)",
                fontFamily: FONT, fontWeight: 700, fontSize: 18,
                cursor: "pointer",
                touchAction: "manipulation",
                boxShadow: `0 0 22px ${INK.rim}88`,
              }}
            >
              {T.ready}
            </button>
            <span style={{ fontSize: 13, color: INK.text, opacity: 0.8, fontFamily: FONT }}>{T.hint}</span>
          </div>
        </section>
      )}
      {card && (
        <section
          className="snake-over-card"
          aria-label={T.over}
          style={{ position: "absolute", inset: 0, display: "grid", placeItems: "center", background: `${INK.bg}99`, pointerEvents: "none", zIndex: 3 }}
        >
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
            <div style={{ fontSize: 24, fontWeight: 700, letterSpacing: "0.06em", color: INK.red }}>{T.over}</div>
            <div style={{ display: "flex", justifyContent: "center", gap: 26, margin: "10px 0 6px" }}>
              <CardNum label={ctx.t("score")} value={card.score} color={INK.mint} />
              <CardNum label={ctx.t("best")} value={card.best} color={INK.gold} />
            </div>
            {card.newBest && (
              <div
                style={{ display: "inline-block", margin: "0 0 10px", padding: "3px 12px", borderRadius: 99, background: INK.gold, color: "#241c17", fontWeight: 700, fontSize: 13 }}
              >
                ★ {T.newBest}
              </div>
            )}
            <button
              type="button"
              onClick={() => sceneRef.current?.startFromChrome()}
              style={{
                display: "block",
                width: "100%",
                border: "none",
                borderRadius: 14,
                padding: "11px 12px",
                background: "var(--brand-strong)",
                color: "var(--on-brand)",
                fontFamily: FONT, fontWeight: 700, fontSize: 18,
                cursor: "pointer",
                touchAction: "manipulation",
              }}
            >
              {ctx.t("playAgain")}
            </button>
          </div>
        </section>
      )}
      </div>
      </div>
    </GameChrome>
  );
}

/** One number in the band: a small caption over a big value. */
function BandCell({ label, value, color, small }: { label: string; value: number; color: string; small?: boolean }) {
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
