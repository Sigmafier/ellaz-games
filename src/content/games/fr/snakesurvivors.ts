import type { GameCopy } from "../../types";

/**
 * Serpent survivant, en français, écrit pour son propre lecteur plutôt que traduit.
 *
 * Chaque chiffre vient de `src/games/snakesurvivors/` - la longueur de départ, la
 * plus courte et la plus longue, ce que coûte une morsure, le clignotement qui
 * suit, ce qui fait venir le gardien, les cartes et leurs plafonds. Rien n'est
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
    "Guidez un serpent néon et refermez une boucle pour écraser les formes. Votre queue est votre vie, et trois gardiens vous attendent, chacun plus coriace.",

  lede: "Votre serpent brille, glisse dans toutes les directions et n'attaque jamais rien de front. Ramenez la tête tout près de votre propre corps, la boucle se referme d'elle-même, et tout ce qui s'y trouve pris est écrasé. Grandissez, faites venir un gardien après l'autre - trois en tout, chacun plus coriace que le précédent - et gagnez quand le troisième tombe.",

  body: [
    "Personne ne vise ici. On dessine un cercle, et ce qui est dedans quand il se ferme disparaît en laissant des gemmes.",

    "La queue, c'est la vie, et le chiffre affiché à l'écran n'est rien d'autre que votre longueur. Le serpent part avec 28 segments. Une forme qui atteint la tête en arrache au moins 1, puis vous clignotez pendant 1,4 seconde sans que rien ne puisse vous toucher, le temps de filer. Sous 3 segments, la partie s'arrête. Les gemmes rendent de la longueur et remplissent la barre qui amène la carte suivante : une bleue vaut un tiers de segment, une rouge deux tiers et une jaune un segment entier. Au maximum, le serpent atteint 60 segments, et plus il est long, plus la boucle qu'il peut tracer est grande.",

    "Votre corps n'est pas un mur. Les formes le traversent librement, et c'est tout le truc : une foule qui poursuit votre tête pendant que vous tournez coupe au plus court et se retrouve dans le cercle que vous êtes en train de tracer. Là, on ferme, sans toucher sa queue au millimètre : dès que la tête passe à 42 unités du corps, la boucle se referme, et un trait pointillé montre où.",

    "La taille compte. Une boucle n'écrase que si elle enferme au moins 4000 unités carrées, à peu près un cercle de rayon 36 : tourner serré sur place n'écrase rien. Voilà pourquoi la longueur est plus qu'une réserve de vie : un long serpent trace une grande boucle, un court en a peine à en fermer une, et chaque gemme rend un peu de cette portée. Chaque fermeture est un seul coup, porté à chaque forme à l'intérieur.",

    "Trois formes vous poursuivent, les mêmes que dans Survie Néon : le coureur, une petite chauve-souris rapide ; l'orbe, une gelée qui arrive après un moment ; la brute, un crabe lent et coriace qui a besoin de deux boucles, pas une. Il n'y a pas d'horloge. La partie compte trois étapes, chacune refermée par un gardien plus coriace : le premier à 50 segments ou 10 formes, le deuxième à 240 au total, le troisième à 760. Chacun est une chauve-souris géante qui s'arrête et brille avant de foncer : écartez-vous, refermez des boucles jusqu'à ce qu'il tombe. Battez les trois et la partie est à vous. Les niveaux changent la foule : le rythme des formes, leur vitesse, combien tiennent à l'écran.",

    "C'est le deuxième jeu de la famille Serpent. La grille, cette fois, a disparu.",
  ],

  howToPlay: [
    { title: "Diriger", body: "Sur téléphone, posez le pouce n'importe où sur l'arène et faites glisser : un petit manche apparaît sous le doigt et le serpent suit. Sur ordinateur, les flèches ou WASD suffisent. Le serpent ne s'arrête jamais et tourne en courbes douces, pas à angle droit." },
    { title: "Fermer la boucle", body: "Ramenez la tête tout près de votre corps et la boucle se referme d'elle-même ; un trait pointillé montre où. Chaque forme prise dans la boucle que vous venez de tracer est écrasée, à condition que la boucle soit large : tourner serré sur place ne compte pas." },
    { title: "Protéger la tête", body: "Seule la tête peut être blessée. Une forme qui l'atteint coûte 1 segment, puis le serpent clignote un instant pour vous laisser fuir." },
    { title: "Regrandir", body: "Les formes écrasées laissent des gemmes, et quelques autres traînent au sol, pour grandir avant votre première boucle. Passez dessus pour grandir et remplir la barre de niveau." },
    { title: "Choisir une carte", body: "Quand la barre est pleine, le jeu s'arrête et propose trois cartes. Une carte que vous avez déjà montre son niveau suivant. Appuyez sur l'une d'elles et la foule repart." },
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
    { title: "Adolescents et adultes", body: "Sauvage. La foule qui grossit pendant que vous grandissez vers le gardien oblige à lire tout l'écran d'un coup." },
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
    { q: "Comment ferme-t-on une boucle ?", a: "Ramenez la tête à 42 unités de votre corps et la boucle se referme d'elle-même. Elle doit enfermer au moins 4000 unités carrées, donc tourner serré sur place ne compte pas, et chaque fermeture frappe une fois chaque forme à l'intérieur." },
    { q: "Que se passe-t-il quand une forme me touche ?", a: "Si elle touche la tête, vous perdez au moins 1 segment et clignotez 1,4 seconde sans blessure. Si elle touche le corps, rien ne se passe : les formes traversent le corps librement, et c'est ainsi qu'une foule se retrouve dans votre boucle." },
    { q: "Combien de temps dure une partie ?", a: "Trois étapes : le premier gardien à 50 segments ou 10 formes, le deuxième à 240 au total et le troisième à 760 en Normal, chacun plus coriace. Battez les trois et vous gagnez." },
    { q: "À quoi servent les cartes ?", a: "Seize, dont sept rares. Trois sont des armes : les Crocs mordent la forme qui touche votre tête, la Queue à piques blesse ce qui touche votre corps, et le Crachat tire sur la forme la plus proche toutes les 2 secondes, mais jamais sur le gardien. L'Aimant attire les gemmes, Vif ajoute 10 % de vitesse par niveau, Repousse fait regrandir un segment toutes les 9 secondes, l'Onde de choc repousse les formes juste à l'extérieur de la boucle, le Lasso referme la boucle de plus loin, et le Bouclier encaisse un coup gratuitement puis se recharge." },
    { q: "Comment le score est-il compté ?", a: "En formes écrasées. Le record est gardé sur votre appareil, séparément pour chaque niveau, et toutes les 100 formes écrasées rapportent des pièces d'or." },
    { q: "Quel lien avec Serpent et Survie Néon ?", a: "C'est le deuxième jeu de la famille Serpent : le même serpent néon que dans le Serpent classique, face aux trois formes de Survie Néon." },
  ],

  keywords: ["jeu de serpent", "jeu de survie", "serpent gratuit", "jeu d'arcade dans le navigateur", "jeu de boucles"],
};
