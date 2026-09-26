import type { GameCopy } from "../../types";

/** Svenska, från `node scripts/brief.mjs sv math`. Nivåerna kommer ur
 *  `src/games/math/logic.ts`. Inget här är översatt. */
export const mathSv: GameCopy = {
  name: "Räkna",
  metaTitle: "Räknespel för barn - gratis online | Ellaz",
  metaDescription:
    "Räkna, para ihop, plus, minus och gångertabellen upp till 5x5. Sju nivåer, tre svarsknappar, gratis i webbläsaren utan konto.",

  lede: "Sju nivåer som börjar med att räkna till 10 och slutar i gångertabellen upp till 5 gånger 5. Tre svar att välja mellan varje gång.",

  body: [
    "Nivåerna går i en ordning som följer hur räkning faktiskt lärs in. Först räkna 1 till 10, sedan para ihop en grupp med rätt siffra upp till 6, sedan räkna bilder upp till 10. Därefter plus och minus inom 5, inom 10 och inom 20, och sist gångertabellen upp till 5 gånger 5. Sju nivåer alltså, och de står i en rad ovanför så att ingen behöver leta i en inställningsruta efter dem.",
    "Tre svar visas varje gång.",
    "Det betyder att en ren gissning är rätt i 33,3 procent av fallen, vilket är avsiktligt högt. Ett barn som är osäkert ska kunna komma vidare utan att fastna, och det som gör att nivån känns klar är att rätt svar kommer ofta, inte att fel svar straffas. Ingenting räknar ner. Ett fel val skakar till och låter dig välja igen.",
    "Paranivån stannar vid 6 och det är ett beslut med ett skäl. Grupperna är själva svarsknapparna, och 7 prickar går inte att skilja från 8 med en blick, så en högre gräns hade gjort uppgiften till en räkneövning i stället för en igenkänningsövning. Men det tar slut fort. Gångertabellen till 5 gånger 5 är den sista nivån, och ett barn som klarar den har vuxit ur spelet.",
  ],

  howToPlay: [
    {
      title: "Välj nivå i raden ovanför",
      body: "Sju nivåer står i ordning. Spelet öppnas på den du valde sist, så ingen behöver leta upp sin plats varje gång.",
    },
    {
      title: "Läs frågan",
      body: "En uppgift visas i mitten, som ett tal eller som en grupp bilder. Talet står alltid från vänster till höger, även när resten av webbplatsen är inställd på hebreiska.",
    },
    {
      title: "Tryck på ett av tre svar",
      body: "Tre knappar visas under uppgiften. Ett tryck räcker, och rätt svar tar dig direkt vidare till nästa fråga.",
    },
    {
      title: "Fel svar kostar ingenting",
      body: "Knappen skakar till och frågan står kvar. Det finns ingen klocka, inga liv och ingen ruta som talar om att något gick fel.",
    },
  ],

  tips: [
    {
      title: "Räkna på fingrarna, det är meningen",
      body: "Inom 10 är fingrar snabbare än huvudräkning för de flesta barn, och det är en helt riktig metod. Den går över av sig själv när talen blir vana.",
    },
    {
      title: "Titta på svaren innan du räknar",
      body: "Med tre alternativ går det ofta att stryka ett direkt, eftersom det är uppenbart för stort eller för litet. Det är en riktig räknefärdighet och inte ett fusk.",
    },
    {
      title: "Stanna på en nivå tills den är tråkig",
      body: "Sju nivåer är inte många, och att kliva upp för tidigt gör de sista svårare än de behöver vara. Plus inom 10 tål att spelas länge.",
    },
  ],

  teaches: [
    {
      title: "Antal innan siffror",
      body: "De tre första nivåerna handlar om hur många och inte om vilken siffra. Att en grupp på fyra och tecknet 4 är samma sak är ett steg som kommer efteråt.",
    },
    {
      title: "Plus och minus som samma sak",
      body: "Nivåerna blandar de två inom samma talområde i stället för att lära ut dem var för sig. Det är avsiktligt, eftersom de är varandras baksida.",
    },
    {
      title: "Gångertabellen som upprepad addition",
      body: "Upp till 5 gånger 5 är små nog att ett barn kan räkna sig fram om det inte kommer ihåg. Det är den vägen in i tabellen som brukar fastna.",
    },
  ],

  ages: [
    {
      title: "Fyra år, på de tre första nivåerna",
      body: "Räkna till 10 och para ihop grupper kräver ingen läsning alls. Bilderna är svaret, och siffran står bredvid.",
    },
    {
      title: "Sex år, på plus och minus",
      body: "Inom 5 och inom 10 passar ungefär första klass. Tre svarsalternativ gör att ett barn som är osäkert ändå kommer framåt.",
    },
    {
      title: "Åtta år, på gångertabellen",
      body: "Upp till 5 gånger 5 är där tabellen brukar börja. Det är också den sista nivån, så spelet tar slut ungefär där.",
    },
  ],

  accessibility:
    "Allt görs med tryck på stora knappar, och ingenting kräver att du drar. Talet står från vänster till höger oavsett språk, eftersom en spegelvänd uträkning blir en annan uträkning. Det finns ingen klocka, så ingen förlorar något på att behöva längre tid. Varje svarsknapp är en riktig knapp med sitt tal som etikett, så den går att nå med tangentbord och läses upp av en skärmläsare.",

  together: [
    {
      title: "En fråga var",
      body: "Turas om att svara på samma nivå. Det går fort nog att ingen behöver vänta, och en vuxen som svarar fel ibland gör mycket för stämningen.",
    },
    {
      title: "Säg hur du tänkte",
      body: "Efter varje svar, be om metoden i stället för om talet. Två barn som räknar olika lär sig mer av varandra än av frågan.",
    },
    {
      title: "Gissa innan svaren visas",
      body: "Täck knapparna med handen och låt barnet säga svaret högt först. Det gör uppgiften till riktig huvudräkning i stället för ett val mellan tre.",
    },
  ],

  faq: [
    {
      q: "Hur många nivåer finns det?",
      a: "Sju, från att räkna 1 till 10 upp till gångertabellen 5 gånger 5.",
    },
    {
      q: "Varför bara tre svar?",
      a: "För att ett osäkert barn ska komma vidare. Tre alternativ gör en ren gissning rätt i 33,3 procent av fallen, vilket är medvetet generöst.",
    },
    {
      q: "Varför slutar paranivån vid 6?",
      a: "Grupperna är själva svarsknapparna, och 7 prickar går inte att skilja från 8 med en blick. Högre än så blir det en räkneövning i stället.",
    },
    {
      q: "Finns det någon tidsgräns?",
      a: "Nej. Ingenting räknar ner, och ett fel svar låter dig bara välja igen.",
    },
    {
      q: "Måste mitt barn kunna läsa?",
      a: "Nej. Uppgifterna är siffror och bilder, och det finns inga meningar att ta sig igenom.",
    },
    {
      q: "Kostar det något?",
      a: "Nej. Gratis, utan konto, utan annonser, och det fungerar offline när sidan har laddat en gång.",
    },
  ],

  keywords: ["räkna", "matematik", "plus", "minus", "gångertabellen", "barn"],
};
