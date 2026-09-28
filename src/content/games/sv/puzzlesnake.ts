import type { GameCopy } from "../../types";

/**
 * Pusselorm, på svenska, skrivet för sin egen läsare i stället för översatt.
 *
 * Varje siffra kommer från `src/games/puzzlesnake/` - nivåerna och deras bräden
 * ur `levels.ts`, stjärnmarginalen ur `logic.ts` och allt som lösaren och den
 * giriga roboten hittade ur `solver.test.ts`. Inget är påhittat här.
 */
export const puzzlesnakeSv: GameCopy = {
  name: "Pusselorm",
  metaTitle: "Pusselorm - gratis ormspel och logikpussel | Ellaz",
  metaDescription:
    "En orm som bara rör sig när du trycker. Ät alla äpplen och gå in genom guldporten. 12 nivåer i två världar, ångra när du vill och omöjligt att förlora.",

  lede: "Pusselorm är den gamla vanliga ormen, fast som ett pussel. Ett tryck är ett steg, varje äpple gör dig en ruta längre och guldporten öppnas först när sista äpplet är uppätet. Du kan inte förlora och du kan alltid ångra, så det enda som spelar roll är ordningen.",

  body: [
    "Ormen väntar på dig. Den tar ett steg per tryck och står sedan still, hur länge som helst.",

    "Kroppen är pusslet. Varje äpple lägger till en ruta, och svansen följer exakt samma väg som huvudet tog, så korridoren du nyss gick igenom kan nu vara full av dig själv. Huvudet får gå in i rutan som svansen lämnar, eftersom svansen flyttar sig i samma tryck. Det får däremot inte vända in i sin egen nacke eller gå genom en vägg, och porten är stängd så länge ett äpple finns kvar. Ett nekat steg blir bara ett litet ryck i huvudet. Mer händer inte.",

    "Det finns 12 nivåer. Trädgården har sex av dem på ett bräde med 7 gånger 7 rutor, och ormen börjar med 2 eller 3 rutor. Labyrinten har sex på 9 gånger 9, där ormen börjar med 5 och är 9 lång vid sista äpplet.",

    "Vi testade varje nivå med en lösare som prövar alla tänkbara följder av tryck. Sedan med en girig robot som alltid går till närmaste äpple. Roboten klarar första nivån på minsta möjliga antal tryck, 5. Den fastnar på alla 6 nivåerna i Labyrinten. Där ligger fällan. I Labyrinten gör 12 av de 24 äpplena nivån omöjlig om du äter dem först, och på nivå 1-2 avgör ordningen ensam om du behöver 11 tryck eller 19. Hela spelet på bästa sätt är 277 tryck.",

    "Stjärnorna räknar tryck. Tre på bästa möjliga, två för en liten omväg, en för att du klarade det.",
  ],

  howToPlay: [
    {
      title: "En ruta i taget",
      body: "Tryck på en piltangent eller W A S D, en knapp på plattan under brädet, eller svep över brädet. Ormen tar exakt ett steg och stannar.",
    },
    {
      title: "Ät alla äpplen",
      body: "Varje äpple gör ormen en ruta längre. Guldporten är streckad så länge den är stängd och blir hel och lysande när sista äpplet är uppätet.",
    },
    {
      title: "Gå in genom porten",
      body: "Led huvudet in i den öppna porten så är nivån klar. Remsan ovanför brädet visar redan från början hur många tryck tre stjärnor kräver.",
    },
    {
      title: "Ångra, börja om, välj nivå",
      body: "Ångra tar tillbaka ett tryck, så många gånger du vill. Börja om lägger tillbaka nivån som den var från start. Nivåer öppnar kartan över båda världarna, och varje nivå öppnas när den före är löst.",
    },
  ],

  tips: [
    {
      title: "Räkna svansen innan du går in",
      body: "En korridor med en enda ingång är bara säker om det finns plats att vända där inne eller en annan väg ut. Innan du äter ett äpple längst in i en återvändsgränd, räkna ut hur lång du blir efteråt.",
    },
    {
      title: "Närmaste äpplet är en fråga",
      body: "Leta upp äpplet som skulle stänga in dig om du åt det tidigt, och spara det till sist. Nästan varje nivå i Labyrinten har minst ett sådant.",
    },
    {
      title: "Låna svansens steg",
      body: "Rutan som svansen är på väg att lämna är fri redan i samma tryck. I Labyrintens trånga hörn är det ofta den enda vägen förbi.",
    },
    {
      title: "Att ångra kostar ingenting",
      body: "Inget räknas förrän du når porten. Prova en väg, se var kroppen hamnar och ta tillbaka den.",
    },
  ],

  teaches: [
    {
      title: "Att tänka några drag framåt",
      body: "Varje nivå löses i huvudet innan den löses på brädet. Den som trycker utan plan fastnar oftast, och lär sig något av det.",
    },
    {
      title: "Ordning får följder",
      body: "Vilket äpple du äter först ändrar allt som kommer efter, eftersom kroppen du lämnar bakom dig blir väggen i nästa drag.",
    },
    {
      title: "Att ta sig ur ett misstag",
      body: "Att fastna är inte att förlora. Ångra gör det till kunskap: nu vet du vilken ordning som inte fungerar.",
    },
  ],

  ages: [
    {
      title: "Under 6 år",
      body: "De två första nivåerna i Trädgården går att spela med knapparna och en vuxen bredvid. Efter det blir ordningen oftast för svår i den åldern, och det gör ingenting.",
    },
    {
      title: "7 till 12 år",
      body: "Trädgården är lagom stor. Labyrinten är en riktig utmaning och löses oftast med många ångrade steg.",
    },
    {
      title: "Tonåringar och vuxna",
      body: "Labyrinten är er. Tre stjärnor på 2-6 betyder att hitta den enda bästa vägen, 39 tryck lång.",
    },
  ],

  accessibility:
    "Det finns ingen klocka och inget att förlora, så alla spelar i sin egen takt. Varje steg är ett enda tryck: en piltangent eller W A S D, plattan på skärmen eller ett svep över brädet, och inget steg kräver att du håller kvar eller drar. Porten byter form och inte bara färg när den öppnas, från streckad till hel, och varje knapp på sidan, nivårutorna också, har ett namn som en skärmläsare kan läsa upp.",

  together: [
    {
      title: "Planera högt",
      body: "En håller telefonen och den andra säger stegen. Bara den som planerar pratar, och den som håller trycker exakt det som sägs.",
    },
    {
      title: "Kapplöpning till tre stjärnor",
      body: "Två spelare, samma nivå, två enheter. Minst antal tryck vinner, och vid lika vinner den som aldrig ångrade något.",
    },
    {
      title: "Jaga fällan",
      body: "Innan någon rör sig gissar ni vilket äpple som skulle göra nivån omöjlig om det åts först. Kontrollera med ångra.",
    },
  ],

  faq: [
    {
      q: "Kan man förlora i Pusselorm?",
      a: "Nej. Det finns ingen klocka och inget slut på spelet. Om ormen inte kan ta ett enda steg säger brädet det, och ångra eller börja om tar dig därifrån.",
    },
    {
      q: "Vad betyder siffran bredvid de tre stjärnorna?",
      a: "Det minsta antalet tryck som löser nivån, hittat av en lösare som prövade varje möjlig följd. Det går inte att slå, bara att tangera.",
    },
    {
      q: "Hur får jag två stjärnor?",
      a: "Genom att klara nivån på högst 20 procent fler tryck än det bästa, och alltid minst 2 fler. Två lösningar av samma nivå skiljer sig alltid med ett jämnt antal tryck, så 2 är den minsta skillnad som finns.",
    },
    {
      q: "Varför kan ormen inte gå tillbaka samma väg?",
      a: "Den kan inte vända in i sin egen nacke. Den kan däremot gå in i rutan som svansen lämnar, eftersom svansen flyttar sig i samma tryck.",
    },
    {
      q: "Hur låser jag upp nästa nivå?",
      a: "Genom att lösa nivån före, med hur många stjärnor som helst. En låst nivå vickar till när du trycker på den, så att du ser var den ligger.",
    },
    {
      q: "Sparas det jag har klarat?",
      a: "Dina bästa stjärnor för varje nivå sparas på den här enheten, och om du går mitt i en nivå öppnas den precis där du slutade.",
    },
    {
      q: "Är det samma spel som Orm?",
      a: "Samma orm och samma färger, men ett annat spel. Orm handlar om reflexer och fart. Här är varje nivå ett fast pussel och ingenting händer förrän du trycker.",
    },
  ],

  keywords: ["pusselorm", "ormspel", "logikpussel", "tänkspel", "turbaserat spel"],
};
