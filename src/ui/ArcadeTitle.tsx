import { useEffect, useRef, useState, type ReactElement, type ReactNode, type RefObject } from "react";

/**
 * THE TITLE SCREEN a showcase game opens on - key art filling the arena, the
 * game's name large and glowing, and ONE thing to press.
 *
 * Operator, 2026-09-30: *"we have to have 1 enter game screen ... a real nicer
 * splash screen"*, then "ack a build" on the mock (Neon Survival and Snake
 * Survivors, phone and PC). This is the shell both of those are built from; the
 * picture inside it is the game's own, handed in as `children`.
 *
 * WHERE IT SITS, and why that is load-bearing. It is an absolute cover over the
 * arena box - `inset: 0` - exactly like the arcade entrance it stands in front
 * of. A title in the flow would push the board, and the board's size is a
 * number the board gate measured (`chrome: 16`); a cover changes the height of
 * nothing. `arcade-title.test.ts` holds that, with the mutation that breaks it.
 *
 * WHAT IT DELIBERATELY DOES NOT DO
 *
 * - It imports nothing from a game. The art is a render prop fed the box's
 *   LAYOUT size, so this file never learns what a robot or a snake is - the same
 *   discipline `ArcadeChrome` keeps (`arcade-chrome-is-tier-not-id.test.ts`).
 * - It starts nothing. Its one primary button hands control to the game's own
 *   `onAction`, which moves to the next screen; the run starts later, from a
 *   button whose words say so.
 * - Nothing here is `disabled`. There is one primary control and at most one
 *   quiet secondary, both real `<button>`s.
 *
 * EVERY COLOUR IS THE GAME'S. The name, its outline, the button and the art
 * are game art on the game's own dark floor, fixed in both themes; a theme token
 * against a fixed fill is the chess night-theme contrast bug. So the game hands
 * its inks in (`ink`, `light`, `accent`, each line's glow) and this file holds
 * no colour literal - `token-hygiene.test.ts` refuses one in `src/ui`.
 *
 * SIZES COME FROM THE BOX'S LAYOUT SIZE (`clientWidth`/`clientHeight`), never a
 * rendered rect: `fitStage` may scale `#game-frame`, and a rect carries that
 * transform (`a-canvas-that-measures-its-own-box-cannot-see-a-transform-on-it.md`).
 */

export type TitleBox = { w: number; h: number; wide: boolean; rtl: boolean };

export type TitleLine = { text: string; glow: string; fill: string };

/**
 * The game's name as one or two lines: split at the first space, upper-cased
 * for the locale. A name with no space stays one line. Hebrew has no case, so
 * `toLocaleUpperCase` leaves it exactly as written.
 */
export function titleLines(name: string, locale: string): string[] {
  const up = (() => {
    try {
      return name.toLocaleUpperCase(locale);
    } catch {
      return name.toUpperCase();
    }
  })().trim();
  const at = up.indexOf(" ");
  return at < 0 ? [up] : [up.slice(0, at), up.slice(at + 1).trim()];
}

/**
 * The name's font size in px: as big as the mock drew it, and never wider than
 * 90% of the box. 0.72em a glyph is an estimate on the WIDE side of Fredoka
 * Bold's capitals plus the 0.03em tracking, so a line held to it has room to
 * spare rather than touching the edge. Capped by height too, so a short, wide
 * PC box does not hand the name half the screen.
 */
export function nameSize(lines: string[], w: number, h: number, wide = w > h): number {
  const longest = Math.max(1, ...lines.map((l) => [...l].length));
  const byWidth = (w * 0.9) / (longest * 0.72);
  // `wide` is the BOX's shape, which a split title's half-width column is not.
  const byHeight = h * (wide ? 0.125 : 0.085);
  return Math.max(21, Math.min(byWidth, byHeight, 72));
}

/** The box's layout size, kept current as it resizes, and which way it reads. */
function useBox(): [RefObject<HTMLDivElement>, TitleBox] {
  const ref = useRef<HTMLDivElement>(null);
  const [box, setBox] = useState<TitleBox>({ w: 0, h: 0, wide: false, rtl: false });
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const read = () => {
      const w = el.clientWidth;
      const h = el.clientHeight;
      const rtl = getComputedStyle(el).direction === "rtl";
      setBox((b) => (b.w === w && b.h === h && b.rtl === rtl ? b : { w, h, wide: w > h, rtl }));
    };
    read();
    if (typeof ResizeObserver === "undefined") return;
    const ro = new ResizeObserver(read);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  return [ref, box];
}

/** One line of the name: white-ish fill, a thick ink outline, and its own glow. */
function NameLine({ line, fs, width, ink }: { line: TitleLine; fs: number; width: number; ink: string }): ReactElement {
  const h = fs * 1.22;
  return (
    <svg
      aria-hidden="true"
      width={width}
      height={h}
      viewBox={`0 0 ${width} ${h}`}
      style={{
        display: "block",
        overflow: "visible",
        filter: `drop-shadow(0 0 ${fs * 0.1}px ${line.glow}) drop-shadow(0 0 ${fs * 0.28}px ${line.glow})`,
      }}
    >
      <text
        x={width / 2}
        y={fs * 0.96}
        fontSize={fs}
        fontWeight={700}
        textAnchor="middle"
        letterSpacing={fs * 0.03}
        fill={line.fill}
        stroke={ink}
        strokeWidth={fs * 0.16}
        strokeLinejoin="round"
        paintOrder="stroke"
        style={{ fontFamily: "Fredoka, Heebo, sans-serif" }}
      >
        {line.text}
      </text>
    </svg>
  );
}

