/**
 * THE WALK - every game on every screen, through ONE hidden iframe.
 *
 * One frame, reused, because 33 live iframes once froze the browser
 * (`Buttons.tsx`'s wall went to one for that reason). The frame is sized to
 * the REAL screen and never scaled: a phone layout is a media query on the
 * frame's own width, so a frame drawn smaller than the phone renders the PC
 * layout and every number from it describes a page nobody sees. Measured
 * 2026-09-27: `matchMedia` and 100dvh inside the frame equal its own box.
 */
import { GAMES as ROSTER } from "../../portal/games";
import { harvest } from "./harvest";
import { SCREENS, type Report, type ScreenId } from "./types";

/** The population, from the roster and nothing else - pinned by `the-bench-sees-every-game.test.ts`. */
export const GAMES: string[] = ROSTER.map((g) => g.id);

/** What the lab does to a page before reading it: nothing, or the AFTER for one class. */
export type Prepare = (doc: Document) => void | Promise<void>;

/** The consent bar covers the bottom of every first visit; the lab is not measuring it. */
const LAB_CSS = ".consent{display:none!important}";
const TIMEOUT = 8000;
const SETTLE = 400;

const wait = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));
const sig = (r: Report) => (r.board ? `${r.board.w}x${r.board.h}@${r.scale}` : `none@${r.scale}`);

/**
 * The NEW document, ready. `old` is the one the frame held before `src` moved:
 * right after the assignment the frame still hands back the previous page -
 * complete, with a panel - and reading it returned "no window" once it unloaded
 * (3 of 4 frames on 2026-09-27, and the flaky vanish row before that).
 */
async function ready(f: HTMLIFrameElement, old: Document | null, deadline: number): Promise<Document | null> {
  while (Date.now() < deadline) {
    const doc = f.contentDocument;
    if (doc && doc !== old && doc.readyState === "complete" && doc.querySelector(".ellaz-game-panel") && doc.getElementById("game-frame"))
      return doc;
    await wait(100);
  }
  return null;
}

/**
 * Load one game at one screen and read it once the page stops moving: two
 * reads SETTLE ms apart must agree, or the number belongs to a moment that no
 * longer exists (the same guard `repro-board-fills-the-window.mjs` carries).
 */
export async function readOne(f: HTMLIFrameElement, id: string, screen: ScreenId, prepare?: Prepare): Promise<Report> {
  const s = SCREENS.find((x) => x.id === screen)!;
  f.style.width = `${s.w}px`;
  f.style.height = `${s.h}px`;
  const old = f.contentDocument;
  f.src = `${import.meta.env.BASE_URL}games/${id}/`;
  const doc = await ready(f, old, Date.now() + TIMEOUT);
  if (!doc) return { vw: s.w, vh: s.h, scale: 1, regions: {}, board: null, items: [], inPlay: 0, error: `not loaded in ${TIMEOUT / 1000}s` };
  const tag = doc.createElement("style");
  tag.textContent = LAB_CSS;
  doc.head.appendChild(tag);
  await wait(300);
  if (prepare) await prepare(doc);
  let a = harvest(doc);
  for (let i = 0; i < 5; i++) {
    await wait(SETTLE);
    const b = harvest(doc);
    if (sig(a) === sig(b)) return b;
    a = b;
  }
  return { ...a, error: "page never settled" };
}

const cache = new Map<string, Report>();
export const cacheKey = (id: string, screen: ScreenId, variant: string) => `${variant}|${id}|${screen}`;

/** One game, one screen, cached for the session; a failed read is retried once and never cached. */
export async function read(f: HTMLIFrameElement, id: string, screen: ScreenId, variant = "now", prepare?: Prepare): Promise<Report> {
  const k = cacheKey(id, screen, variant);
  const hit = cache.get(k);
  if (hit) return hit;
  let r = await readOne(f, id, screen, prepare);
  if (r.error) r = await readOne(f, id, screen, prepare);
  if (!r.error) cache.set(k, r);
  return r;
}

export type Row = { id: string; screen: ScreenId; report: Report };

/** Walk every game x every screen, one at a time, handing each row back as it lands. */
export async function walk(
  f: HTMLIFrameElement,
  onRow: (row: Row) => void,
  opts: { ids?: string[]; screens?: ScreenId[]; variant?: string; prepare?: (id: string) => Prepare | undefined; stop?: () => boolean } = {},
): Promise<Row[]> {
  const rows: Row[] = [];
  for (const screen of opts.screens ?? SCREENS.map((s) => s.id)) {
    for (const id of opts.ids ?? GAMES) {
      if (opts.stop?.()) return rows;
      const report = await read(f, id, screen, opts.variant, opts.prepare?.(id));
      const row = { id, screen, report };
      rows.push(row);
      onRow(row);
    }
  }
  return rows;
}
