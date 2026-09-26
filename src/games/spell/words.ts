// The picture words this game asks a child to SPELL.
//
// WHY THIS IS NOT `@shared/cast`, and not `letters/words.ts` either.
//
// Both of those lists are chosen for games where a word is only ever SHOWN or
// SAID. This one has to be typed out letter by letter, from a tray of tiles,
// which is a much narrower requirement than it looks:
//
//   - every letter must exist in that language's own tile alphabet, so a word
//     carrying an apostrophe (cast's `ג'ירפה`) or an accent (`león`, `plátano`,
//     `pájaro`, `avión`) is unspellable here - the tray has no key for it. That
//     is not a reason to strip the accent: `arbol` is a MISSPELLING, and a
//     spelling game teaching one would be worse than not carrying the word.
//     So the word is dropped and a clean sibling takes its place - 🌲 `pino`
//     for the tree, 🚂 `tren` for the bus, `ave` for the bird.
//   - a word with a space in it (`ice cream`, `arco iris`) has no tile either.
//   - the three languages are chosen TOGETHER, per picture, so a picture that
//     is clean in two languages and accented in the third does not ship. That
//     is why the list is shorter than the vocabulary would allow.
//
// `words.test.ts`-style assertions live in `logic.test.ts`: every word is
// spellable from its own alphabet, in every language, and no word is shorter
// than `MIN_LETTERS`. A word that breaks either rule fails the build rather
// than reaching a child as a tile they cannot find.
//
// Hebrew carries no nikud and DOES carry final forms (`עץ`, `לחם`), because a
// final form is how the word is really written - see `SPELLING_LETTERS` in
// `logic.ts`, which accepts them as tiles while `ALPHABETS` never offers one as
// a decoy.
//
// Written NATIVELY per language, never translated: `en: "bike"` sits beside
// `es: "bici"`, which is what a Spanish-speaking child calls it, rather than
// the longer dictionary word. Promoting a fourth SHIPPED locale reds this file
// by name, exactly as it reds `cast.ts`.
//
// PURE DATA. Imported by the pure `logic.ts`, so nothing here may import DOM,
// React or anything beyond the type.
import type { CastItem } from "@shared/cast";

