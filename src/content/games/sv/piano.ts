import type { GameCopy } from "../../types";

/** Svenska. Siffrorna kommer ur spelets egen `logic.ts` och `sound.ts`. */
export const pianoSv: GameCopy = {
  name: "Piano",
  metaTitle: "Gratis piano online - spela och lär dig barnsånger | Ellaz",
  metaDescription:
    "Ett gratis piano i webbläsaren för mobil, surfplatta och dator. Tre klaviaturer, från tio färgade tangenter till två oktaver med pedal, och fem barnsånger.",

  lede: "Ett gratis piano i webbläsaren. Tryck på en tangent så låter den, med så många fingrar du vill, eller spela från datorns tangentbord. I sångläget lyser nästa tangent och pianot väntar på dig, utan klocka och utan straff.",

  body: [
    "Tryck. Det låter.",

    "Nivåvalet väljer bara en klaviatur. Bas är tio vita tangenter från mitt-C upp till E en oktav och en ters ovanför, var och en i sin egen färg och med tonnamnet utskrivet. Plus har samma omfång plus de sju svarta tangenterna, alltså 17 tangenter. Proffs på en dator har 25 tangenter, två hela oktaver som flyttas en oktav i taget någonstans mellan C2 och C7, med en pedal och en knapp för tonnamnen. På en telefon stannar Proffs på 17 tangenter, eftersom 25 tangenter över en telefonskärm blir tangenter som inget finger träffar.",

    "Sångläget har fem gamla melodier, och Hjulen på bussen och Broder Jakob står först. Den kortaste, Lilla Hans, har 24 toner och den längsta, Blinka lilla, har 42. Varje ton i alla fem ligger på en vit tangent mellan C och E, så varje sång går att spela på basklaviaturen med tio tangenter. Spelets tester kontrollerar det, sång för sång och klaviatur för klaviatur.",

    "Fel tangent då? Den låter som vilken tangent som helst. Sången väntar kvar på samma ton och rätt tangent vickar lite för att visa sig. Ingenting går förlorat.",

    "Det ärliga: det finns inga poäng. Fritt spel sparar inget rekord, precis som Musikrutan och målarboken, eftersom det enda sättet att ranka ett barn som spelar ett instrument är att döma det. Den som spelar klart en sång får mynt och en stjärna, och ingen tar tid.",
  ],

  howToPlay: [
    { title: "Tryck på en tangent", body: "Varje tryck låter. Sätt ner flera fingrar för ett ackord, eller dra ett finger längs tangenterna." },
    { title: "Välj klaviatur", body: "Bas, Plus eller Proffs. Varje steg upp har fler tangenter och ger mindre hjälp." },
    { title: "Byt till sånger", body: "Välj en sång och spela tangenten som lyser. Remsan ovanför visar vilka toner som kommer." },
    { title: "Lyssna först", body: "Lyssna-knappen spelar hela sången i 100 slag per minut och tänder varje tangent när den låter." },
    { title: "Spela med tangentbordet", body: "På en dator är raden A S D F de vita tangenterna och raden ovanför de svarta. I Proffs flyttar Z och X en oktav." },
  ],

  tips: [
    { title: "Hör den innan du spelar", body: "En sång du har hört en gång är mycket lättare att spela. Örat vet redan vart den ska, och fingret behöver bara hitta tangenten." },
    { title: "Matcha färgerna", body: "På basklaviaturen har varje ton en färg, och nästa ton i remsan har samma. Ett barn som inte kan läsa ännu kan para ihop färg med färg." },
    { title: "Gå upp när det blir lätt", body: "På Plus får nästa tangent bara en liten prick, och på Proffs ingenting. Samma sång, men nu måste du kunna den." },
    { title: "Pedal till långsamma låtar", body: "Med pedalen klingar varje ton ungefär tre gånger så länge. Ackord låter stort, snabba löpningar blir grumliga." },
  ],

  teaches: [
    { title: "Tonhöjd", body: "Vänster är mörkt och höger är ljust. Efter några minuter vid tangenterna sitter det." },
    { title: "Tonnamn", body: "C, D och E står på tangenterna och i remsan, så de lärs in genom att användas." },
    { title: "En melodi steg för steg", body: "Att vänta på en ton i taget gör sången till steg som ett barn känner efter varandra." },
    { title: "Tålamod utan press", body: "Ingen klocka och inget game over, så att försöka igen kostar ingenting." },
  ],

  ages: [
    { title: "3 till 4 år", body: "Basklaviaturen i fritt spel. Varje tryck blir ett ljud, och det räcker." },
    { title: "5 till 7 år", body: "Sånger på basklaviaturen med nästa tangent lysande. Hjulen på bussen är en bra första." },
    { title: "8 år och uppåt", body: "Plus-klaviaturen, sedan samma sånger med bara en prick som ledtråd." },
    { title: "Vuxna", body: "Proffs på en dator: två oktaver, pedalen och allt spelbart från tangentbordet." },
  ],

  accessibility:
    "Varje tangent spelar på ett enda tryck, utan att dra och utan att hålla, så det fungerar med kontakter och andra hjälpmedel. Att dra längs tangenterna är en bonus, aldrig ett krav. Varje tangent är en riktig knapp med tonens namn, som går att nå med tangentbordet och spela med Enter. Det finns ingen timer. Ärligt talat: det här är ett instrument, och utan ljud försvinner mycket av det. Färgerna, namnen och remsan visar vad som spelas, men de ersätter inte att höra det. Lyssningen stannar av sig själv när du byter flik.",

  together: [
    { title: "Fyrhändigt", body: "En spelar melodin i sångläget, den andra lägger till en låg ton varje gång sången andas." },
    { title: "Gissa låten", body: "En spelar början på en sång hen kan i fritt spel, den andra gissar." },
    { title: "Sjung med", body: "Starta lyssningen och sjung över den. Sedan spelar barnet långsamt och den vuxna sjunger i barnets takt." },
    { title: "Turas om", body: "Var och en spelar en fras och lämnar över. Lilla Hans har åtta korta fraser." },
  ],

  faq: [
    { q: "Går pianot att spela på mobilen?", a: "Ja. Tangenterna är gjorda för pekskärm och tar flera fingrar samtidigt. På en telefon är den största klaviaturen 17 tangenter så att de förblir breda." },
    { q: "Kan man spela med datorns tangentbord?", a: "Ja. A S D F G H J K L är de vita tangenterna och W E T Y U O P de svarta. På Proffs flyttar Z och X ner och upp en oktav." },
    { q: "Vilka sånger finns?", a: "Hjulen på bussen, Broder Jakob, Blinka lilla stjärna, Lilla Hans och temat ur Ode till glädjen. Alla är traditionella melodier." },
    { q: "Vad händer om man trycker fel?", a: "Tangenten låter som vanligt och sången väntar kvar på rätt ton. Inget straff, inga liv och inga poäng." },
    { q: "Vad skiljer de tre klaviaturerna?", a: "Bas: tio färgade vita tangenter. Plus: 17 tangenter med de svarta. Proffs: 25 tangenter på dator, oktavbyte och pedal." },
    { q: "Finns det en pedal?", a: "Ja, en pedalknapp på alla klaviaturer. Påslagen klingar varje ton ungefär tre gånger längre." },
    { q: "Måste man ladda ner något?", a: "Nej. Det körs i webbläsaren, gratis och utan konto, och efter första besöket fungerar det även offline." },
  ],

  keywords: ["piano online", "gratis piano", "virtuellt piano", "piano för barn", "barnsånger piano", "lära sig spela piano"],
};
