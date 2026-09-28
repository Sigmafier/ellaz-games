import type { ButtonHTMLAttributes, CSSProperties, ReactNode } from "react";
import { K, type Setting } from "./kinds";

/**
 * A KEY - one button of a game's own keypad or keyboard, drawn from the key
 * kind (games-doctrine G8; the kit is ./kinds.ts). Sudoku's digits and Word
 * Guess's letters are the same kind, so a theme that restyles one restyles
 * both, and a new keypad is this component rather than another hand-styled
 * button.
 *
 * The game says only what is not a look: how big the glyph is (`size`, its
 * Day size - a theme may set `--key-size` over it) and whether the key is an
 * ACTION (erase, delete) or GO (check). Everything a key wears - fill, ink,
 * edge, shape, shadow, type, tilt, how it moves under a press - is a setting.
 * A key the game has to colour for a reason (a letter already placed) passes
 * `style`, and an inline colour beats every theme, as game state must.
 *
 * On the table, the tray hands its keys the tray-key-* values through
 * --key-bg / --key-ink / --key-radius / --key-shadow (GameTable.tsx); off it,
 * these fallbacks are Day's.
 *
 * The rules are injected once, from this module, so a standalone bundle (no
 * page stylesheet) draws its keys the same as the site does.
 */
const at = (n: number, of: number) => `.ellaz-key:nth-child(${of}n+${n})`;
/** A theme may run a setting through the keys in a cycle of 2, 3 or 4. */
const CYCLES: [number, "a" | "b" | "c" | "d", Setting[]][] = [
  [4, "a", ["key-bg-4a", "key-tilt-4a"]], [4, "b", ["key-bg-4b", "key-tilt-4b"]],
  [4, "c", ["key-bg-4c", "key-tilt-4c"]], [4, "d", ["key-bg-4d", "key-tilt-4d"]],
  [3, "a", ["key-bg-3a"]], [3, "b", ["key-bg-3b"]], [3, "c", ["key-bg-3c"]],
  [2, "a", ["key-tilt-2a"]], [2, "b", ["key-tilt-2b"]],
];
const cycleCss = CYCLES.map(([of, slot, names]) => {
  const n = "abcd".indexOf(slot) + 1;
  const sel = n === of ? `.ellaz-key:nth-child(${of}n)` : at(n, of);
  return `${sel}{${names.map((s) => `--kc-${s.startsWith("key-bg") ? "bg" : "tilt"}${of}:var(--${s})`).join(";")}}`;
}).join("\n");

const FILL = `var(--kc-bg4,var(--kc-bg3,${K("key-bg", "var(--k-fill,var(--surface))")}))`;
const SHADOW = K("key-shadow", "var(--k-shadow,var(--shadow-1))");
const INK = K("key-ink", "var(--text)");

/** Exported for the kit test, which reads what this emits. */
export const KEY_CSS = `
${cycleCss}
.ellaz-key{border:${K("key-edge", "none")};border-radius:${K("key-radius", "10px")};background:${FILL};
 box-shadow:${SHADOW};color:${INK};font-family:${K("key-font", "inherit")};font-weight:${K("key-weight", "var(--k-weight,800)")};
 font-size:${K("key-size", "var(--k-size)")};clip-path:${K("key-clip", "none")};transition:${K("key-motion", "0s")};
 rotate:var(--kc-tilt4,var(--kc-tilt2,${K("key-tilt", "none")}))}
.ellaz-key-act{--k-fill:var(--surface-2);--k-shadow:none;--k-weight:normal;font-size:${K("key-size-act", K("key-size", "var(--k-size)"))}}
.ellaz-key-go,.ellaz-key-go:hover{background:${K("key-go-fill", "var(--brand-fill)")};color:${K("key-go-ink", "var(--on-brand)")}}
.ellaz-key:hover{background:${K("key-bg-hover", FILL)}}
.ellaz-key:active{translate:${K("key-press", "none")};scale:${K("key-squash", "none")};
 box-shadow:${K("key-shadow-down", SHADOW)};color:${K("key-ink-down", INK)}}
@media (prefers-reduced-motion:reduce){.ellaz-key{transition:0s}}`;

let injected = false;
function injectKeyCss(): void {
  if (injected || typeof document === "undefined") return;
  injected = true;
  const tag = document.createElement("style");
  tag.dataset.keyKit = "";
  tag.textContent = KEY_CSS;
  document.head.appendChild(tag);
}

type KeyProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  /** The glyph's Day size in px. */
  size: number;
  /** An action key (erase, delete): the second fill, no shadow, a plain glyph. */
  act?: boolean;
  /** The key that sends (check): the brand fill. */
  go?: boolean;
  children: ReactNode;
};

export function Key({ size, act, go, className, style, children, ...rest }: KeyProps) {
  injectKeyCss();
  const cls = ["ellaz-key", act && "ellaz-key-act", go && "ellaz-key-go", className].filter(Boolean).join(" ");
  return (
    <button type="button" {...rest} className={cls} style={{ "--k-size": `${size}px`, ...style } as CSSProperties}>
      {children}
    </button>
  );
}
