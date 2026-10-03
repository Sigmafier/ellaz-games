// A HUD SLOT THAT HOLDS A SUPER TURNS GOLD (operator ruling 2026-10-03, "Show
// supers"). The slot box itself belongs to the shared arcade chrome, so the gold
// is painted by the ART the game hands it - a fill under the drawing - and the
// chrome is not touched. Gold plus a light ring, never the colour alone: the
// drawing inside is the evolved weapon's own, and a screen reader hears "super".

/** The super gold - the chest's and the super card's own. */
export const SUPER_GOLD = "#ffd166";

/** The style of the box a slot's drawing sits in: gold for a super, nothing for a plain weapon. */
export function slotStyle(isSuper: boolean): { background?: string; boxShadow?: string; display: string; width: string; height: string; placeItems: string } {
  const base = { display: "grid", width: "100%", height: "100%", placeItems: "center" };
  return isSuper
    ? { ...base, background: `radial-gradient(circle, #fff6d6 0%, ${SUPER_GOLD} 70%)`, boxShadow: `inset 0 0 0 2px #fff, 0 0 10px ${SUPER_GOLD}` }
    : base;
}
