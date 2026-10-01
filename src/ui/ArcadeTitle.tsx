import { useEffect, useRef, useState, type CSSProperties, type ReactElement, type ReactNode, type RefObject } from "react";

/**
 * THE TITLE CARD a showcase game shows whenever nothing is being steered - the
 * screen it opens on AND the card a run ends on, one shell for both.
 *
 * Operator, 2026-09-30: *"we have to have 1 enter game screen"*, approved off a
 * mock; then 2026-10-01, the "one-screen start, all four" mock: the difficulty
 * chips and ONE big PLAY move onto the title (no second, plain card after it),
 * and the game-over card is drawn in the title's style - big neon heading,
 * score tiles, the chips again, PLAY AGAIN. Snake Survivors, Neon Survival,
 * Hold the Line and Snake Arena all wear it; each hands in its own art, words
 * and inks.
 *
 * WHERE IT SITS, and why that is load-bearing. An absolute cover - `inset: 0` -
 * over the box it is mounted in (the arena, or for Hold the Line on a phone the
 * whole game panel). A cover changes the height of nothing; a card in the flow
 * would push the board, whose size is a number the board gate measured.
 * `arcade-title.test.ts` holds that, with the mutation that breaks it.
 *
 * WHAT IT DELIBERATELY DOES NOT DO
 *
 * - It imports nothing from a game. The art is a render prop fed the box's
 *   LAYOUT size; tiles, pills and the body arrive as data or nodes. The same
 *   discipline `ArcadeChrome` keeps (`arcade-chrome-is-tier-not-id.test.ts`).
 * - Exactly ONE primary button (`data-primary`), and it calls the game's own
 *   `onAction` - the repro gates step through the title by pressing it.
 * - Nothing here is `disabled`. Chips, pills and the link are real `<button>`s.
 *
 * EVERY COLOUR IS THE GAME'S (`inks`). The card is game art on the game's own
 * dark floor, fixed in both themes; a theme token against a fixed fill is the
 * chess night-theme contrast bug. So this file holds no colour literal -
 * `token-hygiene.test.ts` refuses one in `src/ui` - and the translucent edges
 * are `color-mix` of the inks it was handed.
 *
 * SIZES are the approved mock's, scaled by how big this box is against the box
 * the mock was drawn on (`design`), read from the box's LAYOUT size
 * (`clientWidth`/`clientHeight`) - never a rendered rect, which carries
 * `fitStage`'s transform
 * (`a-canvas-that-measures-its-own-box-cannot-see-a-transform-on-it.md`).
 */

export type TitleBox = { w: number; h: number; wide: boolean; rtl: boolean };

export type TitleLine = { text: string; glow: string; fill: string };

/** The game's colours. Six-digit hex for the three solid inks; any CSS colour for the rest. */
export type TitleInks = {
  /** PLAY's fill; its label is `ink` on it, so a light one. */
  accent: string;
  /** Every outline, and PLAY's label. */
  ink: string;
  /** Words on the dark: the tagline, chip and pill labels. */
  light: string;
  /** A chip's and a pill's dark fill. */
  chip: string;
  /** The picked chip's fill, and its ring and glow. */
  sel: string;
  selRing: string;
  /** A score tile's and the ranking panel's fill, and their edge. */
  panel: string;
  line: string;
  /** The NEW BEST ribbon, and the result line. */
  gold: string;
};

/** A row of chips - the difficulty, or Snake Arena's bots. */
export type TitleChips = {
  /** A small word before the row ("Bots"). */
  label?: string;
  options: readonly { id: string; text: string; aria: string }[];
  value: string;
  onChange: (id: string) => void;
  /** Square chips (3 / 4 / 5) rather than pills. */
  square?: boolean;
};

/** A pill under PLAY - "Bolt >", "Career >", "< Weapon", "< Menu". */
export type TitlePill = { label: string; icon?: ReactNode; onPress: () => void; back?: boolean };

/** One score tile on a game-over card. `color` is the value's colour. */
export type TitleTile = { id: string; icon: ReactNode; value: string | number; label: string; color: string };

/** The quiet link - "How to play", "Watch (3x)". On a wide box it may become a pill before PLAY. */
export type TitleLink = { label: string; onPress: () => void; icon?: ReactNode; widePill?: boolean };

