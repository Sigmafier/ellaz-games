import type { GameCopy } from "../../types";

/** Svenska, från `node scripts/brief.mjs sv coloring`. Bilderna och paletten
 *  kommer ur `src/games/coloring/pictures.ts`. Inget här är översatt. */
export const coloringSv: GameCopy = {
  name: "Måla",
  metaTitle: "Måla online - gratis målarbok för barn | Ellaz",
  metaDescription:
    "Välj en färg och tryck. 20 bilder plus ett tomt blad, 20 färger, och ingen poäng alls. Gratis i webbläsaren, utan konto.",

  lede: "Välj en färg, tryck på en yta, och den blir den färgen. 20 bilder, ett tomt blad, och ingenting att vinna.",

  body: [
    "Det här är det enda spelet på hela webbplatsen som inte håller något rekord, och det kommer det aldrig att göra. Beslutet står skrivet i reglerna i stället för att lämnas åt den som bygger nästa skärm, av ett enkelt skäl: att sätta poäng på ett barns teckning gör bilden till ett prov. 20 av de andra spelen sparar ett rekord. Det här sparar en bild.",
    "20 bilder finns att välja på, plus ett tomt blad för den som hellre börjar från ingenting. Paletten har 20 färger. Det finns inget rätt sätt att använda dem, och ingen grön himmel gör någon upprörd här.",
    "Ingenting laddas upp.",
    "Det du har målat ligger kvar i spelet på just den enheten och finns där när du kommer tillbaka. Det är också den ärliga begränsningen: eftersom ingenting skickas någonstans finns bilden bara på den ena enheten, och rensas webbläsarens data är den borta. Det är priset för att ingen någonsin granskar det ett barn har ritat.",
  ],

  howToPlay: [
    {
      title: "Välj en bild",
      body: "20 bilder ligger i en rad, och längst fram finns ett tomt blad. Tryck på den du vill ha så öppnas den.",
    },
    {
      title: "Välj en färg",
      body: "Paletten med 20 färger sitter bredvid bilden, på sidan om den på en dator och under den på en telefon. Den valda färgen syns tydligt.",
    },
    {
      title: "Tryck på en yta",
      body: "Ytan fylls med färgen. Trycker du igen med en annan färg byts den ut, så ingenting går att göra fel på ett sätt som inte går att ångra.",
    },
    {
      title: "Byt bild när du vill",
      body: "Den bild du lämnar sparas som den är. Kommer du tillbaka till den ligger färgerna kvar.",
    },
  ],

  tips: [
    {
      title: "Börja med de stora ytorna",
      body: "Himmel, gräs och bakgrund först. Då ser bilden snabbt ut som något, och det är lättare för ett litet barn att hålla intresset uppe när något händer direkt.",
    },
    {
      title: "Två närliggande färger gör mer än tio olika",
      body: "Två gröna bredvid varandra får ett träd att se ut som ett träd. Hela paletten på en gång blir oftast bara rörigt, och det är värt att prova båda.",
    },
    {
      title: "Det tomma bladet är inte tomt",
      body: "Det går att fylla helt med en färg och sedan måla ovanpå. För ett barn som inte vill följa linjer är det ofta det blad som används mest.",
    },
  ],

  teaches: [
    {
      title: "Att hålla i en färg och en plan",
      body: "Att välja en färg och sedan leta rätt på alla ytor som ska ha den är en liten uppgift med början och slut, och den går att klara helt själv.",
    },
    {
      title: "Att se former",
      body: "En bild delad i ytor blir ett pussel av former så fort man börjar fylla dem. Barn som målar här börjar ofta prata om vad delarna föreställer.",
    },
    {
      title: "Att göra något utan att bli bedömd",
      body: "Det finns ingen poäng, ingen stjärna och ingen lista. Det är ovanligt i programvara för barn, och det är med flit.",
    },
  ],

  ages: [
    {
      title: "Två år och uppåt",
      body: "Ett tryck fyller en yta. Det är hela styrningen, och det är ungefär den enklaste interaktion som finns.",
    },
    {
      title: "Fyra år, med de detaljerade bilderna",
      body: "Vid den åldern börjar ett barn välja färg med avsikt i stället för att ta den som råkar vara vald. Bilderna med fler ytor blir intressanta då.",
    },
    {
      title: "Sju år, på det tomma bladet",
      body: "Äldre barn tröttnar ofta på färdiga bilder och gör hellre egna mönster. Det tomma bladet finns för dem.",
    },
  ],

  accessibility:
    "Allt görs med tryck, och ytorna är stora nog för en grov pekare eller en liten hand. Ingenting kräver att du drar, och det finns ingen klocka som tar slut. Varje färg i paletten är en riktig knapp med ett namn, så den går att nå med tangentbord och läses upp av en skärmläsare, vilket betyder att färgen går att välja även av den som inte kan skilja den från grannen med ögat.",

  together: [
    {
      title: "En bild, två personer",
      body: "Turas om att fylla en yta var. Det blir en bild ingen av er hade gjort ensam, och det är oftast roligare än två separata.",
    },
    {
      title: "Be om en färg",
      body: "En vuxen säger en färg och ett barn letar upp den i paletten. Det är en färgövning som går av sig själv, utan att någon behöver kalla den en övning.",
    },
    {
      title: "Berätta om bilden efteråt",
      body: "Fråga vad som händer i den färdiga bilden. Ett barn som just har valt 20 färger har oftast en historia som hör till.",
    },
  ],

  faq: [
    {
      q: "Sparas teckningen?",
      a: "Ja, i spelet på den enheten, och den finns där när du kommer tillbaka. Den laddas aldrig upp någonstans.",
    },
    {
      q: "Varför finns ingen poäng?",
      a: "För att det inte finns något här att vara bättre eller sämre på. En poäng skulle göra en bild till ett prov, och det här är det enda spelet på webbplatsen som aldrig får någon.",
    },
    {
      q: "Hur många bilder finns det?",
      a: "20, plus ett tomt blad. Paletten har 20 färger.",
    },
    {
      q: "Går det att skriva ut?",
      a: "Nej, inte härifrån. Bilden bor i spelet på enheten, och det finns ingen väg ut ur den.",
    },
    {
      q: "Kostar det något?",
      a: "Nej. Gratis, utan konto, utan annonser och utan köp inne i spelet.",
    },
    {
      q: "Fungerar det offline?",
      a: "Ja, när sidan har laddat en gång fungerar allt offline.",
    },
  ],

  keywords: ["måla", "målarbok", "färger", "rita", "barn", "skapa"],
};
