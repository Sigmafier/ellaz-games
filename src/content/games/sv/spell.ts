import type { GameCopy } from "../../types";

/** Svenska, från `node scripts/brief.mjs sv spell`. Siffrorna kommer ur
 *  `scripts/sim/spell-pools.mjs` och spelets egen `logic.ts`. Inget är översatt. */
export const spellSv: GameCopy = {
  name: "Stava ordet",
  metaTitle: "Stava ordet - stavningsspel för barn | Ellaz",
  metaDescription:
    "En bild, tomma rutor under den, och bokstäverna i en rad längst ned. 67 bilder i poolen och en fel bokstav hamnar aldrig i ordet. Gratis i webbläsaren.",

  lede: "En bild visas och hela dess namn ska byggas, en bokstav i taget, ur bokstäverna längst ned på skärmen.",

  body: [
    "Under bilden står tomma rutor, en för varje bokstav i ordet, och längst ned ligger bokstäverna utspridda. Ordet byggs bokstav för bokstav. Poolen innehåller 67 bilder, och den lättaste nivån använder 38 av dem på engelska, 46 på hebreiska och 23 på spanska. Det här är steget efter Första bokstaven, som bara frågar vilken bokstav ett ord börjar på: här ska alla bokstäverna hittas, och i rätt ordning.",
    "En fel bokstav placeras aldrig.",
    "Trycker du på fel bokstav skakar den till och stryks för just den rutan, men den hamnar inte i ordet. Raden på skärmen är alltså rättstavad i varje ögonblick ett barn tittar på den. Det andra sättet, att låta alla rutor fyllas och rätta på slutet, är hur stavning prövas snarare än hur den lärs in, och för en fyraåring slutar det med en rad bokstäver som är fel på ett sätt ingen kan peka på. Beslutet tar också bort en hel funktion. När ingenting felaktigt kan hamna i ordet finns det inget att ångra, så spelet behöver varken ångraknapp eller dragande, och ett barn kan omöjligt köra fast.",
    "Svårigheten ändrar två saker samtidigt. Raden får 0, 2 eller 4 extra bokstäver som inte hör hemma i ordet, och ordet självt får vara högst 4 bokstäver, högst 6, eller hur långt som helst. Det längsta ordet i hela poolen är 9 bokstäver. Att trycka helt på måfå tar i snitt 5,9 tryck på den lätta nivån och 18,2 på den svåra i den engelska poolen, vilket är skillnaden mellan nivåerna uttryckt i tålamod snarare än i ord. Den ärliga begränsningen är att den svenska ordlistan är nyare än de andra och ännu inte har körts genom samma mätning, så siffrorna ovan gäller de språk som faktiskt har mätts.",
  ],

  howToPlay: [
    {
      title: "Titta på bilden",
      body: "En sak visas stor i mitten. Antalet tomma rutor under den säger hur många bokstäver ordet har.",
    },
    {
      title: "Tryck på bokstäverna i ordning",
      body: "Bokstaven hoppar upp i nästa tomma ruta. Varje bokstavsruta är minst 52 bildpunkter bred, så ett litet finger räcker.",
    },
    {
      title: "Fel bokstav skakar bara",
      body: "Den hamnar aldrig i ordet och kostar ingenting. Prova nästa i stället, så många gånger som behövs.",
    },
    {
      title: "Byt nivå när det går för lätt",
      body: "Längre ord och fler bokstäver som inte hör hemma i ordet. Nivån går att byta mitt i, och en ny bild delas ut direkt.",
    },
  ],

  tips: [
    {
      title: "Säg ordet högt först",
      body: "Ett barn som har hört hela ordet vet hur många ljud det letar efter, och antalet tomma rutor bekräftar gissningen innan en enda bokstav har tryckts in.",
    },
    {
      title: "Börja utan extra bokstäver",
      body: "På den lättaste nivån ligger exakt ordets egna bokstäver i raden, så uppgiften är ren ordning. Att välja bort en bokstav är en helt annan och mycket senare färdighet.",
    },
    {
      title: "Låt felen vara gratis",
      body: "Ett barn som vet att fel bokstav bara skakar vågar prova. Den som tror att det kostar något sitter still och väntar på hjälp.",
    },
  ],

  teaches: [
    {
      title: "Ljud i ordning",
      body: "Att höra att katt börjar på k och slutar på två t är svårare än det låter, och tomma rutor gör antalet ljud synligt.",
    },
    {
      title: "Bokstavsformer",
      body: "Å, Ä och Ö är egna bokstäver i svenskan och ligger i raden som egna former, inte som varianter av A och O.",
    },
    {
      title: "Att prova sig fram utan risk",
      body: "Ordet på skärmen är korrekt hela tiden, så ett barn kan gissa fritt och ändå aldrig se sig själv ha skrivit något fel.",
    },
  ],

  ages: [
    {
      title: "Fyra år, på lätt",
      body: "Ord på högst 4 bokstäver och inga extra bokstäver i raden. Det handlar om att ordna, inte om att välja bort.",
    },
    {
      title: "Sex år, på medel",
      body: "Ord upp till 6 bokstäver och 2 bokstäver för mycket i raden. Ungefär där ett barn börjar kunna avvisa en bokstav som inte passar.",
    },
    {
      title: "Sju år och uppåt, på svår",
      body: "Hela poolen, upp till 9 bokstäver, och 4 bokstäver som inte hör hemma. Vid den åldern är det stavning på riktigt.",
    },
  ],

  accessibility:
    "Varje bokstav är en riktig knapp med sin bokstav som etikett, så raden går att nå med tangentbord och läses upp av en skärmläsare. Rutorna är minst 52 bildpunkter. Allting görs med tryck, ingenting kräver att du drar, och det finns ingen klocka. Bilden och ordet står kvar på skärmen hela tiden, så ingenting hänger på att ett ljud hörs.",

  together: [
    {
      title: "Läs rutorna tillsammans",
      body: "Peka på varje tom ruta och säg ljudet som hör dit. Det gör antalet bokstäver till något man kan höra och inte bara se.",
    },
    {
      title: "Låt barnet rätta den vuxne",
      body: "Tryck medvetet på fel bokstav ibland. Att få säga nej till en vuxen är en annan och roligare sorts övning.",
    },
    {
      title: "Stava något i rummet",
      body: "När ett ord är färdigt, leta efter samma sak omkring er. Kopp, sked, dörr. Spelet blir kortare och verkligheten större.",
    },
  ],

  faq: [
    {
      q: "Vad händer om barnet trycker fel?",
      a: "Bokstaven skakar till och stryks för den rutan. Den hamnar aldrig i ordet, och ingenting går förlorat.",
    },
    {
      q: "Hur många bilder finns det?",
      a: "67 i hela poolen. Den lättaste nivån använder en mindre del av dem, eftersom orden där får vara högst 4 bokstäver.",
    },
    {
      q: "Behöver barnet kunna läsa?",
      a: "Nej. Bilden säger vilket ord det handlar om, och bokstäverna hittas ett ljud i taget.",
    },
    {
      q: "Finns det någon ångraknapp?",
      a: "Nej, och den behövs inte. Eftersom fel bokstav aldrig placeras finns det ingenting att ta tillbaka.",
    },
    {
      q: "Hur länge tar ett ord?",
      a: "Det finns ingen tid att hålla. Ett ord är färdigt när alla rutor är fyllda, och nästa bild kommer direkt.",
    },
    {
      q: "Kostar det något?",
      a: "Nej. Gratis, utan konto och utan annonser, och det fungerar offline när sidan har laddat en gång.",
    },
  ],

  keywords: ["stava", "stavning", "bokstäver", "ord", "barn", "läsa"],
};
