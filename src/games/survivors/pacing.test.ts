// HOW LONG A RUN TAKES, AND HOW OFTEN IT HANDS OUT AN UPGRADE - played out
// rather than felt.
//
// WHY THIS FILE EXISTS. The operator's report on 2026-09-21 was two numbers:
// *"the upgrades are too often (like every 5-18 seconds in advanced levels)"*
// and *"the whole game in hard mode takes 5 minutes ... lets make it closer to
// 8-10 minutes"*. Both are properties of a WHOLE RUN, which no other test here
// plays: `logic.test.ts` drives a handful of frames, `boss.test.ts` starts at
// the golem, `shooters.test.ts` places one shape by hand. A tuning change that
// halved the run length would leave every one of them green.
//
// TWO PLAYERS, AND THE PAIR IS THE POINT
// (.claude/rules/a-perfect-bot-proves-a-level-can-be-won-not-how-hard-it-is.md).
// `kite` steers away from the crowd, sidesteps bolts and takes the strong cards;
// `stroll` wanders and takes whatever is first. Neither is a person. What the
// pair gives is a BRACKET - a level whose careful arm never finishes is broken,
// and a level whose careless arm finishes comfortably is not hard - and the
// numbers are printed on every run so the next retune starts from a reading.
//
// What it is NOT is a difficulty verdict. Only the operator's own play is that.
import { describe, expect, it } from "vitest";
import {
  ARENA_WIDE, STAGE_COUNT, bossOf, newRun, rngFor, runMs, step,
  type LevelKey, type RunState, type UpgradeId,
} from "./logic";
import { applyCard, offerCards, type Card } from "./cards";

/** A competent thumb: away from the crowd, toward loose gems, across a bolt's path. */
function kite(s: RunState): { dx: number; dy: number } {
  let dx = 0;
  let dy = 0;
  // Sidestep anything flying at you. A bolt is dodged ACROSS its path, never by
  // running from it - it is faster than you are - which is what a player who has
  // read the telegraph does, and therefore what a bot standing in for one must.
  for (const b of s.shots) {
    const rx = s.x - b.x;
    const ry = s.y - b.y;
    const sp = Math.hypot(b.vx, b.vy) || 1;
    // How far along its path the closest approach is, and how far off it passes.
    const along = (rx * b.vx + ry * b.vy) / sp;
    if (along <= 0 || along > 220) continue;
    const off = (rx * -b.vy + ry * b.vx) / sp;
    if (Math.abs(off) > 46) continue;
    const side = off >= 0 ? 1 : -1;
    const urgency = 3 * (1 - along / 220);
    dx += (-b.vy / sp) * side * urgency;
    dy += (b.vx / sp) * side * urgency;
  }
  for (const e of s.enemies) {
    const d = Math.hypot(s.x - e.x, s.y - e.y) || 1;
    if (d > 150) continue;
    const w = (150 - d) / 150;
    dx += ((s.x - e.x) / d) * w * 2;
    dy += ((s.y - e.y) / d) * w * 2;
  }
  let best: { x: number; y: number } | null = null;
  let bestD = 220;
  for (const g of s.gems) {
    const d = Math.hypot(s.x - g.x, s.y - g.y);
    if (d < bestD) {
      bestD = d;
      best = g;
    }
  }
  if (best) {
    const d = Math.hypot(best.x - s.x, best.y - s.y) || 1;
    dx += ((best.x - s.x) / d) * 0.7;
    dy += ((best.y - s.y) / d) * 0.7;
  }
  // Away from the walls, so it does not corner itself.
  const m = 90;
  if (s.x < m) dx += 1;
  if (s.x > s.world.w - m) dx -= 1;
  if (s.y < m) dy += 1;
  if (s.y > s.world.h - m) dy -= 1;
  const len = Math.hypot(dx, dy);
  return len > 0.01 ? { dx: dx / len, dy: dy / len } : { dx: 0, dy: 0 };
}

