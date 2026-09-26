import type { GameCopy } from "../../types";

/** Svenska, från `node scripts/brief.mjs sv sort`. Siffrorna kommer ur
 *  `scripts/sim/sort-tubes.mjs` och spelets `logic.ts`. */
export const sortSv: GameCopy = {
  name: "Sortera rör",
  metaTitle: "Sortera rör - häll färg tills varje rör är enfärgat | Ellaz",
  metaDescription:
    "Häll vätska mellan rör tills varje rör bara innehåller en färg. Fyra, sex eller åtta färger, alltid två tomma rör. Gratis, utan konto.",

  lede: "Rör fyllda med blandad färg står i rad. Häll det översta lagret från ett rör till ett annat, och sortera tills varje rör är enfärgat.",

  body: [
    "Fyra, sex eller åtta färger. Alltid två tomma rör, oavsett hur många färger som sorteras. Det låter enkelt tills man ser hur mycket det ändrar: en bot som häller helt slumpmässigt klarar 99,7 procent av de lätta bräderna men når ett läge utan lagligt hällalternativ på hela 10,2 procent av de svåra, mot bara 0,2 procent på lätt.",
    "Ett bra drag känns rätt. Nästan alltid.",
    "En bot som följer en enkel regel, häll bara om det samlar färg snarare än sprider den, löser lätt nivå på 11 pours, medel på 15,5 och svår på 19,4. Det är den regel som faktiskt fungerar, och den kräver inget mer avancerat än att fråga sig om nästa hällning gör saker bättre eller sämre.",
    "Bräden byggs genom att blanda ihop en färdig lösning, en väg tillbaka som i snitt tar 21,8 hällningar på lätt nivå och 34,6 på svår. Den ärliga begränsningen är att den vägen inte är den kortaste lösningen, den är bara EN väg dit, och en spelare som löser brädet smartare kan göra det på färre drag än det tog att blanda ihop det.",
  ],

  howToPlay: [
    {
      title: "Välj ett rör",
      body: "Tryck på röret du vill hälla FRÅN. Det översta lagret av färg är det som flyttas.",
    },
    {
      title: "Välj rör att hälla i",
      body: "Tryck på ett rör med plats kvar. Hällningen sker bara om färgen på toppen matchar eller röret är tomt.",
    },
    {
      title: "Bygg enfärgade rör",
      body: "Ett rör räknas som klart när det bara innehåller en enda färg, från botten till toppen.",
    },
    {
      title: "Sortera hela brädet",
      body: "Spelet är löst när varje rör antingen är tomt eller helt enfärgat. Rekordet räknar antal hällningar.",
    },
  ],

  tips: [
    {
      title: "Häll bara om det samlar färg",
      body: "En regel så enkel som denna löste lätt nivå på 11 hällningar i mätningen. Fråga dig alltid om draget faktiskt förbättrar något.",
    },
    {
      title: "Spara ett tomt rör så länge du kan",
      body: "Bara två tomma rör finns tillgängliga, oavsett hur många färger som ska sorteras, så de är en begränsad resurs att hushålla med.",
    },
    {
      title: "Häll inte bara för att det går",
      body: "Ett lagligt drag är inte alltid ett bra drag. Att sprida en färg över flera rör gör det ofta svårare att samla senare.",
    },
  ],

  teaches: [
    {
      title: "Att planera flera steg framåt",
      body: "En hällning som ser bra ut just nu kan stänga en bättre möjlighet senare. Att se den risken i förväg är hela strategin.",
    },
    {
      title: "Att hushålla med en begränsad resurs",
      body: "Två tomma rör räcker till mycket om de används med omdöme, och lite om de slösas bort tidigt.",
    },
    {
      title: "Att känna igen ett dåligt drag innan det görs",
      body: "Inte alla lagliga hällningar är kloka. Att skilja på de två är en riktig planeringsfärdighet.",
    },
  ],

  ages: [
    {
      title: "Fem år, på fyra färger",
      body: "En bot som bara följer regeln att samla färg löste den här nivån på 11 hällningar. Enkelt att förstå, tillfredsställande att klara.",
    },
    {
      title: "Åtta år, på sex färger",
      body: "Fler rör att hålla reda på och fler beslut per drag. Ungefär där planering börjar löna sig märkbart.",
    },
    {
      title: "Vuxen, på åtta färger",
      body: "En slumpspelare fastnar på över en av tio bräden här. Ett riktigt pussel som kräver eftertanke.",
    },
  ],

  accessibility:
    "Varje färg bär också en egen textur utöver sin nyans, så rören går att läsa utan att förlita sig på färg ensam. Allt görs med tryck, ingenting kräver att du drar med musen. Det finns ingen tidsgräns, och ett drag går att ångra innan det bekräftas i vissa lägen.",

  together: [
    {
      title: "En ser hela brädet, en häller",
      body: "Den ena föreslår vilket rör som ska hällas, den andra utför det. Att motivera ett val högt är en egen övning.",
    },
    {
      title: "Räkna hällningar tillsammans",
      body: "Håll koll på hur många hällningar ni gjort och jämför med den enkla regeln: samlar det här draget färg?",
    },
    {
      title: "Tävla om färst hällningar",
      body: "Spela samma bräde i tur och ordning och se vem som löste det kortast. Rekordet sparas per nivå.",
    },
  ],

  faq: [
    {
      q: "Kan jag hälla vilken färg som helst var som helst?",
      a: "Nej. En hällning kräver att målröret är tomt eller redan har samma färg överst.",
    },
    {
      q: "Kan jag fastna helt?",
      a: "Det kan hända, särskilt på svår nivå, där en slumpspelare når ett läge utan lagligt drag på 10,2 procent av bräden. En genomtänkt strategi undviker det oftast.",
    },
    {
      q: "Hur många tomma rör finns det?",
      a: "Alltid två, oavsett hur många färger som ska sorteras.",
    },
    {
      q: "Vilka nivåer finns?",
      a: "Fyra, sex eller åtta färger, alla med samma två tomma rör att jobba med.",
    },
    {
      q: "Vad mäter rekordet?",
      a: "Antal hällningar det tog att sortera brädet, och färre är bättre.",
    },
    {
      q: "Kostar det något?",
      a: "Nej. Gratis, utan konto och utan annonser, och det fungerar offline när sidan har laddat en gång.",
    },
  ],

  keywords: ["sortera", "rör", "färger", "logik", "pussel", "gratis"],
};
