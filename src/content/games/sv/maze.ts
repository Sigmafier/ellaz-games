import type { GameCopy } from "../../types";

/** Svenska, från `node scripts/brief.mjs sv maze`. Siffrorna kommer ur
 *  `scripts/sim/maze-routes.mjs`, brädena ur spelets `logic.ts`. */
export const mazeSv: GameCopy = {
  name: "Vägen hem",
  metaTitle: "Vägen hem - labyrint med smulor att samla | Ellaz",
  metaDescription:
    "Styr musen genom labyrinten och samla alla smulor på vägen. Fyra storlekar, från 5x5 med två smulor till 10x10 med sex. Gratis och utan konto.",

  lede: "En mus, en labyrint och ett antal smulor att samla innan hon når hemmet. Ordningen du samlar dem i påverkar hur långt du behöver gå.",

  body: [
    "Fyra storlekar: 5x5 med två smulor, 6x6 med tre, 7x7 med fyra och 10x10 med sex. Varje labyrint delas ut på nytt, och vi har delat ut 20 000 för att se hur de faktiskt beter sig.",
    "Ordningen spelar roll. Alltid.",
    "På det stora brädet kostar den sämsta ordningen i snitt 84,35 steg mot en kortaste väg på 39,53, och en mus som alltid tar närmaste smula först går 43,91. Att bara samla i läsordning, vänster till höger och uppifrån och ned, matchar den kortaste vägen på bara 44,6 procent av bräden. Att ta närmaste smula först är en bättre tumregel: den matchar 92,7 procent av de små bräderna och 68,6 procent av de stora.",
    "Expertbrädet är en annan sak helt.",
    "De tre mindre bräderna öppnar upp sina återvändsgränder igen efter att de har skapats, ungefär nio av tio på det lilla brädet, vilket lämnar 0,35 återvändsgränder per utdelning i snitt. Expertbrädet gör aldrig det. Det skärs fram och lämnas som det är, så gångarna grenar sig i stället för att slingra, med 32,94 återvändsgränder per utdelning mot det sjufaldiga brädets 5,92. Den kortaste vägen där är i snitt 52,78 steg, en mus som tar närmaste smula går 60,92 och matchar den bästa ordningen på bara 33,0 procent av bräden.",
    "Den ärliga begränsningen är att fyra smulor har 24 möjliga ordningar och sex har 720, och spelet räknar igenom alla för att veta vad par är. Det är genomförbart för sex smulor och skulle inte vara det för tio, vilket är varför det största brädet stannar där det gör.",
  ],

  howToPlay: [
    {
      title: "Styr musen",
      body: "Pilarna under labyrinten eller piltangenterna flyttar musen ett steg åt gången i gångarna.",
    },
    {
      title: "Samla alla smulor",
      body: "En smula försvinner när musen når den. Ordningen är fri, men den påverkar hur många steg det tar totalt.",
    },
    {
      title: "Nå hemmet sist",
      body: "Hemmet väntar tills alla smulor är samlade. Ett tomt bräde och en mus vid dörren avslutar rundan.",
    },
    {
      title: "Byt storlek i raden ovanför",
      body: "Fyra storlekar, och rekordet är en svit av perfekta labyrinter i följd, räknad per storlek.",
    },
  ],

  tips: [
    {
      title: "Ta närmaste smula först",
      body: "Det är en enkel tumregel som matchar den kortaste vägen på 92,7 procent av de små bräderna. Den är sällan fel och aldrig svår att följa.",
    },
    {
      title: "Titta på hela brädet innan du går",
      body: "En snabb blick på var alla smulor ligger sparar omvägar som annars upptäcks först vid nästa korsning.",
    },
    {
      title: "Räkna inte med genvägar på expertbrädet",
      body: "Där finns inga öppnade återvändsgränder att chansa på. Varje gång är en riktig gaffel med bara ett rätt svar.",
    },
  ],

  teaches: [
    {
      title: "Att planera en rutt",
      body: "Fyra mål och en karta är en enkel version av ett problem vuxna löser varje dag med leveranser och ärenden.",
    },
    {
      title: "Rumsligt minne",
      body: "Att hålla kvar var en redan besökt gång ledde är en färdighet som byggs upp av just den här sortens uppgift.",
    },
    {
      title: "Att jämföra alternativ",
      body: "Är den här vägen kortare än den andra? Frågan är enkel att ställa och förvånansvärt svår att svara rätt på utan att pröva.",
    },
  ],

  ages: [
    {
      title: "Tre år, på 5x5",
      body: "Två smulor och en liten labyrint. Att bara följa en gång tills den tar slut räcker för att klara den här storleken.",
    },
    {
      title: "Sex år, på 7x7",
      body: "Fyra smulor och riktiga återvändsgränder. Ungefär där ett barn börjar planera i stället för att bara prova sig fram.",
    },
    {
      title: "Vuxen, på expertbrädet",
      body: "Sex smulor, 720 möjliga ordningar och inga öppnade återvändsgränder att luta sig mot. Det tar tid att klara bra.",
    },
  ],

  accessibility:
    "Varje ruta är märkt med sitt innehåll, kolumn och rad, så labyrinten går att läsa med en skärmläsare och styras med tangentbord. Pilknapparna under brädet är riktiga knappar. Ingenting kräver att du drar, och det finns ingen tidsgräns som straffar en långsam runda.",

  together: [
    {
      title: "En pekar, en styr",
      body: "Den ena ser hela kartan och föreslår en väg, den andra trycker på pilarna. Att lita på anvisningar är en egen övning.",
    },
    {
      title: "Räkna stegen tillsammans",
      body: "Gissa hur många steg rundan kommer att ta innan ni börjar, och se hur nära ni kom när musen är hemma.",
    },
    {
      title: "Jämför två ordningar",
      body: "Spela samma labyrint två gånger med olika ordning på smulorna och se vilken som tog färre steg.",
    },
  ],

  faq: [
    {
      q: "Spelar ordningen roll?",
      a: "Ja. Att bara ta närmaste smula matchar den kortaste vägen på 92,7 procent av de små bräderna men bara 68,6 procent av de stora.",
    },
    {
      q: "Vilka storlekar finns?",
      a: "5x5 med två smulor, 6x6 med tre, 7x7 med fyra och 10x10 med sex.",
    },
    {
      q: "Vad är annorlunda med expertbrädet?",
      a: "Det öppnar aldrig sina återvändsgränder igen, så gångarna grenar sig i stället för att slingra. De andra tre gör det.",
    },
    {
      q: "Vad mäter rekordet?",
      a: "En svit av perfekta labyrinter i följd, alltså rundor lösta på den kortast möjliga vägen. Rekordet är per storlek.",
    },
    {
      q: "Behöver barnet kunna läsa?",
      a: "Nej. Labyrinten styrs med pilar, och målet är att se och följa gångarna.",
    },
    {
      q: "Kostar det något?",
      a: "Nej. Gratis, utan konto och utan annonser, och det fungerar offline när sidan har laddat en gång.",
    },
  ],

  keywords: ["labyrint", "mus", "smulor", "pussel", "barn", "gratis"],
};
