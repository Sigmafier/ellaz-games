import type { GameCopy } from "../../types";

/** Svenska, från `node scripts/brief.mjs sv finddiff`. Scenerna kommer ur
 *  `src/games/finddiff/scenes.ts`. Inget här är översatt. */
export const finddiffSv: GameCopy = {
  name: "Hitta skillnaderna",
  metaTitle: "Hitta skillnaderna - gratis för barn | Ellaz",
  metaDescription:
    "Två bilder som nästan är lika. Hitta de 5 skillnaderna i varje scen, 6 scener och 30 skillnader totalt. Gratis i webbläsaren.",

  lede: "Två bilder bredvid varandra, nästan likadana. Hitta de 5 sakerna som skiljer dem åt, och gå vidare till nästa scen.",

  body: [
    "Två bilder ligger bredvid varandra på en dator och ovanför varandra på en telefon, och de är nästan identiska. Någonstans har en sak bytt färg, försvunnit eller flyttat sig. Du trycker på den i vilken av bilderna som helst, och hittar du rätt ringas den in i båda. Fem sådana finns i varje scen. Det finns ingen klocka och inget straff för att trycka fel, så ett barn kan leta så länge det vill.",
    "Sex scener finns. Det blir 30 skillnader.",
    "När alla sex är avklarade börjar de om med nya skillnader utplacerade. Det som räknas som rekord är hur många scener du har klarat sammanlagt, inte det nivånummer som står på skärmen. Skillnaden är värd att känna till: nivån stiger bara efter ett helt varv genom alla sex, så den hade gett de flesta spelare ett permanent rekord på 1. Antalet klarade scener rör sig varje gång du klarar en, vilket är vad ett rekord ska göra.",
    "Bilderna är ritade för hand i vektor och är våra egna. Det är också den ärliga begränsningen: sex scener är inte många, och ett barn som spelar länge kommer att känna igen dem. Skillnaderna placeras om, så svaren går inte att lära sig utantill. Men motiven är desamma.",
  ],

  howToPlay: [
    {
      title: "Titta på båda bilderna",
      body: "De ligger bredvid varandra eller över varandra beroende på skärmen. De är lika stora, så en sak som har flyttat sig syns som ett litet glapp mellan dem.",
    },
    {
      title: "Tryck där något skiljer sig",
      body: "Ett tryck räcker, och det spelar ingen roll vilken av de två bilderna du trycker i. Hittar du rätt markeras stället i båda.",
    },
    {
      title: "Hitta alla 5",
      body: "Räknaren visar hur många som är kvar. När den sista är hittad går spelet vidare till nästa scen av sig självt.",
    },
    {
      title: "Ett fel tryck kostar ingenting",
      body: "Bilden reagerar och sedan väntar den igen. Det finns inget liv att förlora och ingen tid som rinner ut.",
    },
  ],

  tips: [
    {
      title: "Svep med blicken i en riktning",
      body: "Uppifrån och ner, eller vänster till höger. Att hoppa fram och tillbaka mellan bilderna gör att samma hörn granskas fem gånger och ett annat aldrig.",
    },
    {
      title: "Leta efter färg först, form sedan",
      body: "En sak som har bytt färg hittas snabbast, och när den är borta blir bilden lugnare att läsa. Sakerna som har flyttat sig är alltid de sista som syns.",
    },
    {
      title: "Titta på kanterna",
      body: "Ögat dras till mitten av en bild. Skillnader nära ramen står kvar längst, av precis den anledningen.",
    },
  ],

  teaches: [
    {
      title: "Att jämföra två saker systematiskt",
      body: "Att hitta 5 skillnader kräver en metod så fort de tre lättaste är hittade. Barn som spelar en stund börjar av sig själva svepa i en ordning i stället för att leta på måfå.",
    },
    {
      title: "Uthållighet utan press",
      body: "Ingen klocka och inget straff betyder att den sista skillnaden kan ta hur lång tid som helst. Att stanna kvar i en uppgift som inte ger efter direkt är övningen.",
    },
    {
      title: "Att se detaljer",
      body: "Ögat lär sig vad som är värt att titta på. Det märks snabbast på scenerna med många små saker i.",
    },
  ],

  ages: [
    {
      title: "Tre år, tillsammans med någon",
      body: "Ett litet barn hittar ofta två eller tre av fem och behöver hjälp med resten. Eftersom ingenting går förlorat är det en bra ålder att sitta bredvid.",
    },
    {
      title: "Fem år, på egen hand",
      body: "Vid den åldern klaras en hel scen utan hjälp, och det är då räknaren i hörnet börjar betyda något.",
    },
    {
      title: "Sju år och uppåt",
      body: "Äldre barn jagar antalet klarade scener och vill göra ett helt varv genom alla 6. Det är också den åldern som märker att skillnaderna har flyttat sig.",
    },
  ],

  accessibility:
    "Hela spelet går på tryck, och träffytorna är stora nog för en liten hand eller en grov pekare. Ingenting kräver att du drar, och det finns ingen klocka, så ingen tid går förlorad för den som behöver längre på sig. Skillnaderna är aldrig enbart en färgnyans utan alltid också en form eller en plats, vilket betyder att spelet går att klara av den som ser färg annorlunda.",

  together: [
    {
      title: "En scen var",
      body: "Turas om att klara en hel scen. Den som tittar får inte peka, vilket är svårare än det låter och är ungefär hälften av nöjet.",
    },
    {
      title: "Dela upp bilden",
      body: "En tar överdelen och en tar underdelen. Det går fortare och lär samtidigt ut precis den metod som gör spelet lättare ensam.",
    },
    {
      title: "Säg var, inte vad",
      body: "Den som har hittat något får bara säga uppe till vänster och inte vad det är. Det gör ledtråden till en övning i sig.",
    },
  ],

  faq: [
    {
      q: "Hur många skillnader finns det?",
      a: "Fem i varje scen. Det finns 6 scener, alltså 30 skillnader innan varvet börjar om.",
    },
    {
      q: "Vad händer när scenerna tar slut?",
      a: "De börjar om med skillnaderna utplacerade på nya ställen, så svaren går inte att lära sig utantill.",
    },
    {
      q: "Finns det någon tidsgräns?",
      a: "Nej. Inget räknar ner, och ett fel tryck kostar ingenting alls.",
    },
    {
      q: "Vad räknas som rekord?",
      a: "Antalet scener du har klarat sammanlagt, inte numret som står på skärmen. Numret stiger bara efter ett helt varv.",
    },
    {
      q: "Behöver mitt barn kunna läsa?",
      a: "Nej. Det finns inga ord inne i spelet, bara bilder och en räknare.",
    },
    {
      q: "Kostar det något?",
      a: "Nej. Gratis, utan konto, utan annonser, och det fungerar offline när sidan har laddat en gång.",
    },
  ],

  keywords: ["hitta skillnaderna", "bilder", "detaljer", "barn", "observation", "lugnt"],
};
