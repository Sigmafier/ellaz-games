import type { GameCopy } from "../../types";

/** Svenska, från `node scripts/brief.mjs sv sequence`. Siffrorna kommer ur
 *  `scripts/sim/thinking-levels.mjs`. Inget här är översatt. */
export const sequenceSv: GameCopy = {
  name: "Mönsterföljd",
  metaTitle: "Mönsterföljd - vad kommer härnäst i färgraden? | Ellaz",
  metaDescription:
    "En rad färger visas, och du väljer vad som kommer härnäst. Åtta mönsterfamiljer, tre nivåer. Gratis i webbläsaren, för barn och vuxna.",

  lede: "En rad med färger visas i tur och ordning. Titta på mönstret och tryck på färgen du tror kommer härnäst.",

  body: [
    "Åtta mönsterfamiljer totalt. Varje nivå använder tre av dem. Den lätta nivån håller sig till korta cykler, ett upprepande mönster om 2 eller 3 färger, medan den svåra nivån innehåller två familjer som inte upprepar sig alls, utan bygger på en annan sorts regel helt och hållet. Det är en riktig klyfta mellan nivåerna, inte bara en gradvis ökning: att gå från en cykel till ingen cykel alls är att byta strategi helt.",
    "Sex färger. Bara sex.",
    "En ren gissning har därför 16,7 procents chans att råka bli rätt, lågt nog att en riktig gissning sticker ut tydligt från ett resonemang som faktiskt följer mönstret. Det är precis den marginalen som gör spelet mätbart: den som klarar sig bättre än en sjättedel av gångerna har verkligen sett något, inte bara haft tur.",
    "Den ärliga begränsningen är att de svåraste mönsterfamiljerna, de utan cykel, kräver att man håller flera regler i huvudet samtidigt snarare än att bara känna igen en upprepning. Det är ett stort steg upp från de lättare nivåerna, och det är avsiktligt: spelet ska bli genuint svårare, inte bara snabbare. En spelare som klarat sig fint på cykler kan möta den övergången som en helt ny uppgift.",
  ],

  howToPlay: [
    {
      title: "Titta på färgraden",
      body: "En rad färger visas i ordning, en i taget eller alla samtidigt beroende på var i spelet du är.",
    },
    {
      title: "Hitta mönstret",
      body: "Färgerna följer en regel, ibland en upprepning och ibland något mer komplicerat.",
    },
    {
      title: "Tryck på nästa färg",
      body: "Välj den färg du tror kommer härnäst av de sex i paletten.",
    },
    {
      title: "Klättra genom nivåerna",
      body: "Rätt svar för dig vidare i mönstret. Rekordet räknar hur många nivåer du klarat.",
    },
  ],

  tips: [
    {
      title: "Leta efter en upprepning först",
      body: "De flesta mönster på de lättare nivåerna är korta cykler om 2 eller 3 färger. Kolla det innan du letar efter något krångligare.",
    },
    {
      title: "Skriv ned mönstret om det hjälper",
      body: "Att säga färgerna högt i ordning, eller räkna dem på fingrarna, gör en lång rad lättare att hålla i huvudet.",
    },
    {
      title: "På svår nivå, leta efter en annan sorts regel",
      body: "Två av mönsterfamiljerna där upprepar sig aldrig, så en ren cykel-jakt kommer inte att fungera på dem.",
    },
  ],

  teaches: [
    {
      title: "Att känna igen ett mönster",
      body: "Att se en regel i en följd av färger är grunden för mycket matematiskt tänkande, mätt i ett enkelt och roligt format.",
    },
    {
      title: "Att hålla flera möjligheter i huvudet",
      body: "De svåraste mönstren kräver att man provar mer än en teori samtidigt innan man är säker.",
    },
    {
      title: "Att skilja en gissning från ett resonemang",
      body: "Med sex färger att välja mellan är en ren gissning sällan rätt. Spelet belönar den som faktiskt tänkt efter.",
    },
  ],

  ages: [
    {
      title: "Fyra år, på lätt",
      body: "Korta cykler om 2 eller 3 färger. Ett bra första möte med att förutsäga vad som kommer härnäst.",
    },
    {
      title: "Sju år, på medel",
      body: "Längre och mer varierade mönster. Ungefär där ett barn börjar hålla flera steg i huvudet samtidigt.",
    },
    {
      title: "Tio år och uppåt, på svår",
      body: "Mönster utan cykel som kräver ett annat sätt att tänka. En riktig utmaning för den som redan klarar de lättare nivåerna.",
    },
  ],

  accessibility:
    "Varje färg bär en egen form utöver sin nyans, så mönstret går att följa utan att förlita sig på färg ensam. Allt görs med tryck, ingenting kräver att du drar. Det finns ingen tidsgräns, och ett fel svar straffas bara med en liten studs.",

  together: [
    {
      title: "En läser mönstret högt, en trycker",
      body: "Den ena säger färgerna i ordning medan den andra lyssnar och trycker. Att höra mönstret är en annan sak än att bara se det.",
    },
    {
      title: "Gissa mönstrets regel tillsammans",
      body: "Prata om vad ni tror styr färgerna innan ni trycker. Att sätta ord på en regel gör den tydligare.",
    },
    {
      title: "Jämför hur långt ni kommer",
      body: "Spela var för sig och se vem som klarar flest nivåer. Rekordet sparas per svårighet.",
    },
  ],

  faq: [
    {
      q: "Hur många mönsterfamiljer finns det?",
      a: "Åtta totalt, och varje nivå använder tre av dem.",
    },
    {
      q: "Är alla mönster upprepande?",
      a: "Nej. På svår nivå finns två familjer som inte cyklar alls, utan följer en annan sorts regel.",
    },
    {
      q: "Hur stor chans har en ren gissning?",
      a: "16,7 procent, eftersom paletten har sex färger.",
    },
    {
      q: "Kostar ett fel svar något?",
      a: "Nästan ingenting. Färgen studsar till och du får försöka igen.",
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

  keywords: ["mönster", "följd", "färger", "logik", "barn", "gratis"],
};
