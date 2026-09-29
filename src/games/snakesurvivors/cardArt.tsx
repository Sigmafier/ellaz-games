// A small drawing for each card, so a card is a picture first and words second -
// a child who cannot read "Shockwave" can still see rings. Round four's seven
// each get a picture of their own, never an old one resized.
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
  // Spit: the snake's head, and a gold shot leaving its mouth toward a bat.
  spit: () =>
    svg(
      <>
        <circle cx="-9" cy="3" r="8" fill="#55efc4" />
        <circle cx="-6" cy="0" r="2" fill="#fff" />
        <path d="M0 1 H8" stroke="#ffd166" strokeWidth="2" strokeDasharray="2 3" strokeLinecap="round" />
        <circle cx="12" cy="1" r="4" fill="#ffd166" />
        <path d="M6 -13 Q10 -18 13 -13 Q16 -18 19 -13 Q14 -10 13 -8 Q11 -10 6 -13 Z" fill="#6c5ce7" />
      </>,
    ),
  // Lasso: a loop that is not closed yet, and the dashed line that snaps it shut.
  lasso: () =>
    svg(
      <>
        <path d="M6 -12 A13 13 0 1 0 12 6" fill="none" stroke="#55efc4" strokeWidth="4" strokeLinecap="round" />
        <path d="M12 6 L7 -10" stroke="#55efc4" strokeWidth="2.5" strokeDasharray="3 3" strokeLinecap="round" />
        <circle cx="6" cy="-12" r="4" fill="none" stroke="#fff" strokeWidth="2" />
      </>,
    ),
  // Shield: a blue ring round the snake's head.
  shield: () =>
    svg(
      <>
        <circle r="15" fill="none" stroke="#74b9ff" strokeWidth="3" />
        <circle r="15" fill="#74b9ff" fillOpacity="0.18" />
        <circle r="8" fill="#55efc4" />
        <circle cx="3" cy="-2" r="2" fill="#fff" />
      </>,
    ),
  // Chain Crush: a closed loop, and a bolt forking out of it to two bats.
  chain: () =>
    svg(
      <>
        <circle cx="-9" cy="4" r="8" fill="none" stroke="#55efc4" strokeWidth="3.5" />
        <path d="M-2 1 L4 -2 L2 3 L9 -1" fill="none" stroke="#8fd3ff" strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" />
        <path d="M4 -2 L8 -10 L7 -5 L13 -12" fill="none" stroke="#8fd3ff" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
        <circle cx="13" cy="-12" r="3.5" fill="#9b7bff" />
        <circle cx="12" cy="2" r="3.5" fill="#9b7bff" />
      </>,
    ),
  // Double Gems: two gems, blue over red, and a gold glint.
  doubleGems: () =>
    svg(
      <>
        <polygon points="4,-13 13,-2 4,9 -5,-2" fill="#ff7675" />
        <polygon points="-5,-7 4,4 -5,15 -14,4" fill="#74b9ff" />
        <circle cx="-8" cy="1" r="2.2" fill="#dff1ff" />
        <path d="M12 -14 V-8 M9 -11 H15" stroke="#ffd166" strokeWidth="2" strokeLinecap="round" />
      </>,
    ),
  // Frost Trail: an ice flake over the snake's violet tail.
  frost: () =>
    svg(
      <>
        <path d="M-16 12 Q-6 4 4 12" fill="none" stroke="#6c5ce7" strokeWidth="6" strokeLinecap="round" />
        {[0, 60, 120].map((a) => (
          <g key={a} transform={`rotate(${a} 3 -5)`}>
            <path d="M3 -16 V6 M0 -13 L3 -10 L6 -13 M0 3 L3 0 L6 3" fill="none" stroke="#a8e6ff" strokeWidth="2" strokeLinecap="round" />
          </g>
        ))}
      </>,
    ),
  // Long Body: a snake stretched right across the card, and an arrow off its tail.
  longBody: () =>
    svg(
      <>
        <path d="M-17 8 C-12 -2 -6 -2 -2 6 C2 14 8 14 12 4" fill="none" stroke="#62c1d9" strokeWidth="5" strokeLinecap="round" />
        <circle cx="13" cy="2" r="5" fill="#55efc4" />
        <circle cx="15" cy="0.5" r="1.5" fill="#fff" />
        <path d="M-12 -10 H6 M1 -14 L6 -10 L1 -6" fill="none" stroke="#ffd166" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      </>,
    ),
  // Twin Head: one body, a head at each end.
  twinHead: () =>
    svg(
      <>
        <path d="M-11 8 C-11 -8 11 -8 11 8" fill="none" stroke="#67aae2" strokeWidth="5" strokeLinecap="round" />
        <circle cx="-11" cy="10" r="6" fill="#55efc4" />
        <circle cx="11" cy="10" r="6" fill="#6c5ce7" />
        <circle cx="-13" cy="9" r="1.6" fill="#fff" />
        <circle cx="-9" cy="9" r="1.6" fill="#fff" />
        <circle cx="9" cy="9" r="1.6" fill="#fff" />
        <circle cx="13" cy="9" r="1.6" fill="#fff" />
      </>,
    ),
  // Black Hole: a dark core and violet arms spiralling into it.
  blackHole: () =>
    svg(
      <>
        <circle r="15" fill="#1a1040" />
        <path d="M0 -14 C10 -14 14 -4 8 2 C4 6 -2 4 -2 0" fill="none" stroke="#9b7bff" strokeWidth="2.5" strokeLinecap="round" />
        <path d="M0 14 C-10 14 -14 4 -8 -2 C-4 -6 2 -4 2 0" fill="none" stroke="#d6c8ff" strokeWidth="2.5" strokeLinecap="round" />
        <circle r="3.5" fill="#0b0e22" stroke="#9b7bff" strokeWidth="1.5" />
      </>,
    ),
  // Nova: a gold burst with a white heart, rays in every direction.
  nova: () =>
    svg(
      <>
        {Array.from({ length: 8 }, (_, i) => (
          <polygon key={i} points="-2.5,-6 2.5,-6 0,-18" fill="#ffd166" transform={`rotate(${i * 45})`} />
        ))}
        <circle r="8" fill="#ffd166" />
        <circle r="4.5" fill="#fff" />
      </>,
    ),
};
