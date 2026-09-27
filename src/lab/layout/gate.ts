/**
 * GATE MODE, at `#/lab/layout/gate`: walk everything, run the two controls,
 * and publish the result on `window.__layoutReport` for `scripts/assert-layout.mjs`.
 * No UI of its own beyond a progress line - the gate reads the object, not the page.
 */
import { flagsOf, measure, THRESHOLDS } from "./classify";
import { verdicts } from "./verdicts";
import { GAMES, readOne, walk } from "./walk";

declare global {
  interface Window {
    __layoutReport?: unknown;
  }
}

/** The planted defect: 150px pushed above sudoku's board. The gate must see it. */
const PLANT = (doc: Document) => {
  const tag = doc.createElement("style");
  tag.textContent = ".gc-head{padding-top:150px!important}";
  doc.head.appendChild(tag);
};

export async function runGate(f: HTMLIFrameElement, onProgress: (n: number) => void): Promise<void> {
  const t0 = Date.now();
  let n = 0;
  const rows = await walk(f, () => onProgress(++n));
  const planted = await readOne(f, "sudoku", "laptop", PLANT);
  const real = rows.find((r) => r.id === "sudoku" && r.screen === "laptop")?.report;
  const clean = rows.find((r) => r.id === "survivors" && r.screen === "laptop")?.report;
  const lite = (r: typeof planted | undefined) =>
    r ? { flags: flagsOf(r, "laptop", THRESHOLDS), above: measure(r).aboveBoard, error: r.error } : { flags: ["error"], above: 0, error: "missing" };
  window.__layoutReport = {
    games: GAMES,
    rows: verdicts(rows),
    controls: { planted: lite(planted), real: lite(real), clean: lite(clean) },
    ms: Date.now() - t0,
  };
}
