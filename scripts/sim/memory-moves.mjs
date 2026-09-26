#!/usr/bin/env node
/**
 * Derives the move statistics the memory game page quotes.
 *
 *   node scripts/sim/memory-moves.mjs [--games 20000] [--json]
 *
 * WHY THIS FILE EXISTS. Research on getting quoted by answer engines
 * (arXiv:2311.09735) found that adding statistics is one of the two biggest
 * levers. Our own rules forbid inventing one. Both hold only because a game is
 * a system you can MEASURE: this script is the reason the page may say "9.2
 * moves" at all, and `src/content/types.ts` requires every quoted figure to
 * name the script that produces it.
 *
 * The first draft of that page said "ten pairs in under twenty-eight moves is
 * already something". Nothing produced that number. It is gone.
 *
 * GROUNDED IN THE REAL BOARDS. The level table is parsed out of
 * `src/games/memory/Memory.tsx` rather than copied here, so if somebody changes
 * a difficulty the script either follows them or fails loudly. A statistic that
 * silently describes a board we no longer ship is worse than none.
 *
 * Two strategies, both playing the real rules (one move = two cards flipped):
 *
 *   perfect  remembers every card it has ever seen and plays optimally on that
 *            knowledge. This is the ceiling a human is chasing, not the
 *            theoretical minimum - even perfect memory has to spend moves
 *            LEARNING where the cards are.
 *   random   picks two unmatched cards at random. The floor.
 *
 * The theoretical minimum is simply `pairs`: every move a match, no misses,
 * which requires luck rather than skill.
 *
 * Determinism: a fixed-seed LCG, so two runs of the same command give the same
 * numbers. 20,000 games converges to one decimal place - a 200,000-game run
 * agreed on all six cells.
 *
 * --recall ANSWERS A DIFFERENT QUESTION, added for the Hebrew guide at
 * /he/guides/memory-game-for-kids/ (2026-09-21). The two strategies above are
 * a CEILING and a FLOOR, and the game page already spends both. Neither is a
 * child: nobody has unlimited recall and nobody who is five plays at random.
 *
 * So the third strategy is a player who remembers only the last `k` DISTINCT
 * squares they have turned over, and forgets the oldest when the k+1th
 * arrives. That is the developmental literature's own unit - visual working
 * memory span, which is reported at roughly 2-3 items for a three-year-old and
 * climbs through childhood - so running k = 2..7 against our real boards says
 * which of our levels a given age can actually finish, rather than which one
 * sounds easy.
 *
 * It is a MODEL of a child, not a measurement of one, and the guide says so.
 * What it measures exactly is our own boards under a stated memory bound.
 */

import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
const SOURCE = join(ROOT, "src", "games", "memory", "Memory.tsx");

