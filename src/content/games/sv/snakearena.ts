import type { GameCopy } from "../../types";

/**
 * Ormarenan, på svenska, skriven för sin egen läsare i stället för översatt.
 *
 * Varje siffra kommer från `src/games/snakearena/` - omgångens längd, antalet
 * bottar, startlängden, brädets två former, stegtakten, Titta-lägets fart,
 * myntet var femte äpple och knapparnas storlek. Inget är påhittat här.
 */
export const snakearenaSv: GameCopy = {
  name: "Ormarenan",
  metaTitle: "Ormarenan - gratis ormspel mot bottar | Ellaz",
  metaDescription:
    "Klassisk orm på rutnät, i en omgång på 90 sekunder mot 3 till 5 datorormar. Ät äpplen, håll dig undan varje kropp och var längst när tiden tar slut.",

  lede: "Ormen du redan kan, på ett större bräde och i sällskap. I 90 sekunder jagar du och upp till fem datorormar samma äpplen, och den vars huvud träffar en vägg eller en kropp är ute. Den längsta ormen som fortfarande rör sig när klockan når 0:00 vinner.",

  body: [
    "Alla rör sig samtidigt. Det är hela skillnaden.",

    "Vid varje steg flyttar alla ormar en ruta var, lika fort och i samma ögonblick. Reglerna är de du känner från klassikern: ett huvud som åker av brädet eller in i en kropp är ute, din egen svans inräknad. Två huvuden som möts är båda ute, oavsett vem som är längst, så en krock rakt framifrån vinner aldrig ett gräl. En orm som åker ut spricker, och varje ruta dess kropp täckte blir ett äpple. Därför blir platsen där en lång orm kraschade plötsligt den mest trånga på hela brädet.",

    "Äpplena tar aldrig slut. Det finns alltid minst två fler än det finns ormar, och varje äpple du äter gör dig ett segment längre. Varje orm börjar med 3 segment, utspridd längs en ring och på väg medurs, så ingen börjar öga mot öga.",

    "En omgång varar 90 sekunder. Finns bara en orm kvar innan dess vinner den direkt. Annars tar den längsta ormen som lever vid signalen hem det.",

    "Du väljer hur många datorormar du möter: 3, 4 eller 5. De heter Bolt, Moss, Echo, Pip och Fizz, var och en har sin egen färg och namnet svävar över huvudet. På en dator är brädet 30 rutor gånger 20 och en ställning i realtid står bredvid. På en telefon vänds det till 23 gånger 32 så att det får plats på höjden.",
  ],

  howToPlay: [
    { title: "Börja", body: "Tryck på Spela och sedan en pil eller ett svep. Din mintgröna orm och alla bottar väntar på brädet tills din första riktning, så ingenting rör sig innan du är redo." },
    { title: "Styr", body: "Piltangenter eller WASD på datorn, svep eller de fyra knapparna på telefonen. Inställningen för kontroller byter knapparna mot en joystick, eller mot en spak som dyker upp där du rör vid brädet." },
    { title: "Väx", body: "För huvudet över ett äpple för att växa ett segment. Ormar som spruckit lämnar en rad äpplen efter sig, som är värd att springa efter om vägen är fri." },
    { title: "När du är ute", body: "Omgången stannar och visar vilken plats du fick. Titta spelar resten tre gånger så fort så att du ser vem som vinner, och Spela igen startar en ny omgång direkt." },
  ],

  tips: [
    { title: "Lämna en väg ut", body: "Innan du svänger in i en lucka mellan två kroppar, se efter vart den leder. En återvändsgränd blir väldigt kort när en annan orm stänger öppningen." },
    { title: "Tävla inte med ett huvud om samma äpple", body: "Är en bott en ruta från äpplet du vill ha, låt den ta det. Två huvuden i samma ruta slår ut er båda, och äpplena en bott lämnar när den spricker är värda mer än ett enda." },
    { title: "Längd är en ledning och en risk", body: "En lång kropp stänger av brädet för alla, dig själv också. Leder du sent i omgången, sluta jaga och håll dig på öppen yta tills signalen går." },
    { title: "Håll ögonen på bottarna", body: "Varje bott går mot det närmaste äpplet den kan nå och håller sig borta från fickor som är mindre än den själv. Ibland slinter en och svänger på måfå, och då är det ditt läge." },
  ],

  teaches: [
    { title: "Läsa det som rör sig", body: "Sex saker rör sig på brädet samtidigt, och du har ett steg på dig att bestämma. Det är att läsa en hel bild i stället för ett enda mål." },
    { title: "Planera utrymme", body: "En orm som äter tar mer plats. Att hålla en utgång öppen är att planera några drag framåt." },
    { title: "Risk och belöning", body: "De bästa äpplena ligger bredvid de värsta farorna, och spelet ber dig välja med några sekunders mellanrum." },
  ],

  ages: [
    { title: "Från 6 år", body: "En yngre spelare kan styra med de stora knapparna och lära sig hålla sig undan kroppar. Med 3 bottar är omgången förlåtande, men att åka ut avslutar den ändå." },
    { title: "8 till 12", body: "4 bottar, en riktig kapplöpning efter äpplen, och ögonblicket då man lär sig att en krock rakt framifrån kostar er båda." },
    { title: "Tonåringar och vuxna", body: "5 bottar på hela brädet, där det i sig är en färdighet att hålla sig vid liv till signalen." },
  ],

  accessibility:
    "Du styr hela omgången, med tangenter, svep eller fyra stora knappar, och ett steg kommer ungefär 7 gånger i sekunden, så spelet kräver jämn uppmärksamhet i 90 sekunder. Inget kräver ett snabbt dubbeltryck eller en exakt dragning: varje kontroll är ett enda tryck, knapparna är 64 pixlar stora och paus fryser omgången precis där den är.",

  together: [
    { title: "Turas om", body: "Spela samma antal bottar i tur och ordning och jämför hur långa ni blev. Rekordet sparas separat för 3, 4 och 5 bottar." },
    { title: "En spelar, en varnar", body: "En av er styr medan den andra håller koll på brädet och säger till när en bott är på väg." },
    { title: "Titta på slutet tillsammans", body: "När en av er åker ut, tryck på Titta och gissa vinnaren innan signalen." },
  ],

  faq: [
    { q: "Är Ormarenan gratis?", a: "Ja. Det finns inget att registrera sig för och inget att köpa, och det spelas i webbläsaren." },
    { q: "Hur vinner man?", a: "Genom att vara den längsta ormen som lever när klockan på 90 sekunder tar slut, eller den sista ormen som är kvar innan dess." },
    { q: "Vad händer när två ormar krockar huvud mot huvud?", a: "Båda åker ut, oavsett längd. Två huvuden som går in i samma ruta, eller rakt igenom varandra, räknas likadant." },
    { q: "Varför dök det upp äpplen där en orm var?", a: "En orm som åker ut spricker: varje ruta i kroppen blir ett äpple. Där går det fort att växa." },
    { q: "Mot hur många bottar kan jag spela?", a: "Tre, fyra eller fem. Du väljer på startkortet, och på en dator även i panelen bredvid brädet." },
    { q: "Hur sparas poängen?", a: "Ditt rekord är den största längd din orm nådde under en omgång, sparad på den här enheten för varje antal bottar. Var femte äpple du äter ger också ett mynt." },
    { q: "Kan jag pausa?", a: "Ja, pausknappen stoppar omgången och klockan. Byter du flik hålls den också." },
  ],

  keywords: ["ormspel", "orm mot bottar", "gratis ormspel", "ormspel i webbläsaren", "ormarena"],
};
