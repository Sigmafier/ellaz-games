import { describe, expect, it } from "vitest";
import { newGame, parseLevel, step, undo, type Dir } from "./logic";
import { LEVELS } from "./levels";
import { MAX_PRESSES, SESSION, pressesOf, replay } from "./session";

const first = LEVELS[0];

describe("a saved attempt is the level and the presses", () => {
  it("carries the reward latch, so an undone solve cannot be paid again after a resume", () => {
    expect(SESSION.validate({ level: "1-1", presses: ["right"], paid: true })).toBe(true);
    expect(SESSION.validate({ level: "1-1", presses: ["right"], paid: false })).toBe(true);
  });

  it("round-trips a board, undo history included", () => {
    let s = newGame(parseLevel(first.rows));
    for (const d of ["right", "down", "down"] as Dir[]) s = step(s, d).state;
    s = undo(s);
    const snap = { level: first.id, presses: pressesOf(s) };
    expect(snap.presses).toEqual(["right", "down"]);
    const back = replay(snap)!;
    expect(back.body).toEqual(s.body);
    expect(back.moves).toBe(2);
    expect(undo(back).body).toEqual(undo(s).body);
    expect(SESSION.validate(snap)).toBe(true);
  });

  it("refuses anything that does not replay cleanly", () => {
    const bad: unknown[] = [
      null,
      "1-1",
      { level: "1-1" },
      { level: "9-9", presses: [] },
      { level: "1-1", presses: ["sideways"] },
      { level: "1-1", presses: ["left"] }, // the neck: a refused press never reaches a save
      { level: "1-1", presses: Array(MAX_PRESSES + 1).fill("right") },
      { level: "1-1", presses: [], paid: "yes" },
    ];
    for (const b of bad) expect(SESSION.validate(b), JSON.stringify(b)?.slice(0, 60)).toBe(false);
  });

  it("refuses a solved board, so a paid level can never be handed back", () => {
    // 1-1's optimal line ends on the door.
    expect(SESSION.validate({ level: "1-1", presses: ["right", "right", "down", "down", "down"] })).toBe(false);
    expect(SESSION.validate({ level: "1-1", presses: ["right", "right", "down", "down"] })).toBe(true);
  });
});
