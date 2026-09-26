import type { GameCopy } from "../../types";

/** Svenska, från `node scripts/brief.mjs sv untangle`. Siffrorna kommer ur
 *  `scripts/sim/untangle-graphs.mjs`. Inget här är översatt. */
export const untangleSv: GameCopy = {
  name: "Reda ut",
  metaTitle: "Reda ut - dra prickarna fria från korsande linjer | Ellaz",
  metaDescription:
    "Dra prickarna tills ingen linje längre korsar en annan. Två storlekar, upp till 21 linjer och nästan femtio korsningar att reda ut. Gratis och utan konto.",

  lede: "Prickar förbundna av raka linjer, utkastade i en hög på varandra. Dra prickarna tills ingen linje längre korsar en annan.",

  body: [
    "Två storlekar. Den lilla har 6 prickar och 9 linjer, den stora har 12 prickar och 21 linjer. Andelen prickpar som faktiskt är förbundna av en linje är 60 procent på den lilla och bara 31,8 procent på den stora, vilket betyder att den stora grafen är glesare men har fler linjer totalt, och det är den kombinationen som gör den svår.",
    "Ett utdelat bräde börjar i genomsnitt med 5,7 korsningar på den lilla storleken och 49,6 på den stora, med värsta uppmätta utdelning på 88. Det är inte en spridning i svårighet mellan omgångar, det är helt enkelt hur många linjer som hinner korsa varandra när tolv prickar kastas ut slumpmässigt över samma yta.",
    "En lösning ligger oftast nära. Väldigt nära.",
    "I 90,7 procent av korsningarna på den lilla grafen räcker det att flytta EN prick för att reda ut den specifika korsningen, vilket betyder att lösningen oftast finns närmare än den ser ut. På den stora grafen rör sig 11 av 12 prickar under en lösning, mot 4 av 6 på den lilla, så nästan ingenting får stå kvar där det landade.",
    "Vi lät en bot som bara flyttar en prick om det minskar antalet korsningar spela 3 000 bräden per storlek. Den löste 53,2 procent av de små bräderna helt och bara 4,8 procent av de stora. Det är den ärliga begränsningen: en strategi som bara går framåt, aldrig bakåt för att pröva något annat, räcker sällan på det stora brädet. Ibland måste en prick flyttas till en sämre plats för att öppna en bättre lösning längre fram.",
  ],

  howToPlay: [
    {
      title: "Dra en pricka",
      body: "Sätt fingret på en pricka och flytta den. Linjerna som går till den följer med.",
    },
    {
      title: "Titta efter korsningar",
      body: "En linje som korsar en annan är röd eller markerad. Målet är att inga två linjer ska korsa varandra alls.",
    },
    {
      title: "Flytta det som stör mest",
      body: "En pricka med flera korsande linjer ger mest utdelning för varje drag. Börja där grafen ser tätast ut.",
    },
    {
      title: "Byt storlek i raden ovanför",
      body: "Två storlekar med var sitt rekord. Tiden på den lilla grafen och tiden på den stora mäter olika saker.",
    },
  ],

  tips: [
    {
      title: "Flytta ut mot kanten",
      body: "En pricka nära mitten av grafen har oftast fler linjer i vägen. Att dra den mot en tom del av skärmen brukar lösa flera korsningar på en gång.",
    },
    {
      title: "Lös en korsning i taget",
      body: "Att jaga hela grafens form på en gång är svårare än att bara reda ut den enskilda korsning som stör mest just nu.",
    },
    {
      title: "Var beredd att flytta tillbaka",
      body: "Ibland gör ett drag saken värre innan den blir bättre. Det är inte ett misstag, det är hur pusslet löses på den stora grafen.",
    },
  ],

  teaches: [
    {
      title: "Att se en graf bakom linjerna",
      body: "Samma förbindelser, oändligt många möjliga former. Att förstå att formen inte är fakta utan bara en presentation är hela poängen med spelet.",
    },
    {
      title: "Att backa från ett dåligt drag",
      body: "En girig strategi som bara går framåt löste bara 4,8 procent av de stora bräderna. Att pröva och ångra är en riktig färdighet.",
    },
    {
      title: "Rumslig planering",
      body: "Att se vilken av tolv prickar som är värd att flytta först kräver att hålla hela brädet i huvudet samtidigt.",
    },
  ],

  ages: [
    {
      title: "Åtta år, på den lilla grafen",
      body: "6 prickar och 5,7 korsningar i snitt. I 90,7 procent av fallen räcker det att flytta en enda pricka rätt.",
    },
    {
      title: "Tolv år och uppåt, på den stora",
      body: "12 prickar, 21 linjer och nästan 50 korsningar att börja med. 11 av 12 prickar rör sig innan brädet är löst.",
    },
    {
      title: "Vuxen, mot rekordet",
      body: "Tiden är måttet, och mindre är bättre. Den stora grafen är svår nog att ett bra rekord känns förtjänat.",
    },
  ],

  accessibility:
    "En korsande linje visas med både färg och mönster, så färgen aldrig är ensam bärare av informationen. Varje pricka går att flytta med tangentbord, ett steg åt gången, och läses upp av en skärmläsare. Det finns ingen tidsgräns, och en pricka kan flyttas hur många gånger som helst.",

  together: [
    {
      title: "Peka ut korsningen",
      body: "En pekar på den linje som stör mest, den andra flyttar prickan. Att förklara vad man ser är halva övningen.",
    },
    {
      title: "Räkna korsningarna tillsammans",
      body: "Räkna hur många som är kvar efter varje drag. Att se talet sjunka är sin egen belöning.",
    },
    {
      title: "Tävla om tiden",
      body: "Samma storlek, två enheter, och en jämförelse efteråt. Rekordet sparas per storlek på varje enhet.",
    },
  ],

  faq: [
    {
      q: "Vad är målet?",
      a: "Att flytta prickarna tills ingen linje längre korsar en annan. Formen får se ut hur som helst, bara inget korsar.",
    },
    {
      q: "Hur många korsningar börjar ett bräde med?",
      a: "I snitt 5,7 på den lilla grafen och 49,6 på den stora, med en värsta uppmätt utdelning på 88 korsningar.",
    },
    {
      q: "Räcker det att flytta en enda pricka?",
      a: "Ofta, på den lilla grafen: 90,7 procent av korsningarna löses av att en enda pricka flyttas rätt. Den stora kräver att nästan alla rör sig.",
    },
    {
      q: "Vilka storlekar finns?",
      a: "6 prickar med 9 linjer, och 12 prickar med 21 linjer.",
    },
    {
      q: "Vad mäter rekordet?",
      a: "Tiden det tog att lösa brädet, och mindre är bättre. Det sparas per storlek på enheten själv.",
    },
    {
      q: "Kostar det något?",
      a: "Nej. Gratis, utan konto och utan annonser, och det fungerar offline när sidan har laddat en gång.",
    },
  ],

  keywords: ["reda ut", "graf", "prickar", "logik", "pussel", "gratis"],
};
