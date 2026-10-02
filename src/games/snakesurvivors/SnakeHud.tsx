import { useEffect, useRef, type ReactElement, type ReactNode } from "react";
import { HEART_COLS, type BossRow, type GoalRow, type HeartBlock, type RunStat } from "./hud";

// Snake Survivors' HUD, drawn ON the arena: "C3 Big hearts, length right",
// approved off a mock on 2026-10-01 (the operator: "Life: hearts top left,
// bigger hearts. Length: top right." and "minimal but better, separation
// between length and hearts, heart should be on left top corner always").
//
// Every size is the mock's, in em of ONE base size that follows the arena's
// width: 16px on a 390px phone's 358px arena, 18px on a PC's 852px one (the
// mock's k = 1.12), never under 14px on a 360px phone. No word is drawn in
// play - crushed, best and level live on `PauseCard` and on the game-over card.
//
// A picture, never a control: it takes no pointer, because the arena under it
// is steered by touch, and it is hidden from assistive tech like the shared HUD
// it replaces. `PauseCard` is the one surface here a player presses.

const FONT = "Fredoka, Heebo, sans-serif";
const INK = "#f5f6ff";
const MINT = "#55efc4";
const GOLD = "#ffd166";
const RED = "#f4503f";
const COVER = "rgba(11, 13, 31, 0.9)";

const HEART_PATH = "M12 21s-7.5-4.7-7.5-10.1A4.4 4.4 0 0 1 12 8a4.4 4.4 0 0 1 7.5 2.9C19.5 16.3 12 21 12 21z";

const icon = { width: "1em", height: "1em", display: "block", flex: "0 0 auto" } as const;

/**
 * One heart, `fill` 0..1 full: the outline always, and the red heart over it
 * cut to `fill` of its width - so a crash that costs part of a heart shows.
 */
const Heart = ({ fill }: { fill: number }) => (
  <span
    data-heart={fill >= 1 ? "full" : fill <= 0 ? "empty" : "part"}
    style={{ position: "relative", display: "block", width: "1em", height: "1em" }}
  >
    <svg viewBox="0 0 24 24" aria-hidden="true" style={icon}>
      <path d={HEART_PATH} fill="none" stroke={RED} strokeWidth={2} strokeLinejoin="round" opacity={0.7} />
    </svg>
    {fill > 0 && (
      <span style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: `${Math.round(fill * 100)}%`, overflow: "hidden" }}>
        <svg viewBox="0 0 24 24" aria-hidden="true" style={icon}>
          <path d={HEART_PATH} fill={RED} />
        </svg>
      </span>
    )}
  </span>
);

/** A crash: the block flashes red and jumps a little (colour only under reduced motion). */
function useHitFlash(fill: number) {
  const ref = useRef<HTMLDivElement>(null);
  const was = useRef(fill);
  useEffect(() => {
    const el = ref.current;
    const hit = fill < was.current - 1e-9;
    was.current = fill;
    if (!hit || !el || typeof el.animate !== "function") return;
    const still = typeof matchMedia === "function" && matchMedia("(prefers-reduced-motion: reduce)").matches;
    const pop = still ? "scale(1)" : "scale(1.1)";
    el.animate(
      [
        { boxShadow: "0 0 0 0 rgba(244, 80, 63, 0)", transform: "scale(1)" },
        { boxShadow: "0 0 0 0.3em rgba(244, 80, 63, 0.9)", transform: pop, offset: 0.3 },
        { boxShadow: "0 0 0 0 rgba(244, 80, 63, 0)", transform: "scale(1)" },
      ],
      { duration: 480, easing: "ease-out" },
    );
  }, [fill]);
  return ref;
}

/** The length's glyph: a short neon snake. */
export const snakeIcon = () => (
  <svg viewBox="-7 -7 14 14" aria-hidden="true" style={icon}>
    <path d="M-6 4 C-6 -2 0 -2 0 2 C0 6 6 5 6 -1" fill="none" stroke={MINT} strokeWidth="2.6" strokeLinecap="round" />
  </svg>
);

/** Crushed: a squashed face. */
export const crushIcon = () => (
  <svg viewBox="0 0 16 16" aria-hidden="true" style={icon}>
    <circle cx="8" cy="8" r="6.4" fill="none" stroke={GOLD} strokeWidth="1.8" />
    <path d="M5.2 5.9l2 2m0-2l-2 2M8.8 5.9l2 2m0-2l-2 2M5.6 11.2q2.4-1.7 4.8 0" fill="none" stroke={GOLD} strokeWidth="1.5" strokeLinecap="round" />
  </svg>
);