/**
 * A careless thumb: it walks somewhere for about a second, then somewhere else.
 * It does not look at the crowd and it does not look at the bolts.
 *
 * Deliberately below a person rather than a model of one. Its job is to be the
 * bottom of the bracket - a level the careless arm survives comfortably is not
 * asking anything of anyone.
 */
function stroll(s: RunState, rng: () => number, held: { dx: number; dy: number; until: number }) {
  if (s.t >= held.until) {
    const a = rng() * Math.PI * 2;
    held.dx = Math.cos(a);
    held.dy = Math.sin(a);
    held.until = s.t + 700 + rng() * 900;
  }
  // It still turns around at a wall, because walking into one for six minutes is
  // not carelessness, it is a broken bot.
  const m = 70;
  if ((s.x < m && held.dx < 0) || (s.x > s.world.w - m && held.dx > 0)) held.dx = -held.dx;
  if ((s.y < m && held.dy < 0) || (s.y > s.world.h - m && held.dy > 0)) held.dy = -held.dy;
  return { dx: held.dx, dy: held.dy };
}

/**
 * Which card a player who knows the game takes: a free weapon slot first - four
 * guns is four times the damage - then the ones that kill faster, then the ones
 * that keep you alive, and the magnet last.
 *
 * It is here rather than taking `cards[0]` because the bot's picks decide what
 * the measurement is a measurement OF. A run that spends its first five
 * level-ups on gem reach is not the run a player has, and tuning the game
 * against it would be hardening it against a mistake nobody makes.
 */
const CARD_ORDER: UpgradeId[] = ["rapid", "power", "spread", "pierce", "heart", "swift", "shield", "range", "magnet"];
function bestCard(cards: Card[]): Card {
  // An EVOLUTION first, then a free weapon slot, then a weapon level, then the
  // upgrades that kill fastest. The card union grew on 2026-09-21 (levels and
  // evolutions) and a picker written before that would have read every new card
  // as an unknown and taken it last. Since 2026-09-30 a super (`evolve`) is only
  // ever offered ALONE, after a boss or mini-boss kill, so the first line is the
  // bot taking the only card there is - kept so a regression that mixes a super
  // back into a three-card level-up is still taken first rather than skipped.
  return (
    cards.find((c) => c.kind === "evolve") ??
    cards.find((c) => c.kind === "weapon") ??
    cards.find((c) => c.kind === "level") ??
    [...cards].sort(
      (a, b) => CARD_ORDER.indexOf(a.id as UpgradeId) - CARD_ORDER.indexOf(b.id as UpgradeId),
    )[0]
  );
}

interface Report {
  ms: number;
  phase: string;
  power: number;
  popped: number;
  /** When each level-up happened, in milliseconds. */
  ups: number[];
  /** Super powers taken - each one handed over by a boss or a mini-boss kill. */
  supers: number;
  /** When the LAST stage's boss walked in - the finish this run was built toward. */
  bossAt: number | null;
  stage: number;
  hurt: number;
  /** Bolts thrown at this player over the whole run. */
  incoming: number;
}

