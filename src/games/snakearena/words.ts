// Every word Snake Arena says, per language - a locale RECORD, so promoting a
// language reds `textFor` here by name rather than leaving the game speaking
// English inside a page that is not. Ordinals are functions, because "3rd",
// "3.º", "3:e" and "מקום 3" are not one string with a number swapped in.
import type { ShippedLocale } from "@i18n/locales";

export type Words = {
  you: string;
  /** The bots' names: invented, short, and no one's trademark. */
  names: readonly string[];
  length: string;
  time: string;
  place: string;
  out: string;
  play: string;
  playAgain: string;
  watch: string;
  rule: string;
  hint: string;
  live: string;
  longest: (n: number) => string;
  /** "3rd" - short, for the band. */
  ord: (p: number) => string;
  outTitle: (p: number, n: number) => string;
  /** The out card's heading, drawn big: "You're out". */
  outHead: string;
  /** "5th of 5" - the out card's gold line, and the final card's heading. */
  of: (p: number, n: number) => string;
  placeTitle: (p: number, n: number) => string;
  youWin: string;
  wins: (name: string) => string;
  nobody: string;
  final: string;
  /** The title card's choices (forum review, 2026-10-01). */
  level: string;
  /** Easy, Normal, Hard - in `LEVELS` order. */
  levels: readonly [string, string, string];
  colour: string;
  /** The six swatches' accessible names, in `COLOUR_IDS` order. */
  colours: readonly [string, string, string, string, string, string];
  map: string;
  /** Open, Rocks - in `MAPS` order. */
  maps: readonly [string, string];
  players: string;
  playerCount: (n: number) => string;
  /** Two players: who steers with what, under PLAY and beside the board. */
  keys2: string;
  /** The band's label over a person's length, two players ("P1 length"). */
  lengthOf: (name: string) => string;
};

const EN_SUFFIX = ["th", "st", "nd", "rd"];
const enOrd = (p: number) => `${p}${p % 100 >= 11 && p % 100 <= 13 ? "th" : (EN_SUFFIX[p % 10] ?? "th")}`;
const svOrd = (p: number) => `${p}:${p % 10 === 1 || p % 10 === 2 ? "a" : "e"}`;

