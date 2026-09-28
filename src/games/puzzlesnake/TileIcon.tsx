// Puzzle Snake - World 2's tiles as small drawings: the gold key, the gold
// padlock, the blue one-way arrow and the portal ring. SVG, never an emoji:
// an emoji is drawn by the player's system font, so the same key is a
// different picture on every phone, and brand output here is SVG only.
// Used on the board's cells and on the level picker's tiles.
import type { Dir } from "./logic";
import type { Trick } from "./levels";
import { INK } from "./ink";

const BLUE = "#74b9ff";
const TURN: Record<Dir, number> = { right: 0, down: 90, left: 180, up: 270 };

export function TileIcon({ trick, dir = "right", size }: { trick: Trick | "lock"; dir?: Dir; size: string | number }) {
  const box = { width: size, height: size, display: "block", overflow: "visible" } as const;
  if (trick === "key") {
    return (
      <svg viewBox="0 0 24 24" style={{ ...box, filter: `drop-shadow(0 0 3px ${INK.gold}99)` }} aria-hidden="true">
        <circle cx="7.5" cy="12" r="4.5" fill="none" stroke={INK.gold} strokeWidth="3" />
        <path d="M12 12h10M18 12v4M21.5 12v3" stroke={INK.gold} strokeWidth="3" strokeLinecap="round" fill="none" />
      </svg>
    );
  }
  if (trick === "lock") {
    return (
      <svg viewBox="0 0 24 24" style={box} aria-hidden="true">
        <path d="M7.5 11V8a4.5 4.5 0 0 1 9 0v3" fill="none" stroke={INK.gold} strokeWidth="2.6" />
        <rect x="4.5" y="11" width="15" height="10.5" rx="2.5" fill={INK.gold} />
        <circle cx="12" cy="16" r="1.8" fill="#5a3b16" />
      </svg>
    );
  }
  if (trick === "oneway") {
    return (
      <svg viewBox="0 0 24 24" style={box} aria-hidden="true">
        <path
          d="M4 12h13M12 6l6 6-6 6"
          transform={`rotate(${TURN[dir]} 12 12)`}
          fill="none"
          stroke={BLUE}
          strokeWidth="3.4"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 24 24" style={box} aria-hidden="true">
      <circle cx="12" cy="12" r="8.5" fill="#6c5ce7" />
      <circle cx="12" cy="12" r="4.5" fill="#fd79a8" />
    </svg>
  );
}
