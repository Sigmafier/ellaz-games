/**
 * THE LAYOUT LAB'S JUDGE - pure, so a test can drive it and the lab and
 * `assert:layout` cannot disagree about what a page means.
 *
 * `harvest.ts` reads boxes off a live page; this turns them into the numbers
 * the lab paints and the four flags the operator ruled on 2026-09-27: wasted
 * screen, buttons above the board, the same control somewhere else from game
 * to game, and controls cut off or too small to hit.
 */
import type { Box, Item, LayoutClass, Place, Report, Role, ScreenId } from "./types";

export type Flag = "wasted" | "above" | "cut" | "small" | "error";

export interface Metrics {
  /** Board area over the WINDOW's area. Null when no board was read. */
  boardArea: number | null;
  boardWidth: number | null;
  boardHeight: number | null;
  /** Height of the game's own rows sitting above the board - the cost of "buttons above". */
  aboveBoard: number;
  /** Height of the platform tool row above the board, reported apart from the game's. */
  toolsAbove: number;
  /** Window height under the lowest thing on the page - a phone's unused height. */
  emptyBelow: number;
  /** Tappable things THE GAME owns under the tap floor. */
  small: Item[];
  cut: Item[];
  /** The site's own bar and tool row, cut or small - one finding for every page,
   *  so it is reported once and never counted as 47 games' defects. On
   *  2026-09-27 the breadcrumb pill clipped its Home and Classics links by 12px
   *  on all 47, and folding that in made "cut" fire on every game. */
  platform: Item[];
}

export interface Thresholds {
  /** Board area below this share of the window is wasted screen, per screen. */
  areaFloor: Record<ScreenId, number>;
  /** Empty height under the page above this is wasted screen. */
  emptyBelowMax: number;
  /** WCAG 2.2 target size; the operator's floor for anything a finger must hit. */
  tapFloor: number;
}

/**
 * RULED by the operator 2026-09-27, off the measured spread of 47 games
 * (median board share of the window: phone 41%, tablet 24%, laptop 15%,
 * desktop 33%; median empty height under a tablet page 415px). Fixed floors
 * rather than "the worst quarter", so the count falls as layouts get fixed:
 * on the day they flagged 10/45/34/16 of 46-47 games.
 */
export const THRESHOLDS: Thresholds = {
  areaFloor: { phone: 0.35, tablet: 0.3, laptop: 0.2, desktop: 0.3 },
  emptyBelowMax: 80,
  tapFloor: 44,
};

const bottom = (b: Box) => b.y + b.h;
/** The site's bar and tool row are the platform's, not the game's. */
const isOwned = (i: Item) => i.place !== "bar" && i.place !== "tools";
const round = (n: number) => Math.round(n);

export function measure(r: Report, tapFloor = THRESHOLDS.tapFloor): Metrics {
  const b = r.board;
  const area = r.vw * r.vh;
  const above = (k: "row" | "strip" | "tools") => {
    const box = r.regions[k];
    return b && box && box.h > 0 && bottom(box) <= b.y + 1 ? round(box.h) : 0;
  };
  const shown = r.items.filter((i) => i.state !== "off");
  const owned = r.items.filter(isOwned);
  const lows = [
    ...(b ? [bottom(b)] : []),
    ...(["bar", "tools", "row", "side", "footer", "strip", "band"] as const).flatMap((k) => (r.regions[k] ? [bottom(r.regions[k]!)] : [])),
    ...shown.map((i) => bottom(i.box)),
  ];
  return {
    boardArea: b ? (b.w * b.h) / area : null,
    boardWidth: b ? b.w / r.vw : null,
    boardHeight: b ? b.h / r.vh : null,
    aboveBoard: above("row") + above("strip"),
    toolsAbove: above("tools"),
    emptyBelow: Math.max(0, round(r.vh - Math.max(0, ...lows))),
    small: owned.filter((i) => i.tap && Math.min(i.box.w, i.box.h) < tapFloor),
    cut: owned.filter((i) => i.state !== "ok"),
    platform: r.items.filter((i) => !isOwned(i) && (i.state !== "ok" || (i.tap && Math.min(i.box.w, i.box.h) < tapFloor))),
  };
}

export function flagsOf(r: Report, screen: ScreenId, t: Thresholds): Flag[] {
  if (r.error) return ["error"];
  const m = measure(r, t.tapFloor);
  const out: Flag[] = [];
  if ((m.boardArea !== null && m.boardArea < t.areaFloor[screen]) || m.emptyBelow > t.emptyBelowMax) out.push("wasted");
  if (m.aboveBoard > 0) out.push("above");
  if (m.cut.length) out.push("cut");
  if (m.small.length) out.push("small");
  return out;
}

/** The roles compared across games. Platform buttons are the site's, not a game's. */
const COMPARED: Role[] = ["difficulty", "number", "restart"];

export type Stray = { role: Role; place: Place; usual: Place };

/**
 * THE SAME CONTROL, SOMEWHERE ELSE. For each compared role, the usual place is
 * where most games on this screen put it; a game putting it anywhere else is a
 * stray. Ties go to the alphabetically first place, so the answer is stable.
 */
export function consistency(byGame: Record<string, Report>): Record<string, Stray[]> {
  const placeOf = (r: Report, role: Role) => r.items.find((i) => i.role === role)?.place;
  const usual = new Map<Role, Place>();
  for (const role of COMPARED) {
    const counts = new Map<Place, number>();
    for (const r of Object.values(byGame)) {
      const p = placeOf(r, role);
      if (p) counts.set(p, (counts.get(p) ?? 0) + 1);
    }
    const top = [...counts].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))[0];
    if (top) usual.set(role, top[0]);
  }
  const out: Record<string, Stray[]> = {};
  for (const [id, r] of Object.entries(byGame)) {
    out[id] = COMPARED.flatMap((role) => {
      const p = placeOf(r, role);
      const u = usual.get(role);
      return p && u && p !== u ? [{ role, place: p, usual: u }] : [];
    });
  }
  return out;
}

/**
 * A SUGGESTION, never a ruling: the operator rules each game's class (T11).
 * Every control the game owns (difficulty aside, which moves to the start card)
 * already on the board or its band means the game is a full-screen experience.
 */
export function suggestClass(r: Report): LayoutClass | null {
  if (!r.board || r.error) return null;
  const owned = r.items.filter((i) => i.tap && i.role !== "platform" && i.role !== "difficulty");
  return owned.every((i) => i.place === "board" || i.place === "band") ? "onGame" : "outside";
}
