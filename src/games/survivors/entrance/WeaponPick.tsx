// THE WEAPON PICK (operator ruling 2026-09-30, "like Survivor.io"; the approved
// mock's third screen): the whole collection of five, each in a rarity frame,
// and the player takes ONE as the run's main weapon. Shown before a Quick run
// (with Calm / Normal / Wild on it) and before every career level (without -
// the career sets its own difficulty).
//
// THE RULES IT SHOWS, and where they live:
//   rarity and locks   weaponPool.ts (RARITY, UNLOCK, weaponsOpen)
//   the perk           a rare main weapon hits 20% harder, an epic one starts at
//                      level 2 - written on the card; the rule is the run's
//   the super power    the weapon at level 5 plus its partner upgrade (evolve.ts
//                      RECIPE) - the strip under the cards names the REAL partner
//
// A LOCKED CARD IS STILL A BUTTON. It shows its art, a padlock and the world
// that opens it, and a press answers with a wiggle - never `disabled`, which
// this platform keeps for the genuinely impossible (CLAUDE.md, What a child
// touches). Every control here is a real <button>.
//
// Sizes come from the arena box's LAYOUT size, never a transformed rect.

import { useEffect, useRef, useState, type ReactElement } from "react";
import type { AppLocale } from "@i18n/index";
import { dirOf } from "@i18n/index";
import { DifficultySelector, type DifficultyOption } from "@ui/DifficultySelector";
import type { LevelKey, UpgradeId, WeaponId } from "../types";
import { POOL } from "../arsenal";
import { RECIPE } from "../evolve";
import { WEAPON_LV_MAX } from "../upgrades";
import { WEAPON_ART, WEAPON_INK_CSS } from "../weaponArt";
import { UPGRADE_ART } from "../upgradeArt";
import { RARITY, asMainWeapon, unlockNumber, type Rarity } from "../weaponPool";
import { K } from "../careerArt";
import { useLayoutBox } from "../careerScreens";
import { NeonDimWorld } from "./neonArt";
import { SUPER_ART } from "./superArt";
import { weaponWords } from "./weaponWords";

const FONT = "Fredoka, Heebo, sans-serif";

/**
 * Each rarity's frame - grey, blue, gold, the mock's three tiers. Also the
 * perk line's colour and the ribbon's fill, so both were measured (WCAG, flat
 * fills, 2026-09-30): the perk on the card's #141836 reads 11.18 / 6.87 /
 * 10.7:1, and the ribbon's ink #241c17 on each fill 10.83 / 6.65 / 10.36:1.
 */
export const RARITY_INK: Record<Rarity, string> = { common: "#c9d1d6", rare: "#4aa8ff", epic: "#ffc21a" };

/** The wiggle a locked card answers with. Rendered with the screen, never shipped as a stylesheet. */
const WIGGLE_CSS =
  "@keyframes neon-wiggle{0%,100%{transform:translateX(0)}20%{transform:translateX(-7px) rotate(-3deg)}40%{transform:translateX(6px) rotate(3deg)}60%{transform:translateX(-4px)}80%{transform:translateX(3px)}}.neon-wiggle{animation:neon-wiggle .42s ease}";

/** The padlock on a locked card. */
const LOCK = (size: number) => (
  <svg aria-hidden="true" width={size} height={size} viewBox="-24 -24 48 48" style={{ display: "block" }}>
    <path d="M-10 -4 V-11 A10 10 0 0 1 10 -11 V-4" fill="none" stroke={K} strokeWidth={9} />
    <path d="M-10 -4 V-11 A10 10 0 0 1 10 -11 V-4" fill="none" stroke="#dfe6e9" strokeWidth={4.5} />
    <rect x={-16} y={-5} width={32} height={26} rx={6} fill="#ffd166" stroke={K} strokeWidth={3.5} />
    <circle cy={5} r={4} fill={K} />
    <rect x={-1.8} y={6} width={3.6} height={8} rx={1.5} fill={K} />
  </svg>
);

