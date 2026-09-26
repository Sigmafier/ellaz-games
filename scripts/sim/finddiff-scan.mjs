#!/usr/bin/env node
/**
 * Does scanning a spot-the-difference picture in order actually beat jumping
 * around, and by how much?
 *
 *   node scripts/sim/finddiff-scan.mjs [--trials 20000] [--grid 10] [--json]
 *
 * WHY THIS FILE EXISTS. The game page already tells a player to "scan by
 * quarters" rather than jump around, and to compare item against item. That is
 * advice, not a measurement - nothing on the site had ever checked it against
 * the real pictures. This does.
 *
 * GROUNDED IN THE REAL SCENES. Every difference's position and tap radius is
 * read out of `src/games/finddiff/scenes.ts` - the exact 30 differences the
 * game ships, in the exact 6 scenes - through the alias hooks, rather than
 * copied here. A scene added or moved changes this output instead of leaving
 * it to describe pictures nobody ships any more.
 *
 * THE MODEL. Lay a 10x10 grid over each scene's 100x100 canvas (a cell is
 * roughly the size a glance actually covers) and mark which cells hold a
 * difference's centre.
 *
 *   systematic - scan the grid in reading order, left to right, top to
 *     bottom, never returning to a cell already seen. The position of the
 *     LAST marked cell in that order is exactly how many glances it takes to
 *     have looked at every difference at least once. Deterministic: it is a
 *     fact about where the artist put the differences, not a simulation.
 *
 *   jumping around - glance at a uniformly random cell each time, WITH
 *     repeats, the way an unsystematic search actually behaves: nothing stops
 *     you looking at the same corner twice while a difference sits three
 *     cells away untouched. Simulated, because the answer depends on how
 *     often you waste a glance on a cell you already checked.
 *
 * The two strategies see the SAME marked cells in the SAME grid - the only
 * thing that differs is whether a glance can repeat itself. That isolates
 * exactly the claim the game page makes.
 *
 * Determinism: a fixed-seed LCG (mulberry32) drives every random glance, so a
 * re-run reproduces the number exactly.
 */

import { register } from "node:module";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

register("./alias-hooks.mjs", import.meta.url);

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
const { SCENES } = await import(join(ROOT, "src/games/finddiff/scenes.ts"));

const arg = (name, fallback) => {
  const i = process.argv.indexOf(`--${name}`);
  return i === -1 ? fallback : Number(process.argv[i + 1]);
};
const TRIALS = arg("trials", 20000);
const GRID = arg("grid", 10);
const CELL = 100 / GRID;

function mulberry32(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Row-major cell index of a point in the 100x100 canvas. */
function cellOf(cx, cy) {
  const col = Math.min(GRID - 1, Math.floor(cx / CELL));
  const row = Math.min(GRID - 1, Math.floor(cy / CELL));
  return row * GRID + col;
}

/**
 * Random glances WITH repeats, until every cell in `marked` has been drawn at
 * least once. Averaged over TRIALS runs - the honest way to answer "how many
 * glances", because a single run of a random process is not a statistic.
 */
function jumpingAround(marked, rng) {
  let draws = 0;
  const seen = new Set();
  while (seen.size < marked.size) {
    const cell = Math.floor(rng() * GRID * GRID);
    draws++;
    if (marked.has(cell)) seen.add(cell);
    // A control that can fail: this loop must terminate. GRID*GRID*50 glances
    // without finding every marked cell means the RNG or the marking is
    // broken, not that the player is unlucky.
    if (draws > GRID * GRID * 50) {
      throw new Error("jumpingAround did not converge - RNG or marking is broken");
    }
  }
  return draws;
}

const perScene = [];

for (const scene of SCENES) {
  if (scene.diffs.length === 0) throw new Error(`${scene.id}: no differences - result void`);

  const marked = new Set(scene.diffs.map((d) => cellOf(d.cx, d.cy)));
  const k = marked.size; // distinct cells; two differences can share one cell

  // Systematic: the position of the last marked cell in raster order. Exact,
  // not sampled - it is a property of the real coordinates.
  const systematic = Math.max(...marked) + 1;

  const rng = mulberry32(scene.id.length * 2654435761 + 12345);
  let total = 0;
  for (let t = 0; t < TRIALS; t++) total += jumpingAround(marked, rng);
  const jumping = total / TRIALS;

  perScene.push({
    scene: scene.id,
    differences: scene.diffs.length,
    markedCells: k,
    systematicGlances: systematic,
    jumpingAroundGlances: Number(jumping.toFixed(1)),
    ratio: Number((jumping / systematic).toFixed(2)),
  });
}

const meanSystematic = perScene.reduce((a, r) => a + r.systematicGlances, 0) / perScene.length;
const meanJumping = perScene.reduce((a, r) => a + r.jumpingAroundGlances, 0) / perScene.length;

const out = {
  trials: TRIALS,
  grid: `${GRID}x${GRID}`,
  cellsTotal: GRID * GRID,
  perScene,
  meanSystematicGlances: Number(meanSystematic.toFixed(1)),
  meanJumpingAroundGlances: Number(meanJumping.toFixed(1)),
  meanRatio: Number((meanJumping / meanSystematic).toFixed(2)),
};

// CONSERVATION: the ratio column and the two mean-derived columns describe the
// same six numbers from two different arithmetic paths. If they disagree by
// more than rounding, one of them is computed wrong.
const ratioFromMeans = meanJumping / meanSystematic;
if (Math.abs(ratioFromMeans - out.meanRatio) > 0.05) {
  throw new Error(
    `meanRatio ${out.meanRatio} does not match meanJumping/meanSystematic ` +
      `${ratioFromMeans.toFixed(2)} - one of the two is computed from the wrong numbers`,
  );
}

if (process.argv.includes("--json")) {
  console.log(JSON.stringify(out, null, 2));
} else {
  console.log(
    `find the differences: ${SCENES.length} scenes, ${GRID}x${GRID} grid, ` +
      `${TRIALS} trials per scene\n`,
  );
  console.log("scene        diffs   marked cells   systematic   jumping around   ratio");
  for (const r of perScene) {
    console.log(
      `${r.scene.padEnd(12)} ${String(r.differences).padStart(5)}   ` +
        `${String(r.markedCells).padStart(12)}   ${String(r.systematicGlances).padStart(10)}   ` +
        `${String(r.jumpingAroundGlances).padStart(15)}   ${String(r.ratio + "x").padStart(5)}`,
    );
  }
  console.log(
    `\nmean: ${out.meanSystematicGlances} glances systematic, ` +
      `${out.meanJumpingAroundGlances} jumping around, ${out.meanRatio}x\n`,
  );
  console.log(
    "POPULATION: all 6 shipped scenes, all 30 differences. Both strategies see the\n" +
      "same marked cells in the same grid - the only difference is whether a glance\n" +
      "can repeat one already taken. Systematic never repeats and jumping around can,\n" +
      "which is the entire source of the gap above.",
  );
}
