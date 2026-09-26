import type { GameCopy } from "../../types";

/** Svenska, från `node scripts/brief.mjs sv bubbleshooter`. Siffrorna kommer ur
 *  `scripts/sim/bubbleshooter-shots.mjs`, poängen ur spelets `logic.ts`. */
export const bubbleshooterSv: GameCopy = {
  name: "Bubbelskytte",
  metaTitle: "Bubbelskytte - skjut tre av samma färg | Ellaz",
  metaDescription:
    "Sikta och skjut bubblor mot taket. Tre av samma färg försvinner, och lösa bubblor faller. Tre nivåer, gratis i webbläsaren, utan konto.",

  lede: "Sikta med bubblan längst ned och skjut den mot taket. Tre eller fler av samma färg i följd försvinner, och allt som blir löst faller.",

  body: [
    "Tre nivåer som är tre olika bräden. Lätt har 38 bubblor i 4 rader, medel 48 i 5 rader och svår 57 i 6 rader. En ny rad trycks ned var 12:e, 9:e respektive 6:e skott, så en långsam spelare på svår nivå har bara 36 skott innan raden når botten, mot 96 på lätt.",
    "Alla lägen går att nå. Alla utan undantag.",
    "Vi provade 121 vinklar. Inget läge kunde bara nås genom att studsa mot en vägg. Det betyder att varje bubbla som går att fästa också går att träffa rakt fram, även om det ibland tar en bra sikte. På ett spelat bräde behöver mellan 1 och 4 av ungefär 15 nåbara lägen ändå en studs för att vara den bästa vägen dit.",
    "Vi lät en bot som bara skjuter mot närmaste möjliga träff spela vidare. Den överlevde alla 300 skott på lätt och medel nivå utan att förlora, men dog efter i snitt 58 skott på svår. En annan bot som bara sprängde direkt utan att bygga upp något dog redan efter 17 skott på svår, innan den hann lära sig att spara skott för senare.",
    "Ett bra spel skiljer sig verkligen från ett dåligt: av 20 försök på svår nivå klarade boten hela brädet bara 5 gånger, medan samma bot på medel nivå klarade 79 bräden av 20 körningar räknat över flera rundor. Det är den ärliga skillnaden mellan nivåerna, och den är stor.",
  ],

  howToPlay: [
    {
      title: "Sikta med skytten",
      body: "Bubblan längst ned pekar dit du drar eller trycker. Vinkeln avgör var skottet landar.",
    },
    {
      title: "Skjut och fäst",
      body: "Bubblan flyger och fäster mot den första den träffar. Tre eller fler av samma färg i följd försvinner direkt.",
    },
    {
      title: "Lösa bubblor faller",
      body: "En bubbla som inte längre hänger fast i något faller av sig själv och ger extra poäng.",
    },
    {
      title: "Håll koll på raden",
      body: "En ny rad trycks ned med jämna mellanrum. Når den botten är omgången slut.",
    },
  ],

  tips: [
    {
      title: "Bygg innan du spränger",
      body: "En bot som bara sprängde direkt dog efter 17 skott på svår nivå. Att spara en bubbla för ett bättre läge lönar sig nästan alltid.",
    },
    {
      title: "Glöm inte studsen",
      body: "Mellan 1 och 4 av 15 lägen på ett spelat bräde nås bäst med en studs mot väggen. Ett rakt skott är inte alltid det enda alternativet.",
    },
    {
      title: "Räkna raderna på svår nivå",
      body: "En ny rad var sjätte skott är snabbt. Sikta på att rensa färger snarare än att bara skjuta löst.",
    },
  ],

  teaches: [
    {
      title: "Vinklar och studsar",
      body: "Att förutsäga var en studsad bubbla landar är geometri i praktiken, tränad ett skott i taget.",
    },
    {
      title: "Att planera flera drag framåt",
      body: "Ett bra skott bygger upp nästa möjliga drag. Det är samma tänkande som gör en bra spelare bättre än en snabb.",
    },
    {
      title: "Att hantera en press som ökar",
      body: "Raden trycks ned med jämna mellanrum oavsett hur du spelar. Att arbeta metodiskt under press är en egen färdighet.",
    },
  ],

  ages: [
    {
      title: "Sex år, på lätt",
      body: "38 bubblor och 96 skott innan raden når botten. Gott om tid att lära sig sikta utan att stressas.",
    },
    {
      title: "Nio år, på medel",
      body: "48 bubblor och en ny rad var nionde skott. En bra bot klarade 79 bräden av 20 körningar här.",
    },
    {
      title: "Vuxen, på svår",
      body: "57 bubblor och en ny rad var sjätte skott. Bara 5 av 20 försök klarade hela brädet i mätningen.",
    },
  ],

  accessibility:
    "Varje färg är också märkt med en egen form, så bubblorna går att skilja åt utan att se skillnad på färgerna. Siktet styrs med tryck och drag, och en pilväg visas för att göra vinkeln tydlig. Det finns ingen tidsgräns på ett enskilt skott.",

  together: [
    {
      title: "En siktar, en bestämmer färg",
      body: "Den ena säger vilken färggrupp som är närmast klar, den andra siktar dit. Att samarbeta om ett skott är svårare än det låter.",
    },
    {
      title: "Räkna skotten till nästa rad",
      body: "Håll koll högt på hur många skott som är kvar innan en ny rad trycks ned. Det gör pressen synlig och delad.",
    },
    {
      title: "Turas om per bräde",
      body: "Spela samma nivå i tur och ordning och jämför poängen. Rekordet sparas per nivå på enheten.",
    },
  ],

  faq: [
    {
      q: "Hur många bubblor krävs för att de ska försvinna?",
      a: "Tre eller fler av samma färg i en sammanhängande grupp.",
    },
    {
      q: "Kan jag alltid nå ett läge rakt fram?",
      a: "Nästan alltid. Av alla testade lägen krävde inget en studs som enda väg dit, men en studs är ofta den bästa vägen ändå.",
    },
    {
      q: "Hur ofta trycks en ny rad ned?",
      a: "Var 12:e skott på lätt nivå, var 9:e på medel och var 6:e på svår.",
    },
    {
      q: "Hur räknas poängen?",
      a: "10 poäng för en sprängd bubbla och 20 för en som lossnar och faller av sig själv.",
    },
    {
      q: "Vilken nivå är svårast?",
      a: "Svår, tydligt. Bara 5 av 20 försök klarade hela brädet, mot 79 klarade bräden räknat över 20 körningar på medel nivå.",
    },
    {
      q: "Kostar det något?",
      a: "Nej. Gratis, utan konto och utan annonser, och det fungerar offline när sidan har laddat en gång.",
    },
  ],

  keywords: ["bubbelskytte", "bubblor", "sikta", "klassiker", "färger", "gratis"],
};
