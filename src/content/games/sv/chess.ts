import type { GameCopy } from "../../types";

/** Svenska, från `node scripts/brief.mjs sv chess`. Reglerna och siffrorna
 *  kommer ur spelets egen `logic.ts` och `logic.test.ts`. */
export const chessSv: GameCopy = {
  name: "Schack",
  metaTitle: "Schack - spela i webbläsaren, utan konto | Ellaz",
  metaDescription:
    "Schack med alla regler: rockad, en passant, bondeförvandling till fyra pjäser, patt, femtiodragsregeln och trefaldig ställning. Gratis, utan konto.",

  lede: "Schack med hela regelverket, inklusive de regler som brukar utelämnas: rockad, en passant, patt, femtiodragsregeln och trefaldig upprepning.",

  body: [
    "Vitt börjar och har 20 lagliga drag. Efter att båda sidor har dragit en gång finns 400 ställningar, och efter fyra halvdrag är de 197 281. Den siffran är värd att stanna vid, eftersom den säger varför schack aldrig tar slut: allt det växer ur sexton pjäser på ett bräde på 64 rutor, utan slump och utan någonting dolt.",
    "Alla regler finns med. Ingenting förenklat.",
    "Rockad åt båda hållen, med kontroll av att kungen varken står i schack, passerar en hotad ruta eller hamnar i schack. En passant, som är den regel flest spelare aldrig har sett. Bondeförvandling som frågar vilken pjäs du vill ha, alla 4 alternativen, i stället för att anta att du vill ha en dam. Patt räknas som remi och inte som en vinst. Femtiodragsregeln räknas som 100 halvdrag, och trefaldig upprepning av samma ställning gör partiet remi.",
    "Att räkna med patt och remi är ett beslut om vad spelet är. Ett schack utan dem är kortare och orättvisare, eftersom en förlorande sida förlorar även när ställningen faktiskt är oavgjord. Det är dessutom den vanligaste förenklingen i gratis schack på nätet, och den brukar upptäckas mitt i ett parti där en spelare hade räknat med remin.",
    "Den ärliga begränsningen är motståndaren. Datorn här är gjord för att vara spelbar för ett barn och för att svara snabbt på en telefon, inte för att vara stark. Den som spelar i klubb kommer att slå den. Vill du ha motstånd är två personer vid samma enhet ett bättre spel än motorn. Det fungerar offline.",
  ],

  howToPlay: [
    {
      title: "Tryck på en pjäs",
      body: "Alla lagliga drag för just den pjäsen markeras på brädet. Ett drag som lämnar din egen kung i schack visas inte, eftersom det inte är lagligt.",
    },
    {
      title: "Tryck på en ruta",
      body: "Pjäsen flyttas dit. Ingenting kräver att du drar, och ett tryck på samma pjäs igen avmarkerar den.",
    },
    {
      title: "Välj pjäs vid förvandling",
      body: "En bonde som når sista raden frågar vilken av 4 pjäser du vill ha. Ibland är ett torn eller en springare det rätta svaret.",
    },
    {
      title: "Spela ut partiet",
      body: "Schackmatt avgör, patt är remi, och samma ställning tre gånger är också remi. Alla tre utfallen står skrivna på skärmen när de inträffar.",
    },
  ],

  tips: [
    {
      title: "Ut med springarna först",
      body: "En springare når 2 rutor från ett hörn och 8 från mitten. Det är hela argumentet för att inte lämna den kvar där den står.",
    },
    {
      title: "Rockera tidigt",
      body: "Kungen är säkrare i ett hörn bakom bönder än i mitten, och rockaden får ett torn i spel på köpet. Två saker för ett drag.",
    },
    {
      title: "Räkna innan du slår",
      body: "Vem slår sist på rutan? Att räkna angripare och försvarare innan draget är den vanligaste orsaken till att en pjäs inte försvinner.",
    },
  ],

  teaches: [
    {
      title: "Att se flera drag framåt",
      body: "Ett drag har följder, och följderna har följder. Schack är den äldsta övningen i det som finns och fortfarande den bästa.",
    },
    {
      title: "Att ta ansvar för ett misstag",
      body: "Ingen slump finns att skylla på. Varje förlust har en orsak som går att hitta, vilket gör den lärorik snarare än orättvis.",
    },
    {
      title: "Att värdera",
      body: "Är ett torn värt en springare och en bonde? Frågan har inget fast svar, och att börja känna efter är början på schackspelandet.",
    },
  ],

  ages: [
    {
      title: "Fem år, med en vuxen",
      body: "Att lära sig hur pjäserna går, en i taget, är en fin första kväll. Brädet visar alla lagliga drag, så ingen behöver komma ihåg dem.",
    },
    {
      title: "Åtta år, mot datorn",
      body: "Ungefär där ett barn kan hålla i huvudet att motståndaren också har en plan. Datorn är snäll nog att förlora mot.",
    },
    {
      title: "Vuxen, mot en annan vuxen",
      body: "Två personer vid samma enhet. Det är den starkaste motståndare den här sidan har att erbjuda, och det är avsiktligt.",
    },
  ],

  accessibility:
    "Varje ruta är en riktig knapp vars etikett säger vilken ruta det är och vilken pjäs som står där, så hela partiet går att spela med tangentbord och läses upp av en skärmläsare. Lagliga drag visas med både färg och markör, så färgen aldrig är ensam bärare. Ingenting kräver att du drar, och det finns ingen klocka.",

  together: [
    {
      title: "Två vid samma bräde",
      body: "En enhet, två personer, och inget konto. Brädet vänder sig inte, så sitt bredvid varandra i stället för mitt emot.",
    },
    {
      title: "Säg hotet högt",
      body: "Ett nybörjarparti går mycket bättre om båda säger vad de hotar. Det är ingen fusk, det är undervisning.",
    },
    {
      title: "Spela med handikapp",
      body: "En vuxen som tar bort sin dam gör partiet jämnt utan att spela sämre med flit. Barn märker när någon förlorar med avsikt.",
    },
  ],

  faq: [
    {
      q: "Finns rockad och en passant med?",
      a: "Ja, båda, med alla sina villkor. En passant är den regel flest spelare aldrig har sett, och den fungerar här.",
    },
    {
      q: "Vad händer vid patt?",
      a: "Partiet blir remi. Patt räknas aldrig som en vinst, vilket är den vanligaste förenklingen i gratis schack på nätet.",
    },
    {
      q: "Kan jag välja något annat än dam vid förvandling?",
      a: "Ja. Alla 4 pjäserna erbjuds, eftersom en springare eller ett torn ibland är det rätta valet.",
    },
    {
      q: "Räknas femtiodragsregeln?",
      a: "Ja, som 100 halvdrag utan slag och utan bondedrag. Trefaldig upprepning av samma ställning ger också remi.",
    },
    {
      q: "Hur stark är datorn?",
      a: "Inte särskilt. Den är gjord för att svara snabbt på en telefon och för att gå att slå, inte för att vara ett motstånd i klubbklass.",
    },
    {
      q: "Kostar det något?",
      a: "Nej. Gratis, utan konto och utan annonser, och det fungerar offline när sidan har laddat en gång.",
    },
  ],

  keywords: ["schack", "bräde", "pjäser", "klassiker", "två spelare", "gratis"],
};
