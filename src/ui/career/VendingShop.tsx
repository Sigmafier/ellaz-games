// The vending-machine shop (the operator's pick A, 2026-09-29): a raspberry
// machine with a SHOP sign, a glass shelf of things for sale, and a tray that
// shows the one you chose beside a big BUY.
//
// Pictures, not sentences: a tile is an icon, the gain it gives ("+20",
// "x1.2") and a price pill. Tapping a tile chooses it; BUY buys it. A price you
// cannot pay is still pressable and answers with a wiggle - never `disabled`.
//
// WHAT IT SPENDS IS NOT ITS CALL. The screen hands `onBuy(id)` back to the game,
// and the game runs `buy()` from src/shared/career/shop.ts, which spends the
// game's own gold and nothing else. This file never touches a wallet.
//
// THE SECOND SHELF. `shelves` is a list, and each shelf names its currency. Today
// the only `Currency` is gold (parts.tsx), so a game can pass exactly one shelf.
// P4 widens `Currency` and passes a second shelf; the machine already stacks
// shelves top to bottom, each in its own glass.

import { useState } from "react";
import type { CSSProperties, ReactElement, ReactNode } from "react";
import { DIR } from "@i18n/index";
import type { AppLocale } from "@i18n/index";
import type { ShopRowView } from "../../shared/career/shop";
import { CareerIcon, INK } from "./icons";
import { Btn3d, Hud, Screen, useBox, useWiggle } from "./parts";
import type { Currency, Purse } from "./parts";
import { careerWords } from "./words";
import type { CareerWords } from "./words";
import { P } from "./palette";

export interface Shelf { currency: Currency; rows: ShopRowView[] }

export interface VendingShopProps {
  locale: AppLocale;
  shelves: Shelf[];
  purses: Purse[];
  /** the game's character, wearing what it wears - drawn beside the machine on a PC */
  hero?: ReactNode;
  onBack: () => void;
  onBuy: (rowId: string) => void;
}

const CURRENCY_ICON: Record<Currency, string> = { gold: "gold" };
const GLASS = [`radial-gradient(circle at 50% 30%, ${P.navyLit}, ${P.night})`, `radial-gradient(circle at 50% 50%, ${P.teal}, ${P.tealDeep})`];

function PricePill({ cost, currency, afford, soldOut, scale }: { cost: number; currency: Currency; afford: boolean; soldOut: string | null; scale: number }): ReactElement {
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 4 * scale, height: 34 * scale, minWidth: 76 * scale, padding: `0 ${10 * scale}px 0 ${6 * scale}px`, borderRadius: 17 * scale, background: P.white, border: `3px solid ${INK}`, color: afford ? INK : P.berry, fontSize: 21 * scale, fontWeight: 700, justifyContent: "center", direction: "ltr" }}>
      {soldOut ? <span style={{ fontSize: 15 * scale }}>{soldOut}</span> : <><CareerIcon name={CURRENCY_ICON[currency]} size={24 * scale} />{cost}</>}
    </span>
  );
}

function Tile(props: { row: ShopRowView; currency: Currency; chosen: boolean; wiggling: boolean; scale: number; w: CareerWords; onPress: () => void }): ReactElement {
  const { row, scale } = props;
  const ring = 0.26 * 150 * scale;
  const label = `${row.gain}, ${row.maxed ? props.w.soldOut : `${row.cost} ${props.w.gold}`}`;
  return (
    <button type="button" aria-label={label} aria-pressed={props.chosen} onClick={props.onPress}
      className={`career-btn${props.wiggling ? " career-wiggle" : ""}`}
      style={{ background: "transparent", border: 0, padding: `${6 * scale}px 0`, color: P.white, display: "flex", flexDirection: "column", alignItems: "center", gap: 6 * scale, minWidth: 0 }}>
      <span style={{ width: ring * 2, height: ring * 2, borderRadius: "50%", display: "grid", placeItems: "center", background: props.chosen ? P.sunGlow : P.glass8, border: `${props.chosen ? 4 : 2}px solid ${props.chosen ? P.sun : P.glass20}` }}>
        <CareerIcon name={row.icon} size={ring * 1.35} />
      </span>
      <span style={{ fontSize: 22 * scale, fontWeight: 700, direction: "ltr" }}>{row.gain}</span>
      <PricePill cost={row.cost} currency={props.currency} afford={row.afford} soldOut={row.maxed ? props.w.soldOut : null} scale={scale} />
    </button>
  );
}

function Machine(props: { shelves: Shelf[]; cols: number; scale: number; chosen: string | null; wiggling: string | null; w: CareerWords; onTile: (id: string) => void; style: CSSProperties }): ReactElement {
  const s = props.scale;
  return (
    <div style={{ background: `linear-gradient(90deg, ${P.berry}, ${P.berryDeep})`, border: `5px solid ${INK}`, borderRadius: 30, boxShadow: `8px 10px 0 ${P.shade40}`, padding: `${16 * s}px ${22 * s}px ${22 * s}px`, display: "flex", flexDirection: "column", gap: 14 * s, ...props.style }}>
      <div style={{ background: P.sun, border: `4px solid ${INK}`, borderRadius: 14, height: 50 * s, display: "grid", placeItems: "center", color: INK, fontSize: 32 * s, fontWeight: 700, textTransform: "uppercase", marginInline: 2 * s }}>{props.w.shop}</div>
      {props.shelves.map((shelf, i) => (
        <div key={shelf.currency} style={{ background: GLASS[i % GLASS.length], border: `4px solid ${INK}`, borderRadius: 14, padding: `${10 * s}px ${6 * s}px`, display: "grid", gridTemplateColumns: `repeat(${props.cols}, minmax(0, 1fr))`, rowGap: 8 * s }}>
          {shelf.rows.map((row) => (
            <Tile key={row.id} row={row} currency={shelf.currency} chosen={row.id === props.chosen} wiggling={props.wiggling === row.id} scale={s} w={props.w} onPress={() => props.onTile(row.id)} />
          ))}
        </div>
      ))}
    </div>
  );
}

