import type { ToyboxEntry } from "../toybox";

/**
 * Toybox Brawl, the one Toybox game with a page here so far.
 *
 * EVERY CLAIM BELOW WAS READ OFF THE GAME'S OWN FILES on 2026-09-26, not
 * remembered, and the file is named beside each so the next edit can re-read
 * it rather than re-derive it:
 *
 *   worlds, levels, the bosses     studio/games/fight/data/campaign/brawl.json,
 *                                  data/modes/toybox-boss.json (teddy-king),
 *                                  data/modes/shelf-boss.json
 *   the hero is the robot          data/modes/stage.json, `control: "player"`
 *   mana pool 3, spells cost 1     data/match/versus.json `mana`, and the
 *                                  robot's moves file (`spell`, `bolt`: cost 1)
 *   the shop's four items          brawl.json `shop` + toybox/campaign/shop.ts
 *   a defeat costs the coins,      toybox/campaign/flow.ts ("Retry, lose the
 *   never the gear or a level      run's coins") and campaign/gear.ts ("Keep
 *                                  the gear")
 *   gear slots and rarities        brawl.json `gear`
 *   the keys                       toybox/cells/shared/input.ts - and
 *                                  `toybox.test.ts` holds every `codes` entry
 *                                  here to that file, so a rebound key reds
 *   the touch buttons              toybox/cells/shared/touch-fight.ts and
 *                                  controls.ts (the default is "stick-s")
 *   saved on the device            toybox/campaign/save.ts (localStorage)
 *
 * TEEN AND UP, and the page says so rather than leaving it to be guessed from
 * a site whose other games are mostly for children. Nothing here may call it a
 * children's game.
 *
 * K IS NOT NAMED, deliberately. input.ts binds it to BOTH the swing and the
 * bolt today, so a sentence telling a player what K does would be right about
 * one of them. The page names only keys that do one thing.
 */
export const toyboxBrawl: ToyboxEntry = {
  id: "brawl",
  slug: "toybox-brawl",
  locale: "en",
  name: "Toybox Brawl",
  dir: "fight",
  campaign: "brawl",
  copy: {
    metaTitle: "Toybox Brawl - a free side-scrolling brawler (beta)",
    metaDescription:
      "Walk right, clear each wave of toys, beat the Teddy King. A free browser brawler with spells, a shop and loot. No download, no account.",
    h1: "Toybox Brawl",
    lede:
      "Toybox Brawl is a free side-scrolling brawler that plays in the browser. You are a small red robot fighting your way through a toy box, one wave at a time, with a punch, a blast of magic and whatever the last fight dropped on the floor.",
    facts: ["Free", "Beta", "Teens and up", "No account", "No download", "Keyboard or touch"],
    artAlt: "The hero of Toybox Brawl, a red toy robot, throwing a punch",
    playLabel: "Play Toybox Brawl",
    playNote: "Opens the game in the Toybox. It starts at the first level of World 1.",
    body: [
      "The idea is old and simple. Walk to the right and the screen follows you. Every so often the foes come in from both sides, and the way on stays shut until the last of them is down. Then it opens, and you walk again.",
      "What the Brawl adds is a run you care about. The coins you pick up buy things between levels, the gear you find makes you stronger, and losing a fight costs you something real.",
    ],
    sections: [
      {
        title: "How a run goes",
        body: [
          "World 1 is the Toybox itself: three levels and then a boss, the Teddy King. The first level throws slimes and bats at you and ends with a big teddy, the second adds ninjas, and the third brings a wizard. Each level is a few waves, and a wave is over when everything in it has been knocked out.",
          "A second world, the Shelf, follows it with two more levels and a boss of its own. It is newer than the first and less tested, which is part of why the whole game still carries a beta label.",
          "Knocking foes out also fills a bar of experience. Each time it fills you level up, which adds health and damage and heals you a little on the spot.",
        ],
      },
      {
        title: "Spells and mana",
        body: [
          "Next to the punch you have two spells, and both spend mana. The blast is a burst of magic around you that reaches the foe behind you as well as the one in front. The bolt flies straight ahead and hits whatever it meets first.",
          "Your mana pool holds three points to begin with, it is full at the start of every level, and each spell costs one point. Mana comes back on its own, one point at a time, so the spells are something to save for a crowd rather than something to press on every foe.",
        ],
      },
      {
        title: "Coins, the shop and what you lose",
        body: [
          "Beaten foes drop coins, and walking over them picks them up. Between levels the shop sells four things: a heart for more maximum health, focus for a bigger mana pool, power for harder hits, and a level up. Each one costs a little more than the last time you bought it.",
          "Losing a level costs you the coins you are carrying, all of them, and nothing else. The retry is free, every level you have already cleared stays cleared, and what you have bought and found stays yours. So the question before each shop visit is a real one: spend now, or carry the coins into a fight you might lose.",
        ],
      },
      {
        title: "Gear on the floor",
        body: [
          "Foes sometimes drop gear, and you pick it up by walking over it. There are three slots. A weapon adds damage, armor adds health and a ring adds mana, and each comes in four rarities: common, rare, epic and legendary. Anything can drop from anything, so a slime can leave a ring.",
        ],
      },
    ],
    keyboardTitle: "Controls on a keyboard",
    keyboard: [
      {
        keys: "Arrow keys, or W A S D",
        does: "walk. Left and right move along the floor, up and down move toward the back of the room and the front.",
        codes: ["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown", "KeyW", "KeyA", "KeyS", "KeyD"],
      },
      { keys: "Space, or J", does: "punch.", codes: ["Space", "KeyJ"] },
      { keys: "F, or L", does: "cast the blast.", codes: ["KeyF", "KeyL"] },
      { keys: "G", does: "throw the bolt.", codes: ["KeyG"] },
    ],
    touch: {
      title: "Controls on a phone or tablet",
      body: [
        "On a touch screen a small stick and a HIT button sit in a band at the bottom of the screen. The stick walks, HIT punches, and two smaller buttons stacked above HIT cast the blast and throw the bolt. A touch anywhere else on the screen does nothing, so a thumb that meant to walk never throws a punch by accident.",
        "A Controls button on the game screen switches between a few other touch layouts, including one where you drag anywhere to walk and tap to punch. Whichever you pick is remembered on that device.",
      ],
    },
    admissionTitle: "What is not finished",
    admission:
      "This is a beta, and the label means it. The touch layouts are still being tried out and will be cut down to one, the second world is new, and the numbers in the shop may change as the game is played more. Your progress is saved in the browser on the device you play on, so it does not follow you to another phone or computer, and clearing that browser's site data erases it.",
    faq: [
      {
        q: "Is Toybox Brawl free?",
        a: "Yes. There is nothing to buy with real money, no account to make and nothing to install. The coins in the game are earned by playing and only spent in its own shop.",
      },
      {
        q: "Does Toybox Brawl work on a phone?",
        a: "Yes. It runs in the phone's browser and draws its own touch controls, a stick and a set of buttons at the bottom of the screen. It plays on a computer with the keyboard too.",
      },
      {
        q: "Does it save my progress?",
        a: "Yes, on the device you play on. Cleared levels, coins, what you bought in the shop and your gear are kept in that browser, and a defeat only ever costs the coins you were carrying.",
      },
      {
        q: "Who is it for?",
        a: "Teens and adults. The toys are cartoon toys, but it is a fighting game about timing and crowds, made for older players than most of this site.",
      },
    ],
    shelfLabel: "The other games in the Toybox",
  },
};