export type ArcadeTitleProps = {
  /** The card's accessible name. */
  label: string;
  /** The big heading: the game's name, or "Out of tail". One or two lines. */
  lines: TitleLine[];
  tagline?: string;
  /** One gold line under the heading ("5th of 5 - Longest you reached: 4"). */
  result?: string;
  /** The NEW BEST ribbon's words, when it was earned. */
  ribbon?: string;
  tiles?: TitleTile[];
  /** A block of the game's own (Snake Arena's ranking). */
  body?: ReactNode;
  chips?: TitleChips;
  /** A choice drawn between the chips and PLAY, because it changes what PLAY starts (Hold the Line's shop). */
  pick?: ReactNode;
  /** PLAY's words, localised by the game. */
  action: string;
  /** Draw PLAY with the round "again" arrow instead of the triangle. */
  again?: boolean;
  onAction: () => void;
  pills?: TitlePill[];
  secondary?: TitleLink;
  /** Small words at the bottom ("Arrows, swipe or the buttons"). */
  hint?: string;
  inks: TitleInks;
  /**
   * "ends": the heading at the top and the controls at the bottom, over key art
   * (the titles). "stack": one column from `top` (the cards).
   */
  layout?: "ends" | "stack";
  /** "stack": where the column starts, as a fraction of the box's height - [portrait, landscape]. */
  top?: [number, number];
  /** "ends": the space under the controls, as a fraction of the box's height - [portrait, landscape]. */
  bottom?: [number, number];
  /** The heading's size in px on the design box - [portrait, landscape]. Absent: sized to the box, as the titles always were. */
  nameFs?: [number, number];
  /** The box each size was drawn for - [w, h] portrait and landscape. */
  design?: { tall: [number, number]; wide: [number, number] };
  /** PLAY's size on the design box - [w, h] portrait and landscape. */
  play?: { tall: [number, number]; wide: [number, number] };
  /** On a landscape box, where two pills go: either side of PLAY, or under it. */
  pillsWide?: "flank" | "below";
  /**
   * A band this tall (px) at the top holds the heading, and the column starts
   * under it - Hold the Line on a phone, whose live lane is the art strip.
   * Exposed to `cover` as the custom property `--title-head`.
   */
  head?: number;
  /** On a landscape box, set the words in the start-side column and leave the other side to the art. */
  split?: boolean;
  /** What is behind everything when there is no art (a colour or a gradient). */
  cover?: string;
  /** A veil over the art. */
  scrim?: string;
  /** The key art, drawn full-bleed behind the words, sized from the box. */
  children?: (box: TitleBox) => ReactNode;
};

/**
 * The game's name as one or two lines: split at the first space, upper-cased
 * for the locale. A name with no space stays one line. Hebrew has no case, so
 * `toLocaleUpperCase` leaves it exactly as written.
 */
export function titleLines(name: string, locale: string): string[] {
  const up = upper(name, locale);
  const at = up.indexOf(" ");
  return at < 0 ? [up] : [up.slice(0, at), up.slice(at + 1).trim()];
}

/**
 * A card's HEADING as one or two lines, split at the space nearest its middle -
 * "OUT OF / TAIL", as the mock set them, never "OUT / OF TAIL".
 */
export function balancedLines(text: string, locale: string): string[] {
  const up = upper(text, locale);
  const mid = up.length / 2;
  let at = -1;
  for (let i = 0; i < up.length; i++) if (up[i] === " " && (at < 0 || Math.abs(i - mid) < Math.abs(at - mid))) at = i;
  return at < 0 ? [up] : [up.slice(0, at).trim(), up.slice(at + 1).trim()];
}

function upper(s: string, locale: string): string {
  try {
    return s.toLocaleUpperCase(locale).trim();
  } catch {
    return s.toUpperCase().trim();
  }
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

/** One line of the heading: white-ish fill, a thick ink outline, and its own glow. */
function NameLine({ line, fs, width, ink, lh }: { line: TitleLine; fs: number; width: number; ink: string; lh: number }): ReactElement {
  const h = fs * lh;
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
        // The approved titles' baseline at 1.22; a card's tighter 1.0 line centres its capitals.
        y={lh < 1.2 ? fs * 0.86 : fs * 0.96}
        fontSize={fs}
        fontWeight={700}
        textAnchor="middle"
        letterSpacing={fs * 0.03}
        fill={line.fill}
        stroke={ink}
        strokeWidth={fs * 0.16}
        strokeLinejoin="round"
        paintOrder="stroke"
        style={{ fontFamily: FONT }}
      >
        {line.text}
      </text>
    </svg>
  );
}

