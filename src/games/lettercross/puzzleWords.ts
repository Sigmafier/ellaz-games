/**
 * Lettercross - the words this game is allowed to SHOW a player.
 *
 * `words.ts` may never be used for this, and its own header says so: it is
 * ENABLE1 with a blocklist over it, and a blocklist is not provably complete -
 * the first generated build still carried four slurs after filtering. That is
 * survivable only because of what the list is FOR. It VALIDATES what a child
 * built out of their own tiles, so a child who spells something unpleasant
 * already knew the word and the game merely declines to score it.
 *
 * A puzzle that shows a word inverts that completely. Four of BONUS's five
 * bonus screens put a word on the screen and ask the player to complete it, and
 * a puzzle generator drawing from 28,515 filtered entries would eventually put
 * one in front of a five-year-old with nobody in the loop. So the rule from
 * NOTICE.md, which was written before any of these existed:
 *
 *   > The moment anything displays a dictionary word - a hint button, an AI
 *   > opponent's move, a "possible words" panel - that surface must draw from an
 *   > affirmative allowlist, not from this file.
 *
 * This is that allowlist. Same argument as `name-pool-convention.md`: constrain
 * the space so the bad output is NOT REPRESENTABLE, rather than filtering it
 * afterwards. A child cannot be shown a word that is not in this file, and this
 * file is short enough to read.
 *
 * THREE RULES, all of them pinned by `puzzle-words.test.ts`:
 *
 * 1. IT IS AUTHORED, NEVER DERIVED. Nothing here imports `words.ts`, and no
 *    script generates this file. An allowlist filtered out of the dictionary is
 *    the dictionary, and inherits every gap in its blocklist.
 * 2. EVERY WORD IS ALSO IN THE DICTIONARY, so a player who learns a word from a
 *    bonus round can lay it on the board and score it. The two lists disagreeing
 *    is a game that teaches a word and then refuses it.
 * 3. IT IS GROUPED, so it can be audited by reading. A flat array of 346 strings
 *    is not something anyone checks; fifteen labelled rows of things a small
 *    child can picture is.
 *
 * Concrete and picturable is the selection rule, not frequency. Every entry is
 * something a five-year-old could point at, do, or feel - which is also what
 * makes a missing letter guessable rather than a vocabulary test.
 *
 * ONE MEASURED GAP, worth knowing before adding to this list: `knife` is NOT in
 * `words.ts`, although `knifed`, `knifer` and `knifes` all are. That is a hole
 * in the ENABLE mirror NOTICE.md already warns about rather than anything this
 * repo did, and it is why the kitchen row says `fork`. Rule 2's test is what
 * caught it - a word added here without running that test can be a word the
 * game shows and then refuses.
 */
