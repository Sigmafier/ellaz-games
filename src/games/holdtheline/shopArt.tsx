// One shop card. The game's own drawing, so `@ui` never learns what a shop is.
//
// EVERY CARD IS A REAL `<button>`, INCLUDING THE ONES YOU CANNOT AFFORD. The
// words on it are an offer, so the thing carrying them is a control - and
// `disabled` is reserved for the genuinely impossible, which "you have not
// earned this yet" is not. An unaffordable card answers the tap with a wiggle,
// which is the caller's job because only the caller knows whether the purchase
// landed. See
// `.claude/rules/a-control-that-carries-an-imperative-must-be-a-control.md`.

import type { Locale } from "@i18n/index";
import type { ShopId, ShopLine } from "./types";

/** What each line is for, in one glyph. Art rather than text, so it needs no locale. */
const LINE_MARK: Record<ShopLine, string> = {
  gun: "🔫",
  power: "✦",
  guard: "🛡",
  lane: "⛏",
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
        gap: 2,
        // One fixed size in both states. A card that grew when it became
        // affordable would move every card beside it, which is the resize half
        // of `a-key-a-game-could-use-never-scrolls-the-page.md`.
        minWidth: 92,
        minHeight: 74,
        padding: "8px 10px",
        borderRadius: 12,
        border: "1px solid var(--on-brand)",
        // The only thing affordability changes is OPACITY, never `disabled`.
        opacity: affordable ? 1 : 0.55,
        background: "rgba(0,0,0,.28)",
        color: "var(--on-brand)",
        font: "inherit",
        cursor: "pointer",
      }}
    >
      <span aria-hidden="true" style={{ fontSize: 16, lineHeight: 1 }}>
        {LINE_MARK[line]}
      </span>
      <span style={{ fontSize: 12, fontWeight: 700, textAlign: "center" }}>{nameOf(id, locale)}</span>
      <span style={{ fontSize: 12, opacity: 0.82 }}>
        ${price}
        {cap !== Infinity && cap > 1 ? ` · ${owned}/${cap}` : ""}
      </span>
    </button>
  );
}
