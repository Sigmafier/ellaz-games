import type { GameCopy } from "../../types";

/**
 * Serpent survivant, en français, écrit pour son propre lecteur plutôt que traduit.
 *
 * Chaque chiffre vient de `src/games/snakesurvivors/` - la longueur de départ, la
 * plus courte et la plus longue, ce que coûte une morsure, le clignotement qui
 * suit, la durée d'une phase par niveau, les cartes et leurs plafonds. Rien n'est
 * inventé ici.
 *
 * Le français place une espace insécable avant `: ; ? !`, ce que les autres
 * langues ne font pas - voir `voice.ts` § `spacedPunctuation`. C'est aussi
 * pourquoi les durées s'écrivent « 2 minutes 30 » et jamais « 2:30 » ici : un
 * deux-points collé à un chiffre est exactement ce que la règle refuse.
 */
export const snakesurvivorsFr: GameCopy = {
  name: "Serpent survivant",
  metaTitle: "Serpent survivant - jeu de serpent gratuit | Ellaz",
  metaDescription:
    "Guidez un serpent néon au milieu de formes lumineuses et refermez une boucle autour d'elles pour les écraser. Votre queue, c'est votre vie.",

  lede: "Votre serpent brille, glisse dans toutes les directions et n'attaque jamais rien de front. Ramenez la tête jusqu'à toucher votre propre corps, et tout ce qui se trouve pris dans la boucle est écrasé. Tenez la phase, écrasez trois fois le gardien, et la partie est à vous.",

  body: [
    "Personne ne vise ici. On dessine un cercle avec soi-même, et ce qui est dedans au moment où il se ferme disparaît en laissant des gemmes.",

    "La queue, c'est la vie, et le chiffre affiché à l'écran n'est rien d'autre que votre longueur. Le serpent part avec 28 segments. Une forme qui atteint la tête en arrache 2, puis vous clignotez pendant 1,4 seconde sans que rien ne puisse vous toucher, juste le temps de filer. Sous 3 segments, la partie s'arrête. Les gemmes rendent de la longueur : chacune vaut un tiers de segment, et elle remplit au passage la barre qui amène la carte suivante. Au maximum, le serpent atteint 60 segments, et plus il est long, plus la boucle qu'il peut tracer est grande.",

    "Votre corps n'est pas un mur. Les formes le traversent librement, et c'est tout le truc : une foule qui poursuit votre tête pendant que vous tournez coupe au plus court et se retrouve dans le cercle que vous êtes en train de tracer. Là, on ferme.",

    "La taille compte. Une boucle n'écrase que si elle enferme au moins 4000 unités carrées, à peu près un cercle de rayon 36 : tourner serré sur place n'écrase donc rien, et les formes qui s'installent au milieu finissent par atteindre la tête. Voilà pourquoi la longueur est plus qu'une réserve de vie. Un serpent long peut se permettre une grande boucle, un serpent court a du mal à en fermer une, et chaque gemme rend un peu de cette portée. Chaque fermeture est un seul coup, porté à chaque forme à l'intérieur. Trois formes vous poursuivent, les mêmes que dans Survie Néon. Le coureur est une petite chauve-souris rapide. L'orbe est une gelée qui arrive quand le quart de la phase est passé. La brute est un crabe lent et coriace qui se montre un peu après la moitié, et une boucle ne lui suffit pas : il en faut deux.",

    "Une phase dure 2 minutes 30 en Calme, 3 minutes en Normal et 3 minutes 30 en Sauvage. Ensuite arrive le gardien, une chauve-souris géante qui fonce sur vous, et il faut trois boucles, un coup par boucle. À la troisième, c'est gagné. Les niveaux ne changent que la foule, jamais le serpent.",

    "C'est le deuxième jeu de la famille Serpent. La grille, cette fois, a disparu.",
  ],

  howToPlay: [
    { title: "Diriger", body: "Sur téléphone, posez le pouce n'importe où sur l'arène et faites glisser : un petit manche apparaît sous le doigt et le serpent suit. Sur ordinateur, les flèches ou WASD suffisent. Le serpent ne s'arrête jamais et tourne en courbes douces, pas à angle droit." },
    { title: "Fermer la boucle", body: "Ramenez la tête jusqu'à ce qu'elle touche votre corps. Chaque forme prise dans la boucle que vous venez de tracer est écrasée, à condition que la boucle soit large : tourner serré sur place ne compte pas." },
    { title: "Protéger la tête", body: "Seule la tête peut être blessée. Une forme qui l'atteint coûte 2 segments, puis le serpent clignote un instant pour vous laisser fuir." },
    { title: "Regrandir", body: "Les formes écrasées laissent des gemmes, et quelques autres traînent au sol, pour grandir avant votre première boucle. Passez dessus pour grandir et remplir la barre de niveau." },
    { title: "Choisir une carte", body: "Quand la barre est pleine, le jeu s'arrête et propose trois cartes. Appuyez sur l'une d'elles et la foule repart." },
  ],

  tips: [
    { title: "Entourez la foule, pas une forme", body: "Une boucle autour d'une seule chauve-souris, c'est un tour perdu. Laissez-en quelques-unes vous poursuivre, puis élargissez le virage pour qu'elles tombent dans le cercle, puisque chaque fermeture frappe tout ce qu'il y a dedans." },
    { title: "Le crabe demande un deuxième tour", body: "La brute survit au premier écrasement. Gardez-la dans la même courbe et refermez, plutôt que de partir chasser un autre groupe avec un crabe à moitié battu dans le dos." },
    { title: "Ne tournez jamais sur place", body: "Le virage le plus serré du serpent est trop petit pour écraser quoi que ce soit. Tournez là, et la foule s'installe dans le cercle, juste à côté de votre tête. Des boucles larges, et toujours en mouvement." },
    { title: "L'arme selon la blessure", body: "Si vous perdez surtout de la longueur par la tête, les Crocs transforment ces rencontres en morsures. Si beaucoup de formes vous traversent le corps, la Queue à piques est la meilleure première arme." },
  ],

  teaches: [
    { title: "Prévoir un trajet", body: "Une boucle est un chemin qu'on choisit avant de le parcourir. On apprend à regarder où la foule sera, pas où elle est." },
    { title: "Dedans et dehors", body: "Refermer une forme autour d'autres formes donne une première idée, très physique, de l'intérieur, de l'extérieur et de la surface." },
    { title: "Décider pendant la pause", body: "Les cartes arrêtent le jeu. On a le temps de réfléchir, et ce choix façonne toute la suite de la partie." },
  ],

  ages: [
    { title: "À partir de 5 ans", body: "Un jeune enfant peut diriger le serpent en Calme et apprendre à fermer une grande boucle, et rien ne le punit à part la fin de la partie." },
    { title: "De 8 à 12 ans", body: "Normal, où le crabe demande deux boucles et où le choix entre Crocs et Queue à piques commence à compter." },
    { title: "Adolescents et adultes", body: "Sauvage. La foule qui grossit vers la fin de la phase oblige à lire tout l'écran d'un coup." },
  ],

  accessibility:
    "Il faut diriger le serpent : faire glisser le doigt sur téléphone ou utiliser les touches sur ordinateur, pendant toute la phase, donc le jeu ne se termine pas avec de simples appuis, et nous préférons le dire ici. Il ne faut en revanche ni viser ni appuyer vite. Les cartes de niveau sont de grands boutons, aucune n'est jamais désactivée, et une partie qui finit finit simplement, avec la suivante à un seul appui.",

  together: [
    { title: "L'un dirige, l'autre annonce", body: "L'un tient le téléphone, l'autre surveille la foule et dit quand tourner. On échange après chaque partie." },
    { title: "Choisir la carte à deux", body: "Quand le jeu s'arrête, mettez-vous d'accord à voix haute avant que quelqu'un touche l'écran. Le débat Crocs contre Queue à piques fait la moitié du plaisir." },
    { title: "Le même niveau, chacun son tour", body: "Jouez à tour de rôle sur le même niveau et comparez le nombre de formes écrasées. Le record est gardé par niveau, donc Calme et Sauvage ne s'affrontent jamais." },
  ],

  faq: [
    { q: "Serpent survivant est-il gratuit ?", a: "Oui, et il n'y a rien à acheter ni aucun compte à créer." },
    { q: "Comment ferme-t-on une boucle ?", a: "Ramenez la tête jusqu'à toucher votre corps. La boucle doit enfermer au moins 4000 unités carrées, donc tourner serré sur place ne compte pas, et chaque fermeture frappe une fois chaque forme à l'intérieur." },
    { q: "Que se passe-t-il quand une forme me touche ?", a: "Si elle touche la tête, vous perdez 2 segments et clignotez 1,4 seconde pendant lesquelles rien ne vous blesse. Si elle touche le corps, rien ne se passe : les formes traversent le corps librement, et c'est ainsi qu'une foule se retrouve dans votre boucle." },
    { q: "Combien de temps dure une partie ?", a: "Une phase de 2 minutes 30 en Calme, 3 minutes en Normal ou 3 minutes 30 en Sauvage, puis le gardien. Écrasez-le trois fois et la partie est gagnée." },
    { q: "À quoi servent les cartes ?", a: "Il y en a six. Les Crocs mordent la forme qui touche votre tête au lieu de vous blesser, et chaque niveau mord une forme plus coriace ; la Queue à piques blesse ce qui touche votre corps. Ce sont les deux armes. L'Aimant attire les gemmes, Vif ajoute 10 % de vitesse et un virage plus serré par niveau, Repousse fait regrandir un segment tout seul toutes les 9 secondes, et l'Onde de choc projette et étourdit les formes juste à l'extérieur de la boucle." },
    { q: "Comment le score est-il compté ?", a: "En formes écrasées. Le record est gardé sur votre appareil, séparément pour chaque niveau, et toutes les 25 formes écrasées rapportent des pièces d'or." },
    { q: "Quel lien avec Serpent et Survie Néon ?", a: "C'est le deuxième jeu de la famille Serpent : le même serpent néon que dans le Serpent classique, face aux trois formes de Survie Néon." },
  ],

  keywords: ["jeu de serpent", "jeu de survie", "serpent gratuit", "jeu d'arcade dans le navigateur", "jeu de boucles"],
};
