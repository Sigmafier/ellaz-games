import type { GameCopy } from "../../types";

/**
 * Le backgammon en francais, ecrit ici et non traduit.
 *
 * Les chiffres viennent de `src/games/backgammon/logic.ts` et de son fichier de
 * tests : la partie se joue en 5 points, un gammon vaut 2 et un backgammon 3,
 * et un double donne quatre mouvements. Le videau a ete retire le 2026-09-22,
 * donc plus rien ici n'en parle.
 */
export const backgammonFr: GameCopy = {
  name: "Backgammon",
  metaTitle: "Backgammon gratuit - un match complet en 5 points | Ellaz",
  metaDescription:
    "Backgammon gratuit dans le navigateur. Un match en 5 points avec gammon et backgammon, contre l'ordinateur ou à deux sur un appareil.",

  lede: "Un backgammon complet dans le navigateur, gratuit, joué en match à 5 points et non en partie isolée. Contre l'ordinateur à trois niveaux, ou contre la personne assise en face en lui passant l'appareil.",

  body: [
    "Vous touchez une flèche, puis l'endroit où la dame se pose. Annuler revient en arrière à l'intérieur de votre propre tour autant de fois que vous le souhaitez, donc essayer un coup ne coûte rien. Ensuite vous passez les dés. Et là, c'est joué.",

    "Les règles sont entières, et c'est précisément ce que laisse de côté presque tout le backgammon gratuit du web. Une partie isolée n'est pas une version courte du backgammon, c'est un autre jeu. Ici c'est un match en 5 points : 15 dames par camp sur 24 flèches, une dame seule qui se fait frapper et part au bar, et la course gagnée par celui qui sort ses 15 dames le premier. Un gammon compte 2 et un backgammon compte 3. Les deux dés doivent être joués dès qu'une séquence les joue tous les deux, et quand un seul peut l'être, c'est le plus grand.",

    "Un double donne quatre mouvements.",

    "Jouer un match et non une partie, c'est ce qui transforme les dés en décision. Une partie se décide en bonne part à la chance ; cinq d'affilée, beaucoup moins, et savoir qu'on est mené de deux points change les risques qui valent la peine. Le gammon est l'autre moitié de cela. Perdre sans avoir sorti une seule dame coûte 2 points au lieu de 1, et s'il vous reste en plus une dame au bar ou dans le jan intérieur adverse, cela en coûte 3. Sortir une seule dame d'une partie perdue fait donc souvent la différence entre perdre le match et y être encore.",

    "Tout est enregistré sur l'appareil, le score du match compris. Vous pouvez vous arrêter au milieu de la cinquième partie et reprendre demain. Un téléphone et une tablette tiennent deux matchs séparés, puisqu'il n'y a ici aucun compte pour les relier.",
  ],

  howToPlay: [
    {
      title: "Choisir l'adversaire",
      body: "L'ordinateur à trois niveaux, ou deux personnes qui se passent un seul appareil. Le bouton change de mode à tout moment.",
    },
    {
      title: "Lancer les dés",
      body: "Deux dés, ou quatre mouvements quand ils tombent pareils. Ce qu'il reste à jouer dans le tour est affiché en permanence.",
    },
    {
      title: "Toucher le départ, puis l'arrivée",
      body: "Seules les flèches d'où vous pouvez partir répondent au doigt. Avec une dame au bar, elle rentre d'abord et rien d'autre n'est possible.",
    },
    {
      title: "Annuler au besoin",
      body: "Annuler reprend un mouvement à l'intérieur de votre tour. Une fois les dés passés, le bouton ne vous sert plus.",
    },
    {
      title: "Sortir ses dames",
      body: "Quand vos 15 dames sont au jan intérieur, la sortie commence, et le premier à tout sortir emporte la partie.",
    },
  ],

  tips: [
    {
      title: "Comptez les pips avant de choisir",
      body: "L'écart entre les deux comptes vous dit à quelle partie vous jouez. Largement devant, courez. Largement derrière, arrêtez de courir et attendez une frappe.",
    },
    {
      title: "Ne laissez pas de dames seules à portée",
      body: "Une dame seule à moins de six flèches d'une dame adverse est frappée par près d'un tiers des 36 lancers. Cela vaut parfois le coup, mais sachez que vous prenez le risque.",
    },
    {
      title: "Construisez des flèches voisines",
      body: "Deux flèches tenues côte à côte devant l'adversaire valent bien plus que deux flèches éparpillées. Une dame au bar face à un mur, c'est une partie déjà finie.",
    },
    {
      title: "Une dame sortie vaut un point",
      body: "Une partie perdue où vous avez sorti une dame coûte 1 au lieu de 2. Sur un match en 5 points, c'est une partie entière d'écart.",
    },
  ],

  teaches: [
    {
      title: "La probabilité dans la main",
      body: "Sur les 36 lancers possibles avec deux dés, combien atteignent la dame que vous avez laissée seule ? Un enfant le calcule ici plus vite que sur n'importe quelle fiche.",
    },
    {
      title: "Décider sans savoir",
      body: "Les dés ne sont pas votre faute. Le choix, si. Le backgammon sépare ces deux choses mieux que tout autre jeu de plateau.",
    },
    {
      title: "Compter d'avance",
      body: "Un compte de pips, c'est du calcul ordinaire avec une vraie réponse au bout, et voilà soudain une raison d'additionner de tête.",
    },
    {
      title: "Jouer une position perdue",
      body: "Une partie que vous ne pouvez plus gagner vaut encore des points, et apprendre à jouer la défaite la moins chère continue de servir longtemps après avoir rangé le plateau.",
    },
  ],

  ages: [
    {
      title: "7 à 8 ans",
      body: "À deux, et sans se presser. Lancer, compter les flèches et déplacer, c'est déjà bien assez.",
    },
    {
      title: "9 à 10 ans",
      body: "Contre le niveau facile. Les frappes, le bar et la sensation de course arrivent à ce moment-là.",
    },
    {
      title: "11 ans et plus",
      body: "Un match complet en 5 points. Jouer cinq parties de suite est un autre jeu que d'en jouer une.",
    },
    {
      title: "Adultes",
      body: "Difficile, match en 5 points, le gammon qui compte. C'est exactement le backgammon d'une table de café.",
    },
  ],

  accessibility:
    "On touche une flèche, puis la case d'arrivée. Rien à faire glisser, aucun appui long, donc un dispositif d'entrée adapté comme une petite main s'en sortent sans effort. Seules les flèches jouables répondent au doigt, ce qui évite de tenter un coup interdit et de se demander pourquoi rien ne bouge. Il n'y a ni pendule ni pression du temps, et le bouton annuler permet d'essayer puis de revenir. Les dés restants sont affichés en chiffres, donc aucune information ne dépend du son.",

  together: [
    {
      title: "Se passer l'appareil",
      body: "Un match en 5 points entre vous deux, sans ordinateur au milieu. Exactement les mêmes règles.",
    },
    {
      title: "Annoncer son compte",
      body: "Avant chaque lancer, chacun dit son propre compte de pips à voix haute. On voit très vite qui compte et qui devine.",
    },
    {
      title: "Un match court",
      body: "En 3 points plutôt qu'en 5 quand le temps manque. Un gammon vous y amène presque, et tout est fini en un quart d'heure.",
    },
    {
      title: "Commenter un lancer",
      body: "L'enfant lance, et vous demandez quels coups sont seulement possibles avant qu'il ne touche quoi que ce soit. La chance devient une question.",
    },
  ],

  faq: [
    {
      q: "Le backgammon est-il gratuit ?",
      a: "Oui, et il n'y a rien à payer à aucun moment. Pas d'achat, pas d'abonnement, pas de contenu verrouillé. Chaque jeu du site est ouvert tout de suite.",
    },
    {
      q: "Faut-il une application ou un compte ?",
      a: "Non. Tout tourne dans le navigateur. Personne ne demande de nom, personne ne demande d'adresse e-mail, et il n'y a pas de mot de passe à retenir.",
    },
    {
      q: "Est-ce une partie isolée ou un match ?",
      a: "Un match en 5 points. Une victoire ordinaire vaut 1, un gammon 2 et un backgammon 3, et le match s'arrête quand un camp atteint 5. Il n'y a pas de videau.",
    },
    {
      q: "Peut-on jouer à deux sur le même appareil ?",
      a: "Oui. Le bouton fait passer de la partie contre l'ordinateur à deux personnes qui se passent l'appareil entre les tours.",
    },
    {
      q: "Les règles sont-elles complètes ou simplifiées ?",
      a: "Complètes. Le bar, la rentrée, la sortie des dames, le double qui donne quatre mouvements, les deux dés joués dès que c'est possible et le plus grand quand un seul l'est. Un gammon vaut 2 et un backgammon 3.",
    },
    {
      q: "Peut-on jouer contre des gens en ligne ?",
      a: "Non. Le jeu ne se connecte à aucun serveur, donc pas de salon, pas de classement, aucun message d'inconnu. On joue contre l'ordinateur ou contre la personne à côté.",
    },
    {
      q: "Le match est-il conservé si je ferme ?",
      a: "Oui. Le plateau et le score du match sont écrits sur l'appareil, vous pouvez donc continuer demain. Vider le stockage du navigateur efface tout cela.",
    },
    {
      q: "Est-ce que ça marche sans internet ?",
      a: "Oui. Après la première visite, le jeu reste sur l'appareil et fonctionne réseau coupé.",
    },
    {
      q: "À partir de quel âge ?",
      a: "Vers 7 ans accompagné, et vers 9 ans seul contre le niveau facile. On ne lit rien dans ce jeu, on compte, et le plateau s'en charge en grande partie.",
    },
  ],

  keywords: [
    "backgammon",
    "backgammon gratuit",
    "match de backgammon",
    "backgammon à deux",
    "jeu de plateau",
    "jeu de dés",
  ],
};
