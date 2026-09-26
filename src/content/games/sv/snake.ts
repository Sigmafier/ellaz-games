import type { GameCopy } from "../../types";

/**
 * Svenska, skriven från `node scripts/brief.mjs sv snake`.
 *
 * Siffrorna kommer från `scripts/sim/snake-speed.mjs`, som härleder dem ur
 * scenens egna konstanter. Inget här är översatt från någon annan sida.
 */
export const snakeSv: GameCopy = {
  name: "Orm",
  metaTitle: "Ormen - gratis klassiker online | Ellaz",
  metaDescription:
    "Den klassiska ormen, gratis i webbläsaren, på ett rutnät med 17x17 rutor. Tre starthastigheter, utan konto, och den fungerar offline.",

  lede: "Ät, bli längre, rör inte dig själv. Ett rutnät på 17 gånger 17, tre starthastigheter, och inget planerat slut.",

  body: [
    "Ormen går framåt av sig själv och stannar aldrig. Du bestämmer bara var den svänger, med ett svep eller med en pil. Varje äpple gör den en ruta längre. Efter ett tag är den enda motståndaren dess egen kropp, och rutnätet som såg tomt ut i början är plötsligt fullt av väggar du har byggt själv. Det är hela spelet. Det har inte behövt ändras på fyrtio år, och vi har inte försökt.",
    "Hastigheten stiger medan du äter. Den startar olika och slutar likadant.",
    "På långsam tar en tur tvärs över brädet 2,9 sekunder i början. På snabb tar samma sträcka 1,5. När toppfarten på 60 millisekunder per steg är nådd tar den 1,0 för alla tre, så det nivån egentligen bestämmer är inte hur snabbt det slutar utan hur lång tid du får på dig att vänja dig. Snabb är framme efter 20 äpplen. Normal efter 45. Långsam efter 70.",
    "Rutnätet har 289 rutor, så den högsta poäng som går att nå är 286. Ingen har varit i närheten. Rekordet räknas i poäng, där fler är bättre, och det kontrolleras en enda gång: när ormen dör. Mynt kommer var femte äpple, utan konfetti, eftersom en fullskärmsfest var femte sekund slutar betyda något.",
  ],

  howToPlay: [
    {
      title: "Styr med pilar, spak eller svep",
      body: "Fyra pilknappar under brädet, en spak om du hellre vill ha en, eller ett svep över rutnätet. Valet sparas per spel, så ormen öppnas nästa gång med den styrning du använde sist. Pilarna är vanliga knappar, vilket betyder att spelet går att spela av någon som inte kan hålla ett drag.",
    },
    {
      title: "Ät äpplet",
      body: "Ett äpple i taget ligger ute på rutnätet. Kör in i det och ormen blir en ruta längre och ett nytt äpple dyker upp någon annanstans. Det finns inget att sikta med och ingenting att trycka på för att äta.",
    },
    {
      title: "Kör inte in i dig själv",
      body: "Väggarna går runt, så du kan köra ut på ena sidan och komma in på den andra. Det enda som tar slut på omgången är din egen svans. Ju längre du har ätit, desto mindre plats har du lämnat åt dig själv.",
    },
    {
      title: "Välj hastighet innan du börjar",
      body: "Tre nivåer står i raden ovanför brädet: långsam, normal och snabb. De byter starthastighet och hur många äpplen det tar innan toppfarten är uppe. Byter du nivå börjar omgången om.",
    },
  ],

  tips: [
    {
      title: "Ät i kanten, inte i mitten",
      body: "Ett äpple mitt på brädet ser bekvämt ut och delar rutnätet i två halvor som svansen sedan måste samsas om. Tar du dem längs kanten håller du mitten öppen, och mitten är det enda stället där en lång orm kan vända utan att möta sig själv.",
    },
    {
      title: "Bestäm svängen innan du är framme",
      body: "Ormen läser din senaste riktning i det ögonblick den lämnar en ruta. Trycker du två gånger snabbt hinner bara den ena registreras. Tänk ett steg i förväg och tryck en gång, hellre än att rätta i sista sekunden.",
    },
    {
      title: "Använd genomgången i väggen",
      body: "Att köra ut genom en sida och in på den andra är inte ett fusk, det är en del av brädet. Det är också den enda vägen förbi en svans som ligger tvärs över rutnätet, så det är värt att öva innan du behöver det.",
    },
    {
      title: "Långsam är inte lättare hela vägen",
      body: "Långsam ger dig 70 äpplen innan toppfarten är uppe, och vid det laget är ormen så lång att farten inte längre är problemet. Nivån köper tid i början och ingenting i slutet.",
    },
  ],

  teaches: [
    {
      title: "Att planera ett steg framåt",
      body: "Ormen svarar på en riktning, inte på en position. Att spela den är att hela tiden svara på frågan var den kommer att vara om ett ögonblick, vilket är en annan sak än att se var den är nu.",
    },
    {
      title: "Att hålla en plan i huvudet",
      body: "Svansen är en karta över de senaste dragen. Att undvika den kräver att du minns vart du tog vägen, och det minnet blir längre i takt med att ormen gör det.",
    },
    {
      title: "Att ta ett nej utan att tappa humöret",
      body: "Omgången tar slut tvärt och utan förvarning, och nästa startar med ett tryck. Ett spel som gör det billigt att börja om är ett spel där ett misstag är information i stället för ett straff.",
    },
  ],

  ages: [
    {
      title: "Från ungefär fem år, på långsam",
      body: "Det finns ingenting att läsa i spelet, så ett barn som ännu inte läser klarar det själv. Långsam ger 2,9 sekunder tvärs över brädet, vilket räcker för att hinna tänka.",
    },
    {
      title: "Sju år och uppåt, på normal",
      body: "Vid den åldern räcker det att förstå att svansen växer. Normal ger 45 äpplen innan toppfarten, vilket är gott om tid att lära sig kanterna.",
    },
    {
      title: "Vuxna spelar snabb",
      body: "Snabb når toppfart efter 20 äpplen och är den enda nivån där farten hinner bli intressant innan längden gör det. Det är också den som passar en kort paus.",
    },
  ],

  accessibility:
    "Ormen går att spela helt med knappar: fyra pilar under brädet, alla vanliga knappar med riktiga etiketter, så den fungerar med tangentbord och med skärmläsare. Svep krävs aldrig. Ljudet går att stänga av i fältet högst upp, och spelet fungerar lika bra utan det. Den som hellre vill ha en spak kan byta styrning, och valet ligger kvar till nästa gång.",

  together: [
    {
      title: "Turas om vid ett tapp",
      body: "En omgång tar sällan mer än en minut, så att lämna över enheten efter varje död blir en rimlig rytm. Rekordet är ett per enhet, vilket betyder att ni jagar samma siffra.",
    },
    {
      title: "Låt någon annan styra svängarna",
      body: "En vuxen håller enheten och ett barn säger vart ormen ska. Det flyttar hela spelet till orden vänster och höger, vilket är svårare än det låter när ormen redan är på väg.",
    },
    {
      title: "Bestäm ett mål tillsammans",
      body: "Tjugo äpplen är ett mål som går att nå på en kvart och som betyder något på alla tre nivåerna. Det är ett bättre gemensamt mål än ett rekord, eftersom alla kan nå det.",
    },
  ],

  faq: [
    {
      q: "Är det gratis?",
      a: "Ja, helt, och det förblir det. Inga annonser, inga köp inne i spelet, och inget konto att skapa.",
    },
    {
      q: "Måste jag ladda ner något?",
      a: "Nej. Spelet körs i webbläsaren och fungerar offline när sidan har laddat en gång.",
    },
    {
      q: "Var sparas mitt rekord?",
      a: "På enheten själv, inte på någon server. Rensar du webbläsarens data försvinner det, och en telefon och en surfplatta har varsitt rekord.",
    },
    {
      q: "Hur högt går poängen?",
      a: "Rutnätet har 289 rutor, så taket är 286 poäng. I praktiken tar svansen slut på plats långt innan dess.",
    },
    {
      q: "Går det att spela på telefon?",
      a: "Ja. Pilknapparna sitter under brädet och är stora nog för en tumme, och du kan byta till spak eller svep om du hellre vill.",
    },
    {
      q: "Vilken ålder passar det?",
      a: "Från ungefär fem år på långsam. Det finns inga ord i spelet, så ett barn som inte läser ännu spelar det själv.",
    },
  ],

  keywords: ["orm", "arkad", "klassiker", "reflexer", "oändligt", "retro"],
};