/** The play triangle on the primary button, in the button's own ink. */
const PLAY = (size: number, ink: string, rtl: boolean) => (
  <svg aria-hidden="true" width={size} height={size} viewBox="0 0 24 24" style={{ flex: "none", transform: rtl ? "scaleX(-1)" : undefined }}>
    <path d="M7 4.5v15l12.5-7.5z" fill={ink} stroke={ink} strokeWidth={2} strokeLinejoin="round" />
  </svg>
);

export function ArcadeTitle({
  label,
  lines,
  tagline,
  action,
  onAction,
  accent,
  ink,
  light,
  secondary,
  split = false,
  children,
}: {
  /** The game's name, for the group's accessible name. */
  label: string;
  /** The name as drawn: one or two lines, each with its own glow. */
  lines: TitleLine[];
  tagline?: string;
  /** The primary button's words - "Tap to start", localised by the game. */
  action: string;
  onAction: () => void;
  /** The primary button's fill. The label is `ink` on it, so pick a light one. */
  accent: string;
  /** The dark ink: every outline, and the primary button's label. Six-digit hex. */
  ink: string;
  /** The light ink: the tagline and the secondary button's words. Six-digit hex. */
  light: string;
  /** One quiet extra button under the primary one - Snake's "How to play". */
  secondary?: { label: string; onPress: () => void; icon?: ReactNode };
  /**
   * On a landscape box, set the words in the start-side column and leave the
   * other side to the art (Snake's PC title). A portrait box always stacks.
   */
  split?: boolean;
  /** The key art, drawn full-bleed behind the words, sized from the box. */
  children?: (box: TitleBox) => ReactNode;
}): ReactElement {
  const [ref, box] = useBox();
  const column = split && box.wide;
  // The width the words are set in: the whole box, or its start-side half.
  const colW = column ? box.w * 0.52 : box.w;
  const fs = box.w > 0 ? nameSize(lines.map((l) => l.text), colW, box.h, box.wide) : 0;
  const btnFs = Math.max(18, Math.min(26, box.w * 0.068, box.h * 0.052));
  // 76px tall on a phone: two centimetres, the kids-band floor for a target.
  const btnH = Math.round(Math.max(64, Math.min(78, box.h * 0.105)));
  const pad = Math.max(12, Math.min(40, box.h * (box.wide ? 0.035 : 0.03)));

  const name = (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
      {lines.map((l, i) => (
        <NameLine key={i} line={l} fs={i === 0 ? fs : fs * 0.86} width={colW} ink={ink} />
      ))}
      {tagline && (
        <div
          style={{
            marginTop: fs * 0.12,
            maxWidth: colW * 0.92,
            textAlign: "center",
            fontSize: Math.max(14, Math.min(18, fs * 0.3)),
            fontWeight: 600,
            letterSpacing: "0.02em",
            color: light,
            textShadow: `0 2px 0 ${ink}`,
          }}
        >
          {tagline}
        </div>
      )}
    </div>
  );

  const buttons = (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: Math.max(12, btnH * 0.22) }}>
      <button type="button" data-primary="true" onClick={onAction}
        style={{
          width: Math.min(300, colW * 0.8),
          minHeight: btnH,
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          gap: btnFs * 0.45,
          padding: "0 18px",
          borderRadius: 999,
          border: `4px solid ${ink}`,
          background: accent,
          boxShadow: `0 7px 0 ${ink}, 0 0 34px ${accent}aa`,
          color: ink,
          font: "inherit",
          fontFamily: "Fredoka, Heebo, sans-serif",
          fontSize: btnFs,
          fontWeight: 700,
          letterSpacing: "0.04em",
          textTransform: "uppercase",
          whiteSpace: "nowrap",
          cursor: "pointer",
          touchAction: "manipulation",
        }}
      >
        {PLAY(btnFs * 1.05, ink, box.rtl)}
        {action}
      </button>
      {secondary && (
        <button type="button" onClick={secondary.onPress}
          style={{
            minHeight: 44,
            display: "inline-flex",
            alignItems: "center",
            gap: 8,
            padding: "0 16px 0 10px",
            borderRadius: 999,
            border: `2px solid ${light}57`,
            background: `${ink}d9`,
            color: light,
            font: "inherit",
            fontFamily: "Fredoka, Heebo, sans-serif",
            fontSize: 16,
            fontWeight: 600,
            whiteSpace: "nowrap",
            cursor: "pointer",
            touchAction: "manipulation",
          }}
        >
          {secondary.icon}
          {secondary.label}
        </button>
      )}
    </div>
  );

  return (
    <div
      ref={ref}
      role="group"
      aria-label={label}
      style={{
        position: "absolute",
        inset: 0,
        zIndex: 5,
        borderRadius: 14,
        overflow: "hidden",
        // Only until the box is measured and the art is drawn over it.
        background: "var(--stage-cover)",
        color: light,
        fontFamily: "Fredoka, Heebo, sans-serif",
      }}
    >
      {box.w > 0 && children?.(box)}
      {box.w > 0 && (
        <div
          style={{
            position: "absolute",
            top: 0,
            bottom: 0,
            // Logical, so the Hebrew app puts the words on the side it reads from.
            insetInlineStart: 0,
            width: colW,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: column ? "center" : "space-between",
            gap: column ? box.h * 0.14 : 0,
            padding: `${pad}px 0 ${pad * 1.4}px`,
            boxSizing: "border-box",
          }}
        >
          {name}
          {buttons}
        </div>
      )}
    </div>
  );
}
