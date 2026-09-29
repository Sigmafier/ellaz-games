import type { GameContent } from "../types";
import { snakesurvivorsSv } from "./sv/snakesurvivors";
import { snakesurvivorsFr } from "./fr/snakesurvivors";

/**
 * Snake Survivors. Every number below is read out of `src/games/snakesurvivors/` -
 * the snake's starting, shortest and longest length, what a bump costs and the
 * smallest loop that crushes (`body.ts`), the blink after a bump and what each
 * gem colour is worth (`logic.ts`), each stage's warden trigger, hp and crowd
 * (`crowd.ts`, `STAGE_TRIGGER`/`BOSS_HP`/`STAGE_CROWD`), the sixteen cards, their
 * tiers, caps and the snap reach (`cards.ts`), and the coin milestone
 * (`SnakeSurvivorsScene.ts`). Nothing here is simulated; it is all a constant
 * already declared in those files, so a retune either shows up here or this
 * page starts quoting a number the game no longer has.
 *
 * "A while into the run" and "later still" are the orb's and the brute's
 * `JOINS` said as words, not new figures. Round three (2026-09-28) removed the
 * stage clock, so no sentence here quotes one any more.
 *
 * ROUND FOUR (2026-09-28): a run is three STAGES now, each closed by its own
 * warden, tougher than the last (3/5/7 loops) - beating one opens the next
 * with a harder crowd, and only the third win ends the run. No sentence here
 * may say "the warden" as if there were only ever one.
 */
