import type { GameContent } from "../types";
import { holdthelineSv } from "./sv/holdtheline";
import { holdthelineFr } from "./fr/holdtheline";

/**
 * Hold the Line. Every number below is read out of `src/games/holdtheline/` -
 * the campaign's length and `CAMPAIGN_WAVES`, the six walker kinds and the
 * shooter's standoff, the four shop lines and the wave each counter appears on,
 * the wall and house pools, and the 45% price climb. Nothing here is simulated;
 * it is all a constant already declared in those files, so a retune either shows
 * up here or this page starts quoting a number the game no longer has.
 *
 * The one figure that is NOT a constant is the fifteen minutes, which was
 * measured rather than declared - see `provenance` below, and the caveat that
 * comes with it.
 */
export const holdtheline: GameContent = {
  id: "holdtheline",

  copy: {
    he: {
      name: "להחזיק את הקו",
      metaTitle: "להחזיק את הקו - משחק מצור חינם | Ellaz",
      metaDescription:
        "מצור בנתיב אחד: המצודה משמאל, הגלים מגיעים מימין. בין גל לגל הכסף שהרווחתם קונה נשק, שומרים ומלכודות בנתיב.",

      lede: "המצודה שלכם נמצאת בקצה השמאלי של המסך, וכל מי שרוצה להפיל אותה צריך לחצות נתיב ארוך כדי להגיע אליה. אתם מכוונים, אתם יורים, וכל מה שנופל משלם. בין גל לגל אף אחד לא הולך - וזה בדיוק הרגע שבו הכסף הופך לנשק טוב יותר, לשומרים על הגג, או ליתדות שנעוצות בנתיב.",

      body: [
        "הנתיב הוא כל ההבדל. הוא באורך 900 יחידות. מי שנכנס מימין צריך זמן כדי לחצות אותו, והזמן הזה הוא בדיוק מה שיש לכם כדי לעצור אותו. שום דבר אחר לא קובע את רמת הקושי - לא השטח ולא השמיים, רק המרחק והטווח של מה שאתם מחזיקים ביד.",

        "שישה סוגים חוצים את הנתיב, וכל אחד מהם קיים כי קיימת לו תשובה. החייל הרגלי הולך ומכה בחומה. הרץ רזה ומהיר, והוא מעניש טעינה מחדש שנעשתה ברגע הלא נכון. הרכב איטי, סופג המון ופוגע חזק כשהוא מגיע - וזו כל הסיבה שקיים משגר הטילים. היורה עוצר בדיוק 440 יחידות מהחומה ולעולם לא מתקרב: לא מוקש ולא יתד נוגעים בו, רק טווח, ולכן הצלף עולה כסף. היחידה המעופפת מתעלמת לחלוטין מכל הגנה קרקעית. ובגל ה-20 מגיע משהו כבד עם פס חיים משלו.",

        "החנות היא תחזית, לא רשימת קניות. כל תשובה מופיעה על המדף גל אחד לפני האיום שהיא עונה לו: משגר הטילים בשישי, הצלף בתשיעי, הנגד-מטס בשנים-עשר. מי שקונה את מה שנוצץ היום מופתע מחרתיים, וזה כל המשחק.",

        "עשרים גלים והמערכה נוצחה. אחר כך הנתיב ממשיך לשלוח, מהר יותר ויותר, עד שהמצודה נופלת - ואז נשאר רק הניקוד. סיבוב מנצח נמשך כרבע שעה, מה שהופך אותו לארוך ביותר באתר בפער גדול: זו נסיעה שלמה באוטובוס, לא הפסקה של שלוש דקות.",

        "החומה סופגת לפני הבית. היא מתחילה עם 260 נקודות, ולמצודה שמאחוריה יש 500. תיקון החומה עולה אותו דבר לאורך כל הסיבוב, בכוונה: זו הקנייה היחידה שמי שמפסיד חייב תמיד להיות מסוגל לעשות שוב, ותיקון שמחירו מטפס הופך גל אחד גרוע לסיבוב אבוד מראש. כל השאר מתייקר ב-45 אחוז לכל עותק, כדי שאי אפשר יהיה לחסוך תשעה גלים ולקנות את כל החנות בעשירי.",

        "הכסף של המצור לא קשור למטבעות שלכם. הוא נולד בסיבוב, מתבזבז בסיבוב ומת איתו. אין שער חליפין בין השניים ולעולם לא יהיה.",
      ],

      howToPlay: [
        { title: "לכוון ולירות", body: "נוגעים במקום שבו רוצים לירות - באצבע בטלפון, בעכבר במחשב. לחיצה ממושכת ממשיכה לירות, אבל נגיעה אחת תמיד מספיקה: שום דבר כאן לא דורש להחזיק את האצבע." },
        { title: "לטעון מחדש", body: "המחסנית נטענת לבד כשהיא מתרוקנת. המקש R טוען מראש, וזה עדיף על להישאר ריקים כשרץ מגיע." },
        { title: "בין הגלים", body: "אף אחד לא הולך ואין לחץ. המדף נפרש מעל הנתיב, ואתם קונים כמה שתרצו לפני שלוחצים על הכפתור ששולח את הבא." },
        { title: "לתקן", body: "החומה סופגת לפני הבית. את הבית אי אפשר לתקן: כשהוא נופל, הסיבוב נגמר." },
      ],

      tips: [
        { title: "תקנו את הגל הבא", body: "מה שמגיע בשביעי מתכוננים אליו בשישי. תסתכלו על המדף - מה שהרגע הופיע הוא כמעט תמיד התשובה למשהו שעוד לא הגיע." },
        { title: "יורה לעולם לא מגיע אליכם", body: "אין טעם למקש בשבילו את הנתיב. הוא עוצר רחוק ויורה; צריך להגיע אליו עם טווח, ולרובאי שלכם אין מספיק." },
        { title: "השמיים הם משחק נפרד", body: "לא חומה, לא מוקש, לא יתד ולא רובאי נוגעים במה שעף. בלי נגד-מטס, הגל השלושה-עשר פשוט עובר מעל כל מה ששילמתם עליו." },
        { title: "חומה מתוקנת שווה שומר", body: "מצודה חצי הרוסה מסיימת את הסיבוב מוקדם יותר ממחסנית קצרה מדי. תקנו בזמן שזו הוצאה ולא הצלה." },
      ],

      teaches: [
        { title: "לחשוב קדימה", body: "להוציא כסף על סכנה שעוד לא רואים זה הרגל שלא בא מעצמו, והמשחק דורש אותו בכל גל." },
        { title: "לבחור", body: "כל מטבע שהולך לכאן לא הולך לשם. המשחק אף פעם לא אומר איזו קנייה הייתה נכונה - הגל הבא אומר." },
        { title: "לכוון", body: "לבחור מטרה בתוך המון, ולדעת מי מגיע ראשון, זו מיומנות בפני עצמה." },
      ],

      ages: [
        { title: "מגיל 8", body: "צריך לכוון, לספור ולתכנן בו-זמנית. ילד צעיר יותר יסתדר ברמה רגועה, אבל סיבוב שלם הוא ארוך." },
        { title: "נוער ומבוגרים", body: "הרמה הפראית שולחת גלים גדולים, מהירים ועמידים יותר, ומשלמת פחות על כל גוף." },
        { title: "מבוגרים לבד", body: "תוספת הזמן שאחרי גל 20 היא החלק שנבנה למי שרודף אחרי מספר ולא אחרי סוף." },
      ],

      accessibility:
        "הכול משוחק בנגיעות: שום דבר לא דורש להחזיק את האצבע או לגרור. המקלדת עובדת במחשב, המטרות גדולות, ואף כרטיס בחנות אף פעם לא מושבת - כרטיס שאין עליו כסף עדיין עונה, בתזוזה קטנה, במקום לשתוק.",

      together: [
        { title: "אחד מכוון, אחד קונה", body: "שניים על אותו מסך: אחד יורה במהלך הגל, השני מחליט על הקניות ביניהם. אלה שני תפקידים שונים, והוויכוח הוא חצי מהכיף." },
        { title: "לנחש מה בא", body: "לפני שלוחצים על הכפתור, תשאלו מה מגיע. לטעות ביחד עדיף על לקנות באקראי." },
        { title: "לחלק את ארבעת הרַיִם", body: "כל אחד לוקח שני רַיִם בחנות - אחד על הנשק והשדרוגים, השני על השומרים והנתיב - ורואים איזה זוג החלטות הגיע רחוק יותר." },
      ],

      faq: [
        { q: "כמה זמן לוקח סיבוב?", a: "מערכה מנצחת נמשכת בערך רבע שעה. זה בכוונה המשחק הארוך באתר, ומסך הפתיחה אומר את זה לפני שמתחילים." },
        { q: "מה קורה אחרי הגל העשרים?", a: "המערכה נוצחה, והנתיב ממשיך בכל זאת. הגלים מטפסים תלול יותר מקודם, כי בשלב הזה כל החנות כבר שלכם, ונשאר רק ניקוד." },
        { q: "הכסף במשחק הופך למטבעות?", a: "לא, אף פעם. זה מטבע פנימי לסיבוב; הוא לא נוגע בארנק שלכם ואין שער חליפין בין השניים." },
        { q: "אפשר לנצח בלי לקנות כלום?", a: "לא. מי שלא מוציא כלום נופל בין הגל החמישי לתשיעי, תלוי ברמה. החנות היא לא קישוט." },
        { q: "צריך מסך לרוחב?", a: "המשחק בנוי למסך רחב ומתאים את עצמו לצורת החלון, אבל אורך הנתיב תמיד נשאר זהה - זה אף פעם לא קל יותר במסך גדול." },
        { q: "ההתקדמות נשמרת אם יוצאים?", a: "בין הגלים, כן. סיבוב נשמר במסך החנות ולעולם לא באמצע גל, אז חוזרים בדיוק לרגע שלפני שליחת הגל הבא, עם הכסף." },
      ],

      keywords: ["משחק מצור", "הגנה על בסיס", "טאוור דיפנס", "משחק ירי חינם", "גלי אויבים"],
    },

    en: {
      name: "Hold the Line",
      metaTitle: "Hold the Line - Free Siege Game | Ellaz",
      metaDescription:
        "A siege in one lane: your keep on the left, waves walking in from the right. Between waves the cash you earned buys guns, guards and traps in the lane.",

      lede: "Your keep holds the left edge of the screen, and everything that wants it down has to walk a long lane to get there. You aim, you fire, and everything that falls pays. Between waves nothing is walking - that is when money turns into a better gun, guards on the roof, or stakes driven into the lane.",

      body: [
        "The lane is the whole difference. It is 900 units long. Something that enters from the right needs time to cross it, and that time is exactly what you have to stop it. Nothing else sets the difficulty - not the floor area, not the sky, only the distance and the reach of whatever you are holding.",

        "Six kinds cross that lane and each one exists because an answer exists. The foot soldier walks up and hits the wall. The runner is thin and fast and punishes a reload taken at the wrong moment. The vehicle is slow, soaks up an enormous amount and hits hard on arrival - which is the entire reason the rocketeer is for sale. The shooter stops dead 440 units short of the wall and never closes: no mine and no stake touches it, only reach does, and that is why the marksman costs money. The air unit ignores every ground defence you own. And on wave 20 something heavy walks in with a health bar of its own.",

        "The shop is a forecast, not a shopping list. Every counter appears on the shelf one wave BEFORE the threat it answers: the rocketeer at six, the marksman at nine, the sky guard at twelve. A player who buys whatever looks good today gets caught out the day after tomorrow. That is the whole game.",

        "Twenty waves and the campaign is won. After that the lane keeps sending them, faster and faster, until the keep falls - and then there is only a score. A winning run takes about a quarter of an hour, which makes it far and away the longest thing on this site: a whole bus ride, not a three-minute break.",

        "The wall takes damage before the house does. It starts with 260 points and the keep behind it has 500. Repairing the wall costs the same all run, deliberately: it is the one purchase a losing player must always be able to make again, and a repair whose price climbs turns one bad wave into a run that was lost before it started. Everything else climbs 45 per cent per copy, so nobody can hoard for nine waves and buy the entire shop on the tenth.",

        "The siege's cash has nothing to do with your coins. It is created by the run, spent by the run, and dies with it. There is no exchange rate. There never will be.",
      ],

      howToPlay: [
        { title: "Aim and fire", body: "Tap where you want to shoot - with a finger on a phone, with the mouse on a PC. Holding down keeps firing, but a single tap is always enough: nothing here asks you to hold a finger down." },
        { title: "Reload", body: "The magazine reloads itself once it is empty. R reloads early, which beats standing empty when a runner arrives." },
        { title: "Between waves", body: "Nothing is walking and nothing is rushing you. The shelf is drawn over the lane, and you spend as much as you like before pressing the button that sends the next one." },
        { title: "Repair", body: "The wall absorbs before the house does. The house cannot be repaired: when it falls, the run is over." },
      ],

      tips: [
        { title: "Buy for the wave after this one", body: "What arrives on seven is prepared for on six. Watch the shelf - whatever has just appeared is almost always the answer to something that has not arrived yet." },
        { title: "A shooter never reaches you", body: "There is no point mining the lane for it. It stops far out and shoots back; it has to be reached with range, and your rifleman does not have enough." },
        { title: "The sky is a separate game", body: "No wall, no mine, no stake and no rifleman touches anything that flies. Without a sky guard, wave thirteen simply passes over everything you paid for." },
        { title: "A repaired wall is worth a guard", body: "A half-wrecked keep ends the run sooner than a slightly short magazine does. Repair while it is still an expense and not a rescue." },
      ],

      teaches: [
        { title: "Thinking ahead", body: "Spending on a danger you cannot see yet is a habit that does not arrive on its own, and this game asks for it every single wave." },
        { title: "Choosing", body: "Every coin spent here is not spent there. The game never tells you which purchase was right - the next wave does." },
        { title: "Aiming", body: "Picking a target out of a crowd, and knowing which one arrives first, is a skill in its own right." },
      ],

      ages: [
        { title: "From 8", body: "You have to aim, count and plan at the same time. A younger child manages on Calm, but a whole run is long." },
        { title: "Teenagers and adults", body: "Wild sends bigger, faster and tougher waves, and pays less per body." },
        { title: "Grown-ups on their own", body: "The overtime past wave 20 is the part built for someone chasing a number rather than an ending." },
      ],

      accessibility:
        "Everything is played with taps: nothing asks you to hold a finger down or to drag. The keyboard works on a PC, the targets are large, and no shop card is ever disabled - a card you cannot afford still answers, with a small movement, rather than staying silent.",

      together: [
        { title: "One aims, one buys", body: "Two of you at one screen: one shoots during the wave, the other decides the spending between them. They are two different jobs, and arguing about it is half the fun." },
        { title: "Guess what is coming", body: "Before pressing the button, ask what arrives next. Guessing wrong together beats buying at random." },
        { title: "Split the four lines", body: "Take two shop lines each - one of you owns the guns and the powers, the other the guards and the lane - and see which pair of choices got further." },
      ],

      faq: [
        { q: "How long is a run?", a: "A winning campaign runs about a quarter of an hour. It is deliberately the longest game on the site, and the entrance screen says so before you start." },
        { q: "What happens after wave twenty?", a: "The campaign is won and the lane carries on anyway. The waves climb more steeply than before, because by then you own the whole shop, and all that is left is a score." },
        { q: "Does the game's cash turn into coins?", a: "No, never. It is a currency inside the run; it does not touch your wallet and there is no exchange rate between the two." },
        { q: "Can you win without buying anything?", a: "No. A player who spends nothing falls between wave five and wave nine depending on the difficulty. The shop is not decoration." },
        { q: "Does the screen have to be landscape?", a: "The game is built for a wide screen and fits itself to the shape of your window, but the lane always keeps the same length - it is never easier on a big screen." },
        { q: "Is my progress saved if I leave?", a: "Between waves, yes. A run is saved on the shop screen and never in the middle of a wave, so you come back to the moment before you sent the next one, with your cash." },
      ],

      keywords: ["siege game", "base defence", "tower defense", "free shooting game", "enemy waves"],
    },

    es: {
      name: "Aguanta la línea",
      metaTitle: "Aguanta la línea - juego de asedio gratis | Ellaz",
      metaDescription:
        "Un asedio en un solo camino: tu fortaleza a la izquierda, las oleadas llegan por la derecha. Entre oleadas el dinero compra armas, guardias y trampas.",

      lede: "Tu fortaleza ocupa el borde izquierdo de la pantalla y todo lo que quiere derribarla tiene que recorrer un camino largo para llegar. Apuntas, disparas, y todo lo que cae paga. Entre oleadas no camina nadie: ese es justo el momento en que el dinero se convierte en mejor arma, en guardias sobre el tejado, o en estacas clavadas en el camino.",

      body: [
        "El camino lo es todo. Mide 900 unidades. Quien entra por la derecha necesita tiempo para cruzarlo, y ese tiempo es exactamente el que tienes para detenerlo. Nada más decide la dificultad: ni la superficie ni el cielo, solo la distancia y el alcance de lo que llevas en la mano.",

        "Seis clases cruzan ese camino y cada una existe porque existe una respuesta. El soldado de a pie camina y golpea el muro. El corredor es flaco y rápido, y castiga una recarga hecha en mal momento. El vehículo es lento, aguanta muchísimo y pega fuerte al llegar: esa es toda la razón de ser del lanzacohetes. El tirador se detiene en seco a 440 unidades del muro y no se acerca jamás: ni mina ni estaca lo tocan, solo el alcance, y por eso el tirador de élite cuesta dinero. La unidad voladora ignora por completo cualquier defensa de tierra. Y en la oleada 20 llega algo pesado con su propia barra de vida.",

        "La tienda es un pronóstico, no una lista de la compra. Cada respuesta aparece en el estante una oleada ANTES de la amenaza a la que responde: el lanzacohetes en la sexta, el tirador de élite en la novena, el antiaéreo en la duodécima. Quien compra lo que brilla hoy se lleva la sorpresa pasado mañana. Ahí está el juego entero.",

        "Veinte oleadas y la campaña está ganada. Después el camino sigue mandando gente, cada vez más rápido, hasta que la fortaleza cae, y entonces solo queda la puntuación. Una partida ganada dura un cuarto de hora, lo que la convierte con diferencia en la más larga del sitio: un viaje entero en autobús, no una pausa de tres minutos.",

        "El muro encaja antes que la casa. Empieza con 260 puntos y la fortaleza detrás tiene 500. Reparar el muro cuesta lo mismo durante toda la partida, a propósito: es la única compra que alguien que va perdiendo siempre debe poder repetir, y una reparación con precio creciente convierte una mala oleada en una partida perdida de antemano. Todo lo demás sube un 45 por ciento por copia, para que nadie pueda ahorrar nueve oleadas y comprar la tienda entera en la décima.",

        "El dinero del asedio no tiene nada que ver con tus monedas. Nace en la partida, se gasta en la partida y muere con ella. No hay cambio. Nunca lo habrá.",
      ],

      howToPlay: [
        { title: "Apuntar y disparar", body: "Toca donde quieras disparar: con el dedo en el móvil, con el ratón en el ordenador. Mantener pulsado sigue disparando, pero un toque siempre basta: aquí nada te pide mantener el dedo apoyado." },
        { title: "Recargar", body: "El cargador se recarga solo cuando se vacía. La tecla R recarga antes, lo que es mejor que quedarse seco cuando llega un corredor." },
        { title: "Entre oleadas", body: "No camina nadie y nada te mete prisa. El estante se dibuja sobre el camino y gastas lo que quieras antes de pulsar el botón que manda la siguiente." },
        { title: "Reparar", body: "El muro encaja antes que la casa. La casa no se repara: cuando cae, la partida se acaba." },
      ],

      tips: [
        { title: "Compra para la oleada siguiente", body: "Lo que llega en la séptima se prepara en la sexta. Mira el estante: lo que acaba de aparecer es casi siempre la respuesta a algo que todavía no ha llegado." },
        { title: "Un tirador nunca llega hasta ti", body: "No sirve de nada minarle el camino. Se para lejos y dispara; hay que alcanzarlo con alcance, y tu fusilero no tiene suficiente." },
        { title: "El cielo es otro juego", body: "Ni muro, ni mina, ni estaca, ni fusilero tocan nada que vuele. Sin antiaéreo, la oleada trece pasa sencillamente por encima de todo lo que has pagado." },
        { title: "Un muro reparado vale un guardia", body: "Una fortaleza medio destrozada termina la partida antes que un cargador un poco corto. Repara mientras es un gasto y no un rescate." },
      ],

      teaches: [
        { title: "Anticipar", body: "Gastar en un peligro que todavía no se ve es una costumbre que no llega sola, y este juego la pide en cada oleada." },
        { title: "Elegir", body: "Cada moneda gastada aquí no se gasta allí. El juego nunca dice qué compra era la buena: lo dice la oleada siguiente." },
        { title: "Apuntar", body: "Elegir un blanco entre una multitud, y saber cuál llega primero, es una habilidad por sí sola." },
      ],

      ages: [
        { title: "A partir de 8 años", body: "Hay que apuntar, contar y planificar a la vez. Un niño más pequeño se maneja en Tranquilo, pero una partida entera es larga." },
        { title: "Adolescentes y adultos", body: "Salvaje manda oleadas más grandes, más rápidas y más duras, y paga menos por cuerpo." },
        { title: "Adultos a solas", body: "El tiempo extra a partir de la oleada 20 es la parte hecha para quien persigue un número y no un final." },
      ],

      accessibility:
        "Todo se juega con toques: nada pide mantener el dedo apoyado ni arrastrar. El teclado funciona en el ordenador, los blancos son grandes, y ninguna carta de la tienda está nunca desactivada: una carta que no te puedes permitir responde igualmente, con un movimiento pequeño, en lugar de quedarse callada.",

      together: [
        { title: "Uno apunta, otro compra", body: "Dos en una misma pantalla: uno dispara durante la oleada, el otro decide los gastos entre una y otra. Son dos trabajos distintos, y discutirlo es la mitad de la gracia." },
        { title: "Adivinar lo que viene", body: "Antes de pulsar el botón, preguntad qué llega. Equivocarse juntos es mejor que comprar al azar." },
        { title: "Repartíos las cuatro filas", body: "Dos filas de la tienda cada uno - uno lleva las armas y las mejoras, el otro los guardias y el camino - y a ver qué pareja de decisiones llega más lejos." },
      ],

      faq: [
        { q: "¿Cuánto dura una partida?", a: "Una campaña ganada ronda el cuarto de hora. Es a propósito el juego más largo del sitio, y la pantalla de entrada lo dice antes de empezar." },
        { q: "¿Qué pasa después de la oleada veinte?", a: "La campaña está ganada y el camino sigue igualmente. Las oleadas suben más deprisa que antes, porque a esas alturas ya tienes toda la tienda, y solo queda la puntuación." },
        { q: "¿El dinero del juego se convierte en monedas?", a: "No, nunca. Es una moneda interna de la partida; no toca tu monedero y no hay cambio entre las dos." },
        { q: "¿Se puede ganar sin comprar nada?", a: "No. Quien no gasta cae entre la oleada cinco y la nueve según la dificultad. La tienda no es un adorno." },
        { q: "¿Hace falta la pantalla apaisada?", a: "El juego está hecho para una pantalla ancha y se adapta a la forma de tu ventana, pero el camino siempre conserva la misma longitud: nunca es más fácil en una pantalla grande." },
        { q: "¿Se guarda la partida si me voy?", a: "Entre oleadas, sí. La partida se guarda en la pantalla de la tienda y nunca en mitad de una oleada, así que vuelves justo al momento anterior a mandar la siguiente, con tu dinero." },
      ],

      keywords: ["juego de asedio", "defensa de base", "tower defense", "juego de disparos gratis", "oleadas de enemigos"],
    },

    fr: holdthelineFr,

    sv: holdthelineSv,
  },

  provenance: [
    { claim: "440 units short of the wall", source: "src/games/holdtheline/logic.ts" },
    { claim: "900 units long", source: "src/games/holdtheline/logic.ts" },
    { claim: "260 points and the keep behind it has 500", source: "src/games/holdtheline/logic.ts" },
    { claim: "twenty waves", source: "src/games/holdtheline/waves.ts" },
    { claim: "the rocketeer at six, the marksman at nine, the sky guard at twelve", source: "src/games/holdtheline/shop.ts" },
    { claim: "45 per cent per copy", source: "src/games/holdtheline/shop.ts" },
    {
      // MEASURED rather than declared, and it is the one figure here that is
      // not a constant: 16.2 minutes of wave time for a winning normal
      // campaign, read 2026-09-26 off a headless bot that never pauses in the
      // shop. It is a FLOOR for that reason, which is why the prose says "about
      // a quarter of an hour" rather than a precise number.
      claim: "about a quarter of an hour",
      source: "src/games/holdtheline/logic.test.ts",
    },
    { claim: "falls between wave five and wave nine", source: "src/games/holdtheline/logic.test.ts" },
  ],
};
