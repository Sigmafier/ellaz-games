// The gear screen (P0 "gear", approved 2026-09-29): the game's character in the
// middle wearing its three slots, the bag of everything found, and five stat
// bars. The character is a PROP - each game passes its own - so the kit never
// knows what a robot or a snake looks like.
//
// Tapping a bag item chooses it (it gets the swap badge) and opens its InfoCard:
// what it adds, the number your slot gives now beside what this piece would give
// (operator ruling 2026-10-02, "was 22, now 40"), and WEAR. Every slot and every
// bag piece also prints its number on its face, so nothing found is a mystery.
// Wearing what is already worn answers with a wiggle. The rules are `equipItem`
// in src/shared/career/gear.ts; this file only draws.

import { useState } from "react";
import type { ReactElement, ReactNode } from "react";
import { DIR } from "@i18n/index";
import type { AppLocale } from "@i18n/index";
import type { BagItemView, GearView, SlotId, SlotView, Tier } from "../../shared/career/gear";
import type { StatId } from "../../shared/career/stats";
import { CareerIcon, iconShapes, INK } from "./icons";
import { InfoCard } from "./InfoCard";
import { Btn3d, Hud, Screen, useBox, useWiggle } from "./parts";
import type { Purse } from "./parts";
import { careerWords } from "./words";
import type { CareerWords } from "./words";
import { P } from "./palette";
import { skinOf, skinWords, type CareerSkin } from "./skin";

export interface StatBar { id: StatId; value: number; max: number }

export interface GearScreenProps {
  locale: AppLocale;
  view: GearView;
  stats: StatBar[];
  purses: Purse[];
  hero: ReactNode;
  onBack: () => void;
  onEquip: (itemKey: string) => void;
  /** the game's slot pictures and words (`skin.ts`); absent draws Neon Survival's */
  skin?: Partial<CareerSkin>;
}

export const TIER_COLOR: Record<Tier, string> = { common: P.steel, rare: P.blue, epic: P.gold };

const num = (n: number): string => (Number.isInteger(n) ? String(n) : n.toFixed(1));
const plus = (n: number): string => `+${num(n)}`;

