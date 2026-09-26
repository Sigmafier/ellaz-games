import type { GameCopy } from "../../types";

/** Svenska, från `node scripts/brief.mjs sv 2048`. Botsiffrorna kommer ur
 *  `scripts/sim/n2048-reach.mjs`, bräderna ur spelets `logic.ts`. */
export const n2048Sv: GameCopy = {
  name: "2048",
  metaTitle: "2048 - slå ihop rutor till 2048 | Ellaz",
  metaDescription:
    "Svep, rutor med samma tal slås ihop, och målet är 2048. Tre bräden: 5x5 till 256, 4x4 till 2048 och 3x3 till 512. Gratis och utan konto.",

  lede: "Svep åt något håll och alla rutor glider dit. Två rutor med samma tal slås ihop till ett, och målet är att nå 2048.",

  body: [
    "Tre bräden som är tre helt olika svårigheter, trots att regeln är identisk. Det stora brädet är 5 rutor gånger 5 och målet är 256. Det klassiska är 4 gånger 4 och målet är 2048. Det lilla är 3 gånger 3 och målet är 512, och det är det svåraste av dem, vilket förvånar de flesta.",
    "Ett litet bräde är svårare.",
    "Anledningen är att varje svep lägger till en ny ruta, så brädet fylls i samma takt oavsett hur många rutor det har. På ett bräde med nio rutor tar det slut nästan omedelbart. En spelare som sveper helt på måfå når i snitt 517 som högsta ruta på det stora brädet, 105 på det klassiska och 28 på det lilla. Samma slumpspelare når barnmålet i 94 procent av omgångarna och de andra två målen aldrig.",
    "Att alltid trycka rutorna mot samma hörn är den enklaste strategi som finns, och vi mätte hur mycket den är värd. Över 1 500 omgångar per bräde lyfter den högsta rutan från 105 till 198 på det klassiska brädet, från 517 till 714 på det stora och från 28 till 46 på det lilla. Det är nästan en fördubbling på det klassiska brädet. Fyra ord, dubbla resultatet.",
    "Den ärliga begränsningen gäller målet självt. En ruta med 2048 kräver att 1 024 rutor har dykt upp och slagits ihop utan att brädet fastnat en enda gång, och en slumpomgång på det klassiska brädet är slut efter ungefär 116 drag. Avståndet däremellan är stort. Spelet fortsätter gärna efter 2048 om du kommer dit, men räkna med att de första kvällarna handlar om 256 och 512.",
  ],

  howToPlay: [
    {
      title: "Svep åt ett håll",
      body: "Alla rutor glider så långt de kan åt det hållet. Piltangenterna gör samma sak på en dator.",
    },
    {
      title: "Lika slås ihop",
      body: "Två rutor med samma tal blir en ruta med dubbla talet. En ruta slås bara ihop en gång per drag.",
    },
    {
      title: "En ny ruta varje drag",
      body: "Efter varje svep dyker en ny ruta upp på en slumpmässig tom plats. Det är därför brädet obönhörligt fylls.",
    },
    {
      title: "Byt bräde när det tar emot",
      body: "5x5 mot 256 är den mjuka ingången, 3x3 mot 512 den hårda. Rekordet i poäng delas mellan bräderna.",
    },
  ],

  tips: [
    {
      title: "Välj ett hörn och håll det",
      body: "Tryck rutorna mot samma hörn varje gång. Mätt över 1 500 omgångar lyfter det den högsta rutan från 105 till 198 på det klassiska brädet.",
    },
    {
      title: "Undvik det fjärde hållet",
      body: "Sveper du uppåt när hela raden ligger nere flyttas din största ruta från hörnet. Tre riktningar räcker nästan alltid.",
    },
    {
      title: "Bygg en trappa längs kanten",
      body: "En rad som går 128, 64, 32, 16 kan slås ihop hela vägen i ett drag. Den formen är hela skillnaden mellan 256 och 1024.",
    },
  ],

  teaches: [
    {
      title: "Dubblering",
      body: "Varje sammanslagning är ett tal gånger två. Talraden 2, 4, 8, 16 blir konkret på ett sätt ingen tabell kan göra den.",
    },
    {
      title: "Att planera under slump",
      body: "Var nästa ruta dyker upp går inte att styra, men var dina egna rutor står går att styra. Att skilja på de två är lärdomen.",
    },
    {
      title: "Att ge upp ett drag",
      body: "Det bästa draget är ibland det som inte slår ihop något alls. Tålamod är mätbart lönsamt här.",
    },
  ],

  ages: [
    {
      title: "Sex år, på 5x5",
      body: "Målet är 256 och brädet är stort nog att förlåta. En slumpspelare når målet i 94 procent av omgångarna, så ett barn gör det också.",
    },
    {
      title: "Tio år, på 4x4",
      body: "Det klassiska brädet och målet 2048. Ungefär där hörnstrategin börjar gå att hålla i huvudet.",
    },
    {
      title: "Vuxen, på 3x3",
      body: "Nio rutor och målet 512. En slumpomgång slutar på 28, vilket säger det mesta om hur lite utrymme det finns.",
    },
  ],

  accessibility:
    "Brädet är fäst åt vänster oavsett språk, så ett svep åt höger flyttar rutorna åt höger även i en app som annars läses från höger. Varje ruta är märkt med sitt tal, och talen läses upp av en skärmläsare. Pilknapparna under brädet är riktiga knappar, så ingenting kräver att du sveper, och det finns ingen tidsgräns.",

  together: [
    {
      title: "Ett drag var",
      body: "Turas om att svepa på samma bräde. Det är genast svårare, eftersom ni inte har samma plan.",
    },
    {
      title: "Säg riktningen högt",
      body: "Den ena bestämmer och den andra utför. Att behöva motivera ett svep avslöjar ett dåligt svep direkt.",
    },
    {
      title: "Samma bräde, två enheter",
      body: "Starta samtidigt och jämför poängen. Rekordet sparas på enheten själv och följer inte med någon annanstans.",
    },
  ],

  faq: [
    {
      q: "Vilket bräde är svårast?",
      a: "Det minsta. 3x3 med målet 512 ger minst plats, och en slumpspelare kommer bara till 28 där mot 105 på det klassiska brädet.",
    },
    {
      q: "Vad händer när jag når målet?",
      a: "Du får fira, och sedan kan du fortsätta spela på samma bräde så länge det finns drag kvar.",
    },
    {
      q: "Kan en ruta slås ihop två gånger i samma drag?",
      a: "Nej. Varje ruta slås ihop högst en gång per svep, vilket är det som gör brädet förutsägbart.",
    },
    {
      q: "Hur många rutor krävs för en 2048:a?",
      a: "1 024 rutor måste ha dykt upp och slagits ihop. Det är därför det klassiska målet tar tid.",
    },
    {
      q: "Sparas mitt rekord?",
      a: "Ja, i poäng, på enheten själv. Rekordet är gemensamt för de tre bräderna.",
    },
    {
      q: "Kostar det något?",
      a: "Nej. Gratis, utan konto och utan annonser, och det fungerar offline när sidan har laddat en gång.",
    },
  ],

  keywords: ["2048", "siffror", "svep", "pussel", "klassiker", "gratis"],
};
