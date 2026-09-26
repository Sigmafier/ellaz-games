import type { GameCopy } from "../../types";

/** Svenska, från `node scripts/brief.mjs sv backgammon`. Reglerna kommer ur
 *  spelets egen `logic.ts` och `logic.test.ts`. */
export const backgammonSv: GameCopy = {
  name: "Backgammon",
  metaTitle: "Backgammon - match till 5 poäng | Ellaz",
  metaDescription:
    "Backgammon med hela regelverket: dubbelkub, gammon och backgammon, Crawfordpartiet och tvånget att spela båda tärningarna. Gratis och utan konto.",

  lede: "Två tärningar, 15 brickor per sida och 24 tungor att ta sig runt. Först ut med alla sina brickor vinner partiet.",

  body: [
    "En match går till 5 poäng som standard. Ett vanligt parti ger 1 poäng, ett gammon ger 2 och ett backgammon ger 3, allt innan kuben har räknats in. Att spela en match i stället för ett enskilt parti är det som gör dubbelkuben meningsfull, eftersom ett dubblande bara är intressant när ställningen i matchen betyder något.",
    "Båda tärningarna måste spelas.",
    "Finns det en dragföljd som använder båda, då är du skyldig att använda den. Går bara en av dem att spela måste det vara den högre. Det är regeln flest hemmaversioner hoppar över, och den ändrar spelet på riktigt: en spelare som får välja bort den obekväma tärningen kan smita ur lägen som annars är hela poängen med backgammon. En dubbel ger fyra drag i stället för två.",
    "Crawfordregeln finns med. När en sida når 4 av 5 poäng stängs kuben av under exakt ett parti, så att den som leder inte kan dubblas ut i det ögonblick matchen är nästan avgjord. Efter det partiet är kuben tillbaka.",
    "Den ärliga begränsningen är tärningarna. Backgammon är ett skickligare spel än det ser ut, men över ett enskilt parti avgör slumpen ofta ändå, och en match till 5 poäng är kort nog att en sämre spelare vinner ganska ofta. Det är en egenskap hos spelet och inte hos den här versionen. Vill du att skicklighet ska synas, spela flera matcher.",
  ],

  howToPlay: [
    {
      title: "Slå tärningarna",
      body: "Två tärningar per tur. En dubbel ger fyra drag med samma tal i stället för två.",
    },
    {
      title: "Flytta en bricka",
      body: "Tryck på en bricka och sedan på tungan du vill flytta den till. Lagliga mål markeras, så inget olagligt drag går att göra.",
    },
    {
      title: "Slå ut och kom tillbaka",
      body: "En ensam bricka som blir träffad hamnar på baren och måste tillbaka in innan sidan får göra något annat.",
    },
    {
      title: "Bär av alla femton",
      body: "När alla 15 brickorna är hemma kan de bäras av. Först klar vinner partiet, och poängen beror på hur långt motståndaren hann.",
    },
  ],

  tips: [
    {
      title: "Lämna inte ensamma brickor",
      body: "En ensam bricka kan slås ut och börja om från baren. Två på samma tunga kan inte träffas alls.",
    },
    {
      title: "Bygg en spärr",
      body: "Flera tungor i rad som du håller gör motståndarens brickor låsta. Det är den strategi som vinner flest partier.",
    },
    {
      title: "Dubbla när du leder",
      body: "Kuben är värd mest när du är före men inte färdig. Dubblar du för sent tackar motståndaren nej och du får bara 1 poäng.",
    },
  ],

  teaches: [
    {
      title: "Att räkna sannolikhet",
      body: "Hur troligt är det att bli träffad från sex tungors avstånd? Frågan dyker upp varje tur och svaret går att räkna ut.",
    },
    {
      title: "Risk mot säkerhet",
      body: "Ett djärvt drag kan vinna partiet eller kosta det. Att välja medvetet i stället för av vana är hela skickligheten.",
    },
    {
      title: "Att acceptera otur",
      body: "Ibland gör du allt rätt och förlorar ändå. Det är en nyttig sak att öva på, och backgammon lär ut den varje kväll.",
    },
  ],

  ages: [
    {
      title: "Sju år, med hjälp",
      body: "Att flytta brickor efter tärningarna går att lära sig direkt. Brädet markerar alla lagliga drag, så inget behöver kommas ihåg.",
    },
    {
      title: "Tolv år, hel match",
      body: "En match till 5 poäng med gammon och backgammon inräknade. Ungefär där poängräkningen börjar kännas som en del av spelet.",
    },
    {
      title: "Vuxen, med kuben",
      body: "Dubbelkuben och Crawfordpartiet gör matchen till ett eget spel ovanpå brädet. Det är där backgammon blir riktigt djupt.",
    },
  ],

  accessibility:
    "Varje tunga är en riktig knapp vars etikett säger vilket nummer den har och hur många brickor som står där, så brädet går att spela med tangentbord och läses upp av en skärmläsare. Brickornas sida visas med både färg och form, så färgen aldrig är ensam bärare. Ingenting kräver att du drar, och det finns ingen klocka.",

  together: [
    {
      title: "Två vid samma enhet",
      body: "En match till 5 poäng tar ungefär en kvart och behöver inget konto. Brickorna markeras tydligt, så ingen tappar bort vems tur det är.",
    },
    {
      title: "Säg varför du dubblar",
      body: "Att förklara sitt dubblande högt gör att båda lär sig vad kuben faktiskt är till för. Det gör också nästa match jämnare.",
    },
    {
      title: "Räkna pipen tillsammans",
      body: "Summan av alla dina brickors avstånd hem är det enda objektiva måttet på vem som leder. Räkna den ihop ett par gånger.",
    },
  ],

  faq: [
    {
      q: "Hur lång är en match?",
      a: "Till 5 poäng som standard. Ett vanligt parti ger 1 poäng, ett gammon 2 och ett backgammon 3, innan kuben räknas.",
    },
    {
      q: "Måste jag spela båda tärningarna?",
      a: "Ja, om det finns en dragföljd som använder båda. Går bara en att spela måste det vara den högre.",
    },
    {
      q: "Vad är Crawfordpartiet?",
      a: "När en sida når 4 av 5 poäng stängs kuben under exakt ett parti. Efter det är den tillbaka i spel.",
    },
    {
      q: "Vad ger en dubbel?",
      a: "Fyra drag med samma tal i stället för två. Det är den enskilt största vändningen en tärning kan ge.",
    },
    {
      q: "Går det att spela mot en annan person?",
      a: "Ja, två vid samma enhet. Det behövs varken konto eller uppkoppling mellan er.",
    },
    {
      q: "Kostar det något?",
      a: "Nej. Gratis, utan konto och utan annonser, och det fungerar offline när sidan har laddat en gång.",
    },
  ],

  keywords: ["backgammon", "tärningar", "bräde", "klassiker", "två spelare", "gratis"],
};
