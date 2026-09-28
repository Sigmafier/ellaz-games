import { createElement } from "react";
import { reactGame } from "../reactHost";
import { meta } from "./meta";
import { PuzzleSnakeGame } from "./PuzzleSnakeGame";

export default reactGame(meta, (ctx) => createElement(PuzzleSnakeGame, { ctx }));
