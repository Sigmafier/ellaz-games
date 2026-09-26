import type { GuideEntry } from "../guides";
/**
 * French. Answers "labyrinthe en ligne" (19 impressions) and "jeu labyrinthe
 * en ligne" (10), measured in the Search Console export of 2026-09-21. Both
 * are somebody asking what an online maze IS; the page we had said "play the
 * maze".
 *
 * THE NUMBER HERE IS NEW WORK. `maze-routes.mjs` already publishes the size of
 * the ordering skill, the spread between the best and worst order and how many
 * dead ends survive the braid, and the game page spends all three. So this
 * guide asks the one thing every reader already believes and nobody has
 * checked against our boards: does the left-hand rule work here?
 * `maze-wall-follower.mjs` was written for it.
 *
 * NO CITATION FOR THE GUARANTEE, deliberately. The wall-follower result is
 * standard in substance and a search on 2026-09-21 could not confirm one
 * specific published source stating it with full bibliographic detail - so the
 * guide states it as OUR measurement (expert, braid 0, 100% of 3,000 deals)
 * rather than attributing it to a book nobody checked. Buck is cited for the
 * perfect-versus-braided vocabulary, which he does define.
 *
 * NO-BREAK SPACES are real U+00A0 characters before every `: ; ? !`, which is
 * what French orthotypography requires and what `voice.ts` measures through
 * `spacedPunctuation`. Getting it right on some marks and not others is worse
 * than getting it wrong everywhere.
 */
