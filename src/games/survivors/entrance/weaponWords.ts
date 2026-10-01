// The words on the weapon pick and the SUPER POWER card, in every language the
// app has authored text in (2026-09-30).
//
// NOT in `src/i18n/dict`: the shell dictionaries are downloaded by every child
// on a first visit, and these are read only inside this game's own chunk - the
// same reason careerWords.ts gives.
//
// A MISSING LANGUAGE DOES NOT COMPILE: `satisfies Record<Locale, ...>`, and the
// super names and lines are `Record<WeaponId, ...>`, so a dropped arm, key or
// weapon is a red build. The evolutions' own `EVOLUTIONS[id].name` in evolve.ts
// stays English - it is a label for the code; these are the player's.

import { textFor, type AppLocale, type Locale } from "@i18n/index";
import type { WeaponId } from "../types";
import type { Rarity } from "../weaponPool";

export interface WeaponWords {
  /** The pick screen's heading and its one line under it. */
  pickTitle: string;
  pickSub: string;
  /** The rarity, as a WORD on each card's ribbon - colour is never the only signal. */
  rarity: Record<Rarity, string>;
  /** What a rarity gives the main weapon. Common gives nothing, so it has no line. */
  perk: { rare: string; epic: string };
  /** A locked card's line; "{n}" is the world. */
  lock: string;
  /** Said to a screen reader on a locked card. */
  locked: string;
  /** "Level {n}", for the strip and the super card. */
  level: string;
  superPower: string;
  takeIt: string;
  play: string;
  /** The small button on the quick run's result screen that goes back to the pick. */
  weapon: string;
  /** Each weapon's SUPER POWER: its name and one line saying what it does. */
  supers: Record<WeaponId, [name: string, line: string]>;
}

const WORDS = {
  en: {
    pickTitle: "Pick your weapon",
    pickSub: "Your main weapon for this run. Rarer ones start stronger.",
    rarity: { common: "COMMON", rare: "RARE", epic: "EPIC" },
    perk: { rare: "+20% damage", epic: "Starts at level 2" },
    lock: "Win World {n}",
    locked: "Locked",
    level: "Level {n}",
    superPower: "Super power!",
    takeIt: "Take it!",
    play: "Play",
    weapon: "Weapon",
    supers: {
      bolt: ["Railgun", "Your bolt becomes a beam that goes through everything"],
      arc: ["Storm", "Two arcs at a time, and each one jumps to the next shape"],
      burst: ["Nova", "Your burst leaves a ring of fire that keeps burning"],
      blades: ["Sawstorm", "Your blades swing far out and back again"],
      drone: ["Swarm", "One drone becomes three, and all of them shoot"],
    },
  },
  he: {
    pickTitle: "בחרו נשק",
    pickSub: "הנשק הראשי שלכם לריצה הזו. נדירים מתחילים חזקים יותר.",
    rarity: { common: "רגיל", rare: "נדיר", epic: "אפי" },
    perk: { rare: "+20% נזק", epic: "מתחיל בדרגה 2" },
    lock: "נצחו בעולם {n}",
    locked: "נעול",
    level: "דרגה {n}",
    superPower: "כוח על!",
    takeIt: "קחו אותו!",
    play: "שחקו",
    weapon: "נשק",
    supers: {
      bolt: ["קרן חודרת", "הקרן הופכת לאלומה שעוברת דרך הכול"],
      arc: ["סערה", "שתי קשתות בכל פעם, וכל אחת קופצת לצורה הבאה"],
      burst: ["נובה", "הפיצוץ משאיר טבעת אש שממשיכה לבעור"],
      blades: ["סערת מסורים", "הלהבים מתרחקים הרחק וחוזרים"],
      drone: ["נחיל", "רחפן אחד הופך לשלושה, וכולם יורים"],
    },
  },
  es: {
    pickTitle: "Elige tu arma",
    pickSub: "Tu arma principal en esta partida. Las más raras empiezan más fuertes.",
    rarity: { common: "COMÚN", rare: "RARA", epic: "ÉPICA" },
    perk: { rare: "+20% de daño", epic: "Empieza en nivel 2" },
    lock: "Gana el Mundo {n}",
    locked: "Bloqueada",
    level: "Nivel {n}",
    superPower: "¡Superpoder!",
    takeIt: "¡Tómalo!",
    play: "Jugar",
    weapon: "Arma",
    supers: {
      bolt: ["Cañón de raíl", "Tu rayo se vuelve un haz que lo atraviesa todo"],
      arc: ["Tormenta", "Dos arcos a la vez, y cada uno salta a la siguiente figura"],
      burst: ["Nova", "Tu estallido deja un anillo de fuego que sigue ardiendo"],
      blades: ["Tormenta de sierras", "Tus cuchillas salen lejos y vuelven"],
      drone: ["Enjambre", "Un dron se vuelve tres, y todos disparan"],
    },
  },
  sv: {
    pickTitle: "Välj ditt vapen",
    pickSub: "Ditt huvudvapen den här rundan. Ovanligare vapen börjar starkare.",
    rarity: { common: "VANLIG", rare: "SÄLLSYNT", epic: "EPISK" },
    perk: { rare: "+20 % skada", epic: "Börjar på nivå 2" },
    lock: "Vinn Värld {n}",
    locked: "Låst",
    level: "Nivå {n}",
    superPower: "Superkraft!",
    takeIt: "Ta den!",
    play: "Spela",
    weapon: "Vapen",
    supers: {
      bolt: ["Rälsgevär", "Din blixt blir en stråle som går igenom allt"],
      arc: ["Storm", "Två bågar åt gången, och varje hoppar till nästa figur"],
      burst: ["Nova", "Din skur lämnar en eldring som fortsätter brinna"],
      blades: ["Sågstorm", "Dina blad svänger långt ut och tillbaka igen"],
      drone: ["Svärm", "En drönare blir tre, och alla skjuter"],
    },
  },
} satisfies Record<Locale, WeaponWords>;

export const weaponWords = (locale: AppLocale): WeaponWords => textFor(WORDS, locale);

/** Every authored language, for the test that walks them. */
export const WEAPON_WORDS: Record<Locale, WeaponWords> = WORDS;
