import type { GameCopy } from "../../types";

/** Svenska, från `node scripts/brief.mjs sv jigsaw`. Siffrorna kommer ur
 *  `scripts/sim/jigsaw-arrangements.mjs`, bilderna ur spelets egen `pictures.ts`. */
export const jigsawSv: GameCopy = {
  name: "Pussel",
  metaTitle: "Pussel - lägg bitarna på rätt plats | Ellaz",
  metaDescription:
    "Lägg pusselbitar på rätt plats. Tre svårigheter, från sex bitar till tjugo, och åtta bilder att välja mellan. Gratis och utan konto, för barn.",

  lede: "Bitarna ligger blandade runt brädet. Tryck på en och sedan på den tomma rutan den hör hemma i, och bilden växer fram bit för bit.",

  body: [
    "Tre storlekar: tre gånger två bitar, fyra gånger tre, och fem gånger fyra. Det ger sex, tolv och tjugo bitar totalt, och skillnaden mellan dem är större än den låter.",
    "Att gissa kostar mer än man tror. Betydligt mer.",
    "En bot som aldrig tittar på bilden och bara provar bitar en efter en behöver i snitt 13,5 placeringar för att klara det minsta pusslet, 44,9 för det mellersta och 115,2 för det största. En formel, n gånger n plus tre delat på fyra, ger 13,5, 45 och 115 och stämmer nästan exakt med det uppmätta. Att faktiskt titta på bilden är värt 2,3 gånger så mycket på det minsta pusslet och 5,8 gånger på det största, jämfört med samma gissande bot.",
    "Bara ett är rätt. Tjugo bitar har 2 432 902 008 176 640 000 möjliga sätt att läggas ut. Det talet är svårt att ta in, men det säger varför att bara titta hjälper så mycket: varje del av bilden du känner igen stryker miljarder felaktiga placeringar direkt.",
    "En fel placering kostar ingenting.",
    "Det betyder att en pusselbit alltid går att sätta ned, oavsett var, och att prova en annan plats sedan kostar ingenting. Att lyfta upp en bit igen räknas inte som ett misstag i rekordet. Den ärliga begränsningen är att bilderna är återanvänd nyckelkonst från spelen på sidan, alla åtta av dem, snarare än original fotografier, så samma bild kan kännas igen från ett annat spel.",
  ],

  howToPlay: [
    {
      title: "Tryck på en bit",
      body: "Bitarna ligger runt kanten av brädet. Ett tryck markerar den som vald.",
    },
    {
      title: "Tryck på rutan",
      body: "Den valda biten hoppar dit du trycker. Passar den inte där bilden visar stannar den ändå kvar, redo att flyttas igen.",
    },
    {
      title: "Bygg från ett hörn",
      body: "Kanterna och hörnen har bara en möjlig granne, så de är alltid enklast att börja med.",
    },
    {
      title: "Fyll hela bilden",
      body: "Pusslet är klart när alla bitar ligger på sin rätta plats. Rekordet räknar hur många placeringar det tog.",
    },
  ],

  tips: [
    {
      title: "Titta på bilden först",
      body: "Att känna igen bara ett par former eller färger gör en enorm skillnad. Det är uppmätt till 2,3 gånger färre placeringar redan på det minsta pusslet.",
    },
    {
      title: "Sortera efter kant",
      body: "En bit med en rak sida hör hemma i ytterkanten. Att lägga undan alla sådana bitar först krymper problemet snabbt.",
    },
    {
      title: "En bit i taget, inte en tanke i taget",
      body: "Att flytta en bit runt hela brädet för att prova är helt tillåtet och kostar ingenting extra i rekordet.",
    },
  ],

  teaches: [
    {
      title: "Att känna igen delar av en helhet",
      body: "En form eller en färg pekar ut var en bit hör hemma långt innan hela bilden syns. Det är samma förmåga som att känna igen ett ansikte i en folkmassa.",
    },
    {
      title: "Tålamod med en uppgift",
      body: "Tjugo bitar tar längre tid än sex, och ingen genväg ändrar på det. Att stanna kvar med en uppgift är hälften av vad pusslet lär ut.",
    },
    {
      title: "Att arbeta systematiskt",
      body: "Kanter först, sedan mitten, är en strategi som fungerar här och i mycket annat.",
    },
  ],

  ages: [
    {
      title: "Tre år, på sex bitar",
      body: "Stora bitar och en enkel bild. Att bara para ihop former är en helt rimlig strategi på den här storleken.",
    },
    {
      title: "Fem år, på tolv bitar",
      body: "Ungefär där kanterna börjar kännas igen som en egen kategori, inte bara som bitar bland andra.",
    },
    {
      title: "Sju år och uppåt, på tjugo bitar",
      body: "115,2 placeringar i snitt utan att titta på bilden, mot en bråkdel av det med. Här lönar sig strategin på riktigt.",
    },
  ],

  accessibility:
    "Varje ruta och varje bit är märkt med kolumn, rad och vilken bit som ligger där, så pusslet går att lösa med tangentbord och läses upp av en skärmläsare. Allting görs med tryck, ingenting kräver att du drar en bit längs en bana. Det finns ingen tidsgräns.",

  together: [
    {
      title: "En letar, en lägger",
      body: "Den ena säger vilken bit som ska in och den andra trycker. Att beskriva en form med ord är en egen övning.",
    },
    {
      title: "Dela upp bilden",
      body: "En tar vänster halva, en tar höger. Ni möts i mitten, och båda har bidragit till hela bilden.",
    },
    {
      title: "Gissa motivet tidigt",
      body: "Efter några bitar, gissa vad bilden föreställer. Att ha fel är precis lika roligt som att ha rätt.",
    },
  ],

  faq: [
    {
      q: "Vad händer om jag lägger en bit fel?",
      a: "Rutan tar emot den ändå, och du kan flytta den när som helst. Ingenting straffas för att en bit ligger fel ett tag.",
    },
    {
      q: "Hur många bilder finns det?",
      a: "Åtta, alla hämtade från andra spel på sidan. De byts inte ut mellan omgångar av samma storlek.",
    },
    {
      q: "Vad mäter rekordet?",
      a: "Antal placeringar, och färre är bättre. Att lyfta upp en bit igen räknas inte som en extra placering.",
    },
    {
      q: "Vilka storlekar finns?",
      a: "Sex bitar, tolv bitar och tjugo bitar, på bräden som är tre gånger två, fyra gånger tre och fem gånger fyra.",
    },
    {
      q: "Behöver barnet kunna läsa?",
      a: "Nej. Pusslet är helt bildbaserat och kräver ingen text för att spelas.",
    },
    {
      q: "Kostar det något?",
      a: "Nej. Gratis, utan konto och utan annonser, och det fungerar offline när sidan har laddat en gång.",
    },
  ],

  keywords: ["pussel", "bitar", "bild", "barn", "logik", "gratis"],
};
