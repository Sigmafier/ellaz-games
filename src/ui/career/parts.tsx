// The pieces every career screen shares: the box it is laid out in, the top bar
// (back + the game's gold), the chunky 3D button, and the wiggle a refused press
// answers with.
//
// THE BOX IS READ FROM LAYOUT, NEVER FROM getBoundingClientRect(). A game page
// may scale `#game-frame` with a transform (fitStage), and a rendered rect
// carries that transform - so a screen that measured itself that way would be
// laid out at scale² inside a box drawn at scale. clientWidth/clientHeight are
// layout numbers. See .claude/rules/a-canvas-that-measures-its-own-box-cannot-see-a-transform-on-it.md.

import { useEffect, useRef, useState } from "react";
import type { CSSProperties, ReactElement, ReactNode, RefObject } from "react";
import { CareerIcon, INK } from "./icons";
import { P } from "./palette";

export interface BoxSize { width: number; height: number }

/** the element's own layout size, kept current as it resizes; 0x0 until the first measurement */
export function useBox<T extends HTMLElement>(): [RefObject<T>, BoxSize] {
  const ref = useRef<T>(null);
  const [box, setBox] = useState<BoxSize>({ width: 0, height: 0 });
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const read = () => setBox((b) => (b.width === el.clientWidth && b.height === el.clientHeight ? b : { width: el.clientWidth, height: el.clientHeight }));
    read();
    if (typeof ResizeObserver === "undefined") return;
    const ro = new ResizeObserver(read);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  return [ref, box];
}

/**
 * The currencies a screen can show: the game's own GOLD, and since P4 the
 * site-wide DIAMONDS (src/sdk/diamonds.ts, operator ruling G13). Every screen
 * that takes a `Purse` draws either with no other change.
 */
export type Currency = "gold" | "diamond";

/**
 * `label` names the purse for a screen reader; absent, the screen's gold word is used.
 * `href` makes the pill a LINK - the diamond pill opens the site's Career page, the
 * one way in since the operator kept it off the Home header (2026-09-30).
 */
export interface Purse { currency: Currency; amount: number; label?: string; href?: string }

export const CURRENCY_ICON: Record<Currency, string> = { gold: "gold", diamond: "gem" };

/** a press that is refused: the element shakes and nothing else happens (never `disabled`) */
export function useWiggle(): [string | null, (id: string) => void] {
  const [id, setId] = useState<string | null>(null);
  const timer = useRef<number | undefined>(undefined);
  useEffect(() => () => window.clearTimeout(timer.current), []);
  const wiggle = (next: string) => {
    window.clearTimeout(timer.current);
    setId(null);
    // a fresh frame so a second refused press restarts the shake rather than being swallowed
    requestAnimationFrame(() => setId(next));
    timer.current = window.setTimeout(() => setId(null), 450);
  };
  return [id, wiggle];
}

/** the keyframes the wiggle and the pop use; rendered once per screen, never shipped as a stylesheet file */
export const CAREER_CSS = `
@keyframes career-wiggle{0%,100%{transform:translateX(0)}20%{transform:translateX(-7px) rotate(-3deg)}40%{transform:translateX(6px) rotate(3deg)}60%{transform:translateX(-4px)}80%{transform:translateX(3px)}}
.career-wiggle{animation:career-wiggle .42s ease}
@keyframes career-pop{0%{transform:scale(1)}40%{transform:scale(1.12)}100%{transform:scale(1)}}
.career-pop{animation:career-pop .3s ease}
.career-btn{font:inherit;cursor:pointer;-webkit-tap-highlight-color:transparent;touch-action:manipulation}
.career-btn:focus-visible{outline:4px solid ${P.sun};outline-offset:3px}
.career-btn:active{translate:0 3px}
.career-flip:dir(rtl){display:inline-block;transform:scaleX(-1)}
`;

export const DISPLAY_FONT = "var(--font-display, Fredoka), system-ui, sans-serif";

