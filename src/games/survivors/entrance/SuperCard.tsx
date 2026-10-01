// THE SUPER POWER CARD (the approved mock's fourth screen, 2026-09-30): when the
// run offers a weapon's evolution - card kind "evolve", raised by the run's rules
// when a boss or mini-boss falls with the weapon at level 5 and its partner
// upgrade taken - it is drawn as a gold card over the arena rather than as a
// row among the upgrade cards. This is the moment the run was for, and a card
// that looked like the routine picks would read as one.
//
// "SUPER POWER!" on a gold badge, the weapon at level 5 turning into its super,
// the super's name large, one line saying what it does, a little picture of it
// doing it, and ONE button - Take it. The card arrives alone (cards.ts offers an
// evolution by itself), so there is nothing else to choose.
//
// CONTRAST, computed with the WCAG formula on 2026-09-30 (flat fills, so no
// gradient stop is skipped - the card's lightest stop is #3a2f86): Take it's
// ink #241c17 on the gold #ffd166 is 11.62:1; white on the card is 10.88:1 at
// its lightest stop and 16.2:1 at its darkest (#1c1a4a); the gold words are
// 7.54:1 and 11.24:1. Every one clears 4.5.

import type { ReactElement, ReactNode } from "react";
import type { AppLocale } from "@i18n/index";
import { dirOf } from "@i18n/index";
import type { WeaponId } from "../types";
import { WEAPON_LV_MAX } from "../upgrades";
import { WEAPON_ART, WEAPON_INK_CSS } from "../weaponArt";
import { K } from "../careerArt";
import { useLayoutBox } from "../careerScreens";
import { Sprite } from "./sprite";
import { SUPER_ART } from "./superArt";
import { weaponWords } from "./weaponWords";

const FONT = "Fredoka, Heebo, sans-serif";
const GOLD = "#ffd166";
const RIM = "#ffc21a";

/**
 * The super doing its thing, in a strip: the robot, three shapes, and the
 * evolution's own MOTION drawn in the weapon's ink - a beam straight through,
 * a jump from shape to shape, a ring of fire, a wide swing, three drones.
 */
function Demo({ id, w, h }: { id: WeaponId; w: number; h: number }): ReactElement {
  const ink = WEAPON_INK_CSS[id];
  const around = id === "burst" || id === "blades" || id === "drone";
  const rx = around ? w / 2 : w * 0.1;
  const ry = h * 0.52;
  const sh = h * 0.62;
  const shapes: [number, "slime" | "bat" | "crab"][] = around
    ? [[0.14, "slime"], [0.3, "bat"], [0.86, "crab"]]
    : [[0.38, "slime"], [0.62, "bat"], [0.84, "crab"]];
  let fx: ReactNode;
  if (id === "bolt") {
    fx = (
      <>
        <line x1={rx + 14} y1={ry} x2={w - 4} y2={ry} stroke={ink} strokeWidth={8} opacity={0.35} strokeLinecap="round" />
        <line x1={rx + 14} y1={ry} x2={w - 4} y2={ry} stroke="#fff" strokeWidth={3} strokeLinecap="round" />
      </>
    );
  } else if (id === "arc") {
    const pts = [[rx + 14, ry], ...shapes.map(([f]) => [w * f, ry - 4])];
    const d = pts.map((p, i) => (i === 0 ? `M${p[0]} ${p[1]}` : `L${(pts[i - 1][0] + p[0]) / 2} ${ry - h * 0.3} L${p[0]} ${p[1]}`)).join(" ");
    fx = <path d={d} fill="none" stroke={ink} strokeWidth={3} strokeLinejoin="round" />;
  } else if (id === "burst") {
    fx = (
      <>
        <ellipse cx={rx} cy={ry} rx={w * 0.2} ry={h * 0.36} fill="none" stroke="#ff7b00" strokeWidth={4} strokeDasharray="4 5" opacity={0.8} />
        {Array.from({ length: 8 }, (_, i) => {
          const a = (i / 8) * Math.PI * 2;
          return <circle key={i} cx={rx + Math.cos(a) * w * 0.2} cy={ry + Math.sin(a) * h * 0.36} r={4} fill={ink} />;
        })}
      </>
    );
  } else if (id === "blades") {
    fx = (
      <>
        <ellipse cx={rx} cy={ry} rx={w * 0.26} ry={h * 0.4} fill="none" stroke={ink} strokeWidth={1.5} strokeDasharray="3 4" />
        {[0, 120, 240].map((d) => {
          const a = (d * Math.PI) / 180;
          const x = rx + Math.cos(a) * w * 0.26;
          const y = ry + Math.sin(a) * h * 0.4;
          return <path key={d} transform={`translate(${x} ${y}) rotate(${d + 90})`} d="M-9 0 Q0 -10 9 0 Q0 -5 -9 0 Z" fill={ink} />;
        })}
      </>
    );
  } else {
    fx = (
      <>
        {[-1, 0, 1].map((k) => {
          const x = rx + k * w * 0.13;
          const y = ry - h * 0.32 + Math.abs(k) * h * 0.18;
          return (
            <g key={k}>
              <ellipse cx={x} cy={y} rx={9} ry={3.5} fill={ink} />
              <line x1={x} y1={y} x2={k < 0 ? w * 0.3 : k > 0 ? w * 0.86 : w * 0.14} y2={ry} stroke={ink} strokeWidth={2} strokeDasharray="4 4" />
            </g>
          );
        })}
      </>
    );
  }
  return (
    <div aria-hidden="true" style={{ position: "relative", width: w, height: h, borderRadius: 14, border: "2px solid #2f6c8a", background: "#0b0d1f", overflow: "hidden", direction: "ltr" }}>
      {shapes.map(([f, k], i) => (
        <Sprite key={i} f={k} cx={w * f} cy={ry} h={sh} glow={false} op={0.9} />
      ))}
      <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} style={{ position: "absolute", inset: 0, filter: `drop-shadow(0 0 5px ${ink})` }}>
        {fx}
      </svg>
      <Sprite f="robot" cx={rx} cy={ry} h={h * 0.74} glow={false} />
    </div>
  );
}

