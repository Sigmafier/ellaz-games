import type { GameCopy } from "../../types";

/** Svenska, från `node scripts/brief.mjs sv survivors`. Siffrorna kommer ur
 *  spelets egen `logic.ts`, `evolve.ts` och `enemies.ts`. */
export const survivorsSv: GameCopy = {
  name: "Överlevare",
  metaTitle: "Överlevare - överlev vågorna och besegra tre bossar | Ellaz",
  metaDescription:
    "Styr din farkost, samla vapen och överlev tre stadier på 60 sekunder vardera, var och en avslutad av en boss. Gratis i webbläsaren, utan konto.",

  lede: "Fiender strömmar in från alla håll. Rör dig för att undvika dem, låt vapnen sköta anfallet, och överlev tre stadier fram till varje boss.",

  body: [
    "Tre stadier. 60 000 millisekunder vardera, och varje ett avslutas med en boss. Att besegra den tredje, en golem, vinner hela omgången. Arenan är 420 gånger 560 logiska enheter, och du börjar med 3 hjärtan och en 900 millisekunders nådperiod efter varje träff, så en enda felbedömning sällan är slutet.",
    "Fienderna är olika farliga. Mycket olika.",
    "En vanlig löpare tål ett enda träff, en klot tål två, ett skal tre och en best fem, medan en elitversion av vilken sort som helst tål sex gånger så mycket och släpper tio gånger så mycket ädelsten när den faller. Att känna igen vilken fiende som är farlig, i stället för att bara se en folkmassa, är hela den taktiska delen av spelet.",
    "Fiender föds snabbare med tiden, från 1150, 900 eller 680 millisekunder mellan varje ny, ned mot ett golv på 320, 230 eller 165, beroende på om du spelar lugnt, normalt eller vilt. Varje stadium lägger också till en helt ny sorts fiende, 24 eller 16 eller 9 sekunder in i stadiet, så trycket ökar på två sätt samtidigt: fler fiender och nya slag av dem.",
    "Tio uppgraderingar finns totalt, med individuella tak mellan 2 och 8 nivåer var. Ett vapen som når nivå 5, med sin partneruppgradering också maxad, förvandlas till något starkare. Den ärliga begränsningen är att bossarna skalar snabbt: de tre har 80, 180 och 420 liv, mer än en femdubbling från första till sista, så en spelstil som fungerar mot den första bossen räcker sällan mot den tredje.",
  ],

  howToPlay: [
    {
      title: "Styr din farkost",
      body: "Rör dig med styrspaken, piltangenterna eller genom att dra på arenan. Vapnen skjuter automatiskt.",
    },
    {
      title: "Undvik fienderna",
      body: "Din enda uppgift är att röra dig rätt. Kontakt med en fiende kostar ett hjärta, men en nådperiod skyddar dig strax efter.",
    },
    {
      title: "Välj uppgraderingar",
      body: "Mellan strider erbjuds nya vapen och förstärkningar. Tio uppgraderingar finns, var och en med sitt eget tak.",
    },
    {
      title: "Besegra bossen i varje stadium",
      body: "Tre stadier, tre bossar. Att fälla den tredje, golemen, vinner hela omgången.",
    },
  ],

  tips: [
    {
      title: "Rör dig, sikta aldrig",
      body: "Vapnen sköter anfallet automatiskt. Din enda uppgift är att hålla dig levande genom att undvika kontakt.",
    },
    {
      title: "Lär dig känna igen en elitfiende",
      body: "Den tål sex gånger så mycket som en vanlig av samma sort och är värd att prioritera bort från, inte mot.",
    },
    {
      title: "Spara en dash till en trång stund",
      body: "Auto-dashen aktiveras var åttonde sekund på ett hittat träff. Att räkna med den i en tät situation kan rädda ett stadium.",
    },
  ],

  teaches: [
    {
      title: "Rumslig medvetenhet under press",
      body: "Att hålla koll på flera fiender samtidigt medan trycket ökar är en färdighet som byggs upp minut för minut.",
    },
    {
      title: "Att prioritera hot",
      body: "Inte alla fiender är lika farliga. Att känna igen skillnaden snabbt är vad som skiljer en lång körning från en kort.",
    },
    {
      title: "Att bygga en byggnad över tid",
      body: "Tio uppgraderingar och tre vapen att kombinera betyder att varje omgång är ett litet strategiskt val format allteftersom.",
    },
  ],

  ages: [
    {
      title: "Sju år, med hjälp",
      body: "Att bara röra sig undan fiender och se vapnen sköta resten är begripligt utan att förstå hela uppgraderingssystemet.",
    },
    {
      title: "Tolv år, på lugn takt",
      body: "1150 millisekunder mellan nya fiender vid start ger tid att lära sig mönstren innan trycket ökar.",
    },
    {
      title: "Vuxen, på vild takt",
      body: "680 millisekunder vid start, ned mot ett golv på bara 165. Ett riktigt test av reflexer och planering samtidigt.",
    },
  ],

  accessibility:
    "Fiendetyper skiljs åt av form och storlek, inte bara färg, så hot går att känna igen utan att förlita sig på en enda visuell signal. Styrningen erbjuder både en stick och pilar eller WASD på en dator. Nådperioden på 900 millisekunder efter en träff ger tid att reagera innan nästa fara.",

  together: [
    {
      title: "En styr, en ropar ut fiender",
      body: "Den ena rör farkosten, den andra håller koll på vad som närmar sig från sidorna. Två par ögon fångar mer än ett.",
    },
    {
      title: "Diskutera uppgraderingsval",
      body: "Innan ett val bekräftas, prata igenom vilket vapen som passar bäst just nu. Uppgraderingarna byggs olika varje omgång.",
    },
    {
      title: "Jämför hur långt ni kommer",
      body: "Spela var för sig och se vem som når längst genom de tre stadierna. Ett fällt golem är det tydligaste måttet.",
    },
  ],

  faq: [
    {
      q: "Hur lång är en omgång?",
      a: "Tre stadier på 60 000 millisekunder vardera, var och en avslutad av en boss. Att fälla den tredje bossen vinner omgången.",
    },
    {
      q: "Vad händer om jag blir träffad?",
      a: "Du förlorar ett hjärta av tre, och en 900 millisekunders nådperiod skyddar dig direkt efteråt.",
    },
    {
      q: "Är alla fiender lika farliga?",
      a: "Nej. En elitversion tål sex gånger så mycket som en vanlig fiende av samma sort och släpper tio gånger så mycket ädelsten.",
    },
    {
      q: "Hur många uppgraderingar finns?",
      a: "Tio totalt, var och en med ett eget tak mellan 2 och 8 nivåer.",
    },
    {
      q: "Kan ett vapen förvandlas till något starkare?",
      a: "Ja. Ett vapen på nivå 5 med sin partneruppgradering maxad förvandlas till en starkare version.",
    },
    {
      q: "Kostar det något?",
      a: "Nej. Gratis, utan konto och utan annonser, och det fungerar offline när sidan har laddat en gång.",
    },
  ],

  keywords: ["överlevare", "action", "vågor", "boss", "uppgraderingar", "gratis"],
};
