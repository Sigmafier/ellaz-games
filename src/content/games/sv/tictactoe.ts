import type { GameCopy } from "../../types";

/** Svenska, från `node scripts/brief.mjs sv tictactoe`. Oddsen kommer ur
 *  `scripts/sim/tictactoe-odds.mjs`. Inget här är översatt. */
export const tictactoeSv: GameCopy = {
  name: "Tre i rad",
  metaTitle: "Luffarschack - tre nivåer, eller två spelare | Ellaz",
  metaDescription:
    "Luffarschack mot datorn på tre nivåer eller mot någon vid samma enhet. Den svåraste nivån går inte att vinna mot. Gratis och utan konto.",

  lede: "Tre i rad på ett bräde med nio rutor. Tre nivåer mot datorn, eller två personer vid samma enhet.",

  body: [
    "Det finns 255 168 kompletta partier i luffarschack, och perfekt spel från båda sidor slutar alltid oavgjort. Det är en avgjord sanning och inte en åsikt, och den är hela anledningen till att spelet har tre nivåer i stället för en.",
    "Den svåraste nivån går inte att vinna mot. Aldrig.",
    "Vi lät en slumpspelare spela 3 000 partier mot den. Noll vinster. 21,7 procent av partierna slutade oavgjort och 78,3 procent i förlust. Den räknar igenom hela trädet vid varje drag, så det bästa som går att uppnå är remi, precis som teorin säger. Att få remi mot den är alltså inte ett misslyckande utan det enda perfekta resultat som finns.",
    "De andra två nivåerna är gjorda för att gå att vinna mot. Den lättaste drar slumpmässigt och förlorar 29 procent av partierna mot en slumpspelare, medan en slumpspelare i sin tur slår den i 58,8 procent. Mellannivån spelar optimalt ungefär varannan gång och vinner 54,3 procent mot slumpen. Den svåra vinner 78,3 procent.",
    "Den ärliga begränsningen är att spelet är löst. Ett barn som förstår mittrutan och hörnen kommer inom någon vecka att sluta kunna förlora på de två lättare nivåerna, och då är det roliga över. Två personer vid samma enhet håller mycket längre. Särskilt om den ena är fem år och den andra låter bli att spela perfekt.",
  ],

  howToPlay: [
    {
      title: "Välj nivå eller motståndare",
      body: "Tre nivåer mot datorn, eller läget för två spelare. Rekordet följer nivån och nollställs när du byter.",
    },
    {
      title: "Tryck på en ruta",
      body: "Din markering hamnar där. Ett tryck räcker, och en upptagen ruta svarar inte.",
    },
    {
      title: "Gör tre i rad",
      body: "Vågrätt, lodrätt eller diagonalt. Den vinnande raden markeras när den uppstår.",
    },
    {
      title: "Bygg en svit",
      body: "Rekordet är den längsta raden av vinster i följd på samma nivå. En förlust eller ett byte av nivå börjar om.",
    },
  ],

  tips: [
    {
      title: "Ta mitten",
      body: "Mittrutan ingår i fyra av de åtta vinnande raderna. Ingen annan ruta är i närheten av så värdefull.",
    },
    {
      title: "Hota två rader samtidigt",
      body: "En ruta som skapar två hot på en gång går inte att försvara. Det är den enda vinstmetod som finns mot en spelare som försvarar rätt.",
    },
    {
      title: "Försvara innan du bygger",
      body: "Två av motståndarens markeringar i en rad måste blockeras direkt, hur bra ditt eget drag än ser ut.",
    },
  ],

  teaches: [
    {
      title: "Att tänka ett drag framåt",
      body: "Vad händer om jag lägger här? Frågan är liten nog för en femåring och är exakt samma fråga som schack ställer.",
    },
    {
      title: "Att känna igen ett hot",
      body: "Två i rad betyder att något måste göras nu. Att se det utan att någon pekar är ett verkligt steg.",
    },
    {
      title: "Att ett spel kan vara löst",
      body: "Perfekt spel ger alltid remi. Att förstå det är en tidig och nyttig insikt om vad spel egentligen är.",
    },
  ],

  ages: [
    {
      title: "Fyra år, på lätt",
      body: "Nio rutor och inget att läsa. Datorn drar slumpmässigt, så ett barn vinner ofta och förstår varför.",
    },
    {
      title: "Sex år, på medel",
      body: "Datorn spelar optimalt ungefär varannan gång, så den går att slå men inte alltid. Det är den nivå som håller längst.",
    },
    {
      title: "Alla åldrar, två spelare",
      body: "En enhet, två personer. Det är det enda läget som inte blir uttömt efter en vecka.",
    },
  ],

  accessibility:
    "Varje ruta är en riktig knapp vars etikett säger var den ligger och vad som står i den, så spelet går att spela med tangentbord och läses upp av en skärmläsare. Markeringarna skiljs åt av form och inte bara av färg, så färgen aldrig är ensam bärare. Ingenting kräver att du drar, och det finns ingen tidsgräns på ett drag.",

  together: [
    {
      title: "Bäst av fem",
      body: "Ett enskilt parti är för kort för att kännas som något. Fem i rad blir genast en match.",
    },
    {
      title: "Låt barnet börja",
      body: "Den som börjar har en verklig fördel, och att ge bort den är ett sätt att jämna ut utan att spela sämre med flit.",
    },
    {
      title: "Sikta på remi",
      body: "Utmana varandra att spela så att ingen kan vinna. Det är svårare än det låter och lär ut mer än att vinna.",
    },
  ],

  faq: [
    {
      q: "Går det att vinna mot den svåra nivån?",
      a: "Nej. Över 3 000 partier gav en slumpspelare 0 vinster, 21,7 procent remier och 78,3 procent förluster. Remi är det bästa som finns.",
    },
    {
      q: "Hur skiljer sig nivåerna?",
      a: "Den lätta drar slumpmässigt, den mellersta spelar optimalt ungefär varannan gång och den svåra räknar igenom hela partiet.",
    },
    {
      q: "Vad mäter rekordet?",
      a: "Den längsta raden av vinster i följd på samma nivå. Byter du nivå börjar sviten om.",
    },
    {
      q: "Kan två personer spela på samma enhet?",
      a: "Ja. Läget för två spelare kräver varken konto eller uppkoppling mellan er.",
    },
    {
      q: "Hur många partier finns det?",
      a: "255 168 kompletta partier. Perfekt spel från båda sidor slutar alltid oavgjort.",
    },
    {
      q: "Kostar det något?",
      a: "Nej. Gratis, utan konto och utan annonser, och det fungerar offline när sidan har laddat en gång.",
    },
  ],

  keywords: ["luffarschack", "tre i rad", "två spelare", "klassiker", "barn", "gratis"],
};
