// Puzzle Snake - the twelve levels. Pure data; `parseLevel` reads the drawings.
//
//   # wall   . floor   A apple   E exit (gold door)   H head   o body, from the head
//
// HOW THESE WERE MADE. The walls are drawn by hand (World 1 on a 7x7 board,
// World 2 on 9x9, so the board box never changes size between levels). The
// snake, apples and door of levels 1-4 to 2-6 were then placed by a sampler that
// kept only boards the solver in `solver.ts` could solve inside a par window,
// and - for World 2 - that the greedy "nearest apple" bot could NOT finish.
// Levels 1-1 and 1-2 are drawn by hand, and 1-3 is the approved mock's board.
//
// `par` is the solver's optimum, recorded. `solver.test.ts` re-solves every
// board and requires par to EQUAL what it finds, so editing a drawing without
// re-deriving its par is a red build, not a quietly wrong star count.
//
// IDS ARE PERSISTED FOREVER (best stars per level, the last level played), so a
// level may be redrawn but an id is never renamed or reused.

export type World = 1 | 2;

export interface LevelDef {
  /** "1-1" .. "2-6". Persisted forever. */
  id: string;
  world: World;
  rows: readonly string[];
  /** The solver's fewest presses. Pinned by `solver.test.ts`. */
  par: number;
}

export const LEVELS: readonly LevelDef[] = [
  // WORLD 1 - GARDEN. Eat in the right order; your body gets in the way.
  {
    // First bite: one apple, and the gold door opens.
    id: "1-1",
    world: 1,
    par: 5,
    rows: ["#######", "#.....#", "#.oH.A#", "#.....#", "#.....#", "#....E#", "#######"],
  },
  {
    // The door waits for both apples, and the order is the whole cost: the
    // top-left apple first is 11 presses, the one beside the door first is 19.
    id: "1-2",
    world: 1,
    par: 11,
    rows: ["#######", "#A....#", "#.....#", "#.Ho..#", "#.....#", "#...AE#", "#######"],
  },
  {
    // The approved mock's board. Walls, and an order: the top apple first,
    // or the level cannot be finished at all.
    id: "1-3",
    world: 1,
    par: 16,
    rows: ["#######", "#.A..E#", "#.##..#", "#H#A..#", "#o#.#.#", "#o..A.#", "#######"],
  },
  {
    // The apple one step away is not the best start (19 presses against 17),
    // and the other apple on the top row loses the level if it is eaten first.
    id: "1-4",
    world: 1,
    par: 17,
    rows: ["#######", "#..A.A#", "#.##.H#", "#E#..o#", "#.#.#o#", "#....A#", "#######"],
  },
  {
    // Any order works; the body is what you plan around. A loop of the
    // garden with your own tail following you through it.
    id: "1-5",
    world: 1,
    par: 18,
    rows: ["#######", "#A.Hoo#", "#.#.#A#", "#.....#", "#A#.#.#", "#....E#", "#######"],
  },
  {
    // The closest apple is a trap. Only the one behind you can go first.
    id: "1-6",
    world: 1,
    par: 21,
    rows: ["#######", "#..#..#", "#AooH.#", "##A#A##", "#E....#", "#..#..#", "#######"],
  },

  // WORLD 2 - MAZE. Tight corners and a long tail: five long at the start,
  // nine by the last apple. The greedy bot is stuck on every one of these.
  {
    // Two apples LOSE if eaten first; the two by your head do not.
    id: "2-1",
    world: 2,
    par: 25,
    rows: ["#########", "#.......#", "#.#.#A#.#", "#.#.#.#.#", "#A......#", "#.#.#.#.#", "#E#.#A#A#", "#ooooH..#", "#########"],
  },
  {
    // Four rooms. Three of the four apples lose if eaten first.
    id: "2-2",
    world: 2,
    par: 28,
    rows: ["#########", "#...#E.A#", "#.o.#.AA#", "##o###.##", "#.o.....#", "##o###.##", "#.H.#.A.#", "#...#...#", "#########"],
  },
  {
    // The apple by the door loses if it is eaten first; the other three all
    // work, at 30, 32 and 34 presses.
    id: "2-3",
    world: 2,
    par: 30,
    rows: ["#########", "#.#AE.#.#", "#...#...#", "#A#A#.#.#", "#..ooooH#", "##.#.#.##", "#.A.#...#", "#.#...#.#", "#########"],
  },
  {
    // The nearest apple, four steps away, loses. The long way round the top
    // is the way.
    id: "2-4",
    world: 2,
    par: 32,
    rows: ["#########", "#..A..AA#", "#.##.##.#", "#.#...#o#", "#...#..o#", "#E#...#o#", "#.##.##o#", "#..A...H#", "#########"],
  },
  {
    // A spiral. Only the apple in front of your nose can go first.
    id: "2-5",
    world: 2,
    par: 35,
    rows: ["#########", "#ooooHA.#", "#.#####.#", "#A#...#.#", "#E#.#.#.#", "#...#.A.#", "###.#A###", "#.......#", "#########"],
  },
  {
    // The longest walk. The first and the last apple both lose if taken
    // first; the two in the middle row are the way in.
    id: "2-6",
    world: 2,
    par: 39,
    rows: ["#########", "#...#...#", "#.#.#.#.#", "#H#..A#.#", "#o##.##E#", "#o.A..A.#", "#o#.#.#.#", "#oA.#...#", "#########"],
  },
];

export const LEVEL_IDS: readonly string[] = LEVELS.map((l) => l.id);

export function levelById(id: string): LevelDef | undefined {
  return LEVELS.find((l) => l.id === id);
}

/** The level after `id`, or undefined after the last one. */
export function nextLevelId(id: string): string | undefined {
  const i = LEVEL_IDS.indexOf(id);
  return i >= 0 ? LEVEL_IDS[i + 1] : undefined;
}

/** "Level 3 of 6" - the position of a level inside its world, 1-based. */
export function placeInWorld(id: string): { n: number; of: number } {
  const lv = levelById(id);
  const same = LEVELS.filter((l) => l.world === lv?.world);
  return { n: same.findIndex((l) => l.id === id) + 1, of: same.length };
}
