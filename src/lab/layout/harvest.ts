/**
 * THE LAYOUT LAB'S ONE INSTRUMENT - reads a live game page into a `Report`.
 *
 * One reader, two callers: the lab runs it inside its iframes, and
 * `assert:layout` opens the lab in Playwright and reads the lab's results, so
 * the page and the gate cannot measure two different things. The three repro
 * scripts each carried their own copy of this logic; the clip and in-play rules
 * below are theirs (`repro-controls-stay-on-screen.mjs`), moved, not re-invented.
 *
 * It only READS. Nothing here resizes, scrolls or restyles, because a scaled
 * frame measured while it is being changed answers a question nobody asked
 * (`a-canvas-that-measures-its-own-box-cannot-see-a-transform-on-it.md`).
 */
import type { Box, Item, Place, Region, Report, Role } from "./types";

/** The bars, by the selectors the labelled page named (2026-09-27). */
export const REGIONS: Record<Region, string> = {
  bar: ".top",
  tools: ".urow",
  row: ".gc-head:not(.ellaz-band)",
  side: ".ellaz-game-side",
  footer: ".ellaz-game-footer",
  strip: ".ellaz-end-strip",
  band: ".snake-band, .ellaz-band",
  panel: ".ellaz-game-panel",
  surface: ".ellaz-play-surface",
};

const CONTROLS =
  "button, a[href], input, select, textarea, [role=button], [role=slider], [role=radio], [tabindex]:not([tabindex='-1'])";
/** Number cells a player reads but never taps. */
const READOUTS = ".gc-stat:not(.gc-slot-empty), .snake-band > *, .ellaz-band > *";
/** Within this many px a box is on screen - sub-pixel layout is not a defect. */
const TOL = 2;

const toBox = (r: DOMRect): Box => ({ x: Math.round(r.x), y: Math.round(r.y), w: Math.round(r.width), h: Math.round(r.height) });

function shown(el: Element, win: Window): DOMRect | null {
  const r = el.getBoundingClientRect();
  if (r.width < 2 || r.height < 2) return null;
  for (let n: Element | null = el; n; n = n.parentElement) {
    const cs = win.getComputedStyle(n);
    if (cs.display === "none" || cs.visibility === "hidden" || cs.opacity === "0") return null;
  }
  return r;
}

function placeOf(el: Element): Place {
  const order: [string, Place][] = [
    [REGIONS.bar, "bar"], [REGIONS.tools, "tools"], [REGIONS.band, "band"], [REGIONS.row, "row"],
    [REGIONS.side, "side"], [REGIONS.footer, "footer"], [REGIONS.strip, "strip"],
    [`${REGIONS.surface}, #game-frame`, "board"],
  ];
  return order.find(([sel]) => el.closest(sel))?.[1] ?? "page";
}

function labelOf(el: Element): string {
  return (el.getAttribute("aria-label") || el.textContent || "").replace(/\s+/g, " ").trim().slice(0, 40);
}

function roleOf(el: Element, place: Place, label: string): Role {
  if (place === "bar" || place === "tools") return "platform";
  if (el.closest(".gc-level")) return "difficulty";
  if (el.closest(".gc-stat") || place === "band") return "number";
  if (/restart|play again|new game/i.test(label)) return "restart";
  return label ? "action" : "unknown";
}

/**
 * How far an ancestor's clip hides `r`, or "in-play" when the clip belongs to
 * the play surface - a balloon rising from under the arena is the game working.
 */
