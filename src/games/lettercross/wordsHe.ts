/**
 * Lettercross - the HEBREW validation dictionary. PURE DATA: no DOM, no React.
 *
 * WHY THIS FILE IS AUTHORED AND `words.ts` IS GENERATED.
 *
 * The English list is ENABLE1, which Alan Beale and M. Leo Cooper formally
 * released into the public domain, so a script fetches it and filters it.
 * Hebrew has no such list. Every free Hebrew dictionary of any size traces back
 * to Hspell, whose licence covers "not only the programs in the distribution,
 * but also the dictionary files and the generated word lists" and is AGPLv3 -
 * so shipping one inside this bundle means relicensing the whole platform away
 * from MIT, which is a decision about ellaz rather than about a word game. The
 * only other thing on offer is a web-frequency list under CC BY-SA, and a crawl
 * is not a dictionary: it carries brand names, foreign words and other people's
 * typos, and a game that accepts `גוגל` is not being lenient, it is being wrong.
 *
 * The operator was shown all three and chose this one on 2026-08-27.
 *
 * THE COST, WHICH IS REAL AND IS THE PLAYER'S: this list is under two thousand
 * words and Hebrew is not. A perfectly ordinary word that nobody wrote down
 * here is REFUSED, and the refusal looks to the player exactly like being told
 * their word is not a word. That is the price of a clean licence and it is
 * paid at the board, not in a file. It is why the list leans hard on the
 * everyday - the words a child and a parent actually reach for - rather than on
 * breadth, and why adding to it is a normal, expected edit rather than a repair.
 *
 * IT IS ALSO SAFE BY CONSTRUCTION, which the English list is not. ENABLE
 * contained 49 of 49 slurs probed and needed a blocklist over it; a blocklist
 * is not provably complete and NOTICE.md says so. Nothing arrives here by
 * surviving a filter - every entry was typed on purpose - so the affirmative
 * discipline `puzzleWords.ts` had to bolt onto the English side is simply how
 * this file is built.
 *
 * THREE RULES, pinned by `plays-in-hebrew.test.ts`:
 *
 * 1. NO NIKUD, and no word that needs it to be read. Unpointed Hebrew is
 *    ambiguous by design and a word a child cannot sound out from its letters
 *    is a word they cannot build.
 * 2. WRITTEN THE WAY A PERSON WRITES IT, final letters and all - `שלום`, not
 *    `שלומ`. `lang.ts` folds before it compares, so this file stays readable by
 *    somebody who reads Hebrew and can actually check it. A list stored
 *    pre-folded is a list nobody can proofread, which for a word game is the
 *    whole ballgame.
 * 3. GROUPED AND LABELLED, so it can be audited by reading. A flat array of
 *    three thousand strings is not something anyone checks.
 *
 * NO PROPER NOUNS, no brands, no places. A name is not a word, and a game that
 * scores one has started scoring trivia.
 */

/* Two letters are structural in a crossword game - without them almost no
   perpendicular play is legal and the board locks up after a few turns. Same
   argument as the English side's authored TWO_LETTER, and the same answer:
   every one of these is a word a Hebrew-speaking child would recognise. */
const TWO = `
אב אח אם אף אז אי אך אל אן אש בא בו בן בת גב גג גן גר דב דג דל דם דף
הר הן זה זו חג חד חם חן חץ חק טל יד יש כד כן כף כי לא לב לו לי מה מי
מר נר נס סל עב עז עט עץ עם ער פה פן צל צר קו קר קם רב רד רע רק שם שן
שר שש תא תו תל
`;

/* Animals - the row a child names first, and the one every bonus screen leans
   on because a four-year-old can picture every entry. */
const ANIMALS = `
כלב כלבה כלבים חתול חתולה חתולים סוס סוסה סוסים פרה פרות שור שורים
עז עזים כבש כבשים כבשה תרנגול תרנגולת אווז ברווז ברווזים תרנגולים
דג דגים דגה צפרדע צפרדעים נמלה נמלים דבורה דבורים זבוב זבובים
פרפר פרפרים חיפושית עכביש עכבישים תולעת תולעים חילזון שבלול
עכבר עכברים חולדה ארנב ארנבת ארנבים שועל שועלים זאב זאבים
דוב דובים אריה אריות נמר נמרים ברדלס פיל פילים
קוף קופים גמל גמלים זברה זברות
צבי איל צבים צב נחש נחשים לטאה לטאות תנין תנינים
ציפור ציפורים יונה יונים עורב עורבים ינשוף נשר נשרים
תוכי תוכים אנקור דרור חסידה טווס פינגווין
כריש כרישים לוויתן דולפין דולפינים תמנון סרטן סרטנים
צדפה כוכב סוסון דיונון כלב חזיר חזירים
עדר להקה קן ביצה ביצים נוצה נוצות זנב זנבות כנף כנפיים
טופר פרסה קרן קרניים רעמה שפם
`;

