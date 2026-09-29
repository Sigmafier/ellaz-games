// The winding-trail lobby (the operator's pick A, 2026-09-29): every level of
// every world on one path, bosses as castles, the hero standing where you are.
// Landscape and one screen wide on a PC; portrait, climbing and scrolling on a
// phone - the geometry is `trailLayout` in src/shared/career/trail.ts, where a
// node test holds every node inside the box at 1536x639 and 390x844.
//
// Every node is a real <button>. A locked one is still pressable and answers
// with a wiggle; nothing here is ever `disabled`. Tapping an open node chooses
// it (the hero walks there), tapping it again - or PLAY - starts it, so the
// whole screen is tap-completable with no drag.

import { useLayoutEffect, useMemo, useRef, useState } from "react";
import type { ReactElement, ReactNode } from "react";
import { DIR } from "@i18n/index";
import type { AppLocale } from "@i18n/index";
import { currentNode, nodeStates } from "../../shared/career/progress";
import type { NodeStateView } from "../../shared/career/progress";
import { HALO, trailLayout } from "../../shared/career/trail";
import type { TrailLayout, TrailPoint } from "../../shared/career/trail";
import type { CampaignFile } from "../../shared/career/campaign";
import type { CareerSave } from "../../shared/career/save";
import { CareerIcon, iconShapes, INK } from "./icons";
import { Backdrop, LABEL_INK, asScenery } from "./scenery";
import { Btn3d, DockButton, Hud, Screen, useBox, useWiggle } from "./parts";
import type { Purse } from "./parts";
import { careerWords, fill } from "./words";
import type { CareerWords } from "./words";
import { P } from "./palette";

export interface TrailMapProps {
  locale: AppLocale;
  campaign: CampaignFile;
  save: CareerSave;
  /** each world's name, already in the player's language - the game owns its world names */
  worldNames: Record<string, string>;
  purses: Purse[];
  /** the game's own character, drawn standing on the chosen node */
  hero?: ReactNode;
  onBack: () => void;
  onPlay: (levelId: string) => void;
  onShop?: () => void;
  onGear?: () => void;
  onStats?: () => void;
  /** a dot on GEAR: something was found that has not been looked at */
  gearBadge?: boolean;
}

const STONE = { done: P.mint, now: P.berry, open: P.sand, locked: P.stone } as const;

function stoneShapes(v: NodeStateView, r: number, selected: boolean): ReactElement {
  const big = v.state === "now" || selected;
  const rr = big ? r * 1.21 : r;
  const ink = v.state === "open" ? INK : P.white;
  return (
    <g>
      <ellipse cy={r * 0.78} rx={r * 1.14} ry={r * 0.29} fill={P.shade33} />
      {big ? <circle r={r * 1.64} fill={P.sun} opacity={0.5} /> : null}
      <circle r={rr} fill={STONE[v.state]} stroke={INK} strokeWidth={r * 0.16} />
      {v.state === "locked"
        ? <g transform={`scale(${r / 25})`}>{iconShapes("lock")}</g>
        : <text y={rr * 0.3} fontSize={rr * 0.82} textAnchor="middle" fill={ink} fontWeight={700}>{v.node.number}</text>}
      {v.state === "done" ? [-1, 0, 1].map((k) => (
        <g key={k} transform={`translate(${k * r * 0.68} ${-r * (k === 0 ? 1.5 : 1.29)}) scale(${r / 29})`}>{iconShapes("star", k + 1 < v.stars ? P.sun : P.slate)}</g>
      )) : null}
    </g>
  );
}

function castleShapes(v: NodeStateView, r: number, selected: boolean): ReactElement {
  const k = r / 40;
  const beaten = v.state === "done";
  const body = v.state === "now" ? P.berry : beaten ? P.violet : P.dusk;
  return (
    <g>
      {v.state === "now" || selected ? <circle cy={-4 * k} r={r * 1.5} fill={P.sun} opacity={0.45} /> : null}
      <g transform={`scale(${k})`}>
        <ellipse cy="26" rx="46" ry="9" fill={P.shade33} />
        <rect x="-40" y="-30" width="80" height="54" fill={body} stroke={INK} strokeWidth={4.5} />
        {[-40, -12, 16].map((dx) => <rect key={dx} x={dx} y="-44" width="24" height="15" fill={body} stroke={INK} strokeWidth={3.5} />)}
        <path d="M-13 24 V4 A13 13 0 0 1 13 4 V24" fill={INK} />
        <g transform="translate(0 -64) scale(1.2)">{iconShapes("crown", beaten || v.state === "now" ? P.sun : P.steel)}</g>
        {v.state === "locked" ? <g transform="translate(0 12) scale(.9)">{iconShapes("lock")}</g> : null}
      </g>
    </g>
  );
}

