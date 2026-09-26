import { describe, it, expect } from "vitest";
import { mulberry32, seedFrom } from "@shared/rng";
import {
  COLS,
  DEATH_ROW,
  DIFFICULTIES,
  MAX_COLS,
  colsForBox,
  pcPlan,
  savedCols,
  shotsFor,
  DROP_POINTS,
  FIELD_H,
  FIELD_ROWS,
  fieldW,
  launcher,
  LEVELS,
  MATCH_MIN,
  MAX_ANGLE,
  POP_POINTS,
  ROW_H,
  aim,
  at,
  boardColors,
  cellCenter,
  fire,
  floaters,
  isCleared,
  isDead,
  isOffset,
  matchGroup,
  neighbors,
  newGame,
  pickColor,
  pushRow,
  rowWidth,
  scoreReport,
  seededGame,
  type Cell,
  type ShooterState,
} from "./logic";

const rngFrom = (s: string) => mulberry32(seedFrom(s));

/** An empty board at `level`, so a test can place exactly what it means to test. */
function bare(level: "easy" | "medium" | "hard" = "easy", shift: 0 | 1 = 0): ShooterState {
  const s = newGame(level, rngFrom("bare"));
  return {
    ...s,
    rows: Array.from({ length: FIELD_ROWS }, (_, r) =>
      Array.from({ length: rowWidth(r, shift, COLS) }, () => null as number | null),
    ),
    shift,
  };
}

function put(s: ShooterState, cells: Array<[number, number, number]>): ShooterState {
  const rows = s.rows.map((r) => r.slice());
  for (const [r, c, color] of cells) rows[r][c] = color;
  return { ...s, rows };
}

describe("the hex grid", () => {
  it("staggers rows and keeps every centre inside the field", () => {
    for (const shift of [0, 1] as const) {
      for (let r = 0; r < FIELD_ROWS; r++) {
        expect(rowWidth(r, shift, COLS)).toBe(isOffset(r, shift) ? COLS - 1 : COLS);
        for (let c = 0; c < rowWidth(r, shift, COLS); c++) {
          const p = cellCenter(r, c, shift);
          expect(p.x).toBeGreaterThanOrEqual(0.5);
          expect(p.x).toBeLessThanOrEqual(fieldW(COLS) - 0.5);
        }
      }
    }
  });

  it("touches exactly the six cells that are one bubble away, and no others", () => {
    // The geometric statement of what a neighbour IS. A hand-written offset
    // table can be wrong in a way that still looks plausible; a distance check
    // cannot, because it is the definition rather than a restatement of it.
    for (const shift of [0, 1] as const) {
      for (let r = 0; r < FIELD_ROWS; r++) {
        for (let c = 0; c < rowWidth(r, shift, COLS); c++) {
          const me = cellCenter(r, c, shift);
          const expected: string[] = [];
          for (let r2 = 0; r2 < FIELD_ROWS; r2++) {
            for (let c2 = 0; c2 < rowWidth(r2, shift, COLS); c2++) {
              if (r2 === r && c2 === c) continue;
              const p = cellCenter(r2, c2, shift);
              const d = Math.hypot(p.x - me.x, p.y - me.y);
              if (Math.abs(d - 1) < 1e-9) expected.push(`${r2},${c2}`);
            }
          }
          const got = neighbors(r, c, shift, COLS).map((n) => `${n.row},${n.col}`);
          expect(got.slice().sort()).toEqual(expected.slice().sort());
        }
      }
    }
  });

  it("is symmetric — a neighbour of mine has me as a neighbour", () => {
    // The property that a wrong diagonal breaks silently: matches and floaters
    // are both flood fills, so an asymmetric edge makes groups fail to pop from
    // one side and clusters fail to fall, with nothing to see in either case.
    for (const shift of [0, 1] as const) {
      for (let r = 0; r < FIELD_ROWS; r++) {
        for (let c = 0; c < rowWidth(r, shift, COLS); c++) {
          for (const n of neighbors(r, c, shift, COLS)) {
            const back = neighbors(n.row, n.col, shift, COLS);
            expect(back.some((b) => b.row === r && b.col === c)).toBe(true);
          }
        }
      }
    }
  });

  it("leaves the launcher clear of the death line", () => {
    expect(launcher(COLS).y).toBeGreaterThan(0.5 + DEATH_ROW * ROW_H);
    expect(launcher(COLS).y).toBeLessThan(FIELD_H);
    expect(launcher(COLS).x).toBeCloseTo(fieldW(COLS) / 2, 10);
  });
});

