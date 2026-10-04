// SNAKE SURVIVORS' CAREER, AS SCREENS (snake career S3, 2026-10-03): the map, the
// vending shop, the gear screen, a level's twist tip and its result card - Neon
// Survival's `CareerLayer` shape, built to the approved S0 mock.
//
// HOW IT IS REACHED: the title's Career pill (under PLAY, as Neon's title has it)
// opens the map; the map's Back goes to the title.
//
// WHERE EACH ONE IS DRAWN:
//   ON THE ARENA   the result card and the twist tip - they belong to the game box.
//   OVER THE PAGE  the map, the shop and the gear screen - the kit's screens,
//                  through `loadCareerKit()` (the lazy `career` chunk), on a second
//                  React root on <body>: `fitStage` may put a transform on
//                  `#game-frame`, and a fixed box inside a transformed one is fixed
//                  to it, not to the window.
//
// PAYING A LEVEL happens once, in `endRef`, called by the scene's own finish - an
// event handler, never a state updater - through `bankRun`, which refuses a run it
// has already paid (career-rules.test.ts, "leave and return").

import { useEffect, useMemo, useRef, useState } from "react";
import type { MutableRefObject, ReactElement, RefObject } from "react";
import { createRoot, type Root } from "react-dom/client";
import type { GameContext } from "@sdk/index";
import { diamonds } from "@sdk/diamonds";
import { notifyRunStart } from "@ui/gameTools";
import { usePageScrollLock } from "@ui/pageScrollLock";
import { loadCareerKit } from "../../ui/career/load";
import { equipItem, gearView } from "../../shared/career/gear";
import { readSave, writeSave, type CareerSave, type CareerStore } from "../../shared/career/save";
import { buy, shopView } from "../../shared/career/shop";
import { STAT_IDS } from "../../shared/career/stats";
import { CAREER_KEY, SNAKE_GEAR, SNAKE_MAX, SNAKE_SHOP, bankRun, payBossDiamond, simStats, statsOf, type Settlement } from "./careerRules";
import { snakeShopInfo, snakeSkin } from "./careerSkin";
import { ResultCard, SnakeHero, TwistTip } from "./careerScreens";
import { levelName, snakeCareerWords } from "./careerWords";
import { SNAKE_CAMPAIGN, levelNumber, snakeLevel } from "./careerWorlds";
import type { SnakeCareerResult, SnakeCareerStats } from "./careerTypes";

type Kit = Awaited<ReturnType<typeof loadCareerKit>>;
type Screen = "lobby" | "shop" | "gear" | "run" | "result";

/** The site's Career page, two levels up from `<base>[<locale>/]games/snakesurvivors/`. */
const CAREER_PAGE = "../../career/";
/** How long a twist's tip stays at the foot of the arena once a level starts. */
export const TIP_MS = 4000;

/** The half of the scene this layer drives. */
export interface SnakeCareerScene {
  startCareer(levelId: string, stats: SnakeCareerStats): void;
  leaveCareer(): void;
  startFromChrome(): void;
  restartFromChrome(): void;
  /** A career screen is over the arena: presses on its canvas must not start a run. */
  setCovered(on: boolean): void;
}

/** A layer on <body>, above the page, torn down in a microtask (the reactHost pattern). */
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

const storeOf = (ctx: GameContext): CareerStore => ({
  get: (key) => ctx.storage.get<unknown>(key, null),
  set: (key, value) => ctx.storage.set(key, value),
});

interface LayerProps {
  ctx: GameContext;
  title: string;
  phase: "ready" | "playing" | "won" | "over";
  /** ms of play in the level now running - the tip's clock. */
  ms: number;
  scene: RefObject<SnakeCareerScene | null>;
  endRef: MutableRefObject<((r: SnakeCareerResult, token: string) => void) | null>;
  onTitle: () => void;
}

/** What the last level paid, kept for its result card. */
interface Paid { out: Settlement | null; r: SnakeCareerResult; gem: number }

