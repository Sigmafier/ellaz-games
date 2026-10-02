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
// THE SECOND SHELF (P4, the operator's pick B, 2026-09-30). `shelves` is a list and
// each names its currency. GOLD shelves stand behind the machine's glass, exactly as
// before; any other currency - the site's diamonds - is a BLUE shelf of its own
// UNDER the machine, so a gold buy stays where players learned it and a diamond is
// never spent by a tap meant for gold. One tray and one BUY serve both.
//
// A row may carry a `tag`, drawn instead of its price: a look already owned says
// "Wear" and costs nothing, and BUY hands it back to the game like any other row.
//
// WHAT A ROW ADDS (operator ruling 2026-10-02, *"in shop we must know whats each
// item or gear adds"*). A row may also carry `info`: its stat in words, drawn
// under the gain ("+10%" over "Damage"), and a tap that opens the InfoCard - the
// name, one sentence, and the number now beside the number after. The game writes
// the words and the numbers; the kit only draws them.

import { useState } from "react";
import type { CSSProperties, ReactElement, ReactNode } from "react";
import { DIR } from "@i18n/index";
import type { AppLocale } from "@i18n/index";
import type { ShopRowView } from "../../shared/career/shop";
import { CareerIcon, INK } from "./icons";
import { InfoCard } from "./InfoCard";
import type { ItemInfo } from "./InfoCard";
import { Btn3d, CURRENCY_ICON, Hud, Screen, useBox, useWiggle } from "./parts";
import type { Currency, Purse } from "./parts";
import { careerWords } from "./words";
import type { CareerWords } from "./words";
import { P } from "./palette";

/** a shop row, optionally the word drawn instead of its price, and what it adds */
export type ShelfRowView = ShopRowView & { tag?: string; info?: ItemInfo };

export interface Shelf { currency: Currency; rows: ShelfRowView[] }

export interface VendingShopProps {
  locale: AppLocale;
  shelves: Shelf[];
  purses: Purse[];
  /** the game's character, wearing what it wears - drawn beside the machine on a PC */
  hero?: ReactNode;
  onBack: () => void;
  onBuy: (rowId: string) => void;
}

const coinWord = (w: CareerWords, c: Currency): string => (c === "gold" ? w.gold : w.diamonds);
const GLASS = [`radial-gradient(circle at 50% 30%, ${P.navyLit}, ${P.night})`, `radial-gradient(circle at 50% 50%, ${P.teal}, ${P.tealDeep})`];

function PricePill({ cost, currency, afford, word, scale }: { cost: number; currency: Currency; afford: boolean; word: string | null; scale: number }): ReactElement {
  const ink = !afford ? P.berry : currency === "gold" ? INK : P.gemInk;
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 4 * scale, height: 34 * scale, minWidth: 76 * scale, padding: `0 ${10 * scale}px 0 ${6 * scale}px`, borderRadius: 17 * scale, background: P.white, border: `3px solid ${INK}`, color: ink, fontSize: 21 * scale, fontWeight: 700, justifyContent: "center", direction: "ltr" }}>
      {word ? <span style={{ fontSize: 15 * scale, paddingInlineStart: 4 * scale }}>{word}</span> : <><CareerIcon name={CURRENCY_ICON[currency]} size={24 * scale} />{cost}</>}
    </span>
  );
}

function Tile(props: { row: ShelfRowView; currency: Currency; chosen: boolean; wiggling: boolean; scale: number; w: CareerWords; onPress: () => void }): ReactElement {
  const { row, scale } = props;
  const ring = 0.26 * 150 * scale;
  const word = row.tag ?? (row.maxed ? props.w.soldOut : null);
  const gem = props.currency !== "gold";
  const stat = row.info?.stat;
  const label = `${row.gain}${stat ? ` ${stat}` : ""}, ${word ?? `${row.cost} ${coinWord(props.w, props.currency)}`}`;
  return (
    <button type="button" aria-label={label} aria-pressed={props.chosen} onClick={props.onPress}
      className={`career-btn${props.wiggling ? " career-wiggle" : ""}`}
      style={{ background: "transparent", border: 0, padding: `${6 * scale}px 0`, color: P.white, display: "flex", flexDirection: "column", alignItems: "center", gap: 6 * scale, minWidth: 0 }}>
      <span style={{ position: "relative", width: ring * 2, height: ring * 2, borderRadius: "50%", display: "grid", placeItems: "center", background: props.chosen ? P.sunGlow : P.glass8, border: `${props.chosen ? 4 : 2}px solid ${props.chosen ? P.sun : gem ? P.gemGlow : P.glass20}`, boxShadow: gem ? `0 0 ${14 * scale}px ${P.gemGlow}` : undefined }}>
        <CareerIcon name={row.icon} size={ring * 1.35} />
        {row.info ? <span aria-hidden="true" style={{ position: "absolute", top: -4 * scale, insetInlineEnd: -6 * scale, width: 24 * scale, height: 24 * scale, borderRadius: "50%", background: P.white, border: `2.5px solid ${INK}`, color: INK, fontSize: 16 * scale, fontWeight: 700, fontStyle: "italic", fontFamily: "Georgia, serif", display: "grid", placeItems: "center", lineHeight: 1 }}>i</span> : null}
      </span>
      <span style={{ fontSize: 22 * scale, fontWeight: 700, direction: "ltr", lineHeight: 1 }}>{row.gain}</span>
      {stat ? <span style={{ fontSize: 15 * scale, fontWeight: 700, color: P.sun, marginTop: -4 * scale, lineHeight: 1.1, textAlign: "center", maxWidth: "100%" }}>{stat}</span> : null}
      <PricePill cost={row.cost} currency={props.currency} afford={row.afford} word={word} scale={scale} />
    </button>
  );
}