const FONT = "Fredoka, Heebo, sans-serif";

/** The play triangle, or the round "again" arrow, in the button's own ink. */
const PLAY_ICON = (size: number, again: boolean, rtl: boolean) =>
  again ? (
    <svg aria-hidden="true" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" style={{ flex: "none" }}>
      <path d="M20 12a8 8 0 1 1-2.6-5.9" />
      <path d="M20 4v5h-5" />
    </svg>
  ) : (
    <svg aria-hidden="true" width={size} height={size} viewBox="0 0 24 24" style={{ flex: "none", transform: rtl ? "scaleX(-1)" : undefined }}>
      <path d="M7 4.5v15l12.5-7.5z" fill="currentColor" stroke="currentColor" strokeWidth={2} strokeLinejoin="round" />
    </svg>
  );

/** A pill's chevron, pointing the way the pill goes - mirrored for a right-to-left page. */
const CHEVRON = (size: number, back: boolean, rtl: boolean) => (
  <svg aria-hidden="true" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3.4} strokeLinecap="round" strokeLinejoin="round" style={{ flex: "none", opacity: 0.8, transform: back !== rtl ? "scaleX(-1)" : undefined }}>
    <path d="M9 5l7 7-7 7" />
  </svg>
);

/** The ribbon's star. */
const STAR = (size: number) => (
  <svg aria-hidden="true" width={size} height={size} viewBox="0 0 24 24" style={{ flex: "none" }}>
    <path d="M12 2.5l2.9 6 6.6.9-4.8 4.6 1.2 6.5L12 17.4 6.1 20.5l1.2-6.5L2.5 9.4l6.6-.9z" fill="currentColor" />
  </svg>
);

/** A translucent edge, mixed from one of the game's inks. */
const edge = (ink: string, pct: number) => `color-mix(in srgb, ${ink} ${pct}%, transparent)`;

const DESIGN = { tall: [358, 756] as [number, number], wide: [852, 479] as [number, number] };
const PLAY_SIZE = { tall: [290, 78] as [number, number], wide: [300, 64] as [number, number] };