function play(level: LevelKey, seed: number, careful: boolean): Report {
  const rng = rngFor(seed);
  // The LANDSCAPE arena, because that is what a PC plays on and it is the harder
  // read: 364 units of height against a 240-unit sight line.
  const s = newRun(level, ARENA_WIDE);
  const held = { dx: 1, dy: 0, until: 0 };
  const ups: number[] = [];
  let ms = 0;
  let hurt = 0;
  let incoming = 0;
  let bossAt: number | null = null;
  let supers = 0;
  while (s.phase === "playing" && ms < 1_800_000) {
    const before = s.shots.length;
    step(s, 16, careful ? kite(s) : stroll(s, rng, held), rng);
    ms += 16;
    hurt += s.events.filter((e) => e.type === "hurt").length;
    incoming += Math.max(0, s.shots.length - before);
    // A LEVEL-UP is a frame that raised one, read off the events - not "the run
    // is paused", which it has been for two reasons since 2026-09-30: a boss or
    // mini-boss kill also pauses it to hand over a SUPER POWER. Counting those
    // as upgrades shortened normal's late gap from 12.6 s to 9.7 s with the
    // xp curve untouched. Once per frame, exactly as the old `choosing` read
    // counted it, so the before and after columns measure the same thing.
    if (s.events.some((e) => e.type === "levelup")) ups.push(ms);
    if (s.choosing) {
      const cards = offerCards(s, rng);
      if (cards.length === 1 && cards[0].kind === "evolve") supers++;
      // The careless one takes whatever is on the left.
      if (cards.length > 0) applyCard(s, careful ? bestCard(cards) : cards[0]);
      else s.choosing = false;
    }
    if (bossAt === null && s.stage === STAGE_COUNT && bossOf(s)) bossAt = ms;
  }
  return { ms, phase: s.phase, power: s.power, popped: s.popped, ups, supers, bossAt, stage: s.stage, hurt, incoming };
}

const mean = (a: number[]) => (a.length ? a.reduce((x, y) => x + y, 0) / a.length : 0);
/** The mean gap between the level-ups in the BACK HALF of a run, in seconds. */
function lateGap(r: Report): number {
  const gaps: number[] = [];
  for (let i = 1; i < r.ups.length; i++) gaps.push(r.ups[i] - r.ups[i - 1]);
  return mean(gaps.slice(Math.floor(gaps.length / 2))) / 1000;
}
const sec = (ms: number) => (ms / 1000).toFixed(0);

const SEEDS = [11, 23, 41, 57, 71];

function runs(level: LevelKey, careful = true): Report[] {
  return SEEDS.map((seed) => {
    const r = play(level, seed, careful);
    console.log(
      `${level.padEnd(6)} ${careful ? "kite  " : "stroll"} seed ${String(seed).padStart(2)}  ` +
        `${r.phase.padEnd(7)} total ${sec(r.ms).padStart(3)}s  ` +
        `boss ${r.bossAt === null ? " -  " : sec(r.bossAt) + "s"}  ` +
        `stage ${r.stage}  power ${String(r.power).padStart(2)}  popped ${String(r.popped).padStart(4)}  ` +
        `hurt ${r.hurt}  incoming ${String(r.incoming).padStart(3)}  ` +
        `late upgrade gap ${lateGap(r).toFixed(0)}s  supers ${r.supers}`,
    );
    return r;
  });
}

describe("a run is as long as the operator asked for", () => {
  it("calm still finishes in about three minutes, and nothing shoots at it", () => {
    const rs = runs("calm");
    for (const r of rs) {
      expect(r.phase, "the careful arm cannot finish easy mode").toBe("won");
      // Three stages of swarm plus three boss fights. Unchanged from before the
      // 2026-09-21 hardening, which is the whole promise made about this level.
      expect(r.ms).toBeGreaterThan(runMs("calm"));
      expect(r.ms).toBeLessThan(runMs("calm") + 120_000);
      expect(r.incoming, "something shot at an easy run").toBe(0);
    }
  });

  it("medium is about five and a half minutes, and something shoots at you in it", () => {
    const rs = runs("normal");
    for (const r of rs) {
      expect(r.phase).toBe("won");
      expect(r.ms).toBeGreaterThan(runMs("normal"));
      expect(r.ms).toBeLessThan(runMs("normal") + 150_000);
    }
    expect(Math.max(...rs.map((r) => r.incoming)), "nothing shot at a medium run").toBeGreaterThan(0);
  });

  it("HARD IS EIGHT TO TEN MINUTES, which is the number that was asked for", () => {
    const rs = runs("wild");
    const won = rs.filter((r) => r.phase === "won");
    // Winnable, or it is not a difficulty change, it is a wall.
    expect(won.length, "the careful arm never finished hard mode").toBeGreaterThan(0);
    for (const r of won) {
      // Measured 2026-09-21: 8:53 and 9:24, against an operator window of 8 to
      // 10 minutes. A real player is slower than a bot that never misfires a
      // step, and the top of the window is where that room is.
      expect(r.ms).toBeGreaterThan(8 * 60_000);
      expect(r.ms).toBeLessThan(10 * 60_000);
    }
    // And it really is hard: the arm that wins every calm and every medium run
    // does not win every wild one.
    expect(rs.some((r) => r.phase === "over"), "hard mode never killed the careful arm").toBe(true);
  });
});