function Tray(props: { row: ShopRowView | null; currency: Currency; pc: boolean; wiggling: boolean; popping: boolean; w: CareerWords; onBuy: () => void }): ReactElement {
  const { row, pc } = props;
  const pill = (
    <div className={props.popping ? "career-pop" : undefined} style={{ background: P.night, border: `${pc ? 5 : 4}px solid ${INK}`, borderRadius: pc ? 26 : 18, display: "flex", flexDirection: pc ? "column" : "row", alignItems: "center", justifyContent: "center", gap: pc ? 6 : 14, width: pc ? 330 : undefined, height: pc ? 250 : 86, flex: pc ? undefined : 1, paddingInline: pc ? 0 : 20 }}>
      {pc ? <div style={{ width: 298, height: 30, borderRadius: 10, background: P.ink, marginBottom: 12, display: "grid", placeItems: "center" }}><div style={{ width: 270, height: 6, borderRadius: 3, background: P.slot }} /></div> : null}
      {row ? <span style={{ width: pc ? 124 : 52, height: pc ? 124 : 52, borderRadius: "50%", background: pc ? P.roseGlow : "transparent", display: "grid", placeItems: "center" }}><CareerIcon name={row.icon} size={pc ? 110 : 50} /></span> : null}
      {row ? <span style={{ color: P.aqua, fontSize: pc ? 34 : 30, fontWeight: 700, direction: "ltr" }}>{row.gain}</span> : null}
    </div>
  );
  const buyLabel = row ? `${props.w.buy} ${row.gain}, ${row.cost} ${props.w.gold}` : props.w.buy;
  const buy = (
    <Btn3d label={buyLabel} onPress={props.onBuy} wiggling={props.wiggling}
      style={{ background: P.aqua, color: INK, width: pc ? 300 : 92, height: pc ? 100 : 92, borderRadius: pc ? 30 : 46, boxShadow: `0 6px 0 ${P.mintDeep}`, display: "flex", alignItems: "center", justifyContent: "center", gap: 18, fontSize: pc ? 40 : 28, textTransform: "uppercase" }}>
      {pc && row ? <CareerIcon name={CURRENCY_ICON[props.currency]} size={36} /> : null}
      <span>{props.w.buy}</span>
      {pc && row ? <span style={{ fontSize: 28 }}>{row.cost}</span> : null}
    </Btn3d>
  );
  return <div style={{ display: "flex", flexDirection: pc ? "column" : "row", alignItems: "center", gap: pc ? 34 : 12 }}>{pill}{buy}</div>;
}

export function VendingShop(props: VendingShopProps): ReactElement {
  const w = careerWords(props.locale);
  const dir = DIR[props.locale];
  const [boxRef, box] = useBox<HTMLDivElement>();
  const rows = props.shelves.flatMap((s) => s.rows.map((row) => ({ row, currency: s.currency })));
  const [chosen, setChosen] = useState<string | null>(rows[0]?.row.id ?? null);
  const [wiggling, wiggle] = useWiggle();
  const [pop, setPop] = useState(0);
  const pick = rows.find((r) => r.row.id === chosen) ?? null;
  const pc = box.width > box.height;
  const buy = () => {
    if (!pick) return;
    if (!pick.row.afford || pick.row.maxed) { wiggle("buy"); return; }
    props.onBuy(pick.row.id);
    setPop((n) => n + 1);
  };
  const tray = <Tray key={pop} row={pick?.row ?? null} currency={pick?.currency ?? "gold"} pc={pc} wiggling={wiggling === "buy"} popping={pop > 0} w={w} onBuy={buy} />;
  const machineW = Math.min(620, box.width * 0.42);
  return (
    <Screen boxRef={boxRef} background={`radial-gradient(circle at 50% 30%, ${P.indigo}, ${P.night})`} dir={dir}>
      {box.width > 0 ? (pc ? (
        <div dir="ltr" style={{ position: "absolute", inset: "72px 0 18px", display: "flex", alignItems: "center", justifyContent: "space-evenly" }}>
          <div style={{ width: (box.width - machineW) / 2, display: "grid", placeItems: "center" }}>
            {props.hero ? <div style={{ width: 340, height: 340, maxWidth: "100%", borderRadius: "50%", background: P.glass5, display: "grid", placeItems: "center" }}><div style={{ width: 200, height: 260 }}>{props.hero}</div></div> : null}
          </div>
          <Machine shelves={props.shelves} cols={Math.min(6, Math.max(1, rows.length))} scale={machineW / 620} chosen={chosen} wiggling={wiggling} w={w} onTile={setChosen} style={{ width: machineW, flex: "none" }} />
          <div style={{ width: (box.width - machineW) / 2, display: "grid", placeItems: "center" }}>{tray}</div>
        </div>
      ) : (
        <div dir="ltr" style={{ position: "absolute", inset: "64px 14px 12px", display: "flex", flexDirection: "column", gap: 12, overflowY: "auto" }}>
          <Machine shelves={props.shelves} cols={3} scale={Math.min(1, (box.width - 28) / 362)} chosen={chosen} wiggling={wiggling} w={w} onTile={setChosen} style={{ flex: "none" }} />
          {tray}
        </div>
      )) : null}
      <Hud onBack={props.onBack} backLabel={w.back} purses={props.purses} purseLabel={w.gold} rtl={dir === "rtl"} inset={pc ? 24 : 12} />
    </Screen>
  );
}
