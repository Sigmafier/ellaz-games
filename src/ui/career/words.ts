// The career screens' own words, in every language the app has authored text in.
//
// WHY NOT THE SHELL DICTIONARIES. `src/i18n/dict/he.ts` and `en.ts` are static
// imports of the SHELL, so a key added there is downloaded by every child on a
// first visit - for screens only a career game ever opens. The first visit had
// 27 B of headroom when this kit landed (plan §0.1). So these words ride in the
// lazy `career` chunk beside the screens that draw them, the way every game's
// own words do (`textFor` in SurvivorsGame.tsx).
//
// A MISSING LANGUAGE DOES NOT COMPILE. `WORDS` is `Record<Locale, CareerWords>`
// with `Locale` the shipped-text set, so dropping an arm - or a key inside one -
// is a red build naming it, not a screen that renders a raw key at a child.
// Adding a language to SHIPPED_LOCALES reds this file until it is written.

import { textFor } from "@i18n/index";
import type { AppLocale, Locale } from "@i18n/index";

export interface CareerWords {
  play: string;
  shop: string;
  gear: string;
  stats: string;
  buy: string;
  wear: string;
  back: string;
  gold: string;
  locked: string;
  /** "{n}" is the level's number inside its world */
  level: string;
  boss: string;
  bag: string;
  worn: string;
  short: string;
  /** "{n}" is how many of three */
  stars: string;
  soldOut: string;
  /** the site-wide second currency (P4) */
  diamonds: string;
  /** "Not enough gold", for diamonds */
  shortDiamonds: string;
  /** the question an epic piece asks before it is bought */
  pickSlot: string;
  /** a slot that already holds the epic piece, on the slot picker */
  have: string;
  slot: { weapon: string; armor: string; ring: string };
  tier: { common: string; rare: string; epic: string };
  stat: { health: string; speed: string; damage: string; magnet: string; luck: string };
  /** what a gear piece does, on its info card: "{n}" the amount, "{stat}" the stat's word */
  gives: string;
}

const WORDS: Record<Locale, CareerWords> = {
  en: {
    play: "Play", shop: "Shop", gear: "Gear", stats: "Stats", buy: "Buy", wear: "Wear",
    back: "Back", gold: "Gold", locked: "Locked", level: "Level {n}", boss: "Boss", bag: "Bag",
    worn: "Wearing", short: "Not enough gold", stars: "{n} of 3 stars", soldOut: "Sold out",
    diamonds: "Diamonds", shortDiamonds: "Not enough diamonds", pickSlot: "Pick a slot", have: "You have it",
    slot: { weapon: "Weapon", armor: "Armor", ring: "Ring" },
    tier: { common: "Common", rare: "Rare", epic: "Epic" },
    stat: { health: "Health", speed: "Speed", damage: "Damage", magnet: "Magnet", luck: "Luck" },
    gives: "Adds {n} to your {stat}.",
  },
  he: {
    play: "שחקו", shop: "חנות", gear: "ציוד", stats: "נתונים", buy: "קנו", wear: "לבשו",
    back: "חזרה", gold: "זהב", locked: "נעול", level: "שלב {n}", boss: "בוס", bag: "תיק",
    worn: "לבוש עכשיו", short: "אין מספיק זהב", stars: "{n} מתוך 3 כוכבים", soldOut: "אזל",
    diamonds: "יהלומים", shortDiamonds: "אין מספיק יהלומים", pickSlot: "בחרו מקום", have: "כבר יש לכם",
    slot: { weapon: "נשק", armor: "שריון", ring: "טבעת" },
    tier: { common: "רגיל", rare: "נדיר", epic: "אגדי" },
    stat: { health: "חיים", speed: "מהירות", damage: "נזק", magnet: "מגנט", luck: "מזל" },
    gives: "מוסיף {n} ל{stat}.",
  },
  es: {
    play: "Jugar", shop: "Tienda", gear: "Equipo", stats: "Datos", buy: "Comprar", wear: "Poner",
    back: "Atrás", gold: "Oro", locked: "Bloqueado", level: "Nivel {n}", boss: "Jefe", bag: "Bolsa",
    worn: "Puesto", short: "No tienes oro suficiente", stars: "{n} de 3 estrellas", soldOut: "Agotado",
    diamonds: "Diamantes", shortDiamonds: "No tienes diamantes suficientes", pickSlot: "Elige una casilla", have: "Ya lo tienes",
    slot: { weapon: "Arma", armor: "Armadura", ring: "Anillo" },
    tier: { common: "Común", rare: "Raro", epic: "Épico" },
    stat: { health: "Vida", speed: "Velocidad", damage: "Daño", magnet: "Imán", luck: "Suerte" },
    gives: "Suma {n} a tu {stat}.",
  },
  sv: {
    play: "Spela", shop: "Butik", gear: "Prylar", stats: "Statistik", buy: "Köp", wear: "Ta på",
    back: "Tillbaka", gold: "Guld", locked: "Låst", level: "Nivå {n}", boss: "Boss", bag: "Väska",
    worn: "På dig", short: "Inte nog med guld", stars: "{n} av 3 stjärnor", soldOut: "Slutsåld",
    diamonds: "Diamanter", shortDiamonds: "Inte nog med diamanter", pickSlot: "Välj en plats", have: "Du har den",
    slot: { weapon: "Vapen", armor: "Rustning", ring: "Ring" },
    tier: { common: "Vanlig", rare: "Sällsynt", epic: "Episk" },
    stat: { health: "Hälsa", speed: "Fart", damage: "Skada", magnet: "Magnet", luck: "Tur" },
    gives: "Ger {n} mer {stat}.",
  },
};

/** the career words for the app's language; a language with no authored text reads English */
export const careerWords = (locale: AppLocale): CareerWords => textFor(WORDS, locale);

/** fill "{n}" in a pattern */
export const fill = (pattern: string, n: number | string): string => pattern.replace("{n}", String(n));

/** every authored language, for the test that walks them */
export const CAREER_WORDS = WORDS;
