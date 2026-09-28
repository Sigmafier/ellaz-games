import { createElement } from "react";
import { reactGame } from "../reactHost";
import { meta } from "./meta";
import { SnakeArenaGame } from "./SnakeArenaGame";

// A React game that HOSTS a Phaser canvas, like the classic, so it wears the
// same chrome. Phaser stays lazy: the game imports it inside an effect.
export default reactGame(meta, (ctx) => createElement(SnakeArenaGame, { ctx }));
