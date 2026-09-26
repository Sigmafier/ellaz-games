import type { GameCopy } from "../../types";

/** Svenska, från `node scripts/brief.mjs sv bees`. Siffrorna kommer ur
 *  `scripts/sim/spawn-ladder.mjs` och spelets `logic.ts`. */
export const beesSv: GameCopy = {
  name: "Bina",
  metaTitle: "Bina - fånga bina, låt resten flyga | Ellaz",
  metaDescription:
    "Djur flyger över skärmen och du fångar bara bina. 40 sekunder per runda, tre nivåer och aldrig fler än tre likadana i rad. Gratis och utan konto.",

  lede: "Olika smådjur flyger över skärmen i 40 sekunder. Tryck på bina, låt de andra passera obesvärade.",

  body: [
    "Tre nivåer, och det som ändras är hur ofta ett bi faktiskt dyker upp. Lätt siktar på att 65 procent av djuren ska vara bin och landar i verkligheten på 59 procent, medel siktar på 60 och landar på 56, mätt över 1 500 rundor per nivå. Skillnaden mellan siktat och verkligt tal är avsiktlig variation, inte ett fel: samma exakta andel varje gång skulle göra spelet förutsägbart på ett tråkigt sätt.",
    "Aldrig fyra likadana. Aldrig i rad.",
    "Regeln är enkel. Högst tre identiska djur får dyka upp efter varandra, bi eller inte. Det betyder att en lång svit av icke-bin bryts garanterat, vilket ger en känsla av att tur vänder utan att det är fusk. På lätt nivå flyger 28 djur förbi under de 40 sekunderna, varav ungefär 17 bin, och på svår är det 57 djur med ungefär 29 bin, vilket är dubbelt så mycket att hålla reda på i samma tid.",
    "Den ärliga begränsningen är att spelet mäter reaktion mer än skicklighet. Ett barn som är snabbt med fingret vinner över ett som tänker efter, och det är precis vad ett spel om snabbhet ska göra, men det är inte samma sak som ett tänkespel.",
  ],

  howToPlay: [
    {
      title: "Titta efter bina",
      body: "Flera olika djur flyger förbi. Bara bina räknas, och de ser annorlunda ut än de andra.",
    },
    {
      title: "Tryck på ett bi",
      body: "Ett tryck på rätt djur ger poäng direkt. Ett tryck på fel djur kostar ingenting utöver en liten studs.",
    },
    {
      title: "Håll ögonen öppna i 40 sekunder",
      body: "Rundan pågår i exakt 40 sekunder, oavsett hur många bin du hinner fånga.",
    },
    {
      title: "Byt nivå för snabbare tempo",
      body: "Svår nivå dubblar antalet djur i samma tid. Rekordet räknar antal fångade bin, oavsett nivå.",
    },
  ],

  tips: [
    {
      title: "Lär dig binas form utantill",
      body: "Att känna igen ett bi på en bråkdel av en sekund, utan att tänka efter, är hela skillnaden mellan ett bra och ett dåligt resultat.",
    },
    {
      title: "Missa hellre än att vänta",
      body: "Ett fel tryck kostar nästan ingenting, så det lönar sig att trycka snabbt på det som ser ut som ett bi.",
    },
    {
      title: "Räkna inte med mönster",
      body: "Högst tre likadana djur får komma i rad, men det är den enda regeln. Resten är på riktigt slumpmässigt.",
    },
  ],

  teaches: [
    {
      title: "Snabb visuell igenkänning",
      body: "Att skilja ett bi från andra flygande djur på en blick är exakt den färdighet spelet mäter och tränar.",
    },
    {
      title: "Att ignorera brus",
      body: "De flesta djuren är inte bin. Att låta dem passera utan att reagera är lika viktigt som att fånga rätt djur.",
    },
    {
      title: "Att hålla fokus under en fast tid",
      body: "40 sekunder är kort nog att orka koncentrera sig helt, vilket gör spelet till en bra kort övning i uthållig uppmärksamhet.",
    },
  ],

  ages: [
    {
      title: "Fyra år, på lätt",
      body: "28 djur på 40 sekunder och 65 procent siktade bin. Gott om chanser att lyckas även för ett litet barn.",
    },
    {
      title: "Sju år, på medel",
      body: "Fler djur i samma tid och en lägre andel bin. Ungefär där reaktionshastigheten börjar avgöra resultatet.",
    },
    {
      title: "Tio år och uppåt, på svår",
      body: "57 djur på 40 sekunder, ungefär dubbelt tempo mot lätt nivå. Ett riktigt test av snabbhet.",
    },
  ],

  accessibility:
    "Ett bi är märkt med sin egen form och färg, så det går att känna igen utan att förlita sig på en enda visuell signal. Allt görs med tryck, ingenting kräver att du drar eller håller inne. Ett fel tryck straffas bara med en liten studs, aldrig med ett poängtapp.",

  together: [
    {
      title: "En ropar bi, en trycker",
      body: "Den ena säger till högt så fort ett bi syns, den andra trycker. Att lita på ett rop kräver eget fokus.",
    },
    {
      title: "Turas om per runda",
      body: "40 sekunder är kort nog att dela lätt. Jämför resultatet efteråt och se vem som fångade flest.",
    },
    {
      title: "Räkna missarna tillsammans",
      body: "Efter rundan, prata om vilka djur som såg ut som bin men inte var det. Det skärper blicken till nästa gång.",
    },
  ],

  faq: [
    {
      q: "Hur länge pågår en runda?",
      a: "Exakt 40 sekunder, oavsett hur många bin du fångar under tiden.",
    },
    {
      q: "Kostar ett fel tryck något?",
      a: "Nästan ingenting. Djuret studsar till, och ingen poäng dras bort.",
    },
    {
      q: "Hur ofta dyker ett bi upp?",
      a: "Ungefär 59 procent av djuren på lätt nivå, 56 procent på medel, mätt över 1 500 rundor. Aldrig fler än tre andra djur i rad.",
    },
    {
      q: "Vad skiljer nivåerna åt?",
      a: "Hur många djur som flyger förbi under de 40 sekunderna och hur stor andel som är bin. Fler djur, snabbare tempo.",
    },
    {
      q: "Vad mäter rekordet?",
      a: "Antal fångade bin på en enda runda, och mer är bättre. Samma rekord gäller över alla nivåer.",
    },
    {
      q: "Kostar det något?",
      a: "Nej. Gratis, utan konto och utan annonser, och det fungerar offline när sidan har laddat en gång.",
    },
  ],

  keywords: ["bin", "djur", "reaktion", "barn", "trycka", "gratis"],
};
