import type { GameCopy } from "../../types";

/** Svenska, från `node scripts/brief.mjs sv sudoku`. Ledtrådssiffrorna kommer
 *  ur `scripts/sim/sudoku-clues.mjs`. Inget här är översatt. */
export const sudokuSv: GameCopy = {
  name: "Sudoku",
  metaTitle: "Sudoku - sex nivåer, från 4x4 för barn | Ellaz",
  metaDescription:
    "Sudoku i webbläsaren med sex nivåer, från ett bräde på 4x4 med djur till 9x9 för expert. Varje bräde har exakt en lösning. Gratis och utan konto.",

  lede: "Fyll rutnätet så att varje rad, varje kolumn och varje ruta innehåller alla siffror en enda gång. Sex nivåer, från ett bräde på 4x4 upp till 9x9.",

  body: [
    "Regeln är alltid densamma. Det enda som ändras mellan de sex nivåerna är hur stort brädet är och hur mycket som redan står ifyllt. Den lättaste nivån är ett rutnät på 4x4 där 9 av 16 rutor är givna, så det är 7 rutor att fylla i. Det låter trivialt tills man ser en femåring göra det: resonemanget är exakt samma resonemang som på ett bräde på 9x9, bara kortare.",
    "Varje bräde har en lösning.",
    "Det är inte en detalj utan hela konstruktionen. Ett bräde byggs baklänges från en färdig lösning, och ledtrådar tas bort en i taget bara så länge lösningen förblir entydig. Ett bräde med två svar ser likadant ut som ett med ett, ända tills någon sitter fast och inte vet om felet är deras eget. Den situationen kan inte uppstå. Det är därför genereringen är långsammare än den hade behövt vara.",
    "Antalet ledtrådar per nivå är uppmätt över 60 bräden vardera: 9 på det lilla barnbrädet, 18 på 6x6, sedan 42, 34 och 28 på de tre vanliga nivåerna på 9x9. Expertnivån siktar på 24 och landar i snitt på 24,7, och ibland stannar den på 27. Den ärliga begränsningen ligger just där. Att pressa ett bräde under 24 ledtrådar och samtidigt garantera en enda lösning tar så lång tid att spelet skulle stå och tänka medan du tittar på det, så vi tar det bräde generatorn hittar inom rimlig tid i stället för att jaga den sista ledtråden.",
    "På expert står alltså 56 rutor tomma av 81, mot 39 på lätt. Skillnaden i känsla är större än skillnaden i siffror, eftersom varje borttagen ledtråd tar bort fler än en slutsats.",
  ],

  howToPlay: [
    {
      title: "Välj en ruta",
      body: "Tryck på en tom ruta så markeras den. Raden, kolumnen och rutan den tillhör lyfts fram samtidigt.",
    },
    {
      title: "Välj en siffra",
      body: "Siffrorna står under brädet. På barnbrädena är det djur i stället, och regeln är densamma.",
    },
    {
      title: "Ingen siffra får upprepas",
      body: "Varje rad, varje kolumn och varje inramad ruta ska innehålla varje siffra en gång. Det är hela regeln.",
    },
    {
      title: "Byt nivå när brädet känns för litet",
      body: "Sex nivåer, och varje nivå har sitt eget rekord. Tiden på ett bräde på 4x4 och tiden på ett expertbräde är inte jämförbara.",
    },
  ],

  tips: [
    {
      title: "Leta efter den fullaste raden",
      body: "Raden eller rutan med flest siffror redan ifyllda är den som ger svar snabbast. Börja där i stället för uppifrån och ned.",
    },
    {
      title: "Ett tal i taget",
      body: "Gå igenom brädet och leta bara efter var en sjua kan stå. Att hålla en siffra i huvudet är enklare än att hålla nio.",
    },
    {
      title: "Gissa aldrig",
      body: "Brädet kan alltid lösas med resonemang, eftersom lösningen är entydig. Sitter du fast finns svaret någon annanstans på brädet, inte i en gissning.",
    },
  ],

  teaches: [
    {
      title: "Uteslutning",
      body: "Att komma fram till ett svar genom att visa att inget annat går är ett riktigt logiskt verktyg, och sudoku är den mildaste introduktionen till det som finns.",
    },
    {
      title: "Att hålla flera villkor samtidigt",
      body: "En ruta styrs av tre saker på en gång: sin rad, sin kolumn och sin inramning. Att väga ihop dem är färdigheten.",
    },
    {
      title: "Tålamod utan press",
      body: "Ingen klocka tvingar fram ett drag, och ett fel går att ta tillbaka. Det gör det möjligt att sitta kvar vid en svår ruta.",
    },
  ],

  ages: [
    {
      title: "Fyra år, på 4x4 med djur",
      body: "Fyra djur, 7 tomma rutor och inga siffror inblandade. Ett barn som kan se att två likadana djur inte får stå på samma rad kan spela.",
    },
    {
      title: "Sju år, på 6x6",
      body: "18 ledtrådar och siffror i stället för djur. Ungefär där tålamodet räcker till ett bräde som inte går att överblicka på en gång.",
    },
    {
      title: "Vuxen, på 9x9",
      body: "Lätt ger 42 ledtrådar, expert i snitt 24,7. Samma bräde, och två helt olika kvällar.",
    },
  ],

  accessibility:
    "Varje ruta är en riktig knapp med sitt innehåll som etikett, så hela brädet går att nå med tangentbord och läses upp av en skärmläsare. Markeringen av rad, kolumn och ruta visas med både färg och ram, så färgen aldrig är ensam bärare. Ingenting kräver att du drar, och det finns ingen klocka som tar slut. Ett drag kan alltid tas tillbaka.",

  together: [
    {
      title: "En ruta var",
      body: "Turas om att fylla i. Den som inte har turen får säga varför siffran stämmer innan den läggs.",
    },
    {
      title: "Låt barnet leta åt dig",
      body: "En vuxen säger vilken siffra de letar efter och barnet pekar ut var den kan stå. Det fungerar långt innan barnet kan lösa ett bräde självt.",
    },
    {
      title: "Två enheter, samma nivå",
      body: "Starta samma nivå samtidigt och jämför tiden. Rekordet sparas per nivå på varje enhet för sig.",
    },
  ],

  faq: [
    {
      q: "Hur många nivåer finns det?",
      a: "Sex, på tre bredder: 4x4, 6x6 och 9x9. De två minsta är gjorda för barn och använder djur i stället för siffror.",
    },
    {
      q: "Kan ett bräde ha två lösningar?",
      a: "Nej. Ledtrådar tas bort bara så länge lösningen förblir entydig, så ett bräde du sitter fast på har alltid ett svar som går att resonera sig fram till.",
    },
    {
      q: "Hur många ledtrådar får jag?",
      a: "9 på 4x4, 18 på 6x6, sedan 42, 34 och 28 på de tre vanliga nivåerna. Expert landar i snitt på 24,7.",
    },
    {
      q: "Vad mäter rekordet?",
      a: "Tiden det tog att lösa brädet, och mindre är bättre. Varje nivå har ett eget rekord, eftersom nivåerna inte är jämförbara.",
    },
    {
      q: "Sparas ett halvfärdigt bräde?",
      a: "Ja. Stänger du fliken står brädet kvar där du lämnade det, med klockan på den tid du faktiskt hade spelat.",
    },
    {
      q: "Kostar det något?",
      a: "Nej. Gratis, utan konto och utan annonser, och det fungerar offline när sidan har laddat en gång.",
    },
  ],

  keywords: ["sudoku", "siffror", "logik", "rutnät", "pussel", "gratis"],
};