describe("the ceiling advance", () => {
  it("moves every row down one without moving it sideways", () => {
    // The reason `shift` flips. A row's offset is (index + shift) % 2, so a row
    // gaining an index must be met by a flipped shift or the whole board
    // re-staggers under the player and half the rows change length.
    let s = put(bare(), [
      [0, 0, 1],
      [1, 3, 2],
      [2, 7, 0],
    ]);
    const before = [0, 1, 2].map((r) => ({ r, off: isOffset(r, s.shift), w: s.rows[r].length }));
    s = pushRow(s, rngFrom("push"));
    for (const b of before) {
      expect(isOffset(b.r + 1, s.shift)).toBe(b.off);
      expect(s.rows[b.r + 1].length).toBe(b.w);
    }
    expect(s.rows[1][0]).toBe(1);
    expect(s.rows[2][3]).toBe(2);
    expect(s.rows[3][7]).toBe(0);
    expect(s.rows[0].every((c) => c !== null)).toBe(true);
  });

  it("only ever adds colours the board already has", () => {
    let s = put(bare("hard"), [[0, 0, 3]]);
    for (let i = 0; i < 12; i++) s = pushRow(s, rngFrom(`only-${i}`));
    expect(boardColors(s)).toEqual([3]);
  });

  it("ends the run when the board reaches the death line", () => {
    let s = bare();
    for (let c = 0; c < rowWidth(0, s.shift, s.cols); c++) s = put(s, [[0, c, 0]]);
    for (let i = 0; i < DEATH_ROW + 1; i++) s = pushRow(s, rngFrom(`death-${i}`));
    expect(s.dead).toBe(true);
  });
});

describe("aiming", () => {
  it("lands a shot from an empty board on the ceiling row", () => {
    const shot = aim(bare(), 0);
    expect(shot.ceiling).toBe(true);
    expect(shot.cell?.row).toBe(0);
    // Straight up from the middle of a 10-wide row: the two middle cells are
    // equidistant, so either is correct and neither is off-centre.
    expect([COLS / 2 - 1, COLS / 2]).toContain(shot.cell?.col);
  });

  it("keeps the whole flight inside the walls, bounce or no bounce", () => {
    const s = bare();
    for (let i = -20; i <= 20; i++) {
      const shot = aim(s, (i / 20) * MAX_ANGLE);
      for (const p of shot.path) {
        expect(p.x).toBeGreaterThanOrEqual(0.5 - 1e-6);
        expect(p.x).toBeLessThanOrEqual(fieldW(COLS) - 0.5 + 1e-6);
      }
    }
  });

  it("bounces off a wall rather than leaving the field", () => {
    // A steep shot cannot reach the ceiling without meeting a wall first, so a
    // path with only two points would mean the reflection never happened.
    const shot = aim(bare(), MAX_ANGLE);
    expect(shot.path.length).toBeGreaterThan(2);
    expect(shot.cell).not.toBeNull();
  });

  it("never lands on an occupied cell, at any angle, on a real board", () => {
    const s = newGame("hard", rngFrom("occupied"));
    for (let i = -30; i <= 30; i++) {
      const shot = aim(s, (i / 30) * MAX_ANGLE);
      expect(shot.cell).not.toBeNull();
      expect(at(s, shot.cell!.row, shot.cell!.col)).toBeNull();
    }
  });

  it("always lands somewhere that touches the board or the ceiling", () => {
    // A bubble snapped into a cell hanging in mid-air would be swept away by
    // the floater check on the very next pop, which reads as the pop being
    // broken rather than the snap.
    const s = newGame("medium", rngFrom("anchored"));
    for (let i = -30; i <= 30; i++) {
      const { row, col } = aim(s, (i / 30) * MAX_ANGLE).cell!;
      const anchored =
        row === 0 || neighbors(row, col, s.shift, s.cols).some((n) => at(s, n.row, n.col) !== null);
      expect(anchored).toBe(true);
    }
  });

  it("gives the same answer twice — the guide line and the shot are one call", () => {
    const s = newGame("medium", rngFrom("stable"));
    const a = aim(s, 0.4);
    const b = aim(s, 0.4);
    expect(b).toEqual(a);
  });

  it("clamps past the aiming limit instead of firing sideways forever", () => {
    const s = bare();
    expect(aim(s, MAX_ANGLE + 1)).toEqual(aim(s, MAX_ANGLE));
    expect(aim(s, -MAX_ANGLE - 1)).toEqual(aim(s, -MAX_ANGLE));
  });
});

