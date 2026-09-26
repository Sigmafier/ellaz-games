import type { GameCopy } from "../../types";

/** Svenska, skriven från `node scripts/brief.mjs sv memory`. Siffrorna kommer
 *  från `scripts/sim/memory-moves.mjs`. Inget här är översatt. */
export const memorySv: GameCopy = {
  name: "Memory",
  metaTitle: "Memory för barn - gratis online | Ellaz",
  metaDescription:
    "Vänd två kort och leta rätt på paren. Tre nivåer med 6, 8 och 10 par, gratis i webbläsaren, utan konto och helt utan annonser.",

  lede: "Vänd två kort. Är de lika stannar de uppe. Tre nivåer med 6, 8 eller 10 par, och rekordet räknas i drag, där färre är bättre.",

  body: [
    "Ett memory är samma spel oavsett vem som lägger det, och det är hela poängen med att ha ett här. Korten ligger med baksidan upp, du vänder två, och de stannar uppe om de är lika. Annars vänds de tillbaka och det är din tur igen. Ingen klocka räknar ner medan ett barn tänker, och det finns ingen gräns för hur många gånger du får fel. Det enda spelet mäter är hur många drag du behövde.",
    "Rekordet är antal drag. Färre är bättre.",
    "Vi lät en robot spela 20 000 omgångar för att se vad siffran egentligen betyder. På lätt klarar en spelare med perfekt minne det på 9,2 drag i snitt, medan en som bara gissar behöver 36. På svår är avståndet mycket större: 15,6 mot 104,3. Det är den enda statistik som säger något om vad spelet faktiskt tränar, för skillnaden mellan de två talen är precis den del som minnet står för.",
    "Det lägsta möjliga är antalet par, alltså 6, 8 eller 10 beroende på nivå. Den går inte att slå. Ingen når den utan ren tur. Varje nivå har sitt eget rekord, så ett lätt bräde ställs aldrig mot ett svårt.",
  ],

  howToPlay: [
    {
      title: "Tryck på ett kort",
      body: "Ett tryck vänder kortet. Det finns inget att dra och inget att hålla nere, så spelet går att klara med en hand, med en styrpinne eller med vilken kontakt som helst som kan skicka ett tryck.",
    },
    {
      title: "Vänd ett till",
      body: "Är de två lika stannar de uppe och du fortsätter. Är de olika vänds de tillbaka efter en kort stund, och den stunden är med flit lång nog att hinna titta.",
    },
    {
      title: "Hitta alla par",
      body: "Omgången är slut när brädet är tomt. Då visas hur många drag det tog, och om det var färre än förra gången sparas det som ditt nya rekord.",
    },
    {
      title: "Byt nivå när det blir för lätt",
      body: "Raden ovanför brädet har lätt, medel och svår, alltså 6, 8 och 10 par. Byter du nivå delas ett nytt bräde, och rekordet för den nivån är ett eget.",
    },
  ],

  tips: [
    {
      title: "Börja i ett hörn och arbeta dig igenom",
      body: "Att vända kort på måfå ger dig platser du inte minns var de låg. Går du systematiskt får varje vändning en adress i huvudet, och det är adressen och inte bilden som är det svåra att komma ihåg.",
    },
    {
      title: "Säg bilden högt",
      body: "Ett barn som säger björn när det ser en björn minns den märkbart längre än ett som bara tittar. Det kostar ingenting och det är den enda tekniken som fungerar direkt.",
    },
    {
      title: "Ett fel par är inte bortkastat",
      body: "Varje miss lär dig två platser. En spelare som gissar behöver 36 drag på lätt och en som minns behöver 9,2, och hela avståndet däremellan byggs av just de missarna.",
    },
  ],

  teaches: [
    {
      title: "Korttidsminne för platser",
      body: "Spelet frågar inte vad du såg utan var du såg det. Det är en annan sorts minne än att komma ihåg ett namn, och det är den sorten som gör det lättare att hitta saker i ett rum.",
    },
    {
      title: "Att göra en plan i stället för att gissa",
      body: "Skillnaden mellan 9,2 och 36 drag är inte tur. Ett barn som märker att ordning hjälper har upptäckt något som fungerar långt utanför det här brädet.",
    },
    {
      title: "Att vänta på sin tur",
      body: "Korten vänds tillbaka i sin egen takt. Att inte trycka under tiden är i sig en övning, och den blir lättare med åldern.",
    },
  ],

  ages: [
    {
      title: "Tre år, på lätt",
      body: "Sex par och stora kort. Det finns ingenting att läsa, så ett barn som inte läser spelar själv. På den här nivån är det helt i sin ordning att bara vända tills det stämmer.",
    },
    {
      title: "Fem år, på medel",
      body: "Åtta par är ungefär där ett barn börjar minnas platser med flit i stället för av en slump. Det är också nivån där siffran under brädet börjar betyda något.",
    },
    {
      title: "Sju år och uppåt, på svår",
      body: "Tio par, och en spelare med gott minne kommer nära 15,6 drag. En vuxen som spelar mot sitt eget rekord har något att göra här i flera veckor.",
    },
  ],

  accessibility:
    "Hela spelet går på tryck. Inget drag krävs någonstans, korten är stora nog för en liten hand eller en grov pekare, och varje kort är en riktig knapp med en etikett, så det fungerar med tangentbord och med skärmläsare. Det finns ingen klocka, så ingenting går förlorat för att någon behöver längre tid. Ljudet går att stänga av, och spelet spelas precis lika bra utan det.",

  together: [
    {
      title: "Turas om vid varje miss",
      body: "Den klassiska regeln: hittar du ett par får du fortsätta, annars går turen vidare. Spelet räknar bara drag, så ni håller själva reda på vem som tog flest par.",
    },
    {
      title: "En vuxen som minnesstöd",
      body: "Ett barn vänder och en vuxen säger bara var något låg när barnet frågar. Det gör spelet till ett samtal, och det är i samtalet om var saker låg som tekniken faktiskt lärs in.",
    },
    {
      title: "Jaga rekordet ihop",
      body: "Rekordet är ett per enhet och per nivå, så ett hushåll jagar samma siffra. Åtta drag på lätt är ett mål som en familj kan hålla på med en hel kväll.",
    },
  ],

  faq: [
    {
      q: "Är det gratis?",
      a: "Ja, helt och för alltid. Inga annonser, inga köp inne i spelet, och inget konto att skapa.",
    },
    {
      q: "Behöver mitt barn kunna läsa?",
      a: "Nej. Det finns inga ord i spelet, bara bilder, så ett barn som inte läser klarar det på egen hand.",
    },
    {
      q: "Hur många par finns det?",
      a: "Sex, åtta eller tio, beroende på vilken nivå du väljer i raden ovanför brädet.",
    },
    {
      q: "Vad betyder siffran under brädet?",
      a: "Antalet drag du har gjort. Färre är bättre, och det lägsta som är möjligt är antalet par: 6, 8 eller 10.",
    },
    {
      q: "Sparas rekordet?",
      a: "Ja, ett per nivå, på enheten själv. Det ligger inte på någon server, så rensar du webbläsarens data försvinner det.",
    },
    {
      q: "Fungerar det offline?",
      a: "Ja. När sidan har laddat en gång fungerar spelet offline, och hela webbplatsen går att installera som app.",
    },
  ],

  keywords: ["memory", "par", "minne", "kort", "barn", "koncentration"],
};
