// Puzzle Snake - the twelve levels. Pure data; `parseLevel` reads the drawings.
//
//   # wall   . floor   A apple   E exit (gold door)   H head   o body, from the head
//   K key   L lock   > < ^ v one-way   @ portal (a pair)   - World 2's tiles, see logic.ts
//
// HOW THESE WERE MADE. The walls are drawn by hand (World 1 on a 7x7 board,
// World 2 on 9x9, so the board box never changes size between levels). The
// snake, apples and door of levels 1-4 to 2-6 were then placed by a sampler that
// kept only boards the solver in `solver.ts` could solve inside a par window,
// and - for World 2 - that the greedy "nearest apple" bot could NOT finish.
// Level 1-1 is drawn by hand. 1-6 and 2-2 are the two levels a player named
// as "challenging but not too hard" (2026-09-28) and are kept exactly; every
// other level was redrawn that day around one idea a player can name.
// World 2's trick tiles (locks, arrows, portals, and 2-6's door) are drawn by
// hand too; the sampler placed only the snake, the apples, and the keys of
// 2-4 and 2-6, and kept a board only if walling its trick tile over left it
// unsolvable.
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
  // WORLD 1 - GARDEN. No special tiles: it teaches the snake itself, one idea
  // a level (redrawn 2026-09-28 like World 2; 1-1 and 1-6 are unchanged).
  {
    // First bite: one apple, and the gold door opens.
    id: "1-1",
    world: 1,
    par: 5,
    rows: ["#######", "#.....#", "#.oH.A#", "#.....#", "#.....#", "#....E#", "#######"],
  },
  {
    // THE ORDER. Two apples, and the near one is the long way: eat it first
    // and the level takes 17 presses, eat the far one first and it takes 11.
    id: "1-2",
    world: 1,
    par: 11,
    rows: ["#######", "#E....#", "#.A...#", "#..#Ho#", "#.....#", "#....A#", "#######"],
  },
  {
    // DON'T BOX YOURSELF IN. Pillars make little alcoves; two of the three
    // apples, eaten first, leave your own body blocking the way out.
    id: "1-3",
    world: 1,
    par: 12,
    rows: ["#######", "#.....#", "#.#.#.#", "#oAA..#", "#o#.#.#", "#H..AE#", "#######"],
  },
  {
    // YOUR TAIL IS A DOOR. The apple waits in a little square room. Once you
    // have eaten it you fill the room, and the only way out is the square your
    // tail is leaving on that same press.
    id: "1-4",
    world: 1,
    par: 17,
    rows: ["#######", "#..#.E#", "#A.#..#", "##.#..#", "#..Ho.#", "#..Ao.#", "#######"],
  },
  {
    // TURN ROUND IN A TIGHT CORRIDOR. You start nose-first in a dead end two
    // squares wide, so the first thing to do is turn - and two of the three
    // apples lose the level if they are eaten first.
    id: "1-5",
    world: 1,
    par: 18,
    rows: ["#######", "#..#.H#", "#.A#Ao#", "#..#.o#", "#A..E.#", "#.....#", "#######"],
  },
  {
    // The closest apple is a trap. Only the one behind you can go first. A
    // player named this level as one he liked; it is kept byte for byte.
    id: "1-6",
    world: 1,
    par: 21,
    rows: ["#######", "#..#..#", "#AooH.#", "##A#A##", "#E....#", "#..#..#", "#######"],
  },

  // WORLD 2 - TRICKS. Short boards, one idea each (redrawn 2026-09-28, after a
  // player said 1-6 and 2-2 were "challenging but not too hard" and the rest
  // of the old Maze "boring and samey"). 2-2 is his, kept byte for byte; the
  // other five each bring one tile, and `solver.test.ts` proves each needs it:
  // swap the tile for wall and the level has no solution.
  {
    // THE KEY. The lock is the only way to the door, and the key sits in a
    // little room a snake can only turn round in while it is short - eat both
    // apples first and you are too long to fetch it.
    id: "2-1",
    world: 2,
    par: 16,
    rows: ["#########", "#K.#..#E#", "#..#..#L#", "##.#.A..#", "#oH.A...#", "#o#.#.#.#", "#.......#", "#..#.#..#", "#########"],
  },
  {
    // Four rooms. Three of the four apples lose if eaten first. The one level
    // of the old Maze a player asked to keep: unchanged, drawing and par.
    id: "2-2",
    world: 2,
    par: 28,
    rows: ["#########", "#...#E.A#", "#.o.#.AA#", "##o###.##", "#.o.....#", "##o###.##", "#.H.#.A.#", "#...#...#", "#########"],
  },
  {
    // ONE-WAY. A roundabout: four arrows make the short way round the long
    // one. Floored, the level is 12 presses; as it stands, 16.
    id: "2-3",
    world: 2,
    par: 16,
    rows: ["#########", "#.....oo#", "#.#>#.#H#", "#...#...#", "#.#v#<#.#", "#...#A.A#", "#.#.#^#.#", "#...E.A.#", "#########"],
  },
  {
    // KEY + ONE-WAY. The key is on the far side of a door you can only walk
    // through one way, and the lock is on the way home.
    id: "2-4",
    world: 2,
    par: 20,
    rows: ["#########", "#...#...#", "#.#.>A#.#", "#K..#..A#", "#.#.#.#H#", "#...<.oo#", "##L######", "#.E######", "#########"],
  },
  {
    // PORTALS. Two halves with no door between them. You go through, eat,
    // and come back through - and which side you enter from decides where
    // you come out.
    id: "2-5",
    world: 2,
    par: 22,
    rows: ["#########", "#...#..H#", "#.#.#.#o#", "#..@#AAo#", "#.#.#.#.#", "#A..#@.E#", "#.#.#.#.#", "#...#...#", "#########"],
  },
  {
    // EVERYTHING. A one-way drop into a room whose only way out is a portal,
    // a key on the far side, and the door behind a lock.
    id: "2-6",
    world: 2,
    par: 24,
    rows: ["#########", "#...#..K#", "#...#.@.#", "#A#.#...#", "#oH.#.#.#", "#o#A#...#", "###v##L##", "#@..#.E.#", "#########"],
  },
];

export const LEVEL_IDS: readonly string[] = LEVELS.map((l) => l.id);

/** World 2's new tiles, by what they are to a player. A lock goes with its key. */
export type Trick = "key" | "oneway" | "portal";

const TRICK_OF: Record<string, Trick> = { K: "key", L: "key", ">": "oneway", "<": "oneway", "^": "oneway", v: "oneway", "@": "portal" };

/** The tiles a level uses, in a fixed order. Read off the drawing, so it cannot disagree with it. */
export function tricksIn(def: LevelDef): Trick[] {
  const found = new Set(def.rows.join("").split("").map((c) => TRICK_OF[c]).filter(Boolean));
  return (["key", "oneway", "portal"] as const).filter((t) => found.has(t));
}

/** The tiles this level is the FIRST to use - the ones its hint explains. */
export function introduces(id: string): Trick[] {
  const i = LEVELS.findIndex((l) => l.id === id);
  if (i < 0) return [];
  const before = new Set(LEVELS.slice(0, i).flatMap(tricksIn));
  return tricksIn(LEVELS[i]).filter((t) => !before.has(t));
}

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