export const labyrintheEnLigne: GuideEntry = {
  slug: "labyrinthe-en-ligne",
  locale: "fr",
  game: "maze",
  copy: {
    metaTitle: "Labyrinthe en ligne : la main gauche suffit-elle ?",
    metaDescription:
      "Nous avons fait marcher la règle de la main gauche sur 3 000 labyrinthes par taille. Elle échoue sur les petits et ne rate jamais le grand.",
    h1: "Labyrinthe en ligne : la main gauche suffit-elle ?",
    cardTitle: "La main gauche",
    lede: "Garder la main gauche sur le mur sort d'un labyrinthe parfait à tous les coups. Sur nos quatre tailles, elle ne réussit que 62,9% des tirages du 5 sur 5 et 100% de ceux du 10 sur 10 : elle marche exactement là où le labyrinthe est le plus difficile.",
    body: [
      "Tout le monde connaît l'astuce : gardez la main gauche sur le mur et vous finirez par sortir. Elle est vraie. Mais elle n'est vraie que sur une certaine sorte de labyrinthe, et sur les nôtres elle échoue exactement là où on l'attendrait le moins.",
      "Nous avons distribué 3 000 labyrinthes par taille et fait marcher la règle dessus, du départ de la souris jusqu'à la porte. Sur le 5 sur 5, le plus petit et le plus doux, elle arrive à la porte dans 62,9% des cas seulement. Sur le 6 sur 6, 73,6%. Sur le 7 sur 7, 92,2%. Et sur le 10 sur 10, le plus grand et le plus difficile des quatre, elle arrive à chaque fois : 100%.",
      "L'intuition se trompe. L'ordre est exactement inverse.",
      "La raison tient en un mot, et ce mot est le tressage. Un labyrinthe parfait n'a qu'un seul trajet entre deux cases, donc tous ses murs forment une seule pièce et une main posée dessus finit par en faire le tour complet. Tresser un labyrinthe, c'est rouvrir ses culs-de-sac : le trajet devient plus doux pour un enfant de quatre ans, et certains murs se détachent en îlots. Une main posée sur un îlot tourne en rond pour toujours.",
      "Nos quatre tailles sont tressées à 0,9, à 0,45, à 0,1 et à 0. Le 10 sur 10 est le seul labyrinthe parfait du lot. C'est pour cela qu'il est le seul où la règle ne peut pas échouer.",
    ],
    sections: [
      {
        title: "Ce que la règle coûte quand elle marche",
        body: [
          "Arriver n'est pas arriver vite. Nous avons comparé chaque marche au trajet le plus court du même labyrinthe, celui que le jeu calcule avant que vous ne bougiez.",
          "Sur le 5 sur 5, la main gauche marche 13,3 cases là où 10,4 suffisaient, soit 1,28 fois le trajet optimal. Sur le 6 sur 6, 1,6 fois. Sur le 7 sur 7, 1,86 fois. Sur le 10 sur 10, celui où elle est garantie, elle marche 98,6 cases pour un trajet de 20,9 : 4,93 fois trop long, et sur le pire tirage des 3 000, 15,5 fois.",
          "Autrement dit, la seule taille où la règle est sûre est aussi celle où elle vous coûte le plus cher. C'est un résultat que nous n'attendions pas et qui rend la règle beaucoup moins utile qu'elle n'en a l'air.",
        ],
      },
      {
        title: "Ce qu'il vaut mieux faire à la place",
        body: [
          "Notre labyrinthe se joue au doigt : vous touchez une case, la souris y va toute seule par le chemin le plus court. La question n'est donc pas par où passer, elle est dans quel ordre ramasser.",
          "Avec 4 miettes il y a 24 ordres possibles, avec 6 il y en a 720. Aller vers la miette la plus proche à chaque fois est un très bon réflexe sur les petites tailles, et il se dégrade sur les grandes. C'est là que se trouve le jeu, et c'est aussi pour cela qu'un record compte les labyrinthes parfaits d'affilée plutôt qu'un nombre de pas.",
        ],
      },
      {
        title: "Quatre tailles, et ce qui change vraiment",
        body: [
          "Le 5 sur 5 avec 2 miettes est fait pour quatre ans : très tressé, presque un jardin de haies, où se tromper ne coûte presque rien.",
          "Le 10 sur 10 avec 6 miettes est autre chose. Pas de tressage du tout, donc chaque erreur se paie au retour, et 720 ordres de ramassage à départager. C'est la seule taille où la main gauche vous sortira toujours, et la dernière où vous auriez envie de l'utiliser.",
        ],
      },
    ],
    admission:
      "Notre marcheur commence toujours tourné vers le haut, et ce choix est arbitraire. Un autre cap de départ change les chiffres de quelques dixièmes sur les tailles tressées, parce qu'il change l'îlot que la main rencontre en premier. Il ne change rien au 10 sur 10, où la garantie ne dépend d'aucun départ.",
    faq: [
      {
        q: "Qu'est-ce qu'un labyrinthe en ligne ?",
        a: "Un labyrinthe que l'on joue dans le navigateur, sans rien installer. Le nôtre existe en quatre tailles, de 5 sur 5 à 10 sur 10, avec 2 à 6 miettes à ramasser avant de rentrer.",
      },
      {
        q: "La règle de la main gauche marche-t-elle toujours ?",
        a: "Non. Sur nos labyrinthes tressés elle échoue dans 37,1% des tirages du 5 sur 5 et dans 26,4% de ceux du 6 sur 6. Elle est garantie sur le 10 sur 10, qui est un labyrinthe parfait.",
      },
      {
        q: "Le jeu est-il gratuit ?",
        a: "Oui, sans inscription, sans téléchargement et sans publicité. Il fonctionne aussi hors ligne une fois la page ouverte.",
      },
      {
        q: "À partir de quel âge ?",
        a: "Le 5 sur 5 convient à partir de quatre ans : il est tressé à 0,9, donc neuf culs-de-sac sur dix sont rouverts et une erreur ne se paie presque pas. Le 10 sur 10 intéresse plutôt les grands.",
      },
      {
        q: "Comment gagne-t-on un labyrinthe parfait ?",
        a: "En finissant exactement dans le nombre de pas minimum du tirage, que le jeu a calculé à l'avance. Le record compte ces labyrinthes-là à la suite.",
      },
    ],
    playLabel: "Jouer au labyrinthe",
    sources: [
      {
        label: "Jamis Buck, Mazes for Programmers, Pragmatic Bookshelf (2015)",
        url: "https://pragprog.com/titles/jbmaze/mazes-for-programmers/",
      },
    ],
  },
  provenance: [
    {
      claim: "62,9% / 73,6% / 92,2% / 100% of deals where the left-hand rule reaches the door",
      source: "scripts/sim/maze-wall-follower.mjs",
    },
    {
      claim: "1,28x / 1,6x / 1,86x / 4,93x the shortest path, worst deal 15,5x",
      source: "scripts/sim/maze-wall-follower.mjs",
    },
    {
      claim: "mean shortest path 10,4 / 17 / 26 / 20,9 squares",
      source: "scripts/sim/maze-wall-follower.mjs",
    },
    {
      claim: "braid 0.9 / 0.45 / 0.1 / 0 and the four board sizes",
      source: "scripts/sim/maze-wall-follower.mjs",
    },
    {
      claim: "24 collection orders with 4 crumbs, 720 with 6",
      source: "scripts/sim/maze-routes.mjs",
    },
  ],
};