export const WORDS: Record<ShippedLocale, Words> = {
  en: {
    you: "You",
    names: ["Bolt", "Moss", "Echo", "Pip", "Fizz"],
    length: "Length",
    time: "Time",
    place: "Place",
    out: "OUT",
    play: "Play",
    playAgain: "Play again",
    watch: "Watch (3x)",
    rule: "Longest snake at 1:30 wins. Hit a body and you're out.",
    hint: "Arrows, swipe or the buttons",
    live: "Live ranking",
    longest: (n) => `Longest you reached: ${n}`,
    ord: enOrd,
    outTitle: (p, n) => `You're out - ${enOrd(p)} of ${n}`,
    outHead: "You're out",
    of: (p, n) => `${enOrd(p)} of ${n}`,
    placeTitle: (p, n) => `You came ${enOrd(p)} of ${n}`,
    youWin: "You win!",
    wins: (name) => `${name} wins`,
    nobody: "Nobody was left standing",
    final: "Final ranking",
    level: "Level",
    levels: ["Easy", "Normal", "Hard"],
    colour: "Your colour",
    colours: ["Mint", "Pink", "Gold", "Blue", "Violet", "Silver"],
    map: "Map",
    maps: ["Open", "Rocks"],
    players: "Players",
    playerCount: (n) => (n === 1 ? "1 player" : `${n} players`),
    keys2: "P1: arrow keys · P2: W A S D",
    lengthOf: (name) => `${name} length`,
  },
  he: {
    you: "אתם",
    names: ["בולט", "מוס", "אקו", "פיפ", "פיז"],
    length: "אורך",
    time: "זמן",
    place: "מקום",
    out: "בחוץ",
    play: "שחקו",
    playAgain: "שחקו שוב",
    watch: "צפייה (x3)",
    rule: "הנחש הכי ארוך ב-1:30 מנצח. נגיעה בגוף - ואתם בחוץ.",
    hint: "חצים, החלקה או הכפתורים",
    live: "דירוג חי",
    longest: (n) => `האורך הכי גדול שהגעתם אליו: ${n}`,
    ord: (p) => `${p}`,
    outTitle: (p, n) => `יצאתם - מקום ${p} מתוך ${n}`,
    outHead: "יצאתם",
    of: (p, n) => `מקום ${p} מתוך ${n}`,
    placeTitle: (p, n) => `סיימתם במקום ${p} מתוך ${n}`,
    youWin: "ניצחתם!",
    wins: (name) => `${name} ניצח`,
    nobody: "אף נחש לא נשאר",
    final: "הדירוג הסופי",
    level: "רמה",
    levels: ["קל", "רגיל", "קשה"],
    colour: "הצבע שלכם",
    colours: ["מנטה", "ורוד", "זהב", "כחול", "סגול", "כסף"],
    map: "מפה",
    maps: ["פתוחה", "סלעים"],
    players: "שחקנים",
    playerCount: (n) => (n === 1 ? "שחקן אחד" : `${n} שחקנים`),
    keys2: "P1: החצים · P2: W A S D",
    lengthOf: (name) => `אורך ${name}`,
  },
  es: {
    you: "Tú",
    names: ["Bolt", "Moss", "Echo", "Pip", "Fizz"],
    length: "Largo",
    time: "Tiempo",
    place: "Puesto",
    out: "FUERA",
    play: "Jugar",
    playAgain: "Otra vez",
    watch: "Mirar (x3)",
    rule: "Gana la serpiente más larga a la 1:30. Si chocas con un cuerpo, quedas fuera.",
    hint: "Flechas, deslizar o los botones",
    live: "Clasificación en directo",
    longest: (n) => `Lo más larga que llegaste: ${n}`,
    ord: (p) => `${p}.º`,
    outTitle: (p, n) => `Estás fuera - ${p}.º de ${n}`,
    outHead: "Estás fuera",
    of: (p, n) => `${p}.º de ${n}`,
    placeTitle: (p, n) => `Quedaste ${p}.º de ${n}`,
    youWin: "¡Has ganado!",
    wins: (name) => `Gana ${name}`,
    nobody: "No quedó nadie en pie",
    final: "Clasificación final",
    level: "Nivel",
    levels: ["Fácil", "Normal", "Difícil"],
    colour: "Tu color",
    colours: ["Menta", "Rosa", "Oro", "Azul", "Violeta", "Plata"],
    map: "Mapa",
    maps: ["Abierto", "Rocas"],
    players: "Jugadores",
    playerCount: (n) => (n === 1 ? "1 jugador" : `${n} jugadores`),
    keys2: "P1: flechas · P2: W A S D",
    lengthOf: (name) => `Largo ${name}`,
  },
  sv: {
    you: "Du",
    names: ["Bolt", "Moss", "Echo", "Pip", "Fizz"],
    length: "Längd",
    time: "Tid",
    place: "Plats",
    out: "UTE",
    play: "Spela",
    playAgain: "Spela igen",
    watch: "Titta (3x)",
    rule: "Längsta ormen vid 1:30 vinner. Nuddar du en kropp är du ute.",
    hint: "Pilar, svep eller knapparna",
    live: "Ställning just nu",
    longest: (n) => `Som längst var du: ${n}`,
    ord: svOrd,
    outTitle: (p, n) => `Du är ute - ${svOrd(p)} av ${n}`,
    outHead: "Du är ute",
    of: (p, n) => `${svOrd(p)} av ${n}`,
    placeTitle: (p, n) => `Du kom ${svOrd(p)} av ${n}`,
    youWin: "Du vann!",
    wins: (name) => `${name} vinner`,
    nobody: "Ingen orm fanns kvar",
    final: "Slutställning",
    level: "Nivå",
    levels: ["Lätt", "Normal", "Svår"],
    colour: "Din färg",
    colours: ["Mint", "Rosa", "Guld", "Blå", "Lila", "Silver"],
    map: "Karta",
    maps: ["Öppen", "Stenar"],
    players: "Spelare",
    playerCount: (n) => `${n} spelare`,
    keys2: "P1: piltangenterna · P2: W A S D",
    lengthOf: (name) => `Längd ${name}`,
  },
};

/**
 * A snake's name: "You" for the one player - or "P1" and "P2" for two - then
 * the bots in order, Bolt first whoever is playing.
 */
export const nameOf = (w: Words, id: number, humans = 1): string =>
  id < humans ? (humans === 1 ? w.you : `P${id + 1}`) : (w.names[id - humans] ?? `#${id}`);

/** "1:12" - whole seconds left. */
export const clock = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
