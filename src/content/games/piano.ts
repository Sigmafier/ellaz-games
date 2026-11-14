import type { GameContent } from "../types";
import { pianoSv } from "./sv/piano";
import { pianoFr } from "./fr/piano";

/**
 * Piano - the second game in `create`, beside Music Box. An instrument to play,
 * three keyboards from ten coloured keys to two sliding octaves, and a songs
 * mode that waits on the next note of a children's song.
 *
 * Every number the prose quotes is read straight out of the game's own code:
 * the key counts and the range from `keysFor` / `LOWEST` / `HIGHEST`, the
 * computer-key map from `KEY_OFFSETS`, the song lengths from `SONGS`, the demo
 * tempo from `BEAT_MS`. `logic.test.ts` pins the counts - ten, seventeen and
 * twenty-five keys - and that every song fits the ten-key keyboard. See
 * `provenance` at the bottom.
 *
 * The admission is the scoreboard: there is none. Free play keeps no record,
 * like Music Box and the colouring book, and a finished song pays a reward
 * without ranking how it was played.
 */
export const piano: GameContent = {
  id: "piano",

  copy: {
    he: {
      name: "פסנתר",
      metaTitle: "פסנתר אונליין חינם - לנגן וללמוד שירי ילדים | Ellaz",
      metaDescription:
        "פסנתר חינמי בדפדפן, בטלפון ובמחשב. שלוש מקלדות, מעשרה קלידים צבעוניים לילדים ועד שתי אוקטבות עם פדל, וחמישה שירי ילדים ללמוד צעד אחר צעד.",

      lede: "פסנתר חינם בדפדפן. נוגעים בקליד והוא מנגן, אפשר כמה אצבעות ביחד, ובמחשב גם מהמקלדת. במצב שירים הפסנתר מראה איזה קליד בא עכשיו ומחכה לכם, בלי שעון ובלי טעויות.",

      body: [
        "נוגעים. זה מנגן.",

        "יש שלוש מקלדות. הבסיסית היא עשרה קלידים לבנים מדו האמצעי ועד מי שאוקטבה מעליו, כל קליד בצבע משלו ועם השם שלו כתוב עליו. המתקדמת מוסיפה את שבעת הקלידים השחורים על אותו טווח, כלומר 17 קלידים. ובמקצוענית, במחשב, יש 25 קלידים, שתי אוקטבות שלמות, שזזות אוקטבה למעלה או למטה בלחיצה, מ-C2 ועד C7. בטלפון היא נשארת 17 קלידים, כי 25 קלידים על מסך של טלפון זה קלידים שאצבע לא פוגעת בהם.",

        "במצב שירים יש חמישה שירים, וגלגלי האוטובוס ואיפה האצבע הם הראשונים ברשימה. השיר הקצר ביותר, יונתן הקטן, הוא 24 תווים, והארוך, נצנץ כוכב קטן, הוא 42. כל התווים בכל חמשת השירים יושבים על קלידים לבנים בין דו למי, ולכן כל שיר אפשר לנגן גם על המקלדת של עשרת הקלידים. בדקנו את זה בקוד ולא רק הבטחנו.",

        "וקליד לא נכון? הוא פשוט מנגן. השיר נשאר לחכות על אותו תו, והקליד שהוא רוצה עושה תזוזה קטנה. אין פסילה ואין ספירת טעויות.",

        "וההודאה: אין כאן ניקוד. בנגינה חופשית לא נשמר שום שיא, כמו בתיבת הנגינה ובמשחק הצביעה, כי הדרך היחידה לדרג נגינה של ילד היא לשפוט אותה. מי שמסיים שיר מקבל מטבעות וכוכב, וזהו. אף אחד לא בודק כמה מהר.",
      ],

      howToPlay: [
        { title: "נוגעים בקליד", body: "כל נגיעה מנגנת. אפשר לשים כמה אצבעות ביחד ולנגן אקורד, ואפשר להחליק אצבע לאורך הקלידים." },
        { title: "בוחרים מקלדת", body: "בסיסית, מתקדמת או מקצוענית. ככל שעולים יש יותר קלידים ופחות עזרה." },
        { title: "עוברים לשירים", body: "בוחרים שיר, ומנגנים את הקליד שמואר. הפס שמעל הקלידים מראה את התווים הבאים." },
        { title: "מקשיבים קודם", body: "כפתור ההאזנה מנגן את השיר כולו ומדליק כל קליד בזמן שהוא נשמע." },
        { title: "מנגנים מהמקלדת", body: "במחשב השורה A S D F היא הקלידים הלבנים והשורה שמעליה השחורים. במקצוענית Z ו-X מזיזים אוקטבה." },
      ],

      tips: [
        {
          title: "האזינו לפני שמנגנים",
          body: "שיר ששמעתם פעם אחת קל הרבה יותר לנגן. האוזן כבר יודעת לאן הוא הולך, והאצבע רק צריכה למצוא את הקליד.",
        },
        {
          title: "צבע לפני שם",
          body: "במקלדת הבסיסית לכל תו יש צבע, והתו הבא בפס מופיע באותו צבע. ילד שעוד לא קורא יכול להתאים צבע לצבע.",
        },
        {
          title: "עלו מקלדת כשזה נהיה קל",
          body: "במתקדמת הקליד הבא מסומן רק בנקודה קטנה, ובמקצוענית בכלל לא. זה אותו שיר, ופתאום צריך לזכור אותו.",
        },
        {
          title: "הפדל משנה הכול",
          body: "עם הפדל כל תו מצלצל הרבה יותר זמן. לאקורדים ולמנגינות איטיות זה נשמע גדול, ולמהירות זה נהיה מבולגן.",
        },
      ],

      teaches: [
        { title: "גובה צליל", body: "שמאלה נמוך, ימינה גבוה. אחרי כמה דקות על הקלידים הקשר הזה נשאר." },
        { title: "שמות התווים", body: "דו, רה, מי כתובים על הקלידים, ובפס שמעליהם. הם נלמדים מהשימוש, לא משינון." },
        { title: "מנגינה כרצף", body: "שיר הוא תו אחרי תו. כשהפסנתר מחכה לתו הבא, הילד מרגיש את הרצף צעד אחר צעד." },
        { title: "התמדה בלי לחץ", body: "אין שעון ואין פסילה, אז אפשר לנסות שוב ושוב עד שהמנגינה יוצאת שלמה." },
      ],

      ages: [
        { title: "3 עד 4", body: "המקלדת הבסיסית ונגינה חופשית. כל נגיעה עושה צליל, וזה מספיק." },
        { title: "5 עד 7", body: "שירים במקלדת הבסיסית. הקליד הבא זוהר, וגלגלי האוטובוס הוא מקום טוב להתחיל." },
        { title: "8 ומעלה", body: "המקלדת המתקדמת, ואז אותם שירים כשרק נקודה מסמנת את התו הבא." },
        { title: "מבוגרים", body: "המקצוענית, שתי אוקטבות במחשב, הפדל, ונגינה מהמקלדת של המחשב." },
      ],

      accessibility:
        "כל קליד מנגן בנגיעה אחת, בלי גרירה ובלי החזקה, כך שהמשחק עובד גם עם אמצעי קלט חלופיים. החלקה על הקלידים היא תוספת ולא חובה. כל קליד הוא כפתור עם שם התו שלו, ואפשר להגיע אליו במקלדת ולנגן בו באנטר. אין שעון ואין ספירה לאחור. ובכנות: זה כלי נגינה, ובלי שמע הולך ממנו הרבה. הצבעים, השמות והפס שמעל הקלידים מראים מה מנגנים גם בלי לשמוע, אבל לא מחליפים את הצליל. ההאזנה נעצרת לבד כשעוברים ללשונית אחרת.",

      together: [
        { title: "ארבע ידיים", body: "אחד מנגן את המנגינה במצב שירים, השני מוסיף תו נמוך בכל פעם שהשיר עוצר לנשום." },
        { title: "מי זה השיר", body: "אחד מנגן בנגינה חופשית את ההתחלה של שיר שהוא מכיר, השני מנחש." },
        { title: "לשיר ביחד", body: "מפעילים האזנה ושרים מעליה. אחר כך הילד מנגן לאט, והמבוגר שר בקצב שלו." },
        { title: "תורות", body: "כל אחד מנגן משפט אחד מהשיר ומעביר. ביונתן הקטן יש שמונה משפטים קצרים." },
      ],

      faq: [
        { q: "אפשר לנגן בפסנתר הזה בטלפון?", a: "כן. הקלידים עובדים במגע, אפשר כמה אצבעות ביחד, ובטלפון המקלדת הגדולה ביותר היא 17 קלידים כדי שהקלידים יישארו רחבים מספיק." },
        { q: "אפשר לנגן מהמקלדת של המחשב?", a: "כן. השורה A S D F G H J K L היא הקלידים הלבנים, והשורה W E T Y U O P היא השחורים. במקלדת המקצוענית Z ו-X מזיזים אוקטבה למטה ולמעלה." },
        { q: "אילו שירים יש?", a: "גלגלי האוטובוס, איפה האצבע, נצנץ כוכב קטן, יונתן הקטן והאודה לשמחה. כולם מנגינות עממיות ומסורתיות." },
        { q: "מה קורה כשלוחצים על קליד לא נכון?", a: "הוא מנגן כמו כל קליד, והשיר ממשיך לחכות לתו הנכון. אין עונש, אין פסילה ואין ניקוד." },
        { q: "מה ההבדל בין שלוש המקלדות?", a: "בסיסית: עשרה קלידים לבנים צבעוניים. מתקדמת: 17 קלידים עם השחורים. מקצוענית: 25 קלידים במחשב, הזזת אוקטבות ופדל. במצב שירים גם העזרה קטנה ככל שעולים." },
        { q: "יש פדל?", a: "יש כפתור פדל בכל המקלדות. כשהוא דלוק כל תו מצלצל בערך פי שלושה יותר זמן." },
        { q: "צריך להוריד משהו?", a: "לא. הפסנתר רץ בדפדפן, חינם, בלי הרשמה, ואחרי טעינה ראשונה הוא עובד גם בלי אינטרנט." },
      ],

      keywords: ["פסנתר", "פסנתר אונליין", "פסנתר לילדים", "שירי ילדים בפסנתר", "גלגלי האוטובוס", "איפה האצבע", "ללמוד לנגן"],
    },

    en: {
      name: "Piano",
      metaTitle: "Free Online Piano - Play and Learn Kids Songs | Ellaz",
      metaDescription:
        "A free piano in your browser for phone, tablet and PC. Three keyboards, from ten coloured keys for kids to two sliding octaves with sustain, plus five songs.",

      lede: "A free piano in the browser. Tap a key and it plays, with as many fingers as you like, or play it from your computer keyboard. In songs mode it lights the next key and waits for you, with no clock and no wrong answers.",

      body: [
        "There are three keyboards, and the level picker is just that: which keyboard you want. Basic is ten white keys from middle C up to the E an octave and a third above it, each one its own colour with its note name printed on it. Plus keeps the same span and adds the seven black keys, so 17 keys in all. Pro, on a computer, is 25 keys: two full octaves that slide up or down an octave at a time anywhere from C2 to C7, with a sustain pedal and a switch for the note names. On a phone Pro stays at 17 keys. Twenty-five keys across a phone screen is a row of keys no finger can hit.",

        "Songs mode has five tunes. The Wheels on the Bus and Where Is Thumbkin? come first, because those are the two a parent asked for. The shortest is 24 notes and the longest, Twinkle, Twinkle, is 42. Every note of every song is a white key between middle C and the E above the next C, which means every song fits the ten-key basic keyboard. The test suite checks that for all five songs on all three keyboards.",

        "Hit the wrong key? It plays.",

        "The song keeps waiting on the same note, and the key it wants gives a small wiggle. Nothing is lost.",

        "Here is the honest part: there is no score. Free play keeps no record, the same call Music Box and the colouring book make, because the only way to rank a child playing an instrument is to judge them. Finishing a song pays coins and a star, and nobody times it.",
      ],

      howToPlay: [
        { title: "Tap a key", body: "Every tap plays. Put several fingers down for a chord, or slide one along the keys." },
        { title: "Pick a keyboard", body: "Basic, Plus or Pro. Each step up has more keys and gives less help." },
        { title: "Switch to Songs", body: "Choose a song and play the key that lights up. The strip above the keys shows what comes next." },
        { title: "Listen first", body: "The listen button plays the whole song at 100 beats a minute and lights each key as it sounds." },
        { title: "Use your keyboard", body: "On a computer the A S D F row is the white keys and the row above is the black ones. In Pro, Z and X move an octave." },
      ],

      tips: [
        {
          title: "Hear it before you play it",
          body: "A song you have heard once is far easier to play. Your ear already knows where it goes, so your finger only has to find the key.",
        },
        {
          title: "Match the colours",
          body: "On the basic keyboard every note has a colour, and the next note in the strip wears the same one. A child who cannot read yet can still match colour to colour.",
        },
        {
          title: "Move up when it gets easy",
          body: "On Plus the next key only gets a small dot. On Pro the keys give no hint at all and you read the note name off the strip. Same song, and suddenly you have to know it.",
        },
        {
          title: "Pedal for slow tunes",
          body: "With sustain on, every note rings about three times as long. Chords and slow melodies sound bigger. Fast runs turn to mush, so switch it off for those.",
        },
      ],

      teaches: [
        { title: "Pitch", body: "Left is low and right is high. A few minutes on the keys and that sticks without anyone explaining it." },
        { title: "Note names", body: "C, D and E are printed on the keys and in the strip above them, so they get learned by use rather than by drill." },
        { title: "A melody is a sequence", body: "Waiting on one note at a time makes a song into steps a child can feel, one after the other." },
        { title: "Patience without pressure", body: "No clock and no game over, so trying again is free until the tune comes out whole." },
      ],

      ages: [
        { title: "3 to 4", body: "The basic keyboard in free play. Every tap makes a sound, and that is plenty." },
        { title: "5 to 7", body: "Songs on the basic keyboard, with the next key glowing. The Wheels on the Bus is a good first one." },
        { title: "8 and up", body: "The Plus keyboard, then the same songs with only a dot marking the next note." },
        { title: "Grown-ups", body: "Pro on a computer: two octaves, the pedal, and the whole thing playable from the keyboard." },
      ],

      accessibility:
        "Every key plays on a single tap, with no drag and no hold, so it works with switch access and other alternative input. Sliding along the keys is a bonus, never required. Each key is a real button named for its note, so it can be reached with the keyboard and played with Enter. There is no timer anywhere. To be straight about the limit: this is an instrument, and without sound a lot of it is gone. The colours, the note names and the strip show what is being played, but they do not replace hearing it. The listen demo stops on its own when you switch tabs.",

      together: [
        { title: "Four hands", body: "One of you plays the tune in songs mode, the other adds a low note each time the song pauses for breath." },
        { title: "Name that tune", body: "One plays the opening of a song they know in free play, the other guesses it." },
        { title: "Sing along", body: "Start the listen demo and sing over it. Then the child plays it slowly and the grown-up sings at their pace." },
        { title: "Take turns", body: "Each of you plays one line of the song and hands over. Little Jonathan has eight short lines." },
      ],

      faq: [
        { q: "Can I play this piano on my phone?", a: "Yes. The keys are made for touch and take several fingers at once. On a phone the biggest keyboard is 17 keys, so each key stays wide enough to hit." },
        { q: "Can I play it with my computer keyboard?", a: "Yes. A S D F G H J K L are the white keys and W E T Y U O P are the black ones. On the Pro keyboard Z and X move down and up an octave." },
        { q: "Which songs can my child learn?", a: "The Wheels on the Bus, Where Is Thumbkin?, Twinkle Twinkle, Little Jonathan and the Ode to Joy theme. All are traditional tunes." },
        { q: "What happens if you press the wrong key?", a: "It plays like any key and the song keeps waiting for the right note. No penalty, no lives and no score." },
        { q: "What is the difference between the three keyboards?", a: "Basic: ten coloured white keys. Plus: 17 keys with the black ones. Pro: 25 keys on a computer, octave shift and the pedal. In songs mode the help also shrinks as you go up." },
        { q: "Is there a sustain pedal?", a: "Yes, a pedal button on every keyboard. With it on, each note rings roughly three times longer." },
        { q: "Do I need to download anything?", a: "No. It runs in the browser for free with no sign-up, and after the first visit it works offline too." },
      ],

      keywords: ["online piano", "free piano", "virtual piano", "piano for kids", "learn piano songs", "wheels on the bus piano", "piano keyboard"],
    },

    es: {
      name: "Piano",
      metaTitle: "Piano online gratis - toca y aprende canciones | Ellaz",
      metaDescription:
        "Un piano gratis en el navegador, para móvil, tableta y PC. Tres teclados, de diez teclas de colores a dos octavas con pedal, y cinco canciones infantiles.",

      lede: "Un piano gratis en el navegador. Tocas una tecla y suena, con todos los dedos que quieras, o desde el teclado del ordenador. En el modo canciones ilumina la tecla siguiente y te espera, sin reloj y sin errores.",

      body: [
        "Suena al tocar.",

        "Hay tres teclados. El básico tiene diez teclas blancas, desde el Do central hasta el Mi de la octava siguiente, cada una de un color y con su nombre escrito. El Plus conserva ese tramo y añade las siete negras: 17 teclas. El de profesional, en un ordenador, tiene 25 teclas, dos octavas enteras que suben o bajan de octava en octava entre C2 y C7, con pedal y un interruptor para los nombres de las notas.",

        "En el móvil el teclado profesional se queda en 17 teclas. Con 25 en una pantalla de teléfono, las teclas quedarían tan finas que ningún dedo acertaría.",

        "El modo canciones trae cinco melodías tradicionales, con Las ruedas del autobús y Martinillo al principio de la lista. La más corta, Juanito, tiene 24 notas; la más larga, Estrellita, tiene 42. Todas las notas de las cinco caen en teclas blancas entre Do y Mi, así que cualquier canción se puede tocar en el teclado de diez teclas. Lo comprueban las pruebas del juego, canción por canción y teclado por teclado. ¿Y si tocas otra tecla? Suena como cualquier tecla. La canción sigue esperando la misma nota y la tecla correcta se mueve un poquito para avisar.",

        "Lo que no hay es marcador. Tocar libre no guarda ningún récord, igual que la Caja de música, porque la única forma de clasificar a un niño tocando es juzgarlo. Terminar una canción da monedas y una estrella, y nadie cronometra nada.",
      ],

      howToPlay: [
        { title: "Toca una tecla", body: "Cada toque suena. Pon varios dedos para un acorde o desliza uno por las teclas." },
        { title: "Elige teclado", body: "Básico, Plus o Pro. Cada paso tiene más teclas y menos ayuda." },
        { title: "Pasa a canciones", body: "Elige una canción y toca la tecla que se ilumina. La franja de arriba enseña las notas que vienen." },
        { title: "Escucha antes", body: "El botón de escuchar toca la canción entera a 100 pulsos por minuto e ilumina cada tecla." },
        { title: "Usa el teclado", body: "En el ordenador la fila A S D F son las blancas y la de arriba las negras. En profesional, Z y X cambian de octava." },
      ],

      tips: [
        { title: "Escúchala primero", body: "Una canción que ya oíste se toca mucho mejor. El oído sabe adónde va y el dedo solo tiene que encontrar la tecla." },
        { title: "Busca el color", body: "En el teclado básico cada nota tiene su color y la siguiente nota de la franja lleva el mismo. Un niño que aún no lee puede emparejar colores." },
        { title: "Sube cuando sea fácil", body: "En Plus la tecla siguiente solo lleva un puntito, y en profesional nada. La misma canción, pero ahora hay que saberla." },
        { title: "Pedal para lo lento", body: "Con el pedal cada nota dura unas tres veces más. Los acordes suenan enormes y lo rápido se emborrona." },
      ],

      teaches: [
        { title: "Agudo y grave", body: "A la izquierda grave, a la derecha agudo. Tras unos minutos con las teclas, la idea se queda." },
        { title: "Nombres de notas", body: "Do, Re y Mi están escritos en las teclas y en la franja, y se aprenden usándolos." },
        { title: "La melodía como secuencia", body: "Esperar una nota cada vez convierte la canción en pasos que un niño siente uno tras otro." },
        { title: "Constancia sin presión", body: "No hay reloj ni fin de partida, así que repetir no cuesta nada." },
      ],

      ages: [
        { title: "3 a 4 años", body: "El teclado básico en modo libre. Cada toque suena, y con eso basta." },
        { title: "5 a 7 años", body: "Canciones en el teclado básico con la tecla siguiente brillando. Las ruedas del autobús es buena para empezar." },
        { title: "8 años o más", body: "El teclado Plus y luego las mismas canciones con solo un punto como pista." },
        { title: "Adultos", body: "El profesional en ordenador: dos octavas, pedal y todo desde el teclado." },
      ],

      accessibility:
        "Cada tecla suena con un solo toque, sin arrastrar y sin mantener pulsado, así que funciona con pulsadores y otros sistemas de entrada. Deslizar por las teclas es un extra, nunca obligatorio. Cada tecla es un botón con el nombre de su nota, accesible desde el teclado y tocable con Intro. No hay temporizador. Y con franqueza: es un instrumento, y sin sonido se pierde mucho. Los colores, los nombres y la franja muestran qué se toca, pero no sustituyen al oído. La escucha se detiene sola al cambiar de pestaña.",

      together: [
        { title: "A cuatro manos", body: "Uno toca la melodía en modo canciones y el otro añade una nota grave cada vez que la canción respira." },
        { title: "Adivina la canción", body: "Uno toca el comienzo de una canción conocida en modo libre y el otro la adivina." },
        { title: "Cantar juntos", body: "Poned la escucha y cantad encima. Luego el niño la toca despacio y el adulto canta a su ritmo." },
        { title: "Por turnos", body: "Cada uno toca una frase y pasa el turno. Juanito tiene ocho frases cortas." },
      ],

      faq: [
        { q: "¿Se puede tocar este piano en el móvil?", a: "Sí. Las teclas están pensadas para el tacto y admiten varios dedos a la vez. En el móvil el teclado más grande es de 17 teclas para que sigan siendo anchas." },
        { q: "¿Se puede tocar con el teclado del ordenador?", a: "Sí. A S D F G H J K L son las blancas y W E T Y U O P las negras. En el teclado profesional Z y X bajan y suben una octava." },
        { q: "¿Qué canciones trae?", a: "Las ruedas del autobús, Martinillo, Estrellita, Juanito y el tema del Himno de la alegría. Todas son melodías tradicionales." },
        { q: "¿Qué pasa si toco la tecla equivocada?", a: "Suena como cualquier otra y la canción sigue esperando la nota correcta. Sin castigo, sin vidas y sin puntos." },
        { q: "¿En qué se diferencian los tres teclados?", a: "Básico: diez teclas blancas de colores. Plus: 17 teclas con las negras. Profesional: 25 teclas en ordenador, cambio de octava y pedal." },
        { q: "¿Tiene pedal?", a: "Sí, un botón de pedal en todos los teclados. Activado, cada nota suena unas tres veces más." },
        { q: "¿Hay que descargar algo?", a: "No. Funciona en el navegador, gratis y sin registro, y tras la primera visita también sin conexión." },
      ],

      keywords: ["piano online", "piano gratis", "piano virtual", "piano para niños", "canciones infantiles piano", "aprender piano"],
    },

    fr: pianoFr,
    sv: pianoSv,
  },

  provenance: [
    { claim: "basic is ten white keys from middle C to the E above", source: "src/games/piano/logic.ts" },
    { claim: "Plus adds the seven black keys, 17 keys in all", source: "src/games/piano/logic.test.ts" },
    { claim: "pro on a computer is 25 keys, two octaves, sliding between C2 and C7", source: "src/games/piano/logic.ts" },
    { claim: "pro on a phone stays at 17 keys", source: "src/games/piano/logic.ts" },
    { claim: "five songs, the shortest 24 notes and the longest 42", source: "src/games/piano/logic.ts" },
    { claim: "every note of every song fits the ten-key keyboard", source: "src/games/piano/logic.test.ts" },
    { claim: "the listen demo plays at 100 beats a minute", source: "src/games/piano/logic.ts" },
    { claim: "with the pedal on, a note rings about three times as long", source: "src/games/piano/sound.ts" },
    { claim: "Little Jonathan has eight short lines", source: "src/games/piano/logic.ts" },
  ],
};
