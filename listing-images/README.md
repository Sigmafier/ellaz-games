# Listing images

Real gameplay screenshots that OTHER sites show beside an Ellaz entry - a curated
list, a directory, a portal. Not part of the site: nothing in `src/` loads them,
and they live outside `public/` so they reach neither `dist/` nor the standalone
itch bundles (which copy `public/` whole).

They reach the world through the public mirror (`scripts/public-mirror/build.sh`
lists this folder), so each one has a stable address:

    https://raw.githubusercontent.com/Sigmafier/ellaz-games/main/listing-images/<id>.png

**A published path is forever**: a list entry points at it, so never rename or
move one. Re-shoot by overwriting the file in place.

| file | game | shot |
|---|---|---|
| match3.png | Match Three | live ellaz.fun, 1280x800, opening board |
| echo.png | Follow Me | live ellaz.fun, 1280x800, a pad lit mid-sequence |
| nonogram.png | Picture Logic | live ellaz.fun, 1280x800, seven cells filled |
| wordguess.png | Word Guess | live ellaz.fun, 1280x800, two guesses scored |
| minesweeper.png | Minesweeper | live ellaz.fun, 1280x800, first reveal opened |
| blocks.png | Falling Blocks | live ellaz.fun, 1280x800, three pieces stacked |

Shot 2026-11-13 for opengaming/osgameclones, whose maintainer closed #5150 because
the share cards sent there were "too abstract and not representative of the games".
