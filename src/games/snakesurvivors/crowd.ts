// The crowd: the shapes, the clock that sends them, how they chase, and the boss.
//
// The three shapes and the warden are Neon Survival's cast, so their sizes
// match the sprites that game already sized - but their NUMBERS are this game's
// own, because a crowd you trap is a different crowd from one you shoot.

// The numbers live in `tuning.ts` and the per-tick movement in `chase.ts`;
// this file keeps the spawn clock and the bosses' arrival, and re-exports both
// so every importer keeps reading `./crowd`.

import { spawnPoint } from "../survivors/world";
import { LUNGE } from "./chase";
import { BOSS_HP, KINDS, LEVELS, MINI_AT, MINI_HP, STAGE_CROWD, crowdAt, isBoss, stageProgress } from "./tuning";
import type { Sent } from "./tuning";
import type { Foe, Kind, Run, Stage } from "./types";

export * from "./tuning";
export * from "./chase";

/** Kinds whose health never scales with the stage: they are weak by design. */
const ALWAYS_WEAK: readonly Kind[] = ["dasher"];

/** How far into the stage each shape joins, as a fraction of it (brute: see `STAGE_CROWD`). */
const JOINS: Record<"runner" | "orb", number> = { runner: 0, orb: 0.25 };
/** The stage each R4.5 shape first comes in. */
export const JOINS_STAGE: Record<"dasher" | "shooter", Stage> = { dasher: 2, shooter: 3 };
const WEIGHT: Record<Sent, number> = { runner: 3, orb: 2, brute: 1, dasher: 2, shooter: 2 };

const progress = (run: Run) => Math.min(1, run.t / LEVELS[run.level].rampMs);

/** The shapes the clock may send right now. Never a boss; the brute's own
 *  join point rises with the stage (`STAGE_CROWD`), the dasher and the shooter
 *  come with their stage (`JOINS_STAGE`). */
export function kindsAt(run: Run): Sent[] {
  const p = progress(run);
  const out: Sent[] = (Object.keys(JOINS) as ("runner" | "orb")[]).filter((k) => p >= JOINS[k]);
  if (p >= STAGE_CROWD[run.stage].brute) out.push("brute");
  for (const k of ["dasher", "shooter"] as const) if (run.stage >= JOINS_STAGE[k]) out.push(k);
  return out;
}

/** ms between two shapes: tightening over the stage, eased off for the boss fight,
 *  and multiplied per stage by `STAGE_CROWD.spawn` - under 1 from stage 2, so faster. */
export function spawnEvery(run: Run): number {
  const L = LEVELS[run.level];
  const base = L.spawnMs + (L.floorMs - L.spawnMs) * progress(run);
  const staged = base * crowdAt(run).spawn;
  return run.phase === "boss" ? staged * 1.6 : staged;
}

/**
 * A fresh shape. Every non-warden kind's hp is scaled by `STAGE_CROWD`'s
 * "tougher" - 1 at stage 1, so nothing here moves for the round-three crowd -
 * rounded and floored at 1, so a shape is never immortal or a zero-hit kill.
 * The warden's own hp is set separately, by `startBoss` (`BOSS_HP`).
 */
export function makeFoe(run: Run, kind: Kind, x: number, y: number): Foe {
  const stageHp = ALWAYS_WEAK.includes(kind) ? 1 : crowdAt(run).hp;
  const hp = isBoss(kind) ? KINDS[kind].hp : Math.max(1, Math.round(KINDS[kind].hp * stageHp));
  return { id: run.nextId++, kind, x, y, hp, hurt: 0, stun: 0, spikeCool: 0, dash: 0, dashCool: LUNGE.every, windup: 0, slow: 0 };
}

function pick(run: Run, rng: () => number): Sent {
  const kinds = kindsAt(run);
  const total = kinds.reduce((n, k) => n + WEIGHT[k], 0);
  let roll = rng() * total;
  for (const k of kinds) if ((roll -= WEIGHT[k]) < 0) return k;
  return kinds[kinds.length - 1];
}

/** Run the spawn clock: send what is due, up to the level's cap - raised per
 *  stage by `STAGE_CROWD`'s "higher cap". */
export function tickSpawns(run: Run, dt: number, rng: () => number): void {
  run.spawnIn -= dt;
  const cap = Math.round(LEVELS[run.level].cap * crowdAt(run).cap);
  while (run.spawnIn <= 0) {
    run.spawnIn += spawnEvery(run);
    if (run.foes.filter((f) => !isBoss(f.kind)).length >= cap) continue;
    const kind = pick(run, rng);
    const at = spawnPoint(rng, run);
    run.foes.push(makeFoe(run, kind, at.x, at.y));
  }
}

/** The trigger is met (`bossDue`): the warden for THIS stage comes, tougher
 *  than the one before it (`BOSS_HP`). */
export function startBoss(run: Run, rng: () => number): void {
  run.phase = "boss";
  const at = spawnPoint(rng, run);
  const boss = makeFoe(run, "warden", at.x, at.y);
  boss.hp = BOSS_HP[run.stage];
  run.foes.push(boss);
  run.events.push({ k: "boss" });
}

/** Halfway to this stage's warden (`MINI_AT`): its mini-boss comes, once. */
export function tickMini(run: Run, rng: () => number): void {
  if (run.phase !== "stage" || run.mini >= run.stage || stageProgress(run) < MINI_AT) return;
  run.mini = run.stage;
  const at = spawnPoint(rng, run);
  const m = makeFoe(run, "mini", at.x, at.y);
  m.hp = MINI_HP[run.stage];
  m.form = run.stage;
  run.foes.push(m);
  run.events.push({ k: "mini", x: at.x, y: at.y, stage: run.stage });
}
