import type { GameContent } from "../types";
import { snakearenaSv } from "./sv/snakearena";
import { snakearenaFr } from "./fr/snakearena";

/**
 * Snake Arena. Every number below is read out of `src/games/snakearena/`: the
 * round's length, the bot counts, the starting length, the apple count and both
 * board shapes and the step rate (`logic.ts`), what a bot does (`bots.ts`), the
 * Watch speed (`flow.ts`), the coin milestone (`result.ts`) and the pad's key
 * size (`SnakeArenaGame.tsx`). Nothing here is simulated; the bot ladder in
 * `bots.test.ts` is NOT quoted, because a share measured against a bot is not a
 * promise about a person.
 */
export const snakearena: GameContent = {
  id: "snakearena",

  copy: {
    he: {
      name: "זירת נחשים",
      metaTitle: "זירת נחשים - משחק נחש חינם נגד בוטים | Ellaz",
      metaDescription:
        "הנחש הקלאסי על רשת, בסיבוב של 90 שניות מול 2 עד 5 נחשי מחשב. אוכלים תפוחים, מתרחקים מכל גוף, ומסיימים הכי ארוכים כשהזמן נגמר.",

      lede: "הנחש שאתם מכירים, על לוח גדול יותר, עם חברה. במשך 90 שניות אתם ועד חמישה נחשי מחשב רודפים אחרי אותם תפוחים, ומי שהראש שלו נתקע בקיר או בגוף יוצא. הנחש הכי ארוך שעדיין זז כשהשעון מגיע ל-0:00 מנצח.",

      body: [
        "כולם זזים ביחד. זה כל ההבדל.",

        "בכל צעד כל הנחשים זזים משבצת אחת, באותה מהירות, באותו רגע. החוקים הם אלה שאתם כבר מכירים מהנחש הקלאסי: ראש שיוצא מהלוח או נכנס לגוף כלשהו יוצא מהמשחק, כולל הזנב שלכם. שני ראשים שנפגשים יוצאים שניהם, לא משנה מי ארוך יותר, אז התנגשות חזיתית אף פעם לא דרך לנצח ויכוח. נחש שיוצא מתפוצץ, וכל משבצת שהגוף שלו כיסה הופכת לתפוח. בגלל זה המקום שבו נחש ארוך התרסק הופך פתאום למקום הכי עמוס בלוח.",

        "התפוחים לא נגמרים. על הלוח יש תמיד לפחות שני תפוחים יותר ממספר הנחשים, וכל תפוח מאריך אתכם בחוליה אחת. כל נחש מתחיל ב-3 חוליות, מפוזר על טבעת וזוחל עם כיוון השעון, כך שאף אחד לא מתחיל מול אף אחד.",

        "הסיבוב נמשך 90 שניות. אם נשאר רק נחש אחד לפני כן, הוא מנצח מיד. אחרת הנחש הכי ארוך שעדיין בחיים בצלצול לוקח את הסיבוב.",

        "אתם בוחרים רמה: בקל יש 2 נחשי מחשב וקצב רגוע יותר, ברגיל 3 ובקשה 5. קוראים להם בולט, מוס, אקו, פיפ ופיז, לכל אחד צבע משלו והשם שלו צף מעל הראש. במחשב הלוח הוא 30 על 20 משבצות ודירוג חי רץ לידו. בטלפון הוא מסתובב ל-23 על 32 כדי להיכנס למסך לאורך.",

        "בכרטיס הפתיחה יש עוד שלוש בחירות: הצבע של הנחש שלכם, מפת הסלעים, שבה כמה גושי סלע קטנים עובדים כמו קירות, ובמחשב גם שחקן שני, שמנווט ב-WASD בזמן שאתם נשארים עם החצים.",
      ],

      howToPlay: [
        { title: "להתחיל", body: "לוחצים על שחקו, ואז חץ או החלקה. הנחש שלכם וכל הבוטים מחכים על הלוח עד הכיוון הראשון שלכם, אז שום דבר לא זז לפני שאתם מוכנים." },
        { title: "לנווט", body: "חצים או WASD במחשב, החלקה או ארבעת הכפתורים בטלפון. בהגדרת השליטה אפשר להחליף את הכפתורים בג'ויסטיק, או במקל שמופיע איפה שנוגעים בלוח." },
        { title: "לגדול", body: "מעבירים את הראש מעל תפוח וגדלים בחוליה. נחשים שהתפוצצו משאירים שורה של תפוחים, ששווה לרוץ אליה אם הדרך פנויה." },
        { title: "כשיוצאים", body: "הסיבוב עוצר ומראה באיזה מקום סיימתם. צפייה מריצה את השאר פי שלושה מהר כדי לראות מי מנצח, ושחקו שוב מתחיל סיבוב חדש מיד." },
      ],

      tips: [
        { title: "משאירים דרך החוצה", body: "לפני שנכנסים לרווח בין שני גופים, בודקים לאן הוא מוביל. מבוי סתום נהיה קצר מאוד ברגע שנחש אחר סוגר את הפתח." },
        { title: "לא מתחרים עם ראש על אותו תפוח", body: "אם בוט נמצא משבצת אחת מהתפוח שאתם רוצים, תנו לו אותו. שני ראשים באותה משבצת מוציאים את שניכם, ובכל מקרה התפוחים שבוט משאיר כשהוא מתפוצץ שווים יותר מתפוח אחד." },
        { title: "אורך הוא יתרון וגם סיכון", body: "גוף ארוך חוסם את הלוח לכולם, גם לכם. כשאתם מובילים לקראת הסוף, מפסיקים לרדוף ונשארים בשטח פתוח עד הצלצול." },
        { title: "מסתכלים על הבוטים", body: "כל בוט הולך לתפוח הקרוב שהוא יכול להגיע אליו ונמנע מכיסים קטנים ממנו. מדי פעם אחד מהם מתבלבל ופונה סתם, וזה הרגע שלכם." },
      ],

      teaches: [
        { title: "לקרוא דברים שזזים", body: "שישה דברים זזים על הלוח בבת אחת, ויש צעד אחד להחליט. זו קריאה של תמונה שלמה, לא של מטרה אחת." },
        { title: "לתכנן מקום", body: "נחש שאוכל הוא נחש שתופס יותר מקום. להשאיר יציאה פתוחה זה לתכנן כמה צעדים קדימה." },
        { title: "סיכון וסיכוי", body: "התפוחים הכי טובים יושבים ליד הסכנות הכי גדולות, והמשחק מבקש לבחור כל כמה שניות." },
      ],

      ages: [
        { title: "מגיל 6", body: "שחקן צעיר יכול לנווט בכפתורים הגדולים וללמוד להתרחק מגופים. ברמה קלה, עם 2 בוטים איטיים יותר, הסיבוב סלחני, אבל יציאה עדיין מסיימת אותו." },
        { title: "8 עד 12", body: "3 בוטים ברמה הרגילה, מרוץ אמיתי אחרי תפוחים, והרגע שבו מבינים שהתנגשות חזיתית עולה לשניכם." },
        { title: "נוער ומבוגרים", body: "5 בוטים ברמה הקשה, אולי על מפת הסלעים, שם להישאר בחיים עד הצלצול זו מיומנות בפני עצמה." },
      ],

      accessibility:
        "מנווטים לאורך כל הסיבוב, במקשים, בהחלקה או בארבעה כפתורים גדולים, וצעד מגיע בערך 7 פעמים בשנייה (בערך 5 ברמה הקלה), כך שהמשחק דורש קשב רציף במשך 90 שניות. שום דבר לא דורש הקשה כפולה מהירה או גרירה מדויקת: כל פעולה היא לחיצה אחת, הכפתורים בגודל 64 פיקסלים, והשהיה מקפיאה את הסיבוב בדיוק איפה שהוא.",

      together: [
        { title: "מחליפים תורות", body: "משחקים בתורות באותה רמה ומשווים למה כל אחד הגיע. השיא נשמר בנפרד לכל רמה ולכל מפה." },
        { title: "אחד משחק, אחד מזהיר", body: "אחד מנווט, והשני מסתכל על הלוח ומזהיר כשבוט מתקרב." },
        { title: "צופים בסוף ביחד", body: "כשאחד מכם יוצא, לוחצים על צפייה ומנחשים מי ינצח לפני הצלצול." },
      ],

      faq: [
        { q: "זירת נחשים חינמית?", a: "כן. אין לאן להירשם ואין מה לקנות, והיא עובדת בדפדפן." },
        { q: "איך מנצחים?", a: "מסיימים כנחש הכי ארוך שעדיין בחיים כשהשעון של 90 השניות נגמר, או נשארים הנחש האחרון לפני כן." },
        { q: "מה קורה כששני נחשים מתנגשים ראש בראש?", a: "שניהם יוצאים, לא משנה מה האורך שלהם. שני ראשים שנכנסים לאותה משבצת, או עוברים זה דרך זה, נחשבים אותו דבר." },
        { q: "למה הופיעו תפוחים איפה שהיה נחש?", a: "נחש שיוצא מתפוצץ: כל משבצת בגוף שלו הופכת לתפוח. שם נמצאת הגדילה המהירה." },
        { q: "מול כמה בוטים אפשר לשחק?", a: "שניים ברמה הקלה, שלושה ברגילה וחמישה בקשה. בוחרים בכרטיס הפתיחה, ובמחשב גם בחלונית שליד הלוח." },
        { q: "איך נשמר הניקוד?", a: "השיא שלכם הוא האורך הכי גדול שהנחש הגיע אליו בסיבוב, והוא נשמר על המכשיר לכל רמה ומפה. כל 5 תפוחים שאוכלים מביאים גם מטבע." },
        { q: "אפשר לעצור?", a: "כן, כפתור ההשהיה עוצר את הסיבוב ואת השעון. גם מעבר ללשונית אחרת מחזיק אותו." },
      ],

      keywords: ["משחק נחש", "נחש נגד בוטים", "משחק נחש חינם", "זירת נחשים", "משחק נחש בדפדפן"],
    },

    en: {
      name: "Snake Arena",
      metaTitle: "Snake Arena - Free Snake Game Against Bots | Ellaz",
      metaDescription:
        "Classic grid snake in a 90-second round against 2 to 5 computer snakes. Eat apples, stay clear of every body, and be the longest at the bell.",

      lede: "The snake you know, on a bigger board, with company. For 90 seconds you and up to five computer snakes chase the same apples, and anyone whose head meets a wall or a body is out. The longest snake still moving when the clock reaches 0:00 wins.",

      body: [
        "Everyone moves at once. That is the whole difference.",

        "Every step, all the snakes move together, one cell each, at the same speed. The rules are the ones you already know from the classic: a head that runs off the board or into any body is out, your own tail included. Two heads that meet are both out, whoever is longer, so a head-on is never a way to win an argument. When a snake goes out it bursts, and every cell its body covered becomes an apple, which is why the spot where a long snake crashed is suddenly the busiest place on the board.",

        "Apples keep coming. There are always at least two more on the board than there are snakes, and each one you eat makes you one segment longer. Every snake starts at 3 segments, spread round a ring and heading clockwise, so nobody starts face to face.",

        "The round lasts 90 seconds. If only one snake is left before then, it wins on the spot. Otherwise the longest snake still alive at the bell takes it.",

        "You pick a level: Easy is 2 computer snakes at a gentler pace, Normal is 3 and Hard is 5. They are called Bolt, Moss, Echo, Pip and Fizz, each wears its own colour, and its name floats over its head. On a PC the board is 30 cells by 20 and a live ranking runs beside it. On a phone it turns to 23 by 32 so it fits the screen upright.",

        "The start card has three more choices: your snake's colour, the Rocks map, where a few small clusters of rock work like walls, and on a PC a second player, who steers with WASD while you keep the arrows.",
      ],

      howToPlay: [
        { title: "Start", body: "Press Play, then an arrow or a swipe. Your snake and every bot wait on the board until your first direction, so nothing moves before you are ready." },
        { title: "Steer", body: "Arrow keys or WASD on a PC, a swipe or the four buttons on a phone. The Controls setting swaps the buttons for a joystick, or for a stick that appears wherever you touch the board." },
        { title: "Grow", body: "Run your head over an apple to grow one segment. Burst snakes leave a line of apples behind, worth racing for if the path is clear." },
        { title: "When you are out", body: "The round stops and shows where you finished. Watch plays the rest at three times the speed so you can see who wins, and Play again deals a fresh round straight away." },
      ],

      tips: [
        { title: "Leave yourself a way out", body: "Before turning into a gap between two bodies, look at where it leads. A dead end gets very short the moment another snake closes the mouth." },
        { title: "Do not race a head to the same apple", body: "If a bot is one cell from the apple you want, let it have it. Two heads in one cell put both of you out, and the apples a bot leaves when it bursts are worth more than one apple anyway." },
        { title: "Length is a lead, and a risk", body: "A long body walls off the board for everyone, you included. When you are ahead late in the round, stop chasing and stay in open space until the bell." },
        { title: "Watch the bots", body: "Each bot heads for the nearest apple it can reach and keeps out of pockets smaller than itself. Now and then one slips and takes a random turn, and that is your moment." },
      ],

      teaches: [
        { title: "Reading moving things", body: "Six things move on the board at once, and there is one step to decide. That is reading a whole scene rather than a single target." },
        { title: "Planning space", body: "A snake that eats is a snake that takes up more room. Keeping an exit open is planning a few moves ahead." },
        { title: "Risk and reward", body: "The best apples sit next to the worst dangers, and the game asks you to choose every few seconds." },
      ],

      ages: [
        { title: "From 6", body: "A younger player can steer with the big buttons and learn to stay away from bodies. On Easy, with 2 slower bots, the round is forgiving, but going out still ends it." },
        { title: "8 to 12", body: "Normal's 3 bots, a real race for apples, and the moment you learn that a head-on costs you both." },
        { title: "Teens and adults", body: "Hard's 5 bots, maybe on the Rocks map, where staying alive to the bell is a skill of its own." },
      ],

      accessibility:
        "You steer for the whole round, with keys, a swipe or four large buttons, and a step comes about 7 times a second (about 5 on Easy), so the game asks for steady attention for 90 seconds. Nothing needs a fast double tap or a precise drag: every control is a single press, the buttons are 64 pixels across, and pausing freezes the round exactly where it is.",

      together: [
        { title: "Take turns", body: "Play the same level in turns and compare how long you got. The record is kept separately for each level and map." },
        { title: "One plays, one warns", body: "One of you steers while the other watches the board and calls out when a bot is heading your way." },
        { title: "Watch the end together", body: "When one of you goes out, press Watch and guess the winner before the bell." },
      ],

      faq: [
        { q: "Is Snake Arena free?", a: "Yes. There is nothing to sign up for and nothing to buy, and it plays in the browser." },
        { q: "How do you win?", a: "Be the longest snake still alive when the 90-second clock runs out, or be the last snake left before that." },
        { q: "What happens when two snakes crash head-on?", a: "Both are out, whatever their length. Two heads moving into the same cell, or straight through each other, count the same way." },
        { q: "Why did apples appear where a snake was?", a: "A snake that goes out bursts: every cell of its body becomes an apple. That is where the fast growth is." },
        { q: "How many bots can I play against?", a: "Two on Easy, three on Normal and five on Hard. You choose on the start card, and on a PC in the panel beside the board as well." },
        { q: "How is the score kept?", a: "Your record is the longest your snake got in a round, saved on this device for each level and map. Every 5 apples you eat also earns a coin." },
        { q: "Can I pause?", a: "Yes, the pause button stops the round and the clock. Switching away from the tab holds it too." },
      ],

      keywords: ["snake game", "snake against bots", "snake arena game", "free snake game", "browser snake game"],
    },

    es: {
      name: "Arena de serpientes",
      metaTitle: "Arena de serpientes - Snake gratis contra bots | Ellaz",
      metaDescription:
        "Snake clásico en cuadrícula: una ronda de 90 segundos contra 2 a 5 serpientes del ordenador. Come manzanas, esquiva los cuerpos y termina la más larga.",

      lede: "La serpiente que ya conoces, en un tablero más grande y con compañía. Durante 90 segundos tú y hasta cinco serpientes del ordenador perseguís las mismas manzanas, y quien choca con la cabeza contra una pared o un cuerpo queda fuera. Gana la serpiente más larga que siga moviéndose cuando el reloj llegue a 0:00.",

      body: [
        "Todas se mueven a la vez. Esa es la diferencia.",

        "En cada paso todas las serpientes avanzan juntas, una casilla cada una y a la misma velocidad. Las reglas son las que ya conoces del clásico: una cabeza que se sale del tablero o entra en cualquier cuerpo queda fuera, tu propia cola incluida. Dos cabezas que se encuentran quedan fuera las dos, sea cual sea la más larga, así que un choque de frente nunca sirve para ganar una discusión. Cuando una serpiente queda fuera estalla, y cada casilla que ocupaba su cuerpo se convierte en una manzana. Por eso el sitio donde se estrelló una serpiente larga pasa a ser de golpe el más concurrido del tablero.",

        "Las manzanas no se acaban. Siempre hay al menos dos más que serpientes, y cada una que comes te alarga un segmento. Todas las serpientes empiezan con 3 segmentos, repartidas en un anillo y girando en el sentido de las agujas del reloj, así que nadie empieza cara a cara.",

        "La ronda dura 90 segundos. Si antes queda una sola serpiente, gana en ese mismo instante. Si no, se la lleva la serpiente viva más larga cuando suena la campana.",

        "Tú eliges el nivel: en Fácil hay 2 serpientes del ordenador y un ritmo más tranquilo, en Normal 3 y en Difícil 5. Se llaman Bolt, Moss, Echo, Pip y Fizz, cada una lleva su propio color y su nombre flota sobre la cabeza. En el ordenador el tablero mide 30 casillas por 20 y al lado va una clasificación en directo. En el móvil gira a 23 por 32 para caber en vertical.",

        "La tarjeta de inicio tiene tres opciones más: el color de tu serpiente, el mapa de rocas, donde unos pocos grupos pequeños de rocas hacen de pared, y en el ordenador un segundo jugador, que se mueve con WASD mientras tú sigues con las flechas.",
      ],

      howToPlay: [
        { title: "Empezar", body: "Pulsa Jugar y después una flecha o un deslizamiento. Tu serpiente y todos los bots esperan en el tablero hasta tu primera dirección, así que nada se mueve antes de que estés listo." },
        { title: "Girar", body: "Flechas o WASD en el ordenador, deslizar o los cuatro botones en el móvil. El ajuste de controles cambia los botones por un joystick, o por un mando que aparece donde toques el tablero." },
        { title: "Crecer", body: "Pasa la cabeza por encima de una manzana para crecer un segmento. Las serpientes que estallan dejan una fila de manzanas, y vale la pena correr a por ella si el camino está libre." },
        { title: "Cuando quedas fuera", body: "La ronda se para y te enseña en qué puesto acabaste. Mirar reproduce el resto al triple de velocidad para ver quién gana, y Otra vez empieza una ronda nueva al momento." },
      ],

      tips: [
        { title: "Déjate una salida", body: "Antes de meterte en un hueco entre dos cuerpos, mira adónde lleva. Un callejón se vuelve cortísimo en cuanto otra serpiente le cierra la entrada." },
        { title: "No compitas con una cabeza por la misma manzana", body: "Si un bot está a una casilla de la manzana que quieres, déjasela. Dos cabezas en la misma casilla os dejan fuera a los dos, y las manzanas que suelta un bot al estallar valen más que una sola." },
        { title: "La longitud es ventaja y riesgo", body: "Un cuerpo largo tapa el tablero para todos, también para ti. Si vas por delante al final de la ronda, deja de perseguir y quédate en espacio abierto hasta la campana." },
        { title: "Fíjate en los bots", body: "Cada bot va a la manzana más cercana que puede alcanzar y evita los huecos más pequeños que él. De vez en cuando uno se despista y gira al azar, y ese es tu momento." },
      ],

      teaches: [
        { title: "Leer lo que se mueve", body: "Seis cosas se mueven a la vez y hay un solo paso para decidir. Es leer una escena entera y no un único objetivo." },
        { title: "Planear el espacio", body: "Una serpiente que come ocupa más sitio. Dejarse una salida abierta es planear unas cuantas jugadas por delante." },
        { title: "Riesgo y premio", body: "Las mejores manzanas están junto a los peores peligros, y el juego te pide elegir cada pocos segundos." },
      ],

      ages: [
        { title: "A partir de 6 años", body: "Un jugador pequeño puede guiar con los botones grandes y aprender a alejarse de los cuerpos. En Fácil, con 2 bots más lentos, la ronda perdona bastante, aunque quedar fuera la termina igual." },
        { title: "De 8 a 12", body: "Los 3 bots de Normal, una carrera de verdad por las manzanas y el momento en que descubres que un choque de frente os cuesta a los dos." },
        { title: "Adolescentes y adultos", body: "Los 5 bots de Difícil, quizá en el mapa de rocas, donde seguir vivo hasta la campana ya es una habilidad en sí." },
      ],

      accessibility:
        "Hay que guiar la serpiente durante toda la ronda, con teclas, deslizando o con cuatro botones grandes, y llega un paso unas 7 veces por segundo (unas 5 en Fácil), así que el juego pide atención constante durante 90 segundos. Nada exige un doble toque rápido ni un arrastre preciso: cada control es una sola pulsación, los botones miden 64 píxeles y la pausa congela la ronda justo donde está.",

      together: [
        { title: "Por turnos", body: "Jugad por turnos en el mismo nivel y comparad lo larga que llegó cada serpiente. El récord se guarda por separado para cada nivel y mapa." },
        { title: "Uno juega, otro avisa", body: "Uno guía mientras el otro mira el tablero y avisa cuando un bot se acerca." },
        { title: "Ved el final juntos", body: "Cuando uno de los dos quede fuera, pulsad Mirar y adivinad quién gana antes de la campana." },
      ],

      faq: [
        { q: "¿Arena de serpientes es gratis?", a: "Sí. No hay que registrarse ni comprar nada, y se juega en el navegador." },
        { q: "¿Cómo se gana?", a: "Siendo la serpiente viva más larga cuando se acaba el reloj de 90 segundos, o quedando la última antes de eso." },
        { q: "¿Qué pasa si dos serpientes chocan de frente?", a: "Quedan fuera las dos, sea cual sea su longitud. Dos cabezas que entran en la misma casilla, o que se cruzan atravesándose, cuentan igual." },
        { q: "¿Por qué salen manzanas donde había una serpiente?", a: "Una serpiente que queda fuera estalla: cada casilla de su cuerpo se convierte en una manzana. Ahí es donde se crece rápido." },
        { q: "¿Contra cuántos bots puedo jugar?", a: "Dos en Fácil, tres en Normal y cinco en Difícil. Se elige en la tarjeta de inicio, y en el ordenador también en el panel junto al tablero." },
        { q: "¿Cómo se guarda la puntuación?", a: "Tu récord es lo más larga que llegó tu serpiente en una ronda, guardado en este aparato para cada nivel y mapa. Cada 5 manzanas que comes también dan una moneda." },
        { q: "¿Se puede pausar?", a: "Sí, el botón de pausa para la ronda y el reloj. Cambiar a otra pestaña también la detiene." },
      ],

      keywords: ["juego de la serpiente", "snake contra bots", "snake gratis", "juego de serpientes en el navegador", "arena de serpientes"],
    },

    fr: snakearenaFr,

    sv: snakearenaSv,
  },

  provenance: [
    { claim: "The round lasts 90 seconds", source: "src/games/snakearena/logic.ts" },
    { claim: "Easy is 2 computer snakes, Normal 3 and Hard 5", source: "src/games/snakearena/setup.ts" },
    { claim: "about 5 steps a second on Easy (one every 185 ms)", source: "src/games/snakearena/setup.ts" },
    { claim: "the Rocks map: 6 to 10 rock cells in small clusters, each one a wall", source: "src/games/snakearena/rocks.ts" },
    { claim: "six colours to choose from", source: "src/games/snakearena/colours.ts" },
    { claim: "two players on a PC: P1 on the arrow keys, P2 on WASD", source: "src/games/snakearena/flow.ts" },
    { claim: "Every snake starts at 3 segments", source: "src/games/snakearena/logic.ts" },
    { claim: "always at least two more apples than there are snakes", source: "src/games/snakearena/logic.ts" },
    { claim: "30 cells by 20 on a PC, 23 by 32 on a phone", source: "src/games/snakearena/logic.ts" },
    { claim: "a step comes about 7 times a second (one every 140 ms)", source: "src/games/snakearena/logic.ts" },
    { claim: "Watch plays the rest at three times the speed", source: "src/games/snakearena/flow.ts" },
    { claim: "Every 5 apples you eat also earns a coin", source: "src/games/snakearena/result.ts" },
    { claim: "the buttons are 64 pixels across", source: "src/games/snakearena/SnakeArenaGame.tsx" },
    {
      claim: "Each bot heads for the nearest apple it can reach, keeps out of pockets smaller than itself, and now and then takes a random turn",
      source: "src/games/snakearena/bots.ts",
    },
  ],
};
