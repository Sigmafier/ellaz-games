#!/usr/bin/env node
/**
 * Does the old "keep your left hand on the wall" trick solve OUR mazes?
 *
 *   node scripts/sim/maze-wall-follower.mjs [--deals 4000] [--json]
 *
 * WHY THIS FILE EXISTS. It was written for the French guide at
 * /fr/guides/labyrinthe-en-ligne/ (2026-09-21), and it had to be a NEW
 * derivation rather than a re-quote: `maze-routes.mjs` already spends the
 * numbers the game page says out loud - the size of the ordering skill, the
 * spread between best and worst order, how many dead ends survive the braid -
 * so a guide repeating any of them would be a second copy of that page.
 *
 * The wall-follower is the one thing every reader already believes about
 * mazes, and it is the one claim nobody has checked against the boards we
 * actually deal.
 *
 * THE THEORY, stated before it is measured, so the measurement can disagree.
 * Keeping one hand on the wall walks the boundary of whatever wall you are
 * touching. In a PERFECT maze - every cell reachable, exactly one route
 * between any two - every wall is part of one connected piece, so the walk
 * eventually traces the whole thing and passes every cell. In a BRAIDED maze
 * some walls become free-standing islands, and a hand on an island walks in a
 * circle forever.
 *
 * `LEVELS` is the whole experiment already set up, and nobody arranged it on
 * purpose:
 *
 *   easy     braid 0.9    nine dead ends in ten opened back up
 *   medium   braid 0.45
 *   hard     braid 0.1
 *   expert   braid 0      a perfect maze, so the rule is GUARANTEED
 *
 * IT DRIVES THE SHIPPED GENERATOR. `newMaze`, `distances` and `openNeighbours`
 * come from `src/games/maze/logic.ts` through the alias hooks, so every board
 * below is a board a child could be handed - same carve, same braid, same
 * sizes. A re-implementation would measure my reading of the code, agree with
 * itself, and be confidently wrong about a game we do not ship.
 *
 * Determinism: `mulberry32` from the game's own `@shared/rng`, seeded per deal.
 */

import { register } from "node:module";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

register("./alias-hooks.mjs", import.meta.url);

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
const { DIFFICULTIES, LEVELS, distances, newMaze, openNeighbours } = await import(
  join(ROOT, "src/games/maze/logic.ts")
);
const { mulberry32 } = await import(join(ROOT, "src/shared/rng.ts"));

const arg = (name, fallback) => {
  const i = process.argv.indexOf(`--${name}`);
  return i === -1 ? fallback : Number(process.argv[i + 1]);
};
const DEALS = arg("deals", 4000);
const asJson = process.argv.includes("--json");

/**
 * The four headings, in CLOCKWISE order, as offsets on the flat grid.
 *
 * Clockwise is what makes "left" and "right" mean anything: left is one step
 * back around this ring, right is one step forward. Writing them in any other
 * order gives a walker that turns the wrong way and still terminates, which is
 * the kind of wrong that produces a plausible number.
 */
const HEADINGS = [
  { name: "up", d: (size) => -size },
  { name: "right", d: () => 1 },
  { name: "down", d: (size) => size },
  { name: "left", d: () => -1 },
];

/**
 * Walk the maze with the left hand on the wall, from `from`, until `to` is
 * stepped on or the step budget runs out.
 *
 * Returns the number of steps taken, or null if the budget ran out - which is
 * the honest answer for a walker that is going round an island, and is a
 * different statement from "it took a long time".
 */
function leftHand(walls, size, from, to, budget) {
  let at = from;
  // Facing matters and the start facing is arbitrary, so it is stated: north,
  // every deal, rather than a random one. A random start facing would add a
  // second source of variation to a number whose whole point is the braid.
  let facing = 0;
  for (let steps = 0; steps < budget; steps++) {
    // Try LEFT first, then straight, then right, then back. That IS the rule.
    for (let turn = 3; turn <= 6; turn++) {
      const h = (facing + turn) % 4;
      const next = at + HEADINGS[h].d(size);
      // `openNeighbours` is the game's own answer to "can the mouse walk
      // here", so a wall this walker respects is a wall the game has. Asking
      // the walls arrays directly would be a second reading of the same fact.
      if (!openNeighbours(walls, size, at).includes(next)) continue;
      at = next;
      facing = h;
      break;
    }
    if (at === to) return steps + 1;
  }
  return null;
}

const out = { deals: DEALS, levels: {} };

