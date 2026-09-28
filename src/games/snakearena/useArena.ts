// Boots Snake Arena's Phaser scene into a host element and bridges it to React:
// the scene publishes its status, and the chrome only ever calls the scene.
//
// NO SAVED POSITION (`ctx.session`), deliberately. A round is 90 seconds against
// snakes that never stop moving: a restored one would drop the player back into
// a live board mid-step, with four heads already on their way, and a leftover
// half-minute is not a position worth returning to. Leaving the page ends the
// round; the only latch it holds - the one grant a round can pay - is reported
// when the round ends, so nothing can be paid twice by coming back.
import { useEffect, useRef, useState, type RefObject } from "react";
import type { GameContext } from "@sdk/index";
import { measureBoxUnscaled, type ScaleManagerLike } from "@shared/phaserBox";
// TYPE-ONLY: a value import from the scene would make the static import real
// and pull Phaser out of its lazy chunk (the classic's comment says how).
import type { ArenaScene } from "./ArenaScene";
import { CELL } from "./draw";
import { INK } from "./ink";
import { ROUND_TICKS, STEP_MS, START_LEN, type BotCount, type Shape } from "./logic";
import type { ArenaStatus } from "./result";

export type SceneApi = Pick<ArenaScene, "setBots" | "setPaused" | "setHeld" | "restartFromChrome" | "startFromChrome" | "watch" | "steer">;

type Boot = { bots: BotCount; names: string[] };
type Game = { destroy: (removeCanvas: boolean) => void };

/** What the chrome shows before the scene has published anything. */
export function firstStatus(bots: BotCount): ArenaStatus {
  return {
    phase: "ready",
    paused: false,
    bots,
    len: START_LEN,
    peak: START_LEN,
    seconds: Math.ceil((ROUND_TICKS * STEP_MS) / 1000),
    place: 1,
    count: bots + 1,
    rows: [],
    winner: null,
    newBest: false,
  };
}

/** Download Phaser and the scene (lazily - never on a first visit), then start it in `host`. */
async function boot(
  host: HTMLElement,
  o: { ctx: GameContext; shape: Shape; start: Boot; live: () => boolean; onStatus: (s: ArenaStatus) => void; onReady: (s: SceneApi) => void },
): Promise<Game | null> {
  const [{ default: Phaser }, { ArenaScene: Scene }] = await Promise.all([import("phaser"), import("./ArenaScene")]);
  // The engine may take seconds on a cold cache; the component may be gone.
  if (!o.live()) return null;
  const g = new Phaser.Game({
    type: Phaser.AUTO,
    parent: host,
    width: o.shape.cols * CELL,
    height: o.shape.rows * CELL,
    backgroundColor: INK.bg,
    // NO_CENTER: the host centres with CSS - see `@shared/phaserBox`.
    scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.NO_CENTER },
    // So a bug report can carry a picture of the board (the classic's reason).
    render: { preserveDrawingBuffer: true },
    scene: Scene,
  });
  // The canvas follows its box's LAYOUT size, so a frame `fitStage` has scaled
  // does not shrink the board twice.
  measureBoxUnscaled(g.scale as unknown as ScaleManagerLike, host);
  // The scene hands ITSELF over once built (`onReady`): `scene.start` only queues.
  g.scene.start("snakearena", { ctx: o.ctx, shape: o.shape, ...o.start, onStatus: o.onStatus, onReady: o.onReady });
  return g;
}

/**
 * The scene, its status and a handle to call it. `start` is read once, at
 * mount: the shape and the first bot count belong to the round being dealt.
 */
export function useArena(ctx: GameContext, host: RefObject<HTMLDivElement>, shape: Shape, start: Boot) {
  const sceneRef = useRef<SceneApi | null>(null);
  const [status, setStatus] = useState<ArenaStatus>(() => firstStatus(start.bots));
  const startRef = useRef(start);
  useEffect(() => {
    let game: Game | null = null;
    let live = true;
    const el = host.current;
    if (!el) return;
    ctx.lifecycle.loadingStart();
    void boot(el, {
      ctx,
      shape,
      start: startRef.current,
      live: () => live,
      onStatus: (s) => live && setStatus(s),
      onReady: (s) => {
        if (live) sceneRef.current = s;
      },
    }).then((g) => {
      // Unmounted while the engine was starting: nothing else will destroy it.
      if (!live) return g?.destroy(true);
      game = g;
      if (g) ctx.lifecycle.loadingFinished();
    });
    // The platform's pause (the tab went away) holds the round without touching
    // the player's own pause - two owners, two flags.
    const offPause = ctx.onPause(() => sceneRef.current?.setHeld(true));
    const offResume = ctx.onResume(() => sceneRef.current?.setHeld(false));
    return () => {
      live = false;
      offPause();
      offResume();
      sceneRef.current = null;
      game?.destroy(true);
    };
  }, [ctx, host, shape]);
  return { status, sceneRef };
}
