import type { GameCopy } from "../../types";

/** Svenska, från `node scripts/brief.mjs sv frog`. Siffrorna kommer ur
 *  `scripts/sim/spawn-ladder.mjs` och spelets `logic.ts`. */
export const frogSv: GameCopy = {
  name: "Grodhopp",
  metaTitle: "Grodhopp - tryck där grodan ska hoppa | Ellaz",
  metaDescription:
    "En groda sitter på näckrosblad, och du trycker på det blad den ska hoppa till näst. Tre nivåer, ingen bestraffning för fel. Gratis och utan konto.",

  lede: "En groda sitter på ett näckrosblad bland flera. Tryck på det bladet den ska hoppa till näst, och håll takten uppe.",

  body: [
    "Fyra till sex blad. En runda kräver 6, 8 eller 10 lyckade hopp. Grodan hoppar aldrig till bladet den redan sitter på, så varje tryck är ett riktigt val mellan flera alternativ, inte bara en gissning på om något ska hända.",
    "Tiden krymper. Hela tiden.",
    "Det första hoppet på lätt nivå ger 2,94 sekunder att bestämma sig, det sista hoppet i samma runda bara 2,49. Ett golv på 1,74 sekunder nås först efter fjorton hopp, och bara den svåra nivån hinner ner till sitt eget golv inom en och samma runda, vid det åttonde av tio hopp. De två lättare nivåerna slutar alltså innan tempot riktigt hinner pressa spelaren.",
    "Den ärliga begränsningen är att spelet mäter reaktion snarare än planering. Det finns inget att räkna ut i förväg, bara att se bladet och trycka innan tiden tar slut, vilket gör det till ett rent reflexspel snarare än ett tankespel.",
  ],

  howToPlay: [
    {
      title: "Titta på grodan",
      body: "Grodan sitter på ett av näckrosbladen. Ett nytt blad lyser upp som mål efter varje lyckat hopp.",
    },
    {
      title: "Tryck på rätt blad",
      body: "Ett tryck på det upplysta bladet flyttar grodan dit. Grodan hoppar aldrig till bladet den redan sitter på.",
    },
    {
      title: "Var snabb men lugn",
      body: "Tiden att bestämma sig krymper med varje hopp, men aldrig under ett golv som varierar per nivå.",
    },
    {
      title: "Klara rundans mål",
      body: "6, 8 eller 10 hopp beroende på nivå. Rekordet räknar hur många rundor du klarat.",
    },
  ],

  tips: [
    {
      title: "Håll blicken på hela brädet",
      body: "Att redan veta var alla blad ligger innan nästa mål lyser upp sparar en halv sekund varje gång.",
    },
    {
      title: "Räkna inte med att tiden ska ta slut",
      body: "Golvet nås bara på svår nivå, och först vid det åttonde av tio hopp. De andra två nivåerna hinner aldrig dit.",
    },
    {
      title: "Missa hellre än att stå still",
      body: "Ett fel tryck kostar nästan ingenting. Det lönar sig alltid att chansa snabbt framför att vänta för säkert.",
    },
  ],

  teaches: [
    {
      title: "Snabb visuell reaktion",
      body: "Att se ett upplyst blad och trycka innan tiden tar slut är precis den reflex spelet tränar, om och om igen.",
    },
    {
      title: "Att hantera stigande tempo",
      body: "Tiden att bestämma sig krymper genom en runda, och att hålla fokus trots det är en egen färdighet.",
    },
    {
      title: "Att inte skrämmas av ett missat hopp",
      body: "Ett fel tryck syns knappt och kostar ingenting. Det gör spelet till en trygg plats att öva reaktion utan rädsla.",
    },
  ],

  ages: [
    {
      title: "Tre år, på lätt",
      body: "Fyra blad, 6 hopp per runda och 2,94 sekunder på det första. Gott om tid att titta och trycka i lugn takt.",
    },
    {
      title: "Sex år, på medel",
      body: "Fler blad och kortare tid mellan hoppen. Ungefär där reaktionshastigheten börjar avgöra resultatet.",
    },
    {
      title: "Nio år och uppåt, på svår",
      body: "Sex blad, 10 hopp, och ett golv på 1,74 sekunder som faktiskt nås under rundan. En riktig utmaning.",
    },
  ],

  accessibility:
    "Det upplysta bladet visas med både färg och en tydlig glöd, så målet går att se utan att förlita sig på färg ensam. Allt görs med tryck, ingenting kräver att du drar eller håller inne. Ett fel tryck straffas bara med en liten studs.",

  together: [
    {
      title: "En ropar, en trycker",
      body: "Den ena säger till högt vilket blad som lyser, den andra trycker. Att lita på ett rop kräver eget fokus.",
    },
    {
      title: "Turas om per runda",
      body: "En kort runda är lätt att dela. Jämför resultatet efteråt och se vem som höll takten bäst.",
    },
    {
      title: "Räkna hoppen tillsammans",
      body: "Håll koll högt på hur många hopp som är kvar till målet. Det gör väntan tydligare och slutet roligare.",
    },
  ],

  faq: [
    {
      q: "Hoppar grodan någonsin till samma blad?",
      a: "Nej, aldrig till bladet den redan sitter på. Varje tryck är ett val mellan de andra bladen.",
    },
    {
      q: "Blir spelet snabbare med tiden?",
      a: "Ja, tiden att sikta krymper med varje hopp, ner till ett golv som är olika per nivå.",
    },
    {
      q: "Kostar ett fel tryck något?",
      a: "Nästan ingenting. Det syns knappt och stoppar aldrig spelet.",
    },
    {
      q: "Hur många blad finns det?",
      a: "Fyra, fem eller sex beroende på nivå.",
    },
    {
      q: "Vad mäter rekordet?",
      a: "Hur många rundor du klarat, och mer är bättre.",
    },
    {
      q: "Kostar det något?",
      a: "Nej. Gratis, utan konto och utan annonser, och det fungerar offline när sidan har laddat en gång.",
    },
  ],

  keywords: ["groda", "hoppa", "reaktion", "barn", "trycka", "gratis"],
};
