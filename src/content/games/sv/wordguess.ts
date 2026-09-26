import type { GameCopy } from "../../types";

/** Svenska, från `node scripts/brief.mjs sv wordguess`. Öppningssiffrorna
 *  kommer ur `scripts/sim/wordguess-openers.mjs`. Inget här är översatt. */
export const wordguessSv: GameCopy = {
  name: "Gissa ordet",
  metaTitle: "Gissa ordet - gratis ordspel i webbläsaren | Ellaz",
  metaDescription:
    "Gissa det dolda ordet på sex försök. Ord på 4, 5 eller 6 bokstäver, färgade brickor efter varje gissning. Gratis, utan konto och utan nedladdning.",

  lede: "Gissa det dolda ordet på sex försök. Varje gissning färgar sina bokstäver: grönt betyder rätt bokstav på rätt plats, lila betyder att bokstaven finns i ordet men någon annanstans.",

  body: [
    "Välj en längd. Skriv ett ord. Läs färgerna. Så mycket är hela spelet, och det tar ungefär tio sekunder att lära sig.",
    "Den intressanta frågan är vilket ord man ska öppna med, och den går att mäta i stället för att tycka om. Varje ord i en lista har spelats som första gissning mot varje möjligt svar, och antalet kandidater som överlever färgerna har räknats. Den engelska fyrabokstavslistan innehåller 53 ord. Att öppna med road skär ner dem till 4,81 i snitt, vilket är det bästa vi har hittat. Att öppna med plum lämnar 20,36 kvar, alltså långt över en tredjedel av listan. Skillnaden handlar inte om hur vanliga orden är. Plum använder sina fyra brickor på fyra olika bokstäver, men tre av dem är sällsynta, medan road lägger sina på bokstäver som faktiskt delar listan på mitten.",
    "Upprepade bokstäver är det dyra misstaget. Banana ser ut som en utmärkt öppning på sex bokstäver och lämnar 7 ord kvar, där planet lämnar 1,27, eftersom banana i praktiken bara frågar om tre bokstäver. Samma sak gäller på svenska: ett ord som kaka använder halva sitt utrymme på att ställa samma fråga två gånger.",
    "Den ärliga begränsningen är att listorna är korta, och den är värd att veta om i förväg. De engelska håller 53 ord på fyra bokstäver, 47 på fem och 37 på sex, och de svenska är byggda i samma storleksordning. Spela i tjugo minuter och ett ord kommer tillbaka. Det är ett medvetet val. En längre lista betyder ord som ett barn aldrig har mött, och ett ord du inte kan läsa är ett ord du inte kan gissa, så varje post är något konkret som dyker upp under en vanlig dag. Den svenska listan är dessutom nyare än de andra och har ännu inte körts genom öppningsmätningen, så siffrorna ovan gäller de språk som har mätts.",
    "Ingenting lämnar enheten. Stäng fliken mitt i ett ord och det står kvar där du lämnade det, med sviten kvar.",
  ],

  howToPlay: [
    {
      title: "Välj en längd",
      body: "Fyra, fem eller sex bokstäver. Du kan byta när du vill, men sviten börjar om.",
    },
    {
      title: "Skriv en gissning",
      body: "Vilket ord som helst med rätt antal bokstäver accepteras. Det finns ingen hemlig ordlista som säger nej.",
    },
    {
      title: "Läs brickorna",
      body: "Grönt är rätt bokstav på rätt plats, lila finns i ordet men på en annan plats, grått finns inte alls.",
    },
    {
      title: "Smalna av",
      body: "Lägg nästa gissning på bokstäver du inte har prövat än, i stället för att bekräfta det du redan vet.",
    },
  ],

  tips: [
    {
      title: "Öppna brett, inte snyggt",
      body: "Ett ord med fyra olika och vanliga bokstäver säger mer än ett ovanligt ord med samma antal brickor. Mätningen ovan är precis den skillnaden i siffror.",
    },
    {
      title: "Undvik dubbletter i första gissningen",
      body: "En upprepad bokstav kostar en bricka utan att ställa en ny fråga. Spara dubbletterna till när du vet att de finns där.",
    },
    {
      title: "Glöm inte å, ä och ö",
      body: "De är egna bokstäver i svenskan och finns på tangentraden. Ett ord som björn är osynligt om du bara letar bland de 26 första.",
    },
  ],

  teaches: [
    {
      title: "Att dra slutsatser av det som saknas",
      body: "En grå bricka är lika mycket information som en grön. Att använda den är det steg som skiljer en gissning från ett resonemang.",
    },
    {
      title: "Stavning under press",
      body: "Ordet måste skrivas helt rätt för att räknas, så varje gissning är också en stavningskontroll som ingen rättar åt dig.",
    },
    {
      title: "Bokstävernas frekvens",
      body: "Efter ett par omgångar börjar de flesta märka vilka bokstäver som lönar sig tidigt. Det är statistik, upptäckt genom att spela.",
    },
  ],

  ages: [
    {
      title: "Sju år, på fyra bokstäver",
      body: "Kortast möjliga ord och den mest konkreta ordlistan. En vuxen som skriver åt barnet gör det spelbart ett par år tidigare.",
    },
    {
      title: "Tio år, på fem",
      body: "Ungefär där ett barn kan hålla två ledtrådar i huvudet samtidigt och ändå välja ett nytt ord.",
    },
    {
      title: "Vuxen, på sex",
      body: "Sex bokstäver och 37 ord i den engelska listan. Kort nog att kännas rättvist, långt nog att en dålig öppning märks.",
    },
  ],

  accessibility:
    "Färgen är aldrig ensam bärare av informationen: varje bricka har också en text som läses upp av en skärmläsare, så grönt och lila går att skilja åt utan att se skillnad på dem. Tangentbordet på skärmen består av riktiga knappar, och ett fysiskt tangentbord fungerar likadant. Det finns ingen klocka och ingen tidsgräns.",

  together: [
    {
      title: "Gissa i tur och ordning",
      body: "En person skriver, den andra bestämmer nästa gissning. Att behöva förklara varför är halva övningen.",
    },
    {
      title: "Säg vad du vet högt",
      body: "Räkna upp de grå bokstäverna innan nästa gissning. Listan är oftast längre än någon minns.",
    },
    {
      title: "Tävla om samma ord",
      body: "Två enheter, samma längd, och en jämförelse av hur många försök det tog. Det behövs ingen uppkoppling mellan dem.",
    },
  ],

  faq: [
    {
      q: "Hur många försök får jag?",
      a: "Sex. Efter den sjätte gissningen visas ordet, och en ny omgång börjar när du vill.",
    },
    {
      q: "Vilka ordlängder finns?",
      a: "Fyra, fem och sex bokstäver, med en egen ordlista per längd och språk.",
    },
    {
      q: "Räknas å, ä och ö som egna bokstäver?",
      a: "Ja. De ligger sist i alfabetet och på tangentraden, och de färgas precis som alla andra bokstäver.",
    },
    {
      q: "Avvisas ord som inte finns i listan?",
      a: "Nej. Vilket ord som helst med rätt antal bokstäver accepteras som gissning, så ingen fastnar på en ordlista de inte kan se.",
    },
    {
      q: "Sparas mitt rekord?",
      a: "Ja, på enheten själv. Ingenting skickas någon annanstans, och en annan surfplatta har sitt eget rekord.",
    },
    {
      q: "Kostar det något?",
      a: "Nej. Gratis, utan konto och utan annonser, och det fungerar offline när sidan har laddat en gång.",
    },
  ],

  keywords: ["ordspel", "gissa ordet", "ord", "bokstäver", "stavning", "gratis"],
};
