import type { GameCopy } from "../../types";

/** Svenska, från `node scripts/brief.mjs sv lettercross`. Ordlistan kommer ur
 *  `scripts/build-lettercross-words.mjs`, brädet ur spelets `logic.ts`. */
export const lettercrossSv: GameCopy = {
  name: "Bokstavskors",
  metaTitle: "Bokstavskors - gratis ordspel med brickor | Ellaz",
  metaDescription:
    "Lägg bokstavsbrickor på ett bräde på nio rutor gånger nio och bygg korsande ord. 94 brickor, fyra jokrar, tre nivåer. Gratis och utan konto.",

  lede: "Du får en handfull bokstäver och lägger ett ord var du vill på brädet. Nästa ord måste korsa eller röra vid det som redan ligger där, och allt som uppstår ska fortfarande vara ord.",

  body: [
    "Brädet är nio rutor gånger nio. Det är mindre än det bräde de flesta har i huvudet, och skillnaden märks mer än den låter. Kanterna kommer snabbt. Varje ruta är likadan som alla andra, så var ett ord hamnar är ditt beslut och aldrig brädets, och en omgång tar den tid du faktiskt har i stället för den tid ett sällskapsspel räknar med att du har en söndag.",
    "Det finns 94 brickor. Nittio av dem är bokstäver och fyra är jokrar, alltså dubbelt så många som vanligt. En joker får vara vilken bokstav du vill. Den ger noll poäng, och den är ändå oftast den bästa brickan du håller i, eftersom bokstaven du saknar är den som stoppar ordet du redan ser framför dig.",
    "Ord går på tvären eller nedåt. Två bokstäver räcker.",
    "När du lägger brickor intill bokstäver som redan ligger där måste varje ny rad om två eller fler också vara ett riktigt ord. Det är den delen som brukar överraska, och det är också den som gör spelet värt att spela i stället för bara att spela färdigt.",
    "Poängen kommer från bokstäverna och ingenting annat. Ett Q är värt 12 poäng och ett E är värt ett. Ingen ruta dubblar något, ingen ruta gångrar ett helt ord, och det finns inget lyckohörn att sikta på. Ett svagt ord förblir svagt var du än lägger det.",
    "Här är den begränsning som är värd att veta i förväg: ordlistan är engelsk. Den innehåller 28 515 ord på två till sex bokstäver, byggd ur en ordlista i allmän ägo och sedan filtrerad, och den gäller oavsett vilket språk resten av webbplatsen står på. Spelet är alltså ett engelskt ordspel med svensk text omkring sig. Vi säger det rakt ut i stället för att låta dig upptäcka det när björn inte godkänns.",
  ],

  howToPlay: [
    {
      title: "Läs din hand",
      body: "Sju, åtta eller nio brickor beroende på nivå. Du ser dem hela tiden och kan lägga tillbaka en bricka innan du bekräftar draget.",
    },
    {
      title: "Lägg ett ord",
      body: "Tryck på en bricka och sedan på en ruta. Första ordet får ligga var som helst på brädet, och det behöver inte vara i mitten.",
    },
    {
      title: "Kontrollera det som uppstår",
      body: "Allt som blir en rad om två eller fler bokstäver måste vara ett ord, även det du inte hade tänkt bygga. Brädet säger ifrån innan draget räknas.",
    },
    {
      title: "Fyll på och fortsätt",
      body: "Nya brickor kommer automatiskt. Omgången är slut när påsen är tom och ingen fler bricka går att lägga.",
    },
  ],

  tips: [
    {
      title: "Spara jokern till en vägg",
      body: "En joker ger noll poäng, så den är slöseri i ett enkelt ord. Den är guld värd när en enda saknad bokstav står mellan dig och en rad som rör vid tre andra.",
    },
    {
      title: "Korsningar är poäng",
      body: "En bricka som ingår i två ord räknas i båda. Att lägga kortare ord som korsar varandra slår ofta ett långt ord ute i tomma intet.",
    },
    {
      title: "Ett Q utan U är ingen katastrof",
      body: "Det är 12 poäng som ligger och väntar. Men ett bräde på nio rutor gånger nio har ont om plats, så lägg det tidigt hellre än att hålla det till slutet.",
    },
  ],

  teaches: [
    {
      title: "Att planera framåt",
      body: "Ett bra drag i dag kan stänga ett bättre drag i morgon. Brädet är litet nog att den avvägningen syns, vilket ett stort bräde döljer.",
    },
    {
      title: "Engelsk stavning",
      body: "Ordlistan är engelsk, så varje godkänt ord är ett litet stavningsprov. För den som läser engelska i skolan är det en oväntat effektiv övning.",
    },
    {
      title: "Att räkna i huvudet",
      body: "Poängen är en summa av bokstavsvärden, och den går att räkna ut innan draget läggs. De flesta börjar göra det efter ett par omgångar.",
    },
  ],

  ages: [
    {
      title: "Nio år, med hjälp",
      body: "En vuxen som läser handen högt gör spelet möjligt långt innan barnet kan stava på engelska på egen hand.",
    },
    {
      title: "Tolv år och uppåt",
      body: "Ungefär där den engelska ordlistan räcker för att hitta ord utan att fastna. Åtta brickor i handen är en rimlig start.",
    },
    {
      title: "Vuxen, på nio brickor",
      body: "Fler brickor betyder fler alternativ och fler sätt att välja fel. Nivån har sitt eget rekord, eftersom en hand på sju och en på nio inte är samma spel.",
    },
  ],

  accessibility:
    "Varje bricka och varje ruta är en riktig knapp, så hela brädet går att nå med tangentbord och läses upp av en skärmläsare. Ingenting kräver att du drar, och ett drag kan ångras innan det bekräftas. Det finns ingen klocka, så en omgång kan ligga still hur länge som helst. Brädet på nio rutor valdes delvis för att varje ruta ska bli stor nog att träffa med tummen på en telefon.",

  together: [
    {
      title: "En hand, två huvuden",
      body: "Titta på samma brickor och föreslå varsitt ord innan ni bestämmer er. De flesta hittar olika ord i samma bokstäver.",
    },
    {
      title: "Jaga korsningen",
      body: "Utmana varandra att lägga en bricka som ingår i två ord samtidigt. Det är svårare än det låter och ger mest poäng.",
    },
    {
      title: "Slå ert eget rekord",
      body: "Spela samma nivå två gånger i rad och jämför summan. Rekordet ligger kvar på enheten, så det finns något att slå nästa gång.",
    },
  ],

  faq: [
    {
      q: "Vilket språk är orden på?",
      a: "Engelska. Ordlistan innehåller 28 515 engelska ord på två till sex bokstäver och är densamma oavsett vilket språk gränssnittet står på.",
    },
    {
      q: "Varför är brädet nio rutor och inte femton?",
      a: "För att en kortare omgång är en omgång folk spelar färdigt. Nio gör dessutom varje ruta stor nog att träffa med tummen, vilket femton på en telefon inte gör.",
    },
    {
      q: "Vad är en joker värd?",
      a: "Noll poäng, var du än lägger den. Den är ändå värd att spela, eftersom den öppnar ord som annars vore omöjliga.",
    },
    {
      q: "Finns det rutor som dubblar poängen?",
      a: "Nej. Poängen kommer bara från bokstäverna, så ett starkt ord är starkt överallt på brädet.",
    },
    {
      q: "Sparas mitt rekord?",
      a: "Ja, ett per nivå, på enheten själv. Sju brickor och nio brickor är olika spel och har därför olika rekord.",
    },
    {
      q: "Kostar det något?",
      a: "Nej. Gratis, utan konto och utan annonser, och det fungerar offline när sidan har laddat en gång.",
    },
  ],

  keywords: ["ordspel", "bokstavsbrickor", "korsord", "bokstavskors", "ord", "gratis"],
};
