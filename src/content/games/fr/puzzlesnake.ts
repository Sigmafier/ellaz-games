import type { GameCopy } from "../../types";

/**
 * Serpent casse-tête, écrit en français pour son propre lecteur plutôt que
 * traduit. Chaque chiffre vient de `src/games/puzzlesnake/` - les niveaux et
 * leurs plateaux de `levels.ts`, la marge des étoiles de `logic.ts`, et tout ce
 * que le solveur et le robot glouton ont trouvé de `solver.test.ts`.
 */
export const puzzlesnakeFr: GameCopy = {
  name: "Serpent casse-tête",
  metaTitle: "Serpent casse-tête - jeu de serpent et de logique | Ellaz",
  metaDescription:
    "Un serpent qui ne bouge que quand vous appuyez. Mangez toutes les pommes puis passez la porte dorée. 12 niveaux, annulation illimitée, impossible de perdre.",

  lede: "Serpent casse-tête, c'est le serpent que tout le monde connaît, mais qui attend votre décision. Une touche, un pas. Chaque pomme vous allonge d'une case et la porte dorée ne s'ouvre qu'après la dernière. On ne perd jamais et on peut toujours annuler : toute la question est l'ordre.",

  body: [
    "Rien ne presse. Le serpent avance d'une case, puis il attend. Vous pouvez aller vous servir un verre, il sera toujours là, tourné du même côté.",

    "Le vrai obstacle, c'est vous. Chaque pomme ajoute une case, et la queue repasse exactement là où la tête est passée : le couloir que vous venez de traverser peut maintenant être rempli de votre propre corps. La tête a le droit d'entrer dans la case que la queue quitte, puisque la queue bouge au même moment. Elle ne peut pas se retourner dans son propre cou, ni traverser un mur, et la porte reste fermée tant qu'il reste une pomme. Un pas refusé, c'est un petit sursaut de la tête. Rien de plus.",

    "Il y a 12 niveaux, répartis entre le Jardin et les Astuces. Les six du Jardin se jouent sur un plateau de 7 cases sur 7, avec un serpent de 2 ou 3 cases au départ. Les six des Astuces sont courts, sur un plateau de 9 sur 9, et chacun apporte une case nouvelle : une clé qui ouvre tous les cadenas, des flèches qu'on ne franchit que dans leur sens, et une paire de portails qui vous font traverser le plateau. Le 2-2, un plateau de quatre salles où le serpent part avec 5 cases, est gardé de la première version.",

    "Chaque niveau a été vérifié par un solveur qui essaie toutes les suites de touches possibles, puis par un robot glouton qui file toujours vers la pomme la plus proche. Le robot boucle le premier niveau au minimum, 5 touches. Dans les Astuces, il ne termine aucun des 6 niveaux. Voilà le piège. Là-bas, 9 des 16 pommes rendent le niveau impossible si on les mange en premier, et si l'on mure la case nouvelle d'un niveau, le solveur ne trouve plus aucun chemin.",

    "Les étoiles comptent vos touches. Trois au minimum possible, deux pour un petit détour, une pour toute réussite.",
  ],

  howToPlay: [
    {
      title: "Une case à la fois",
      body: "Appuyez sur une flèche ou sur W A S D, touchez un bouton du pavé sous le plateau, ou glissez le doigt sur le plateau. Le serpent fait exactement un pas et s'arrête.",
    },
    {
      title: "Mangez toutes les pommes",
      body: "Chaque pomme allonge le serpent d'une case. La porte dorée est dessinée en pointillés tant qu'elle est fermée, et devient pleine et brillante dès que la dernière pomme est mangée.",
    },
    {
      title: "Passez la porte",
      body: "Amenez la tête dans la porte ouverte et le niveau est résolu. Le bandeau au-dessus du plateau indique dès le départ combien de touches valent trois étoiles.",
    },
    {
      title: "Annuler, recommencer, choisir un niveau",
      body: "Annuler reprend une touche, autant de fois que vous voulez. Recommencer remet le niveau à sa première image. Niveaux ouvre la carte du Jardin et des Astuces, et chaque niveau s'ouvre quand le précédent est résolu.",
    },
  ],

  tips: [
    {
      title: "Comptez votre queue avant d'entrer",
      body: "Un couloir à une seule entrée n'est sûr que s'il y a la place de faire demi-tour dedans, ou une autre sortie. Avant de manger une pomme au fond d'une impasse, calculez la longueur que vous aurez ensuite.",
    },
    {
      title: "La pomme la plus proche est une question",
      body: "Repérez la pomme qui vous enfermerait si vous la mangiez tôt, et gardez-la pour la fin. Cinq des six niveaux des Astuces en ont au moins une.",
    },
    {
      title: "Profitez du pas de la queue",
      body: "La case que la queue va quitter est déjà libre pendant cette même touche. Dans les virages serrés du 2-2, c'est souvent le seul passage.",
    },
    {
      title: "Annuler ne coûte rien",
      body: "Rien ne compte avant la porte. Essayez un chemin, regardez où finit votre corps, et revenez en arrière.",
    },
  ],

  teaches: [
    {
      title: "Prévoir plusieurs coups à l'avance",
      body: "Chaque niveau se résout d'abord dans la tête. Appuyer sans plan finit souvent coincé, et c'est une leçon en soi.",
    },
    {
      title: "L'ordre a des conséquences",
      body: "La pomme choisie en premier change tout ce qui suit, parce que le corps laissé derrière devient le mur du coup suivant.",
    },
    {
      title: "Se remettre d'une erreur",
      body: "Être coincé n'est pas perdre. Annuler transforme l'impasse en information : on sait désormais quel ordre ne marche pas.",
    },
  ],

  ages: [
    {
      title: "Moins de 6 ans",
      body: "Les deux premiers niveaux du Jardin se jouent avec le pavé et un adulte à côté. Au-delà, l'ordre devient souvent trop difficile à cet âge, et ce n'est pas grave.",
    },
    {
      title: "De 7 à 12 ans",
      body: "Le Jardin a la bonne taille. Les Astuces sont un vrai défi, qu'on résout en général à grands coups d'annulation.",
    },
    {
      title: "Ados et adultes",
      body: "Les Astuces sont pour vous. Trois étoiles au 2-6, c'est trouver le meilleur chemin, long de 24 touches.",
    },
  ],

  accessibility:
    "Pas de chrono et rien à perdre, donc chacun joue à son rythme. Chaque pas tient en une seule touche : une flèche ou W A S D, le pavé à l'écran, ou un glissement sur le plateau, et aucun pas ne demande de maintenir ou de faire glisser longuement. La porte change de forme et pas seulement de couleur en s'ouvrant, du pointillé au trait plein, et chaque bouton de la page, cases de niveau comprises, porte un nom qu'un lecteur d'écran peut lire.",

  together: [
    {
      title: "Réfléchir à voix haute",
      body: "L'un tient le téléphone, l'autre annonce les pas. Seul celui qui planifie parle, et celui qui tient appuie exactement sur ce qu'il entend.",
    },
    {
      title: "Course aux trois étoiles",
      body: "Deux joueurs, un niveau, deux appareils. Le moins de touches gagne, et en cas d'égalité, celui qui n'a jamais annulé.",
    },
    {
      title: "Chasse à la pomme piège",
      body: "Avant de bouger, chacun parie sur la pomme qui rendrait le niveau impossible si on la mangeait en premier. On vérifie avec Annuler.",
    },
  ],

  faq: [
    {
      q: "Peut-on perdre à Serpent casse-tête ?",
      a: "Non. Pas de chrono, pas de fin de partie. Si le serpent n'a plus aucun pas possible, le plateau le dit, et Annuler ou Recommencer vous en sortent.",
    },
    {
      q: "Que veut dire le nombre à côté des trois étoiles ?",
      a: "C'est le nombre minimal de touches qui résout le niveau, trouvé par un solveur qui a essayé toutes les suites possibles. On ne peut pas faire mieux, seulement l'égaler.",
    },
    {
      q: "Comment avoir deux étoiles ?",
      a: "En finissant avec au plus 20 pour cent de touches de plus que le minimum, et toujours au moins 2 de marge. Deux solutions d'un même niveau diffèrent d'un nombre pair de touches, donc 2 est le plus petit écart possible.",
    },
    {
      q: "Pourquoi le serpent ne peut-il pas revenir sur ses pas ?",
      a: "Il ne peut pas se retourner dans son propre cou. En revanche, il peut entrer dans la case que la queue quitte, puisque la queue bouge pendant la même touche.",
    },
    {
      q: "Comment débloquer le niveau suivant ?",
      a: "En résolvant le précédent, avec n'importe quel nombre d'étoiles. Un niveau verrouillé tremble quand on le touche, pour qu'on voie où il se trouve.",
    },
    {
      q: "Ma progression est-elle enregistrée ?",
      a: "Vos meilleures étoiles pour chaque niveau restent sur cet appareil, et si vous partez au milieu d'un niveau, il se rouvre exactement là où vous l'avez laissé.",
    },
    {
      q: "Est-ce le même jeu que le serpent classique ?",
      a: "Même serpent, mêmes couleurs, autre jeu. Le classique est une affaire de réflexes et de vitesse. Ici chaque niveau est une énigme fixe, et rien ne se passe tant que vous n'appuyez pas.",
    },
  ],

  keywords: ["serpent casse-tête", "jeu du serpent", "casse-tête", "jeu de logique", "jeu au tour par tour"],
};
