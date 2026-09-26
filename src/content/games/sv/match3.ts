import type { GameCopy } from "../../types";

/** Svenska, från `node scripts/brief.mjs sv match3`. Kedjesiffrorna kommer ur
 *  `scripts/sim/match3-cascades.mjs`, reglerna ur spelets `logic.ts`. */
export const match3Sv: GameCopy = {
  name: "Tre i rad",
  metaTitle: "Tre i rad - byt plats och rensa brädet | Ellaz",
  metaDescription:
    "Byt plats på två stenar så att tre eller fler hamnar i rad. Tre nivåer, från fyra färger på 6x6 till sex färger på 8x8. Gratis i webbläsaren.",

  lede: "Byt plats på två stenar bredvid varandra så att tre eller fler av samma sort hamnar i rad. De försvinner, och allt ovanför faller ned.",

  body: [
    "Tre nivåer, en variabel. Det som ändras är hur många färger brädet innehåller. Lätt har fyra färger på ett bräde som är 6 rutor gånger 6, Medel har fem på 7 gånger 7, och Svår har sex på 8 gånger 8. Fler färger betyder färre tillfälligheter, vilket låter som en liten justering och är den enda som behövs.",
    "Fallet kan rensa mer.",
    "När stenar försvinner faller de ovanför ned och kan bilda nya rader utan att du rör dem. På lätt kedjar 59,2 procent av de lyckade bytena vidare till minst två steg, mot 36,2 procent på svår. Den längsta kedja som har uppmätts gick till fjorton steg på ett bräde som var 6 gånger 6. Ett byte rensar i snitt 9,96 stenar på lätt och 5,33 på svår, och det är hela skillnaden i tempo mellan nivåerna: samma regel, halva utdelningen.",
    "Poängen är gjord för att belöna kedjan snarare än bytet. Varje steg ger tio poäng per sten gånger sitt djup, alltså är det tredje steget i en kedja värt tre gånger så mycket per sten som det första, upp till en gräns på fem. Att titta på hela brädet i stället för att ta första bästa byte är värt 1,27 gånger så mycket på lätt och 1,07 på svår, mätt mot en bot som tar vilket lagligt byte som helst.",
    "Den siffran är också den ärliga begränsningen. På svår är belöningen för att tänka nästan borta, eftersom sex färger gör brädet så glest på tillfälligheter att ett välplanerat byte och ett slumpmässigt hamnar nära varandra. Namnen lurar dig. Vill du att eftertanke ska löna sig är Lätt faktiskt den intressantare nivån.",
  ],

  howToPlay: [
    {
      title: "Tryck på två stenar",
      body: "Två stenar bredvid varandra byter plats. Ett byte som inte skapar en rad görs inte, så inga drag går förlorade.",
    },
    {
      title: "Tre i rad räcker",
      body: "Vågrätt eller lodrätt, tre eller fler av samma sort. Fyra eller fem ger mer poäng och en starkare sten.",
    },
    {
      title: "Låt kedjan gå klart",
      body: "Stenarna ovanför faller ned och kan rensa igen av sig själva. Varje steg i en kedja är värt mer än det förra.",
    },
    {
      title: "Nå rundans mål",
      body: "Den första rundan på svår ber om fyrtio stenar, och varje runda därefter tio till. Rekordet är hur långt du kom.",
    },
  ],

  tips: [
    {
      title: "Arbeta nedifrån",
      body: "Ett byte längst ned får allt ovanför att falla, vilket är hur kedjor uppstår. Ett byte i översta raden kan bara rensa sig självt.",
    },
    {
      title: "Titta på hela brädet",
      body: "Att välja det bästa bytet i stället för det första är värt 1,27 gånger så mycket på lätt. Det kostar bara några sekunder.",
    },
    {
      title: "Spara ett uppenbart drag",
      body: "När brädet ser tomt ut är det skönt att veta att ett byte finns kvar. Om inga drag finns blandas brädet om automatiskt.",
    },
  ],

  teaches: [
    {
      title: "Att se mönster i rörelse",
      body: "Brädet förändras hela tiden, så mönstret ska hittas i något som inte står still. Det är svårare och nyttigare än det ser ut.",
    },
    {
      title: "Orsak och verkan",
      body: "Ett byte längst ned får följder högst upp. Att börja förutse dem är det steg som skiljer en spelare från en som bara trycker.",
    },
    {
      title: "Att vänta på det bättre draget",
      body: "Det första möjliga bytet är sällan det bästa. Spelet betalar mätbart för några sekunders eftertanke.",
    },
  ],

  ages: [
    {
      title: "Fyra år, på Lätt",
      body: "Fyra färger och ett litet bräde. Ingen text, ingen klocka, och ett barn som bara byter plats på saker klarar sig utmärkt.",
    },
    {
      title: "Sju år, på Medel",
      body: "Fem färger på 7 gånger 7. Ungefär där ett barn börjar leta efter draget i stället för att hitta det av misstag.",
    },
    {
      title: "Vuxen, på Svår",
      body: "Sex färger på 8 gånger 8 och en runda som börjar på fyrtio stenar. Tempot, inte klurigheten, är det som avgör.",
    },
  ],

  accessibility:
    "Varje färg bär också en egen form, så två stenar går att skilja åt utan att se skillnad på färgerna. Varje ruta är en riktig knapp vars etikett säger vilken kolumn och rad den ligger i, så brädet går att spela med tangentbord och läses upp av en skärmläsare. Ingenting kräver att du drar, och det finns ingen tidsgräns på ett drag.",

  together: [
    {
      title: "Leta draget tillsammans",
      body: "Den ena pekar ut ett byte och den andra letar ett bättre. Att jämföra två förslag är hela strategin i spelet.",
    },
    {
      title: "Jaga kedjan",
      body: "Kom överens om att bara göra byten längst ned på brädet. Kedjorna blir längre och rundan kortare.",
    },
    {
      title: "Turas om per runda",
      body: "En runda var, samma nivå, och jämför hur långt ni kom. Rekordet sparas per nivå på enheten.",
    },
  ],

  faq: [
    {
      q: "Vad händer om det inte finns några drag kvar?",
      a: "Brädet blandas om automatiskt. Det hände 0,001 gånger per runda på svår i mätningen och aldrig på de andra nivåerna.",
    },
    {
      q: "Vad skiljer nivåerna åt?",
      a: "Antalet färger och brädets storlek: fyra färger på 6x6, fem på 7x7 och sex på 8x8.",
    },
    {
      q: "Hur räknas poängen?",
      a: "Tio poäng per sten gånger kedjans djup, med djupet räknat upp till fem. Ett tredje steg är alltså värt tre gånger så mycket per sten som det första.",
    },
    {
      q: "Behöver barnet kunna läsa?",
      a: "Nej. Det finns ingen text i själva spelet, bara färger och former.",
    },
    {
      q: "Vad mäter rekordet?",
      a: "Hur många rundor du klarade, och mer är bättre. Varje nivå har sitt eget rekord, sparat på enheten.",
    },
    {
      q: "Kostar det något?",
      a: "Nej. Gratis, utan konto och utan annonser, och det fungerar offline när sidan har laddat en gång.",
    },
  ],

  keywords: ["tre i rad", "pussel", "färger", "byt plats", "barn", "gratis"],
};
