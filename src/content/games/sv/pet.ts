import type { GameCopy } from "../../types";

/** Svenska, från `node scripts/brief.mjs sv pet`. Siffrorna kommer ur
 *  `scripts/sim/pet-growing.mjs` och spelets `logic.ts`. */
export const petSv: GameCopy = {
  name: "Husdjur",
  metaTitle: "Husdjur - mata, klappa och se det växa | Ellaz",
  metaDescription:
    "Ta hand om ett litet husdjur genom fem storlekar. Uppfyll dess önskningar för snabbare tillväxt. Tre olika djur, gratis och utan konto.",

  lede: "Ett litet husdjur behöver omtanke. Mata det, klappa det och uppfyll dess önskningar, och se det växa genom fem storlekar.",

  body: [
    "Fem storlekar totalt. Den femte kräver 80 poäng omtanke. En uppfylld önskan ger 3 poäng mot 1 för ett vanligt tryck, tre gånger så mycket, vilket gör önskningarna till den snabbaste vägen framåt snarare än bara en trevlig detalj.",
    "Att alltid uppfylla önskningen tar 27 tryck till full storlek, och alla tre djuren tar bara 81 tryck totalt, mindre än en minuts riktig lek om man vet exakt vad man gör. En bot som trycker helt slumpmässigt möter önskningen bara 24,9 procent av gångerna och behöver 53,8 tryck i stället, mer än dubbelt så många.",
    "Att missa bubblan kostar lite. Väldigt lite.",
    "En bot som helt ignorerar önskebubblan och bara trycker rakt på klarar sig ändå på 79,5 tryck, bara marginellt sämre än den som chansar slumpmässigt. Det betyder att spelet aldrig straffar hårt för att inte läsa, det bara belönar extra för att göra det. Sju mynt dyker upp på vägen. Alltid sju.",
    "Den ärliga begränsningen är att önskningarna inte gör något mer avancerat än att peka ut vad som redan går att göra. Av 320 541 simulerade tryck i mätningen avvisades inte ett enda, vilket betyder att spelet aldrig säger nej till ett barn, bara belönar den som råkar träffa rätt lite mer.",
  ],

  howToPlay: [
    {
      title: "Titta på husdjuret",
      body: "En bubbla visar ibland vad det önskar sig just nu, mat, klapp eller lek.",
    },
    {
      title: "Uppfyll önskningen om du kan",
      body: "Att göra det bubblan visar ger tre gånger så mycket omtanke som ett vanligt tryck.",
    },
    {
      title: "Annars, tryck ändå",
      body: "Ett vanligt tryck ger också omtanke, bara långsammare. Inget tryck avvisas någonsin.",
    },
    {
      title: "Se husdjuret växa",
      body: "Fem storlekar totalt, och rekordet är hur mycket omtanke som samlats in. Det går bara uppåt.",
    },
  ],

  tips: [
    {
      title: "Läs bubblan när den syns",
      body: "En uppfylld önskan ger tre gånger så mycket omtanke som ett vanligt tryck. Det är den snabbaste vägen till nästa storlek.",
    },
    {
      title: "Oroa dig inte för att missa den",
      body: "Även utan att läsa bubblan alls klarar sig ett husdjur nästan lika bra. Ingen chans går förlorad för gott.",
    },
    {
      title: "Prova alla tre djuren",
      body: "Alla tre växer efter samma regler men ser olika ut på vägen, så det är värt att uppleva mer än en resa.",
    },
  ],

  teaches: [
    {
      title: "Att läsa en signal och agera på den",
      body: "Önskebubblan är en tidig övning i att märka vad någon annan behöver och svara på det.",
    },
    {
      title: "Omtanke som belönas",
      body: "Att göra det rätta ger mer, men att göra något alls duger också. Det är en mild och ärlig regel för ett barn att möta.",
    },
    {
      title: "Att se en långsam förändring",
      body: "Fem storlekar tar tid att nå. Att se tillväxt över flera sittningar snarare än direkt är sin egen sorts tålamod.",
    },
  ],

  ages: [
    {
      title: "Tre år, fritt tryckande",
      body: "Att bara trycka på husdjuret och se det reagera kräver ingen förståelse för önskningar alls.",
    },
    {
      title: "Fem år, med önskningar",
      body: "Ungefär där ett barn börjar märka bubblan och sikta på att uppfylla den med flit.",
    },
    {
      title: "Alla åldrar, alla tre djur",
      body: "81 tryck totalt för att växa alla tre helt, ett kort och behagligt mål över flera besök.",
    },
  ],

  accessibility:
    "Önskebubblan visas med en tydlig bild av vad som behövs, aldrig bara en färg. Allt görs med tryck, ingenting kräver att du drar eller håller inne. Inget tryck avvisas eller straffas, så det finns inget sätt att göra fel.",

  together: [
    {
      title: "En läser bubblan, en trycker",
      body: "Den ena säger vad husdjuret önskar sig, den andra uppfyller det. Att samarbeta om omsorg är en fin övning.",
    },
    {
      title: "Turas om att mata",
      body: "Låt varje person sköta ett tryck i taget. Husdjuret bryr sig inte om vem som trycker, bara att det görs.",
    },
    {
      title: "Fira varje ny storlek",
      body: "När husdjuret växer, stanna upp och titta tillsammans. Fem storlekar ger fem tillfällen att glädjas.",
    },
  ],

  faq: [
    {
      q: "Vad ger en uppfylld önskan?",
      a: "Tre gånger så mycket omtanke som ett vanligt tryck, vilket gör den till den snabbaste vägen till nästa storlek.",
    },
    {
      q: "Vad händer om jag inte läser bubblan?",
      a: "Nästan ingenting förloras. Ett husdjur som bara får vanliga tryck klarar sig ändå bra, bara lite långsammare.",
    },
    {
      q: "Kan ett tryck avvisas?",
      a: "Nej, aldrig. Av över 320 000 simulerade tryck i mätningen avvisades inte ett enda.",
    },
    {
      q: "Hur många storlekar finns det?",
      a: "Fem, och den femte kräver 80 poäng omtanke totalt.",
    },
    {
      q: "Hur många djur finns att välja mellan?",
      a: "Tre, och alla tre växer efter samma regler men ser olika ut på vägen.",
    },
    {
      q: "Kostar det något?",
      a: "Nej. Gratis, utan konto och utan annonser, och det fungerar offline när sidan har laddat en gång.",
    },
  ],

  keywords: ["husdjur", "ta hand om", "barn", "trycka", "mata", "gratis"],
};