describe("upgrades are further apart than they were", () => {
  it("the back half of a hard run waits, where it used to hand one out every few seconds", () => {
    // BEFORE, on the tree this landed on: a wild run took 30 to 34 cards in about
    // 200 seconds - one every six. The operator's words were *"every 5-18 seconds
    // in advanced levels"*, and that is what a LINEAR xp cost buys. The quadratic
    // term is the fix, and on medium it is deliberately small: the length of the
    // run is what slows that level down, because a steeper cost there starves the
    // evolutions `economy.test.ts` measures.
    const wild = runs("wild").map(lateGap);
    const normal = runs("normal").map(lateGap);
    const calm = runs("calm").map(lateGap);
    console.log(
      `late upgrade gaps: calm ${calm.map((g) => g.toFixed(0)).join("/")}s  ` +
        `normal ${normal.map((g) => g.toFixed(0)).join("/")}s  wild ${wild.map((g) => g.toFixed(0)).join("/")}s`,
    );

    // Harder means rarer, in order, and calm is the control: it is untouched, so
    // it is still the level that showers you with cards.
    expect(mean(calm)).toBeLessThan(mean(normal));
    expect(mean(normal)).toBeLessThan(mean(wild));
    // The FLOOR is what was asked for: nothing in the back half of a hard run
    // arrives every few seconds any more. Measured at 18.8 s on five seeds.
    expect(mean(wild)).toBeGreaterThan(14);
  });
});

describe("the careless arm is the other side of the bracket", () => {
  it("easy forgives it, hard does not", () => {
    // What this can and cannot say: a level the CARELESS arm finishes is asking
    // nothing of anybody, and a level the CAREFUL arm cannot finish is broken.
    // Between those two it says nothing at all, and the operator's own play is
    // what fills the gap.
    const careless: Record<string, ReturnType<typeof runs>> = {};
    for (const level of ["calm", "wild"] as LevelKey[]) careless[level] = runs(level, false);

    // EASY MODE FORGIVES: a careless player gets DEEP into calm - to its last
    // stage and its golem - where the same player on wild never sees one.
    //
    // NOT "it wins", which is what this asserted when it was first written
    // against a tree where calm had a single boss at three minutes. Calm has
    // three bosses now (main's campaign, 2026-09-21) and a bot that wanders
    // through a boss fight can lose one. Asserting a win here would have been
    // asserting something about MAIN's design that this change never touched,
    // and it went red for exactly that reason.
    expect(
      careless.calm.filter((r) => r.bossAt !== null).length,
      "a careless run never even reached easy mode's last boss",
    ).toBeGreaterThan(0);

    // HARD MODE DOES NOT: the same player never reaches the last stage's golem.
    for (const r of careless.wild) {
      expect(r.phase, "a careless run beat hard mode").toBe("over");
      expect(r.bossAt, "a careless run reached hard mode's golem").toBeNull();
    }

    // A NOTE ON THE INSTRUMENT, because it cost two wrong versions of this test:
    // `ms` is how long a run LASTED, which is not how long it survived. A
    // careless arm that wanders away from a boss takes LONGER on calm, because
    // the fight drags - it did not do better, it finished worse. Every claim here
    // is therefore about the PHASE, never about the clock.
    expect(mean(careless.calm.map((r) => r.ms))).toBeGreaterThan(mean(runs("calm").map((r) => r.ms)));
  });
});