/** The kit's screens, fetched once through its lazy import - compared with null, never a bare-truthy input gate. */
function useKit(): Kit | null {
  const [kit, setKit] = useState<Kit | null>(null);
  useEffect(() => {
    if (kit !== null) return;
    let live = true;
    void loadCareerKit().then((k) => {
      if (live) setKit(k);
    });
    return () => {
      live = false;
    };
  }, [kit]);
  return kit;
}

/** The save, the screen, the level and its payment - every bit of the career's own state. */
function useCareer(props: LayerProps) {
  const store = useMemo(() => storeOf(props.ctx), [props.ctx]);
  const [save, setSave] = useState<CareerSave>(() => readSave(store, CAREER_KEY));
  const [screen, setScreen] = useState<Screen>("lobby");
  const [level, setLevel] = useState<string | null>(null);
  const [paid, setPaid] = useState<Paid | null>(null);
  const [gearBadge, setGearBadge] = useState(false);
  const [gems, setGems] = useState(() => diamonds.count);
  // THE PAYMENT, once per run - `bankRun` and the diamond's own token list make "once" true.
  props.endRef.current = (r: SnakeCareerResult, token: string) => {
    const out = bankRun(store, token, r, Math.random);
    const gem = payBossDiamond(diamonds, r, token);
    setGems(diamonds.count);
    if (out) {
      setSave(out.save);
      if (out.drop) setGearBadge(true);
      props.ctx.audio.play(out.won ? "coin" : "pop");
    }
    setPaid({ out, r, gem });
    setScreen("result");
  };
  const begin = () => {
    notifyRunStart();
    props.scene.current?.startFromChrome();
    setScreen("run");
  };
  // A restart from the page's own button, or Try again, puts the scene at "ready"
  // mid-career: that is a retry of the same level, so it simply starts again.
  useEffect(() => {
    if (props.phase === "ready" && (screen === "run" || screen === "result")) begin();
    // `begin` reads only refs and setters.
  }, [props.phase, screen]);
  const play = (id: string) => {
    setLevel(id);
    setPaid(null);
    props.scene.current?.startCareer(id, simStats(save));
    begin();
  };
  const write = (next: CareerSave) => {
    writeSave(store, CAREER_KEY, next);
    setSave(next);
  };
  return { save, write, screen, setScreen, level, paid, gearBadge, setGearBadge, gems, play };
}

type Career = ReturnType<typeof useCareer>;

/** The map, the shop and the gear screen: the kit's own, over the page, fed with the snake's data. */
function KitScreens({ props, c, kit }: { props: LayerProps; c: Career; kit: Kit | null }): ReactElement {
  const { ctx } = props;
  const w = snakeCareerWords(ctx.locale);
  const kw = kit?.careerWords(ctx.locale);
  const purses = [{ currency: "gold" as const, amount: c.save.gold }, { currency: "diamond" as const, amount: c.gems, label: kw?.diamonds, href: CAREER_PAGE }];
  const hero = <SnakeHero />;
  const toLobby = () => c.setScreen("lobby");
  const toGear = () => { c.setGearBadge(false); c.setScreen("gear"); };
  const onBuy = (id: string) => {
    const r = buy(SNAKE_SHOP, c.save, id);
    if (!r.ok) return;
    c.write(r.save);
    ctx.audio.play("coin");
  };
  const onEquip = (key: string) => {
    const next = equipItem(SNAKE_GEAR, c.save, key);
    if (next === c.save) return;
    c.write(next);
    ctx.audio.play("pop");
  };
  const info = snakeShopInfo(c.save, w);
  const inner = !kit ? (
    <div style={{ width: "100%", height: "100%", background: "#0b0e22" }} />
  ) : c.screen === "shop" ? (
    <kit.VendingShop locale={ctx.locale} shelves={[{ currency: "gold", rows: shopView(SNAKE_SHOP, c.save).map((row) => ({ ...row, info: info[row.id] })) }]} purses={purses} hero={hero} onBack={toLobby} onBuy={onBuy} />
  ) : c.screen === "gear" ? (
    <kit.Gear locale={ctx.locale} view={gearView(SNAKE_GEAR, c.save)} purses={purses} hero={hero} skin={snakeSkin(w)}
      stats={STAT_IDS.map((id) => ({ id, value: statsOf(c.save)[id], max: SNAKE_MAX[id] }))} onBack={toLobby} onEquip={onEquip} />
  ) : (
    <kit.TrailMap locale={ctx.locale} campaign={SNAKE_CAMPAIGN} save={c.save} worldNames={w.world} purses={purses} hero={hero} gearBadge={c.gearBadge}
      onBack={() => { props.scene.current?.leaveCareer(); props.onTitle(); }}
      onPlay={c.play} onShop={() => c.setScreen("shop")} onGear={toGear} onStats={toGear} />
  );
  return (
    <BodyLayer>
      <div role="dialog" aria-modal="true" aria-label={`${props.title} - ${w.career}`} data-career={c.screen}
        style={{ position: "fixed", left: 0, right: 0, top: "var(--hh, 0px)", bottom: 0, zIndex: 60, overscrollBehavior: "contain" }}>
        {inner}
      </div>
    </BodyLayer>
  );
}

