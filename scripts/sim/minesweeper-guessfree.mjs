#!/usr/bin/env node
/**
 * How often can a Minesweeper board be cleared by pure logic, with no guessing?
 *
 *   node scripts/sim/minesweeper-guessfree.mjs [--boards 2000] [--json]
 *
 * The single most useful thing a player can be told about this game, and the
 * one nobody can answer by reading the code. Everyone has lost a board to a
 * coin-flip and wondered whether they missed something. Usually they did not.
 *
 * Method: play each board with a solver that only ever makes moves it can
 * PROVE are safe, and stop the moment it has nothing provable left. Two rules,
 * both of which a human uses without naming them:
 *
 *   1. Single point - a revealed number whose unknown neighbours exactly equal
 *      its remaining mine count are all mines; if its mines are all flagged,
 *      every remaining neighbour is safe.
 *   2. Subset - if one number's unknown set is contained in another's, the
 *      difference resolves. This is the 1-2-1 wall pattern and its relatives.
 *
 * A solver with only these two rules is WEAKER than a perfect player: a full
 * constraint enumeration can crack some boards it cannot. So the number below
 * is a LOWER bound on guess-free boards, which is the honest direction to err
 * for a claim that guessing is rare. It is also close to how a person actually
 * plays, which makes it the more useful figure of the two.
 *
 * The real generator is used, through the alias hooks, so a retuned difficulty
 * changes this output instead of being contradicted by it. The first click is
 * always safe here exactly as in the game (`placeMines` bans the clicked cell
 * and its neighbours), so an opening loss is impossible and does not pollute
 * the count.
 *
 * --patterns ANSWERS A DIFFERENT QUESTION, and it was added for the Hebrew
 * guide at /he/guides/minesweeper-no-guessing/ (2026-09-21). The headline
 * figure above is already spent on the game page, and a guide re-quoting it
 * would be a second copy of that page rather than a page of its own.
 *
 * Two things the headline cannot say:
 *
 *   1. WHEN does logic run out? On a board the solver gets stuck on, what
 *      fraction of the safe squares had it already opened? A board that dies
 *      at 4% is a different experience from one that dies at 94%, and the
 *      difference is the whole advice: keep going, the guess is nearly always
 *      the last thing left.
 *   2. WHICH RULE does the work? Every square this solver opens or flags is
 *      credited to the rule that proved it - single point, or subset (the
 *      1-2-1 wall and its relatives). A player who learns only one of the two
 *      wants to know which one.
 *
 * Both are counted inside the same solver the headline uses, so the two
 * numbers cannot describe different software.
 */

import { register } from "node:module";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

register("./alias-hooks.mjs", import.meta.url);

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
const { DIFFICULTIES, newGame, placeMines } = await import(
  join(ROOT, "src/games/minesweeper/logic.ts")
);

const arg = (name, fallback) => {
  const i = process.argv.indexOf(`--${name}`);
  return i === -1 ? fallback : Number(process.argv[i + 1]);
};
const BOARDS = arg("boards", 2000);