export function SuperCard(props: { id: WeaponId; weaponName: string; locale: AppLocale; onTake: () => void }): ReactElement {
  const [ref, box] = useLayoutBox<HTMLDivElement>();
  const W = weaponWords(props.locale);
  const rtl = dirOf(props.locale) === "rtl";
  const { id } = props;
  const ink = WEAPON_INK_CSS[id];
  const [name, line] = W.supers[id];
  const wide = box.w > box.h;
  // The mock's card: 306 x 525 in a 358 x 756 phone box, 400 x 440 in an 852 x 479 PC one.
  const cw = wide ? Math.min(420, box.w * 0.5) : Math.min(420, box.w * 0.86);
  const ch = wide ? box.h * 0.9 : Math.min(box.h * 0.72, cw * 1.72);
  const u = Math.min(cw / 306, ch / (wide ? 440 : 525));
  return (
    <div
      ref={ref}
      role="group"
      aria-label={`${W.superPower} ${props.weaponName}: ${name}`}
      style={{
        position: "absolute",
        inset: 0,
        zIndex: 6,
        borderRadius: 14,
        display: "grid",
        placeItems: "center",
        // Gold rays out of the card, over the arena dimmed to night.
        background: "repeating-conic-gradient(from 0deg at 50% 50%, rgba(255, 209, 102, 0.2) 0deg 9deg, rgba(0, 0, 0, 0) 9deg 18deg), rgba(8, 10, 26, 0.74)",
        fontFamily: FONT,
        color: "#fff",
      }}
    >
      {box.w > 0 ? (
        <div
          style={{
            position: "relative",
            width: cw,
            height: ch,
            boxSizing: "border-box",
            borderRadius: 26 * u,
            border: `${6 * u}px solid ${RIM}`,
            boxShadow: `0 0 0 ${4 * u}px ${K}, 0 0 40px ${RIM}aa`,
            background: "radial-gradient(circle at 50% 30%, #3a2f86, #1c1a4a 62%, #141836)",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "space-between",
            padding: `${44 * u}px ${18 * u}px ${20 * u}px`,
            textAlign: "center",
          }}
        >
          <span style={{ position: "absolute", top: -22 * u, left: "50%", transform: "translateX(-50%)", padding: `${4 * u}px ${22 * u}px`, borderRadius: 14 * u, background: GOLD, border: `${4 * u}px solid ${K}`, color: K, fontSize: 22 * u, fontWeight: 700, letterSpacing: "0.06em", whiteSpace: "nowrap", textTransform: "uppercase" }}>
            {W.superPower}
          </span>
          {/* A plain row: the page's own direction already puts the weapon on the
              side the reading starts from, and the arrow is flipped to match. */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 14 * u }}>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4 * u }}>
              <span aria-hidden="true" style={{ display: "flex", color: ink }}>{WEAPON_ART[id](Math.round(48 * u))}</span>
              <b style={{ fontSize: 17 * u }}>{props.weaponName}</b>
              <span aria-hidden="true" style={{ display: "flex", gap: 4 * u }}>
                {Array.from({ length: WEAPON_LV_MAX }, (_, i) => (
                  <i key={i} style={{ display: "block", width: 11 * u, height: 11 * u, borderRadius: 3, border: `2px solid ${K}`, background: ink }} />
                ))}
              </span>
              <b style={{ fontSize: 13 * u, color: GOLD, letterSpacing: "0.06em", textTransform: "uppercase" }}>{W.level.replace("{n}", String(WEAPON_LV_MAX))}</b>
            </div>
            <svg aria-hidden="true" width={34 * u} height={26 * u} viewBox="0 0 34 26" style={{ transform: rtl ? "scaleX(-1)" : undefined }}>
              <path d="M2 9 H20 V2 L32 13 L20 24 V17 H2 Z" fill={GOLD} stroke={K} strokeWidth={2.5} strokeLinejoin="round" />
            </svg>
            <span aria-hidden="true" style={{ display: "flex", color: ink, filter: `drop-shadow(0 0 10px ${ink}) drop-shadow(0 0 22px ${ink}99)` }}>{SUPER_ART[id](Math.round(120 * u))}</span>
          </div>
          <div style={{ fontSize: Math.min(56 * u, (cw * 0.9) / Math.max(4, name.length * 0.66)), fontWeight: 700, lineHeight: 1, letterSpacing: "0.02em", textTransform: "uppercase", textShadow: `0 3px 0 ${K}, 0 0 16px ${ink}` }}>{name}</div>
          <div style={{ fontSize: 17 * u, lineHeight: 1.3, fontWeight: 500, maxWidth: cw * 0.9 }}>{line}</div>
          <Demo id={id} w={cw - 60 * u} h={Math.round(70 * u)} />
          <button
            type="button"
            onClick={props.onTake}
            style={{ width: cw - 56 * u, minHeight: Math.max(64, 62 * u), borderRadius: 999, border: `4px solid ${K}`, background: GOLD, boxShadow: `0 6px 0 ${K}`, color: K, font: "inherit", fontFamily: FONT, fontSize: 28 * u, fontWeight: 700, letterSpacing: "0.05em", textTransform: "uppercase", cursor: "pointer", touchAction: "manipulation" }}
          >
            {W.takeIt}
          </button>
        </div>
      ) : null}
    </div>
  );
}