function clipOf(el: Element, r: DOMRect, win: Window, surface: Element | null): number | "in-play" {
  for (let m: Element = el, n = el.parentElement; n && n !== el.ownerDocument.body; m = n, n = n.parentElement) {
    if (win.getComputedStyle(m).position === "fixed") break; // a fixed box escapes every clip above it
    const cs = win.getComputedStyle(n);
    if (cs.overflowX === "visible" && cs.overflowY === "visible") continue;
    const a = n.getBoundingClientRect();
    const he = n as HTMLElement;
    const left = a.left + parseFloat(cs.borderLeftWidth);
    const top = a.top + parseFloat(cs.borderTopWidth);
    const sx = he.offsetWidth ? a.width / he.offsetWidth : 1;
    const sy = he.offsetHeight ? a.height / he.offsetHeight : 1;
    const hidden = Math.max(left - r.left, r.right - (left + n.clientWidth * sx), top - r.top, r.bottom - (top + n.clientHeight * sy));
    if (hidden > TOL) return surface && surface !== n && surface.contains(n) ? "in-play" : Math.round(hidden);
  }
  return 0;
}

function itemsOf(doc: Document, win: Window): { items: Item[]; inPlay: number } {
  const roots = [REGIONS.bar, REGIONS.tools, REGIONS.panel, REGIONS.strip].flatMap((s) => [...doc.querySelectorAll(s)]);
  const taps = new Set(roots.flatMap((r) => [...r.querySelectorAll(CONTROLS)]));
  const reads = roots.flatMap((r) => [...r.querySelectorAll(READOUTS)]).filter((el) => !taps.has(el) && !el.querySelector(CONTROLS));
  const surface = doc.querySelector(REGIONS.surface);
  const vw = doc.documentElement.clientWidth;
  const vh = win.innerHeight;
  const items: Item[] = [];
  let inPlay = 0;
  for (const el of [...taps, ...reads]) {
    const r = shown(el, win);
    if (!r) continue;
    const clip = clipOf(el, r, win, surface);
    if (clip === "in-play") { inPlay++; continue; }
    const past = Math.max(-r.left, r.right - vw, -r.top, r.bottom - vh);
    const place = placeOf(el);
    const label = labelOf(el);
    const state = clip > 0 ? "cut" : past > TOL ? "off" : "ok";
    items.push({ label, role: roleOf(el, place, label), place, box: toBox(r), tap: taps.has(el), state, hidden: Math.max(clip, Math.round(past), 0) });
  }
  return { items, inPlay };
}

function boardOf(doc: Document): Pick<Report, "board" | "boardFrom"> {
  const frame = doc.getElementById("game-frame");
  const pick: [Element | null | undefined, NonNullable<Report["boardFrom"]>][] = [
    [frame?.querySelector(".ellaz-board"), "board"],
    [frame?.querySelector("canvas"), "canvas"],
    [doc.querySelector(REGIONS.surface), "surface"],
  ];
  const hit = pick.find(([el]) => el);
  return hit ? { board: toBox(hit[0]!.getBoundingClientRect()), boardFrom: hit[1] } : { board: null };
}

function scaleOf(doc: Document, win: Window): number {
  const frame = doc.getElementById("game-frame");
  const tf = frame ? win.getComputedStyle(frame).transform : "none";
  return tf === "none" ? 1 : Number(tf.match(/matrix\(([\d.]+)/)?.[1] ?? 1);
}

/** Read one game page. Never throws: a page it cannot read is a Report with `error`. */
export function harvest(doc: Document): Report {
  const win = doc.defaultView;
  const empty: Report = { vw: 0, vh: 0, scale: 1, regions: {}, board: null, items: [], inPlay: 0 };
  if (!win) return { ...empty, error: "no window" };
  if (!doc.querySelector(REGIONS.panel)) return { ...empty, vw: win.innerWidth, vh: win.innerHeight, error: "no .ellaz-game-panel on this page" };
  const regions: Report["regions"] = {};
  for (const [k, sel] of Object.entries(REGIONS) as [Region, string][]) {
    const el = doc.querySelector(sel);
    const r = el && shown(el, win);
    if (r) regions[k] = toBox(r);
  }
  const { items, inPlay } = itemsOf(doc, win);
  return { vw: doc.documentElement.clientWidth, vh: win.innerHeight, scale: scaleOf(doc, win), regions, ...boardOf(doc), items, inPlay };
}