export const PUZZLE_WORDS: readonly string[] = [
  // animals
  "cat", "dog", "pig", "cow", "hen", "fox", "bat", "owl", "ant", "bee", "ape", "rat", "bird", "fish", "frog", "bear", "lion",
  "wolf", "goat", "duck", "crab", "worm", "mole", "deer", "seal", "swan", "crow", "moth", "wasp", "hare", "lamb", "calf",
  "foal", "mouse", "horse", "sheep", "tiger", "zebra", "snake", "whale", "shark", "camel", "puppy", "panda",
  "otter", "eagle", "robin", "snail", "spider", "monkey", "rabbit", "turtle", "donkey", "parrot", "beetle",

  // food and drink
  "egg", "jam", "pie", "ice", "bun", "nut", "oat", "fig", "bread", "apple", "grape", "lemon", "melon", "peach", "onion",
  "salad", "juice", "honey", "candy", "cocoa", "toast", "pasta", "olive", "berry", "sugar", "water", "milk",
  "rice", "bean", "corn", "cake", "soup", "fruit", "plum", "pear", "beet",

  // the body
  "arm", "ear", "eye", "leg", "lip", "toe", "hip", "jaw", "hand", "head", "foot", "knee", "nose", "hair", "face", "chin",
  "neck", "back", "tooth", "thumb", "heart", "brain", "elbow", "ankle", "wrist", "finger",

  // around the house
  "bed", "cup", "pot", "pan", "jug", "mug", "key", "mat", "rug", "box", "tap", "bag", "door", "wall", "roof", "lamp", "desk",
  "sofa", "book", "chair", "table", "spoon", "fork", "plate", "clock", "towel", "brush", "broom", "shelf", "stair",
  "window", "garden", "mirror", "basket", "pillow",

  // outside
  "sun", "sky", "sea", "mud", "fog", "ivy", "oak", "elm", "fir", "bud", "log", "sand", "leaf", "tree", "rock", "hill", "lake",
  "wind", "rain", "snow", "star", "moon", "cloud", "grass", "river", "beach", "stone", "storm", "plant", "field",
  "flower", "forest", "island", "valley", "meadow", "desert",

  // colours
  "red", "blue", "pink", "grey", "green", "black", "white", "brown", "cream",

  // clothes
  "hat", "cap", "sock", "shoe", "coat", "vest", "belt", "scarf", "glove", "shirt", "dress", "skirt", "jeans", "boot",

  // school and drawing
  "pen", "ink", "map", "art", "sum", "page", "word", "line", "ruler", "paper", "pencil", "crayon", "number", "letter",
  "school", "lesson",

  // things you do
  "run", "hop", "sit", "eat", "cut", "dig", "fly", "hug", "rub", "nap", "sip", "win", "add", "mix", "jump", "walk", "read",
  "sing", "swim", "draw", "ride", "skip", "clap", "wash", "cook", "bake", "grow", "open", "shut", "hold", "climb",
  "catch", "throw", "dance", "smile", "laugh", "sleep", "paint", "build", "think", "count", "spell",

  // getting about
  "bus", "car", "van", "jet", "ship", "boat", "bike", "road", "train", "plane", "truck", "wheel", "sail", "ferry",

  // music
  "drum", "bell", "horn", "song", "note", "flute", "piano", "violin", "banjo", "tune", "choir",

  // toys and objects
  "toy", "ball", "kite", "game", "rope", "card", "coin", "flag", "doll", "block", "puzzle", "bubble", "ribbon",
  "button", "candle",

  // weather
  "hot", "dry", "wet", "icy", "warm", "cool", "windy", "sunny", "rainy", "cloudy", "stormy", "frosty",

  // people
  "mum", "dad", "son", "boy", "girl", "baby", "aunt", "twin", "uncle", "sister", "cousin", "friend",

  // time, and the small words
  "day", "off", "out", "top", "new", "old", "fun", "sad", "night", "week", "year", "month", "today",
];

/** The pool by length, which is how every bonus screen wants to ask for it. */
export const PUZZLE_BY_LENGTH: ReadonlyMap<number, readonly string[]> = (() => {
  const m = new Map<number, string[]>();
  for (const w of PUZZLE_WORDS) (m.get(w.length) ?? m.set(w.length, []).get(w.length)!).push(w);
  return m;
})();


/* ------------------------------------------------------------------- Hebrew */

/**
 * The Hebrew half, written 2026-08-27 when the operator asked to play the game
 * in Hebrew. Same three rules, and a fourth that only shows up once there are
 * two of these:
 *
 * 4. IT IS NOT THE ENGLISH LIST TRANSLATED. The two hold different things,
 *    because a word's LENGTH and its LETTERS are the whole puzzle here and
 *    translation drags one language's shape onto another's. `סוס` is three
 *    letters and `horse` is five; a pool translated out of English would be
 *    long where Hebrew is short and would starve the four-letter screens that
 *    every round but the crossword draws from. Same discipline as
 *    `wordsearch/words.ts`, and as the game pages, which are written twice and
 *    never translated.
 *
 * WRITTEN THE WAY A PERSON WRITES THEM, final letters and all, so a Hebrew
 * reader can proofread this file. The pool the ROUNDS see is folded - see
 * `PUZZLE_WORDS_HE` below and the note in `lang.ts` about why a tile carries
 * the base letter.
 *
 * NO NIKUD, and nothing that needs an apostrophe: `ג'ירפה` and `פיג'מה` are
 * ordinary Hebrew words a child knows and there is no tile that can spell
 * either, so they are out. That is the same rule `spell/words.ts` states for
 * its own tray, and dropping the word beats spelling it wrong.
 */
