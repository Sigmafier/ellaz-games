// The career's screens that live ON THE ARENA - the result card and a twist's tip
// - plus the snake standing in its coil, the hero the kit's map, shop and gear
// screens draw. The map, shop and gear themselves are the KIT's screens, drawn by
// `SnakeCareerLayer.tsx` over the whole page. Built to the approved S0 mock
// (2026-10-03, "Yes, build it").
//
// Every control is a real <button>; nothing here is ever `disabled`. Sizes come
// from the element's LAYOUT size (clientWidth / clientHeight), never a transformed
// rect - `fitStage` may scale `#game-frame`
// (a-canvas-that-measures-its-own-box-cannot-see-a-transform-on-it.md).

import type { ReactElement } from "react";
import { CareerIcon } from "../../ui/career/icons";
import { K, NeonIcon } from "../survivors/careerArt";
import { useLayoutBox } from "../survivors/careerScreens";
import type { SnakeCareerWords } from "./careerWords";

const FONT = "Fredoka, Heebo, sans-serif";
const SHADOW = `0 3px 0 ${K}`;

/** The snake standing up in its coil - the hero on the map, the shop and the gear screen. */
export function SnakeHero(): ReactElement {
  const coil = [
    { cx: 50, cy: 122, rx: 40, ry: 15, c: "#6c5ce7" },
    { cx: 50, cy: 104, rx: 33, ry: 13, c: "#6f86e0" },
    { cx: 50, cy: 88, rx: 26, ry: 11, c: "#5fb9d6" },
  ];
  return (
    <svg viewBox="0 0 100 145" width="100%" height="100%" aria-hidden="true" style={{ overflow: "visible", filter: "drop-shadow(0 0 6px #55efc488)" }}>
      {coil.map((e, i) => (
        <g key={i}>
          <ellipse cx={e.cx} cy={e.cy} rx={e.rx} ry={e.ry} fill={e.c} stroke={K} strokeWidth={3} />
          <ellipse cx={e.cx - e.rx * 0.3} cy={e.cy - e.ry * 0.35} rx={e.rx * 0.35} ry={e.ry * 0.25} fill="#fff" opacity={0.3} />
        </g>
      ))}
      <path d="M58 82 Q66 60 52 46" fill="none" stroke={K} strokeWidth={21} strokeLinecap="round" />
      <path d="M58 82 Q66 60 52 46" fill="none" stroke="#55efc4" strokeWidth={15} strokeLinecap="round" />
      <ellipse cx={50} cy={36} rx={20} ry={16} fill="#55efc4" stroke={K} strokeWidth={3} />
      <circle cx={42} cy={32} r={5.5} fill="#fff" stroke={K} strokeWidth={1.5} />
      <circle cx={58} cy={32} r={5.5} fill="#fff" stroke={K} strokeWidth={1.5} />
      <circle cx={43} cy={33} r={2.6} fill={K} />
      <circle cx={57} cy={33} r={2.6} fill={K} />
      <path d="M50 51 V60 L46 65 M50 60 L54 65" stroke="#ff5c7a" strokeWidth={2.5} fill="none" strokeLinecap="round" />
      <path d="M44 46 L46 51 L48 46 M52 46 L54 51 L56 46" fill="#fff" stroke={K} strokeWidth={1.2} />
    </svg>
  );
}

/** What a gear piece looks like on the result card - the skin's pictures. */
const PIECE: Record<string, string> = { weapon: "fang", armor: "scales", ring: "charm" };

export interface ResultView {
  won: boolean;
  /** The level's name, already in the player's language: "Garden 2". */
  name: string;
  stars: number;
  /** Full hearts left, of how many - the stars' reason, said under them. */
  hearts: number;
  of: number;
  /** Gold this level put in the purse (a loss: the half kept), and what was picked up. */
  gold: number;
  picked: number;
  /** "weapon:rare" or null. */
  drop: string | null;
  diamond: number;
}

/** The line under the stars: why this many, or what a loss kept. */
function reasonLine(view: ResultView, w: SnakeCareerWords): string {
  if (!view.won) return w.keepHalf.replace("{n}", String(view.gold)).replace("{m}", String(view.picked));
  const pattern = view.stars === 1 ? w.heartsOne : w.hearts;
  return pattern.replace("{n}", String(view.hearts)).replace("{m}", String(view.of)).replace("{s}", String(view.stars));
}

function GearDrop({ drop, u, w, tierColor, pieceName }: { drop: string; u: number; w: SnakeCareerWords; tierColor: (t: string) => string; pieceName: (slot: string, tier: string) => string }): ReactElement {
  const [slot, tier] = drop.split(":");
  const c = tierColor(tier);
  const name = pieceName(slot, tier);
  return (
    <div role="img" aria-label={`${w.newGear}: ${name}`} style={{ position: "relative", width: 104 * u, height: 104 * u, borderRadius: 20 * u, background: "#1c2150", border: `5px solid ${K}`, boxShadow: `0 0 26px ${c}aa`, display: "grid", placeItems: "center" }}>
      <div style={{ position: "absolute", inset: 5 * u, border: `${6 * u}px solid ${c}`, borderRadius: 14 * u }} />
      <CareerIcon name={PIECE[slot] ?? "fang"} size={66 * u} color={tier === "common" ? undefined : c} />
      <span style={{ position: "absolute", top: -14 * u, padding: `2px ${8 * u}px`, borderRadius: 12, background: "#ff5c7a", border: `3px solid ${K}`, fontSize: 13 * u, fontWeight: 800, whiteSpace: "nowrap" }}>{w.newGear}</span>
      <span style={{ position: "absolute", bottom: -14 * u, padding: `2px ${10 * u}px`, borderRadius: 12, background: c, border: `3px solid ${K}`, color: K, fontSize: 14 * u, fontWeight: 800, textTransform: "uppercase", whiteSpace: "nowrap" }}>{name}</span>
    </div>
  );
}