for (const level of DIFFICULTIES) {
  const cfg = LEVELS[level];
  const size = cfg.size;
  // A generous budget: the rule's worst case is walking every wall twice, and
  // a perfect maze has about 2 * cells wall-segments. Ten times the cell count
  // is far past that, so a null here is a walker going in a circle rather than
  // one that ran out of room.
  const budget = size * size * 10;

  let solved = 0;
  let ratioSum = 0;
  let worstRatio = 0;
  let shortestSum = 0;
  let wallSum = 0;

  for (let i = 0; i < DEALS; i++) {
    const rng = mulberry32(i * 2654435761 + level.length * 7919);
    const state = newMaze(level, 0, rng);
    const shortest = distances(state.walls, size, state.at)[state.home];
    // A deal whose mouse starts on its own doorstep says nothing about a
    // walking rule, and dividing by it says nothing at all.
    if (shortest <= 0) continue;
    const walked = leftHand(state.walls, size, state.at, state.home, budget);
    if (walked === null) continue;
    solved++;
    const ratio = walked / shortest;
    ratioSum += ratio;
    if (ratio > worstRatio) worstRatio = ratio;
    shortestSum += shortest;
    wallSum += walked;
  }

  out.levels[level] = {
    size: `${size}x${size}`,
    braid: cfg.braid,
    deals: DEALS,
    solvedPct: Number(((solved / DEALS) * 100).toFixed(1)),
    // Only over the deals it SOLVED. A mean that quietly treats a failure as
    // zero steps is the shape that reports a rule getting better the more
    // often it fails.
    meanRatio: solved ? Number((ratioSum / solved).toFixed(2)) : null,
    worstRatio: solved ? Number(worstRatio.toFixed(1)) : null,
    meanShortest: solved ? Number((shortestSum / solved).toFixed(1)) : null,
    meanWalked: solved ? Number((wallSum / solved).toFixed(1)) : null,
  };
}

if (asJson) {
  console.log(JSON.stringify(out, null, 2));
} else {
  console.log(`maze: the left-hand rule on ${DEALS.toLocaleString("en-US")} deals per level\n`);
  console.log(
    "level     board   braid   gets home   shortest   walked   times longer   worst deal",
  );
  for (const [name, r] of Object.entries(out.levels)) {
    console.log(
      `${name.padEnd(9)} ${r.size.padEnd(7)} ${String(r.braid).padStart(5)}   ` +
        `${String(r.solvedPct + "%").padStart(9)}   ${String(r.meanShortest ?? "-").padStart(8)}   ` +
        `${String(r.meanWalked ?? "-").padStart(6)}   ${String((r.meanRatio ?? "-") + "x").padStart(12)}   ` +
        `${String((r.worstRatio ?? "-") + "x").padStart(10)}`,
    );
  }
  console.log(
    `\nPOPULATION: ${DEALS.toLocaleString("en-US")} deals per level, from the game's own ` +
      `newMaze().\n"gets home" counts the deals where the rule reached the door inside ` +
      `${"size*size*10"} steps;\nthe other columns are over those deals only.`,
  );
}

/* --------------------------------------------------------------- controls */

// 1. THE GUARANTEE. `expert` is braid 0 - a perfect maze - so the theory says
//    the rule ALWAYS gets home. If it does not, either the carve is not
//    producing perfect mazes or this walker does not implement the rule, and
//    both of those void every other number here.
const expert = out.levels.expert;
if (expert.solvedPct !== 100) {
  throw new Error(
    `expert is braid ${LEVELS.expert.braid} - a perfect maze, where the left-hand rule is ` +
      `guaranteed to pass every cell - and the walker got home on only ${expert.solvedPct}% ` +
      `of deals. Either the carve is not perfect or this is not the left-hand rule.`,
  );
}

// 2. THE FAILURE, and it has to be observed rather than assumed. If every
//    level came back at 100% the table would be true and say nothing: the
//    whole finding is that BRAIDING breaks the rule, so the braided end must
//    actually fail somewhere.
const braided = Object.entries(out.levels).filter(([, r]) => r.braid > 0);
if (!braided.some(([, r]) => r.solvedPct < 100)) {
  throw new Error(
    `every braided level solved 100% of deals, which would mean braiding does not break the ` +
      `left-hand rule. That contradicts the reason this script exists - check the walker ` +
      `before believing it.`,
  );
}

// 3. THE WALK IS NOT THE SHORTEST PATH. A ratio of 1.0 everywhere would mean
//    this walker is quietly running a solver rather than a hand on a wall.
if (!Object.values(out.levels).some((r) => (r.meanRatio ?? 1) > 1.2)) {
  throw new Error(
    `the left-hand rule walked within 20% of the shortest path on every level, which is not ` +
      `what a hand on a wall does - this walker is finding routes it should have to stumble into.`,
  );
}
