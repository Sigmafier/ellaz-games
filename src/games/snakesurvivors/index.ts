import { createElement } from "react";
import { reactGame } from "../reactHost";
import { meta } from "./meta";
import { SnakeSurvivorsGame } from "./SnakeSurvivorsGame";

// A React game that HOSTS a Phaser canvas, like Neon Survival, so it wears the
// arcade chrome. Phaser stays lazy: the game imports it inside an effect.
export default reactGame(meta, (ctx) => createElement(SnakeSurvivorsGame, { ctx }));