/* The body. Every part a child points to, plus what it does. */
const BODY = `
ראש ראשים שיער שערות פנים מצח לחי לחיים עין עיניים אף אוזן אוזניים
פה שפה שפתיים לשון שן שיניים סנטר צוואר גרון כתף כתפיים
יד ידיים אצבע אצבעות ציפורן ציפורניים כף מרפק אמה
חזה בטן גב מותן ירך רגל רגליים ברך ברכיים קרסול עקב
לב ריאה ריאות קיבה מוח עצם עצמות עור דם שריר שרירים
דמעה דמעות חיוך צחוק נשימה דופק גובה משקל
`;

/* Food and drink. */
const FOOD = `
לחם לחמים פת חלה עוגה עוגות עוגייה עוגיות ביסקוויט
חלב גבינה גבינות חמאה יוגורט שמנת ביצה ביצים
בשר עוף דג נקניק המבורגר שניצל קציצה קציצות
אורז פסטה איטריות קוסקוס בורגול קמח שמרים
תפוח תפוחים אגס אגסים בננה בננות ענב ענבים תות תותים
תפוז תפוזים לימון לימונים אשכולית מנדרינה קלמנטינה
אבטיח מלון אפרסק שזיף משמש דובדבן דובדבנים תמר תמרים
תאנה תאנים רימון רימונים אבוקדו קיווי מנגו אננס
עגבנייה עגבניות מלפפון מלפפונים גזר גזרים בצל בצלים
שום תפוד תפודים בטטה חציל קישוא פלפל פלפלים כרוב
חסה חסות סלט סלטים כרובית ברוקולי תירס אפונה שעועית עדשים
חומוס טחינה פלאפל פיתה לאפה סביח שקשוקה
מים מיץ תה קפה שוקו לימונדה סודה יין בירה
סוכר מלח פלפל שמן חומץ דבש ריבה חמאה
שוקולד ממתק ממתקים סוכרייה גלידה גלידות ארטיק
אגוז אגוזים שקד שקדים בוטן בוטנים גרעין גרעינים צימוק צימוקים
ארוחה ארוחות בוקר צהריים ערב כריך כריכים מרק מרקים
`;

/* Around the house. */
const HOUSE = `
בית בתים דירה דירות חדר חדרים מטבח סלון מרפסת מקלחת שירותים
מסדרון מרתף עלייה גג גגות קיר קירות רצפה תקרה
דלת דלתות חלון חלונות מפתח מפתחות מנעול פעמון
שולחן שולחנות כיסא כיסאות ספה מיטה מיטות ארון ארונות מדף מדפים
שידה כוננית מזרן כרית כריות שמיכה שמיכות סדין סדינים
מנורה מנורות נורה נר נרות מראה מראות שטיח שטיחים וילון וילונות
תמונה תמונות אגרטל צמח עציץ עציצים
כוס כוסות צלחת צלחות קערה קערות סיר סירים מחבת
כף כפית מזלג מזלגות סכין סכינים קנקן בקבוק בקבוקים
מגבת מגבות סבון מברשת משחה מסרק שמפו
מקרר תנור כיריים מדיח מכונה מיקרוגל קומקום מאוורר מזגן
טלוויזיה מחשב טלפון שעון שעונים רדיו מצלמה
ארגז קופסה קופסאות סל סלים שק שקים תיק תיקים
מטאטא יעה דלי סמרטוט אשפה פח
`;

/* Outside - weather, land, sky, growing things. */
const OUTSIDE = `
שמש ירח כוכב כוכבים שמיים ענן עננים גשם שלג ברד טל ערפל
רוח סערה ברק רעם קשת שמש חום קור חושך אור אורות
עץ עצים ענף ענפים עלה עלים שורש שורשים גזע פרח פרחים
ורד ורדים חבצלת נרקיס כלנית רקפת חמנייה סביון
דשא עשב שיח שיחים יער יערות חורש גינה גן גנים
הר הרים גבעה עמק בקעה מדבר חול אבן אבנים סלע סלעים
ים ימים אגם נהר נחל מפל בריכה מעיין באר גל גלים
חוף אי איים אדמה קרקע בוץ שלולית טיפה טיפות
שדה שדות כרם פרדס מטע יבול קציר
ציפור קן כוורת מאורה
עולם ארץ טבע נוף
`;