/** Deterministic RNG so a re-run reproduces the number exactly. */
function mulberry32(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const key = (r, c) => r * 100 + c;

function neighbours(rows, cols, r, c) {
  const out = [];
  for (let dr = -1; dr <= 1; dr++)
    for (let dc = -1; dc <= 1; dc++) {
      if (!dr && !dc) continue;
      const nr = r + dr;
      const nc = c + dc;
      if (nr >= 0 && nr < rows && nc >= 0 && nc < cols) out.push([nr, nc]);
    }
  return out;
}

/**
 * Play one board with the two logical rules only.
 * Returns "solved" when every safe cell was proven, "stuck" when a guess was needed.
 *
 * `stats`, when given, is credited per RESOLVED SQUARE rather than per rule
 * firing: a rule that fires and proves nothing new is not doing work, and
 * counting firings would make the busier rule look like the useful one.
 */
function solve(state, stats) {
  const { rows, cols, grid } = state;
  const revealed = new Set();
  const known = new Set(); // proven mines

  // Flood the zero-region the way the game does, so the solver sees what a
  // player sees rather than one cell at a time.
  const reveal = (r0, c0) => {
    const stack = [[r0, c0]];
    while (stack.length) {
      const [r, c] = stack.pop();
      if (revealed.has(key(r, c)) || known.has(key(r, c))) continue;
      revealed.add(key(r, c));
      if (grid[r][c].adj === 0) {
        for (const [nr, nc] of neighbours(rows, cols, r, c)) stack.push([nr, nc]);
      }
    }
  };

  reveal(state.firstR, state.firstC);
  // The opening flood belongs to NEITHER rule - it is the free click every
  // board starts with - so it is counted apart and the conservation check
  // below adds it back. Without that term the check would be satisfied by any
  // pair of numbers summing to their own total, which is every pair.
  if (stats) stats.opening += revealed.size;

  const total = rows * cols;
  const mines = state.mines;

  for (;;) {
    // Self-check, every iteration. A solver that reveals a mine is not proving
    // anything - it is guessing and getting away with it, and it would inflate
    // every number below while looking like a better solver. This costs a scan
    // and buys the right to quote the result.
    for (const k of revealed) {
      if (grid[Math.floor(k / 100)][k % 100].mine) {
        throw new Error(`solver revealed a mine at ${Math.floor(k / 100)},${k % 100} - result void`);
      }
    }

    if (revealed.size === total - mines) {
      if (stats) {
        stats.finalRevealed += revealed.size;
        stats.finalKnown += known.size;
      }
      return "solved";
    }

    // Build the constraint set: each revealed number, its unknown neighbours,
    // and how many of them are still unaccounted-for mines.
    const constraints = [];
    for (const k of revealed) {
      const r = Math.floor(k / 100);
      const c = k % 100;
      if (grid[r][c].adj === 0) continue;
      const unknown = [];
      let flagged = 0;
      for (const [nr, nc] of neighbours(rows, cols, r, c)) {
        const nk = key(nr, nc);
        if (known.has(nk)) flagged++;
        else if (!revealed.has(nk)) unknown.push(nk);
      }
      if (unknown.length) constraints.push({ cells: new Set(unknown), need: grid[r][c].adj - flagged });
    }

    let progress = false;

    // Rule 1 - single point.
    for (const con of constraints) {
      if (con.need === 0) {
        for (const k of con.cells)
          if (!revealed.has(k)) {
            const before = revealed.size;
            reveal(Math.floor(k / 100), k % 100);
            // The FLOOD counts, not the one square named: opening a zero opens
            // its whole region, and that region is what the rule bought.
            if (stats) stats.single += revealed.size - before;
            progress = true;
          }
      } else if (con.need === con.cells.size) {
        for (const k of con.cells)
          if (!known.has(k)) {
            known.add(k);
            if (stats) stats.single++;
            progress = true;
          }
      }
    }
    if (progress) continue;

    // Rule 2 - subset. A ⊂ B ⇒ B\A holds need(B) - need(A) mines.
    for (const a of constraints) {
      for (const b of constraints) {
        if (a === b || a.cells.size >= b.cells.size) continue;
        let subset = true;
        for (const k of a.cells)
          if (!b.cells.has(k)) {
            subset = false;
            break;
          }
        if (!subset) continue;

        const diff = [...b.cells].filter((k) => !a.cells.has(k));
        const need = b.need - a.need;
        if (need === 0) {
          for (const k of diff)
            if (!revealed.has(k)) {
              const before = revealed.size;
              reveal(Math.floor(k / 100), k % 100);
              if (stats) stats.subset += revealed.size - before;
              progress = true;
            }
        } else if (need === diff.length) {
          for (const k of diff)
            if (!known.has(k)) {
              known.add(k);
              if (stats) stats.subset++;
              progress = true;
            }
        }
      }
    }

    if (!progress) {
      if (stats) {
        // The DENOMINATOR is safe squares, not squares: a board is finished when
        // every non-mine cell is open, so "how far did I get" has to be measured
        // against that and not against the whole grid.
        stats.stuckAt.push(revealed.size / (total - mines));
        stats.finalRevealed += revealed.size;
        stats.finalKnown += known.size;
      }
      return "stuck";
    }
  }
}

const PATTERNS = process.argv.includes("--patterns");

/** Median, so one pathological board cannot move the headline the way a mean can. */
function median(xs) {
  if (!xs.length) return null;
  const s = [...xs].sort((a, b) => a - b);
  const m = s.length >> 1;
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
}

const out = { boards: BOARDS, levels: {} };

for (const [name, d] of Object.entries(DIFFICULTIES)) {
  let solved = 0;
  const stats = { single: 0, subset: 0, opening: 0, stuckAt: [], finalRevealed: 0, finalKnown: 0 };
  for (let i = 0; i < BOARDS; i++) {
    const rng = mulberry32(i * 2654435761 + name.length * 7919);
    // Open in the middle, the way most people do, and the way that maximises
    // the opening reveal. Cell choice changes the number slightly; it is stated
    // rather than tuned.
    const r0 = Math.floor(d.rows / 2);
    const c0 = Math.floor(d.cols / 2);
    const placed = placeMines(newGame(d), r0, c0, rng);
    placed.firstR = r0;
    placed.firstC = c0;
    if (solve(placed, PATTERNS ? stats : undefined) === "solved") solved++;
  }
  out.levels[name] = {
    board: `${d.rows}x${d.cols}`,
    mines: d.mines,
    density: Number(((d.mines / (d.rows * d.cols)) * 100).toFixed(1)),
    guessFreePct: Number(((solved / BOARDS) * 100).toFixed(1)),
  };
  if (PATTERNS) {
    const resolved = stats.single + stats.subset;
    out.levels[name].patterns = {
      stuckBoards: stats.stuckAt.length,
      // Per board, so the reader can check it against `guessFreePct` above -
      // the two are the same population counted from opposite ends.
      medianClearedWhenStuckPct:
        stats.stuckAt.length === 0 ? null : Number((median(stats.stuckAt) * 100).toFixed(1)),
      meanClearedWhenStuckPct:
        stats.stuckAt.length === 0
          ? null
          : Number(((stats.stuckAt.reduce((a, b) => a + b, 0) / stats.stuckAt.length) * 100).toFixed(1)),
      squaresResolved: resolved,
      // The independent side of the conservation check below. Every square
      // that ended up open or flagged, counted by the SOLVER's final state
      // rather than by the rule credits, so the two can disagree.
      openingFlood: stats.opening,
      squaresSettled: stats.finalRevealed + stats.finalKnown,
      singlePointPct: resolved === 0 ? null : Number(((stats.single / resolved) * 100).toFixed(1)),
      subsetPct: resolved === 0 ? null : Number(((stats.subset / resolved) * 100).toFixed(1)),
    };
  }
}

if (process.argv.includes("--json")) {
  console.log(JSON.stringify(out, null, 2));
} else {
  console.log(`minesweeper: ${BOARDS} boards per level, first click at the centre\n`);
  console.log("level     board   mines   density   cleared without a single guess");
  for (const [name, r] of Object.entries(out.levels)) {
    console.log(
      `${name.padEnd(9)} ${r.board.padEnd(7)} ${String(r.mines).padStart(5)}   ` +
        `${String(r.density + "%").padStart(7)}   ${String(r.guessFreePct + "%").padStart(29)}`,
    );
  }
  console.log(
    "\nLower bound: the solver knows single-point and subset only, so a board it " +
      "\ncalls unsolvable may still yield to a full constraint enumeration.",
  );

  if (PATTERNS) {
    console.log(`\nWHEN LOGIC RUNS OUT, and which rule got you there.`);
    console.log(
      "level     boards that stuck   median cleared   mean cleared   " +
        "squares proved   single point   subset",
    );
    for (const [name, r] of Object.entries(out.levels)) {
      const p = r.patterns;
      console.log(
        `${name.padEnd(9)} ${String(p.stuckBoards).padStart(17)} ` +
          `${String((p.medianClearedWhenStuckPct ?? "-") + "%").padStart(16)} ` +
          `${String((p.meanClearedWhenStuckPct ?? "-") + "%").padStart(14)} ` +
          `${String(p.squaresResolved).padStart(16)} ` +
          `${String((p.singlePointPct ?? "-") + "%").padStart(14)} ` +
          `${String((p.subsetPct ?? "-") + "%").padStart(8)}`,
      );
    }
    console.log(
      "\nPOPULATION: every board above, per level. `boards that stuck` is the " +
        "\ncomplement of the cleared-without-a-guess count in the first table - if the " +
        "\ntwo disagree, one of them is measuring something else.",
    );
    // A control that can FAIL. The two percentages are computed from one
    // denominator, so a bug crediting the same square twice shows up here
    // rather than in a plausible-looking table.
    for (const [name, r] of Object.entries(out.levels)) {
      const p = r.patterns;
      const stuck = Math.round((1 - r.guessFreePct / 100) * BOARDS);
      if (Math.abs(p.stuckBoards - stuck) > 1) {
        throw new Error(
          `${name}: ${p.stuckBoards} boards recorded a stuck point but the headline says ` +
            `${stuck} boards needed a guess - the two counts are of one population and disagree.`,
        );
      }
      // CONSERVATION, and it is the control that can actually fail. The two
      // percentages above share one denominator, so "do they sum to 100" is
      // true of any two numbers and cannot see a rule credited twice. This
      // compares the rule credits against the solver's OWN final state, which
      // is computed from a different thing entirely.
      if (p.squaresResolved + p.openingFlood !== p.squaresSettled) {
        throw new Error(
          `${name}: the rules claim ${p.squaresResolved} squares and the opening flood ` +
            `${p.openingFlood}, ${p.squaresResolved + p.openingFlood} together - but the ` +
            `solver finished with ${p.squaresSettled} squares open or flagged. A square is ` +
            `being credited twice, or not at all.`,
        );
      }
    }
  }
}
