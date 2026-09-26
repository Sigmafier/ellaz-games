import type { GameCopy } from "../../types";

/** Svenska, från `node scripts/brief.mjs sv parking`. Siffrorna kommer ur
 *  `scripts/sim/parking-jams.mjs` och spelets `logic.ts`. */
export const parkingSv: GameCopy = {
  name: "Parkeringskaos",
  metaTitle: "Parkeringskaos - kör ut den röda bilen | Ellaz",
  metaDescription:
    "Skjut bilarna åt sidan och kör ut den röda bilen genom utfarten. Sex, nio eller tolv bilar på samma parkering. Gratis, utan konto.",

  lede: "Bilar står tätt packade på en parkering på 6 gånger 6. Skjut dem åt sidan, en efter en, och kör ut den röda bilen genom utfarten.",

  body: [
    "Sex, nio eller tolv bilar. Samma rutnät, samma utfart på tredje raden. Den kortaste möjliga lösningen är i snitt 4,2 drag på lätt nivå, 5,2 på medel och 5,4 på svår, vilket verkar som en liten skillnad tills man ser att 73,8 procent av de svåra bräderna löser sig på exakt fem drag, den absoluta golvet den nivån tillåter.",
    "Ett drag här är en hel glidning, inte en enda ruta.",
    "Det skiljer sig från de klassiska pusslen, som räknar varje ruta för sig, så en lösning på fem drag kan ändå flytta en bil flera steg i ett svep. På en svår bana rör en kortaste lösning bara 5,3 av de 12 bilarna, vilket betyder att omkring sju bilar aldrig behöver flyttas alls, hur trångt det än ser ut.",
    "Ingen bana är låst. Aldrig. Vi vandrade 480 000 positioner och hittade noll dödlägen, eftersom varje glidning går att göra baklänges. Det betyder att ett fel drag alltid går att ta tillbaka genom att helt enkelt skjuta bilen tillbaka dit den kom ifrån.",
    "Den ärliga begränsningen är att banan byggs genom en lång slumpvandring, 56 till 73 drag beroende på nivå, ungefär tretton gånger längre än den kortaste lösningen, och sedan graderas mot ett golv innan den godkänns. Det betyder att en och samma bana kan kännas mycket krångligare att bygga upp mentalt än den faktiskt är att lösa.",
  ],

  howToPlay: [
    {
      title: "Titta på den röda bilen",
      body: "Den ska ut genom utfarten på tredje raden. Alla andra bilar är i vägen på olika sätt.",
    },
    {
      title: "Dra en bil åt sidan",
      body: "En bil rör sig bara längs sin egen riktning, vågrätt eller lodrätt, aldrig i en sväng.",
    },
    {
      title: "Öppna vägen steg för steg",
      body: "Varje flyttad bil kan öppna plats för nästa. En glidning räknas som ett drag, oavsett hur långt bilen rör sig.",
    },
    {
      title: "Kör ut den röda bilen",
      body: "Banan är löst när den röda bilen når och lämnar utfarten. Rekordet räknar antal drag, och färre är bättre.",
    },
  ],

  tips: [
    {
      title: "Räkna med att flytta färre bilar än du tror",
      body: "En kortaste lösning på svår nivå rör bara ungefär 5 av 12 bilar. De flesta får stå kvar hela tiden.",
    },
    {
      title: "Ångra hellre än att gissa vidare",
      body: "Ingen bana har ett dödläge, så ett fel drag går alltid att backa. Det lönar sig att pröva friare än man annars skulle våga.",
    },
    {
      title: "Sikta på fem drag på svår nivå",
      body: "Nästan tre fjärdedelar av de svåra banorna löser sig på exakt fem drag. Om det tar fler, leta efter en bil du glömde.",
    },
  ],

  teaches: [
    {
      title: "Att se vad som faktiskt är i vägen",
      body: "En trång parkering ser omöjlig ut tills man inser att bara ett fåtal bilar verkligen spärrar vägen. Att skilja på de två är hela pusslet.",
    },
    {
      title: "Att backa utan rädsla",
      body: "Eftersom varje drag går att göra baklänges finns ingen anledning att vara försiktig. Att pröva och se är en trygg strategi här.",
    },
    {
      title: "Att räkna drag effektivt",
      body: "Ett drag är en hel glidning, inte ett steg. Att tänka i den enheten, inte i rutor, är vad som gör en lösning kort.",
    },
  ],

  ages: [
    {
      title: "Sex år, på sex bilar",
      body: "En kortaste lösning på i snitt 4,2 drag. Ett litet och begripligt första möte med att flytta saker ur vägen.",
    },
    {
      title: "Nio år, på nio bilar",
      body: "Fler bilar och fler steg att hålla reda på. Ungefär där planering börjar löna sig mer än att bara pröva sig fram.",
    },
    {
      title: "Vuxen, på tolv bilar",
      body: "12 bilar på samma rutnät, och även den värsta uppmätta banan krävde bara 11 drag. Svårt men aldrig omöjligt.",
    },
  ],

  accessibility:
    "Varje bil är märkt med sin position och riktning, så banan går att lösa med tangentbord och läses upp av en skärmläsare. Bilarna skiljs åt av form och färg tillsammans, aldrig färg ensam. Det finns ingen tidsgräns, och ett drag kan alltid göras baklänges.",

  together: [
    {
      title: "En ser helheten, en flyttar",
      body: "Den ena pekar ut vilken bil som bör flyttas näst, den andra drar den. Att motivera valet högt är en egen övning.",
    },
    {
      title: "Räkna drag tillsammans",
      body: "Håll räkning på hur många drag ni gjort och jämför med den kortaste lösningen efteråt.",
    },
    {
      title: "Tävla om färst drag",
      body: "Spela samma bana i tur och ordning och se vem som löste den kortast. Rekordet sparas per nivå.",
    },
  ],

  faq: [
    {
      q: "Vad räknas som ett drag?",
      a: "En hel glidning av en bil, oavsett hur många rutor den rör sig. Inte en ruta i taget som i de klassiska pusslen.",
    },
    {
      q: "Kan jag fastna helt?",
      a: "Nej. Av 480 000 vandrade positioner hittades inget dödläge, eftersom varje glidning går att göra baklänges.",
    },
    {
      q: "Hur många bilar måste jag flytta?",
      a: "Färre än du tror. En kortaste lösning på svår nivå rör bara ungefär 5 av 12 bilar.",
    },
    {
      q: "Vilka nivåer finns?",
      a: "Sex, nio eller tolv bilar, alla på samma rutnät på 6 gånger 6 med utfarten på tredje raden.",
    },
    {
      q: "Vad mäter rekordet?",
      a: "Antal drag det tog att köra ut den röda bilen, och färre är bättre. Rekordet sparas per nivå.",
    },
    {
      q: "Kostar det något?",
      a: "Nej. Gratis, utan konto och utan annonser, och det fungerar offline när sidan har laddat en gång.",
    },
  ],

  keywords: ["parkering", "bilar", "logik", "pussel", "klassiker", "gratis"],
};
