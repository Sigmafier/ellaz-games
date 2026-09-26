import type { GameCopy } from "../../types";

/** Svenska, från `node scripts/brief.mjs sv letters`. Poolen kommer ur
 *  `scripts/sim/letters-coverage.mjs`. Inget här är översatt. */
export const lettersSv: GameCopy = {
  name: "Första bokstaven",
  metaTitle: "Första bokstaven - bokstavsspel för barn | Ellaz",
  metaDescription:
    "Vilken bokstav börjar ordet på? En bild, två till fyra bokstäver att välja bland, och 74 bilder i poolen. Gratis i webbläsaren.",

  lede: "En bild visas, och du väljer vilken bokstav ordet börjar på. Två, tre eller fyra bokstäver att välja mellan beroende på nivå.",

  body: [
    "Spelet visar en bild och ett par bokstäver, och frågar vilken av dem ordet börjar på. Det är hela regeln. Bilden står kvar hela tiden och ordet skrivs ut under den, eftersom den som redan kan läsa ska kunna kontrollera sig själv och den som inte kan ska ha något att känna igen. Det finns 74 bilder i den fulla poolen, och på den lättaste nivån används bara de 22 enklaste orden.",
    "Ljudet är ett erbjudande, aldrig frågan.",
    "En högtalarknapp läser upp ordet för den som vill. Knappen är helt frivillig. Svaret går att ge utan att någonsin trycka på den, och det är ett medvetet beslut och inte en förenkling: en webbläsares talsyntes kan ha en röst installerad, välja den, rapportera att den har talat färdigt, och ändå inte ge ifrån sig ett ljud, och ingenting i koden på sidan kan upptäcka det. Ett spel som byggde frågan på ljudet hade alltså varit omöjligt att klara på vissa enheter utan att någon förstod varför.",
    "Svårigheten är hur många bokstäver som står att välja mellan: 2, 3 eller 4. Poolen växer med nivån. Från de 22 enklaste orden upp till alla 74. Den ärliga begränsningen är att den svenska ordlistan är nyare än de andra och inte har mätts på samma sätt, så hur jämnt de svenska begynnelsebokstäverna täcker alfabetet vet vi ännu inte.",
  ],

  howToPlay: [
    {
      title: "Titta på bilden",
      body: "En sak visas stor i mitten, och ordet står skrivet under den. Bilden byts ut efter varje rätt svar.",
    },
    {
      title: "Tryck på en bokstav",
      body: "Två, tre eller fyra bokstäver står under bilden beroende på nivå. Ett tryck räcker, och det finns inget att dra.",
    },
    {
      title: "Lyssna om du vill",
      body: "Högtalarknappen läser upp ordet. Den är helt frivillig, och spelet går att klara utan att den används en enda gång.",
    },
    {
      title: "Byt nivå i raden ovanför",
      body: "Fler bokstäver att välja mellan gör frågan svårare, och de svårare nivåerna hämtar också ord ur hela poolen i stället för bara de enklaste.",
    },
  ],

  tips: [
    {
      title: "Säg ordet långsamt",
      body: "Att dra ut på första ljudet är den teknik som fungerar, och den går att göra högt tillsammans. Bokstaven följer av ljudet nästan av sig själv.",
    },
    {
      title: "Börja på två alternativ",
      body: "Med bara 2 bokstäver att välja mellan blir det ett rent ja eller nej, och ett barn som är osäkert vågar gissa. Fyra alternativ för tidigt gör att spelet känns som ett prov.",
    },
    {
      title: "Läs ordet under bilden",
      body: "För ett barn som har börjat läsa är den raden svaret, och det är avsiktligt. Att få kontrollera sig själv är en annan sak än att få rätt.",
    },
  ],

  teaches: [
    {
      title: "Att höra det första ljudet",
      body: "Att skilja ut ljudet i början av ett ord från resten är det steg som kommer före läsning, och det är precis det spelet frågar om.",
    },
    {
      title: "Ljud och bokstav som samma sak",
      body: "Bilden ger ljudet och knappen ger tecknet. Att koppla ihop dem är hela poängen, och det syns när ett barn börjar peka på bokstaven innan ordet är färdigsagt.",
    },
    {
      title: "Att känna igen bokstavsformer",
      body: "Fyra alternativ betyder fyra former att skilja åt. Å, Ä och Ö är egna bokstäver och behandlas som sådana, inte som varianter av A och O.",
    },
  ],

  ages: [
    {
      title: "Tre år, på två alternativ",
      body: "Bilden är begriplig långt innan bokstäverna är det. På den här nivån handlar det mest om att lyssna och peka.",
    },
    {
      title: "Fem år, på tre alternativ",
      body: "Ungefär där ett barn börjar koppla ljud till tecken med avsikt. Det är den nivå som brukar användas längst.",
    },
    {
      title: "Sex år och uppåt, på fyra",
      body: "Fyra alternativ och hela poolen på 74 bilder. Vid den åldern kan ordet under bilden läsas, vilket gör spelet till en självrättande övning.",
    },
  ],

  accessibility:
    "Bokstaven står alltid kvar på skärmen och ordet skrivs ut, så ingenting hänger på att en röst hörs. Högtalarknappen är frivillig. Allt görs med tryck på stora knappar, ingenting kräver att du drar, och det finns ingen klocka som tar slut. Varje bokstavsknapp är en riktig knapp med sin bokstav som etikett, så den går att nå med tangentbord och läses upp av en skärmläsare.",

  together: [
    {
      title: "Säg ljudet tillsammans",
      body: "En vuxen drar ut på första ljudet och barnet fyller i bokstaven. Det är den enda tekniken som verkligen behöver två personer.",
    },
    {
      title: "Byt roller",
      body: "Låt barnet välja bilden och den vuxne svara, med ett medvetet fel då och då. Att få rätta någon annan är ett annat slags övning.",
    },
    {
      title: "Leta efter bokstaven i rummet",
      body: "När en bokstav har dykt upp i spelet, leta rätt på den på en förpackning eller en skylt. Det flyttar ut spelet ur skärmen.",
    },
  ],

  faq: [
    {
      q: "Vilket språk är bokstäverna på?",
      a: "Samma språk som webbplatsen är inställd på. Byter du språk byts både bilderna och bokstäverna.",
    },
    {
      q: "Hur många bilder finns det?",
      a: "74 i den fulla poolen. Den lättaste nivån använder bara de 22 enklaste orden.",
    },
    {
      q: "Måste barnet höra ljudet?",
      a: "Nej. Ordet står skrivet och bilden står kvar, så frågan går att svara på helt utan ljud.",
    },
    {
      q: "Räknas Å, Ä och Ö som egna bokstäver?",
      a: "Ja. De är egna bokstäver i svenskan och behandlas som sådana, sist i alfabetet och inte som varianter av A och O.",
    },
    {
      q: "Finns det någon tidsgräns?",
      a: "Nej, och ett fel svar kostar ingenting mer än att knappen skakar till.",
    },
    {
      q: "Kostar det något?",
      a: "Nej. Gratis, utan konto, utan annonser, och det fungerar offline när sidan har laddat en gång.",
    },
  ],

  keywords: ["bokstäver", "alfabet", "läsa", "ljud", "barn", "första bokstaven"],
};
