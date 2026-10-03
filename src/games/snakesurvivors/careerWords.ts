// Snake Survivors' CAREER words - the title's button, the worlds, the goal row,
// each twist's tip, the result card, the gear's own names and the shop's six rows
// - in every language the game ships text in.
//
// NOT in `src/i18n/dict`, for the reason the kit gives in `src/ui/career/words.ts`:
// the shell dictionaries are downloaded by every child on a first visit, and these
// are read only by this game and the Career page, both lazy. vite.config.ts pins
// this file into the `career` chunk beside `careerWorlds.ts`, so the Career page
// can name a world without fetching the game.
//
// A MISSING LANGUAGE DOES NOT COMPILE: `Record<Locale, ...>`, with `Locale` the
// shipped-text set, so a dropped arm or key is a red build.

import { textFor } from "@i18n/index";
import type { AppLocale, Locale } from "@i18n/index";
import type { SnakeWorldId } from "./careerTypes";

/** Every row the vending machine sells. Ids are the shop's, forever. */
export type SnakeShopId = "length" | "crush" | "swift" | "magnet" | "luck" | "shield";

export interface SnakeCareerWords {
  career: string;
  back: string;
  world: Record<SnakeWorldId, string>;
  /** A level's name on the goal row and the result card: "{w}" the world, "{n}" its number. */
  level: string;
  /** A boss level's name: "{w}" the world. */
  bossLevel: string;
  /** The goal row's word while a boss is up. */
  boss: string;
  /** Each twist's tip, shown for the first seconds of a level in that world. */
  tip: { desert: string; cave: string };
  /** "{l}" the level's name. */
  clear: string;
  lost: string;
  /** "{n}" hearts left of "{m}", "{s}" stars; `heartsOne` when it is one star. */
  hearts: string;
  heartsOne: string;
  /** A loss: "{n}" kept of "{m}" picked up. */
  keepHalf: string;
  map: string;
  retry: string;
  gold: string;
  newGear: string;
  diamond: string;
  /** A gear piece's name on the result card: "{t}" its tier, "{s}" its slot - the order is the language's. */
  piece: string;
  /** The three gear slots by the snake's own names, and the five stats. */
  slot: { weapon: string; armor: string; ring: string };
  stat: { health: string; speed: string; damage: string; magnet: string; luck: string };
  /** What each shop row is: a name and one plain sentence for its info card. */
  item: Record<SnakeShopId, { name: string; says: string }>;
}

