import type { GameCopy } from "../../types";

/** Svenska, från `node scripts/brief.mjs sv bubbles`. Siffrorna kommer ur
 *  `scripts/sim/spawn-ladder.mjs`, `logic.test.ts` och spelets egen `logic.ts`. */
export const bubblesSv: GameCopy = {
  name: "Bokstavsbubblor",
  metaTitle: "Bokstavsbubblor - fånga rätt bokstav eller siffra | Ellaz",
  metaDescription:
    "Bubblor med bokstäver och siffror stiger uppåt. Fånga den som frågas efter innan bubblan hinner försvinna. Tre nivåer, för barn. Gratis och utan konto.",

  lede: "En bokstav eller siffra frågas efter, och bubblor med olika tecken stiger uppåt. Fånga den som är rätt innan den försvinner.",

  body: [
    "Poolen är tio siffror plus tjugotvå hebreiska grundbokstäver eller tjugosex engelska versaler, beroende på vilket språk sidan är inställd på. Slutformerna räknas inte. Det är samma bokstav i ett annat läge, och den skulle förvirra mer än den hjälper.",
    "Ingen förvillande bubbla på lätt.",
    "En bubbla stannar 4,2 sekunder på lätt nivå och 2,4 på svår. Den lätta nivån är byggd för att aldrig lura: över 120 rundor testade per språk dök det upp exakt noll bubblor som liknar rätt svar men inte är det. Svårare nivåer tillåter sådana nästan-lika bubblor, vilket är precis vad som gör dem svårare.",
    "Fyra, fem eller sex rätta fångster. Så mycket krävs.",
    "Den ärliga begränsningen gäller det svenska alfabetet. Å, Ä och Ö ingår i den svenska poolen som egna bokstäver, men eftersom den siffran ännu inte har körts genom samma mätning som engelska och hebreiska vet vi inte om de tre extra bokstäverna gör svenska bubblor märkbart svårare att hinna med.",
  ],

  howToPlay: [
    {
      title: "Läs eller lyssna på frågan",
      body: "En bokstav eller siffra visas eller sägs högt. Det är den du letar efter bland bubblorna.",
    },
    {
      title: "Tryck på rätt bubbla",
      body: "Bubblor med olika tecken stiger uppåt. Ett tryck på rätt tecken fångar den, resten kan lämnas.",
    },
    {
      title: "Var snabb men inte stressad",
      body: "En bubbla stannar några sekunder innan den försvinner, men en ny kommer alltid strax efter.",
    },
    {
      title: "Klara rundans mål",
      body: "Fyra, fem eller sex rätta fångster beroende på nivå. Rekordet räknar hur många rundor du klarat.",
    },
  ],

  tips: [
    {
      title: "Säg tecknet högt innan du trycker",
      body: "Att uttala bokstaven eller siffran innan fingret rör sig kopplar ljudet till formen på ett sätt som bara titta inte gör.",
    },
    {
      title: "Börja på lätt nivå",
      body: "Där dyker aldrig en förvillande nästan-lik bubbla upp. Det är ett tryggt ställe att lära sig formerna innan svårare nivåer testar dem.",
    },
    {
      title: "Missa hellre än att tveka",
      body: "Ett fel tryck kostar nästan ingenting, så det lönar sig att chansa snabbt snarare än att vänta för säkert.",
    },
  ],

  teaches: [
    {
      title: "Bokstavs- och sifferformer",
      body: "Att känna igen ett tecken bland flera liknande är precis den färdighet som föregår att kunna läsa och räkna själv.",
    },
    {
      title: "Att koppla ljud till tecken",
      body: "Frågan kan läsas upp högt, och att hitta rätt bubbla efter ljudet ensamt är ett steg mot verklig läsning.",
    },
    {
      title: "Snabb visuell sökning",
      body: "Att hitta ett tecken bland flera rörliga bubblor tränar samma förmåga som att hitta en vän i en folkmassa.",
    },
  ],

  ages: [
    {
      title: "Tre år, med siffror",
      body: "Tio siffror är en mindre och enklare pool än hela alfabetet, ett bra ställe att börja på.",
    },
    {
      title: "Fem år, med bokstäver på lätt",
      body: "Aldrig en förvillande bubbla, och 4,2 sekunder att hinna trycka. Gott om tid att lära sig formerna i lugn takt.",
    },
    {
      title: "Sju år, på svår",
      body: "2,4 sekunder och riktiga nästan-lika bubblor att skilja från rätt svar. En verklig utmaning för den som redan känner alfabetet.",
    },
  ],

  accessibility:
    "Frågan kan läsas upp högt av en talsyntes, men den står alltid skriven på skärmen också, så ingenting hänger på att ett ljud hörs. Allt görs med tryck, ingenting kräver att du drar. Ett fel tryck kostar bara en liten studs, aldrig ett poängtapp.",

  together: [
    {
      title: "Säg tecknet tillsammans",
      body: "Läs upp bokstaven eller siffran högt innan barnet trycker. Att höra den sagd är en annan sak än att bara se den.",
    },
    {
      title: "Byt roller",
      body: "Låt barnet peka ut rätt bubbla medan en vuxen trycker. Att instruera är en annan övning än att själv utföra.",
    },
    {
      title: "Räkna fångsterna tillsammans",
      body: "Håll räkning på rätta fångster högt under rundan. Det gör målet konkret och slutet tydligt.",
    },
  ],

  faq: [
    {
      q: "Vad ingår i poolen?",
      a: "Tio siffror plus tjugotvå hebreiska grundbokstäver eller tjugosex engelska versaler, beroende på språk. Hebreiska slutformer räknas inte som egna tecken.",
    },
    {
      q: "Finns det förvillande bubblor?",
      a: "Inte på den lätta nivån. Över 120 testade rundor per språk dök aldrig en nästan-lik bubbla upp där. Svårare nivåer tillåter dem.",
    },
    {
      q: "Hur länge stannar en bubbla?",
      a: "4,2 sekunder på lätt nivå och 2,4 på svår.",
    },
    {
      q: "Räknas Å, Ä och Ö som egna bokstäver på svenska?",
      a: "Ja, de ingår i den svenska poolen som egna tecken, precis som i det svenska alfabetet.",
    },
    {
      q: "Vad krävs för att klara en nivå?",
      a: "Fyra, fem eller sex rätta fångster beroende på svårighet.",
    },
    {
      q: "Kostar det något?",
      a: "Nej. Gratis, utan konto och utan annonser, och det fungerar offline när sidan har laddat en gång.",
    },
  ],

  keywords: ["bubblor", "bokstäver", "siffror", "barn", "läsa", "gratis"],
};
