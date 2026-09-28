import type { GameContent } from "../types";
import { puzzlesnakeSv } from "./sv/puzzlesnake";
import { puzzlesnakeFr } from "./fr/puzzlesnake";

/**
 * Puzzle Snake. Every number below is read out of `src/games/puzzlesnake/`:
 * the levels, their board sizes and their snakes out of `levels.ts`, the star
 * margin out of `logic.ts`, and everything the solver or the greedy bot found
 * out of `solver.test.ts`, which re-derives each figure on every test run - the
 * pars of 5 and 24, the 11-or-17 of level 1-2, the 9 trap apples of 16 in
 * Tricks, the bot failing all 6 Tricks levels, every trick tile being needed,
 * and the 210 presses of the whole game at its best. World 2 was the Maze
 * until 2026-09-28, when five of its six levels were redrawn around one new
 * tile each, and 1-2 to 1-5 of the Garden around one idea each. A redrawn level that moves one of them reds that test
 * before this page can quote a stale number.
 */
export const puzzlesnake: GameContent = {
  id: "puzzlesnake",

  copy: {
    he: {
      name: "נחש חידות",
      metaTitle: "נחש חידות - משחק נחש וחשיבה חינם | Ellaz",
      metaDescription:
        "נחש שזז רק כשלוחצים. אוכלים את כל התפוחים ומגיעים לדלת הזהב. 12 שלבים בשני עולמות, ביטול צעד תמיד פתוח, ואי אפשר להפסיד.",

      lede: "נחש חידות הוא הנחש המוכר, רק שהפעם הוא מחכה לכם. כל לחיצה היא צעד אחד, כל תפוח מאריך אותו במשבצת, ודלת הזהב נפתחת רק אחרי התפוח האחרון. אי אפשר להפסיד, ותמיד אפשר לבטל צעד. השאלה היחידה היא הסדר.",

      body: [
        "שום דבר לא זז עד שלוחצים. הנחש עושה צעד ומחכה, כמה שתרצו.",

        "הקושי הוא הגוף שלכם. כל תפוח מוסיף משבצת, והזנב הולך בדיוק במסלול שהראש עשה, כך שהמעבר שעברתם בו לפני רגע יכול להיות עכשיו מלא בכם. הראש רשאי להיכנס למשבצת שהזנב עוזב, כי הזנב זז באותה לחיצה. הוא לא יכול להסתובב לתוך הצוואר, לא יכול לעבור קיר, והדלת נשארת סגורה עד התפוח האחרון. לחיצה שנחסמת היא רק טלטול קטן של הראש. זה הכול. אין עונש ואין שעון.",

        "יש 12 שלבים בשני עולמות. בגינה ששת השלבים הם על לוח של 7 על 7, הנחש מתחיל באורך 2 או 3, ולומדים שם שהתפוח הקרוב הוא לא תמיד הנכון. בטריקים יש שישה שלבים קצרים על לוח של 9 על 9, ובכל אחד משבצת חדשה: מפתח שפותח את כל המנעולים, חצים שעולים עליהם רק בכיוון שהם מצביעים, וזוג פורטלים שמעבירים אתכם לצד השני של הלוח. שלב אחד, 2-2, הוא לוח קשה של ארבעה חדרים שנשאר מהגרסה הראשונה, והנחש מתחיל בו באורך 5.",

        "בדקנו כל שלב פעמיים. פעם עם פותר שמנסה כל רצף לחיצות אפשרי ומוצא את המספר הקטן ביותר, ופעם עם בוט חמדן שתמיד הולך אל התפוח הקרוב אליו. הבוט מסיים את השלב הראשון במספר הלחיצות המינימלי, 5. את אף אחד מ-6 שלבי הטריקים הוא לא מצליח לסיים. בטריקים, 9 מתוך 16 התפוחים הופכים את השלב לבלתי פתיר אם אוכלים אותם ראשונים, ואם סוגרים בקיר את המשבצת החדשה של שלב, הפותר לא מוצא שום דרך לסיים אותו. ובשלב 1-2 הסדר לבדו קובע אם תצטרכו 11 לחיצות או 17.",

        "הכוכבים סופרים לחיצות. שלושה במספר המינימלי, שניים בטווח קטן ממנו, ואחד על כל פתרון.",
      ],

      howToPlay: [
        {
          title: "צעד אחד בכל פעם",
          body: "לוחצים על חץ במקלדת, על W A S D, על אחד מכפתורי החיצים שמתחת ללוח, או מחליקים אצבע על הלוח. הנחש עושה צעד אחד בדיוק ונעצר.",
        },
        {
          title: "אוכלים את כל התפוחים",
          body: "כל תפוח מאריך את הנחש במשבצת. דלת הזהב מצוירת בקו מקווקו כל עוד היא סגורה, והופכת לקו מלא וזוהר ברגע שהתפוח האחרון נאכל.",
        },
        {
          title: "נכנסים בדלת",
          body: "הראש נכנס לדלת הפתוחה והשלב נפתר. בפס שמעל הלוח כתוב מראש כמה לחיצות צריך לשלושה כוכבים.",
        },
        {
          title: "ביטול, התחלה מחדש ומפת השלבים",
          body: "ביטול צעד מחזיר לחיצה אחת אחורה, כמה פעמים שרוצים. התחלה מחדש מחזירה את השלב לתמונה הראשונה שלו. כפתור השלבים פותח את המפה של שני העולמות, וכל שלב נפתח אחרי שפותרים את זה שלפניו.",
        },
      ],

      tips: [
        {
          title: "לספור את הזנב לפני שנכנסים",
          body: "מעבר עם כניסה אחת בטוח רק אם יש בו מקום להסתובב או יציאה נוספת. לפני שאוכלים תפוח בקצה של מבוי סתום, תחשבו כמה ארוכים תהיו אחרי זה.",
        },
        {
          title: "התפוח הקרוב הוא שאלה",
          body: "חפשו את התפוח שיסגור אתכם אם תאכלו אותו מוקדם, והשאירו אותו לסוף. בחמישה מששת שלבי הטריקים יש לפחות אחד כזה.",
        },
        {
          title: "הזנב מפנה מקום",
          body: "המשבצת שהזנב עומד לעזוב פנויה כבר באותה לחיצה. בפינות הצפופות של שלב 2-2 זה בדיוק מה שמאפשר לעבור.",
        },
        {
          title: "הביטול לא עולה כלום",
          body: "שום דבר לא נספר עד שמגיעים לדלת, אז אפשר לנסות מסלול, לראות איפה הגוף נגמר, ולבטל.",
        },
      ],

      teaches: [
        {
          title: "תכנון כמה צעדים קדימה",
          body: "כל שלב נפתר קודם בראש. מי שמתחיל ללחוץ בלי תוכנית בדרך כלל נתקע, ולומד מזה משהו.",
        },
        {
          title: "סדר ותוצאה",
          body: "איזה תפוח אוכלים ראשון משנה את כל מה שבא אחריו, כי הגוף שנשאר מאחור הוא הקיר של הצעד הבא.",
        },
        {
          title: "להתאושש מטעות",
          body: "לוח שנתקע הוא לא הפסד. ביטול צעד הופך אותו למידע: עכשיו יודעים איזה סדר לא עובד.",
        },
      ],

      ages: [
        {
          title: "מתחת לגיל 6",
          body: "שני השלבים הראשונים בגינה אפשריים עם כפתורי החיצים ומבוגר לידם. אחרי זה הסדר כבר קשה מדי לרוב הילדים בגיל הזה, וזה בסדר גמור.",
        },
        {
          title: "7 עד 12",
          body: "הגינה בגודל הנכון. הטריקים הם אתגר אמיתי בגיל הזה, ובדרך כלל נפתר עם הרבה ביטולים.",
        },
        {
          title: "נוער ומבוגרים",
          body: "הטריקים בשבילכם. שלושה כוכבים בשלב 2-6 פירושם למצוא את המסלול הטוב ביותר, של 24 לחיצות.",
        },
      ],

      accessibility:
        "אין שעון ואין הפסד, כך שמשחקים בכל קצב. כל צעד הוא לחיצה אחת: חץ במקלדת או W A S D, כפתורי החיצים על המסך או החלקה על הלוח, ואף צעד לא דורש להחזיק או לגרור. הדלת משנה צורה ולא רק צבע כשהיא נפתחת, מקו מקווקו לקו מלא, ולכל כפתור בעמוד, כולל אריחי השלבים, יש שם שקורא מסך מקריא.",

      together: [
        {
          title: "לתכנן בקול",
          body: "אחד מחזיק את הטלפון והשני אומר את הצעדים. רק המתכנן מדבר, והמחזיק לוחץ בדיוק מה שנאמר.",
        },
        {
          title: "מירוץ לשלושה כוכבים",
          body: "שני שחקנים, אותו שלב, שני מכשירים. מי שמסיים בפחות לחיצות מנצח, ובתיקו מנצח מי שלא ביטל אף צעד.",
        },
        {
          title: "לצוד את התפוח המלכודת",
          body: "לפני שמישהו זז, כל אחד מנחש איזה תפוח יתקע את השלב אם יאכלו אותו ראשון. בודקים עם ביטול.",
        },
      ],

      faq: [
        {
          q: "אפשר להפסיד בנחש חידות?",
          a: "לא. אין שעון ואין סוף משחק. אם לנחש אין לאן לזוז, הלוח אומר את זה, וביטול צעד או התחלה מחדש מוציאים אתכם.",
        },
        {
          q: "מה המספר ליד שלושת הכוכבים?",
          a: "זה מספר הלחיצות הקטן ביותר שפותר את השלב, כפי שמצא פותר שבדק כל רצף אפשרי. אי אפשר לנצח אותו, רק להשתוות אליו.",
        },
        {
          q: "איך מקבלים שני כוכבים?",
          a: "מסיימים בתוך 20 אחוז יותר לחיצות מהמינימום, ותמיד לפחות 2 לחיצות יותר ממנו. כל שני פתרונות של אותו שלב נבדלים במספר זוגי של לחיצות, ולכן 2 הוא הפער הקטן ביותר שיש.",
        },
        {
          q: "למה אי אפשר לחזור באותה דרך?",
          a: "הנחש לא יכול להסתובב לתוך הצוואר של עצמו. הוא כן יכול להיכנס למשבצת שהזנב עוזב, כי הזנב זז באותה לחיצה.",
        },
        {
          q: "איך פותחים את השלב הבא?",
          a: "פותרים את השלב שלפניו, בכל מספר כוכבים. שלב נעול עדיין מתנדנד כשלוחצים עליו, כדי שתראו איפה הוא.",
        },
        {
          q: "ההתקדמות נשמרת?",
          a: "הכוכבים הכי טובים של כל שלב נשמרים במכשיר הזה. אם יוצאים באמצע שלב, הוא נפתח בדיוק איפה שעזבתם.",
        },
        {
          q: "זה אותו משחק כמו נחש?",
          a: "אותו נחש ואותם צבעים, משחק אחר. בנחש הרגיל הכול עניין של תגובה ומהירות. כאן כל שלב הוא חידה קבועה, ושום דבר לא קורה בלי שתלחצו.",
        },
      ],

      keywords: ["נחש חידות", "משחק נחש", "משחק חשיבה", "חידות היגיון", "משחק תורות"],
    },

    en: {
      name: "Puzzle Snake",
      metaTitle: "Puzzle Snake - a free snake puzzle game online | Ellaz",
      metaDescription:
        "A snake that only moves when you press. Eat every apple, then reach the gold door. 12 levels in two worlds, undo any move, and no way to lose.",

      lede: "Puzzle Snake is snake turned into a puzzle: nothing moves until you press an arrow, every apple makes you one square longer, and the gold door only opens once the last apple is gone. You can undo any move and you can never lose, so the only real question is the order.",

      body: [
        "Nothing moves until you press. One press is one step, and the snake waits for the next as long as you like.",

        "Your body is the puzzle. Every apple adds a square, and the tail follows exactly where the head has been, so the corridor you walked through a moment ago may now be full of you. The head may step into the square the tail is leaving, because the tail moves out on the same press, but it cannot turn back into its own neck or walk through a wall, and the door stays shut until the last apple. A refused press is a small bump of the head and nothing more. Order matters.",

        "There are 12 levels in two worlds. The Garden has six on a 7 by 7 board, where the snake starts 2 or 3 squares long and finds out that the nearest apple is often the wrong one. Tricks has six short levels on 9 by 9, and each brings one new tile: a key that opens every lock, arrows you can only step onto the way they point, and a pair of portals that carry you across the board. One of them, 2-2, is a harder four-room board kept from the first version, where the snake starts 5 long.",

        "We checked every level twice: with a solver that tries every possible sequence of presses, and with a greedy bot that always walks to the nearest apple. The bot finishes the first level in the fewest possible presses, 5. It cannot finish any of the 6 Tricks levels. That is the trap. In Tricks, 9 of the 16 apples leave the level impossible if you eat them first, and if you wall over a level's new tile the solver finds no way through at all. On level 1-2 the order alone decides whether the level takes 11 presses or 17. The whole game at its best is 210 presses.",

        "Stars count your presses. Three at the best possible, two for a detour or two, one for any finish.",
      ],

      howToPlay: [
        {
          title: "Move one square at a time",
          body: "Press an arrow key or W A S D, tap a button on the pad under the board, or swipe across the board. The snake takes exactly one step and stops.",
        },
        {
          title: "Eat every apple",
          body: "Each apple makes the snake one square longer. The gold door is drawn dashed while it is shut and turns solid and bright the moment the last apple is eaten.",
        },
        {
          title: "Walk into the door",
          body: "Put the head in the open door and the level is solved. The band on top of the board tells you before you start how many presses three stars take.",
        },
        {
          title: "Undo, restart, or pick a level",
          body: "Undo takes back one press, as many times as you like. Restart puts the level back to its first frame. Levels opens the map of both worlds, where each level opens once you have solved the one before it.",
        },
      ],

      tips: [
        {
          title: "Count your tail before you go in",
          body: "A corridor with one way in is only safe if there is room to turn inside it or another way out. Before you eat an apple at the end of a dead end, work out how long you will be afterwards.",
        },
        {
          title: "The nearest apple is a question",
          body: "Find the apple that would box you in if you ate it early, and leave it for last. Five of the six Tricks levels have at least one.",
        },
        {
          title: "Borrow the tail's step",
          body: "The square your tail is about to leave is free on the same press. In the tight corners of 2-2 that is often the only way through.",
        },
        {
          title: "Undo costs nothing",
          body: "Nothing is scored until you reach the door, so try a line, look at where your body ends up, and take it back.",
        },
      ],

      teaches: [
        {
          title: "Planning a few moves ahead",
          body: "Every level is solved in your head before it is solved on the board. Pressing without a plan usually ends stuck, which is its own lesson.",
        },
        {
          title: "Order has consequences",
          body: "Which apple you eat first changes everything after it, because the body you leave behind is the wall of your next move.",
        },
        {
          title: "Recovering from a mistake",
          body: "A stuck board is not a loss. Undo turns it into information: now you know which order does not work.",
        },
      ],

      ages: [
        {
          title: "Under 6",
          body: "The first two Garden levels work with the pad and a grown-up nearby. Past that the ordering is usually too much at this age, and that is fine.",
        },
        {
          title: "7 to 12",
          body: "The Garden is the right size. Tricks is a real challenge, and it is usually solved with a lot of undo.",
        },
        {
          title: "Teens and adults",
          body: "Tricks is yours. Three stars on 2-6 means finding the best route, 24 presses long.",
        },
      ],

      accessibility:
        "Nothing is timed and nothing is lost, so it can be played at any pace. Every move is one press: an arrow key or W A S D, the on-screen pad, or a swipe on the board, and no move needs a held or dragged gesture. The door changes shape as well as colour when it opens, from a dashed outline to a solid one, and every button on the page, the level tiles included, has a name a screen reader can say.",

      together: [
        {
          title: "Plan out loud",
          body: "One person holds the phone, the other calls the moves. Only the planner speaks, and the one holding it presses exactly what was said.",
        },
        {
          title: "Race to three stars",
          body: "Two players, one level, two devices. Fewest presses wins, and a tie goes to whoever never used undo.",
        },
        {
          title: "Hunt the trap apple",
          body: "Before anyone moves, each of you guesses which apple would leave the level impossible if it were eaten first. Check with undo.",
        },
      ],

      faq: [
        {
          q: "Can you lose in Puzzle Snake?",
          a: "No. There is no timer and no game over. If the snake has no legal move the board says so, and undo or restart gets you out.",
        },
        {
          q: "What is the number next to the three stars?",
          a: "The fewest presses that solve the level, found by a solver that tried every possible sequence. You cannot beat it, only match it.",
        },
        {
          q: "How do I get two stars?",
          a: "Finish within 20 percent more presses than the best, and always at least 2 more. Any two solutions of the same level differ by an even number of presses, so 2 is the smallest gap there is.",
        },
        {
          q: "Why can't the snake go back the way it came?",
          a: "It cannot turn into its own neck. It can step into the square the tail is leaving, because the tail moves on the same press.",
        },
        {
          q: "How do I open the next level?",
          a: "Solve the one before it, with any number of stars. A locked level still wiggles when you tap it, so you can see where it is.",
        },
        {
          q: "Does Puzzle Snake save my progress?",
          a: "Your best stars for every level are kept on this device, and if you leave halfway through a level it opens exactly where you left it.",
        },
        {
          q: "Is it the same game as Snake?",
          a: "Same snake, same board colours, different game. Snake is about reflexes and speed. Here every level is a fixed puzzle and nothing happens until you press.",
        },
      ],

      keywords: ["puzzle snake", "snake puzzle", "turn based snake", "logic puzzle", "brain game"],
    },

    es: {
      name: "Serpiente enigma",
      metaTitle: "Serpiente enigma - juego de serpiente y lógica | Ellaz",
      metaDescription:
        "Una serpiente que solo se mueve cuando pulsas. Cómete todas las manzanas y llega a la puerta dorada. 12 niveles, deshacer siempre y ninguna forma de perder.",

      lede: "Serpiente enigma es la serpiente de siempre convertida en rompecabezas. Cada pulsación es un paso, cada manzana te alarga una casilla y la puerta dorada no se abre hasta que cae la última. No puedes perder y siempre puedes deshacer, así que lo único que importa es el orden.",

      body: [
        "Aquí nada tiene prisa. La serpiente da un paso por pulsación y después espera. Espera sin límite. Puedes levantarte, volver dentro de diez minutos y seguirá en la misma casilla, mirando hacia el mismo lado.",

        "El problema eres tú.",

        "Cada manzana suma una casilla, y la cola pisa exactamente por donde pasó la cabeza, así que el pasillo que acabas de recorrer puede estar ahora ocupado por tu propio cuerpo. La cabeza sí puede entrar en la casilla que la cola deja libre, porque la cola se mueve en la misma pulsación. Lo que no puede es girarse hacia su propio cuello ni atravesar un muro, y la puerta sigue cerrada mientras quede una manzana. Si un paso no vale, la cabeza da un pequeño respingo y ya está.",

        "Son 12 niveles repartidos en el Jardín y los Trucos. Los seis del Jardín van en un tablero de 7 por 7 y la serpiente empieza con 2 o 3 casillas. Los seis de los Trucos son cortos, en 9 por 9, y cada uno trae una casilla nueva: una llave que abre todos los candados, flechas que solo se pisan en la dirección que señalan y un par de portales que te llevan al otro lado del tablero. El 2-2, un tablero de cuatro salas en el que la serpiente empieza con 5, se queda de la primera versión.",

        "Probamos cada nivel con un programa que prueba todas las secuencias posibles y con un robot glotón que siempre va a la manzana más cercana. El robot termina el primer nivel en el mínimo, 5 pulsaciones, pero no consigue terminar ninguno de los 6 niveles de los Trucos. En los Trucos, 9 de las 16 manzanas dejan el nivel sin solución si te las comes primero, y si tapas con pared la casilla nueva de un nivel, el programa no encuentra ninguna salida. Y en el nivel 1-2, solo el orden decide si necesitas 11 pulsaciones o 17.",
      ],

      howToPlay: [
        {
          title: "Un paso cada vez",
          body: "Usa las flechas del teclado o W A S D, los botones de flecha bajo el tablero, o desliza el dedo sobre el tablero. La serpiente avanza exactamente una casilla y se para.",
        },
        {
          title: "Cómete todas las manzanas",
          body: "Cada manzana te alarga una casilla. La puerta dorada aparece con línea discontinua mientras está cerrada y se vuelve sólida y brillante en cuanto cae la última manzana.",
        },
        {
          title: "Entra por la puerta",
          body: "Lleva la cabeza a la puerta abierta y el nivel queda resuelto. La franja de arriba del tablero te dice desde el principio cuántas pulsaciones dan tres estrellas.",
        },
        {
          title: "Deshacer, reiniciar y elegir nivel",
          body: "Deshacer quita una pulsación, tantas veces como quieras. Reiniciar devuelve el nivel a su primer momento. Niveles abre el mapa del Jardín y de los Trucos, y cada nivel se abre al resolver el anterior.",
        },
      ],

      tips: [
        {
          title: "Cuenta la cola antes de entrar",
          body: "Un pasillo con una sola entrada solo es seguro si dentro hay sitio para girar o hay otra salida. Antes de comerte una manzana al fondo de un callejón, calcula lo larga que vas a ser después.",
        },
        {
          title: "La manzana más cercana es una pregunta",
          body: "Busca la manzana que te encerraría si te la comes pronto y déjala para el final. Cinco de los seis niveles de los Trucos tienen al menos una.",
        },
        {
          title: "Aprovecha el paso de la cola",
          body: "La casilla que la cola está a punto de dejar ya está libre en esa misma pulsación. En las esquinas estrechas del 2-2, muchas veces es el único camino.",
        },
        {
          title: "Deshacer es gratis",
          body: "Nada cuenta hasta que llegas a la puerta. Prueba un camino, mira dónde acaba tu cuerpo y vuelve atrás.",
        },
      ],

      teaches: [
        {
          title: "Pensar varios pasos por delante",
          body: "Cada nivel se resuelve primero en la cabeza. Pulsar sin un plan suele acabar en un atasco, y eso también enseña.",
        },
        {
          title: "El orden tiene consecuencias",
          body: "La manzana que eliges primero cambia todo lo que viene después, porque el cuerpo que dejas atrás es el muro de tu siguiente paso.",
        },
        {
          title: "Recuperarse de un error",
          body: "Quedarse atascado no es perder. Deshacer lo convierte en información: ya sabes qué orden no funciona.",
        },
      ],

      ages: [
        {
          title: "Menos de 6 años",
          body: "Los dos primeros niveles del Jardín se pueden jugar con los botones y un adulto al lado. Más allá, el orden suele ser demasiado para esta edad, y no pasa nada.",
        },
        {
          title: "De 7 a 12 años",
          body: "El Jardín tiene el tamaño justo. Los Trucos son un reto de verdad, y normalmente se resuelve deshaciendo mucho.",
        },
        {
          title: "Adolescentes y adultos",
          body: "Los Trucos son para vosotros. Tres estrellas en el 2-6 significan encontrar el mejor camino, de 24 pulsaciones.",
        },
      ],

      accessibility:
        "No hay reloj ni se pierde nada, así que se juega al ritmo de cada uno. Cada paso es una pulsación: una flecha o W A S D, los botones en pantalla o un deslizamiento sobre el tablero, y ningún paso exige mantener pulsado o arrastrar. La puerta cambia de forma además de color al abrirse, de línea discontinua a línea continua, y todos los botones de la página, también las casillas de nivel, tienen un nombre que un lector de pantalla puede decir.",

      together: [
        {
          title: "Planear en voz alta",
          body: "Uno sujeta el móvil y el otro dicta los pasos. Solo habla quien planea, y quien sujeta pulsa exactamente lo que oye.",
        },
        {
          title: "Carrera a tres estrellas",
          body: "Dos jugadores, un nivel, dos aparatos. Gana quien use menos pulsaciones, y en caso de empate gana quien no haya deshecho nada.",
        },
        {
          title: "Caza la manzana trampa",
          body: "Antes de mover, cada uno apuesta qué manzana dejaría el nivel sin solución si se la comiera primero. Se comprueba con deshacer.",
        },
      ],

      faq: [
        {
          q: "¿Se puede perder en Serpiente enigma?",
          a: "No. No hay reloj ni fin de partida. Si la serpiente no tiene ningún paso posible, el tablero te lo dice, y deshacer o reiniciar te sacan de ahí.",
        },
        {
          q: "¿Qué es el número junto a las tres estrellas?",
          a: "Las pulsaciones mínimas que resuelven el nivel, halladas por un programa que probó todas las secuencias. No se puede mejorar, solo igualar.",
        },
        {
          q: "¿Cómo consigo dos estrellas?",
          a: "Terminando con un 20 por ciento más de pulsaciones que el mínimo como mucho, y siempre con al menos 2 de margen. Dos soluciones del mismo nivel se diferencian en un número par de pulsaciones, así que 2 es la menor diferencia posible.",
        },
        {
          q: "¿Por qué la serpiente no puede volver por donde vino?",
          a: "Porque no puede girarse hacia su propio cuello. Sí puede entrar en la casilla que deja la cola, porque la cola se mueve en la misma pulsación.",
        },
        {
          q: "¿Cómo se abre el siguiente nivel?",
          a: "Resolviendo el anterior, con las estrellas que sean. Un nivel cerrado se sacude cuando lo tocas, para que veas dónde está.",
        },
        {
          q: "¿Se guarda mi progreso?",
          a: "Tus mejores estrellas de cada nivel se guardan en este aparato, y si sales a mitad de un nivel se abre justo donde lo dejaste.",
        },
        {
          q: "¿Es lo mismo que el juego de la serpiente clásico?",
          a: "La misma serpiente y los mismos colores, pero otro juego. El clásico va de reflejos y velocidad. Aquí cada nivel es un rompecabezas fijo y nada pasa hasta que pulsas.",
        },
      ],

      keywords: ["serpiente enigma", "juego de la serpiente", "rompecabezas", "juego de lógica", "juego por turnos"],
    },

    fr: puzzlesnakeFr,

    sv: puzzlesnakeSv,
  },

  provenance: [
    { claim: "12 levels in two worlds, six each", source: "src/games/puzzlesnake/levels.ts" },
    { claim: "The Garden has six on a 7 by 7 board, Tricks has six short levels on 9 by 9", source: "src/games/puzzlesnake/solver.test.ts" },
    {
      claim: "each brings one new tile: a key that opens every lock, arrows you can only step onto the way they point, and a pair of portals",
      source: "src/games/puzzlesnake/tiles.test.ts",
    },
    {
      claim: "the snake starts 2 or 3 squares long in the Garden; 2-2 is kept from the first version, where the snake starts 5 long",
      source: "src/games/puzzlesnake/solver.test.ts",
    },
    { claim: "The bot finishes the first level in the fewest possible presses, 5", source: "src/games/puzzlesnake/solver.test.ts" },
    { claim: "It cannot finish any of the 6 Tricks levels", source: "src/games/puzzlesnake/solver.test.ts" },
    {
      claim: "In Tricks, 9 of the 16 apples leave the level impossible if you eat them first",
      source: "src/games/puzzlesnake/solver.test.ts",
    },
    {
      claim: "if you wall over a level's new tile the solver finds no way through at all",
      source: "src/games/puzzlesnake/solver.test.ts",
    },
    { claim: "Five of the six Tricks levels have at least one", source: "src/games/puzzlesnake/solver.test.ts" },
    { claim: "on level 1-2 the order alone decides whether the level takes 11 presses or 17", source: "src/games/puzzlesnake/solver.test.ts" },
    { claim: "The whole game at its best is 210 presses", source: "src/games/puzzlesnake/solver.test.ts" },
    { claim: "Three stars on 2-6 means finding the best route, 24 presses long", source: "src/games/puzzlesnake/solver.test.ts" },
    {
      claim: "two stars within 20 percent more presses than the best, and always at least 2 more",
      source: "src/games/puzzlesnake/logic.ts",
    },
  ],
};