/* Colours. */
const COLOURS = `
אדום אדומה אדומים כחול כחולה כחולים ירוק ירוקה ירוקים
צהוב צהובה צהובים כתום כתומה כתומים סגול סגולה סגולים
ורוד ורודה ורודים חום חומה חומים שחור שחורה שחורים
לבן לבנה לבנים אפור אפורה אפורים תכלת זהב כסף כסוף זהוב
צבע צבעים גוון בהיר כהה
`;

/* Clothes. */
const CLOTHES = `
חולצה חולצות מכנס מכנסיים חצאית חצאיות שמלה שמלות
סוודר אפודה מעיל מעילים
גרב גרביים נעל נעליים סנדל סנדלים מגף מגפיים
כובע כובעים צעיף כפפה כפפות חגורה כפתור כפתורים
בגד בגדים תחתונים
כיס כיסים שרוול שרוולים רוכסן תפר
`;

/* School, drawing, numbers. */
const SCHOOL = `
ספר ספרים מחברת מחברות דף דפים עמוד עמודים שורה שורות
עט עטים עיפרון מחק מחדד סרגל מספריים דבק צבעים
ילקוט תיק לוח גיר מורה מורים תלמיד תלמידים כיתה כיתות
שיעור שיעורים מבחן מבחנים ציון ציונים שיעורים
אות אותיות מילה מילים משפט משפטים סיפור סיפורים שיר שירים
ציור ציורים תמונה מפה מפות
מספר מספרים חשבון חיבור חיסור כפל חילוק
אחד אחת שתיים שניים שלוש שלושה ארבע ארבעה חמש חמישה
שש שישה שבע שבעה שמונה תשע תשעה עשר עשרה מאה אלף
ראשון ראשונה שני שנייה שלישי רביעי חמישי אחרון אחרונה
`;

/* Things you do - infinitives, which is the form a Hebrew speaker names a verb
   by, plus the everyday past and present a child actually says. */
const VERBS = `
ללכת הולך הולכת הלך לרוץ רץ רצה לקפוץ קופץ קפץ
לשבת יושב ישב לעמוד עומד עמד לשכב שוכב לישון ישן ישנה
לאכול אוכל אכל לשתות שותה שתה לטעום טועם
לראות רואה ראה לשמוע שומע שמע להסתכל מסתכל
לדבר מדבר דיבר לומר אומר אמר לשאול שואל שאל לענות עונה
לקרוא קורא קרא לכתוב כותב כתב לצייר מצייר צייר לצבוע צובע
לשיר שר שרה לנגן מנגן לרקוד רוקד רקד לשחק משחק שיחק
לצחוק צוחק צחק לבכות בוכה בכה לחייך מחייך
לתת נותן נתן לקחת לוקח לקח להביא מביא הביא
לפתוח פותח פתח לסגור סוגר סגר לשבור שובר שבר
לבנות בונה בנה לתקן מתקן תיקן ליצור יוצר
לחפש מחפש חיפש למצוא מוצא מצא לאבד מאבד איבד
לעזור עוזר עזר לחכות מחכה חיכה לזכור זוכר זכר לשכוח שוכח שכח
לחשוב חושב חשב להבין מבין הבין ללמוד לומד למד ללמד מלמד
לאהוב אוהב אהב לרצות רוצה רצה לקוות מקווה
לשטוף שוטף שטף לנקות מנקה ניקה לכבס מכבס לבשל מבשל בישל
לאפות אופה אפה לחתוך חותך חתך לערבב מערבב
לזרוק זורק זרק לתפוס תופס תפס לתלות תולה
לטפס מטפס טיפס לשחות שוחה שחה לצלול צולל לעוף עף
לנסוע נוסע נסע לנהוג נוהג להגיע מגיע הגיע לחזור חוזר חזר
לצאת יוצא יצא להיכנס נכנס לעלות עולה עלה לרדת יורד ירד
לגדול גדל גדלה לצמוח צומח לפרוח פורח
לספור סופר ספר למדוד מודד לשקול שוקל
לישון להתעורר מתעורר להתלבש מתלבש להתרחץ
לחבק מחבק חיבק לנשק מנשק לגעת נוגע
`;