describe("popping", () => {
  it("pops three of a colour and leaves two alone", () => {
    // Two already touching, plus the arriving bubble, is the whole threshold.
    // The control is the same shot at the same angle onto a board one bubble
    // short - so the only difference between popping and not is the third.
    // The lone bubble at the far end of the ceiling is a SURVIVOR, not
    // scenery: without it the pop empties the board, a fresh one is dealt, and
    // every assertion below would be reading the new board instead.
    const three = put(bare(), [
      [0, 0, 2],
      [0, 4, 1],
      [0, 5, 1],
    ]);
    const hit = fire({ ...three, current: 1 }, 0, rngFrom("three"));
    const out = hit.outcome as { popped: Cell[]; cell: Cell };
    expect(out.popped.length).toBe(MATCH_MIN);
    expect(at(hit.state, out.cell.row, out.cell.col)).toBeNull();

    const two = put(bare(), [
      [0, 0, 2],
      [0, 4, 1],
    ]);
    const miss = fire({ ...two, current: 1 }, 0, rngFrom("two"));
    const missed = miss.outcome as { popped: Cell[]; cell: Cell };
    expect(missed.popped).toEqual([]);
    // It stayed exactly where it landed, which is the other half of the claim.
    expect(at(miss.state, missed.cell.row, missed.cell.col)).toBe(1);
  });

  it("finds a group across the row stagger, not only along a row", () => {
    const s = put(bare(), [
      [0, 3, 2],
      [1, 3, 2],
      [2, 3, 2],
    ]);
    expect(matchGroup(s, { row: 1, col: 3 }).length).toBe(3);
  });

  it("drops everything the pop cut loose, and pays double for it", () => {
    // A three-group on the ceiling holding a single bubble underneath it. The
    // hanging bubble is a different colour, so only the support pops — and it
    // must still fall.
    const s0 = put(bare(), [
      [0, 0, 2],
      [0, 4, 1],
      [0, 5, 1],
      [1, 5, 3],
    ]);
    const { state, outcome } = fire({ ...s0, current: 1 }, 0, rngFrom("drop"));
    const out = outcome as { popped: Cell[]; dropped: Cell[]; gained: number };
    expect(out.dropped.length).toBe(1);
    expect(out.gained).toBe(out.popped.length * POP_POINTS + DROP_POINTS);
    // The hanging bubble is GONE from the board, not merely reported.
    expect(at(state, 1, 5)).toBeNull();
    expect(isCleared(state)).toBe(false);
  });

  it("leaves a cluster alone while anything still hangs from the ceiling", () => {
    const s = put(bare(), [
      [0, 2, 1],
      [1, 2, 1],
      [2, 2, 1],
    ]);
    expect(floaters(s)).toEqual([]);
  });

  it("calls a whole board floating once nothing touches row 0", () => {
    const s = put(bare(), [
      [3, 2, 1],
      [4, 2, 1],
    ]);
    expect(floaters(s).length).toBe(2);
  });
});