function SlotTile({ slot, size, w, k }: { slot: SlotView; size: number; w: CareerWords; k: CareerSkin }): ReactElement {
  const tier = slot.tier;
  const c = tier ? TIER_COLOR[tier] : P.glass20;
  const name = w.slot[slot.id];
  return (
    <div role="img" aria-label={tier ? `${name}: ${w.tier[tier]}, ${plus(slot.value)} ${w.stat[slot.stat]}` : name} style={{ position: "relative", display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
      <div aria-hidden="true" style={{ fontSize: size * 0.15, fontWeight: 700, letterSpacing: 1, opacity: 0.85, textTransform: "uppercase" }}>{name}</div>
      <div style={{ width: size, height: size, borderRadius: 22, background: P.navyDeep, border: `5px solid ${INK}`, boxShadow: tier === "epic" ? `0 0 22px ${c}99` : undefined, position: "relative", display: "grid", placeItems: "center" }}>
        <div style={{ position: "absolute", inset: 5, border: `6px solid ${c}`, borderRadius: 16 }} />
        <span style={{ opacity: tier ? 1 : 0.3 }}>
          <svg width={size * 0.8} height={size * 0.8} viewBox="-24 -24 48 48" aria-hidden="true" style={{ overflow: "visible" }}><g transform="translate(0 -3)">{iconShapes(k.slotIcon[slot.id], tier ? k.art[slot.id][tier] : undefined)}</g></svg>
        </span>
        {tier ? <span aria-hidden="true" style={{ position: "absolute", bottom: -44, whiteSpace: "nowrap", fontSize: 16, fontWeight: 700, color: P.sun, direction: "ltr" }}>{plus(slot.value)} <span style={{ color: P.white }}>{w.stat[slot.stat]}</span></span> : null}
        {tier ? <span aria-hidden="true" style={{ position: "absolute", bottom: -15, height: 30, minWidth: 88, padding: "0 8px", borderRadius: 15, background: c, border: `3.5px solid ${INK}`, color: INK, fontSize: 16, fontWeight: 700, display: "grid", placeItems: "center", textTransform: "uppercase" }}>{w.tier[tier]}</span> : null}
      </div>
    </div>
  );
}

function BagButton(props: { item: BagItemView; stat: StatId; size: number; chosen: boolean; wiggling: boolean; w: CareerWords; k: CareerSkin; onPress: () => void }): ReactElement {
  const { item, size } = props;
  const label = `${props.w.slot[item.slot]}, ${props.w.tier[item.tier]}, ${plus(item.value)} ${props.w.stat[props.stat]}${item.worn ? `, ${props.w.worn}` : ""}${item.count > 1 ? ` x${item.count}` : ""}`;
  return (
    <button type="button" aria-label={label} aria-pressed={props.chosen} onClick={props.onPress}
      className={`career-btn${props.wiggling ? " career-wiggle" : ""}`}
      style={{ position: "relative", flex: "none", width: size, height: size, borderRadius: 16, padding: 0, background: props.chosen ? P.navyLit : P.navyDark, border: `5px solid ${TIER_COLOR[item.tier]}`, display: "grid", placeItems: "center" }}>
      <CareerIcon name={props.k.slotIcon[item.slot]} size={size * 0.72} color={props.k.art[item.slot][item.tier]} />
      <span aria-hidden="true" style={{ position: "absolute", top: -14, left: "50%", transform: "translateX(-50%)", padding: "0 6px", borderRadius: 10, background: P.navyDeep, border: `2.5px solid ${TIER_COLOR[item.tier]}`, fontSize: 14, lineHeight: "18px", fontWeight: 700, color: P.sun, direction: "ltr", whiteSpace: "nowrap" }}>{plus(item.value)}</span>
      {props.chosen ? <span aria-hidden="true" style={{ position: "absolute", top: -12, insetInlineEnd: -12, width: 32, height: 32, borderRadius: 16, background: P.white, border: `3px solid ${INK}`, display: "grid", placeItems: "center" }}><CareerIcon name="swap" size={24} /></span> : null}
      {item.worn ? <span aria-hidden="true" style={{ position: "absolute", bottom: -8, insetInlineStart: -8, width: 20, height: 20, borderRadius: 10, background: P.mint, border: `3px solid ${INK}` }} /> : null}
      {item.count > 1 ? <span aria-hidden="true" style={{ position: "absolute", bottom: 2, insetInlineEnd: 6, fontSize: 15, fontWeight: 700, color: P.white, textShadow: `0 2px 0 ${INK}` }}>x{item.count}</span> : null}
    </button>
  );
}

function StatRow({ bar, w, size, k }: { bar: StatBar; w: CareerWords; size: number; k: CareerSkin }): ReactElement {
  const [icon, color] = k.statIcon[bar.id];
  const f = Math.max(0, Math.min(1, bar.max > 0 ? bar.value / bar.max : 0));
  return (
    <div role="img" aria-label={`${w.stat[bar.id]}: ${num(bar.value)}`} style={{ display: "flex", alignItems: "center", gap: size * 0.3 }}>
      <span style={{ width: size, height: size, borderRadius: "50%", background: P.glass7, border: `2px solid ${P.glass20}`, display: "grid", placeItems: "center", flex: "none" }}><CareerIcon name={icon} size={size * 0.85} /></span>
      <span style={{ fontSize: size * 0.65, fontWeight: 700, minWidth: size * 1.6, direction: "ltr" }}>{num(bar.value)}</span>
      <span style={{ flex: 1, height: 18, borderRadius: 9, background: P.glass13, position: "relative" }}>
        <span style={{ position: "absolute", insetBlock: 0, insetInlineStart: 0, width: `${f * 100}%`, borderRadius: 9, background: color, border: `2.5px solid ${INK}` }} />
      </span>
    </div>
  );
}

function HeroRing({ hero, slots, size, pc, w, k }: { hero: ReactNode; slots: SlotView[]; size: number; pc: boolean; w: CareerWords; k: CareerSkin }): ReactElement {
  const tile = pc ? 116 : 84;
  const at = (id: SlotId) => slots.find((s) => s.id === id);
  const place = pc
    ? { weapon: { left: -250, top: -20 }, armor: { left: 250, top: -90 }, ring: { left: 250, top: 110 } }
    : { weapon: { left: -size * 0.34, top: -60 }, armor: { left: size * 0.34, top: -60 }, ring: { left: size * 0.34, top: 100 } };
  // the character is drawn at the approved mock's size: 190 wide on a PC, 120 on a phone
  const heroW = pc ? 190 : 120, heroH = heroW * 1.45;
  const ring = pc ? 200 : 120;
  return (
    <div style={{ position: "relative", width: 0, height: 0 }}>
      <div style={{ position: "absolute", left: -ring, top: -ring, width: ring * 2, height: ring * 2, borderRadius: "50%", background: P.glass4 }} />
      {pc ? (
        <svg aria-hidden="true" width={1} height={1} style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }}>
          {Object.values(place).map((q, i) => <path key={i} d={`M0 0 L${q.left} ${q.top}`} stroke={P.glass20} strokeWidth={4} strokeDasharray="6 8" />)}
        </svg>
      ) : null}
      <div style={{ position: "absolute", left: -heroW * 0.7, top: heroH * 0.42, width: heroW * 1.4, height: heroW * 0.28, borderRadius: "50%", background: P.shade35 }} />
      <div aria-hidden="true" style={{ position: "absolute", left: -heroW / 2, top: -heroH / 2, width: heroW, height: heroH }}>{hero}</div>
      {(["weapon", "armor", "ring"] as const).map((id) => {
        const s = at(id);
        return s ? <div key={id} style={{ position: "absolute", left: place[id].left - tile / 2, top: place[id].top - tile / 2 - 28 }}><SlotTile slot={s} size={tile} w={w} k={k} /></div> : null;
      })}
    </div>
  );
}