/* Getting about. */
const TRAVEL = `
מכונית מכוניות אוטו רכב אוטובוס אוטובוסים משאית משאיות
אופניים אופנוע קורקינט עגלה עגלות רכבת רכבות
מטוס מטוסים מסוק אונייה אוניות סירה סירות ספינה
דרך דרכים כביש כבישים שביל שבילים מדרכה כביש
גשר גשרים מנהרה תחנה תחנות נמל שדה
גלגל גלגלים הגה מנוע דלק כרטיס כרטיסים
נסיעה טיול טיולים מפה מזוודה
`;

/* Music and sound. */
const MUSIC = `
שיר שירים זמר זמרת מנגינה לחן צליל צלילים קול קולות
תוף תופים חליל כינור גיטרה פסנתר נבל חצוצרה מפוחית
תזמורת מקהלה להקה נגן נגנים
רעש שקט לחש צעקה שריקה פעמון
`;

/* Toys and things. */
const THINGS = `
צעצוע צעצועים בובה בובות כדור כדורים חבל חישוק
קובייה קוביות פאזל משחק משחקים קלף קלפים
מטוס רכבת דגם בלון בלונים עפיפון סביבון
מתנה מתנות קופסה שקית סרט סרטים דגל דגלים
מטבע מטבעות כסף ארנק שרשרת טבעת צמיד עגיל
מקל אבן חוט מספריים דבק נייר קרטון פלסטיק כתר
`;

/* People, family, feeling. */
const PEOPLE = `
איש אנשים אישה נשים ילד ילדים ילדה ילדות תינוק תינוקת
אבא אמא הורים הורה בן בת אח אחות אחים אחיות
סבא סבתא דוד דודה בן דודן משפחה משפחות
חבר חברים חברה חברות שכן שכנים אורח אורחים
רופא רופאה אחות מורה גנן טבח נהג שוטר כבאי חייל
זמר צייר סופר ספר נגר חשמלאי
שמח שמחה עצוב עצובה כועס כועסת מפחד רגוע
אהבה שמחה עצב פחד כעס גאווה
טוב טובה רע רעה נחמד יפה יפים גיבור
`;

/* Time. */
const TIME = `
יום ימים לילה לילות בוקר בקרים צהריים ערב ערבים
שבוע שבועות חודש חודשים שנה שנים שעה שעות דקה דקות שנייה
היום מחר אתמול עכשיו אחר כך תמיד לעולם
ראשון שני שלישי רביעי חמישי שישי שבת
אביב קיץ סתיו חורף עונה עונות
חג חגים מסיבה מסיבות חופש חופשה
זמן מועד תור התחלה סוף אמצע
`;

/* The ordinary describing words, which is what a short run on the board most
   often turns out to be. */
const ADJ = `
גדול גדולה גדולים קטן קטנה קטנים ארוך ארוכה קצר קצרה
גבוה גבוהה נמוך נמוכה רחב צר עבה דק
חדש חדשה חדשים ישן ישנה ישנים צעיר זקן
חם חמה קר קרה קריר פושר רטוב יבש
מלא ריק כבד קל רך קשה חלק מחוספס
מהיר איטי חזק חלש בריא חולה
נקי מלוכלך מסודר מבולגן
מתוק מלוח חמוץ מר טעים
בהיר כהה שקוף
שקט רועש קרוב רחוק
שלם שבור פתוח סגור מוכן
אמיתי נכון שונה דומה
`;

/* The small words that hold a board together. Function words score little and
   place everywhere, which is exactly what a crossing needs. */
const SMALL = `
אני אתה את הוא היא אנחנו אתם הם הן
שלי שלך שלו שלה שלנו שלהם
זה זאת אלה כאן שם פה איפה מתי איך למה מי מה כמה
כן לא אולי גם רק עוד כבר עדיין
על אל מן עם בלי בין תחת מעל ליד אחרי לפני
כל שום הרבה מעט מספיק יותר פחות
טוב בבקשה תודה שלום להתראות סליחה
`;

/* Words a game needs to be able to say about itself. */
const GAME = `
משחק משחקים שחקן שחקנים תור תורים ניקוד נקודה נקודות
מילה מילים אות אותיות לוח לוחות אריח אריחים
ניצחון הפסד תיקו פרס פרסים בונוס
חוק חוקים כלל כללים שאלה שאלות תשובה תשובות
`;

