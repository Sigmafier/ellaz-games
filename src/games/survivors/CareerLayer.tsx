// NEON SURVIVAL'S CAREER, AS SCREENS (P3, 2026-09-29): the entrance's two tiles,
// the map, the vending shop, the gear screen, a level's banner and its result.
//
// WHERE EACH ONE IS DRAWN, and why:
//   ON THE ARENA   the two tiles, the level banner, the result card, the gold pill.
//                  They belong to the game box the way the quick run's entrance
//                  does, and a canvas tap can never reach under them.
//   OVER THE PAGE  the map, the shop and the gear screen - the kit's screens, which
//                  the approved p0 lobby drew under the site header across the
//                  whole window. A PORTAL to <body>, because `fitStage` may put a
//                  transform on `#game-frame` and a fixed box inside a transformed
//                  one is fixed to IT, not to the window. (A second root rather
//                  than `createPortal`, for the bytes - see the import.)
//
// THE KIT'S SCREENS come through `loadCareerKit()` (its dynamic import - this is
// its first caller). Its RULES are imported statically (careerRules.ts), because
// the entrance tile needs the stars and the gold before anything is opened.
//
// PAYING A LEVEL happens once, in `bank` below, called by the scene's own finish -
// an event handler, never a state updater - through `bankRun`, which refuses a
// run it has already paid (career-rules.test.ts, "leave and return").

import { useEffect, useMemo, useRef, useState } from "react";
import type { MutableRefObject, ReactElement, RefObject } from "react";
// `createRoot`, NOT `createPortal`: the shell already ships the first (main.tsx,
// reactHost.tsx), while `createPortal` pulled preact's portal code into the
// first-visit vendor chunk - measured +240 B gz, over the payload ceiling.
import { createRoot, type Root } from "react-dom/client";
import type { GameContext } from "@sdk/index";
import { notifyRunStart } from "@ui/gameTools";
import { loadCareerKit } from "../../ui/career/load";
import { equipItem, gearView } from "../../shared/career/gear";
import { nodeStates, totalStars } from "../../shared/career/progress";
import { readSave, writeSave, type CareerSave, type CareerStore } from "../../shared/career/save";
import { buy, shopView } from "../../shared/career/shop";
import { STAT_IDS } from "../../shared/career/stats";
import { CAREER_KEY, NEON_GEAR, NEON_SHOP, STAT_MAX, bankRun, simStats, statsOf, type Settlement } from "./careerRules";
import { neonCareerWords } from "./careerWords";
import { Chooser, GoldPill, Intro, Result } from "./careerScreens";
import { RobotFill } from "./castArt";
import type { CareerResult, CareerStats } from "./types";
import { levelRow, NEON_CAMPAIGN } from "./worlds";

type Kit = Awaited<ReturnType<typeof loadCareerKit>>;
type Screen = "lobby" | "shop" | "gear" | "intro" | "run" | "result";

/** The half of the scene this layer drives. */
export interface CareerSceneApi {
  startCareer(levelId: string, stats: CareerStats): void;
  leaveCareer(): void;
  startFromChrome(): void;
  restartFromChrome(): void;
}

/**
 * A layer on <body>, above the page: its own root, rendered with the latest
 * children on every render of its owner. Torn down in a microtask, never inside
 * the owner's own unmount - `react-nested-root-teardown.md`, the reactHost pattern.
 */
function BodyLayer({ children }: { children: ReactElement }): null {
  const host = useRef<Root | null>(null);
  useEffect(() => {
    const el = document.createElement("div");
    document.body.appendChild(el);
    const root = createRoot(el);
    host.current = root;
    return () => {
      host.current = null;
      queueMicrotask(() => {
        try {
          root.unmount();
        } catch {
          /* already detached - fine */
        }
        el.remove();
      });
    };
  }, []);
  useEffect(() => {
    host.current?.render(children);
  });
  return null;
}

/** `ctx.storage` as the kit's store: it takes the save as the JSON text the kit writes. */
const storeOf = (ctx: GameContext): CareerStore => ({
  get: (key) => ctx.storage.get<unknown>(key, null),
  set: (key, value) => ctx.storage.set(key, value),
});

