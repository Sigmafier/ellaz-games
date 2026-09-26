import type { GameCopy } from "../../types";

/** Svenska, från `node scripts/brief.mjs sv shadows`. Siffrorna kommer ur
 *  `scripts/sim/thinking-levels.mjs` och spelets `logic.ts`. */
export const shadowsSv: GameCopy = {
  name: "Skuggor",
  metaTitle: "Skuggor - hitta rätt siluett | Ellaz",
  metaDescription:
    "En skugga visas, och du väljer vilken av flera bilder den tillhör. Tre eller fyra alternativ beroende på nivå. Gratis i webbläsaren, för barn.",

  lede: "En svart siluett visas överst. Nedanför väntar flera bilder i färg, och bara en av dem passar exakt med skuggan.",

  body: [
    "Tre alternativ på lätt. Bara tre. En gissning där är värd 33,3 procent. Medel och svår ger fyra var, vilket sänker chansen till 25 procent. Skillnaden mellan tre och fyra alternativ känns liten på papper och märks tydligt i handen, eftersom ett fjärde alternativ betyder ett fjärde riktigt övervägande.",
    "Svår nivå är ett annat spel. Helt annorlunda.",
    "Där kommer alla fyra bilderna från samma tema, till exempel fyra olika djur eller fyra olika fordon, medan lätt och medel blandar fritt mellan kategorier. Det gör svår nivå svårare på ett djupare sätt än bara fler alternativ: siluetterna liknar varandra mer, så det verkliga formövervägandet måste göras noggrannare.",
    "Den ärliga begränsningen är att en skugga i sig är en grov förenkling. Två olika djur kan råka kasta nästan samma siluett ur en viss vinkel, och spelet gör inget särskilt för att undvika det, bortsett från att hålla bilderna inom samma tema på svår nivå snarare än att slumpmässigt riskera en kollision mellan orelaterade former.",
  ],

  howToPlay: [
    {
      title: "Titta på siluetten",
      body: "En svart skugga visas överst, utan färg eller detaljer, bara en form.",
    },
    {
      title: "Jämför med bilderna nedan",
      body: "Tre eller fyra bilder i färg väntar, beroende på nivå. Bara en matchar skuggans form exakt.",
    },
    {
      title: "Tryck på rätt bild",
      body: "Ett tryck på den matchande bilden räknas som rätt och för dig vidare.",
    },
    {
      title: "Klättra genom nivåerna",
      body: "Rekordet räknar hur många nivåer du klarat. Svår nivå håller alla alternativ inom samma tema.",
    },
  ],

  tips: [
    {
      title: "Titta på konturen, inte på detaljerna",
      body: "En skugga visar bara formen. Öron, svans och andra kända drag är det som avgör, inte färg eller mönster.",
    },
    {
      title: "Uteslut det som uppenbart inte passar",
      body: "Att först stryka bilder vars form skiljer sig mycket gör det lättare att jämföra de som är kvar noga.",
    },
    {
      title: "På svår nivå, förvänta dig likheter",
      body: "Alla fyra alternativen kommer från samma tema där, så de kan se förvånansvärt lika ut. Ta dig tid att jämföra noga.",
    },
  ],

  teaches: [
    {
      title: "Formigenkänning",
      body: "Att känna igen ett föremål från bara dess kontur, utan färg eller detalj, är en riktig visuell färdighet.",
    },
    {
      title: "Att jämföra flera alternativ noga",
      body: "Med fyra alternativ i samma tema räcker det inte att bara känna igen en form snabbt, den måste jämföras mot flera liknande.",
    },
    {
      title: "Att lita på en detalj i taget",
      body: "En liten skillnad i siluettens kant kan vara hela svaret. Att märka den kräver tålamod snarare än hast.",
    },
  ],

  ages: [
    {
      title: "Tre år, på lätt",
      body: "Tre alternativ blandade fritt mellan kategorier. Lätt att skilja åt, ett bra första möte med siluetter.",
    },
    {
      title: "Sex år, på medel",
      body: "Fyra alternativ, fortfarande blandade kategorier. Ungefär där formigenkänning börjar kännas som ett riktigt val.",
    },
    {
      title: "Nio år och uppåt, på svår",
      body: "Fyra alternativ ur samma tema, så siluetterna liknar varandra mer. Ett genuint svårare jämförande.",
    },
  ],

  accessibility:
    "Varje bild har en synlig etikett utöver sitt utseende, så alternativen går att skilja åt även utan att se skillnad på små formdetaljer. Allt görs med tryck, ingenting kräver att du drar. Det finns ingen tidsgräns, och ett fel svar straffas bara med en liten studs.",

  together: [
    {
      title: "En beskriver skuggan, en väljer",
      body: "Den ena beskriver formen med ord, den andra pekar ut bilden. Att sätta ord på en siluett är svårare än det låter.",
    },
    {
      title: "Diskutera innan ni trycker",
      body: "Prata igenom vilken bild som passar bäst innan svaret ges. Att argumentera för ett val skärper blicken.",
    },
    {
      title: "Jämför hur långt ni kommer",
      body: "Spela var för sig och se vem som klarar flest nivåer. Rekordet sparas per svårighet.",
    },
  ],

  faq: [
    {
      q: "Hur många alternativ finns det?",
      a: "Tre på lätt nivå, fyra på medel och svår.",
    },
    {
      q: "Vad skiljer svår nivå från de andra?",
      a: "Alla fyra alternativen kommer från samma tema, så de liknar varandra mer än på lätt och medel, som blandar kategorier fritt.",
    },
    {
      q: "Hur stor chans har en ren gissning?",
      a: "33,3 procent på lätt nivå, 25 procent på medel och svår.",
    },
    {
      q: "Kostar ett fel svar något?",
      a: "Nästan ingenting. Bilden studsar till och du får försöka igen.",
    },
    {
      q: "Vad mäter rekordet?",
      a: "Antal nivåer klarade, och mer är bättre. Rekordet sparas per svårighet.",
    },
    {
      q: "Kostar det något?",
      a: "Nej. Gratis, utan konto och utan annonser, och det fungerar offline när sidan har laddat en gång.",
    },
  ],

  keywords: ["skuggor", "siluetter", "hitta", "logik", "barn", "gratis"],
};
