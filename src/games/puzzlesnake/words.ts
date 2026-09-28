// Puzzle Snake - every word the game says, in every language the app ships.
//
// A `Record<Locale, ...>`, so promoting a language is a compile error here by
// name rather than a game speaking English inside a page that is not. Numbers
// and level ids are filled in by the caller through `fill`, never pasted into
// a sentence by string concatenation, because the order of the words around a
// number is a language's business.
import type { Locale } from "@i18n/index";

export type Words = {
  level: string;
  moves: string;
  /** The band's third caption: the par, as "★★★ in". */
  parIn: string;
  /** "{stars} in {n}" - a star count and the most moves that earns it. */
  starsIn: string;
  world: string;
  garden: string;
  maze: string;
  gardenBlurb: string;
  mazeBlurb: string;
  /** "Level {n} of {of}" */
  levelOf: string;
  goal: string;
  undo: string;
  restart: string;
  levels: string;
  allLevels: string;
  keysHint: string;
  /** "Level {id} solved!" */
  solved: string;
  /** "{moves} moves" */
  movesDone: string;
  tryAgain: string;
  nextLevel: string;
  stuck: string;
  back: string;
  board: string;
  locked: string;
  /** "{n} of 3 stars" */
  starsOf: string;
  notYet: string;
};

export const WORDS: Record<Locale, Words> = {
  en: {
    level: "Level",
    moves: "Moves",
    parIn: "★★★ in",
    starsIn: "{stars} in {n}",
    world: "World",
    garden: "Garden",
    maze: "Maze",
    gardenBlurb: "Eat in the right order. Your body gets in the way.",
    mazeBlurb: "Tight corners and a long tail.",
    levelOf: "Level {n} of {of}",
    goal: "Eat every apple, then the gold door opens.",
    undo: "Undo",
    restart: "Restart",
    levels: "Levels",
    allLevels: "All levels",
    keysHint: "Arrow keys move one step. Nothing moves until you press.",
    solved: "Level {id} solved!",
    movesDone: "{moves} moves",
    tryAgain: "Try again",
    nextLevel: "Next level",
    stuck: "No way on from here.",
    back: "Back to the board",
    board: "The board",
    locked: "locked - solve the one before it first",
    starsOf: "{n} of 3 stars",
    notYet: "not solved yet",
  },
  he: {
    level: "שלב",
    moves: "צעדים",
    parIn: "★★★ תוך",
    starsIn: "{stars} תוך {n}",
    world: "עולם",
    garden: "הגינה",
    maze: "המבוך",
    gardenBlurb: "אוכלים בסדר הנכון. הגוף שלכם עומד בדרך.",
    mazeBlurb: "פינות צפופות וזנב ארוך.",
    levelOf: "שלב {n} מתוך {of}",
    goal: "אוכלים את כל התפוחים, ואז דלת הזהב נפתחת.",
    undo: "ביטול צעד",
    restart: "מההתחלה",
    levels: "שלבים",
    allLevels: "כל השלבים",
    keysHint: "כל לחיצה על חץ היא צעד אחד. שום דבר לא זז עד שלוחצים.",
    solved: "שלב {id} נפתר!",
    movesDone: "{moves} צעדים",
    tryAgain: "עוד פעם",
    nextLevel: "לשלב הבא",
    stuck: "אין לאן להמשיך מכאן.",
    back: "חזרה ללוח",
    board: "הלוח",
    locked: "נעול - קודם פותרים את השלב שלפניו",
    starsOf: "{n} מתוך 3 כוכבים",
    notYet: "עוד לא נפתר",
  },
  es: {
    level: "Nivel",
    moves: "Pasos",
    parIn: "★★★ en",
    starsIn: "{stars} en {n}",
    world: "Mundo",
    garden: "Jardín",
    maze: "Laberinto",
    gardenBlurb: "Come en el orden correcto. Tu cuerpo estorba.",
    mazeBlurb: "Esquinas estrechas y una cola larga.",
    levelOf: "Nivel {n} de {of}",
    goal: "Cómete todas las manzanas y la puerta dorada se abre.",
    undo: "Deshacer",
    restart: "Reiniciar",
    levels: "Niveles",
    allLevels: "Todos los niveles",
    keysHint: "Cada flecha es un paso. Nada se mueve hasta que pulsas.",
    solved: "¡Nivel {id} resuelto!",
    movesDone: "{moves} pasos",
    tryAgain: "Otra vez",
    nextLevel: "Siguiente",
    stuck: "Desde aquí no hay salida.",
    back: "Volver al tablero",
    board: "El tablero",
    locked: "bloqueado: primero resuelve el anterior",
    starsOf: "{n} de 3 estrellas",
    notYet: "sin resolver",
  },
  sv: {
    level: "Nivå",
    moves: "Drag",
    parIn: "★★★ på",
    starsIn: "{stars} på {n}",
    world: "Värld",
    garden: "Trädgården",
    maze: "Labyrinten",
    gardenBlurb: "Ät i rätt ordning. Din kropp står i vägen.",
    mazeBlurb: "Trånga hörn och en lång svans.",
    levelOf: "Nivå {n} av {of}",
    goal: "Ät alla äpplen, sedan öppnas guldporten.",
    undo: "Ångra",
    restart: "Börja om",
    levels: "Nivåer",
    allLevels: "Alla nivåer",
    keysHint: "Varje piltangent är ett steg. Inget rör sig förrän du trycker.",
    solved: "Nivå {id} klar!",
    movesDone: "{moves} drag",
    tryAgain: "Igen",
    nextLevel: "Nästa nivå",
    stuck: "Här tar det stopp.",
    back: "Tillbaka till brädet",
    board: "Brädet",
    locked: "låst - lös den förra först",
    starsOf: "{n} av 3 stjärnor",
    notYet: "inte löst än",
  },
};

/** Put values into a sentence: `fill("Level {n} of {of}", { n: 3, of: 6 })`. */
export function fill(template: string, values: Record<string, string | number>): string {
  return template.replace(/\{(\w+)\}/g, (m, k: string) => (k in values ? String(values[k]) : m));
}
