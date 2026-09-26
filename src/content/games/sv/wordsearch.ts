import type { GameCopy } from "../../types";

/** Svenska, från `node scripts/brief.mjs sv wordsearch`. Siffrorna kommer ur
 *  `scripts/sim/wordsearch-grids.mjs` och spelets `logic.ts`. */
export const wordsearchSv: GameCopy = {
  name: "Ordletaren",
  metaTitle: "Ordletaren - hitta orden i rutnätet | Ellaz",
  metaDescription:
    "Hitta de dolda orden i rutnätet. Tre storlekar, från 8x8 med sex ord till 12x12 med tio ord åt alla håll. Gratis i webbläsaren, utan konto.",

  lede: "Orden står i listan bredvid och gömmer sig i rutnätet. Dra över bokstäverna för att stryka ett ord, eller tryck på första och sista bokstaven.",

  body: [
    "Tre storlekar, och de är tre olika spel. Ett rutnät på 8x8 gömmer sex ord i två riktningar, 10x10 gömmer åtta i tre riktningar, och 12x12 gömmer tio åt alla åtta håll, baklänges inräknat. Riktningarna är svårigheten. Att leta nedåt och åt höger är att läsa, medan att leta snett uppåt bakåt är något helt annat.",
    "Fyllnaden är inte slumpad.",
    "En bokstav som inte tillhör något ord väljs efter hur vanlig den är i språket, så rutnätet ser ut som skriven svenska i stället för som en radiosändning. Det gör det svårare på precis rätt sätt. Andelen fyllnad är 44,1 procent på det lilla rutnätet och 55,6 procent på det stora, vilket är varför ett stort rutnät inte bara är mer att titta på utan också glesare mellan det som faktiskt betyder något.",
    "Vi delade ut 36 000 bräden för att kontrollera att utdelningen håller. Ingen ordlista blev kortare än sin nivå och inget bräde behövde byggas om. Ett ord får i snitt 3 försök att hitta en plats på det lilla rutnätet och 5,3 på det stora, orden är i snitt 6 bokstäver långa på det lilla och 6,5 på det stora, och 1,09 rutor på ett helt svårt bräde delas av två ord. Det sista är den siffra som förklarar varför ett svårt bräde känns tätt. Korsningar är sällsynta. Hittar du en har du oftast hittat två ord på en gång.",
    "Då och då stavar fyllnaden av ren slump ett ord som står i listan. Det händer 7,5 gånger per 10 000 svåra bräden, och varje sådan träff godkänns. Att avvisa den vore att säga till någon som faktiskt hittade ordet att de inte gjorde det, och det är ett sämre fel än att dela ut en gratispoäng var tusende bräde. Den ärliga begränsningen ligger någon annanstans: den svenska ordlistan är nyare än de andra och har ännu inte körts genom samma mätning, så siffrorna ovan gäller de språk som har mätts.",
  ],

  howToPlay: [
    {
      title: "Läs listan",
      body: "Orden står bredvid rutnätet, eller under det på en telefon. Ett struket ord är hittat och kommer inte tillbaka.",
    },
    {
      title: "Dra över ordet",
      body: "Sätt fingret på första bokstaven och dra till den sista. Det går lika bra att trycka på första och sedan på sista.",
    },
    {
      title: "Leta åt alla håll",
      body: "På det minsta rutnätet ligger orden bara nedåt och åt höger. På det största kan de ligga baklänges och snett.",
    },
    {
      title: "Byt storlek i raden ovanför",
      body: "Varje storlek har sitt eget rekord, eftersom sex ord på ett litet rutnät och tio åt alla håll inte är samma uppgift.",
    },
  ],

  tips: [
    {
      title: "Leta efter ovanliga bokstäver",
      body: "Ett ord som innehåller J, X eller Ö går att hitta genom att söka efter den bokstaven ensam. De är sällsynta i fyllnaden också.",
    },
    {
      title: "Svep radvis först",
      body: "Gå igenom rutnätet rad för rad innan du börjar leta snett. De flesta ord på det minsta rutnätet hittas på den första genomgången.",
    },
    {
      title: "Lita på första bokstaven",
      body: "Titta efter var ordets begynnelsebokstav dyker upp och kontrollera bara de ställena. Det är snabbare än att läsa hela rutnätet.",
    },
  ],

  teaches: [
    {
      title: "Att känna igen ett mönster i brus",
      body: "Ett ord i ett rutnät är samma färdighet som att hitta en rubrik på en full sida. Den blir märkbart bättre av att övas.",
    },
    {
      title: "Att läsa åt fel håll",
      body: "Ett ord baklänges kräver att bokstäverna hanteras var för sig i stället för som en form. Det är svårare än det ser ut och därför nyttigt.",
    },
    {
      title: "Ordförråd",
      body: "Listan är skriven för hand per språk, med ord som hör hemma i köket, i kroppen och ute. Ingenting är maskinöversatt.",
    },
  ],

  ages: [
    {
      title: "Sex år, på 8x8",
      body: "Sex ord och bara två riktningar. Ett barn som precis har börjat läsa kan hitta ord här utan att någon förklarar något.",
    },
    {
      title: "Nio år, på 10x10",
      body: "Åtta ord i tre riktningar. Ungefär där snedställda ord slutar kännas orättvisa.",
    },
    {
      title: "Vuxen, på 12x12",
      body: "Tio ord åt alla åtta håll och 55,6 procent fyllnad. Rekordet är tid, och mindre är bättre.",
    },
  ],

  accessibility:
    "Varje ruta är en riktig knapp med sin bokstav som etikett, så hela rutnätet går att nå med tangentbord och läses upp av en skärmläsare. Ett ord kan markeras med två tryck i stället för att dras, vilket är avsiktligt: ett barn eller en person med annan styrning ska aldrig behöva hålla ett finger nedtryckt längs en hel rad. Hittade ord stryks både med färg och med en linje, så färgen aldrig är ensam bärare.",

  together: [
    {
      title: "Dela upp rutnätet",
      body: "En tar övre halvan och en tar nedre. Det går fortare och blir genast en tävling.",
    },
    {
      title: "Läs listan högt",
      body: "Den ena säger ett ord i taget medan den andra letar. Att höra ordet i stället för att läsa det ändrar hur man söker.",
    },
    {
      title: "Slå tiden tillsammans",
      body: "Samma storlek två gånger i rad och jämför klockan. Rekordet ligger kvar på enheten och finns kvar nästa gång.",
    },
  ],

  faq: [
    {
      q: "Hur markerar jag ett ord?",
      a: "Dra från första till sista bokstaven, eller tryck på dem var för sig. Båda sätten fungerar hela tiden.",
    },
    {
      q: "Kan orden ligga baklänges?",
      a: "På det största rutnätet, ja. 8x8 använder bara två riktningar och 10x10 tre, så baklänges dyker upp först på 12x12.",
    },
    {
      q: "Vad händer om fyllnaden råkar stava ett ord i listan?",
      a: "Det godkänns. Det sker 7,5 gånger per 10 000 svåra bräden, och att säga nej till någon som faktiskt hittade ordet vore ett värre fel.",
    },
    {
      q: "Är orden översatta?",
      a: "Nej. Varje språk har en egen lista som är skriven för hand, med ord som barn i det språket faktiskt känner igen.",
    },
    {
      q: "Vad mäter rekordet?",
      a: "Tiden, och mindre är bättre. Varje storlek har sitt eget rekord och de sparas på enheten själv.",
    },
    {
      q: "Kostar det något?",
      a: "Nej. Gratis, utan konto och utan annonser, och det fungerar offline när sidan har laddat en gång.",
    },
  ],

  keywords: ["ordletare", "hitta ord", "rutnät", "ordspel", "bokstäver", "gratis"],
};
