// The words the ARENA draws (round four), in every language the game ships:
// the "N inside" chip, the crush banner, the bonus gem's label, Nova's call.
// The chrome's own words live in SnakeSurvivorsGame.tsx; these are drawn by
// the scene, so they are handed to it as plain functions.

import type { ShippedLocale } from "@i18n/locales";

export interface FxText {
  inside: (n: number) => string;
  crush: (n: number) => string;
  /** Said where a big crush drops its bonus gem - a pickup says what it gives. */
  bonus: string;
  nova: string;
  /** The callout when a stage's mini-boss arrives. */
  mini: string;
}

export const FX_TEXT: Record<ShippedLocale, FxText> = {
  en: { inside: (n) => `${n} inside`, crush: (n) => `CRUSH x${n}!`, bonus: "+1 bonus gem", nova: "NOVA!", mini: "MINI-BOSS!" },
  he: { inside: (n) => `${n} בפנים`, crush: (n) => `מחיצה x${n}!`, bonus: "+1 יהלום בונוס", nova: "נובה!", mini: "מיני-בוס!" },
  es: { inside: (n) => `${n} dentro`, crush: (n) => `¡APLASTA x${n}!`, bonus: "+1 gema extra", nova: "¡NOVA!", mini: "¡MINIJEFE!" },
  sv: { inside: (n) => `${n} inne`, crush: (n) => `KROSS x${n}!`, bonus: "+1 bonussten", nova: "NOVA!", mini: "MINIBOSS!" },
};
