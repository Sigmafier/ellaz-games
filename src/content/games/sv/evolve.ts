import type { GameCopy } from "../../types";

/** Svenska, från `node scripts/brief.mjs sv evolve`. Stegen kommer ur
 *  `src/games/evolve/skin.ts`. Inget här är översatt. */
export const evolveSv: GameCopy = {
  name: "Utveckling",
  metaTitle: "Utveckling - slå ihop djur, gratis | Ellaz",
  metaDescription:
    "Skjut ihop lika djur så blir de nästa sort. Tio steg från ägg till T-Rex, tre brädstorlekar, gratis i webbläsaren och utan konto.",

  lede: "Skjut ihop två lika djur så blir de ett större. Tio steg från ägg till T-Rex, och varje steg är värt dubbelt så mycket som det under.",

  body: [
    "Brädet lutar åt det håll du väljer, och allting på det glider ända fram tills något står i vägen. Möter två likadana djur varandra på vägen blir de ett enda av nästa sort. Ett ägg och ett ägg blir en larv. Två larver blir ett bi. Så fortsätter det uppåt genom tio steg, och varje nytt steg är värt precis dubbelt så mycket som det det kom ifrån, från 2 längst ner till 1024 på toppen.",
    "Efter varje drag kommer ett nytt ägg. Brädet krymper hela tiden.",
    "Det som gör spelet svårt är inte att slå ihop djuren utan att brädet fylls medan du gör det. Varje drag flyttar allt, inte bara det du siktade på, så ett drag som löser ett hörn kan förstöra det motsatta. När det inte finns någon ruta kvar och inga grannar som passar ihop är omgången slut. Då är det över. Poängen är summan av det du hann bygga, och fler poäng är bättre.",
    "Under skinnet är det samma motor som 2048, med samma tre brädstorlekar. Det är också den ärliga begränsningen: den som redan kan 2048 kommer att känna igen varje drag här, och det enda som är nytt är vad rutorna föreställer. För ett barn som inte kan 2048 är det å andra sidan hela skillnaden, för ett ägg som blir en larv betyder något som talet 4 inte gör. Rekorden hålls isär, så det du gör här rör inte ditt rekord i 2048.",
  ],

  howToPlay: [
    {
      title: "Svep eller tryck på en pil",
      body: "Fyra riktningar, och hela brädet rör sig åt det hållet på en gång. Pilarna är vanliga knappar under brädet, så du behöver aldrig kunna dra för att spela.",
    },
    {
      title: "Lika möter lika",
      body: "Två djur av samma sort som krockar blir ett av nästa sort. Två olika djur stannar bredvid varandra och händer ingenting med.",
    },
    {
      title: "Håll brädet öppet",
      body: "Ett nytt ägg kommer efter varje drag. Fyller brädet igen utan att något passar ihop är omgången över, och då räknas poängen ihop.",
    },
    {
      title: "Välj storlek på brädet",
      body: "Tre storlekar i raden ovanför. Ett litet bräde fylls fortare och tvingar fram beslut tidigare; ett stort ger plats att reda ut en röra.",
    },
  ],

  tips: [
    {
      title: "Bestäm ett hörn och håll fast vid det",
      body: "Låt det största djuret bo i ett hörn och svep aldrig åt det håll som skulle flytta det därifrån. Tre riktningar räcker nästan alltid, och den fjärde är den som brukar sänka en omgång.",
    },
    {
      title: "Bygg en trappa längs en kant",
      body: "Störst i hörnet, näst störst bredvid, och så vidare längs raden. Då hamnar varje nytt par intill något det kan växa ihop med i stället för att fastna mitt på brädet.",
    },
    {
      title: "Slå ihop nerifrån",
      body: "Två ägg som blir en larv är värt lite, men det frigör en ruta. Att städa bland de små stegen är oftare det som räddar ett bräde än att jaga nästa stora djur.",
    },
    {
      title: "Ett stort bräde är inte lättare",
      body: "Fler rutor betyder fler ägg per omgång och fler saker att hålla ordning på. Det köper tid och kostar överblick, och vilket som väger tyngst beror helt på spelaren.",
    },
  ],

  teaches: [
    {
      title: "Dubblingar, utan att räkna",
      body: "Varje steg är dubbelt så mycket som det under. Ett barn som spelar en stund har sett 2, 4, 8 och 16 hända med djur i stället för med siffror, vilket är en mjukare väg in i samma idé.",
    },
    {
      title: "Att se en konsekvens innan den händer",
      body: "Ett drag flyttar allting. Att stanna upp och fundera på vad som händer i motsatt hörn är precis den sortens framförhållning spelet belönar.",
    },
    {
      title: "Ordning slår tur",
      body: "Ett bräde som sköts efter en plan håller mycket längre än ett som svepas på känsla, och skillnaden blir tydlig redan efter några omgångar.",
    },
  ],

  ages: [
    {
      title: "Fyra år, på det största brädet",
      body: "Det finns ingenting att läsa, och att se ett ägg bli en larv är roligt i sig. På den åldern spelas det oftast utan plan, och det är helt i sin ordning.",
    },
    {
      title: "Sex år och uppåt",
      body: "Vid den åldern börjar hörnregeln gå att förstå och använda. Det är där spelet slutar vara en bildbok och blir ett pussel.",
    },
    {
      title: "Vuxna på det minsta brädet",
      body: "Ett litet bräde blir trångt fort och kräver att varje drag går att motivera. Att nå det tionde djuret är en riktig uppgift.",
    },
  ],

  accessibility:
    "Spelet går helt på knappar: fyra pilar under brädet, alla med riktiga etiketter, så det fungerar med tangentbord och med skärmläsare utan att någon behöver kunna svepa. Det finns ingen klocka, så ingenting går förlorat för att en spelare behöver längre tid på sig. Djuren skiljer sig åt i form och inte bara i färg, vilket betyder att stegen går att skilja åt även för den som ser färg annorlunda.",

  together: [
    {
      title: "Ett drag var",
      body: "Turas om att svepa på samma bräde. Det tvingar fram ett samtal om varför ett hörn ska hållas, och det samtalet är mer värt än omgången.",
    },
    {
      title: "En vuxen håller hörnet",
      body: "Ett barn väljer riktning och en vuxen säger bara till när ett drag skulle flytta det största djuret. Ett enda villkor att hålla reda på räcker långt.",
    },
    {
      title: "Sikta på ett djur, inte på poängen",
      body: "Att nå grodan tillsammans är ett tydligare mål än en siffra, särskilt för ett barn som ännu inte läser tal så stora.",
    },
  ],

  faq: [
    {
      q: "Är det samma sak som 2048?",
      a: "Samma regler och samma bräden, med djur i stället för tal. Rekorden hålls isär, så de två spelen påverkar inte varandra.",
    },
    {
      q: "Hur många djur finns det?",
      a: "Tio steg, från ägg till T-Rex. Det översta är värt 1024, och det nås sällan.",
    },
    {
      q: "Måste man kunna läsa?",
      a: "Nej. Det finns inga ord inne i spelet, bara djur och pilar.",
    },
    {
      q: "Är det gratis?",
      a: "Ja, helt. Inga annonser, inget konto, och ingenting att betala för.",
    },
    {
      q: "Fungerar det offline?",
      a: "Ja, när sidan har laddat en gång. Hela webbplatsen går också att installera som app från webbläsarens meny.",
    },
    {
      q: "Var sparas rekordet?",
      a: "På enheten själv. Rensar du webbläsarens data försvinner det, och en telefon och en surfplatta har varsitt.",
    },
  ],

  keywords: ["utveckling", "djur", "slå ihop", "pussel", "2048", "barn"],
};
