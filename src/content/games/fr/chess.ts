import type { GameCopy } from "../../types";

/**
 * Les echecs en francais, ecrits ici et non traduits de la page anglaise.
 *
 * Les chiffres viennent du moteur lui-meme : `src/games/chess/logic.test.ts`
 * pour les comptes perft, `src/games/chess/logic.ts` pour la regle des
 * cinquante coups et la triple repetition. Le reste est ecrit dans cette
 * langue, avec ses propres exemples.
 */
export const chessFr: GameCopy = {
  name: "Échecs",
  metaTitle: "Échecs gratuits contre l'ordinateur | Ellaz",
  metaDescription:
    "Des échecs gratuits dans le navigateur. Contre l'ordinateur à trois niveaux, ou à deux sur le même appareil. Règles complètes, sans compte.",

  lede: "Des échecs complets dans le navigateur, gratuitement. Contre l'ordinateur à trois niveaux, ou à deux sur le même appareil en se passant le téléphone. Un bouton fait passer d'un mode à l'autre.",

  body: [
    "Vous touchez une pièce et toutes les cases où elle a le droit d'aller s'allument. Vous touchez l'une d'elles et la pièce y va. Voilà toute l'interface. Rien à taper, aucune notation à apprendre, aucun écran de réglages entre un enfant et la partie.",

    "Les règles sont entières, ce qui est plus rare qu'on ne le croit sur un jeu d'échecs gratuit. Le roque des deux côtés. La prise en passant. Une promotion qui demande vraiment laquelle des 4 pièces vous voulez au lieu de poser une dame. Le pat, la triple répétition, et la règle des cinquante coups comptée comme le règlement la compte, à 100 demi-coups. Le générateur de coups a été vérifié contre les comptes perft que tout le monde utilise : 20 premiers coups légaux, 400 positions une fois que les deux camps ont joué, 197 281 après quatre demi-coups. Qu'une seule règle manque et ces nombres tombent à côté. C'est exactement pour cela qu'ils servent de test.",

    "Une case interdite reste éteinte.",

    "Contre l'ordinateur il y a un bouton pour revenir en arrière. Contre une personne, il n'y en a pas, et ce n'est pas un oubli. Deux joueurs devant le même écran se doivent des comptes, et un coup qu'on peut retirer discrètement n'est pas un coup. Face à la machine il n'y a personne à qui s'excuser, donc laisser un enfant rembobiner une bourde fait la différence entre apprendre ce que fait un fou et abandonner.",

    "La position s'enregistre toute seule sur l'appareil. Fermez l'onglet au milieu d'une partie, revenez demain, le même échiquier attend avec le même trait. Ce que cela coûte, c'est qu'un téléphone et une tablette sont deux échiquiers séparés. Nous ne vous avons jamais demandé de compte, donc nous n'avons rien pour les relier.",
  ],

  howToPlay: [
    {
      title: "Choisir l'adversaire",
      body: "L'ordinateur à trois niveaux, ou deux personnes sur un seul appareil. Le même bouton vous ramène quand vous voulez.",
    },
    {
      title: "Toucher une pièce",
      body: "Ses cases légales s'allument aussitôt, le roque et la prise en passant compris dès qu'ils sont possibles.",
    },
    {
      title: "Toucher la case d'arrivée",
      body: "La pièce s'y rend. Toucher une case éteinte ne fait rien, donc un coup interdit n'est pas quelque chose qu'on joue par inadvertance.",
    },
    {
      title: "Promouvoir un pion",
      body: "Le pion qui atteint la dernière rangée s'arrête et pose la question. Dame, tour, fou ou cavalier, et c'est un vrai choix.",
    },
    {
      title: "Partir et revenir",
      body: "L'échiquier se garde tout seul. Fermez l'onglet, la même partie s'ouvrira la prochaine fois.",
    },
  ],

  tips: [
    {
      title: "Ouvrez vers le centre",
      body: "Un pion central avancé de deux cases libère un fou et un cavalier d'un seul coup. Sur les 20 ouvertures légales, deux font presque tout le travail.",
    },
    {
      title: "Les cavaliers avant les fous",
      body: "Un cavalier dans le coin voit 2 cases. Le même cavalier au centre en voit 8. Aucune autre pièce ne gagne en valeur aussi vite, donc elle sort la première.",
    },
    {
      title: "Comptez avant de prendre",
      body: "Comptez les attaquants et les défenseurs de la case avant d'y entrer. La plupart des défaites de débutant tiennent à un échange qui semblait égal.",
    },
    {
      title: "La nulle est un résultat",
      body: "Quand vous êtes en retard au matériel, le pat et la triple répétition travaillent pour vous. Tenir la nulle contre le niveau difficile, c'est gagner.",
    },
  ],

  teaches: [
    {
      title: "Penser un coup à l'avance",
      body: "Chaque coup ouvre quelque chose et en referme un autre. L'échiquier est l'endroit le moins cher pour le découvrir, parce que l'erreur coûte une partie et rien de plus.",
    },
    {
      title: "Lire une menace",
      body: "Se demander ce que le dernier coup adverse attaque avant de poursuivre son propre plan. Toute la compétence tient dans cette phrase.",
    },
    {
      title: "Rester sur un problème difficile",
      body: "Il n'y a pas de pendule, donc deux minutes sur un coup sont permises. On offre rarement cette occasion à un enfant.",
    },
    {
      title: "Perdre sans drame",
      body: "Un nouvel échiquier est à un doigt. Perdre ne coûte rien, et c'est ce qui rend possible d'essayer des choses.",
    },
  ],

  ages: [
    {
      title: "6 à 7 ans",
      body: "À deux, et sans compter les victoires. À cet âge il s'agit de retenir la marche de chaque pièce, et les cases allumées s'en chargent.",
    },
    {
      title: "8 à 10 ans",
      body: "Contre le niveau facile, tout seul. C'est l'âge où l'on commence à voir des menaces au lieu de simplement bouger.",
    },
    {
      title: "11 ans et plus",
      body: "Moyen, puis difficile. À partir de là c'est une partie et non un exercice.",
    },
    {
      title: "Adultes",
      body: "Le niveau difficile, sans toucher au bouton de retour. Ou contre une personne, ce qui est un tout autre jeu.",
    },
  ],

  accessibility:
    "Un doigt pour prendre la pièce, un doigt pour la poser. Rien à faire glisser, aucun appui long, donc le jeu fonctionne avec un dispositif d'entrée adapté comme avec une petite main qui vise encore mal. Les cases légales s'allument, de sorte que rien ne dépend de se rappeler la marche du cavalier. Il n'y a de pendule nulle part, donc réfléchir longtemps ne coûte rien et une position peut attendre une semaine. On peut jouer la partie entière en silence sans rien perdre.",

  together: [
    {
      title: "Se passer le téléphone",
      body: "Deux joueurs, un échiquier, et l'ordinateur sorti du tableau. Le bouton entre dans ce mode et en ressort.",
    },
    {
      title: "Dire pourquoi",
      body: "Une phrase avant chaque coup sur ce qu'il fait. Cela ralentit la partie et l'améliore plus que n'importe quel conseil.",
    },
    {
      title: "Deux têtes du même côté",
      body: "Tous les deux contre l'ordinateur, d'accord sur chaque coup avant de toucher quoi que ce soit. Les disputes sont la bonne partie.",
    },
    {
      title: "Qui voit la menace",
      body: "Après chaque coup adverse, l'autre dit ce qu'il attaque. Un enfant qui apprend cela arrête de donner ses pièces.",
    },
  ],

  faq: [
    {
      q: "Le jeu d'échecs est-il gratuit ?",
      a: "Entièrement. Pas de paiement, pas d'achat dans le jeu, pas de version payante, puisqu'il n'existe pas d'autre version. Chaque jeu du site est ouvert dès la première seconde.",
    },
    {
      q: "Faut-il télécharger ou créer un compte ?",
      a: "Non. Tout se passe dans le navigateur, sans téléchargement et sans inscription. Nous ne demandons pas d'adresse e-mail non plus.",
    },
    {
      q: "Peut-on jouer à deux sur le même appareil ?",
      a: "Oui, et c'est un vrai mode, pas un contournement. Un bouton passe de la partie contre l'ordinateur à deux joueurs qui se passent l'appareil.",
    },
    {
      q: "Toutes les règles sont-elles là ?",
      a: "Oui. Le roque, la prise en passant, la promotion vers quatre pièces au choix, le pat, la triple répétition et la règle des cinquante coups. Le générateur atteint 20, 400 et 197 281 aux tests perft habituels, et ces nombres ne tombent pas juste quand une règle manque.",
    },
    {
      q: "Y a-t-il une pendule ?",
      a: "Aucune. Pas de minuterie, pas de compte à rebours, aucun coup qui expire. Réfléchissez autant que vous voulez.",
    },
    {
      q: "Peut-on revenir sur un coup ?",
      a: "Contre l'ordinateur, oui. Contre une personne, non. Un coup joué devant quelqu'un reste joué, sinon il n'y a plus de partie.",
    },
    {
      q: "Peut-on jouer contre des inconnus en ligne ?",
      a: "Non. Il n'y a ici ni serveur ni connexion à qui que ce soit, donc pas de classement, pas de salon, et personne qui puisse écrire à votre enfant. Les adversaires sont l'ordinateur ou la personne assise à côté.",
    },
    {
      q: "La partie est-elle conservée ?",
      a: "Oui. La position est écrite sur l'appareil, vous pouvez donc fermer en cours de route et retrouver le même échiquier. Vider le stockage du navigateur l'efface.",
    },
    {
      q: "Est-ce que ça marche sans connexion ?",
      a: "Oui, après la première visite. Le jeu reste disponible dans le navigateur, même en avion.",
    },
  ],

  keywords: [
    "échecs",
    "jeu d'échecs gratuit",
    "échecs contre l'ordinateur",
    "échecs à deux",
    "jeu de plateau",
    "stratégie",
  ],
};