function Machine(props: { shelves: Shelf[]; cols: number; scale: number; chosen: string | null; wiggling: string | null; w: CareerWords; onTile: (id: string) => void; style: CSSProperties }): ReactElement {
  const s = props.scale;
  return (
    <div style={{ background: `linear-gradient(90deg, ${P.berry}, ${P.berryDeep})`, border: `5px solid ${INK}`, borderRadius: 30, boxShadow: `8px 10px 0 ${P.shade40}`, padding: `${16 * s}px ${22 * s}px ${22 * s}px`, display: "flex", flexDirection: "column", gap: 14 * s, ...props.style }}>
      <div style={{ background: P.sun, border: `4px solid ${INK}`, borderRadius: 14, height: 50 * s, display: "grid", placeItems: "center", color: INK, fontSize: 32 * s, fontWeight: 700, textTransform: "uppercase", marginInline: 2 * s }}>{props.w.shop}</div>
      {props.shelves.filter((shelf) => shelf.currency === "gold").map((shelf, i) => (
        <div key={shelf.currency} style={{ background: GLASS[i % GLASS.length], border: `4px solid ${INK}`, borderRadius: 14, padding: `${10 * s}px ${6 * s}px`, display: "grid", gridTemplateColumns: `repeat(${props.cols}, minmax(0, 1fr))`, rowGap: 8 * s }}>
          {shelf.rows.map((row) => (
            <Tile key={row.id} row={row} currency={shelf.currency} chosen={row.id === props.chosen} wiggling={props.wiggling === row.id} scale={s} w={props.w} onPress={() => props.onTile(row.id)} />
          ))}
        </div>
      ))}
    </div>
  );
}

/** A non-gold shelf: blue, under the machine, its capsules glowing (the pick B mock). */
function SideShelf(props: { shelf: Shelf; scale: number; chosen: string | null; wiggling: string | null; w: CareerWords; onTile: (id: string) => void; style: CSSProperties }): ReactElement {
  const s = props.scale;
  return (
    <div style={{ background: `linear-gradient(160deg, ${P.gemDeep}, ${P.gemLit})`, border: `5px solid ${INK}`, borderRadius: 24, boxShadow: `6px 8px 0 ${P.shade40}`, padding: `${10 * s}px ${8 * s}px`, display: "grid", gridTemplateColumns: `repeat(${Math.max(1, props.shelf.rows.length)}, minmax(0, 1fr))`, ...props.style }}>
      {props.shelf.rows.map((row) => (
        <Tile key={row.id} row={row} currency={props.shelf.currency} chosen={row.id === props.chosen} wiggling={props.wiggling === row.id} scale={s * 0.85} w={props.w} onPress={() => props.onTile(row.id)} />
      ))}
    </div>
  );
}

