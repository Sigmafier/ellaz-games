import type { GameCopy } from "../../types";

/** Svenska, från `node scripts/brief.mjs sv balloons`. Siffrorna kommer ur
 *  `scripts/sim/spawn-ladder.mjs` och spelets `logic.ts`. */
export const balloonsSv: GameCopy = {
  name: "Ballonger",
  metaTitle: "Ballonger - tryck på rätt färg | Ellaz",
  metaDescription:
    "Ballonger stiger uppåt i fem färger. Tryck bara på dagens mål och låt resten passera. Tre nivåer, ingen bestraffning för ett fel. Gratis och utan konto.",

  lede: "Ballonger i fem färger stiger uppåt över skärmen. Tryck på dem som har rätt färg och låt de andra flyga förbi.",

  body: [
    "Fem färger, och varje har sin egen form som en påminnelse för den som inte skiljer färger lätt. En ballong stannar på skärmen 4,2 sekunder på lätt nivå, 3,2 på medel och 2,4 på svår, vilket är hela svårighetsgraden: samma regel, mindre tid att bestämma sig.",
    "Fel färg straffas aldrig. Aldrig något.",
    "Ett tryck på fel ballong kostar ingenting. Ingen räknare går bakåt. Målet varje runda är 5, 7 eller 9 rätta ballonger beroende på nivå, och spelet garanterar att en målballong dyker upp senast efter två av fel färg i rad, så väntan tar aldrig orimligt lång tid.",
    "Den ärliga begränsningen är att fem färger på en gång är mycket för ett riktigt litet barn. De yngsta spelarna klarar sig bäst med bara två färger att skilja på, vilket den lättaste nivån ännu inte erbjuder specifikt, utan bara en snabbare takt av samma fem.",
  ],

  howToPlay: [
    {
      title: "Se vilken färg som gäller",
      body: "Målfärgen visas överst på skärmen innan rundan börjar, och den håller sig densamma hela rundan.",
    },
    {
      title: "Tryck på rätt ballong",
      body: "Ballonger i fem olika färger stiger uppåt. Ett tryck på rätt färg räknas, resten kan lämnas ifred.",
    },
    {
      title: "Ett fel tryck kostar ingenting",
      body: "Ballongen studsar till, och sedan fortsätter allt precis som förut. Inget poängtapp, ingen omstart.",
    },
    {
      title: "Nå rundans mål",
      body: "5, 7 eller 9 rätta ballonger beroende på nivå. Rekordet räknar hur många rundor du klarat.",
    },
  ],

  tips: [
    {
      title: "Titta på formen, inte bara färgen",
      body: "Varje färg har sin egen form. Den som är osäker på en nyans kan luta sig mot formen i stället.",
    },
    {
      title: "Vänta lugnt om inget rätt syns",
      body: "En målballong garanteras dyka upp inom två fel i rad, så det lönar sig aldrig att stressa fram ett tryck.",
    },
    {
      title: "Byt ned en nivå om det känns för snabbt",
      body: "3,2 sekunder på skärmen är kort för många barn. Den lugnare nivån ger nästan dubbelt så lång tid att bestämma sig.",
    },
  ],

  teaches: [
    {
      title: "Att skilja färger",
      body: "Fem färger på en gång är en riktig övning i att hålla isär nyanser snabbt, inte bara känna igen en i taget.",
    },
    {
      title: "Att avstå från ett drag",
      body: "Att låta en ballong av fel färg passera utan att trycka är lika viktigt som att trycka på rätt en.",
    },
    {
      title: "Att inte skrämmas av ett misstag",
      body: "Ett fel tryck syns knappt. Det gör spelet till en trygg plats att öva reaktion i, utan rädsla för att göra bort sig.",
    },
  ],

  ages: [
    {
      title: "Tre år, med hjälp",
      body: "En vuxen som säger färgens namn högt varje gång gör spelet begripligt innan barnet läser färgen själv.",
    },
    {
      title: "Fem år, på lätt",
      body: "4,2 sekunder per ballong och ett mål på 5 rätta. Gott om tid att titta, tänka och trycka.",
    },
    {
      title: "Åtta år, på svår",
      body: "2,4 sekunder och ett mål på 9. Fem färger i snabb takt är en riktig utmaning även för den som kan alla.",
    },
  ],

  accessibility:
    "Varje färg bär en egen form, så en ballong går att känna igen utan att se skillnad på färgerna. Målfärgen visas också som text och form överst på skärmen. Allt görs med tryck, ingenting kräver att du drar, och ett fel tryck straffas aldrig.",

  together: [
    {
      title: "Säg färgen högt tillsammans",
      body: "Innan ett tryck, säg färgens namn. Det kopplar ordet till ballongen på ett sätt som bara titta inte gör.",
    },
    {
      title: "Byt roller",
      body: "En pekar ut vilken ballong som är rätt, den andra trycker. Att lita på en annans öga är en egen övning.",
    },
    {
      title: "Räkna rätta ballonger tillsammans",
      body: "Håll koll högt på hur många som är kvar till målet. Det gör väntan roligare och slutet tydligare.",
    },
  ],

  faq: [
    {
      q: "Vad händer om jag trycker på fel färg?",
      a: "Ballongen studsar till, och det kostar ingenting mer. Ingen räknare påverkas.",
    },
    {
      q: "Hur länge syns en ballong?",
      a: "4,2 sekunder på lätt nivå, 3,2 på medel och 2,4 på svår.",
    },
    {
      q: "Hur många färger finns det?",
      a: "Fem, och varje bär också en egen form för att göra dem lättare att skilja åt.",
    },
    {
      q: "Kan jag behöva vänta länge på rätt färg?",
      a: "Nej. En målballong dyker alltid upp senast efter två av fel färg i rad.",
    },
    {
      q: "Vad mäter rekordet?",
      a: "Hur många rundor du klarat, och mer är bättre. Målet per runda är 5, 7 eller 9 beroende på nivå.",
    },
    {
      q: "Kostar det något?",
      a: "Nej. Gratis, utan konto och utan annonser, och det fungerar offline när sidan har laddat en gång.",
    },
  ],

  keywords: ["ballonger", "färger", "barn", "reaktion", "trycka", "gratis"],
};
