import type { GameCopy } from "../../types";

/**
 * Arène des serpents, en français, écrit pour son propre lecteur plutôt que traduit.
 *
 * Chaque chiffre vient de `src/games/snakearena/` - la durée de la manche, le
 * nombre de bots, la longueur de départ, les deux formes du plateau, le rythme
 * des pas, la vitesse du mode Regarder, la pièce toutes les 5 pommes et la
 * taille des boutons. Rien n'est inventé ici.
 *
 * Le français place une espace insécable (U+00A0) avant `: ; ? !` - voir
 * `voice.ts` § `spacedPunctuation`. C'est pourquoi la manche dure « 90 secondes »
 * ici et jamais « 1:30 » : un deux-points collé à un chiffre est ce que la règle
 * refuse.
 */
export const snakearenaFr: GameCopy = {
  name: "Arène des serpents",
  metaTitle: "Arène des serpents - Snake gratuit contre des bots | Ellaz",
  metaDescription:
    "Le Snake classique sur grille, en manche de 90 secondes contre 2 à 5 serpents de l'ordinateur. Mangez, évitez chaque corps, finissez le plus long.",

  lede: "Le serpent que vous connaissez, sur un plateau plus grand, et en compagnie. Pendant 90 secondes, vous et jusqu'à cinq serpents de l'ordinateur courez après les mêmes pommes, et celui dont la tête touche un mur ou un corps est éliminé. Le plus long serpent encore en mouvement à la fin du temps gagne.",

  body: [
    "Tout le monde bouge en même temps. Voilà la différence.",

    "À chaque pas, tous les serpents avancent ensemble, d'une case chacun, à la même vitesse. Les règles sont celles du classique : une tête qui sort du plateau ou entre dans un corps est éliminée, votre propre queue comprise. Deux têtes qui se rencontrent sont éliminées toutes les deux, quelle que soit la plus longue, donc un choc de face ne sert jamais à gagner une dispute. Un serpent éliminé éclate, et chaque case qu'occupait son corps devient une pomme. C'est pour cela que l'endroit où un long serpent s'est écrasé devient d'un coup le plus fréquenté du plateau.",

    "Les pommes ne manquent jamais. Il y en a toujours au moins deux de plus que de serpents, et chacune vous allonge d'un segment. Chaque serpent commence avec 3 segments, placé sur un anneau et tournant dans le sens des aiguilles d'une montre, si bien que personne ne démarre face à face.",

    "La manche dure 90 secondes. S'il ne reste qu'un serpent avant la fin, il gagne tout de suite. Sinon, le plus long serpent encore vivant à la sonnerie l'emporte.",

    "Vous choisissez un niveau : en facile, 2 serpents de l'ordinateur et un rythme plus calme, en normal 3 et en difficile 5. Ils s'appellent Bolt, Moss, Echo, Pip et Fizz, chacun a sa couleur et son nom flotte au-dessus de sa tête. Sur ordinateur, le plateau fait 30 cases sur 20 avec un classement en direct à côté. Sur téléphone, il pivote en 23 sur 32 pour tenir à la verticale.",

    "La carte de départ propose trois autres choix : la couleur de votre serpent, la carte aux rochers, où quelques petits groupes de rochers font office de murs, et sur ordinateur un deuxième joueur, qui dirige avec WASD pendant que vous gardez les flèches.",
  ],

  howToPlay: [
    { title: "Commencer", body: "Appuyez sur Jouer, puis sur une flèche ou faites glisser. Votre serpent et tous les bots attendent sur le plateau jusqu'à votre première direction, donc rien ne bouge avant que vous soyez prêt." },
    { title: "Diriger", body: "Les flèches ou WASD sur ordinateur, un glissement ou les quatre boutons sur téléphone. Le réglage des commandes remplace les boutons par un joystick, ou par un manche qui apparaît là où vous touchez le plateau." },
    { title: "Grandir", body: "Passez la tête sur une pomme pour gagner un segment. Les serpents qui éclatent laissent une rangée de pommes, qui vaut la course si le chemin est libre." },
    { title: "Quand vous êtes éliminé", body: "La manche s'arrête et montre votre place. Regarder joue la suite trois fois plus vite pour voir qui gagne, et Rejouer lance tout de suite une nouvelle manche." },
  ],

  tips: [
    { title: "Gardez une sortie", body: "Avant de vous glisser entre deux corps, regardez où mène le passage. Une impasse devient très courte dès qu'un autre serpent en ferme l'entrée." },
    { title: "Ne disputez pas une pomme à une tête", body: "Si un bot est à une case de la pomme que vous visez, laissez-la-lui. Deux têtes dans la même case vous éliminent tous les deux, et les pommes qu'un bot laisse en éclatant valent plus qu'une seule." },
    { title: "La longueur est une avance et un risque", body: "Un long corps bloque le plateau pour tout le monde, vous compris. Si vous menez en fin de manche, arrêtez de chasser et restez dans l'espace libre jusqu'à la sonnerie." },
    { title: "Observez les bots", body: "Chaque bot vise la pomme la plus proche qu'il peut atteindre et évite les poches plus petites que lui. De temps en temps, l'un d'eux se trompe et tourne au hasard : c'est votre moment." },
  ],

  teaches: [
    { title: "Lire ce qui bouge", body: "Six choses bougent à la fois et il n'y a qu'un pas pour décider. On lit une scène entière plutôt qu'une seule cible." },
    { title: "Prévoir l'espace", body: "Un serpent qui mange prend plus de place. Garder une sortie ouverte, c'est prévoir quelques coups d'avance." },
    { title: "Risque et récompense", body: "Les meilleures pommes sont à côté des pires dangers, et le jeu demande de choisir toutes les quelques secondes." },
  ],

  ages: [
    { title: "Dès 6 ans", body: "Un jeune joueur peut diriger avec les grands boutons et apprendre à s'éloigner des corps. En facile, avec 2 bots plus lents, la manche est indulgente, mais être éliminé la termine quand même." },
    { title: "De 8 à 12 ans", body: "Les 3 bots du niveau normal, une vraie course aux pommes, et le moment où l'on comprend qu'un choc de face coûte cher aux deux." },
    { title: "Ados et adultes", body: "Les 5 bots du niveau difficile, peut-être sur la carte aux rochers, où tenir jusqu'à la sonnerie est un savoir-faire à part entière." },
  ],

  accessibility:
    "Il faut diriger pendant toute la manche, au clavier, en faisant glisser ou avec quatre grands boutons, et un pas arrive environ 7 fois par seconde (environ 5 en facile), donc le jeu demande une attention continue pendant 90 secondes. Rien n'exige un double appui rapide ni un glisser précis : chaque commande est une simple pression, les boutons font 64 pixels et la pause fige la manche exactement là où elle en est.",

  together: [
    { title: "Chacun son tour", body: "Jouez à tour de rôle au même niveau et comparez la longueur atteinte. Le record est gardé à part pour chaque niveau et chaque carte." },
    { title: "L'un joue, l'autre prévient", body: "L'un dirige pendant que l'autre surveille le plateau et prévient quand un bot approche." },
    { title: "Regardez la fin ensemble", body: "Quand l'un de vous est éliminé, appuyez sur Regarder et pariez sur le gagnant avant la sonnerie." },
  ],

  faq: [
    { q: "Arène des serpents est-il gratuit ?", a: "Oui. Il n'y a rien à créer ni rien à acheter, et on y joue dans le navigateur." },
    { q: "Comment gagne-t-on ?", a: "En étant le plus long serpent encore vivant quand les 90 secondes sont écoulées, ou le dernier serpent restant avant cela." },
    { q: "Que se passe-t-il quand deux serpents se percutent de face ?", a: "Les deux sont éliminés, quelle que soit leur longueur. Deux têtes qui entrent dans la même case, ou qui se traversent, comptent de la même façon." },
    { q: "Pourquoi des pommes apparaissent-elles là où était un serpent ?", a: "Un serpent éliminé éclate : chaque case de son corps devient une pomme. C'est là qu'on grandit vite." },
    { q: "Contre combien de bots peut-on jouer ?", a: "Deux en facile, trois en normal et cinq en difficile. On choisit sur la carte de départ, et sur ordinateur aussi dans le panneau à côté du plateau." },
    { q: "Comment le score est-il gardé ?", a: "Votre record est la plus grande longueur atteinte par votre serpent dans une manche, enregistrée sur cet appareil pour chaque niveau et chaque carte. Toutes les 5 pommes mangées rapportent aussi une pièce." },
    { q: "Peut-on faire une pause ?", a: "Oui, le bouton pause arrête la manche et le chrono. Passer à un autre onglet la met aussi en attente." },
  ],

  keywords: ["jeu du serpent", "snake contre des bots", "snake gratuit", "jeu de serpent en ligne", "arène des serpents"],
};
