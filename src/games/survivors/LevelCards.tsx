// THE LEVEL-UP CARDS - operator ruling 2026-10-02, card option B off a drawn
// before/after ("ack B"): three BIG cards side by side, each its picture, its
// name, a row of stars for how far it goes, and one line saying what it does;
// under them how many weapons and powers you hold, and a REROLL.
//
// Moved out of SurvivorsGame.tsx with the redesign. What stayed true from the
// cards it replaces:
//  - a level card never says "1 -> 2" (operator ruling 2026-09-22): its stars
//    count WEAPON_LV_MAX, an upgrade's count its own cap, both read from rules;
//  - a card's border is its weapon's own ink, so the card and the thing it adds
//    to the arena read as one weapon; upgrades keep the shared cyan;
//  - the row is NOT pinned `dir`: in Hebrew it mirrors.
// The SUPER card is not here - it arrives alone, over the whole arena
// (entrance/SuperCard.tsx).
//
// THE REROLL never reaches the simulation: the scene keeps the count and calls
// `offerCards` again (cards.ts `canReroll`). A refused reroll answers with
// nothing worse than staying put - it is drawn only when one is left.

import type { CSSProperties, ReactElement } from "react";
import type { Card } from "./cards";
import type { CardWords } from "./cardWords";
import type { UpgradeId, WeaponId } from "./types";
import { UPGRADE_ART } from "./upgradeArt";
import { UPGRADE_CAP, WEAPON_LV_MAX } from "./upgrades";
import { WEAPON_ART, WEAPON_INK_CSS } from "./weaponArt";

/** The shared ink every power-up card wears - the cyan measured at 15.33:1 for white on its fill. */
const UP_INK = "#22e7ff";
const FONT = "Fredoka, inherit";

export interface LevelCardsProps {
  offer: Card[];
  /** Weapon names and their one-line hint, per weapon. */
  names: Record<WeaponId, readonly [string, string]>;
  /** Power-up names. */
  ups: Record<UpgradeId, string>;
  words: CardWords;
  newWord: string;
  /** How many of each power-up the run already holds. */
  taken: Record<UpgradeId, number>;
  weapons: { held: number; of: number };
  powers: { held: number; of: number };
  rerolls: number;
  onChoose: (card: Card) => void;
  onReroll: () => void;
}

const fill = (pattern: string, n: number, of?: number): string => pattern.replace("{n}", String(n)).replace("{of}", String(of ?? ""));

/** A row of stars, `on` of them lit, `of` in all - the card's "how far it goes". */
function Stars({ on, of, ink }: { on: number; of: number; ink: string }): ReactElement {
  return (
    <span aria-hidden="true" style={{ display: "flex", gap: of > 6 ? 0 : 1, justifyContent: "center", whiteSpace: "nowrap", fontSize: of > 6 ? 10 : 15, lineHeight: 1 }}>
      {Array.from({ length: of }, (_, i) => (
        <span key={i} style={{ color: i < on ? ink : "rgba(255, 255, 255, 0.25)" }}>★</span>
      ))}
    </span>
  );
}

interface Face {
  key: string;
  ink: string;
  art: ReactElement;
  name: string;
  stars: { on: number; of: number };
  says: string;
  tag: string | null;
}

function faceOf(card: Card, p: LevelCardsProps): Face {
  if (card.kind === "weapon") {
    return { key: `weapon-${card.id}`, ink: WEAPON_INK_CSS[card.id], art: WEAPON_ART[card.id](52), name: p.names[card.id][0], stars: { on: 1, of: WEAPON_LV_MAX }, says: p.names[card.id][1], tag: p.newWord };
  }
  if (card.kind === "level") {
    return { key: `level-${card.id}`, ink: WEAPON_INK_CSS[card.id], art: WEAPON_ART[card.id](52), name: p.names[card.id][0], stars: { on: card.to, of: WEAPON_LV_MAX }, says: p.words.level, tag: null };
  }
  if (card.kind === "upgrade") {
    const cap = UPGRADE_CAP[card.id];
    // The stars show what you would HAVE after taking it, like a level card does.
    return {
      key: `upgrade-${card.id}`,
      ink: UP_INK,
      art: <span style={{ display: "inline-flex", transform: "scale(1.85)" }}>{UPGRADE_ART[card.id]()}</span>,
      name: p.ups[card.id],
      stars: { on: Math.min(cap, p.taken[card.id] + 1), of: cap },
      says: p.words.says[card.id],
      tag: null,
    };
  }
  throw new Error("a super card is drawn by SuperCard, never here");
}

