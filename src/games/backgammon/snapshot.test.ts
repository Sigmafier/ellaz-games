import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { applyGameResult, gameResult, matchOver, startGame, type Board } from "./logic";

const SRC = readFileSync(new URL("./Backgammon.tsx", import.meta.url), "utf8");

function board(points: Record<number, number>, off = { w: 0, b: 0 }): Board {
  const p: number[] = new Array(26).fill(0);
  for (const [k, v] of Object.entries(points)) p[Number(k)] = v;
  return { points: p, bar: { w: 0, b: 0 }, off: { ...off } };
}

describe("the saved position", () => {
  it("is the MATCH, never a half-played turn", () => {
    // `played` and `pending` are both states only a tap or a timer can leave.
    // A snapshot caught inside either restores a board mid-turn with dice that
    // have already been spent and no way to finish - the same shape as a
    // memory board restored mid-flip.
    const at = SRC.indexOf("useGameSession(");
    const call = SRC.slice(at, SRC.indexOf("});", at) + 3);
    expect(call).toContain("game }");
    for (const banned of ["played", "pending", "thinking", "pick", "offer"]) {
      expect(call, `the snapshot must not carry \`${banned}\``).not.toContain(banned);
    }
  });

  it("stops saving once the match is decided or a game has ended", () => {
    expect(SRC).toMatch(/live:\s*!champion\s*&&\s*!game\.over\s*&&\s*!versus/);
    // And the restore refuses a finished game for the same reason chess does.
    expect(SRC).toContain("!restored.game.over");
  });

  it("pays the MATCH once and a single game as a milestone, so five games are not five matches", () => {
    // The arithmetic behind the latch. A match to five can take five games,
    // and paying `level_complete` for each would pay a whole match five times
    // over - so a game inside the match is a `milestone`, which is one coin
    // and no star, and only `matchOver` reaches `winMoment` with a tier.
    let g = startGame(5);
    let games = 0;
    while (!matchOver(g)) {
      // A whitewash: white bears all fifteen off while black has none, which
      // is a gammon - two points a game, so the match takes three games.
      const won = board({}, { w: 15, b: 0 });
      const r = gameResult(won)!;
      expect(r.points).toBe(2);
      g = applyGameResult({ ...g, board: won }, r);
      games++;
      if (!matchOver(g)) g = { ...g, board: startGame(5).board, over: undefined };
    }
    expect(games).toBe(3);
    expect(matchOver(g)).toBe("w");
    // One `level_complete` in the whole file, and it is inside `bank`, which
    // only `settle` calls and only when `matchOver` answered.
    expect(SRC.match(/reason: "level_complete"/g)?.length).toBe(1);
    expect(SRC.match(/reason: "milestone"/g)?.length).toBe(1);
    expect(SRC).toContain("if (paidRef.current) return;");
  });
});

/**
 * Every `setX((prev) => ...)` body in a source file, found by WALKING the
 * parentheses rather than by matching a pattern. A regex ending at the first
 * `)` it meets would stop inside the body's own calls and report every updater
 * as clean - this repo has paid for that mistake twice, in a match-3 cell and
 * in a purity gate.
 */
function updaterBodies(src: string): string[] {
  const out: string[] = [];
  // `setTimeout` and `setInterval` start with `set` and a capital too, and
  // their callbacks legitimately hold side effects - the first version of
  // this walker flagged one and reported a correct file as broken.
  const re = /set(?!Timeout|Interval)[A-Z]\w*\(\s*\(/g;
  for (let m = re.exec(src); m; m = re.exec(src)) {
    const open = src.indexOf("(", m.index);
    let depth = 0;
    for (let j = open; j < src.length; j++) {
      if (src[j] === "(") depth++;
      else if (src[j] === ")" && --depth === 0) {
        out.push(src.slice(open + 1, j));
        break;
      }
    }
  }
  return out;
}

describe("side effects", () => {
  it("never fire from inside a state updater", () => {
    // React may run an updater twice. For `winMoment` that is a double grant,
    // and this file's first draft did exactly that behind a `queueMicrotask`,
    // which reads as "outside the updater" and is not. The board is computed
    // in the handler; the updater only stores it.
    const bodies = updaterBodies(SRC);
    expect(bodies.length, "no updaters found - the walker is broken").toBeGreaterThan(2);
    for (const body of bodies) {
      for (const banned of ["winMoment(", "settle(", "burst(", "ctx.audio", "queueMicrotask"]) {
        expect(body, `\`${banned}\` inside a state updater`).not.toContain(banned);
      }
    }
  });
});
