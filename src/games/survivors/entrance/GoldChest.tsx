// THE GOLD CHEST - operator ruling 2026-10-02, off the drawn chest pictures
// ("ack B"): a super power no longer simply pops up; a gold chest drops, bursts
// open with light, and THEN the super card is there to take.
//
// It overrides the 2026-09 ruling "a strong monster drops a big gem, not a
// chest" for the SUPER ONLY - elites still drop gems. The chest is presentation:
// nothing in the simulation waits on it, and the super card is the same card,
// taken the same way (SuperCard.tsx).
//
// SHORT AND SKIPPABLE: the whole moment is CHEST_MS, and a tap anywhere opens
// it at once - a reward that holds a child hostage is not a reward. Never
// `disabled`, nothing to read: it carries no words, so it tells nobody to tap.

import { useEffect, useState } from "react";
import type { ReactElement } from "react";
import type { AppLocale } from "@i18n/index";
import type { WeaponId } from "../types";
import { SuperCard } from "./SuperCard";
import { weaponWords } from "./weaponWords";

/** How long the chest shows before the super card replaces it. */
export const CHEST_MS = 1300;

const CSS = `
@keyframes neon-chest-drop{0%{transform:translateY(-140px) scale(.7);opacity:0}55%{transform:translateY(8px) scale(1.04);opacity:1}75%{transform:translateY(-4px)}100%{transform:translateY(0)}}
@keyframes neon-chest-shake{0%,100%{transform:rotate(0)}25%{transform:rotate(-6deg)}75%{transform:rotate(6deg)}}
@keyframes neon-chest-lid{0%{transform:rotate(0)}100%{transform:rotate(-24deg)}}
@keyframes neon-chest-rays{0%{transform:scale(.2) rotate(0);opacity:0}30%{opacity:1}100%{transform:scale(1.25) rotate(40deg);opacity:.85}}
.neon-chest{animation:neon-chest-drop .45s ease-out both, neon-chest-shake .18s ease-in-out .5s 2}
.neon-chest-lid{transform-box:view-box;transform-origin:-62px -6px;animation:neon-chest-lid .3s ease-out .85s both}
.neon-chest-rays{animation:neon-chest-rays .55s ease-out .85s both}
@media (prefers-reduced-motion: reduce){.neon-chest,.neon-chest-lid,.neon-chest-rays{animation:none}}
`;

function Chest(props: { label: string; onOpen: () => void }): ReactElement {
  return (
    <button type="button" aria-label={props.label} onClick={props.onOpen}
      style={{ position: "absolute", inset: 0, zIndex: 6, border: "none", padding: 0, background: "rgba(11, 13, 31, 0.82)", borderRadius: 14, display: "grid", placeItems: "center", cursor: "pointer", touchAction: "manipulation" }}>
      <style>{CSS}</style>
      <svg aria-hidden="true" viewBox="-160 -160 320 300" width="min(78%, 340px)" style={{ overflow: "visible" }}>
        <g className="neon-chest-rays">
          {Array.from({ length: 14 }, (_, i) => {
            const a = (i / 14) * Math.PI * 2;
            return <path key={i} d={`M0 -10 L${Math.cos(a - 0.09) * 170} ${Math.sin(a - 0.09) * 170 - 10} L${Math.cos(a + 0.09) * 170} ${Math.sin(a + 0.09) * 170 - 10} Z`} fill="#ffd166" opacity={0.55} />;
          })}
        </g>
        <g className="neon-chest">
          <ellipse cx="0" cy="62" rx="74" ry="12" fill="#000" opacity="0.35" />
          <rect x="-62" y="-6" width="124" height="60" rx="8" fill="#8e0f45" stroke="#241c17" strokeWidth="5" />
          <rect x="-62" y="10" width="124" height="10" fill="#ffc21a" />
          <rect x="-10" y="4" width="20" height="24" rx="4" fill="#ffc21a" stroke="#241c17" strokeWidth="4" />
          <g className="neon-chest-lid">
            <path d="M-62 -6 Q0 -60 62 -6 Z" fill="#c2185b" stroke="#241c17" strokeWidth="5" />
            <path d="M-8 -30 L8 -30 L8 -6 L-8 -6 Z" fill="#ffc21a" stroke="#241c17" strokeWidth="3" />
          </g>
        </g>
      </svg>
    </button>
  );
}

/** The chest, then the super card - one per super offered (remounted by its `key`). */
export function SuperReveal(props: { id: WeaponId; weaponName: string; locale: AppLocale; onTake: () => void }): ReactElement {
  const [open, setOpen] = useState(false);
  useEffect(() => {
    const t = window.setTimeout(() => setOpen(true), CHEST_MS);
    return () => window.clearTimeout(t);
  }, []);
  if (!open) return <Chest label={weaponWords(props.locale).superPower} onOpen={() => setOpen(true)} />;
  return <SuperCard id={props.id} weaponName={props.weaponName} locale={props.locale} onTake={props.onTake} />;
}
