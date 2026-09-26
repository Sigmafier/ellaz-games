import type { GuideEntry } from "../guides";

/**
 * French. Answers "demineur en ligne" (20 impressions, 0 clicks), measured in
 * the Search Console export of 2026-09-21. Somebody asking what an online
 * minesweeper is and how to start one; the page we had said "play
 * minesweeper".
 *
 * THE NUMBER HERE IS NEW WORK, and deliberately NOT the Hebrew guide's
 * numbers translated. `/he/guides/minesweeper-no-guessing/` already spends
 * the guess-free rate, the median cleared-when-stuck and the rule
 * attribution - re-quoting any of those in French would be the exact
 * scaled-content shape this lane exists to avoid. `--firstclick` was added to
 * `minesweeper-guessfree.mjs` for this guide: before any logic runs at all,
 * how much of the board does the FIRST tap reveal, and does WHERE you tap
 * change that? Folk wisdom says open a corner; the real boards say otherwise.
 */
export const demineurEnLigne: GuideEntry = {
  slug: "demineur-en-ligne",
  locale: "fr",
  game: "minesweeper",
  copy: {
    metaTitle: "Démineur en ligne : coin ou centre au premier clic ?",
    metaDescription:
      "2 000 grilles mesurées : le premier clic au centre révèle 64,9% de la grille facile contre 39,5% dans un coin. Le coin n'est pas plus sûr, juste plus petit.",
    h1: "Démineur en ligne : coin ou centre au premier clic ?",
    cardTitle: "Coin ou centre ?",
    lede: "Beaucoup de joueurs ouvrent un coin en premier, par prudence. Sur nos grilles, un premier clic au centre révèle 64,9% de la surface sûre au niveau facile, contre 39,5% dans un coin. Le coin n'est pas plus sûr : il ne l'a jamais été. Il est juste plus petit.",
    body: [
      "Le démineur commence toujours de la même façon. Un clic, une case s'ouvre, parfois quelques voisines avec elle. Puis il faut décider où cliquer ensuite. Beaucoup de joueurs choisissent un coin pour ce premier clic, avec l'idée qu'un coin a moins de voisins et donc moins de risque.",
      "Le risque est en fait identique partout. Dans notre jeu, les mines sont posées après le clic, jamais avant, et la case touchée ainsi que ses huit voisines sont toujours exclues du tirage. Un coin n'a que trois voisines à protéger, un centre en a huit, mais aucune des deux ne peut jamais contenir de mine au premier tour. Ce n'est pas de la prudence. C'est un réflexe qui ne protège de rien.",
      "Alors nous avons mesuré ce que le coin coûte vraiment. Sur 2 000 grilles générées par niveau, nous avons posé le même tirage de mines et tapé trois fois : une fois dans un coin, une fois sur un bord, une fois au centre. Nous avons compté combien de cases sûres chaque clic révélait, en pourcentage de la grille sans les mines.",
      "Le centre gagne sur les trois niveaux, mais l'écart n'a pas la même taille partout. Sur le niveau facile, le centre révèle 64,9% contre 39,5% pour le coin, soit 1,64 fois plus. Sur le niveau moyen, 37,3% contre 17,4%, soit 2,14 fois plus. Sur le niveau difficile, 22,7% contre 9,9%, soit 2,29 fois plus. Le bord se place toujours entre les deux, sans surprise.",
      "Plus la grille est difficile, plus l'écart se creuse. Le centre gagne partout. Le coin devient un choix de plus en plus timide au moment où l'information compte le plus.",
    ],
    sections: [
      {
        title: "D'où vient l'écart, si le risque est le même",
        body: [
          "La différence ne vient pas de la sécurité. Elle vient de la case zéro. Quand une case révélée n'a aucune mine dans son voisinage, le jeu ouvre automatiquement toutes ses voisines, et recommence sur chacune d'elles. C'est cette réaction en chaîne qui fait la taille de ce qu'un seul clic révèle.",
          "Un centre a huit voisins, donc huit chances que la chaîne continue à chaque étape. Un coin n'en a que trois. Trois, pas huit. La chaîne s'arrête plus vite, presque mécaniquement, bien avant d'avoir touché un mur ou une mine.",
          "Rien de tout cela n'est de la chance sur le fond. C'est de la géométrie.",
        ],
      },
      {
        title: "Le démineur est-il un jeu de logique ou de chance ?",
        body: [
          "Le mathématicien Richard Kaye a démontré en 2000 que déterminer si une grille de démineur donnée est logiquement résolvable appartient à une classe de problèmes réputés difficiles à calculer, la même que celle de nombreux problèmes d'optimisation classiques. Cela ne dit rien sur une grille précise, mais cela confirme que le jeu porte une vraie structure logique et pas seulement un tirage au sort habillé de chiffres.",
          "Le premier clic, lui, ne demande aucune logique du tout. Il n'y a rien à déduire avant qu'un chiffre n'apparaisse sur l'écran, et le seul choix qui existe à ce moment précis est celui de la position.",
        ],
      },
      {
        title: "Ce que ça change pour jouer",
        body: [
          "Cliquer au centre en premier n'est pas un truc caché. C'est simplement le clic qui montre le plus de chiffres avant que le vrai travail de déduction commence, et les chiffres sont la seule matière première dont ce travail dispose.",
          "Un coin garde son utilité plus tard dans la partie, quand une case précise doit être vérifiée. Il n'a simplement rien à apporter au tout premier clic, où sa seule qualité, réduire le nombre de voisins, ne protège de rien du tout.",
        ],
      },
    ],
    admission:
      "Ces chiffres sont des moyennes sur 2 000 grilles par niveau, pas une garantie pour une partie précise. Une grille donnée peut très bien placer un centre presque vide et un coin en pleine chaîne. Ce que la moyenne montre, c'est que le centre gagne largement plus souvent qu'il ne perd, et sur un assez grand nombre de parties, c'est exactement ce qui compte.",
    faq: [
      {
        q: "Faut-il cliquer au centre ou dans un coin en premier ?",
        a: "Au centre. Sur 2 000 grilles par niveau, un premier clic au centre révèle 64,9% de la surface sûre au niveau facile contre 39,5% pour un coin, et l'écart grandit encore sur les niveaux plus difficiles.",
      },
      {
        q: "Un coin est-il plus sûr qu'un centre au premier clic ?",
        a: "Non. Notre jeu exclut toujours la case touchée et ses huit voisines du tirage des mines, quelle que soit la case choisie. Aucune des deux ne peut jamais exploser au premier clic.",
      },
      {
        q: "Le démineur est-il un jeu de chance ou de logique ?",
        a: "De logique presque partout, avec de la chance au premier clic seulement, puisqu'il n'y a encore aucun chiffre à lire. Richard Kaye a montré en 2000 que résoudre une grille appartient à une classe de problèmes mathématiquement difficiles, ce qui confirme la vraie structure logique du jeu.",
      },
      {
        q: "Comment jouer au démineur en ligne ?",
        a: "On clique sur une case pour l'ouvrir. Un chiffre indique combien de mines touchent ses huit voisines. Quand ce chiffre est égal au nombre de voisines fermées, elles sont toutes des mines.",
      },
      {
        q: "Le jeu est-il gratuit ?",
        a: "Oui, entièrement. Sans inscription, sans téléchargement et sans publicité, directement dans le navigateur.",
      },
    ],
    playLabel: "Jouer au démineur",
    sources: [
      {
        label: "Richard Kaye, Minesweeper is NP-complete, The Mathematical Intelligencer 22 (2000)",
        url: "https://link.springer.com/article/10.1007/BF03025367",
      },
    ],
  },
  provenance: [
    {
      claim: "first click reveals 64.9% (centre) vs 39.5% (corner) of the safe board on easy",
      source: "scripts/sim/minesweeper-guessfree.mjs",
    },
    {
      claim: "37.3% vs 17.4% on medium, 22.7% vs 9.9% on hard, edge always between the two",
      source: "scripts/sim/minesweeper-guessfree.mjs",
    },
    {
      claim: "the ratio widens from 1.64x (easy) to 2.14x (medium) to 2.29x (hard)",
      source: "scripts/sim/minesweeper-guessfree.mjs",
    },
    {
      claim: "2,000 boards per level (the script's own default), first click always safe (clicked cell and its 8 neighbours excluded from mine placement)",
      source: "src/games/minesweeper/logic.ts",
    },
  ],
};
