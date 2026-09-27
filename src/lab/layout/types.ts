/**
 * THE LAYOUT LAB'S VOCABULARY - what one game page looks like to the lab.
 *
 * `harvest.ts` fills a `Report` from a live document and `classify.ts` judges
 * it. Nothing in here touches the DOM, so the judging half is a pure function
 * a test can drive from hand-built boxes, and the lab and `assert:layout` read
 * the same shape (see `.claude/rules/a-gate-that-measures-the-board-cannot-see-the-controls.md`).
 */

/** A rendered box in the viewport's CSS px - what a player's finger meets. */
export type Box = { x: number; y: number; w: number; h: number };

/** The four screens the operator ruled, 2026-09-27. Real sizes, never scaled. */
export const SCREENS = [
  { id: "phone", w: 390, h: 844 },
  { id: "tablet", w: 820, h: 1180 },
  { id: "laptop", w: 1536, h: 639 },
  { id: "desktop", w: 1920, h: 1080 },
] as const;
export type ScreenId = (typeof SCREENS)[number]["id"];

/** The bars of a game page, named as on the labelled page the operator confirmed. */
export type Region = "bar" | "tools" | "row" | "side" | "footer" | "strip" | "band" | "panel" | "surface";

/** Where a thing sits. `board` is on the game itself; `page` is anywhere else. */
export type Place = "bar" | "tools" | "row" | "side" | "footer" | "strip" | "band" | "board" | "page";

/** What a thing is FOR. `unknown` is a state the lab shows, never folds into fine. */
export type Role = "difficulty" | "number" | "platform" | "restart" | "action" | "unknown";

export interface Item {
  label: string;
  role: Role;
  place: Place;
  box: Box;
  /** A readout (a number cell) is shown, not tapped, so the tap floor skips it. */
  tap: boolean;
  /** `ok`, or cut by an ancestor's clip, or past the window's edge. */
  state: "ok" | "cut" | "off";
  hidden: number;
}

export interface Report {
  vw: number;
  vh: number;
  /** fitStage's scale on #game-frame: 1 is unscaled. */
  scale: number;
  regions: Partial<Record<Region, Box>>;
  board: Box | null;
  /** Where the board box came from. `surface` means the game marks no board on
   *  this screen (15 of 45 on a phone, 2026-09-27) and its play surface stood in. */
  boardFrom?: "board" | "canvas" | "surface";
  items: Item[];
  /** Things the BOARD clips - game objects entering play, dropped from `items`. */
  inPlay: number;
  error?: string;
}

/** The two layout classes (operator ruling 2026-09-27). */
export type LayoutClass = "onGame" | "outside";
