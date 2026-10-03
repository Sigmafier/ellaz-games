// The three tunes the Music Box listening lab plays, dealt by the GAME'S OWN
// logic rather than written out as arrays: a grid the game could not produce
// would be a test of a sound nobody will ever hear.
//
// PURE. Rows count from the top (row 0 = C5, row 5 = C4), as in logic.ts.
import { cellIndex, newTune, surprise, type TuneState } from "../../games/music/logic";
import { mulberry32, seedFrom } from "@shared/rng";

export type TuneId = "sparse" | "busy" | "surprise";

export interface LabTune {
  id: TuneId;
  label: string;
  state: TuneState;
}

/** Turn on exactly these [row, col] squares in a fresh tune of this length. */
function drawn(level: TuneState["level"], squares: ReadonlyArray<readonly [number, number]>): TuneState {
  const t = newTune(level, "round");
  const cells = [...t.cells];
  for (const [row, col] of squares) cells[cellIndex(row, col, t.steps)] = true;
  return { ...t, cells };
}

/** The seed "Surprise me" is dealt from, so every load hears the same surprise. */
export const SURPRISE_SEED = "music-lab-2026-10-03";

export const TUNES: readonly LabTune[] = [
  {
    // What a four-year-old's first minute looks like: a few notes, gaps
    // between them. The case the player called "empty".
    id: "sparse",
    label: "Sparse - 4 notes, 6 beats",
    state: drawn("medium", [
      [5, 0], // C4
      [3, 2], // E4
      [1, 3], // A4
      [2, 5], // G4
    ]),
  },
  {
    // An older child who filled the grid: chords on most beats.
    id: "busy",
    label: "Busy - 17 notes with chords, 8 beats",
    state: drawn("long", [
      [5, 0], [3, 0], [0, 0],
      [4, 1],
      [3, 2], [1, 2],
      [2, 3],
      [5, 4], [2, 4], [0, 4],
      [1, 5],
      [3, 6], [1, 6],
      [4, 7], [2, 7], [0, 7], [5, 7],
    ]),
  },
  {
    id: "surprise",
    label: "Surprise me - one note a beat, 8 beats",
    state: surprise(newTune("long", "round"), mulberry32(seedFrom(SURPRISE_SEED))),
  },
];
