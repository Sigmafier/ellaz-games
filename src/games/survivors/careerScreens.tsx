// The career's screens that live ON THE ARENA - the two entrance tiles (the
// operator's pick quickB), the level banner (p0 `intro`) and the result card -
// plus the gold pill a career run wears. The map, shop and gear are the KIT's
// screens and are drawn by `CareerLayer.tsx` over the whole page.
//
// Every control is a real <button>; nothing here is ever `disabled`. Sizes come
// from the ARENA box's layout size (`useLayoutBox`, clientWidth/clientHeight),
// never a transformed rect - `fitStage` may scale `#game-frame`.

import { useEffect, useRef, useState } from "react";
import type { CSSProperties, ReactElement, ReactNode, RefObject } from "react";
import type { WorldId } from "./types";
import { CareerTileArt, K, NeonIcon, QuickTileArt, WORLD_ART, neonShape } from "./careerArt";
import { CastArt } from "./castArt";
import type { NeonCareerWords } from "./careerWords";

const FONT = "Fredoka, inherit";
const INK_SHADOW = `0 3px 0 ${K}`;

/** The element's own layout size, kept current as it resizes. */
export function useLayoutBox<T extends HTMLElement>(): [RefObject<T>, { w: number; h: number }] {
  const ref = useRef<T>(null);
  const [box, setBox] = useState({ w: 0, h: 0 });
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const read = () => setBox((b) => (b.w === el.clientWidth && b.h === el.clientHeight ? b : { w: el.clientWidth, h: el.clientHeight }));
    read();
    if (typeof ResizeObserver === "undefined") return;
    const ro = new ResizeObserver(read);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  return [ref, box];
}

const cover = (bg: string, z = 4): CSSProperties => ({
  position: "absolute",
  inset: 0,
  zIndex: z,
  borderRadius: 14,
  overflow: "hidden",
  background: bg,
  fontFamily: FONT,
  color: "#fff",
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  justifyContent: "center",
});

function Tile(props: { label: string; aria: string; bg: string; border: string; art: ReactNode; stats: ReactNode; w: number; h: number; onPress: () => void }): ReactElement {
  const artH = props.h * 0.52;
  return (
    <button
      type="button"
      aria-label={props.aria}
      onClick={props.onPress}
      style={{
        width: props.w,
        height: props.h,
        flex: "none",
        borderRadius: Math.round(props.w * 0.075),
        border: `5px solid ${props.border}`,
        background: props.bg,
        boxShadow: "0 8px 0 rgba(0,0,0,0.35)",
        padding: Math.round(props.w * 0.035),
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: Math.round(props.h * 0.03),
        color: "#fff",
        font: "inherit",
        fontFamily: FONT,
        cursor: "pointer",
        touchAction: "manipulation",
      }}
    >
      <span style={{ width: "100%", height: artH, flex: "none", borderRadius: 14, border: `4px solid ${K}`, overflow: "hidden", display: "block", boxSizing: "border-box" }}>{props.art}</span>
      <span style={{ fontSize: Math.round(props.h * 0.12), fontWeight: 800, textShadow: INK_SHADOW, lineHeight: 1.1 }}>{props.label}</span>
      <span style={{ display: "flex", alignItems: "center", gap: 10, fontSize: Math.round(props.h * 0.065), fontWeight: 700 }}>{props.stats}</span>
    </button>
  );
}

const stat = (icon: string, n: number, size: number) => (
  <span style={{ display: "inline-flex", alignItems: "center", gap: 5, direction: "ltr" }}>
    <NeonIcon name={icon} size={size} />
    {n}
  </span>
);

