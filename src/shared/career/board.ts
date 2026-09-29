// The BOARD map's geometry: a grid of numbered level tiles for a puzzle game
// with many levels (the operator's pick C, 2026-09-29).
//
// It picks the column count that makes the tiles as big as possible while the
// whole grid fits the box. When no column count can fit every level at a
// tappable size, it keeps the widest grid whose tiles are still tappable and
// lets the page scroll down instead - never a tile under BOARD_MIN_TILE.
//
// Pure: a count and a box in, tile corners out. board.test.ts holds every tile
// inside the box at 1536x639 and 390x844 for up to a hundred levels.

import type { Box } from "./trail";

export interface BoardInsets { top: number; bottom: number; side: number }

/** a tap target a child can hit, and a cap so four levels do not become four billboards */
export const BOARD_MIN_TILE = 56;
export const BOARD_MAX_TILE = 120;
const GAP = 12;

/** the top bar's room, and a margin at the bottom and sides */
export const BOARD_INSETS: BoardInsets = { top: 76, bottom: 24, side: 16 };

export interface BoardLayout {
  cols: number;
  rows: number;
  size: number;
  gap: number;
  /** the content's size: the box, or taller when the grid scrolls */
  width: number;
  height: number;
  insets: BoardInsets;
  /** each tile's top-left corner, in play order, reading across then down */
  tiles: { x: number; y: number }[];
}

function sizeFor(count: number, cols: number, w: number, h: number): number {
  const rows = Math.ceil(count / cols);
  return Math.min(BOARD_MAX_TILE, (w - (cols - 1) * GAP) / cols, (h - (rows - 1) * GAP) / rows);
}

/** the fitting grid with the biggest tiles, or null when nothing fits at a tappable size */
function bestFit(count: number, w: number, h: number): number | null {
  let best: number | null = null;
  let bestSize = 0;
  for (let cols = 1; cols <= count; cols++) {
    const s = sizeFor(count, cols, w, h);
    if (s >= BOARD_MIN_TILE && s > bestSize + 1e-9) { best = cols; bestSize = s; }
  }
  return best;
}

export function boardLayout(count: number, box: Box, insets: BoardInsets = BOARD_INSETS): BoardLayout {
  if (!Number.isInteger(count) || count < 1) throw new Error(`boardLayout needs at least one level, got ${count}`);
  if (!(box.width > 0) || !(box.height > 0)) throw new Error(`boardLayout needs a box with a size, got ${box.width}x${box.height}`);
  const w = box.width - 2 * insets.side;
  const h = box.height - insets.top - insets.bottom;
  const fit = bestFit(count, w, h);
  // no fit: as many columns as keep a tile tappable, and scroll down
  const cols = fit ?? Math.max(1, Math.min(count, Math.floor((w + GAP) / (BOARD_MIN_TILE + GAP))));
  const rows = Math.ceil(count / cols);
  const size = Math.floor(fit !== null ? sizeFor(count, cols, w, h) : Math.min(BOARD_MAX_TILE, (w - (cols - 1) * GAP) / cols));
  const gridW = cols * size + (cols - 1) * GAP;
  const gridH = rows * size + (rows - 1) * GAP;
  const height = Math.max(box.height, insets.top + gridH + insets.bottom);
  const x0 = insets.side + (w - gridW) / 2;
  const y0 = fit !== null ? insets.top + (h - gridH) / 2 : insets.top;
  const tiles = Array.from({ length: count }, (_, i) => ({ x: x0 + (i % cols) * (size + GAP), y: y0 + Math.floor(i / cols) * (size + GAP) }));
  return { cols, rows, size, gap: GAP, width: box.width, height, insets, tiles };
}