/* The town, and the places a child is actually taken to. */
const PLACES = `
עיר ערים כפר כפרים שכונה רחוב רחובות כיכר פארק
חנות חנויות שוק מכולת מאפייה קיוסק קניון
בית ספר גן ילדים ספרייה מוזיאון תיאטרון קולנוע
בית חולים מרפאה בית כנסת מסעדה קפה מלון
משרד בנק דואר תחנה מגרש אצטדיון בריכה
גינה גן חיות חווה מפעל מוסך דלק
מקום מקומות בניין בניינים קומה קומות מעלית מדרגות
`;

/* Tools, and the things in a drawer. */
const TOOLS = `
פטיש מסמר מסמרים בורג ברגים מברג מפתח מלקחיים
מסור מקדחה סולם חבל שרשרת שרוך
מכחול מברשת דלי ספוג מטלית
מספריים סכין מגרסה מסננת מצקת קרש
משקפיים משקפת זכוכית עדשה
סוללה תקע חשמל נורה כבל
`;

/* Play, sport, the yard. */
const PLAY = `
ריצה קפיצה שחייה הליכה טיפוס
כדורגל כדורסל טניס שחמט דמקה
נדנדה מגלשה ארגז חול סולם
תחרות משחק ניצחון קבוצה קבוצות שער שערים
מדליה גביע פרס אימון מאמן שופט
`;

/* Feeling and getting better. */
const FEEL = `
שמחה עצוב כועס עייף רעב צמא מפוחד מופתע
נרגש רגוע גאה בוש ביישן אמיץ
כאב כואב חולה בריא חום קדחת שיעול נזלת
תרופה כדור זריקה פלסטר תחבושת חיסון
מנוחה שינה חלום חלומות סיוט
`;

/* Shape and amount. */
const SHAPE = `
עיגול עיגולים ריבוע ריבועים משולש משולשים מלבן
קו קווים נקודה נקודות פס פסים כתם כתמים
צורה צורות גודל אורך רוחב גובה עומק
חצי רבע שליש שלם זוג זוגות ערמה
ראשון אמצע סוף התחלה
`;

/* More of the everyday. */
const EVERYDAY = `
דבר דברים חפץ חפצים כלי כלים
עבודה עבודות מקצוע תפקיד משימה
כסף מחיר חשבון קנייה מכירה הנחה
מכתב מכתבים הודעה חדשות עיתון עיתונים
סוד סודות אמת שקר סיפור בדיחה
עזרה טובה שירות מתנה הפתעה
רעיון רעיונות תוכנית מטרה חלום
דרך שיטה סדר רשימה רשימות
קבוצה שורה טור ערימה
טעם ריח מגע מראה שמיעה
מזל בעיה בעיות פתרון פתרונות
כוח אנרגיה מהירות שקט רעש
`;

/* More verbs, because a run on the board is as often a verb as a noun. */
const VERBS2 = `
לשים שם שמה להניח מניח להרים מרים הרים
לסדר מסדר סידר לארגן לבחור בוחר בחר
להתחיל מתחיל התחיל לגמור גומר גמר לסיים מסיים סיים
להמשיך ממשיך להפסיק מפסיק לנוח נח
לנסות מנסה ניסה להצליח מצליח הצליח לטעות טועה
לשמור שומר שמר לשלם משלם שילם לקנות קונה קנה
למכור מוכר מכר להחליף מחליף להשאיל
לספר מספר סיפר להסביר מסביר להראות מראה
להאמין מאמין לדעת יודע ידע להכיר מכיר
לחלום חולם חלם לקום קם לשבת לגור גר
לפחד פוחד פחד לדאוג דואג לשמוח שמח
לחלק מחלק חילק לאסוף אוסף אסף למלא ממלא מילא
לרוקן להוריד מוריד להעלות מעלה
לכסות מכסה לגלות מגלה גילה להסתיר מסתיר
לחבר מחבר חיבר להפריד מפריד לקשור קושר קשר
`;

/* More describing words. */
const ADJ2 = `
עגול מרובע ישר עקום
עשיר עני חכם טיפש רציני מצחיק
עסוק פנוי מוכן עייף ער
יקר זול חינם שווה
פשוט מסובך ברור מוזר רגיל מיוחד
בטוח מסוכן שקוף אטום
ראשי חשוב קטנטן ענק
חמוד נעים מעניין משעמם
`;

