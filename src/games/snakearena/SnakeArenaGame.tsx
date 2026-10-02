import { textFor } from "@i18n/index";
import { useEffect, useRef, useState, type MutableRefObject, type RefObject } from "react";
import type { GameContext } from "@sdk/index";
import { BOARD_CLASS, boardVars, isPcArena } from "@ui/boardSize";
import { GameChrome } from "@ui/GameChrome";
import { DirectionPad } from "@ui/DirectionPad";
import { BoardStick } from "@ui/BoardStick";
import { ControlModePicker } from "@ui/ControlModePicker";
// The MODULES, not the `@shared/index` barrel, as in the classic.
import { useControlMode, type ControlMode } from "@shared/useControlMode";
import { ArcadeTitle, balancedLines, type ArcadeTitleProps } from "@ui/ArcadeTitle";
import { ARENA_INKS, BAND_H, Band, LevelPanel, RankCard, RankPanel, arenaCover, arenaLines, type Cast } from "./ArenaCards";
import { cardText } from "./cardText";
import { INK } from "./ink";
import { PC_SHAPE, PHONE_SHAPE, type Dir, type Shape } from "./logic";
import type { ArenaStatus } from "./result";
import { LEVELS, type Level } from "./setup";
import { TitleChoices, type TitleChoicesProps } from "./TitleChoices";
import { useArena, type SceneApi } from "./useArena";
import { useChoices } from "./useChoices";
import { WORDS, clock, nameOf, type Words } from "./words";
import { meta } from "./meta";

/** The pad's key, px: the approved mock's 64, the kids' tap floor, so the tall phone board and the pad share one screen. */
const PAD_KEY = 64;

export function SnakeArenaGame({ ctx }: { ctx: GameContext }) {
  const hostRef = useRef<HTMLDivElement>(null);
  const w = textFor(WORDS, ctx.locale);
  // The SHAPE of the board, picked ONCE at mount off the same min-width the
  // board CSS sizes against, and handed to the rules - the showcase-arena
  // ruling. 30x20 on a PC, 23x32 on a phone: a media query can change how big
  // the board is drawn, never how many cells it has.
  const [pc] = useState(isPcArena);
  const shape = pc ? PC_SHAPE : PHONE_SHAPE;
  const c = useChoices(ctx, pc);
  const { status: s, sceneRef } = useArena(ctx, hostRef, shape, { choices: c.choices, name: (id, humans) => nameOf(w, id, humans) });
  const [controlMode, setControlMode] = useControlMode(ctx);
  // Every choice reaches the scene the same way: before a round it re-deals at
  // once, mid-round it waits for the next.
  const { level, map, colour, humans } = c.choices;
  useEffect(() => sceneRef.current?.setChoices({ level, map, colour, humans }), [sceneRef, level, map, colour, humans]);
  const runs = s.phase === "playing" || s.phase === "watch";
  const cast: Cast = { colors: s.colors, humans: s.humans };
  const pick: TitleChoicesProps = {
    w,
    colour,
    onColour: c.setColour,
    map,
    onMap: c.setMap,
    players: pc ? { value: c.players, on: c.setPlayers } : undefined,
  };

  return (
    <GameChrome
      ctx={ctx}
      stats={[]}
      numbersOnBoard
      onRestart={() => sceneRef.current?.restartFromChrome()}
      // Only while the round's clock runs: on a card there is nothing to stop.
      paused={runs ? s.paused : undefined}
      onPaused={runs ? (next) => sceneRef.current?.setPaused(next) : undefined}
      side={pc ? <RankPanel rows={s.rows} w={w} cast={cast} /> : undefined}
      footer={<Footer pc={pc} level={level} w={w} ctx={ctx} mode={controlMode} onMode={setControlMode} onLevel={c.setLevel} scene={sceneRef} />}
    >
      <ArenaBoard ctx={ctx} pc={pc} shape={shape} s={s} w={w} mode={controlMode} hostRef={hostRef} scene={sceneRef} level={level} onLevel={c.setLevel} pick={pick} cast={cast} />
    </GameChrome>
  );
}

type SceneRef = MutableRefObject<SceneApi | null>;

/** Under the board on a phone, the column beside it on a PC: the level (PC), the Controls setting, the pad - P1's. */
function Footer(p: { pc: boolean; level: Level; w: Words; ctx: GameContext; mode: ControlMode; onMode: (m: ControlMode) => void; onLevel: (l: Level) => void; scene: SceneRef }) {
  const steer = (dir: Dir) => p.scene.current?.steer(dir);
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10, alignItems: "center" }}>
      {p.pc && <LevelPanel level={p.level} onLevel={p.onLevel} w={p.w} />}
      <ControlModePicker mode={p.mode} onMode={p.onMode} t={p.ctx.t} />
      {p.mode !== "board" && <DirectionPad onDir={steer} size={PAD_KEY} variant={p.mode === "joystick" ? "stick" : "pad"} />}
    </div>
  );
}

/** The card sizes are the approved mock's, drawn on the band-and-board box at these sizes. */
const DESIGN = { tall: [321, 485] as [number, number], wide: [598, 445] as [number, number] };

