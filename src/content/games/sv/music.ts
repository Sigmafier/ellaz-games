import type { GameCopy } from "../../types";

/** Svenska, från `node scripts/brief.mjs sv music`. Siffrorna kommer ur
 *  `scripts/sim/music-tunes.mjs` och spelets egen `logic.ts`. */
export const musicSv: GameCopy = {
  name: "Musikruta",
  metaTitle: "Musikruta - bygg din egen melodi | Ellaz",
  metaDescription:
    "Tryck i rutorna och bygg en melodi rad för rad. Sex rader toner, fyra till åtta takter, och en slumpknapp för överraskning. Gratis och utan konto.",

  lede: "Ett rutnät väntar tomt. Tryck i en ruta för att lägga en ton där, och lyssna på melodin du byggt när den spelas upp.",

  body: [
    "Sex rader toner. Fyra till åtta takter, som mest 48 rutor. Räknat rakt av ger det 281 474 976 710 656 olika möjliga melodier på det längsta rutnätet, ett tal så stort att ingen någonsin kommer höra dem alla.",
    "Tonerna är valda. Med flit.",
    "Femton par av toner i skalan ligger så att ingen är bara en halvton ifrån sin granne och ingen bildar den skarpa klangen en tritonus ger, och de två närmaste tonerna ligger alltid en hel ton ifrån varandra. Det betyder att i princip alla kombinationer en spelare råkar trycka fram låter hyfsat bra tillsammans, vilket är hela poängen: ingen tur behövs för att göra något som låter som musik.",
    "Slumpknappen är inte helt slumpmässig heller. Den kan välja mellan 1 679 616 olika melodier på det långa rutnätet och 1 296 på det korta, ett mindre men fortfarande enormt urval byggt för att alltid låta rimligt.",
    "Att korta av en åttatakters melodi till fyra behåller ungefär hälften av tonerna, vilket är den ärliga begränsningen: att byta längd är inte gratis, det är en riktig omredigering av det du redan byggt, inte bara en klippning i slutet.",
  ],

  howToPlay: [
    {
      title: "Tryck i en ruta",
      body: "En ton läggs dit du trycker. Trycker du igen tas tonen bort.",
    },
    {
      title: "Lyssna på melodin",
      body: "Spela upp-knappen spelar hela raden från vänster till höger, i din egen takt.",
    },
    {
      title: "Byt röst",
      body: "Tre olika ljud finns att välja mellan, var och en med sin egen färg i rutnätet.",
    },
    {
      title: "Prova slumpknappen",
      body: "Den fyller rutnätet med en färdig melodi, vald ur miljontals kombinationer som är byggda för att låta bra.",
    },
  ],

  tips: [
    {
      title: "Börja med bara några toner",
      body: "Ett fåtal toner utspridda är lättare att lyssna på och bygga vidare från än ett fullt rutnät från början.",
    },
    {
      title: "Lyssna innan du dömer",
      body: "En kombination som ser konstig ut i rutnätet kan låta helt rimlig när den spelas, eftersom tonerna är valda för att passa ihop.",
    },
    {
      title: "Korta av med flit",
      body: "Att gå från åtta takter till fyra behåller bara ungefär hälften av tonerna, så resultatet blir en ny melodi snarare än samma fast kortare.",
    },
  ],

  teaches: [
    {
      title: "Rytm och upprepning",
      body: "Att placera toner på en tidslinje och höra hur de faller in är grunden för allt musikskapande.",
    },
    {
      title: "Att experimentera fritt",
      body: "Eftersom nästan alla kombinationer låter bra finns inget att göra fel, vilket gör det tryggt att prova vad som helst.",
    },
    {
      title: "Orsak och verkan i ljud",
      body: "Att flytta en enda ton och genast höra skillnaden kopplar handling till resultat på ett direkt sätt.",
    },
  ],

  ages: [
    {
      title: "Tre år, fritt utforskande",
      body: "Att bara trycka och lyssna kräver ingen förståelse för musik alls, bara nyfikenhet.",
    },
    {
      title: "Sex år, bygga en egen melodi",
      body: "Ungefär där ett barn börjar lägga toner med avsikt i stället för på måfå, och märker skillnaden.",
    },
    {
      title: "Alla åldrar, med slumpknappen",
      body: "Ett snabbt sätt att höra en färdig idé och sedan bygga vidare på den själv.",
    },
  ],

  accessibility:
    "Varje ruta är märkt med sin takt och sitt tillstånd, tom eller fylld, så rutnätet går att bygga med tangentbord och läses upp av en skärmläsare. Varje röst har en egen radfärg. Ingenting kräver att du drar, och det finns ingen tidsgräns.",

  together: [
    {
      title: "En bygger, en lyssnar",
      body: "Den ena lägger toner, den andra säger vad de tycker om resultatet. Att beskriva ett ljud med ord är en egen övning.",
    },
    {
      title: "Bygg en rad var",
      body: "Turas om att fylla en rad i rutnätet var. Melodin blir gemensam på ett sätt ingen ensam byggde.",
    },
    {
      title: "Gissa vad slumpknappen ger",
      body: "Innan ni trycker, gissa hur melodin kommer att låta. Sedan lyssna och se vem som gissade närmast.",
    },
  ],

  faq: [
    {
      q: "Hur många toner finns i skalan?",
      a: "Femton par valda så att ingen är en halvton eller en tritonus ifrån sin granne, för att allt ska låta bra tillsammans.",
    },
    {
      q: "Vad gör slumpknappen?",
      a: "Den fyller rutnätet med en färdig melodi, vald ur upp till 1 679 616 möjliga kombinationer på det långa rutnätet.",
    },
    {
      q: "Sparas melodin om jag byter längd?",
      a: "Ja, delvis. Rutnätet behåller varje ton som fortfarande får plats i stället för att dela ut en helt ny melodi.",
    },
    {
      q: "Hur många rutor finns det som mest?",
      a: "48, på det längsta rutnätet med åtta takter över sex röster.",
    },
    {
      q: "Vad mäter rekordet?",
      a: "Poäng, byggt på hur fyllt rutnätet är. Ett helt fullt rutnät på 48 rutor är värt 8 mynt.",
    },
    {
      q: "Kostar det något?",
      a: "Nej. Gratis, utan konto och utan annonser, och det fungerar offline när sidan har laddat en gång.",
    },
  ],

  keywords: ["musik", "melodi", "skapa", "toner", "barn", "gratis"],
};
