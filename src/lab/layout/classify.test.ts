import { describe, it, expect } from "vitest";
import { measure, flagsOf, consistency, suggestClass, THRESHOLDS } from "./classify";
import type { Box, Item, Report } from "./types";

/*
 * FIXTURES, clearly marked: hand-built boxes shaped like the pages they name,
 * so the judging half can be driven without a browser. The READING half is
 * checked against the real pages by T3's agreement run, never here.
 */
const box = (x: number, y: number, w: number, h: number): Box => ({ x, y, w, h });
const item = (p: Partial<Item> & Pick<Item, "role" | "place" | "box">): Item => ({
  label: p.role, tap: true, state: "ok", hidden: 0, ...p,
});
/** Sudoku at 1536x639 today: numbers row above a 384px board, keypad beside it. */
const sudokuLaptop = (): Report => ({
  vw: 1536, vh: 639, scale: 1, inPlay: 0,
  regions: { bar: box(0, 0, 1536, 60), tools: box(416, 60, 704, 60), row: box(416, 126, 704, 74), footer: box(1166, 206, 370, 400) },
  board: box(576, 210, 384, 384),
  items: [
    item({ role: "difficulty", place: "row", box: box(428, 138, 322, 56) }),
    item({ role: "number", place: "row", box: box(760, 138, 178, 56), tap: false }),
    item({ role: "platform", place: "tools", box: box(848, 68, 44, 44) }),
    item({ role: "action", place: "footer", box: box(1182, 368, 40, 44) }),
  ],
});
/** Snake at 1536x639 on origin/main: a band on the board, nothing above it. */
const snakeLaptop = (): Report => ({
  vw: 1536, vh: 639, scale: 1, inPlay: 0,
  regions: { bar: box(0, 0, 1536, 60), band: box(548, 70, 440, 44) },
  board: box(548, 70, 440, 560),
  items: [
    item({ role: "number", place: "band", box: box(560, 76, 80, 32), tap: false }),
    item({ role: "action", place: "board", box: box(700, 300, 140, 49) }),
  ],
});

describe("measure", () => {
  it("reads the board against the WINDOW, not its row", () => {
    const m = measure(sudokuLaptop());
    expect(m.boardArea).toBeCloseTo((384 * 384) / (1536 * 639), 5);
    expect(m.boardWidth).toBeCloseTo(384 / 1536, 5);
  });
  it("counts what sits above the board as its cost", () => {
    expect(measure(sudokuLaptop()).aboveBoard).toBe(74);
    expect(measure(snakeLaptop()).aboveBoard).toBe(0);
  });
  it("a strip UNDER the board costs nothing above it", () => {
    const r = snakeLaptop();
    r.regions.strip = box(548, 632, 440, 64); // the end-of-run strip, in flow below
    expect(measure(r).aboveBoard).toBe(0);
  });
  it("finds the empty height under everything - the phone's waste", () => {
    const r = sudokuLaptop();
    expect(measure(r).emptyBelow).toBe(639 - 606); // footer bottom is the lowest thing
  });
  it("a report with no board measures nothing rather than zero", () => {
    const r = { ...sudokuLaptop(), board: null };
    expect(measure(r).boardArea).toBeNull();
  });
});

describe("flags", () => {
  it("sudoku today: buttons above the board", () => {
    expect(flagsOf(sudokuLaptop(), "laptop", THRESHOLDS)).toContain("above");
  });
  it("snake: nothing above, nothing cut, nothing small", () => {
    const f = flagsOf(snakeLaptop(), "laptop", THRESHOLDS);
    expect(f).not.toContain("above");
    expect(f).not.toContain("cut");
    expect(f).not.toContain("small");
  });
  it("a tappable control under 44px is small; a readout is not", () => {
    const r = sudokuLaptop();
    expect(flagsOf(r, "laptop", THRESHOLDS)).toContain("small"); // the 40px key
    r.items = r.items.filter((i) => i.role !== "action");
    r.items.push(item({ role: "number", place: "row", box: box(0, 0, 20, 20), tap: false }));
    expect(flagsOf(r, "laptop", THRESHOLDS)).not.toContain("small");
  });
  it("the site's own bar is reported apart - one site defect is not 47 game defects", () => {
    const r = snakeLaptop();
    r.items.push(item({ role: "platform", place: "tools", box: box(436, 67, 38, 46), state: "cut", hidden: 12 }));
    expect(flagsOf(r, "laptop", THRESHOLDS)).not.toContain("cut");
    expect(flagsOf(r, "laptop", THRESHOLDS)).not.toContain("small");
    expect(measure(r).platform).toHaveLength(1);
  });
  it("a control cut or off the window is cut", () => {
    const r = snakeLaptop();
    r.items.push(item({ role: "action", place: "footer", box: box(1500, 600, 60, 60), state: "off", hidden: 24 }));
    expect(flagsOf(r, "laptop", THRESHOLDS)).toContain("cut");
  });
  it("a small board is wasted screen; a big one is not", () => {
    expect(flagsOf(sudokuLaptop(), "laptop", THRESHOLDS)).toContain("wasted");
    expect(flagsOf(snakeLaptop(), "laptop", THRESHOLDS)).not.toContain("wasted");
  });
  it("an error report is flagged as an error, never as clean", () => {
    const r: Report = { ...sudokuLaptop(), error: "timed out" };
    expect(flagsOf(r, "laptop", THRESHOLDS)).toEqual(["error"]);
  });
});

describe("consistency", () => {
  it("names the game whose difficulty is somewhere the others' is not", () => {
    const put = (place: Item["place"]): Report => ({ ...snakeLaptop(), items: [item({ role: "difficulty", place, box: box(0, 0, 60, 60) })] });
    const out = consistency({ a: put("row"), b: put("row"), c: put("side") });
    expect(out.c).toEqual([{ role: "difficulty", place: "side", usual: "row" }]);
    expect(out.a).toEqual([]);
  });
  it("platform buttons are never compared - they are the site's, not the game's", () => {
    const put = (place: Item["place"]): Report => ({ ...snakeLaptop(), items: [item({ role: "platform", place, box: box(0, 0, 60, 60) })] });
    expect(consistency({ a: put("tools"), b: put("tools"), c: put("bar") }).c).toEqual([]);
  });
});

describe("suggested class", () => {
  it("every game control on the board -> onGame", () => {
    expect(suggestClass(snakeLaptop())).toBe("onGame");
  });
  it("a keypad beside the board -> outside", () => {
    expect(suggestClass(sudokuLaptop())).toBe("outside");
  });
  it("no board read -> no suggestion", () => {
    expect(suggestClass({ ...snakeLaptop(), board: null })).toBeNull();
  });
});