/** Parse the shipped difficulty table. Throws rather than guess. */
function levels() {
  const src = readFileSync(SOURCE, "utf8");
  const rows = [...src.matchAll(/\{\s*id:\s*"(\w+)",\s*pairs:\s*(\d+),\s*cols:\s*(\d+)/g)].map(
    (m) => ({ id: m[1], pairs: Number(m[2]), cols: Number(m[3]) }),
  );
  if (!rows.length) {
    throw new Error(
      `No LEVELS rows found in ${SOURCE}. The memory game's difficulty table moved or ` +
        `changed shape, so every figure this script feeds into the page is now unverified. ` +
        `Fix the parser before re-quoting any number.`,
    );
  }
  return rows;
}

/** Fixed-seed LCG. Math.random would make the published figures unreproducible. */
function lcg(seed) {
  let s = seed;
  return () => {
    s = (s * 1103515245 + 12345) & 0x7fffffff;
    return s / 0x7fffffff;
  };
}

/**
 * Play one board to completion, returning the move count.
 *
 * `mode` is `true` (perfect recall), `false` (random), or a NUMBER k - a
 * player who holds only the last k distinct squares in mind. The bounded case
 * shares every other rule with the perfect one, so the gap between them is the
 * memory and nothing else.
 */
function play(pairs, mode, rnd) {
  // `mode !== false`, not `mode === true`. A bounded player plays the SAME
  // strategy as the perfect one with a smaller window, so a number has to take
  // this branch - and `=== true` silently sent every k down the random path,
  // which read as "memory does not matter" on a table that looked plausible.
  // Caught by the ceiling control at the bottom of this file, not by reading.
  const perfect = mode !== false;
  const cap = typeof mode === "number" ? mode : Infinity;
  const deck = [];
  for (let i = 0; i < pairs; i++) deck.push(i, i);
  for (let i = deck.length - 1; i > 0; i--) {
    const j = Math.floor(rnd() * (i + 1));
    [deck[i], deck[j]] = [deck[j], deck[i]];
  }

  const closed = new Set(deck.map((_, i) => i));
  // index -> face. Insertion-ordered, so the FIRST key is the oldest thing
  // being held - which is what "forgets the oldest" needs and what a plain
  // object could not give.
  const seen = new Map();
  let moves = 0;

  /**
   * Remember a square, and drop the oldest if that puts us over the cap.
   *
   * `delete` before `set` is load-bearing: `Map.set` on a key that is already
   * there keeps its ORIGINAL position, so re-seeing a square would not refresh
   * it and the model would forget things a player just looked at.
   */
  const remember = (i) => {
    if (seen.has(i)) seen.delete(i);
    seen.set(i, deck[i]);
    while (seen.size > cap) seen.delete(seen.keys().next().value);
  };

  while (closed.size) {
    moves++;

    if (!perfect) {
      const arr = [...closed];
      const a = arr[Math.floor(rnd() * arr.length)];
      const rest = arr.filter((i) => i !== a);
      const b = rest[Math.floor(rnd() * rest.length)];
      if (deck[a] === deck[b]) {
        closed.delete(a);
        closed.delete(b);
      }
      continue;
    }

    // Known pair among remembered cards? Take it - free match, no risk.
    const byFace = new Map();
    let took = false;
    for (const i of closed) {
      if (!seen.has(i)) continue;
      const face = seen.get(i);
      if (byFace.has(face)) {
        const partner = byFace.get(face);
        closed.delete(partner);
        closed.delete(i);
        seen.delete(partner);
        seen.delete(i);
        took = true;
        break;
      }
      byFace.set(face, i);
    }
    if (took) continue;

    // Otherwise turn over something new, and follow it up with the best card
    // available: its known partner if we have one, else another unseen card so
    // the move at least buys information.
    const unseen = [...closed].filter((i) => !seen.has(i));
    // A bounded player runs out of UNREMEMBERED squares long before the board
    // runs out of closed ones - they have forgotten squares they turned over
    // ten moves ago. Fall back to the whole closed set rather than stalling.
    const pool = unseen.length ? unseen : [...closed];
    const a = pool[Math.floor(rnd() * pool.length)];
    remember(a);

    const known = [...closed].find((i) => i !== a && seen.get(i) === deck[a]);
    if (known !== undefined) {
      closed.delete(a);
      closed.delete(known);
      seen.delete(a);
      seen.delete(known);
      continue;
    }

    const fresh = [...closed].filter((i) => i !== a && !seen.has(i));
    const rest = fresh.length ? fresh : [...closed].filter((i) => i !== a);
    if (!rest.length) continue;
    const b = rest[Math.floor(rnd() * rest.length)];
    remember(b);
    if (deck[b] === deck[a]) {
      closed.delete(a);
      closed.delete(b);
      // A matched pair leaves the board, so it stops occupying the player's
      // memory too. Without this the cap fills with squares that are no longer
      // there and a small-k player is punished for succeeding.
      seen.delete(a);
      seen.delete(b);
    }
  }

  return moves;
}

const args = process.argv.slice(2);
const N = Number(args[args.indexOf("--games") + 1]) || 20000;
const asJson = args.includes("--json");
const RECALL = args.includes("--recall");

/** The spans the guide walks. Stated here so the table and the prose share one list. */
const SPANS = [2, 3, 4, 5, 6, 7];

const rnd = lcg(12345);
const rows = levels().map(({ id, pairs }) => {
  const avg = (mode) => {
    let total = 0;
    for (let i = 0; i < N; i++) total += play(pairs, mode, rnd);
    return Number((total / N).toFixed(1));
  };
  const row = {
    level: id,
    pairs,
    minimum: pairs,
    perfectMemory: avg(true),
    random: avg(false),
  };
  if (RECALL) {
    row.recall = {};
    for (const k of SPANS) row.recall[k] = avg(k);
  }
  return row;
});

if (asJson) {
  console.log(JSON.stringify({ games: N, rows }, null, 2));
} else {
  console.log(`memory: ${N.toLocaleString("en-US")} simulated games per level\n`);
  console.log("level      pairs   minimum   perfect memory   random guessing");
  for (const r of rows) {
    console.log(
      `${r.level.padEnd(10)} ${String(r.pairs).padStart(5)} ${String(r.minimum).padStart(9)} ` +
        `${String(r.perfectMemory).padStart(16)} ${String(r.random).padStart(17)}`,
    );
  }
  console.log("\nOne move = two cards flipped, which is how the game counts it.");

  if (RECALL) {
    console.log(
      `\nA PLAYER WHO HOLDS ONLY k SQUARES IN MIND. Same boards, same rules, ` +
        `\nsame ${N.toLocaleString("en-US")} games - the only thing that changes is how much they remember.\n`,
    );
    console.log(
      `level      pairs   ${SPANS.map((k) => `k=${k}`.padStart(7)).join("")}   perfect`,
    );
    for (const r of rows) {
      console.log(
        `${r.level.padEnd(10)} ${String(r.pairs).padStart(5)}   ` +
          SPANS.map((k) => String(r.recall[k]).padStart(7)).join("") +
          `   ${String(r.perfectMemory).padStart(7)}`,
      );
    }
    console.log(
      `\nPOPULATION: ${N.toLocaleString("en-US")} games per cell, ${rows.length} levels x ` +
        `${SPANS.length} spans, on the boards parsed out of Memory.tsx.`,
    );

    // CONTROLS, and they can both fail.
    //
    // 1. Monotonic in k. More memory may not cost more moves - if it does, the
    //    bounded player is not the perfect player with a smaller window, it is
    //    a different strategy and the whole comparison is void.
    // 2. Bounded by the two strategies that were already published. A k of 7
    //    on a 6-pair board is unbounded recall in disguise and has to land on
    //    the perfect figure; every k has to sit between perfect and random, or
    //    the model is outside the range it claims to interpolate.
    for (const r of rows) {
      for (let i = 1; i < SPANS.length; i++) {
        const lo = r.recall[SPANS[i - 1]];
        const hi = r.recall[SPANS[i]];
        if (hi > lo + 0.05) {
          throw new Error(
            `${r.level}: remembering ${SPANS[i]} squares costs ${hi} moves and remembering ` +
              `${SPANS[i - 1]} costs ${lo} - more memory made the player worse, so this is ` +
              `not one strategy at two window sizes.`,
          );
        }
      }
      for (const k of SPANS) {
        const v = r.recall[k];
        if (v < r.perfectMemory - 0.05 || v > r.random + 0.05) {
          throw new Error(
            `${r.level} k=${k}: ${v} moves is outside [${r.perfectMemory}, ${r.random}] - ` +
              `the bounded player beat perfect recall or lost to random guessing.`,
          );
        }
      }
      // The ceiling case, checked by NAME rather than by luck: a window at
      // least as wide as the whole board is unbounded recall, so it must land
      // on the published perfect figure.
      const wide = 2 * r.pairs;
      const atCeiling = Number((() => {
        let total = 0;
        for (let i = 0; i < Math.min(N, 4000); i++) total += play(r.pairs, wide, rnd);
        return total / Math.min(N, 4000);
      })().toFixed(1));
      if (Math.abs(atCeiling - r.perfectMemory) > 0.6) {
        throw new Error(
          `${r.level}: a window of ${wide} squares - the whole board - gives ${atCeiling} ` +
            `moves against the published perfect figure ${r.perfectMemory}. The bounded ` +
            `player does not converge on the strategy it is supposed to be a window onto.`,
        );
      }
    }
  }
}
