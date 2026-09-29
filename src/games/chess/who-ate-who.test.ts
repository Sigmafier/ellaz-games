import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { applyMove, captures, fromFen, legalMoves, squareIndex, startPosition, type Position } from "./logic";

/**
 * "Show who ate who" - a player report, 2026-09-27, Android. The rows under
 * the board are drawn from `captures()`, so every clause of what they show is
 * decided here, in node, off the same list of positions the game keeps and
 * saves.
 */

/** Play one move by its squares on the last position, and return the longer list. */
function play(list: Position[], from: string, to: string, promo?: "q" | "r" | "b" | "n"): Position[] {
  const p = list[list.length - 1];
  const m = legalMoves(p).find(
    (x) => x.from === squareIndex(from) && x.to === squareIndex(to) && (promo ? x.promo === promo : !x.promo),
  );
  if (!m) throw new Error(`${from}-${to}${promo ?? ""} is not legal in this position`);
  return [...list, applyMove(p, m)];
}

function game(moves: string[], start: Position = startPosition()): Position[] {
  let list = [start];
  for (const mv of moves) list = play(list, mv.slice(0, 2), mv.slice(2, 4), (mv[4] as "q") || undefined);
  return list;
}

describe("who ate who", () => {
  it("an untouched board has nobody ahead and nothing taken", () => {
    expect(captures([startPosition()])).toEqual({ w: [], b: [], lead: null });
  });

  it("a pawn each for a pawn each is level", () => {
    // 1.e4 d5 2.exd5 Qxd5
    const c = captures(game(["e2e4", "d7d5", "e4d5", "d8d5"]));
    expect(c).toEqual({ w: ["p"], b: ["p"], lead: null });
  });

  it("puts each piece in the row of the side that TOOK it, and says who leads", () => {
    // 1.e4 e5 2.Nf3 Nc6 3.Bb5 a6 4.Bxc6 dxc6 5.Nxe5 - white gave a bishop for a
    // knight and then took a pawn: white is a pawn up.
    const c = captures(game(["e2e4", "e7e5", "g1f3", "b8c6", "f1b5", "a7a6", "b5c6", "d7c6", "f3e5"]));
    expect(c.w).toEqual(["p", "n"]);
    expect(c.b).toEqual(["b"]);
    expect(c.lead).toEqual({ side: "w", by: 1 });
  });

  it("lays a row out smallest first, whatever order the pieces fell in", () => {
    // White takes the queen first and a pawn after it.
    const start = fromFen("4k3/8/8/8/8/8/p2q4/3RK3 w - - 0 1");
    const c = captures(game(["d1d2", "e8e7", "d2a2"], start));
    expect(c.w).toEqual(["p", "q"]);
    expect(c.b).toEqual([]);
    expect(c.lead).toEqual({ side: "w", by: 5 });
  });

  it("counts an en passant capture, whose pawn is not on the landing square", () => {
    // 1.e4 a6 2.e5 d5 3.exd6 e.p.
    const list = game(["e2e4", "a7a6", "e4e5", "d7d5", "e5d6"]);
    expect(captures(list).w).toEqual(["p"]);
  });

  it("a capture that promotes takes one piece, and the LEAD reads the new queen", () => {
    // b7xa8=Q: black loses a rook, white's pawn becomes a queen.
    const start = fromFen("r3k3/1P6/8/8/8/8/8/4K3 w - - 0 1");
    const c = captures(game(["b7a8q"], start));
    expect(c.w).toEqual(["r"]);
    expect(c.b).toEqual([]);
    // before: white 1 v black 5. after: white 9 v black 0.
    expect(c.lead).toEqual({ side: "w", by: 9 });
  });

  it("black ahead reads as black", () => {
    // 1.e4 d5 2.Nc3 dxe4 - black is a pawn up.
    const c = captures(game(["e2e4", "d7d5", "b1c3", "d5e4"]));
    expect(c).toEqual({ w: [], b: ["p"], lead: { side: "b", by: 1 } });
  });

  it("taking a move back takes the capture back with it", () => {
    const list = game(["e2e4", "d7d5", "e4d5", "d8d5"]);
    // take-back undoes two plies - the reply and the move that invited it
    expect(captures(list.slice(0, -2))).toEqual({ w: [], b: [], lead: null });
    expect(captures(list.slice(0, -1))).toEqual({ w: ["p"], b: [], lead: { side: "w", by: 1 } });
  });

  it("a new game is one position, so the rows are empty", () => {
    expect(captures([startPosition()]).w).toHaveLength(0);
    expect(captures([]).lead).toBeNull();
  });
});

