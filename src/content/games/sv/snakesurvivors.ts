import type { GameCopy } from "../../types";

/**
 * Ormöverlevare, på svenska, skrivet för sin egen läsare i stället för översatt.
 *
 * Varje siffra kommer från `src/games/snakesurvivors/` - ormens start-, minsta
 * och största längd, vad ett bett kostar, blinkningen efteråt, en fas längd per
 * nivå, korten och deras tak. Inget är påhittat här.
 */
export const snakesurvivorsSv: GameCopy = {
  name: "Ormöverlevare",
  metaTitle: "Ormöverlevare - gratis ormspel med överlevnad | Ellaz",
  metaDescription:
    "Styr en lysande neonorm genom en flock glödande former och slut en ögla runt dem för att krossa dem. Svansen är ditt liv, och Väktaren väntar i slutet.",

  lede: "Din orm lyser, glider åt vilket håll som helst och anfaller aldrig något rakt framifrån. För tillbaka huvudet tills det nuddar din egen kropp, så krossas allt som fångats inne i öglan. Klara fasen, krossa Väktaren tre gånger, och omgången är din.",

  body: [
    "Ingen siktar här. Du ritar en cirkel med dig själv. Det som är inuti när den sluts försvinner och lämnar ädelstenar efter sig.",

    "Svansen är livet, och siffran på skärmen är helt enkelt hur lång du är. Ormen börjar med 28 segment. En form som når huvudet biter av 2 av dem, och sedan blinkar du i 1,4 sekunder då ingenting kan röra dig, precis lagom länge för att ta dig därifrån. Under 3 segment är omgången slut. Ädelstenar ger tillbaka längd: var och en är värd en tredjedels segment, och den fyller dessutom mätaren som ger nästa kort. Som längst blir ormen 60 segment, och ju längre den är, desto större ögla kan den rita.",

    "Kroppen är ingen vägg. Former går rakt igenom den, och det är hela knepet: en flock som jagar ditt huvud medan du svänger runt genar och hamnar inne i cirkeln du håller på att rita. Då sluter du. Men storleken avgör. En ögla krossar bara om den stänger in minst 4000 kvadratenheter, ungefär en cirkel med radien 36, så att snurra tätt på stället krossar ingenting, och formerna som samlas därinne når till slut huvudet. Därför är längden mer än liv: en lång orm har råd med en vid ögla, en kort orm får kämpa för att sluta en enda, och varje ädelsten ger tillbaka lite av den räckvidden. Varje stängning är ett slag mot allt därinne.",

    "Tre sorters former kommer mot dig, samma tre som i Överlevare. Löparen är en liten, snabb fladdermus. Klotet är ett slem som glider in när en fjärdedel av fasen har gått. Bjässen är en långsam, seg krabba som dyker upp strax efter halvvägs, och en ögla räcker inte för den. Den behöver två.",

    "En fas varar 2:30 på Lugn, 3:00 på Normal och 3:30 på Vild. Sedan kommer Väktaren, en jättefladdermus som gör utfall rakt mot dig, och den kräver tre öglor, ett slag per ögla. Tredje gången vinner du. Nivåerna ändrar bara flocken: hur ofta former kommer, hur fort de går och hur många som får plats på skärmen samtidigt. Ormen är densamma på alla tre, och det är andra spelet i Orm-familjen.",
  ],

  howToPlay: [
    { title: "Styr", body: "På telefon lägger du tummen var som helst på arenan och drar, så dyker en liten spak upp under fingret och ormen följer efter. På dator styr du med piltangenterna eller WASD. Ormen stannar aldrig och svänger i mjuka bågar, inte i räta vinklar." },
    { title: "Slut öglan", body: "För tillbaka huvudet tills det nuddar din egen kropp. Varje form inne i öglan du just ritat blir krossad, och öglan måste vara vid: att snurra tätt på stället räknas inte." },
    { title: "Skydda huvudet", body: "Bara huvudet kan skadas. En form som når det kostar 2 segment, och sedan blinkar ormen en stund så att du hinner undan." },
    { title: "Väx tillbaka", body: "Krossade former lämnar ädelstenar. Glid över dem för att bli längre och fylla nivåmätaren." },
    { title: "Välj ett kort", body: "När mätaren är full stannar spelet och visar tre kort. Tryck på ett så börjar flocken röra sig igen." },
  ],

  tips: [
    { title: "Ringa in flocken, inte en form", body: "En ögla runt en ensam fladdermus är ett bortkastat varv. Låt några jaga dig och svep sedan brett så att de hamnar inne i cirkeln, eftersom varje stängning träffar allt därinne." },
    { title: "Krabban vill ha två varv", body: "Bjässen överlever första krossningen. Håll den kvar i samma båge och stäng igen, i stället för att jaga en ny flock med en halvslagen krabba bakom dig." },
    { title: "Snurra aldrig på stället", body: "Ormens tätaste sväng är för liten för att krossa något. Snurrar du där lägger sig flocken inne i cirkeln, alldeles intill huvudet. Håll öglorna vida och fortsätt röra dig." },
    { title: "Välj vapen efter vad som gör ont", body: "Tappar du mest längd på former som möter huvudet gör Huggtänder de mötena till bett. Är det många former som korsar kroppen är Taggsvans ett bättre första vapen." },
  ],

  teaches: [
    { title: "Att planera en väg", body: "En ögla är en väg man väljer innan man åker den. Man lär sig titta på var flocken kommer att vara, inte var den är nu." },
    { title: "Innanför och utanför", body: "Att stänga en form runt andra former ger en första, väldigt fysisk känsla för innanför, utanför och yta." },
    { title: "Att välja medan klockan står still", body: "Korten pausar spelet. Det finns tid att tänka, och valet formar resten av omgången." },
  ],

  ages: [
    { title: "Från 5 år", body: "Ett litet barn kan styra ormen på Lugn och lära sig sluta en vid ögla, och inget straffar det utöver att omgången tar slut." },
    { title: "8 till 12", body: "Normal, där krabban kräver två öglor och valet mellan Huggtänder och Taggsvans börjar spela roll." },
    { title: "Tonåringar och vuxna", body: "Vild. Flocken som byggs upp mot 3:30 gör spelet till att läsa hela skärmen på en gång." },
  ],

  accessibility:
    "Ormen måste styras: dra på telefon eller använd tangenterna på dator, under hela fasen, så spelet går inte att klara med bara tryckningar, och det säger vi hellre här. Det som inte behövs är att sikta eller trycka snabbt. Nivåkorten är stora knappar, inget av dem är någonsin avstängt, och en omgång som tar slut tar helt enkelt slut, med en ny en enda tryckning bort.",

  together: [
    { title: "En styr, en ropar", body: "Den ena håller telefonen, den andra håller koll på flocken och säger när det är dags att svänga. Byt efter varje omgång." },
    { title: "Välj kortet tillsammans", body: "När spelet stannar kommer ni överens högt om ett kort innan någon trycker. Grälet om Huggtänder mot Taggsvans är halva nöjet." },
    { title: "Samma nivå, turas om", body: "Spela i tur och ordning på samma nivå och jämför hur många former ni krossat. Rekordet sparas per nivå, så Lugn och Vild tävlar aldrig mot varandra." },
  ],

  faq: [
    { q: "Är Ormöverlevare gratis?", a: "Ja, och det finns inget att registrera sig för eller köpa." },
    { q: "Hur sluter man en ögla?", a: "För tillbaka huvudet tills det nuddar kroppen. Öglan måste stänga in minst 4000 kvadratenheter, så att snurra tätt på stället räknas inte, och varje stängning träffar varje form därinne en gång." },
    { q: "Vad händer när en form nuddar mig?", a: "Nuddar den huvudet tappar du 2 segment och blinkar i 1,4 sekunder då ingenting kan skada dig. Nuddar den kroppen händer ingenting: former går rakt igenom kroppen, och det är så en flock hamnar inne i öglan." },
    { q: "Hur lång är en omgång?", a: "En fas på 2:30 på Lugn, 3:00 på Normal eller 3:30 på Vild, och sedan Väktaren. Krossa den tre gånger så är omgången vunnen." },
    { q: "Vad gör korten?", a: "De är sex. Huggtänder biter en form som nuddar huvudet i stället för att den skadar dig, och varje nivå biter en segare form; Taggsvans skadar det som nuddar kroppen. Det är de två vapnen. Magnet drar till sig ädelstenar, Snabb ger 10 % mer fart och en tätare sväng per nivå, Återväxt låter ett segment växa ut av sig självt var 9:e sekund, och Tryckvåg kastar bort och bedövar formerna precis utanför öglan." },
    { q: "Hur räknas poängen?", a: "I krossade former. Rekordet sparas på din enhet, separat för varje nivå, och var 25:e krossad form ger mynt." },
    { q: "Hur hänger det ihop med Orm och Överlevare?", a: "Det är andra spelet i Orm-familjen: samma neonorm som i klassiska Orm, mot de tre formerna från Överlevare." },
  ],

  keywords: ["ormspel", "överlevnadsspel", "gratis ormspel", "arkadspel i webbläsaren", "öglespel"],
};
