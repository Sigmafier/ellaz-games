import type { GameCopy } from "../../types";

/** Svenska, från `node scripts/brief.mjs sv onestroke`. Siffrorna kommer ur
 *  `scripts/sim/onestroke-paths.mjs` och spelets `logic.ts`. */
export const onestrokeSv: GameCopy = {
  name: "En enda linje",
  metaTitle: "En enda linje - täck brädet utan att lyfta fingret | Ellaz",
  metaDescription:
    "Dra en linje genom varje öppen ruta utan att korsa dig själv eller lyfta fingret. Tre rutnät, från 5x5 till 7x7. Gratis, utan konto.",

  lede: "En linje börjar på en markerad ruta och måste besöka varje öppen ruta exakt en gång, utan att lyftas och utan att korsa sig själv.",

  body: [
    "Tre rutnät. Väggar ökar med storleken: 2, 6 och 11. Väggarna sätter det verkliga antalet öppna rutor till 23, 30 respektive 38, och 38 av 49 rutor är 77,6 procent av hela det svåra brädet, vilket betyder att bara lite mer än en femtedel är stängt.",
    "Varje lösning är exakt lika lång.",
    "Eftersom linjen måste besöka varje öppen ruta exakt en gång är svaret alltid 22, 29 eller 37 steg beroende på rutnät, aldrig fler och aldrig färre. Det gör spelet till en ren fråga om ORDNING snarare än om att hitta en genväg.",
    "Två enkla strategier. Testade och mätta. Att alltid gå till den första lediga rutan som råkar synas klarar bara 6,3 procent av de svåra bräderna, även om den täcker 60 procent av vägen innan den kör fast. Att i stället alltid välja den trångaste rutan, den med minst antal öppna utgångar, klarar 50,7 procent, mer än åtta gånger så bra. Det säger något viktigt: att lösa den trängsta delen av brädet först, medan alternativen fortfarande finns kvar, är den verkliga tekniken.",
    "Den ärliga begränsningen är att 40,6 procent av de svåra bräderna innehåller minst en ruta med bara en enda öppen granne, en punkt där ett fel val tidigare i linjen gör resten omöjlig utan att spelaren ser det förrän det är för sent.",
  ],

  howToPlay: [
    {
      title: "Börja på den markerade rutan",
      body: "En ruta är märkt som start. Dra därifrån in i en angränsande öppen ruta.",
    },
    {
      title: "Fortsätt utan att lyfta",
      body: "Linjen får inte lyftas och inte korsa sig själv. Varje ny ruta måste vara en granne till den förra.",
    },
    {
      title: "Täck varje öppen ruta",
      body: "Pusslet är löst när linjen har besökt varje öppen ruta exakt en gång, ingen fler och ingen färre.",
    },
    {
      title: "Byt rutnät i raden ovanför",
      body: "Fler väggar betyder fler trånga punkter att lösa tidigt. Rekordet är tid, och mindre är bättre.",
    },
  ],

  tips: [
    {
      title: "Lös de trångaste rutorna först",
      body: "En strategi som prioriterar rutor med få utgångar klarade 50,7 procent av de svåra bräderna, mot bara 6,3 procent för att bara följa det som ligger närmast.",
    },
    {
      title: "Leta efter rutor med en enda utgång",
      body: "Över 40 procent av de svåra bräderna har minst en sådan ruta, och den måste besökas vid rätt tillfälle eller blir den omöjlig.",
    },
    {
      title: "Planera baklänges från slutet också",
      body: "Att tänka på var linjen måste sluta, inte bara var den börjar, gör det lättare att undvika att stänga in sig själv.",
    },
  ],

  teaches: [
    {
      title: "Att lösa det svåraste först",
      body: "Att ta hand om de trängsta valen medan alternativ ännu finns är en strategi som fungerar långt utanför spelet.",
    },
    {
      title: "Att se en fälla innan den slår igen",
      body: "En ruta med bara en väg in är en fälla som göms tills det är för sent, om den inte upptäcks i förväg.",
    },
    {
      title: "Systematisk sökning",
      body: "Att pröva en väg, se att den kör fast, och backa till en tidigare punkt är precis hur riktig problemlösning fungerar.",
    },
  ],

  ages: [
    {
      title: "Sex år, på 5x5",
      body: "23 öppna rutor och bara 2 väggar. En bra första introduktion till att dra en linje med avsikt.",
    },
    {
      title: "Nio år, på 6x6",
      body: "30 öppna rutor och fler trånga punkter. Ungefär där strategin att lösa det svåraste först börjar löna sig märkbart.",
    },
    {
      title: "Vuxen, på 7x7",
      body: "38 öppna rutor, och nästan hälften av bräden innehåller en riktig fälla. Ett genomtänkt pussel för den som gillar logik.",
    },
  ],

  accessibility:
    "Varje ruta är märkt med sin kolumn, rad och om den redan är besökt, så pusslet går att lösa med tangentbord och läses upp av en skärmläsare. Linjen visas med en tydlig kontrast mot bakgrunden. Det finns ingen tidsgräns utöver det rekordet mäter, och ett steg går att ångra innan draget bekräftas.",

  together: [
    {
      title: "En ser hela brädet, en drar",
      body: "Den ena pekar ut vilken ruta som är trängst just nu, den andra drar linjen dit. Att lita på en annans överblick är svårare än det låter.",
    },
    {
      title: "Hitta fällan tillsammans",
      body: "Leta gemensamt efter en ruta med bara en utgång innan ni börjar dra. Att hitta den i förväg är halva pusslet löst.",
    },
    {
      title: "Tävla om tiden",
      body: "Samma rutnät, två enheter, och en jämförelse efteråt. Rekordet sparas per storlek på varje enhet för sig.",
    },
  ],

  faq: [
    {
      q: "Hur lång är lösningen?",
      a: "Alltid exakt en ruta kortare än antalet öppna rutor: 22, 29 eller 37 steg beroende på rutnät. Linjen ska besöka varje öppen ruta exakt en gång.",
    },
    {
      q: "Kan linjen korsa sig själv?",
      a: "Nej. Varje ruta besöks bara en gång, och linjen får inte lyftas mellan stegen.",
    },
    {
      q: "Finns det alltid en fälla?",
      a: "Inte alltid, men ofta: 40,6 procent av de svåra bräderna har minst en ruta med bara en öppen väg in.",
    },
    {
      q: "Vilka rutnät finns?",
      a: "5x5 med 2 väggar, 6x6 med 6 och 7x7 med 11.",
    },
    {
      q: "Vad mäter rekordet?",
      a: "Tiden det tog att lösa brädet, och mindre är bättre. Rekordet sparas per rutnät.",
    },
    {
      q: "Kostar det något?",
      a: "Nej. Gratis, utan konto och utan annonser, och det fungerar offline när sidan har laddat en gång.",
    },
  ],

  keywords: ["en linje", "rutnät", "logik", "pussel", "väg", "gratis"],
};