/**
 * The rows are drawn in Chess.tsx, and the three things that can go wrong there
 * are the three this game already paid for once: a piece in a theme colour (the
 * two armies collided at night), the pawn drawn as an emoji (an iPhone showed
 * every pawn black), and a row that changes height (it moves the board).
 */
describe("the rows are drawn by the board's own rules", () => {
  const SRC = readFileSync(new URL("./Chess.tsx", import.meta.url), "utf8");
  const row = SRC.slice(SRC.indexOf("function TakenRow("), SRC.indexOf("const DIFF_OPTIONS"));
  const hexOf = (name: string) => SRC.match(new RegExp(`const ${name} = "(#[0-9a-fA-F]{6})"`))![1];
  const lum = (h: string) => {
    const v = [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16) / 255);
    const l = v.map((u) => (u <= 0.03928 ? u / 12.92 : ((u + 0.055) / 1.055) ** 2.4));
    return 0.2126 * l[0] + 0.7152 * l[1] + 0.0722 * l[2];
  };
  const ratio = (a: string, b: string) => {
    const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p);
    return (x + 0.05) / (y + 0.05);
  };

  it("finds the row component (population guard)", () => {
    expect(row.length).toBeGreaterThan(200);
  });

  it("draws every piece from the GLYPH table - the one that carries the pawn's text selector", () => {
    expect(row).toContain("{GLYPH[p]}");
    expect(row).toContain("{GLYPH.k}");
    // no glyph typed straight into the row, which would skip U+FE0E
    expect(row).not.toMatch(/[\u2654-\u265F]/);
  });

  it("inks both armies with the fixed pair and the other army's outline, never a theme token", () => {
    const ink = SRC.slice(SRC.indexOf("function inkOf("), SRC.indexOf("const TAKEN_ROW"));
    expect(ink).toMatch(/color: side === "w" \? LIGHT_ARMY : DARK_ARMY/);
    expect(ink).toMatch(/WebkitTextStroke: `[^`]*\$\{side === "w" \? DARK_ARMY : LIGHT_ARMY\}`/);
    expect(ink).toContain('paintOrder: "stroke fill"');
    expect(ink).not.toContain("var(--");
    expect(row).toContain("...inkOf(victim)");
  });

  it("sits on a tone BOTH armies read on by their fill, in every theme", () => {
    const tray = SRC.slice(SRC.indexOf("<TakenRow") - 600, SRC.indexOf("<TakenRow"));
    expect(tray).toMatch(/background: DARK_SQ,/);
    expect(ratio(hexOf("LIGHT_ARMY"), hexOf("DARK_SQ"))).toBeGreaterThanOrEqual(3);
    expect(ratio(hexOf("DARK_ARMY"), hexOf("DARK_SQ"))).toBeGreaterThanOrEqual(3);
    // the lead is TEXT, so it is held to 4.5 on its own chip
    expect(row).toMatch(/color: DARK_ARMY,\s*background: LIGHT_SQ,/);
    expect(ratio(hexOf("DARK_ARMY"), hexOf("LIGHT_SQ"))).toBeGreaterThanOrEqual(4.5);
  });

  it("reserves its height, so a capture cannot move the board", () => {
    expect(row).toMatch(/height: TAKEN_ROW,/);
    expect(row).toMatch(/overflow: "hidden"/);
    expect(row).toMatch(/whiteSpace: "nowrap"/);
  });
});