/** The result card a finished level leaves on the arena. */
function Result({ props, c, kit, paid, level }: { props: LayerProps; c: Career; kit: Kit | null; paid: Paid; level: string }): ReactElement {
  const { ctx } = props;
  const w = snakeCareerWords(ctx.locale);
  const kw = kit?.careerWords(ctx.locale);
  const L = snakeLevel(level);
  const out = paid.out;
  return (
    <ResultCard
      view={{
        won: out?.won ?? paid.r.won, name: levelName(w, L.world, levelNumber(level)), stars: out?.stars ?? 0, hearts: paid.r.hearts, of: paid.r.of,
        gold: out?.gold ?? 0, picked: out?.picked ?? paid.r.gold, drop: out?.drop ?? null, diamond: paid.gem,
      }}
      w={w}
      tierColor={(t) => (kit?.TIER_COLOR as Record<string, string> | undefined)?.[t] ?? "#b2bec3"}
      pieceName={(slot, tier) => {
        const t = (kw?.tier as Record<string, string> | undefined)?.[tier] ?? tier;
        const s = w.slot[slot as keyof typeof w.slot] ?? slot;
        return w.piece.replace("{t}", t).replace("{s}", s);
      }}
      onMap={() => { notifyRunStart(); c.setScreen("lobby"); }}
      onRetry={() => props.scene.current?.restartFromChrome()} />
  );
}

export function SnakeCareerLayer(props: LayerProps): ReactElement | null {
  const kit = useKit();
  const c = useCareer(props);
  // THE MAP, THE SHOP AND THE GEAR hold the page still and tell the scene its
  // canvas is covered - Neon Survival's CareerLayer, the same two halves: the
  // lock stops the drag that slid the arena out from under the screen (125px on
  // live ellaz.fun at 390x844, 2026-10-03), and the cover refuses the tap if
  // anything else ever exposes it. The twist tip, the run and the result card
  // are on the arena itself and need neither.
  const covering = c.screen === "lobby" || c.screen === "shop" || c.screen === "gear";
  usePageScrollLock(covering);
  useEffect(() => {
    props.scene.current?.setCovered(covering);
  }, [covering, props.scene]);
  // Leaving the career (Back to the title) unmounts this layer; the scene must
  // not stay deaf to a canvas that is no longer covered.
  useEffect(() => () => props.scene.current?.setCovered(false), [props.scene]);
  if (c.screen === "lobby" || c.screen === "shop" || c.screen === "gear") return <KitScreens props={props} c={c} kit={kit} />;
  if (!c.level) return null;
  if (c.screen === "result" && c.paid) return <Result props={props} c={c} kit={kit} paid={c.paid} level={c.level} />;
  const w = snakeCareerWords(props.ctx.locale);
  const world = snakeLevel(c.level).world;
  const tip = world === "desert" ? w.tip.desert : world === "cave" ? w.tip.cave : null;
  return c.screen === "run" && props.phase === "playing" && tip && props.ms < TIP_MS ? <TwistTip text={tip} /> : null;
}
