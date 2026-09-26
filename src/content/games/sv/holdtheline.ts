import type { GameCopy } from "../../types";

/**
 * Håll linjen, på svenska, skrivet för sin egen läsare i stället för översatt.
 *
 * Varje siffra kommer från `src/games/holdtheline/` - kampanjens längd, de sex
 * sorters angripare, butikens fyra rader, murens och fästets poäng. Inget är
 * påhittat här.
 */
export const holdthelineSv: GameCopy = {
  name: "Håll linjen",
  metaTitle: "Håll linjen - gratis belägringsspel | Ellaz",
  metaDescription:
    "En belägring i en enda gång: fästet till vänster, vågorna kommer från höger. Mellan vågorna köper pengarna vapen, vakter och fällor i gången.",

  lede: "Ditt fäste står längst till vänster och allt som vill riva det måste gå hela vägen dit. Du siktar, du skjuter, och allt som faller betalar. Mellan vågorna går ingen alls - det är då pengarna blir ett bättre vapen, vakter på taket, eller pålar nedslagna i gången.",

  body: [
    "Gången är hela skillnaden. Den är 900 enheter lång. Den som kliver in från höger behöver tid för att ta sig över den, och den tiden är precis vad du har för att stoppa honom. Inget annat avgör svårigheten - varken ytan eller himlen, bara avståndet och räckvidden på det du håller i.",

    "Sex sorter går den gången och var och en finns för att ett svar finns. Fotsoldaten går fram och slår på muren. Löparen är smal och snabb och straffar en omladdning i fel ögonblick. Fordonet är långsamt, tål oerhört mycket och gör stor skada när det kommer fram - det är hela skälet till raketskytten. Skytten stannar tvärt 440 enheter från muren och närmar sig aldrig: varken mina eller pålar når honom, bara räckvidd gör det, och därför kostar prickskytten pengar. Det flygande ignorerar samtliga markförsvar. Och på våg 20 kommer något tungt med en egen livmätare.",

    "Butiken är en prognos, inte en inköpslista. Varje motmedel dyker upp på hyllan en våg INNAN hotet det svarar på: raketskytten på sjätte, prickskytten på nionde, luftvärnet på tolfte. Den som köper det som glänser idag blir överraskad i övermorgon, och det är hela spelet.",

    "Tjugo vågor och kampanjen är vunnen. Sedan fortsätter gången att skicka folk, allt snabbare, tills fästet faller - och då finns bara poängen kvar. En vunnen omgång tar en kvart, vilket gör den till den klart längsta på sidan: det är en hel bussresa, inte en paus på tre minuter.",

    "Muren tar stryk före fästet. Den börjar med 260 poäng och fästet bakom har 500. Att laga muren kostar lika mycket hela omgången, med flit: det är det enda köp en spelare som håller på att förlora alltid måste kunna göra om, och en lagning med stigande pris gör en dålig våg till en förlorad omgång. Allt annat stiger 45 % per exemplar, så att ingen kan spara i nio vågor och köpa hela butiken på den tionde.",

    "Belägringens pengar har inget med dina mynt att göra. De föds i omgången, spenderas i omgången och dör med den. Någon växelkurs mellan de två finns inte och får aldrig finnas.",
  ],

  howToPlay: [
    { title: "Sikta och skjut", body: "Tryck där du vill skjuta - med fingret på telefon, med musen på dator. Håller du inne skjuter det vidare, men en enkel tryckning räcker alltid: inget här kräver att du håller fingret nere." },
    { title: "Ladda om", body: "Magasinet laddas om av sig självt när det är tomt. R laddar om i förväg, vilket är bättre än att stå tom när en löpare kommer." },
    { title: "Mellan vågorna", body: "Ingen går, inget brådskar. Hyllan läggs över gången och du handlar färdigt innan du trycker på knappen som skickar nästa." },
    { title: "Laga", body: "Muren tar stryk före fästet. Fästet går inte att laga: när det faller är omgången slut." },
  ],

  tips: [
    { title: "Köp nästa våg", body: "Det som kommer på sjunde förbereds på sjätte. Titta på hyllan - det som just dykt upp är nästan alltid svaret på något som ännu inte kommit." },
    { title: "En skytt kommer aldrig fram", body: "Det är meningslöst att minera gången för honom. Han stannar långt bort och skjuter; han måste hämtas med räckvidd, och din skytt har inte nog." },
    { title: "Himlen är ett eget spel", body: "Varken mur, mina, pålar eller skytt rör något som flyger. Utan luftvärn går trettonde vågen helt enkelt över allt du betalat för." },
    { title: "En lagad mur är värd en vakt", body: "Ett halvt sönderslaget fäste avslutar omgången tidigare än ett lite för kort magasin. Laga medan det är en utgift och inte en räddning." },
  ],

  teaches: [
    { title: "Att tänka framåt", body: "Att lägga pengar på en fara man ännu inte ser är en vana som inte kommer av sig själv, och spelet kräver den varje våg." },
    { title: "Att välja", body: "Varje slant som läggs här läggs inte där. Spelet säger aldrig vilket köp som var rätt - nästa våg gör det." },
    { title: "Att sikta", body: "Att välja mål i en folkmassa, och veta vem som hinner fram först, är en färdighet i sig." },
  ],

  ages: [
    { title: "Från 8 år", body: "Man måste sikta, räkna och planera samtidigt. Ett yngre barn klarar Lugn, men en hel omgång är lång." },
    { title: "Tonåringar och vuxna", body: "Vild skickar större, snabbare och tåligare vågor och betalar mindre per kropp." },
    { title: "Vuxna på egen hand", body: "Övertiden efter våg 20 är den del som är byggd för någon som jagar en siffra snarare än ett slut." },
  ],

  accessibility:
    "Allt spelas med tryckningar: inget kräver att man håller fingret nere eller drar. Tangentbordet fungerar på dator, målen är stora, och inget kort i butiken är någonsin avstängt - ett kort man inte har råd med svarar ändå, med en liten rörelse, i stället för att stå tyst.",

  together: [
    { title: "En siktar, en handlar", body: "Två vid samma skärm: den ena skjuter under vågen, den andra bestämmer köpen mellan dem. Det är två olika jobb, och diskussionen är halva nöjet." },
    { title: "Gissa nästa", body: "Fråga vad som kommer innan ni trycker på knappen. Att gissa fel tillsammans är bättre än att köpa på måfå." },
    { title: "Dela de fyra raderna", body: "Två butiksrader var - den ena tar vapnen och uppgraderingarna, den andra vakterna och gången - och se vilket par av beslut som kom längst." },
  ],

  faq: [
    { q: "Hur lång är en omgång?", a: "En vunnen kampanj tar ungefär en kvart. Det är med flit sidans längsta spel, och startskärmen säger det innan man börjar." },
    { q: "Vad händer efter tjugonde vågen?", a: "Kampanjen är vunnen och gången fortsätter ändå. Vågorna stiger brantare än förut, eftersom du vid det laget äger hela butiken, och kvar finns bara poängen." },
    { q: "Blir spelets pengar till mynt?", a: "Nej, aldrig. Det är en valuta inuti omgången; den rör inte din plånbok och någon växelkurs mellan de två finns inte." },
    { q: "Går det att vinna utan att köpa något?", a: "Nej. Den som inte spenderar faller mellan femte och nionde vågen beroende på svårighet. Butiken är ingen dekoration." },
    { q: "Måste skärmen ligga ner?", a: "Spelet är gjort för en bred skärm och rättar sig efter fönstrets form, men gången behåller alltid samma längd - det blir aldrig lättare på en stor skärm." },
    { q: "Sparas omgången om jag går?", a: "Mellan vågorna, ja. En omgång sparas på butiksskärmen och aldrig mitt i en våg, så du kommer tillbaka till stunden innan du skickade nästa, med dina pengar." },
  ],

  keywords: ["belägringsspel", "försvarsspel", "tower defense", "gratis skjutspel", "fiendevågor"],
};
