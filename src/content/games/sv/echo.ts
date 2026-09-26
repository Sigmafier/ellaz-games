import type { GameCopy } from "../../types";

/** Svenska, från `node scripts/brief.mjs sv echo`. Siffrorna kommer ur
 *  `scripts/sim/thinking-levels.mjs` och spelets `logic.ts`. */
export const echoSv: GameCopy = {
  name: "Eko",
  metaTitle: "Eko - kom ihåg och upprepa mönstret | Ellaz",
  metaDescription:
    "Plattor blinkar i en följd, och du upprepar den. En platta till läggs till varje runda. Tre nivåer, från fyra plattor till sex. Gratis och utan konto.",

  lede: "Plattor blinkar i tur och ordning. Titta, kom ihåg, och tryck dem sedan i samma ordning. Varje runda lägger till en platta till.",

  body: [
    "Fyra, fem eller sex plattor beroende på nivå, och följden växer med en platta per klarad runda. Det låter enkelt tills siffrorna sätts på det: på svår nivå med sex plattor finns det 279 936 möjliga följder redan vid runda sju, mot 64 möjliga vid runda tre på den lätta nivån med fyra plattor.",
    "Blinket blir snabbare. Hela tiden snabbare.",
    "Blinket krymper mot ett golv. Från 460 millisekunder ned mot 260, med 170 millisekunder tomrum mellan varje blink. Skillnaden mellan 460 och 260 millisekunder känns liten skriven som text och stor när det faktiskt är din tur att hänga med.",
    "Den ärliga begränsningen är att minnet, inte fingrarna, är det som sätter taket. De flesta människor kan hålla kvar runt sju enskilda saker i huvudet samtidigt utan att repetera dem, så en följd på tio eller elva plattor är svår för de allra flesta, oavsett hur snabbt blinket går.",
  ],

  howToPlay: [
    {
      title: "Titta på blinket",
      body: "Plattorna lyser upp en i taget i en bestämd ordning. Titta noga, det visas bara en gång per runda.",
    },
    {
      title: "Upprepa i samma ordning",
      body: "Tryck på plattorna i exakt den ordning de blinkade. Ett fel avslutar rundan.",
    },
    {
      title: "En platta till läggs till",
      body: "Klarar du följden växer den med en platta nästa runda, och hela sekvensen visas igen från början.",
    },
    {
      title: "Se hur långt du kommer",
      body: "Rekordet är den längsta följden du klarat. Ingen tidsgräns utöver blinkets egen takt.",
    },
  ],

  tips: [
    {
      title: "Säg färgerna tyst för dig själv",
      body: "Att koppla ett ord till varje platta, inte bara ett läge, gör det lättare att hålla kvar en lång följd.",
    },
    {
      title: "Dela upp långa följder",
      body: "Att komma ihåg fyra grupper om två är lättare för de flesta än att komma ihåg åtta lösa steg.",
    },
    {
      title: "Vänta inte på perfekt lugn",
      body: "Blinket blir snabbare ju längre spelet går. Att öva på att hålla fokus trots tempot är en del av utmaningen.",
    },
  ],

  teaches: [
    {
      title: "Arbetsminne",
      body: "Att hålla kvar en växande följd i huvudet, utan att skriva ned den, är precis den förmåga spelet tränar.",
    },
    {
      title: "Att lyssna och titta noga en gång",
      body: "Följden visas bara en gång per runda. Att fånga upp allt på första försöket är en vana som lönar sig utanför spelet också.",
    },
    {
      title: "Att acceptera en gräns",
      body: "Alla har en punkt där följden blir för lång. Att se den gränsen utan att bli upprörd är en nyttig lärdom.",
    },
  ],

  ages: [
    {
      title: "Fyra år, på fyra plattor",
      body: "Kortast möjliga följd och 460 millisekunders blink från start. Ett bra första möte med att komma ihåg i ordning.",
    },
    {
      title: "Sju år, på fem plattor",
      body: "Fler alternativ och en följd som växer snabbare. Ungefär där ett barn börjar gruppera mönstret i huvudet.",
    },
    {
      title: "Vuxen, på sex plattor",
      body: "279 936 möjliga följder redan vid runda sju. Här är det minnet, inte reflexerna, som sätter gränsen.",
    },
  ],

  accessibility:
    "Varje platta har en egen form utöver sin färg, så blinket går att följa utan att förlita sig på färg ensam. Allt görs med tryck, ingenting kräver att du drar. Blinkets tempo är detsamma för alla spelare på samma nivå, och det finns ingen extra tidsgräns utöver det.",

  together: [
    {
      title: "En tittar, en trycker",
      body: "Den ena håller koll på ordningen och säger den högt, den andra trycker. Att lita på ett minne som inte är ditt eget är svårare än det låter.",
    },
    {
      title: "Turas om att förlänga",
      body: "En person upprepar följden och lägger till en platta i huvudet, sedan tar nästa person över. Ett muntligt minnesspel utan skärm.",
    },
    {
      title: "Jämför era rekord",
      body: "Spela var för sig och jämför hur långt ni kom. Rekordet sparas per enhet.",
    },
  ],

  faq: [
    {
      q: "Hur många plattor finns det?",
      a: "Fyra, fem eller sex beroende på nivå. Fler plattor betyder fler möjliga följder vid samma rundnummer.",
    },
    {
      q: "Blir spelet snabbare med tiden?",
      a: "Ja. Blinket går från 460 millisekunder ned mot ett golv på 260, ju längre följden blir.",
    },
    {
      q: "Vad händer om jag trycker fel?",
      a: "Rundan tar slut där, och rekordet sparar den längsta följden du klarade innan felet.",
    },
    {
      q: "Visas följden mer än en gång?",
      a: "Nej, bara en gång per runda. Det är en del av vad spelet faktiskt tränar.",
    },
    {
      q: "Vad mäter rekordet?",
      a: "Den längsta följden du har klarat, och en högre siffra är bättre.",
    },
    {
      q: "Kostar det något?",
      a: "Nej. Gratis, utan konto och utan annonser, och det fungerar offline när sidan har laddat en gång.",
    },
  ],

  keywords: ["eko", "minnesspel", "följd", "koncentration", "barn", "gratis"],
};