/** Best: a crown. */
export const crownIcon = () => (
  <svg viewBox="0 0 16 16" aria-hidden="true" style={icon}>
    <path d="M2 12.5l-.8-7 3.6 3.2L8 3.5l3.2 5.2 3.6-3.2-.8 7z" fill={GOLD} />
  </svg>
);

/** Level: a chevron up, in the gem blue of the level line along the bottom. */
export const levelIcon = () => (
  <svg viewBox="0 0 16 16" aria-hidden="true" style={icon}>
    <path d="M3 10.5L8 5.5l5 5" fill="none" stroke="#74b9ff" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

/** The warden. */
const bossIcon = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true" style={{ ...icon, width: "1.6em", height: "1.6em" }}>
    <path d="M1.5 8.5C4.5 7 7.5 8 9.5 11l2.5-1.2 2.5 1.2c2-3 5-4 8-2.5-.7 4-2.7 7-5.2 8.3l-2 .1L12 15l-2.8 2.9-2-.1C4.7 16.5 2.2 12.5 1.5 8.5z" fill="#ff7675" />
    <path d="M9 6.2l1-3 1.6 2.4h.8L14 3.2l1 3z" fill="#ff7675" />
    <circle cx="9.9" cy="9.3" r="1.1" fill={GOLD} />
    <circle cx="14.1" cy="9.3" r="1.1" fill={GOLD} />
  </svg>
);

const num = (color: string, glyph: ReactNode, text: string, id: string) => (
  <span data-num={id} dir="ltr" style={{ display: "inline-flex", alignItems: "center", gap: "0.3em", whiteSpace: "nowrap", color, flex: "0 0 auto" }}>
    {glyph}
    {text}
  </span>
);

/**
 * A card's drawing, made to fill its slot (`CARD_ART` draws at a fixed 40px):
 * the same element re-made at 100%. Plain JSX on the element's own type, not
 * compat's `cloneElement` - that import alone put 113 B gz into the first
 * visit's vendor chunk (measured 2026-10-01, 7,940 -> 8,053).
 */
const fit = (art: ReactNode) => {
  if (!art || typeof art !== "object" || !("type" in art) || typeof art.type !== "string") return art;
  const el = art as ReactElement<object>;
  const Tag = el.type as "svg";
  return <Tag {...el.props} width="100%" height="100%" />;
};

