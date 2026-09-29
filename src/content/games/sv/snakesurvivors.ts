import type { GameCopy } from "../../types";

/**
 * Ormöverlevare, på svenska, skrivet för sin egen läsare i stället för översatt.
 *
 * Varje siffra kommer från `src/games/snakesurvivors/` - ormens start-, minsta
 * och största längd, vad ett bett kostar, blinkningen efteråt, vad som kallar
 * fram Väktaren, korten och deras tak. Inget är påhittat här.
 */
export const snakesurvivorsSv: GameCopy = {
  name: "Ormöverlevare",
  metaTitle: "Ormöverlevare - gratis ormspel med överlevnad | Ellaz",
  metaDescription:
    "Styr en lysande neonorm och slut en ögla runt formerna för att krossa dem. Svansen är ditt liv, och tre Väktare väntar, var och en tuffare än den förra.",

  lede: "Din orm lyser, glider åt vilket håll som helst och anfaller aldrig något rakt framifrån. För tillbaka huvudet nära din egen kropp, så sluts öglan av sig själv och allt som fångats därinne krossas. Väx, kalla fram en Väktare efter en annan - tre stycken, var och en tuffare än den förra - och vinn när den tredje faller.",

  body: [
    "Ingen siktar här. Du ritar en cirkel med dig själv. Det som är inuti när den sluts försvinner och lämnar ädelstenar efter sig.",

    "Svansen är livet, och siffran på skärmen är helt enkelt hur lång du är. Ormen börjar med 28 segment. En form som når huvudet biter av minst 1 av dem, sedan blinkar du i 1,4 sekunder då ingenting kan röra dig, lagom länge för att ta dig därifrån. Under 3 segment är omgången slut. Ädelstenar ger tillbaka längd och fyller mätaren som ger nästa kort: en blå är värd en tredjedels segment, en röd två tredjedelar och en gul ett helt segment. Som längst blir ormen 60 segment, och ju längre den är, desto större ögla kan den rita.",

    "Kroppen är ingen vägg. Former går rakt igenom den, och det är hela knepet: en flock som jagar ditt huvud medan du svänger runt genar och hamnar inne i cirkeln du håller på att rita. Då sluter du, utan att träffa svansen exakt: så fort huvudet kommer inom 42 enheter från kroppen sluts öglan, och en streckad linje visar var. Men storleken avgör. En ögla krossar bara om den stänger in minst 4000 kvadratenheter, ungefär en cirkel med radien 36, så att snurra tätt på stället krossar ingenting, och formerna som samlas därinne når till slut huvudet. Därför är längden mer än liv: en lång orm har råd med en vid ögla, en kort orm får kämpa för att sluta en enda, och varje ädelsten ger tillbaka lite av den räckvidden. Varje stängning är ett slag mot allt därinne.",

    "Tre sorters former kommer mot dig, samma tre som i Överlevare. Löparen är en liten, snabb fladdermus. Klotet är ett slem som glider in när omgången har pågått en stund. Bjässen är en långsam, seg krabba som dyker upp ännu senare, och en ögla räcker inte för den. Den behöver två.",

    "Det finns ingen klocka. En omgång har tre etapper, var och en avslutas av sin egen Väktare, tuffare än den förra. Den första kommer vid 50 segment eller 10 krossade, det som händer först; besegra den så växer flocken - fler former, de kommer snabbare, bjässen ansluter tidigare - till en andra Väktare vid 240 krossade totalt, sedan en tredje vid 760 på Normal. Var och en är en jättefladdermus som stannar och lyser innan den gör utfall: vik undan då, och slut tre öglor för att fälla den. Besegra alla tre och omgången är din.",

    "Nivåerna ändrar flocken utöver det varje etapp redan lägger till: hur ofta former kommer, hur fort de går och hur många som får plats på skärmen samtidigt. Ormen är densamma på alla tre, och det är andra spelet i Orm-familjen.",
  ],

  howToPlay: [
    { title: "Styr", body: "På telefon lägger du tummen var som helst på arenan och drar, så dyker en liten spak upp under fingret och ormen följer efter. På dator styr du med piltangenterna eller WASD. Ormen stannar aldrig och svänger i mjuka bågar, inte i räta vinklar." },
    { title: "Slut öglan", body: "För tillbaka huvudet nära din egen kropp så sluts öglan av sig själv; en streckad linje visar var. Varje form inne i öglan du just ritat blir krossad, och öglan måste vara vid: att snurra tätt på stället räknas inte." },
    { title: "Skydda huvudet", body: "Bara huvudet kan skadas. En form som når det kostar 1 segment, och sedan blinkar ormen en stund så att du hinner undan." },
    { title: "Väx tillbaka", body: "Krossade former lämnar ädelstenar, och några fler ligger på golvet, så du kan växa innan din första ögla. Glid över dem för att bli längre och fylla nivåmätaren." },
    { title: "Välj ett kort", body: "När mätaren är full stannar spelet och visar tre kort. Ett kort du redan har visar sin nästa nivå. Tryck på ett så börjar flocken röra sig igen." },
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
    { title: "Tonåringar och vuxna", body: "Vild. Flocken som byggs upp medan du växer mot Väktaren gör spelet till att läsa hela skärmen på en gång." },
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
    { q: "Hur sluter man en ögla?", a: "För tillbaka huvudet inom 42 enheter från kroppen så sluts öglan av sig själv. Den måste stänga in minst 4000 kvadratenheter, så att snurra tätt på stället räknas inte, och varje stängning träffar varje form därinne en gång." },
    { q: "Vad händer när en form nuddar mig?", a: "Nuddar den huvudet tappar du minst 1 segment och blinkar i 1,4 sekunder då ingenting kan skada dig. Nuddar den kroppen händer ingenting: former går rakt igenom kroppen, och det är så en flock hamnar inne i öglan." },
    { q: "Hur lång är en omgång?", a: "Det finns ingen klocka. En omgång har tre etapper: den första Väktaren kommer vid 50 segment eller 10 krossade former, den andra vid 240 totalt och är tuffare, den tredje vid 760 och tuffare igen på Normal. Besegra alla tre så är omgången vunnen." },
    { q: "Vad gör korten?", a: "Sexton: nio grå, fyra sällsynta blå, tre ännu ovanligare guldiga. Tre grå är vapen: Huggtänder biter en form som nuddar huvudet, Taggsvans skadar det som nuddar kroppen, och Spott skjuter på närmaste form varannan sekund, men aldrig på Väktaren. Magnet drar till sig ädelstenar, Snabb ger 10 % mer fart per nivå, Återväxt låter ett segment växa ut var 9:e sekund, Tryckvåg knuffar bort formerna precis utanför öglan, Lasso låter öglan slutas längre bort ifrån, och Sköld tar en stöt gratis och laddas sedan om. Blå och guld lägger till Kedjekross, Dubbla stenar, Frostspår, Lång kropp, Tvillinghuvud, Svart hål och Nova." },
    { q: "Hur räknas poängen?", a: "I krossade former. Rekordet sparas på din enhet, separat för varje nivå, och var 100:e krossad form ger mynt." },
    { q: "Hur hänger det ihop med Orm och Överlevare?", a: "Det är andra spelet i Orm-familjen: samma neonorm som i klassiska Orm, mot de tre formerna från Överlevare." },
  ],

  keywords: ["ormspel", "överlevnadsspel", "gratis ormspel", "arkadspel i webbläsaren", "öglespel"],
};
