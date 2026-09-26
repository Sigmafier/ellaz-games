import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { applyMove, fromFen, legalMoves, outcome, positionKey, startPosition, toFen } from "./logic";

const SRC = readFileSync(new URL("./Chess.tsx", import.meta.url), "utf8");

/**
 * The saved position, read two ways.
 *
 * The ROUND TRIP is checked against the rules module, which is where a real
 * corruption would show. The two SOURCE assertions under it exist because the
 * traps this repo has already paid for - paying twice on a resume, and a state
 * only a timer can leave reaching the disk - live in the renderer, and a
 * renderer's behaviour has no unit this file can call without a DOM.
 */
describe("the saved position", () => {
  it("survives the round trip the snapshot actually makes", () => {
    // The snapshot is a list of FENs, so the thing that must hold is that a
    // game written out and read back is the SAME game - board, turn, castling
    // rights, the en passant square and the fifty-move clock included. A FEN
    // that loses any of those restores a position the rules judge differently.
    let p = startPosition();
    const fens = [toFen(p)];
    // A line that exercises the fields a naive FEN drops: a double push (which
    // sets the ep square), a capture (which zeroes the halfmove clock), and
    // moves that leave the castling rights alone.
    for (const san of ["e2e4", "c7c5", "g1f3", "d7d6", "f1b5"]) {
      const m = legalMoves(p).find((x) => `${toSq(x.from)}${toSq(x.to)}` === san)!;
      expect(m, san).toBeDefined();
      p = applyMove(p, m);
      fens.push(toFen(p));
    }
    const back = fens.map(fromFen);
    expect(back.map(toFen)).toEqual(fens);
    expect(positionKey(back[back.length - 1])).toBe(positionKey(p));
    expect(legalMoves(back[back.length - 1]).length).toBe(legalMoves(p).length);
  });

  it("is never written while the computer is thinking", () => {
    // `thinking` is a state only a TIMER can leave. A snapshot caught inside it
    // and restored would be a board waiting forever for a reply nobody
    // scheduled - the memory-lock trap, exactly. The snapshot is the level and
    // the list of FENs and nothing else, so the state cannot be in it.
    // The window is the CALL, found by its own closing paren - a fixed slice
    // read past the end of it and flagged a latch in the next function, which
    // is a false positive this file would have shipped as a finding.
    const at = SRC.indexOf("useGameSession(");
    const call = SRC.slice(at, SRC.indexOf("});", at) + 3);
    expect(call).toContain("fens: positions.map(toFen)");
    for (const banned of ["thinking", "promoting", "pick"]) {
      expect(call, `the snapshot must not carry \`${banned}\``).not.toContain(banned);
    }
  });

  it("stops saving the moment the game ends, so a finished board is never restored", () => {
    // `live: false` CLEARS. Restoring a checkmate would show a child a board
    // with nothing left to do; it is also the only door through which a
    // restored position could reach the win path a second time.
    expect(SRC).toMatch(/live:\s*!done\s*&&\s*!versus/);
    // And the restore refuses one anyway, because a snapshot written in the
    // same tick as the winning move could still be on the disk.
    expect(SRC).toContain('outcome(last, list.slice(0, -1).map(positionKey)).kind === "playing"');
  });

  it("a restored game that is already over is discarded by the rules, not by a flag", () => {
    // The check above is a string; this is the behaviour behind it. Fool's
    // mate, written out and read back, is still checkmate - so the restore
    // path's `outcome(...) === "playing"` test refuses it.
    const mated = fromFen("rnb1kbnr/pppp1ppp/8/4p3/6Pq/5P2/PPPPP2P/RNBQKBNR w KQkq - 1 3");
    expect(outcome(fromFen(toFen(mated))).kind).toBe("checkmate");
  });
});

const toSq = (i: number) => "abcdefgh"[i & 7] + String(8 - (i >> 3));

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
