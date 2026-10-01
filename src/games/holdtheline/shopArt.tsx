// One shop card. The game's own drawing, so `@ui` never learns what a shop is.
//
// EVERY CARD IS A REAL `<button>`, INCLUDING THE ONES YOU CANNOT AFFORD. The
// words on it are an offer, so the thing carrying them is a control - and
// `disabled` is reserved for the genuinely impossible, which "you have not
// earned this yet" is not. An unaffordable card answers the tap with a wiggle,
// which is the caller's job because only the caller knows whether the purchase
// landed. See
// `.claude/rules/a-control-that-carries-an-imperative-must-be-a-control.md`.

import type { ReactElement } from "react";
import type { Locale } from "@i18n/index";
import type { ShopId, ShopLine } from "./types";

/**
 * What each line is for, in one drawing - art rather than text, so it needs no
 * locale. SVG since 2026-10-01 (the approved title-card mock drew a wall and a
 * spark): these were emoji, which render as a different picture on every
 * operating system and cannot take the card's ink.
 */
const LINE_MARK: Record<ShopLine, ReactElement> = {
  gun: (
    <svg viewBox="0 0 24 24" width={26} height={26} aria-hidden="true">
      <path d="M3 8h15l2-2h1v5h-6l-1.5 2.5h-3L9.5 18H6l1.5-5H3z" fill="#fff" />
    </svg>
  ),
  power: (
    <svg viewBox="0 0 24 24" width={26} height={26} aria-hidden="true">
      <path d="M12 2l2.4 7.6L22 12l-7.6 2.4L12 22l-2.4-7.6L2 12l7.6-2.4z" fill="#fff" />
    </svg>
  ),
  guard: (
    <svg viewBox="0 0 24 24" width={26} height={26} aria-hidden="true" fill="none" stroke="#fff" strokeWidth={2} strokeLinecap="round">
      <path d="M3 5h18v14H3zM3 12h18M8 5v7M16 12v7" />
    </svg>
  ),
  lane: (
    <svg viewBox="0 0 24 24" width={26} height={26} aria-hidden="true" fill="none" stroke="#fff" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 20L15 10M8 5c4-2.5 9-1.5 12 2c-4-1-7 0-9.5 2" />
    </svg>
  ),
};

const NAMES: Record<ShopId, Record<string, string>> = {
  pistol: { en: "Pistol", he: "אקדח", es: "Pistola", fr: "Pistolet", sv: "Pistol" },
  repeater: { en: "Repeater", he: "רובה חוזר", es: "Repetidora", fr: "Répéteur", sv: "Repeter" },
  shotgun: { en: "Scattergun", he: "רובה פיזור", es: "Dispersora", fr: "Tromblon", sv: "Hagelbössa" },
  rifle: { en: "Rifle", he: "רובה", es: "Rifle", fr: "Fusil", sv: "Gevär" },
  launcher: { en: "Launcher", he: "משגר", es: "Lanzador", fr: "Lanceur", sv: "Granatkastare" },
  damage: { en: "Damage", he: "נזק", es: "Daño", fr: "Dégâts", sv: "Skada" },
  reload: { en: "Reload", he: "טעינה", es: "Recarga", fr: "Recharge", sv: "Omladdning" },
  magazine: { en: "Magazine", he: "מחסנית", es: "Cargador", fr: "Chargeur", sv: "Magasin" },
  pierce: { en: "Pierce", he: "חדירה", es: "Perforar", fr: "Perforation", sv: "Genomslag" },
  rifleman: { en: "Rifleman", he: "רובאי", es: "Fusilero", fr: "Fusilier", sv: "Skytt" },
  marksman: { en: "Marksman", he: "צלף", es: "Tirador", fr: "Tireur d'élite", sv: "Prickskytt" },
  aa: { en: "Sky guard", he: "נגד מטס", es: "Antiaéreo", fr: "Anti-aérien", sv: "Luftvärn" },
  rocketeer: { en: "Rocketeer", he: "טיל", es: "Cohetero", fr: "Roquettier", sv: "Raketskytt" },
  mine: { en: "Mine", he: "מוקש", es: "Mina", fr: "Mine", sv: "Mina" },
  wire: { en: "Stakes", he: "יתדות", es: "Estacas", fr: "Pieux", sv: "Pålar" },
  repair: { en: "Repair wall", he: "לתקן חומה", es: "Reparar muro", fr: "Réparer le mur", sv: "Laga muren" },
  wall: { en: "Thicker wall", he: "חומה עבה", es: "Muro grueso", fr: "Mur épais", sv: "Tjockare mur" },
};

const nameOf = (id: ShopId, locale: Locale): string =>
  NAMES[id]?.[locale] ?? NAMES[id]?.en ?? id;

export function ShopCard(props: {
  id: ShopId;
  line: ShopLine;
  price: number;
  owned: number;
  cap: number;
  affordable: boolean;
  locale: Locale;
  onBuy: (id: ShopId, el: HTMLButtonElement) => void;
}) {
  const { id, line, price, owned, cap, affordable, locale, onBuy } = props;
  return (
    <button
      type="button"
      onClick={(e) => onBuy(id, e.currentTarget)}
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 5,
        // One fixed size in both states. A card that grew when it became
        // affordable would move every card beside it, which is the resize half
        // of `a-key-a-game-could-use-never-scrolls-the-page.md`. The mock's
        // 108 x 104 (2026-10-01, the title card's shop row).
        width: 108,
        minHeight: 104,
        boxSizing: "border-box",
        padding: "8px 6px",
        borderRadius: 16,
        border: "2px solid #ffffff",
        // The only thing affordability changes is OPACITY, never `disabled`.
        opacity: affordable ? 1 : 0.55,
        background: "rgba(14, 18, 32, 0.92)",
        color: "#ffffff",
        font: "inherit",
        fontFamily: "Fredoka, Heebo, sans-serif",
        cursor: "pointer",
        touchAction: "manipulation",
      }}
    >
      <span aria-hidden="true" style={{ display: "flex", lineHeight: 1 }}>
        {LINE_MARK[line]}
      </span>
      <span style={{ fontSize: 16, fontWeight: 700, textAlign: "center", lineHeight: 1.15 }}>{nameOf(id, locale)}</span>
      <span style={{ fontSize: 15, fontWeight: 600, color: "#c9cde6" }}>
        ${price}
        {cap !== Infinity && cap > 1 ? ` · ${owned}/${cap}` : ""}
      </span>
    </button>
  );
}
