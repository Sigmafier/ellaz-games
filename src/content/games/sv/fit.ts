import type { GameCopy } from "../../types";

/** Svenska, från `node scripts/brief.mjs sv fit`. Botsiffrorna kommer ur
 *  `scripts/sim/fit-lookahead.mjs`, reglerna ur spelets `logic.ts`. */
export const fitSv: GameCopy = {
  name: "Passa in",
  metaTitle: "Passa in - lägg formerna och rensa rader | Ellaz",
  metaDescription:
    "Lägg former på brädet från ett fack med tre åt gången. Fyll en rad eller kolumn och den försvinner. Tre nivåer, gratis och utan konto.",

  lede: "Tre former erbjuds åt gången. Dra dem till brädet var du vill, och en fylld rad eller kolumn försvinner.",

  body: [
    "Nitton former finns i uppsättningen totalt, och den lätta nivån hämtar bara ur tio av dem, vilket gör bräden lite mer förutsägbara att planera för. Brädet är 6 rutor gånger 6 på lätt och 8 gånger 8 på medel och svår, och ingen ny form dyker upp förrän alla tre i facket är placerade.",
    "Att titta framåt lönar sig. Olika mycket, ändå.",
    "En bot som kontrollerar varje laglig placering innan den väljer överlever i snitt 112,7 placeringar på lätt nivå, mot 21,8 för en bot som bara lägger första bästa. Fem gånger så länge. Bara genom att titta. På svår nivå krymper skillnaden kraftigt: samma två bottar når bara 19,3 och 12,5, en vinst på ungefär hälften så mycket. Ett svårt bräde straffar alltså planering mindre än man kanske tror, helt enkelt för att det fylls upp så snabbt att inget val hinner betyda så mycket.",
    "Brädet är i snitt 50,2 procent fullt när en omgång på svår nivå tar slut, och 45,3 procent av alla omgångar slutar med mer än halva brädet fortfarande tomt. Det säger något viktigt: spelet handlar sällan om att fylla brädet helt, utan om att hantera formerna som redan finns bäst möjligt innan ingen av dem längre får plats.",
    "Poängen belönar att vänta på det stora ögonblicket. Två rader rensade på en gång ger tre gånger så mycket som en ensam rad, så att spara en nästan-full rad för rätt form kan löna sig rejält. Den ärliga begränsningen är att spelet aldrig visar vilka tre former som kommer härnäst, så en sådan plan bygger alltid på en gissning.",
  ],

  howToPlay: [
    {
      title: "Välj en form från facket",
      body: "Tre former väntar samtidigt. Vilken som helst av dem kan placeras först.",
    },
    {
      title: "Dra den till brädet",
      body: "Formen visas som en skugga innan du släpper, så du ser exakt var den kommer att hamna.",
    },
    {
      title: "Fyll en rad eller kolumn",
      body: "En helt fylld rad eller kolumn försvinner direkt och ger poäng.",
    },
    {
      title: "Fortsätt tills inget passar",
      body: "Omgången tar slut när ingen av de tre formerna i facket längre får plats någonstans på brädet.",
    },
  ],

  tips: [
    {
      title: "Titta på hela brädet innan du lägger",
      body: "En bot som kontrollerade varje möjlig placering överlevde fem gånger så länge som en som bara la första bästa, på lätt nivå.",
    },
    {
      title: "Spara en nästan-full rad",
      body: "Två rader på en gång ger tre gånger poängen av en ensam. Om en form kan vänta, låt den vänta på rätt tillfälle.",
    },
    {
      title: "Undvik att stänga in hörn",
      body: "En liten lucka i ett hörn kan bli omöjlig att fylla senare. Tänk på formen som blir kvar, inte bara den du lägger nu.",
    },
  ],

  teaches: [
    {
      title: "Rumslig planering",
      body: "Att se hur en form passar in bland de som redan ligger där är en ren rumslig färdighet, tränad ett drag i taget.",
    },
    {
      title: "Att väga nu mot senare",
      body: "En form som passar perfekt nu kan förstöra chansen till en dubbelrensning strax efter. Den avvägningen är hela spelets kärna.",
    },
    {
      title: "Att acceptera ofullständighet",
      body: "Nästan hälften av alla omgångar slutar med mer än halva brädet tomt, och det är helt normalt. Spelet är inte till för att alltid rensas helt.",
    },
  ],

  ages: [
    {
      title: "Sex år, på lätt",
      body: "Ett bräde på 6 gånger 6 och bara tio enklare former att vänta sig. Lätt att förstå, svårt att bemästra helt.",
    },
    {
      title: "Nio år, på medel",
      body: "Ett bräde på 8 gånger 8 och hela formuppsättningen på nitton. Ungefär där planering börjar löna sig märkbart.",
    },
    {
      title: "Vuxen, på svår",
      body: "Samma stora bräde men fyllt så snabbt att planering knappt hinner betyda något. Ett spel om att hantera det som redan finns.",
    },
  ],

  accessibility:
    "Varje ruta i brädet och facket är märkt med sin position, så spelet går att styra med tangentbord och läses upp av en skärmläsare. Formerna skiljs åt av både färg och kontur. Det finns ingen tidsgräns, och en form kan flyttas fram och tillbaka innan den släpps.",

  together: [
    {
      title: "En väljer form, en placerar",
      body: "Den ena bestämmer vilken av de tre formerna som ska läggas, den andra drar den till brädet. Att komma överens är halva utmaningen.",
    },
    {
      title: "Räkna lediga rutor tillsammans",
      body: "Håll koll högt på hur många rutor som är kvar i en nästan-full rad. Det gör väntan på rätt form roligare.",
    },
    {
      title: "Jämför rekord",
      body: "Spela samma nivå var för sig och jämför poängen efteråt. Rekordet sparas på enheten själv.",
    },
  ],

  faq: [
    {
      q: "Hur många former finns det?",
      a: "Nitton totalt. Den lätta nivån hämtar bara ur tio av dem, för mer förutsägbara bräden.",
    },
    {
      q: "Vad ger flest poäng?",
      a: "Att rensa två rader eller kolumner på en gång, vilket ger tre gånger så mycket som en enda rad.",
    },
    {
      q: "Vilken storlek har brädet?",
      a: "6 gånger 6 på lätt nivå, 8 gånger 8 på medel och svår.",
    },
    {
      q: "Måste jag rensa hela brädet?",
      a: "Nej. Nästan hälften av alla omgångar på svår nivå slutar med mer än halva brädet fortfarande tomt, vilket är helt normalt.",
    },
    {
      q: "Vad mäter rekordet?",
      a: "Poäng, och mer är bättre. Rekordet sparas per nivå.",
    },
    {
      q: "Kostar det något?",
      a: "Nej. Gratis, utan konto och utan annonser, och det fungerar offline när sidan har laddat en gång.",
    },
  ],

  keywords: ["passa in", "former", "rader", "pussel", "klassiker", "gratis"],
};