/**
 * THE RESULT CARD: what the level gave, as pictures - the stars (hearts left), the
 * gold, a diamond for a boss, any gear found drawn big in its tier's colour. A
 * loss keeps half the gold and says so. Two buttons: the map, or again.
 */
export function ResultCard(props: { view: ResultView; w: SnakeCareerWords; tierColor: (t: string) => string; pieceName: (slot: string, tier: string) => string; onMap: () => void; onRetry: () => void }): ReactElement {
  const [ref, box] = useLayoutBox<HTMLDivElement>();
  const { view, w } = props;
  const u = Math.max(0.55, Math.min(1.25, Math.min(box.w / 520, box.h / 440)));
  const head = view.won ? w.clear.replace("{l}", view.name) : w.lost;
  const btn = (label: string, icon: string, bg: string, primary: boolean, onPress: () => void): ReactElement => (
    <button type="button" onClick={onPress}
      style={{ minHeight: 56 * u + 8, padding: `0 ${20 * u}px`, borderRadius: 22 * u, border: `4px solid ${K}`, boxShadow: `0 5px 0 ${K}`, background: bg, color: primary ? "#fff" : K, display: "inline-flex", alignItems: "center", gap: 10 * u, fontFamily: FONT, fontSize: 22 * u, fontWeight: 800, cursor: "pointer", touchAction: "manipulation" }}>
      <NeonIcon name={icon} size={30 * u} />
      <span>{label}</span>
    </button>
  );
  return (
    <div ref={ref} role="group" aria-label={head} data-career="result"
      style={{ position: "absolute", inset: 0, zIndex: 6, borderRadius: 14, overflow: "hidden", background: "rgba(8,10,26,0.88)", fontFamily: FONT, color: "#fff", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 14 * u, padding: 12 }}>
      {box.w > 0 ? (
        <>
          <div aria-live="polite" style={{ fontSize: 34 * u, fontWeight: 800, textShadow: SHADOW, color: view.won ? "#ffd166" : "#ff8fa3", textAlign: "center" }}>{head}</div>
          <div role="img" aria-label={reasonLine(view, w)} style={{ display: "flex", gap: 8 * u, alignItems: "flex-end" }}>
            {[0, 1, 2].map((i) => (
              <span key={i} style={{ transform: i === 1 ? `translateY(${-10 * u}px)` : undefined }}>
                <NeonIcon name="star" size={(i === 1 ? 64 : 52) * u} color={i < view.stars ? "#ffd166" : "#5b5f77"} />
              </span>
            ))}
          </div>
          <div aria-hidden="true" style={{ fontSize: 15 * u + 2, color: "#d6fff3", marginTop: -6 * u, textAlign: "center" }}>{reasonLine(view, w)}</div>
          <div style={{ display: "flex", gap: 22 * u, alignItems: "center", justifyContent: "center", flexWrap: "wrap" }}>
            <div role="img" aria-label={`+${view.gold} ${w.gold}`} style={{ display: "flex", alignItems: "center", gap: 10 * u, fontSize: 40 * u, fontWeight: 800, direction: "ltr", textShadow: SHADOW }}>
              <NeonIcon name="gold" size={46 * u} />+{view.gold}
            </div>
            {view.diamond > 0 ? (
              <div role="img" aria-label={`+${view.diamond} ${w.diamond}`} style={{ display: "flex", alignItems: "center", gap: 10 * u, fontSize: 40 * u, fontWeight: 800, direction: "ltr", textShadow: SHADOW, filter: "drop-shadow(0 0 12px #7fd4ff)" }}>
                <NeonIcon name="gem" size={44 * u} />+{view.diamond}
              </div>
            ) : null}
            {view.drop ? <GearDrop drop={view.drop} u={u} w={w} tierColor={props.tierColor} pieceName={props.pieceName} /> : null}
          </div>
          <div style={{ display: "flex", gap: 14 * u, marginTop: 8 * u, flexWrap: "wrap", justifyContent: "center" }}>
            {btn(w.map, "map", view.won ? "#c2185b" : "#fff", view.won, props.onMap)}
            {btn(w.retry, "retry", view.won ? "#fff" : "#55efc4", false, props.onRetry)}
          </div>
        </>
      ) : null}
    </div>
  );
}

/**
 * A twist's tip under the goal row, for the first seconds of a level in its world. A picture,
 * never a control. Not at the foot, where the mock had it: the controls line sits there for
 * the same seconds, and the first Hall shot (2026-10-03, 1536x639) drew the two on top of each other.
 */
export function TwistTip({ text }: { text: string }): ReactElement {
  return (
    <div aria-live="polite" data-career="tip" style={{ position: "absolute", left: 0, right: 0, top: "17%", display: "flex", justifyContent: "center", pointerEvents: "none", zIndex: 2 }}>
      <span style={{ padding: "6px 14px", borderRadius: 99, background: "rgba(11,13,31,0.82)", border: "2px solid #2a2f55", color: "#f5f6ff", font: `600 15px ${FONT}`, whiteSpace: "nowrap" }}>{text}</span>
    </div>
  );
}