describe("a run", () => {
  it("deals a fresh board when the last bubble goes, and keeps the score", () => {
    const s0 = put(bare(), [
      [0, 4, 1],
      [0, 5, 1],
    ]);
    const { state, outcome } = fire({ ...s0, current: 1, score: 120 }, 0, rngFrom("clear"));
    expect((outcome as { cleared: boolean }).cleared).toBe(true);
    expect(state.boards).toBe(1);
    expect(state.score).toBeGreaterThan(120);
    expect(isCleared(state)).toBe(false);
    expect(state.shotsLeft).toBe(LEVELS[state.level].shotsPerPush);
  });

  it("advances the ceiling on the shot the counter runs out, and not before", () => {
    const s = { ...newGame("easy", rngFrom("clock")), shotsLeft: 2 };
    const one = fire(s, 0.9, rngFrom("a"));
    expect((one.outcome as { pushed: boolean }).pushed).toBe(false);
    expect(one.state.shotsLeft).toBe(1);
    const two = fire(one.state, -0.9, rngFrom("b"));
    expect((two.outcome as { pushed: boolean }).pushed).toBe(true);
    expect(two.state.shotsLeft).toBe(LEVELS["easy"].shotsPerPush);
  });

  it("never hands over a colour the board cannot use", () => {
    // The fairness rule, and the one a player feels without being able to name:
    // a launcher drawing from the full palette keeps offering the colour that
    // ran out, so every shot makes the board worse and none could have been
    // better.
    let s = newGame("hard", rngFrom("fair"));
    const rng = rngFrom("fair-run");
    for (let i = 0; i < 200 && !s.dead; i++) {
      expect(boardColors(s)).toContain(s.current);
      s = fire(s, (rng() * 2 - 1) * MAX_ANGLE, rng).state;
    }
  });

  it("refuses to score a shot once the run is over", () => {
    const dead = { ...newGame("easy", rngFrom("over")), dead: true };
    const { state, outcome } = fire(dead, 0, rngFrom("over2"));
    expect((outcome as { cell: null }).cell).toBeNull();
    expect(state).toBe(dead);
  });

  it("plays 300 shots on every level without throwing or wedging", () => {
    for (const level of DIFFICULTIES) {
      let s = newGame(level, rngFrom(`soak-${level}`));
      const rng = rngFrom(`soak-run-${level}`);
      for (let i = 0; i < 300; i++) {
        if (s.dead) break;
        const before = s;
        s = fire(s, (rng() * 2 - 1) * MAX_ANGLE, rng).state;
        // Every shot resolves: a board that cannot accept a bubble anywhere
        // would silently return the same state forever.
        expect(s).not.toBe(before);
        expect(s.score).toBeGreaterThanOrEqual(before.score);
        for (let r = 0; r < FIELD_ROWS; r++) expect(s.rows[r].length).toBe(rowWidth(r, s.shift, s.cols));
      }
    }
  });

  it("replays exactly from a seed", () => {
    expect(seededGame("medium", "same")).toEqual(seededGame("medium", "same"));
    expect(seededGame("medium", "same")).not.toEqual(seededGame("medium", "other"));
  });

  it("reports points, scoped to the level it was scored on", () => {
    // `ms` and `moves` rank LOW and points rank HIGH, and only the value is
    // ever persisted — so this unit is what keeps the board the right way up.
    const s = { ...newGame("hard", rngFrom("report")), score: 4200 };
    expect(scoreReport(s)).toEqual({ value: 4200, unit: "points", board: "hard" });
  });

  it("gets harder in the one way that matters, and stays fair in the other", () => {
    let prev = 0;
    for (const level of DIFFICULTIES) {
      expect(LEVELS[level].colors).toBeGreaterThan(prev);
      prev = LEVELS[level].colors;
    }
    expect(LEVELS.easy.shotsPerPush).toBeGreaterThan(LEVELS.hard.shotsPerPush);
    expect(LEVELS.easy.startRows).toBeLessThan(LEVELS.hard.startRows);
    for (const level of DIFFICULTIES) {
      // Every dealt board leaves room to play. A start that already reaches the
      // death line would be a level nobody can take a first shot on.
      expect(LEVELS[level].startRows).toBeLessThan(DEATH_ROW - 2);
    }
  });

  it("opens with a board that is not already lost", () => {
    for (const level of DIFFICULTIES) {
      const s = newGame(level, rngFrom(`open-${level}`));
      expect(isDead(s)).toBe(false);
      expect(isCleared(s)).toBe(false);
      expect(boardColors(s)).toContain(s.current);
      expect(boardColors(s)).toContain(s.next);
      expect(pickColor(s, rngFrom("p"))).toBeGreaterThanOrEqual(0);
    }
  });
});