function CardButton({ face, onPress }: { face: Face; onPress: () => void }): ReactElement {
  const style: CSSProperties = {
    position: "relative",
    flex: "1 1 0",
    minWidth: 0,
    maxWidth: 200,
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: 6,
    padding: "14px 6px 12px",
    borderRadius: 16,
    border: `3px solid ${face.ink}`,
    background: "linear-gradient(#232a6b, #15183a)",
    color: "#fff",
    font: "inherit",
    fontFamily: FONT,
    cursor: "pointer",
    touchAction: "manipulation",
  };
  return (
    <button type="button" onClick={onPress} aria-label={`${face.name}, ${face.stars.on}/${face.stars.of}. ${face.says}`} style={style}>
      {face.tag ? (
        <span aria-hidden="true" style={{ position: "absolute", top: -11, padding: "2px 8px", borderRadius: 99, background: face.ink, color: "#0b0d1f", fontSize: 11, fontWeight: 800, letterSpacing: "0.04em", whiteSpace: "nowrap" }}>
          {face.tag}
        </span>
      ) : null}
      <span aria-hidden="true" style={{ width: 70, height: 70, borderRadius: "50%", background: "rgba(255, 255, 255, 0.08)", display: "grid", placeItems: "center", color: face.ink }}>
        {face.art}
      </span>
      <span style={{ fontSize: 15, fontWeight: 700, textAlign: "center", lineHeight: 1.15 }}>{face.name}</span>
      <Stars on={face.stars.on} of={face.stars.of} ink={face.ink} />
      <span style={{ fontSize: 12, fontWeight: 500, lineHeight: 1.25, textAlign: "center", opacity: 0.95 }}>{face.says}</span>
    </button>
  );
}

/** The three cards, the counts and the reroll. The heading stays with the overlay in SurvivorsGame.tsx. */
export function LevelCards(p: LevelCardsProps): ReactElement {
  const faces = p.offer.filter((c) => c.kind !== "evolve").map((c) => ({ card: c, face: faceOf(c, p) }));
  return (
    <>
      <div style={{ display: "flex", gap: 8, width: "100%", maxWidth: 640, justifyContent: "center", alignItems: "stretch" }}>
        {faces.map(({ card, face }) => <CardButton key={face.key} face={face} onPress={() => p.onChoose(card)} />)}
      </div>
      <div style={{ fontFamily: FONT, fontSize: 13, color: "#fff", opacity: 0.85, textAlign: "center" }}>
        {fill(p.words.weapons, p.weapons.held, p.weapons.of)} · {fill(p.words.powers, p.powers.held, p.powers.of)}
      </div>
      {p.rerolls > 0 ? (
        <button type="button" onClick={p.onReroll}
          style={{ display: "flex", alignItems: "center", gap: 8, minHeight: 48, padding: "0 20px", borderRadius: 16, border: "3px solid #241c17", boxShadow: "0 4px 0 #241c17", background: "#fff", color: "#241c17", fontFamily: FONT, fontSize: 18, fontWeight: 700, cursor: "pointer", touchAction: "manipulation" }}>
          <span aria-hidden="true">↻</span>
          {p.words.reroll}
          <span style={{ fontSize: 14, opacity: 0.65 }}>{fill(p.words.left, p.rerolls)}</span>
        </button>
      ) : null}
    </>
  );
}
