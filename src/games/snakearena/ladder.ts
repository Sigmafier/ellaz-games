// The bot ladder's harness: whole rounds played by node, bots against a player
// who is also a bot. Test-side only - nothing in the game imports it - and pure,
// so a round is a function of its seed.
import { mulberry32 } from "@shared/rng";
import { decide, deadly, movesOf, viewOf, type View } from "./bots";
import { tick, placeOf, type Dir, type Round, type Shape } from "./logic";
import { LEVEL, dealRound, type Level, type MapId } from "./setup";

/**
 * The two players the ladder is measured against.
 *
 * `careful` is the bots' own logic with no slips - the best a player who reads
 * the board every step and never fumbles could do. `careless` moves at random
 * among the moves that are not out on the spot: it never hits a wall it could
 * have missed, and never looks further than one cell or goes for an apple on
 * purpose - a player steering without a plan.
 */
export type Policy = "careful" | "careless";

export function carelessMove(r: Round, v: View, id: number, rng: () => number): Dir {
  const s = r.snakes[id];
  const safe = movesOf(s).filter((d) => !deadly(r, v, s, d));
  return safe.length ? safe[Math.floor(rng() * safe.length)] : s.dir;
}

export type Result = { won: boolean; survived: boolean; place: number; peak: number; ticks: number; lived: number; cause?: string };

/** One whole round, seeded: the player (snake 0) under `policy`, the bots at their level, on `map`. */
export function playRound(shape: Shape, level: Level, seed: number, policy: Policy, map: MapId = "open", mistake = LEVEL[level].mistake): Result {
  const rng = mulberry32(seed);
  let r = dealRound(shape, { level, map, humans: 1 }, rng);
  while (!r.over) {
    const v = viewOf(r);
    r = {
      ...r,
      snakes: r.snakes.map((s) => {
        if (!s.alive) return s;
        if (s.id !== 0) return { ...s, pending: decide(r, s.id, mistake, rng, v) };
        return { ...s, pending: policy === "careful" ? decide(r, 0, 0, rng, v) : carelessMove(r, v, 0, rng) };
      }),
    };
    r = tick(r, rng).round;
  }
  const me = r.snakes[0];
  // `lived`: steps the player was in the round - to the bell, or to the step it went out on.
  return { won: r.winner === 0, survived: me.alive, place: placeOf(r, 0), peak: me.peak, ticks: r.tick, lived: me.alive ? r.tick : me.outAt + 1, cause: me.cause };
}

export type Shares = { rounds: number; win: number; survive: number; place: number };

/** `rounds` seeded rounds from `seed0`, summarised as shares. */
export function measure(shape: Shape, level: Level, policy: Policy, rounds: number, seed0 = 1, map: MapId = "open", mistake = LEVEL[level].mistake): Shares {
  let win = 0;
  let survive = 0;
  let place = 0;
  for (let i = 0; i < rounds; i++) {
    const res = playRound(shape, level, seed0 + i * 7919, policy, map, mistake);
    win += Number(res.won);
    survive += Number(res.survived);
    place += res.place;
  }
  return { rounds, win: win / rounds, survive: survive / rounds, place: place / rounds };
}

/** How long the player lasts, in seconds, over `rounds` seeded rounds: median, and how many ended under 11 s. */
export function lifetimes(shape: Shape, level: Level, policy: Policy, rounds: number, seed0 = 1, map: MapId = "open") {
  const secs: number[] = [];
  const causes: Record<string, number> = {};
  for (let i = 0; i < rounds; i++) {
    const res = playRound(shape, level, seed0 + i * 7919, policy, map);
    secs.push((res.lived * LEVEL[level].stepMs) / 1000);
    if (res.cause) causes[res.cause] = (causes[res.cause] ?? 0) + 1;
  }
  secs.sort((a, b) => a - b);
  return { median: secs[Math.floor(rounds / 2)], under11: secs.filter((s) => s < 11).length, causes, secs };
}