/** The tick on the picked card. */
const TICK = (size: number) => (
  <svg aria-hidden="true" width={size} height={size} viewBox="-12 -12 24 24" style={{ display: "block" }}>
    <circle r={11} fill="#2bb58a" stroke={K} strokeWidth={2.5} />
    <path d="M-5 0 L-1.5 4 L5.5 -4" fill="none" stroke="#fff" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

/** The pick screen's layout, from the box: 3 + 2 cards on a portrait box, 5 in a row on a landscape one. */
export function pickLayout(w: number, h: number, withLevels: boolean): { wide: boolean; cw: number; ch: number; gap: number } {
  const wide = w > h;
  const gap = wide ? 12 : 10;
  if (wide) {
    const cw = Math.min(140, (w - 80 - 4 * gap) / 5);
    const budget = h - 70 - 18 - 64 - 16 - 68 - 16;
    return { wide, gap, cw, ch: Math.max(120, Math.min(cw * 1.35, budget)) };
  }
  const cw = Math.min(112, (w - 24 - 2 * gap) / 3);
  const budget = h - 12 - 48 - 56 - 12 - 16 - 70 - 14 - (withLevels ? 52 : 0) - 16 - 76 - 20;
  return { wide, gap, cw, ch: Math.max(110, Math.min(cw * 1.6, (budget - gap) / 2)) };
}

function WeaponCard(props: {
  id: WeaponId;
  name: string;
  line: string;
  perk: string | null;
  rarityWord: string;
  lockLine: string | null;
  lockedWord: string;
  on: boolean;
  shaking: boolean;
  w: number;
  h: number;
  onPress: () => void;
}): ReactElement {
  const { id, w, h } = props;
  const rar = RARITY[id];
  const frame = RARITY_INK[rar];
  const locked = props.lockLine !== null;
  // Hex, so the alpha suffixes below are legal CSS - `WEAPON_INK_CSS` is in
  // that form for exactly this reason. The picture wears its own weapon's ink,
  // the ink its shots are drawn in, so the colour picked here is the colour a
  // player then sees leaving the robot (operator, 2026-09-22).
  const ink = WEAPON_INK_CSS[id];
  const nameFs = Math.max(15, Math.min(24, w * 0.19));
  const small = Math.max(11, Math.min(15, w * 0.115));
  return (
    <button
      type="button"
      aria-pressed={locked ? undefined : props.on}
      aria-label={locked ? `${props.name}, ${props.rarityWord}, ${props.lockedWord}: ${props.lockLine}` : `${props.name}, ${props.rarityWord}${props.perk ? `, ${props.perk}` : ""}`}
      className={props.shaking ? "neon-wiggle" : undefined}
      onClick={props.onPress}
      style={{
        position: "relative",
        width: w,
        height: h,
        flex: "none",
        padding: `${h * 0.16}px 4px 6px`,
        boxSizing: "border-box",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "flex-start",
        gap: 2,
        borderRadius: 18,
        border: `4px solid ${frame}`,
        background: "#141836",
        boxShadow: props.on ? `0 0 0 3px #ffffff, 0 0 22px ${ink}8c, 0 6px 0 ${K}` : `0 6px 0 ${K}`,
        transform: props.on ? "translateY(-4px)" : undefined,
        color: "#fff",
        font: "inherit",
        fontFamily: FONT,
        textAlign: "center",
        cursor: "pointer",
        touchAction: "manipulation",
      }}
    >
      {/* The rarity as a WORD on the ribbon - the frame's colour is never the only signal. */}
      <span aria-hidden="true" style={{ position: "absolute", insetInlineStart: 0, top: 0, padding: "3px 8px 3px 7px", borderEndEndRadius: 12, background: frame, color: K, fontSize: Math.max(9.5, small * 0.78), fontWeight: 700, letterSpacing: "0.05em" }}>
        {props.rarityWord}
      </span>
      {locked ? (
        <span aria-hidden="true" style={{ position: "absolute", insetInlineEnd: 4, top: 2 }}>{LOCK(Math.max(26, w * 0.28))}</span>
      ) : props.on ? (
        <span aria-hidden="true" style={{ position: "absolute", insetInlineEnd: 5, top: 5 }}>{TICK(Math.max(22, w * 0.22))}</span>
      ) : null}
      <span aria-hidden="true" style={{ display: "flex", color: ink, opacity: locked ? 0.5 : 1, filter: `drop-shadow(0 0 8px ${ink})` }}>
        {WEAPON_ART[id](Math.round(Math.min(w * 0.46, h * 0.3)))}
      </span>
      <span style={{ fontSize: nameFs, fontWeight: 700, lineHeight: 1.1, textShadow: `0 2px 0 ${K}` }}>{props.name}</span>
      <span style={{ fontSize: small, fontWeight: locked ? 700 : 500, lineHeight: 1.15, color: locked ? "#ffd166" : "#e6e9ff" }}>
        {locked ? props.lockLine : props.line}
      </span>
      {props.perk && (
        <span style={{ marginTop: "auto", fontSize: small, fontWeight: 700, lineHeight: 1.1, color: frame }}>{props.perk}</span>
      )}
    </button>
  );
}

export function WeaponPick(props: {
  locale: AppLocale;
  /** The weapon last picked, validated against `open` here before it is shown. */
  weapon: WeaponId;
  /** The weapons this save may pick (weaponPool.ts `weaponsOpen`). */
  open: readonly WeaponId[];
  /** Each weapon's name and one line, the game's own words. */
  names: Record<WeaponId, [string, string]>;
  /** Each upgrade's one line, the game's own words - for the partner in the strip. */
  upgrades: Record<UpgradeId, string>;
  /** Calm / Normal / Wild, on a Quick run only. */
  levels?: { options: readonly DifficultyOption<LevelKey>[]; value: LevelKey; onChange: (k: LevelKey) => void };
  onPick: (id: WeaponId) => void;
  onPlay: (id: WeaponId) => void;
  onBack: () => void;
  backLabel: string;
}): ReactElement {
  const [ref, box] = useLayoutBox<HTMLDivElement>();
  const W = weaponWords(props.locale);
  const rtl = dirOf(props.locale) === "rtl";
  const picked = asMainWeapon(props.weapon, props.open);
  const [shaking, setShaking] = useState<WeaponId | null>(null);
  const timer = useRef<number | undefined>(undefined);
  useEffect(() => () => window.clearTimeout(timer.current), []);
  // A fresh frame, so a second press on a locked card restarts the shake rather than being swallowed.
  const refuse = (id: WeaponId) => {
    window.clearTimeout(timer.current);
    setShaking(null);
    requestAnimationFrame(() => setShaking(id));
    timer.current = window.setTimeout(() => setShaking(null), 450);
  };
  const L = pickLayout(box.w, box.h, !!props.levels);
  const partner = RECIPE[picked];
  const ink = WEAPON_INK_CSS[picked];
  const superName = W.supers[picked][0];

  const card = (id: WeaponId) => {
    const n = unlockNumber(id);
    const locked = !props.open.includes(id);
    const rar = RARITY[id];
    return (
      <WeaponCard
        key={id}
        id={id}
        name={props.names[id][0]}
        line={props.names[id][1]}
        perk={rar === "common" ? null : W.perk[rar]}
        rarityWord={W.rarity[rar]}
        lockLine={locked ? W.lock.replace("{n}", String(n ?? 1)) : null}
        lockedWord={W.locked}
        on={!locked && picked === id}
        shaking={shaking === id}
        w={L.cw}
        h={L.ch}
        onPress={() => (locked ? refuse(id) : props.onPick(id))}
      />
    );
  };

  const header = (
    <div style={{ display: "flex", alignItems: "center", gap: 10, width: "100%", padding: "0 12px", boxSizing: "border-box", minHeight: 48 }}>
      <button
        type="button"
        aria-label={props.backLabel}
        onClick={props.onBack}
        style={{ flex: "none", width: 48, height: 48, borderRadius: 12, background: "#fff", border: `3px solid ${K}`, boxShadow: `0 3px 0 ${K}`, display: "grid", placeItems: "center", padding: 0, cursor: "pointer", touchAction: "manipulation" }}
      >
        <svg aria-hidden="true" width={22} height={22} viewBox="0 0 24 24" fill="none" stroke={K} strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" style={{ transform: rtl ? "scaleX(-1)" : undefined }}>
          <path d="M15 5l-7 7 7 7" />
        </svg>
      </button>
      <div style={{ flex: "none", fontSize: box.w < 400 ? 24 : 26, fontWeight: 700, letterSpacing: "0.03em", whiteSpace: "nowrap", textShadow: `0 2px 0 ${K}, 0 0 12px #3de8ff` }}>{W.pickTitle}</div>
      {L.wide && <div style={{ flex: 1, minWidth: 0, textAlign: "end", fontSize: 14, fontWeight: 500, opacity: 0.95 }}>{W.pickSub}</div>}
    </div>
  );

  // THE STRIP: what the picked weapon becomes, and how - level 5 plus its REAL
  // partner upgrade (evolve.ts RECIPE), then its SUPER POWER by name.
  const strip = (
    <div
      aria-label={`${props.names[picked][0]}: ${W.level.replace("{n}", String(WEAPON_LV_MAX))} + ${props.upgrades[partner]} - ${W.superPower} ${superName}`}
      role="img"
      style={{ display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "center", columnGap: 12, rowGap: 6, padding: "8px 14px", borderRadius: 16, border: "2px solid #ffd16699", background: "rgba(8, 10, 26, 0.72)", maxWidth: L.wide ? Math.min(560, box.w * 0.62) : box.w - 24, boxSizing: "border-box" }}
    >
      <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <span aria-hidden="true" style={{ display: "flex", color: ink }}>{WEAPON_ART[picked](30)}</span>
        <span style={{ display: "flex", flexDirection: "column", gap: 3 }}>
          <b style={{ fontSize: 13, letterSpacing: "0.06em", textTransform: "uppercase" }}>{W.level.replace("{n}", String(WEAPON_LV_MAX))}</b>
          <span aria-hidden="true" style={{ display: "flex", gap: 4 }}>
            {Array.from({ length: WEAPON_LV_MAX }, (_, i) => (
              <i key={i} style={{ display: "block", width: 11, height: 11, borderRadius: 3, border: `2px solid ${K}`, background: ink }} />
            ))}
          </span>
        </span>
        <b aria-hidden="true" style={{ fontSize: 20, color: "#ffd166" }}>+</b>
        <span aria-hidden="true" style={{ display: "flex", transform: "scale(0.8)" }}>{UPGRADE_ART[partner]()}</span>
        <span style={{ fontSize: 13, fontWeight: 600, maxWidth: 120, lineHeight: 1.15 }}>{props.upgrades[partner]}</span>
      </span>
      <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <svg aria-hidden="true" width={14} height={16} viewBox="0 0 14 16" style={{ transform: rtl ? "scaleX(-1)" : undefined }}>
          <path d="M1 1 L13 8 L1 15 Z" fill="#ffd166" />
        </svg>
        <span aria-hidden="true" style={{ display: "flex", color: ink, filter: `drop-shadow(0 0 6px ${ink})` }}>{SUPER_ART[picked](40)}</span>
        <span style={{ display: "flex", flexDirection: "column", lineHeight: 1.05 }}>
          <b style={{ fontSize: 12, color: "#ffd166", letterSpacing: "0.06em", textTransform: "uppercase" }}>{W.superPower}</b>
          <b style={{ fontSize: 21, textTransform: "uppercase", letterSpacing: "0.02em" }}>{superName}</b>
        </span>
      </span>
    </div>
  );

  const play = (
    <button
      type="button"
      onClick={() => props.onPlay(picked)}
      style={{ width: Math.min(300, box.w * 0.72), minHeight: L.wide ? 60 : 72, display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 12, borderRadius: 999, border: `4px solid ${K}`, background: "#c2185b", boxShadow: `0 7px 0 ${K}, 0 0 26px #c2185b88`, color: "#fff", font: "inherit", fontFamily: FONT, fontSize: L.wide ? 24 : 28, fontWeight: 700, letterSpacing: "0.05em", textTransform: "uppercase", cursor: "pointer", touchAction: "manipulation" }}
    >
      <svg aria-hidden="true" width={26} height={26} viewBox="0 0 24 24" style={{ transform: rtl ? "scaleX(-1)" : undefined }}>
        <path d="M7 4.5v15l12.5-7.5z" fill="#fff" stroke="#fff" strokeWidth={2} strokeLinejoin="round" />
      </svg>
      {W.play}
    </button>
  );

  const levels = props.levels ? (
    <DifficultySelector options={props.levels.options} value={props.levels.value} onChange={props.levels.onChange} locale={props.locale} />
  ) : null;

  const [firstRow, secondRow] = L.wide ? [POOL, [] as WeaponId[]] : [POOL.slice(0, 3), POOL.slice(3)];
  return (
    <div
      ref={ref}
      role="group"
      aria-label={W.pickTitle}
      style={{ position: "absolute", inset: 0, zIndex: 4, borderRadius: 14, overflow: "hidden", background: "#07051a", color: "#fff", fontFamily: FONT }}
    >
      <style>{WIGGLE_CSS}</style>
      {box.w > 0 ? (
        <>
          <NeonDimWorld w={box.w} h={box.h} />
          <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "space-evenly", padding: "12px 0 14px", boxSizing: "border-box" }}>
            {header}
            {!L.wide && <div style={{ padding: "0 20px", textAlign: "center", fontSize: 15, fontWeight: 500, lineHeight: 1.3 }}>{W.pickSub}</div>}
            <div role="group" aria-label={W.pickTitle} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: L.gap + 6 }}>
              <div style={{ display: "flex", gap: L.gap }}>{firstRow.map(card)}</div>
              {secondRow.length > 0 && <div style={{ display: "flex", gap: L.gap }}>{secondRow.map(card)}</div>}
            </div>
            {L.wide ? (
              <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 18, flexWrap: "wrap", padding: "0 16px" }}>
                {strip}
                {levels}
              </div>
            ) : (
              <>
                {strip}
                {levels}
              </>
            )}
            {play}
          </div>
        </>
      ) : null}
    </div>
  );
}
