import type { GameCopy } from "../../types";

/** Svenska, från `node scripts/brief.mjs sv minesweeper`. Andelen gissningsfria
 *  bräden kommer ur `scripts/sim/minesweeper-guessfree.mjs`. */
export const minesweeperSv: GameCopy = {
  name: "Minröj",
  metaTitle: "Minröj - klassikern i webbläsaren | Ellaz",
  metaDescription:
    "Röj brädet utan att trampa på en mina. Tre storlekar, från 9x9 med 10 minor till 14x14 med 40. Första trycket är alltid säkert. Gratis och utan konto.",

  lede: "Varje siffra säger hur många minor som ligger intill den. Röj hela brädet utan att trycka på en enda av dem.",

  body: [
    "Tre storlekar, tre täthetsgrader. Det lilla brädet är 9x9 med 10 minor, alltså 12,3 procent minerat. Mellanbrädet är 12x12 med 24 minor och 16,7 procent, och det stora är 14x14 med 40 minor och 20,4 procent. De åtta procentenheterna mellan lättast och svårast ser små ut skrivna så här och är skillnaden mellan ett bräde som nästan alltid går att resonera sig igenom och ett som nästan aldrig gör det.",
    "Första trycket är alltid säkert.",
    "Minorna läggs ut efter att du har tryckt, och varken rutan du tryckte på eller någon av dess grannar får en mina. Det betyder att den första öppningen alltid blir en riktig öppning med siffror runt sig, aldrig en ensam trea i ett hörn och definitivt aldrig en mina på första draget. Ett spel som kan sluta innan det har börjat är inte svårt, det är bara orättvist.",
    "Vi lät en lösare som aldrig gissar spela 2 000 bräden per nivå. Den klarade 79,8 procent av de lätta, 44,4 procent av mellannivån och 12,3 procent av de svåra. Resten fick chansa. De stannade på ett läge där ingen slutsats fanns kvar att dra och det enda som återstod var att välja en ruta på känsla.",
    "Där ligger också den ärliga begränsningen. Brädet byggs inte om för att garantera att det går att lösa utan gissningar, så på svår nivå kommer nästan nio av tio omgångar förr eller senare till ett läge där du måste chansa. Det är klassikerns egen natur och inte ett fel, men det är värt att veta innan du lägger tjugo minuter på ett stort bräde och förlorar på sista rutan.",
  ],

  howToPlay: [
    {
      title: "Tryck för att öppna",
      body: "Ett tryck öppnar en ruta. Siffran som dyker upp säger hur många av de åtta grannarna som är minor.",
    },
    {
      title: "Håll inne för att flagga",
      body: "Ett långt tryck sätter en flagga på en ruta du är säker på. Flaggan skyddar rutan från att öppnas av misstag.",
    },
    {
      title: "Läs siffrorna mot varandra",
      body: "En etta med en enda oöppnad granne pekar ut en mina. En etta vars mina redan är flaggad säger att resten är säkra.",
    },
    {
      title: "Byt storlek i raden ovanför",
      body: "Tre storlekar med var sitt rekord. Tiden på ett bräde på 9x9 och tiden på 14x14 är olika mätningar.",
    },
  ],

  tips: [
    {
      title: "Arbeta längs kanten av det öppnade",
      body: "All information finns i gränsen mellan öppnat och oöppnat. Inne i det öppnade området finns inget kvar att lära sig.",
    },
    {
      title: "Flagga bara det du vet",
      body: "En flagga du gissade dig till ljuger för dig resten av omgången, eftersom du kommer att räkna med den som ett faktum.",
    },
    {
      title: "Spara gissningen till sist",
      body: "När ett hörn kräver en chansning, röj allt annat först. Då är chansningen ett val mellan två rutor i stället för mellan tio.",
    },
  ],

  teaches: [
    {
      title: "Att sluta sig till det osynliga",
      body: "Ingen siffra säger var en mina ligger. Alla säger hur många, och platsen är något du räknar ut.",
    },
    {
      title: "Skillnaden mellan säkert och troligt",
      body: "Spelet straffar den som behandlar en sannolikhet som ett faktum, direkt och utan diskussion. Det är en nyttig lektion.",
    },
    {
      title: "Att arbeta systematiskt",
      body: "En genomgång ruta för ruta längs kanten hittar mer än en blick över hela brädet. Det är samma vana som gör felsökning möjlig.",
    },
  ],

  ages: [
    {
      title: "Åtta år, på 9x9",
      body: "10 minor och 12,3 procent täthet. En vuxen som förklarar den första ettan brukar räcka som hela introduktionen.",
    },
    {
      title: "Tolv år, på 12x12",
      body: "24 minor och betydligt fler lägen där två siffror måste läsas mot varandra. Ungefär där spelet blir ett resonemang.",
    },
    {
      title: "Vuxen, på 14x14",
      body: "40 minor och 12,3 procent av bräden som går att lösa helt utan gissning. Det är svårt på riktigt, och det är meningen.",
    },
  ],

  accessibility:
    "Varje ruta är en riktig knapp vars etikett säger vad den innehåller, så brädet går att spela med tangentbord och läses upp av en skärmläsare. Siffrorna har både färg och form, så färgen aldrig är ensam bärare. Ingenting kräver att du drar. Klockan mäter men tar aldrig slut, och ett bräde kan stå orört hur länge som helst.",

  together: [
    {
      title: "En läser, en trycker",
      body: "Den ena pekar ut vilken siffra som säger något och den andra öppnar rutan. Att behöva säga slutsatsen högt gör den tydligare.",
    },
    {
      title: "Rösta om gissningen",
      body: "När brädet kräver en chansning, välj ruta tillsammans. Det gör förlusten gemensam, vilket är förvånansvärt viktigt.",
    },
    {
      title: "Samma storlek, två enheter",
      body: "Starta samtidigt och jämför tiden efteråt. Rekordet ligger kvar på varje enhet för sig.",
    },
  ],

  faq: [
    {
      q: "Kan jag trampa på en mina med första trycket?",
      a: "Nej. Minorna placeras efter ditt första tryck, och varken den rutan eller dess grannar får en mina.",
    },
    {
      q: "Går alla bräden att lösa utan att gissa?",
      a: "Nej. En lösare som aldrig gissar klarade 79,8 procent av de lätta bräderna, 44,4 procent av mellannivån och 12,3 procent av de svåra.",
    },
    {
      q: "Hur sätter jag en flagga?",
      a: "Håll inne på rutan. Flaggan hindrar att rutan öppnas av misstag och går att ta bort på samma sätt.",
    },
    {
      q: "Vilka storlekar finns?",
      a: "9x9 med 10 minor, 12x12 med 24 och 14x14 med 40. Det motsvarar 12,3, 16,7 och 20,4 procent minerade rutor.",
    },
    {
      q: "Vad mäter rekordet?",
      a: "Tiden, och mindre är bättre. Varje storlek har ett eget rekord och det sparas på enheten själv.",
    },
    {
      q: "Kostar det något?",
      a: "Nej. Gratis, utan konto och utan annonser, och det fungerar offline när sidan har laddat en gång.",
    },
  ],

  keywords: ["minröj", "minesweeper", "logik", "rutnät", "klassiker", "gratis"],
};
