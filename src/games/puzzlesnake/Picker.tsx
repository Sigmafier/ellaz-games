// Puzzle Snake - the level picker: two worlds, six tiles each, with the stars
// earned on every tile.
//
// A level that is not open yet is still a BUTTON and still pressable: it
// answers with a wiggle and says why in its name. Never `disabled` - that is
// reserved in this repo for the genuinely impossible, and "you have not earned
// this yet" is not impossible, it is later (CLAUDE.md, What a child touches).
import type { CSSProperties } from "react";
import { LEVELS, tricksIn, type World } from "./levels";
import { isOpen, type StarMap } from "./progress";
import { FONT, INK } from "./ink";
import { TileIcon } from "./TileIcon";
import { fill, type Words } from "./words";

export function Picker(props: {
  stars: StarMap;
  current: string;
  T: Words;
  onPick: (id: string, el: HTMLElement) => void;
  onBack: () => void;
  /** A PC lays each world out as one row of six, so both fit a 639px window unscaled. */
  pc: boolean;
}) {
  const { T } = props;
  return (
    // marginBottom auto: the play surface centres its child, and a list reads from the top.
    <div className="puzzlesnake-picker" style={{ width: props.pc ? "min(92vw, 720px)" : "min(92vw, 520px)", display: "flex", flexDirection: "column", gap: 18, marginBottom: "auto" }}>
      <button type="button" onClick={props.onBack} style={back}>
        {T.back}
      </button>
      {([1, 2] as World[]).map((w) => (
        <WorldBlock key={w} world={w} {...props} />
      ))}
    </div>
  );
}

function WorldBlock(props: { world: World; stars: StarMap; current: string; T: Words; pc: boolean; onPick: (id: string, el: HTMLElement) => void }) {
  const { world, T, stars } = props;
  const levels = LEVELS.filter((l) => l.world === world);
  // The one to play next: the first open level with no stars yet.
  const next = levels.find((l) => isOpen(l.id, stars) && stars[l.id] === undefined)?.id;
  return (
    <section>
      <h2 style={{ fontFamily: FONT, fontSize: 20, margin: "0 0 4px" }}>
        {T.world} {world} · {world === 1 ? T.garden : T.tricks}
      </h2>
      <p style={{ margin: "0 0 10px", fontSize: 14, color: "var(--text-dim)" }}>{world === 1 ? T.gardenBlurb : T.tricksBlurb}</p>
      <div style={{ display: "grid", gridTemplateColumns: `repeat(${props.pc ? 6 : 3}, minmax(0, 1fr))`, gap: 10 }}>
        {levels.map((l) => {
          const open = isOpen(l.id, stars);
          const got = stars[l.id];
          const name = `${T.level} ${l.id}, ${open ? (got ? fill(T.starsOf, { n: got }) : T.notYet) : T.locked}`;
          return (
            <button
              key={l.id}
              type="button"
              aria-label={name}
              aria-current={l.id === props.current ? "true" : undefined}
              data-open={open ? "yes" : "no"}
              onClick={(e) => props.onPick(l.id, e.currentTarget)}
              style={tile(open, l.id === next, props.pc)}
            >
              <b dir="ltr" style={{ fontSize: 26 }}>
                {l.id}
              </b>
              {/* World 2's tiles, drawn as the picture of what the level teaches.
                  A fixed-height row on every World 2 tile, so 2-2 (none) lines
                  up with its neighbours. */}
              {world === 2 && (
                <span aria-hidden="true" style={{ display: "flex", gap: 4, height: 16 }}>
                  {tricksIn(l).map((t) => (
                    <TileIcon key={t} trick={t} size={16} />
                  ))}
                </span>
              )}
              <span aria-hidden="true" dir="ltr" style={{ color: INK.gold, fontSize: 14, letterSpacing: 2, minHeight: 17 }}>
                {got ? "★".repeat(got) : ""}
              </span>
            </button>
          );
        })}
      </div>
    </section>
  );
}

function tile(open: boolean, next: boolean, pc: boolean): CSSProperties {
  return {
    height: pc ? 80 : 92,
    minWidth: 0,
    borderRadius: 14,
    border: `2px solid ${next ? INK.gold : INK.rim}`,
    boxShadow: next ? `0 0 14px ${INK.gold}66` : "none",
    background: INK.bg,
    color: INK.text,
    opacity: open ? 1 : 0.55,
    fontFamily: FONT,
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
    cursor: "pointer",
    touchAction: "manipulation",
  };
}

const back: CSSProperties = {
  alignSelf: "flex-start",
  minHeight: 48,
  padding: "0 16px",
  border: "none",
  borderRadius: 14,
  background: "var(--surface)",
  boxShadow: "var(--shadow-1)",
  color: "var(--text)",
  fontFamily: FONT,
  fontWeight: 700,
  fontSize: 16,
  cursor: "pointer",
};