/** The entrance: the game's name and two big tiles, Career and Quick run (operator's pick B, 2026-09-29). */
export function Chooser(props: { title: string; w: NeonCareerWords; stars: number; gold: number; best: number; onCareer: () => void; onQuick: () => void }): ReactElement {
  const [ref, box] = useLayoutBox<HTMLDivElement>();
  const wide = box.w > box.h;
  const titleH = Math.max(40, Math.min(72, box.h * 0.13));
  // Two tiles side by side on a landscape arena, stacked on a portrait one, each
  // 1.1 wide per 1 tall and as large as the room allows.
  const tw = wide ? Math.min(box.w * 0.4, (box.h - titleH - 36) * 1.1) : Math.min(box.w * 0.84, ((box.h - titleH - 48) / 2) * 1.35);
  const th = wide ? tw / 1.1 : Math.min(tw / 1.35, (box.h - titleH - 48) / 2);
  const icon = Math.max(24, th * 0.13);
  const { w } = props;
  return (
    <div ref={ref} role="group" aria-label={props.title} style={{ ...cover("radial-gradient(circle at 50% 40%, rgba(24,28,70,0.92), rgba(8,10,26,0.96))"), gap: 18 }}>
      {box.w > 0 ? (
        <>
          <div style={{ fontSize: titleH * 0.55, fontWeight: 800, lineHeight: 1 }}>{props.title}</div>
          <div style={{ display: "flex", flexDirection: wide ? "row" : "column", gap: wide ? Math.round(box.w * 0.04) : 22, alignItems: "center" }}>
            <Tile
              label={w.career}
              aria={`${w.career}: ${props.stars} ${w.stars}, ${props.gold} ${w.gold}`}
              bg="#c2185b"
              border="#fff"
              art={<CareerTileArt />}
              stats={<>{stat("star", props.stars, icon)}{stat("gold", props.gold, icon)}</>}
              w={tw}
              h={th}
              onPress={props.onCareer}
            />
            <Tile
              label={w.quick}
              aria={`${w.quick}: ${w.best} ${props.best}`}
              bg="#2a3170"
              border="#22e7ff"
              art={<QuickTileArt />}
              stats={stat("trophy", props.best, icon)}
              w={tw}
              h={th}
              onPress={props.onQuick}
            />
          </div>
        </>
      ) : null}
    </div>
  );
}

/** Where a level sits in its world, for the dots under the banner: done, now, still to come, and the castle. */
export interface WorldDots {
  states: ("done" | "now" | "todo")[];
}

/**
 * THE LEVEL BANNER (p0 `intro`): the world's badge, its name on a ribbon, the level
 * number (a crown for the boss), the twist's sign, and where this level sits in
 * its world. One big button - tap to start now; it starts on its own a moment
 * later. It carries no instruction, so it tells nobody to tap it.
 */
