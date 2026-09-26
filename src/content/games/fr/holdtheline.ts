import type { GameCopy } from "../../types";

/**
 * Tenir la ligne, en français, écrit pour son propre lecteur plutôt que traduit.
 *
 * Chaque chiffre vient de `src/games/holdtheline/` - la longueur d'une campagne,
 * les six sortes d'assaillants, les quatre rayons de la boutique, les points de
 * mur et de fort. Rien n'est inventé ici.
 *
 * Le français place une espace insécable avant `: ; ? !`, ce que les trois
 * autres langues ne font pas - voir `voice.ts` § `spacedPunctuation`.
 */
export const holdthelineFr: GameCopy = {
  name: "Tenir la ligne",
  metaTitle: "Tenir la ligne - jeu de siège gratuit | Ellaz",
  metaDescription:
    "Un siège sur une seule voie : votre fort à gauche, les vagues arrivent par la droite. Entre deux vagues, l'argent gagné achète armes, gardes et pièges.",

  lede: "Votre fort tient le bord gauche de l'écran et tout ce qui veut l'abattre traverse une longue voie pour y arriver. Vous visez, vous tirez, et chaque chute rapporte. Entre deux vagues, plus personne ne marche : c'est là que l'argent devient une meilleure arme, des gardes sur le toit, ou des pieux plantés dans la voie.",

  body: [
    "La voie fait toute la différence. Elle fait 900 unités. Un assaillant qui entre par la droite met du temps à la franchir, et ce temps est exactement ce que vous avez pour l'arrêter. Rien d'autre ne décide de la difficulté : ni la surface, ni le ciel, seulement la distance et la portée de ce que vous tenez.",

    "Six sortes traversent cette voie et chacune existe parce qu'une réponse existe. Le fantassin marche et frappe le mur. Le coureur est maigre et rapide, et il punit une recharge mal choisie. Le véhicule est lent, encaisse énormément et fait très mal en arrivant : c'est la raison d'être du lance-roquettes. Le tireur, lui, s'arrête net à 440 unités du mur et ne s'approche jamais - ni mine ni pieu ne le touchent, seule la portée compte, et c'est pourquoi le tireur d'élite se paie. L'unité volante ignore absolument toute défense au sol. Et à la vague 20, une masse arrive avec sa propre barre de vie.",

    "La boutique est une prévision, pas une liste de courses. Chaque contre-mesure apparaît sur l'étal une vague AVANT la menace qu'elle répond : le lance-roquettes à la sixième, le tireur d'élite à la neuvième, l'antiaérien à la douzième. Un joueur qui achète ce qui brille aujourd'hui se fait surprendre après-demain. C'est tout le jeu.",

    "Vingt vagues et la campagne est gagnée. Ensuite la voie continue d'envoyer du monde, de plus en plus vite, jusqu'à ce que le fort tombe - et là, il n'y a plus qu'un score. La partie gagnée dure une quinzaine de minutes, ce qui en fait de loin la plus longue du site : c'est un trajet de bus entier, pas une pause de trois minutes.",

    "Le mur encaisse avant le fort. Il part avec 260 points et le fort derrière lui en a 500. Réparer le mur reste au même prix toute la partie, volontairement : c'est le seul achat qu'un joueur en train de perdre doit toujours pouvoir refaire, et une réparation dont le prix grimpe transforme une mauvaise vague en partie perdue d'avance. Tout le reste augmente de 45 % par exemplaire, pour qu'on ne puisse pas thésauriser neuf vagues et acheter la boutique entière à la dixième.",

    "L'argent du siège n'a rien à voir avec vos pièces. Il naît dans la partie, se dépense dans la partie et disparaît avec elle. Aucun taux de change n'existe. Il n'en existera jamais.",
  ],

  howToPlay: [
    { title: "Viser et tirer", body: "Touchez l'endroit où vous voulez tirer - au doigt sur téléphone, à la souris sur ordinateur. Maintenir appuyé enchaîne les tirs, mais une simple tape suffit toujours : rien ici ne demande de garder le doigt posé." },
    { title: "Recharger", body: "Le chargeur se recharge tout seul une fois vide. La touche R lance une recharge avant, ce qui vaut mieux que de se retrouver à sec quand un coureur arrive." },
    { title: "Entre deux vagues", body: "Rien ne marche, rien ne presse. L'étal s'affiche par-dessus la voie et vous dépensez ce que vous voulez avant d'appuyer sur le bouton qui envoie la suite." },
    { title: "Réparer", body: "Le mur encaisse avant le fort. Le fort, lui, ne se répare pas : quand il tombe, la partie est finie." },
  ],

  tips: [
    { title: "Achetez la vague d'après", body: "Ce qui arrive à la vague sept se prépare à la six. Regardez l'étal : ce qui vient d'apparaître est presque toujours la réponse à ce qui n'est pas encore arrivé." },
    { title: "Un tireur ne vient jamais à vous", body: "Inutile de miner la voie pour lui. Il s'arrête loin et tire ; il faut aller le chercher avec de la portée, et votre fusilier n'en a pas assez." },
    { title: "Le ciel est un autre jeu", body: "Ni mur, ni mine, ni pieu, ni fusilier ne touchent ce qui vole. Sans antiaérien, la treizième vague passe simplement au-dessus de tout ce que vous avez payé." },
    { title: "Un mur réparé vaut un garde", body: "Un fort à moitié entamé finit la partie plus tôt qu'un chargeur un peu court. Réparez pendant que c'est encore une dépense et pas un sauvetage." },
  ],

  teaches: [
    { title: "Anticiper", body: "Dépenser pour un danger qu'on ne voit pas encore est une habitude qui ne vient pas toute seule, et ce jeu la demande à chaque vague." },
    { title: "Arbitrer", body: "Chaque pièce dépensée ici n'est pas dépensée là. Le jeu ne dit jamais quel achat était le bon : la vague suivante s'en charge." },
    { title: "Viser", body: "Choisir sa cible dans une foule, et savoir laquelle arrive en premier, est une compétence à part entière." },
  ],

  ages: [
    { title: "À partir de 8 ans", body: "Il faut viser, compter et prévoir en même temps. Un enfant plus jeune peut y jouer en mode Calme, mais la partie complète est longue." },
    { title: "Adolescents et adultes", body: "Le mode Sauvage envoie des vagues plus grosses, plus rapides et plus résistantes, et paie moins par corps." },
    { title: "Adultes seuls", body: "La prolongation au-delà de la vague 20 est la partie faite pour qui court après un chiffre plutôt qu'après une fin." },
  ],

  accessibility:
    "Tout se joue à la tape : rien ne demande de maintenir le doigt appuyé ni de faire un glissement. Le clavier fonctionne sur ordinateur, les cibles sont grandes, et aucune carte de la boutique n'est jamais désactivée - une carte trop chère répond quand même, par un petit mouvement, plutôt que de rester muette.",

  together: [
    { title: "Un vise, l'autre achète", body: "À deux sur un même écran : l'un tire pendant la vague, l'autre décide des dépenses entre deux. C'est deux métiers différents et la discussion est la moitié du plaisir." },
    { title: "Deviner la suite", body: "Avant d'appuyer sur le bouton, demandez ce qui va arriver. Se tromper ensemble vaut mieux que d'acheter au hasard." },
    { title: "Partagez les quatre rayons", body: "Deux rayons chacun - l'un prend les armes et les améliorations, l'autre les gardes et la voie - et on regarde quelle paire de décisions va le plus loin." },
  ],

  faq: [
    { q: "Combien de temps dure une partie ?", a: "Une campagne gagnée tourne autour d'un quart d'heure. C'est volontairement le jeu le plus long du site, et l'écran d'accueil le dit avant de commencer." },
    { q: "Que se passe-t-il après la vingtième vague ?", a: "La campagne est gagnée, et la voie continue quand même. Les vagues montent plus vite qu'avant, parce qu'à ce stade vous possédez toute la boutique, et il ne reste plus qu'un score à faire." },
    { q: "L'argent du jeu se transforme-t-il en pièces ?", a: "Non, jamais. C'est une monnaie interne à la partie ; elle ne touche pas votre porte-monnaie et aucun taux de change n'existe entre les deux." },
    { q: "Peut-on gagner sans rien acheter ?", a: "Non. Un joueur qui ne dépense rien tombe entre la cinquième et la neuvième vague selon la difficulté. La boutique n'est pas une décoration." },
    { q: "Faut-il être en mode paysage ?", a: "Le jeu est conçu pour un écran large et s'adapte à la forme de votre fenêtre, mais la voie garde toujours la même longueur - ce n'est jamais plus facile sur un grand écran." },
    { q: "La partie est-elle sauvegardée si je quitte ?", a: "Entre deux vagues, oui. Une partie est enregistrée sur l'écran de la boutique et jamais au milieu d'une vague : vous revenez donc juste avant d'envoyer la suivante, avec votre argent." },
  ],

  keywords: ["jeu de siège", "défense de base", "tower defense", "jeu de tir gratuit", "vagues d'ennemis"],
};