function Tray(props: { row: ShelfRowView | null; currency: Currency; pc: boolean; wiggling: boolean; popping: boolean; w: CareerWords; onBuy: () => void }): ReactElement {
  const { row, pc } = props;
  const pill = (
    <div className={props.popping ? "career-pop" : undefined} style={{ background: P.night, border: `${pc ? 5 : 4}px solid ${INK}`, borderRadius: pc ? 26 : 18, display: "flex", flexDirection: pc ? "column" : "row", alignItems: "center", justifyContent: "center", gap: pc ? 6 : 14, width: pc ? 330 : undefined, height: pc ? 250 : 86, flex: pc ? undefined : 1, paddingInline: pc ? 0 : 20 }}>
      {pc ? <div style={{ width: 298, height: 30, borderRadius: 10, background: P.ink, marginBottom: 12, display: "grid", placeItems: "center" }}><div style={{ width: 270, height: 6, borderRadius: 3, background: P.slot }} /></div> : null}
      {row ? <span style={{ width: pc ? 124 : 52, height: pc ? 124 : 52, borderRadius: "50%", background: pc ? P.roseGlow : "transparent", display: "grid", placeItems: "center" }}><CareerIcon name={row.icon} size={pc ? 110 : 50} /></span> : null}
      {row ? <span style={{ color: P.aqua, fontSize: pc ? 34 : 30, fontWeight: 700, direction: "ltr" }}>{row.gain}</span> : null}
    </div>
  );
  const buyLabel = row ? `${props.w.buy} ${row.gain}, ${row.tag ?? `${row.cost} ${coinWord(props.w, props.currency)}`}` : props.w.buy;
  const buy = (
    <Btn3d label={buyLabel} onPress={props.onBuy} wiggling={props.wiggling}
      style={{ background: P.aqua, color: INK, width: pc ? 300 : 92, height: pc ? 100 : 92, borderRadius: pc ? 30 : 46, boxShadow: `0 6px 0 ${P.mintDeep}`, display: "flex", alignItems: "center", justifyContent: "center", gap: 18, fontSize: pc ? 40 : 28, textTransform: "uppercase" }}>
      {pc && row && !row.tag ? <CareerIcon name={CURRENCY_ICON[props.currency]} size={36} /> : null}
      <span>{row?.tag ?? props.w.buy}</span>
      {pc && row && !row.tag ? <span style={{ fontSize: 28 }}>{row.cost}</span> : null}
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
  const [open, setOpen] = useState<string | null>(null);
  const pick = rows.find((r) => r.row.id === chosen) ?? null;
  const pc = box.width > box.height;
  const buy = () => {
    if (!pick) return;
    if (!pick.row.tag && (!pick.row.afford || pick.row.maxed)) { wiggle("buy"); return; }
    props.onBuy(pick.row.id);
    setPop((n) => n + 1);
  };
  // a tap chooses the row for the tray AND, when the row says what it adds, opens its card
  const onTile = (id: string) => {
    setChosen(id);
    if (rows.some((r) => r.row.id === id && r.row.info)) setOpen(id);
  };
  const card = open ? rows.find((r) => r.row.id === open) ?? null : null;
  const tray = <Tray key={pop} row={pick?.row ?? null} currency={pick?.currency ?? "gold"} pc={pc} wiggling={wiggling === "buy"} popping={pop > 0} w={w} onBuy={buy} />;
  const machineW = Math.min(620, box.width * 0.42);
  const gold = props.shelves.filter((s) => s.currency === "gold");
  const side = props.shelves.filter((s) => s.currency !== "gold");
  const goldCount = gold.reduce((n, s) => n + s.rows.length, 0);
  // A phone stacks the machine, any second shelf and the tray, and all of it must
  // be on screen: the tray and BUY fell 57px below a 390x844 phone the first time
  // the diamond shelf was added (built page, 2026-09-30). So with a second shelf
  // the scale is bounded by the HEIGHT too - 663px of machine and shelf at scale 1
  // (measured off that render), 125px of tray, BUY and gaps, 76px of inset.
  const phoneScale = Math.min(1, (box.width - 28) / 362, side.length ? (box.height - 76 - 125) / 663 : 1);
  const sides = (scale: number, style: CSSProperties) => side.map((shelf) => <SideShelf key={shelf.currency} shelf={shelf} scale={scale} chosen={chosen} wiggling={wiggling} w={w} onTile={onTile} style={style} />);
  return (
    <Screen boxRef={boxRef} background={`radial-gradient(circle at 50% 30%, ${P.indigo}, ${P.night})`} dir={dir}>
      {box.width > 0 ? (pc ? (
        <div dir="ltr" style={{ position: "absolute", inset: "72px 0 18px", display: "flex", alignItems: "center", justifyContent: "space-evenly" }}>
          <div style={{ width: (box.width - machineW) / 2, display: "grid", placeItems: "center" }}>
            {props.hero ? <div style={{ width: 340, height: 340, maxWidth: "100%", borderRadius: "50%", background: P.glass5, display: "grid", placeItems: "center" }}><div style={{ width: 200, height: 260 }}>{props.hero}</div></div> : null}
          </div>
          <div style={{ width: machineW, flex: "none", display: "flex", flexDirection: "column", gap: 14 }}>
            <Machine shelves={gold} cols={Math.min(6, Math.max(1, goldCount))} scale={machineW / 620} chosen={chosen} wiggling={wiggling} w={w} onTile={onTile} style={{}} />
            {sides(machineW / 620, { marginInline: 40 })}
          </div>
          <div style={{ width: (box.width - machineW) / 2, display: "grid", placeItems: "center" }}>{tray}</div>
        </div>
      ) : (
        <div dir="ltr" style={{ position: "absolute", inset: "64px 14px 12px", display: "flex", flexDirection: "column", gap: 12, overflowY: "auto" }}>
          <Machine shelves={gold} cols={3} scale={phoneScale} chosen={chosen} wiggling={wiggling} w={w} onTile={onTile} style={{ flex: "none" }} />
          {sides(phoneScale, { flex: "none" })}
          {tray}
        </div>
      )) : null}
      <Hud onBack={props.onBack} backLabel={w.back} purses={props.purses} purseLabel={w.gold} rtl={dir === "rtl"} inset={pc ? 24 : 12} />
      {card?.row.info ? (
        <InfoCard icon={card.row.icon} tone={card.currency === "gold" ? P.sun : P.gemGlow} info={card.row.info} backLabel={w.back} onBack={() => setOpen(null)}
          action={{
            label: card.row.tag ?? (card.row.maxed ? w.soldOut : w.buy),
            cost: card.row.tag || card.row.maxed ? undefined : { currency: card.currency, amount: card.row.cost },
            wiggling: wiggling === "buy",
            onPress: buy,
          }} />
      ) : null}
    </Screen>
  );
}
