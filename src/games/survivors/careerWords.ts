// Neon Survival's CAREER words - the entrance tiles, the world names, the level
// banner and the result card - in every language the app has authored text in.
//
// NOT in `src/i18n/dict`, for the reason the kit gives in `src/ui/career/words.ts`:
// the shell dictionaries are downloaded by every child on a first visit, and these
// are read only inside this game's own lazy chunk.
//
// A MISSING LANGUAGE DOES NOT COMPILE: `Record<Locale, NeonCareerWords>`, with
// `Locale` the shipped-text set, so a dropped arm or key is a red build.

import { textFor } from "@i18n/index";
import type { AppLocale, Locale } from "@i18n/index";
import type { WorldId } from "./types";

export interface NeonCareerWords {
  career: string;
  quick: string;
  /** The small button on the quick run's entrance that goes back to the two tiles. */
  menu: string;
  world: Record<WorldId, string>;
  /** Each world's twist, said once on the level banner for a screen reader. */
  twist: Record<WorldId, string>;
  /** "{n}" is the level's number in its world. */
  level: string;
  boss: string;
  clear: string;
  lost: string;
  map: string;
  retry: string;
  gold: string;
  best: string;
  stars: string;
  newGear: string;
  start: string;
  /** P4 - the diamond shelf's three capsules, and the result screen's diamond line. */
  looks: { gold: string; ice: string; epic: string };
  diamond: string;
}

const WORDS: Record<Locale, NeonCareerWords> = {
  en: {
    career: "Career", quick: "Quick run", menu: "Menu",
    world: { city: "Neon City", frost: "Frost", lava: "Lava" },
    twist: { city: "the lights go out", frost: "the robot slides on ice", lava: "hot pools open" },
    level: "Level {n}", boss: "Boss", clear: "Level clear!", lost: "Out of hearts",
    map: "Back to map", retry: "Retry", gold: "Gold", best: "Best", stars: "Stars",
    newGear: "New gear", start: "Start",
    looks: { gold: "Gold bot", ice: "Ice bot", epic: "Epic gear" }, diamond: "Diamond",
  },
  he: {
    career: "קריירה", quick: "ריצה מהירה", menu: "תפריט",
    world: { city: "עיר הניאון", frost: "כפור", lava: "לבה" },
    twist: { city: "האורות כבים", frost: "הרובוט מחליק על הקרח", lava: "בריכות לוהטות נפתחות" },
    level: "שלב {n}", boss: "בוס", clear: "השלב עבר!", lost: "נגמרו הלבבות",
    map: "חזרה למפה", retry: "שוב", gold: "זהב", best: "שיא", stars: "כוכבים",
    newGear: "ציוד חדש", start: "התחלה",
    looks: { gold: "רובוט זהב", ice: "רובוט קרח", epic: "ציוד אגדי" }, diamond: "יהלום",
  },
  es: {
    career: "Carrera", quick: "Partida rápida", menu: "Menú",
    world: { city: "Ciudad Neón", frost: "Hielo", lava: "Lava" },
    twist: { city: "se apagan las luces", frost: "el robot patina en el hielo", lava: "se abren charcos ardientes" },
    level: "Nivel {n}", boss: "Jefe", clear: "¡Nivel superado!", lost: "Sin corazones",
    map: "Volver al mapa", retry: "Otra vez", gold: "Oro", best: "Récord", stars: "Estrellas",
    newGear: "Equipo nuevo", start: "Empezar",
    looks: { gold: "Robot de oro", ice: "Robot de hielo", epic: "Equipo épico" }, diamond: "Diamante",
  },
  sv: {
    career: "Karriär", quick: "Snabbspel", menu: "Meny",
    world: { city: "Neonstaden", frost: "Frost", lava: "Lava" },
    twist: { city: "lamporna slocknar", frost: "roboten glider på isen", lava: "heta pölar öppnas" },
    level: "Nivå {n}", boss: "Boss", clear: "Nivån klar!", lost: "Inga hjärtan kvar",
    map: "Till kartan", retry: "Igen", gold: "Guld", best: "Rekord", stars: "Stjärnor",
    newGear: "Ny utrustning", start: "Starta",
    looks: { gold: "Guldrobot", ice: "Isrobot", epic: "Episk utrustning" }, diamond: "Diamant",
  },
};

export const neonCareerWords = (locale: AppLocale): NeonCareerWords => textFor(WORDS, locale);

/** Every authored language, for the test that walks them. */
export const NEON_CAREER_WORDS = WORDS;