export function CareerLayer(props: {
  ctx: GameContext;
  mode: "menu" | "career";
  title: string;
  phase: "ready" | "playing" | "won" | "over";
  gold: number | null;
  quickBest: number;
  scene: RefObject<CareerSceneApi | null>;
  endRef: MutableRefObject<((r: CareerResult, token: string) => void) | null>;
  onCareer: () => void;
  onQuick: () => void;
  onMenu: () => void;
}): ReactElement | null {
  const { ctx } = props;
  const w = neonCareerWords(ctx.locale);
  const store = useMemo(() => storeOf(ctx), [ctx]);
  const [save, setSave] = useState<CareerSave>(() => readSave(store, CAREER_KEY));
  const [screen, setScreen] = useState<Screen>("lobby");
  const [kit, setKit] = useState<Kit | null>(null);
  const [level, setLevel] = useState<string | null>(null);
  const [paid, setPaid] = useState<Settlement | null>(null);
  const [gearBadge, setGearBadge] = useState(false);

  useEffect(() => {
    if (props.mode !== "career" || kit) return;
    let live = true;
    void loadCareerKit().then((k) => {
      if (live) setKit(k);
    });
    return () => {
      live = false;
    };
  }, [props.mode, kit]);

  // THE PAYMENT. The scene calls this from its own finish, once per run; `bankRun`
  // is what makes "once" true even if it were called again.
  props.endRef.current = (r: CareerResult, token: string) => {
    const out = bankRun(store, token, r, Math.random);
    if (out) {
      setSave(out.save);
      setPaid(out);
      if (out.drop) setGearBadge(true);
      ctx.audio.play(out.won ? "coin" : "pop");
    }
    setScreen("result");
  };

  // A restart from the page's own button (or the win strip's "Play again") puts the
  // scene back at "ready" mid-career: that is a retry, so the banner comes back.
  useEffect(() => {
    if (props.mode === "career" && props.phase === "ready" && (screen === "run" || screen === "result")) setScreen("intro");
  }, [props.phase, props.mode, screen]);

  const begin = () => {
    notifyRunStart();
    props.scene.current?.startFromChrome();
    setScreen("run");
  };
  useEffect(() => {
    if (props.mode !== "career" || screen !== "intro") return;
    const t = window.setTimeout(begin, 2600);
    return () => window.clearTimeout(t);
    // `begin` is rebuilt every render and reads only refs and setters.
  }, [screen, props.mode]);

  const writeAndSet = (next: CareerSave) => {
    writeSave(store, CAREER_KEY, next);
    setSave(next);
  };
  const play = (id: string) => {
    setLevel(id);
    setPaid(null);
    props.scene.current?.startCareer(id, simStats(save));
    setScreen("intro");
  };
  const toMap = () => {
    // Taking the finished run's share strip down with it: the player has left that run.
    notifyRunStart();
    setScreen("lobby");
  };

  if (props.mode === "menu") {
    return (
      <Chooser title={props.title} w={w} stars={totalStars(save)} gold={save.gold} best={props.quickBest} onCareer={() => { setScreen("lobby"); props.onCareer(); }} onQuick={props.onQuick} />
    );
  }

  const purses = [{ currency: "gold" as const, amount: save.gold }];
  const worldNames = { city: w.world.city, frost: w.world.frost, lava: w.world.lava };
  const hero = <RobotFill />;
  if (screen === "lobby" || screen === "shop" || screen === "gear") {
    const inner = !kit ? (
      <div style={{ width: "100%", height: "100%", background: "#0b0e22" }} />
    ) : screen === "shop" ? (
      <kit.VendingShop locale={ctx.locale} shelves={[{ currency: "gold", rows: shopView(NEON_SHOP, save) }]} purses={purses} hero={hero}
        onBack={() => setScreen("lobby")}
        onBuy={(id) => {
          const r = buy(NEON_SHOP, save, id);
          if (!r.ok) return;
          writeAndSet(r.save);
          ctx.audio.play("coin");
        }} />
    ) : screen === "gear" ? (
      <kit.Gear locale={ctx.locale} view={gearView(NEON_GEAR, save)} purses={purses} hero={hero}
        stats={STAT_IDS.map((id) => ({ id, value: statsOf(save)[id], max: STAT_MAX[id] }))}
        onBack={() => setScreen("lobby")}
        onEquip={(key) => {
          const next = equipItem(NEON_GEAR, save, key);
          if (next === save) return;
          writeAndSet(next);
          ctx.audio.play("pop");
        }} />
    ) : (
      <kit.TrailMap locale={ctx.locale} campaign={NEON_CAMPAIGN} save={save} worldNames={worldNames} purses={purses} hero={hero} gearBadge={gearBadge}
        onBack={() => {
          props.scene.current?.leaveCareer();
          props.onMenu();
        }}
        onPlay={play}
        onShop={() => setScreen("shop")}
        onGear={() => { setGearBadge(false); setScreen("gear"); }}
        onStats={() => { setGearBadge(false); setScreen("gear"); }} />
    );
    return (
      <BodyLayer>
        <div role="dialog" aria-modal="true" aria-label={`${props.title} - ${w.career}`}
          style={{ position: "fixed", left: 0, right: 0, top: "var(--hh, 0px)", bottom: 0, zIndex: 60, overscrollBehavior: "contain" }}>
          {inner}
        </div>
      </BodyLayer>
    );
  }

  if (!level) return null;
  const L = levelRow(level);
  if (screen === "intro") {
    const inWorld = nodeStates(NEON_CAMPAIGN, save).filter((v) => v.node.world === L.world);
    return (
      <Intro world={L.world} name={w.world[L.world]} twist={w.twist[L.world]} number={L.boss ? null : inWorld.find((v) => v.node.id === level)?.node.number ?? 1}
        bossWord={kit ? kit.careerWords(ctx.locale).boss : "Boss"} levelWord={w.level}
        dots={{ states: inWorld.map((v) => (v.node.id === level ? "now" : v.state === "done" ? "done" : "todo")) }}
        onStart={begin} />
    );
  }
  if (screen === "result") {
    const kw = kit?.careerWords(ctx.locale);
    return (
      <Result view={{ won: paid?.won ?? props.phase === "won", stars: paid?.stars ?? 0, gold: paid?.gold ?? 0, drop: paid?.drop ?? null }} w={w}
        tierColor={(t) => (kit?.TIER_COLOR as Record<string, string> | undefined)?.[t] ?? "#b2bec3"}
        tierWord={(t) => (kw?.tier as Record<string, string> | undefined)?.[t] ?? t}
        onMap={toMap}
        onRetry={() => props.scene.current?.restartFromChrome()} />
    );
  }
  return props.phase === "playing" && props.gold !== null ? <GoldPill gold={props.gold} label={w.gold} /> : null;
}