/** the screen's root: fills its box, dark floor, the display face, and the keyframes */
export function Screen({ children, boxRef, background, dir }: { children: ReactNode; boxRef: RefObject<HTMLDivElement>; background: string; dir: "ltr" | "rtl" }): ReactElement {
  return (
    <div ref={boxRef} dir={dir} style={{ position: "relative", width: "100%", height: "100%", overflow: "hidden", background, fontFamily: DISPLAY_FONT, color: P.white, userSelect: "none" }}>
      <style>{CAREER_CSS}</style>
      {children}
    </div>
  );
}

/** the chunky ink-edged button of the approved mock */
export function Btn3d(props: { label: string; onPress: () => void; style: CSSProperties; children: ReactNode; wiggling?: boolean }): ReactElement {
  const base: CSSProperties = {
    border: `4px solid ${INK}`, boxShadow: `0 5px 0 ${INK}`, borderRadius: 20, display: "grid", placeItems: "center",
    color: P.white, fontWeight: 700, padding: 0, fontFamily: DISPLAY_FONT,
  };
  return (
    <button type="button" aria-label={props.label} className={`career-btn${props.wiggling ? " career-wiggle" : ""}`} onClick={props.onPress} style={{ ...base, ...props.style }}>
      {props.children}
    </button>
  );
}

/** a gold (or later, another currency) pill: icon and number */
export function PursePill({ purse, label, compact }: { purse: Purse; label: string; compact?: boolean }): ReactElement {
  const name = `${purse.label ?? label}: ${purse.amount}`;
  const style = { height: 44, borderRadius: 22, padding: compact ? "0 12px 0 6px" : "0 16px 0 8px", display: "flex", alignItems: "center", gap: 8, fontWeight: 700, fontSize: 22, background: P.shade67, border: `2px solid ${P.glass27}`, color: P.white, direction: "ltr", textDecoration: "none" } as const;
  const inner = <><CareerIcon name={CURRENCY_ICON[purse.currency]} size={30} /><span>{purse.amount}</span></>;
  return purse.href ? (
    <a href={purse.href} aria-label={name} style={{ ...style, pointerEvents: "auto" }}>{inner}</a>
  ) : (
    <div role="img" aria-label={name} style={style}>{inner}</div>
  );
}

/** the top bar every career screen carries: BACK on the leading edge, the purses on the trailing one */
export function Hud(props: { onBack: () => void; backLabel: string; purses: Purse[]; purseLabel: string; rtl: boolean; inset: number }): ReactElement {
  return (
    <div style={{ position: "absolute", zIndex: 30, insetInline: props.inset, top: 10, height: 48, display: "flex", alignItems: "center", gap: 10, pointerEvents: "none" }}>
      <div style={{ pointerEvents: "auto" }}>
        <Btn3d label={props.backLabel} onPress={props.onBack} style={{ width: 48, height: 48, borderRadius: 14, background: P.white, boxShadow: `0 4px 0 ${INK}` }}>
          <span style={{ display: "block", transform: props.rtl ? "scaleX(-1)" : undefined }}><CareerIcon name="back" size={30} /></span>
        </Btn3d>
      </div>
      <div style={{ flex: 1 }} />
      {props.purses.map((p) => <PursePill key={p.currency} purse={p} label={props.purseLabel} />)}
    </div>
  );
}

/** a round dock button with its label under it (SHOP, GEAR, STATS) */
export function DockButton(props: { label: string; icon: string; color: string; size: number; onPress: () => void; badge?: boolean }): ReactElement {
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
      <Btn3d label={props.label} onPress={props.onPress} style={{ width: props.size, height: props.size, background: props.color, borderRadius: 22, position: "relative" }}>
        <CareerIcon name={props.icon} size={props.size * 0.58} />
        {props.badge ? <span aria-hidden="true" style={{ position: "absolute", top: -8, insetInlineEnd: -8, width: 18, height: 18, borderRadius: 9, background: P.rose, border: `3px solid ${INK}` }} /> : null}
      </Btn3d>
      <div aria-hidden="true" style={{ fontSize: 14, fontWeight: 700, color: P.white, background: P.inkVeil, borderRadius: 9, padding: "1px 9px", marginTop: 8, letterSpacing: 0.5, textTransform: "uppercase", whiteSpace: "nowrap" }}>{props.label}</div>
    </div>
  );
}