const WORDS: Record<Locale, SnakeCareerWords> = {
  en: {
    career: "Career", back: "Back",
    world: { garden: "Garden", desert: "Desert", cave: "Cave" },
    level: "{w} {n}", bossLevel: "{w} boss", boss: "Boss",
    tip: { desert: "Sand slows you down", cave: "Shapes glow in the dark" },
    clear: "{l} clear!", lost: "Out of tail",
    hearts: "{n} of {m} hearts left = {s} stars", heartsOne: "{n} of {m} hearts left = 1 star",
    keepHalf: "You keep half your gold: {n} of {m}",
    map: "Map", retry: "Try again", gold: "Gold", newGear: "New gear", diamond: "Diamond", piece: "{t} {s}",
    slot: { weapon: "Fangs", armor: "Scales", ring: "Charm" },
    stat: { health: "Length", speed: "Speed", damage: "Crush", magnet: "Magnet", luck: "Luck" },
    item: {
      length: { name: "Longer start", says: "Start every level 4 segments longer. Your tail is your life." },
      crush: { name: "Crush", says: "A shape that lives through your loop is more likely to take a second hit." },
      swift: { name: "Speed", says: "The snake slides and turns 8% faster." },
      magnet: { name: "Magnet", says: "Gems and gold fly to you from further away." },
      luck: { name: "Luck", says: "Crushed shapes drop more gold." },
      shield: { name: "Shield", says: "The first crash in every level costs nothing." },
    },
  },
  he: {
    career: "קריירה", back: "חזרה",
    world: { garden: "גן", desert: "מדבר", cave: "מערה" },
    level: "{w} {n}", bossLevel: "הבוס של ה{w}", boss: "בוס",
    tip: { desert: "החול מאט אתכם", cave: "הצורות זוהרות בחושך" },
    clear: "{l} עבר!", lost: "הזנב נגמר",
    hearts: "נשארו {n} מתוך {m} לבבות = {s} כוכבים", heartsOne: "נשארו {n} מתוך {m} לבבות = כוכב אחד",
    keepHalf: "נשאר לכם חצי מהזהב: {n} מתוך {m}",
    map: "מפה", retry: "שוב", gold: "זהב", newGear: "ציוד חדש", diamond: "יהלום", piece: "{s} {t}",
    slot: { weapon: "ניבים", armor: "קשקשים", ring: "קמע" },
    stat: { health: "אורך", speed: "מהירות", damage: "מחיצה", magnet: "מגנט", luck: "מזל" },
    item: {
      length: { name: "התחלה ארוכה", says: "כל שלב מתחיל ארוך יותר ב-4 חוליות. הזנב הוא החיים שלכם." },
      crush: { name: "מחיצה", says: "צורה ששרדה את הלולאה תספוג מכה נוספת לעתים קרובות יותר." },
      swift: { name: "מהירות", says: "הנחש זז ומסתובב מהר יותר ב-8%." },
      magnet: { name: "מגנט", says: "יהלומים וזהב עפים אליכם ממרחק גדול יותר." },
      luck: { name: "מזל", says: "צורות שנמחצו מפילות יותר זהב." },
      shield: { name: "מגן", says: "ההתנגשות הראשונה בכל שלב לא עולה כלום." },
    },
  },
  es: {
    career: "Carrera", back: "Atrás",
    world: { garden: "Jardín", desert: "Desierto", cave: "Cueva" },
    level: "{w} {n}", bossLevel: "{w}: jefe", boss: "Jefe",
    tip: { desert: "La arena te frena", cave: "Las figuras brillan en la oscuridad" },
    clear: "¡{l} superado!", lost: "Sin cola",
    hearts: "Te quedan {n} de {m} corazones = {s} estrellas", heartsOne: "Te quedan {n} de {m} corazones = 1 estrella",
    keepHalf: "Te quedas la mitad del oro: {n} de {m}",
    map: "Mapa", retry: "Otra vez", gold: "Oro", newGear: "Equipo nuevo", diamond: "Diamante", piece: "{s} {t}",
    slot: { weapon: "Colmillos", armor: "Escamas", ring: "Amuleto" },
    stat: { health: "Largo", speed: "Velocidad", damage: "Aplaste", magnet: "Imán", luck: "Suerte" },
    item: {
      length: { name: "Salida larga", says: "Empiezas cada nivel 4 segmentos más larga. Tu cola es tu vida." },
      crush: { name: "Aplaste", says: "Una figura que sobrevive a tu círculo recibe un segundo golpe más a menudo." },
      swift: { name: "Velocidad", says: "La serpiente se mueve y gira un 8% más rápido." },
      magnet: { name: "Imán", says: "Las gemas y el oro vuelan hacia ti desde más lejos." },
      luck: { name: "Suerte", says: "Las figuras aplastadas sueltan más oro." },
      shield: { name: "Escudo", says: "El primer choque de cada nivel no cuesta nada." },
    },
  },
  sv: {
    career: "Karriär", back: "Tillbaka",
    world: { garden: "Trädgård", desert: "Öken", cave: "Grotta" },
    level: "{w} {n}", bossLevel: "{w}: boss", boss: "Boss",
    tip: { desert: "Sanden saktar ner dig", cave: "Figurerna lyser i mörkret" },
    clear: "{l} klar!", lost: "Slut på svans",
    hearts: "{n} av {m} hjärtan kvar = {s} stjärnor", heartsOne: "{n} av {m} hjärtan kvar = 1 stjärna",
    keepHalf: "Du får behålla halva guldet: {n} av {m}",
    map: "Karta", retry: "Igen", gold: "Guld", newGear: "Ny utrustning", diamond: "Diamant", piece: "{t} {s}",
    slot: { weapon: "Huggtänder", armor: "Fjäll", ring: "Amulett" },
    stat: { health: "Längd", speed: "Fart", damage: "Kross", magnet: "Magnet", luck: "Tur" },
    item: {
      length: { name: "Längre start", says: "Börja varje nivå 4 segment längre. Svansen är ditt liv." },
      crush: { name: "Kross", says: "En figur som klarar sig genom öglan tar oftare en andra träff." },
      swift: { name: "Fart", says: "Ormen glider och svänger 8 % snabbare." },
      magnet: { name: "Magnet", says: "Ädelstenar och guld flyger till dig från längre bort." },
      luck: { name: "Tur", says: "Krossade figurer tappar mer guld." },
      shield: { name: "Sköld", says: "Den första krocken på varje nivå kostar ingenting." },
    },
  },
};

export const snakeCareerWords = (locale: AppLocale): SnakeCareerWords => textFor(WORDS, locale);

/** Every authored language, for the test that walks them. */
export const SNAKE_CAREER_WORDS = WORDS;

/** A level's name in the player's language: "Garden 2", "Desert boss". */
export function levelName(w: SnakeCareerWords, world: SnakeWorldId, n: number | null): string {
  return n === null ? w.bossLevel.replace("{w}", w.world[world]) : w.level.replace("{w}", w.world[world]).replace("{n}", String(n));
}