/* ─────────────────────────────────────────────────────────────────────────────
   THE FIELD GOT WIDER, AND THAT IS A GAME CHANGE, SO IT IS PINNED LIKE ONE.

   The operator ruled it twice (2026-09-22: "it should be much wider, full
   screen exp, all the width"), after the refusal still recorded in
   `BubbleShooterGame.tsx` - every shot is traced in bubble units across the
   field, so a wider field really is a different set of bank shots.

   What these cells hold is the line between the two things that ruling could
   have meant. The SHAPE may change with the screen. The DIFFICULTY may not, and
   neither may anything a phone player sees. The cheap claim - "it compiles at
   33 columns" - is deliberately not among them: the dangerous failure here is a
   field that addresses fine and PLAYS differently.
   ───────────────────────────────────────────────────────────────────────────*/

const WIDE = 17;  // the 4:3 cap - the widest field that ships
const wideGame = (level: (typeof DIFFICULTIES)[number] = "easy") => seededGame(level, "wide", WIDE);

describe("the field's width is a property of the run", () => {
  it("leaves a phone run byte-identical to what shipped", () => {
    // THE control for every cell below. If this moves, the change reached a
    // phone and nothing else here is worth reading.
    expect(COLS).toBe(10);
    const s = seededGame("easy", "phone");
    expect(s.cols).toBe(COLS);
    expect(s.rows.map((r) => r.length)).toEqual(
      Array.from({ length: FIELD_ROWS }, (_, r) => (isOffset(r, s.shift) ? COLS - 1 : COLS)),
    );
    expect(s.shotsLeft).toBe(LEVELS.easy.shotsPerPush);
    expect(seededGame("easy", "phone")).toEqual(s);
  });

  it("carries the width on the STATE, not in a global read behind its back", () => {
    expect(wideGame().cols).toBe(WIDE);
    expect(seededGame("easy", "wide").cols).toBe(COLS);
  });

  it("deals rows of the run's width", () => {
    const wide = wideGame();
    for (let r = 0; r < FIELD_ROWS; r++) {
      expect(wide.rows[r].length).toBe(isOffset(r, wide.shift) ? WIDE - 1 : WIDE);
      expect(rowWidth(r, wide.shift, wide.cols)).toBe(wide.rows[r].length);
    }
  });

  it("keeps neighbours MUTUAL at the wide width", () => {
    // The property pinned at 10 columns above, re-asked at 33. Matches and
    // floaters are both flood fills over this list, so a parity bug that only
    // appears past column 9 pops nothing and raises nothing.
    for (const shift of [0, 1] as const) {
      for (let r = 0; r < FIELD_ROWS; r++) {
        for (let c = 0; c < rowWidth(r, shift, WIDE); c++) {
          for (const n of neighbors(r, c, shift, WIDE)) {
            const back = neighbors(n.row, n.col, shift, WIDE);
            expect(
              back.some((b) => b.row === r && b.col === c),
              `(${r},${c}) shift ${shift} sees (${n.row},${n.col}) but not the reverse`,
            ).toBe(true);
          }
        }
      }
    }
  });

  it("keeps every wide cell inside the wide field", () => {
    for (const shift of [0, 1] as const) {
      for (let r = 0; r < FIELD_ROWS; r++) {
        for (let c = 0; c < rowWidth(r, shift, WIDE); c++) {
          const p = cellCenter(r, c, shift);
          expect(p.x).toBeGreaterThanOrEqual(0.5);
          expect(p.x).toBeLessThanOrEqual(fieldW(WIDE) - 0.5);
        }
      }
    }
  });

  it("centres the launcher in whatever field it is given, at an unchanged height", () => {
    for (const cols of [COLS, 17, WIDE, MAX_COLS]) {
      expect(launcher(cols).x).toBeCloseTo(fieldW(cols) / 2, 10);
      // The vertical game does not move with the width.
      expect(launcher(cols).y).toBe(launcher(COLS).y);
      expect(launcher(cols).y).toBeGreaterThan(0.5 + DEATH_ROW * ROW_H);
      expect(launcher(cols).y).toBeLessThan(FIELD_H);
    }
  });

  it("bounces a shot off the WIDE walls, not the phone's", () => {
    const wide = wideGame();
    const shot = aim(wide, -1.2);
    expect(shot.path.length).toBeGreaterThan(1);
    for (const p of shot.path) {
      expect(p.x).toBeGreaterThanOrEqual(0.5 - 1e-6);
      expect(p.x).toBeLessThanOrEqual(fieldW(WIDE) - 0.5 + 1e-6);
    }
    expect(shot.cell).not.toBeNull();
    expect(shot.cell!.col).toBeLessThan(rowWidth(shot.cell!.row, wide.shift, wide.cols));
  });

  it("lands every shot in a cell the wide board can address", () => {
    let s: ShooterState = wideGame();
    let landed = 0;
    for (let i = 0; i < 40; i++) {
      const r = fire(s, -1.2 + (i / 40) * 2.4, () => 0.5);
      if (r.outcome.cell !== null) {
        landed++;
        const { row, col } = r.outcome.cell;
        expect(row).toBeGreaterThanOrEqual(0);
        expect(row).toBeLessThan(FIELD_ROWS);
        expect(col).toBeGreaterThanOrEqual(0);
        expect(col).toBeLessThan(rowWidth(row, s.shift, s.cols));
      }
      s = r.state;
      if (s.dead) break;
    }
    // The population, printed rather than assumed: a loop that landed nothing
    // would satisfy every assertion above it.
    expect(landed).toBeGreaterThan(20);
  });

  it("anchors a wide snap to the ceiling or to something resting", () => {
    let s: ShooterState = wideGame();
    for (let i = 0; i < 25; i++) {
      const r = fire(s, -0.9 + i * 0.07, () => 0.3);
      if (r.outcome.cell) {
        const { row, col } = r.outcome.cell;
        const anchored =
          row === 0 ||
          neighbors(row, col, s.shift, s.cols).some((n) => at(s, n.row, n.col) !== null);
        expect(anchored, `a bubble snapped to (${row},${col}) with nothing holding it`).toBe(true);
      }
      s = r.state;
      if (s.dead) break;
    }
  });
});