const HE_WRITTEN_POOL = `
כלב חתול סוס פרה עז כבש דג ציפור יונה נמלה דבורה פרפר
עכבר ארנב שועל זאב דוב אריה נמר פיל קוף גמל צב נחש
תוכי עורב נשר כריש דולפין סרטן צפרדע חיפושית עכביש
ראש שיער עין אוזן אף פה שן לשון יד אצבע רגל ברך
לב בטן גב כתף צוואר גרון עור עצם דם מוח
לחם חלה עוגה חלב גבינה חמאה ביצה בשר עוף אורז
תפוח אגס בננה ענב תות תפוז לימון אבטיח מלון אפרסק
תמר תאנה רימון גזר בצל שום מלפפון עגבנייה חסה כרוב
מים מיץ תה קפה סוכר מלח שמן דבש ריבה שוקולד גלידה
אגוז שקד בוטן מרק סלט פיתה חומוס
בית חדר מטבח דלת חלון קיר רצפה גג מדרגה מרפסת
שולחן כיסא מיטה ארון מדף ספה מנורה נר מראה שטיח
וילון כרית שמיכה סדין תמונה שעון מפתח מנעול
כוס צלחת קערה סיר מזלג סכין כפית קנקן בקבוק דלי
מגבת סבון מברשת מסרק מספריים דבק נייר
שמש ירח כוכב ענן גשם שלג רוח ברק רעם קשת ערפל
עץ ענף עלה שורש פרח ורד דשא עשב יער גינה שיח
הר גבעה עמק מדבר חול אבן סלע ים אגם נהר נחל מפל
בריכה מעיין באר גל חוף אי אדמה בוץ שלולית טיפה
אדום כחול ירוק צהוב כתום סגול ורוד חום שחור לבן אפור
חולצה מכנסיים חצאית שמלה מעיל סוודר כובע צעיף
גרב נעל סנדל מגף כפפה חגורה כפתור כיס
ספר מחברת דף עט עיפרון מחק סרגל ילקוט לוח גיר
מורה תלמיד כיתה שיעור מבחן ציון אות מילה משפט סיפור שיר
ציור מפה מספר חשבון
מכונית אוטובוס משאית אופניים אופנוע עגלה רכבת מטוס
מסוק אונייה סירה כביש שביל גשר מנהרה תחנה גלגל
תוף חליל כינור גיטרה פסנתר חצוצרה מנגינה צליל קול
צעצוע בובה כדור חבל קובייה פאזל קלף בלון עפיפון סביבון
מתנה קופסה שקית סרט דגל מטבע ארנק שרשרת טבעת צמיד
מקל חוט מחט כתר
איש אישה ילד ילדה תינוק אבא אמא אח אחות סבא סבתא
דוד דודה חבר שכן רופא נהג שוטר כבאי חייל טבח זמר צייר
יום לילה בוקר ערב שבוע חודש שנה שעה דקה
אביב קיץ סתיו חורף חג מסיבה חופש
עיר כפר רחוב חנות שוק פארק מוזיאון מסעדה מלון
בניין קומה מעלית חצר גדר שער
פטיש מסמר בורג מברג מסור סולם מכחול ספוג
עיגול ריבוע משולש קו נקודה פס כתם צורה
ריצה קפיצה שחייה חלום שינה מנוחה חיוך צחוק דמעה
`;

/**
 * The pool the rounds actually draw from: FOLDED, because every screen that
 * uses it either cuts a letter out of a word or hands its letters back as
 * tiles, and a tile carries the base form. Blanking the ם of `שלום` and
 * offering the player a `מ` to put back is a puzzle with no answer.
 *
 * `HE_WRITTEN_POOL` above stays the readable copy, and the reveal on each
 * screen writes the word out properly through `lang.write`.
 */
const HE_FINALS: Readonly<Record<string, string>> = { "ך": "כ", "ם": "מ", "ן": "נ", "ף": "פ", "ץ": "צ" };

export const PUZZLE_WORDS_HE: readonly string[] = (() => {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const w of HE_WRITTEN_POOL.split(/\s+/)) {
    if (w.length < 2) continue;
    const folded = [...w].map((c) => HE_FINALS[c] ?? c).join("");
    if (seen.has(folded)) continue;
    seen.add(folded);
    out.push(folded);
  }
  return out;
})();

/** The Hebrew pool by length, the same shape every bonus screen asks for. */
export const PUZZLE_BY_LENGTH_HE: ReadonlyMap<number, readonly string[]> = (() => {
  const m = new Map<number, string[]>();
  for (const w of PUZZLE_WORDS_HE) (m.get(w.length) ?? m.set(w.length, []).get(w.length)!).push(w);
  return m;
})();
