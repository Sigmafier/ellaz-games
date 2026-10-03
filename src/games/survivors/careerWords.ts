// Neon Survival's CAREER words - the title's button, the mode cards, the world names, the level
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
  /** The title screen's one button (2026-09-30). */
  tap: string;
  /** The Career card's line: "{n}" is the world you are up to. */
  worldN: string;
  /** The Quick run card's line. */
  quickLine: string;
  /** The mode screen's way back to the title, said to a screen reader. */
  back: string;
  /** THE HARD TIER (hardTier.ts): the map's two-way switch, its ribbon, and what a locked side says. */
  tier: { normal: string; hard: string; locked: string };
  /**
   * WHAT EACH SHOP ITEM IS (operator ruling 2026-10-02: "in shop we must know whats
   * each item or gear adds"). A name and one plain sentence per vending row and
   * per diamond capsule, drawn on the shop's info card. `shield` is also the word
   * under the shield row's "+1", which moves no stat bar.
   */
  item: Record<ShopItemId, { name: string; says: string }>;
}

/** Every row the shop sells: the six vending rows and the three diamond capsules. */
export type ShopItemId = "heart" | "power" | "swift" | "magnet" | "luck" | "shield" | "gold" | "ice" | "epic";

const WORDS: Record<Locale, NeonCareerWords> = {
  en: {
    career: "Career", quick: "Quick run", menu: "Menu",
    world: { city: "Neon City", frost: "Frost", lava: "Lava" },
    twist: { city: "the lights go out", frost: "the robot slides on ice", lava: "hot pools open" },
    level: "Level {n}", boss: "Boss", clear: "Level clear!", lost: "Out of hearts",
    map: "Back to map", retry: "Retry", gold: "Gold", best: "Best", stars: "Stars",
    newGear: "New gear", start: "Start",
    looks: { gold: "Gold bot", ice: "Ice bot", epic: "Epic gear" }, diamond: "Diamond",
    tap: "Tap to start", worldN: "World {n}", quickLine: "3 stages, a boss in each", back: "Back",
    tier: { normal: "Normal", hard: "Hard", locked: "Beat this world's boss to open Hard" },
    item: {
      heart: { name: "Extra heart", says: "Start every level with one more heart." },
      power: { name: "Power", says: "Every weapon hits harder." },
      swift: { name: "Speed", says: "Your robot runs faster." },
      magnet: { name: "Magnet", says: "Gems fly to you from further away." },
      luck: { name: "Luck", says: "Shapes drop more gold." },
      shield: { name: "Shield", says: "Start every level with a shield that blocks a hit and comes back." },
      gold: { name: "Gold bot", says: "Your robot turns gold. Just a look - it plays the same." },
      ice: { name: "Ice bot", says: "Your robot turns ice blue. Just a look - it plays the same." },
      epic: { name: "Epic gear", says: "Pick a slot - weapon, armor or ring - and get its best piece." },
    },
  },
  he: {
    career: "קריירה", quick: "ריצה מהירה", menu: "תפריט",
    world: { city: "עיר הניאון", frost: "כפור", lava: "לבה" },
    twist: { city: "האורות כבים", frost: "הרובוט מחליק על הקרח", lava: "בריכות לוהטות נפתחות" },
    level: "שלב {n}", boss: "בוס", clear: "השלב עבר!", lost: "נגמרו הלבבות",
    map: "חזרה למפה", retry: "שוב", gold: "זהב", best: "שיא", stars: "כוכבים",
    newGear: "ציוד חדש", start: "התחלה",
    looks: { gold: "רובוט זהב", ice: "רובוט קרח", epic: "ציוד אגדי" }, diamond: "יהלום",
    tap: "הקישו כדי להתחיל", worldN: "עולם {n}", quickLine: "3 שלבים, בוס בכל אחד", back: "חזרה",
    tier: { normal: "רגיל", hard: "קשה", locked: "נצחו את הבוס של העולם כדי לפתוח את קשה" },
    item: {
      heart: { name: "לב נוסף", says: "כל שלב מתחיל עם עוד לב." },
      power: { name: "כוח", says: "כל נשק פוגע חזק יותר." },
      swift: { name: "מהירות", says: "הרובוט שלכם רץ מהר יותר." },
      magnet: { name: "מגנט", says: "אבני החן עפות אליכם ממרחק גדול יותר." },
      luck: { name: "מזל", says: "הצורות מפילות יותר זהב." },
      shield: { name: "מגן", says: "כל שלב מתחיל עם מגן שחוסם מכה וחוזר." },
      gold: { name: "רובוט זהב", says: "הרובוט שלכם נהיה זהב. רק מראה - המשחק לא משתנה." },
      ice: { name: "רובוט קרח", says: "הרובוט שלכם נהיה כחול קרח. רק מראה - המשחק לא משתנה." },
      epic: { name: "ציוד אגדי", says: "בחרו מקום - נשק, שריון או טבעת - וקבלו את החלק הכי טוב שלו." },
    },
  },
  es: {
    career: "Carrera", quick: "Partida rápida", menu: "Menú",
    world: { city: "Ciudad Neón", frost: "Hielo", lava: "Lava" },
    twist: { city: "se apagan las luces", frost: "el robot patina en el hielo", lava: "se abren charcos ardientes" },
    level: "Nivel {n}", boss: "Jefe", clear: "¡Nivel superado!", lost: "Sin corazones",
    map: "Volver al mapa", retry: "Otra vez", gold: "Oro", best: "Récord", stars: "Estrellas",
    newGear: "Equipo nuevo", start: "Empezar",
    looks: { gold: "Robot de oro", ice: "Robot de hielo", epic: "Equipo épico" }, diamond: "Diamante",
    tap: "Toca para empezar", worldN: "Mundo {n}", quickLine: "3 fases, un jefe en cada una", back: "Atrás",
    tier: { normal: "Normal", hard: "Difícil", locked: "Vence al jefe de este mundo para abrir Difícil" },
    item: {
      heart: { name: "Corazón extra", says: "Empiezas cada nivel con un corazón más." },
      power: { name: "Poder", says: "Todas tus armas golpean más fuerte." },
      swift: { name: "Velocidad", says: "Tu robot corre más rápido." },
      magnet: { name: "Imán", says: "Las gemas vuelan hacia ti desde más lejos." },
      luck: { name: "Suerte", says: "Las formas sueltan más oro." },
      shield: { name: "Escudo", says: "Empiezas cada nivel con un escudo que para un golpe y vuelve." },
      gold: { name: "Robot de oro", says: "Tu robot se vuelve de oro. Solo cambia el aspecto." },
      ice: { name: "Robot de hielo", says: "Tu robot se vuelve azul hielo. Solo cambia el aspecto." },
      epic: { name: "Equipo épico", says: "Elige una casilla - arma, armadura o anillo - y llévate su mejor pieza." },
    },
  },
  sv: {
    career: "Karriär", quick: "Snabbspel", menu: "Meny",
    world: { city: "Neonstaden", frost: "Frost", lava: "Lava" },
    twist: { city: "lamporna slocknar", frost: "roboten glider på isen", lava: "heta pölar öppnas" },
    level: "Nivå {n}", boss: "Boss", clear: "Nivån klar!", lost: "Inga hjärtan kvar",
    map: "Till kartan", retry: "Igen", gold: "Guld", best: "Rekord", stars: "Stjärnor",
    newGear: "Ny utrustning", start: "Starta",
    looks: { gold: "Guldrobot", ice: "Isrobot", epic: "Episk utrustning" }, diamond: "Diamant",
    tap: "Tryck för att börja", worldN: "Värld {n}", quickLine: "3 faser, en boss i varje", back: "Tillbaka",
    tier: { normal: "Normal", hard: "Svår", locked: "Besegra världens boss för att öppna Svår" },
    item: {
      heart: { name: "Extra hjärta", says: "Varje nivå börjar med ett hjärta till." },
      power: { name: "Kraft", says: "Alla vapen slår hårdare." },
      swift: { name: "Fart", says: "Din robot springer snabbare." },
      magnet: { name: "Magnet", says: "Ädelstenar flyger till dig från längre bort." },
      luck: { name: "Tur", says: "Formerna tappar mer guld." },
      shield: { name: "Sköld", says: "Varje nivå börjar med en sköld som stoppar en träff och kommer tillbaka." },
      gold: { name: "Guldrobot", says: "Din robot blir guld. Bara utseendet - den spelar likadant." },
      ice: { name: "Isrobot", says: "Din robot blir isblå. Bara utseendet - den spelar likadant." },
      epic: { name: "Episk utrustning", says: "Välj en plats - vapen, rustning eller ring - och få dess bästa del." },
    },
  },
};

export const neonCareerWords = (locale: AppLocale): NeonCareerWords => textFor(WORDS, locale);

/** Every authored language, for the test that walks them. */
export const NEON_CAREER_WORDS = WORDS;