describe("the width changes the SHAPE and not the DIFFICULTY", () => {
  it("scales the push cadence, so bubbles-added-per-shot is flat", () => {
    for (const level of DIFFICULTIES) {
      expect(shotsFor(level, COLS)).toBe(LEVELS[level].shotsPerPush);
      const perShotPhone = COLS / LEVELS[level].shotsPerPush;
      for (const cols of [17, WIDE, MAX_COLS]) {
        expect(cols / shotsFor(level, cols)).toBeCloseTo(perShotPhone, 1);
      }
    }
  });

  it("never returns a cadence of zero, however the rounding falls", () => {
    for (const level of DIFFICULTIES) {
      for (let cols = COLS; cols <= MAX_COLS; cols++) {
        expect(shotsFor(level, cols)).toBeGreaterThanOrEqual(1);
      }
    }
  });

  it("leaves the vertical game alone at every width", () => {
    // Rows, death line and opening depth are what decide how long a run lasts.
    for (const cols of [COLS, WIDE, MAX_COLS]) {
      const s = seededGame("hard", "v", cols);
      expect(s.rows.length).toBe(FIELD_ROWS);
      expect(s.rows.filter((r) => r.some((c) => c !== null)).length).toBe(LEVELS.hard.startRows);
    }
  });
});

