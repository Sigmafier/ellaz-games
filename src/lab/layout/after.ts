/**
 * THE AFTER - a class's target layout drawn over the REAL game, then measured.
 *
 * Nothing is cloned and no game is edited: the lab moves the page's own nodes
 * inside its own iframe and hands the board back the height the moved row was
 * costing it, through the same `--b-chrome` the board is sized by. Measured
 * 2026-09-27 on sudoku: 384 -> 444px at 1536x639, 825 -> 884 at 1920x1080,
 * the row fully on screen in its new column.
 *
 * It is a PREVIEW of the layout the operator ruled (2026-09-27), so the next
 * plan step can ship it in GameChrome with the gain already a number:
 *   outside  PC: difficulty + numbers in the empty column beside the board.
 *            phone: numbers in a band joined to the board's top edge.
 *   onGame   numbers ON the board's top edge, every screen.
 */
import type { LayoutClass } from "./types";

const PC = "(min-width: 900px)";
const BAND_H = 44;

/** The height the numbers row costs the board today, head top to surface top. */
function rowCost(doc: Document): number {
  const head = doc.querySelector(".gc-head");
  const surf = doc.querySelector(".ellaz-play-surface");
  if (!head || !surf) return 0;
  return Math.max(0, Math.round(surf.getBoundingClientRect().top - head.getBoundingClientRect().top));
}

/** Give the board back `px` of height, if it is a board that is sized by --b-chrome. */
function refund(doc: Document, px: number): void {
  const board = doc.querySelector<HTMLElement>(".ellaz-board");
  const ch = board ? parseFloat(board.style.getPropertyValue("--b-chrome")) : NaN;
  if (board && !Number.isNaN(ch)) board.style.setProperty("--b-chrome", `${Math.max(0, ch - px)}px`);
  doc.defaultView?.dispatchEvent(new Event("resize"));
}

function sheet(doc: Document, css: string): void {
  const tag = doc.createElement("style");
  tag.dataset.layoutAfter = "";
  tag.textContent = css;
  doc.head.appendChild(tag);
}

/** outside, on a PC: the row moves into column 1 - into the picker column when there is one. */
function outsidePc(doc: Document): void {
  const cost = rowCost(doc);
  const head = doc.querySelector(".gc-head");
  const side = doc.querySelector(".ellaz-game-side > div");
  if (!head || !doc.querySelector(".gc-cols")) return;
  if (side) side.prepend(head);
  // Every column is pinned to row 2: with the row gone from row 1, the footer
  // (which has a column but no row) auto-placed INTO the empty row 1, and
  // fitColumns scaled sudoku's keypad to a sliver to fit it (2026-09-27).
  sheet(doc, `.gc-cols>.gc-head{grid-column:1!important;grid-row:2!important;align-self:center;padding:12px 16px}
    .gc-cols>.ellaz-game-footer,.gc-cols>.ellaz-game-side{grid-row:2!important}
    .gc-head .gc-row{grid-template-columns:1fr!important}`);
  refund(doc, cost);
}

/** The band: the row, board-wide, on the board's top edge, in the board's own dark. */
function band(doc: Document, over: boolean): void {
  const cost = rowCost(doc);
  const head = doc.querySelector<HTMLElement>(".gc-head");
  const board = doc.querySelector<HTMLElement>(".ellaz-board, #game-frame canvas");
  if (!head || !board) return;
  const w = Math.round(board.getBoundingClientRect().width);
  // Joined to the board, not left at the top of the panel: the row moves to sit
  // directly before the board in its own container, and becomes a BAND - the
  // class the harvester reads a band by, so it is no longer "above".
  head.classList.add("ellaz-band");
  const at = doc.querySelector(".ellaz-board") ?? doc.querySelector(".ellaz-play-surface > *");
  at?.parentElement?.insertBefore(head, at);
  sheet(doc, `.gc-head{width:${w}px;max-width:100%;margin:0 auto!important;padding:0!important;height:${BAND_H}px;overflow:hidden}
    .gc-head .gc-row{height:${BAND_H}px;gap:0!important;background:#171b3a;border-radius:14px 14px 0 0}
    .gc-head .gc-cell{background:transparent!important;box-shadow:none!important;color:#f5f6ff!important;height:${BAND_H}px!important}
    ${over ? `.gc-head{position:relative;z-index:3;margin-bottom:-${BAND_H}px!important}` : ""}`);
  refund(doc, over ? cost : Math.max(0, cost - BAND_H));
}

/** Draw the class's target layout over the page in `doc`. */
export function applyAfter(doc: Document, cls: LayoutClass): void {
  const pc = doc.defaultView?.matchMedia(PC).matches ?? false;
  if (cls === "outside") (pc ? outsidePc(doc) : band(doc, false));
  else band(doc, true);
}
