import type { GameContent } from "../types";
import { backgammonSv } from "./sv/backgammon";
import { backgammonFr } from "./fr/backgammon";

/**
 * The page for the game most people have played badly for thirty years.
 *
 * Nearly every free backgammon on the web ships a single loose game, which is
 * the shortest and least interesting form of it. This one is a MATCH to 5
 * points, where a gammon is worth two and a backgammon three, so the page says
 * so and explains why that changes how a game is played.
 *
 * THE DOUBLING CUBE WAS REMOVED on 2026-09-22, on the operator's instruction
 * looking at the live game: "remove the double thing". Every sentence about it
 * came out in the same change - a page promising a control the game does not
 * have is a worse defect than a page that never mentioned it.
 *
 * Every figure comes out of the rules module beside it: `startGame(target = 5)`,
 * `gameResult` returning 1, 2 or 3 for a plain win, a gammon and a backgammon,
 * `roll` returning four entries on a double, and `logic.test.ts` counting the 15
 * distinct non-double opening rolls.
 */
export const backgammon: GameContent = {
  id: "backgammon",

  copy: {
    he: {
      name: "שש בש",
      metaTitle: "שש בש חינם נגד המחשב ולשניים | Ellaz",
      metaDescription:
        "שש בש חינם בדפדפן, מקצה ל-5 נקודות עם גמון ובקגמון. נגד המחשב בשלוש רמות או שניים על מכשיר אחד.",

      lede: "שש בש מלא בדפדפן, חינם. מקצה ל-5 נקודות, מול המחשב בשלוש רמות או מול מי שיושב מולכם. כפתור אחד מחליף ביניהם.",

      body: [
        "נוגעים בבית, ואז נוגעים איפה שהאבן אמורה לנחות. זהו. רק בית שאפשר לשחק ממנו עונה לנגיעה, אז מהלך אסור הוא לא משהו שצריך לנסות ולגלות. הביטול מחזיר אתכם אחורה בתוך התור שלכם כמה פעמים שבא לכם, וברגע שמסרתם את הקוביות זה נסגר.",

        "החוקים כאן מלאים, וזה בדיוק מה שחסר כמעט בכל שש בש חינמי ברשת. משחק בודד ומנותק הוא לא גרסה מקוצרת של שש בש, הוא משחק אחר. אצלנו זה מקצה ל-5 נקודות: 15 אבנים לכל צד על 24 בתים, אבן בודדת נאכלת ועולה למוט, ומי שמוציא ראשון את כל האבנים מנצח. גמון שווה 2 נקודות ובקגמון שווה 3. דאבל נותן ארבעה מהלכים. חייבים לשחק את שתי הקוביות אם קיים רצף שמשחק את שתיהן, ואם אפשר רק אחת, חייבים לשחק את הגבוהה.",

        "דאבל הוא ארבעה מהלכים.",

        "המקצה הוא מה שהופך את זה למשחק ולא לגלגול קוביות. משחק בודד נקבע בהרבה מזל, חמישה משחקים ברצף כבר לא. וגמון הוא הסיבה שגם משחק אבוד שווה מאמץ: אם לא הוצאתם אף אבן אתם מפסידים 2 נקודות במקום 1, ואם נשארה לכם אבן על המוט או בבית של היריב זה 3. להוציא אבן אחת לפני שהכול נגמר יכול להיות ההבדל בין להפסיד מקצה ובין להמשיך לשחק אותו.",

        "המצב נשמר על המכשיר, כולל תוצאת המקצה. אפשר לעצור באמצע המשחק החמישי, לסגור את הדף, ולחזור אליו מחר בדיוק מאיפה שעזבתם. המחיר הוא שטלפון וטאבלט מנהלים שני מקצים נפרדים, כי לא ביקשנו מכם חשבון ואין לנו במה לחבר ביניהם.",
      ],

      howToPlay: [
        { title: "בוחרים יריב", body: "המחשב בשלוש רמות, או שני שחקנים שמעבירים ביניהם את המכשיר. הכפתור מחליף בכל רגע." },
        { title: "מטילים", body: "שתי קוביות, וארבעה מהלכים כשיוצא דאבל. הקוביות שנותרו לתור הזה מוצגות כל הזמן." },
        { title: "נוגעים בבית ובייעד", body: "רק בית שאפשר להזיז ממנו עונה לנגיעה. אם יש לכם אבן על המוט, היא נכנסת קודם ואין מה לנסות אחרת." },
        { title: "מבטלים אם צריך", body: "הביטול מחזיר מהלך בתוך התור שלכם. אחרי שמסרתם את הקוביות הוא כבר לא יעזור." },
        { title: "מוציאים אבנים", body: "כשכל 15 האבנים בבית שלכם מתחיל שלב ההוצאה, ומי שסיים ראשון לוקח את המשחק." },
      ],

      tips: [
        {
          title: "ספרו פיפים לפני שאתם בוחרים",
          body: "ההפרש בין שתי הספירות אומר לכם איזה משחק אתם משחקים. מובילים בהרבה, רוצו. מפגרים בהרבה, אל תרוצו, תחכו לאכילה.",
        },
        {
          title: "אל תשאירו בודדות בטווח",
          body: "אבן בודדת בשישה בתים מהיריב נאכלת במשהו כמו שליש מההטלות. לפעמים זה שווה את הסיכון, אבל תדעו שלקחתם אותו.",
        },
        {
          title: "בנו בתים סמוכים",
          body: "שני בתים סגורים ליד הבית של היריב שווים יותר משני בתים מפוזרים. מוט מלא מול חומה זה משחק שנגמר.",
        },
        {
          title: "אבן אחת בחוץ שווה נקודה",
          body: "משחק אבוד שבו הוצאתם אבן אחת עולה לכם 1 במקום 2. במקצה ל-5 זה הפרש של משחק שלם.",
        },
      ],

      teaches: [
        {
          title: "הסתברות בידיים",
          body: "מתוך 36 ההטלות האפשריות, כמה פוגעות באבן שהשארתם? ילדים לומדים את זה כאן מהר יותר מאשר בכל דף תרגול.",
        },
        { title: "החלטה תחת אי ודאות", body: "הקוביות לא באשמתכם, הבחירה כן. שש בש מפריד בין השניים טוב מכל משחק לוח אחר." },
        { title: "לספור קדימה", body: "ספירת פיפים היא חשבון פשוט עם תוצאה אמיתית. פתאום יש סיבה לחבר מספרים בראש." },
        { title: "לדעת מתי לפרוש", body: "לוותר על משחק כדי להציל את המקצה זה שיעור שמחזיק הרבה מעבר ללוח." },
      ],

      ages: [
        { title: "6 עד 7", body: "יחד, ובלי למהר. בגיל הזה מספיק להטיל, לספור בתים ולהזיז." },
        { title: "8 עד 10", body: "מול הרמה הקלה. פה נכנסות האכילות, המוט, ותחושת המרוץ." },
        { title: "11 ומעלה", body: "מקצה מלא. לשחק חמישה משחקים ברצף זה משחק אחר מלשחק אחד." },
        { title: "מבוגרים", body: "הרמה הקשה, מקצה ל-5, גמון ובקגמון. זה בדיוק אותו שש בש שמשחקים בבית קפה." },
      ],

      accessibility:
        "נגיעה בבית ונגיעה ביעד. בלי גרירה ובלי החזקה ממושכת, כך שגם אמצעי קלט חלופי וגם יד קטנה מסתדרים בלי מאמץ. רק בית שאפשר לשחק ממנו עונה לנגיעה, אז אי אפשר לנסות מהלך אסור ולא להבין למה הוא לא עובד. אין שעון ואין לחץ זמן, והביטול מאפשר לבדוק מהלך ולחזור ממנו. הקוביות שנשארו לתור מוצגות כמספרים, אז אין שום מידע שתלוי רק בצליל.",

      together: [
        { title: "מעבירים את המכשיר", body: "מקצה ל-5 בין שניכם, בלי מחשב באמצע. אותם חוקים בדיוק." },
        {
          title: "מכריזים לפני שמטילים",
          body: "לפני כל הטלה, כל צד אומר בקול את ספירת הפיפים שלו. תגלו מהר מאוד מי סופר ומי מנחש.",
        },
        { title: "מקצה קצר", body: "ל-3 נקודות במקום ל-5 כשאין זמן. גמון אחד ואתם כבר כמעט שם, והכול נגמר ברבע שעה." },
        {
          title: "להסביר הטלה",
          body: "ילד מטיל, ואתם שואלים אילו מהלכים אפשריים לפני שהוא נוגע. זה הופך מזל לשאלה.",
        },
      ],

      faq: [
        {
          q: "השש בש כאן חינם?",
          a: "כן, בלי שום תשלום. אין רכישות, אין מנוי ואין תוכן נעול. כל משחק באתר פתוח מיד.",
        },
        { q: "צריך אפליקציה או הרשמה?", a: "לא. הכול רץ בדפדפן. לא מבקשים שם, לא מבקשים מייל ואין סיסמה לזכור." },
        {
          q: "משחקים משחק בודד או מקצה?",
          a: "מקצה ל-5 נקודות. משחק רגיל שווה נקודה, גמון שתיים ובקגמון שלוש, והמקצה נגמר כשצד אחד מגיע ל-5. אין קובייה מכפילה.",
        },
        {
          q: "אפשר לשחק שניים על מכשיר אחד?",
          a: "כן. הכפתור מעביר בין משחק מול המחשב לבין שני אנשים שמעבירים ביניהם את המכשיר בין התורות.",
        },
        {
          q: "החוקים מלאים או מקוצרים?",
          a: "מלאים. מוט, כניסה חוזרת, הוצאת אבנים, דאבל שנותן ארבעה מהלכים, חובה לשחק את שתי הקוביות כשאפשר, ואת הגבוהה כשרק אחת אפשרית. גמון שווה 2 ובקגמון 3.",
        },
        {
          q: "אפשר לשחק מול אנשים ברשת?",
          a: "לא. המשחק לא מתחבר לשום שרת, אז אין חדרים, אין דירוג, ואף זר לא יכול לשלוח הודעה. משחקים מול המחשב או מול מי שלידכם.",
        },
        {
          q: "המקצה נשמר אם אני סוגר?",
          a: "כן. הלוח ותוצאת המקצה נשמרים על המכשיר, אז אפשר להמשיך מחר. ניקוי אחסון הדפדפן מוחק את זה.",
        },
        { q: "אפשר לשחק בלי חיבור לאינטרנט?", a: "כן. אחרי ביקור ראשון המשחק יושב על המכשיר ופועל גם בלי רשת." },
        {
          q: "מאיזה גיל אפשר?",
          a: "בערך משש יחד, ומשמונה לבד מול הרמה הקלה. אין קריאה במשחק, רק ספירה, וגם את זה הלוח עושה בשבילכם.",
        },
      ],

      keywords: ["שש בש", "שש בש נגד המחשב", "שש בש מקצה", "שש בש לשניים", "משחקי לוח", "בקגמון"],
    },

    en: {
      name: "Backgammon",
      metaTitle: "Free Backgammon - A Full Match to 5 Points | Ellaz",
      metaDescription:
        "Free backgammon in your browser. A match to 5 points with gammons and backgammons, against the computer or a friend on one device.",

      lede: "Free backgammon in your browser, played as a match to 5 points rather than one loose game. Take on the computer at three strengths, or hand the device to whoever is sitting opposite you.",

      body: [
        "Tap a point, then tap where the checker should land. Undo steps back through your own turn as many times as you like, so a move you were only trying out costs nothing. Then you pass the dice. Then it stands.",

        "The rules are whole, and that is the thing almost every free backgammon on the web leaves out. One loose game on its own is not a shorter version of backgammon, it is a different game. This is a match to 5 points: 15 checkers a side across 24 points, a lone checker hit and sent to the bar, and the race won by whoever bears all 15 off first. A gammon counts 2 and a backgammon counts 3. Both dice must be played whenever some sequence plays both, and when only one of them can be played it has to be the higher one.",

        "A double is four moves.",

        "Playing a match rather than a game is what turns the dice into a decision. One game is settled largely by luck; five in a row are not, and knowing you are two points behind changes which risks are worth taking. Gammons are the other half of that. Lose without bearing a single checker off and it costs 2 points instead of 1, and if you still have a checker on the bar or stuck in the winner's home it costs 3. So getting one checker off a lost game is often the difference between losing a match and still being in it.",

        "The whole state saves on the device, match score included. Stop in the middle of the fifth game and pick it up tomorrow. A phone and a tablet keep two separate matches, because there is no account here to join them with.",
      ],

      howToPlay: [
        { title: "Pick an opponent", body: "The computer at three strengths, or two people passing one device back and forth. The button switches at any point." },
        { title: "Roll", body: "Two dice, or four moves when they come up the same. Whatever is left to play this turn stays on screen." },
        { title: "Tap from, tap to", body: "Only the points you can actually move from answer a tap. With a checker on the bar it comes in first, so there is nothing else to try." },
        { title: "Undo if you want", body: "Undo walks back a move inside your own turn. Once the dice are handed over it will not help you." },
        { title: "Bear off", body: "When all 15 of your checkers are home you start taking them off, and first one out wins the game." },
      ],

      tips: [
        {
          title: "Count pips before you choose",
          body: "The gap between the two counts tells you which game you are playing. Well ahead, run. Well behind, stop running and wait for a hit.",
        },
        {
          title: "Do not leave blots in range",
          body: "A lone checker within six points of an enemy checker is hit by roughly a third of the 36 rolls. Sometimes that is worth it, but know you took the risk.",
        },
        {
          title: "Build points next to each other",
          body: "Two made points side by side in front of your opponent are worth far more than two scattered ones. A checker on the bar facing a wall is a game already over.",
        },
        {
          title: "One checker off is worth a point",
          body: "A lost game where you got one checker off costs 1 instead of 2. Across a match to 5 that is a whole game's difference.",
        },
      ],

      teaches: [
        {
          title: "Probability you can hold",
          body: "Of the 36 rolls two dice can make, how many hit the checker you left out there? Children work that out faster here than on any worksheet.",
        },
        { title: "Deciding without knowing", body: "The dice are not your fault. The choice is. Backgammon separates those two better than any other board game." },
        { title: "Counting ahead", body: "A pip count is ordinary arithmetic with a real answer at the end of it, which is suddenly a reason to add up in your head." },
        { title: "Playing a losing position", body: "A game you cannot win is still worth points, and learning to play for the smaller loss keeps working long after the board is put away." },
      ],

      ages: [
        { title: "7 to 8", body: "Together, and in no hurry. Rolling, counting the points and moving is plenty at this age." },
        { title: "9 to 10", body: "Against the easy computer. Hits, the bar and the feel of a race all arrive here." },
        { title: "11 and up", body: "A full match to 5. Playing five games in a row is a different game from playing one." },
        { title: "Grown-ups", body: "Hard, a match to 5, gammons counting. This is the backgammon you already know from a cafe table." },
      ],

      accessibility:
        "Tap a point, then tap a destination. No dragging and no press-and-hold, so an alternative input device and a small hand both manage without effort. Only the points you are allowed to move from answer a tap, which means you cannot attempt an illegal move and be left wondering why nothing happened. There is no clock and no time pressure, and undo lets you try a move and take it back. The dice left to play this turn are shown as numbers, so nothing depends on hearing anything.",

      together: [
        { title: "Pass the device", body: "A match to 5 between the two of you, with no computer in the middle. Exactly the same rules." },
        {
          title: "Say the count out loud",
          body: "Before each roll, each player says their own pip count out loud. You find out very quickly which of you is counting and which is guessing.",
        },
        { title: "A short match", body: "Play to 3 points instead of 5 when time is short. One gammon nearly gets you there, and the whole thing is over in a quarter of an hour." },
        {
          title: "Talk through a roll",
          body: "The child rolls, and you ask which moves are even possible before they touch anything. It turns luck into a question.",
        },
      ],

      faq: [
        {
          q: "Is the backgammon free?",
          a: "Yes, with nothing to pay at any point. No purchases, no subscription, and no locked content. Every game on the site is open immediately.",
        },
        { q: "Do I need an app or an account?", a: "No. It all runs in the browser. Nobody asks for a name, nobody asks for an email, and there is no password to remember." },
        {
          q: "Is it one game or a match?",
          a: "A match to 5 points. An ordinary win scores 1, a gammon 2 and a backgammon 3, and the match ends when a side reaches 5. There is no doubling cube.",
        },
        {
          q: "Can two people play on one device?",
          a: "Yes. The button moves between playing the computer and two people handing the device across between turns.",
        },
        {
          q: "Are the rules complete or simplified?",
          a: "Complete. The bar, re-entry, bearing off, a double giving four moves, both dice played whenever that is possible and the higher one when only one is. A gammon scores 2 and a backgammon 3.",
        },
        {
          q: "Can I play people online?",
          a: "No. The game connects to no server at all, so there are no rooms, no ratings and nobody sending your child a message. You play the computer or the person beside you.",
        },
        {
          q: "Does it keep the match if I close it?",
          a: "Yes. The board and the match score are stored on the device, so you can carry on tomorrow. Clearing your browser storage wipes it.",
        },
        { q: "Can I play with no internet?", a: "Yes. After the first visit the game sits on the device and works with the network off." },
        {
          q: "What age is it for?",
          a: "Around seven alongside an adult, and about nine alone against the easy computer. There is no reading in the game, only counting, and the board does most of that for you.",
        },
      ],

      keywords: ["backgammon", "backgammon match", "backgammon vs computer", "two player backgammon", "board game", "dice game"],
    },

    es: {
      name: "Backgammon",
      metaTitle: "Backgammon gratis - partido completo a 5 puntos | Ellaz",
      metaDescription:
        "Backgammon gratis en el navegador. Partido a 5 puntos con gammon y backgammon, contra el ordenador o entre dos en el mismo aparato.",

      lede: "Backgammon completo en el navegador, gratis, jugado como un partido a 5 puntos y no como una partida suelta. Contra el ordenador en tres niveles, o contra quien tengas enfrente pasándole el aparato.",

      body: [
        "Tocas una casilla y luego tocas dónde cae la ficha. Deshacer te devuelve dentro de tu propio turno las veces que quieras, así que probar un movimiento no cuesta nada. Después pasas los dados. Y ya está hecho.",

        "Las reglas están enteras, que es justo lo que le falta a casi todo el backgammon gratuito de internet. Una partida suelta no es una versión corta del backgammon: es otro juego. Aquí es un partido a 5 puntos, con 15 fichas por bando sobre 24 casillas, una ficha sola que se come y va a la barra, y la carrera la gana quien saca sus 15 primero. Un gammon vale 2 y un backgammon vale 3. Hay que jugar los dos dados siempre que exista una secuencia que los juegue, y cuando solo cabe uno, tiene que ser el más alto.",

        "Un doble son cuatro movimientos.",

        "Jugar un partido y no una partida es lo que convierte los dados en una decisión. Una partida la decide en buena medida la suerte; cinco seguidas ya no, y saber que vas dos puntos por detrás cambia qué riesgos merecen la pena. El gammon es la otra mitad de eso. Perder sin haber sacado ni una ficha cuesta 2 puntos en vez de 1, y si además te queda una ficha en la barra o dentro de la casa del rival, cuesta 3. Así que sacar una sola ficha de una partida perdida es muchas veces la diferencia entre perder el partido y seguir en él.",

        "Todo se guarda en el aparato, marcador del partido incluido. Puedes parar a mitad de la quinta partida y seguir mañana. Un móvil y una tablet llevan dos partidos distintos, porque aquí no hay ninguna cuenta que los una.",
      ],

      howToPlay: [
        { title: "Elige rival", body: "El ordenador en tres niveles, o dos personas pasándose un solo aparato. El botón cambia cuando quieras." },
        { title: "Tira", body: "Dos dados, o cuatro movimientos si salen iguales. Lo que queda por jugar en el turno está siempre a la vista." },
        { title: "Toca origen y destino", body: "Solo responden al toque las casillas desde las que puedes mover. Con una ficha en la barra, esa entra antes que nada." },
        { title: "Deshaz si hace falta", body: "Deshacer retrocede un movimiento dentro de tu turno. Cuando ya has pasado los dados, deja de servir." },
        { title: "Saca las fichas", body: "Cuando tus 15 fichas están en casa empieza la salida, y quien termina primero gana la partida." },
      ],

      tips: [
        {
          title: "Cuenta pips antes de elegir",
          body: "La diferencia entre las dos cuentas te dice a qué partida estás jugando. Muy por delante, corre. Muy por detrás, deja de correr y espera una comida.",
        },
        {
          title: "No dejes fichas solas a tiro",
          body: "Una ficha sola a menos de seis casillas del rival se come con cerca de un tercio de las 36 tiradas. A veces compensa, pero que sea a sabiendas.",
        },
        {
          title: "Haz casillas seguidas",
          body: "Dos casillas hechas una al lado de la otra delante del rival valen mucho más que dos sueltas. Una ficha en la barra frente a un muro es una partida terminada.",
        },
        {
          title: "Una ficha fuera vale un punto",
          body: "Una partida perdida en la que sacaste una ficha cuesta 1 en vez de 2. En un partido a 5 eso es una partida entera de diferencia.",
        },
      ],

      teaches: [
        {
          title: "Probabilidad en la mano",
          body: "De las 36 tiradas posibles con dos dados, ¿cuántas alcanzan la ficha que has dejado sola? Un niño lo resuelve aquí antes que en cualquier ficha de ejercicios.",
        },
        { title: "Decidir sin saber", body: "Los dados no son culpa tuya. La elección sí. El backgammon separa esas dos cosas mejor que ningún otro juego de tablero." },
        { title: "Contar por delante", body: "Una cuenta de pips es aritmética corriente con una respuesta de verdad al final, que es de pronto un motivo para sumar de cabeza." },
        { title: "Jugar una posición perdida", body: "Una partida que no puedes ganar todavía vale puntos, y aprender a jugar por la derrota más barata sigue sirviendo mucho después de recoger el tablero." },
      ],

      ages: [
        { title: "7 a 8", body: "Acompañados, y sin prisa. Tirar, contar casillas y mover ya es bastante." },
        { title: "9 a 10", body: "Contra el nivel fácil. Aquí llegan las comidas, la barra y la sensación de carrera." },
        { title: "11 en adelante", body: "Partido completo a 5. Jugar cinco partidas seguidas es otro juego distinto a jugar una." },
        { title: "Adultos", body: "Difícil, partido a 5 y el gammon contando. Es el mismo backgammon de la mesa de un bar." },
      ],

      accessibility:
        "Se toca una casilla y después el destino. No hay que arrastrar ni mantener pulsado, así que un dispositivo de entrada adaptado y una mano pequeña se apañan igual de bien. Solo responden al toque las casillas desde las que se puede mover, de modo que no se puede intentar una jugada prohibida y quedarse sin saber por qué no pasa nada. No hay reloj ni prisa, y deshacer permite probar y volver atrás. Los dados que quedan por jugar se muestran como números, así que nada depende de oír nada.",

      together: [
        { title: "Pasarse el aparato", body: "Un partido a 5 entre vosotros dos, sin ordenador de por medio. Exactamente las mismas reglas." },
        {
          title: "Decir la cuenta en voz alta",
          body: "Antes de cada tirada, cada uno dice en voz alta su propia cuenta de pips. Se ve enseguida quién cuenta y quién adivina.",
        },
        { title: "Partido corto", body: "A 3 puntos en vez de a 5 cuando hay poco tiempo. Un gammon casi te pone ahí y todo acaba en un cuarto de hora." },
        {
          title: "Comentar una tirada",
          body: "El niño tira y tú preguntas qué movimientos son posibles antes de que toque nada. Convierte la suerte en una pregunta.",
        },
      ],

      faq: [
        {
          q: "¿El backgammon es gratis?",
          a: "Sí, y no hay nada que pagar en ningún momento. No hay compras, no hay suscripción y no hay contenido bloqueado. Cada juego de la web está abierto desde el principio.",
        },
        { q: "¿Hace falta una aplicación o una cuenta?", a: "No. Todo funciona en el navegador. Nadie pide un nombre, nadie pide un correo y no hay contraseña que recordar." },
        {
          q: "¿Es una partida suelta o un partido?",
          a: "Un partido a 5 puntos. Una victoria normal vale 1, un gammon 2 y un backgammon 3, y el partido acaba cuando un bando llega a 5. No hay cubo de dobles.",
        },
        {
          q: "¿Pueden jugar dos personas en el mismo aparato?",
          a: "Sí. El botón pasa de jugar contra el ordenador a dos personas que se van pasando el aparato entre turno y turno.",
        },
        {
          q: "¿Las reglas están completas o simplificadas?",
          a: "Completas. La barra, la reentrada, la salida de fichas, el doble que da cuatro movimientos, los dos dados jugados siempre que se pueda y el más alto cuando solo cabe uno. El gammon vale 2 y el backgammon 3.",
        },
        {
          q: "¿Se puede jugar contra gente por internet?",
          a: "No. El juego no se conecta a ningún servidor, así que no hay salas, ni clasificaciones, ni mensajes de desconocidos. Se juega contra el ordenador o contra quien tengas al lado.",
        },
        {
          q: "¿Se guarda el partido si lo cierro?",
          a: "Sí. El tablero y el marcador del partido quedan en el aparato, así que puedes seguir mañana. Si borras el almacenamiento del navegador, se pierde.",
        },
        { q: "¿Funciona sin internet?", a: "Sí. Después de la primera visita el juego se queda en el aparato y funciona con la red apagada." },
        {
          q: "¿Desde qué edad?",
          a: "Sobre los siete acompañado, y hacia los nueve solo contra el nivel fácil. En el juego no se lee nada, solo se cuenta, y de eso se ocupa casi todo el tablero.",
        },
      ],

      keywords: ["backgammon", "partido de backgammon", "backgammon contra el ordenador", "backgammon dos jugadores", "juego de mesa", "dados"],
    },

    fr: backgammonFr,

    sv: backgammonSv,
  },

  provenance: [
    {
      claim: "a match to 5 points is the default target",
      source: "src/games/backgammon/logic.ts",
    },
    {
      claim: "a gammon scores 2 and a backgammon scores 3, and nothing multiplies them",
      source: "src/games/backgammon/logic.ts",
    },
    {
      claim: "a double gives four moves rather than two",
      source: "src/games/backgammon/logic.ts",
    },
    {
      claim: "15 checkers a side across 24 points, bar and bear-off numbered beyond them",
      source: "src/games/backgammon/logic.ts",
    },
    {
      claim: "both dice must be played when a sequence plays both, otherwise the higher one",
      source: "src/games/backgammon/logic.ts",
    },
    {
      claim: "there is no doubling cube: a match carries only the target and the score",
      source: "src/games/backgammon/logic.test.ts",
    },
  ],
};