export function SnakeHud({
  hearts,
  len,
  boss,
  cards,
  goal = null,
}: {
  hearts: HeartBlock;
  len: number;
  /** The bottom row, or null to draw none (the tutorial, the card picker). */
  boss: BossRow | null;
  /** The OWNED weapons' drawings; an empty list draws no column at all. */
  cards: { id: string; art: ReactNode }[];
  /** The goal row, top-centre (round eight), or null to draw none (the guided run). */
  goal?: GoalRow | null;
}) {
  const heartsRef = useHitFlash(hearts.fill);
  return (
    <div
      aria-hidden="true"
      data-hud="c3"
      // Clipped to the arena's own rounded box (the host's 14px), so the
      // length's soft backdrop never spills onto the page around the arena.
      style={{ position: "absolute", inset: 0, pointerEvents: "none", containerType: "inline-size", overflow: "hidden", borderRadius: 14 }}
    >
      <div
        style={{
          position: "absolute",
          inset: 0,
          // The mock's 16px on a 358px arena is 4.47cqw; 18px is its PC size.
          fontSize: "clamp(14px, 4.47cqw, 18px)",
          fontFamily: FONT,
          fontWeight: 700,
          lineHeight: 1,
          color: INK,
        }}
      >
        {/* HEARTS, top-left ALWAYS (physical, not logical: "heart should be on
            left top corner always"). Two rows of four, big; they drain with every
            crash, part hearts and then outlines, and the block flashes on the
            hit and turns red when the next bump is the last. */}
        <div
          ref={heartsRef}
          data-hud="hearts"
          data-danger={hearts.danger ? "true" : "false"}
          style={{
            position: "absolute",
            left: "0.5em",
            top: "0.5em",
            fontSize: "1.75em",
            display: "grid",
            gridTemplateColumns: `repeat(${Math.min(HEART_COLS, hearts.max)}, auto)`,
            gap: "0.12em 0.16em",
            padding: "0.3em 0.4em",
            borderRadius: "0.6em",
            border: `2px solid ${hearts.danger ? RED : "#2a2f55"}`,
            background: hearts.danger ? "rgba(60, 14, 20, 0.92)" : COVER,
          }}
        >
          {hearts.cells.map((fill, i) => (
            <Heart key={i} fill={fill} />
          ))}
        </div>

        {/* THE LENGTH, top-right, big, the glyph and the number and no word. */}
        <div
          data-hud="length"
          style={{
            position: "absolute",
            right: "0.7em",
            top: "0.7em",
            display: "flex",
            alignItems: "center",
            textShadow: "0 2px 6px rgba(11, 14, 34, 0.85)",
          }}
        >
          <span
            style={{
              position: "absolute",
              left: "50%",
              top: "50%",
              width: "11em",
              height: "6em",
              transform: "translate(-50%, -50%)",
              background: "radial-gradient(closest-side, rgba(11, 13, 31, 0.78), rgba(11, 13, 31, 0.55) 55%, rgba(11, 13, 31, 0))",
            }}
          />
          <span
            dir="ltr"
            style={{ position: "relative", display: "inline-flex", alignItems: "center", gap: "0.2em", fontSize: "2.6em", color: MINT, whiteSpace: "nowrap" }}
          >
            <span style={{ display: "flex", width: "0.85em", height: "0.85em" }}>{snakeIcon()}</span>
            {len}
          </span>
        </div>

        {goal && <GoalBlock goal={goal} />}

        {/* THE WEAPONS, on the side, only once owned - no empty slots. */}
        {cards.length > 0 && (
          <div
            data-hud="cards"
            style={{
              position: "absolute",
              insetInlineStart: "0.5em",
              top: "50%",
              transform: "translateY(-50%)",
              display: "flex",
              flexDirection: "column",
              gap: "0.4em",
            }}
          >
            {cards.map((c) => (
              <div
                key={c.id}
                data-card={c.id}
                style={{
                  width: "1.9em",
                  height: "1.9em",
                  boxSizing: "border-box",
                  borderRadius: "0.5em",
                  border: "2px solid #2f356b",
                  background: "rgba(11, 13, 31, 0.88)",
                  display: "grid",
                  placeItems: "center",
                }}
              >
                <span style={{ display: "flex", width: "1.4em", height: "1.4em" }}>{fit(c.art)}</span>
              </div>
            ))}
          </div>
        )}

        {/* THE BOSS ROW: the boss, a bar, and the two triggers as icons and
            numbers - or, with a warden up, its health alone. */}
        {boss && (
          <div data-hud="boss" style={{ position: "absolute", left: 0, right: 0, bottom: "1.1em", display: "flex", justifyContent: "center" }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.6em",
                boxSizing: "border-box",
                width: "min(24em, 92%)",
                padding: "0.45em 0.9em 0.45em 0.6em",
                borderRadius: 99,
                background: "rgba(11, 13, 31, 0.78)",
                fontSize: "0.88em",
              }}
            >
              {bossIcon()}
              <div
                style={{
                  flex: "1 1 auto",
                  minWidth: "2em",
                  height: "0.5em",
                  borderRadius: 99,
                  background: "rgba(255, 255, 255, 0.16)",
                  overflow: "hidden",
                }}
              >
                <i
                  style={{
                    display: "block",
                    height: "100%",
                    borderRadius: 99,
                    width: `${Math.round(boss.fraction * 100)}%`,
                    background: boss.kind === "warden" ? "#ff7675" : "linear-gradient(90deg, #ff7675, #ffd166)",
                  }}
                />
              </div>
              {boss.kind === "meter" && boss.len != null && num(MINT, snakeIcon(), boss.len, "len")}
              {boss.kind === "meter" && num(GOLD, crushIcon(), boss.crushed, "crushed")}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * Where the goal row may sit: in the gap between the two corners, with 0.2em of
 * air each side. MEASURED in Chromium with the shipped Fredoka (2026-10-02, the
 * HUD rendered at the arena widths of a 390x844 and a 360x780 phone and a PC):
 * the hearts block ends 10.1em + its 4px border in, and the length's widest
 * number, "140" (100 and both Long Body cards), starts 7.44-7.49em from the
 * right. That leaves the goal about 4.1em on a phone - room for "BOSS 3/3"
 * (3.59em, the widest word) - so the score and the clock wrap onto two lines
 * there, and sit on one on a PC.
 */
export const GOAL_INSET = { left: "calc(10.35em + 4px)", right: "7.75em" } as const;

/**
 * THE GOAL (round eight): the crushed count as the score and the run clock,
 * and "BOSS n/3" under them - top-centre, in the gap between the two corners.
 * The score and the clock wrap onto two lines when the gap is too narrow for
 * one, so the block never reaches either corner.
 */
function GoalBlock({ goal }: { goal: GoalRow }) {
  return (
    // The box is placed in the HUD's own em (the insets were measured in it);
    // only the words inside it are smaller - an em inset on a 0.8em box would
    // land 20% short of the corners it is measured against.
    <div data-hud="goal" style={{ position: "absolute", top: "0.5em", left: GOAL_INSET.left, right: GOAL_INSET.right }}>
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: "0.25em",
          fontSize: "0.8em",
          textAlign: "center",
          textShadow: "0 2px 6px rgba(11, 14, 34, 0.85)",
        }}
      >
      <span dir="ltr" style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", alignItems: "center", gap: "0.2em 0.6em" }}>
        <span style={{ display: "inline-flex", alignItems: "center", gap: "0.25em", color: GOLD, whiteSpace: "nowrap" }}>
          {crushIcon()}
          <span data-goal="score">{goal.score}</span>
        </span>
        <span data-goal="clock" style={{ whiteSpace: "nowrap" }}>
          {goal.clock}
        </span>
      </span>
      <span data-goal="boss" style={{ color: "#ff7675", whiteSpace: "nowrap", fontSize: "0.85em", letterSpacing: "0.04em" }}>
        {goal.boss}
      </span>
      </div>
    </div>
  );
}

const STAT_ICON: Record<RunStat["id"], () => ReactNode> = { crushed: crushIcon, best: crownIcon, level: levelIcon };
const STAT_INK: Record<RunStat["id"], string> = { crushed: GOLD, best: INK, level: "#74b9ff" };

/**
 * The pause card: what a paused run shows over its arena - Resume, and the
 * three numbers that left the play screen (crushed, best, level). One tap
 * anywhere on it resumes, the house shape (`GameChrome`'s cover): the whole
 * surface is the target, and it is a real button.
 */
export function PauseCard({
  stats,
  words,
  resume,
  onResume,
}: {
  stats: RunStat[];
  words: Record<RunStat["id"], string>;
  resume: string;
  onResume: () => void;
}) {
  return (
    <button
      type="button"
      data-hud="pause"
      aria-label={resume}
      onClick={onResume}
      style={{
        position: "absolute",
        inset: 0,
        zIndex: 3,
        border: "none",
        borderRadius: 14,
        background: "var(--stage-cover)",
        color: INK,
        fontFamily: FONT,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 18,
        padding: 16,
        cursor: "pointer",
        touchAction: "manipulation",
      }}
    >
      <span
        aria-hidden="true"
        style={{ width: 76, height: 76, borderRadius: "50%", background: "var(--brand-strong)", display: "grid", placeItems: "center" }}
      >
        <svg width="34" height="34" viewBox="0 0 24 24" aria-hidden="true">
          <path d="M8 5.5v13l10.5-6.5z" fill="#fff" />
        </svg>
      </span>
      <span style={{ fontSize: 22, fontWeight: 800 }}>{resume}</span>
      <span style={{ display: "flex", gap: 12, flexWrap: "wrap", justifyContent: "center" }}>
        {stats.map((s) => (
          <span
            key={s.id}
            data-stat={s.id}
            style={{
              minWidth: 84,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 6,
              padding: "10px 12px",
              borderRadius: 14,
              border: "2px solid #2a2f55",
              background: "rgba(11, 13, 31, 0.6)",
            }}
          >
            <span style={{ fontSize: 22, display: "flex" }}>{STAT_ICON[s.id]()}</span>
            <span dir="ltr" style={{ fontSize: 26, fontWeight: 800, lineHeight: 1, color: STAT_INK[s.id] }}>
              {s.value}
            </span>
            <span style={{ fontSize: 13, fontWeight: 700, opacity: 0.8 }}>{words[s.id]}</span>
          </span>
        ))}
      </span>
    </button>
  );
}
