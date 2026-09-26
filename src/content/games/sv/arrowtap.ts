import type { GameCopy } from "../../types";

/** Svenska, från `node scripts/brief.mjs sv arrowtap`. Siffrorna kommer ur
 *  `scripts/sim/arrowtap-order.mjs` och spelets `logic.ts`. */
export const arrowtapSv: GameCopy = {
  name: "Pilriktning",
  metaTitle: "Pilriktning - tryck bort pilarna i rätt ordning | Ellaz",
  metaDescription:
    "Tryck bort pilar som pekar mot en kant utan hinder. Tre nivåer, från 8 pilar på 4x4 till 22 på 6x6. Gratis i webbläsaren, utan konto.",

  lede: "Varje pil pekar åt ett håll. Tryck bort en pil om ingenting blockerar vägen dit den pekar, och rensa hela brädet.",

  body: [
    "Tre storlekar: 4x4 med 8 pilar, 5x5 med 14 och 6x6 med 22. En pil kan tryckas bort så fort dess riktning är fri hela vägen till kanten, vilket betyder att brädet öppnar sig i vågor snarare än en pil i taget.",
    "Ordningen är ändå fri. Helt fri.",
    "Vi delade ut 4 000 bräden per nivå och räknade hur många pilar som är trycksbara direkt från start. På den lätta nivån är det i snitt 5,7 av 8, på medel 8,8 av 14 och på svår 12,5 av 22. Ett svårt bräde kan öppna med så få som 7 fria pilar eller så många som 18, vilket är den spridning som gör två svåra bräden kännas olika trots samma antal pilar.",
    "En blockerad pil gör ingenting.",
    "Ett tryck på en pil som inte kan lämna brädet ändrar ingenting och räknas inte som ett drag, så det finns ingen anledning att låta bli att prova. En bot som bara trycker på måfå rensade alla 12 000 bräden den prövade, ingen fastnade. Att klara ett svårt bräde tar exakt 22 tryck oavsett i vilken ordning pilarna tas bort, så rekordet mäter tid och inte antal drag. Den ärliga begränsningen är att spelet inte har någon djupare strategi bortom att se vilka pilar som är fria just nu: det belönar ett snabbt öga mer än ett långsiktigt schema.",
  ],

  howToPlay: [
    {
      title: "Titta på riktningen",
      body: "Varje pil pekar mot en av brädets fyra kanter. Bara den riktningen avgör om den går att ta bort.",
    },
    {
      title: "Tryck på en fri pil",
      body: "Om ingenting står i vägen mellan pilen och kanten den pekar mot försvinner den vid ett tryck.",
    },
    {
      title: "En blockerad pil gör ingenting",
      body: "Ett tryck på en pil som inte kan lämna brädet kostar ingenting. Prova gärna, det räknas inte som ett misslyckat drag.",
    },
    {
      title: "Rensa hela brädet",
      body: "Spelet är klart när alla pilar är borta. Rekordet är tiden det tog, och mindre är bättre.",
    },
  ],

  tips: [
    {
      title: "Sök längs kanterna först",
      body: "En pil som redan pekar rakt mot en tom kant är alltid fri. De är enklast att hitta med blicken.",
    },
    {
      title: "Ta bort en pil i taget och titta om",
      body: "Att ta bort en pil kan göra en annan fri. Det är därför brädet öppnar sig i vågor snarare än linjärt.",
    },
    {
      title: "Ordningen spelar ingen roll för resultatet",
      body: "Ett svårt bräde tar alltid 22 tryck att rensa. Det enda som varierar är hur snabbt du hittar de fria pilarna varje gång.",
    },
  ],

  teaches: [
    {
      title: "Att skanna snabbt",
      body: "Att hitta det som går att göra just nu, bland tjugotvå alternativ, är en form av visuell sökning som tränas av spelet.",
    },
    {
      title: "Att en helhet förändras av en del",
      body: "En borttagen pil kan öppna en annan. Att se den kopplingen innan den syns är ett steg mot att planera framåt.",
    },
    {
      title: "Att pröva utan rädsla",
      body: "Ett fel tryck kostar ingenting alls. Det gör det tryggt att testa i stället för att bara titta.",
    },
  ],

  ages: [
    {
      title: "Fem år, på 4x4",
      body: "8 pilar och en enkel regel: pekar den fritt, försvinner den. Inget att läsa, bara att titta och trycka.",
    },
    {
      title: "Åtta år, på 5x5",
      body: "14 pilar och fler lägen där en pil öppnar en annan. Ungefär där mönstret börjar synas.",
    },
    {
      title: "Vuxen, på 6x6",
      body: "22 pilar och en spridning på 7 till 18 fria vid start. Tiden är det enda som skiljer en bra omgång från en långsam.",
    },
  ],

  accessibility:
    "Varje ruta är märkt med rad, kolumn och pilens riktning, så brädet går att spela med tangentbord och läses upp av en skärmläsare. Riktningen visas som en form och inte bara en färg. Ingenting kräver att du drar, och det finns ingen tidsgräns som avbryter en omgång.",

  together: [
    {
      title: "En letar, en trycker",
      body: "Den ena pekar ut en fri pil, den andra trycker. Att lita på en annans blick är en egen övning.",
    },
    {
      title: "Räkna de fria pilarna tillsammans",
      body: "Innan ni börjar, räkna hur många pilar som redan går att ta bort. Jämför sedan med hur spelet faktiskt gick.",
    },
    {
      title: "Tävla om tiden",
      body: "Samma storlek, två enheter, och jämför tiden efteråt. Rekordet sparas per nivå på varje enhet för sig.",
    },
  ],

  faq: [
    {
      q: "Vad avgör om en pil går att ta bort?",
      a: "Om vägen mellan pilen och kanten den pekar mot är helt fri. Riktningen är allt som räknas.",
    },
    {
      q: "Kostar ett fel tryck något?",
      a: "Nej. Ett tryck på en blockerad pil ändrar ingenting och räknas inte som ett misslyckat drag.",
    },
    {
      q: "Spelar ordningen roll?",
      a: "Inte för hur många tryck det tar. Ett svårt bräde kräver alltid exakt 22 tryck, oavsett vilken ordning du väljer.",
    },
    {
      q: "Vilka storlekar finns?",
      a: "4x4 med 8 pilar, 5x5 med 14 och 6x6 med 22.",
    },
    {
      q: "Vad mäter rekordet?",
      a: "Tiden det tog att rensa brädet, och mindre är bättre. Rekordet sparas per storlek.",
    },
    {
      q: "Kostar det något?",
      a: "Nej. Gratis, utan konto och utan annonser, och det fungerar offline när sidan har laddat en gång.",
    },
  ],

  keywords: ["pilar", "riktning", "logik", "rutnät", "pussel", "gratis"],
};
