// Neon Survival's MODE screen: two big picture cards, CAREER and QUICK RUN, over
// the city dimmed to night. It replaces the two small tiles the game opened on
// (the operator's "quickB", 2026-09-29) with the approved mock's cards
// (2026-09-30): the same two choices, each now a picture of what it leads to.
//
// Career goes to today's map and Quick run to today's entrance - unchanged.
// Nothing here is ever `disabled`: two cards and a Back, all real buttons.
// Sizes come from the arena box's LAYOUT size (`useLayoutBox`), never a
// transformed rect.

import type { ReactElement, ReactNode } from "react";
import { dirOf, type AppLocale } from "@i18n/index";
import { nodeStates } from "../../../shared/career/progress";
import type { CareerSave } from "../../../shared/career/save";
import { NEON_CAMPAIGN } from "../worlds";
import type { WorldId } from "../types";
import type { NeonCareerWords } from "../careerWords";
import { K, NeonIcon } from "../careerArt";
import { useLayoutBox } from "../careerScreens";
import { CareerCardArt, NeonDimWorld, QuickCardArt } from "./neonArt";

const FONT = "Fredoka, Heebo, sans-serif";

/**
 * Where the career is up to, for its card: the world of the level you are on,
 * its number, and how many of its levels are cleared. Read through the kit's own
 * `nodeStates`, so "cleared" means what the map means by it - a star recorded
 * past a gap opens nothing. Everything cleared reads as the last world, full.
 */
export function careerCardView(save: CareerSave): { world: WorldId; number: number; done: number; of: number } {
  const states = nodeStates(NEON_CAMPAIGN, save);
  const now = states.find((v) => v.state === "now") ?? states[states.length - 1];
  const inWorld = states.filter((v) => v.node.world === now.node.world);
  return {
    world: now.node.world as WorldId,
    number: now.node.worldIndex + 1,
    done: inWorld.filter((v) => v.state === "done").length,
    of: inWorld.length,
  };
}

/** One card: its picture on top, its name and line under it, and a play disc to say it goes somewhere. */
function ModeCard(props: { label: string; aria: string; bg: string; w: number; h: number; artH: number; art: ReactNode; line: string; stats: ReactNode; big: number; rtl: boolean; onPress: () => void }): ReactElement {
  return (
    <button
      type="button"
      aria-label={props.aria}
      onClick={props.onPress}
      style={{
        width: props.w,
        height: props.h,
        flex: "none",
        padding: 0,
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
        borderRadius: 22,
        border: `4px solid ${K}`,
        boxShadow: `0 7px 0 ${K}`,
        background: props.bg,
        color: "#fff",
        font: "inherit",
        fontFamily: FONT,
        textAlign: "start",
        cursor: "pointer",
        touchAction: "manipulation",
      }}
    >
      <span style={{ display: "block", flex: "none", height: props.artH, borderBottom: `4px solid ${K}`, overflow: "hidden" }}>{props.art}</span>
      <span style={{ flex: 1, minHeight: 0, display: "flex", alignItems: "center", gap: 12, padding: "0 14px 0 16px" }}>
        <span style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: 4 }}>
          <span style={{ fontSize: props.big, fontWeight: 700, letterSpacing: "0.03em", lineHeight: 1, textShadow: `0 3px 0 ${K}`, textTransform: "uppercase" }}>{props.label}</span>
          <span style={{ fontSize: Math.max(13, props.big * 0.44), fontWeight: 500, opacity: 0.92, lineHeight: 1.2 }}>{props.line}</span>
          <span style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 4, fontSize: Math.max(14, props.big * 0.47), fontWeight: 700 }}>{props.stats}</span>
        </span>
        <span aria-hidden="true" style={{ flex: "none", width: 58, height: 58, borderRadius: "50%", background: "#fff", border: `4px solid ${K}`, boxShadow: `0 4px 0 ${K}`, display: "grid", placeItems: "center" }}>
          <svg width={26} height={26} viewBox="0 0 24 24" style={{ transform: props.rtl ? "scaleX(-1)" : undefined }}>
            <path d="M7 4.5v15l12.5-7.5z" fill={K} stroke={K} strokeWidth={2} strokeLinejoin="round" />
          </svg>
        </span>
      </span>
    </button>
  );
}

const num = (n: number, locale: string) => {
  try {
    return new Intl.NumberFormat(locale).format(n);
  } catch {
    return String(n);
  }
};