export function Intro(props: { world: WorldId; name: string; twist: string; number: number | null; bossWord: string; levelWord: string; dots: WorldDots; onStart: () => void }): ReactElement {
  const [ref, box] = useLayoutBox<HTMLButtonElement>();
  const art = WORLD_ART[props.world];
  const twistIcon = props.world === "city" ? "lights" : props.world === "frost" ? "ice" : "pools";
  const size = Math.min(box.w * 0.9, box.h * 0.92 * (400 / 360));
  const label = `${props.name} - ${props.number === null ? props.bossWord : props.levelWord.replace("{n}", String(props.number))} - ${props.twist}`;
  return (
    <button
      ref={ref}
      type="button"
      aria-label={label}
      onClick={props.onStart}
      style={{ ...cover("rgba(6,18,42,0.66)", 5), border: "none", padding: 0, cursor: "pointer", touchAction: "manipulation" }}
    >
      {box.w > 0 ? (
        <svg aria-hidden="true" viewBox="-200 -170 400 360" width={size} height={size * 0.9} style={{ overflow: "visible" }}>
          <g opacity={0.2}>
            {Array.from({ length: 16 }, (_, i) => {
              const a = i * 0.3927;
              return <path key={i} d={`M0 0 L${Math.cos(a - 0.1) * 900} ${Math.sin(a - 0.1) * 900} L${Math.cos(a + 0.1) * 900} ${Math.sin(a + 0.1) * 900} Z`} fill="#bfe6ff" />;
            })}
          </g>
          <path d="M0 -120 L104 -60 L104 60 L0 120 L-104 60 L-104 -60 Z" fill={art.deep} stroke={K} strokeWidth={8} strokeLinejoin="round" />
          <path d="M0 -104 L90 -52 L90 52 L0 104 L-90 52 L-90 -52 Z" fill={art.badge} stroke="#fff" strokeWidth={5} strokeLinejoin="round" />
          <path d="M0 -104 L90 -52 L90 0 L-90 0 L-90 -52 Z" fill="#fff" opacity={0.18} />
          <g transform="translate(0 -18) scale(2.6)">{neonShape(props.world)}</g>
          <g transform="translate(0 82)">
            <path d="M-150 -26 H150 L132 0 L150 26 H-150 L-132 0 Z" fill="#fff" stroke={K} strokeWidth={6} strokeLinejoin="round" />
            <text y={13} fontSize={props.name.length > 10 ? 30 : 38} fontWeight={800} textAnchor="middle" fill={art.ribbon} style={{ fontFamily: FONT, textTransform: "uppercase" }}>
              {props.name}
            </text>
          </g>
          <g transform="translate(118 -92)">
            <circle r={46} fill="#c2185b" stroke={K} strokeWidth={6} />
            {props.number === null ? (
              <g transform="scale(1.5)">{neonShape("crown")}</g>
            ) : (
              <text y={22} fontSize={62} fontWeight={800} textAnchor="middle" fill="#fff" style={{ fontFamily: FONT }}>{props.number}</text>
            )}
          </g>
          <g transform="translate(-122 -88)">
            <circle r={46} fill="#fff" stroke={K} strokeWidth={6} />
            <g transform="scale(1.45)">{neonShape(twistIcon)}</g>
          </g>
          <g transform="translate(0 152)">
            {props.dots.states.map((st, i) => {
              const x = (i - (props.dots.states.length - 1) / 2) * 46;
              const last = i === props.dots.states.length - 1;
              const fill = st === "done" ? "#2bb58a" : st === "now" ? "#ffd166" : "#8a8f99";
              return last ? (
                <g key={i} transform={`translate(${x} 0)`}>{neonShape("crown", st === "todo" ? "#8a8f99" : "#ffd166")}</g>
              ) : (
                <circle key={i} cx={x} cy={0} r={14} fill={fill} stroke={K} strokeWidth={4} />
              );
            })}
          </g>
        </svg>
      ) : null}
    </button>
  );
}

/** What a gear piece looks like on the result card - the p0 gear pictures, in the tier's colour. */
const PIECE: Record<string, string> = { weapon: "sword", armor: "armor", ring: "ring" };

export interface ResultView {
  won: boolean;
  stars: number;
  gold: number;
  /** "armor:rare" or null. */
  drop: string | null;
  /** Diamonds this level paid: 1 for a boss beaten the first time this run was reported, else 0. */
  diamond: number;
}

/**
 * THE RESULT CARD: what the level gave, as pictures - stars, the gold, and any gear
 * found drawn big with its tier's colour. Two buttons: back to the map, or again.
 */