/** The board: the band on top, the canvas's host, and whichever card the phase calls for. */
function ArenaBoard(p: {
  ctx: GameContext;
  pc: boolean;
  shape: Shape;
  s: ArenaStatus;
  w: Words;
  mode: ControlMode;
  hostRef: RefObject<HTMLDivElement>;
  scene: SceneRef;
  level: Level;
  onLevel: (l: Level) => void;
  pick: TitleChoicesProps;
  cast: Cast;
}) {
  const { s, w, shape } = p;
  const two = s.humans > 1;
  const again = () => p.scene.current?.startFromChrome();
  /**
   * THE CARD, in the title's style (operator, 2026-10-01, "one-screen start,
   * all four"): the start card became a title - the name in neon, the bots as
   * chips, one big PLAY - and the round-over cards wear the same style with the
   * ranking, PLAY AGAIN, and on the out card Watch. It covers the band AND the
   * board; the Controls row, the pad and the PC's side panels are page chrome
   * and stay where they are. Since the forum review (2026-10-01) the chips are
   * the LEVEL, and the colour, map and - on a PC - players rows sit under them
   * (`TitleChoices`), each one a choice that changes what PLAY starts.
   */
  const title = textFor(meta.title, p.ctx.locale);
  const ended =
    s.phase === "out" || s.phase === "over"
      ? cardText(w, { phase: s.phase, place: s.place, count: s.count, peak: s.peak, winner: s.winner, humans: s.humans, places: s.places })
      : null;
  const card: ArcadeTitleProps | null =
    s.phase === "ready"
      ? {
          label: title,
          // One line on a PC and smaller than the old title's 62/70: the card
          // now carries three more rows (TitleChoices), and at 62/70 PLAY and
          // the hint fell off the bottom of the board, measured on the build.
          lines: arenaLines(p.pc ? [title.toLocaleUpperCase(p.ctx.locale)] : balancedLines(title, p.ctx.locale)),
          tagline: w.rule,
          // The level, as every showcase title names its difficulty chips
          // ("difficulty <id>"), so the difficulty gate walks them.
          chips: {
            // The word only where there is room: on a phone "Level" pushed Hard onto a second line.
            label: p.pc ? w.level : undefined,
            options: LEVELS.map((l, i) => ({ id: l, text: w.levels[i], aria: `difficulty ${l}` })),
            value: p.level,
            onChange: (id) => p.onLevel(id as Level),
          },
          pick: <TitleChoices {...p.pick} />,
          action: w.play,
          onAction: again,
          hint: two ? w.keys2 : w.hint,
          inks: ARENA_INKS,
          layout: "stack",
          design: DESIGN,
          nameFs: [48, 56],
          top: [0.05, 0.04],
          play: { tall: [250, 72], wide: [290, 64] },
          cover: arenaCover(0.62),
        }
      : ended
        ? {
            label: ended.head,
            lines: arenaLines([ended.head.toLocaleUpperCase(p.ctx.locale)]),
            result: ended.line,
            body: <RankCard rows={s.rows} w={w} pc={p.pc} cast={p.cast} />,
            action: w.playAgain,
            again: true,
            onAction: again,
            secondary: s.phase === "out" ? { label: w.watch, onPress: () => p.scene.current?.watch(), widePill: true } : undefined,
            inks: ARENA_INKS,
            layout: "stack",
            design: DESIGN,
            nameFs: [46, 46],
            top: [0.037, 0.04],
            play: { tall: [250, 62], wide: [250, 56] },
            cover: arenaCover(0.74),
          }
        : null;
  return (
    <div className="arena-board" style={{ position: "relative", display: "inline-flex", flexDirection: "column", borderRadius: 14, overflow: "hidden", boxShadow: `0 0 0 3px ${INK.rim}, 0 10px 30px ${INK.rim}44` }}>
      <Band
        cells={
          two
            ? [
                { label: w.lengthOf(nameOf(w, 0, 2)), value: s.len === 0 ? w.out : s.len, color: s.colors[0] },
                { label: w.time, value: clock(s.seconds), color: INK.text },
                { label: w.lengthOf(nameOf(w, 1, 2)), value: s.len2 === 0 ? w.out : s.len2, color: s.colors[1] },
              ]
            : [
                { label: w.length, value: s.len, color: s.colors[0] ?? INK.mint },
                { label: w.time, value: clock(s.seconds), color: INK.text },
                { label: w.place, value: s.len === 0 ? w.out : w.ord(s.place), color: INK.gold },
              ]
        }
      />
      <div style={{ position: "relative" }}>
        <BoardStick active={p.mode === "board"} onDir={(d) => p.scene.current?.steer(d)} onTap={again}>
          <div
            ref={p.hostRef}
            className={p.pc ? BOARD_CLASS : undefined}
            style={{
              // PC: the height the window leaves, less `chrome` - 99px, MEASURED
              // by repro-board-fills-the-window on the built page (2026-09-28):
              // the band's 44 plus the panel's padding and head row. Phone: 42vh,
              // so the 23x32 board, the band, the Controls row and the pad come
              // to a 390x868 frame on a 390x844 phone - scaled 0.89 by fitStage,
              // as the classic's 846 is scaled (re-measured 2026-09-28 for the
              // roomier phone board - was 390x875 at 17x24).
              ...(p.pc ? boardVars({ vw: 92, vh: 60, cap: 900, chrome: 55 + BAND_H, ratio: shape.cols / shape.rows }) : { width: "min(92vw, 42vh, 420px)" }),
              aspectRatio: `${shape.cols} / ${shape.rows}`,
              overflow: "hidden",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              touchAction: "none",
            }}
          />
        </BoardStick>
      </div>
      {card && <ArcadeTitle {...card} />}
    </div>
  );
}
