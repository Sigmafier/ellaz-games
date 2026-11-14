import type { GameCopy } from "../../types";

/** Français. Les chiffres viennent de `src/games/piano/logic.ts` et `sound.ts`. */
export const pianoFr: GameCopy = {
  name: "Piano",
  metaTitle: "Piano en ligne gratuit - jouer et apprendre | Ellaz",
  metaDescription:
    "Un piano gratuit dans le navigateur, sur mobile, tablette et ordinateur. Trois claviers, de dix touches colorées à cinq octaves qui défilent, et 16 airs.",

  lede: "Un piano gratuit dans le navigateur. On touche une touche et elle sonne, avec autant de doigts qu'on veut, ou depuis le clavier de l'ordinateur. En mode chansons, il allume la touche suivante et vous attend, sans chrono et sans fausse note qui coûte quoi que ce soit.",

  body: [
    "Le sélecteur de niveau choisit un clavier, rien de plus. Le clavier de base, ce sont dix touches blanches, du do du milieu jusqu'au mi de l'octave suivante, chacune de sa couleur et avec son nom écrit dessus, et il ne bouge pas. Le Plus couvre trois octaves, de C3 à C6 : 37 touches avec les noires. Le pro en couvre cinq, de C2 à C7, soit 61 touches.",

    "Ces deux-là dépassent l'écran. C'est voulu.",

    "Une touche blanche ne descend jamais sous 36 pixels sur un écran tactile (26 pour le pro sur un écran large), comme sur les pianos en ligne : un écran plus large montre simplement plus de touches, et une carte de tout le clavier, au-dessus des touches, fait glisser le reste. Un téléphone tenu droit montre une dizaine de touches blanches ; couché, ou avec le piano plein écran, plus du double.",

    "Le mode chansons propose 16 airs, et Les roues de l'autobus avec Frère Jacques ouvrent la liste. Huit airs faciles se jouent sur tous les claviers ; huit classiques, qui demandent les noires et plus de place, apparaissent dès le Plus : la Lettre à Élise, Greensleeves, le Canon de Pachelbel, la Marche turque, la Petite musique de nuit, Dans l'antre du roi de la montagne, la Gymnopédie n° 1 de Satie et Au matin de Grieg. Le plus court fait 18 notes ; le plus long, Vive le vent, en fait 51. Les tests du jeu vérifient que chaque air tient sur chaque clavier où il figure, et le clavier défile tout seul jusqu'à la note suivante. Une autre touche ? Elle sonne, tout simplement. La chanson attend toujours la même note, et la bonne touche frétille un peu pour se signaler.",

    "L'aveu, maintenant : il n'y a pas de score. Le jeu libre ne garde aucun record, comme la boîte à musique et le coloriage, parce que la seule façon de classer un enfant qui joue d'un instrument, c'est de le juger. Finir une chanson rapporte des pièces et une étoile, et personne ne chronomètre.",
  ],

  howToPlay: [
    { title: "Touchez une touche", body: "Chaque toucher sonne. Posez plusieurs doigts pour un accord, ou glissez le long du clavier." },
    { title: "Choisissez un clavier", body: "Base, Plus ou Pro. Chaque cran ajoute des touches et retire de l'aide." },
    { title: "Passez aux chansons", body: "Choisissez un air et jouez la touche qui s'allume. La bande du haut montre les notes à venir." },
    { title: "Écoutez d'abord", body: "Le bouton d'écoute joue la chanson à 100 temps par minute et allume chaque touche au passage." },
    { title: "Jouez au clavier", body: "Sur ordinateur, la rangée A S D F donne les blanches et celle du dessus les noires, à partir du premier do à l'écran. Z et X déplacent un long clavier d'une octave." },
  ],

  tips: [
    { title: "Écouter avant de jouer", body: "Un air déjà entendu se joue beaucoup mieux. L'oreille sait où il va, le doigt n'a plus qu'à trouver la touche." },
    { title: "Suivre les couleurs", body: "Sur le clavier de base, chaque note a sa couleur, et la note suivante de la bande porte la même. Un enfant qui ne lit pas encore peut assortir les couleurs." },
    { title: "Monter quand c'est facile", body: "En Plus, la touche suivante n'a plus qu'un petit point ; en pro, plus rien. Même chanson, mais il faut la connaître." },
    { title: "La pédale pour les airs lents", body: "Avec la pédale, chaque note dure environ trois fois plus. Les accords sonnent grand, les passages rapides deviennent flous." },
  ],

  teaches: [
    { title: "Grave et aigu", body: "À gauche le grave, à droite l'aigu. Quelques minutes au clavier et l'idée reste." },
    { title: "Le nom des notes", body: "Do, ré, mi sont écrits sur les touches et dans la bande, et s'apprennent à l'usage." },
    { title: "Une mélodie, pas à pas", body: "Attendre une note à la fois transforme la chanson en étapes qu'un enfant sent l'une après l'autre." },
    { title: "Persévérer sans pression", body: "Pas de chrono, pas de partie perdue : recommencer ne coûte rien." },
  ],

  ages: [
    { title: "3 à 4 ans", body: "Le clavier de base en jeu libre. Chaque toucher fait un son, et cela suffit." },
    { title: "5 à 7 ans", body: "Les chansons sur le clavier de base, la touche suivante qui brille. Les roues de l'autobus pour commencer." },
    { title: "8 ans et plus", body: "Le clavier Plus, puis les mêmes chansons avec un simple point comme indice." },
    { title: "Adultes", body: "Le pro sur ordinateur : cinq octaves, la pédale, et tout au clavier." },
  ],

  accessibility:
    "Chaque touche sonne d'un seul toucher, sans glisser ni maintenir, donc le jeu fonctionne avec un contacteur ou une autre aide à la saisie. Glisser le long des touches est un bonus, jamais une obligation. Chaque touche est un vrai bouton portant le nom de sa note, atteignable au clavier et jouable avec Entrée. Il n'y a aucun minuteur. Pour être franc : c'est un instrument, et sans le son on en perd beaucoup. Les couleurs, les noms et la bande montrent ce qui se joue, sans remplacer l'oreille. L'écoute s'arrête d'elle-même quand on change d'onglet.",

  together: [
    { title: "À quatre mains", body: "L'un joue la mélodie en mode chansons, l'autre ajoute une note grave à chaque respiration." },
    { title: "Devinez l'air", body: "L'un joue en jeu libre le début d'une chanson qu'il connaît, l'autre devine." },
    { title: "Chanter ensemble", body: "Lancez l'écoute et chantez par-dessus, puis l'enfant joue lentement et l'adulte suit son rythme." },
    { title: "Chacun son tour", body: "Chacun joue une phrase et passe la main. Petit Jean en compte huit, toutes courtes." },
  ],

  faq: [
    { q: "Peut-on jouer de ce piano sur un téléphone ?", a: "Oui. Les touches sont faites pour le tactile et acceptent plusieurs doigts. En Plus et en pro, le clavier dépasse l'écran : faites glisser la carte au-dessus des touches, ou tournez le téléphone pour en voir davantage." },
    { q: "Peut-on jouer avec le clavier de l'ordinateur ?", a: "Oui. A S D F G H J K L sont les blanches, W E T Y U O P les noires, à partir du premier do à l'écran. En Plus et en pro, Z et X descendent et montent d'une octave." },
    { q: "Quelles chansons peut-on apprendre ?", a: "Huit airs faciles sur tous les claviers : Les roues de l'autobus, Frère Jacques, Ah vous dirai-je maman, Petit Jean, l'Hymne à la joie, la Berceuse de Brahms, Vive le vent et le Largo du Nouveau Monde de Dvořák. Dès le Plus, huit classiques s'y ajoutent. Que des airs traditionnels ou tombés dans le domaine public." },
    { q: "Que se passe-t-il si on appuie sur la mauvaise touche ?", a: "Elle sonne comme les autres et la chanson attend toujours la bonne note. Pas de punition, pas de vies, pas de points." },
    { q: "Quelle différence entre les trois claviers ?", a: "Base : dix touches blanches colorées qui ne bougent pas. Plus : trois octaves, 37 touches avec les noires. Pro : cinq octaves, 61 touches." },
    { q: "Y a-t-il une pédale ?", a: "Oui, un bouton de pédale sur tous les claviers. Activée, chaque note dure environ trois fois plus." },
    { q: "Faut-il télécharger quelque chose ?", a: "Non. Tout se passe dans le navigateur, gratuitement et sans inscription, et après la première visite ça marche aussi hors ligne." },
  ],

  keywords: ["piano en ligne", "piano gratuit", "piano virtuel", "piano pour enfants", "apprendre le piano", "comptines au piano"],
};
