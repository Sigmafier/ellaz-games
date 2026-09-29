import { describe, expect, it } from "vitest";
import { BOARD_MAX_TILE, BOARD_MIN_TILE, boardLayout } from "./board";
import type { BoardLayout } from "./board";
import type { Box } from "./trail";

const PC: Box = { width: 1536, height: 639 };
const PHONE: Box = { width: 390, height: 844 };
const MORE: Box[] = [{ width: 1920, height: 1080 }, { width: 1024, height: 600 }, { width: 360, height: 640 }, { width: 412, height: 915 }];
const COUNTS = [1, 5, 12, 20, 40, 100];

function problems(b: BoardLayout, count: number): string[] {
  const bad: string[] = [];
  if (b.tiles.length !== count) bad.push(`${b.tiles.length} tiles for ${count}`);
  if (b.size < BOARD_MIN_TILE) bad.push(`tile ${b.size}px is under a tap target`);
  if (b.size > BOARD_MAX_TILE) bad.push(`tile ${b.size}px is over the cap`);
  b.tiles.forEach((t, i) => {
    if (t.x < b.insets.side || t.x + b.size > b.width - b.insets.side) bad.push(`tile ${i} x ${t.x.toFixed(0)}`);
    if (t.y < b.insets.top || t.y + b.size > b.height - b.insets.bottom) bad.push(`tile ${i} y ${t.y.toFixed(0)}`);
  });
  for (let i = 0; i < b.tiles.length; i++) {
    for (let j = i + 1; j < b.tiles.length; j++) {
      const a = b.tiles[i], c = b.tiles[j];
      if (Math.abs(a.x - c.x) < b.size + 4 && Math.abs(a.y - c.y) < b.size + 4) bad.push(`tiles ${i} and ${j} touch`);
    }
  }
  return bad;
}

describe("the board map: a grid of numbered tiles", () => {
  it.each(COUNTS)("fits %i levels on a PC at 1536x639", (n) => {
    const b = boardLayout(n, PC);
    expect(problems(b, n)).toEqual([]);
    expect(b.width).toBe(PC.width);
  });

  it.each(COUNTS)("fits %i levels on a phone at 390x844", (n) => {
    const b = boardLayout(n, PHONE);
    expect(problems(b, n)).toEqual([]);
    expect(b.width).toBe(PHONE.width);
    expect(b.height).toBeGreaterThanOrEqual(PHONE.height);
  });

  it("does not scroll when the levels fit, and does once they do not", () => {
    expect(boardLayout(12, PC).height).toBe(PC.height);
    expect(boardLayout(12, PHONE).height).toBe(PHONE.height);
    expect(boardLayout(100, PHONE).height).toBeGreaterThan(PHONE.height);
  });

  it("reads in rows, left to right and top to bottom", () => {
    const b = boardLayout(12, PHONE);
    expect(b.tiles[1].x).toBeGreaterThan(b.tiles[0].x);
    expect(b.tiles[b.cols].y).toBeGreaterThan(b.tiles[0].y);
    expect(b.tiles[b.cols].x).toBe(b.tiles[0].x);
  });

  it("fits on other real screens too", () => {
    for (const box of MORE) for (const n of COUNTS) expect(problems(boardLayout(n, box), n), `${box.width}x${box.height} n=${n}`).toEqual([]);
  });

  it("refuses zero levels and a box with no size", () => {
    expect(() => boardLayout(0, PC)).toThrow();
    expect(() => boardLayout(5, { width: 200, height: -1 })).toThrow();
  });
});