export function Gear(props: GearScreenProps): ReactElement {
  const k = skinOf(props.skin);
  const w = skinWords(careerWords(props.locale), k);
  const dir = DIR[props.locale];
  const [boxRef, box] = useBox<HTMLDivElement>();
  const [chosen, setChosen] = useState<string | null>(null);
  const [open, setOpen] = useState<string | null>(null);
  const [wiggling, wiggle] = useWiggle();
  const pc = box.width > box.height;
  const wear = (key: string | null) => {
    const item = props.view.bag.find((b) => b.key === key);
    if (!item || item.worn) { wiggle(key ?? "wear"); return; }
    props.onEquip(item.key);
  };
  const press = (key: string) => { setChosen(key); setOpen(key); };
  const statOf = (slot: SlotId): StatId => props.view.slots.find((s) => s.id === slot)?.stat ?? "damage";
  const bag = props.view.bag.map((item) => (
    <BagButton key={item.key} item={item} stat={statOf(item.slot)} size={pc ? 76 : 62} chosen={item.key === chosen} wiggling={wiggling === item.key} w={w} k={k} onPress={() => press(item.key)} />
  ));
  const card = open ? props.view.bag.find((b) => b.key === open) ?? null : null;
  // en/es/sv write a stat mid-sentence in lower case; Hebrew has no case, so this is a no-op there
  const lower = (word: string): string => word.toLocaleLowerCase(props.locale);
  const stats = props.stats.map((b) => <StatRow key={b.id} bar={b} w={w} size={pc ? 52 : 42} k={k} />);
  return (
    <Screen boxRef={boxRef} background={`radial-gradient(circle at 50% 45%, ${P.navy}, ${P.night})`} dir={dir}>
      {box.width > 0 ? (pc ? (
        <div style={{ position: "absolute", inset: "80px 50px 30px 56px", display: "grid", gridTemplateColumns: "minmax(240px, 330px) 1fr 330px", gap: 24, alignItems: "stretch" }}>
          <div style={{ display: "flex", flexDirection: "column", justifyContent: "space-around" }}>{stats}</div>
          <div style={{ display: "grid", placeItems: "center" }}><HeroRing hero={props.hero} slots={props.view.slots} size={400} pc w={w} k={k} /></div>
          <div style={{ background: P.shade40, border: `3px solid ${P.glass13}`, borderRadius: 26, padding: "20px 22px", display: "flex", flexDirection: "column", alignItems: "center", gap: 18 }}>
            <CareerIcon name="bag" size={44} />
            <div role="group" aria-label={w.bag} style={{ display: "grid", gridTemplateColumns: "repeat(3, 76px)", columnGap: 12, rowGap: 26, overflowY: "auto", padding: "20px 12px 12px", flex: 1, alignContent: "start" }}>{bag}</div>
            <Btn3d label={w.wear} onPress={() => wear(chosen)} wiggling={wiggling === "wear"} style={{ width: 240, height: 68, borderRadius: 22, background: P.mint, display: "flex", gap: 14, alignItems: "center", justifyContent: "center", fontSize: 28, textTransform: "uppercase" }}>
              <CareerIcon name="swap" size={34} />{w.wear}
            </Btn3d>
          </div>
        </div>
      ) : (
        <div style={{ position: "absolute", inset: "64px 0 0", overflowY: "auto" }}>
          <div style={{ height: 360, display: "grid", placeItems: "center" }}><HeroRing hero={props.hero} slots={props.view.slots} size={box.width} pc={false} w={w} k={k} /></div>
          <div role="group" aria-label={w.bag} style={{ margin: "0 12px", padding: "18px 12px", borderRadius: 20, background: P.shade40, border: `2px solid ${P.glass13}`, display: "flex", gap: 11, overflowX: "auto" }}>{bag}</div>
          <div style={{ padding: "18px 28px 24px", display: "flex", flexDirection: "column", gap: 10 }}>{stats}</div>
        </div>
      )) : null}
      <Hud onBack={props.onBack} backLabel={w.back} purses={props.purses} purseLabel={w.gold} rtl={dir === "rtl"} inset={pc ? 24 : 12} />
      {card ? (
        <InfoCard icon={k.slotIcon[card.slot]} iconColor={k.art[card.slot][card.tier]} tone={TIER_COLOR[card.tier]}
          info={{
            name: `${w.slot[card.slot]} (${w.tier[card.tier]})`,
            says: w.gives.replace("{n}", num(card.value)).replace("{stat}", lower(w.stat[statOf(card.slot)])),
            move: { label: w.stat[statOf(card.slot)], from: plus(props.view.slots.find((s) => s.id === card.slot)?.value ?? 0), to: plus(card.value) },
          }}
          backLabel={w.back} onBack={() => setOpen(null)}
          action={{ label: card.worn ? w.worn : w.wear, wiggling: wiggling === card.key, onPress: () => wear(card.key) }} />
      ) : null}
    </Screen>
  );
}
