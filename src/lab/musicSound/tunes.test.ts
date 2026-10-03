import { describe, expect, it } from "vitest";
import { columnRows, noteCount } from "../../games/music/logic";
import { TUNES } from "./tunes";

describe("the listening lab's tunes", () => {
  const byId = Object.fromEntries(TUNES.map((t) => [t.id, t.state]));

  it("are three, and their labels say what they hold", () => {
    expect(TUNES.map((t) => t.id)).toEqual(["sparse", "busy", "surprise"]);
    expect(noteCount(byId.sparse)).toBe(4);
    expect(byId.sparse.steps).toBe(6);
    expect(noteCount(byId.busy)).toBe(17);
    expect(byId.busy.steps).toBe(8);
    for (const t of TUNES) expect(t.label).toContain(`${t.state.steps} beats`);
  });

  it("the busy one really has chords, or it tests nothing the sparse one does not", () => {
    const chords = Array.from({ length: byId.busy.steps }, (_, c) => columnRows(byId.busy, c).length).filter((n) => n > 1);
    expect(chords.length).toBeGreaterThanOrEqual(4);
  });

  it("the surprise is the game's own deal, one note a beat, the same on every load", () => {
    const s = byId.surprise;
    for (let c = 0; c < s.steps; c++) expect(columnRows(s, c).length).toBe(1);
    // Pinned: C4 A4 G4 D4 C4 A4 G4 C4. A changed seed or a changed deal is a
    // different tune, and every number the lab reported was about this one.
    expect(Array.from({ length: s.steps }, (_, c) => columnRows(s, c)[0])).toEqual([5, 1, 2, 4, 5, 1, 2, 5]);
  });
});
