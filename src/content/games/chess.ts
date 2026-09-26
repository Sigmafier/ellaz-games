import type { GameContent } from "../types";
import { chessSv } from "./sv/chess";
import { chessFr } from "./fr/chess";

/**
 * The page for the game whose rules everybody half knows.
 *
 * The information gain here is not a strategy tip, because the internet already
 * has ten million of those. It is the perft numbers. "Our rules are complete" is
 * a claim about code, and the standard way to settle that claim is to count the
 * positions a move generator reaches: 20 after one half-move, 400 after two,
 * 197,281 after four. A single missing rule - a castle through check, a pawn
 * that may not capture en passant - moves those counts. `logic.test.ts` asserts
 * all of them against the real generator, which is why the page is allowed to
 * say the rules are whole.
 *
 * Every other figure comes from `logic.ts` itself: the fifty-move rule is
 * `halfmove >= 100`, threefold repetition is a count reaching 3, and promotion
 * really does offer four pieces rather than assuming a queen.
 */
export const chess: GameContent = {
  id: "chess",

  copy: {
    he: {
      name: "שחמט",
      metaTitle: "שחמט חינם נגד המחשב ולשניים | Ellaz",
      metaDescription:
        "שחמט חינם בדפדפן. נגד המחשב בשלוש רמות או שניים על מכשיר אחד, עם כל החוקים הרשמיים. בלי הרשמה ובלי הורדה.",

      lede: "שחמט מלא בדפדפן, חינם. מול המחשב בשלוש רמות, או שניים על אותו מכשיר כשמעבירים אותו מיד ליד. כפתור אחד מחליף בין שני המצבים.",

      body: [
        "נוגעים בכלי, והמשבצות שמותר לו ללכת אליהן נדלקות. נוגעים באחת מהן, והכלי זז לשם. זה כל הממשק. אין מה להקליד, ולא צריך להכיר סימון אלגברי כדי לפתוח משחק. מי שמכיר את תנועת הכלים מתיישב ומשחק, בלי שאף אחד ילמד אותו קודם איך מפעילים את התוכנה.",

        "החוקים כאן שלמים, וזה פחות מובן מאליו משזה נשמע. הצרחה לשני הכיוונים, הכאה דרך הילוכו, הכתרה שבה בוחרים באמת אחד מ-4 כלים ולא תמיד מלכה, פת ששוברת עמדה מנצחת לתיקו, שלוש חזרות על אותה עמדה, וחוק חמישים המהלכים שנספר כמו בספר החוקים, 100 חצאי מהלכים. את מחולל המהלכים בדקנו מול מספרי perft המוכרים: 20 מהלכים חוקיים בתור הראשון, 400 עמדות אחרי ששני הצדדים שיחקו, ו-197,281 אחרי ארבעה חצאי מהלכים. חוק אחד חסר, והמספרים האלה יוצאים אחרים. בדיוק לכן כולם משתמשים בהם כמבחן.",

        "משבצת אסורה לא נדלקת.",

        "מול המחשב יש כפתור חזרה אחורה, ומול בן אדם אין. זו לא שכחה. כששניים יושבים מול אותו מסך, מהלך שנעשה הוא מהלך שנעשה, ומזה בנוי כל המשחק. מול תוכנה אין למי להתנצל, אז ילד שלחץ על המשבצת הלא נכונה יכול לחזור ולנסות שוב, וזה ההבדל בין ללמוד את הכלי לבין לוותר עליו.",

        "העמדה נשמרת על המכשיר לבד. סוגרים את הדף באמצע משחק, חוזרים מחר, ואותו לוח מחכה עם אותו תור. המחיר הוא שטלפון וטאבלט הם שני לוחות נפרדים, כי לא ביקשנו מכם חשבון ואין לנו איך לחבר ביניהם.",
      ],

      howToPlay: [
        { title: "בוחרים יריב", body: "המחשב בשלוש רמות, או שני שחקנים על מכשיר אחד. אותו כפתור מחזיר אתכם בכל רגע." },
        { title: "נוגעים בכלי", body: "המשבצות החוקיות נדלקות מיד, וההצרחה וההכאה דרך הילוכו ביניהן ברגע שהן אפשריות." },
        { title: "נוגעים ביעד", body: "הכלי זז. נגיעה במשבצת כבויה לא עושה כלום, אז מהלך אסור הוא לא משהו שאפשר לשחק בטעות." },
        { title: "מכתירים רגלי", body: "רגלי שהגיע לשורה האחרונה נעצר ושואל. מלכה, צריח, רץ או פרש, וזו בחירה אמיתית ולא טקס." },
        { title: "יוצאים וחוזרים", body: "הלוח נשמר בעצמו. סוגרים את הדף, ובפעם הבאה נפתח אותו משחק." },
      ],

      tips: [
        {
          title: "פתחו לכיוון המרכז",
          body: "רגלי מרכזי שתי משבצות קדימה משחרר רץ ופרש במהלך אחד. מתוך 20 הפתיחות החוקיות, שתיים עושות את רוב העבודה.",
        },
        {
          title: "פרשים לפני רצים",
          body: "פרש בפינה רואה 2 משבצות. אותו פרש במרכז רואה 8. שום כלי אחר לא משנה ערך כל כך מהר, אז הוא יוצא ראשון.",
        },
        {
          title: "ספרו לפני שאתם מכים",
          body: "לפני חילוף, ספרו כמה כלים תוקפים את המשבצת וכמה מגנים עליה. רוב ההפסדים של מתחילים הם חילוף שנראה שווה ולא היה.",
        },
        {
          title: "תיקו הוא תוצאה",
          body: "כשאתם מפגרים בחומר, פת ושלוש חזרות הן חברות שלכם. מול הרמה הקשה, להחזיק תיקו זה ניצחון לכל דבר.",
        },
      ],

      teaches: [
        {
          title: "לחשוב מהלך קדימה",
          body: "כל מהלך פותח משהו וסוגר משהו אחר. שחמט הוא המקום הזול ביותר לגלות את זה, כי טעות עולה משחק ולא יותר.",
        },
        { title: "לקרוא איום", body: "לראות מה המהלך האחרון של היריב תקף, לפני שממשיכים בתוכנית שלכם. זו כל המיומנות בשורה אחת." },
        { title: "לשבת עם בעיה קשה", body: "אין שעון, אז מותר לחשוב שתי דקות על מהלך אחד. ילדים לא מקבלים הרבה הזדמנויות כאלה." },
        { title: "להפסיד בלי דרמה", body: "לוח חדש נפתח בלחיצה. ההפסד עולה בדיוק כלום, וזה מה שמאפשר לנסות דברים." },
      ],

      ages: [
        { title: "5 עד 6", body: "יחד, ובלי לספור מי ניצח. בגיל הזה המטרה היא לזכור איך כל כלי הולך, וההדלקה עושה את זה בשבילם." },
        { title: "7 עד 9", body: "מול הרמה הקלה, לבד. זה הגיל שבו מתחילים לראות איומים במקום רק לזוז." },
        { title: "10 ומעלה", body: "בינונית, ואז קשה. מכאן זה כבר משחק ולא תרגיל." },
        { title: "מבוגרים", body: "הרמה הקשה, ובלי כפתור החזרה אחורה. או מול בן אדם, שזה משחק אחר לגמרי." },
      ],

      accessibility:
        "נגיעה אחת בוחרת כלי ונגיעה שנייה מזיזה אותו. בלי גרירה ובלי החזקה ממושכת, כך שהמשחק עובד גם עם אמצעי קלט חלופיים וגם עם יד קטנה שעדיין לא מדייקת. המשבצות החוקיות נדלקות, אז שום דבר לא תלוי בלזכור איך פרש הולך. אין שעון בשום מקום, אז מחשבה ארוכה לא עולה כלום ומשחק יכול לחכות שבוע. אפשר לשחק בשקט מלא בלי לפספס שום מידע.",

      together: [
        { title: "מעבירים את הטלפון", body: "שני שחקנים, לוח אחד, והמחשב יוצא מהתמונה. הכפתור מחליף למצב הזה ובחזרה." },
        {
          title: "אומרים למה",
          body: "לפני כל מהלך, משפט אחד על מה הוא עושה. זה מאט את המשחק ומשפר אותו יותר מכל עצה שתיתנו.",
        },
        { title: "שניים על צד אחד", body: "שניכם מול המחשב, ומסכימים על כל מהלך לפני שנוגעים. ויכוחים כאן הם החלק הטוב." },
        {
          title: "מי מזהה את האיום",
          body: "אחרי כל מהלך של היריב, השני אומר מה הוא תקף. ילד שלומד את זה מפסיק לאבד כלים בחינם.",
        },
      ],

      faq: [
        {
          q: "השחמט באתר חינם?",
          a: "לגמרי. אין תשלום, אין רכישות בתוך המשחק ואין גרסה מורחבת בכסף. כל משחק באתר פתוח מהשנייה הראשונה.",
        },
        { q: "צריך להוריד או להירשם?", a: "לא. רץ בדפדפן, בלי הורדה ובלי חשבון. גם מייל אנחנו לא מבקשים." },
        {
          q: "אפשר לשחק שניים על אותו מכשיר?",
          a: "כן, וזה מצב מלא ולא עקיפה. כפתור אחד מחליף בין משחק מול המחשב לבין שני שחקנים שמעבירים ביניהם את המכשיר.",
        },
        {
          q: "כל חוקי השחמט נמצאים?",
          a: "כן. הצרחה, הכאה דרך הילוכו, הכתרה לארבעה כלים, פת, שלוש חזרות וחוק חמישים המהלכים. מחולל המהלכים מגיע ל-20, 400 ו-197,281 במבחני perft הסטנדרטיים, ומספרים כאלה לא יוצאים נכון כשחוק חסר.",
        },
        {
          q: "יש שעון?",
          a: "אין. לא שעון ולא ספירה לאחור, ואף מהלך לא נגמר לכם באמצע. חושבים כמה שבא לכם.",
        },
        {
          q: "אפשר לחזור אחורה?",
          a: "מול המחשב כן, מול בן אדם לא. מול יריב אנושי מהלך שנעשה נשאר, כי אחרת אין באמת משחק.",
        },
        {
          q: "אפשר לשחק נגד אנשים ברשת?",
          a: "לא. אין כאן שרת ואין חיבור לאף אחד, אז אין דירוג, אין חדרים ואף אחד לא יכול לכתוב לילד שלכם. היריבים הם המחשב, או מי שיושב לידכם.",
        },
        {
          q: "המשחק זוכר איפה הייתי?",
          a: "כן. העמדה נשמרת על המכשיר, כך שאפשר לסגור באמצע ולחזור לאותו לוח. ניקוי אחסון הדפדפן מוחק אותה.",
        },
        { q: "אפשר לשחק בלי אינטרנט?", a: "כן. אחרי ביקור אחד המשחק נשמר במכשיר ורץ גם במטוס." },
      ],

      keywords: ["שחמט", "שחמט נגד המחשב", "שחמט לשניים", "משחקי חשיבה", "שחמט בדפדפן", "לוח שחמט"],
    },

    en: {
      name: "Chess",
      metaTitle: "Free Chess - Play the Computer or a Friend | Ellaz",
      metaDescription:
        "Free chess in your browser. Play the computer at three strengths, or hand the phone over and play a friend. Full rules, no signup, no download.",

      lede: "Free chess that runs in your browser. Play the computer at three strengths, or pass the phone across the table and play a person on the same board. One button switches between the two.",

      body: [
        "Tap a piece and every square it may legally reach lights up. Tap one of them and the piece goes there. That is the whole interface. Nothing to type, no notation to learn, and no settings screen standing between a seven-year-old and a game.",

        "The rules are complete, which is less common on free chess sites than it ought to be. Castling on both wings. En passant. A promotion that genuinely asks which of 4 pieces you want instead of handing you a queen. Stalemate, threefold repetition, and the fifty-move rule counted the way the rulebook counts it, at 100 half-moves. We checked the move generator against the standard perft counts: 20 legal first moves, 400 positions once both sides have played, 197,281 after four half-moves. Leave one rule out and those numbers come out different, which is exactly why everybody tests with them.",

        "Illegal squares never light up.",

        "Against the computer there is a take-back button. Against a person there is none. That is deliberate. Two people sharing a screen have each other to answer to, and a move you can quietly undo is not really a move. A child playing the machine has nobody to apologise to, so letting them walk a blunder back is the difference between learning what a bishop does and giving up on it.",

        "The position saves itself on the device. Close the tab mid-game, come back tomorrow, and the same board is waiting with the same side to move. What that costs you is that a phone and a tablet are two separate boards. We never asked you for an account, so there is nothing to join them with.",
      ],

      howToPlay: [
        { title: "Pick an opponent", body: "The computer at three strengths, or two people on one device. The same button switches back whenever you want." },
        { title: "Tap a piece", body: "Its legal squares light up, castling and en passant among them the moment either is available." },
        { title: "Tap where it goes", body: "The piece moves. Tapping a dark square does nothing, so an illegal move is not something you can play by accident." },
        { title: "Promote a pawn", body: "A pawn reaching the far rank stops and asks. Queen, rook, bishop or knight, and it is a real choice rather than a formality." },
        { title: "Leave and come back", body: "The board saves itself. Shut the tab and the same game opens next time." },
      ],

      tips: [
        {
          title: "Open toward the middle",
          body: "A centre pawn two squares forward frees a bishop and a knight in one move. Of the 20 first moves you are allowed, two of them do most of the work.",
        },
        {
          title: "Knights before bishops",
          body: "A knight in the corner sees 2 squares. The same knight in the middle sees 8. Nothing else on the board gains value that fast, so it comes out first.",
        },
        {
          title: "Count before you trade",
          body: "Count the attackers and the defenders on a square before you take on it. Most beginner losses are one trade that looked even and was not.",
        },
        {
          title: "A draw is a result",
          body: "Down on material, stalemate and threefold repetition are on your side. Holding a draw against the hard computer is a win in everything but name.",
        },
      ],

      teaches: [
        {
          title: "Thinking a move ahead",
          body: "Every move opens something and shuts something else. Chess is the cheapest place to discover that, because the mistake costs one game and nothing more.",
        },
        { title: "Reading a threat", body: "Asking what the last move attacked, before carrying on with your own plan. That is the whole skill in one sentence." },
        { title: "Sitting with a hard problem", body: "There is no clock, so two minutes on one move is allowed. Children are not handed many chances to do that." },
        { title: "Losing without a fuss", body: "A new board is one tap away. A loss costs precisely nothing, and that is what makes trying things possible." },
      ],

      ages: [
        { title: "6 to 7", body: "Together, and without counting who won. At this age the job is remembering how each piece travels, and the lit squares do that part for them." },
        { title: "8 to 10", body: "The easy computer, alone. This is when a child starts seeing threats rather than just moving." },
        { title: "11 and up", body: "Medium, then hard. From here it is a game rather than an exercise." },
        { title: "Grown-ups", body: "Hard, with the take-back left alone. Or against a person, which is a different game entirely." },
      ],

      accessibility:
        "One tap picks a piece up and a second tap moves it. No dragging and no press-and-hold, so it works with alternative input devices and with a hand that does not aim well yet. The legal squares light up, which means nothing depends on remembering how a knight travels. There is no clock anywhere in the game, so a long think costs nothing and a position can sit unfinished for a week. You can play the whole thing with the sound off and miss nothing.",

      together: [
        { title: "Pass the phone", body: "Two players, one board, and the computer out of the picture. The button switches into that mode and back." },
        {
          title: "Say why",
          body: "One sentence before each move about what it does. It slows the game down and improves it more than any advice you could give.",
        },
        { title: "Two heads, one side", body: "Both of you against the computer, agreeing every move before anyone taps. The arguments are the good part." },
        {
          title: "Spot the threat",
          body: "After each of the opponent's moves, the other person says what it attacked. A child who learns that stops losing pieces for free.",
        },
      ],

      faq: [
        {
          q: "Is the chess game free?",
          a: "Completely. No payment, no in-game purchases, and no paid version, because there is no other version. Every game on the site is open from the first second.",
        },
        { q: "Do I need to download or sign up?", a: "No. It runs in the browser, with no download and no account. We do not ask for an email either." },
        {
          q: "Can two people play on one device?",
          a: "Yes, and it is a proper mode rather than a workaround. One button switches between playing the computer and two players handing the device back and forth.",
        },
        {
          q: "Are all the chess rules there?",
          a: "Yes. Castling, en passant, promotion to any of four pieces, stalemate, threefold repetition and the fifty-move rule. The move generator hits 20, 400 and 197,281 on the standard perft tests, and those numbers do not come out right when a rule is missing.",
        },
        {
          q: "Is there a clock?",
          a: "There is not. No timer, no countdown, and no move that runs out on you. Think for as long as you like.",
        },
        {
          q: "Can I take a move back?",
          a: "Against the computer, yes. Against a person, no. A move played in front of somebody stays played, because otherwise there is no game.",
        },
        {
          q: "Can I play other people online?",
          a: "No. There is no server and no connection to anyone, so there is no rating, no lobby and nobody who can message your child. Your opponents are the computer, or whoever is sitting next to you.",
        },
        {
          q: "Does it remember where I was?",
          a: "Yes. The position is saved on the device, so you can close it mid-game and come back to the same board. Clearing your browser storage erases it.",
        },
        { q: "Can I play offline?", a: "Yes. After one visit the game is stored on the device and runs on a plane." },
      ],

      keywords: ["chess", "play chess", "chess vs computer", "two player chess", "board game", "strategy"],
    },

    es: {
      name: "Ajedrez",
      metaTitle: "Ajedrez gratis contra el ordenador | Ellaz",
      metaDescription:
        "Ajedrez gratis en el navegador. Contra el ordenador en tres niveles, o dos personas en un mismo aparato. Reglas completas, sin registro y sin descargas.",

      lede: "Ajedrez completo en el navegador, gratis. Contra el ordenador en tres niveles, o pasando el móvil al otro lado de la mesa para jugar entre dos sobre el mismo tablero. Un botón cambia de uno a otro.",

      body: [
        "Tocas una pieza y se encienden todas las casillas a las que puede ir. Tocas una de ellas y la pieza se mueve. Ese es todo el mecanismo. No hay nada que escribir ni notación que aprender, y no hay pantalla de ajustes entre un niño y la partida.",

        "Las reglas están enteras, que es menos frecuente de lo que debería en un ajedrez gratuito. Enroque por los dos lados. Captura al paso. Una coronación que de verdad pregunta cuál de las 4 piezas quieres en lugar de darte una dama. Ahogado, triple repetición y la regla de las cincuenta jugadas contada como la cuenta el reglamento, en 100 medias jugadas. El generador de movimientos lo comprobamos contra las cifras de perft que usa todo el mundo: 20 primeras jugadas legales, 400 posiciones cuando han jugado los dos bandos, 197.281 tras cuatro medias jugadas. Si falta una regla, esas cifras salen distintas. Por eso son la prueba de siempre.",

        "Lo ilegal no se enciende.",

        "Contra el ordenador hay un botón para deshacer, y contra una persona no lo hay. No es un olvido. Cuando dos personas comparten una pantalla se deben cuentas la una a la otra, y una jugada que puedes retirar en silencio no es una jugada. Frente a la máquina no hay a quién pedir perdón, así que dejar al niño rebobinar un error es la diferencia entre aprender qué hace un alfil y dejarlo estar.",

        "La posición se guarda sola en el aparato. Cierras la pestaña a media partida, vuelves mañana y ahí está el mismo tablero con el mismo turno. Lo que cuesta es que un móvil y una tablet son dos tableros distintos: nunca os pedimos una cuenta, así que no tenemos con qué unirlos.",
      ],

      howToPlay: [
        { title: "Elige rival", body: "El ordenador en tres niveles, o dos personas en un solo aparato. El mismo botón te devuelve cuando quieras." },
        { title: "Toca una pieza", body: "Sus casillas legales se encienden al instante, con el enroque y la captura al paso incluidos en cuanto son posibles." },
        { title: "Toca el destino", body: "La pieza se mueve. Tocar una casilla apagada no hace nada, así que una jugada prohibida no se puede hacer por descuido." },
        { title: "Corona un peón", body: "El peón que llega a la última fila se para y pregunta. Dama, torre, alfil o caballo, y es una elección de verdad." },
        { title: "Vete y vuelve", body: "El tablero se guarda solo. Cierra la pestaña y la próxima vez se abre la misma partida." },
      ],

      tips: [
        {
          title: "Abre hacia el centro",
          body: "Un peón central dos casillas adelante libera un alfil y un caballo en una sola jugada. De las 20 aperturas legales, dos hacen casi todo el trabajo.",
        },
        {
          title: "Caballos antes que alfiles",
          body: "Un caballo en la esquina ve 2 casillas. Ese mismo caballo en el centro ve 8. Ninguna otra pieza gana valor tan deprisa, así que sale primero.",
        },
        {
          title: "Cuenta antes de comer",
          body: "Cuenta cuántas piezas atacan la casilla y cuántas la defienden antes de entrar. Casi todas las derrotas de principiante son un cambio que parecía igualado.",
        },
        {
          title: "Las tablas son un resultado",
          body: "Cuando vas por detrás de material, el ahogado y la triple repetición juegan a tu favor. Aguantar unas tablas contra el nivel difícil es ganar.",
        },
      ],

      teaches: [
        {
          title: "Pensar una jugada por delante",
          body: "Cada movimiento abre algo y cierra otra cosa. El ajedrez es el sitio más barato para descubrirlo, porque el error cuesta una partida y nada más.",
        },
        { title: "Leer una amenaza", body: "Preguntarse qué atacó la última jugada del rival antes de seguir con el plan propio. Esa es toda la habilidad." },
        { title: "Aguantar un problema difícil", body: "No hay reloj, así que dos minutos en una jugada están permitidos. A los niños no se les dan muchas ocasiones así." },
        { title: "Perder sin drama", body: "Un tablero nuevo está a un toque. Perder no cuesta nada, y eso es lo que permite probar cosas." },
      ],

      ages: [
        { title: "6 a 7", body: "Acompañados, y sin contar quién gana. A esta edad lo que se aprende es cómo anda cada pieza, y las casillas encendidas hacen esa parte." },
        { title: "8 a 10", body: "Contra el nivel fácil, solos. Es la edad en la que se empiezan a ver amenazas en vez de solo mover." },
        { title: "11 en adelante", body: "Medio, y luego difícil. A partir de aquí es una partida y no un ejercicio." },
        { title: "Adultos", body: "Difícil, dejando el botón de deshacer en paz. O contra una persona, que es otro juego." },
      ],

      accessibility:
        "Un toque coge la pieza y otro la mueve. No hay que arrastrar ni mantener pulsado, así que funciona con dispositivos de entrada alternativos y con una mano pequeña que todavía no apunta bien. Las casillas legales se encienden, de modo que nada depende de recordar cómo anda un caballo. No hay reloj en ninguna parte, así que pensar mucho no cuesta nada y una posición puede esperar una semana. Se puede jugar entero en silencio sin perderse ninguna información.",

      together: [
        { title: "Pasar el móvil", body: "Dos jugadores, un tablero y el ordenador fuera de escena. El botón entra en ese modo y sale de él." },
        {
          title: "Decir por qué",
          body: "Una frase antes de cada jugada sobre qué hace. Ralentiza la partida y la mejora más que cualquier consejo que puedas dar.",
        },
        { title: "Dos cabezas, un bando", body: "Los dos contra el ordenador, de acuerdo en cada jugada antes de tocar nada. Las discusiones son la mejor parte." },
        {
          title: "Quién ve la amenaza",
          body: "Después de cada jugada del rival, el otro dice qué ha atacado. Un niño que aprende eso deja de regalar piezas.",
        },
      ],

      faq: [
        {
          q: "¿El ajedrez es gratis?",
          a: "Del todo. No hay pagos, no hay compras dentro del juego y no hay versión de pago, porque no existe otra versión. Cada juego de la web está abierto desde el primer segundo.",
        },
        { q: "¿Hay que descargar algo o registrarse?", a: "No. Funciona en el navegador, sin descarga y sin cuenta. Tampoco pedimos un correo." },
        {
          q: "¿Pueden jugar dos personas en el mismo aparato?",
          a: "Sí, y es un modo de verdad, no un apaño. Un botón cambia entre jugar contra el ordenador y dos personas pasándose el aparato.",
        },
        {
          q: "¿Están todas las reglas del ajedrez?",
          a: "Sí. Enroque, captura al paso, coronación a cualquiera de cuatro piezas, ahogado, triple repetición y la regla de las cincuenta jugadas. El generador da 20, 400 y 197.281 en las pruebas de perft habituales, y esas cifras no salen bien cuando falta una regla.",
        },
        {
          q: "¿Hay reloj?",
          a: "No hay ninguno. Ni temporizador ni cuenta atrás, y ninguna jugada se te agota. Piensa lo que quieras.",
        },
        {
          q: "¿Se puede deshacer una jugada?",
          a: "Contra el ordenador sí. Contra una persona no. Una jugada hecha delante de alguien se queda hecha, porque si no, no hay partida.",
        },
        {
          q: "¿Se puede jugar contra gente por internet?",
          a: "No. Aquí no hay servidor ni conexión con nadie, así que no hay ranking, ni salas, ni nadie que pueda escribir a tu hijo. Los rivales son el ordenador o quien esté a tu lado.",
        },
        {
          q: "¿Recuerda dónde lo dejé?",
          a: "Sí. La posición se guarda en el aparato, así que puedes cerrarlo a media partida y volver al mismo tablero. Si borras el almacenamiento del navegador, desaparece.",
        },
        { q: "¿Se puede jugar sin conexión?", a: "Sí. Después de una visita el juego queda guardado en el aparato y funciona en un avión." },
      ],

      keywords: ["ajedrez", "ajedrez gratis", "ajedrez contra el ordenador", "ajedrez dos jugadores", "juego de mesa", "estrategia"],
    },

    fr: chessFr,

    sv: chessSv,
  },

  provenance: [
    {
      claim: "20 legal first moves, 400 after both sides move, 197,281 after four half-moves",
      source: "src/games/chess/logic.test.ts",
    },
    {
      claim: "the fifty-move rule is counted as 100 half-moves",
      source: "src/games/chess/logic.ts",
    },
    {
      claim: "threefold repetition ends the game as a draw",
      source: "src/games/chess/logic.ts",
    },
    {
      claim: "promotion offers 4 pieces rather than assuming a queen",
      source: "src/games/chess/logic.ts",
    },
    {
      claim: "a knight sees 2 squares from a corner and 8 from the middle",
      source: "src/games/chess/logic.ts",
    },
  ],
};