function nodeLabel(v: NodeStateView, w: CareerWords, worldName: string): string {
  const name = v.node.boss ? `${worldName} - ${w.boss}` : `${worldName} - ${fill(w.level, v.node.number ?? "")}`;
  if (v.state === "locked") return `${name}, ${w.locked}`;
  return v.stars > 0 ? `${name}, ${fill(w.stars, v.stars)}` : name;
}

function NodeButton(props: { v: NodeStateView; p: TrailPoint; selected: boolean; label: string; wiggling: boolean; onPress: () => void }): ReactElement {
  const { v, p } = props;
  const w = p.r * HALO.side * 2, top = p.r * HALO.up, h = top + p.r * HALO.down;
  return (
    <button type="button" aria-label={props.label} aria-current={props.selected ? "step" : undefined}
      className={`career-btn${props.wiggling ? " career-wiggle" : ""}`} onClick={props.onPress}
      style={{ position: "absolute", left: p.x - w / 2, top: p.y - top, width: w, height: h, padding: 0, border: 0, background: "transparent" }}>
      <svg width={w} height={h} viewBox={`${-w / 2} ${-top} ${w} ${h}`} aria-hidden="true" style={{ display: "block", overflow: "visible" }}>
        {p.boss ? castleShapes(v, p.r, props.selected) : stoneShapes(v, p.r, props.selected)}
      </svg>
    </button>
  );
}

function worldLabel(t: TrailLayout, i: number, name: string, kind: string): ReactElement {
  const band = t.bands[i];
  const [fillInk, edge] = LABEL_INK[asScenery(kind)];
  const common = { fill: fillInk, stroke: edge, strokeWidth: 5, paintOrder: "stroke", fontWeight: 700, letterSpacing: 2 } as const;
  if (t.orientation === "landscape") {
    return <text key={i} x={band.x + band.width / 2} y={t.insets.top - 30} fontSize={30} textAnchor="middle" {...common}>{name.toUpperCase()}</text>;
  }
  const boss = t.points.filter((p) => p.world === i).slice(-1)[0];
  const left = !boss || boss.x > t.width / 2;
  return <text key={i} x={left ? 14 : t.width - 14} y={band.y + 30} fontSize={21} textAnchor={left ? "start" : "end"} {...common} strokeWidth={4}>{name.toUpperCase()}</text>;
}

