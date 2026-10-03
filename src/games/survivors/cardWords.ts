// THE LEVEL-UP CARDS' OWN WORDS - what each card DOES, the slot counts and the
// reroll. Operator ruling 2026-10-02, card option B off a drawn before/after
// ("ack B"): three big cards, each with a line saying what it does.
//
// Every line is TRUE TO THE RULES in upgrades.ts, and says no number the rules
// do not: +1 damage per step (`boltDamage`), one more shot per step (`boltCount`),
// a heart that also heals (upgrades.ts raises hp with maxHp). Where a step's size
// is a curve rather than a constant (`fireEvery`, `shieldEvery`) the line says the
// direction and the stars say how far along it you are.
//
// A MISSING LANGUAGE DOES NOT COMPILE: `Record<Locale, CardWords>`.

import { textFor } from "@i18n/index";
import type { AppLocale, Locale } from "@i18n/index";
import type { UpgradeId } from "./types";

export interface CardWords {
  /** What each power-up does, one plain sentence. */
  says: Record<UpgradeId, string>;
  /** What one more level of a weapon you carry does. */
  level: string;
  /** "{n}" is how many you hold, "{of}" how many you may. */
  weapons: string;
  powers: string;
  reroll: string;
  /** "{n}" rerolls left this stage. */
  left: string;
  /** The recipe hint's level, short: "Lv{n}" in "Lv4 + Spread = Storm". */
  lv: string;
}

const WORDS: Record<Locale, CardWords> = {
  en: {
    says: {
      rapid: "Every weapon shoots faster.",
      power: "+1 damage on every hit.",
      spread: "One more shot, blade or fragment each time.",
      swift: "Your robot moves faster.",
      magnet: "Gems fly to you from further away.",
      heart: "One more heart, and it heals you now.",
      pierce: "Shots go through one more shape.",
      shield: "Blocks a hit, then comes back - sooner each level.",
      range: "Your weapons aim at shapes further away.",
      area: "Blades, halo, fire and thunder reach further.",
      regen: "A lost heart grows back - sooner each level.",
      haste: "Your dash comes back sooner.",
    },
    level: "Hits harder and faster.",
    weapons: "Weapons {n} of {of}",
    powers: "Powers {n} of {of}",
    reroll: "Reroll",
    left: "{n} left",
    lv: "Lv{n}",
  },
  he: {
    says: {
      rapid: "כל נשק יורה מהר יותר.",
      power: "+1 נזק בכל פגיעה.",
      spread: "עוד יריה, להב או רסיס בכל פעם.",
      swift: "הרובוט זז מהר יותר.",
      magnet: "אבני החן עפות אליכם ממרחק גדול יותר.",
      heart: "עוד לב, והוא גם מרפא עכשיו.",
      pierce: "היריות עוברות דרך עוד צורה.",
      shield: "חוסם מכה וחוזר - מהר יותר בכל שלב.",
      range: "הנשקים מכוונים לצורות רחוקות יותר.",
      area: "להבים, הילה, אש ורעם מגיעים רחוק יותר.",
      regen: "לב שאבד צומח בחזרה - מהר יותר בכל שלב.",
      haste: "הזינוק חוזר מהר יותר.",
    },
    level: "פוגע חזק ומהר יותר.",
    weapons: "נשקים {n} מתוך {of}",
    powers: "כוחות {n} מתוך {of}",
    reroll: "הגרלה חדשה",
    left: "נשאר {n}",
    lv: "שלב {n}",
  },
  es: {
    says: {
      rapid: "Todas tus armas disparan más rápido.",
      power: "+1 de daño en cada golpe.",
      spread: "Un disparo, cuchilla o fragmento más cada vez.",
      swift: "Tu robot se mueve más rápido.",
      magnet: "Las gemas vuelan hacia ti desde más lejos.",
      heart: "Un corazón más, y te cura ahora.",
      pierce: "Los disparos atraviesan una forma más.",
      shield: "Para un golpe y vuelve, antes en cada nivel.",
      range: "Tus armas apuntan a formas más lejanas.",
      area: "Cuchillas, aura, fuego y trueno llegan más lejos.",
      regen: "Un corazón perdido vuelve a crecer, antes en cada nivel.",
      haste: "Tu salto vuelve antes.",
    },
    level: "Golpea más fuerte y más rápido.",
    weapons: "Armas {n} de {of}",
    powers: "Poderes {n} de {of}",
    reroll: "Cambiar",
    left: "quedan {n}",
    lv: "Nv{n}",
  },
  sv: {
    says: {
      rapid: "Alla vapen skjuter snabbare.",
      power: "+1 skada på varje träff.",
      spread: "Ett skott, blad eller splitter till varje gång.",
      swift: "Din robot rör sig snabbare.",
      magnet: "Ädelstenar flyger till dig från längre bort.",
      heart: "Ett hjärta till, och det läker dig nu.",
      pierce: "Skotten går igenom en form till.",
      shield: "Stoppar en träff och kommer tillbaka, snabbare för varje nivå.",
      range: "Dina vapen siktar på former längre bort.",
      area: "Blad, gloria, eld och åska når längre.",
      regen: "Ett förlorat hjärta växer tillbaka, snabbare för varje nivå.",
      haste: "Din rusning kommer tillbaka snabbare.",
    },
    level: "Slår hårdare och snabbare.",
    weapons: "Vapen {n} av {of}",
    powers: "Krafter {n} av {of}",
    reroll: "Slå om",
    left: "{n} kvar",
    lv: "Nv{n}",
  },
};

export const cardWords = (locale: AppLocale): CardWords => textFor(WORDS, locale);

/** Every authored language, for the test that walks them. */
export const CARD_WORDS = WORDS;