export const snakesurvivors: GameContent = {
  id: "snakesurvivors",

  copy: {
    he: {
      name: "נחש הישרדות",
      metaTitle: "נחש הישרדות - משחק נחש והישרדות חינם | Ellaz",
      metaDescription:
        "מנווטים נחש ניאון בין קהל של צורות זוהרות וסוגרים סביבן לולאה כדי למחוץ אותן. הזנב הוא החיים שלכם, ושלושה שומרים מחכים, כל אחד קשוח מקודמו.",

      lede: "הנחש שלכם זוהר, גולש לכל כיוון, ואף פעם לא תוקף שום דבר ישירות. מחזירים את הראש קרוב לגוף, הלולאה נסגרת מעצמה, וכל צורה שנתפסה בתוכה נמחצת. גדלים, מזמנים שומר אחרי שומר - שלושה במספר, כל אחד קשוח מקודמו - ומנצחים כשהשלישי נופל.",

      body: [
        "יש במשחק הזה מהלך אחד. מציירים עיגול עם עצמכם. מה שנמצא בפנים כשהעיגול נסגר נעלם, ומשאיר אחריו יהלומים.",

        "הזנב הוא החיים, והמספר על המסך הוא פשוט האורך שלכם. הנחש מתחיל ב-28 חוליות. צורה שמגיעה לראש נוגסת לפחות 1 מהן, ואחר כך הנחש מהבהב 1.4 שניות שבהן שום דבר לא נוגע בו - בדיוק מספיק זמן להתרחק ממה שנגס. יורדים מתחת ל-3 חוליות והריצה נגמרת. יהלומים מחזירים אורך וממלאים את הפס שמביא את הקלף הבא: יהלום כחול שווה שליש חוליה, אדום שני שלישים, וצהוב חוליה שלמה. הנחש הכי ארוך שאפשר לגדל הוא 60 חוליות, ונחש ארוך יכול לצייר לולאה רחבה יותר.",

        "הגוף הוא לא קיר. צורות חוצות אותו בחופשיות, וזה כל הטריק: קהל שרודף אחרי הראש בזמן שאתם מסתובבים חותך פינה ונשאר בתוך העיגול שאתם מציירים. אז סוגרים, ולא צריך לפגוע בזנב בדיוק: ברגע שהראש מגיע למרחק 42 יחידות מהגוף, הלולאה נסגרת, וקו מקווקו מראה איפה. אבל הגודל קובע. לולאה מוחצת רק אם היא סוגרת לפחות 4000 יחידות רבועות, בערך עיגול ברדיוס 36, אז סיבוב צפוף במקום לא מוחץ כלום, והצורות שמתיישבות בתוכו מגיעות בסוף לראש. בגלל זה האורך הוא יותר מחיים: נחש ארוך יכול להרשות לעצמו לולאה רחבה, נחש קצר בקושי מצליח לסגור אחת, וכל יהלום מחזיר קצת מהטווח הזה. סגירה אחת היא מחיצה אחת, וכל צורה בפנים חוטפת ממנה מכה אחת.",

        "שלוש צורות הולכות לעברכם, ואלה אותן שלוש שממלאות את הישרדות ניאון. הרץ הוא עטלף קטן ומהיר. הכדור הוא רפש שנסחף פנימה אחרי שהריצה כבר נמשכת זמן מה. הבריון הוא סרטן איטי וקשוח שמופיע עוד יותר מאוחר, ולולאה אחת לא מספיקה לו - הוא צריך שתיים. אין שעון. הריצה מחולקת לשלושה שלבים, וכל שלב נסגר בשומר משלו. הראשון מגיע כשאתם באורך 50 חוליות או אחרי 10 צורות מחוצות, מה שקודם, ומד בתחתית המסך מראה כמה נשאר. זה עטלף ענק שנעצר וזוהר לפני שהוא מסתער ישר עליכם, וזה הרגע לסטות הצידה - מוחצים אותו בשלוש לולאות, מכה אחת בכל לולאה.",

        "מוחצים את השומר הראשון וזה פותח את השלב הבא: הקהל גדל - יותר צורות, מגיעות מהר יותר, והבריון מצטרף מוקדם יותר - וכל צורה צריכה עוד לולאה כדי להיחשב מחוצה. השומר השני מחכה אחרי 240 צורות מחוצות בסך הכול ברמה רגילה, קשוח מהראשון; השלישי אחרי 760, קשוח עוד יותר ומסתער עליכם לעיתים קרובות יותר. מוחצים את שלושתם והריצה שלכם.",

        "שלוש הרמות משנות את הקהל בנוסף למה שכל שלב כבר מוסיף: כמה מהר מגיעות צורות, כמה מהר הן הולכות וכמה מהן על המסך בבת אחת. הנחש זהה בשלושתן. זה המשחק השני במשפחת הנחש, והפעם הנחש כבר לא זוחל על רשת.",
      ],

      howToPlay: [
        { title: "לנווט", body: "בטלפון שמים אגודל איפה שרוצים על הזירה וגוררים, ומקל מופיע מתחת לאצבע. במחשב מנווטים בחצים או ב-WASD. הנחש לא עוצר אף פעם, והוא מסתובב בעקומה חלקה ולא בזוויות ישרות." },
        { title: "לסגור לולאה", body: "מחזירים את הראש קרוב לגוף שלכם והלולאה נסגרת מעצמה; קו מקווקו מראה איפה. כל צורה בתוך הלולאה שציירתם חוטפת מחיצה, והלולאה צריכה להיות רחבה: סיבוב צפוף במקום לא נחשב." },
        { title: "לשמור על הראש", body: "רק הראש נפגע. צורה שמגיעה אליו עולה חוליה אחת, ואחר כך יש רגע קצר של הבהוב שבו אפשר לברוח." },
        { title: "לגדול בחזרה", body: "צורות שנמחצו משאירות יהלומים, ועוד כמה מפוזרים על הרצפה, כך שאפשר לגדול עוד לפני הלולאה הראשונה. גולשים מעליהם כדי להתארך ולמלא את פס הדרגה." },
        { title: "לבחור קלף", body: "כשהפס מתמלא המשחק עוצר ומציע שלושה קלפים. קלף שכבר יש לכם מראה את הדרגה הבאה שלו. בוחרים אחד, והקהל ממשיך לזוז." },
      ],

      tips: [
        { title: "מקיפים קהל, לא צורה", body: "לולאה סביב עטלף אחד מבזבזת סיבוב שלם. נותנים לכמה לרדוף אחריכם ואז מסתובבים רחב, כך שהם נופלים לתוך העיגול, כי סגירה פוגעת בכל מה שבפנים." },
        { title: "הסרטן חוזר", body: "בריון שורד את המחיצה הראשונה. משאירים אותו בתוך אותה עקומה וסוגרים שוב, במקום לרדוף אחרי קהל חדש עם סרטן חצי מובס מאחוריכם." },
        { title: "לא מסתובבים במקום", body: "הסיבוב הכי צפוף שהנחש מסוגל לו קטן מדי כדי למחוץ משהו. מסתובבים שם, והקהל מתיישב בתוך העיגול ממש ליד הראש. שומרים על לולאות רחבות וממשיכים לזוז." },
        { title: "בוחרים נשק לפי מה שכואב", body: "אם רוב האורך שאיבדתם הלך על צורות שפגשו את הראש, ניבים הופכים את המפגשים האלה לנשיכות. אם הרבה צורות חוצות לכם את הגוף, זנב קוצני הוא נשק ראשון טוב יותר." },
      ],

      teaches: [
        { title: "לתכנן מסלול", body: "לולאה היא דרך שבוחרים לפני שנוסעים בה. מסתכלים לאן הקהל יגיע, ולא איפה הוא עומד עכשיו." },
        { title: "בפנים ובחוץ", body: "לסגור צורה סביב צורות אחרות זו תחושה ראשונה, פיזית מאוד, של פנים וחוץ ושל שטח." },
        { title: "להחליט כשהשעון עוצר", body: "הקלפים עוצרים את המשחק. יש זמן לחשוב, והבחירה מעצבת את שאר הריצה." },
      ],

      ages: [
        { title: "מגיל 5", body: "ילד צעיר יכול לנווט את הנחש ברגוע וללמוד לסגור לולאה רחבה, ושום דבר לא מעניש אותו חוץ מזה שהריצה נגמרת." },
        { title: "8 עד 12", body: "רגיל, שבו הסרטן צריך שתי לולאות והבחירה בין ניבים לזנב קוצני כבר באמת משנה משהו." },
        { title: "נוער ומבוגרים", body: "פראי. הקהל שנבנה בזמן שאתם גדלים לקראת השומר הופך את המשחק לקריאה של כל המסך בבת אחת." },
      ],

      accessibility:
        "צריך לנווט כדי לשחק: גרירה בטלפון או מקשים במחשב, לאורך כל השלב, אז את המשחק הזה אי אפשר להשלים בנגיעות בלבד, ועדיף שנגיד את זה כאן. מה שלא צריך זה לכוון או ללחוץ מהר. קלפי הדרגה הם כפתורים גדולים, אף אחד מהם לא מושבת אף פעם, וריצה שנגמרת פשוט נגמרת, עם ריצה חדשה במרחק נגיעה אחת.",

      together: [
        { title: "אחד מנווט, אחד קורא", body: "אחד מחזיק את הטלפון, השני מסתכל על הקהל ואומר מתי להסתובב. מתחלפים אחרי כל ריצה." },
        { title: "בוחרים קלף ביחד", body: "כשהמשחק עוצר, מסכימים בקול על קלף לפני שמישהו נוגע. הוויכוח על ניבים מול זנב קוצני הוא חצי מהכיף." },
        { title: "מתחרים על אותה רמה", body: "משחקים את אותה רמה בתורות ומשווים כמה צורות נמחצו. השיא נשמר לכל רמה בנפרד, אז רגוע ופראי אף פעם לא מתחרים זה בזה." },
      ],

      faq: [
        { q: "נחש הישרדות חינמי?", a: "כן, ואין שום דבר להירשם אליו או לקנות." },
        { q: "איך סוגרים לולאה?", a: "מנווטים את הראש בחזרה עד 42 יחידות מהגוף, והלולאה נסגרת מעצמה. היא צריכה להקיף לפחות 4000 יחידות רבועות, כך שסיבוב צפוף במקום לא נחשב, וכל סגירה פוגעת פעם אחת בכל צורה שבפנים." },
        { q: "מה קורה כשצורה נוגעת בי?", a: "אם היא נוגעת בראש, מאבדים לפחות חוליה אחת ומקבלים 1.4 שניות של הבהוב שבו שום דבר לא פוגע. אם היא נוגעת בגוף, לא קורה כלום: צורות חוצות את הגוף בחופשיות, וככה קהל נכנס לתוך הלולאה." },
        { q: "כמה זמן נמשכת ריצה?", a: "אין שעון. הריצה מחולקת לשלושה שלבים: השומר הראשון מגיע ב-50 חוליות או 10 צורות מחוצות, מה שקודם. השני מחכה אחרי 240 צורות מחוצות בסך הכול ברמה רגילה והוא קשוח יותר, והשלישי אחרי 760 וקשוח עוד יותר. מוחצים את שלושתם והריצה נוצחה." },
        { q: "מה עושים הקלפים?", a: "שישה עשר: תשעה אפורים, ארבעה כחולים נדירים ושלושה זהובים נדירים עוד יותר. שלושה מהאפורים הם נשקים: ניבים נושכים צורה שנוגעת בראש, זנב קוצני פוגע במי שנוגע בגוף, ויריקה יורה בצורה הקרובה כל 2 שניות, אבל אף פעם לא בשומר. מגנט מושך יהלומים, זריז מוסיף 10% מהירות בכל דרגה, צמיחה מגדלת חוליה כל 9 שניות, גל הדף הודף את הצורות שממש מחוץ ללולאה, לאסו נותן ללולאה להיסגר מרחוק יותר, ומגן סופג מכה אחת בחינם ואז נטען מחדש. הכחולים והזהובים מוסיפים שרשרת מחיצה, יהלומים כפולים, שובל כפור, גוף ארוך, ראש כפול, חור שחור ונובה." },
        { q: "איך נספר הניקוד?", a: "בצורות שנמחצו. השיא נשמר על המכשיר, בנפרד לכל רמה, וכל 100 צורות שנמחצו מביאות מטבעות." },
        { q: "מה הקשר לנחש ולהישרדות ניאון?", a: "זה המשחק השני במשפחת הנחש: אותו נחש ניאון כמו בנחש הקלאסי, מול שלוש הצורות שבאות מהישרדות ניאון." },
      ],

      keywords: ["משחק נחש", "משחק הישרדות", "נחש חינם", "משחק ארקייד בדפדפן", "משחק לולאות"],
    },

    en: {
      name: "Snake Survivors",
      metaTitle: "Snake Survivors - Free Snake Survival Game | Ellaz",
      metaDescription:
        "Steer a neon snake through a glowing crowd and close loops to crush them. Your tail is your health, and three wardens wait, each tougher than the last.",

      lede: "You steer a glowing snake that glides in any direction, and you never attack anything head on. Bring your head back round close to your own body, the loop snaps shut, and every shape trapped inside it is crushed. Grow, bring out one warden after another - three in all, each tougher than the last - and win when the third one falls.",

      body: [
        "There is one move. Draw a circle with yourself. Whatever is inside when the circle closes is gone, and it leaves gems behind.",

        "Your tail is your health, and the length counter on the screen is simply how long you are. The snake starts at 28 segments. A shape that reaches your head bites off at least 1 of them, and then you blink for 1.4 seconds while nothing can touch you, just long enough to get clear of it. Drop below 3 segments and the run is over. Gems put the length back and fill the bar that brings the next card. A blue gem is worth a third of a segment, a red one two thirds and a yellow one a whole segment. The longest you can grow is 60 segments, and a longer snake can draw a bigger loop.",

        "Your body is not a wall. Shapes cross it freely, and that is the trick: a crowd chasing your head while you circle cuts the corner and ends up inside the circle you are drawing. Close it then.",

        "You do not have to touch your own tail exactly. Once your head comes within 42 units of your body, the loop snaps shut, and a dashed line shows where as you come round. Size still matters. A loop only crushes if it encloses at least 4,000 square units, roughly a circle with a radius of 36, so spinning tight in one spot crushes nothing, and the shapes that settle inside that spin reach your head soon enough. That is why length is more than health: a long snake can afford a wide loop, a short one struggles to draw one at all, and every gem gives some of that reach back. One closing is one crush. Every shape inside takes a single hit from it, however many there are.",

        "Three kinds of shape walk at you, the same three that fill Neon Survival: the runner is a small, fast bat, the orb a slime that drifts in later, and the brute a slow, tough crab that needs two loops, not one. There is no clock. A run is three stages, each closed by a tougher warden - the first at 50 segments or 10 crushed, the second at 240 in total, the third at 760. Each is a giant bat that stops and glows before it lunges: swerve then, three loops down. Beat all three and the run is yours.",

        "Calm, Normal and Wild change the crowd on top of what each stage already raises - how often shapes arrive, how fast they walk and how many are on screen at once. The snake is identical on all three. Nothing about it gets weaker.",
      ],

      howToPlay: [
        { title: "Steer", body: "On a phone, put your thumb anywhere on the arena and drag; a stick appears under it and the snake follows. On a PC, the arrow keys or WASD steer. The snake never stops, and it turns in smooth curves rather than right angles." },
        { title: "Close a loop", body: "Bring your head back round close to your own body and the loop snaps shut; a dashed line shows where it will close. Every shape inside takes a crush, and the loop has to be a wide one: a tight spin in place does not count." },
        { title: "Guard the head", body: "Only your head can be hurt. A shape reaching it costs 1 segment, and the snake blinks for a moment while you get away." },
        { title: "Grow back", body: "Crushed shapes drop gems, and a few more lie on the floor, so you can grow before your first loop. Glide over them to grow longer and fill the level bar." },
        { title: "Pick a card", body: "When the bar is full the game stops and offers three cards. A card you own shows its next level. Tap one and the crowd starts moving again." },
      ],

      tips: [
        { title: "Circle the crowd, not the shape", body: "A loop around one runner wastes a whole lap. Let a few chase you, then swing wide so they fall inside the circle, because a closing hits everything in it." },
        { title: "The crab comes round twice", body: "A brute survives its first crush. Keep it inside the same curve and close again, rather than chasing a fresh crowd with a half-beaten crab behind you." },
        { title: "Never spin in place", body: "The tightest turn the snake can make is too small to crush anything. Spin there and the crowd settles inside the circle, right next to your head. Keep the loops wide and keep moving." },
        { title: "Pick the weapon for what hurts", body: "If most of your lost length comes from shapes meeting your head, Fangs turns those meetings into bites. If lots of shapes are crossing your body, Spiked tail is the better first weapon." },
      ],

      teaches: [
        { title: "Planning a route", body: "A loop is a path you choose before you travel it. The habit it builds is looking at where the crowd will be, not where it is now." },
        { title: "Inside and outside", body: "Closing a shape around other shapes is an early and very physical feel for inside, outside and area." },
        { title: "Deciding while the clock is stopped", body: "The cards pause the game. There is time to think, and the choice shapes the rest of the run." },
      ],

      ages: [
        { title: "From 5", body: "A young child can steer the snake on Calm and learn to swing a wide loop, and nothing punishes them beyond the run ending." },
        { title: "8 to 12", body: "Normal, where the crab needs two loops and choosing between Fangs and Spiked tail starts to matter." },
        { title: "Teenagers and adults", body: "Wild. The crowd that builds while you grow towards the warden turns the game into reading the whole screen at once." },
      ],

      accessibility:
        "This one needs steering: a drag on a phone or the keys on a PC, held for the length of a stage, so it cannot be finished with taps alone, and we would rather say so here than let you find out. What it does not need is aiming or fast tapping. The level-up cards are big buttons, none of them is ever disabled, and a run that ends simply ends, with a new one a single tap away.",

      together: [
        { title: "One steers, one calls it", body: "One of you holds the phone, the other watches the crowd and says when to swing round. Swap after every run." },
        { title: "Choose the card together", body: "When the game stops, agree on a card out loud before anyone touches it. Arguing Fangs against Spiked tail is half the fun." },
        { title: "Race on one level", body: "Take turns on the same level and compare how many shapes you crushed. The best is kept per level, so Calm and Wild never compete." },
      ],

      faq: [
        { q: "Is Snake Survivors free?", a: "Yes, and there is nothing to sign up for or buy." },
        { q: "How do I close a loop?", a: "Steer your head back round to within 42 units of your body and the loop snaps shut. It has to enclose at least 4,000 square units, so a tight spin in place does not count, and each closing hits every shape inside it once." },
        { q: "What happens when a shape touches me?", a: "If it touches your head, you lose at least 1 segment and blink for 1.4 seconds while nothing can hurt you. If it touches your body, nothing happens: shapes cross the body freely, which is how a crowd ends up inside your loop." },
        { q: "How long is a run?", a: "A run is three stages: the first warden at 50 segments or 10 crushed, the second at 240 in total, the third at 760 on Normal, each tougher than the last. Beat all three and the run is won." },
        { q: "What do the cards do?", a: "Sixteen: nine grey, four rarer blue, three rarest gold. Three grey ones are weapons: Fangs bites a shape that touches your head, Spiked tail hurts shapes that touch your body, and Spit shoots the nearest shape every 2 seconds, though never the warden. Magnet pulls gems in, Swift adds 10% speed per level, Regrow grows a segment back every 9 seconds, Shockwave throws back the shapes just outside a loop, Lasso lets a loop snap shut from further away, and Shield takes one bump for free, then recharges." },
        { q: "How is the score counted?", a: "In shapes crushed. Your best is kept on your device, separately for each level, and every 100 crushed earns coins." },
        { q: "How is it related to Snake and Neon Survival?", a: "It is the Snake family's second game: the same neon snake as classic Snake, up against the three shapes from Neon Survival." },
      ],

      keywords: ["snake game", "survival game", "free snake game", "browser arcade game", "loop game"],
    },

    es: {
      name: "Serpiente superviviente",
      metaTitle: "Serpiente superviviente - juego de serpiente gratis | Ellaz",
      metaDescription:
        "Guía una serpiente de neón y cierra un lazo para aplastar las formas. Tu cola es tu vida, y te esperan tres guardianes, cada uno más duro que el anterior.",

      lede: "Tu serpiente brilla, se desliza en cualquier dirección y nunca ataca nada de frente. Vuelve con la cabeza cerca de tu propio cuerpo, el lazo se cierra solo y todo lo que quede dentro queda aplastado. Crece, haz salir a un guardián tras otro - tres en total, cada uno más duro que el anterior - y gana cuando caiga el tercero.",

      body: [
        "Aquí nadie apunta. Tu única arma es el dibujo que haces con tu propio cuerpo, y el único golpe que existe es cerrar el lazo.",

        "La cola es la vida, y el número de la pantalla es simplemente lo larga que eres. La serpiente empieza con 28 segmentos. Una forma que llega a la cabeza se lleva al menos 1, y después parpadeas durante 1,4 segundos en los que nada puede tocarte, justo para salir de allí. Por debajo de 3 segmentos, la partida termina. Las gemas devuelven longitud y llenan la barra que trae la siguiente carta: una azul vale un tercio de segmento, una roja dos tercios y una amarilla un segmento entero. Como mucho llegarás a 60 segmentos, y cuanto más larga, más grande el lazo que puedes dibujar.",

        "Tu cuerpo no es una pared. Las formas lo cruzan sin problema, y ahí está el truco: un grupo que persigue tu cabeza mientras giras acorta por dentro y acaba metido en el círculo que estás dibujando. Entonces cierras, sin tocarte la cola con precisión: en cuanto la cabeza pasa a 42 unidades de tu cuerpo, el lazo se cierra, y una línea discontinua te enseña dónde. Pero el tamaño manda. Un lazo solo aplasta si encierra al menos 4000 unidades cuadradas, más o menos un círculo de radio 36, así que dar vueltas cerradas en el sitio no aplasta nada, y lo que se acomoda dentro de ese giro acaba alcanzándote la cabeza. Por eso la longitud es más que vida: una serpiente larga puede permitirse un lazo amplio, una corta apenas consigue cerrar uno, y cada gema te devuelve parte de ese alcance. Cada cierre es un golpe para todo lo que haya dentro.",

        "Tres formas vienen a por ti, las mismas de Supervivencia Neón: el corredor, un murciélago pequeño y rápido; el orbe, un limo que llega tras un rato; el bruto, un cangrejo lento y duro que necesita dos lazos, no uno.",

        "No hay reloj. Tres etapas, cada una cerrada por un guardián más duro: el primero a los 50 segmentos o 10 formas, el segundo a las 240 en total, el tercero a las 760. Cada uno es un murciélago gigante que se para y brilla antes de lanzarse: esquiva, tres lazos y cae. Vence a los tres y ganas. Los niveles cambian la multitud: cuánto tardan las formas, lo rápido que andan, cuántas caben en pantalla.",

        "Es el segundo juego de la familia de la serpiente. Aquí ya no hay cuadrícula.",
      ],

      howToPlay: [
        { title: "Guiar", body: "En el móvil, pon el pulgar en cualquier punto de la arena y arrastra; aparece un mando bajo el dedo y la serpiente lo sigue. En el ordenador, se guía con las flechas o con WASD. La serpiente nunca se para y gira en curvas suaves, no en ángulos rectos." },
        { title: "Cerrar el lazo", body: "Vuelve con la cabeza cerca de tu propio cuerpo y el lazo se cierra solo; una línea discontinua te enseña dónde. Todas las formas que queden dentro del lazo reciben un aplastamiento, y tiene que ser un lazo amplio: girar cerrado en el sitio no cuenta." },
        { title: "Cuidar la cabeza", body: "Solo la cabeza recibe daño. Una forma que llega hasta ella cuesta 1 segmento, y luego la serpiente parpadea un momento para que puedas escapar." },
        { title: "Volver a crecer", body: "Las formas aplastadas sueltan gemas, y hay algunas más por el suelo, así que puedes crecer antes de tu primer lazo. Pasa por encima para alargarte y llenar la barra de nivel." },
        { title: "Elegir carta", body: "Cuando la barra se llena, el juego se para y ofrece tres cartas. Una carta que ya tienes muestra su siguiente nivel. Toca una y la multitud vuelve a moverse." },
      ],

      tips: [
        { title: "Rodea al grupo, no a una forma", body: "Un lazo alrededor de un solo murciélago es una vuelta tirada. Deja que unos cuantos te persigan y luego abre el giro para que caigan dentro del círculo, porque cada cierre golpea todo lo que hay dentro." },
        { title: "El cangrejo pide segunda vuelta", body: "El bruto sobrevive al primer aplastamiento. Déjalo dentro de la misma curva y vuelve a cerrar, en vez de salir detrás de otro grupo con un cangrejo a medias a la espalda." },
        { title: "Nunca gires en el sitio", body: "El giro más cerrado que puede hacer la serpiente es demasiado pequeño para aplastar nada. Si te quedas dando vueltas ahí, la multitud se acomoda dentro del círculo, justo al lado de tu cabeza. Lazos amplios, y siempre en movimiento." },
        { title: "Elige el arma según lo que duela", body: "Si casi toda la cola la pierdes con formas que te llegan a la cabeza, Colmillos convierte esos choques en mordiscos. Si muchas formas te cruzan el cuerpo, la Cola con púas es mejor primera arma." },
      ],

      teaches: [
        { title: "Planear un recorrido", body: "Un lazo es un camino que eliges antes de recorrerlo. Enseña a mirar dónde va a estar la multitud, no dónde está ahora." },
        { title: "Dentro y fuera", body: "Cerrar una figura alrededor de otras es una primera idea, muy física, de lo que está dentro, lo que está fuera y el área." },
        { title: "Decidir con el reloj parado", body: "Las cartas detienen el juego. Hay tiempo para pensar, y la elección marca el resto de la partida." },
      ],

      ages: [
        { title: "A partir de 5 años", body: "Un niño pequeño puede guiar la serpiente en Tranquilo e ir aprendiendo a cerrar un lazo amplio, y nada le castiga más allá de que la partida se acabe." },
        { title: "De 8 a 12", body: "Normal, donde el cangrejo necesita dos lazos y elegir entre Colmillos y Cola con púas empieza a notarse." },
        { title: "Adolescentes y adultos", body: "Salvaje. La multitud que se acumula mientras creces hacia el guardián convierte el juego en leer la pantalla entera a la vez." },
      ],

      accessibility:
        "Hace falta guiar la serpiente: arrastrar en el móvil o usar las teclas en el ordenador, durante toda la fase, así que no se puede terminar solo con toques, y preferimos decirlo aquí. Lo que no hace falta es apuntar ni tocar deprisa. Las cartas de nivel son botones grandes, ninguna está nunca desactivada, y una partida que termina simplemente termina, con otra a un solo toque.",

      together: [
        { title: "Uno guía, otro canta", body: "Uno sujeta el móvil y el otro mira la multitud y avisa de cuándo girar. Cambiad después de cada partida." },
        { title: "Elegid la carta juntos", body: "Cuando el juego se para, poneos de acuerdo en voz alta antes de tocar nada. Discutir Colmillos contra Cola con púas es la mitad de la gracia." },
        { title: "Un nivel, dos jugadores", body: "Jugad por turnos en el mismo nivel y comparad cuántas formas habéis aplastado. El récord se guarda por nivel, así que Tranquilo y Salvaje nunca compiten." },
      ],

      faq: [
        { q: "¿Serpiente superviviente es gratis?", a: "Sí, y no hay nada en lo que registrarse ni nada que comprar." },
        { q: "¿Cómo se cierra un lazo?", a: "Guía la cabeza de vuelta hasta 42 unidades de tu cuerpo y el lazo se cierra solo. Tiene que encerrar al menos 4000 unidades cuadradas, así que girar cerrado en el sitio no cuenta, y cada cierre golpea una vez a cada forma que haya dentro." },
        { q: "¿Qué pasa si una forma me toca?", a: "Si te toca la cabeza, pierdes al menos 1 segmento y parpadeas 1,4 segundos sin que nada te dañe. Si te toca el cuerpo, no pasa nada: las formas cruzan el cuerpo libremente, y así es como una multitud acaba dentro de tu lazo." },
        { q: "¿Cuánto dura una partida?", a: "Tres etapas: el primer guardián a los 50 segmentos o 10 formas, el segundo a las 240 en total y el tercero a las 760 en Normal, cada uno más duro. Vence a los tres y ganas." },
        { q: "¿Qué hacen las cartas?", a: "Dieciséis, siete de ellas raras. Tres son armas: Colmillos muerde a la forma que te toca la cabeza, la Cola con púas hiere a lo que te toca el cuerpo y Escupir dispara a la forma más cercana cada 2 segundos, aunque nunca al guardián. Imán atrae las gemas, Veloz suma un 10% de velocidad por nivel, Regenerar hace crecer un segmento cada 9 segundos, Onda empuja a las formas que quedan justo fuera del lazo, Lazo deja cerrar el lazo desde más lejos, y Escudo para un golpe gratis y luego se recarga." },
        { q: "¿Cómo se cuenta la puntuación?", a: "En formas aplastadas. El récord se guarda en tu aparato, por separado para cada nivel, y cada 100 aplastadas ganas monedas." },
        { q: "¿Qué tiene que ver con Snake y Supervivencia Neón?", a: "Es el segundo juego de la familia: la misma serpiente de neón que el Snake clásico, contra las tres formas de Supervivencia Neón." },
      ],

      keywords: ["juego de serpiente", "juego de supervivencia", "snake gratis", "juego arcade de navegador", "juego de lazos"],
    },

    fr: snakesurvivorsFr,

    sv: snakesurvivorsSv,
  },

  provenance: [
    { claim: "The snake starts at 28 segments", source: "src/games/snakesurvivors/body.ts" },
    {
      claim: "A loop only crushes if it encloses at least 4,000 square units, roughly a circle with a radius of 36",
      source: "src/games/snakesurvivors/body.ts",
    },
    { claim: "A shape that reaches your head bites off at least 1 of them (more in the last stage on Normal and Wild)", source: "src/games/snakesurvivors/crowd.ts" },
    { claim: "Once your head comes within 42 units of your body the loop snaps shut", source: "src/games/snakesurvivors/cards.ts" },
    { claim: "Drop below 3 segments and the run is over", source: "src/games/snakesurvivors/body.ts" },
    { claim: "The longest you can grow is 60 segments", source: "src/games/snakesurvivors/body.ts" },
    { claim: "you blink for 1.4 seconds while nothing can touch you", source: "src/games/snakesurvivors/logic.ts" },
    { claim: "A blue gem is worth a third of a segment, a red one two thirds and a yellow one a whole segment", source: "src/games/snakesurvivors/logic.ts" },
    {
      claim: "the first warden arrives when you are 50 segments long or have crushed 10 shapes, whichever comes first",
      source: "src/games/snakesurvivors/crowd.ts",
    },
    {
      claim: "the second warden comes at 240 crushed in total and the third at 760 on Normal; each is tougher than the last",
      source: "src/games/snakesurvivors/crowd.ts",
    },
    {
      claim: "the brute takes two loops, the first warden three; the orb joins after the runner, the brute after the orb",
      source: "src/games/snakesurvivors/crowd.ts",
    },
    {
      claim: "sixteen cards in three tiers: nine grey, Fangs, Spiked tail, Magnet, Swift and Spit up to 3 levels, Regrow, Shockwave, Lasso and Shield up to 2; four blue rare, Chain Crush, Double Gems, Frost Trail, Long Body; three gold epic, once a run",
      source: "src/games/snakesurvivors/cards.ts",
    },
    { claim: "Spit shoots the nearest shape every 2 seconds, never the warden", source: "src/games/snakesurvivors/cards.ts" },
    { claim: "Lasso lets a loop snap shut from 12 units further away per level", source: "src/games/snakesurvivors/cards.ts" },
    { claim: "Shield takes one bump for free and then recharges, in 12 seconds or 7 at its second level", source: "src/games/snakesurvivors/cards.ts" },
    { claim: "Swift adds 10% speed and a tighter turn per level", source: "src/games/snakesurvivors/cards.ts" },
    { claim: "Regrow grows a segment back on its own every 9 seconds", source: "src/games/snakesurvivors/cards.ts" },
    { claim: "every 100 crushed earns coins", source: "src/games/snakesurvivors/SnakeSurvivorsScene.ts" },
    { claim: "Chain Crush zaps the two nearest shapes outside a loop; Long Body lets you grow 20 segments longer; Nova clears the screen on every fifth crush", source: "src/games/snakesurvivors/cards.ts" },
  ],
};
