import type { GameCopy } from "../../types";

/** Français. Les chiffres viennent de `src/games/piano/logic.ts` et `sound.ts`. */
export const pianoFr: GameCopy = {
  name: "Piano",
  metaTitle: "Piano en ligne gratuit - jouer et apprendre | Ellaz",
  metaDescription:
    "Un piano gratuit dans le navigateur, sur mobile, tablette et ordinateur. Trois claviers, de dix touches colorées à deux octaves avec pédale, et cinq comptines.",

  lede: "Un piano gratuit dans le navigateur. On touche une touche et elle sonne, avec autant de doigts qu'on veut, ou depuis le clavier de l'ordinateur. En mode chansons, il allume la touche suivante et vous attend, sans chrono et sans fausse note qui coûte quoi que ce soit.",

  body: [
    "Le sélecteur de niveau choisit un clavier, rien de plus. Le clavier de base, ce sont dix touches blanches, du do du milieu jusqu'au mi de l'octave suivante, chacune de sa couleur et avec son nom écrit dessus. Le Plus garde la même étendue et ajoute les sept touches noires, soit 17 touches. Le clavier pro, sur un ordinateur, en compte 25 : deux octaves entières qui montent ou descendent d'une octave à la fois, de C2 à C7, avec une pédale de sustain et un interrupteur pour les noms des notes.",

    "Sur un téléphone, le pro reste à 17 touches. C'est voulu.",

    "Vingt-cinq touches sur un écran de téléphone, ce serait une rangée de touches qu'aucun doigt ne vise.",

    "Le mode chansons propose cinq airs traditionnels, et Les roues de l'autobus avec Frère Jacques ouvrent la liste. La plus courte, Petit Jean, fait 24 notes ; la plus longue, Ah vous dirai-je maman, en fait 42. Toutes les notes des cinq tombent sur des touches blanches entre do et mi, donc chaque chanson se joue sur le clavier de dix touches. Les tests du jeu le vérifient, chanson par chanson et clavier par clavier. Une autre touche ? Elle sonne, tout simplement. La chanson attend toujours la même note, et la bonne touche frétille un peu pour se signaler.",

    "L'aveu, maintenant : il n'y a pas de score. Le jeu libre ne garde aucun record, comme la boîte à musique et le coloriage, parce que la seule façon de classer un enfant qui joue d'un instrument, c'est de le juger. Finir une chanson rapporte des pièces et une étoile, et personne ne chronomètre.",
  ],

  howToPlay: [
    { title: "Touchez une touche", body: "Chaque toucher sonne. Posez plusieurs doigts pour un accord, ou glissez le long du clavier." },
    { title: "Choisissez un clavier", body: "Base, Plus ou Pro. Chaque cran ajoute des touches et retire de l'aide." },
    { title: "Passez aux chansons", body: "Choisissez un air et jouez la touche qui s'allume. La bande du haut montre les notes à venir." },
    { title: "Écoutez d'abord", body: "Le bouton d'écoute joue la chanson à 100 temps par minute et allume chaque touche au passage." },
    { title: "Jouez au clavier", body: "Sur ordinateur, la rangée A S D F donne les blanches et celle du dessus les noires. En pro, Z et X changent d'octave." },
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
    { title: "Adultes", body: "Le pro sur ordinateur : deux octaves, la pédale, et tout au clavier." },
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
    { q: "Peut-on jouer de ce piano sur un téléphone ?", a: "Oui. Les touches sont faites pour le tactile et acceptent plusieurs doigts. Sur téléphone, le plus grand clavier fait 17 touches pour qu'elles restent larges." },
    { q: "Peut-on jouer avec le clavier de l'ordinateur ?", a: "Oui. A S D F G H J K L sont les blanches, W E T Y U O P les noires. Sur le clavier pro, Z et X descendent et montent d'une octave." },
    { q: "Quelles chansons peut-on apprendre ?", a: "Les roues de l'autobus, Frère Jacques, Ah vous dirai-je maman, Petit Jean et le thème de l'Hymne à la joie. Que des airs traditionnels." },
    { q: "Que se passe-t-il si on appuie sur la mauvaise touche ?", a: "Elle sonne comme les autres et la chanson attend toujours la bonne note. Pas de punition, pas de vies, pas de points." },
    { q: "Quelle différence entre les trois claviers ?", a: "Base : dix touches blanches colorées. Plus : 17 touches avec les noires. Pro : 25 touches sur ordinateur, changement d'octave et pédale." },
    { q: "Y a-t-il une pédale ?", a: "Oui, un bouton de pédale sur tous les claviers. Activée, chaque note dure environ trois fois plus." },
    { q: "Faut-il télécharger quelque chose ?", a: "Non. Tout se passe dans le navigateur, gratuitement et sans inscription, et après la première visite ça marche aussi hors ligne." },
  ],

  keywords: ["piano en ligne", "piano gratuit", "piano virtuel", "piano pour enfants", "apprendre le piano", "comptines au piano"],
};
