// Where a game's buttons sit is declared in its DOM-free `meta.ts`, one line:
//
//     layout: "table",
//
// THE GAME TABLE (operator ruling 2026-09-28): the level, the numbers, restart
// and pause are pieces on a mat, the game's own controls sit in a tray, the
// app's buttons stay in the corners. Absent means the layout every game had
// before. Games move one at a time, each through a before/after the operator
// has seen, so the set of games on the table is PINNED below: a game joining
// or leaving is a red build naming itself, never a one-line edit nobody saw.
//
// (This file used to check a `{ phone, pc }` pick of "onGame" / "outside",
// written by the lab's picker. Both looks were rejected on 2026-09-28 in
// favour of the table, which is one layout on both screens.)
import { describe, it, expect } from "vitest";
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

const GAMES_DIR = new URL(".", import.meta.url).pathname;

/** The games on the table, in the order they moved. Add one only with its before/after. */
const ON_THE_TABLE = ["sudoku", "snake", "coloring", "memory", "wordguess", "2048", "tictactoe", "flow", "onestroke", "nonogram", "parking", "minesweeper", "arrowtap", "fit", "merge", "hidden", "jigsaw", "echo", "sequence", "reaction", "backgammon", "match3", "sort", "music", "finddiff", "blocks", "pet", "fruit", "untangle", "math"];

const METAS = readdirSync(GAMES_DIR, { withFileTypes: true })
  .filter((e) => e.isDirectory() && existsSync(join(GAMES_DIR, e.name, "meta.ts")))
  .map((e) => {
    const src = readFileSync(join(GAMES_DIR, e.name, "meta.ts"), "utf8");
    return { id: src.match(/\bid: *"([^"]+)"/)?.[1] ?? e.name, src };
  });

/** What is wrong with this meta.ts's layout line, or null when nothing is. */
function layoutFault(src: string): string | null {
  const lines = src.split("\n").filter((l) => /^\s*layout\s*:/.test(l));
  if (lines.length === 0) return null;
  if (lines.length > 1) return `declares layout ${lines.length} times`;
  if (lines[0] !== `  layout: "table",`) return `has a layout line in a shape nothing reads: ${lines[0].trim()}`;
  return null;
}
const onTable = (src: string) => /^ {2}layout: "table",$/m.test(src);

describe("where each game says its buttons sit", () => {
  it("reads the whole roster", () => {
    expect(METAS.length).toBeGreaterThanOrEqual(47);
    expect(new Set(METAS.map((m) => m.id)).size).toBe(METAS.length);
  });

  it.each(METAS.map((m) => [m.id, m.src] as const))("%s", (id, src) => {
    expect(layoutFault(src), `${id}/meta.ts ${layoutFault(src)}`).toBeNull();
  });

  it("the layout gate's planted control is a game NOT on the table", () => {
    // On the table the numbers leave the row above the board, so a plant that
    // pads that row pushes nothing and assert:layout goes silent - it did,
    // twice, on 2026-09-28 (sudoku, then memory).
    const gate = readFileSync(join(GAMES_DIR, "../lab/layout/gate.ts"), "utf8");
    const control = gate.match(/export const CONTROL = "([^"]+)"/)?.[1];
    expect(control).toBeTruthy();
    expect(METAS.map((m) => m.id)).toContain(control);
    expect(ON_THE_TABLE).not.toContain(control);
  });

  it("the games on the table are exactly the ones that were shown", () => {
    expect(METAS.filter((m) => onTable(m.src)).map((m) => m.id).sort()).toEqual([...ON_THE_TABLE].sort());
  });
});

describe("the check itself, on planted lines", () => {
  const META = `export const meta: GameMeta = {\n  id: "x",\n  tier: "simple",\n};\n`;
  const plant = (line: string) => META.replace(`  tier: "simple",\n`, `  tier: "simple",\n${line}\n`);

  it("passes a game that has not moved", () => {
    expect(layoutFault(META)).toBeNull();
    expect(onTable(META)).toBe(false);
  });

  it("passes the one line a game on the table carries", () => {
    const src = plant(`  layout: "table",`);
    expect(layoutFault(src)).toBeNull();
    expect(onTable(src)).toBe(true);
  });

  it("refuses the old picker's shape", () => {
    expect(layoutFault(plant(`  layout: { phone: "outside", pc: "onGame" },`))).toMatch(/nothing reads/);
  });

  it("refuses a second layout line", () => {
    expect(layoutFault(plant(`  layout: "table",\n  layout: "table",`))).toMatch(/2 times/);
  });

  it("refuses a line the pin would not see", () => {
    expect(layoutFault(plant(`  layout: 'table',`))).toMatch(/nothing reads/);
  });
});
