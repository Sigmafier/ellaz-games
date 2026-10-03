// TWO SMALL THINGS DRAWN OVER THE ARENA during a run (operator ruling 2026-10-03,
// "Show supers"): the recipe HINT when a weapon is one card from its super, and
// the GOLD slot art for a weapon that already is one. Both are pictures, never
// controls - `pointerEvents: none`, because the arena is steered by a thumb
// that lands anywhere on it.

import type { ReactElement, ReactNode } from "react";
import type { SuperHint } from "./superHint";
import { hintText } from "./superHint";
import { slotStyle } from "./superSlot";

/** The recipe hint pill: "Lv4 + Spread = Storm", the missing half lit in gold. */
export function SuperHintPill(props: { hint: SuperHint; lv: string; partner: string; superName: string; label: string }): ReactElement {
  const { hint } = props;
  const lv = props.lv.replace("{n}", String(hint.lv));
  const lit = (on: boolean, text: string) => <span style={{ color: on ? "#ffd166" : "#fff" }}>{text}</span>;
  return (
    <div style={{ position: "absolute", insetInline: 0, top: "13%", display: "flex", justifyContent: "center", pointerEvents: "none" }}>
      <span
        aria-label={`${props.label}: ${hintText(props.lv, hint.lv, props.partner, props.superName)}`}
        style={{
          padding: "4px 12px",
          borderRadius: "var(--radius-pill)",
          background: "rgba(11, 13, 31, 0.82)",
          border: "2px solid #ffd166",
          color: "#fff",
          fontFamily: "Fredoka, inherit",
          fontSize: 14,
          fontWeight: 800,
          whiteSpace: "nowrap",
        }}
      >
        {lit(hint.missing === "level", lv)} + {lit(hint.missing === "partner", props.partner)} = {props.superName}
      </span>
    </div>
  );
}

/** A HUD slot's drawing: gold behind it, and dark ink on the gold, when the weapon is a super. */
export function slotArt(art: ReactNode, ink: string, isSuper: boolean): ReactElement {
  return (
    <span style={{ ...slotStyle(isSuper), color: isSuper ? "#241c17" : ink }}>
      <span style={{ display: "flex" }}>{art}</span>
    </span>
  );
}