export const WORDS: readonly CastItem[] = [
  // Animals
  { emoji: "🐶", he: "כלב", en: "dog", es: "perro", sv: "hund" },
  { emoji: "🐱", he: "חתול", en: "cat", es: "gato", sv: "katt" },
  { emoji: "🐄", he: "פרה", en: "cow", es: "vaca", sv: "ko" },
  { emoji: "🐷", he: "חזיר", en: "pig", es: "cerdo", sv: "gris" },
  { emoji: "🐴", he: "סוס", en: "horse", es: "caballo", sv: "häst" },
  { emoji: "🐑", he: "כבשה", en: "sheep", es: "oveja", sv: "får" },
  { emoji: "🐔", he: "תרנגולת", en: "hen", es: "gallina", sv: "höna" },
  { emoji: "🦆", he: "ברווז", en: "duck", es: "pato", sv: "anka" },
  { emoji: "🐦", he: "ציפור", en: "bird", es: "ave", sv: "fågel" },
  { emoji: "🐟", he: "דג", en: "fish", es: "pez", sv: "fisk" },
  { emoji: "🐸", he: "צפרדע", en: "frog", es: "rana", sv: "groda" },
  { emoji: "🐝", he: "דבורה", en: "bee", es: "abeja", sv: "bi" },
  { emoji: "🐘", he: "פיל", en: "elephant", es: "elefante", sv: "elefant" },
  { emoji: "🐻", he: "דוב", en: "bear", es: "oso", sv: "björn" },
  { emoji: "🐒", he: "קוף", en: "monkey", es: "mono", sv: "apa" },
  { emoji: "🐢", he: "צב", en: "turtle", es: "tortuga", sv: "sköldpadda" },
  { emoji: "🦋", he: "פרפר", en: "butterfly", es: "mariposa", sv: "fjäril" },
  { emoji: "🐌", he: "חילזון", en: "snail", es: "caracol", sv: "snigel" },

  // Food
  { emoji: "🍎", he: "תפוח", en: "apple", es: "manzana", sv: "äpple" },
  { emoji: "🍌", he: "בננה", en: "banana", es: "banana", sv: "banan" },
  { emoji: "🍇", he: "ענבים", en: "grapes", es: "uvas", sv: "druvor" },
  { emoji: "🍓", he: "תות", en: "berry", es: "fresa", sv: "bär" },
  { emoji: "🥕", he: "גזר", en: "carrot", es: "zanahoria", sv: "morot" },
  { emoji: "🍅", he: "עגבניה", en: "tomato", es: "tomate", sv: "tomat" },
  { emoji: "🍞", he: "לחם", en: "bread", es: "pan", sv: "bröd" },
  { emoji: "🧀", he: "גבינה", en: "cheese", es: "queso", sv: "ost" },
  { emoji: "🥚", he: "ביצה", en: "egg", es: "huevo", sv: "ägg" },
  { emoji: "🥛", he: "חלב", en: "milk", es: "leche", sv: "mjölk" },
  { emoji: "🍰", he: "עוגה", en: "cake", es: "pastel", sv: "tårta" },
  { emoji: "🍪", he: "עוגיה", en: "cookie", es: "galleta", sv: "kaka" },
  { emoji: "🍫", he: "שוקולד", en: "chocolate", es: "chocolate", sv: "choklad" },
  { emoji: "🌰", he: "אגוז", en: "nut", es: "nuez", sv: "nöt" },

  // Nature and weather
  { emoji: "☀️", he: "שמש", en: "sun", es: "sol", sv: "sol" },
  { emoji: "🌙", he: "ירח", en: "moon", es: "luna", sv: "måne" },
  { emoji: "⭐", he: "כוכב", en: "star", es: "estrella", sv: "stjärna" },
  { emoji: "🌲", he: "אורן", en: "pine", es: "pino", sv: "tall" },
  { emoji: "🌸", he: "פרח", en: "flower", es: "flor", sv: "blomma" },
  { emoji: "🌻", he: "חמניה", en: "sunflower", es: "girasol", sv: "solros" },
  { emoji: "🌊", he: "ים", en: "sea", es: "mar", sv: "hav" },
  { emoji: "🌧️", he: "גשם", en: "rain", es: "lluvia", sv: "regn" },
  { emoji: "❄️", he: "שלג", en: "snow", es: "nieve", sv: "snö" },
  { emoji: "🔥", he: "אש", en: "fire", es: "fuego", sv: "eld" },
  { emoji: "🧊", he: "קרח", en: "ice", es: "hielo", sv: "is" },
  { emoji: "💧", he: "טיפה", en: "drop", es: "gota", sv: "droppe" },
  { emoji: "🌵", he: "קקטוס", en: "cactus", es: "cactus", sv: "kaktus" },

  // Home and things
  { emoji: "🏠", he: "בית", en: "home", es: "casa", sv: "hem" },
  { emoji: "🚪", he: "דלת", en: "door", es: "puerta", sv: "dörr" },
  { emoji: "🪟", he: "חלון", en: "window", es: "ventana", sv: "fönster" },
  { emoji: "🪑", he: "כיסא", en: "chair", es: "silla", sv: "stol" },
  { emoji: "🛏️", he: "מיטה", en: "bed", es: "cama", sv: "säng" },
  { emoji: "🔑", he: "מפתח", en: "key", es: "llave", sv: "nyckel" },
  { emoji: "⏰", he: "שעון", en: "clock", es: "reloj", sv: "klocka" },
  { emoji: "🕯️", he: "נר", en: "candle", es: "vela", sv: "ljus" },
  { emoji: "🪣", he: "דלי", en: "bucket", es: "cubo", sv: "hink" },
  { emoji: "📖", he: "ספר", en: "book", es: "libro", sv: "bok" },
  { emoji: "🎩", he: "כובע", en: "hat", es: "sombrero", sv: "hatt" },
  { emoji: "👟", he: "נעל", en: "shoe", es: "zapato", sv: "sko" },

  // Out and about
  { emoji: "🚗", he: "מכונית", en: "car", es: "coche", sv: "bil" },
  { emoji: "🚂", he: "רכבת", en: "train", es: "tren", sv: "tåg" },
  { emoji: "⛵", he: "סירה", en: "boat", es: "barco", sv: "båt" },
  { emoji: "🚲", he: "אופניים", en: "bike", es: "bici", sv: "cykel" },
  { emoji: "⚽", he: "כדור", en: "ball", es: "pelota", sv: "boll" },
  { emoji: "🎈", he: "בלון", en: "balloon", es: "globo", sv: "ballong" },
  { emoji: "🎁", he: "מתנה", en: "gift", es: "regalo", sv: "present" },
  { emoji: "🧸", he: "דובי", en: "teddy", es: "osito", sv: "nalle" },
  { emoji: "🥁", he: "תוף", en: "drum", es: "tambor", sv: "trumma" },
  { emoji: "🎸", he: "גיטרה", en: "guitar", es: "guitarra", sv: "gitarr" },
];
