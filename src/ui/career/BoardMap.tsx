// The board map (the operator's pick C for puzzle games, 2026-09-29): a grid of
// numbered tiles, stars under each cleared one, a lock on the rest. No gear, no
// shop - a puzzle game with many levels gets this and nothing else (G12).
//
// The grid's geometry is `boardLayout` in src/shared/career/board.ts, where a
// node test holds every tile inside the box at 1536x639 and 390x844 at up to a
// hundred levels. The levels' states come from `linearStates` in progress.ts,
// the same unlock rule the trail uses, over a plain list of level ids.

import { useLayoutEffect, useMemo, useRef } from "react";
import type { ReactElement } from "react";
import { DIR } from "@i18n/index";
import type { AppLocale } from "@i18n/index";
import { boardLayout } from "../../shared/career/board";
import type { LevelStateView } from "../../shared/career/progress";
import { iconShapes, INK } from "./icons";
import { Hud, Screen, useBox, useWiggle } from "./parts";
import type { Purse } from "./parts";
import { careerWords, fill } from "./words";
import { P } from "./palette";

export interface BoardMapProps {
  locale: AppLocale;
  levels: LevelStateView[];
  purses: Purse[];
  onBack: () => void;
  onPlay: (levelId: string) => void;
}

const FACE = { done: P.mint, now: P.berry, open: P.sand, locked: P.dusk } as const;

function TileFace({ v, n, size }: { v: LevelStateView; n: number; size: number }): ReactElement {
  const locked = v.state === "locked";
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" aria-hidden="true" style={{ display: "block", overflow: "visible" }}>
      {v.state === "now" ? <rect x="-8" y="-8" width="116" height="116" rx="28" fill={P.sun} opacity={0.45} /> : null}
      <rect x="3" y="3" width="94" height="94" rx="22" fill={FACE[v.state]} stroke={INK} strokeWidth={5} />
      {locked
        ? <g transform="translate(50 48) scale(1.7)">{iconShapes("lock")}</g>
        : <text x="50" y={v.state === "done" ? 56 : 64} fontSize={v.state === "done" ? 38 : 44} textAnchor="middle" fontWeight={700} fill={v.state === "open" ? INK : P.white}>{n}</text>}
      {v.state === "done" ? [0, 1, 2].map((k) => (
        <g key={k} transform={`translate(${28 + k * 22} 78) scale(.85)`}>{iconShapes("star", k < v.stars ? P.sun : P.mintDark)}</g>
      )) : null}
    </svg>
  );
}

export function BoardMap(props: BoardMapProps): ReactElement {
  const w = careerWords(props.locale);
  const dir = DIR[props.locale];
  const [boxRef, box] = useBox<HTMLDivElement>();
  const scroller = useRef<HTMLDivElement>(null);
  const [wiggling, wiggle] = useWiggle();
  const b = useMemo(() => (box.width > 0 && box.height > 0 && props.levels.length > 0 ? boardLayout(props.levels.length, box) : null), [box, props.levels.length]);
  const now = props.levels.findIndex((v) => v.state === "now");

  useLayoutEffect(() => {
    const el = scroller.current;
    if (!b || !el || now < 0) return;
    el.scrollTop = Math.max(0, Math.min(b.height - box.height, b.tiles[now].y - box.height / 2));
  }, [b]); // re-centre only when the grid itself changes

  return (
    <Screen boxRef={boxRef} background={`radial-gradient(circle at 50% 30%, ${P.navy}, ${P.night})`} dir={dir}>
      {b ? (
        <div ref={scroller} dir="ltr" style={{ position: "absolute", inset: 0, overflowY: "auto", overflowX: "hidden" }}>
          <div style={{ position: "relative", width: b.width, height: b.height }}>
            {props.levels.map((v, i) => {
              const t = b.tiles[i];
              const label = v.state === "locked" ? `${fill(w.level, i + 1)}, ${w.locked}` : v.stars > 0 ? `${fill(w.level, i + 1)}, ${fill(w.stars, v.stars)}` : fill(w.level, i + 1);
              return (
                <button key={v.id} type="button" aria-label={label} aria-current={v.state === "now" ? "step" : undefined}
                  className={`career-btn${wiggling === v.id ? " career-wiggle" : ""}`}
                  onClick={() => (v.state === "locked" ? wiggle(v.id) : props.onPlay(v.id))}
                  style={{ position: "absolute", left: t.x, top: t.y, width: b.size, height: b.size, padding: 0, border: 0, background: "transparent" }}>
                  <TileFace v={v} n={i + 1} size={b.size} />
                </button>
              );
            })}
          </div>
        </div>
      ) : null}
      <Hud onBack={props.onBack} backLabel={w.back} purses={props.purses} purseLabel={w.gold} rtl={dir === "rtl"} inset={box.width > box.height ? 24 : 12} />
    </Screen>
  );
}
