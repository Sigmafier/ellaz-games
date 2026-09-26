import type { GameCopy } from "../../types";

/** Svenska, från `node scripts/brief.mjs sv vanish`. Siffrorna kommer ur
 *  `scripts/sim/thinking-levels.mjs` och spelets `logic.ts`. */
export const vanishSv: GameCopy = {
  name: "Försvinn",
  metaTitle: "Försvinn - kom ihåg det som just doldes | Ellaz",
  metaDescription:
    "Föremål visas en kort stund och döljs sedan. Peka ut var de låg. Tre nivåer, från tre föremål till sex. Gratis i webbläsaren, för barn och vuxna.",

  lede: "Några föremål visas på skärmen en kort stund. De döljs, och sedan är det din tur att peka ut exakt var de låg.",

  body: [
    "Tittfönstret krymper. 7, 8 eller 9 sekunder totalt, vilket ger 2,33 sekunder per föremål på lätt men bara 1,5 på svår. Fler saker att komma ihåg, mindre tid per sak, precis den kombination som gör spelet genuint svårare snarare än bara längre.",
    "Ett golv skyddar. Alltid ett golv.",
    "Oavsett hur svårigheten skalar får ingen nivå ge mindre än 1,5 sekunder per föremål eller under 5 sekunder totalt. Det betyder att spelet aldrig kan bli omöjligt bara för att fler föremål läggs till, det finns alltid ett minimum av tid att faktiskt titta.",
    "En ren gissning är värd 33,3 procent på lätt nivå, 25 på medel och bara 16,7 på svår, vilket är den siffra som säger hur mycket riktigt minne krävs för att klara sig bättre än slumpen. Den ärliga begränsningen är att spelet mäter korttidsminne rent och skoningslöst: det finns ingen strategi som ersätter att faktiskt ha sett var föremålen låg.",
  ],

  howToPlay: [
    {
      title: "Titta noga",
      body: "Föremålen visas i några sekunder. Studera var de ligger, inte bara vad de är.",
    },
    {
      title: "Vänta ut döljandet",
      body: "Skärmen döljer föremålen efter tittfönstret. Nu är det bara minnet som gäller.",
    },
    {
      title: "Peka ut platserna",
      body: "Tryck där du minns att varje föremål låg. Rätt plats räknas, oavsett i vilken ordning du pekar.",
    },
    {
      title: "Klättra genom nivåerna",
      body: "Fler föremål och kortare tid per föremål på varje ny nivå. Rekordet räknar hur långt du kom.",
    },
  ],

  tips: [
    {
      title: "Titta på layouten, inte varje föremål för sig",
      body: "Att komma ihåg en form, till exempel en triangel av tre punkter, är lättare än att minnas tre separata platser.",
    },
    {
      title: "Säg platserna högt under tittfönstret",
      body: "Att koppla ord till varje läge, till exempel övre vänster, gör minnet starkare än att bara titta tyst.",
    },
    {
      title: "Räkna med golvet på svår nivå",
      body: "Tiden går aldrig under 1,5 sekunder per föremål, hur svår nivån än blir. Det finns alltid en rimlig chans att hinna se.",
    },
  ],

  teaches: [
    {
      title: "Korttidsminne",
      body: "Att hålla kvar flera platser i huvudet under några sekunder är exakt den förmåga spelet tränar, om och om igen.",
    },
    {
      title: "Att koda information effektivt",
      body: "Att se en grupp föremål som en FORM snarare än som separata fakta gör dem lättare att minnas.",
    },
    {
      title: "Att skilja gissning från minne",
      body: "Med sex möjliga platser och en låg chans att gissa rätt belönar spelet bara den som verkligen sett och kommit ihåg.",
    },
  ],

  ages: [
    {
      title: "Fyra år, på lätt",
      body: "3 föremål och 7 sekunder att titta, 2,33 sekunder per föremål. Gott om tid för ett litet barn att studera noga.",
    },
    {
      title: "Sju år, på medel",
      body: "4 föremål och kortare tid per föremål. Ungefär där ett barn börjar gruppera platserna i huvudet i stället för att minnas dem en och en.",
    },
    {
      title: "Tio år och uppåt, på svår",
      body: "6 föremål och bara 1,5 sekunder per föremål. Ett riktigt test av korttidsminnet.",
    },
  ],

  accessibility:
    "Varje föremål har en egen form och färg, så positionerna går att komma ihåg genom mer än bara en visuell signal. Allt görs med tryck, ingenting kräver att du drar. Ett fel pekat svar straffas bara med en liten studs.",

  together: [
    {
      title: "Titta tillsammans, peka i tur och ordning",
      body: "Studera föremålen tillsammans under tittfönstret, men låt bara en person peka per runda. Jämför sedan vem som mindes bäst.",
    },
    {
      title: "Säg platserna högt tillsammans",
      body: "Under tittfönstret, säg varje plats högt i kör. Att höra det upprepat gör minnet starkare för båda.",
    },
    {
      title: "Jämför hur långt ni kommer",
      body: "Spela var för sig och se vem som klarar flest nivåer. Rekordet sparas per svårighet.",
    },
  ],

  faq: [
    {
      q: "Hur länge visas föremålen?",
      a: "7, 8 eller 9 sekunder beroende på nivå, vilket ger olika mycket tid per föremål: 2,33 sekunder på lätt ned till 1,5 på svår.",
    },
    {
      q: "Finns det ett minimum av tid?",
      a: "Ja. Ingen nivå går under 1,5 sekunder per föremål eller under 5 sekunder totalt, oavsett hur svår den blir.",
    },
    {
      q: "Hur stor chans har en ren gissning?",
      a: "33,3 procent på lätt nivå, 25 på medel och 16,7 på svår.",
    },
    {
      q: "Kostar ett fel svar något?",
      a: "Nästan ingenting. Platsen studsar till och du får försöka igen.",
    },
    {
      q: "Vad mäter rekordet?",
      a: "Antal nivåer klarade, och mer är bättre. Rekordet sparas per svårighet.",
    },
    {
      q: "Kostar det något?",
      a: "Nej. Gratis, utan konto och utan annonser, och det fungerar offline när sidan har laddat en gång.",
    },
  ],

  keywords: ["minne", "försvinn", "koncentration", "barn", "logik", "gratis"],
};