export function Result(props: { view: ResultView; w: NeonCareerWords; tierColor: (tier: string) => string; tierWord: (tier: string) => string; onMap: () => void; onRetry: () => void }): ReactElement {
  const [ref, box] = useLayoutBox<HTMLDivElement>();
  const { view, w } = props;
  const u = Math.max(0.55, Math.min(1.25, Math.min(box.w / 520, box.h / 440)));
  const [slot, tier] = view.drop ? view.drop.split(":") : [null, null];
  const btn = (label: string, icon: string, bg: string, onPress: () => void, primary: boolean): ReactElement => (
    <button
      type="button"
      aria-label={label}
      onClick={onPress}
      style={{
        minHeight: 56 * u + 8,
        padding: `0 ${20 * u}px`,
        borderRadius: 22 * u,
        border: `4px solid ${K}`,
        boxShadow: `0 5px 0 ${K}`,
        background: bg,
        color: primary ? "#fff" : K,
        display: "inline-flex",
        alignItems: "center",
        gap: 10 * u,
        fontSize: 22 * u,
        fontWeight: 800,
        font: "inherit",
        fontFamily: FONT,
        cursor: "pointer",
        touchAction: "manipulation",
      }}
    >
      <NeonIcon name={icon} size={30 * u} />
      <span style={{ fontSize: 22 * u, fontWeight: 800 }}>{label}</span>
    </button>
  );
  return (
    <div ref={ref} role="group" aria-label={view.won ? w.clear : w.lost} style={{ ...cover("rgba(8,10,26,0.86)", 6), gap: 14 * u, padding: 12 }}>
      {box.w > 0 ? (
        <>
          <div aria-live="polite" style={{ fontSize: 34 * u, fontWeight: 800, textShadow: INK_SHADOW, color: view.won ? "#ffd166" : "#ff8fa3" }}>{view.won ? w.clear : w.lost}</div>
          <div role="img" aria-label={`${view.stars} ${w.stars}`} style={{ display: "flex", gap: 8 * u, alignItems: "flex-end" }}>
            {[0, 1, 2].map((i) => (
              <span key={i} style={{ transform: i === 1 ? `translateY(${-10 * u}px)` : undefined }}>
                <NeonIcon name="star" size={(i === 1 ? 64 : 52) * u} color={i < view.stars ? "#ffd166" : "#5b5f77"} />
              </span>
            ))}
          </div>
          <div style={{ display: "flex", gap: 22 * u, alignItems: "center", justifyContent: "center", flexWrap: "wrap" }}>
            <div role="img" aria-label={`+${view.gold} ${w.gold}`} style={{ display: "flex", alignItems: "center", gap: 10 * u, fontSize: 40 * u, fontWeight: 800, direction: "ltr", textShadow: INK_SHADOW }}>
              <NeonIcon name="gold" size={46 * u} />+{view.gold}
            </div>
            {view.diamond > 0 ? (
              <div role="img" aria-label={`+${view.diamond} ${w.diamond}`} style={{ display: "flex", alignItems: "center", gap: 10 * u, fontSize: 40 * u, fontWeight: 800, direction: "ltr", textShadow: INK_SHADOW, filter: "drop-shadow(0 0 12px #7fd4ff)" }}>
                <NeonIcon name="gem" size={44 * u} />+{view.diamond}
              </div>
            ) : null}
            {slot && tier ? (
              <div role="img" aria-label={`${w.newGear}: ${props.tierWord(tier)}`} style={{ position: "relative", width: 104 * u, height: 104 * u, borderRadius: 20 * u, background: "#1c2150", border: `5px solid ${K}`, boxShadow: `0 0 26px ${props.tierColor(tier)}aa`, display: "grid", placeItems: "center" }}>
                <div style={{ position: "absolute", inset: 5 * u, border: `${6 * u}px solid ${props.tierColor(tier)}`, borderRadius: 14 * u }} />
                <NeonIcon name={PIECE[slot] ?? "sword"} size={66 * u} color={tier === "common" ? undefined : props.tierColor(tier)} />
                <span style={{ position: "absolute", top: -14 * u, padding: `2px ${8 * u}px`, borderRadius: 12, background: "#ff5c7a", border: `3px solid ${K}`, fontSize: 13 * u, fontWeight: 800, whiteSpace: "nowrap" }}>{w.newGear}</span>
                <span style={{ position: "absolute", bottom: -14 * u, padding: `2px ${10 * u}px`, borderRadius: 12, background: props.tierColor(tier), border: `3px solid ${K}`, color: K, fontSize: 14 * u, fontWeight: 800, textTransform: "uppercase" }}>{props.tierWord(tier)}</span>
              </div>
            ) : null}
          </div>
          <div style={{ display: "flex", gap: 14 * u, marginTop: 8 * u, flexWrap: "wrap", justifyContent: "center" }}>
            {btn(w.map, "map", view.won ? "#c2185b" : "#fff", props.onMap, view.won)}
            {btn(w.retry, "retry", view.won ? "#fff" : "#55efc4", props.onRetry, false)}
          </div>
        </>
      ) : null}
    </div>
  );
}

