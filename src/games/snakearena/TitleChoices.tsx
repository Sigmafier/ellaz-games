// The title card's other choices (forum review, approved off the mock
// 2026-10-01): your colour, the map, and on a PC how many people play. They go
// in the card's `pick` slot, between the level chips and PLAY, because each one
// changes what PLAY starts - drawn in the card's own chip style, one row each,
// the word for the row in front of it as the level row has it. Every swatch
// and pill is a real button with a name and a pressed state; nothing is
// `disabled`.
import type { CSSProperties, ReactNode } from "react";
import { COLOUR_IDS, hexOf, type ColourId } from "./colours";
import { FONT } from "./ink";
import { ARENA_INKS as INKS } from "./ArenaCards";
import { MAPS, type MapId } from "./setup";
import type { Words } from "./words";

export type TitleChoicesProps = {
  w: Words;
  colour: ColourId;
  onColour: (c: ColourId) => void;
  map: MapId;
  onMap: (m: MapId) => void;
  /** Present on a PC only: a phone has one pair of hands on it. */
  players?: { value: 1 | 2; on: (n: 1 | 2) => void };
};

const edge = (pct: number) => `color-mix(in srgb, ${INKS.light} ${pct}%, transparent)`;

function Row({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div role="group" aria-label={label} style={{ display: "flex", alignItems: "center", justifyContent: "center", flexWrap: "wrap", gap: 6 }}>
      <span style={{ fontSize: 12, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: INKS.light, marginInlineEnd: 4 }}>{label}</span>
      {children}
    </div>
  );
}

function Pill({ on, text, onPress }: { on: boolean; text: string; onPress: () => void }) {
  const style: CSSProperties = {
    minHeight: 38,
    padding: "0 14px",
    borderRadius: 999,
    border: `2px solid ${on ? INKS.selRing : edge(40)}`,
    background: on ? INKS.sel : INKS.chip,
    boxShadow: on ? `0 0 14px ${INKS.selRing}b3` : "none",
    color: on ? INKS.ink : INKS.light,
    font: "inherit",
    fontFamily: FONT,
    fontSize: 16,
    fontWeight: 600,
    whiteSpace: "nowrap",
    cursor: "pointer",
    touchAction: "manipulation",
  };
  return (
    <button type="button" aria-pressed={on} onClick={onPress} style={style}>
      {text}
    </button>
  );
}

export function TitleChoices(p: TitleChoicesProps) {
  const { w } = p;
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8, fontFamily: FONT }}>
      <Row label={w.colour}>
        {COLOUR_IDS.map((id, i) => {
          const on = id === p.colour;
          return (
            <button
              key={id}
              type="button"
              aria-label={w.colours[i]}
              aria-pressed={on}
              onClick={() => p.onColour(id)}
              style={{
                width: 32,
                height: 32,
                padding: 0,
                borderRadius: 10,
                border: `3px solid ${on ? INKS.sel : INKS.ink}`,
                background: hexOf(id),
                boxShadow: on ? `0 0 0 2px ${INKS.selRing}, 0 0 14px ${hexOf(id)}` : "none",
                cursor: "pointer",
                touchAction: "manipulation",
              }}
            />
          );
        })}
      </Row>
      <Row label={w.map}>
        {MAPS.map((m, i) => (
          <Pill key={m} on={m === p.map} text={w.maps[i]} onPress={() => p.onMap(m)} />
        ))}
      </Row>
      {p.players && (
        <Row label={w.players}>
          {([1, 2] as const).map((n) => (
            <Pill key={n} on={n === p.players?.value} text={w.playerCount(n)} onPress={() => p.players?.on(n)} />
          ))}
        </Row>
      )}
    </div>
  );
}