describe("colsForBox", () => {
  it("fills the box up to the cap, and is the CAP's shape past it", () => {
    // Below the cap the board's ratio is the box's, which is what makes it
    // fill across and down. Past it the ratio is 4:3 and the board simply
    // centres - the cap is the whole point, so the cell says both rather than
    // asserting the half that used to be true of every box.
    expect(colsForBox(1072, 825) / FIELD_H).toBeCloseTo(1072 / 825, 1);
    // 1888 x 743 is the real PC box; its 2.54 is past the cap.
    expect(colsForBox(1888, 743)).toBe(MAX_COLS);
    expect(colsForBox(1888, 743) / FIELD_H).toBeCloseTo(4 / 3, 1);
  });

  it("never goes under the phone's width, nor past the 4:3 cap", () => {
    expect(colsForBox(300, 900)).toBe(COLS);
    expect(colsForBox(100000, 200)).toBe(MAX_COLS);
    // The cap IS 4:3, which is the whole reason it is 17 - argued from the
    // reference the operator pointed at, not from taste.
    expect(MAX_COLS / FIELD_H).toBeCloseTo(4 / 3, 1);
  });

  it("refuses to make a bubble smaller than the narrowest phone draws", () => {
    // Asserted on the BUBBLE the choice produces, not on the formula that
    // produced it - a cell that restates the implementation agrees with it
    // whatever either of them says. 33.8px is a 360px phone's bubble, which is
    // the smallest this game has ever shipped.
    for (const [room, box] of [[600, 100], [1888, 200], [1504, 302]] as const) {
      const cols = colsForBox(room, box);
      const bw = Math.min(room, (box * cols) / FIELD_H);
      // Only the ROOM-bound arm is the floor's business: a height-bound board
      // draws `box / FIELD_H` at any width, so no column count could save it.
      if (bw >= room - 0.5) expect(bw / cols).toBeGreaterThanOrEqual(33.8);
    }
  });

  it("answers the phone's width for a box it cannot read", () => {
    // Three states, not two: an unmeasurable box is the DEFAULT, never a field
    // of zero columns that nothing can address.
    expect(colsForBox(0, 0)).toBe(COLS);
    expect(colsForBox(Number.NaN, 700)).toBe(COLS);
  });
});

describe("the record", () => {
  it("keeps the phone's board key, so no existing record is orphaned", () => {
    for (const level of DIFFICULTIES) {
      expect(scoreReport(seededGame(level, "r")).board).toBe(level);
    }
  });

  it("scopes a wide run to its own board", () => {
    const wide = scoreReport(wideGame("medium"));
    expect(wide.board).toBe(`medium-w${WIDE}`);
    expect(wide.board).not.toBe("medium");
    expect(wide.unit).toBe("points");
  });
});