export function ArcadeTitle(props: ArcadeTitleProps): ReactElement {
  const { inks, lines, layout = "ends", children } = props;
  const [ref, box] = useBox();
  const column = Boolean(props.split) && box.wide;
  // The width the words are set in: the whole box, or its start-side half.
  const colW = column ? box.w * 0.52 : box.w;
  const [dw, dh] = (props.design ?? DESIGN)[box.wide ? "wide" : "tall"];
  // How big this box is against the one the mock was drawn on.
  const k = box.w > 0 ? Math.max(0.72, Math.min(1.5, box.w / dw, box.h / dh)) : 1;
  const px = (n: number) => Math.round(n * k * 10) / 10;

  // The heading: the titles keep the size they were approved at; the cards
  // take the mock's size, held inside 90% of the column.
  const texts = lines.map((l) => l.text);
  const longest = Math.max(1, ...texts.map((t) => [...t].length));
  const fs = box.w <= 0 ? 0 : props.nameFs
    ? Math.max(21, Math.min(props.nameFs[box.wide ? 1 : 0] * k, (colW * 0.9) / (longest * 0.64)))
    : nameSize(texts, colW, box.h, box.wide);
  const stack = layout === "stack";

  const [pw, ph] = (props.play ?? PLAY_SIZE)[box.wide ? "wide" : "tall"];
  const btnH = Math.max(52, ph * k);
  const btnW = Math.min(pw * k, colW * 0.9);
  const btnFs = Math.min(24 * k, btnH * 0.37);
  const g = (box.wide ? 16 : 22) * k;

  const name = (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
      {lines.map((l, i) => (
        <NameLine key={i} line={l} fs={stack || i === 0 ? fs : fs * 0.86} width={colW} ink={inks.ink} lh={stack ? 1 : 1.22} />
      ))}
      {props.tagline && !stack && (
        <div
          style={{
            marginTop: fs * 0.12,
            maxWidth: colW * 0.92,
            textAlign: "center",
            fontSize: Math.max(14, Math.min(18, fs * 0.3)),
            fontWeight: 600,
            letterSpacing: "0.02em",
            color: inks.light,
            textShadow: `0 2px 0 ${inks.ink}`,
          }}
        >
          {props.tagline}
        </div>
      )}
    </div>
  );

  const words = (text: string, size: number, color: string, weight = 600): ReactElement => (
    <div style={{ maxWidth: colW * 0.94, textAlign: "center", fontSize: size, fontWeight: weight, lineHeight: 1.3, color, textShadow: `0 2px 0 ${inks.ink}` }}>
      {text}
    </div>
  );

  const pillStyle: CSSProperties = {
    minHeight: Math.max(44, 46 * k),
    display: "inline-flex",
    alignItems: "center",
    gap: px(8),
    padding: `0 ${px(16)}px`,
    borderRadius: 999,
    border: `2px solid ${edge(inks.light, 42)}`,
    background: inks.chip,
    color: inks.light,
    font: "inherit",
    fontFamily: FONT,
    fontSize: px(17),
    fontWeight: 600,
    whiteSpace: "nowrap",
    cursor: "pointer",
    touchAction: "manipulation",
  };
  const pill = (p: TitlePill, i: number) => (
    <button key={i} type="button" onClick={p.onPress} style={pillStyle}>
      {p.back && CHEVRON(px(14), true, box.rtl)}
      {p.icon && <span style={{ display: "flex", width: px(22), height: px(22), fontSize: px(22) }}>{p.icon}</span>}
      {p.label}
      {!p.back && CHEVRON(px(14), false, box.rtl)}
    </button>
  );

  const chips = props.chips && (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", flexWrap: "wrap", gap: px(8) }}>
      {props.chips.label && (
        <span style={{ fontSize: px(13), fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", color: inks.light, marginInlineEnd: px(4) }}>
          {props.chips.label}
        </span>
      )}
      {props.chips.options.map((o) => {
        const on = o.id === props.chips?.value;
        const sq = props.chips?.square;
        return (
          <button
            key={o.id}
            type="button"
            aria-label={o.aria}
            aria-pressed={on}
            onClick={() => props.chips?.onChange(o.id)}
            style={{
              minHeight: Math.max(40, 40 * k),
              minWidth: sq ? px(50) : undefined,
              padding: sq ? 0 : `0 ${px(18)}px`,
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              borderRadius: sq ? px(14) : 999,
              border: `2px solid ${on ? inks.selRing : edge(inks.light, 40)}`,
              background: on ? inks.sel : inks.chip,
              boxShadow: on ? `0 0 14px ${edge(inks.selRing, 70)}` : "none",
              color: on ? inks.ink : inks.light,
              font: "inherit",
              fontFamily: FONT,
              fontSize: px(sq ? 20 : 17),
              fontWeight: sq ? 700 : 600,
              cursor: "pointer",
              touchAction: "manipulation",
            }}
          >
            {o.text}
          </button>
        );
      })}
    </div>
  );

  const primary = (
    <button type="button" data-primary="true" onClick={props.onAction}
      style={{
        width: btnW,
        minHeight: btnH,
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        gap: btnFs * 0.42,
        padding: "0 14px",
        borderRadius: 999,
        border: `4px solid ${inks.ink}`,
        background: inks.accent,
        boxShadow: `0 ${px(7)}px 0 ${inks.ink}, 0 0 ${px(34)}px ${edge(inks.accent, 66)}`,
        color: inks.ink,
        font: "inherit",
        fontFamily: FONT,
        fontSize: btnFs,
        fontWeight: 700,
        letterSpacing: "0.04em",
        textTransform: "uppercase",
        whiteSpace: "nowrap",
        cursor: "pointer",
        touchAction: "manipulation",
      }}
    >
      {PLAY_ICON(btnFs * 1.05, Boolean(props.again), box.rtl)}
      {props.action}
    </button>
  );

  const pills = props.pills ?? [];
  const flank = box.wide && !stack && props.pillsWide === "flank" && pills.length === 2;
  const link = props.secondary;
  const linkAsPill = Boolean(link?.widePill) && box.wide;
  const playRow = (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: px(16) }}>
      {flank && pill(pills[0], 0)}
      {linkAsPill && link && (
        <button type="button" onClick={link.onPress} style={{ ...pillStyle, minHeight: Math.max(44, 50 * k) }}>
          {link.icon}
          {link.label}
        </button>
      )}
      {primary}
      {flank && pill(pills[1], 1)}
    </div>
  );

  const ribbon = props.ribbon && (
    <div style={{ display: "inline-flex", alignItems: "center", gap: px(7), height: px(32), padding: `0 ${px(14)}px`, borderRadius: 999, background: inks.gold, color: inks.ink, fontSize: px(16), fontWeight: 700, letterSpacing: "0.04em", textTransform: "uppercase" }}>
      {STAR(px(18))}
      {props.ribbon}
    </div>
  );

  const tiles = props.tiles && (
    <div style={{ display: "flex", gap: px(12) }}>
      {props.tiles.map((t) => (
        <div
          key={t.id}
          data-tile={t.id}
          style={{ width: px(84), height: px(100), boxSizing: "border-box", borderRadius: px(18), border: `2px solid ${inks.line}`, background: inks.panel, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: px(5), fontWeight: 700 }}
        >
          <span style={{ display: "flex", width: px(22), height: px(22), fontSize: px(22) }}>{t.icon}</span>
          <b dir="ltr" style={{ fontSize: px(34), lineHeight: 1, color: t.color }}>{t.value}</b>
          <i style={{ fontStyle: "normal", fontSize: px(15), letterSpacing: "0.06em", color: inks.light }}>{t.label}</i>
        </div>
      ))}
    </div>
  );

  const linkButton = link && !linkAsPill && (
    <button type="button" onClick={link.onPress}
      style={{
        minHeight: Math.max(40, 40 * k),
        display: "inline-flex",
        alignItems: "center",
        gap: px(7),
        padding: `0 ${px(8)}px`,
        border: "none",
        background: "transparent",
        color: inks.light,
        font: "inherit",
        fontFamily: FONT,
        fontSize: px(16),
        fontWeight: 600,
        textDecoration: "underline",
        textUnderlineOffset: 4,
        whiteSpace: "nowrap",
        cursor: "pointer",
        touchAction: "manipulation",
      }}
    >
      {link.icon && <span style={{ display: "flex", width: px(20), height: px(20), fontSize: px(20) }}>{link.icon}</span>}
      {link.label}
    </button>
  );

  const below = !flank && pills.length > 0 && (
    <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", gap: px(10) }}>{pills.map(pill)}</div>
  );
  const hint = props.hint && words(props.hint, px(15), edge(inks.light, 85));

  const controls = (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: stack ? g : px(18) }}>
      {chips}
      {props.pick}
      {playRow}
      {below}
      {linkButton}
      {hint}
    </div>
  );

  const pad = Math.max(12, Math.min(40, box.h * (box.wide ? 0.035 : 0.03)));
  const head = props.head ?? 0;
  const top = (props.top ?? [0.06, 0.06])[box.wide ? 1 : 0] * box.h;
  const bottom = props.bottom ? props.bottom[box.wide ? 1 : 0] * box.h : pad * 1.4;

  const body = (
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
        boxSizing: "border-box",
        ...(stack
          ? { justifyContent: "flex-start", gap: g, padding: `${head ? head + g * 0.8 : top}px 0 ${pad}px` }
          : {
              justifyContent: column ? "center" : "space-between",
              gap: column ? box.h * 0.075 : 0,
              padding: `${pad}px 0 ${bottom}px`,
            }),
      }}
    >
      {/* A line of words straight under the heading sits close to it (the mock's 8px); anything else a full gap away. */}
      {!head && (stack ? <div style={{ marginBottom: props.tagline || props.result ? -g * 0.6 : 0 }}>{name}</div> : name)}
      {stack && props.tagline && words(props.tagline, px(15), inks.light)}
      {props.result && words(props.result, px(18), inks.gold, 700)}
      {ribbon}
      {tiles}
      {props.body}
      {stack ? (
        <>
          {chips}
          {props.pick}
          {playRow}
          {below}
          {linkButton}
          {hint}
        </>
      ) : (
        controls
      )}
    </div>
  );

  return (
    <div
      ref={ref}
      role="group"
      aria-label={props.label}
      style={{
        position: "absolute",
        inset: 0,
        zIndex: 5,
        borderRadius: 14,
        overflow: "hidden",
        background: props.cover ?? "var(--stage-cover)",
        color: inks.light,
        fontFamily: FONT,
        ["--title-head" as string]: `${head}px`,
      }}
    >
      {box.w > 0 && children?.(box)}
      {box.w > 0 && props.scrim && <div aria-hidden="true" style={{ position: "absolute", inset: 0, background: props.scrim }} />}
      {box.w > 0 && head > 0 && (
        <div style={{ position: "absolute", top: 0, insetInlineStart: 0, width: colW, height: head, display: "flex", alignItems: "center", justifyContent: "center" }}>
          {name}
        </div>
      )}
      {box.w > 0 && body}
    </div>
  );
}
