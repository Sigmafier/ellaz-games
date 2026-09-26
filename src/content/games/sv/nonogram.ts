import type { GameCopy } from "../../types";

/** Svenska, från `node scripts/brief.mjs sv nonogram`. Siffrorna kommer ur
 *  `scripts/sim/nonogram-solvable.mjs` och spelets egen `logic.ts`. */
export const nonogramSv: GameCopy = {
  name: "Bildpussel",
  metaTitle: "Bildpussel - nonogram i webbläsaren | Ellaz",
  metaDescription:
    "Siffrorna vid raderna och kolumnerna säger var rutorna ska fyllas, och en bild växer fram. Tre storlekar, 25 till 225 rutor. Gratis och utan konto.",

  lede: "Siffrorna längs kanterna säger hur långa de fyllda sträckorna är i varje rad och kolumn. Följ dem, och en bild växer fram.",

  body: [
    "Ett rutnät utan något i. Siffrorna till vänster om varje rad och ovanför varje kolumn säger hur många rutor i följd som ska fyllas, i den ordningen, med minst en tom ruta emellan. Tre storlekar: 25 rutor, 100 rutor och 225 rutor. Det största rutnätet bär 53 sifferledtrådar och det minsta 15.",
    "Inget bräde delas ut obevisat.",
    "Varje kandidatbild körs genom en lösare som bara får använda radvis och kolumnvis resonemang, aldrig gissningar, och bara bilder som lösaren klarar hela vägen delas ut. Av 4 000 kandidater per storlek överlever 87,7 procent på det minsta rutnätet och 82,0 procent på det största. På det största kastas dessutom 18 procent av kandidaterna för att de tillåter två olika svar, vilket är det värsta som kan hända en spelare: ett bräde som är korrekt ifyllt och ändå underkänns.",
    "Kostnaden är liten. Den är också mätbar. Ett utdelat bräde på det största rutnätet kostar i snitt 1,25 kandidatbilder, och i det värsta fall som uppmätts krävdes fem. Det är en generator som gör om sitt arbete en gång var fjärde bräde för att du aldrig ska sitta fast i något som inte går att lösa.",
    "En genomgång av alla rader följt av alla kolumner avgör 85,3 procent av det minsta rutnätet, 75,8 procent av det mellersta och 58,2 procent av det största. Det stora brädet behöver i snitt 4,15 sådana genomgångar och ibland upp till 12. Brädet öppnar sig i omgångar. Den ärliga begränsningen är storleken på en telefon: en ruta på det största rutnätet landar kring 18 bildpunkter på en 390 pixlar bred skärm, vilket går att träffa men inte är bekvämt. På en surfplatta eller en dator är det en annan upplevelse.",
  ],

  howToPlay: [
    {
      title: "Läs siffrorna",
      body: "En rad märkt 3 1 har tre fyllda rutor, minst en tom, och sedan en fylld. Ordningen är alltid densamma som i siffrorna.",
    },
    {
      title: "Fyll det du är säker på",
      body: "Tryck på en ruta för att fylla den. En lång sträcka i en kort rad har bara ett fåtal möjliga lägen, och överlappet är alltid fyllt.",
    },
    {
      title: "Kryssa det som är tomt",
      body: "Ett andra tryck markerar rutan som tom. Det är lika mycket information som en fylld ruta och hjälper nästa rad.",
    },
    {
      title: "Växla mellan rader och kolumner",
      body: "En kolumn som du nyss lärt dig något om öppnar oftast en rad. Det är därför brädet löses i vågor och inte uppifrån och ned.",
    },
  ],

  tips: [
    {
      title: "Börja med de längsta talen",
      body: "På det största rutnätet är den längsta sammanhängande sträckan i snitt 12,8 rutor. En sådan rad har nästan inget spelrum och ger gratis rutor direkt.",
    },
    {
      title: "Kryssa lika flitigt som du fyller",
      body: "De flesta som fastnar har fyllt i allt de vet och kryssat ingenting. Ungefär halva brädet är tomt, så halva informationen ligger där.",
    },
    {
      title: "Räkna överlappet",
      body: "En sträcka på 8 i en rad på 10 måste täcka de 6 mittersta rutorna, var den än börjar. Den tekniken ensam löser en stor del av det största brädet.",
    },
  ],

  teaches: [
    {
      title: "Att härleda i stället för att gissa",
      body: "Varje ruta har ett bevisbart svar, och brädet är byggt så att beviset alltid finns. Det gör tålamod till en strategi.",
    },
    {
      title: "Att räkna i intervall",
      body: "Att se att en sträcka måste täcka mitten oavsett var den börjar är ett riktigt matematiskt resonemang i förklädnad.",
    },
    {
      title: "Att byta perspektiv",
      body: "Fastnar du i en rad är svaret i en kolumn. Vanan att byta håll i stället för att stirra är nyttig långt utanför spelet.",
    },
  ],

  ages: [
    {
      title: "Sju år, på 25 rutor",
      body: "15 sifferledtrådar och ett bräde som ryms i ett ögonkast. En vuxen som förklarar den första raden brukar räcka.",
    },
    {
      title: "Tio år, på 100 rutor",
      body: "Ungefär där brädet blir för stort för att överblickas och måste lösas i omgångar i stället.",
    },
    {
      title: "Vuxen, på 225 rutor",
      body: "4,15 genomgångar i snitt och ibland 12. Räkna med tjugo minuter och en bild du faktiskt vill titta på när den är klar.",
    },
  ],

  accessibility:
    "Varje ruta är en riktig knapp vars etikett säger vilken kolumn och rad den ligger i och om den är fylld, tom eller obestämd, så hela brädet går att lösa med tangentbord och läses upp av en skärmläsare. Tillståndet visas med både färg och tecken, så färgen aldrig är ensam bärare. Ingenting kräver att du drar, och det finns ingen tidsgräns.",

  together: [
    {
      title: "Dela på riktningarna",
      body: "Den ena tar raderna och den andra kolumnerna. Ni kommer att hitta olika saker, vilket är hela poängen.",
    },
    {
      title: "Säg beviset högt",
      body: "Innan en ruta fylls, förklara varför den måste vara fylld. Det avslöjar en gissning snabbare än något annat.",
    },
    {
      title: "Gissa bilden",
      body: "Halvvägs in brukar motivet gå att ana. Att säga sin gissning högt gör resten av brädet roligare, även när gissningen var fel.",
    },
  ],

  faq: [
    {
      q: "Kan ett bräde ha två lösningar?",
      a: "Nej. Kandidater som tillåter två svar kastas innan de delas ut, och på det största rutnätet är det 18 procent av dem.",
    },
    {
      q: "Går alla bräden att lösa utan att gissa?",
      a: "Ja. En lösare som bara resonerar radvis och kolumnvis måste klara brädet helt innan det delas ut.",
    },
    {
      q: "Vilka storlekar finns?",
      a: "25, 100 och 225 rutor. Det minsta bär 15 sifferledtrådar och det största 53.",
    },
    {
      q: "Fungerar det på en telefon?",
      a: "Ja, men det största rutnätet ger rutor kring 18 bildpunkter på en smal skärm. De två mindre är bekvämare i handen.",
    },
    {
      q: "Vad mäter rekordet?",
      a: "Tiden det tog att lösa brädet, och mindre är bättre. Varje storlek har sitt eget rekord.",
    },
    {
      q: "Kostar det något?",
      a: "Nej. Gratis, utan konto och utan annonser, och det fungerar offline när sidan har laddat en gång.",
    },
  ],

  keywords: ["nonogram", "bildpussel", "logik", "rutnät", "pussel", "gratis"],
};