describe("pcPlan - which side the controls go, and how wide the field can then be", () => {
  /* The four numbers are the real ones, read off `pcBoxes()`'s own terms:
   *   roomBeside = w - 2 x clamp(280, 24vw, 400) - 48
   *   roomUnder  = w - 32
   *   boxBeside  = h - 60 - 60 - 24 - 111
   *   boxUnder   = h - 60 - 60 - 24 -"193 */
  const at = (w: number, h: number) => {
    const side = Math.max(280, Math.min(400, w * 0.24));
    return pcPlan(w - 2 * side - 48, w - 32, h - 144 - 111, h - 144 - 193);
  };

  it("reaches the 4:3 cap on a tall window", () => {
    const p = at(1920, 1080);
    expect(p.cols).toBe(MAX_COLS);
    // BESIDE, because a 4:3 board stops being room-bound long before it runs
    // out of middle column - so the height the controls would cost under it is
    // height the board was going to use. That flipped when the cap came in, and
    // the cell says so rather than being quietly re-recorded.
    expect(p.under).toBe(false);
  });

  it("still chooses per WINDOW, not once for the game", () => {
    // 1680x1050 is the window where under wins even at the cap. Without a case
    // that goes the other way, `pcPlan` could be a constant and nothing here
    // would notice.
    expect(at(1680, 1050).under).toBe(true);
    expect(at(1920, 1080).under).toBe(false);
  });

  it("stays BESIDE on the operator's own 1536x639, where under costs board", () => {
    const p = at(1536, 639);
    expect(p.under).toBe(false);
    expect(p.cols).toBeGreaterThan(COLS);
  });

  it("keeps every bubble at least as big as the narrowest phone draws", () => {
    // WHAT THIS DOES NOT CLAIM, because it is not true: that widening never
    // costs a pixel. At 1920x1080 ten columns is height-bound (63.7px) and
    // seventeen is room-bound (63.1px), so the wider field really does draw a
    // bubble 0.7px smaller. An earlier version of this cell asserted the
    // stronger thing and failed on correct code - a pin that overclaims is a
    // false pin, and the design only ever promised the floor.
    for (const [w, h] of [[1920, 1080], [1680, 1050], [1536, 639], [1440, 900], [1280, 800]] as const) {
      const side = Math.max(280, Math.min(400, w * 0.24));
      const p = at(w, h);
      const room = p.under ? w - 32 : w - 2 * side - 48;
      const box = h - 144 - (p.under ? 193 : 111);
      const bw = Math.min(room, (box * p.cols) / FIELD_H);
      // Only the ROOM-bound arm is the floor's business: a height-bound board
      // draws `box / FIELD_H` at any width, so no column count could save it.
      if (bw >= room - 0.5) {
        expect(bw / p.cols, `${w}x${h}: a room-bound board went under the floor`).toBeGreaterThanOrEqual(33.8);
      }
    }
  });

  it("picks the arm with the BIGGER board at every window", () => {
    for (const [w, h] of [[1920, 1080], [1680, 1050], [1536, 639], [1440, 900], [1280, 800]] as const) {
      const side = Math.max(280, Math.min(400, w * 0.24));
      const areaOf = (room: number, box: number) => {
        const cols = colsForBox(room, box);
        const bw = Math.min(room, (box * cols) / FIELD_H);
        return bw * ((bw * FIELD_H) / cols);
      };
      const p = at(w, h);
      const beside = areaOf(w - 2 * side - 48, h - 144 - 111);
      const under = areaOf(w - 32, h - 144 - 193);
      const chosen = p.under ? under : beside;
      expect(chosen, `${w}x${h}: took the smaller arm`).toBeGreaterThanOrEqual(p.under ? beside : under);
    }
  });
});

describe("a saved board keeps the width it was played at", () => {
  it("reads a save from before the width existed as a phone-width board", () => {
    // Every save written before 2026-09-23 07:09Z has no `cols`. The first
    // validator called that corrupt and dropped them all - on a phone too, where
    // nothing had changed. Reproduced live: the real save restored, the same save
    // minus `cols` came back as a fresh board.
    expect(savedCols(undefined)).toBe(COLS);
  });

  it("keeps every legal width and refuses everything else", () => {
    for (const ok of [COLS, 15, MAX_COLS]) expect(savedCols(ok)).toBe(ok);
    // null is the ONLY refusal - the old reading made `undefined` one as well,
    // which is the whole defect.
    for (const bad of ["17", 999, 16.5, COLS - 1, MAX_COLS + 1, Number.NaN, null, Infinity]) {
      expect(savedCols(bad), `savedCols(${String(bad)})`).toBeNull();
    }
  });

  it("does not let an old phone-width save masquerade as a wide one", () => {
    // A PC run is 17 wide; the resume guard compares widths, so an old save must
    // come back as 10 and be declined there, never be re-read as 17.
    expect(savedCols(undefined)).not.toBe(MAX_COLS);
  });
});

describe("colsForBox refuses a box it cannot measure", () => {
  it("answers the phone's width for every non-finite box", () => {
    // Found by /deep-test's hostile-number sweep: Infinity/Infinity was NaN.
    for (const [w, h] of [[Infinity, Infinity], [Infinity, 700], [1888, Infinity], [-Infinity, 700], [Number.NaN, 700]]) {
      expect(colsForBox(w, h), `colsForBox(${w}, ${h})`).toBe(COLS);
    }
  });
});
