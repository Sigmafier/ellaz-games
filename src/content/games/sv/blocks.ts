import type { GameCopy } from "../../types";

/** Svenska, från `node scripts/brief.mjs sv blocks`. Botsiffrorna kommer ur
 *  `scripts/sim/blocks-rows.mjs`, poängen ur spelets `logic.ts`. */
export const blocksSv: GameCopy = {
  name: "Klossar",
  metaTitle: "Klossar - fallande klossar i webbläsaren | Ellaz",
  metaDescription:
    "Vrid och styr fallande klossar, fyll en rad och den försvinner. Tre nivåer, från fyra snälla former till elva i full fart. Gratis och utan konto.",

  lede: "Klossar faller. Vrid dem och styr dem i sidled så att en hel rad fylls, för då försvinner raden och allt ovanför sjunker ned.",

  body: [
    "Tre nivåer, tre olika spel. Det är inte samma spel i tre hastigheter. Lugn har 4 former på ett bräde som är 8 rutor brett och 14 högt, och klossen faller ett steg i sekunden. Normal har 9 former på 10 gånger 18. Snabb har 11 former och pressar ned falltiden mot 140 millisekunder, vilket är snabbare än de flesta hinner tänka.",
    "Vi lät en bot spela.",
    "Boten lägger varje kloss där den lämnar minst hål. Mer avancerad än så är den inte. Den överlevde 100 procent av sina omgångar på Lugn och 99,3 procent på Normal, men 0 procent på Snabb, där den klarade i snitt 78 rader innan högen nådde taket. Det säger något om vad nivåerna faktiskt mäter: på de två första är det städning, på den tredje är det handhastighet, och ingen mängd planering räddar dig när klossen är nere innan du har bestämt dig.",
    "Som kontroll fick en bot som lägger varje kloss på måfå spela samma bräde. Den dör efter ungefär 20 klossar på Normal utan att ha rensat en enda rad. Skillnaden mellan den och den städande boten är hela spelet, och den består av ett enda beslut per kloss.",
    "Poängen är gjord för att belöna tålamod. Att vänta betalar sig. En rad ger 10 poäng, två samtidigt ger 30, tre ger 60 och fyra ger 100, alltså två och en halv gånger så mycket som fyra enskilda rader. Att släppa en kloss hela vägen ned ger dessutom en poäng per rad den faller. Den ärliga begränsningen är att Snabb inte är rolig för alla. Den är gjord för någon som redan kan spelet, och om den känns orimlig är det inte ett tecken på att du gör fel utan på att du spelar fel nivå.",
  ],

  howToPlay: [
    {
      title: "Styr i sidled",
      body: "Pilarna under brädet eller piltangenterna flyttar klossen ett steg åt gången. Håll inne för att fortsätta.",
    },
    {
      title: "Vrid klossen",
      body: "Vridknappen roterar formen ett kvarts varv. En kloss som inte får plats när den vrids stannar där den är.",
    },
    {
      title: "Fyll en hel rad",
      body: "En rad utan hål försvinner och allt ovanför sjunker ned. Fyra rader på en gång ger 100 poäng.",
    },
    {
      title: "Släpp när du är säker",
      body: "Släppknappen skickar klossen rakt ned och ger en poäng per rad den faller. Det går inte att ångra.",
    },
  ],

  tips: [
    {
      title: "Håll ytan platt",
      body: "Ett hål under en kloss kostar dig varje rad ovanför det. Den städande boten gör ingenting annat än det här, och den överlever 99,3 procent av sina omgångar på Normal.",
    },
    {
      title: "Titta på nästa kloss",
      body: "Rutan bredvid visar vad som kommer. Att lägga den här klossen med nästa i åtanke är skillnaden mellan att överleva och att bygga en trappa.",
    },
    {
      title: "Spara en kolumn för de långa",
      body: "En tom kolumn längst ut betalar sig i det ögonblick en rak kloss kommer, eftersom fyra rader samtidigt ger 100 poäng i stället för 40.",
    },
  ],

  teaches: [
    {
      title: "Att planera ett steg framåt",
      body: "Nästa kloss syns, så varje drag har en känd följd. Det är den enklaste formen av planering som finns, och den går att öva.",
    },
    {
      title: "Rotation i huvudet",
      body: "Att se hur en form ser ut vridd innan man vrider den är rumslig förmåga i rent tillstånd.",
    },
    {
      title: "Att välja mellan säkert och lönsamt",
      body: "En rad direkt eller vänta på fyra. Avvägningen finns i varje omgång och har inget rätt svar.",
    },
  ],

  ages: [
    {
      title: "Sex år, på Lugn",
      body: "Fyra snälla former och en sekund mellan stegen. Ett barn hinner titta, tänka och trycka utan att bli jagat.",
    },
    {
      title: "Tio år, på Normal",
      body: "9 former på ett bräde som är 10 rutor brett. Ungefär där det börjar handla om var man lägger klossen och inte bara om att hinna.",
    },
    {
      title: "Vuxen, på Snabb",
      body: "11 former och ned mot 140 millisekunder per steg. Den städande boten klarade 0 procent här, så du är i gott sällskap.",
    },
  ],

  accessibility:
    "Alla kontroller är riktiga knappar med egna etiketter, så spelet går att styra med tangentbord och knapparna läses upp av en skärmläsare. Ingenting kräver att du drar. Formerna skiljs åt av både färg och form, så färgen aldrig är ensam bärare, och rutnätet har tydliga kanter mellan rutorna. Det finns ingen klocka utöver falltakten, och nivån går att byta mitt i.",

  together: [
    {
      title: "En vrider, en styr",
      body: "Dela upp knapparna mellan er. Det är svårare än att spela ensam och betydligt roligare.",
    },
    {
      title: "Säg var klossen ska",
      body: "Den ena bestämmer kolumn och den andra utför. Att behöva förklara valet gör det bättre.",
    },
    {
      title: "Jaga fyra rader",
      body: "Kom överens om att bara rensa när fyra rader är fyllda. Poängen blir högre och omgången kortare.",
    },
  ],

  faq: [
    {
      q: "Vad är skillnaden mellan nivåerna?",
      a: "Antal former, brädets storlek och falltakten. Lugn har 4 former på 8 gånger 14, Normal 9 former på 10 gånger 18, och Snabb 11 former i full fart.",
    },
    {
      q: "Hur mycket ger en rad?",
      a: "10 poäng för en, 30 för två samtidigt, 60 för tre och 100 för fyra. Att vänta lönar sig alltså.",
    },
    {
      q: "Får jag mynt av att spela?",
      a: "Ja, med jämna mellanrum, ungefär var femte rensad rad. Mynten går att använda i rummet.",
    },
    {
      q: "Kan jag ångra ett släpp?",
      a: "Nej. Ett släpp är slutgiltigt, vilket är avsiktligt: det är det enda draget i spelet som är snabbare än att tänka.",
    },
    {
      q: "Sparas mitt rekord?",
      a: "Ja, ett per nivå, på enheten själv. Poäng är måttet och mer är bättre.",
    },
    {
      q: "Kostar det något?",
      a: "Nej. Gratis, utan konto och utan annonser, och det fungerar offline när sidan har laddat en gång.",
    },
  ],

  keywords: ["klossar", "fallande klossar", "rader", "pussel", "klassiker", "gratis"],
};
