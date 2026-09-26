// The simplest words, for easy mode.
//
// `cast.ts` is themed for games that show several pictures at once (memory,
// find-the-pair), so it is chosen for VISUAL DISTINCTNESS and deliberately
// leaves out look-alikes like dog and cat. First Letter shows ONE picture at a
// time, so that rule does not bind it - and its easy mode wants the everyday
// words a toddler already knows (dog, cat, home, car, ball) rather than
// giraffe, octopus and pineapple. So this is the game's own small pool, on the
// `src/games/wordguess/words.ts` precedent.
//
// Same shape as a `CastItem`: a glyph plus the everyday name in every language a
// HUMAN has written one for, so promoting a fourth language reds this file by
// name exactly as it reds `cast.ts`. Written NATIVELY per language, never
// translated. No nikud in Hebrew and no accents needed on the FIRST letter, so
// every word's opening letter is a plain member of its alphabet (asserted in
// `logic.test.ts`).
//
// PURE DATA. Imported by the pure `logic.ts`, so it must stay free of DOM,
// React and any runtime import beyond the type.
import type { CastItem } from "@shared/cast";

export const SIMPLE: readonly CastItem[] = [
  { emoji: "🐶", he: "כלב", en: "dog", es: "perro", sv: "hund" },
  { emoji: "🐱", he: "חתול", en: "cat", es: "gato", sv: "katt" },
  { emoji: "🏠", he: "בית", en: "home", es: "casa", sv: "hem" },
  { emoji: "🚗", he: "מכונית", en: "car", es: "coche", sv: "bil" },
  { emoji: "⚽", he: "כדור", en: "ball", es: "pelota", sv: "boll" },
  { emoji: "☀️", he: "שמש", en: "sun", es: "sol", sv: "sol" },
  { emoji: "🌳", he: "עץ", en: "tree", es: "árbol", sv: "träd" },
  { emoji: "🐟", he: "דג", en: "fish", es: "pez", sv: "fisk" },
  { emoji: "🐦", he: "ציפור", en: "bird", es: "pájaro", sv: "fågel" },
  { emoji: "🍎", he: "תפוח", en: "apple", es: "manzana", sv: "äpple" },
  { emoji: "🍌", he: "בננה", en: "banana", es: "plátano", sv: "banan" },
  { emoji: "📖", he: "ספר", en: "book", es: "libro", sv: "bok" },
  { emoji: "⭐", he: "כוכב", en: "star", es: "estrella", sv: "stjärna" },
  { emoji: "🎩", he: "כובע", en: "hat", es: "sombrero", sv: "hatt" },
  { emoji: "🌸", he: "פרח", en: "flower", es: "flor", sv: "blomma" },
  { emoji: "🍰", he: "עוגה", en: "cake", es: "pastel", sv: "tårta" },
  { emoji: "👟", he: "נעל", en: "shoe", es: "zapato", sv: "sko" },
  { emoji: "🛏️", he: "מיטה", en: "bed", es: "cama", sv: "säng" },
  { emoji: "🔑", he: "מפתח", en: "key", es: "llave", sv: "nyckel" },
  { emoji: "🦆", he: "ברווז", en: "duck", es: "pato", sv: "anka" },
  { emoji: "🥛", he: "חלב", en: "milk", es: "leche", sv: "mjölk" },
  { emoji: "🛝", he: "מגלשה", en: "slide", es: "tobogán", sv: "rutschkana" },
];