export function ModeCards(props: {
  title: string;
  locale: AppLocale;
  w: NeonCareerWords;
  save: CareerSave;
  stars: number;
  gold: number;
  best: number;
  onCareer: () => void;
  onQuick: () => void;
  onBack: () => void;
}): ReactElement {
  const [ref, box] = useLayoutBox<HTMLDivElement>();
  const { w } = props;
  const rtl = dirOf(props.locale) === "rtl";
  const wide = box.w > box.h;
  const top = 72;
  const gap = wide ? 24 : 20;
  const cw = wide ? Math.min(420, (box.w - 28 - gap) / 2) : box.w - 28;
  const ch = wide ? Math.min(box.h - top - 20, cw * 0.98) : Math.min(360, (box.h - top - 14 - gap) / 2);
  const artH = Math.round(ch * (wide ? 0.62 : 0.6));
  const big = Math.max(24, Math.min(34, ch * 0.105, cw * 0.1));
  const icon = Math.max(18, big * 0.6);
  const view = careerCardView(props.save);
  const worldLine = `${w.worldN.replace("{n}", String(view.number))} - ${w.world[view.world]}`;
  return (
    <div
      ref={ref}
      role="group"
      aria-label={props.title}
      style={{
        position: "absolute",
        inset: 0,
        zIndex: 4,
        borderRadius: 14,
        overflow: "hidden",
        background: "#07051a",
        color: "#fff",
        fontFamily: FONT,
      }}
    >
      {box.w > 0 ? (
        <>
          <NeonDimWorld w={box.w} h={box.h} />
          <div style={{ position: "absolute", insetInlineStart: 12, insetInlineEnd: 12, top: 12, height: 48, display: "flex", alignItems: "center", gap: 10 }}>
            <button
              type="button"
              aria-label={w.back}
              onClick={props.onBack}
              style={{ flex: "none", width: 48, height: 48, borderRadius: 12, background: "#fff", border: `3px solid ${K}`, boxShadow: `0 3px 0 ${K}`, display: "grid", placeItems: "center", padding: 0, cursor: "pointer", touchAction: "manipulation" }}
            >
              <svg aria-hidden="true" width={22} height={22} viewBox="0 0 24 24" fill="none" stroke={K} strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" style={{ transform: rtl ? "scaleX(-1)" : undefined }}>
                <path d="M15 5l-7 7 7 7" />
              </svg>
            </button>
            <div style={{ flex: 1, minWidth: 0, fontSize: box.w < 400 ? 21 : 24, fontWeight: 700, letterSpacing: "0.03em", textTransform: "uppercase", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", textShadow: `0 2px 0 ${K}, 0 0 12px #3de8ff` }}>
              {props.title}
            </div>
            <span role="img" aria-label={`${props.gold} ${w.gold}`} style={{ flex: "none", display: "inline-flex", alignItems: "center", gap: 6, height: 36, padding: "0 12px 0 6px", borderRadius: 18, background: "rgba(0,0,0,0.66)", border: "2px solid rgba(255,255,255,0.2)", fontWeight: 700, fontSize: 17, direction: "ltr" }}>
              <NeonIcon name="gold" size={22} />
              {num(props.gold, props.locale)}
            </span>
          </div>
          <div
            style={{
              position: "absolute",
              left: 0,
              right: 0,
              top,
              bottom: 14,
              display: "flex",
              flexDirection: wide ? "row" : "column",
              alignItems: "center",
              justifyContent: wide ? "center" : "flex-start",
              gap,
            }}
          >
            <ModeCard
              label={w.career}
              aria={`${w.career}: ${worldLine}, ${props.stars} ${w.stars}, ${props.gold} ${w.gold}`}
              bg="#c2185b"
              w={cw}
              h={ch}
              artH={artH}
              big={big}
              rtl={rtl}
              art={<CareerCardArt w={cw - 8} h={artH} />}
              line={worldLine}
              stats={
                <>
                  <span aria-hidden="true" style={{ flex: 1, minWidth: 40, height: 12, borderRadius: 6, background: "rgba(0,0,0,0.33)", border: `2px solid ${K}`, overflow: "hidden" }}>
                    <span style={{ display: "block", width: `${Math.round((view.done / view.of) * 100)}%`, height: "100%", background: "#ffd166" }} />
                  </span>
                  <span style={{ display: "inline-flex", alignItems: "center", gap: 4, direction: "ltr" }}><NeonIcon name="star" size={icon} />{props.stars}</span>
                  <span style={{ display: "inline-flex", alignItems: "center", gap: 4, direction: "ltr" }}><NeonIcon name="gold" size={icon} />{num(props.gold, props.locale)}</span>
                </>
              }
              onPress={props.onCareer}
            />
            <ModeCard
              label={w.quick}
              aria={`${w.quick}: ${w.quickLine}, ${w.best} ${props.best}`}
              bg="#1f2a78"
              w={cw}
              h={ch}
              artH={artH}
              big={big}
              rtl={rtl}
              art={<QuickCardArt w={cw - 8} h={artH} />}
              line={w.quickLine}
              stats={
                <>
                  <NeonIcon name="trophy" size={icon * 1.15} />
                  <span>{w.best} <span dir="ltr">{num(props.best, props.locale)}</span></span>
                </>
              }
              onPress={props.onQuick}
            />
          </div>
        </>
      ) : null}
    </div>
  );
}
