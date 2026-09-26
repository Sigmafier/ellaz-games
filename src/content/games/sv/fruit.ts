import type { GameCopy } from "../../types";

/** Svenska, från `node scripts/brief.mjs sv fruit`. Siffrorna kommer ur
 *  `scripts/sim/fruit-chain.mjs`, reglerna ur spelets `logic.ts`. */
export const fruitSv: GameCopy = {
  name: "Fruktlåda",
  metaTitle: "Fruktlåda - släpp frukt och slå ihop lika par | Ellaz",
  metaDescription:
    "Släpp frukt i en låda, och två lika stora slås ihop till nästa storlek på trappan. Tre bredder, riktig fysik. Gratis i webbläsaren, utan konto.",

  lede: "Släpp en frukt i lådan. Rör två lika stora vid varandra och de slås ihop till nästa storlek på trappan, hela vägen upp till en vattenmelon.",

  body: [
    "Tio storlekar totalt. Lådan delar bara ut de fem minsta, resten byggs genom att slå ihop. Resten byggs fram genom att slå ihop, ända upp till vattenmelonen, som är 35,6 enheter bred, nästan halva en smal lådas bredd.",
    "Bredden är den enda skillnaden mellan nivåerna: 74, 62 eller 52 enheter. Samma frukter, samma fysik, bara mindre plats att jobba med.",
    "Vi lät två bottar spela 240 rundor på riktig fysik. En som bara följer en enkel regel överlevde 156,8 frukter i den breda lådan för 946 poäng, mot 123,1 frukter och 589 poäng för en som släpper helt slumpmässigt, en skillnad på 33,7 fler frukter per runda. I den smala lådan sjönk båda till 91,2 respektive 82,0 frukter, vilket visar hur mycket bredd faktiskt betyder.",
    "Fysiken är verklig. Inte fejkad.",
    "Simuleringen kör 120 delsteg i sekunden, och de två djupast liggande frukterna i en färdig hög kan avsluta bara 1,6 världsenheter inuti varandra, ungefär en halv blåbärsradie. En vattenmelon dök bara upp i 3 av 240 körningar, alla i den breda lådan, och inget par av dem slogs någonsin ihop, vilket är den ärliga begränsningen: att faktiskt nå toppen av trappan är sällsynt även för en spelande bot.",
  ],

  howToPlay: [
    {
      title: "Välj var frukten ska falla",
      body: "Dra i sidled ovanför lådan för att sikta. Frukten faller rakt ned från den punkten.",
    },
    {
      title: "Släpp och låt fysiken sköta resten",
      body: "Frukten studsar och rullar precis som riktiga föremål, och kan landa någon annanstans än där den släpptes.",
    },
    {
      title: "Slå ihop två lika",
      body: "Två frukter av samma storlek som rör vid varandra blir en frukt av nästa storlek på trappan.",
    },
    {
      title: "Håll lådan under linjen",
      body: "En frukt som ligger stilla ovanför linjen i en halv sekund avslutar rundan. Rekordet räknar poäng, och mer är bättre.",
    },
  ],

  tips: [
    {
      title: "Bygg platt, inte högt",
      body: "En rad frukter som ligger jämnt är lättare att slå ihop än ett högt och ostadigt torn.",
    },
    {
      title: "Håll koll på nästa frukt",
      body: "Att veta vad som väntar gör det lättare att planera var den nuvarande ska landa.",
    },
    {
      title: "Lämna en kant fri",
      body: "En sida av lådan utan höga travar ger en säker plats att släppa en oplanerad frukt utan att fylla på linjen.",
    },
  ],

  teaches: [
    {
      title: "Att förutse en kedjereaktion",
      body: "En sammanslagning kan utlösa nästa. Att se den möjligheten innan den händer är vad de bästa dragen har gemensamt.",
    },
    {
      title: "Rumslig planering under press",
      body: "Lådan fylls hela tiden, så att hålla ordning kräver att tänka snabbt och rumsligt på samma gång.",
    },
    {
      title: "Att acceptera fysikens slump",
      body: "En frukt studsar inte alltid dit den var tänkt. Att jobba med det i stället för att förvänta sig perfektion är en nyttig lärdom.",
    },
  ],

  ages: [
    {
      title: "Fyra år, med hjälp",
      body: "Att bara släppa frukt och se vad som händer är roligt även utan att förstå strategin bakom.",
    },
    {
      title: "Sju år, på medel bredd",
      body: "62 enheter bred låda. Ungefär där ett barn börjar sikta med avsikt i stället för att bara släppa.",
    },
    {
      title: "Vuxen, på smal bredd",
      body: "52 enheter, och även en bra bot klarar bara 91,2 frukter i snitt där. Ett riktigt test av planering.",
    },
  ],

  accessibility:
    "Varje frukt har en egen form och storlek som går att känna igen utöver färgen. Siktet styrs med tryck och drag, och frukten visas som en skugga innan den släpps. Det finns ingen tidsgräns förutom den halva sekunden en frukt får ligga över linjen.",

  together: [
    {
      title: "En siktar, en bestämmer",
      body: "Den ena drar för att sikta, den andra säger när det är dags att släppa. Att dela ett beslut i två steg är svårare än det låter.",
    },
    {
      title: "Turas om per frukt",
      body: "Släpp en frukt var i tur och ordning på samma bräde. Ingen vet exakt hur den andres val kommer att landa.",
    },
    {
      title: "Jämför era högsta poäng",
      body: "Spela samma bredd var för sig och jämför resultatet efteråt. Rekordet sparas per bredd på enheten.",
    },
  ],

  faq: [
    {
      q: "Vad händer när två lika frukter möts?",
      a: "De slås ihop till nästa storlek på trappan, hela vägen upp till en vattenmelon.",
    },
    {
      q: "Är fysiken på riktigt?",
      a: "Ja. Frukten studsar och rullar enligt en simulering som kör 120 delsteg i sekunden, precis som verkliga föremål.",
    },
    {
      q: "Vad skiljer nivåerna åt?",
      a: "Bara lådans bredd: 74, 62 eller 52 enheter. Samma frukter och samma fysik på alla tre.",
    },
    {
      q: "Vad avslutar en runda?",
      a: "En frukt som ligger stilla ovanför linjen i en halv sekund. Håll högen under den för att fortsätta.",
    },
    {
      q: "Vad mäter rekordet?",
      a: "Poäng, och mer är bättre. Två vattenmeloner ger 155 poäng, två blåbär bara 1.",
    },
    {
      q: "Kostar det något?",
      a: "Nej. Gratis, utan konto och utan annonser, och det fungerar offline när sidan har laddat en gång.",
    },
  ],

  keywords: ["fruktlåda", "sammanslagning", "fysik", "barn", "pussel", "gratis"],
};
