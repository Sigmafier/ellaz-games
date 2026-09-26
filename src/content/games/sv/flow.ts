import type { GameCopy } from "../../types";

/** Svenska, från `node scripts/brief.mjs sv flow`. Siffrorna kommer ur
 *  `scripts/sim/flow-routes.mjs`, brädena ur spelets `logic.ts`. */
export const flowSv: GameCopy = {
  name: "Flöde",
  metaTitle: "Flöde - dra rör mellan prickar av samma färg | Ellaz",
  metaDescription:
    "Dra ett rör mellan två prickar av samma färg utan att korsa något annat rör. Tre bräden, upp till sex färgpar. Gratis i webbläsaren, utan konto.",

  lede: "Två prickar av samma färg, ett rör att dra mellan dem. Fyll hela brädet utan att ett rör korsar ett annat.",

  body: [
    "Tre storlekar: 5x5 med fyra färgpar, 6x6 med fem och 7x7 med sex. Ett rör på det svåra brädet är i snitt 8,2 rutor långt, medan de två prickarna det förbinder bara sitter 5,1 rutor ifrån varandra i rakt streck. Det är en omväg på 1,61 gånger den korta vägen, och den omvägen är precis vad som gör flera par lösbara samtidigt.",
    "Inga två prickar är grannar. Aldrig.",
    "Över 24 000 svåra par testade hände det aldrig att ett par redan var grannar, vilket tvingar fram en riktig rutt varje gång i stället för ett enda triviellt drag. Det längsta röret på ett svårt bräde täcker i snitt 11,2 rutor, drygt en femtedel av hela rutnätet.",
    "Den snabbaste vägen räcker inte.",
    "Att bara dra varje par längs sin kortaste väg täcker bara 61,2 procent av ett svårt bräde, vilket lämnar nästan fyra rutor av tio helt tomma. Värre än så: att spela så väggar in en färg utan någon återstående väg på 29,5 procent av de svåra bräderna, 24,6 på medel och 17,5 på lätt. Rören måste alltså göra omvägar med flit för att täcka brädet, inte bara nå fram.",
  ],

  howToPlay: [
    {
      title: "Välj en prick",
      body: "Sätt fingret på en av två prickar med samma färg. Ett rör börjar där.",
    },
    {
      title: "Dra till den andra pricken",
      body: "Röret följer fingret genom lediga rutor. Det får inte korsa ett annat rör eller sig självt.",
    },
    {
      title: "Fyll varje ruta",
      body: "Brädet är löst först när alla rutor är täckta av ett rör, inte bara när alla par är förbundna.",
    },
    {
      title: "Byt storlek i raden ovanför",
      body: "Fler färgpar betyder ett svårare pussel. Rekordet räknar antal drag, och färre är bättre.",
    },
  ],

  tips: [
    {
      title: "Lös hörnen och kanterna först",
      body: "En pricka nära ett hörn har färre möjliga vägar, så att lösa den tidigt begränsar resten av brädet snabbare.",
    },
    {
      title: "Låt röret göra en omväg med flit",
      body: "Den kortaste vägen mellan två prickar täcker bara 61,2 procent av ett svårt bräde. Resten måste komma från omvägar.",
    },
    {
      title: "Backa hellre än att gissa vidare",
      body: "Ett rör som väggar in en annan färg utan väg framåt går att dra om. Det kostar inget extra drag att ändra sig innan du släpper.",
    },
  ],

  teaches: [
    {
      title: "Att se hela ytan, inte bara målet",
      body: "Att nå fram räcker inte, hela brädet måste täckas. Det är en annan sorts planering än att bara hitta en väg.",
    },
    {
      title: "Att reservera utrymme åt andra",
      body: "Ett rör som tar den kortaste vägen kan spärra ett annat helt. Att tänka på grannarnas behov är den verkliga skickligheten.",
    },
    {
      title: "Att backa från ett dåligt val",
      body: "Ett rör som leder fel går alltid att dra om innan det släpps. Att se felet tidigt sparar tid senare.",
    },
  ],

  ages: [
    {
      title: "Sex år, på 5x5",
      body: "Fyra färgpar och ett litet bräde. Att bara dra en linje mellan två lika prickar är lätt att förstå direkt.",
    },
    {
      title: "Nio år, på 6x6",
      body: "Fem färgpar och fler lägen där rören måste göra omvägar. Ungefär där hela-brädet-tänkandet börjar krävas.",
    },
    {
      title: "Vuxen, på 7x7",
      body: "Sex färgpar, och att bara ta den kortaste vägen täcker knappt sex av tio rutor. Ett riktigt pussel.",
    },
  ],

  accessibility:
    "Varje ruta är märkt med kolumn, rad och vilken färg den tillhör, så brädet går att lösa med tangentbord och läses upp av en skärmläsare. Varje färg bär också en egen form. Ingenting kräver att du drar med musen specifikt, ett rör går även att bygga med enstaka tryck ruta för ruta.",

  together: [
    {
      title: "En ser helheten, en drar",
      body: "Den ena håller koll på vilka rutor som är tomma, den andra drar rören. Att förklara varför en väg är bättre är en egen övning.",
    },
    {
      title: "Lös ett par i taget tillsammans",
      body: "Turas om att välja vilket färgpar som ska förbindas näst. Ordningen spelar roll för hur resten av brädet öppnas.",
    },
    {
      title: "Jämför antal drag",
      body: "Spela samma bräde två gånger och se vem som löste det med färre drag. Rekordet sparas per storlek.",
    },
  ],

  faq: [
    {
      q: "Måste hela brädet täckas?",
      a: "Ja. Att bara förbinda paren räcker inte, varje ruta måste ha ett rör genom sig innan pusslet räknas som löst.",
    },
    {
      q: "Kan två rör korsa varandra?",
      a: "Nej. Ett rör som stöter på ett annat måste dras om längs en annan väg.",
    },
    {
      q: "Ligger prickarna av samma par nära varandra?",
      a: "Aldrig som direkta grannar. Över 24 000 testade par var alltid minst två rutor ifrån varandra.",
    },
    {
      q: "Vilka storlekar finns?",
      a: "5x5 med fyra färgpar, 6x6 med fem och 7x7 med sex.",
    },
    {
      q: "Vad mäter rekordet?",
      a: "Antal drag det tog att lösa brädet, och färre är bättre. Rekordet sparas per storlek.",
    },
    {
      q: "Kostar det något?",
      a: "Nej. Gratis, utan konto och utan annonser, och det fungerar offline när sidan har laddat en gång.",
    },
  ],

  keywords: ["flöde", "rör", "prickar", "logik", "pussel", "gratis"],
};