/* A last sweep of the ordinary, added after the first pass measured thin at the
   four and five letter lengths that a nine-square board most often wants. */
const MORE = `
מגירה מדרגה כניסה יציאה פינה צד צדדים אמצע
תקרה מרצפת צינור ברז כיור אמבטיה מקלחת
מגבון נייר טואלט אשפה שקית פקק מכסה
מזוודה תרמיל ארנק מפתחות משקפי שמש
עגלה כיסא גלגלים מזרן שק שינה אוהל
חצר גדר שער שביל מדשאה ערוגה
עציץ אדנית זרע זרעים שתיל נבט
פרי פירות ירק ירקות תבלין תבלינים
צלחת מגש כוסית קנקן מפית מפה
תנור סיר מכסה מצקת מערוך תבנית
בצק עיסה קצף רוטב מרק נזיד
טעים ריחני חריף עדין
מכתב בול מעטפה חבילה שליח
כרטיס פתק שלט הודעה
מסך מקלדת עכבר אוזניות רמקול מטען
סרט תמונה צילום אלבום
שמיכה כרית מזרן וילון תריס
מנעול בריח ידית ציר
חולצה גופייה מכנסון סינר מטפחת
נעליים גרביים כפכפים מגפיים
טבעת שרשרת צמיד עגילים סיכה
חוט מחט כפתור טלאי תפירה
צבע מכחול קנבס גיר פחם
בלון סרט קונפטי עוגה נרות
דלת חלון מרפסת גג מרתף
כלב חתול תוכי אוגר שרקן
אורח מארח שכן ידיד רע
בוקר צהריים ערב לילה חצות
שמש זריחה שקיעה אופק
אביב פריחה קציר בציר
טיפה שלולית זרם מפל
ענן ערפל טל כפור
צל אור נצנוץ ניצוץ
קול הד לחש רחש
ריח בושם סבון ניחוח
מגע ליטוף חיבוק נשיקה
צעד ריצה זינוק נחיתה
מבט חיוך קריצה הבעה
מילה משפט פסקה כותרת
שאלה תשובה בקשה הסכמה
כלל חוק סדר תור
ניסיון טעות תיקון שיפור
בחירה החלטה שינוי
זיכרון שכחה למידה הבנה
דמיון מחשבה רעיון פתרון
`;

const GROUPS = [
  TWO, ANIMALS, BODY, FOOD, HOUSE, OUTSIDE, COLOURS, CLOTHES,
  SCHOOL, VERBS, TRAVEL, MUSIC, THINGS, PEOPLE, TIME, ADJ, SMALL, GAME,
  PLACES, TOOLS, PLAY, FEEL, SHAPE, EVERYDAY, VERBS2, ADJ2, MORE,
];

/**
 * The written forms, in the order they were typed. Exported so the tests can
 * read them back the way a person wrote them - the SET below is folded, so it
 * can no longer answer "was this spelled properly".
 *
 * Anything shorter than two letters is dropped rather than trusted: a stray
 * single character in a group is a typo, and a one-letter entry in a word list
 * makes every lone tile on the board a legal word.
 */
export const HE_WRITTEN: readonly string[] = (() => {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const g of GROUPS) {
    for (const w of g.split(/\s+/)) {
      if (w.length < 2 || seen.has(w)) continue;
      seen.add(w);
      out.push(w);
    }
  }
  return out;
})();

/**
 * WHAT THE GAME ASKS. Keyed on the FOLDED form - the five final letters mapped
 * back onto the base letters the tiles actually carry - because a board square
 * holds `מ` whether it ended a word or not. `lang.ts` owns that fold and is the
 * only thing that should ever build this set's keys.
 *
 * The fold is repeated here rather than imported to keep this file a leaf:
 * `lang.ts` imports this one, so importing back is a cycle. It is three lines
 * and `plays-in-hebrew.test.ts` asserts the two agree on every entry, which is the
 * part that would otherwise rot.
 */
const FINALS: Readonly<Record<string, string>> = { "ך": "כ", "ם": "מ", "ן": "נ", "ף": "פ", "ץ": "צ" };

export const WORDS_HE: ReadonlySet<string> = new Set(
  HE_WRITTEN.map((w) => [...w].map((c) => FINALS[c] ?? c).join("")),
);