/** The gold a career run has picked up, top-centre on the arena where the HUD leaves room. */
export function GoldPill({ gold, label }: { gold: number; label: string }): ReactElement {
  return (
    <div role="img" aria-label={`${label}: ${gold}`} style={{ position: "absolute", zIndex: 3, top: "7%", left: "50%", transform: "translateX(-50%)", pointerEvents: "none", display: "flex", alignItems: "center", gap: 6, padding: "3px 12px 3px 6px", borderRadius: 20, background: "rgba(0,0,0,0.55)", color: "#fff", fontFamily: FONT, fontWeight: 800, fontSize: 18, direction: "ltr" }}>
      <NeonIcon name="gold" size={24} />
      {gold}
    </div>
  );
}

/** The small way back from the quick run's entrance to the two tiles. */
export function MenuButton({ label, onPress }: { label: string; onPress: () => void }): ReactElement {
  return (
    <button
      type="button"
      onClick={onPress}
      style={{ border: "2px solid rgba(255,255,255,0.4)", background: "transparent", color: "#fff", borderRadius: 999, minHeight: 40, padding: "0 16px", font: "inherit", fontFamily: FONT, fontWeight: 700, fontSize: 14, cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 6, touchAction: "manipulation" }}
    >
      <span aria-hidden="true">&#8249;</span>
      {label}
    </button>
  );
}

/** For the tiles' little robot: re-exported so the host has one import for the cast. */
export { CastArt };

/**
 * The one question an epic piece asks before it is bought: which slot. Three big
 * pictures, each a real button, over the shop; a Back to change your mind. Nothing
 * is spent until a slot is pressed (diamondShelf.ts `buyEpic`).
 */
export function SlotPick(props: { title: string; slots: { id: "weapon" | "armor" | "ring"; label: string }[]; closeLabel: string; onPick: (slot: "weapon" | "armor" | "ring") => void; onClose: () => void }): ReactElement {
  return (
    <div role="dialog" aria-modal="true" aria-label={props.title} style={{ ...cover("rgba(8,10,26,0.9)", 70), position: "absolute", borderRadius: 0, gap: 22, padding: 16 }}>
      <div style={{ fontSize: 30, fontWeight: 800, textShadow: INK_SHADOW, color: "#ffd166" }}>{props.title}</div>
      <div style={{ display: "flex", gap: 16, flexWrap: "wrap", justifyContent: "center" }}>
        {props.slots.map((s) => (
          <button key={s.id} type="button" aria-label={s.label} onClick={() => props.onPick(s.id)}
            style={{ width: 108, minHeight: 132, borderRadius: 22, border: `5px solid ${K}`, boxShadow: `0 0 22px #ffd166aa, 0 5px 0 ${K}`, background: "#1c2150", color: "#fff", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 8, fontFamily: FONT, fontSize: 17, fontWeight: 800, cursor: "pointer", touchAction: "manipulation" }}>
            <NeonIcon name={PIECE[s.id]} size={62} color="#ffd166" />
            <span>{s.label}</span>
          </button>
        ))}
      </div>
      <button type="button" onClick={props.onClose}
        style={{ minHeight: 52, padding: "0 26px", borderRadius: 20, border: `4px solid ${K}`, boxShadow: `0 5px 0 ${K}`, background: "#fff", color: K, fontFamily: FONT, fontSize: 20, fontWeight: 800, cursor: "pointer" }}>
        {props.closeLabel}
      </button>
    </div>
  );
}
