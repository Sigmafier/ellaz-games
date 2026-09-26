import type { GameCopy } from "../../types";

/** Svenska, från `node scripts/brief.mjs sv reaction`. Siffrorna kommer ur
 *  `scripts/sim/reaction-wait.mjs` och spelets `logic.ts`. */
export const reactionSv: GameCopy = {
  name: "Reaktionstest",
  metaTitle: "Reaktionstest - tryck så fort skärmen blir grön | Ellaz",
  metaDescription:
    "Vänta, och tryck så fort skärmen byter färg. Tre nivåer med olika väntetider och omöjligt att gissa sig till. Gratis, utan konto, för alla åldrar.",

  lede: "Skärmen väntar, sedan byter den färg utan förvarning. Tryck så fort det händer, inte en sekund tidigare.",

  body: [
    "Väntetiden är slumpad. Bandet växer med svårigheten: 1000-2600 millisekunder på lätt, 1100-3800 på medel, 1200-5000 på svår. Från lätt till svår växer den genomsnittliga väntan 1,72 gånger, men bredden på bandet växer 2,38 gånger, vilket är den verkliga svårigheten: inte bara längre väntan, utan mycket svårare att förutse när den tar slut.",
    "Att gissa lönar sig aldrig. Aldrig ens nära.",
    "Den bästa fasta gissningen någon kunde hitta missar med 400 millisekunder på lätt nivå, 675 på medel och hela 951 på svår, vilket är nästan en hel sekund fel. Ett tryck för tidigt räknas som ett fel oavsett hur nära det var, så det enda som lönar sig är att faktiskt vänta på färgen.",
    "Beröm kommer i tre nivåer: under 350 millisekunder, under 550 och under 900, med ingen bedömning alls för den som är långsammare än det. Det betyder att spelet aldrig säger att du var dålig, bara att det finns rum för mer beröm nästa gång.",
  ],

  howToPlay: [
    {
      title: "Vänta",
      body: "Skärmen visar en väntande färg först. Ingenting att trycka på ännu.",
    },
    {
      title: "Titta efter bytet",
      body: "Färgen byter plötsligt, utan varning och vid en slumpad tidpunkt varje gång.",
    },
    {
      title: "Tryck direkt",
      body: "Ett tryck efter bytet mäter din reaktionstid i millisekunder. Ett tryck för tidigt räknas som ett fel.",
    },
    {
      title: "Se din bästa tid",
      body: "Rekordet är den snabbaste reaktionen uppmätt, och mindre är bättre.",
    },
  ],

  tips: [
    {
      title: "Sluta gissa tidpunkten",
      body: "Även den bästa fasta gissningen missar med hundratals millisekunder. Att faktiskt vänta på bytet är alltid snabbare i slutändan.",
    },
    {
      title: "Håll fingret redo men still",
      body: "Ett tryck för tidigt räknas som fel, oavsett hur nära rätt tidpunkt det var. Bättre att vänta en bråkdel för länge än att chansa.",
    },
    {
      title: "Öva på svår nivå för bredare spridning",
      body: "Väntebandet där är 2,38 gånger bredare än på lätt nivå, vilket tvingar fram riktig väntan snarare än rytm.",
    },
  ],

  teaches: [
    {
      title: "Ren reaktionstid",
      body: "Ingenting annat än hur fort du svarar på ett synligt byte mäts här, utan gissning inblandad.",
    },
    {
      title: "Att motstå ett mönster som inte finns",
      body: "Hjärnan letar efter rytm även där det inte finns någon. Att lära sig vänta genuint är svårare än det låter.",
    },
    {
      title: "Att acceptera ett fel utan press",
      body: "Ett för tidigt tryck straffas inte hårt, bara noteras. Det gör det tryggt att prova om och om igen.",
    },
  ],

  ages: [
    {
      title: "Fem år, på lätt",
      body: "Kortast väntetid och smalast band, 1000 till 2600 millisekunder. Lätt att förstå: vänta, sedan tryck.",
    },
    {
      title: "Åtta år, på medel",
      body: "Ett bredare band gör tidpunkten svårare att förutse. Ungefär där gissning slutar löna sig alls.",
    },
    {
      title: "Vuxen, på svår",
      body: "Upp till fem sekunders väntan och ett band 2,38 gånger bredare än på lätt nivå. Ett riktigt test av tålamod och reflex.",
    },
  ],

  accessibility:
    "Färgbytet är stort och täcker hela skärmen, så det syns tydligt oavsett synförmåga. Allt görs med ett enda tryck, ingenting kräver att du drar eller håller inne. Det finns ingen tidsgräns förutom den som mäts.",

  together: [
    {
      title: "Tävla i tur och ordning",
      body: "Spela samma nivå i tur och ordning och jämför reaktionstiderna direkt efteråt.",
    },
    {
      title: "Gissa varandras tid",
      body: "Innan ett försök, gissa hur snabb det blir. Sedan jämför gissningen med den verkliga tiden.",
    },
    {
      title: "Byt nivå tillsammans",
      body: "Prova alla tre nivåerna i följd och prata om hur väntan känns olika på var och en.",
    },
  ],

  faq: [
    {
      q: "Kan jag gissa mig till en bra tid?",
      a: "Nej. Den bästa fasta gissningen missar med upp till nästan en sekund. Att faktiskt vänta på bytet är alltid bättre.",
    },
    {
      q: "Vad händer om jag trycker för tidigt?",
      a: "Det räknas som ett fel, oavsett hur nära rätt tidpunkt det var.",
    },
    {
      q: "Hur lång är väntetiden?",
      a: "Slumpad inom ett band som växer med nivån: 1000 till 2600 millisekunder på lätt, upp till 1200 till 5000 på svår.",
    },
    {
      q: "Finns det beröm för en snabb tid?",
      a: "Ja, i tre steg: under 350, under 550 och under 900 millisekunder. Långsammare tider får ingen särskild bedömning.",
    },
    {
      q: "Vad mäter rekordet?",
      a: "Den snabbaste reaktionstiden i millisekunder, och mindre är bättre.",
    },
    {
      q: "Kostar det något?",
      a: "Nej. Gratis, utan konto och utan annonser, och det fungerar offline när sidan har laddat en gång.",
    },
  ],

  keywords: ["reaktionstest", "snabbhet", "reflex", "barn", "trycka", "gratis"],
};
