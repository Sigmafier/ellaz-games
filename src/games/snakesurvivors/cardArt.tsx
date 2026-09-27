// A small drawing for each of the six cards, so a card is a picture first and
// words second - a child who cannot read "Shockwave" can still see rings.
import type { ReactNode } from "react";
import type { CardId } from "./types";

const svg = (children: ReactNode) => (
  <svg width="40" height="40" viewBox="-20 -20 40 40" aria-hidden="true">
    {children}
  </svg>
);

export const CARD_ART: Record<CardId, () => ReactNode> = {
  fangs: () =>
    svg(
      <>
        <circle r="13" fill="#55efc4" />
        <polygon points="-7,4 -3,4 -5,15" fill="#ffd166" />
        <polygon points="3,4 7,4 5,15" fill="#ffd166" />
        <circle cx="-5" cy="-4" r="3" fill="#fff" />
        <circle cx="5" cy="-4" r="3" fill="#fff" />
      </>,
    ),
  spikes: () =>
    svg(
      <>
        {[-12, -6, 0, 6, 12].map((x, i) => (
          <g key={x}>
            <polygon points={`${x - 3},4 ${x},-12 ${x + 3},4`} fill="#ffd166" />
            <circle cx={x} cy="6" r="5" fill={["#55efc4", "#5dd8cf", "#62c1d9", "#67aae2", "#6c5ce7"][i]} />
          </g>
        ))}
      </>,
    ),
  magnet: () =>
    svg(
      <>
        <path d="M-11 -2 A11 11 0 0 0 11 -2" fill="none" stroke="#ff7675" strokeWidth="7" />
        <rect x="-15" y="-9" width="8" height="7" fill="#dfe6ff" />
        <rect x="7" y="-9" width="8" height="7" fill="#dfe6ff" />
        <rect x="-3" y="-17" width="6" height="6" transform="rotate(45 0 -14)" fill="#74b9ff" />
      </>,
    ),
  swift: () =>
    svg(
      <>
        <path d="M-14 -6 H2 M-16 1 H0 M-12 8 H4" stroke="#74b9ff" strokeWidth="3" strokeLinecap="round" />
        <circle cx="9" cy="1" r="8" fill="#55efc4" />
        <circle cx="12" cy="-1" r="2" fill="#fff" />
      </>,
    ),
  regrow: () =>
    svg(
      <>
        <path d="M0 14 V-2" stroke="#55efc4" strokeWidth="4" strokeLinecap="round" />
        <path d="M0 2 C-12 0 -13 -10 -4 -12 C-3 -6 -2 -2 0 2 Z" fill="#55efc4" />
        <path d="M0 -3 C10 -5 12 -14 4 -16 C3 -10 2 -6 0 -3 Z" fill="#6c5ce7" />
      </>,
    ),
  shockwave: () =>
    svg(
      <>
        {[5, 10, 15].map((r, i) => (
          <circle key={r} r={r} fill="none" stroke="#55efc4" strokeOpacity={1 - i * 0.3} strokeWidth="3" />
        ))}
      </>,
    ),
};
