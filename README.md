# Ellaz

**Free browser games for kids and grown-ups.** No ads, no account, no downloads,
and it works offline. One site that plays the same on a phone, a tablet and a PC.

### ▶ **[ellaz.fun](https://ellaz.fun/)**

This repository is the source of the games site, published under the MIT licence.
It is refreshed automatically from the private repository the site is built from,
so pull requests here are read but not merged directly - open an issue instead.

## What is in it

Classic puzzles and arcade games - 2048, sudoku, minesweeper, snake, chess,
backgammon, bubble shooter, word games - and a shelf of games made for young
children: memory, colouring, mazes, letters, counting. Every game has difficulty
levels or an endless ladder, keeps a personal best, and pays out coins and stars
into a room the player decorates.

The pages are written in English, Hebrew, Spanish, French and Swedish, and the
whole interface is right-to-left aware. `src/portal/catalog.ts` is the source of
truth for the list of games.

## Why it might interest you as code

- **No backend, by design.** Saves, coins, records and the room all live on the
  device. Optional cloud backup talks to Firestore over plain HTTP rather than
  pulling in the Firebase SDK for three REST calls.
- **Every game is a pure `logic.ts` plus a renderer.** The rules import no DOM and
  no Phaser, take an injectable random source, and are unit-tested on their own.
  Renderers are Preact DOM or a Phaser 4 scene.
- **Every game has a real web address in every language.** The site is a few
  hundred emitted documents rather than one, each carrying its content in the HTML,
  because crawlers and answer engines do not run JavaScript. `src/build/` emits them.
- **Policy lives in one file each.** Games report *what happened* - a reason, a
  score and a unit - and `src/sdk/{economy,score,session}.ts` alone decide what that
  is worth, how it ranks, and whether a saved position is still usable.
- **Numbers on the pages are reproducible.** Where a game page quotes a statistic,
  a script in `scripts/sim/` produces it, and a test refuses a statistic without one.

## Run it

```bash
npm install
npm run dev     # http://localhost:5180 (no service worker - use this for QA)
npm test        # logic, catalogue, content and build tests
npm run build   # type-check + production PWA build -> dist/
```

## Layout

```
src/
├─ sdk/      the contract every game implements, and the rewards / score / session policy
├─ shared/   neutral game helpers - rng, notes, the win moment
├─ ui/       tokens, RTL-aware components
├─ juice/    haptics, shake, confetti, tweens
├─ i18n/     strings, direction, locales
├─ portal/   the shell: home, game host, wallet, catalogue, the room
├─ build/    build-time only: the emitted pages
├─ content/  build-time only: the words on those pages
└─ games/<id>/   meta.ts · logic.ts (pure, tested) · a renderer
```

## Licence

MIT - see [LICENSE](LICENSE).
