import type { GameCopy } from "../../types";

/** Svenska, från `node scripts/brief.mjs sv merge`. Siffrorna kommer ur
 *  `scripts/sim/merge-ladder.mjs`, brädena ur spelets `logic.ts`. */
export const mergeSv: GameCopy = {
  name: "Slå ihop djur",
  metaTitle: "Slå ihop djur - från larv till drake | Ellaz",
  metaDescription:
    "Tryck ihop två lika djur för att få nästa på stegen, fjorton steg från larv till drake. Tre bräden, gratis i webbläsaren, utan konto.",

  lede: "Två lika djur intill varandra, ett tryck, och de blir nästa djur på stegen. Fjorton steg upp, från larv till drake.",

  body: [
    "Fjorton steg totalt. En fjäril är 4 larver värda, en groda 8, en pingvin 64, och en drake längst upp är 8 192 larver, 8 191 sammanslagningar och 212 992 poäng räknat i ett enda djur. Det är ett tal svårt att ta in, och det är precis varför det är den siffra som stannar kvar.",
    "Vägen dit varierar. Mycket, mellan nivåerna. Den första grodan dyker upp efter 18 tryck på lätt nivå, 13 på medel och hela 50 på svår, medan det första lejonet kräver 1 530, 1 010 respektive 3 136 tryck. Den svåra nivån är alltså inte konstant svårare, den är ojämnt svårare: snabbare i mitten men mycket längre i slutet.",
    "Ett bräde behöver aldrig fastna.",
    "Vi körde 150 simulerade omgångar, och ingen av dem tog slut i brist på drag. Ett bräde på 4x4 kärvar bara om tre av de allra högsta djuren står där samtidigt, vilket är sällsynt nog att det knappt är värt att oroa sig för. Den ärliga begränsningen är att en val, det översta djuret på den lugnaste nivån, kostade 12 282 tryck att nå i mätningen, vilket är en verklig sittning snarare än ett par minuter.",
  ],

  howToPlay: [
    {
      title: "Titta på brädet",
      body: "Djur av olika slag ligger utspridda. Två av samma slag som är grannar går att slå ihop.",
    },
    {
      title: "Tryck på ett par",
      body: "Ett tryck på två lika djur intill varandra slår ihop dem till nästa djur på stegen.",
    },
    {
      title: "Nya djur dyker upp",
      body: "Ett tomt bräde fylls på av sig själv efter varje sammanslagning, så det finns alltid något att arbeta med.",
    },
    {
      title: "Klättra så högt du kan",
      body: "Fjorton steg från larv till drake. Rekordet är poäng, och mer är bättre.",
    },
  ],

  tips: [
    {
      title: "Bygg par, inte spridning",
      body: "Att lägga likadana djur bredvid varandra i stället för utspridda gör nästa sammanslagning enklare att hitta.",
    },
    {
      title: "Släpp inte de högsta djuren ensamma",
      body: "Ett bräde kärvar bara om tre av de högsta djuren fastnar tillsammans, så håll ett öga på var de hamnar.",
    },
    {
      title: "Räkna med en lång sittning för de sista stegen",
      body: "Det översta djuret kostade över tolv tusen tryck i mätningen. De sista stegen är ett maraton, inte en spurt.",
    },
  ],

  teaches: [
    {
      title: "Exponentiell tillväxt",
      body: "Varje steg är dubbelt så mycket värt som det förra, och en drake på 8 192 larver gör den idén påtaglig på ett sätt en formel inte gör.",
    },
    {
      title: "Tålamod med ett långt mål",
      body: "De sista stegen tar tusentals tryck. Att fortsätta trots att slutet känns långt bort är en egen färdighet.",
    },
    {
      title: "Att planera brädets layout",
      body: "Var ett djur läggs påverkar vilka sammanslagningar som blir möjliga senare. Det är enkel logik med stora konsekvenser.",
    },
  ],

  ages: [
    {
      title: "Fyra år, med hjälp",
      body: "Att bara trycka på två lika djur och se dem bli ett nytt är roligt även utan att förstå hela stegen.",
    },
    {
      title: "Sju år, mot en fjäril",
      body: "4 larver krävs, och det tar bara 18 tryck på lätt nivå. Ett kort och tydligt första mål.",
    },
    {
      title: "Alla åldrar, mot draken",
      body: "8 192 larver och 8 191 sammanslagningar. Ett långsiktigt mål att återvända till över flera dagar.",
    },
  ],

  accessibility:
    "Varje ruta är märkt med vilket djur som står där och dess position, så brädet går att spela med tangentbord och läses upp av en skärmläsare. Djuren skiljs åt av tydliga former, inte bara färg. Ingenting kräver att du drar, och det finns ingen tidsgräns.",

  together: [
    {
      title: "En letar par, en trycker",
      body: "Den ena pekar ut två lika djur, den andra trycker. Att lita på en annans blick över hela brädet är en egen övning.",
    },
    {
      title: "Sätt ett gemensamt mål",
      body: "Bestäm att nå fram till nästa djur på stegen tillsammans. Att fira varje steg gör den långa vägen roligare.",
    },
    {
      title: "Räkna tryck tillsammans",
      body: "Håll koll på hur många tryck det tar att nå ett visst djur, och jämför med mätningens siffror.",
    },
  ],

  faq: [
    {
      q: "Hur många steg finns det?",
      a: "Fjorton, från larv längst ned till drake längst upp.",
    },
    {
      q: "Kan brädet fastna helt?",
      a: "Nästan aldrig. Av 150 simulerade omgångar tog ingen slut i brist på drag.",
    },
    {
      q: "Hur mycket är en drake värd?",
      a: "8 192 larver, byggd genom 8 191 sammanslagningar och värd 212 992 poäng.",
    },
    {
      q: "Varför tar svår nivå längre tid för vissa djur?",
      a: "Den första grodan dyker upp snabbare där än på lätt nivå, men det första lejonet tar betydligt längre tid. Svårigheten är ojämn.",
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

  keywords: ["slå ihop", "djur", "stege", "barn", "pussel", "gratis"],
};
