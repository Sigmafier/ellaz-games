import type { GameCopy } from "../../types";

/** Svenska, från `node scripts/brief.mjs sv hidden`. Antalen kommer ur
 *  `src/games/hidden/Hidden.tsx`. Inget här är översatt. */
export const hiddenSv: GameCopy = {
  name: "Hitta mig",
  metaTitle: "Hitta mig - leta bland många saker | Ellaz",
  metaDescription:
    "Ett djur göms bland många andra. Leta upp det 3, 4 eller 5 gånger per omgång, på 16, 24 eller 32 saker. Gratis i webbläsaren.",

  lede: "En sak visas högst upp, och sedan ska du hitta den bland alla de andra. Tre nivåer med 16, 24 eller 32 saker på skärmen.",

  body: [
    "Spelet visar vad du letar efter och fyller sedan skärmen med saker. På lätt ligger 16 där och du ska hitta 3 av dem. På medel är det 24 saker och 4 att hitta. På svår 32 och 5. Det som gör det svårt är inte antalet i sig utan att grannarna liknar den du söker, så ögat måste jämföra i stället för att bara känna igen.",
    "Varje omgång byggs ny.",
    "Positionerna slumpas fram varje gång i stället för att hämtas ur ett fast antal färdiga bilder. Det betyder att ingen omgång går att lära sig utantill, och att spelet inte tar slut. Rekordet räknas i antal klarade omgångar, fler är bättre, och varje nivå har sitt eget så att en lätt omgång aldrig ställs mot en svår.",
    "Det finns ingen klocka. Ett fel tryck gör att saken skakar till och sedan väntar spelet igen, vilket är hela straffet. Den ärliga begränsningen är att svår mest skiljer sig från medel genom att det är trängre på skärmen: reglerna är desamma, och på en liten telefon kan 32 saker bli mer en fråga om precision än om uppmärksamhet.",
  ],

  howToPlay: [
    {
      title: "Titta på saken högst upp",
      body: "Den visas ensam, stor, ovanför resten. Det är den du letar efter, och den byts ut varje gång du har hittat en.",
    },
    {
      title: "Leta rätt på den nedanför",
      body: "Samma sak finns någonstans bland de andra. Ett tryck räcker, och du behöver inte träffa exakt mitt på.",
    },
    {
      title: "Klara hela omgången",
      body: "Tre, fyra eller fem fynd beroende på nivå. När den sista är hittad byggs en ny omgång med nya platser.",
    },
    {
      title: "Byt nivå i raden ovanför",
      body: "Lätt, medel och svår ändrar både hur många saker som ligger på skärmen och hur många du ska hitta. Rekordet följer nivån.",
    },
  ],

  tips: [
    {
      title: "Lås fast en detalj",
      body: "Titta inte på hela saken utan på en enda sak hos den: en färg på örat, en form på svansen. Ögat hittar en detalj mycket fortare än en helhet.",
    },
    {
      title: "Sök i rader",
      body: "Gå igenom skärmen rad för rad i stället för att titta överallt samtidigt. På 32 saker är det skillnaden mellan tio sekunder och en halv minut.",
    },
    {
      title: "Titta igen efter ett fynd",
      body: "Nästa sak att leta efter visas direkt, men resten av skärmen står kvar. Att komma ihåg var du redan har tittat sparar hela nästa sökning.",
    },
  ],

  teaches: [
    {
      title: "Att känna igen en form bland liknande",
      body: "Att skilja det man söker från något som nästan är likadant är en annan uppgift än att känna igen något i tomhet, och den är svårare.",
    },
    {
      title: "Att söka med en metod",
      body: "Rad för rad slår slumpmässigt tittande, och skillnaden blir tydlig så fort det ligger 24 saker på skärmen.",
    },
    {
      title: "Att hålla kvar uppmärksamheten",
      body: "Fem fynd i rad utan klocka betyder att koncentrationen är det enda som avgör. Det är en övning som märks på hur länge ett barn orkar.",
    },
  ],

  ages: [
    {
      title: "Tre år, på lätt",
      body: "16 saker och 3 att hitta. Det finns inga ord i spelet, så ett barn som inte läser klarar det helt själv.",
    },
    {
      title: "Fem år, på medel",
      body: "24 saker börjar kräva att man letar i ordning i stället för att svepa med blicken. Det är där metoden blir värd något.",
    },
    {
      title: "Sju år och uppåt",
      body: "32 saker på svår är trångt nog att bli en riktig uppgift, och rekordet i antal omgångar ger något att jaga.",
    },
  ],

  accessibility:
    "Allt görs med tryck och ingenting kräver att du drar. Träffytorna är stora nog för en liten hand, och det finns ingen klocka, så ingen förlorar något på att behöva längre tid. Sakerna skiljer sig åt i form och inte bara i färg, vilket gör att spelet går att klara av den som ser färg annorlunda. Ljudet går att stänga av och spelet fungerar lika bra utan det.",

  together: [
    {
      title: "En sak var",
      body: "Turas om att hitta ett fynd i samma omgång. Det går fort och alla får göra något varje varv.",
    },
    {
      title: "Dela skärmen",
      body: "En letar i övre halvan och en i nedre. På svår med 32 saker är det märkbart snabbare, och det lär ut metoden på köpet.",
    },
    {
      title: "Ge en ledtråd med ord",
      body: "Den som ser fyndet får bara beskriva var det ligger. Att säga nere till höger i stället för att peka är hela övningen.",
    },
  ],

  faq: [
    {
      q: "Hur många saker ligger på skärmen?",
      a: "16 på lätt, 24 på medel och 32 på svår. Du ska hitta 3, 4 respektive 5 av dem.",
    },
    {
      q: "Tar spelet slut?",
      a: "Nej. Varje omgång byggs ny med slumpade platser, så det fortsätter så länge du vill.",
    },
    {
      q: "Går samma omgång att lära sig utantill?",
      a: "Nej, eftersom ingenting hämtas ur färdiga bilder. Platserna är nya varje gång.",
    },
    {
      q: "Finns det någon tidsgräns?",
      a: "Nej, och ett fel tryck kostar ingenting mer än att saken skakar till.",
    },
    {
      q: "Var sparas rekordet?",
      a: "På enheten själv, ett per nivå. Det ligger inte på någon server.",
    },
    {
      q: "Fungerar det på telefon?",
      a: "Ja. På svår blir det trångt på en liten skärm, så där är medel ofta trevligare.",
    },
  ],

  keywords: ["hitta", "leta", "djur", "barn", "uppmärksamhet", "bilder"],
};
