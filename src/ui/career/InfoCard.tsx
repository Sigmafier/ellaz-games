// The INFO CARD: what a thing in the shop or the bag actually does, before you
// spend on it or wear it. Operator ruling 2026-10-02 - *"in shop we must know
// whats each item or gear adds"* - picked off a drawn before/after: the stat in
// words on every tile, and a tap that opens this card.
//
// One card for both screens, so a shop row and a gear piece explain themselves
// the same way: its picture, its name, one plain sentence, and the number it
// moves - what you have now beside what you would have after. The action is the
// screen's own (BUY on the shop, WEAR on the gear), so pressing it here is the
// same press as pressing it on the screen; a refused one wiggles, never
// `disabled`.
//
// It is a dialog over its screen, not a hover: a tooltip needs a mouse, and the
// players this is for are on a phone.

import { useEffect, useRef } from "react";
import type { ReactElement } from "react";
import { CareerIcon, INK } from "./icons";
import { Btn3d, CURRENCY_ICON } from "./parts";
import type { Currency } from "./parts";
import { P } from "./palette";

/** What a shop row or a gear piece says about itself. Every string is already in the player's language. */
export interface ItemInfo {
  /** the card's title: "Power", "Epic weapon" */
  name: string;
  /** one plain sentence: what it does */
  says: string;
  /** the short word drawn under a tile's gain ("Damage"); absent draws nothing */
  stat?: string;
  /** the number it moves, already written as drawn: label, now, after */
  move?: { label: string; from: string; to: string };
}

export interface InfoCardProps {
  icon: string;
  /** the picture's tint, for a tiered gear piece */
  iconColor?: string;
  /** the ring colour: a gear tier's, or the shop's sun */
  tone: string;
  info: ItemInfo;
  /** BUY with its price, WEAR, "Sold out" - the screen's own action */
  action: { label: string; cost?: { currency: Currency; amount: number }; wiggling: boolean; onPress: () => void };
  backLabel: string;
  onBack: () => void;
}

export function InfoCard(props: InfoCardProps): ReactElement {
  const { info, action } = props;
  const back = useRef<HTMLButtonElement>(null);
  // Escape closes, as every dialog on the site does; focus lands on BACK so a
  // keyboard player is inside the card the moment it opens.
  useEffect(() => {
    back.current?.focus();
    const key = (e: KeyboardEvent) => { if (e.key === "Escape") props.onBack(); };
    window.addEventListener("keydown", key);
    return () => window.removeEventListener("keydown", key);
  }, [props.onBack]);
  const actionLabel = action.cost ? `${action.label}, ${action.cost.amount}` : action.label;
  return (
    <div role="dialog" aria-modal="true" aria-label={info.name}
      onClick={(e) => { if (e.target === e.currentTarget) props.onBack(); }}
      style={{ position: "absolute", inset: 0, zIndex: 40, background: P.nightVeil, display: "grid", placeItems: "center", padding: 16 }}>
      <div style={{ width: "min(380px, 100%)", background: P.navyDeep, border: `5px solid ${INK}`, borderRadius: 28, boxShadow: `0 0 0 3px ${props.tone}, 8px 10px 0 ${P.shade40}`, padding: "22px 22px 20px", display: "flex", flexDirection: "column", alignItems: "center", gap: 12, textAlign: "center" }}>
        <span style={{ width: 104, height: 104, borderRadius: "50%", background: P.glass8, border: `4px solid ${props.tone}`, display: "grid", placeItems: "center" }}>
          <CareerIcon name={props.icon} size={74} color={props.iconColor} />
        </span>
        <div style={{ fontSize: 30, fontWeight: 700, color: P.sun }}>{info.name}</div>
        <div style={{ fontSize: 20, lineHeight: 1.3, color: P.white }}>{info.says}</div>
        {info.move ? (
          <div role="img" aria-label={`${info.move.label}: ${info.move.from}, ${info.move.to}`}
            style={{ display: "flex", alignItems: "center", gap: 12, padding: "8px 18px", borderRadius: 18, background: P.glass8, fontSize: 24, fontWeight: 700 }}>
            <span style={{ fontSize: 18, color: P.steel }}>{info.move.label}</span>
            {/* NOW then AFTER in the reading direction: in Hebrew the arrow points left */}
            <span style={{ display: "inline-flex", alignItems: "center", gap: 10 }}>
              <span dir="ltr" style={{ color: P.steel }}>{info.move.from}</span>
              <span aria-hidden="true" className="career-flip" style={{ color: P.sun }}>→</span>
              <span dir="ltr" style={{ color: P.aqua }}>{info.move.to}</span>
            </span>
          </div>
        ) : null}
        <div style={{ display: "flex", gap: 12, marginTop: 6, flexWrap: "wrap", justifyContent: "center" }}>
          <button ref={back} type="button" onClick={props.onBack} className="career-btn"
            style={{ minHeight: 58, padding: "0 22px", borderRadius: 20, border: `4px solid ${INK}`, boxShadow: `0 5px 0 ${INK}`, background: P.white, color: INK, fontSize: 22, fontWeight: 700 }}>
            {props.backLabel}
          </button>
          <Btn3d label={actionLabel} onPress={action.onPress} wiggling={action.wiggling}
            style={{ minHeight: 58, padding: "0 22px", background: P.aqua, color: INK, boxShadow: `0 5px 0 ${P.mintDeep}`, display: "flex", alignItems: "center", gap: 10, fontSize: 24, textTransform: "uppercase" }}>
            <span>{action.label}</span>
            {action.cost ? <><CareerIcon name={CURRENCY_ICON[action.cost.currency]} size={30} /><span dir="ltr">{action.cost.amount}</span></> : null}
          </Btn3d>
        </div>
      </div>
    </div>
  );
}