function TrailFloor({ t, props }: { t: TrailLayout; props: TrailMapProps }): ReactElement {
  const worlds = props.campaign.worlds;
  const path = t.points.map((p, i) => `${i ? "L" : "M"}${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(" ");
  return (
    <svg width={t.width} height={t.height} viewBox={`0 0 ${t.width} ${t.height}`} aria-hidden="true" style={{ position: "absolute", left: 0, top: 0, display: "block" }}>
      {t.bands.map((b, i) => <Backdrop key={i} kind={asScenery(worlds[i]?.scenery)} rect={b} id={`career-w${i}`} />)}
      {worlds.map((w, i) => worldLabel(t, i, props.worldNames[w.id] ?? w.id, w.scenery ?? ""))}
      <path d={path} fill="none" stroke={P.cream} strokeWidth={12} strokeDasharray="2 20" strokeLinecap="round" />
    </svg>
  );
}

function Dock({ t, w, props, onPlay }: { t: TrailLayout; w: CareerWords; props: TrailMapProps; onPlay: () => void }): ReactElement {
  const pc = t.orientation === "landscape";
  const size = pc ? 84 : 60;
  const play = (
    <Btn3d label={w.play} onPress={onPlay} style={{ width: pc ? 360 : 146, height: pc ? 88 : 70, background: P.berry, borderRadius: 26, fontSize: pc ? 40 : 28, display: "flex", gap: pc ? 12 : 8, alignItems: "center", justifyContent: "center", textShadow: `0 3px 0 ${INK}`, textTransform: "uppercase" }}>
      <CareerIcon name="play" size={pc ? 40 : 26} />{w.play}
    </Btn3d>
  );
  return (
    <div style={{ position: "absolute", zIndex: 30, left: pc ? 0 : 8, right: pc ? 0 : 8, bottom: pc ? 16 : 10, display: "flex", justifyContent: pc ? "center" : "space-between", alignItems: "flex-start", gap: pc ? 22 : 6 }}>
      {props.onShop ? <DockButton label={w.shop} icon="cart" color={P.orange} size={size} onPress={props.onShop} /> : null}
      {play}
      {props.onGear ? <DockButton label={w.gear} icon="armor" color={P.mint} size={size} onPress={props.onGear} badge={props.gearBadge} /> : null}
      {props.onStats ? <DockButton label={w.stats} icon="chart" color={P.white} size={size} onPress={props.onStats} /> : null}
    </div>
  );
}

export function TrailMap(props: TrailMapProps): ReactElement {
  const w = careerWords(props.locale);
  const dir = DIR[props.locale];
  const [boxRef, box] = useBox<HTMLDivElement>();
  const scroller = useRef<HTMLDivElement>(null);
  const views = useMemo(() => nodeStates(props.campaign, props.save), [props.campaign, props.save]);
  const now = currentNode(props.campaign, props.save);
  const [chosen, setChosen] = useState<string>(now?.id ?? views[views.length - 1].node.id);
  const [wiggling, wiggle] = useWiggle();
  const t = useMemo(() => (box.width > 0 && box.height > 0 ? trailLayout(props.campaign.worlds.map((x) => x.levels.length), box) : null), [box, props.campaign]);
  const at = views.findIndex((v) => v.node.id === chosen);

  useLayoutEffect(() => {
    const el = scroller.current;
    if (!t || !el || at < 0) return;
    const s = t.scrollFor(at);
    // whole pixels: a fractional offset is snapped differently run to run, measured as a 1px drift between two identical renders
    el.scrollLeft = Math.round(s.left);
    el.scrollTop = Math.round(s.top);
    // only when the layout itself changes: re-centring on every tap would yank the map under the finger
  }, [t]);

  const press = (v: NodeStateView) => {
    if (v.state === "locked") return wiggle(v.node.id);
    if (v.node.id === chosen) return props.onPlay(v.node.id);
    setChosen(v.node.id);
  };
  const p = t && at >= 0 ? t.points[at] : null;
  return (
    <Screen boxRef={boxRef} background={P.night} dir={dir}>
      {t ? (
        <div ref={scroller} dir="ltr" style={{ position: "absolute", inset: 0, overflowX: t.orientation === "landscape" ? "auto" : "hidden", overflowY: t.orientation === "portrait" ? "auto" : "hidden" }}>
          <div style={{ position: "relative", width: t.width, height: t.height }}>
            <TrailFloor t={t} props={props} />
            {views.map((v, i) => (
              <NodeButton key={v.node.id} v={v} p={t.points[i]} selected={v.node.id === chosen} wiggling={wiggling === v.node.id}
                label={nodeLabel(v, w, props.worldNames[v.node.world] ?? v.node.world)} onPress={() => press(v)} />
            ))}
            {p && props.hero ? <div aria-hidden="true" style={{ position: "absolute", pointerEvents: "none", left: p.x - p.r * 1.15, top: p.y - p.r * HALO.hero, width: p.r * 2.3, height: p.r * 3.4 }}>{props.hero}</div> : null}
          </div>
        </div>
      ) : null}
      {t && t.orientation === "portrait" ? <div aria-hidden="true" style={{ position: "absolute", left: 0, right: 0, bottom: 0, height: 150, pointerEvents: "none", background: `linear-gradient(${P.nightClear}, ${P.nightVeil} 45%, ${P.night})` }} /> : null}
      <Hud onBack={props.onBack} backLabel={w.back} purses={props.purses} purseLabel={w.gold} rtl={dir === "rtl"} inset={t?.orientation === "portrait" ? 12 : 24} />
      {t ? <Dock t={t} w={w} props={props} onPlay={() => props.onPlay(chosen)} /> : null}
    </Screen>
  );
}
